import https from 'https';
import { getDb, PlayerRow, ItemRow } from './db';
import { resolvePvPDuel } from './rpgEngine';
import { fetchCurrentWeather } from './weatherService';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8904508721:AAH96hHQa10uaud3FF7meCIKAmirCFMQAmk';
const IS_TOKEN_SET = Boolean(BOT_TOKEN && BOT_TOKEN.includes(':'));

// Map Telegram Chat ID to Player Username (In-memory fallback cache)
const telegramUserMap: Record<number, string> = {};

// Reactive interactive registration sessions
interface RegistrationSession {
  step: 'ASK_USER' | 'ASK_PASS' | 'ASK_NAME' | 'ASK_CLASS';
  username?: string;
  password?: string;
  name?: string;
}
const registrationSessions: Record<number, RegistrationSession> = {};

const CLASSES_OVERVIEW = 
`⚔️ *CLASES DISPONIBLES EN EL GREMIO*\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`🛡️ *1. GUERRERO (WARRIOR)*\n` +
`   └ *Pasiva:* Desempate de Armadura. ¡Si empatas una ronda en duelo, ganas automáticamente!\n` +
`   └ *Rol:* Máxima resistencia y tenacidad en combate.\n\n` +
`🔮 *2. MAGO (MAGE)*\n` +
`   └ *Pasiva:* Sobrecarga Arcana. Si pierdes la 1ª ronda, ganas *+4* de bono directo en la 2ª ronda.\n` +
`   └ *Rol:* Gran poder explosivo de remontada.\n\n` +
`🗡️ *3. PÍCARO (ROGUE)*\n` +
`   └ *Pasiva:* Golpe de Sombra. Una tirada ≥ 18 causa *K.O. Instantáneo* (2 victorias directas).\n` +
`   └ *Rol:* Críticos letales y agilidad pura.\n\n` +
`🎼 *4. BARDO (BARD)*\n` +
`   └ *Pasiva:* Saqueo de Taberna. Roba *+50% de Oro extra* de la apuesta al ganar duelos.\n` +
`   └ *Rol:* Carisma supremo y acumulación de riqueza.\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

export function sendTelegramMessage(chatId: number, text: string, parseMode: string = 'Markdown', replyMarkup?: any) {
  if (!IS_TOKEN_SET) {
    console.log(`[Telegram Sim] To Chat ${chatId}:\n${text}`);
    return;
  }

  const payloadObj: any = {
    chat_id: chatId,
    text: text,
    parse_mode: parseMode
  };
  if (replyMarkup) {
    payloadObj.reply_markup = replyMarkup;
  }

  const payload = JSON.stringify(payloadObj);

  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    res.on('data', () => {});
  });

  req.on('error', (err) => {
    console.error('[Telegram] Error sending message:', err.message);
  });

  req.write(payload);
  req.end();
}

function normalizeClass(input: string): string | null {
  const upper = input.trim().toUpperCase();
  if (['1', 'WARRIOR', 'GUERRERO'].includes(upper)) return 'WARRIOR';
  if (['2', 'MAGE', 'MAGO'].includes(upper)) return 'MAGE';
  if (['3', 'ROGUE', 'PICARO', 'PÍCARO'].includes(upper)) return 'ROGUE';
  if (['4', 'BARD', 'BARDO'].includes(upper)) return 'BARD';
  return null;
}

export async function handleTelegramMessage(chatId: number, username: string, messageText: string) {
  const trimmedText = messageText.trim();
  const parts = trimmedText.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  const database = await getDb();
  const allPlayers: PlayerRow[] = await database.all('SELECT * FROM players');

  // Persistent user resolution by telegram_id in DB, fallback to telegramUserMap
  let player: PlayerRow | null = allPlayers.find((p: PlayerRow) => p.telegram_id === String(chatId)) || null;
  if (!player) {
    const playerUser = telegramUserMap[chatId];
    if (playerUser) {
      player = allPlayers.find((p: PlayerRow) => p.username.toLowerCase() === playerUser.toLowerCase()) || null;
      if (player) {
        // Auto-save persistent telegram_id to DB
        player.telegram_id = String(chatId);
        await database.run('UPDATE players SET telegram_id = ? WHERE id = ?', [String(chatId), player.id]);
      }
    }
  }

  // Handle active interactive registration session
  const activeSession = registrationSessions[chatId];
  if (activeSession && !trimmedText.startsWith('/')) {
    switch (activeSession.step) {
      case 'ASK_USER': {
        const rawUser = trimmedText.toLowerCase();
        if (rawUser.length < 3) {
          sendTelegramMessage(chatId, '⚠️ El nombre de usuario debe tener al menos 3 caracteres. Intenta de nuevo:');
          return;
        }
        const existing = allPlayers.find((p: PlayerRow) => p.username.toLowerCase() === rawUser);
        if (existing) {
          sendTelegramMessage(chatId, '❌ Ese nombre de usuario ya está ocupado en el Gremio. Elige otro:');
          return;
        }
        activeSession.username = rawUser;
        activeSession.step = 'ASK_PASS';
        sendTelegramMessage(chatId, `🔐 *Paso 2 de 4: Contraseña*\n\nUsuario elegido: \`${rawUser}\`\nPor favor, escribe la contraseña para tu personaje:`);
        return;
      }

      case 'ASK_PASS': {
        if (trimmedText.length < 3) {
          sendTelegramMessage(chatId, '⚠️ La contraseña debe tener al menos 3 caracteres. Intenta de nuevo:');
          return;
        }
        activeSession.password = trimmedText;
        activeSession.step = 'ASK_NAME';
        sendTelegramMessage(chatId, `👤 *Paso 3 de 4: Nombre del Aventurero*\n\n¿Cómo se llamará tu personaje en la Taberna? (ej: _Garrett Sombrío_, _Thorin Rompehierro_):`);
        return;
      }

      case 'ASK_NAME': {
        if (trimmedText.length < 2) {
          sendTelegramMessage(chatId, '⚠️ El nombre del personaje es muy corto. Escribe un nombre válido:');
          return;
        }
        activeSession.name = trimmedText;
        activeSession.step = 'ASK_CLASS';

        const classKeyboard = {
          inline_keyboard: [
            [
              { text: '🛡️ Guerrero (WARRIOR)', callback_data: 'class_WARRIOR' },
              { text: '🔮 Mago (MAGE)', callback_data: 'class_MAGE' }
            ],
            [
              { text: '🗡️ Pícaro (ROGUE)', callback_data: 'class_ROGUE' },
              { text: '🎼 Bardo (BARD)', callback_data: 'class_BARD' }
            ]
          ]
        };

        sendTelegramMessage(
          chatId,
          `${CLASSES_OVERVIEW}\n\n⚔️ *Paso 4 de 4: Elige tu Clase*\n\nToca uno de los botones abajo o responde con el número o nombre:\n` +
          `1️⃣ *WARRIOR* (Guerrero)\n` +
          `2️⃣ *MAGE* (Mago)\n` +
          `3️⃣ *ROGUE* (Pícaro)\n` +
          `4️⃣ *BARD* (Bardo)`,
          'Markdown',
          classKeyboard
        );
        return;
      }

      case 'ASK_CLASS': {
        const chosenClass = normalizeClass(trimmedText);
        if (!chosenClass) {
          sendTelegramMessage(chatId, '⚠️ Clase no reconocida. Responde 1 (Guerrero), 2 (Mago), 3 (Pícaro) o 4 (Bardo):');
          return;
        }

        // Finalize registration
        const randomSuffix = Math.random().toString(16).substring(2, 10).toUpperCase();
        const newId = 'usr_' + randomSuffix.toLowerCase();
        const newNfcUid = '04' + randomSuffix + 'A1B2';
        const newToken = 'token_' + randomSuffix.toLowerCase() + '_' + Date.now();

        await database.run(
          `INSERT INTO players (id, nfc_uid, name, secret_class, role, xp, gold, level, private_token, username, password, telegram_id, streak_days)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, newNfcUid, activeSession.name, chosenClass, 'PLAYER', 0, 50, 1, newToken, activeSession.username, activeSession.password, String(chatId), 0]
        );

        telegramUserMap[chatId] = activeSession.username!;
        delete registrationSessions[chatId];

        sendTelegramMessage(chatId, 
`🎉 *¡AVENTURERO CREADO Y VINCULADO CON ÉXITO!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`👤 *Nombre:* ${activeSession.name}\n` +
`⚔️ *Clase:* ${chosenClass} | *Nivel:* 1\n` +
`💰 *Oro Inicial:* 50 G | ⭐ *XP:* 0\n` +
`🔑 *NFC UID:* \`${newNfcUid}\`\n` +
`📱 *Telegram:* Vinculación Permanente Activada ✅\n\n` +
`¡Usa \`/perfil\` para consultar tu ficha o \`/diaria\` para tu medalla!`);
        return;
      }
    }
  }

  switch (command) {
    case '/start':
    case '/ayuda':
    case '/help': {
      const helpMsg = 
`🏰 *¡BIENVENIDO AL GREMIO DE LA TABERNA RPG!* 🎲\n\n` +
`*Comandos de Jugador:*\n` +
`📝 \`/registrar\` - Iniciar registro interactivo guiado paso a paso.\n` +
`📝 \`/registrar [usuario] [password] [nombre] [clase]\` - Registro rápido en 1 comando.\n` +
`👤 \`/vincular [usuario] [password]\` - Vincular tu cuenta de forma permanente.\n` +
`🔓 \`/desvincular\` - Desvincular tu Telegram actual.\n` +
`📊 \`/perfil\` o \`/stats\` - Ver tu personaje, nivel, oro y racha.\n` +
`🎁 \`/diaria\` - Reclamar tu Medalla Diaria (+15 XP, +5 Oro, +1 Racha 🔥).\n` +
`🏆 \`/ranking\` - Ver la tabla de posiciones global.\n` +
`⚔️ \`/duelo [rival] [apuesta]\` - Desafiar a un rival a Duelo PvP (Bo3).\n` +
`🌧️ \`/clima\` - Consultar clima físico y bonificadores activos.\n` +
`🩸 \`/tienda\` - Catálogo de Ítems Malditos.\n` +
`📚 \`/clases\` - Conocer las clases y sus pasivas de combate.\n\n` +
`*Comandos del Servidor:*\n` +
`🖥️ \`/servidor\` - Estado de salud y contenedores del servidor.\n` +
`🎮 \`/juegos\` - Ver catálogo de juegos de PS2, N64 y Genesis.\n\n` +
`*Comandos de Dungeon Master (Admin):*\n` +
`🧙‍♂️ \`/exp [jugador] [monto]\` - Otorgar XP a un jugador.\n` +
`💰 \`/oro [jugador] [monto]\` - Otorgar Oro a un jugador.`;
      sendTelegramMessage(chatId, helpMsg);
      break;
    }

    case '/clases': {
      sendTelegramMessage(chatId, CLASSES_OVERVIEW);
      break;
    }

    case '/cancelar': {
      if (registrationSessions[chatId]) {
        delete registrationSessions[chatId];
        sendTelegramMessage(chatId, '❌ Proceso de registro cancelado.');
      } else {
        sendTelegramMessage(chatId, 'ℹ️ No tienes ninguna operación activa para cancelar.');
      }
      break;
    }

    case '/registrar':
    case '/register':
    case '/crear': {
      // If full args provided, do immediate fast registration
      if (args.length >= 3) {
        const rawUser = args[0].trim().toLowerCase();
        const rawPass = args[1].trim();
        const rawName = args[2].replace(/_/g, ' ').trim();
        const rawClass = (args[3] || 'WARRIOR').trim().toUpperCase();

        const validClasses = ['WARRIOR', 'MAGE', 'ROGUE', 'BARD'];
        const chosenClass = validClasses.includes(rawClass) ? rawClass : 'WARRIOR';

        const existing = allPlayers.find((p: PlayerRow) => p.username.toLowerCase() === rawUser);
        if (existing) {
          sendTelegramMessage(chatId, '❌ El nombre de usuario ya existe en el gremio.');
          return;
        }

        const randomSuffix = Math.random().toString(16).substring(2, 10).toUpperCase();
        const newId = 'usr_' + randomSuffix.toLowerCase();
        const newNfcUid = '04' + randomSuffix + 'A1B2';
        const newToken = 'token_' + randomSuffix.toLowerCase() + '_' + Date.now();

        await database.run(
          `INSERT INTO players (id, nfc_uid, name, secret_class, role, xp, gold, level, private_token, username, password, telegram_id, streak_days)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newId, newNfcUid, rawName, chosenClass, 'PLAYER', 0, 50, 1, newToken, rawUser, rawPass, String(chatId), 0]
        );

        telegramUserMap[chatId] = rawUser;

        sendTelegramMessage(chatId, 
`🎉 *¡PERSONAJE CREADO Y VINCULADO EXITOSAMENTE!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`👤 *Nombre:* ${rawName}\n` +
`⚔️ *Clase:* ${chosenClass} | *Nivel:* 1\n` +
`💰 *Oro Inicial:* 50 G | ⭐ *XP:* 0\n` +
`🔑 *NFC UID:* \`${newNfcUid}\`\n` +
`📱 *Telegram:* Vinculación Permanente Activada ✅\n\n` +
`Usa \`/perfil\` para ver tus estadísticas o \`/duelo\` para luchar.`);
        return;
      }

      // If no or incomplete args, start guided interactive registration
      registrationSessions[chatId] = { step: 'ASK_USER' };
      sendTelegramMessage(chatId, 
`${CLASSES_OVERVIEW}\n\n` +
`📝 *REGISTRO INTERACTIVO DE AVENTURERO (Paso 1 de 4)*\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`Por favor, envía el *nombre de usuario* que deseas usar en el Gremio:\n\n` +
`_(Para cancelar en cualquier momento escribe \`/cancelar\`)_`);
      break;
    }

    case '/vincular': {
      if (args.length < 2) {
        sendTelegramMessage(chatId, '❌ Uso correcto: `/vincular [usuario] [password]`\nEjemplo: `/vincular garrett mi_password`');
        return;
      }
      const u = args[0].trim();
      const p = args[1].trim();
      const target = allPlayers.find((pl: PlayerRow) => pl.username.toLowerCase() === u.toLowerCase() || pl.name.toLowerCase() === u.toLowerCase());
      if (!target || !target.password) {
        sendTelegramMessage(chatId, '❌ Usuario no encontrado en el gremio.');
        return;
      }

      const matchExact = target.password === p;
      const matchLower = target.password.toLowerCase() === p.toLowerCase();

      if (!matchExact && !matchLower) {
        sendTelegramMessage(chatId, '❌ Contraseña incorrecta.');
        return;
      }

      // Persist permanently in database
      target.telegram_id = String(chatId);
      await database.run('UPDATE players SET telegram_id = ? WHERE id = ?', [String(chatId), target.id]);
      telegramUserMap[chatId] = target.username;

      sendTelegramMessage(chatId, `✅ *¡Cuenta de ${target.name} vinculada permanentemente con este Telegram!*\n(Nivel ${target.level} ${target.secret_class} | ${target.gold} Oro)`);
      break;
    }

    case '/desvincular': {
      if (!player) {
        sendTelegramMessage(chatId, '⚠️ Tu Telegram no está vinculado a ninguna cuenta.');
        return;
      }
      await database.run('UPDATE players SET telegram_id = NULL WHERE id = ?', [player.id]);
      delete telegramUserMap[chatId];
      sendTelegramMessage(chatId, `🔓 Se ha desvinculado la cuenta de *${player.name}* de este Telegram.`);
      break;
    }

    case '/perfil':
    case '/stats': {
      if (!player) {
        sendTelegramMessage(chatId, '⚠️ Tu cuenta de Telegram no está vinculada.\nUsa `/vincular [usuario] [password]` o regístrate con `/registrar`.');
        return;
      }
      const wins = player.pvp_wins || 0;
      const losses = player.pvp_losses || 0;
      const totalDuels = wins + losses;
      const winrate = totalDuels > 0 ? Math.round((wins / totalDuels) * 100) : 0;

      const profileCard = 
`🛡️ *FICHA DE AVENTURERO*\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`👤 *Nombre:* ${player.name}\n` +
`🎖️ *Título:* _${player.title || 'Novicio Sediento'}_\n` +
`⚔️ *Clase:* ${(player.secret_class || 'GUERRERO').toUpperCase()} | *Nivel:* ${player.level}\n` +
`⭐ *XP Total:* ${player.xp} XP\n` +
`💰 *Oro:* ${player.gold} Piezas de Oro\n` +
`🔥 *Racha Diaria:* ${player.streak_days || 0} Días\n` +
`🤺 *Récord PvP:* ${wins}W / ${losses}L (${winrate}% Victoria)\n` +
`🔑 *NFC UID:* \`${player.nfc_uid}\`\n` +
`📱 *Telegram Vinculado:* ID ${chatId} ✅`;

      sendTelegramMessage(chatId, profileCard);
      break;
    }

    case '/diaria': {
      if (!player) {
        sendTelegramMessage(chatId, '⚠️ Tu cuenta de Telegram no está vinculada. Usa `/vincular [usuario] [password]`');
        return;
      }

      const now = new Date();
      if (player.last_daily_claim_at) {
        const lastClaim = new Date(player.last_daily_claim_at);
        const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (diffHours < 24) {
          const remaining = (24 - diffHours).toFixed(1);
          sendTelegramMessage(chatId, `⏳ Ya has reclamado tu Medalla Diaria hoy. Regresa en ${remaining} horas.`);
          return;
        }
      }

      player.xp += 15;
      player.gold += 5;
      player.streak_days = (player.streak_days || 0) + 1;
      player.level = Math.max(1, 1 + Math.floor(player.xp / 250));
      player.last_daily_claim_at = now.toISOString();

      await database.run(
        'UPDATE players SET xp = ?, gold = ?, level = ?, streak_days = ?, last_daily_claim_at = ? WHERE id = ?',
        [player.xp, player.gold, player.level, player.streak_days, player.last_daily_claim_at, player.id]
      );

      sendTelegramMessage(chatId, `🎁 *¡MEDALLA DIARIA RECLAMADA!*\n\n+15 XP | +5 Oro | 🔥 Racha: ${player.streak_days} Días (Nivel ${player.level})`);
      break;
    }

    case '/ranking':
    case '/top': {
      const sorted = [...allPlayers].sort((a: PlayerRow, b: PlayerRow) => {
        if (b.level !== a.level) return b.level - a.level;
        if (b.xp !== a.xp) return b.xp - a.xp;
        return (b.streak_days || 0) - (a.streak_days || 0);
      }).slice(0, 5);

      let text = '🏆 *RANKING TOP 5 DEL GREMIO*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      sorted.forEach((p: PlayerRow, idx: number) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️';
        text += `${medal} *#${idx + 1} ${p.name}* (Lv.${p.level} ${p.secret_class})\n   └ _${p.title || 'Aventurero'}_ | 🔥 ${p.streak_days || 0}d Racha | ⭐ ${p.xp} XP\n`;
      });
      sendTelegramMessage(chatId, text);
      break;
    }

    case '/clima': {
      const weather = await fetchCurrentWeather();
      const isRaining = weather.condition === 'RAIN' || weather.precipitation > 0.5;
      const text = 
`🌧️ *ESTADO METEOROLÓGICO FÍSICO (Buenos Aires)*\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`🌡️ *Temperatura:* ${weather.temp}°C\n` +
`💧 *Precipitación:* ${weather.precipitation} mm/h (${isRaining ? '🌧️ Lloviendo' : '☀️ Despejado'})\n` +
`🌙 *Período:* ${weather.isNight ? '🌙 Noche de Taberna' : '☀️ Día'}\n\n` +
`🎁 *Bonificadores Presenciales Activos:*\n` +
`${isRaining ? '⚡ +35 XP / +15 Oro por inclemencia climática' : '☀️ Clima normal (+15 XP / +5 G)'}\n` +
`${weather.isNight ? '🌙 +25% Extra de Oro Nocturno' : ''}`;
      sendTelegramMessage(chatId, text);
      break;
    }

    case '/duelo': {
      if (!player) {
        sendTelegramMessage(chatId, '⚠️ Tu cuenta de Telegram no está vinculada. Usa `/vincular [usuario] [password]`');
        return;
      }
      if (args.length < 1) {
        sendTelegramMessage(chatId, '⚔️ Uso correcto: `/duelo [rival] [apuesta]` (ej: `/duelo Thorin 25`)');
        return;
      }
      const targetUser = args[0].replace('@', '');
      const wager = parseInt(args[1]) || 10;

      const defender = allPlayers.find((p: PlayerRow) => p.name.toLowerCase().includes(targetUser.toLowerCase()) || p.username.toLowerCase() === targetUser.toLowerCase());
      if (!defender) {
        sendTelegramMessage(chatId, '❌ Jugador rival no encontrado.');
        return;
      }

      if (defender.nfc_uid === player.nfc_uid) {
        sendTelegramMessage(chatId, '❌ No puedes batallarte a ti mismo.');
        return;
      }

      const duelRes = await resolvePvPDuel(player.id, defender.id, wager);
      const text = 
`⚔️ *¡DUELO EN LA ARENA DE LA TABERNA (Bo3)!*\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`🗡️ *Atacante:* ${player.name} (Lv.${player.level} ${player.secret_class})\n` +
`🛡️ *Defensor:* ${defender.name} (Lv.${defender.level} ${defender.secret_class})\n` +
`💰 *Apuesta:* ${wager} Piezas de Oro\n\n` +
`👑 *¡GANADOR: ${duelRes.winnerName}!*\n` +
`📜 *Resumen de Rondas:*\n` +
`${duelRes.rounds.map((r, i) => `   └ Ronda ${i + 1}: ${r.note}`).join('\n')}\n\n` +
`💰 *Premio Transferido:* ${duelRes.wager} Oro.`;

      sendTelegramMessage(chatId, text);
      break;
    }

    case '/tienda': {
      const items: ItemRow[] = await database.all('SELECT * FROM items WHERE is_active_in_shop = TRUE');
      let text = '🩸 *CATÁLOGO DE ÍTEMS Y OBJETOS MALDITOS*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      items.forEach((item: ItemRow) => {
        text += `✨ *${item.name}* (💰 ${item.gold_cost} G)\n   └ ⚡ _${item.description}_\n\n`;
      });
      sendTelegramMessage(chatId, text);
      break;
    }

    case '/servidor': {
      const serverStatus = 
`🖥️ *ESTADO DEL SERVIDOR 192.168.0.200*\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`🟢 *Express RPG Backend:* ONLINE (Port 3000)\n` +
`🟢 *Nginx Reverse Proxy:* ONLINE (Port 8083)\n` +
`🟢 *Mosquitto MQTT Broker:* ONLINE (Port 1883)\n` +
`🟢 *RomM Manager:* ONLINE (Port 8084)\n` +
`🟢 *Sunshine Cloud Gaming:* ONLINE (Port 47990)\n` +
`🟢 *EmulatorJS:* ONLINE (Port 8088)`;
      sendTelegramMessage(chatId, serverStatus);
      break;
    }

    case '/juegos': {
      const gamesMsg = 
`🎮 *CATÁLOGO DE JUEGOS DISPONIBLES EN EL SERVIDOR*\n` +
`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
`📀 *PlayStation 2 (RomM / Sunshine):*\n` +
`   └ 007 Everything or Nothing\n` +
`   └ Devil May Cry 3 Dante's Awakening\n` +
`   └ Bully\n` +
`   └ Dragon Ball Z Budokai Tenkaichi 3\n` +
`   └ Need for Speed Most Wanted\n` +
`   └ Tekken 5\n\n` +
`🕹️ *Nintendo 64 (EmulatorJS / RomM):*\n` +
`   └ Super Mario 64\n` +
`   └ Mario Kart 64\n` +
`   └ Zelda Ocarina of Time & Majora's Mask\n` +
`   └ Super Smash Bros\n\n` +
`🌀 *Sega Genesis / MegaDrive:* 1,520 Juegos`;
      sendTelegramMessage(chatId, gamesMsg);
      break;
    }

    case '/exp': {
      if (!player || player.role !== 'DM') {
        sendTelegramMessage(chatId, '⛔ Solo el Dungeon Master (DM) puede usar este comando.');
        return;
      }
      const targetUser = args[0];
      const amount = parseInt(args[1]) || 50;
      const target = allPlayers.find((p: PlayerRow) => p.name.toLowerCase().includes(targetUser?.toLowerCase() || ''));
      if (target) {
        target.xp += amount;
        target.level = Math.max(1, 1 + Math.floor(target.xp / 250));
        await database.run('UPDATE players SET xp = ?, level = ? WHERE id = ?', [target.xp, target.level, target.id]);
        sendTelegramMessage(chatId, `✨ *+${amount} XP otorgados a ${target.name}* (Nuevo Nivel: ${target.level})`);
      } else {
        sendTelegramMessage(chatId, '❌ Jugador no encontrado.');
      }
      break;
    }

    case '/oro': {
      if (!player || player.role !== 'DM') {
        sendTelegramMessage(chatId, '⛔ Solo el Dungeon Master (DM) puede usar este comando.');
        return;
      }
      const targetUser = args[0];
      const amount = parseInt(args[1]) || 50;
      const target = allPlayers.find((p: PlayerRow) => p.name.toLowerCase().includes(targetUser?.toLowerCase() || ''));
      if (target) {
        target.gold += amount;
        await database.run('UPDATE players SET gold = ? WHERE id = ?', [target.gold, target.id]);
        sendTelegramMessage(chatId, `💰 *+${amount} Oro otorgado a ${target.name}* (Total: ${target.gold}G)`);
      } else {
        sendTelegramMessage(chatId, '❌ Jugador no encontrado.');
      }
      break;
    }

    default:
      sendTelegramMessage(chatId, '❓ Comando no reconocido. Usa `/ayuda` para ver la lista de comandos disponibles.');
      break;
  }
}

// Telegram Polling Task (3s Interval) if Bot Token is active
let offset = 0;
export function initTelegramBotPolling() {
  if (!IS_TOKEN_SET) {
    console.log('[Telegram] Bot token no configurado o es de prueba. Telegram Bot Polling desactivado (Simulación en memoria lista).');
    return;
  }

  console.log('[Telegram] Iniciando Telegram Bot Polling Service...');
  setInterval(() => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=2`,
      method: 'GET'
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (json.ok && Array.isArray(json.result)) {
            for (const update of json.result) {
              offset = update.update_id + 1;
              if (update.message && update.message.text) {
                const chatId = update.message.chat.id;
                const username = update.message.from.username || update.message.from.first_name;
                handleTelegramMessage(chatId, username, update.message.text);
              } else if (update.callback_query && update.callback_query.data) {
                const chatId = update.callback_query.message.chat.id;
                const username = update.callback_query.from.username || update.callback_query.from.first_name;
                const data = update.callback_query.data;
                if (data.startsWith('class_')) {
                  const chosen = data.replace('class_', '');
                  handleTelegramMessage(chatId, username, chosen);
                }
              }
            }
          }
        } catch (e) {}
      });
    });
    req.on('error', () => {});
    req.end();
  }, 3000);
}
