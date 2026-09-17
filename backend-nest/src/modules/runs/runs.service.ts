import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JourneyProgress } from '../../entities/journey-progress.entity';
import { RaidBoss, RaidContribution } from '../../entities/raid-boss.entity';
import { Player } from '../../entities/player.entity';

export interface SendaZone {
  id: string;
  name: string;
  minLevel: number;
  icon: string;
  desc: string;
  baseGold: number;
  baseXp: number;
}

export interface SendaDifficulty {
  id: string;
  name: string;
  durationMinutes: number;
  multiplierGold: number;
  multiplierXp: number;
  bonusMaterials: number;
  tag: string;
}

@Injectable()
export class RunsService {
  private readonly sendaZones: SendaZone[] = [
    { id: 'bosque_sombras', name: 'Bosque de las Sombras', minLevel: 1, icon: '🌲', desc: 'Arboleda encantada infestada de trasgos y lobos sombríos.', baseGold: 150, baseXp: 100 },
    { id: 'cripta_antiguos', name: 'Cripta de los Antiguos', minLevel: 15, icon: '💀', desc: 'Mausoleo subterráneo colmado de espectros y osarios arcanos.', baseGold: 380, baseXp: 260 },
    { id: 'volcan_magma', name: 'Volcán de Magma Negro', minLevel: 35, icon: '🌋', desc: 'Ríos de lava viva y elementales abrasadores de roca ígnea.', baseGold: 950, baseXp: 700 },
    { id: 'picos_helados', name: 'Picos Helados del Abismo', minLevel: 60, icon: '❄️', desc: 'Cumbres azotadas por ventiscas eternas y gólems de hielo.', baseGold: 2400, baseXp: 1800 },
    { id: 'falla_astral', name: 'Falla Astral del Vacío', minLevel: 80, icon: '⚡', desc: 'Grieta interdimensional donde convergen las fuerzas del Caos.', baseGold: 5500, baseXp: 4200 },
  ];

  private readonly sendaDifficulties: SendaDifficulty[] = [
    { id: 'NORMAL', name: 'Normal', durationMinutes: 15, multiplierGold: 1.0, multiplierXp: 1.0, bonusMaterials: 0, tag: 'Seguro' },
    { id: 'HARD', name: 'Difícil', durationMinutes: 30, multiplierGold: 2.2, multiplierXp: 2.5, bonusMaterials: 1, tag: 'Desafiante' },
    { id: 'NIGHTMARE', name: 'Pesadilla', durationMinutes: 60, multiplierGold: 4.5, multiplierXp: 5.0, bonusMaterials: 2, tag: 'Peligroso' },
    { id: 'ABYSSAL', name: 'Abisal', durationMinutes: 120, multiplierGold: 8.0, multiplierXp: 10.0, bonusMaterials: 4, tag: 'Mortal' },
  ];

  constructor(
    @InjectRepository(JourneyProgress)
    private journeyRepo: Repository<JourneyProgress>,
    @InjectRepository(RaidBoss)
    private raidBossRepo: Repository<RaidBoss>,
    @InjectRepository(RaidContribution)
    private raidContribRepo: Repository<RaidContribution>,
    @InjectRepository(Player)
    private playerRepo: Repository<Player>,
    private dataSource: DataSource,
  ) {}

  // =========================================================================
  // 1. SENDA INFINITA UNIFICADA (Zonas + Dificultades con Temporizador Real)
  // =========================================================================
  async getJourneyState(playerId: string): Promise<any> {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    const playerLevel = player ? player.level : 1;

    // 1. Consultar expedición de senda activa
    const activeRuns = await this.dataSource.query(
      `SELECT * FROM player_senda_runs WHERE player_id = $1`,
      [playerId]
    );

    let activeRun: any = null;
    if (activeRuns && activeRuns.length > 0) {
      const r = activeRuns[0];
      const now = new Date();
      const endsAt = new Date(r.ends_at);
      const remainingMs = Math.max(0, endsAt.getTime() - now.getTime());
      const remainingSeconds = Math.floor(remainingMs / 1000);
      const isCompleted = remainingSeconds === 0;

      const zone = this.sendaZones.find(z => z.id === r.zone_id) || this.sendaZones[0];
      const diff = this.sendaDifficulties.find(d => d.id === r.difficulty) || this.sendaDifficulties[0];

      activeRun = {
        zoneId: r.zone_id,
        zoneName: zone.name,
        zoneIcon: zone.icon,
        difficultyId: r.difficulty,
        difficultyName: diff.name,
        startedAt: r.started_at,
        endsAt: r.ends_at,
        remainingSeconds,
        isCompleted,
        canClaim: isCompleted && !r.is_claimed,
        rewardGold: r.reward_gold,
        rewardXp: r.reward_xp,
        rewardMaterials: r.reward_materials,
      };
    }

    // 2. Acumulación pasiva silenciosa de fondo (AFK)
    let progress = await this.journeyRepo.findOne({ where: { player_id: playerId } });
    if (!progress) {
      progress = this.journeyRepo.create({
        player_id: playerId,
        biome_id: 'bosque_sombras',
        wave_depth: 1,
        current_monster_index: 1,
        monster_current_hp: 120,
        monster_max_hp: 120,
        monster_name: 'Lobo de Ceniza',
        monster_icon: '🐺',
        total_monsters_slain: 0,
        accumulated_gold: '45',
        accumulated_xp: '30',
        accumulated_items: [],
      });
      await this.journeyRepo.save(progress);
    }

    return {
      playerId,
      playerLevel,
      zones: this.sendaZones.map(z => ({
        ...z,
        isUnlocked: playerLevel >= z.minLevel,
      })),
      difficulties: this.sendaDifficulties,
      activeRun,
      passiveLoot: {
        gold: Number(progress.accumulated_gold),
        xp: Number(progress.accumulated_xp),
        monstersSlain: progress.total_monsters_slain,
      },
    };
  }

  async startJourney(playerId: string, zoneId: string, difficultyId: string): Promise<any> {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Aventurero no encontrado.');

    // Validar concurrencia: solo 1 a la vez
    const existing = await this.dataSource.query(
      `SELECT * FROM player_senda_runs WHERE player_id = $1`,
      [playerId]
    );

    if (existing && existing.length > 0) {
      const r = existing[0];
      const now = new Date();
      const endsAt = new Date(r.ends_at);
      if (endsAt.getTime() > now.getTime() || !r.is_claimed) {
        throw new BadRequestException('Ya tienes una expedición en curso o pendiente de reclamo. Solo puedes realizar una a la vez.');
      }
    }

    const zone = this.sendaZones.find(z => z.id === zoneId);
    if (!zone) throw new BadRequestException('Zona de expedición inválida.');
    if (player.level < zone.minLevel) {
      throw new BadRequestException(`Se requiere nivel ${zone.minLevel} para adentrarse en "${zone.name}".`);
    }

    const diff = this.sendaDifficulties.find(d => d.id === difficultyId);
    if (!diff) throw new BadRequestException('Nivel de dificultad inválido.');

    const goldReward = Math.round(zone.baseGold * diff.multiplierGold);
    const xpReward = Math.round(zone.baseXp * diff.multiplierXp);
    const matReward = diff.bonusMaterials;
    const durationSeconds = diff.durationMinutes * 60;

    await this.dataSource.query(
      `INSERT INTO player_senda_runs (player_id, zone_id, difficulty, started_at, ends_at, reward_gold, reward_xp, reward_materials, is_claimed)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + ($4 || ' seconds')::INTERVAL, $5, $6, $7, false)
       ON CONFLICT (player_id) DO UPDATE SET
         zone_id = EXCLUDED.zone_id,
         difficulty = EXCLUDED.difficulty,
         started_at = CURRENT_TIMESTAMP,
         ends_at = CURRENT_TIMESTAMP + ($4 || ' seconds')::INTERVAL,
         reward_gold = EXCLUDED.reward_gold,
         reward_xp = EXCLUDED.reward_xp,
         reward_materials = EXCLUDED.reward_materials,
         is_claimed = false`,
      [playerId, zone.id, diff.id, durationSeconds, goldReward, xpReward, matReward]
    );

    return {
      status: 'success',
      message: `¡Expedición a "${zone.name}" (${diff.name}) iniciada! Tu héroe combatirá durante ${diff.durationMinutes} minutos.`,
      durationMinutes: diff.durationMinutes,
      projectedGold: goldReward,
      projectedXp: xpReward,
    };
  }

  async claimJourney(playerId: string): Promise<any> {
    const runs = await this.dataSource.query(
      `SELECT * FROM player_senda_runs WHERE player_id = $1`,
      [playerId]
    );

    if (!runs || runs.length === 0) {
      throw new BadRequestException('No hay ninguna expedición activa para reclamar.');
    }

    const r = runs[0];
    const now = new Date();
    if (new Date(r.ends_at).getTime() > now.getTime()) {
      throw new BadRequestException('La expedición aún se encuentra en curso en las profundidades.');
    }

    if (r.is_claimed) {
      throw new BadRequestException('El botín de esta expedición ya fue reclamado.');
    }

    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado.');

    player.gold = (Number(player.gold) + r.reward_gold).toString();
    player.xp = (Number(player.xp) + r.reward_xp).toString();
    await this.playerRepo.save(player);

    await this.dataSource.query(
      `DELETE FROM player_senda_runs WHERE player_id = $1`,
      [playerId]
    );

    return {
      status: 'success',
      claimedGold: r.reward_gold,
      claimedXp: r.reward_xp,
      claimedMaterials: r.reward_materials,
      newPlayerGold: Number(player.gold),
      newPlayerXp: Number(player.xp),
      message: `¡Expedición completada con honores! Has obtenido ${r.reward_gold} de oro, ${r.reward_xp} XP y ${r.reward_materials} materiales raros.`,
    };
  }

  async claimAfk(playerId: string): Promise<any> {
    const progress = await this.journeyRepo.findOne({ where: { player_id: playerId } });
    if (!progress) throw new NotFoundException('Progreso AFK no encontrado.');

    const goldToClaim = Number(progress.accumulated_gold);
    const xpToClaim = Number(progress.accumulated_xp);

    if (goldToClaim === 0 && xpToClaim === 0) {
      throw new BadRequestException('No hay botín pasivo acumulado.');
    }

    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado.');

    player.gold = (Number(player.gold) + goldToClaim).toString();
    player.xp = (Number(player.xp) + xpToClaim).toString();

    progress.accumulated_gold = '0';
    progress.accumulated_xp = '0';

    await this.playerRepo.save(player);
    await this.journeyRepo.save(progress);

    return {
      status: 'success',
      claimedGold: goldToClaim,
      claimedXp: xpToClaim,
      newPlayerGold: Number(player.gold),
      newPlayerXp: Number(player.xp),
      message: `¡Has recogido ${goldToClaim} monedas de oro y ${xpToClaim} XP de la exploración pasiva!`,
    };
  }

  // =========================================================================
  // 2. EXPEDICIONES DE GREMIO (Larga Escala: 12h, 24h, 48h - 1 a la vez)
  // =========================================================================
  getGuildExpeditionsList(): any[] {
    return [
      {
        id: 'guild_patrol_12h',
        title: 'Patrulla de las Fronteras del Gremio',
        difficulty: 'MEDIA',
        durationHours: 12,
        durationMinutes: 720,
        rewardGold: 1500,
        rewardXp: 800,
        clanGold: 500,
        rewardMaterials: 1,
        icon: '🛡️',
        desc: 'Vigilancia armada en conjunto con hermanos de clan para resguardar las rutas de suministros.',
      },
      {
        id: 'guild_citadel_24h',
        title: 'Incursión a la Ciudadela de Ceniza',
        difficulty: 'ALTA',
        durationHours: 24,
        durationMinutes: 1440,
        rewardGold: 4500,
        rewardXp: 2400,
        clanGold: 1800,
        rewardMaterials: 3,
        icon: '🏰',
        desc: 'Asalto coordinado a una fortaleza ancestral ocupada por gigantes de obsidiana.',
      },
      {
        id: 'guild_crusade_48h',
        title: 'Gran Cruzada a las Tierras del Caos',
        difficulty: 'ÉPICA',
        durationHours: 48,
        durationMinutes: 2880,
        rewardGold: 12000,
        rewardXp: 6000,
        clanGold: 5000,
        rewardMaterials: 6,
        icon: '⚔️',
        desc: 'Campaña legendaria de dos días completos penetrando el corazón de las tinieblas.',
      },
    ];
  }

  async getGuildExpeditionsState(playerId: string): Promise<any> {
    const expeditions = this.getGuildExpeditionsList();

    // Consultar si el jugador pertenece a un clan
    const clanMember = await this.dataSource.query(
      `SELECT cm.*, c.name as clan_name, c.tag as clan_tag 
       FROM clan_members cm 
       JOIN clans c ON c.id = cm.clan_id 
       WHERE cm.player_id = $1`,
      [playerId]
    );

    const inClan = clanMember && clanMember.length > 0;
    const clanInfo = inClan ? clanMember[0] : null;

    // Consultar expedición activa
    const activeRows = await this.dataSource.query(
      `SELECT * FROM player_guild_expeditions WHERE player_id = $1`,
      [playerId]
    );

    let activeExpedition: any = null;
    if (activeRows && activeRows.length > 0) {
      const r = activeRows[0];
      const now = new Date();
      const endsAt = new Date(r.ends_at);
      const remainingMs = Math.max(0, endsAt.getTime() - now.getTime());
      const remainingSeconds = Math.floor(remainingMs / 1000);
      const isCompleted = remainingSeconds === 0;

      const template = expeditions.find(e => e.id === r.expedition_id) || expeditions[0];

      activeExpedition = {
        id: r.expedition_id,
        title: template.title,
        icon: template.icon,
        startedAt: r.started_at,
        endsAt: r.ends_at,
        remainingSeconds,
        isCompleted,
        canClaim: isCompleted && !r.is_claimed,
        rewardGold: r.reward_gold,
        rewardXp: r.reward_xp,
        clanGold: r.clan_gold,
        rewardMaterials: r.reward_materials,
      };
    }

    return {
      inClan,
      clan: clanInfo,
      expeditions,
      activeExpedition,
    };
  }

  async startGuildExpedition(playerId: string, expId: string): Promise<any> {
    const clanMember = await this.dataSource.query(
      `SELECT * FROM clan_members WHERE player_id = $1`,
      [playerId]
    );

    if (!clanMember || clanMember.length === 0) {
      throw new BadRequestException('Debes jurar lealtad a un clan para participar en las expediciones de gremio.');
    }

    const clanId = clanMember[0].clan_id;

    // Validar solo 1 a la vez
    const existing = await this.dataSource.query(
      `SELECT * FROM player_guild_expeditions WHERE player_id = $1`,
      [playerId]
    );

    if (existing && existing.length > 0) {
      const r = existing[0];
      const now = new Date();
      if (new Date(r.ends_at).getTime() > now.getTime() || !r.is_claimed) {
        throw new BadRequestException('Ya estás marchando en una expedición de gremio. Solo puedes realizar una a la vez.');
      }
    }

    const template = this.getGuildExpeditionsList().find(e => e.id === expId);
    if (!template) throw new BadRequestException('Expedición de gremio no encontrada.');

    const durationSeconds = template.durationMinutes * 60;

    await this.dataSource.query(
      `INSERT INTO player_guild_expeditions (player_id, expedition_id, clan_id, started_at, ends_at, reward_gold, reward_xp, clan_gold, reward_materials, is_claimed)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + ($4 || ' seconds')::INTERVAL, $5, $6, $7, $8, false)
       ON CONFLICT (player_id) DO UPDATE SET
         expedition_id = EXCLUDED.expedition_id,
         clan_id = EXCLUDED.clan_id,
         started_at = CURRENT_TIMESTAMP,
         ends_at = CURRENT_TIMESTAMP + ($4 || ' seconds')::INTERVAL,
         reward_gold = EXCLUDED.reward_gold,
         reward_xp = EXCLUDED.reward_xp,
         clan_gold = EXCLUDED.clan_gold,
         reward_materials = EXCLUDED.reward_materials,
         is_claimed = false`,
      [playerId, template.id, clanId, durationSeconds, template.rewardGold, template.rewardXp, template.clanGold, template.rewardMaterials]
    );

    return {
      status: 'success',
      message: `¡La bandera del clan avanza! Has partido a "${template.title}". Tiempo de asedio: ${template.durationHours} horas.`,
      durationHours: template.durationHours,
    };
  }

  async claimGuildExpedition(playerId: string): Promise<any> {
    const rows = await this.dataSource.query(
      `SELECT * FROM player_guild_expeditions WHERE player_id = $1`,
      [playerId]
    );

    if (!rows || rows.length === 0) {
      throw new BadRequestException('No tienes ninguna expedición de gremio para reclamar.');
    }

    const r = rows[0];
    const now = new Date();
    if (new Date(r.ends_at).getTime() > now.getTime()) {
      throw new BadRequestException('La expedición de gremio aún no ha culminado su marcha militar.');
    }

    if (r.is_claimed) {
      throw new BadRequestException('El tributo de esta expedición ya fue reclamado.');
    }

    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado.');

    // Otorgar al jugador
    player.gold = (Number(player.gold) + r.reward_gold).toString();
    player.xp = (Number(player.xp) + r.reward_xp).toString();
    await this.playerRepo.save(player);

    // Otorgar al clan
    if (r.clan_id) {
      await this.dataSource.query(
        `UPDATE clans SET treasury_gold = treasury_gold + $1 WHERE id = $2`,
        [r.clan_gold, r.clan_id]
      );
    }

    await this.dataSource.query(
      `DELETE FROM player_guild_expeditions WHERE player_id = $1`,
      [playerId]
    );

    return {
      status: 'success',
      claimedGold: r.reward_gold,
      claimedXp: r.reward_xp,
      clanGold: r.clan_gold,
      claimedMaterials: r.reward_materials,
      message: `¡Gloria al Gremio! Has recibido ${r.reward_gold} oro y ${r.reward_xp} XP. La tesorería del clan recibe +${r.clan_gold} oro.`,
    };
  }

  // =========================================================================
  // 3. COLOSOS MUNDIALES (ESTILO CHAOS CASTLE: 5 SALAS, MÁX 100 JUGADORES)
  // =========================================================================
  async getChaosCastleRooms(playerId: string): Promise<any> {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    const playerLevel = player ? player.level : 1;

    const rooms = await this.dataSource.query(
      `SELECT r.*, 
              COUNT(reg.id)::int as registered_count
       FROM chaos_castle_rooms r
       LEFT JOIN chaos_castle_registrations reg ON reg.room_id = r.id
       GROUP BY r.id
       ORDER BY r.tier_index ASC`
    );

    // Encontrar sala elegible por nivel
    let eligibleRoomId = 'cc_room_1';
    for (const r of rooms) {
      if (playerLevel >= r.min_level && playerLevel <= r.max_level) {
        eligibleRoomId = r.id;
        break;
      }
    }

    // Verificar si el jugador ya está registrado en alguna sala
    const playerReg = await this.dataSource.query(
      `SELECT * FROM chaos_castle_registrations WHERE player_id = $1`,
      [playerId]
    );

    const isJoined = playerReg && playerReg.length > 0;
    const joinedRoomId = isJoined ? playerReg[0].room_id : null;

    // Leaderboard de la sala activa del jugador (o sala elegible)
    const activeRoomId = joinedRoomId || eligibleRoomId;
    const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

    const leaderboard = await this.dataSource.query(
      `SELECT player_id, player_name, player_level, damage_dealt, assaults_count
       FROM chaos_castle_registrations
       WHERE room_id = $1
       ORDER BY damage_dealt DESC
       LIMIT 10`,
      [activeRoomId]
    );

    // Rango del jugador en su sala
    let playerRank = null;
    let playerDamage = 0;
    let playerAssaults = 0;
    let isClaimed = false;

    if (isJoined) {
      playerDamage = Number(playerReg[0].damage_dealt);
      playerAssaults = playerReg[0].assaults_count;
      isClaimed = playerReg[0].is_claimed;

      const rankResult = await this.dataSource.query(
        `SELECT COUNT(*)::int + 1 as rank
         FROM chaos_castle_registrations
         WHERE room_id = $1 AND damage_dealt > $2`,
        [activeRoomId, playerDamage]
      );
      playerRank = rankResult[0]?.rank || 1;
    }

    return {
      playerLevel,
      eligibleRoomId,
      isJoined,
      joinedRoomId,
      playerStats: {
        damageDealt: playerDamage,
        assaultsCount: playerAssaults,
        rank: playerRank,
        isClaimed,
      },
      currentRoom: {
        id: activeRoom.id,
        name: activeRoom.name,
        minLevel: activeRoom.min_level,
        maxLevel: activeRoom.max_level,
        maxPlayers: activeRoom.max_players,
        registeredCount: activeRoom.registered_count,
        currentHp: Number(activeRoom.current_hp),
        maxHp: Number(activeRoom.max_hp),
        hpPct: Math.max(0, Math.round((Number(activeRoom.current_hp) / Number(activeRoom.max_hp)) * 100)),
        isDefeated: activeRoom.is_defeated,
        endsAt: activeRoom.ends_at,
        assaultDurationSeconds: 180,
      },
      rooms: rooms.map(r => ({
        id: r.id,
        name: r.name,
        minLevel: r.min_level,
        maxLevel: r.max_level,
        maxPlayers: r.max_players,
        registeredCount: r.registered_count,
        isEligible: playerLevel >= r.min_level && playerLevel <= r.max_level,
        isJoined: joinedRoomId === r.id,
        isFull: r.registered_count >= r.max_players,
        currentHp: Number(r.current_hp),
        maxHp: Number(r.max_hp),
        isDefeated: r.is_defeated,
      })),
      leaderboard,
    };
  }

  async joinRaidRoom(playerId: string, roomId: string): Promise<any> {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado.');

    const roomRows = await this.dataSource.query(
      `SELECT r.*, COUNT(reg.id)::int as registered_count
       FROM chaos_castle_rooms r
       LEFT JOIN chaos_castle_registrations reg ON reg.room_id = r.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [roomId]
    );

    if (!roomRows || roomRows.length === 0) {
      throw new NotFoundException('Sala de Coloso no encontrada.');
    }

    const room = roomRows[0];

    // Validar nivel
    if (player.level < room.min_level || player.level > room.max_level) {
      throw new BadRequestException(`Nivel no admitido en esta sala. Rango obligatorio: Nivel ${room.min_level} a ${room.max_level}.`);
    }

    // Validar cupo de 100 jugadores
    if (room.registered_count >= room.max_players) {
      throw new BadRequestException('Esta sala ha alcanzado el límite máximo de 100 aventureros inscritos.');
    }

    // Registrar
    const regId = `cc_reg_${playerId}_${room.id}`;
    await this.dataSource.query(
      `INSERT INTO chaos_castle_registrations (id, room_id, player_id, player_name, player_level, damage_dealt, assaults_count, is_claimed, joined_at)
       VALUES ($1, $2, $3, $4, $5, 0, 0, false, CURRENT_TIMESTAMP)
       ON CONFLICT (room_id, player_id) DO NOTHING`,
      [regId, room.id, player.id, player.name, player.level]
    );

    return {
      status: 'success',
      message: `¡Te has unido con éxito a la "${room.name}"! Espera el inicio de la ventana de asalto de 3 minutos.`,
    };
  }

  async attackChaosCastleBoss(playerId: string, roomId: string): Promise<any> {
    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado.');

    const regRows = await this.dataSource.query(
      `SELECT * FROM chaos_castle_registrations WHERE room_id = $1 AND player_id = $2`,
      [roomId, playerId]
    );

    if (!regRows || regRows.length === 0) {
      throw new BadRequestException('Debes inscribirte previamente en la sala para asestar golpes al Coloso.');
    }

    const roomRows = await this.dataSource.query(
      `SELECT * FROM chaos_castle_rooms WHERE id = $1`,
      [roomId]
    );

    if (!roomRows || roomRows.length === 0) throw new NotFoundException('Sala no encontrada.');
    const room = roomRows[0];

    if (room.is_defeated || Number(room.current_hp) <= 0) {
      throw new BadRequestException('El Coloso de esta sala ya ha sido derrotado. ¡Reclama tu recompensa de ranking!');
    }

    // Cálculo de daño
    const statBonus = (player.stat_str + player.stat_dex + player.stat_int) * 15;
    const d20 = Math.floor(Math.random() * 20) + 1;
    const isCrit = d20 >= 18;
    const baseDamage = Math.floor(Math.random() * 2500) + 3000 + statBonus;
    const totalDamage = isCrit ? Math.round(baseDamage * 1.8) : baseDamage;

    // Actualizar vida del jefe
    const currentHp = Number(room.current_hp);
    const newHp = Math.max(0, currentHp - totalDamage);
    const isDefeated = newHp === 0;

    await this.dataSource.query(
      `UPDATE chaos_castle_rooms SET current_hp = $1, is_defeated = $2 WHERE id = $3`,
      [newHp, isDefeated, roomId]
    );

    // Actualizar contribución del jugador
    await this.dataSource.query(
      `UPDATE chaos_castle_registrations 
       SET damage_dealt = damage_dealt + $1, assaults_count = assaults_count + 1 
       WHERE room_id = $2 AND player_id = $3`,
      [totalDamage, roomId, playerId]
    );

    return {
      status: 'success',
      damageDealt: totalDamage,
      isCrit,
      d20Roll: d20,
      newBossHp: newHp,
      isDefeated,
      message: isDefeated 
        ? `🔥 ¡GOLPE DEFINITIVO! Has infligido ${totalDamage} de daño. ¡El Coloso se ha derrumbado estrepitosamente!`
        : `⚔️ Asalto ejecutado (d20: ${d20}${isCrit ? ' ¡CRÍTICO!' : ''}): Has causado ${totalDamage} puntos de daño al Coloso.`,
    };
  }

  async claimRaidReward(playerId: string, roomId: string): Promise<any> {
    const roomRows = await this.dataSource.query(
      `SELECT * FROM chaos_castle_rooms WHERE id = $1`,
      [roomId]
    );

    if (!roomRows || roomRows.length === 0) throw new NotFoundException('Sala no encontrada.');
    const room = roomRows[0];

    if (!room.is_defeated && Number(room.current_hp) > 0) {
      throw new BadRequestException('El Coloso sigue en pie. Debe ser aniquilado antes de poder reclamar las recompensas de ranking.');
    }

    const regRows = await this.dataSource.query(
      `SELECT * FROM chaos_castle_registrations WHERE room_id = $1 AND player_id = $2`,
      [roomId, playerId]
    );

    if (!regRows || regRows.length === 0) {
      throw new BadRequestException('No estás registrado en esta sala.');
    }

    const reg = regRows[0];
    if (reg.is_claimed) {
      throw new BadRequestException('Ya has reclamado tu recompensa de ranking para este Coloso.');
    }

    if (Number(reg.damage_dealt) <= 0) {
      throw new BadRequestException('No infligiste daño durante el asalto para calificar a las recompensas.');
    }

    // Determinar puesto en el ranking de la sala
    const rankResult = await this.dataSource.query(
      `SELECT COUNT(*)::int + 1 as rank
       FROM chaos_castle_registrations
       WHERE room_id = $1 AND damage_dealt > $2`,
      [roomId, Number(reg.damage_dealt)]
    );

    const rank = rankResult[0]?.rank || 1;

    let rewardGold = 350;
    let rewardXp = 250;
    let rewardMaterials = 1;
    let tierName = 'Participante Valeroso';

    if (rank === 1) {
      rewardGold = 5000;
      rewardXp = 3500;
      rewardMaterials = 4;
      tierName = '🥇 Campeón Supremo (Top 1)';
    } else if (rank <= 5) {
      rewardGold = 2500;
      rewardXp = 1800;
      rewardMaterials = 3;
      tierName = '🥈 Alto Comandante (Top 2-5)';
    } else if (rank <= 20) {
      rewardGold = 1000;
      rewardXp = 800;
      rewardMaterials = 2;
      tierName = '🥉 Vanguardia de Élite (Top 6-20)';
    }

    const player = await this.playerRepo.findOne({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Jugador no encontrado.');

    player.gold = (Number(player.gold) + rewardGold).toString();
    player.xp = (Number(player.xp) + rewardXp).toString();
    await this.playerRepo.save(player);

    await this.dataSource.query(
      `UPDATE chaos_castle_registrations SET is_claimed = true WHERE room_id = $1 AND player_id = $2`,
      [roomId, playerId]
    );

    return {
      status: 'success',
      rank,
      tierName,
      rewardGold,
      rewardXp,
      rewardMaterials,
      message: `¡Victoria Gloriosa! Clasificaste en el puesto #${rank} (${tierName}). Recibes ${rewardGold} oro, ${rewardXp} XP y ${rewardMaterials} Núcleos Arcanos de mejora.`,
    };
  }

  // Métodos retrocompatibles
  async getRaidBossState(): Promise<any> {
    return this.getChaosCastleRooms('usr_kaelen');
  }

  async attackRaidBoss(playerId: string, playerName: string): Promise<any> {
    return this.attackChaosCastleBoss(playerId, 'cc_room_1');
  }

  getExpeditionsList(): any[] {
    return this.getGuildExpeditionsList();
  }

  async claimExpeditionReward(playerId: string, expId: string): Promise<any> {
    return this.claimGuildExpedition(playerId);
  }

  async runCatacombsWave(playerId: string, floor: number): Promise<any> {
    return { status: 'success', message: 'Las Catacumbas han sido unificadas con la Senda Infinita por zonas y dificultades.' };
  }
}
