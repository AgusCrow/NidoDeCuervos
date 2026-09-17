import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Player, CharacterClass, UserRole } from '../../entities/player.entity';
import { Item, ItemSlot, ItemRarity } from '../../entities/item.entity';
import { InventoryItem } from '../../entities/inventory.entity';
import { BalanceService } from '../balance/balance.service';
import { CharacterCreateDto, LoginDto } from './dto/character-create.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    private readonly balanceService: BalanceService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  public async registerCharacter(dto: CharacterCreateDto) {
    // 1. Validar unicidad de username
    const existingUser = await this.playerRepo.findOne({ where: { username: dto.username.toLowerCase() } });
    if (existingUser) {
      throw new ConflictException('El nombre de aventurero/usuario ya está en uso en los anales del gremio.');
    }

    // 2. Validar Point-Buy de Atributos contra classes_balance.json
    const classesConfig = this.balanceService.getSection('classes');
    const pointBuy = classesConfig?.point_buy || {
      total_starting_points: 20,
      attribute_min: 8,
      attribute_max: 18,
    };

    const stats = [dto.statStr, dto.statDex, dto.statInt, dto.statCon];
    for (const st of stats) {
      if (st < pointBuy.attribute_min || st > pointBuy.attribute_max) {
        throw new BadRequestException(`Los atributos deben encontrarse entre ${pointBuy.attribute_min} y ${pointBuy.attribute_max}.`);
      }
    }

    // Costo por encima del mínimo base (8)
    const spentPoints = stats.reduce((acc, curr) => acc + (curr - pointBuy.attribute_min), 0);
    if (spentPoints > pointBuy.total_starting_points) {
      throw new BadRequestException(`Has distribuido ${spentPoints} puntos de atributo. El límite máximo de creación es de ${pointBuy.total_starting_points} puntos.`);
    }

    // 3. Generar credenciales seguras
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const playerId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nfcUid = dto.nfcUid || `NFC_VIRTUAL_${Date.now()}`;
    const privateToken = `tok_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

    // 4. Iniciar transacción: Crear jugador + paquete de bienvenida
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newPlayer = queryRunner.manager.create(Player, {
        id: playerId,
        nfc_uid: nfcUid,
        name: dto.name,
        username: dto.username.toLowerCase(),
        password_hash: passwordHash,
        secret_class: dto.secretClass,
        role: UserRole.PLAYER,
        stat_str: dto.statStr,
        stat_dex: dto.statDex,
        stat_int: dto.statInt,
        stat_con: dto.statCon,
        avatar_url: dto.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + dto.username,
        xp: '0',
        gold: '50', // 50 monedas iniciales
        level: 1,
        private_token: privateToken,
        streak_days: 0,
        pvp_wins: 0,
        pvp_losses: 0,
        equipped_title: 'Novicio Sediento',
        gens_rank: 'Recluta',
        gens_contribution_points: '0',
      });
      await queryRunner.manager.save(Player, newPlayer);

      // Entregar Arma inicial de clase
      const startingWeaponId = `itm_start_${playerId}`;
      const weaponNames: Record<CharacterClass, string> = {
        [CharacterClass.WARRIOR]: 'Espada Corta Desgastada',
        [CharacterClass.MAGE]: 'Vara de Aprendiz Arcano',
        [CharacterClass.ROGUE]: 'Dagas Gemelas de Salteador',
        [CharacterClass.BARD]: 'Laúd de Madera de Pino',
      };

      const startingWeapon = queryRunner.manager.create(Item, {
        id: startingWeaponId,
        name: weaponNames[dto.secretClass] || 'Arma de Principiante',
        description: 'Entregada al jurar fidelidad en el salón comunal de la taberna.',
        slot: ItemSlot.WEAPON,
        rarity: ItemRarity.COMMON,
        attack_bonus: 5,
        defense_bonus: 0,
        gold_value: '15',
        icon: '🗡️',
        is_template: false,
        owner_id: playerId,
        refinement_level: 0,
        item_type: 'STARTING_GEAR',
      });
      await queryRunner.manager.save(Item, startingWeapon);

      // Equipar automáticamente
      const startingInv = queryRunner.manager.create(InventoryItem, {
        id: `inv_start_${playerId}`,
        player_id: playerId,
        item_id: startingWeaponId,
        is_equipped: true,
        slot_equipped: ItemSlot.WEAPON,
      });
      await queryRunner.manager.save(InventoryItem, startingInv);

      await queryRunner.commitTransaction();

      const token = this.jwtService.sign({
        sub: playerId,
        username: newPlayer.username,
        role: newPlayer.role,
      });

      return {
        message: '¡Bienvenido al Gremio de la Taberna! Tu personaje ha sido inscrito en los pergaminos sagrados.',
        player: {
          id: newPlayer.id,
          name: newPlayer.name,
          username: newPlayer.username,
          secretClass: newPlayer.secret_class,
          role: newPlayer.role,
          level: newPlayer.level,
          gold: newPlayer.gold,
          stats: {
            str: newPlayer.stat_str,
            dex: newPlayer.stat_dex,
            int: newPlayer.stat_int,
            con: newPlayer.stat_con,
          },
        },
        accessToken: token,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  public async login(dto: LoginDto) {
    let player: Player | null = null;

    if (dto.nfcUid) {
      player = await this.playerRepo.findOne({ where: { nfc_uid: dto.nfcUid } });
      if (!player) {
        throw new UnauthorizedException('Llavero o tarjeta NFC no asociada a ningún aventurero.');
      }
    } else if (dto.username && dto.password) {
      player = await this.playerRepo.findOne({ where: { username: dto.username.toLowerCase() } });
      if (!player) {
        throw new UnauthorizedException('Credenciales inválidas.');
      }
      const match = await bcrypt.compare(dto.password, player.password_hash);
      if (!match) {
        throw new UnauthorizedException('Credenciales inválidas.');
      }
    } else {
      throw new BadRequestException('Debes proporcionar credenciales de usuario o lectura NFC.');
    }

    const token = this.jwtService.sign({
      sub: player.id,
      username: player.username,
      role: player.role,
    });

    return {
      message: 'Ingreso exitoso al salón de la taberna.',
      accessToken: token,
      player: {
        id: player.id,
        name: player.name,
        username: player.username,
        role: player.role,
        secretClass: player.secret_class,
        level: player.level,
        gold: player.gold,
        xp: player.xp,
        avatarUrl: player.avatar_url,
      },
    };
  }
}
