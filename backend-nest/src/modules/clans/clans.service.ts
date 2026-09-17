import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clan, ClanMember, ClanRole } from '../../entities/clan.entity';
import { Territory } from '../../entities/territory.entity';
import { Player } from '../../entities/player.entity';

@Injectable()
export class ClansService {
  constructor(
    @InjectRepository(Clan)
    private clanRepo: Repository<Clan>,
    @InjectRepository(ClanMember)
    private memberRepo: Repository<ClanMember>,
    @InjectRepository(Territory)
    private territoryRepo: Repository<Territory>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
  ) {}

  async getAllClans(): Promise<any[]> {
    const clans = await this.clanRepo.find();
    const result = [];
    for (const c of clans) {
      const memberCount = await this.memberRepo.count({ where: { clan_id: c.id } });
      const leader = await this.playerRepo.findOne({ where: { id: c.leader_id } });
      result.push({
        id: c.id,
        name: c.name,
        tag: c.tag,
        emblem: c.banner_icon,
        level: c.level,
        xp: Number(c.xp),
        treasuryGold: Number(c.treasury_gold),
        totalTrophies: c.total_trophies,
        memberCount,
        leaderName: leader ? leader.name : 'Desconocido',
        createdAt: c.created_at,
      });
    }
    return result;
  }

  async getMyClan(playerId: string): Promise<any> {
    const member = await this.memberRepo.findOne({ where: { player_id: playerId } });
    if (!member) {
      return { inClan: false, clan: null, member: null };
    }
    const clan = await this.clanRepo.findOne({ where: { id: member.clan_id } });
    if (!clan) {
      return { inClan: false, clan: null, member: null };
    }
    const allMembers = await this.memberRepo.find({ where: { clan_id: clan.id } });
    const membersWithNames = [];
    for (const m of allMembers) {
      const p = await this.playerRepo.findOne({ where: { id: m.player_id } });
      membersWithNames.push({
        id: m.id,
        playerId: m.player_id,
        playerName: p ? p.name : 'Aventurero',
        playerClass: p ? p.secret_class : 'WARRIOR',
        role: m.role,
        goldContributed: Number(m.gold_contributed),
        trophiesContributed: m.trophies_contributed,
        joinedAt: m.joined_at,
      });
    }

    return {
      inClan: true,
      clan: {
        id: clan.id,
        name: clan.name,
        tag: clan.tag,
        emblem: clan.banner_icon,
        level: clan.level,
        xp: Number(clan.xp),
        treasuryGold: Number(clan.treasury_gold),
        totalTrophies: clan.total_trophies,
        leaderId: clan.leader_id,
        members: membersWithNames,
      },
      currentRole: member.role,
    };
  }

  async donateGold(playerId: string, amount: number): Promise<any> {
    if (amount <= 0) throw new BadRequestException('La cantidad debe ser mayor a cero.');
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado.');
    if (Number(player.gold) < amount) throw new BadRequestException('Oro insuficiente.');

    const member = await this.memberRepo.findOne({ where: { player_id: playerId } });
    if (!member) throw new BadRequestException('No perteneces a ninguna hermandad.');

    const clan = await this.clanRepo.findOne({ where: { id: member.clan_id } });
    if (!clan) throw new NotFoundException('Clan no encontrado.');

    player.gold = (Number(player.gold) - amount).toString();
    clan.treasury_gold = (Number(clan.treasury_gold) + amount).toString();
    clan.xp = (Number(clan.xp) + Math.floor(amount / 2)).toString();
    member.gold_contributed = (Number(member.gold_contributed) + amount).toString();

    await this.playerRepo.save(player);
    await this.clanRepo.save(clan);
    await this.memberRepo.save(member);

    return {
      status: 'success',
      message: `¡Has donado ${amount} monedas de oro a la hermandad ${clan.name}!`,
      newPlayerGold: Number(player.gold),
      newClanTreasury: Number(clan.treasury_gold),
    };
  }

  async getTerritories(): Promise<any[]> {
    const territories = await this.territoryRepo.find();
    const result = [];
    for (const t of territories) {
      let controllingClan = null;
      if (t.controlling_clan_id) {
        const c = await this.clanRepo.findOne({ where: { id: t.controlling_clan_id } });
        if (c) {
          controllingClan = { id: c.id, name: c.name, tag: c.tag, emblem: c.banner_icon };
        }
      }
      result.push({
        id: t.id,
        name: t.name,
        description: t.description,
        controllingClan,
        dailyGoldYield: Number(t.daily_gold_yield),
        statBuffType: t.stat_buff_type,
        statBuffValue: t.stat_buff_value,
        lastPayoutAt: t.last_payout_at,
        siegeStatus: t.siege_status,
        siegeTargetPoints: t.siege_target_points,
        siegeProgress: t.siege_progress || {},
      });
    }
    return result;
  }

  async claimTribute(playerId: string, territoryId: string): Promise<any> {
    const member = await this.memberRepo.findOne({ where: { player_id: playerId } });
    if (!member) throw new BadRequestException('Debes pertenecer a un clan para reclamar tributos.');

    const territory = await this.territoryRepo.findOne({ where: { id: territoryId } });
    if (!territory) throw new NotFoundException('Territorio no encontrado.');

    if (territory.controlling_clan_id !== member.clan_id) {
      throw new BadRequestException('Tu hermandad no controla este territorio.');
    }

    const rewardGold = Number(territory.daily_gold_yield);
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado.');

    player.gold = (Number(player.gold) + rewardGold).toString();
    territory.last_payout_at = new Date();

    await this.playerRepo.save(player);
    await this.territoryRepo.save(territory);

    return {
      status: 'success',
      message: `¡Has cobrado el tributo de ${rewardGold} monedas de oro de ${territory.name}!`,
      goldEarned: rewardGold,
      newPlayerGold: Number(player.gold),
    };
  }

  async siegeAction(playerId: string, territoryId: string, actionType: string): Promise<any> {
    const member = await this.memberRepo.findOne({ where: { player_id: playerId } });
    if (!member) throw new BadRequestException('Debes estar en un clan para participar en el asedio.');

    const territory = await this.territoryRepo.findOne({ where: { id: territoryId } });
    if (!territory) throw new NotFoundException('Territorio no encontrado.');

    const clan = await this.clanRepo.findOne({ where: { id: member.clan_id } });
    const progress = territory.siege_progress || {};
    const currentPoints = progress[member.clan_id] || 0;
    const addedPoints = Math.floor(Math.random() * 50) + 75; // 75 a 125 puntos por asedio
    const newPoints = currentPoints + addedPoints;
    progress[member.clan_id] = newPoints;

    let conquered = false;
    if (newPoints >= territory.siege_target_points && territory.controlling_clan_id !== member.clan_id) {
      territory.controlling_clan_id = member.clan_id;
      territory.siege_status = 'PEACE';
      progress[member.clan_id] = 0;
      conquered = true;
    } else {
      territory.siege_status = 'UNDER_SIEGE';
    }

    territory.siege_progress = progress;
    await this.territoryRepo.save(territory);

    return {
      status: 'success',
      conquered,
      addedPoints,
      currentPoints: newPoints,
      targetPoints: territory.siege_target_points,
      controllingClanId: territory.controlling_clan_id,
      message: conquered 
        ? `¡GLORIA! ¡La hermandad [${clan?.tag}] ${clan?.name} ha conquistado ${territory.name}!`
        : `¡Asedio efectivo! Has aportado +${addedPoints} puntos de asedio (${newPoints}/${territory.siege_target_points}).`
    };
  }

  async getTugOfWar(): Promise<any> {
    const clans = await this.clanRepo.find({ take: 2 });
    return {
      status: 'success',
      clanRed: clans[0] ? { id: clans[0].id, name: clans[0].name, tag: clans[0].tag, emblem: clans[0].banner_icon } : { name: 'Los Cuervos Carmesí', tag: 'CC', emblem: '🦅' },
      clanBlue: clans[1] ? { id: clans[1].id, name: clans[1].name, tag: clans[1].tag, emblem: clans[1].banner_icon } : { name: 'Guardianes del Roble', tag: 'GR', emblem: '🛡️' },
      ropePosition: 15, // Rango -100 a +100
      wagerGold: 5000,
      hoursRemaining: 14,
    };
  }

  async pullWarAction(playerId: string): Promise<any> {
    const pullRoll = Math.floor(Math.random() * 20) + 1;
    const shift = pullRoll >= 15 ? 10 : (pullRoll >= 10 ? 5 : 2);
    return {
      status: 'success',
      roll: pullRoll,
      shift,
      message: `¡Has tirado de la soga con tirada D20 de [${pullRoll}], desplazando el estandarte ${shift} metros hacia tu bando!`,
    };
  }
}
