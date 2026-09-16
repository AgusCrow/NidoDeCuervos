import { Router, Request, Response } from 'express';
import { getDb } from '../db';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password, nfcUid } = req.body;

    const db = await getDb();

    // 1. NFC Login attempt
    if (nfcUid) {
      const player = await db.get('SELECT * FROM players WHERE nfc_uid = ?', [nfcUid]);
      if (!player) {
        return res.status(401).json({ error: `No existe ningún aventurero registrado con el NFC UID: ${nfcUid}` });
      }
      return res.json({
        message: `¡Bienvenido de vuelta, ${player.name}!`,
        token: player.private_token,
        player: {
          id: player.id,
          name: player.name,
          username: player.username,
          secretClass: player.secret_class,
          role: player.role,
          level: player.level,
          xp: player.xp,
          gold: player.gold,
          nfcUid: player.nfc_uid
        }
      });
    }

    // 2. Username & Password Login attempt
    if (!username || !password) {
      return res.status(400).json({ error: 'Ingresa tu usuario y contraseña o escanea tu llavero NFC' });
    }

    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();

    const player = await db.get('SELECT * FROM players WHERE username = ?', [cleanUsername]);

    if (!player) {
      return res.status(401).json({ error: 'Usuario no encontrado en el gremio' });
    }

    // Validate password (trimmed and flexible match)
    if (player.password) {
      const matchExact = player.password === cleanPassword;
      const matchLower = player.password.toLowerCase() === cleanPassword.toLowerCase();
      if (!matchExact && !matchLower) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }
    }

    return res.json({
      message: `¡Bienvenido de vuelta, ${player.name}!`,
      token: player.private_token,
      player: {
        id: player.id,
        name: player.name,
        username: player.username,
        secretClass: player.secret_class,
        role: player.role,
        level: player.level,
        xp: player.xp,
        gold: player.gold,
        nfcUid: player.nfc_uid
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/auth/nfc-login
router.post('/nfc-login', async (req: Request, res: Response) => {
  try {
    const { nfcUid } = req.body;
    if (!nfcUid) return res.status(400).json({ error: 'nfcUid es requerido' });

    const db = await getDb();
    const player = await db.get('SELECT * FROM players WHERE nfc_uid = ?', [nfcUid]);
    if (!player) {
      return res.status(401).json({ error: `NFC UID ${nfcUid} no registrado` });
    }

    return res.json({
      message: `¡Autenticado vía NFC como ${player.name}!`,
      token: player.private_token,
      player
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, name, secretClass } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Usuario, contraseña y nombre del personaje son requeridos.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();
    const cleanName = String(name).trim();

    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres.' });
    }
    if (cleanPassword.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
    }

    const validClasses = ['WARRIOR', 'MAGE', 'ROGUE', 'BARD'];
    const chosenClass = validClasses.includes(String(secretClass).toUpperCase())
      ? String(secretClass).toUpperCase()
      : 'WARRIOR';

    const db = await getDb();
    const existing = await db.get('SELECT * FROM players WHERE username = ?', [cleanUsername]);
    if (existing) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado en la taberna.' });
    }

    const randomSuffix = Math.random().toString(16).substring(2, 10).toUpperCase();
    const newId = 'usr_' + randomSuffix.toLowerCase();
    const newNfcUid = '04' + randomSuffix + 'A1B2';
    const newToken = 'token_' + randomSuffix.toLowerCase() + '_' + Date.now();

    // STRICT ROLE FORCING: Always 'PLAYER' (Never 'DM')
    const role = 'PLAYER';

    await db.run(
      `INSERT INTO players (id, nfc_uid, name, secret_class, role, xp, gold, level, private_token, username, password)
       VALUES (?, ?, ?, ?, ?, 0, 50, 1, ?, ?, ?)`,
      [newId, newNfcUid, cleanName, chosenClass, role, newToken, cleanUsername, cleanPassword]
    );

    const newPlayer = await db.get('SELECT * FROM players WHERE id = ?', [newId]);

    return res.status(201).json({
      message: `¡Personaje ${cleanName} (${chosenClass}) registrado exitosamente!`,
      token: newToken,
      player: {
        id: newId,
        name: cleanName,
        username: cleanUsername,
        secretClass: chosenClass,
        role: role,
        level: 1,
        xp: 0,
        gold: 50,
        nfcUid: newNfcUid
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
