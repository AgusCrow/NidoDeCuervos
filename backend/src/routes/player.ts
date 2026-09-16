import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { getDb, RAID_BOSS_CATALOG, CLASS_SKILL_TREES, ItemRow, PlayerRaidCombatState, RaidBossState } from '../db';
import { sseHub } from '../sseHub';
import { resolvePvPDuel } from '../rpgEngine';
import { generateProceduralItem } from '../services/itemGenerator';
import { getPlayerQuests, claimQuestReward, openGrandVault, recordPlayerActivity } from '../services/questService';
import { salvageItem, refineItem, calculateActiveSets } from '../services/forgeService';
import { getNPCDialogue, getRandomTavernRumors } from '../services/loreService';
import { fetchCurrentWeather } from '../weatherService';
import { TASKBAR_BIOMES, getOrCreateTaskbarProgress, processTaskbarTick } from '../services/taskbarService';
import crypto from 'crypto';

const router = Router();

// GET /api/v1/player/leaderboard - Salón de la Fama (Acceso público para Taberna, TV y Jugadores)
router.get('/leaderboard', async (req, res: Response) => {
  try {
    const db = await getDb();
    const allPlayers = await db.all(
      'SELECT id, name, username, secret_class, level, xp, gold, pvp_wins, pvp_losses, equipped_title FROM players WHERE role != "DM"'
    );

    const topLevel = [...allPlayers].sort((a, b) => b.level - a.level || b.xp - a.xp).slice(0, 5);
    const topGold = [...allPlayers].sort((a, b) => b.gold - a.gold).slice(0, 5);
    const topDuels = [...allPlayers].sort((a, b) => (b.pvp_wins || 0) - (a.pvp_wins || 0)).slice(0, 5);

    return res.json({
      success: true,
      topLevel,
      topGold,
      topDuels
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/player/tavern/shouts - Muro de la Taberna público
router.get('/tavern/shouts', async (req, res: Response) => {
  try {
    const db = await getDb();
    const shouts = [...(db.data.tavern_shouts || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 50);
    return res.json({ success: true, shouts });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/player/lore/rumors - Rumores y leyendas vivas de la Taberna (Acceso público)
router.get('/lore/rumors', async (req, res: Response) => {
  try {
    const rumors = getRandomTavernRumors();
    return res.json({ success: true, rumors });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/player/market/listings - Mercado P2P público
router.get('/market/listings', async (req, res: Response) => {
  try {
    const db = await getDb();
    const listings = (db.data.market_listings || [])
      .filter((m) => m.status === 'ACTIVE')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return res.json({ success: true, listings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper para inicializar y sincronizar el estado de combate del jugador en el Asedio
export function getOrInitPlayerCombatState(
  userId: string,
  userLevel: number,
  equippedDef: number,
  bossState: RaidBossState
): PlayerRaidCombatState {
  if (!bossState.player_combat_states) {
    bossState.player_combat_states = {};
  }
  const maxHp = 100 + ((userLevel || 1) * 8) + Math.floor(equippedDef / 2);
  const now = Date.now();
  let state = bossState.player_combat_states[userId];

  if (!state) {
    state = {
      hp: maxHp,
      max_hp: maxHp,
      stamina: 100,
      is_defending: false,
      last_stamina_update: now,
      special_cooldown_until: 0,
      knocked_out_until: null
    };
    bossState.player_combat_states[userId] = state;
  } else {
    state.max_hp = maxHp;
    if (state.hp > maxHp) state.hp = maxHp;

    // Verificar si expiró el tiempo de knockout (25 segundos)
    if (state.knocked_out_until && new Date(state.knocked_out_until).getTime() <= now) {
      state.knocked_out_until = null;
      state.hp = Math.round(maxHp * 0.4); // Revive con 40% HP
      state.stamina = 50;
    }

    // Regenerar estamina (+15 por segundo si no está incapacitado)
    if (!state.knocked_out_until) {
      const elapsedSeconds = Math.max(0, (now - (state.last_stamina_update || now)) / 1000);
      const regenerated = Math.floor(elapsedSeconds * 15);
      if (regenerated > 0) {
        state.stamina = Math.min(100, (state.stamina || 0) + regenerated);
        state.last_stamina_update = now;
      }
    } else {
      state.last_stamina_update = now;
    }
  }

  return state;
}

// GET /api/v1/player/raid/boss - Estado público del Raid Boss con combate del jugador
router.get('/raid/boss', async (req, res: Response) => {
  try {
    const db = await getDb();
    if (!db.data.raid_boss || !db.data.raid_boss.element) {
      const def = RAID_BOSS_CATALOG[0];
      db.data.raid_boss = {
        ...def,
        current_hp: def.max_hp,
        is_defeated: false,
        total_attacks: 0,
        top_contributors: [],
        phase: 1,
        difficulty: 'NORMAL',
        player_combat_states: {}
      };
      db.save();
    }

    let userCombatState: PlayerRaidCombatState | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const foundUser = (db.data.players || []).find((p) => p.private_token === token || p.id === token);
      if (foundUser) {
        const userInv = (db.data.inventory || []).filter((i) => i.player_id === foundUser.id && i.is_equipped);
        let defStat = 0;
        for (const inv of userInv) {
          const item = (db.data.items || []).find((it) => it.id === inv.item_id);
          if (item && item.stat_def) defStat += item.stat_def;
        }
        userCombatState = getOrInitPlayerCombatState(foundUser.id, foundUser.level || 1, defStat, db.data.raid_boss);
        db.save();
      }
    }

    return res.json({
      success: true,
      boss: db.data.raid_boss,
      catalog: RAID_BOSS_CATALOG,
      userCombatState
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/raid/select-boss - Seleccionar o rotar Raid Boss y dificultad
router.post('/raid/select-boss', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const { boss_id, difficulty = 'NORMAL' } = req.body;
    const target = RAID_BOSS_CATALOG.find((b) => b.id === boss_id) || RAID_BOSS_CATALOG[0];

    const diff = (difficulty === 'MYTHIC' || difficulty === 'HEROIC') ? difficulty : 'NORMAL';
    const hpMult = diff === 'MYTHIC' ? 2.5 : diff === 'HEROIC' ? 1.6 : 1.0;
    const rewMult = diff === 'MYTHIC' ? 2.2 : diff === 'HEROIC' ? 1.6 : 1.0;

    const scaledMaxHp = Math.round(target.max_hp * hpMult);
    const scaledGold = Math.round(target.reward_gold * rewMult);
    const scaledXp = Math.round(target.reward_xp * rewMult);

    db.data.raid_boss = {
      ...target,
      max_hp: scaledMaxHp,
      current_hp: scaledMaxHp,
      reward_gold: scaledGold,
      reward_xp: scaledXp,
      is_defeated: false,
      total_attacks: 0,
      top_contributors: [],
      phase: 1,
      difficulty: diff,
      shield_hp: diff === 'MYTHIC' ? Math.round(scaledMaxHp * 0.2) : 0,
      max_shield_hp: diff === 'MYTHIC' ? Math.round(scaledMaxHp * 0.2) : 0,
      shield_turns_left: diff === 'MYTHIC' ? 8 : 0,
      player_combat_states: {}
    };
    db.save();

    const diffBadge = diff === 'MYTHIC' ? '🔴 MÍTICO' : diff === 'HEROIC' ? '🟡 HEROICO' : '🟢 NORMAL';
    sseHub.broadcast('party_updated', {
      message: `🚨 ¡Ha emergido un nuevo Asedio ${diffBadge}: ${target.name} (${scaledMaxHp.toLocaleString()} HP)!`
    });
    return res.json({ success: true, boss: db.data.raid_boss, catalog: RAID_BOSS_CATALOG });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// GUILD RAIDS (JEFES DE GREMIO ASÍNCRONOS): ASALTO 60s, HITOS Y TIENDA
// =========================================================================

export const GUILD_SHOP_ITEMS = [
  {
    id: 'gshop_potion_dps',
    name: 'Elixir de Asedio del Coloso',
    description: '+25% de Daño en Raids de Gremio por 1 hora.',
    cost_tokens: 40,
    icon: '🧪'
  },
  {
    id: 'gshop_forge_stone',
    name: 'Piedra de Forja Rúnica',
    description: 'Piedra alquímica para forjar y refinar artefactos superiores.',
    cost_tokens: 80,
    icon: '💎'
  },
  {
    id: 'gshop_relic_chest',
    name: 'Cofre de Reliquias de Asedio',
    description: 'Contiene un artefacto Legendario o Mítico garantizado con afijos de raid.',
    cost_tokens: 150,
    icon: '📦'
  },
  {
    id: 'gshop_title_colossus',
    name: 'Título: "Martillo de Colosos"',
    description: 'Título honorífico de hermandad. +10% de daño permanente en Raids.',
    cost_tokens: 250,
    icon: '👑'
  }
];

// GET /api/v1/player/raid/guild-state - Estado completo del Asedio de Gremio
router.get('/raid/guild-state', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id) || user;

    if (!db.data.raid_boss || !db.data.raid_boss.element) {
      const def = RAID_BOSS_CATALOG[0];
      db.data.raid_boss = {
        ...def,
        current_hp: def.max_hp,
        is_defeated: false,
        total_attacks: 0,
        top_contributors: [],
        phase: 1,
        difficulty: 'NORMAL',
        player_combat_states: {}
      };
      await db.save();
    }

    const boss = db.data.raid_boss;
    const totalHp = boss.max_hp || 1;
    const currentHp = boss.current_hp || 0;
    const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / totalHp) * 100)));

    // Gestión de Intentos Diarios (3 al día según fecha YYYY-MM-DD)
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!db.data.global_states) db.data.global_states = [];
    if (!(db.data as any).raid_daily_attempts) (db.data as any).raid_daily_attempts = {};
    const attemptsMap = (db.data as any).raid_daily_attempts;

    if (!attemptsMap[user.id] || attemptsMap[user.id].date !== todayStr) {
      attemptsMap[user.id] = {
        date: todayStr,
        attempts_left: 3,
        total_session_damage: 0
      };
      await db.save();
    }
    const playerAttempts = attemptsMap[user.id];

    // Inicializar claimed_milestones en el boss si no existe
    if (!(boss as any).claimed_milestones) {
      (boss as any).claimed_milestones = { '75': [], '50': [], '25': [], '0': [] };
    }
    const claimedMap = (boss as any).claimed_milestones;

    const milestones = [
      {
        id: '75',
        targetPercent: 75,
        label: '75% de Vida del Coloso',
        description: 'La vanguardia de la hermandad resquebraja la primera armadura.',
        isReached: hpPercent <= 75,
        hasClaimed: (claimedMap['75'] || []).includes(user.id),
        reward: { gold: 300, xp: 500, guild_tokens: 35 }
      },
      {
        id: '50',
        targetPercent: 50,
        label: '50% de Vida (Fase de Furia)',
        description: 'El coloso ruge desatando su poder. El gremio resiste la embestida.',
        isReached: hpPercent <= 50,
        hasClaimed: (claimedMap['50'] || []).includes(user.id),
        reward: { gold: 600, xp: 900, guild_tokens: 70 }
      },
      {
        id: '25',
        targetPercent: 25,
        label: '25% de Vida (Resistencia Final)',
        description: 'El núcleo rúnico del coloso se expone. El golpe de gracia es inminente.',
        isReached: hpPercent <= 25,
        hasClaimed: (claimedMap['25'] || []).includes(user.id),
        reward: { gold: 1000, xp: 1500, guild_tokens: 120 }
      },
      {
        id: '0',
        targetPercent: 0,
        label: 'Derrota del Coloso',
        description: '¡Victoria total del gremio! La bestia colosal yace derribada.',
        isReached: boss.is_defeated || currentHp === 0,
        hasClaimed: (claimedMap['0'] || []).includes(user.id),
        reward: { gold: 2000, xp: 3000, guild_tokens: 250, isItem: true }
      }
    ];

    // Ranking de contribuidores con medallas
    const rawContributors = [...(boss.top_contributors || [])].sort((a, b) => b.damage - a.damage);
    const topContributors = rawContributors.slice(0, 15).map((c, index) => {
      const sharePct = boss.max_hp > 0 ? Math.round((c.damage / boss.max_hp) * 1000) / 10 : 0;
      return {
        ...c,
        rank: index + 1,
        medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎖️',
        sharePct
      };
    });

    const userContribution = rawContributors.find((c) => c.player_id === user.id);
    const userRank = userContribution ? rawContributors.findIndex((c) => c.player_id === user.id) + 1 : null;

    return res.json({
      success: true,
      boss: {
        ...boss,
        hpPercent
      },
      catalog: RAID_BOSS_CATALOG,
      milestones,
      dailyAttempts: {
        attempts_left: playerAttempts.attempts_left,
        max_attempts: 3,
        date: playerAttempts.date,
        total_session_damage: playerAttempts.total_session_damage
      },
      topContributors,
      playerStats: {
        personalDamage: userContribution ? userContribution.damage : 0,
        rank: userRank,
        guild_tokens: freshUser.guild_tokens || 0
      },
      guildShop: GUILD_SHOP_ITEMS
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/raid/start-assault - Solicitar inicio de sesión de 60s
router.post('/raid/start-assault', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const todayStr = new Date().toISOString().slice(0, 10);

    if (!(db.data as any).raid_daily_attempts) (db.data as any).raid_daily_attempts = {};
    const attemptsMap = (db.data as any).raid_daily_attempts;

    if (!attemptsMap[user.id] || attemptsMap[user.id].date !== todayStr) {
      attemptsMap[user.id] = { date: todayStr, attempts_left: 3, total_session_damage: 0 };
      await db.save();
    }

    const playerAttempts = attemptsMap[user.id];
    if (playerAttempts.attempts_left <= 0) {
      return res.status(403).json({ error: 'Has agotado tus 3 intentos de asalto diarios. Se reiniciarán a medianoche.' });
    }

    const boss = db.data.raid_boss;
    if (boss && boss.is_defeated) {
      return res.status(400).json({ error: 'El Coloso actual ya ha sido derrotado. Reclama tus recompensas o espera al próximo reinicio.' });
    }

    return res.json({
      success: true,
      message: '⚔️ ¡Asalto al Coloso iniciado! Tienes 60 segundos para maximizar tu daño.',
      attempts_left: playerAttempts.attempts_left,
      duration_sec: 60
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/raid/finish-assault - Reportar resultado del asalto de 60s
router.post('/raid/finish-assault', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser) return res.status(404).json({ error: 'Jugador no encontrado' });

    const { sessionDamage = 0, attacksCount = 1, critsCount = 0 } = req.body;
    const cleanDamage = Math.max(0, Math.min(250000, Number(sessionDamage) || 0));

    const todayStr = new Date().toISOString().slice(0, 10);
    if (!(db.data as any).raid_daily_attempts) (db.data as any).raid_daily_attempts = {};
    const attemptsMap = (db.data as any).raid_daily_attempts;

    if (!attemptsMap[user.id] || attemptsMap[user.id].date !== todayStr) {
      attemptsMap[user.id] = { date: todayStr, attempts_left: 3, total_session_damage: 0 };
    }

    const playerAttempts = attemptsMap[user.id];
    if (playerAttempts.attempts_left <= 0) {
      return res.status(403).json({ error: 'No dispones de intentos de asalto el día de hoy.' });
    }

    // Descontar 1 intento y registrar daño
    playerAttempts.attempts_left = Math.max(0, playerAttempts.attempts_left - 1);
    playerAttempts.total_session_damage += cleanDamage;

    const boss = db.data.raid_boss;
    if (boss) {
      boss.current_hp = Math.max(0, (boss.current_hp || 0) - cleanDamage);
      boss.total_attacks = (boss.total_attacks || 0) + (Number(attacksCount) || 1);

      // Actualizar ranking de contribuidores
      if (!boss.top_contributors) boss.top_contributors = [];
      const contributor = boss.top_contributors.find((c) => c.player_id === user.id);
      if (contributor) {
        contributor.damage += cleanDamage;
      } else {
        boss.top_contributors.push({ player_id: user.id, player_name: user.name, damage: cleanDamage });
      }
      boss.top_contributors.sort((a, b) => b.damage - a.damage);

      // Verificar derrota
      if (boss.current_hp === 0 && !boss.is_defeated) {
        boss.is_defeated = true;
        boss.defeated_at = new Date().toISOString();
        sseHub.broadcast('party_updated', {
          message: `🏆 ¡EL COLOSO ${boss.name} HA SIDO DERROTADO! ¡Gloria a toda la hermandad!`
        });
      }
    }

    // Otorgar recompensas del asalto: Fichas de Gremio, Oro y XP
    const tokensEarned = Math.max(12, Math.floor(cleanDamage / 50));
    const goldEarned = Math.max(30, Math.floor(cleanDamage / 20));
    const xpEarned = Math.max(50, Math.floor(cleanDamage / 15));

    freshUser.guild_tokens = (freshUser.guild_tokens || 0) + tokensEarned;
    freshUser.gold = (freshUser.gold || 0) + goldEarned;
    freshUser.xp = (freshUser.xp || 0) + xpEarned;

    recordPlayerActivity(user.id, 'boss_attacks', attacksCount || 1);
    recordPlayerActivity(user.id, 'boss_damage', cleanDamage);
    if (critsCount > 0) recordPlayerActivity(user.id, 'crit_hits', critsCount);

    await db.save();

    sseHub.broadcast('party_updated', {
      message: `⚔️ [Raid] ¡${user.name} completó un Asalto infligiendo ${cleanDamage.toLocaleString()} DMG al Coloso!`
    });

    return res.json({
      success: true,
      cleanDamage,
      tokensEarned,
      goldEarned,
      xpEarned,
      attempts_left: playerAttempts.attempts_left,
      guild_tokens: freshUser.guild_tokens,
      boss: db.data.raid_boss
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/raid/claim-milestone - Reclamar cofre de hito comunitario (-25% vida)
router.post('/raid/claim-milestone', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser) return res.status(404).json({ error: 'Jugador no encontrado' });

    const { milestoneId } = req.body;
    if (!['75', '50', '25', '0'].includes(milestoneId)) {
      return res.status(400).json({ error: 'Identificador de hito inválido (75, 50, 25, 0).' });
    }

    const boss = db.data.raid_boss;
    if (!boss) return res.status(400).json({ error: 'No hay Coloso activo.' });

    const totalHp = boss.max_hp || 1;
    const currentHp = boss.current_hp || 0;
    const hpPercent = Math.round((currentHp / totalHp) * 100);

    const targetPct = Number(milestoneId);
    const isReached = targetPct === 0 ? (boss.is_defeated || currentHp === 0) : hpPercent <= targetPct;

    if (!isReached) {
      return res.status(400).json({ error: `El gremio aún no ha alcanzado este hito (${targetPct}% de vida restante).` });
    }

    if (!(boss as any).claimed_milestones) (boss as any).claimed_milestones = { '75': [], '50': [], '25': [], '0': [] };
    const claimedList: string[] = (boss as any).claimed_milestones[milestoneId] || [];

    if (claimedList.includes(user.id)) {
      return res.status(400).json({ error: 'Ya has reclamado las recompensas de este hito comunitario.' });
    }

    claimedList.push(user.id);
    (boss as any).claimed_milestones[milestoneId] = claimedList;

    let rewardGold = 300;
    let rewardXp = 500;
    let rewardTokens = 35;
    let droppedItem = null;

    if (milestoneId === '75') {
      rewardGold = 300; rewardXp = 500; rewardTokens = 35;
    } else if (milestoneId === '50') {
      rewardGold = 600; rewardXp = 900; rewardTokens = 70;
    } else if (milestoneId === '25') {
      rewardGold = 1000; rewardXp = 1500; rewardTokens = 120;
    } else if (milestoneId === '0') {
      rewardGold = 2000; rewardXp = 3000; rewardTokens = 250;
      droppedItem = generateProceduralItem({
        playerLevel: freshUser.level || 1,
        rarity: 'LEGENDARY',
        source: 'BOSS_DROP'
      });
      if (!db.data.inventory) db.data.inventory = [];
      db.data.inventory.push({
        id: `inv_milestone_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        player_id: user.id,
        item_id: droppedItem.id,
        is_equipped: false,
        purchased_at: new Date().toISOString()
      });
    }

    freshUser.gold = (freshUser.gold || 0) + rewardGold;
    freshUser.xp = (freshUser.xp || 0) + rewardXp;
    freshUser.guild_tokens = (freshUser.guild_tokens || 0) + rewardTokens;

    await db.save();

    return res.json({
      success: true,
      message: `🎁 ¡Cofre de Hito ${milestoneId}% reclamado! +${rewardGold}🪙, +${rewardXp}XP, +${rewardTokens} Fichas de Gremio${droppedItem ? ` y ${droppedItem.name}` : ''}.`,
      rewardGold,
      rewardXp,
      rewardTokens,
      droppedItem,
      guild_tokens: freshUser.guild_tokens
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/raid/shop-buy - Canjear Fichas de Gremio en la Tienda de Hermandad
router.post('/raid/shop-buy', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser) return res.status(404).json({ error: 'Jugador no encontrado' });

    const { itemId } = req.body;
    const shopItem = GUILD_SHOP_ITEMS.find((it) => it.id === itemId);
    if (!shopItem) return res.status(404).json({ error: 'Artículo no encontrado en la Tienda de Hermandad.' });

    const userTokens = freshUser.guild_tokens || 0;
    if (userTokens < shopItem.cost_tokens) {
      return res.status(400).json({ error: `Fichas de Gremio insuficientes. Requiere ${shopItem.cost_tokens} 🪙.` });
    }

    // Descontar fichas
    freshUser.guild_tokens = userTokens - shopItem.cost_tokens;

    // Entregar ítem según el tipo
    if (shopItem.id === 'gshop_relic_chest') {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (freshUser.last_guild_chest_claim_at === todayStr) {
        return res.status(400).json({ error: '⚠️ El Cofre de Reliquias del Gremio solo puede ser reclamado 1 vez por día.' });
      }
      freshUser.last_guild_chest_claim_at = todayStr;

      const generatedRelic = generateProceduralItem({
        playerLevel: freshUser.level || 1,
        source: 'CLAN_WAR',
        minRarityRank: 6 // Garantiza rareza mayor a 5 (Mítica o superior)
      });
      if (!db.data.inventory) db.data.inventory = [];
      db.data.inventory.push({
        id: `inv_gshop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        player_id: user.id,
        item_id: generatedRelic.id,
        is_equipped: false,
        purchased_at: new Date().toISOString()
      });
    } else if (shopItem.id === 'gshop_title_colossus') {
      freshUser.title = 'Martillo de Colosos';
      freshUser.equipped_title = 'Martillo de Colosos';
    }

    await db.save();

    return res.json({
      success: true,
      message: `✨ ¡Has adquirido "${shopItem.name}" en la Tienda de Hermandad!`,
      guild_tokens: freshUser.guild_tokens
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/player/territories - Zonas, buffs y control territorial
router.get('/territories', async (req, res: Response) => {
  try {
    const db = await getDb();
    const now = Date.now();
    const territories = (db.data.territories || []).map((t) => {
      const lastPayout = new Date(t.last_payout_at || now).getTime();
      const elapsedHours = Math.max(0, (now - lastPayout) / 3600000);
      const generated = Math.floor(elapsedHours * ((t.daily_gold_rate || 150) / 24));
      return {
        ...t,
        accumulated_gold: (t.accumulated_gold || 0) + generated
      };
    });
    return res.json({ success: true, territories });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/player/clans - Lista de Clanes del Gremio
router.get('/clans', async (req, res: Response) => {
  try {
    const db = await getDb();
    return res.json({ success: true, clans: db.data.clans || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware);

// GET /api/v1/player/me
router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    // Refresh user record from DB
    const freshUser = await db.get('SELECT * FROM players WHERE id = ?', [user.id]);

    // Fetch inventory
    const inventory = await db.all(
      `SELECT i.id as inventory_id, i.is_equipped, i.purchased_at,
              it.id as item_id, it.name, it.description, it.gold_cost, it.effect_type
       FROM inventory i
       JOIN items it ON i.item_id = it.id
       WHERE i.player_id = ? AND i.consumed_at IS NULL`,
      [user.id]
    );

    // Fetch recent 10 scan logs
    const scanLogs = await db.all(
      `SELECT * FROM scan_logs WHERE player_id = ? ORDER BY created_at DESC LIMIT 10`,
      [user.id]
    );

    const u = freshUser || user;
    return res.json({
      player: {
        id: u.id,
        name: u.name,
        username: u.username,
        secretClass: u.secret_class,
        secret_class: u.secret_class,
        role: u.role,
        xp: u.xp,
        gold: u.gold,
        level: u.level,
        nfcUid: u.nfc_uid,
        nfc_uid: u.nfc_uid,
        privateToken: u.private_token,
        streak_days: u.streak_days || 0,
        last_daily_claim_at: u.last_daily_claim_at,
        pvp_wins: u.pvp_wins || 0,
        pvp_losses: u.pvp_losses || 0,
        title: u.title || 'Novicio Sediento',
        duel_disabled_until: u.duel_disabled_until
      },
      inventory,
      scanLogs
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/daily-claim (Medalla Diaria Móvil PWA)
router.post('/daily-claim', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = await db.get('SELECT * FROM players WHERE id = ?', [user.id]);
    const u = freshUser || user;

    const now = new Date();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    if (u.last_daily_claim_at) {
      const lastClaim = new Date(u.last_daily_claim_at).getTime();
      if (now.getTime() - lastClaim < twentyFourHoursMs) {
        const remainingHours = ((twentyFourHoursMs - (now.getTime() - lastClaim)) / (1000 * 60 * 60)).toFixed(1);
        return res.status(400).json({ error: `La Medalla Diaria ya fue reclamada. Regresa en ${remainingHours}h.` });
      }
    }

    const newXp = u.xp + 15;
    const newGold = u.gold + 5;
    const newStreak = (u.streak_days || 0) + 1;
    const newLevel = Math.max(1, 1 + Math.floor(newXp / 250));
    const nowIso = now.toISOString();

    await db.run(
      'UPDATE players SET xp = ?, gold = ?, level = ?, streak_days = ?, last_daily_claim_at = ? WHERE id = ?',
      [newXp, newGold, newLevel, newStreak, nowIso, u.id]
    );

    sseHub.broadcast('party_updated', { message: `¡${u.name} reclamó su Medalla Diaria (+15 XP, +5 Oro)! Racha: ${newStreak} días 🔥` });

    return res.json({
      message: `¡Medalla Diaria Reclamada! +15 XP, +5 Oro. Racha actual: ${newStreak} días 🔥`,
      xp: newXp,
      gold: newGold,
      level: newLevel,
      streakDays: newStreak,
      last_daily_claim_at: nowIso,
      gainedXp: 15,
      gainedGold: 5
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/pvp/challenge (Enviar Desafío 1v1 Pendiente)
router.post('/pvp/challenge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { opponentId, wager = 10 } = req.body;
    if (!opponentId) return res.status(400).json({ error: 'opponentId es requerido' });

    const user = req.user!;
    if (user.id === opponentId) return res.status(400).json({ error: 'No puedes desafiarte a ti mismo' });

    const db = await getDb();
    const opponent = await db.get('SELECT * FROM players WHERE id = ?', [opponentId]);
    if (!opponent) return res.status(404).json({ error: 'Oponente no encontrado' });

    const numericWager = Math.max(1, parseInt(wager) || 10);

    if (user.gold < numericWager) {
      return res.status(400).json({ error: `Oro insuficiente para apostar. Tienes ${user.gold}G, apuestas ${numericWager}G.` });
    }

    const challengeId = 'ch_' + crypto.randomUUID().slice(0, 8);
    const challengeObj = {
      id: challengeId,
      challenger_id: user.id,
      challenger_name: user.name,
      opponent_id: opponent.id,
      opponent_name: opponent.name,
      wager: numericWager,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };

    if (db.data && db.data.pvp_challenges) {
      db.data.pvp_challenges.push(challengeObj as any);
      if (typeof (db as any).save === 'function') (db as any).save();
    }

    // Broadcast SSE to notify opponent & TV Mode
    sseHub.broadcast('pvp_challenge_created', {
      challengeId,
      challengerId: user.id,
      challengerName: user.name,
      opponentId: opponent.id,
      opponentName: opponent.name,
      wager: numericWager
    });

    return res.json({
      message: `Desafío 1v1 enviado a ${opponent.name} por ${numericWager} de Oro. Esperando que acepte...`,
      challengeId
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/player/pvp/challenges (Desafíos 1v1 Pendientes)
router.get('/pvp/challenges', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;

    const challenges = (db.data.pvp_challenges || []).filter(
      (c: any) => c.opponent_id === user.id && c.status === 'PENDING'
    );

    return res.json({ challenges });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/pvp/accept (Aceptar Desafío 1v1)
router.post('/pvp/accept', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeId } = req.body;
    if (!challengeId) return res.status(400).json({ error: 'challengeId requerido' });

    const db = await getDb();
    const user = req.user!;

    const challenge = (db.data.pvp_challenges || []).find(
      (c: any) => c.id === challengeId && c.opponent_id === user.id && c.status === 'PENDING'
    );

    if (!challenge) {
      return res.status(404).json({ error: 'Desafío no encontrado o ya expirado/resuelto' });
    }

    challenge.status = 'ACCEPTED';
    if (typeof (db as any).save === 'function') (db as any).save();

    // Resolve PvP Duel
    const result = await resolvePvPDuel(challenge.challenger_id, challenge.opponent_id, challenge.wager);

    sseHub.broadcast('pvp_challenge_accepted', {
      challengeId,
      result
    });

    return res.json({ message: '¡Duelo Aceptado! Combate en curso...', result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/pvp/decline (Rechazar Desafío 1v1)
router.post('/pvp/decline', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeId } = req.body;
    if (!challengeId) return res.status(400).json({ error: 'challengeId requerido' });

    const db = await getDb();
    const user = req.user!;

    const challenge = (db.data.pvp_challenges || []).find(
      (c: any) => c.id === challengeId && c.opponent_id === user.id && c.status === 'PENDING'
    );

    if (challenge) {
      challenge.status = 'DECLINED';
      if (typeof (db as any).save === 'function') (db as any).save();

      sseHub.broadcast('pvp_challenge_declined', {
        challengeId,
        challengerId: challenge.challenger_id,
        opponentName: user.name
      });
    }

    return res.json({ message: 'Desafío rechazado.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/player/shop/items
router.get('/shop/items', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slot } = req.query;
    const db = await getDb();
    let items = (db.data.items || []).filter((i) => i.is_active_in_shop);

    if (slot && typeof slot === 'string' && slot !== 'ALL') {
      items = items.filter((i) => i.slot === slot.toUpperCase());
    }

    // Check discounts: territory (10%) + talent bonuses (Bard: 15%, Rogue: 10%)
    const user = req.user;
    let discountPct = 0;
    if (user) {
      const member = (db.data.clan_members || []).find((m) => m.player_id === user.id);
      if (member) {
        const barra = (db.data.territories || []).find((t) => t.id === 'ter_01');
        if (barra && barra.controlling_clan_id === member.clan_id) {
          discountPct += 10;
        }
      }
      const talents = (db.data.talents || []).filter((t) => t.player_id === user.id);
      if (talents.some((t) => t.talent_id === 'brd_def_1')) discountPct += 15;
      if (talents.some((t) => t.talent_id === 'rog_sup_2')) discountPct += 10;
    }

    const hasDiscount = discountPct > 0;
    if (hasDiscount) {
      const multiplier = 1 - Math.min(0.5, discountPct / 100);
      items = items.map((i) => ({
        ...i,
        original_cost: i.gold_cost,
        gold_cost: Math.max(1, Math.round(i.gold_cost * multiplier))
      }));
    }

    return res.json({ success: true, items, hasDiscount, discountPct });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/shop/buy
router.post('/shop/buy', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId requerido' });

    const db = await getDb();
    const item = (db.data.items || []).find((i) => i.id === itemId && i.is_active_in_shop);
    if (!item) return res.status(404).json({ error: 'Ítem no disponible en la tienda' });

    const user = req.user!;
    const freshUser = (db.data.players || []).find((p) => p.id === user.id);
    if (!freshUser) return res.status(404).json({ error: 'Jugador no encontrado' });

    // Calculate effective cost with territory & talent discounts
    let discountPct = 0;
    const member = (db.data.clan_members || []).find((m) => m.player_id === user.id);
    if (member) {
      const barra = (db.data.territories || []).find((t) => t.id === 'ter_01');
      if (barra && barra.controlling_clan_id === member.clan_id) {
        discountPct += 10;
      }
    }
    const talents = (db.data.talents || []).filter((t) => t.player_id === user.id);
    if (talents.some((t) => t.talent_id === 'brd_def_1')) discountPct += 15;
    if (talents.some((t) => t.talent_id === 'rog_sup_2')) discountPct += 10;

    const multiplier = 1 - Math.min(0.5, discountPct / 100);
    const effectiveCost = Math.max(1, Math.round(item.gold_cost * multiplier));

    if (freshUser.gold < effectiveCost) {
      return res.status(400).json({ error: `Oro insuficiente. Requieres ${effectiveCost} 🪙, posees ${freshUser.gold} 🪙.` });
    }

    freshUser.gold -= effectiveCost;
    const inventoryId = 'inv_' + crypto.randomUUID();
    if (!db.data.inventory) db.data.inventory = [];

    db.data.inventory.push({
      id: inventoryId,
      player_id: freshUser.id,
      item_id: item.id,
      is_equipped: false,
      purchased_at: new Date().toISOString()
    });

    db.save();
    recordPlayerActivity(user.id, 'gold_spent', effectiveCost);
    return res.json({
      success: true,
      message: `¡Compraste con éxito ${item.name}!`,
      remainingGold: freshUser.gold,
      inventoryId,
      item
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/shop/sell/:inventoryId - Vender ítem al mercader por oro
router.post('/shop/sell/:inventoryId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { inventoryId } = req.params;
    const db = await getDb();
    const user = req.user!;

    const invIndex = (db.data.inventory || []).findIndex(
      (i) => i.id === inventoryId && i.player_id === user.id && !i.consumed_at
    );
    if (invIndex === -1) {
      return res.status(404).json({ error: 'Ítem no encontrado en tu mochila' });
    }

    const invItem = db.data.inventory[invIndex];
    if (invItem.is_equipped) {
      return res.status(400).json({ error: 'Debes desequipar el ítem antes de venderlo' });
    }

    const itemDef = (db.data.items || []).find((i) => i.id === invItem.item_id);
    const sellGold = itemDef?.sell_value || Math.max(1, Math.floor((itemDef?.gold_cost || 10) / 2));

    // Remove from inventory
    db.data.inventory.splice(invIndex, 1);

    // Credit gold to player
    const freshUser = (db.data.players || []).find((p) => p.id === user.id);
    if (freshUser) {
      freshUser.gold = (freshUser.gold || 0) + sellGold;
    }

    db.save();
    return res.json({
      success: true,
      message: `¡Vendiste ${itemDef?.name || 'el objeto'} al mercader por +${sellGold} 🪙!`,
      goldEarned: sellGold,
      currentGold: freshUser?.gold || user.gold
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/items/generate-procedural - Forjar o Descubrir Ítem Procedural
router.post('/items/generate-procedural', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { rarity, slot, source, elementalTheme, forcedPerkId } = req.body;

    const proceduralItem = generateProceduralItem({
      playerLevel: user.level || 1,
      rarity,
      slot,
      source: source || 'CHEST',
      elementalTheme,
      classReq: ((user.secret_class || 'WARRIOR').toUpperCase()) as any,
      forcedPerkId
    });

    if (!db.data.items) db.data.items = [];
    db.data.items.push(proceduralItem);

    if (!db.data.inventory) db.data.inventory = [];
    const invId = 'inv_' + crypto.randomUUID();
    db.data.inventory.push({
      id: invId,
      player_id: user.id,
      item_id: proceduralItem.id,
      is_equipped: false,
      purchased_at: new Date().toISOString()
    });

    db.save();
    return res.json({
      success: true,
      item: proceduralItem,
      inventory_id: invId,
      message: `¡Has obtenido ${proceduralItem.name} (${proceduralItem.rarity})!`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// HITO 2: MISIONES DIARIAS, SEMANALES & GRAN BÓVEDA
// ==========================================
router.get('/quests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const questData = await getPlayerQuests(user.id);
    return res.json({ success: true, ...questData });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/quests/:id/claim', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const result = await claimQuestReward(user.id, req.params.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/quests/vault/open', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const result = await openGrandVault(user.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// HITO 5: FORJA, DESGUACE Y SETS DE EQUIPO
// ==========================================
router.post('/forge/salvage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { inventoryId } = req.body;
    const result = await salvageItem(user.id, inventoryId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.post('/forge/refine', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { inventoryId } = req.body;
    const result = await refineItem(user.id, inventoryId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/sets/active', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const userInv = (db.data.inventory || []).filter((i) => i.player_id === user.id && i.is_equipped);
    const equippedItemRows: ItemRow[] = [];
    for (const inv of userInv) {
      const it = (db.data.items || []).find((x) => x.id === inv.item_id);
      if (it) equippedItemRows.push(it);
    }
    const setAnalysis = calculateActiveSets(equippedItemRows);
    return res.json({ success: true, ...setAnalysis });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/inventory/use-consumable/:inventoryId - Usar poción o elixir
router.post('/inventory/use-consumable/:inventoryId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { inventoryId } = req.params;
    const db = await getDb();
    const user = req.user!;

    const invItem = (db.data.inventory || []).find(
      (i) => i.id === inventoryId && i.player_id === user.id && !i.consumed_at
    );
    if (!invItem) {
      return res.status(404).json({ error: 'Poción o consumible no disponible' });
    }

    const item = (db.data.items || []).find((i) => i.id === invItem.item_id);
    if (!item || item.slot !== 'CONSUMABLE') {
      return res.status(400).json({ error: 'Este ítem no se puede beber o consumir directamente' });
    }

    // Mark as consumed
    invItem.consumed_at = new Date().toISOString();
    invItem.is_equipped = false;

    const freshUser = (db.data.players || []).find((p) => p.id === user.id);
    let effectMsg = `Bebiste ${item.name}.`;

    if (item.effect_type === 'XP_ELIXIR') {
      const bonusXp = 40;
      if (freshUser) freshUser.xp = (freshUser.xp || 0) + bonusXp;
      effectMsg = `¡Bebiste ${item.name}! Has absorbido +${bonusXp} XP instantáneamente.`;
    } else if (item.effect_type === 'ANTI_FUMBLE') {
      effectMsg = `¡Activaste ${item.name}! La protección arcana salvará tu próxima pifia (1 -> 10).`;
    } else if (item.effect_type === 'FORTUNE_DICE') {
      effectMsg = `¡Lanzas ${item.name}! En tu próximo escaneo rodarás 2d20 con ventaja.`;
    } else if (item.effect_type === 'RESONANCE') {
      const bonusXp = 30;
      if (freshUser) freshUser.xp = (freshUser.xp || 0) + bonusXp;
      effectMsg = `¡Resonancia activada con ${item.name}! +${bonusXp} XP para ti y bendición compartida.`;
    } else if (item.effect_type === 'CURSED_BLOOD_PACT') {
      const bonusGold = 45;
      if (freshUser) freshUser.gold = (freshUser.gold || 0) + bonusGold;
      effectMsg = `¡Pacto de Sangre sellado! Recibiste +${bonusGold} 🪙 a cambio de tu juramento de combate.`;
    }

    db.save();
    return res.json({
      success: true,
      message: effectMsg,
      currentGold: freshUser?.gold,
      currentXp: freshUser?.xp
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/inventory/equip - Equipar por ranura (Paper Doll)
router.post('/inventory/equip', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { inventoryId } = req.body;
    if (!inventoryId) return res.status(400).json({ error: 'inventoryId requerido' });

    const db = await getDb();
    const user = req.user!;
    const freshUser = (db.data.players || []).find((p) => p.id === user.id) || user;

    const invItem = (db.data.inventory || []).find(
      (i) => i.id === inventoryId && i.player_id === user.id && !i.consumed_at
    );
    if (!invItem) {
      return res.status(404).json({ error: 'Ítem de inventario no encontrado o ya consumido' });
    }

    const itemDef = (db.data.items || []).find((i) => i.id === invItem.item_id);
    if (!itemDef) {
      return res.status(404).json({ error: 'Definición de ítem no encontrada' });
    }

    // Level check
    if (itemDef.required_level > (freshUser.level || 1)) {
      return res.status(400).json({
        error: `Nivel insuficiente. Requiere Nivel ${itemDef.required_level}, tienes Nivel ${freshUser.level || 1}.`
      });
    }

    // Class requirement check
    if (itemDef.class_req && itemDef.class_req !== 'ALL' && itemDef.class_req !== freshUser.secret_class) {
      return res.status(400).json({
        error: `Requisito de clase: Solo un ${itemDef.class_req} puede equipar este objeto (eres ${freshUser.secret_class}).`
      });
    }

    const willEquip = !invItem.is_equipped;

    if (willEquip) {
      // Slot-based auto unequip: if an item is already equipped in the SAME slot, unequip it
      const targetSlot = itemDef.slot || 'CONSUMABLE';
      (db.data.inventory || []).forEach((otherInv) => {
        if (otherInv.player_id === user.id && otherInv.is_equipped && !otherInv.consumed_at) {
          const otherDef = (db.data.items || []).find((d) => d.id === otherInv.item_id);
          if (otherDef && (otherDef.slot || 'CONSUMABLE') === targetSlot) {
            otherInv.is_equipped = false;
          }
        }
      });
      invItem.is_equipped = true;
    } else {
      invItem.is_equipped = false;
    }

    db.save();
    return res.json({
      success: true,
      message: willEquip ? `¡Equipaste ${itemDef.name} en la ranura ${itemDef.slot}!` : `Desequipaste ${itemDef.name}`,
      isEquipped: willEquip,
      slot: itemDef.slot
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/player/events (SSE)
router.get('/events', (req: AuthenticatedRequest, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = 'player_' + crypto.randomUUID();
  sseHub.addClient({ id: clientId, role: 'PLAYER', res });
});


// GET /api/v1/player/titles (50 Catalog Titles)
router.get('/titles', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const allTitles = await db.all('SELECT * FROM titles');
    const unlocked = await db.all('SELECT title_id FROM player_titles WHERE player_id = ?', [user.id]);
    const unlockedIds = new Set(unlocked.map((r: any) => r.title_id));

    // Ensure default titles like Novato are unlocked for all
    unlockedIds.add('title_02');

    const result = allTitles.map((t: any) => ({
      ...t,
      unlocked: unlockedIds.has(t.id),
      isEquipped: user.title === t.name || user.equipped_title === t.id
    }));

    return res.json({ titles: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/titles/equip
router.post('/titles/equip', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { titleId } = req.body;
    if (!titleId) return res.status(400).json({ error: 'titleId requerido' });

    const db = await getDb();
    const user = req.user!;

    const targetTitle = await db.get('SELECT * FROM titles WHERE id = ?', [titleId]);
    if (!targetTitle) return res.status(404).json({ error: 'Título no encontrado' });

    await db.run('UPDATE players SET title = ?, equipped_title = ? WHERE id = ?', [targetTitle.name, targetTitle.id, user.id]);

    sseHub.broadcast('party_updated', { message: `¡${user.name} equipó el nuevo título: ${targetTitle.name}! 👑` });

    return res.json({ message: `Título equipados: ${targetTitle.name}`, equippedTitle: targetTitle.name });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/player/quests (Daily Quests)
router.get('/quests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const quests = await db.all('SELECT * FROM daily_quests');

    const userQuests = quests.map((q: any) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      rewardXp: q.reward_xp,
      rewardGold: q.reward_gold,
      progress: user.pvp_wins || 0,
      targetValue: q.target_value,
      isCompleted: (user.pvp_wins || 0) >= q.target_value,
      isClaimed: false
    }));

    return res.json({ quests: userQuests });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// V1.5.0: TABERNA SHOUTS & MERCADO P2P
// ==========================================
router.post('/tavern/shouts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'El grito no puede estar vacío.' });
    }
    const cleanMsg = message.trim().slice(0, 140);
    const shout = {
      id: 'shout_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      player_id: user.id,
      player_name: user.name,
      secret_class: user.secret_class || 'WARRIOR',
      title: user.title || 'Aventurero',
      message: cleanMsg,
      created_at: new Date().toISOString()
    };
    db.data.tavern_shouts.unshift(shout);
    if (db.data.tavern_shouts.length > 100) db.data.tavern_shouts.pop();
    db.save();
    sseHub.broadcast('party_updated', { message: `📜 [Muro Taberna] ${user.name}: "${cleanMsg}"` });
    return res.json({ success: true, shout });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/market/list', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { inventory_id, gold_price } = req.body;
    const price = Math.floor(Number(gold_price));
    if (!price || price <= 0) return res.status(400).json({ error: 'Precio en oro no válido' });
    const invItem = db.data.inventory.find((i) => i.id === inventory_id && i.player_id === user.id && !i.consumed_at);
    if (!invItem) return res.status(404).json({ error: 'Ítem no encontrado en tu inventario' });
    if (invItem.is_equipped) return res.status(400).json({ error: 'Desequipa el ítem antes de ponerlo en venta' });
    const itemDef = db.data.items.find((it) => it.id === invItem.item_id);
    if (!itemDef) return res.status(404).json({ error: 'Definición de ítem no encontrada' });

    // Marcar como en venta (consumido temporalmente)
    invItem.consumed_at = new Date().toISOString();
    const listing = {
      id: 'mkt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      seller_id: user.id,
      seller_name: user.name,
      item_id: itemDef.id,
      item_name: itemDef.name,
      item_description: itemDef.description,
      item_icon: '📦',
      gold_price: price,
      status: 'ACTIVE' as const,
      created_at: new Date().toISOString()
    };
    db.data.market_listings.push(listing);
    db.save();
    sseHub.broadcast('party_updated', { message: `⚖️ [Mercado P2P] ${user.name} puso a la venta "${itemDef.name}" por ${price} 🪙` });
    return res.json({ success: true, listing });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/market/buy/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const listingId = req.params.id;
    const listing = db.data.market_listings.find((m) => m.id === listingId && m.status === 'ACTIVE');
    if (!listing) return res.status(404).json({ error: 'Oferta no disponible o ya vendida' });
    if (listing.seller_id === user.id) return res.status(400).json({ error: 'No puedes comprar tu propia oferta' });

    const buyer = db.data.players.find((p) => p.id === user.id);
    if (!buyer || buyer.gold < listing.gold_price) {
      return res.status(400).json({ error: 'No tienes suficiente oro para esta compra' });
    }

    buyer.gold -= listing.gold_price;
    const seller = db.data.players.find((p) => p.id === listing.seller_id);
    if (seller) seller.gold += listing.gold_price;

    listing.status = 'SOLD';
    listing.buyer_id = user.id;

    db.data.inventory.push({
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      player_id: user.id,
      item_id: listing.item_id,
      is_equipped: false,
      purchased_at: new Date().toISOString()
    });

    db.save();
    sseHub.broadcast('party_updated', { message: `🤝 ¡${user.name} compró "${listing.item_name}" de ${listing.seller_name} por ${listing.gold_price} 🪙!` });
    return res.json({ success: true, message: `¡Has adquirido ${listing.item_name}!`, remaining_gold: buyer.gold });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ==========================================
// V2.0.0: COOPERATIVE RAID BOSS TÁCTICO
router.post('/raid/attack', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const boss = db.data.raid_boss;
    if (!boss || boss.is_defeated) {
      return res.status(400).json({ error: 'El Raid Boss ya ha sido derrotado o aún no ha aparecido.', boss });
    }

    const { ability } = req.body; // 'BASIC' | 'CLASS_SPECIAL'
    const playerClass = ((user.secret_class || 'WARRIOR').toUpperCase()) as 'WARRIOR' | 'MAGE' | 'ROGUE' | 'BARD';

    // 1. Estadísticas de equipamiento activo & Sets
    const userInv = (db.data.inventory || []).filter((i) => i.player_id === user.id && i.is_equipped);
    let equippedAtk = 0;
    let equippedDef = 0;
    const equippedItemRows: ItemRow[] = [];
    for (const inv of userInv) {
      const item = (db.data.items || []).find((it) => it.id === inv.item_id);
      if (item) {
        equippedItemRows.push(item);
        if (item.stat_atk) equippedAtk += item.stat_atk;
        if (item.stat_def) equippedDef += item.stat_def;
      }
    }

    const { bonuses: setBonuses } = calculateActiveSets(equippedItemRows);
    if (setBonuses.atk) equippedAtk += setBonuses.atk;
    if (setBonuses.def) equippedDef += setBonuses.def;

    // 2. Control de Estado de Combate del Jugador (HP, Estamina, Knockout)
    const combatState = getOrInitPlayerCombatState(user.id, user.level || 1, equippedDef, boss);
    const now = Date.now();

    // Validar si el jugador está incapacitado (Knocked Out)
    if (combatState.knocked_out_until) {
      const remainingSec = Math.ceil((new Date(combatState.knocked_out_until).getTime() - now) / 1000);
      if (remainingSec > 0) {
        return res.status(400).json({
          error: `¡Has caído en combate! Espera ${remainingSec}s para reanimarte o paga 10 🪙 al Tabernero.`,
          combatState,
          isKnockedOut: true,
          remainingSec
        });
      }
    }

    // Validar costo de estamina y cooldown
    const isSpecial = ability === 'CLASS_SPECIAL';
    const staminaCost = isSpecial ? 40 : 20;

    if (combatState.stamina < staminaCost) {
      return res.status(400).json({
        error: `Estamina insuficiente (${combatState.stamina}/${staminaCost}). Toma un respiro para recuperar energía.`,
        combatState
      });
    }

    if (isSpecial) {
      if (combatState.special_cooldown_until && combatState.special_cooldown_until > now) {
        const cdRemaining = Math.ceil((combatState.special_cooldown_until - now) / 1000);
        return res.status(400).json({
          error: `Habilidad Especial en recarga. Disponible en ${cdRemaining}s.`,
          combatState
        });
      }
      combatState.special_cooldown_until = now + 10000; // 10s cooldown
    }

    combatState.stamina -= staminaCost;

    // 3. Bonificaciones del árbol de talentos de clase
    const userTalents = (db.data.talents || []).filter((t) => t.player_id === user.id);
    const classTree = CLASS_SKILL_TREES[playerClass] || CLASS_SKILL_TREES.WARRIOR;
    let talentAtk = 0;
    let talentRaidDmgPct = setBonuses.raid_dmg_pct || 0;
    let talentCritPct = setBonuses.crit_pct || 0;
    let talentD20Bonus = setBonuses.d20_bonus || 0;
    let talentGoldPct = setBonuses.gold_pct || 0;

    for (const t of userTalents) {
      for (const b of classTree.branches) {
        const node = b.nodes.find((n) => n.id === t.talent_id);
        if (node && node.stat_bonus) {
          if (node.stat_bonus.atk) talentAtk += node.stat_bonus.atk * (t.points || 1);
          if (node.stat_bonus.raid_dmg_pct) talentRaidDmgPct += node.stat_bonus.raid_dmg_pct * (t.points || 1);
          if (node.stat_bonus.crit_pct) talentCritPct += node.stat_bonus.crit_pct * (t.points || 1);
          if (node.stat_bonus.d20_bonus) talentD20Bonus += node.stat_bonus.d20_bonus * (t.points || 1);
          if (node.stat_bonus.gold_pct) talentGoldPct += node.stat_bonus.gold_pct * (t.points || 1);
        }
      }
    }

    // 4. Tirada D20 con mecánicas de clase
    let rawRoll = Math.floor(Math.random() * 20) + 1;
    // Pícaro: Bomba de Humo (relanza si es menor a 6)
    if (playerClass === 'ROGUE' && userTalents.some((t) => t.talent_id === 'rog_def_2') && rawRoll < 6) {
      rawRoll = Math.floor(Math.random() * 20) + 1;
    }
    let roll = Math.min(20, Math.max(1, rawRoll + talentD20Bonus));
    // Guerrero: Escudo Inflexible (Pifia D20=1 se convierte en 8 seguro)
    if (playerClass === 'WARRIOR' && userTalents.some((t) => t.talent_id === 'war_def_2') && roll === 1) {
      roll = 8;
    }

    // 5. Determinación de Impacto y Multiplicadores
    const isRogueCrit = playerClass === 'ROGUE' && (userTalents.some((t) => t.talent_id === 'rog_atk_2') ? roll >= 18 : roll >= 19);
    const isSpecialCrit = isSpecial && playerClass === 'ROGUE' && roll >= 16;
    const isCrit = (roll === 20) || isRogueCrit || isSpecialCrit;
    const isFumble = roll === 1;

    let multiplier = 1.0;
    let tierName = '⚔️ Impacto Directo';
    let tierKey: 'FUMBLE' | 'GRAZE' | 'SOLID' | 'CRUSHING' | 'CRIT' = 'SOLID';

    if (isCrit) {
      multiplier = (playerClass === 'ROGUE' && userTalents.some((t) => t.talent_id === 'rog_atk_3')) ? 3.0 : 2.5;
      tierName = '💥 ¡IMPACTO CRÍTICO DEVASTADOR!';
      tierKey = 'CRIT';
    } else if (isFumble) {
      multiplier = 0.25;
      tierName = '💨 ¡PIFIA FATAL! (El ataque se desvió)';
      tierKey = 'FUMBLE';
      if (playerClass === 'BARD' && userTalents.some((t) => t.talent_id === 'brd_def_3')) {
        const freshUser = db.data.players.find((p) => p.id === user.id);
        if (freshUser) freshUser.gold += 15;
      }
    } else if (roll <= 7) {
      multiplier = 0.55 + (roll * 0.04);
      tierName = '🗡️ Golpe Rozado';
      tierKey = 'GRAZE';
    } else if (roll <= 14) {
      multiplier = 1.0 + ((roll - 8) * 0.06);
      tierName = '⚔️ Impacto Certero';
      tierKey = 'SOLID';
    } else {
      multiplier = 1.45 + ((roll - 14) * 0.1);
      tierName = '⚡ ¡Golpe Demoledor!';
      tierKey = 'CRUSHING';
    }

    // Bonificación táctica de habilidad especial de clase
    let abilityFlavor = '';
    if (isSpecial) {
      if (playerClass === 'WARRIOR') {
        multiplier *= 1.35;
        abilityFlavor = '🛡️ [Embate Sísmico] ¡Rompió la postura del Boss!';
      } else if (playerClass === 'MAGE') {
        multiplier *= 1.45;
        boss.vulnerable_turns = 2;
        abilityFlavor = '🔥 [Piroexplosión Arcana] ¡Vulnerable por 2 turnos (+25% daño)!';
      } else if (playerClass === 'ROGUE') {
        multiplier *= 1.30;
        abilityFlavor = '🗡️ [Puñalada Trapera] ¡Golpe furtivo a puntos vitales!';
      } else if (playerClass === 'BARD') {
        multiplier *= 1.25;
        abilityFlavor = '🎺 [Himno de Guerra] ¡Inspiración que revitaliza a la party!';
      }
    }

    if (boss.vulnerable_turns && boss.vulnerable_turns > 0) {
      multiplier *= 1.25;
      boss.vulnerable_turns -= 1;
      tierName += ' ⚡ [VULNERABLE]';
    }

    // 6. Cálculo del daño infligido al Boss & Absorción de Escudo
    const basePower = 35 + ((user.level || 1) * 7) + equippedAtk + talentAtk;
    let finalDamage = Math.max(15, Math.round(basePower * multiplier * (1 + (talentRaidDmgPct / 100))));

    let damageToBossHp = finalDamage;
    let shieldAbsorbed = 0;
    if (boss.shield_hp && boss.shield_hp > 0) {
      if (finalDamage >= boss.shield_hp) {
        shieldAbsorbed = boss.shield_hp;
        damageToBossHp = finalDamage - boss.shield_hp;
        boss.shield_hp = 0;
        boss.vulnerable_turns = 2;
        tierName += ' 🛡️💥 ¡ESCUDO RÚNICO DESTRUIDO!';
      } else {
        boss.shield_hp -= finalDamage;
        shieldAbsorbed = finalDamage;
        damageToBossHp = 0;
        tierName += ` 🛡️ [Escudo absorbió ${shieldAbsorbed} dmg]`;
      }
    }

    boss.current_hp = Math.max(0, boss.current_hp - damageToBossHp);
    boss.total_attacks = (boss.total_attacks || 0) + 1;

    // 7. CONTRAATAQUE Y DAÑO DEL BOSS AL JUGADOR
    const diff = boss.difficulty || 'NORMAL';
    const diffMult = diff === 'MYTHIC' ? 2.2 : diff === 'HEROIC' ? 1.5 : 1.0;
    let bossStrikeDamage = Math.round((14 + ((boss.level || 30) * 0.35)) * diffMult);
    bossStrikeDamage = Math.max(8, Math.round(bossStrikeDamage * (0.85 + Math.random() * 0.3)));

    let defenseMitigationText = '';
    if (combatState.is_defending) {
      bossStrikeDamage = Math.max(3, Math.round(bossStrikeDamage * 0.25));
      defenseMitigationText = ' 🛡️ [¡BLOQUEO EXITOSO! Mitigado 75%]';
      combatState.is_defending = false;
    }

    // Acumulación de ira y Furia del Boss
    const rageIncrement = diff === 'MYTHIC' ? 20 : diff === 'HEROIC' ? 16 : 12;
    boss.rage_meter = Math.min(100, (boss.rage_meter || 0) + rageIncrement);
    let bossCounterAttackDesc = '';

    if (boss.rage_meter >= 100 && boss.current_hp > 0) {
      boss.rage_meter = 0;
      bossStrikeDamage = Math.round(bossStrikeDamage * 1.8);
      const cry = boss.combat_cries?.half_hp || '¡Sentid la cólera del abismo!';
      bossCounterAttackDesc = `💥 ¡${boss.name} desata su FURIA LETAL: "${cry}" e inflige ${bossStrikeDamage} DMG!`;
      boss.last_boss_action = bossCounterAttackDesc;
      sseHub.broadcast('party_updated', { message: bossCounterAttackDesc });
    }

    // Aplicar daño del contraataque a la salud de combate del jugador
    combatState.hp = Math.max(0, combatState.hp - bossStrikeDamage);
    let playerKnockedOut = false;
    if (combatState.hp === 0) {
      playerKnockedOut = true;
      combatState.knocked_out_until = new Date(Date.now() + 25000).toISOString();
      sseHub.broadcast('party_updated', {
        message: `💀 ¡${user.name} ha caído en combate ante el embate de ${boss.name}! Requiere reanimación.`
      });
    }

    // Registrar actividad en misiones
    recordPlayerActivity(user.id, 'boss_attacks', 1);
    recordPlayerActivity(user.id, 'boss_damage', finalDamage);
    if (isCrit) recordPlayerActivity(user.id, 'crit_hits', 1);
    if (roll >= 12) recordPlayerActivity(user.id, 'd20_high_rolls', 1);

    // Activación de Fase 2 (Furia 50% HP)
    if (boss.current_hp > 0 && boss.current_hp <= Math.round(boss.max_hp * 0.5) && boss.phase === 1) {
      boss.phase = 2;
      sseHub.broadcast('party_updated', {
        message: `🔥 [Raid] ¡${boss.name} ENTRA EN FASE DE FURIA! (+50% botín y rugido aterrador)`
      });
    }

    // Ranking de contribuidores
    if (!boss.top_contributors) boss.top_contributors = [];
    const contributor = boss.top_contributors.find((c) => c.player_id === user.id);
    if (contributor) {
      contributor.damage += finalDamage;
    } else {
      boss.top_contributors.push({ player_id: user.id, player_name: user.name, damage: finalDamage });
    }
    boss.top_contributors.sort((a, b) => b.damage - a.damage);

    // Recompensas si el Boss cae derrotado
    let defeatedReward = null;
    let nextBoss = null;
    if (boss.current_hp === 0) {
      boss.is_defeated = true;
      boss.defeated_at = new Date().toISOString();
      const freshUser = db.data.players.find((p) => p.id === user.id);
      let rewardGold = boss.reward_gold;
      let rewardXp = boss.reward_xp;

      if (playerClass === 'BARD' && userTalents.some((t) => t.talent_id === 'brd_sup_3')) {
        rewardGold = Math.round(rewardGold * 1.5);
        rewardXp = Math.round(rewardXp * 1.5);
      }

      if (freshUser) {
        freshUser.gold += rewardGold;
        freshUser.xp += rewardXp;
      }

      const bossElement = (boss.element || 'GENERAL').toUpperCase() as any;
      const droppedItem = generateProceduralItem({
        playerLevel: user.level || 1,
        source: 'BOSS_DROP',
        elementalTheme: bossElement,
        classReq: playerClass
      });

      if (!db.data.items) db.data.items = [];
      db.data.items.push(droppedItem);

      if (!db.data.inventory) db.data.inventory = [];
      const dropInvId = 'inv_' + crypto.randomUUID();
      db.data.inventory.push({
        id: dropInvId,
        player_id: user.id,
        item_id: droppedItem.id,
        is_equipped: false,
        purchased_at: new Date().toISOString()
      });

      const bossMaterials: Record<string, { id: string; name: string; icon: string }> = {
        FUEGO: { id: 'mat_ignis_scale', name: 'Escama de Dragón de Obsidiana', icon: '🔥' },
        VENENO: { id: 'mat_malakor_miasma', name: 'Frasco de Miasma Maldito', icon: '💀' },
        TIERRA: { id: 'mat_aurelius_rune', name: 'Núcleo de Runa Titánica', icon: '🗿' },
        HIELO: { id: 'mat_kaelith_ice', name: 'Esencia de Escarcha Eterna', icon: '❄️' }
      };
      const matDef = bossMaterials[bossElement] || { id: 'mat_boss_trophy', name: 'Trofeo del Asedio', icon: '🏆' };
      const matItem: ItemRow = {
        id: matDef.id,
        name: matDef.name,
        description: `Material mítico de forja despojado tras la caída de ${boss.name}.`,
        slot: 'CONSUMABLE',
        rarity: 'EPIC',
        gold_cost: 65,
        sell_value: 30,
        required_level: 1,
        icon: matDef.icon,
        effect_type: 'BOSS_CRAFT_MATERIAL',
        is_active_in_shop: false
      };
      if (!db.data.items.find((i) => i.id === matItem.id)) db.data.items.push(matItem);
      db.data.inventory.push({
        id: 'inv_' + crypto.randomUUID(),
        player_id: user.id,
        item_id: matItem.id,
        is_equipped: false,
        purchased_at: new Date().toISOString()
      });

      defeatedReward = {
        gold: rewardGold,
        xp: rewardXp,
        item: droppedItem,
        material: matItem
      };

      recordPlayerActivity(user.id, 'boss_kills', 1);

      const currentIdx = RAID_BOSS_CATALOG.findIndex((b) => b.id === boss.id);
      const nextIdx = (currentIdx + 1) % RAID_BOSS_CATALOG.length;
      nextBoss = RAID_BOSS_CATALOG[nextIdx];
    }

    db.save();
    const killMsg = defeatedReward?.item
      ? ` 👑 ¡${user.name} ASESINÓ AL BOSS y despojó [${defeatedReward.item.name}] (${defeatedReward.item.rarity})!`
      : '';

    sseHub.broadcast('party_updated', {
      message: `⚔️ [Raid] ¡${user.name} atacó con D20=[${roll}] e infligió ${finalDamage} de daño! (Recibió -${bossStrikeDamage} DMG${defenseMitigationText}) ${tierName}${killMsg}`
    });

    return res.json({
      success: true,
      roll,
      damage: finalDamage,
      isCrit,
      isFumble,
      rollTier: tierKey,
      tierName,
      abilityFlavor,
      bossHp: boss.current_hp,
      maxHp: boss.max_hp,
      isDefeated: boss.is_defeated,
      phase: boss.phase || 1,
      rageMeter: boss.rage_meter || 0,
      vulnerableTurns: boss.vulnerable_turns || 0,
      lastBossAction: bossCounterAttackDesc || boss.last_boss_action,
      defeatedReward,
      nextBoss,
      combatState,
      playerDamageTaken: bossStrikeDamage,
      defenseMitigationText,
      playerKnockedOut
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/raid/action - Acciones tácticas de Guardia y Reanimación en Asedio
router.post('/raid/action', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const boss = db.data.raid_boss;
    if (!boss || boss.is_defeated) {
      return res.status(400).json({ error: 'No hay asedio activo en este momento.' });
    }

    const { action } = req.body; // 'DEFEND' | 'REVIVE_TAVERN'
    const userInv = (db.data.inventory || []).filter((i) => i.player_id === user.id && i.is_equipped);
    let defStat = 0;
    for (const inv of userInv) {
      const item = (db.data.items || []).find((it) => it.id === inv.item_id);
      if (item && item.stat_def) defStat += item.stat_def;
    }

    const combatState = getOrInitPlayerCombatState(user.id, user.level || 1, defStat, boss);

    if (action === 'DEFEND') {
      if (combatState.knocked_out_until) {
        return res.status(400).json({ error: 'Estás incapacitado y no puedes ponerte en guardia.' });
      }
      if (combatState.stamina < 15) {
        return res.status(400).json({ error: 'Estamina insuficiente para alzar la guardia (requiere 15).' });
      }
      combatState.stamina -= 15;
      combatState.is_defending = true;
      db.save();
      return res.json({
        success: true,
        message: '🛡️ ¡Te has colocado en Guardia Táctica! El próximo golpe del boss será mitigado en 75%.',
        combatState
      });
    }

    if (action === 'REVIVE_TAVERN') {
      const freshUser = db.data.players.find((p) => p.id === user.id);
      if (!freshUser || freshUser.gold < 10) {
        return res.status(400).json({ error: 'Necesitas al menos 10 🪙 de oro para que Valerius te reanime.' });
      }
      freshUser.gold -= 10;
      combatState.hp = Math.round(combatState.max_hp * 0.6);
      combatState.stamina = 70;
      combatState.knocked_out_until = null;
      db.save();
      sseHub.broadcast('party_updated', {
        message: `🍺 ¡${user.name} pagó 10 🪙 al tabernero y se reincorporó a la batalla!`
      });
      return res.json({
        success: true,
        message: '🍺 ¡Valerius te arrojó un trago de hidromiel fuerte! Te levantas con 60% HP.',
        combatState,
        remainingGold: freshUser.gold
      });
    }

    return res.status(400).json({ error: 'Acción de combate desconocida.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// V2.2.0: ÁRBOL DE TALENTOS POR CLASE & FORJA
// ==========================================
router.get('/talents', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const playerClass = ((user.secret_class || 'WARRIOR').toUpperCase()) as 'WARRIOR' | 'MAGE' | 'ROGUE' | 'BARD';
    const classTree = CLASS_SKILL_TREES[playerClass] || CLASS_SKILL_TREES.WARRIOR;
    const userTalents = (db.data.talents || []).filter((t) => t.player_id === user.id);
    const spentPoints = userTalents.reduce((sum, t) => sum + (t.points || 1), 0);
    const availablePoints = Math.max(0, (user.level || 1) - spentPoints);

    return res.json({
      success: true,
      playerClass,
      classTree,
      talents: userTalents,
      availablePoints,
      spentPoints,
      playerLevel: user.level || 1
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/talents/allocate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { talent_id } = req.body;
    if (!talent_id) {
      return res.status(400).json({ error: 'talent_id es requerido' });
    }

    const playerClass = ((user.secret_class || 'WARRIOR').toUpperCase()) as 'WARRIOR' | 'MAGE' | 'ROGUE' | 'BARD';
    const classTree = CLASS_SKILL_TREES[playerClass] || CLASS_SKILL_TREES.WARRIOR;

    let targetNode = null;
    let targetBranch = null;
    for (const b of classTree.branches) {
      const found = b.nodes.find((n) => n.id === talent_id);
      if (found) {
        targetNode = found;
        targetBranch = b;
        break;
      }
    }

    if (!targetNode || !targetBranch) {
      return res.status(404).json({ error: 'Nodo de talento no encontrado para tu clase' });
    }

    const userTalents = (db.data.talents || []).filter((t) => t.player_id === user.id);
    const spentPoints = userTalents.reduce((sum, t) => sum + (t.points || 1), 0);
    if (spentPoints >= (user.level || 1)) {
      return res.status(400).json({ error: '¡No tienes puntos de talento disponibles! Sube de nivel para obtener más.' });
    }

    // Requisito de tier:
    const branchPoints = userTalents
      .filter((t) => targetBranch.nodes.some((n) => n.id === t.talent_id))
      .reduce((sum, t) => sum + (t.points || 1), 0);

    if (targetNode.tier === 2 && branchPoints < 1) {
      return res.status(400).json({ error: 'Requiere al menos 1 punto asignado en esta rama' });
    }
    if (targetNode.tier === 3 && branchPoints < 2) {
      return res.status(400).json({ error: 'Requiere al menos 2 puntos asignados en esta rama' });
    }

    let existing = userTalents.find((t) => t.talent_id === talent_id);
    if (existing) {
      if (existing.points >= targetNode.max_points) {
        return res.status(400).json({ error: 'Este nodo ya ha alcanzado su nivel máximo' });
      }
      existing.points += 1;
    } else {
      if (!db.data.talents) db.data.talents = [];
      db.data.talents.push({
        id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        player_id: user.id,
        branch: targetBranch.name,
        tier: targetNode.tier,
        points: 1,
        talent_id: targetNode.id
      });
    }

    db.save();
    const newSpent = spentPoints + 1;
    const remainingPoints = Math.max(0, (user.level || 1) - newSpent);
    return res.json({
      success: true,
      message: `¡Desbloqueaste "${targetNode.name}"!`,
      remainingPoints
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/talents/reset', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    db.data.talents = (db.data.talents || []).filter((t) => t.player_id !== user.id);
    db.save();
    return res.json({
      success: true,
      message: '¡Puntos de talento reestablecidos con éxito!',
      availablePoints: user.level || 1
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/forge/runic', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { rune_type } = req.body; // 'FIRE' | 'FORTUNE' | 'PROTECTION'
    const forgeCost = 25;

    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser || freshUser.gold < forgeCost) {
      return res.status(400).json({ error: `La Forja de Runas requiere ${forgeCost} 🪙 de oro.` });
    }

    freshUser.gold -= forgeCost;
    db.save();
    sseHub.broadcast('party_updated', { message: `🔥 [Forja] ¡${user.name} imbuyó su equipo con Runas de Poder Arcano!` });
    return res.json({ success: true, message: `¡Equipo imbuido con Runa ${rune_type || 'Arcana'}!`, remainingGold: freshUser.gold });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// V2.5.0: COMPAÑEROS MÍSTICOS (PETS) & LIAR'S DICE
// ==========================================
router.get('/pets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const catalog = [
      { type: 'WOLF', name: '🐺 Lobo Sombra', bonus: '+10% Daño en Duelos', cost: 75 },
      { type: 'PHOENIX', name: '🦅 Fénix Enano', bonus: '+15% XP en Misiones', cost: 100 },
      { type: 'GOBLIN', name: '🪙 Duende Avaro', bonus: '+20% Oro en Tiradas', cost: 90 }
    ];
    const userPets = (db.data.pets || []).filter((p) => p.player_id === user.id);
    return res.json({ success: true, catalog, userPets });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/pets/adopt', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { pet_type } = req.body;
    const petDefs: Record<string, any> = {
      WOLF: { name: '🐺 Lobo Sombra', cost: 75, bonusType: 'CRIT_CHANCE', bonusVal: 5 },
      PHOENIX: { name: '🦅 Fénix Enano', cost: 100, bonusType: 'XP_BOOST', bonusVal: 15 },
      GOBLIN: { name: '🪙 Duende Avaro', cost: 90, bonusType: 'GOLD_BOOST', bonusVal: 20 }
    };
    const def = petDefs[pet_type];
    if (!def) return res.status(400).json({ error: 'Tipo de mascota desconocido' });

    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser || freshUser.gold < def.cost) {
      return res.status(400).json({ error: `Oro insuficiente. Cuesta ${def.cost} 🪙.` });
    }

    freshUser.gold -= def.cost;
    const pet = {
      id: 'pet_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      player_id: user.id,
      pet_type,
      name: def.name,
      level: 1,
      bonus_type: def.bonusType,
      bonus_value: def.bonusVal,
      is_active: true,
      feed_count: 0
    };
    if (!db.data.pets) db.data.pets = [];
    db.data.pets.push(pet);
    db.save();
    sseHub.broadcast('party_updated', { message: `🐾 ¡${user.name} adoptó un ${def.name}!` });
    return res.json({ success: true, pet, remainingGold: freshUser.gold });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/minigame/liars-dice', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const wager = Math.max(5, Math.min(100, Number(req.body.wager || 10)));
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser || freshUser.gold < wager) {
      return res.status(400).json({ error: `Oro insuficiente para apostar ${wager} 🪙.` });
    }

    // Roll 3 dice for player and 3 for Tavern Master
    const playerDice = [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
    const tavernDice = [1, 2, 3].map(() => Math.floor(Math.random() * 6) + 1);
    const playerTotal = playerDice.reduce((a, b) => a + b, 0);
    const tavernTotal = tavernDice.reduce((a, b) => a + b, 0);
    const won = playerTotal >= tavernTotal;

    if (won) {
      freshUser.gold += wager;
    } else {
      freshUser.gold -= wager;
    }
    db.save();

    return res.json({
      success: true,
      won,
      playerDice,
      tavernDice,
      playerTotal,
      tavernTotal,
      goldChange: won ? `+${wager}` : `-${wager}`,
      currentGold: freshUser.gold
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// V3.0.0: GUERRA DE CLANES & TERRITORIOS
// ==========================================
router.post('/clans/create', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { name, tag, emblem } = req.body;
    if (!name || !tag) return res.status(400).json({ error: 'Nombre y Tag de Clan requeridos' });

    const createCost = 100;
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser || freshUser.gold < createCost) {
      return res.status(400).json({ error: `Crear un Clan cuesta ${createCost} 🪙 de oro.` });
    }

    freshUser.gold -= createCost;
    const clan = {
      id: 'clan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: String(name).trim().slice(0, 30),
      tag: String(tag).trim().toUpperCase().slice(0, 5),
      description: 'Hermandad de aventureros de la taberna.',
      leader_id: user.id,
      treasury_gold: 0,
      level: 1,
      clan_xp: 0,
      clan_xp_next: 1000,
      emblem: emblem || '⚔️',
      perks_unlocked: [],
      created_at: new Date().toISOString()
    };
    if (!db.data.clans) db.data.clans = [];
    db.data.clans.push(clan);
    if (!db.data.clan_members) db.data.clan_members = [];
    db.data.clan_members.push({
      id: 'cm_' + Date.now(),
      clan_id: clan.id,
      player_id: user.id,
      player_name: user.name,
      role: 'LEADER',
      contribution_points: 0,
      joined_at: new Date().toISOString()
    });
    db.save();
    sseHub.broadcast('party_updated', { message: `🚩 ¡${user.name} fundó el Clan [${clan.tag}] ${clan.name}!` });
    return res.json({ success: true, clan, remainingGold: freshUser.gold });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// V3.0.0: SISTEMA PROFUNDO DE CLANES & ASEDIO SEMANAL
// ==========================================

// GET /api/v1/player/clans/my-clan - Obtener datos del clan del usuario
router.get('/clans/my-clan', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const member = (db.data.clan_members || []).find((m) => m.player_id === user.id);
    if (!member) {
      return res.json({ success: true, inClan: false });
    }

    const clan = (db.data.clans || []).find((c) => c.id === member.clan_id);
    if (!clan) {
      return res.json({ success: true, inClan: false });
    }

    const allMembers = (db.data.clan_members || []).filter((m) => m.clan_id === clan.id);
    return res.json({
      success: true,
      inClan: true,
      clan,
      member,
      allMembers
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/clans/donate - Donar oro al banco del clan
router.post('/clans/donate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const amount = Math.floor(Number(req.body.amount || 0));
    if (amount <= 0) return res.status(400).json({ error: 'Monto inválido para donar' });

    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser || freshUser.gold < amount) {
      return res.status(400).json({ error: 'No tienes suficiente oro para esta donación.' });
    }

    const member = (db.data.clan_members || []).find((m) => m.player_id === user.id);
    if (!member) return res.status(400).json({ error: 'Debes pertenecer a un Clan para donar.' });

    const clan = (db.data.clans || []).find((c) => c.id === member.clan_id);
    if (!clan) return res.status(404).json({ error: 'Clan no encontrado.' });

    freshUser.gold -= amount;
    clan.treasury_gold = (clan.treasury_gold || 0) + amount;
    member.contribution_points = (member.contribution_points || 0) + amount;

    db.save();
    sseHub.broadcast('party_updated', { message: `🪙 [Clan] ¡${user.name} donó ${amount} de oro a la Tesorería de [${clan.tag}]!` });
    return res.json({ success: true, treasury: clan.treasury_gold, userGold: freshUser.gold });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/clans/solo-raid/run - Ejecutar Mazmorra en Solitario (Diablo Rifts / Mu Blood Castle)
router.post('/clans/solo-raid/run', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { dungeon_id } = req.body;

    const dungeons: Record<string, { name: string; minLevel: number; dc: number[]; xp: number; gold: number; fame: number }> = {
      catacombs: { name: '💀 Las Catacumbas de Obsidiana', minLevel: 1, dc: [8, 11, 14], xp: 75, gold: 45, fame: 60 },
      sagrario: { name: '🩸 El Sagrario de Sangre', minLevel: 5, dc: [10, 13, 16], xp: 140, gold: 85, fame: 110 },
      chaos_rift: { name: '🔥 La Falla del Caos Abisal', minLevel: 10, dc: [12, 15, 18], xp: 260, gold: 160, fame: 200 }
    };

    const d = dungeons[dungeon_id || 'catacombs'] || dungeons['catacombs'];
    if ((user.level || 1) < d.minLevel) {
      return res.status(400).json({ error: `Nivel insuficiente. Requiere nivel ${d.minLevel}+ para entrar.` });
    }

    // 3 Rooms Simulation
    const roomLogs = [];
    let allCleared = true;

    for (let r = 0; r < 3; r++) {
      const roll = Math.floor(Math.random() * 20) + 1;
      const targetDc = d.dc[r];
      const levelBonus = Math.floor((user.level || 1) / 3);
      const total = roll + levelBonus;
      const isCrit = roll === 20;
      const passed = isCrit || total >= targetDc;

      roomLogs.push({
        room: r + 1,
        title: r === 0 ? 'Vanguardia' : r === 1 ? 'Élite Arcano' : 'Jefe de la Falla',
        roll,
        total,
        targetDc,
        passed,
        isCrit
      });

      if (!passed && !isCrit) {
        allCleared = false;
        break;
      }
    }

    const freshUser = db.data.players.find((p) => p.id === user.id);
    let loot = { xp: 0, gold: 0, fame: 0 };

    if (allCleared && freshUser) {
      const isFullVictory = roomLogs.length === 3 && roomLogs[2].passed;
      const critMultiplier = roomLogs.some((r) => r.isCrit) ? 1.5 : 1.0;
      loot.xp = Math.round(d.xp * critMultiplier);
      loot.gold = Math.round(d.gold * critMultiplier);
      loot.fame = Math.round(d.fame * critMultiplier);

      freshUser.xp += loot.xp;
      freshUser.gold += loot.gold;

      // Credit Clan Fame / XP
      const member = (db.data.clan_members || []).find((m) => m.player_id === user.id);
      if (member) {
        member.contribution_points = (member.contribution_points || 0) + loot.fame;
        const clan = (db.data.clans || []).find((c) => c.id === member.clan_id);
        if (clan) {
          clan.clan_xp = (clan.clan_xp || 0) + loot.fame;
          if (clan.clan_xp >= (clan.clan_xp_next || 1000)) {
            clan.level = (clan.level || 1) + 1;
            clan.clan_xp -= clan.clan_xp_next;
            clan.clan_xp_next = Math.round(clan.clan_xp_next * 1.5);
            sseHub.broadcast('party_updated', { message: `🎉 ¡El Clan [${clan.tag}] ${clan.name} subió al Nivel ${clan.level}!` });
          }
        }
      }
    }

    db.save();
    return res.json({
      success: true,
      dungeonName: d.name,
      cleared: allCleared,
      roomLogs,
      loot,
      currentUserGold: freshUser?.gold || 0
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// SOLO RAIDS INTERACTIVOS (SALA A SALA CON TÁCTICAS Y JEFES PROCEDURALES)
// =========================================================================

export const SOLO_RAID_DUNGEONS: Record<string, {
  id: string;
  name: string;
  minLevel: number;
  icon: string;
  theme: string;
  rooms: {
    title: string;
    description: string;
    enemyName: string;
    enemyIcon: string;
    baseDc: number;
    recommendedTactic: 'CHARGE' | 'STEALTH' | 'ARCANE';
  }[];
  baseGold: number;
  baseXp: number;
  baseFame: number;
}> = {
  catacombs: {
    id: 'catacombs',
    name: '💀 Catacumbas de Obsidiana',
    minLevel: 1,
    icon: '💀',
    theme: 'Criptas subterráneas de piedra volcánica',
    rooms: [
      {
        title: 'Sala 1: Vanguardia de Esqueletos',
        description: 'Una patrulla de lanceros no-muertos bloquea el corredor estrecho.',
        enemyName: 'Lancero Óseo',
        enemyIcon: '💀',
        baseDc: 8,
        recommendedTactic: 'CHARGE'
      },
      {
        title: 'Sala 2: Nigromante del Portal',
        description: 'Un hechicero de las sombras canaliza energía desde un altar agrietado.',
        enemyName: 'Nigromante de la Falla',
        enemyIcon: '🧙‍♂️',
        baseDc: 11,
        recommendedTactic: 'STEALTH'
      },
      {
        title: 'Sala 3: El Coloso de Huesos (Jefe)',
        description: 'Una masa titánica de osamentas soldadas con fuego oscuro despierta.',
        enemyName: 'Coloso de Osamenta',
        enemyIcon: '👑',
        baseDc: 14,
        recommendedTactic: 'ARCANE'
      }
    ],
    baseGold: 60,
    baseXp: 95,
    baseFame: 80
  },
  sagrario: {
    id: 'sagrario',
    name: '🩸 Sagrario de Sangre',
    minLevel: 5,
    icon: '🩸',
    theme: 'Capilla corrompida por sectarios vampíricos',
    rooms: [
      {
        title: 'Sala 1: Cultistas de la Niebla Carmesí',
        description: 'Adeptos con dagas envenenadas acechan entre las columnas.',
        enemyName: 'Acólito Sanguíneo',
        enemyIcon: '🗡️',
        baseDc: 10,
        recommendedTactic: 'STEALTH'
      },
      {
        title: 'Sala 2: Gárgola Bebe-Sangre',
        description: 'Una estatua alada cobra vida con garras empapadas en icor.',
        enemyName: 'Gárgola Carmesí',
        enemyIcon: '🗿',
        baseDc: 13,
        recommendedTactic: 'CHARGE'
      },
      {
        title: 'Sala 3: Condesa del Cáliz Negro (Jefe)',
        description: 'La señora vampírica levita envuelta en un aura de murciélagos voraces.',
        enemyName: 'Condesa Vampírica',
        enemyIcon: '👑',
        baseDc: 16,
        recommendedTactic: 'ARCANE'
      }
    ],
    baseGold: 120,
    baseXp: 180,
    baseFame: 150
  },
  chaos_rift: {
    id: 'chaos_rift',
    name: '🔥 Grieta del Caos Abisal',
    minLevel: 10,
    icon: '🔥',
    theme: 'Fisura dimensional que desgarra la realidad',
    rooms: [
      {
        title: 'Sala 1: Engendros de la Nada',
        description: 'Criaturas amorfas que devoran la luz del recinto.',
        enemyName: 'Parásito Astral',
        enemyIcon: '👾',
        baseDc: 12,
        recommendedTactic: 'ARCANE'
      },
      {
        title: 'Sala 2: Quimera de Magma y Vacío',
        description: 'Una bestia de tres cabezas llameantes custodiando el umbral.',
        enemyName: 'Quimera Abisal',
        enemyIcon: '🦁',
        baseDc: 15,
        recommendedTactic: 'CHARGE'
      },
      {
        title: 'Sala 3: Avatar del Caos Primigenio (Jefe)',
        description: 'Una entidad titánica hecha de fuego cósmico y distorsión gravitacional.',
        enemyName: 'Avatar del Caos',
        enemyIcon: '👑',
        baseDc: 18,
        recommendedTactic: 'STEALTH'
      }
    ],
    baseGold: 240,
    baseXp: 350,
    baseFame: 280
  }
};

// POST /api/v1/player/clans/solo-raid/room-action - Resolver sala táctica de incursión
router.post('/clans/solo-raid/room-action', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id) || user;
    const { dungeon_id = 'catacombs', room_index = 0, tactic = 'CHARGE' } = req.body;

    const dungeon = SOLO_RAID_DUNGEONS[dungeon_id] || SOLO_RAID_DUNGEONS.catacombs;
    if (user.level < dungeon.minLevel) {
      return res.status(403).json({ error: `Nivel insuficiente. Requiere nivel ${dungeon.minLevel}+.` });
    }

    const roomIdx = Math.max(0, Math.min(2, Number(room_index) || 0));
    const room = dungeon.rooms[roomIdx];

    // Tirada D20 + Bonos de Clase y Táctica
    const d20 = Math.floor(Math.random() * 20) + 1;
    const isCrit = d20 === 20;
    const isFumble = d20 === 1;

    let tacticBonus = 0;
    const playerClass = ((user.secret_class || 'WARRIOR').toUpperCase());

    if (tactic === 'CHARGE' && (playerClass.includes('WARRIOR') || playerClass.includes('GUERRERO'))) tacticBonus = 4;
    if (tactic === 'STEALTH' && (playerClass.includes('ROGUE') || playerClass.includes('PÍCARO'))) tacticBonus = 4;
    if (tactic === 'ARCANE' && (playerClass.includes('MAGE') || playerClass.includes('MAGO') || playerClass.includes('BARD'))) tacticBonus = 4;
    if (tactic === room.recommendedTactic) tacticBonus += 2; // Bono de afinidad con la sala

    const levelBonus = Math.floor(user.level / 2);
    const totalRoll = d20 + tacticBonus + levelBonus;
    const passed = isCrit || (!isFumble && totalRoll >= room.baseDc);

    let narrativeFlavor = '';
    if (isCrit) {
      narrativeFlavor = `🔥 ¡GOLPE CRÍTICO NAT 20! Con una maniobra legendaria, aniquilaste a ${room.enemyName} de un solo embate.`;
    } else if (passed) {
      narrativeFlavor = `⚔️ ¡Victoria! Con tu táctica de ${tactic}, superaste la defensa de ${room.enemyName} (Tirada: ${totalRoll} vs DC ${room.baseDc}).`;
    } else {
      narrativeFlavor = `🛡️ Tu embestida flaqueó ante ${room.enemyName} (Tirada: ${totalRoll} vs DC ${room.baseDc}). Recibes daño pero puedes reintentar.`;
    }

    const isFinalRoom = roomIdx === 2;
    let finalLoot = null;
    let droppedItem = null;

    if (passed && isFinalRoom) {
      const goldEarned = dungeon.baseGold + Math.round(Math.random() * 20);
      const xpEarned = dungeon.baseXp + Math.round(Math.random() * 30);
      const fameEarned = dungeon.baseFame;

      freshUser.gold = (freshUser.gold || 0) + goldEarned;
      freshUser.xp = (freshUser.xp || 0) + xpEarned;

      // Drop de artefacto garantizado al vencer al Jefe final de la incursión
      droppedItem = generateProceduralItem({
        playerLevel: user.level || 1,
        rarity: Math.random() < 0.35 ? 'LEGENDARY' : 'EPIC',
        source: 'BOSS_DROP'
      });

      if (!db.data.inventory) db.data.inventory = [];
      db.data.inventory.push({
        id: `inv_soloraid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        player_id: user.id,
        item_id: droppedItem.id,
        is_equipped: false,
        purchased_at: new Date().toISOString()
      });

      // Sumar Fama y XP al Clan
      const member = (db.data.clan_members || []).find((m) => m.player_id === user.id);
      if (member) {
        member.contribution_points = (member.contribution_points || 0) + fameEarned;
        const clan = (db.data.clans || []).find((c) => c.id === member.clan_id);
        if (clan) {
          clan.clan_xp = (clan.clan_xp || 0) + fameEarned;
          if (clan.clan_xp >= (clan.clan_xp_next || 1000)) {
            clan.level = (clan.level || 1) + 1;
            clan.clan_xp -= clan.clan_xp_next;
            clan.clan_xp_next = Math.round(clan.clan_xp_next * 1.5);
            sseHub.broadcast('party_updated', { message: `🎉 ¡El Clan [${clan.tag}] ${clan.name} ascendió al Nivel ${clan.level}!` });
          }
        }
      }

      finalLoot = {
        goldEarned,
        xpEarned,
        fameEarned,
        droppedItem
      };

      sseHub.broadcast('party_updated', {
        message: `👑 [Solo Raid] ¡${user.name} conquistó ${dungeon.name} derrotando a ${room.enemyName}! (+${goldEarned}🪙, +${fameEarned} Fama)`
      });
    }

    await db.save();

    return res.json({
      success: true,
      passed,
      isCrit,
      isFumble,
      d20,
      totalRoll,
      targetDc: room.baseDc,
      narrativeFlavor,
      nextRoomIndex: passed ? roomIdx + 1 : roomIdx,
      isCompleted: passed && isFinalRoom,
      finalLoot,
      currentUserGold: freshUser.gold
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// CLAN WARS: TIRÓN DE ESTANDARTE (TUG OF WAR 24H ASÍNCRONO)
// =========================================================================

interface TugOfWarState {
  warId: string;
  territoryName: string;
  clanA: { id: string; name: string; tag: string; emblem: string };
  clanB: { id: string; name: string; tag: string; emblem: string };
  flagPosition: number; // -100 (Victoria Clan A) a +100 (Victoria Clan B), 0 es neutral
  hoursRemaining: number;
  shieldWallClanA: boolean;
  shieldWallClanB: boolean;
  moraleBuffClanA: boolean;
  moraleBuffClanB: boolean;
  historyLogs: { timestamp: string; clanTag: string; playerName: string; text: string; deltaMeters: number }[];
}

let memoryTugOfWar: TugOfWarState | null = null;

function getOrInitTugOfWar(clans: any[]): TugOfWarState {
  if (!memoryTugOfWar) {
    const clanA = clans[0] || { id: 'clan_raven', name: 'Hermandad del Cuervo', tag: 'CRV', emblem: '🦅' };
    const clanB = clans[1] || { id: 'clan_wolves', name: 'Legión de los Lobos de Hierro', tag: 'WLF', emblem: '🐺' };

    memoryTugOfWar = {
      warId: `war_${Date.now()}`,
      territoryName: 'Fortaleza de Kal-Drakor',
      clanA: { id: clanA.id, name: clanA.name, tag: clanA.tag, emblem: clanA.emblem || '🦅' },
      clanB: { id: clanB.id, name: clanB.name, tag: clanB.tag, emblem: clanB.emblem || '🐺' },
      flagPosition: 0,
      hoursRemaining: 18,
      shieldWallClanA: false,
      shieldWallClanB: false,
      moraleBuffClanA: false,
      moraleBuffClanB: false,
      historyLogs: [
        {
          timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          clanTag: clanA.tag,
          playerName: 'Valerius',
          text: 'lanzó un embate con arietes de asedio',
          deltaMeters: -14
        }
      ]
    };
  }
  return memoryTugOfWar;
}

// GET /api/v1/player/clans/war/tug-of-war - Estado del campo de batalla 24h
router.get('/clans/war/tug-of-war', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const warState = getOrInitTugOfWar(db.data.clans || []);

    const member = (db.data.clan_members || []).find((m) => m.player_id === user.id);
    const myClan = member ? (db.data.clans || []).find((c) => c.id === member.clan_id) : null;

    return res.json({
      success: true,
      warState,
      myClanSide: myClan?.id === warState.clanB.id ? 'CLAN_B' : 'CLAN_A',
      myClan
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/clans/war/action - Ejecutar acción táctica de Tirón de Estandarte
router.post('/clans/war/action', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { actionType = 'PUSH_ASSAULT' } = req.body;

    const member = (db.data.clan_members || []).find((m) => m.player_id === user.id);
    if (!member) {
      return res.status(400).json({ error: '¡Debes pertenecer a un clan para combatir en la Guerra territorial!' });
    }

    const myClan = (db.data.clans || []).find((c) => c.id === member.clan_id);
    if (!myClan) return res.status(400).json({ error: 'Clan no encontrado.' });

    const war = getOrInitTugOfWar(db.data.clans || []);
    const isClanB = myClan.id === war.clanB.id;
    const direction = isClanB ? 1 : -1; // Clan B empuja hacia +100, Clan A empuja hacia -100

    const d20 = Math.floor(Math.random() * 20) + 1;
    const isCrit = d20 === 20;

    let deltaMeters = 0;
    let actionDesc = '';

    if (actionType === 'PUSH_ASSAULT') {
      // Empuje de daño: base 12m a 24m
      let basePush = Math.round(12 + Math.random() * 12 + (user.level * 0.4));
      if (isCrit) basePush = Math.round(basePush * 1.8);
      if (isClanB ? war.moraleBuffClanB : war.moraleBuffClanA) basePush = Math.round(basePush * 1.5);
      if (isClanB ? war.shieldWallClanA : war.shieldWallClanB) basePush = Math.round(basePush * 0.5); // Mitigado por escudo rival

      deltaMeters = basePush * direction;
      actionDesc = `lanzó una Acometida de Asalto con D20=[${d20}] empujando el estandarte ${basePush}m`;
    } else if (actionType === 'SHIELD_WALL') {
      // Activa escudo defensivo para el clan
      if (isClanB) war.shieldWallClanB = true; else war.shieldWallClanA = true;
      deltaMeters = Math.round(4 + Math.random() * 4) * direction;
      actionDesc = `plantó un Muro de Escudos férreo, frenando el avance rival un 50%`;
    } else if (actionType === 'SABOTAGE') {
      // Sabotaje a la retaguardia rival
      let sabotageMeters = Math.round(15 + Math.random() * 10);
      if (isCrit) sabotageMeters = Math.round(sabotageMeters * 1.6);
      deltaMeters = sabotageMeters * direction;
      actionDesc = `saboteó las catapultas enemigas, forzando un retroceso de ${sabotageMeters}m`;
    } else if (actionType === 'RALLY_MORALE') {
      // Arenga de moral
      if (isClanB) war.moraleBuffClanB = true; else war.moraleBuffClanA = true;
      deltaMeters = Math.round(6 + Math.random() * 5) * direction;
      actionDesc = `tocó el cuerno de guerra inspirando a la hermandad (+50% en el próximo embate)`;
    }

    war.flagPosition = Math.max(-100, Math.min(100, war.flagPosition + deltaMeters));

    // Registrar log
    war.historyLogs.unshift({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      clanTag: myClan.tag,
      playerName: user.name,
      text: actionDesc,
      deltaMeters
    });
    if (war.historyLogs.length > 15) war.historyLogs.pop();

    // Recompensar al jugador con Fama de Clan y oro
    const fameReward = Math.round(35 + Math.abs(deltaMeters) * 1.5);
    member.contribution_points = (member.contribution_points || 0) + fameReward;
    myClan.clan_xp = (myClan.clan_xp || 0) + fameReward;

    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (freshUser) freshUser.gold = (freshUser.gold || 0) + 25;

    await db.save();

    sseHub.broadcast('party_updated', {
      message: `🚩 [Guerra de Clanes] [${myClan.tag}] ${user.name} ${actionDesc}!`
    });

    return res.json({
      success: true,
      warState: war,
      d20,
      isCrit,
      deltaMeters,
      fameReward,
      message: `¡Acción de Guerra ejecutada! Aportaste ${fameReward} puntos de gloria a [${myClan.tag}].`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/territories/siege-action/:id - Carrera de Asedio Semanal a 1,000 Pts
router.post('/territories/siege-action/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const territoryId = req.params.id;
    const { action } = req.body; // 'RAM' | 'SPELL' | 'SABOTAGE' | 'RALLY'

    const territory = (db.data.territories || []).find((t) => t.id === territoryId);
    if (!territory) return res.status(404).json({ error: 'Territorio no encontrado' });

    const member = (db.data.clan_members || []).find((m) => m.player_id === user.id);
    if (!member) return res.status(400).json({ error: '¡Debes pertenecer a un Clan para participar en el asedio!' });

    const clan = (db.data.clans || []).find((c) => c.id === member.clan_id);
    if (!clan) return res.status(400).json({ error: 'Clan no encontrado.' });

    // D20 Roll + Class bonuses
    const d20 = Math.floor(Math.random() * 20) + 1;
    const isCrit = d20 === 20;
    const playerClass = (user.secret_class || '').toUpperCase();

    let bonusPts = 0;
    if (action === 'RAM' && (playerClass.includes('WARRIOR') || playerClass.includes('GUERRERO'))) bonusPts = 18;
    if (action === 'SPELL' && (playerClass.includes('MAGE') || playerClass.includes('MAGO'))) bonusPts = 18;
    if (action === 'SABOTAGE' && (playerClass.includes('ROGUE') || playerClass.includes('PÍCARO'))) bonusPts = 22;
    if (action === 'RALLY' && (playerClass.includes('BARD') || playerClass.includes('BARDO') || playerClass.includes('PALADIN'))) bonusPts = 20;

    let ptsGained = Math.round(d20 * 2.8 + (user.level || 1) * 2 + bonusPts);
    if (isCrit) ptsGained = Math.round(ptsGained * 2);

    if (!territory.siege_progress) territory.siege_progress = {};
    if (!territory.siege_progress[clan.id]) {
      territory.siege_progress[clan.id] = { clan_name: clan.name, tag: clan.tag, points: 0 };
    }

    // Sabotage effect: deduct 25 points from leading rival clan
    if (action === 'SABOTAGE') {
      const rivalIds = Object.keys(territory.siege_progress).filter((cid) => cid !== clan.id);
      if (rivalIds.length > 0) {
        const topRivalId = rivalIds.sort((a, b) => territory.siege_progress[b].points - territory.siege_progress[a].points)[0];
        territory.siege_progress[topRivalId].points = Math.max(0, territory.siege_progress[topRivalId].points - 25);
      }
    }

    territory.siege_progress[clan.id].points += ptsGained;
    const totalPoints = territory.siege_progress[clan.id].points;
    const targetPoints = territory.siege_target_points || 1000;

    let victory = false;
    let victoryMsg = '';

    if (totalPoints >= targetPoints) {
      victory = true;
      territory.controlling_clan_id = clan.id;
      territory.controlling_clan_name = clan.name;
      territory.controlling_clan_tag = clan.tag;
      territory.defense_points = 150;
      territory.siege_progress = {
        [clan.id]: { clan_name: clan.name, tag: clan.tag, points: targetPoints }
      };
      territory.last_payout_at = new Date().toISOString();
      victoryMsg = `¡VICTORIA TOTAL! El Clan [${clan.tag}] ${clan.name} alcanzó 1,000 Puntos y conquistó ${territory.name}.`;
      sseHub.broadcast('party_updated', { message: `🏰 ¡${victoryMsg}! Todos los miembros reciben el Buff: ${territory.buff_title || territory.bonus_description}` });
    }

    db.save();
    return res.json({
      success: true,
      victory,
      roll: d20,
      isCrit,
      pointsGained: ptsGained,
      currentPoints: Math.min(targetPoints, totalPoints),
      targetPoints,
      territory,
      message: victory ? victoryMsg : `Aportaste +${ptsGained} puntos de asedio para tu clan.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/territories/claim-tribute/:id - Reclamar Renta Diaria de Oro de la Fortaleza
router.post('/territories/claim-tribute/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const territoryId = req.params.id;

    const territory = (db.data.territories || []).find((t) => t.id === territoryId);
    if (!territory) return res.status(404).json({ error: 'Territorio no encontrado' });

    const member = (db.data.clan_members || []).find((m) => m.player_id === user.id);
    if (!member) return res.status(400).json({ error: 'Debes pertenecer al Clan soberano para cobrar tributo.' });

    if (territory.controlling_clan_id !== member.clan_id) {
      return res.status(400).json({ error: `Esta fortaleza pertenece al Clan [${territory.controlling_clan_tag || 'En disputa'}]. No puedes cobrar su tributo.` });
    }

    const clan = (db.data.clans || []).find((c) => c.id === member.clan_id);
    if (!clan) return res.status(404).json({ error: 'Clan no encontrado.' });

    const now = Date.now();
    const lastPayout = new Date(territory.last_payout_at || now).getTime();
    const elapsedHours = Math.max(0, (now - lastPayout) / 3600000);
    const dynamicGold = Math.floor(elapsedHours * ((territory.daily_gold_rate || 150) / 24));
    const totalGold = (territory.accumulated_gold || 0) + dynamicGold;

    if (totalGold < 10) {
      return res.status(400).json({ error: `Oro acumulado insuficiente (${totalGold} 🪙). Mínimo 10 🪙 para liquidar tributos.` });
    }

    const halfGold = Math.floor(totalGold / 2);
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (freshUser) freshUser.gold += halfGold;
    clan.treasury_gold = (clan.treasury_gold || 0) + halfGold;

    territory.accumulated_gold = 0;
    territory.last_payout_at = new Date().toISOString();

    db.save();
    sseHub.broadcast('party_updated', {
      message: `💰 ¡[Clan ${clan.tag}] ${user.name} recaudó ${totalGold} de oro en tributos de ${territory.name}! (+${halfGold} en Tesorería, +${halfGold} dividendo en bolsa)`
    });

    return res.json({
      success: true,
      totalClaimed: totalGold,
      clanVaultAdded: halfGold,
      playerGoldAdded: halfGold,
      currentUserGold: freshUser?.gold || 0,
      clanVaultTotal: clan.treasury_gold
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/territories/fortify/:id - Mejorar defensas y renta diaria
router.post('/territories/fortify/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const territoryId = req.params.id;
    const fortifyCost = 60;

    const territory = (db.data.territories || []).find((t) => t.id === territoryId);
    if (!territory) return res.status(404).json({ error: 'Territorio no encontrado' });

    const member = (db.data.clan_members || []).find((m) => m.player_id === user.id);
    if (!member || territory.controlling_clan_id !== member.clan_id) {
      return res.status(400).json({ error: 'Solo los miembros del clan soberano pueden fortificar.' });
    }

    const clan = (db.data.clans || []).find((c) => c.id === member.clan_id);
    if (!clan || clan.treasury_gold < fortifyCost) {
      return res.status(400).json({ error: `La tesorería del clan requiere al menos ${fortifyCost} 🪙 de oro para fortificar.` });
    }

    clan.treasury_gold -= fortifyCost;
    territory.fortification_level = Math.min(5, (territory.fortification_level || 1) + 1);
    territory.defense_points += 50;
    territory.daily_gold_rate = Math.round(territory.daily_gold_rate * 1.2); // +20% Renta Diaria!

    db.save();
    sseHub.broadcast('party_updated', {
      message: `🛡️ ¡[Clan ${clan.tag}] fortificó ${territory.name} al Nivel ${territory.fortification_level}! Nueva renta: ${territory.daily_gold_rate} 🪙/día.`
    });

    return res.json({
      success: true,
      fortificationLevel: territory.fortification_level,
      defensePoints: territory.defense_points,
      newDailyRate: territory.daily_gold_rate,
      remainingVault: clan.treasury_gold
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/player/lore/npc-talk/:npcId - Diálogo inmersivo con NPC reactivo al jugador
router.get('/lore/npc-talk/:npcId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const npcId = req.params.npcId;
    
    // Obtener contexto de clima y estado del Boss
    let weatherDesc = 'DESPEJADO';
    try {
      const w = await fetchCurrentWeather();
      weatherDesc = w.description || 'DESPEJADO';
    } catch (_) {}

    const boss = db.data.raid_boss;
    const isBossActive = boss && !boss.is_defeated && boss.current_hp > 0;
    const hasBossDefeated = boss && boss.is_defeated;

    const speech = getNPCDialogue(npcId, {
      playerClass: user.secret_class,
      weatherCondition: weatherDesc,
      isBossActive: Boolean(isBossActive),
      hasBossDefeated: Boolean(hasBossDefeated)
    });

    return res.json({ success: true, speech });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// V3.6.0: EXPEDICIONES A LAS CATACUMBAS (DUNGEON CRAWLER RAMIFICADO)
// ==========================================

function getPlayerTitleBonus(user: any, titles: any[], bonusType: string): number {
  if (!user.equipped_title) return 0;
  const t = titles.find((x) => x.id === user.equipped_title || x.name === user.equipped_title);
  if (t && t.stat_bonus_type === bonusType) {
    return Number(t.stat_bonus_value || 0);
  }
  return 0;
}

function generateExpeditionFloor(floor: number, playerLevel: number): any[] {
  const baseHp = 40 + (floor * 25) + (playerLevel * 6);
  const baseAtk = 8 + (floor * 4) + Math.floor(playerLevel * 1.5);

  const node_0_1 = {
    id: `f${floor}_s0_n1`,
    floor,
    step: 0,
    type: 'COMBAT',
    title: '⚔️ Patrulla de Esqueletos',
    description: 'Guardián óseo que custodia la entrada a la cripta.',
    icon: '💀',
    is_cleared: false,
    enemy: {
      name: 'Esqueleto Decrépito',
      hp: baseHp,
      max_hp: baseHp,
      atk: baseAtk,
      dc: 9,
      icon: '💀'
    },
    connected_to: [`f${floor}_s1_n1`, `f${floor}_s1_n2`]
  };

  const node_0_2 = {
    id: `f${floor}_s0_n2`,
    floor,
    step: 0,
    type: 'EVENT',
    title: '❓ Altar del Olvido',
    description: 'Un pedestal de piedra cubierto de velas derretidas y runas tenues.',
    icon: '🕯️',
    is_cleared: false,
    event: {
      prompt: 'Un susurro helado emana del altar. ¿Cómo decides proceder?',
      choices: [
        {
          id: 'pray',
          label: 'Ofrecer una plegaria humilde (DC 10)',
          dc: 10,
          success_flavor: 'El altar se ilumina con un aura cálida. ¡Encuentras reliquias benditas y oro!',
          failure_flavor: 'Una descarga de rencor sacude tu mente. Pierdes algo de vitalidad.',
          reward_gold: 35,
          reward_xp: 45,
          damage_on_fail: 15
        },
        {
          id: 'inspect',
          label: 'Investigar las runas con cautela (DC 12)',
          dc: 12,
          success_flavor: 'Descifras un mapa secreto grabado en la piedra (+XP y monedas).',
          failure_flavor: 'Activas un resorte de dardos envenenados al tocar el grabado.',
          reward_gold: 50,
          reward_xp: 60,
          damage_on_fail: 20
        }
      ]
    },
    connected_to: [`f${floor}_s1_n2`, `f${floor}_s1_n3`]
  };

  const node_1_1 = {
    id: `f${floor}_s1_n1`,
    floor,
    step: 1,
    type: 'COMBAT',
    title: '⚔️ Necrófago Voraz',
    description: 'Criatura voraz alimentada de carroña y miasma.',
    icon: '🧟',
    is_cleared: false,
    enemy: {
      name: 'Necrófago de las Sombras',
      hp: Math.floor(baseHp * 1.2),
      max_hp: Math.floor(baseHp * 1.2),
      atk: Math.floor(baseAtk * 1.1),
      dc: 10,
      icon: '🧟'
    },
    connected_to: [`f${floor}_s2_n1`]
  };

  const node_1_2 = {
    id: `f${floor}_s1_n2`,
    floor,
    step: 1,
    type: 'EVENT',
    title: '❓ Cofre Sospechoso',
    description: 'Un arcón de roble reforzado con cerrojos carmesí.',
    icon: '📦',
    is_cleared: false,
    event: {
      prompt: 'El cofre parece contener tesoros... o ser una trampa letal.',
      choices: [
        {
          id: 'lockpick',
          label: 'Desactivar el cerrojo con ganzúa fina (DC 11)',
          dc: 11,
          success_flavor: '¡Click! El mecanismo cede y recoges un botín reluciente.',
          failure_flavor: 'El cofre suelta gas cáustico antes de trabarse.',
          reward_gold: 60,
          reward_xp: 50,
          damage_on_fail: 18
        },
        {
          id: 'force',
          label: 'Romper la tapa con un golpe seco (DC 13)',
          dc: 13,
          success_flavor: 'Partes el cerrojo de un impacto y saqueas el contenido intacto.',
          failure_flavor: 'La madera estalla en astillas afiladas que te hieren.',
          reward_gold: 45,
          reward_xp: 40,
          damage_on_fail: 25
        }
      ]
    },
    connected_to: [`f${floor}_s2_n1`, `f${floor}_s2_n2`]
  };

  const node_1_3 = {
    id: `f${floor}_s1_n3`,
    floor,
    step: 1,
    type: 'REST',
    title: '🏕️ Campamento Seguro',
    description: 'Un rincón resguardado donde puedes recuperar el aliento y afilar tus armas.',
    icon: '🏕️',
    is_cleared: false,
    connected_to: [`f${floor}_s2_n2`]
  };

  const node_2_1 = {
    id: `f${floor}_s2_n1`,
    floor,
    step: 2,
    type: 'ELITE',
    title: '💀 Caballero Caído (Élite)',
    description: 'Antiguo paladín maldito con armadura pesada y espada espectral.',
    icon: '👹',
    is_cleared: false,
    enemy: {
      name: 'Caballero Negro del Abismo',
      hp: Math.floor(baseHp * 1.6),
      max_hp: Math.floor(baseHp * 1.6),
      atk: Math.floor(baseAtk * 1.4),
      dc: 12,
      icon: '👹'
    },
    connected_to: [`f${floor}_s3_boss`]
  };

  const node_2_2 = {
    id: `f${floor}_s2_n2`,
    floor,
    step: 2,
    type: 'EVENT',
    title: '❓ Fuente de Sangre Lunar',
    description: 'Un manantial subterráneo de aguas carmesí que emite calor.',
    icon: '⛲',
    is_cleared: false,
    event: {
      prompt: 'Las aguas prometen vigor antinatural a quien se atreva a sumergirse.',
      choices: [
        {
          id: 'drink',
          label: 'Beber del manantial rúnico (DC 11)',
          dc: 11,
          success_flavor: 'Sientes cómo tus heridas cierran y tu vigor aumenta (+Oro y XP).',
          failure_flavor: 'El agua quema tu garganta con ponzoña.',
          reward_gold: 75,
          reward_xp: 80,
          damage_on_fail: 22
        }
      ]
    },
    connected_to: [`f${floor}_s3_boss`]
  };

  const node_3_boss = {
    id: `f${floor}_s3_boss`,
    floor,
    step: 3,
    type: 'BOSS',
    title: '👑 Malakor el Nigromante',
    description: 'Guardián del piso y amo de las almas errantes de las catacumbas.',
    icon: '🧙‍♂️',
    is_cleared: false,
    enemy: {
      name: 'Malakor el Nigromante',
      hp: Math.floor(baseHp * 2.2),
      max_hp: Math.floor(baseHp * 2.2),
      atk: Math.floor(baseAtk * 1.7),
      dc: 13,
      icon: '🧙‍♂️'
    },
    connected_to: []
  };

  return [node_0_1, node_0_2, node_1_1, node_1_2, node_1_3, node_2_1, node_2_2, node_3_boss];
}

// GET /api/v1/player/expedition/status - Consulta estado de expedición activa
router.get('/expedition/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const session = (db.data.active_expeditions || []).find(
      (e) => e.player_id === user.id && e.status === 'ACTIVE'
    );

    if (!session) {
      return res.json({ success: true, active: false });
    }

    return res.json({ success: true, active: true, session });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/expedition/start - Iniciar nueva expedición
router.post('/expedition/start', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    if (!db.data.active_expeditions) db.data.active_expeditions = [];

    // Si ya tiene una activa, devolverla
    const existing = db.data.active_expeditions.find(
      (e) => e.player_id === user.id && e.status === 'ACTIVE'
    );
    if (existing) {
      return res.json({ success: true, session: existing });
    }

    const titleHpBonus = getPlayerTitleBonus(user, db.data.titles || [], 'MAX_HP');
    const playerDef = (db.data.inventory || [])
      .filter((inv) => inv.player_id === user.id && inv.is_equipped)
      .reduce((acc, inv) => {
        const item = db.data.items.find((i) => i.id === inv.item_id);
        return acc + (item?.stat_def || 0);
      }, 0);

    const maxHp = 100 + (user.level * 8) + Math.floor(playerDef / 2) + titleHpBonus;
    const nodes = generateExpeditionFloor(1, user.level);

    const newSession = {
      id: `exp_${Date.now()}_${user.id.slice(0, 5)}`,
      player_id: user.id,
      floor: 1,
      current_hp: maxHp,
      max_hp: maxHp,
      current_node_id: null,
      nodes,
      loot_bag: {
        gold: 0,
        xp: 0,
        items_found: [],
        relics_found: []
      },
      status: 'ACTIVE' as const,
      buff_damage_pct: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.data.active_expeditions.push(newSession);
    db.save();

    return res.json({ success: true, session: newSession });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/expedition/node/choose - Elegir y entrar a un nodo
router.post('/expedition/node/choose', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { nodeId } = req.body;

    const session = (db.data.active_expeditions || []).find(
      (e) => e.player_id === user.id && e.status === 'ACTIVE'
    );
    if (!session) return res.status(400).json({ error: 'No tienes una expedición activa.' });

    const targetNode = session.nodes.find((n) => n.id === nodeId);
    if (!targetNode) return res.status(404).json({ error: 'Nodo no encontrado.' });

    // Validar conectividad
    if (!session.current_node_id) {
      if (targetNode.step !== 0) {
        return res.status(400).json({ error: 'Debes comenzar en uno de los nodos de entrada (Paso 0).' });
      }
    } else {
      const prevNode = session.nodes.find((n) => n.id === session.current_node_id);
      if (!prevNode || !prevNode.connected_to.includes(nodeId)) {
        return res.status(400).json({ error: 'Ese nodo no está conectado a tu ubicación actual.' });
      }
    }

    session.current_node_id = nodeId;
    session.updated_at = new Date().toISOString();
    db.save();

    return res.json({ success: true, session, node: targetNode });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/expedition/node/action - Resolver combate, evento o descanso
router.post('/expedition/node/action', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser) return res.status(404).json({ error: 'Jugador no encontrado' });

    const session = (db.data.active_expeditions || []).find(
      (e) => e.player_id === user.id && e.status === 'ACTIVE'
    );
    if (!session) return res.status(400).json({ error: 'No tienes una expedición activa.' });

    const node = session.nodes.find((n) => n.id === session.current_node_id);
    if (!node) return res.status(400).json({ error: 'Primero debes entrar a un nodo accesible.' });
    if (node.is_cleared) return res.status(400).json({ error: 'Esta sala ya ha sido despejada.' });

    const { actionType, choiceId } = req.body;
    // actionType: 'ATTACK' | 'EVENT_CHOICE' | 'REST_HEAL' | 'REST_BUFF'

    const d20Bonus = getPlayerTitleBonus(freshUser, db.data.titles || [], 'D20_EVENT_BONUS');
    const goldBonusPct = getPlayerTitleBonus(freshUser, db.data.titles || [], 'EXPEDITION_GOLD_PCT');
    const critBonusPct = getPlayerTitleBonus(freshUser, db.data.titles || [], 'CRIT_PCT');

    // Stats de equipamiento
    const equipped = (db.data.inventory || []).filter((i) => i.player_id === user.id && i.is_equipped);
    let playerAtk = 10 + (freshUser.level * 3);
    let playerDef = (freshUser.level * 2);
    for (const eq of equipped) {
      const itm = db.data.items.find((i) => i.id === eq.item_id);
      if (itm) {
        playerAtk += (itm.stat_atk || 0);
        playerDef += (itm.stat_def || 0);
      }
    }

    if (node.type === 'COMBAT' || node.type === 'ELITE' || node.type === 'BOSS') {
      if (!node.enemy) return res.status(400).json({ error: 'Datos de enemigo inválidos' });

      const d20 = Math.floor(Math.random() * 20) + 1;
      const isCrit = d20 === 20 || (d20 >= 19 && critBonusPct > 0);
      const isFumble = d20 === 1;

      let multiplier = 1.0;
      if (isCrit) multiplier = 2.0 + (critBonusPct / 100);
      else if (isFumble) multiplier = 0.3;
      else if (d20 >= 14) multiplier = 1.4;
      else if (d20 <= 6) multiplier = 0.7;

      const buffMul = 1.0 + (session.buff_damage_pct / 100);
      const playerDamage = Math.max(12, Math.floor(playerAtk * multiplier * buffMul));
      node.enemy.hp = Math.max(0, node.enemy.hp - playerDamage);

      let enemyDamage = 0;
      if (node.enemy.hp > 0) {
        const rawEnemyDmg = node.enemy.atk * (d20 <= 7 ? 1.3 : 1.0);
        enemyDamage = Math.max(5, Math.floor(rawEnemyDmg - (playerDef * 0.25)));
        session.current_hp = Math.max(0, session.current_hp - enemyDamage);
      }

      let isDefeated = false;
      let isVictorious = false;

      // Si el héroe cayó en combate
      if (session.current_hp <= 0) {
        session.status = 'DEFEATED';
        const rescuedGold = Math.floor(session.loot_bag.gold * 0.4);
        const rescuedXp = Math.floor(session.loot_bag.xp * 0.4);
        freshUser.gold += rescuedGold;
        freshUser.xp += rescuedXp;
        freshUser.level = Math.max(1, 1 + Math.floor(freshUser.xp / 250));
        db.save();

        return res.json({
          success: true,
          actionResult: {
            d20,
            isCrit,
            isFumble,
            playerDamage,
            enemyDamage,
            enemyHp: node.enemy.hp,
            playerHp: 0,
            status: 'DEFEATED',
            message: `💀 Has caído en combate ante ${node.enemy.name}. Rescataste ${rescuedGold} 🪙 y ${rescuedXp} XP (40% de tu botín).`
          },
          session
        });
      }

      // Si el enemigo fue derrotado
      if (node.enemy.hp <= 0) {
        node.is_cleared = true;
        const goldAward = Math.floor((25 + (node.floor * 20) + (node.type === 'ELITE' ? 40 : node.type === 'BOSS' ? 120 : 0)) * (1 + goldBonusPct / 100));
        const xpAward = 35 + (node.floor * 25) + (node.type === 'ELITE' ? 60 : node.type === 'BOSS' ? 180 : 0);

        session.loot_bag.gold += goldAward;
        session.loot_bag.xp += xpAward;

        // Si es el Jefe final del piso
        if (node.type === 'BOSS') {
          session.status = 'VICTORIOUS';
          isVictorious = true;
          freshUser.gold += session.loot_bag.gold;
          freshUser.xp += session.loot_bag.xp;
          freshUser.level = Math.max(1, 1 + Math.floor(freshUser.xp / 250));
        }

        db.save();

        return res.json({
          success: true,
          actionResult: {
            d20,
            isCrit,
            isFumble,
            playerDamage,
            enemyDamage,
            enemyHp: 0,
            playerHp: session.current_hp,
            status: isVictorious ? 'VICTORIOUS' : 'NODE_CLEARED',
            goldGained: goldAward,
            xpGained: xpAward,
            message: isVictorious
              ? `👑 ¡Has derrotado a ${node.enemy.name}! Despejaste la mazmorra con éxito (+${session.loot_bag.gold} 🪙, +${session.loot_bag.xp} XP asegurados).`
              : `⚔️ ¡Has vencido a ${node.enemy.name}! (+${goldAward} 🪙 y +${xpAward} XP al saco de botín).`
          },
          session
        });
      }

      db.save();
      return res.json({
        success: true,
        actionResult: {
          d20,
          isCrit,
          isFumble,
          playerDamage,
          enemyDamage,
          enemyHp: node.enemy.hp,
          playerHp: session.current_hp,
          status: 'IN_COMBAT',
          message: `⚔️ Asestaste ${playerDamage} de daño. ${node.enemy.name} contraataca infligiendo ${enemyDamage} de daño.`
        },
        session
      });
    }

    if (node.type === 'EVENT') {
      if (!node.event) return res.status(400).json({ error: 'Evento no disponible' });
      const choice = node.event.choices.find((c: any) => c.id === choiceId) || node.event.choices[0];

      const rawD20 = Math.floor(Math.random() * 20) + 1;
      const finalRoll = rawD20 + d20Bonus;
      const passed = finalRoll >= choice.dc;

      let goldGained = 0;
      let xpGained = 0;
      let damageTaken = 0;

      if (passed) {
        goldGained = Math.floor((choice.reward_gold || 30) * (1 + goldBonusPct / 100));
        xpGained = choice.reward_xp || 40;
        session.loot_bag.gold += goldGained;
        session.loot_bag.xp += xpGained;
      } else {
        damageTaken = choice.damage_on_fail || 15;
        session.current_hp = Math.max(0, session.current_hp - damageTaken);
      }

      node.is_cleared = true;
      if (session.current_hp <= 0) {
        session.status = 'DEFEATED';
        const rescuedGold = Math.floor(session.loot_bag.gold * 0.4);
        const rescuedXp = Math.floor(session.loot_bag.xp * 0.4);
        freshUser.gold += rescuedGold;
        freshUser.xp += rescuedXp;
      }

      db.save();
      return res.json({
        success: true,
        actionResult: {
          d20: rawD20,
          finalRoll,
          passed,
          goldGained,
          xpGained,
          damageTaken,
          message: passed ? choice.success_flavor : choice.failure_flavor,
          status: session.status === 'DEFEATED' ? 'DEFEATED' : 'NODE_CLEARED'
        },
        session
      });
    }

    if (node.type === 'REST') {
      node.is_cleared = true;
      let healAmount = 0;
      let buffMessage = '';

      if (actionType === 'REST_BUFF') {
        session.buff_damage_pct = 25;
        buffMessage = '🛡️ Afilaste tus armas rúnicamente: +25% de daño hasta finalizar la expedición.';
      } else {
        healAmount = Math.floor(session.max_hp * 0.45);
        session.current_hp = Math.min(session.max_hp, session.current_hp + healAmount);
        buffMessage = `🏕️ Descansaste junto al fuego: recuperaste +${healAmount} HP.`;
      }

      db.save();
      return res.json({
        success: true,
        actionResult: {
          status: 'NODE_CLEARED',
          healAmount,
          message: buffMessage
        },
        session
      });
    }

    return res.status(400).json({ error: 'Tipo de nodo no reconocido' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/expedition/retreat - Retirada táctica asegurando el 100% del botín
router.post('/expedition/retreat', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser) return res.status(404).json({ error: 'Jugador no encontrado' });

    const session = (db.data.active_expeditions || []).find(
      (e) => e.player_id === user.id && e.status === 'ACTIVE'
    );
    if (!session) return res.status(400).json({ error: 'No tienes una expedición activa para retirarte.' });

    session.status = 'RETREATED';
    const securedGold = session.loot_bag.gold;
    const securedXp = session.loot_bag.xp;

    freshUser.gold += securedGold;
    freshUser.xp += securedXp;
    freshUser.level = Math.max(1, 1 + Math.floor(freshUser.xp / 250));

    db.save();

    return res.json({
      success: true,
      securedGold,
      securedXp,
      message: `🚪 ¡Retirada táctica exitosa! Has regresado a la taberna asegurando ${securedGold} 🪙 y ${securedXp} XP.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// V3.6.0: LOGROS & TÍTULOS HONORÍFICOS CON PERKS
// ==========================================

// GET /api/v1/player/achievements - Lista de logros, progreso y títulos
router.get('/achievements', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser) return res.status(404).json({ error: 'Jugador no encontrado' });

    if (!db.data.player_achievements) db.data.player_achievements = [];
    if (!db.data.player_titles) db.data.player_titles = [];

    // Calcular progreso dinámico por tipo
    const completedNodes = (db.data.active_expeditions || [])
      .filter((e) => e.player_id === user.id)
      .reduce((acc, e) => acc + (e.nodes || []).filter((n) => n.is_cleared).length, 0);

    const clanMember = (db.data.clan_members || []).find((m) => m.player_id === user.id);
    const clanDonatePts = clanMember?.contribution_points || 0;

    const maxForgeLevel = (db.data.inventory || [])
      .filter((inv) => inv.player_id === user.id)
      .reduce((acc, inv) => {
        const itm = db.data.items.find((i) => i.id === inv.item_id);
        return Math.max(acc, itm?.refine_level || 0);
      }, 0);

    const achievementsWithProgress = (db.data.achievements || []).map((ach) => {
      let currentProgress = 0;
      switch (ach.req_type) {
        case 'EXPEDITION_NODES':
          currentProgress = completedNodes;
          break;
        case 'PVP_WIN':
          currentProgress = freshUser.pvp_wins || 0;
          break;
        case 'FORGE_LEVEL':
          currentProgress = maxForgeLevel;
          break;
        case 'CLAN_DONATE':
          currentProgress = clanDonatePts;
          break;
        case 'LEVEL':
          currentProgress = freshUser.level;
          break;
        case 'RAID_KILL':
          currentProgress = (db.data.raid_boss?.is_defeated) ? 1 : 0;
          break;
        case 'EXPEDITION_RETREAT':
          currentProgress = Math.min(ach.req_target, freshUser.gold);
          break;
        default:
          currentProgress = 0;
      }

      const pAch = db.data.player_achievements.find(
        (pa) => pa.player_id === user.id && pa.achievement_id === ach.id
      );

      const isCompleted = currentProgress >= ach.req_target;
      const isClaimed = Boolean(pAch?.is_claimed);

      return {
        ...ach,
        currentProgress: Math.min(ach.req_target, currentProgress),
        isCompleted,
        isClaimed
      };
    });

    const myTitles = (db.data.player_titles || [])
      .filter((pt) => pt.player_id === user.id)
      .map((pt) => {
        const titleDef = (db.data.titles || []).find((t) => t.id === pt.title_id);
        return {
          ...pt,
          titleDef: titleDef || { id: pt.title_id, name: pt.title_id, icon: '🎖️' }
        };
      });

    return res.json({
      success: true,
      achievements: achievementsWithProgress,
      unlockedTitles: myTitles,
      allTitlesCatalog: db.data.titles || [],
      equippedTitle: freshUser.equipped_title || freshUser.title || null
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/achievements/claim - Reclamar recompensa de logro completado
router.post('/achievements/claim', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { achievementId } = req.body;
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser) return res.status(404).json({ error: 'Jugador no encontrado' });

    const ach = (db.data.achievements || []).find((a) => a.id === achievementId);
    if (!ach) return res.status(404).json({ error: 'Logro no encontrado' });

    if (!db.data.player_achievements) db.data.player_achievements = [];
    let pAch = db.data.player_achievements.find(
      (pa) => pa.player_id === user.id && pa.achievement_id === achievementId
    );

    if (pAch?.is_claimed) {
      return res.status(400).json({ error: 'Ya has reclamado este logro.' });
    }

    freshUser.gold += ach.reward_gold;
    freshUser.xp += ach.reward_xp;
    freshUser.level = Math.max(1, 1 + Math.floor(freshUser.xp / 250));

    // Desbloquear título honorífico asociado si tiene
    if (ach.unlocked_title_id) {
      if (!db.data.player_titles) db.data.player_titles = [];
      const alreadyHas = db.data.player_titles.some(
        (pt) => pt.player_id === user.id && pt.title_id === ach.unlocked_title_id
      );
      if (!alreadyHas) {
        db.data.player_titles.push({
          id: `pt_${Date.now()}_${ach.unlocked_title_id}`,
          player_id: user.id,
          title_id: ach.unlocked_title_id,
          unlocked_at: new Date().toISOString()
        });
      }
    }

    if (!pAch) {
      pAch = {
        id: `pa_${Date.now()}`,
        player_id: user.id,
        achievement_id: achievementId,
        current_progress: ach.req_target,
        is_completed: true,
        is_claimed: true,
        completed_at: new Date().toISOString()
      };
      db.data.player_achievements.push(pAch);
    } else {
      pAch.is_claimed = true;
      pAch.is_completed = true;
    }

    db.save();

    return res.json({
      success: true,
      message: `🎉 ¡Logro reclamado! Obtuviste +${ach.reward_gold} 🪙 y +${ach.reward_xp} XP.`,
      reward_gold: ach.reward_gold,
      reward_xp: ach.reward_xp,
      unlocked_title_id: ach.unlocked_title_id
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/player/titles/equip - Equipar título honorífico para activar su perk pasivo
router.post('/titles/equip', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { titleId } = req.body;
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser) return res.status(404).json({ error: 'Jugador no encontrado' });

    const titleDef = (db.data.titles || []).find((t) => t.id === titleId || t.name === titleId);
    if (!titleDef) return res.status(404).json({ error: 'Título no encontrado en el catálogo.' });

    // Validar que el jugador tenga el título desbloqueado (o sea el inicial)
    const hasUnlocked = (db.data.player_titles || []).some(
      (pt) => pt.player_id === user.id && pt.title_id === titleDef.id
    ) || titleDef.id === 'title_02';

    if (!hasUnlocked) {
      return res.status(403).json({ error: 'Aún no has desbloqueado este título honorífico.' });
    }

    freshUser.equipped_title = titleDef.id;
    freshUser.title = titleDef.name;
    db.save();

    return res.json({
      success: true,
      equipped_title: titleDef.id,
      title_name: titleDef.name,
      perk_description: titleDef.perk_description || 'Sin bonificación pasiva.',
      message: `👑 ¡Has equipado el título "${titleDef.name}"! Bono activo: ${titleDef.perk_description || 'Ninguno'}.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ====================================================
// SENDA INFINITA (AVENTURA PROCEDURAL CONTINUA) ENDPOINTS
// ====================================================

// Handler común de estado de la Senda Infinita
const handleJourneyState = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const progress = await getOrCreateTaskbarProgress(user.id);
    const biome = TASKBAR_BIOMES.find((b) => b.id === progress.biome_id) || TASKBAR_BIOMES[0];

    return res.json({
      success: true,
      progress,
      biome,
      biomesCatalog: TASKBAR_BIOMES
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

router.get('/journey/state', authMiddleware, handleJourneyState);
router.get('/taskbar/state', authMiddleware, handleJourneyState);

// Handler común de tick de combate procedural
const handleJourneyTick = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id) || user;
    const { progress, combatLog } = await processTaskbarTick(freshUser as any);

    return res.json({
      success: true,
      progress,
      combatLog
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

router.post('/journey/tick', authMiddleware, handleJourneyTick);
router.post('/taskbar/tick', authMiddleware, handleJourneyTick);

// Handler común de selección de bioma
const handleJourneySelectBiome = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { biomeId } = req.body;
    const targetBiome = TASKBAR_BIOMES.find((b) => b.id === biomeId);
    if (!targetBiome) return res.status(404).json({ error: 'Bioma no encontrado en el catálogo.' });

    if (user.level < targetBiome.minLevel) {
      return res.status(403).json({ error: `Se requiere Nivel ${targetBiome.minLevel} para acceder a ${targetBiome.name}.` });
    }

    const progress = await getOrCreateTaskbarProgress(user.id);
    progress.biome_id = targetBiome.id;
    progress.current_monster_index = 0;
    progress.monster_name = targetBiome.monsters[0].name;
    progress.monster_icon = targetBiome.monsters[0].icon;
    progress.monster_max_hp = targetBiome.monsters[0].maxHp;
    progress.monster_current_hp = targetBiome.monsters[0].maxHp;
    progress.is_boss = false;

    const db = await getDb();
    await db.save();

    return res.json({
      success: true,
      progress,
      biome: targetBiome,
      message: `⚔️ ¡Has adentrado tu marcha en "${targetBiome.name}"!`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

router.post('/journey/select-biome', authMiddleware, handleJourneySelectBiome);
router.post('/taskbar/select-biome', authMiddleware, handleJourneySelectBiome);

// Handler común de cobro de botín acumulado
const handleJourneyClaimAfk = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser) return res.status(404).json({ error: 'Jugador no encontrado' });

    const progress = await getOrCreateTaskbarProgress(user.id);
    const claimedGold = progress.accumulated_gold;
    const claimedXp = progress.accumulated_xp;
    const claimedItems = [...progress.accumulated_items];

    if (claimedGold === 0 && claimedXp === 0 && claimedItems.length === 0) {
      return res.status(400).json({ error: 'No hay botín acumulado para reclamar.' });
    }

    freshUser.gold = (freshUser.gold || 0) + claimedGold;
    freshUser.xp = (freshUser.xp || 0) + claimedXp;

    if (!db.data.inventory) db.data.inventory = [];
    for (const item of claimedItems) {
      db.data.inventory.push({
        id: `inv_journey_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        player_id: user.id,
        item_id: item.id,
        is_equipped: false,
        purchased_at: new Date().toISOString()
      });
    }

    // Resetear acumulación pasiva
    progress.accumulated_gold = 0;
    progress.accumulated_xp = 0;
    progress.accumulated_items = [];

    await db.save();

    return res.json({
      success: true,
      claimedGold,
      claimedXp,
      claimedItemsCount: claimedItems.length,
      message: `💰 ¡Has cobrado el Botín de la Senda Infinita! +${claimedGold} 🪙 Oro, +${claimedXp} XP y ${claimedItems.length} artefactos transferidos a tu inventario.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

router.post('/journey/claim-afk', authMiddleware, handleJourneyClaimAfk);
router.post('/taskbar/claim-afk', authMiddleware, handleJourneyClaimAfk);

export default router;

