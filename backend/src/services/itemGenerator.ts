import { ItemRow, LegendaryPerk } from '../db';
import { generateItemLoreDescription } from './loreService';

export interface ItemBaseDef {
  code: string;
  name: string;
  slot: 'WEAPON' | 'ARMOR' | 'RING' | 'AMULET' | 'CONSUMABLE';
  baseStatType: 'ATK' | 'DEF' | 'BALANCED' | 'UTILITY';
  icon: string;
  class_req?: 'WARRIOR' | 'MAGE' | 'ROGUE' | 'BARD' | 'ALL';
  description: string;
}

export interface AffixDef {
  id: string;
  name: string;
  type: 'PREFIX' | 'SUFFIX';
  element?: 'FUEGO' | 'VENENO' | 'TIERRA' | 'HIELO' | 'ARCANO' | 'GENERAL';
  statType: 'stat_atk' | 'stat_def' | 'stat_d20_bonus' | 'stat_gold_pct' | 'stat_xp_pct' | 'stat_crit_pct' | 'stat_raid_dmg_pct';
  baseMin: number;
  baseMax: number;
  scalePerLevel: number;
}

// Catálogo enriquecido de arquetipos base de equipamiento
export const ITEM_BASES: ItemBaseDef[] = [
  // ARMAS (WEAPONS)
  {
    code: 'sword_runic',
    name: 'Espada Rúnica',
    slot: 'WEAPON',
    baseStatType: 'ATK',
    icon: '⚔️',
    class_req: 'ALL',
    description: 'Hoja forjada en acero templado grabada con glifos de combate.'
  },
  {
    code: 'greatsword_titan',
    name: 'Mandoble del Coloso',
    slot: 'WEAPON',
    baseStatType: 'ATK',
    icon: '🗡️',
    class_req: 'WARRIOR',
    description: 'Arma pesada a dos manos capaz de hender escamas de dragón.'
  },
  {
    code: 'dagger_shadow',
    name: 'Daga de Sombras',
    slot: 'WEAPON',
    baseStatType: 'ATK',
    icon: '🔪',
    class_req: 'ROGUE',
    description: 'Filo ligero y silencioso, diseñado para incisiones letales en puntos vitales.'
  },
  {
    code: 'staff_arcane',
    name: 'Bastón de Éter',
    slot: 'WEAPON',
    baseStatType: 'ATK',
    icon: '🪄',
    class_req: 'MAGE',
    description: 'Vara de madera milenaria coronada por un prisma de concentración arcana.'
  },
  {
    code: 'lute_war',
    name: 'Laúd de Batalla',
    slot: 'WEAPON',
    baseStatType: 'BALANCED',
    icon: '🪕',
    class_req: 'BARD',
    description: 'Instrumento reforzado con cordaje de mithril que emite acordes ensordecedores.'
  },
  {
    code: 'warhammer_storm',
    name: 'Martillo de Guerra',
    slot: 'WEAPON',
    baseStatType: 'ATK',
    icon: '🔨',
    class_req: 'WARRIOR',
    description: 'Cabeza de hierro macizo que pulveriza armaduras con cada impacto.'
  },

  // ARMADURAS (ARMOR)
  {
    code: 'plate_bastion',
    name: 'Coraza del Bastión',
    slot: 'ARMOR',
    baseStatType: 'DEF',
    icon: '🛡️',
    class_req: 'WARRIOR',
    description: 'Placas solapadas de aleación impenetrable.'
  },
  {
    code: 'robe_astral',
    name: 'Túnica Astral',
    slot: 'ARMOR',
    baseStatType: 'DEF',
    icon: '🥋',
    class_req: 'MAGE',
    description: 'Tejido encantado con seda de maná que desvía maleficios y proyectiles.'
  },
  {
    code: 'cloak_specter',
    name: 'Manto del Espectro',
    slot: 'ARMOR',
    baseStatType: 'DEF',
    icon: '🧥',
    class_req: 'ROGUE',
    description: 'Capa envolvente que confunde la mirada del enemigo entre penumbras.'
  },
  {
    code: 'mail_bardic',
    name: 'Cota del Trovador',
    slot: 'ARMOR',
    baseStatType: 'DEF',
    icon: '🦺',
    class_req: 'BARD',
    description: 'Malla flexible con broches dorados, ligera y resonante.'
  },
  {
    code: 'armor_dragon_scale',
    name: 'Armadura de Escamas',
    slot: 'ARMOR',
    baseStatType: 'DEF',
    icon: '🛡️',
    class_req: 'ALL',
    description: 'Coraza reforzada con escamas de bestias de fuego y tierra.'
  },

  // ANILLOS (RINGS)
  {
    code: 'ring_ruby_eye',
    name: 'Sortija de Rubí',
    slot: 'RING',
    baseStatType: 'BALANCED',
    icon: '💍',
    class_req: 'ALL',
    description: 'Gema pulida que arde con un resplandor cálido e incansable.'
  },
  {
    code: 'ring_obsidian_band',
    name: 'Aro de Obsidiana',
    slot: 'RING',
    baseStatType: 'ATK',
    icon: '💍',
    class_req: 'ALL',
    description: 'Piedra volcánica templada en las calderas de los picos nevados.'
  },
  {
    code: 'ring_sapphire_frost',
    name: 'Sello de Zafiro',
    slot: 'RING',
    baseStatType: 'DEF',
    icon: '💍',
    class_req: 'ALL',
    description: 'Cristal glacial que mantiene la serenidad en los asedios más hostiles.'
  },
  {
    code: 'ring_fortune_ouroboros',
    name: 'Anillo de Uróboros',
    slot: 'RING',
    baseStatType: 'UTILITY',
    icon: '💍',
    class_req: 'ALL',
    description: 'Serpiente dorada mordiéndose la cola, símbolo de riqueza perenne.'
  },

  // AMULETOS (AMULETS)
  {
    code: 'amulet_phoenix_feather',
    name: 'Talismán del Fénix',
    slot: 'AMULET',
    baseStatType: 'BALANCED',
    icon: '📿',
    class_req: 'ALL',
    description: 'Encierra una brizna de fuego sagrado que nunca se extingue.'
  },
  {
    code: 'amulet_titan_core',
    name: 'Corazón del Titán',
    slot: 'AMULET',
    baseStatType: 'DEF',
    icon: '🔮',
    class_req: 'ALL',
    description: 'Roca rúnica que vibra al compás de la tierra profunda.'
  },
  {
    code: 'amulet_plague_ward',
    name: 'Relicario Anticorrupto',
    slot: 'AMULET',
    baseStatType: 'UTILITY',
    icon: '🧿',
    class_req: 'ALL',
    description: 'Filtra miasmas tóxicos y purifica el pulso del portador.'
  },
  {
    code: 'amulet_storm_eye',
    name: 'Medallón del Rayo',
    slot: 'AMULET',
    baseStatType: 'ATK',
    icon: '⚡',
    class_req: 'ALL',
    description: 'Condensa la electricidad latente de tormentas de alta montaña.'
  }
];

// Catálogo de Prefijos (Ofensivos, Defensivos y Elementales)
export const AFFIX_PREFIXES: AffixDef[] = [
  { id: 'pre_fierce', name: 'Feroz', type: 'PREFIX', statType: 'stat_atk', baseMin: 3, baseMax: 6, scalePerLevel: 0.6 },
  { id: 'pre_brutal', name: 'Brutal', type: 'PREFIX', statType: 'stat_atk', baseMin: 6, baseMax: 10, scalePerLevel: 0.9 },
  { id: 'pre_flaming', name: 'Ígneo', type: 'PREFIX', element: 'FUEGO', statType: 'stat_raid_dmg_pct', baseMin: 8, baseMax: 15, scalePerLevel: 0.5 },
  { id: 'pre_glacial', name: 'Glacial', type: 'PREFIX', element: 'HIELO', statType: 'stat_def', baseMin: 5, baseMax: 9, scalePerLevel: 0.7 },
  { id: 'pre_venomous', name: 'Tóxico', type: 'PREFIX', element: 'VENENO', statType: 'stat_crit_pct', baseMin: 4, baseMax: 8, scalePerLevel: 0.3 },
  { id: 'pre_runic', name: 'Rúnico', type: 'PREFIX', element: 'TIERRA', statType: 'stat_d20_bonus', baseMin: 1, baseMax: 1, scalePerLevel: 0.05 },
  { id: 'pre_impenetrable', name: 'Impenetrable', type: 'PREFIX', statType: 'stat_def', baseMin: 7, baseMax: 12, scalePerLevel: 0.9 },
  { id: 'pre_accurate', name: 'Certero', type: 'PREFIX', statType: 'stat_crit_pct', baseMin: 5, baseMax: 9, scalePerLevel: 0.35 },
  { id: 'pre_arcane', name: 'Arcano', type: 'PREFIX', element: 'ARCANO', statType: 'stat_xp_pct', baseMin: 10, baseMax: 18, scalePerLevel: 0.6 },
  { id: 'pre_golden', name: 'Áurico', type: 'PREFIX', statType: 'stat_gold_pct', baseMin: 12, baseMax: 20, scalePerLevel: 0.7 },
  { id: 'pre_devastating', name: 'Devastador', type: 'PREFIX', statType: 'stat_atk', baseMin: 9, baseMax: 15, scalePerLevel: 1.1 }
];

// Catálogo de Sufijos (Utilidad, Sinergias, Asedio y Pasivas)
export const AFFIX_SUFFIXES: AffixDef[] = [
  { id: 'suf_phoenix', name: 'del Fénix', type: 'SUFFIX', element: 'FUEGO', statType: 'stat_crit_pct', baseMin: 5, baseMax: 10, scalePerLevel: 0.3 },
  { id: 'suf_midas', name: 'de Midas', type: 'SUFFIX', statType: 'stat_gold_pct', baseMin: 15, baseMax: 28, scalePerLevel: 0.8 },
  { id: 'suf_dragonslayer', name: 'del Matadragones', type: 'SUFFIX', statType: 'stat_raid_dmg_pct', baseMin: 10, baseMax: 22, scalePerLevel: 0.8 },
  { id: 'suf_scholar', name: 'del Erudito', type: 'SUFFIX', statType: 'stat_xp_pct', baseMin: 12, baseMax: 24, scalePerLevel: 0.7 },
  { id: 'suf_titan', name: 'del Coloso', type: 'SUFFIX', element: 'TIERRA', statType: 'stat_def', baseMin: 6, baseMax: 12, scalePerLevel: 0.8 },
  { id: 'suf_shadows', name: 'de las Sombras', type: 'SUFFIX', statType: 'stat_atk', baseMin: 5, baseMax: 11, scalePerLevel: 0.7 },
  { id: 'suf_tempest', name: 'de la Tempestad', type: 'SUFFIX', statType: 'stat_crit_pct', baseMin: 6, baseMax: 12, scalePerLevel: 0.4 },
  { id: 'suf_bastion', name: 'del Baluarte', type: 'SUFFIX', statType: 'stat_def', baseMin: 8, baseMax: 14, scalePerLevel: 0.9 },
  { id: 'suf_fortune', name: 'de la Fortuna', type: 'SUFFIX', statType: 'stat_d20_bonus', baseMin: 1, baseMax: 2, scalePerLevel: 0.04 },
  { id: 'suf_ruin', name: 'de la Ruina', type: 'SUFFIX', statType: 'stat_atk', baseMin: 8, baseMax: 14, scalePerLevel: 1.0 },
  { id: 'suf_frost', name: 'de la Escarcha', type: 'SUFFIX', element: 'HIELO', statType: 'stat_raid_dmg_pct', baseMin: 12, baseMax: 20, scalePerLevel: 0.7 }
];

// Poderes Legendarios Pasivos Reactivos
export const LEGENDARY_PERKS: LegendaryPerk[] = [
  {
    id: 'perk_ignis_burst',
    name: 'Llamas del Cataclismo',
    description: 'En asedios contra Bosses, una tirada D20 >= 18 desata una explosión ígnea de +40% de daño adicional.',
    effect_code: 'IGNIS_BURST'
  },
  {
    id: 'perk_aurelius_aegis',
    name: 'Baluarte Rúnico Impenetrable',
    description: 'Si sufres una pifia (D20 = 1), el error se absorbe generando un escudo temporal igual al 35% de tu DEF.',
    effect_code: 'AURELIUS_AEGIS'
  },
  {
    id: 'perk_malakor_toxin',
    name: 'Miasma Vengativo',
    description: 'Tus ataques aplican toxina al objetivo: reduce un 15% la mitigación del Boss o rival en el siguiente turno.',
    effect_code: 'MALAKOR_TOXIN'
  },
  {
    id: 'perk_kaelith_frostbite',
    name: 'Toque del Cero Absoluto',
    description: 'Impactos críticos garantizan +1 a todas tus tiradas D20 durante los próximos 2 turnos.',
    effect_code: 'KAELITH_FROSTBITE'
  },
  {
    id: 'perk_midas_touch',
    name: 'Bendición de la Taberna Áurea',
    description: 'Otorga un +35% de Oro en todas las actividades y 10 de oro instantáneo al asestar el golpe de gracia a un Boss.',
    effect_code: 'MIDAS_TOUCH'
  },
  {
    id: 'perk_frenzy_rage',
    name: 'Furia de la Sangre Antigua',
    description: 'Cuando el Boss entra en Fase de Furia (<50% HP), todos tus ataques tienen +15% de probabilidad de Crítico.',
    effect_code: 'FRENZY_RAGE'
  },
  {
    id: 'perk_shadow_dance',
    name: 'Paso Furtivo Fantasmal',
    description: 'Tiradas D20 menores a 6 se relanzan automáticamente una vez por combate.',
    effect_code: 'SHADOW_DANCE'
  },
  {
    id: 'perk_bard_grand_hymn',
    name: 'Himno de los Héroes Eternos',
    description: '+20% de Experiencia (XP) para ti y +10% de daño pasivo en asedios para todo el gremio.',
    effect_code: 'BARDIC_HYMN'
  }
];

export type AllRarities = 
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC'
  | 'ANCIENT'
  | 'DIVINE'
  | 'CELESTIAL'
  | 'ETERNAL'
  | 'PRIMORDIAL';

export const RARITY_RANK_MAP: Record<AllRarities, number> = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  EPIC: 4,
  LEGENDARY: 5,
  MYTHIC: 6,
  ANCIENT: 7,
  DIVINE: 8,
  CELESTIAL: 9,
  ETERNAL: 10,
  PRIMORDIAL: 11
};

export const RARITY_NAMES_BY_RANK: Record<number, AllRarities> = {
  1: 'COMMON',
  2: 'UNCOMMON',
  3: 'RARE',
  4: 'EPIC',
  5: 'LEGENDARY',
  6: 'MYTHIC',
  7: 'ANCIENT',
  8: 'DIVINE',
  9: 'CELESTIAL',
  10: 'ETERNAL',
  11: 'PRIMORDIAL'
};

export interface GenerateItemOptions {
  playerLevel?: number;
  itemLevel?: number;
  rarity?: AllRarities;
  minRarityRank?: number; // P.ej. 6 para asegurar rareza > 5 (MYTHIC+)
  slot?: 'WEAPON' | 'ARMOR' | 'RING' | 'AMULET' | 'CONSUMABLE';
  source?: 'BOSS_DROP' | 'CHEST' | 'SHOP' | 'FORGE' | 'VAULT' | 'CLAN_WAR';
  elementalTheme?: 'FUEGO' | 'VENENO' | 'TIERRA' | 'HIELO' | 'ARCANO' | 'GENERAL';
  classReq?: 'WARRIOR' | 'MAGE' | 'ROGUE' | 'BARD' | 'ALL';
  forcedPerkId?: string;
}

/**
 * Motor maestro de generación procedural de ítems (Soporta 11 Rarezas)
 */
export function generateProceduralItem(options: GenerateItemOptions = {}): ItemRow {
  const pLevel = Math.max(1, options.playerLevel || 1);
  const iLvl = Math.max(1, options.itemLevel || pLevel + Math.floor(Math.random() * 3));
  const source = options.source || 'CHEST';
  const theme = options.elementalTheme || 'GENERAL';

  // 1. Determinar rareza si no viene forzada
  let rarity = options.rarity;
  if (!rarity) {
    let minRank = options.minRarityRank || 1;
    if (source === 'CLAN_WAR') {
      // Al ganar una Guerra de Clan, se asegura rareza mayor a 5 (Rank 6+)
      minRank = Math.max(6, minRank);
    }

    const roll = Math.random() * 100;
    const primordialUltraRoll = Math.random(); // Check 0.0000001% (1 entre 1,000,000,000)

    if (primordialUltraRoll < 0.000000001) {
      rarity = 'PRIMORDIAL';
    } else if (minRank >= 6) {
      // Rango 6+ (Mítico a Primordial)
      if (roll < 40) rarity = 'MYTHIC';
      else if (roll < 70) rarity = 'ANCIENT';
      else if (roll < 88) rarity = 'DIVINE';
      else if (roll < 97) rarity = 'CELESTIAL';
      else rarity = 'ETERNAL';
    } else if (source === 'BOSS_DROP') {
      if (roll < 15) rarity = 'UNCOMMON';
      else if (roll < 45) rarity = 'RARE';
      else if (roll < 75) rarity = 'EPIC';
      else if (roll < 92) rarity = 'LEGENDARY';
      else if (roll < 98) rarity = 'MYTHIC';
      else rarity = 'ANCIENT';
    } else if (source === 'VAULT') {
      if (roll < 40) rarity = 'EPIC';
      else if (roll < 75) rarity = 'LEGENDARY';
      else if (roll < 93) rarity = 'MYTHIC';
      else rarity = 'ANCIENT';
    } else {
      if (roll < 40) rarity = 'COMMON';
      else if (roll < 70) rarity = 'UNCOMMON';
      else if (roll < 88) rarity = 'RARE';
      else if (roll < 96) rarity = 'EPIC';
      else if (roll < 99.5) rarity = 'LEGENDARY';
      else rarity = 'MYTHIC';
    }

    // Asegurar cota inferior
    if (RARITY_RANK_MAP[rarity] < minRank) {
      rarity = RARITY_NAMES_BY_RANK[minRank] || 'MYTHIC';
    }
  }

  // 2. Elegir Base de Ítem
  let availableBases = ITEM_BASES;
  if (options.slot) {
    availableBases = availableBases.filter((b) => b.slot === options.slot);
  }
  if (options.classReq && options.classReq !== 'ALL') {
    availableBases = availableBases.filter((b) => !b.class_req || b.class_req === 'ALL' || b.class_req === options.classReq);
  }
  if (availableBases.length === 0) availableBases = ITEM_BASES;
  const base = availableBases[Math.floor(Math.random() * availableBases.length)];

  // 3. Presupuesto de Afijos según 11 Rarezas
  let prefixCount = 0;
  let suffixCount = 0;
  let hasLegendaryPerk = false;

  switch (rarity) {
    case 'COMMON':
      prefixCount = 0;
      suffixCount = 0;
      break;
    case 'UNCOMMON':
      if (Math.random() > 0.5) prefixCount = 1;
      else suffixCount = 1;
      break;
    case 'RARE':
      prefixCount = 1;
      suffixCount = 1 + (Math.random() > 0.6 ? 1 : 0);
      break;
    case 'EPIC':
      prefixCount = 1 + (Math.random() > 0.5 ? 1 : 0);
      suffixCount = 2;
      break;
    case 'LEGENDARY':
      prefixCount = 2;
      suffixCount = 2;
      hasLegendaryPerk = true;
      break;
    case 'MYTHIC':
      prefixCount = 2;
      suffixCount = 3;
      hasLegendaryPerk = true;
      break;
    case 'ANCIENT':
      prefixCount = 3;
      suffixCount = 3;
      hasLegendaryPerk = true;
      break;
    case 'DIVINE':
      prefixCount = 3;
      suffixCount = 4;
      hasLegendaryPerk = true;
      break;
    case 'CELESTIAL':
      prefixCount = 4;
      suffixCount = 4;
      hasLegendaryPerk = true;
      break;
    case 'ETERNAL':
      prefixCount = 4;
      suffixCount = 5;
      hasLegendaryPerk = true;
      break;
    case 'PRIMORDIAL':
      prefixCount = 5;
      suffixCount = 5;
      hasLegendaryPerk = true;
      break;
  }

  // 4. Seleccionar Prefijos y Sufijos
  const chosenPrefixes: AffixDef[] = [];
  const chosenSuffixes: AffixDef[] = [];

  const filterAffixByTheme = (pool: AffixDef[]) => {
    if (theme === 'GENERAL') return pool;
    // Si hay tema elemental, ponderar afijos afines
    const themed = pool.filter((a) => a.element === theme);
    return themed.length > 0 && Math.random() < 0.65 ? themed : pool;
  };

  // Escoger prefijos
  const availablePrefixes = [...filterAffixByTheme(AFFIX_PREFIXES)];
  for (let i = 0; i < prefixCount && availablePrefixes.length > 0; i++) {
    const idx = Math.floor(Math.random() * availablePrefixes.length);
    chosenPrefixes.push(availablePrefixes[idx]);
    availablePrefixes.splice(idx, 1);
  }

  // Escoger sufijos
  const availableSuffixes = [...filterAffixByTheme(AFFIX_SUFFIXES)];
  for (let i = 0; i < suffixCount && availableSuffixes.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableSuffixes.length);
    chosenSuffixes.push(availableSuffixes[idx]);
    availableSuffixes.splice(idx, 1);
  }

  // 5. Calcular Estadísticas Escaladas por iLvl
  const stats: Record<string, number> = {
    stat_atk: 0,
    stat_def: 0,
    stat_d20_bonus: 0,
    stat_gold_pct: 0,
    stat_xp_pct: 0,
    stat_crit_pct: 0,
    stat_raid_dmg_pct: 0
  };

  // Stat base inherente al arquetipo
  const baseMultiplier = 1 + (iLvl * 0.12);
  const rarityBonusMult = {
    COMMON: 1.0,
    UNCOMMON: 1.15,
    RARE: 1.25,
    EPIC: 1.35,
    LEGENDARY: 1.50,
    MYTHIC: 1.75,
    ANCIENT: 2.10,
    DIVINE: 2.60,
    CELESTIAL: 3.30,
    ETERNAL: 4.20,
    PRIMORDIAL: 6.00
  }[rarity] || 1.0;

  if (base.baseStatType === 'ATK') {
    stats.stat_atk = Math.round((8 + Math.floor(Math.random() * 5)) * baseMultiplier * rarityBonusMult);
  } else if (base.baseStatType === 'DEF') {
    stats.stat_def = Math.round((7 + Math.floor(Math.random() * 5)) * baseMultiplier * rarityBonusMult);
  } else if (base.baseStatType === 'BALANCED') {
    stats.stat_atk = Math.round((4 + Math.floor(Math.random() * 3)) * baseMultiplier * rarityBonusMult);
    stats.stat_def = Math.round((4 + Math.floor(Math.random() * 3)) * baseMultiplier * rarityBonusMult);
  } else if (base.baseStatType === 'UTILITY') {
    stats.stat_gold_pct = Math.round((5 + Math.floor(Math.random() * 5)) * baseMultiplier);
    stats.stat_xp_pct = Math.round((5 + Math.floor(Math.random() * 5)) * baseMultiplier);
  }

  // Aplicar bonificaciones de Afijos
  const allChosenAffixes = [...chosenPrefixes, ...chosenSuffixes];
  const affixLabels: string[] = [];

  for (const affix of allChosenAffixes) {
    const rollBase = affix.baseMin + Math.random() * (affix.baseMax - affix.baseMin);
    const scaledVal = Math.round(rollBase + (iLvl * affix.scalePerLevel));

    if (affix.statType === 'stat_d20_bonus') {
      // El bono D20 es muy delicado, limitamos a +1 o +2
      stats.stat_d20_bonus = Math.min(2, Math.max(1, (stats.stat_d20_bonus || 0) + 1));
      affixLabels.push(`+${stats.stat_d20_bonus} a Tiradas D20`);
    } else {
      stats[affix.statType] = (stats[affix.statType] || 0) + scaledVal;
      const isPct = affix.statType.includes('_pct');
      const statName = formatStatName(affix.statType);
      affixLabels.push(`+${scaledVal}${isPct ? '%' : ''} ${statName}`);
    }
  }

  // 6. Poder Legendario
  let legendaryPerk: LegendaryPerk | undefined;
  if (hasLegendaryPerk) {
    if (options.forcedPerkId) {
      legendaryPerk = LEGENDARY_PERKS.find((p) => p.id === options.forcedPerkId) || LEGENDARY_PERKS[0];
    } else {
      legendaryPerk = LEGENDARY_PERKS[Math.floor(Math.random() * LEGENDARY_PERKS.length)];
    }
  }

  // 7. Síntesis de Nombre Dinámico y Coherente
  const prefixStr = chosenPrefixes.length > 0 ? chosenPrefixes[0].name + ' ' : '';
  const suffixStr = chosenSuffixes.length > 0 ? ' ' + chosenSuffixes[0].name : '';
  const fullName = `${prefixStr}${base.name}${suffixStr}`.trim();

  // 8. Valor de Mercado
  const rarityCostMult = {
    COMMON: 1,
    UNCOMMON: 2.2,
    RARE: 4.5,
    EPIC: 9.0,
    LEGENDARY: 18.0,
    MYTHIC: 35.0,
    ANCIENT: 70.0,
    DIVINE: 140.0,
    CELESTIAL: 300.0,
    ETERNAL: 650.0,
    PRIMORDIAL: 2000.0
  }[rarity] || 1;

  const goldCost = Math.max(15, Math.round((20 + (iLvl * 8)) * rarityCostMult));
  const sellValue = Math.max(8, Math.round(goldCost * 0.45));

  // 9. Construir ItemRow completo
  const uniqueId = `item_proc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const flavorDescription = generateItemLoreDescription({
    slot: base.slot,
    rarity,
    elementalTheme: theme !== 'GENERAL' ? theme : undefined,
    baseName: base.name,
    baseDesc: base.description
  });

  const item: ItemRow = {
    id: uniqueId,
    name: fullName,
    description: flavorDescription,
    slot: base.slot,
    rarity,
    gold_cost: goldCost,
    sell_value: sellValue,
    required_level: Math.max(1, iLvl - 2),
    class_req: base.class_req || 'ALL',
    stat_atk: stats.stat_atk > 0 ? stats.stat_atk : undefined,
    stat_def: stats.stat_def > 0 ? stats.stat_def : undefined,
    stat_d20_bonus: stats.stat_d20_bonus > 0 ? stats.stat_d20_bonus : undefined,
    stat_gold_pct: stats.stat_gold_pct > 0 ? stats.stat_gold_pct : undefined,
    stat_xp_pct: stats.stat_xp_pct > 0 ? stats.stat_xp_pct : undefined,
    stat_crit_pct: stats.stat_crit_pct > 0 ? stats.stat_crit_pct : undefined,
    stat_raid_dmg_pct: stats.stat_raid_dmg_pct > 0 ? stats.stat_raid_dmg_pct : undefined,
    icon: base.icon,
    effect_type: legendaryPerk ? legendaryPerk.effect_code : 'PROCEDURAL_EQUIP',
    is_active_in_shop: source === 'SHOP',
    // Campos de extensión procedural
    affixes: affixLabels,
    legendary_perk: legendaryPerk,
    item_level: iLvl,
    refine_level: 0,
    base_code: base.code,
    elemental_theme: theme !== 'GENERAL' ? theme : undefined
  };

  return item;
}

function formatStatName(statType: string): string {
  switch (statType) {
    case 'stat_atk': return 'Ataque';
    case 'stat_def': return 'Defensa';
    case 'stat_crit_pct': return 'Prob. Crítica';
    case 'stat_d20_bonus': return 'Bono D20';
    case 'stat_gold_pct': return 'Oro Obtenido';
    case 'stat_xp_pct': return 'Experiencia';
    case 'stat_raid_dmg_pct': return 'Daño a Raid Boss';
    default: return 'Poder';
  }
}
