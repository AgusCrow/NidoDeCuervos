import { getDb } from './db';
import { sseHub } from './sseHub';
import { fetchCurrentWeather, WeatherData } from './weatherService';
import { recordPlayerActivity } from './services/questService';
import crypto from 'crypto';

export interface ScanResult {
  playerId: string;
  playerName: string;
  secretClass: string;
  rawRoll: number;
  finalRoll: number;
  xpAwarded: number;
  goldAwarded: number;
  level: number;
  leveledUp: boolean;
  modifiersApplied: string[];
  weather?: WeatherData;
  duelResult?: DuelResult;
}

export interface RoundDetail {
  round: number;
  roll1: number;
  score1: number;
  roll2: number;
  score2: number;
  winnerId: string | 'TIE';
  note: string;
}

export interface DuelResult {
  id: string;
  player1Name: string;
  player2Name: string;
  p1Score: number;
  p2Score: number;
  winnerName: string;
  wager: number;
  rounds: RoundDetail[];
  summary: string;
}

export async function resolvePvPDuel(p1Id: string, p2Id: string, wager: number = 10): Promise<DuelResult> {
  const db = await getDb();
  const p1 = await db.get('SELECT * FROM players WHERE id = ?', [p1Id]);
  const p2 = await db.get('SELECT * FROM players WHERE id = ?', [p2Id]);

  if (!p1 || !p2) throw new Error('Uno o ambos aventureros no fueron encontrados para el duelo.');

  // Check ban
  const now = new Date();
  if (p1.duel_disabled_until && new Date(p1.duel_disabled_until) > now) {
    throw new Error(`${p1.name} está incapacitado para duelos por una maldición.`);
  }
  if (p2.duel_disabled_until && new Date(p2.duel_disabled_until) > now) {
    throw new Error(`${p2.name} está incapacitado para duelos por una maldición.`);
  }

  let p1Wins = 0;
  let p2Wins = 0;
  let p1ArcaneBuff = 0;
  let p2ArcaneBuff = 0;
  const rounds: RoundDetail[] = [];

  const levelBonus1 = Math.floor(p1.level / 5);
  const levelBonus2 = Math.floor(p2.level / 5);

  // Load equipped item stats for both gladiators
  const inv1 = (db.data.inventory || []).filter((i: any) => i.player_id === p1Id && i.is_equipped && !i.consumed_at);
  const inv2 = (db.data.inventory || []).filter((i: any) => i.player_id === p2Id && i.is_equipped && !i.consumed_at);
  const items1 = inv1.map((inv: any) => (db.data.items || []).find((it: any) => it.id === inv.item_id)).filter(Boolean);
  const items2 = inv2.map((inv: any) => (db.data.items || []).find((it: any) => it.id === inv.item_id)).filter(Boolean);

  const gearAtk1 = items1.reduce((sum: number, it: any) => sum + (it.stat_atk || 0), 0);
  const gearDef1 = items1.reduce((sum: number, it: any) => sum + (it.stat_def || 0), 0);
  const gearD20_1 = items1.reduce((sum: number, it: any) => sum + (it.stat_d20_bonus || 0), 0);

  const gearAtk2 = items2.reduce((sum: number, it: any) => sum + (it.stat_atk || 0), 0);
  const gearDef2 = items2.reduce((sum: number, it: any) => sum + (it.stat_def || 0), 0);
  const gearD20_2 = items2.reduce((sum: number, it: any) => sum + (it.stat_d20_bonus || 0), 0);

  const bonusP1 = levelBonus1 + gearD20_1 + Math.floor(gearAtk1 / 4) + Math.floor(gearDef1 / 5);
  const bonusP2 = levelBonus2 + gearD20_2 + Math.floor(gearAtk2 / 4) + Math.floor(gearDef2 / 5);

  for (let r = 1; r <= 3; r++) {
    if (p1Wins >= 2 || p2Wins >= 2) break;

    const raw1 = Math.floor(Math.random() * 20) + 1;
    const raw2 = Math.floor(Math.random() * 20) + 1;

    let score1 = raw1 + bonusP1 + p1ArcaneBuff;
    let score2 = raw2 + bonusP2 + p2ArcaneBuff;
    p1ArcaneBuff = 0;
    p2ArcaneBuff = 0;

    let note = `Ronda ${r}: ${p1.name} (${score1}) vs ${p2.name} (${score2})`;
    let roundWinner: string | 'TIE' = 'TIE';

    // Rogue Instant KO (d20 >= 18)
    if (p1.secret_class === 'ROGUE' && raw1 >= 18) {
      p1Wins += 2;
      roundWinner = p1.id;
      note += ` | 🗡️ Golpe Sombra Pícaro (${raw1}) -> K.O. Instantáneo!`;
      rounds.push({ round: r, roll1: raw1, score1, roll2: raw2, score2, winnerId: roundWinner, note });
      break;
    }
    if (p2.secret_class === 'ROGUE' && raw2 >= 18) {
      p2Wins += 2;
      roundWinner = p2.id;
      note += ` | 🗡️ Golpe Sombra Pícaro (${raw2}) -> K.O. Instantáneo!`;
      rounds.push({ round: r, roll1: raw1, score1, roll2: raw2, score2, winnerId: roundWinner, note });
      break;
    }

    if (score1 > score2) {
      p1Wins++;
      roundWinner = p1.id;
      if (p2.secret_class === 'MAGE' && r === 1) p2ArcaneBuff = 4;
    } else if (score2 > score1) {
      p2Wins++;
      roundWinner = p2.id;
      if (p1.secret_class === 'MAGE' && r === 1) p1ArcaneBuff = 4;
    } else {
      // Tie -> Warrior wins tie automatically
      if (p1.secret_class === 'WARRIOR' && p2.secret_class !== 'WARRIOR') {
        p1Wins++;
        roundWinner = p1.id;
        note += ` | 🛡️ Desempate por Armadura de Guerrero`;
      } else if (p2.secret_class === 'WARRIOR' && p1.secret_class !== 'WARRIOR') {
        p2Wins++;
        roundWinner = p2.id;
        note += ` | 🛡️ Desempate por Armadura de Guerrero`;
      } else {
        note += ` | Empate de Ronda`;
      }
    }

    rounds.push({ round: r, roll1: raw1, score1, roll2: raw2, score2, winnerId: roundWinner, note });
  }

  let winnerName = 'Empate';
  let winnerId = '';
  let finalWager = wager;

  if (p1Wins > p2Wins) {
    winnerName = p1.name;
    winnerId = p1.id;
    if (p1.secret_class === 'BARD') finalWager = Math.round(wager * 1.5);

    const newGold1 = p1.gold + finalWager;
    const newGold2 = Math.max(0, p2.gold - wager);
    await db.run('UPDATE players SET gold = ?, pvp_wins = pvp_wins + 1 WHERE id = ?', [newGold1, p1.id]);
    await db.run('UPDATE players SET gold = ?, pvp_losses = pvp_losses + 1 WHERE id = ?', [newGold2, p2.id]);
  } else if (p2Wins > p1Wins) {
    winnerName = p2.name;
    winnerId = p2.id;
    if (p2.secret_class === 'BARD') finalWager = Math.round(wager * 1.5);

    const newGold2 = p2.gold + finalWager;
    const newGold1 = Math.max(0, p1.gold - wager);
    await db.run('UPDATE players SET gold = ?, pvp_wins = pvp_wins + 1 WHERE id = ?', [newGold2, p2.id]);
    await db.run('UPDATE players SET gold = ?, pvp_losses = pvp_losses + 1 WHERE id = ?', [newGold1, p1.id]);
  }

  const result: DuelResult = {
    id: 'duel_' + crypto.randomUUID().slice(0, 8),
    player1Name: p1.name,
    player2Name: p2.name,
    p1Score: p1Wins,
    p2Score: p2Wins,
    winnerName,
    wager: finalWager,
    rounds,
    summary: `Duelo Bo3: ${p1.name} (${p1Wins}) vs ${p2.name} (${p2Wins}) &rarr; Ganador: ${winnerName} (${finalWager} Oro)`
  };

  sseHub.broadcast('duel_event', result);
  return result;
}

export async function processNfcScan(nfcUid: string, bypassCooldown: boolean = false): Promise<ScanResult> {
  const db = await getDb();
  const weather = await fetchCurrentWeather();

  const player = await db.get('SELECT * FROM players WHERE nfc_uid = ?', [nfcUid]);
  if (!player) {
    throw new Error(`Jugador con NFC UID ${nfcUid} no registrado en el gremio.`);
  }

  // 12-Hour Cooldown Check
  if (!bypassCooldown && player.last_scanned_at) {
    const lastScanTime = new Date(player.last_scanned_at).getTime();
    const nowTime = Date.now();
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    if (nowTime - lastScanTime < twelveHoursMs) {
      const remainingMs = twelveHoursMs - (nowTime - lastScanTime);
      const remainingHours = (remainingMs / (1000 * 60 * 60)).toFixed(1);
      throw new Error(`Cooldown activo. Vuelve en ${remainingHours} horas.`);
    }
  }

  // Fetch equipped items
  const equippedRows = await db.all(
    `SELECT i.id as inventory_id, it.*
     FROM inventory i
     JOIN items it ON i.item_id = it.id
     WHERE i.player_id = ? AND i.is_equipped = TRUE AND i.consumed_at IS NULL`,
    [player.id]
  );

  const equippedEffects = equippedRows.map((r: any) => r.effect_type);
  const modifiersApplied: string[] = [];

  // Check Misfortune Curse from previous player
  const misfortuneRow = await db.get('SELECT value FROM global_states WHERE key = ?', ['misfortune_curse']);
  const misfortuneCurse = misfortuneRow ? JSON.parse(misfortuneRow.value) : { active: false };

  // Calculate Roll
  let d20_1 = Math.floor(Math.random() * 20) + 1;
  let d20_2 = Math.floor(Math.random() * 20) + 1;
  let rawRoll = d20_1;
  let roll = d20_1;

  if (equippedEffects.includes('FORTUNE_DICE')) {
    roll = Math.max(d20_1, d20_2);
    modifiersApplied.push(`Dado de la Fortuna (Tiradas: ${d20_1}, ${d20_2} -> Elegido: ${roll})`);
  }

  // Cursed Item: Dado del Nigromante
  if (equippedEffects.includes('CURSED_NECROMANCER_DICE')) {
    if (roll >= 13 && roll <= 19) {
      roll = 20;
      modifiersApplied.push('💀 Dado del Nigromante: Tirada 13-19 elevada a Nat 20');
    }
  }

  // Warrior Floor Passive (R >= 8)
  if (player.secret_class === 'WARRIOR' && roll < 8) {
    roll = 8;
    modifiersApplied.push('Pasiva Guerrero: Piso de tirada asignado a 8');
  }

  // Anti-Fumble Item Check
  if (roll === 1 && equippedEffects.includes('ANTI_FUMBLE')) {
    roll = 10;
    modifiersApplied.push('Escudo contra Pifias: Pifia 1 convertida a 10');
  }

  // Equipped Item Stats (Weapons, Armors, Rings, Amulets)
  const gearD20 = (equippedRows || []).reduce((acc: number, it: any) => acc + (it.stat_d20_bonus || 0), 0);
  const gearGoldPct = (equippedRows || []).reduce((acc: number, it: any) => acc + (it.stat_gold_pct || 0), 0);
  const gearXpPct = (equippedRows || []).reduce((acc: number, it: any) => acc + (it.stat_xp_pct || 0), 0);
  const gearCritPct = (equippedRows || []).reduce((acc: number, it: any) => acc + (it.stat_crit_pct || 0), 0);

  if (gearD20 > 0) {
    roll = Math.min(20, roll + gearD20);
    modifiersApplied.push(`Bono de Equipo D20 (+${gearD20})`);
  }
  if (gearCritPct > 0 && roll >= (20 - Math.floor(gearCritPct / 10))) {
    roll = 20;
    modifiersApplied.push(`Crítico Potenciado por Equipo (+${gearCritPct}% Nat 20)`);
  }

  const finalRoll = roll;

  // Base Rewards Calculation
  let baseXP = 0;
  let baseGold = 0;

  if (finalRoll === 1) {
    baseXP = 1;
    baseGold = 0;
    modifiersApplied.push('Pifia Crítica (1 XP, 0 Oro)');
  } else if (finalRoll === 20) {
    baseXP = 25;
    baseGold = 25;
    modifiersApplied.push('¡Impacto Crítico Nat 20! (+25 XP, +25 Oro)');
  } else {
    baseXP = finalRoll;
    baseGold = finalRoll;
  }

  let xp = baseXP;
  let gold = baseGold;

  // Apply Gear % Buffs
  if (gearGoldPct > 0) {
    gold = Math.round(gold * (1 + gearGoldPct / 100));
    modifiersApplied.push(`Bono de Equipo Oro (+${gearGoldPct}%)`);
  }
  if (gearXpPct > 0) {
    xp = Math.round(xp * (1 + gearXpPct / 100));
    modifiersApplied.push(`Bono de Equipo XP (+${gearXpPct}%)`);
  }

  // Cursed Item: Pacto de Sangre
  let duelBan24h = false;
  if (equippedEffects.includes('CURSED_BLOOD_PACT')) {
    gold = gold * 3;
    modifiersApplied.push('🩸 Pacto de Sangre: Oro Triplicado');
    if (rawRoll <= 6) {
      xp = Math.max(0, xp - 20);
      duelBan24h = true;
      modifiersApplied.push('🩸 MALDICIÓN Pacto de Sangre (roll <= 6): -20 XP y 24h sin duelos');
    }
  }

  // Cursed Item: Dado del Nigromante Curse Check
  if (equippedEffects.includes('CURSED_NECROMANCER_DICE')) {
    if (rawRoll < 10 && rawRoll % 2 === 0) {
      xp = 0;
      gold = 0;
      modifiersApplied.push('💀 MALDICIÓN Nigromante (par < 10): 0 XP y 0 Oro');
    }
  }

  // Cursed Item: Candelabro de la Desdicha
  if (equippedEffects.includes('CURSED_MISFORTUNE_CANDLE')) {
    xp += 50;
    modifiersApplied.push('🕯️ Candelabro de la Desdicha: +50 XP fijos');
    await db.run('UPDATE global_states SET value = ? WHERE key = ?', [
      JSON.stringify({ active: true, granted_by: player.name }),
      'misfortune_curse'
    ]);
  }

  // Apply Misfortune Curse from previous player if active
  if (misfortuneCurse.active) {
    xp = Math.round(xp * 0.7);
    gold = Math.round(gold * 0.7);
    modifiersApplied.push('🕯️ Maldición del Candelabro Activa: -30% en XP y Oro');
    await db.run('UPDATE global_states SET value = ? WHERE key = ?', [
      JSON.stringify({ active: false }),
      'misfortune_curse'
    ]);
  }

  // Class Passives
  if (player.secret_class === 'ROGUE') {
    gold = Math.round(gold * 1.3);
    modifiersApplied.push('Pasiva Pícaro: +30% Oro');
  } else if (player.secret_class === 'MAGE') {
    xp = Math.round(xp * 1.3);
    modifiersApplied.push('Pasiva Mago: +30% XP');
  } else if (player.secret_class === 'BARD') {
    const recentCountRow = await db.get(
      `SELECT COUNT(DISTINCT id) as cnt FROM players 
       WHERE id != ? AND last_scanned_at >= datetime('now', '-12 hours')`,
      [player.id]
    );
    const count = Math.min(recentCountRow ? recentCountRow.cnt : 0, 4);
    if (count > 0) {
      const bonusPct = count * 10;
      xp = Math.round(xp * (1 + bonusPct / 100));
      gold = Math.round(gold * (1 + bonusPct / 100));
      modifiersApplied.push(`Pasiva Bardo: +${bonusPct}% por ${count} aliados presentes`);
    }
  }

  // Real Weather Modifiers
  if (weather.modifiers.bonusXp > 0) {
    xp += weather.modifiers.bonusXp;
    gold += weather.modifiers.bonusGold;
    modifiersApplied.push(`Clima (${weather.condition}): +${weather.modifiers.bonusXp} XP, +${weather.modifiers.bonusGold} Oro`);
  }
  if (weather.modifiers.goldMultiplier > 1.0) {
    gold = Math.round(gold * weather.modifiers.goldMultiplier);
    modifiersApplied.push(`Clima Noche: x${weather.modifiers.goldMultiplier} Oro`);
  }

  // Mark equipped items as consumed
  for (const eq of equippedRows) {
    await db.run('UPDATE inventory SET consumed_at = CURRENT_TIMESTAMP, is_equipped = FALSE WHERE id = ?', [eq.inventory_id]);
  }

  // Update Player Stats & Level
  const newXP = player.xp + xp;
  const newGold = player.gold + gold;
  const oldLevel = player.level;
  const newLevel = Math.max(1, 1 + Math.floor(newXP / 250));
  const leveledUp = newLevel > oldLevel;

  const nowIso = new Date().toISOString();
  let banDate = player.duel_disabled_until;
  if (duelBan24h) {
    banDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  await db.run(
    'UPDATE players SET xp = ?, gold = ?, level = ?, last_scanned_at = ?, duel_disabled_until = ? WHERE id = ?',
    [newXP, newGold, newLevel, nowIso, banDate, player.id]
  );

  // Insert Audit Scan Log
  const logId = 'log_' + crypto.randomUUID();
  await db.run(
    `INSERT INTO scan_logs (id, player_id, raw_roll, final_roll, xp_awarded, gold_awarded, modifiers_applied, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [logId, player.id, rawRoll, finalRoll, xp, gold, JSON.stringify(modifiersApplied)]
  );

  // Registrar actividad en misiones (Hito 2)
  if (finalRoll >= 12) recordPlayerActivity(player.id, 'd20_high_rolls', 1);
  if (finalRoll === 20) recordPlayerActivity(player.id, 'crit_hits', 1);

  // Check Quick NFC Duel (If another player scanned within 15 seconds)
  let duelResult: DuelResult | undefined = undefined;
  const recentScanPlayer = await db.get(
    `SELECT * FROM players 
     WHERE id != ? AND last_scanned_at IS NOT NULL 
     AND last_scanned_at >= datetime('now', '-15 seconds') 
     ORDER BY last_scanned_at DESC LIMIT 1`,
    [player.id]
  );

  if (recentScanPlayer) {
    try {
      duelResult = await resolvePvPDuel(recentScanPlayer.id, player.id, 15);
      modifiersApplied.push(`¡Duelo Rápido NFC de Barra iniciado con ${recentScanPlayer.name}!`);
    } catch (e) {}
  }

  const result: ScanResult = {
    playerId: player.id,
    playerName: player.name,
    secretClass: player.secret_class,
    rawRoll,
    finalRoll,
    xpAwarded: xp,
    goldAwarded: gold,
    level: newLevel,
    leveledUp,
    modifiersApplied,
    weather,
    duelResult
  };

  // Broadcast to TV & Player SSE
  sseHub.broadcast('scan_event', result);

  return result;
}
