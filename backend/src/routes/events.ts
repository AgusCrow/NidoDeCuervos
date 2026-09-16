import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { getDb, PlayerRow } from '../db';
import { awardPlayerGold } from '../services/goldService';
import { generateProceduralItem } from '../services/itemGenerator';

const router = Router();

// ==========================================
// 1. ARKA WAR (King of the Hill Multi-Nodo)
// ==========================================
let arkaWarState = {
  status: 'ACTIVE' as 'LOBBY' | 'ACTIVE' | 'FINISHED',
  nodes: [
    { id: 'node_sun', name: 'Obelisco del Sol Arcano', controlledBy: 'Vanert', pointsPerSec: 10, currentHolder: 'Gremio Sol Astral', hp: 500 },
    { id: 'node_rose', name: 'Obelisco de la Rosa Sangrienta', controlledBy: 'Duprian', pointsPerSec: 10, currentHolder: 'Gremio Rosa Carmesí', hp: 500 },
    { id: 'node_abyssal', name: 'Obelisco del Núcleo Abisal', controlledBy: 'NEUTRAL', pointsPerSec: 25, currentHolder: 'Ninguno', hp: 800 }
  ],
  scores: { Duprian: 350, Vanert: 420 },
  logs: [] as { time: string; text: string }[]
};

router.get('/arka-war/state', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  return res.json({ state: arkaWarState });
});

router.post('/arka-war/action', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = (db.data.players.find((p) => p.id === user.id) || user) as PlayerRow;
    const { nodeId, actionType } = req.body; // 'CHANNEL' | 'DEFEND' | 'ATTACK'

    const d20 = Math.floor(Math.random() * 20) + 1;
    const isCrit = d20 === 20;

    const node = arkaWarState.nodes.find((n) => n.id === nodeId) || arkaWarState.nodes[2];
    const faction = freshUser.gens_faction || 'DUPRIAN';

    let deltaPoints = d20 * (isCrit ? 3 : 1.5);
    if (faction === 'DUPRIAN') arkaWarState.scores.Duprian += Math.round(deltaPoints);
    else arkaWarState.scores.Vanert += Math.round(deltaPoints);

    if (d20 >= 12) {
      node.controlledBy = faction;
      node.currentHolder = freshUser.name;
    }

    const goldReward = awardPlayerGold(freshUser, 800 + d20 * 150);
    const xpReward = 1200 + d20 * 100;
    freshUser.xp = (freshUser.xp || 0) + xpReward;

    const logEntry = {
      time: new Date().toLocaleTimeString(),
      text: `🚩 [Arka War] ${freshUser.name} (${faction}) tiró D20=[${d20}] en ${node.name}. ¡Sumó +${Math.round(deltaPoints)} Puntos!`
    };
    arkaWarState.logs.unshift(logEntry);
    if (arkaWarState.logs.length > 30) arkaWarState.logs.pop();

    db.save();

    return res.json({
      success: true,
      d20,
      isCrit,
      faction,
      pointsEarned: Math.round(deltaPoints),
      goldEarned: goldReward.awarded,
      xpEarned: xpReward,
      log: logEntry.text,
      state: arkaWarState
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. PROTECTOR OF ACHERON (Tower Defense Monolito)
// ==========================================
let acheronState = {
  status: 'IN_PROGRESS' as 'IN_PROGRESS' | 'VICTORY' | 'DEFEATED',
  wave: 3,
  maxWaves: 5,
  monolithHp: 750,
  maxMonolithHp: 1000,
  mobs: [
    { type: 'EXPLOSIVE_KAMIKAZE', name: 'Espectro Ígneo Explosivo', hp: 120, threat: 'HIGH' },
    { type: 'HEAVY_BEHEMOTH', name: 'Gólem de Granito Devastador', hp: 450, threat: 'MEDIUM' }
  ],
  logs: [] as string[]
};

router.get('/acheron/state', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  return res.json({ state: acheronState });
});

router.post('/acheron/action', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id) || user;
    const { actionType } = req.body; // 'INTERCEPT_KAMIKAZE' | 'TAUNT_BEHEMOTH' | 'REPAIR_MONOLITH'

    const d20 = Math.floor(Math.random() * 20) + 1;
    const isCrit = d20 >= 18;

    let text = '';
    if (actionType === 'REPAIR_MONOLITH') {
      const heal = (d20 * 15) + (isCrit ? 100 : 0);
      acheronState.monolithHp = Math.min(acheronState.maxMonolithHp, acheronState.monolithHp + heal);
      text = `🛡️ [Acheron] ${freshUser.name} reparó la barrera del Monolito D20=[${d20}] (+${heal} HP Monolito).`;
    } else {
      const dmg = (d20 * 25) + (isCrit ? 200 : 0);
      text = `💥 [Acheron] ${freshUser.name} interceptó las hordas enemigas D20=[${d20}] (Infringió ${dmg} de daño).`;
    }

    const goldRes = awardPlayerGold(freshUser, 1000 + d20 * 200);
    freshUser.xp = (freshUser.xp || 0) + (1500 + d20 * 150);

    acheronState.logs.unshift(text);
    if (acheronState.logs.length > 25) acheronState.logs.pop();

    db.save();

    return res.json({
      success: true,
      d20,
      isCrit,
      goldEarned: goldRes.awarded,
      xpEarned: 1500 + d20 * 150,
      log: text,
      state: acheronState
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. TORMENTED SQUARE (Arena Score Attack)
// ==========================================
router.post('/tormented-square/play', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id) || user;

    const d20 = Math.floor(Math.random() * 20) + 1;
    const isCrit = d20 >= 18;
    const score = (d20 * 450) + (isCrit ? 3000 : 0);

    const goldRes = awardPlayerGold(freshUser, 1500 + d20 * 300);
    const xpEarned = 2500 + d20 * 250;
    freshUser.xp = (freshUser.xp || 0) + xpEarned;

    let droppedItem = null;
    if (d20 >= 16) {
      droppedItem = generateProceduralItem({
        playerLevel: freshUser.level || 1,
        source: 'BOSS_DROP',
        minRarityRank: 4 // Épico o superior
      });
      const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.data.items.push(droppedItem);
      db.data.inventory.push({
        id: invId,
        player_id: freshUser.id,
        item_id: droppedItem.id,
        is_equipped: false,
        purchased_at: new Date().toISOString()
      });
    }

    db.save();

    return res.json({
      success: true,
      d20,
      isCrit,
      score,
      goldEarned: goldRes.awarded,
      xpEarned,
      droppedItem,
      message: `🏆 ¡Superaste las rondas de Tormented Square! Puntuación Final: ${score} Pts.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. CHAOS CASTLE BATTLE CORE (Battle Royale Colapsable)
// ==========================================
router.post('/chaos-castle/enter', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = db.data.players.find((p) => p.id === user.id) || user;

    const d20 = Math.floor(Math.random() * 20) + 1;
    const isVictory = d20 >= 15;

    let droppedItem = null;
    if (isVictory) {
      // Recompensa victoriosa con item de rareza alta
      droppedItem = generateProceduralItem({
        playerLevel: freshUser.level || 1,
        source: 'CLAN_WAR',
        minRarityRank: 6 // Recompensa Mítica o superior
      });
      const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.data.items.push(droppedItem);
      db.data.inventory.push({
        id: invId,
        player_id: freshUser.id,
        item_id: droppedItem.id,
        is_equipped: false,
        purchased_at: new Date().toISOString()
      });
    }

    const goldRes = awardPlayerGold(freshUser, isVictory ? 25000 : 3000);
    const xpEarned = isVictory ? 15000 : 3000;
    freshUser.xp = (freshUser.xp || 0) + xpEarned;

    db.save();

    return res.json({
      success: true,
      d20,
      isVictory,
      anonymousAlias: `Soldado Oscuro #${Math.floor(Math.random() * 899 + 100)}`,
      goldEarned: goldRes.awarded,
      xpEarned,
      droppedItem,
      message: isVictory 
        ? '👑 ¡VICTORIA ABSOLUTA! Fuiste el único sobreviviente en pie sobre la plataforma del Chaos Castle.' 
        : '💥 Caíste en el vacío tras ser empujado fuera de la plataforma por un contendiente anónimo.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
