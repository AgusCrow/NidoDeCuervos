import mqtt from 'mqtt';
import crypto from 'crypto';
import { processNfcScan } from './rpgEngine';

export interface TelemetryLog {
  timestamp: string;
  topic: string;
  payload: string;
  status: 'SUCCESS' | 'ERROR' | 'INVALID_SIG';
}

const telemetryLogs: TelemetryLog[] = [];
const SECRET_HMAC_KEY = process.env.HMAC_SECRET || 'taberna_secret_key_2026';

export function getTelemetryLogs(): TelemetryLog[] {
  return telemetryLogs.slice(-20);
}

export function initMqttService() {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';
  console.log(`[MQTT] Conectando al broker en ${brokerUrl}...`);

  const client = mqtt.connect(brokerUrl, {
    clientId: 'rpg_backend_' + Math.random().toString(16).substring(2, 8),
    reconnectPeriod: 5000
  });

  client.on('connect', () => {
    console.log('[MQTT] Conectado exitosamente al broker Mosquitto.');
    client.subscribe('gremio/scans/hardware', (err) => {
      if (!err) console.log('[MQTT] Suscrito a topic: gremio/scans/hardware');
    });
  });

  client.on('message', async (topic, message) => {
    const rawStr = message.toString();
    console.log(`[MQTT] Payload recibido en ${topic}:`, rawStr);

    try {
      const data = JSON.parse(rawStr);
      // Expected structure: { nfc_uid: "...", timestamp: 123456, signature: "..." }
      const { nfc_uid, timestamp, signature } = data;

      if (!nfc_uid) {
        telemetryLogs.push({
          timestamp: new Date().toISOString(),
          topic,
          payload: rawStr,
          status: 'ERROR'
        });
        return;
      }

      // Verify HMAC-SHA256 if signature provided
      if (signature && timestamp) {
        const expectedSig = crypto
          .createHmac('sha256', SECRET_HMAC_KEY)
          .update(`${nfc_uid}:${timestamp}`)
          .digest('hex');

        if (signature !== expectedSig) {
          console.warn('[MQTT] Firma HMAC inválida detectada!');
          telemetryLogs.push({
            timestamp: new Date().toISOString(),
            topic,
            payload: rawStr,
            status: 'INVALID_SIG'
          });
          return;
        }
      }

      const scanRes = await processNfcScan(nfc_uid);
      telemetryLogs.push({
        timestamp: new Date().toISOString(),
        topic,
        payload: `Scan exitoso para ${scanRes.playerName}: Roll ${scanRes.finalRoll} (+${scanRes.xpAwarded}XP, +${scanRes.goldAwarded}G)`,
        status: 'SUCCESS'
      });

    } catch (err: any) {
      console.error('[MQTT] Error procesando scan:', err.message);
      telemetryLogs.push({
        timestamp: new Date().toISOString(),
        topic,
        payload: `Error: ${err.message}`,
        status: 'ERROR'
      });
    }
  });

  client.on('error', (err) => {
    console.warn('[MQTT] Error de conexión:', err.message);
  });
}
