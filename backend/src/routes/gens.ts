import { Router, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { getDb, PlayerRow } from '../db';
import { awardPlayerGold } from '../services/goldService';

const router = Router();

export interface GensRankDef {
  rankId: string;
  name: string;
  minPoints: number;
  icon: string;
  bonusTitle: string;
  statBonus: string;
}

export const GENS_RANKS: GensRankDef[] = [
  { rankId: 'rank_private', name: 'Recluta (Private)', minPoints: 0, icon: '🔰', bonusTitle: 'Recluta de Facción', statBonus: '+5% XP' },
  { rankId: 'rank_sergeant', name: 'Sargento (Sergeant)', minPoints: 500, icon: '🎖️', bonusTitle: 'Sargento de Hierro', statBonus: '+5% Oro, +5% XP' },
  { rankId: 'rank_lieutenant', name: 'Teniente (Lieutenant)', minPoints: 2000, icon: '⚔️', bonusTitle: 'Teniente Vanguardia', statBonus: '+10% Daño PvP, +1 Tirada D20' },
  { rankId: 'rank_captain', name: 'Capitán (Captain)', minPoints: 5000, icon: '🛡️', bonusTitle: 'Capitán de Asedio', statBonus: '+15% Daño PvP, +10% DEF' },
  { rankId: 'rank_general', name: 'General de Élite', minPoints: 12000, icon: '👑', bonusTitle: 'General de Facción', statBonus: '+20% Daño PvP, +2 Tirada D20' },
  { rankId: 'rank_grand_duke', name: 'Gran Duque (Grand Duke)', minPoints: 30000, icon: '🔱', bonusTitle: 'Gran Duque Supremo', statBonus: '+30% Daño PvP, +25% DEF, +3 Tirada D20' }
];

export function calculateGensRank(points: number = 0): GensRankDef {
  let selected = GENS_RANKS[0];
  for (const r of GENS_RANKS) {
    if (points >= r.minPoints) {
      selected = r;
    }
  }
  return selected;
}

// GET /api/v1/gens/state
router.get('/state', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const freshUser = (db.data.players.find((p) => p.id === user.id) || user) as PlayerRow;

    const duprianPlayers = db.data.players
      .filter((p) => p.gens_faction === 'DUPRIAN')
      .sort((a, b) => (b.gens_points || 0) - (a.gens_points || 0))
      .slice(0, 10);

    const vanertPlayers = db.data.players
      .filter((p) => p.gens_faction === 'VANERT')
      .sort((a, b) => (b.gens_points || 0) - (a.gens_points || 0))
      .slice(0, 10);

    const currentRank = calculateGensRank(freshUser.gens_points || 0);

    // Gens Quests activas
    const quests = [
      { id: 'gq_1', title: 'Cacería de la Rosa', description: 'Vence 3 d20 duelos frente a la facción opuesta.', rewardPoints: 250, rewardGold: 5000, target: 3, current: freshUser.pvp_wins || 0 },
      { id: 'gq_2', title: 'Asedio de Contribución', description: 'Participa en eventos competitivos de facción.', rewardPoints: 500, rewardGold: 12000, target: 1, current: 0 }
    ];

    return res.json({
      gensFaction: freshUser.gens_faction || null,
      gensPoints: freshUser.gens_points || 0,
      gensRank: currentRank,
      duprianLeaderboard: duprianPlayers.map((p) => ({ id: p.id, name: p.name, points: p.gens_points || 0, rank: calculateGensRank(p.gens_points || 0).name })),
      vanertLeaderboard: vanertPlayers.map((p) => ({ id: p.id, name: p.name, points: p.gens_points || 0, rank: calculateGensRank(p.gens_points || 0).name })),
      quests
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/gens/join
router.post('/join', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = req.user!;
    const { faction } = req.body;

    if (faction !== 'DUPRIAN' && faction !== 'VANERT') {
      return res.status(400).json({ error: 'Debes elegir Duprian (Rosa Sangrienta) o Vanert (Sol Arcano).' });
    }

    const freshUser = db.data.players.find((p) => p.id === user.id);
    if (!freshUser) return res.status(404).json({ error: 'Jugador no encontrado' });

    // Verificar restricciones de Clan
    if (db.data.clan_members) {
      const myMembership = db.data.clan_members.find((cm) => cm.player_id === freshUser.id);
      if (myMembership) {
        const clan = db.data.clans.find((c) => c.id === myMembership.clan_id);
        if (clan) {
          const leaderMember = db.data.clan_members.find((cm) => cm.clan_id === clan.id && cm.role === 'LEADER');
          if (leaderMember && leaderMember.player_id !== freshUser.id) {
            const leaderPlayer = db.data.players.find((p) => p.id === leaderMember.player_id);
            if (leaderPlayer && leaderPlayer.gens_faction && leaderPlayer.gens_faction !== faction) {
              return res.status(400).json({
                error: `¡Tu Clan "${clan.name}" está juramentado a ${leaderPlayer.gens_faction}! Debes alinearte a la misma facción de tu líder.`
              });
            }
          }
        }
      }
    }

    freshUser.gens_faction = faction;
    if (!freshUser.gens_points) freshUser.gens_points = 100; // Bono inicial de juramento
    db.save();

    const rank = calculateGensRank(freshUser.gens_points);
    return res.json({
      success: true,
      message: `⚔️ ¡Has jurado lealtad eterna a la facción ${faction === 'DUPRIAN' ? 'DUPRIAN (Rosa Sangrienta)' : 'VANERT (Sol Arcano)'}!`,
      gensFaction: freshUser.gens_faction,
      gensPoints: freshUser.gens_points,
      gensRank: rank
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/gens/clan-rankings
router.get('/clan-rankings', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const clans = db.data.clans || [];

    const sortedClans = [...clans].map((c) => {
      const leaderMember = db.data.clan_members.find((cm) => cm.clan_id === c.id && cm.role === 'LEADER');
      const leaderPlayer = leaderMember ? db.data.players.find((p) => p.id === leaderMember.player_id) : null;
      const memberCount = db.data.clan_members.filter((cm) => cm.clan_id === c.id).length;

      return {
        id: c.id,
        name: c.name,
        tag: c.tag,
        emblem: c.emblem || '🛡️',
        level: c.level || 1,
        clan_xp: c.clan_xp || 0,
        treasury_gold: c.treasury_gold || 0,
        member_count: memberCount,
        leader_name: leaderPlayer ? leaderPlayer.name : 'Desconocido',
        gens_faction: leaderPlayer?.gens_faction || 'NEUTRAL'
      };
    }).sort((a, b) => (b.clan_xp - a.clan_xp) || (b.treasury_gold - a.treasury_gold));

    return res.json({ clans: sortedClans });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
