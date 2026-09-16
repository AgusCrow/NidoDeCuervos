import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import playerRouter from './routes/player';
import dmRouter from './routes/dm';
import scanRouter from './routes/scan';
import telegramRouter from './routes/telegram';
import versionRouter from './routes/version';
import gensRouter from './routes/gens';
import eventsRouter from './routes/events';
import { getDb } from './db';
import { initMqttService } from './mqttService';
import { initTelegramBotPolling } from './telegramService';
import { sseHub } from './sseHub';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Public TV SSE Stream
app.get('/api/v1/public/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = 'tv_' + crypto.randomUUID();
  sseHub.addClient({ id: clientId, role: 'TV', res });
});

// Register Routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/player', playerRouter);
app.use('/api/v1/dm', dmRouter);
app.use('/api/v1/scan', scanRouter);
app.use('/api/v1/telegram', telegramRouter);
app.use('/api/v1/version', versionRouter);
app.use('/api/v1/gens', gensRouter);
app.use('/api/v1/events', eventsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', system: 'El Gremio RPG NFC Server', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    await getDb();
    console.log('[DB] Base de datos inicializada correctamente.');

    initMqttService();
    initTelegramBotPolling();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  ⚔️  EL GREMIO DE LA TABERNA - BACKEND SERVER  ⚔️`);
      console.log(`  Escuchando en http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (err: any) {
    console.error('Error fatal al iniciar el servidor backend:', err);
    process.exit(1);
  }
}

startServer();

