import { Router, Response } from 'express';
import { authMiddleware, requireDMMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { getDb } from '../db';
import { sseHub } from '../sseHub';
import { getTelemetryLogs } from '../mqttService';
import crypto from 'crypto';

const router = Router();

router.use(authMiddleware);
router.use(requireDMMiddleware);

// GET /api/v1/dm/party
router.get('/party', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const players = await db.all(
      `SELECT id, nfc_uid, name, username, secret_class, role, xp, gold, level, last_scanned_at, created_at
       FROM players ORDER BY level DESC, xp DESC`
    );
    return res.json({ party: players });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/dm/players
router.post('/players', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, username, password = '123', nfcUid, secretClass, role = 'PLAYER' } = req.body;
    if (!name || !nfcUid || !secretClass) {
      return res.status(400).json({ error: 'Campos requeridos: name, nfcUid, secretClass (ROGUE, MAGE, WARRIOR, BARD)' });
    }

    const db = await getDb();
    const id = 'usr_' + crypto.randomUUID().slice(0, 8);
    const privateToken = 'token_' + crypto.randomBytes(12).toString('hex');
    const uName = username || name.toLowerCase().replace(/\s+/g, '_');

    await db.run(
      `INSERT INTO players (id, nfc_uid, name, username, password, secret_class, role, xp, gold, level, private_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?)`,
      [id, nfcUid, name, uName, password, secretClass, role, privateToken]
    );

    const newPlayer = await db.get('SELECT * FROM players WHERE id = ?', [id]);
    sseHub.broadcast('party_updated', { message: `Nuevo aventurero registrado por el DM: ${name}` });

    return res.status(201).json({ player: newPlayer });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/v1/dm/players/:id
router.patch('/players/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { xp, gold, level, secretClass, name, username, nfcUid, streak_days, streakDays } = req.body;

    const db = await getDb();
    const player = await db.get('SELECT * FROM players WHERE id = ?', [id]);
    if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });

    const newXp = xp !== undefined ? parseInt(xp) : player.xp;
    const newGold = gold !== undefined ? parseInt(gold) : player.gold;
    const newLevel = level !== undefined ? parseInt(level) : Math.max(1, 1 + Math.floor(newXp / 250));
    const newStreak = streak_days !== undefined ? parseInt(streak_days) : (streakDays !== undefined ? parseInt(streakDays) : (player.streak_days || 0));
    const newClass = secretClass || player.secret_class;
    const newName = name || player.name;
    const newUsername = username || player.username;
    const newNfc = nfcUid || player.nfc_uid;

    await db.run(
      `UPDATE players SET xp = ?, gold = ?, level = ?, secret_class = ?, name = ?, username = ?, nfc_uid = ?, streak_days = ? WHERE id = ?`,
      [newXp, newGold, newLevel, newClass, newName, newUsername, newNfc, newStreak, id]
    );

    const updated = await db.get('SELECT * FROM players WHERE id = ?', [id]);
    sseHub.broadcast('party_updated', { message: `Jugador ${newName} actualizado por el DM` });

    return res.json({ player: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/dm/players/:id
router.delete('/players/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const player = await db.get('SELECT * FROM players WHERE id = ?', [id]);
    if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });

    await db.run('DELETE FROM player_inventories WHERE player_id = ?', [id]);
    await db.run('DELETE FROM scan_logs WHERE player_id = ?', [id]);
    await db.run('DELETE FROM players WHERE id = ?', [id]);

    sseHub.broadcast('party_updated', { message: `Aventurero ${player.name} ha sido retirado por el DM` });
    return res.json({ message: `Jugador ${player.name} eliminado.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/dm/players/:id/reset-cooldown
router.post('/players/:id/reset-cooldown', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    if (id === 'ALL') {
      await db.run('UPDATE players SET last_scanned_at = NULL');
      sseHub.broadcast('party_updated', { message: 'Cooldowns reiniciados para toda la party' });
      return res.json({ message: 'Cooldowns de toda la party reiniciados' });
    }

    const player = await db.get('SELECT * FROM players WHERE id = ?', [id]);
    if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });

    await db.run('UPDATE players SET last_scanned_at = NULL WHERE id = ?', [id]);
    sseHub.broadcast('party_updated', { message: `Cooldown reiniciado para ${player.name}` });

    return res.json({ message: `Cooldown reiniciado para ${player.name}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/dm/players/:id/grant-item
router.post('/players/:id/grant-item', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { itemId, quantity = 1 } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId es requerido' });

    const db = await getDb();
    const player = await db.get('SELECT * FROM players WHERE id = ?', [id]);
    if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });

    const item = await db.get('SELECT * FROM items WHERE id = ?', [itemId]);
    if (!item) return res.status(404).json({ error: 'Objeto no existe en la tienda' });

    for (let i = 0; i < quantity; i++) {
      const invId = 'inv_' + crypto.randomUUID().slice(0, 8);
      await db.run(
        `INSERT INTO player_inventories (id, player_id, item_id, is_active) VALUES (?, ?, ?, 0)`,
        [invId, id, itemId]
      );
    }

    sseHub.broadcast('party_updated', { message: `El DM ha otorgado ${item.name} x${quantity} a ${player.name}` });
    return res.json({ message: `Se ha entregado ${item.name} x${quantity} a ${player.name}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/dm/party/grant-rewards
router.post('/party/grant-rewards', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { xp = 0, gold = 0, playerIds = [], reason = 'Recompensa del DM' } = req.body;
    const db = await getDb();

    let targetPlayers: any[] = [];
    if (playerIds.length > 0) {
      const placeholders = playerIds.map(() => '?').join(',');
      targetPlayers = await db.all(`SELECT * FROM players WHERE id IN (${placeholders})`, playerIds);
    } else {
      targetPlayers = await db.all(`SELECT * FROM players WHERE role != 'DM'`);
    }

    for (const player of targetPlayers) {
      const newXp = player.xp + parseInt(xp);
      const newGold = player.gold + parseInt(gold);
      const newLevel = 1 + Math.floor(newXp / 250);
      await db.run(`UPDATE players SET xp = ?, gold = ?, level = ? WHERE id = ?`, [
        newXp,
        newGold,
        newLevel,
        player.id
      ]);
    }

    sseHub.broadcast('party_updated', {
      message: `¡El DM ha concedido ${xp} XP y ${gold} de Oro a la party! (${reason})`
    });

    return res.json({ message: `Recompensas otorgadas a ${targetPlayers.length} aventureros.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/dm/items (Crear nuevo ítem en la tienda)
router.post('/items', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, price, type, effectValue, icon } = req.body;
    if (!name || price === undefined || !type) {
      return res.status(400).json({ error: 'Campos requeridos: name, price, type' });
    }

    const db = await getDb();
    const itemId = 'itm_' + crypto.randomUUID().slice(0, 8);
    await db.run(
      `INSERT INTO items (id, name, description, price, type, effect_value, icon) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [itemId, name, description || '', parseInt(price), type, effectValue || 0, icon || 'shield']
    );

    const newItem = await db.get('SELECT * FROM items WHERE id = ?', [itemId]);
    sseHub.broadcast('party_updated', { message: `Nuevo artefacto añadido a la Tienda: ${name}` });

    return res.status(201).json({ item: newItem });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/dm/items/:id (Eliminar ítem de la tienda)
router.delete('/items/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const item = await db.get('SELECT * FROM items WHERE id = ?', [id]);
    if (!item) return res.status(404).json({ error: 'Objeto no encontrado' });

    await db.run('DELETE FROM items WHERE id = ?', [id]);
    sseHub.broadcast('party_updated', { message: `Artefacto ${item.name} retirado de la Tienda por el DM` });

    return res.json({ message: `Artefacto ${item.name} eliminado.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/dm/events/global-buff
router.post('/events/global-buff', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { active, name = 'Ronda de la Casa', xpMultiplier = 1.5, goldMultiplier = 1.5, durationMinutes = 60 } = req.body;
    const db = await getDb();

    const expiresAt = active ? new Date(Date.now() + durationMinutes * 60000).toISOString() : null;
    const buffData = {
      active: Boolean(active),
      name,
      xp_multiplier: parseFloat(xpMultiplier),
      gold_multiplier: parseFloat(goldMultiplier || 1.0),
      expires_at: expiresAt
    };

    await db.run('UPDATE global_states SET value = ? WHERE key = ?', [
      JSON.stringify(buffData),
      'tavern_buff'
    ]);

    sseHub.broadcast('tavern_buff_changed', buffData);

    return res.json({ message: active ? `¡Evento Global '${name}' activado!` : 'Evento Global desactivado', buffData });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/dm/telemetry
router.get('/telemetry', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDb();
    const recentLogs = await db.all(
      `SELECT sl.*, p.name as player_name 
       FROM scan_logs sl 
       JOIN players p ON sl.player_id = p.id 
       ORDER BY sl.created_at DESC LIMIT 20`
    );

    return res.json({
      uptimeSeconds: process.uptime(),
      mqttConnected: true,
      lastPayloads: getTelemetryLogs(),
      recentAuditScanLogs: recentLogs
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
