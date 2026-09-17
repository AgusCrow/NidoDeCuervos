import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Player } from '../../entities/player.entity';
import { Item, ItemRarity, ItemSlot } from '../../entities/item.entity';
import { InventoryItem } from '../../entities/inventory.entity';
import { TransmuteLog } from '../../entities/transmute-log.entity';
import { BalanceService } from '../balance/balance.service';

@Injectable()
export class TransmuteService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(InventoryItem)
    private readonly invRepo: Repository<InventoryItem>,
    @InjectRepository(TransmuteLog)
    private readonly logRepo: Repository<TransmuteLog>,
    private readonly balanceService: BalanceService,
    private readonly dataSource: DataSource,
  ) {}

  public async transmuteItems(playerId: string, itemIds: string[]): Promise<{
    success: boolean;
    resultItem: Item;
    wasCriticalDoubleJump: boolean;
    wasFailRetention: boolean;
    sourceRarity: ItemRarity;
    targetRarity: ItemRarity;
    goldSpent: number;
    message: string;
  }> {
    const config = this.balanceService.getSection('transmute');
    const requiredCount = config.required_items_count || 9;
    const critChance = config.double_jump_critical_chance_pct || 10.0;
    const hierarchy: ItemRarity[] = config.rarity_hierarchy;

    // 1. Validar conteo de ítems
    if (!itemIds || itemIds.length !== requiredCount) {
      throw new BadRequestException(`La transmutación requiere exactamente ${requiredCount} ítems. Recibidos: ${itemIds?.length || 0}`);
    }

    // 2. Verificar que los ítems no sean duplicados
    const uniqueIds = new Set(itemIds);
    if (uniqueIds.size !== requiredCount) {
      throw new BadRequestException('No puedes enviar identificadores de ítems duplicados.');
    }

    // 3. Buscar ítems en inventario del jugador
    const invItems = await this.invRepo.find({
      where: {
        player_id: playerId,
        id: In(itemIds),
        is_equipped: false,
      },
      relations: ['item'],
    });

    if (invItems.length !== requiredCount) {
      throw new BadRequestException('Uno o más ítems no están en tu inventario o están equipados actualmente.');
    }

    // 4. Validar que todos los ítems tengan la misma rareza
    const baseRarity = invItems[0].item.rarity;
    const sameRarity = invItems.every(inv => inv.item.rarity === baseRarity);
    if (!sameRarity) {
      throw new BadRequestException(`Todos los ${requiredCount} ítems deben ser de la misma categoría de rareza. Detectadas discrepancias.`);
    }

    // 5. Verificar si ya alcanzó la rareza máxima
    const currentIndex = hierarchy.indexOf(baseRarity);
    if (currentIndex === -1 || currentIndex >= hierarchy.length - 1) {
      throw new BadRequestException(`Los ítems de rareza ${baseRarity} están en la cúspide alquímica y no pueden transmutarse.`);
    }

    // 6. Verificar y deducir oro
    const goldCost = config.gold_cost_per_transmute?.[baseRarity] || 100;
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) {
      throw new NotFoundException('Jugador no encontrado.');
    }

    const currentGold = BigInt(player.gold);
    if (currentGold < BigInt(goldCost)) {
      throw new BadRequestException(`Oro insuficiente para la transmutación. Requiere: ${goldCost}, dispones de: ${player.gold}`);
    }

    // 7. Determinar tipo de slot resultante (coherencia de ranura)
    const inputSlots = invItems.map(inv => inv.item.slot);
    const allSameSlot = inputSlots.every(s => s === inputSlots[0]);
    const chosenSlot: ItemSlot = allSameSlot 
      ? inputSlots[0] 
      : inputSlots[Math.floor(Math.random() * inputSlots.length)];

    // 8. Determinar resultado probabilístico (ascenso regular, salto crítico o retención de fallo)
    const tierProbs = config.tier_probabilities?.[baseRarity] || { 
      success_rate: 0.85, 
      double_jump_rate: 0.15, 
      fail_retention_rate: 0.0 
    };
    const roll = Math.random();
    let isCrit = false;
    let isFailRetain = false;
    let targetRarity = baseRarity;

    if (roll < (tierProbs.fail_retention_rate || 0)) {
      // Fallo en altas rarezas: conserva misma rareza (pierde 8 objetos)
      isFailRetain = true;
      targetRarity = baseRarity;
    } else if (roll < (tierProbs.fail_retention_rate || 0) + (tierProbs.double_jump_rate || 0) && (currentIndex + 2 < hierarchy.length)) {
      // Salto doble crítico (+2 categorías)
      isCrit = true;
      targetRarity = hierarchy[currentIndex + 2];
    } else {
      // Ascenso estándar (+1 categoría)
      targetRarity = hierarchy[Math.min(currentIndex + 1, hierarchy.length - 1)];
    }

    // 9. Transacción atómica en Base de Datos
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Deducir oro del jugador
      const newGold = currentGold - BigInt(goldCost);
      await queryRunner.manager.update(Player, { id: playerId }, { gold: newGold.toString() });

      // Eliminar los 9 ítems de insumo del inventario
      await queryRunner.manager.delete(InventoryItem, { id: In(itemIds) });

      // Generar nuevo ítem procedural transmutado
      const itemsConfig = this.balanceService.getSection('items');
      const tierConfig = itemsConfig?.rarity_tiers?.[targetRarity] || {
        attack_range: [20, 40],
        defense_range: [15, 30],
        gold_multiplier: 5.0,
      };

      const baseAtk = Math.floor(Math.random() * (tierConfig.attack_range[1] - tierConfig.attack_range[0] + 1)) + tierConfig.attack_range[0];
      const baseDef = Math.floor(Math.random() * (tierConfig.defense_range[1] - tierConfig.defense_range[0] + 1)) + tierConfig.defense_range[0];
      const goldVal = Math.round(50 * (tierConfig.gold_multiplier || 1));

      const prefix = isCrit ? '⚡ Salto Astral:' : (isFailRetain ? '⚠️ Ceniza Alquímica:' : '✨ Transmutación:');
      const newItemId = `itm_transmute_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newItem = queryRunner.manager.create(Item, {
        id: newItemId,
        name: `${prefix} ${chosenSlot === ItemSlot.WEAPON ? 'Hoja' : chosenSlot === ItemSlot.ARMOR ? 'Coraza' : 'Reliquia'} de ${targetRarity}`,
        description: isFailRetain
          ? `Resultado inestable de 9 ítems ${baseRarity}. La alquimia falló y solo se preservó 1 ítem del mismo rango.`
          : `Forjado mediante la sagrada transmutación de 9 ítems ${baseRarity}.${isCrit ? ' ¡Bendición de doble salto crítico!' : ''}`,
        slot: chosenSlot,
        rarity: targetRarity,
        attack_bonus: chosenSlot === ItemSlot.WEAPON ? baseAtk : Math.floor(baseAtk / 3),
        defense_bonus: chosenSlot === ItemSlot.ARMOR ? baseDef : Math.floor(baseDef / 3),
        gold_value: goldVal.toString(),
        special_effect: isCrit ? 'SOBRECARGA_ALQUIMICA_DIVINA' : (isFailRetain ? 'INESTABILIDAD' : 'FLUJO_TRANSMUTADO'),
        icon: chosenSlot === ItemSlot.WEAPON ? '⚔️' : chosenSlot === ItemSlot.ARMOR ? '🛡️' : '💍',
        is_template: false,
        owner_id: playerId,
        refinement_level: 0,
        item_type: 'TRANSMUTED',
      });
      await queryRunner.manager.save(Item, newItem);

      // Agregar al inventario
      const newInvItem = queryRunner.manager.create(InventoryItem, {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        player_id: playerId,
        item_id: newItemId,
        is_equipped: false,
      });
      await queryRunner.manager.save(InventoryItem, newInvItem);

      // Registrar auditoría de transmutación
      const log = queryRunner.manager.create(TransmuteLog, {
        id: `tlog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        player_id: playerId,
        source_rarity: baseRarity,
        source_item_ids: itemIds,
        result_item_id: newItemId,
        result_rarity: targetRarity,
        was_critical_double_jump: isCrit,
        gold_spent: goldCost.toString(),
      });
      await queryRunner.manager.save(TransmuteLog, log);

      await queryRunner.commitTransaction();

      return {
        success: true,
        resultItem: newItem,
        wasCriticalDoubleJump: isCrit,
        wasFailRetention: isFailRetain,
        sourceRarity: baseRarity,
        targetRarity: targetRarity,
        goldSpent: goldCost,
        message: isCrit
          ? `¡SALTO CRÍTICO DIVINO! Los 9 ítems ${baseRarity} se fusionaron milagrosamente avanzando 2 categorías hasta ${targetRarity}.`
          : (isFailRetain
            ? `⚠️ La alquimia se desestabilizó: perdiste 8 ítems y conservaste únicamente 1 ítem de la misma categoría (${targetRarity}).`
            : `Transmutación exitosa: Se forjó 1 ítem de categoría ${targetRarity} a partir de 9 ítems ${baseRarity}.`),
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
