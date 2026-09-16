import { getDb } from '../db';
import { generateProceduralItem } from './itemGenerator';
import { sseHub } from '../sseHub';
import crypto from 'crypto';

export type QuestMetric = 
  | 'boss_attacks' 
  | 'boss_damage' 
  | 'boss_kills' 
  | 'items_forged' 
  | 'd20_high_rolls' 
  | 'gold_spent' 
  | 'crit_hits';

export interface QuestCatalogDef {
  id: string;
  cadence: 'DAILY' | 'WEEKLY';
  title: string;
  description: string;
  metric: QuestMetric;
  target: number;
  reward_gold: number;
  reward_xp: number;
  icon: string;
}

export const QUEST_CATALOG: QuestCatalogDef[] = [
  // MISIONES DIARIAS (3 al día seleccionadas determinísticamente por rotación)
  {
    id: 'daily_boss_attacks',
    cadence: 'DAILY',
    title: 'El Reto de la Vanguardia',
    description: 'Valerius exige comprobar la resistencia del baluarte. Desciende a la fosa y asesta 3 golpes a la bestia que acecha.',
    metric: 'boss_attacks',
    target: 3,
    reward_gold: 25,
    reward_xp: 45,
    icon: '⚔️'
  },
  {
    id: 'daily_boss_damage',
    cadence: 'DAILY',
    title: 'Mellar la Coraza Rúnica',
    description: 'Los glifos del coloso parpadean. Inflige al menos 1,000 puntos de impacto acumulado para abrir brecha a tus aliados.',
    metric: 'boss_damage',
    target: 1000,
    reward_gold: 30,
    reward_xp: 55,
    icon: '💥'
  },
  {
    id: 'daily_items_forged',
    cadence: 'DAILY',
    title: 'Chispas en el Yunque de Brida',
    description: 'El frío de la noche desafila el acero. Acude a la herrería a refinar, forjar o desguazar un ítem del arsenal.',
    metric: 'items_forged',
    target: 1,
    reward_gold: 20,
    reward_xp: 40,
    icon: '🔨'
  },
  {
    id: 'daily_d20_high',
    cadence: 'DAILY',
    title: 'La Bendición del Hado',
    description: 'Los cuervos del tejado graznan con fortuna. Canaliza el favor de los Dioses obteniendo una tirada D20 de 12 o superior.',
    metric: 'd20_high_rolls',
    target: 1,
    reward_gold: 25,
    reward_xp: 40,
    icon: '🎲'
  },
  {
    id: 'daily_crit_hits',
    cadence: 'DAILY',
    title: 'Estocada al Punto Ciego',
    description: 'No basta con blandir el hierro; hay que encontrar la fisura en la armadura. Asesta 1 impacto crítico devastador.',
    metric: 'crit_hits',
    target: 1,
    reward_gold: 30,
    reward_xp: 50,
    icon: '🎯'
  },

  // MISIONES SEMANALES (La Gran Bóveda del Gremio)
  {
    id: 'weekly_boss_kills',
    cadence: 'WEEKLY',
    title: 'La Caída de los Soberanos',
    description: 'El Gremio no dormirá tranquilo hasta ver caer a 2 de los Heraldos del Cataclismo en asedios comunales.',
    metric: 'boss_kills',
    target: 2,
    reward_gold: 140,
    reward_xp: 300,
    icon: '👑'
  },
  {
    id: 'weekly_boss_damage',
    cadence: 'WEEKLY',
    title: 'Marea de Guerra Devastadora',
    description: 'Desata toda la furia de tu clase. Inflige 8,000 de daño acumulado a los titanes a lo largo de la semana.',
    metric: 'boss_damage',
    target: 8000,
    reward_gold: 160,
    reward_xp: 350,
    icon: '🐉'
  },
  {
    id: 'weekly_items_forged',
    cadence: 'WEEKLY',
    title: 'Maestro del Yunque del Bastión',
    description: 'Consagra 5 refinamientos o mejoras en el taller de Brida para preparar a los cuervos para la guerra.',
    metric: 'items_forged',
    target: 5,
    reward_gold: 120,
    reward_xp: 260,
    icon: '⚒️'
  },
  {
    id: 'weekly_crit_hits',
    cadence: 'WEEKLY',
    title: 'Ojo del Halcón Carmesí',
    description: 'Consigue 5 impactos Críticos certeros en combates de asedio o duelos de honor en la arena.',
    metric: 'crit_hits',
    target: 5,
    reward_gold: 130,
    reward_xp: 280,
    icon: '🎯'
  }
];

export function getDailyPeriodKey(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]; // ej: "2026-09-08"
}

export function getWeeklyPeriodKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export interface PlayerActiveQuest {
  id: string;
  quest_id: string;
  cadence: 'DAILY' | 'WEEKLY';
  title: string;
  description: string;
  metric: QuestMetric;
  progress: number;
  target_value: number;
  is_completed: boolean;
  is_claimed: boolean;
  reward_gold: number;
  reward_xp: number;
  icon: string;
  period_key: string;
}

export interface QuestsStateResponse {
  dailyQuests: PlayerActiveQuest[];
  weeklyQuests: PlayerActiveQuest[];
  dailyExpiresInMs: number;
  weeklyExpiresInMs: number;
  dailyPeriodKey: string;
  weeklyPeriodKey: string;
  vault: {
    isUnlocked: boolean;
    isClaimed: boolean;
    completedWeeklyCount: number;
    requiredWeeklyCount: number;
  };
}

/**
 * Obtener o generar misiones activas para el jugador
 */
export async function getPlayerQuests(playerId: string): Promise<QuestsStateResponse> {
  const db = await getDb();
  if (!db.data.player_quests) db.data.player_quests = [];
  if (!db.data.global_states) db.data.global_states = [];

  const now = new Date();
  const dailyKey = getDailyPeriodKey(now);
  const weeklyKey = getWeeklyPeriodKey(now);

  // 1. Filtrar misiones existentes
  let dailyPlayerQuests = db.data.player_quests.filter(
    (q) => q.player_id === playerId && (q as any).cadence === 'DAILY' && (q as any).period_key === dailyKey
  );

  let weeklyPlayerQuests = db.data.player_quests.filter(
    (q) => q.player_id === playerId && (q as any).cadence === 'WEEKLY' && (q as any).period_key === weeklyKey
  );

  // 2. Asignar 3 Diarias si no existen para hoy
  if (dailyPlayerQuests.length === 0) {
    const dailyPool = QUEST_CATALOG.filter((q) => q.cadence === 'DAILY');
    const shuffled = [...dailyPool].sort(() => 0.5 - Math.random()).slice(0, 3);

    for (const def of shuffled) {
      const newQ: any = {
        id: 'pq_d_' + crypto.randomUUID(),
        player_id: playerId,
        quest_id: def.id,
        cadence: 'DAILY',
        period_key: dailyKey,
        progress: 0,
        target_value: def.target,
        is_completed: false,
        is_claimed: false,
        assigned_date: now.toISOString()
      };
      db.data.player_quests.push(newQ);
      dailyPlayerQuests.push(newQ);
    }
    db.save();
  }

  // 3. Asignar 3 Semanales si no existen para esta semana
  if (weeklyPlayerQuests.length === 0) {
    const weeklyPool = QUEST_CATALOG.filter((q) => q.cadence === 'WEEKLY');
    const shuffled = [...weeklyPool].sort(() => 0.5 - Math.random()).slice(0, 3);

    for (const def of shuffled) {
      const newQ: any = {
        id: 'pq_w_' + crypto.randomUUID(),
        player_id: playerId,
        quest_id: def.id,
        cadence: 'WEEKLY',
        period_key: weeklyKey,
        progress: 0,
        target_value: def.target,
        is_completed: false,
        is_claimed: false,
        assigned_date: now.toISOString()
      };
      db.data.player_quests.push(newQ);
      weeklyPlayerQuests.push(newQ);
    }
    db.save();
  }

  // 4. Formatear salida con datos de catálogo
  const mapQuestDetails = (pq: any): PlayerActiveQuest => {
    const cat = QUEST_CATALOG.find((c) => c.id === pq.quest_id) || {
      id: pq.quest_id,
      cadence: pq.cadence || 'DAILY',
      title: 'Misión del Gremio',
      description: 'Objetivo de la taberna.',
      metric: 'boss_attacks' as QuestMetric,
      target: pq.target_value || 1,
      reward_gold: 25,
      reward_xp: 40,
      icon: '📜'
    };

    return {
      id: pq.id,
      quest_id: cat.id,
      cadence: cat.cadence,
      title: cat.title,
      description: cat.description,
      metric: cat.metric,
      progress: pq.progress || 0,
      target_value: pq.target_value || cat.target,
      is_completed: Boolean(pq.is_completed),
      is_claimed: Boolean(pq.is_claimed),
      reward_gold: cat.reward_gold,
      reward_xp: cat.reward_xp,
      icon: cat.icon,
      period_key: pq.period_key
    };
  };

  const detailedDaily = dailyPlayerQuests.map(mapQuestDetails);
  const detailedWeekly = weeklyPlayerQuests.map(mapQuestDetails);

  // 5. Estado de la Gran Bóveda Semanal
  const completedWeeklyCount = detailedWeekly.filter((w) => w.is_completed).length;
  const isVaultUnlocked = completedWeeklyCount >= 3;

  const vaultClaimKey = `vault_claimed_${playerId}_${weeklyKey}`;
  const vaultClaimState = db.data.global_states.find((g) => g.key === vaultClaimKey);
  const isVaultClaimed = vaultClaimState?.value === 'true';

  // 6. Timers de expiración
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  const dailyExpiresInMs = Math.max(0, endOfDay.getTime() - now.getTime());

  // Próximo lunes a las 00:00 UTC
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
  const daysUntilMonday = ((7 - day + 1) % 7) || 7;
  const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday, 0, 0, 0));
  const weeklyExpiresInMs = Math.max(0, nextMonday.getTime() - now.getTime());

  return {
    dailyQuests: detailedDaily,
    weeklyQuests: detailedWeekly,
    dailyExpiresInMs,
    weeklyExpiresInMs,
    dailyPeriodKey: dailyKey,
    weeklyPeriodKey: weeklyKey,
    vault: {
      isUnlocked: isVaultUnlocked,
      isClaimed: isVaultClaimed,
      completedWeeklyCount,
      requiredWeeklyCount: 3
    }
  };
}

/**
 * Reclamar recompensa de misión individual
 */
export async function claimQuestReward(playerId: string, playerQuestId: string): Promise<{ success: boolean; goldGained: number; xpGained: number; message: string }> {
  const db = await getDb();
  const pq = (db.data.player_quests || []).find((q) => q.id === playerQuestId && q.player_id === playerId);

  if (!pq) {
    throw new Error('Misión no encontrada');
  }
  if (!pq.is_completed) {
    throw new Error('La misión aún no ha sido completada');
  }
  if (pq.is_claimed) {
    throw new Error('Esta recompensa ya fue reclamada');
  }

  const cat = QUEST_CATALOG.find((c) => c.id === pq.quest_id);
  const gold = cat?.reward_gold || 25;
  const xp = cat?.reward_xp || 40;

  const player = (db.data.players || []).find((p) => p.id === playerId);
  if (player) {
    player.gold = (player.gold || 0) + gold;
    player.xp = (player.xp || 0) + xp;
  }

  pq.is_claimed = true;
  db.save();

  return {
    success: true,
    goldGained: gold,
    xpGained: xp,
    message: `¡Misión reclamada! Has ganado +${gold} 🪙 y +${xp} XP.`
  };
}

/**
 * Abrir La Gran Bóveda Semanal
 */
export async function openGrandVault(playerId: string): Promise<{ success: boolean; item: any; gold: number; xp: number; message: string }> {
  const db = await getDb();
  const questState = await getPlayerQuests(playerId);

  if (!questState.vault.isUnlocked) {
    throw new Error('La Gran Bóveda aún está cerrada. Completa las 3 misiones semanales.');
  }
  if (questState.vault.isClaimed) {
    throw new Error('Ya has reclamado la Gran Bóveda de esta semana.');
  }

  const player = (db.data.players || []).find((p) => p.id === playerId);
  if (!player) throw new Error('Jugador no encontrado');

  // Generar Ítem Mítico / Legendario garantizado
  const vaultItem = generateProceduralItem({
    playerLevel: player.level || 1,
    rarity: Math.random() < 0.25 ? 'MYTHIC' : 'LEGENDARY',
    source: 'VAULT',
    classReq: ((player.secret_class || 'WARRIOR').toUpperCase()) as any
  });

  if (!db.data.items) db.data.items = [];
  db.data.items.push(vaultItem);

  if (!db.data.inventory) db.data.inventory = [];
  const invId = 'inv_' + crypto.randomUUID();
  db.data.inventory.push({
    id: invId,
    player_id: player.id,
    item_id: vaultItem.id,
    is_equipped: false,
    purchased_at: new Date().toISOString()
  });

  const bonusGold = 180;
  const bonusXp = 400;
  player.gold = (player.gold || 0) + bonusGold;
  player.xp = (player.xp || 0) + bonusXp;

  // Registrar reclamo
  const weeklyKey = questState.weeklyPeriodKey;
  const vaultClaimKey = `vault_claimed_${playerId}_${weeklyKey}`;
  const existing = db.data.global_states.find((g) => g.key === vaultClaimKey);
  if (existing) {
    existing.value = 'true';
    existing.updated_at = new Date().toISOString();
  } else {
    db.data.global_states.push({
      key: vaultClaimKey,
      value: 'true',
      updated_at: new Date().toISOString()
    });
  }

  db.save();

  sseHub.broadcast('party_updated', {
    message: `🏆 ¡${player.name} ABRIÓ LA GRAN BÓVEDA SEMANAL y despojó [${vaultItem.name}] (${vaultItem.rarity})!`
  });

  return {
    success: true,
    item: vaultItem,
    gold: bonusGold,
    xp: bonusXp,
    message: `¡LA GRAN BÓVEDA SE HA ABIERTO! Has obtenido [${vaultItem.name}], +${bonusGold} 🪙 y +${bonusXp} XP.`
  };
}

/**
 * Hook desacoplado de actividad: avanza misiones según la acción del jugador
 */
export async function recordPlayerActivity(playerId: string, metric: QuestMetric, amount: number = 1): Promise<void> {
  try {
    const db = await getDb();
    if (!db.data.player_quests) return;

    const now = new Date();
    const dailyKey = getDailyPeriodKey(now);
    const weeklyKey = getWeeklyPeriodKey(now);

    const relevantQuests = db.data.player_quests.filter((pq: any) => {
      if (pq.player_id !== playerId || pq.is_completed) return false;
      const isCurrentPeriod = (pq.cadence === 'DAILY' && pq.period_key === dailyKey) ||
                              (pq.cadence === 'WEEKLY' && pq.period_key === weeklyKey);
      if (!isCurrentPeriod) return false;

      const cat = QUEST_CATALOG.find((c) => c.id === pq.quest_id);
      return cat && cat.metric === metric;
    });

    let updatedAny = false;
    for (const pq of relevantQuests as any[]) {
      pq.progress = (pq.progress || 0) + amount;
      if (pq.progress >= pq.target_value) {
        pq.progress = pq.target_value;
        pq.is_completed = true;
        const cat = QUEST_CATALOG.find((c) => c.id === pq.quest_id);
        sseHub.broadcast('party_updated', {
          message: `🎯 ¡Misión cumplida: [${cat?.title || 'Contrato'}]! Reclama tu recompensa en el Tablón.`
        });
      }
      updatedAny = true;
    }

    if (updatedAny) {
      db.save();
    }
  } catch (e) {
    console.error('Error registrando actividad de misión', e);
  }
}
