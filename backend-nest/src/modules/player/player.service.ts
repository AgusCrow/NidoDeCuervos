import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Player } from '../../entities/player.entity';
import { InventoryItem } from '../../entities/inventory.entity';
import { Item, ItemSlot } from '../../entities/item.entity';
import { ClanMember } from '../../entities/clan.entity';
import { BalanceService } from '../balance/balance.service';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    @InjectRepository(InventoryItem)
    private readonly invRepo: Repository<InventoryItem>,
    @InjectRepository(ClanMember)
    private readonly clanMemberRepo: Repository<ClanMember>,
    private readonly balanceService: BalanceService,
    private readonly dataSource: DataSource,
  ) {}

  public async getPlayerProfile(playerId: string) {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) {
      throw new NotFoundException('Aventurero no encontrado.');
    }

    // Obtener equipamiento activo
    const equipped = await this.invRepo.find({
      where: { player_id: playerId, is_equipped: true },
      relations: ['item'],
    });

    let gearAtk = 0;
    let gearDef = 0;
    for (const eq of equipped) {
      gearAtk += eq.item.attack_bonus || 0;
      gearDef += eq.item.defense_bonus || 0;
    }

    // Obtener membresía de clan
    const clanMember = await this.clanMemberRepo.findOne({
      where: { player_id: playerId },
      relations: ['clan'],
    });

    return {
      id: player.id,
      name: player.name,
      username: player.username,
      role: player.role,
      secretClass: player.secret_class,
      level: player.level,
      xp: player.xp,
      gold: player.gold,
      streakDays: player.streak_days,
      lastDailyClaimAt: player.last_daily_claim_at,
      equippedTitle: player.equipped_title,
      avatarUrl: player.avatar_url,
      stats: {
        str: player.stat_str,
        dex: player.stat_dex,
        int: player.stat_int,
        con: player.stat_con,
        totalAttack: player.stat_str + gearAtk,
        totalDefense: player.stat_con + gearDef,
      },
      clan: clanMember ? {
        id: clanMember.clan.id,
        name: clanMember.clan.name,
        tag: clanMember.clan.tag,
        role: clanMember.role,
      } : null,
      pvp: {
        wins: player.pvp_wins,
        losses: player.pvp_losses,
      },
    };
  }

  public async claimDailyMedal(playerId: string) {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado.');

    const now = new Date();
    if (player.last_daily_claim_at) {
      const diffMs = now.getTime() - new Date(player.last_daily_claim_at).getTime();
      const hoursDiff = diffMs / (1000 * 60 * 60);
      if (hoursDiff < 20) {
        throw new BadRequestException(`Aún debes esperar ${(20 - hoursDiff).toFixed(1)} horas para tu siguiente medalla diaria.`);
      }
    }

    const econConfig = this.balanceService.getSection('economy');
    const baseGold = econConfig?.currency?.daily_medal_base_gold || 50;
    const streakStep = econConfig?.currency?.daily_medal_streak_gold_step || 15;

    const newStreak = (player.streak_days || 0) + 1;
    const goldAward = baseGold + (newStreak * streakStep);
    const xpAward = 35 + (newStreak * 10);

    const newGold = (BigInt(player.gold) + BigInt(goldAward)).toString();
    const newXp = (BigInt(player.xp) + BigInt(xpAward)).toString();

    player.gold = newGold;
    player.xp = newXp;
    player.streak_days = newStreak;
    player.last_daily_claim_at = now;

    await this.playerRepo.save(player);

    return {
      message: `¡Medalla diaria reclamada! Racha actual: ${newStreak} días consecutivos.`,
      streakDays: newStreak,
      goldAwarded: goldAward,
      xpAwarded: xpAward,
      totalGold: newGold,
    };
  }

  public async getLeaderboards() {
    // Individual
    const topPlayers = await this.playerRepo.find({
      order: { level: 'DESC', xp: 'DESC' },
      take: 20,
    });

    return {
      individual: topPlayers.map((p, idx) => ({
        rank: idx + 1,
        id: p.id,
        name: p.name,
        level: p.level,
        xp: p.xp,
        secretClass: p.secret_class,
        title: p.equipped_title,
        avatarUrl: p.avatar_url,
      })),
    };
  }

  public async getInventory(playerId: string) {
    const items = await this.invRepo.find({
      where: { player_id: playerId },
      relations: ['item'],
      order: { acquired_at: 'DESC' },
    });
    return items.map(inv => ({
      invId: inv.id,
      itemId: inv.item.id,
      name: inv.item.name,
      description: inv.item.description,
      slot: inv.item.slot,
      rarity: inv.item.rarity,
      attackBonus: inv.item.attack_bonus,
      defenseBonus: inv.item.defense_bonus,
      goldValue: inv.item.gold_value,
      icon: inv.item.icon,
      isEquipped: inv.is_equipped,
      slotEquipped: inv.slot_equipped,
      refinementLevel: inv.item.refinement_level,
    }));
  }
}
