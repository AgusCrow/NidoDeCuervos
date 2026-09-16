import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    nfc_uid: string;
    name: string;
    secret_class: string;
    role: string;
    xp: number;
    gold: number;
    level: number;
    private_token: string;
    title?: string;
    equipped_title?: string;
    pvp_wins?: number;
    pvp_losses?: number;
    nat20_streak?: number;
    telegram_id?: string | null;
    guild_tokens?: number;
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido (Bearer <private_token> o ?token=...)' });
  }
  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM players WHERE private_token = ? OR id = ?', [token, token]);
    if (!user) {
      return res.status(401).json({ error: 'Token de usuario inválido o caducado.' });
    }
    req.user = user;
    next();
  } catch (err: any) {
    return res.status(500).json({ error: 'Error interno de base de datos.' });
  }
}

export function requireDMMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'DM') {
    return res.status(403).json({ error: 'Acceso denegado: Se requiere rol Dungeon Master (DM)' });
  }
  next();
}
