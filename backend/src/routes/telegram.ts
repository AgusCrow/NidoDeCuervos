import { Router, Request, Response } from 'express';
import { handleTelegramMessage } from '../telegramService';

const router = Router();

// Telegram Webhook Handler
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    if (update && update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const username = update.message.from.username || update.message.from.first_name || 'Jugador';
      await handleTelegramMessage(chatId, username, update.message.text);
    } else if (update && update.callback_query && update.callback_query.data) {
      const chatId = update.callback_query.message.chat.id;
      const username = update.callback_query.from.username || update.callback_query.from.first_name || 'Jugador';
      const data = update.callback_query.data;
      const classChoice = data.startsWith('class_') ? data.replace('class_', '') : data;
      await handleTelegramMessage(chatId, username, classChoice);
    }
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[Telegram Webhook Error]:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Test / Simulate Command Endpoint from PWA or test scripts
router.post('/simulate-command', async (req: Request, res: Response) => {
  try {
    const { chatId, username, commandText } = req.body;
    if (!chatId || !commandText) {
      return res.status(400).json({ error: 'chatId y commandText requeridos.' });
    }
    await handleTelegramMessage(chatId, username || 'Tester', commandText);
    return res.status(200).json({ ok: true, message: `Comando '${commandText}' procesado exitosamente.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
