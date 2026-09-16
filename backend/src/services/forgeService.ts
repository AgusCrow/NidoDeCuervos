import { getDb, ItemRow, InventoryRow } from '../db';
import { recordPlayerActivity } from './questService';
import { sseHub } from '../sseHub';

export interface SetBonusInfo {
  setCode: string;
  name: string;
  equippedPieces: number;
  twoPieceActive: boolean;
  fourPieceActive: boolean;
  twoPieceBonus: string;
  fourPieceBonus: string;
}

export const BOSS_ITEM_SETS: Record<string, {
  name: string;
  element: string;
  twoPieceBonus: string;
  fourPieceBonus: string;
  statBonus2: { atk?: number; def?: number; raid_dmg_pct?: number; d20_bonus?: number; crit_pct?: number; gold_pct?: number };
  statBonus4: { atk?: number; def?: number; raid_dmg_pct?: number; d20_bonus?: number; crit_pct?: number; perk_name: string };
}> = {
  SET_IGNIS: {
    name: 'Set de Obsidiana Ígnea',
    element: 'FUEGO',
    twoPieceBonus: '+15% Daño a Raid Bosses y +10 de Ataque',
    fourPieceBonus: 'Aura Ígnea: Tiradas D20 >= 18 infligen quemadura cataclísmica (+35% daño)',
    statBonus2: { raid_dmg_pct: 15, atk: 10 },
    statBonus4: { raid_dmg_pct: 20, atk: 15, perk_name: 'AURA_IGNEA' }
  },
  SET_MALAKOR: {
    name: 'Set del Soberano de la Plaga',
    element: 'VENENO',
    twoPieceBonus: '+15 de Defensa y +20% de Oro obtenido',
    fourPieceBonus: 'Baluarte Tóxico: Reduce el impacto de los contragolpes de Bosses un 35%',
    statBonus2: { def: 15, gold_pct: 20 },
    statBonus4: { def: 20, perk_name: 'BALUARTE_TOXICO' }
  },
  SET_AURELIUS: {
    name: 'Set del Titán de Runas',
    element: 'TIERRA',
    twoPieceBonus: '+1 permanente a todas las tiradas de dados D20',
    fourPieceBonus: 'Coraza Telúrica: Las pifias (D20 = 1) otorgan un escudo de absorción de daño',
    statBonus2: { d20_bonus: 1 },
    statBonus4: { d20_bonus: 1, def: 20, perk_name: 'CORAZA_TELURICA' }
  },
  SET_KAELITH: {
    name: 'Set de la Reina Glacial',
    element: 'HIELO',
    twoPieceBonus: '+12% Probabilidad Crítica y +10% XP',
    fourPieceBonus: 'Cero Absoluto: Impactos críticos enfrían al Boss duplicando el siguiente ataque de la party',
    statBonus2: { crit_pct: 12 },
    statBonus4: { crit_pct: 15, perk_name: 'CERO_ABSOLUTO' }
  }
};

/**
 * Calcular bonificaciones de conjuntos activos en base a las piezas equipadas
 */
export function calculateActiveSets(equippedItems: ItemRow[]): { activeSets: SetBonusInfo[]; bonuses: Record<string, number> } {
  const setCounts: Record<string, number> = {};

  for (const item of equippedItems) {
    // Si el ítem pertenece a un set por afinidad elemental o base
    let setCode: string | null = null;
    if (item.elemental_theme === 'FUEGO' || item.name.includes('Ígneo') || item.name.includes('Obsidiana') || item.name.includes('Fénix')) {
      setCode = 'SET_IGNIS';
    } else if (item.elemental_theme === 'VENENO' || item.name.includes('Tóxico') || item.name.includes('Plaga')) {
      setCode = 'SET_MALAKOR';
    } else if (item.elemental_theme === 'TIERRA' || item.name.includes('Rúnico') || item.name.includes('Titán') || item.name.includes('Coloso')) {
      setCode = 'SET_AURELIUS';
    } else if (item.elemental_theme === 'HIELO' || item.name.includes('Glacial') || item.name.includes('Escarcha') || item.name.includes('Zafiro')) {
      setCode = 'SET_KAELITH';
    }

    if (setCode) {
      setCounts[setCode] = (setCounts[setCode] || 0) + 1;
    }
  }

  const activeSets: SetBonusInfo[] = [];
  const aggregatedBonuses: Record<string, number> = {
    atk: 0,
    def: 0,
    raid_dmg_pct: 0,
    d20_bonus: 0,
    crit_pct: 0,
    gold_pct: 0
  };

  for (const [setCode, count] of Object.entries(setCounts)) {
    const setDef = BOSS_ITEM_SETS[setCode];
    if (!setDef) continue;

    const twoPiece = count >= 2;
    const fourPiece = count >= 4;

    activeSets.push({
      setCode,
      name: setDef.name,
      equippedPieces: count,
      twoPieceActive: twoPiece,
      fourPieceActive: fourPiece,
      twoPieceBonus: setDef.twoPieceBonus,
      fourPieceBonus: setDef.fourPieceBonus
    });

    if (twoPiece && setDef.statBonus2) {
      for (const [stat, val] of Object.entries(setDef.statBonus2)) {
        if (typeof val === 'number') aggregatedBonuses[stat] = (aggregatedBonuses[stat] || 0) + val;
      }
    }

    if (fourPiece && setDef.statBonus4) {
      for (const [stat, val] of Object.entries(setDef.statBonus4)) {
        if (typeof val === 'number') aggregatedBonuses[stat] = (aggregatedBonuses[stat] || 0) + val;
      }
    }
  }

  return { activeSets, bonuses: aggregatedBonuses };
}

/**
 * Desguazar un ítem de equipamiento no equipado para obtener materiales y oro
 */
export async function salvageItem(playerId: string, inventoryId: string): Promise<{
  success: boolean;
  goldEarned: number;
  materialsGained: { id: string; name: string; icon: string; quantity: number }[];
  message: string;
}> {
  const db = await getDb();
  const inv = (db.data.inventory || []).find((i) => i.id === inventoryId && i.player_id === playerId && !i.consumed_at);

  if (!inv) throw new Error('Ítem no encontrado en el inventario');
  if (inv.is_equipped) throw new Error('No puedes desguazar un ítem actualmente equipado');

  const item = (db.data.items || []).find((it) => it.id === inv.item_id);
  if (!item) throw new Error('Definición de ítem no encontrada');

  const goldEarned = Math.max(5, item.sell_value || Math.floor((item.gold_cost || 20) / 2));
  const player = (db.data.players || []).find((p) => p.id === playerId);
  if (player) {
    player.gold = (player.gold || 0) + goldEarned;
  }

  // Determinar materiales según rareza
  const materials: { id: string; name: string; icon: string; quantity: number }[] = [];
  const dustAmount = Math.max(1, Math.floor((item.item_level || 1) / 2) + 1);
  materials.push({ id: 'mat_arcane_dust', name: 'Polvo Arcano', icon: '✨', quantity: dustAmount });

  if (item.rarity === 'RARE' || item.rarity === 'EPIC' || item.rarity === 'LEGENDARY' || item.rarity === 'MYTHIC') {
    materials.push({ id: 'mat_essence_rare', name: 'Esencia de Poder Raro', icon: '🔮', quantity: 1 });
  }
  if (item.rarity === 'EPIC' || item.rarity === 'LEGENDARY' || item.rarity === 'MYTHIC') {
    materials.push({ id: 'mat_essence_epic', name: 'Esencia Épica Cristalizada', icon: '💎', quantity: 1 });
  }
  if (item.rarity === 'LEGENDARY' || item.rarity === 'MYTHIC') {
    materials.push({ id: 'mat_essence_legendary', name: 'Fragmento Mítico de Titán', icon: '🌟', quantity: 1 });
  }

  // Eliminar el ítem desguazado del inventario
  db.data.inventory = db.data.inventory.filter((i) => i.id !== inventoryId);
  db.save();

  // Registrar progreso en misiones
  await recordPlayerActivity(playerId, 'items_forged', 1);

  return {
    success: true,
    goldEarned,
    materialsGained: materials,
    message: `¡Desguazaste [${item.name}]! Has recuperado +${goldEarned} 🪙 y ${materials.map((m) => `${m.quantity}x ${m.name}`).join(', ')}.`
  };
}

/**
 * Refinar un ítem de equipamiento (+1 a +10) aumentando sus estadísticas
 */
export async function refineItem(playerId: string, inventoryId: string): Promise<{
  success: boolean;
  isUpgraded: boolean;
  refineLevel: number;
  goldSpent: number;
  message: string;
  item: ItemRow;
}> {
  const db = await getDb();
  const inv = (db.data.inventory || []).find((i) => i.id === inventoryId && i.player_id === playerId && !i.consumed_at);
  if (!inv) throw new Error('Ítem no disponible en tu inventario');

  const item = (db.data.items || []).find((it) => it.id === inv.item_id);
  if (!item) throw new Error('Definición de ítem no encontrada');
  if (item.slot === 'CONSUMABLE') throw new Error('No puedes refinar pociones consumibles');

  const currentRefine = item.refine_level || 0;
  if (currentRefine >= 10) throw new Error('Este ítem ya ha alcanzado el nivel máximo de refinamiento (+10)');

  const player = (db.data.players || []).find((p) => p.id === playerId);
  if (!player) throw new Error('Jugador no encontrado');

  // Costo escalado en oro: 20 base + (refine * 15)
  const goldCost = 20 + (currentRefine * 18);
  if (player.gold < goldCost) {
    throw new Error(`Oro insuficiente. Requiere ${goldCost} 🪙, posees ${player.gold} 🪙.`);
  }

  player.gold -= goldCost;

  // Probabilidad de éxito: +1 a +4 es 100%, +5 a +7 es 75%, +8 a +10 es 50%
  let successRate = 100;
  if (currentRefine >= 7) successRate = 50;
  else if (currentRefine >= 4) successRate = 75;

  const roll = Math.random() * 100;
  const isUpgraded = roll < successRate;

  if (isUpgraded) {
    item.refine_level = currentRefine + 1;
    // Bonificación de estadísticas por refinamiento
    if (item.slot === 'WEAPON') {
      item.stat_atk = (item.stat_atk || 0) + 3;
      item.stat_raid_dmg_pct = (item.stat_raid_dmg_pct || 0) + 2;
    } else if (item.slot === 'ARMOR') {
      item.stat_def = (item.stat_def || 0) + 3;
    } else {
      item.stat_atk = (item.stat_atk || 0) + 1;
      item.stat_def = (item.stat_def || 0) + 1;
    }

    db.save();
    await recordPlayerActivity(playerId, 'items_forged', 1);

    if (item.refine_level >= 5) {
      sseHub.broadcast('party_updated', {
        message: `🔨 [Yunque] ¡${player.name} refinó con éxito [${item.name}] a +${item.refine_level}!`
      });
    }

    return {
      success: true,
      isUpgraded: true,
      refineLevel: item.refine_level,
      goldSpent: goldCost,
      message: `¡Éxito en el yunque! [${item.name}] subió a +${item.refine_level} (+Stats mejorados).`,
      item
    };
  } else {
    db.save();
    return {
      success: true,
      isUpgraded: false,
      refineLevel: currentRefine,
      goldSpent: goldCost,
      message: `El mineral no resistió el temple. El ítem se mantiene en +${currentRefine}. (Oro invertido: ${goldCost} 🪙)`,
      item
    };
  }
}
