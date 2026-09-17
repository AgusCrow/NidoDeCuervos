import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerTalent } from '../../entities/talent.entity';
import { Player } from '../../entities/player.entity';

export interface TalentNodeDef {
  id: string;
  name: string;
  description: string;
  branch: 'OFFENSE' | 'DEFENSE' | 'UTILITY';
  tier: number;
  maxPoints: number;
  icon: string;
}

@Injectable()
export class TalentsService {
  constructor(
    @InjectRepository(PlayerTalent)
    private talentRepo: Repository<PlayerTalent>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
  ) {}

  private getTalentsCatalog(): TalentNodeDef[] {
    return [
      // Branch: OFFENSE
      { id: 'off_t1_fuerza', name: 'Fuerza de Coloso', description: '+8% de Daño físico y crítico', branch: 'OFFENSE', tier: 1, maxPoints: 3, icon: '⚔️' },
      { id: 'off_t2_sobrecarga', name: 'Sobrecarga Rúnica', description: '+12% daño en tiradas D20 superiores a 12', branch: 'OFFENSE', tier: 2, maxPoints: 3, icon: '⚡' },
      { id: 'off_t3_demoledor', name: 'Golpe Cataclísmico', description: 'Los impactos críticos ejecutan a enemigos a <15% HP', branch: 'OFFENSE', tier: 3, maxPoints: 1, icon: '💥' },

      // Branch: DEFENSE
      { id: 'def_t1_coraza', name: 'Coraza Pétrea', description: '+10% de Armadura y mitigación plana', branch: 'DEFENSE', tier: 1, maxPoints: 3, icon: '🛡️' },
      { id: 'def_t2_evasion', name: 'Paso Espectral', description: '20% probabilidad de evadir contragolpes de Colosos', branch: 'DEFENSE', tier: 2, maxPoints: 3, icon: '💨' },
      { id: 'def_t3_inmortal', name: 'Espíritu Inquebrantable', description: 'Al recibir daño letal, sobrevive con 1 HP durante 3s (1 vez por duelo)', branch: 'DEFENSE', tier: 3, maxPoints: 1, icon: '✨' },

      // Branch: UTILITY
      { id: 'utl_t1_avaro', name: 'Ojo del Saqueador', description: '+15% de Oro obtenido en la Senda y Asedios', branch: 'UTILITY', tier: 1, maxPoints: 3, icon: '💰' },
      { id: 'utl_t2_sabiduria', name: 'Sabiduría Ancestral', description: '+20% de Experiencia en todas las actividades', branch: 'UTILITY', tier: 2, maxPoints: 3, icon: '📜' },
      { id: 'utl_t3_forja', name: 'Bendición de la Forja', description: '+5% probabilidad adicional de éxito en el Yunque', branch: 'UTILITY', tier: 3, maxPoints: 1, icon: '🔨' },
    ];
  }

  async getPlayerTalents(playerId: string): Promise<any> {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Aventurero no encontrado');

    const totalPointsEarned = Math.max(0, player.level - 4); // 1 punto a partir de nivel 5
    const unlockedTalents = await this.talentRepo.find({ where: { player_id: playerId } });
    const spentPoints = unlockedTalents.reduce((acc, t) => acc + (t.points || 1), 0);
    const availablePoints = Math.max(0, totalPointsEarned - spentPoints);

    const catalog = this.getTalentsCatalog().map(node => {
      const active = unlockedTalents.find(t => t.node_id === node.id);
      return {
        ...node,
        currentPoints: active ? active.points : 0,
        isUnlocked: !!active,
      };
    });

    return {
      playerId,
      playerName: player.name,
      level: player.level,
      totalPointsEarned,
      spentPoints,
      availablePoints,
      nodes: catalog,
    };
  }

  async allocateTalent(playerId: string, nodeId: string): Promise<any> {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Aventurero no encontrado');

    const catalog = this.getTalentsCatalog();
    const targetNode = catalog.find(n => n.id === nodeId);
    if (!targetNode) throw new BadRequestException('Nodo de talento desconocido');

    const totalPointsEarned = Math.max(0, player.level - 4);
    const currentTalents = await this.talentRepo.find({ where: { player_id: playerId } });
    const spentPoints = currentTalents.reduce((acc, t) => acc + (t.points || 1), 0);

    if (spentPoints >= totalPointsEarned) {
      throw new BadRequestException('No dispones de puntos de talento disponibles. Sube de nivel para ganar más puntos.');
    }

    let existing = currentTalents.find(t => t.node_id === nodeId);
    if (existing) {
      if (existing.points >= targetNode.maxPoints) {
        throw new BadRequestException(`El nodo ${targetNode.name} ya alcanzó su rango máximo (${targetNode.maxPoints}).`);
      }
      existing.points += 1;
      await this.talentRepo.save(existing);
    } else {
      existing = this.talentRepo.create({
        id: `tal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        player_id: playerId,
        node_id: nodeId,
        tier: targetNode.tier,
        points: 1,
      });
      await this.talentRepo.save(existing);
    }

    return {
      status: 'success',
      message: `¡Punto asignado con éxito a [${targetNode.name}]!`,
      nodeId,
      pointsInNode: existing.points,
      remainingPoints: totalPointsEarned - (spentPoints + 1),
    };
  }

  async resetTalents(playerId: string): Promise<any> {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Aventurero no encontrado');

    const resetCost = 150;
    if (Number(player.gold) < resetCost) {
      throw new BadRequestException(`Oro insuficiente para reiniciar talentos. Requiere ${resetCost} monedas.`);
    }

    player.gold = (Number(player.gold) - resetCost).toString();
    await this.playerRepo.save(player);
    await this.talentRepo.delete({ player_id: playerId });

    return {
      status: 'success',
      message: '¡Árbol de talentos reiniciado! Todos tus puntos han sido restablecidos.',
      newGold: Number(player.gold),
    };
  }
}
