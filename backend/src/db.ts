import fs from 'fs';
import path from 'path';

export interface PlayerRow {
  id: string;
  nfc_uid: string;
  name: string;
  username: string;
  password?: string;
  secret_class: string;
  role: string;
  xp: number;
  gold: number;
  level: number;
  private_token: string;
  streak_days?: number;
  nat20_streak?: number;
  last_daily_claim_at?: string | null;
  pvp_wins?: number;
  pvp_losses?: number;
  title?: string;
  equipped_title?: string;
  telegram_id?: string | null;
  duel_disabled_until?: string | null;
  last_scanned_at?: string | null;
  guild_tokens?: number;
  gens_faction?: 'DUPRIAN' | 'VANERT' | null;
  gens_points?: number;
  gens_rank?: string;
  daily_gold_earned?: number;
  gold_earned_date?: string;
  last_guild_chest_claim_at?: string | null;
  created_at: string;
}

export interface TitleRow {
  id: string;
  name: string;
  description: string;
  category: string;
  req_type: string;
  req_value: number | string;
  icon: string;
  perk_description?: string;
  stat_bonus_type?: 'CRIT_PCT' | 'EXPEDITION_GOLD_PCT' | 'D20_EVENT_BONUS' | 'MAX_HP' | 'RAID_DMG_PCT' | 'XP_PCT';
  stat_bonus_value?: number;
}

export interface PlayerTitleRow {
  id: string;
  player_id: string;
  title_id: string;
  unlocked_at: string;
}

export type ExpeditionNodeType = 'COMBAT' | 'ELITE' | 'EVENT' | 'REST' | 'BOSS';

export interface ExpeditionNode {
  id: string;
  floor: number;
  step: number;
  type: ExpeditionNodeType;
  title: string;
  description: string;
  icon: string;
  is_cleared: boolean;
  enemy?: {
    name: string;
    hp: number;
    max_hp: number;
    atk: number;
    dc: number;
    icon: string;
  };
  event?: {
    prompt: string;
    choices: {
      id: string;
      label: string;
      dc: number;
      success_flavor: string;
      failure_flavor: string;
      reward_gold?: number;
      reward_xp?: number;
      damage_on_fail?: number;
    }[];
  };
  connected_to: string[];
}

export interface ExpeditionLootBag {
  gold: number;
  xp: number;
  items_found: string[];
  relics_found: string[];
}

export interface ExpeditionSession {
  id: string;
  player_id: string;
  floor: number;
  current_hp: number;
  max_hp: number;
  current_node_id: string | null;
  nodes: ExpeditionNode[];
  loot_bag: ExpeditionLootBag;
  status: 'ACTIVE' | 'RETREATED' | 'DEFEATED' | 'VICTORIOUS';
  buff_damage_pct: number;
  created_at: string;
  updated_at: string;
}

export interface AchievementRow {
  id: string;
  title: string;
  description: string;
  category: 'COMBAT' | 'FORGE' | 'EXPEDITIONS' | 'GUILD';
  icon: string;
  req_type: 'RAID_KILL' | 'PVP_WIN' | 'FORGE_LEVEL' | 'GOLD_TOTAL' | 'EXPEDITION_NODES' | 'EXPEDITION_RETREAT' | 'CLAN_DONATE' | 'LEVEL';
  req_target: number;
  reward_xp: number;
  reward_gold: number;
  unlocked_title_id?: string;
}

export interface PlayerAchievementRow {
  id: string;
  player_id: string;
  achievement_id: string;
  current_progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  completed_at?: string;
}

export interface DailyQuestRow {
  id: string;
  title: string;
  description: string;
  reward_xp: number;
  reward_gold: number;
  quest_type: string;
  target_value: number;
}

export interface PvPChallengeRow {
  id: string;
  challenger_id: string;
  challenger_name: string;
  opponent_id: string;
  opponent_name: string;
  wager: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  created_at: string;
}

export interface PlayerQuestRow {
  id: string;
  player_id: string;
  quest_id: string;
  progress: number;
  target_value: number;
  is_completed: boolean;
  is_claimed: boolean;
  assigned_date: string;
}

export interface LegendaryPerk {
  id: string;
  name: string;
  description: string;
  effect_code: string;
}

export interface ItemRow {
  id: string;
  name: string;
  description: string;
  slot: 'WEAPON' | 'ARMOR' | 'RING' | 'AMULET' | 'CONSUMABLE';
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC' | 'ANCIENT' | 'DIVINE' | 'CELESTIAL' | 'ETERNAL' | 'PRIMORDIAL';
  gold_cost: number;
  sell_value: number;
  required_level: number;
  class_req?: 'WARRIOR' | 'MAGE' | 'ROGUE' | 'BARD' | 'ALL';
  stat_atk?: number;
  stat_def?: number;
  stat_d20_bonus?: number;
  stat_gold_pct?: number;
  stat_xp_pct?: number;
  stat_crit_pct?: number;
  stat_raid_dmg_pct?: number;
  icon: string;
  effect_type: string;
  is_active_in_shop: boolean;
  // Campos de generación procedural y forja
  affixes?: string[];
  legendary_perk?: LegendaryPerk;
  item_level?: number;
  refine_level?: number;
  base_code?: string;
  elemental_theme?: string;
}

export interface InventoryRow {
  id: string;
  player_id: string;
  item_id: string;
  is_equipped: boolean;
  purchased_at: string;
  consumed_at?: string | null;
}

export interface ScanLogRow {
  id: string;
  player_id: string;
  raw_roll: number;
  final_roll: number;
  xp_awarded: number;
  gold_awarded: number;
  modifiers_applied: string;
  created_at: string;
}

export interface GlobalStateRow {
  key: string;
  value: string;
  updated_at: string;
}

export interface TavernShoutRow {
  id: string;
  player_id: string;
  player_name: string;
  secret_class: string;
  title?: string;
  message: string;
  created_at: string;
}

export interface MarketListingRow {
  id: string;
  seller_id: string;
  seller_name: string;
  item_id: string;
  item_name: string;
  item_description: string;
  item_icon: string;
  gold_price: number;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED';
  created_at: string;
  buyer_id?: string | null;
}

export interface RaidBossDef {
  id: string;
  name: string;
  title: string;
  max_hp: number;
  element: string;
  level: number;
  reward_gold: number;
  reward_xp: number;
  weakness: string;
  trait: string;
  icon: string;
  lore_description?: string;
  combat_cries?: {
    enter: string;
    half_hp: string;
    defeat: string;
  };
}

export interface PlayerRaidCombatState {
  hp: number;
  max_hp: number;
  stamina: number;
  is_defending: boolean;
  last_stamina_update: number;
  special_cooldown_until?: number;
  knocked_out_until?: string | null;
}

export interface RaidBossState {
  id: string;
  name: string;
  title: string;
  current_hp: number;
  max_hp: number;
  element: string;
  level: number;
  reward_gold: number;
  reward_xp: number;
  is_defeated: boolean;
  defeated_at?: string | null;
  total_attacks: number;
  top_contributors: { player_id: string; player_name: string; damage: number }[];
  weakness?: string;
  trait?: string;
  icon?: string;
  lore_description?: string;
  combat_cries?: {
    enter: string;
    half_hp: string;
    defeat: string;
  };
  phase?: number;
  rage_meter?: number;
  vulnerable_turns?: number;
  last_boss_action?: string;
  difficulty?: 'NORMAL' | 'HEROIC' | 'MYTHIC';
  shield_hp?: number;
  max_shield_hp?: number;
  shield_turns_left?: number;
  player_combat_states?: Record<string, PlayerRaidCombatState>;
}

export interface ClassTalentNode {
  id: string;
  class_name: 'WARRIOR' | 'MAGE' | 'ROGUE' | 'BARD';
  branch: string;
  tier: number;
  name: string;
  description: string;
  icon: string;
  max_points: number;
  stat_bonus: {
    atk?: number;
    def?: number;
    crit_pct?: number;
    d20_bonus?: number;
    gold_pct?: number;
    xp_pct?: number;
    raid_dmg_pct?: number;
    shop_discount_pct?: number;
  };
}

export interface PlayerTalentRow {
  id: string;
  player_id: string;
  branch: string;
  tier: number;
  points: number;
  talent_id?: string;
}

export interface PlayerPetRow {
  id: string;
  player_id: string;
  pet_type: string;
  name: string;
  level: number;
  bonus_type: string;
  bonus_value: number;
  is_active: boolean;
  feed_count: number;
}

export interface ClanRow {
  id: string;
  name: string;
  tag: string;
  description: string;
  leader_id: string;
  treasury_gold: number;
  level: number;
  clan_xp: number;
  clan_xp_next: number;
  emblem: string;
  perks_unlocked: string[];
  created_at: string;
}

export interface ClanMemberRow {
  id: string;
  clan_id: string;
  player_id: string;
  player_name: string;
  role: 'LEADER' | 'OFFICER' | 'VETERAN' | 'MEMBER';
  contribution_points: number;
  joined_at: string;
}

export interface TerritoryRow {
  id: string;
  name: string;
  controlling_clan_id?: string | null;
  controlling_clan_name?: string | null;
  controlling_clan_tag?: string | null;
  bonus_description: string;
  buff_type: 'GOLD_DISCOUNT' | 'XP_BOOST' | 'DUEL_DAMAGE' | 'COOLDOWN_FORGE';
  buff_title: string;
  defense_points: number;
  fortification_level: number; // 1 a 5
  daily_gold_rate: number;    // Oro generado cada 24 horas
  accumulated_gold: number;
  last_payout_at: string;
  siege_status: 'PEACE' | 'SIEGE_ACTIVE';
  siege_target_points: number; // 1000
  siege_progress: Record<string, { clan_name: string; tag: string; points: number }>;
}

export interface SoloRaidDef {
  id: string;
  name: string;
  min_level: number;
  difficulty: 'NORMAL' | 'HEROIC' | 'MYTHIC';
  reward_xp: number;
  reward_gold: number;
  clan_fame: number;
  rooms: { room: number; title: string; dc: number; enemy: string }[];
}

export interface DbSchema {
  players: PlayerRow[];
  items: ItemRow[];
  inventory: InventoryRow[];
  scan_logs: ScanLogRow[];
  global_states: GlobalStateRow[];
  titles: TitleRow[];
  player_titles: PlayerTitleRow[];
  daily_quests: DailyQuestRow[];
  player_quests: PlayerQuestRow[];
  pvp_challenges: PvPChallengeRow[];
  tavern_shouts: TavernShoutRow[];
  market_listings: MarketListingRow[];
  raid_boss: RaidBossState;
  talents: PlayerTalentRow[];
  pets: PlayerPetRow[];
  clans: ClanRow[];
  clan_members: ClanMemberRow[];
  territories: TerritoryRow[];
  achievements: AchievementRow[];
  player_achievements: PlayerAchievementRow[];
  active_expeditions: ExpeditionSession[];
  focus_tasks?: any[];
  taskbar_progress?: any[];
}

export const RAID_BOSS_CATALOG: RaidBossDef[] = [
  {
    id: 'boss_01',
    name: '🐉 Ignis el Dragón de Obsidiana',
    title: 'Azote del Pico Nevado',
    max_hp: 5000,
    element: 'FUEGO',
    level: 30,
    reward_gold: 300,
    reward_xp: 500,
    weakness: 'HIELO / ARCANO',
    trait: 'Llamas Furiosas: A <50% HP entra en Furia Ígnea (+50% botín)',
    icon: '🐉',
    lore_description: 'Forjado en la fundición primordial de Kal-Drakor cuando el magma tocó el Éter desbocado. Busca devorar todo metal templado para avivar su corazón de horno cósmico.',
    combat_cries: {
      enter: '¡Vuestras hojas insignificantes solo alimentarán mi fragua!',
      half_hp: '¡El fuego de la creación no puede ser extinguido por cenizas mortales!',
      defeat: 'Mi llama se apaga... pero el volcán jamás olvidará...'
    }
  },
  {
    id: 'boss_02',
    name: '💀 Malakor el Señor de la Plaga',
    title: 'Soberano de las Catacumbas Malditas',
    max_hp: 6500,
    element: 'VENENO',
    level: 35,
    reward_gold: 420,
    reward_xp: 650,
    weakness: 'FUEGO / SAGRADO',
    trait: 'Miasma Pútrido: Los golpes menores a 8 ven su daño reducido un 40%',
    icon: '💀',
    lore_description: 'Antiguo Gran Canciller de la Orden Blanca que bebió del Pozo Putrefacto para burlar a la muerte. Gobierna un ejército de huesos en las catacumbas bajo la Taberna.',
    combat_cries: {
      enter: 'La carne es efímera, aventureros. El fango de mis criptas os acogerá a todos.',
      half_hp: '¡Sentid cómo la ponzoña disuelve vuestra vana esperanza!',
      defeat: 'La muerte... solo es un paréntesis en la oscuridad eterna...'
    }
  },
  {
    id: 'boss_03',
    name: '🗿 Aurelius el Titán de Runas',
    title: 'Guardián Durmiente de la Cima',
    max_hp: 8000,
    element: 'TIERRA',
    level: 40,
    reward_gold: 550,
    reward_xp: 800,
    weakness: 'RAYO / PERFORANTE',
    trait: 'Coraza Rúnica: Alta mitigación base, pero críticos y habilidades causan daño masivo',
    icon: '🗿',
    lore_description: 'El último guardián telúrico creado por los Dioses de Piedra para sostener el eje de las montañas. Sus runas vibran con la lengua primigenia de la creación.',
    combat_cries: {
      enter: 'La roca recuerda cada pisada. Y la montaña os aplastará.',
      half_hp: '¡Los cimientos del mundo tiemblan bajo vuestra insolencia!',
      defeat: 'Regreso... a la quietud del lecho de piedra...'
    }
  },
  {
    id: 'boss_04',
    name: '❄️ Kaelith la Reina de las Criptas',
    title: 'Emperatriz de la Escarcha Imperecedera',
    max_hp: 10000,
    element: 'HIELO',
    level: 45,
    reward_gold: 750,
    reward_xp: 1200,
    weakness: 'FUEGO / PURA ENERGÍA',
    trait: 'Ventisca Glacial: Exige asedio grupal sincronizado. Otorga gloria legendaria',
    icon: '❄️',
    lore_description: 'Soberana de la era glacial sepultada bajo el Glaciar de los Suspiros. Su llanto infinito congela la sangre de quien osa cruzar los límites del Nido de Cuervos.',
    combat_cries: {
      enter: 'Silencio... solo el frío eterno sabrá preservar vuestra osadía.',
      half_hp: '¡Vuestros corazones latirán más lentos hasta que la escarcha los detenga!',
      defeat: 'Al fin... el deshielo que tanto ansiaba mi alma...'
    }
  }
];

export const CLASS_SKILL_TREES: Record<string, { class_name: 'WARRIOR' | 'MAGE' | 'ROGUE' | 'BARD'; title: string; branches: { name: string; description: string; nodes: ClassTalentNode[] }[] }> = {
  WARRIOR: {
    class_name: 'WARRIOR',
    title: 'Senda del Guerrero',
    branches: [
      {
        name: 'Furia Berserker',
        description: 'Poder destructivo cuerpo a cuerpo y ejecución',
        nodes: [
          {
            id: 'war_atk_1',
            class_name: 'WARRIOR',
            branch: 'Furia Berserker',
            tier: 1,
            name: 'Fuerza Bruta',
            description: '+10 de Ataque físico base en duelos y asedios',
            icon: '⚔️',
            max_points: 1,
            stat_bonus: { atk: 10 }
          },
          {
            id: 'war_atk_2',
            class_name: 'WARRIOR',
            branch: 'Furia Berserker',
            tier: 2,
            name: 'Sed de Sangre',
            description: '+15% de Daño contra el Raid Boss',
            icon: '🩸',
            max_points: 1,
            stat_bonus: { raid_dmg_pct: 15 }
          },
          {
            id: 'war_atk_3',
            class_name: 'WARRIOR',
            branch: 'Furia Berserker',
            tier: 3,
            name: 'Embate Titánico',
            description: 'Tiradas D20 >= 15 multiplican el daño x2 en Asedios',
            icon: '💥',
            max_points: 1,
            stat_bonus: { crit_pct: 15, raid_dmg_pct: 20 }
          }
        ]
      },
      {
        name: 'Baluarte de Hierro',
        description: 'Defensa impenetrable y absorción de fallos',
        nodes: [
          {
            id: 'war_def_1',
            class_name: 'WARRIOR',
            branch: 'Baluarte de Hierro',
            tier: 1,
            name: 'Piel de Acero',
            description: '+10 de Defensa base',
            icon: '🛡️',
            max_points: 1,
            stat_bonus: { def: 10 }
          },
          {
            id: 'war_def_2',
            class_name: 'WARRIOR',
            branch: 'Baluarte de Hierro',
            tier: 2,
            name: 'Escudo Inflexible',
            description: 'Pifias D20=1 en Raid se convierten en tirada segura de 8',
            icon: '🏰',
            max_points: 1,
            stat_bonus: { d20_bonus: 1 }
          },
          {
            id: 'war_def_3',
            class_name: 'WARRIOR',
            branch: 'Baluarte de Hierro',
            tier: 3,
            name: 'Muralla Viviente',
            description: 'Reduce contragolpes de bosses un 30% y gana +15 DEF',
            icon: '👑',
            max_points: 1,
            stat_bonus: { def: 15 }
          }
        ]
      },
      {
        name: 'Grito de Mando',
        description: 'Liderazgo táctico y botines de guerra',
        nodes: [
          {
            id: 'war_sup_1',
            class_name: 'WARRIOR',
            branch: 'Grito de Mando',
            tier: 1,
            name: 'Presencia Marcial',
            description: '+10% de Oro en todas las victorias',
            icon: '🪙',
            max_points: 1,
            stat_bonus: { gold_pct: 10 }
          },
          {
            id: 'war_sup_2',
            class_name: 'WARRIOR',
            branch: 'Grito de Mando',
            tier: 2,
            name: 'Inspiración de Escuadrón',
            description: '+15% de Experiencia (XP) en misiones y asedios',
            icon: '⭐',
            max_points: 1,
            stat_bonus: { xp_pct: 15 }
          },
          {
            id: 'war_sup_3',
            class_name: 'WARRIOR',
            branch: 'Grito de Mando',
            tier: 3,
            name: 'Señor de la Guerra',
            description: 'Tus ataques al Raid Boss aumentan un 10% el daño de toda la taberna',
            icon: '🎺',
            max_points: 1,
            stat_bonus: { raid_dmg_pct: 15, gold_pct: 15 }
          }
        ]
      }
    ]
  },
  MAGE: {
    class_name: 'MAGE',
    title: 'Círculo de la Alta Magia',
    branches: [
      {
        name: 'Evocación Arcana',
        description: 'Canalización elemental pura y daño explosivo',
        nodes: [
          {
            id: 'mag_atk_1',
            class_name: 'MAGE',
            branch: 'Evocación Arcana',
            tier: 1,
            name: 'Chispa Arcana',
            description: '+12 de Daño mágico en ataques',
            icon: '🔥',
            max_points: 1,
            stat_bonus: { atk: 12 }
          },
          {
            id: 'mag_atk_2',
            class_name: 'MAGE',
            branch: 'Evocación Arcana',
            tier: 2,
            name: 'Piroexplosión Rúnica',
            description: '+20% de Daño contra debilidades elementales de Raid Boss',
            icon: '⚡',
            max_points: 1,
            stat_bonus: { raid_dmg_pct: 20 }
          },
          {
            id: 'mag_atk_3',
            class_name: 'MAGE',
            branch: 'Evocación Arcana',
            tier: 3,
            name: 'Cataclismo',
            description: 'Tiradas D20 de 18-20 desatan una explosión de 2.8x daño',
            icon: '☄️',
            max_points: 1,
            stat_bonus: { crit_pct: 20, raid_dmg_pct: 25 }
          }
        ]
      },
      {
        name: 'Protección Mística',
        description: 'Barreras de maná y distorsión del tiempo',
        nodes: [
          {
            id: 'mag_def_1',
            class_name: 'MAGE',
            branch: 'Protección Mística',
            tier: 1,
            name: 'Escudo de Maná',
            description: '+8 de Defensa y amortiguación de daño',
            icon: '🔮',
            max_points: 1,
            stat_bonus: { def: 8 }
          },
          {
            id: 'mag_def_2',
            class_name: 'MAGE',
            branch: 'Protección Mística',
            tier: 2,
            name: 'Distorsión Temporal',
            description: '+1 a todas las tiradas de dados D20',
            icon: '⏳',
            max_points: 1,
            stat_bonus: { d20_bonus: 1 }
          },
          {
            id: 'mag_def_3',
            class_name: 'MAGE',
            branch: 'Protección Mística',
            tier: 3,
            name: 'Santuario Arcano',
            description: 'Protege contra efectos negativos del Boss e inflige +15 DEF',
            icon: '✨',
            max_points: 1,
            stat_bonus: { def: 15, d20_bonus: 1 }
          }
        ]
      },
      {
        name: 'Erudición Alquímica',
        description: 'Transmutación de riqueza y sabiduría arcana',
        nodes: [
          {
            id: 'mag_sup_1',
            class_name: 'MAGE',
            branch: 'Erudición Alquímica',
            tier: 1,
            name: 'Transmutación de Oro',
            description: '+15% de Oro en escaneos y combates',
            icon: '🧪',
            max_points: 1,
            stat_bonus: { gold_pct: 15 }
          },
          {
            id: 'mag_sup_2',
            class_name: 'MAGE',
            branch: 'Erudición Alquímica',
            tier: 2,
            name: 'Grimorio del Erudito',
            description: '+20% de Experiencia (XP) en todas las actividades',
            icon: '📖',
            max_points: 1,
            stat_bonus: { xp_pct: 20 }
          },
          {
            id: 'mag_sup_3',
            class_name: 'MAGE',
            branch: 'Erudición Alquímica',
            tier: 3,
            name: 'Piedra Filosofal',
            description: 'Las pociones consumidas duran el doble y otorgan +10% oro extra',
            icon: '🌟',
            max_points: 1,
            stat_bonus: { gold_pct: 10, xp_pct: 15 }
          }
        ]
      }
    ]
  },
  ROGUE: {
    class_name: 'ROGUE',
    title: 'Gremio de las Sombras',
    branches: [
      {
        name: 'Letalidad Sombría',
        description: 'Ataques furtivos y golpes críticos despiadados',
        nodes: [
          {
            id: 'rog_atk_1',
            class_name: 'ROGUE',
            branch: 'Letalidad Sombría',
            tier: 1,
            name: 'Daga Oculta',
            description: '+10 de Ataque físico perforante',
            icon: '🗡️',
            max_points: 1,
            stat_bonus: { atk: 10 }
          },
          {
            id: 'rog_atk_2',
            class_name: 'ROGUE',
            branch: 'Letalidad Sombría',
            tier: 2,
            name: 'Sentido Asesino',
            description: 'Rango de Crítico extendido a 18, 19 y 20 en D20',
            icon: '🎯',
            max_points: 1,
            stat_bonus: { crit_pct: 20 }
          },
          {
            id: 'rog_atk_3',
            class_name: 'ROGUE',
            branch: 'Letalidad Sombría',
            tier: 3,
            name: 'Muerte Silenciosa',
            description: 'Tus golpes críticos en Raid Boss infligen 3x de daño letal',
            icon: '☠️',
            max_points: 1,
            stat_bonus: { raid_dmg_pct: 25, crit_pct: 15 }
          }
        ]
      },
      {
        name: 'Evasión Ágil',
        description: 'Esquiva acrobática y supervivencia',
        nodes: [
          {
            id: 'rog_def_1',
            class_name: 'ROGUE',
            branch: 'Evasión Ágil',
            tier: 1,
            name: 'Paso Ligero',
            description: '+8 de Defensa por esquiva',
            icon: '👟',
            max_points: 1,
            stat_bonus: { def: 8 }
          },
          {
            id: 'rog_def_2',
            class_name: 'ROGUE',
            branch: 'Evasión Ágil',
            tier: 2,
            name: 'Bomba de Humo',
            description: 'Si sacas menos de 6 en D20, relanzas el dado automáticamente',
            icon: '💨',
            max_points: 1,
            stat_bonus: { d20_bonus: 1 }
          },
          {
            id: 'rog_def_3',
            class_name: 'ROGUE',
            branch: 'Evasión Ágil',
            tier: 3,
            name: 'Danza de las Sombras',
            description: '+15 DEF y 25% de probabilidad de asestar doble golpe al Boss',
            icon: '👥',
            max_points: 1,
            stat_bonus: { def: 15, raid_dmg_pct: 15 }
          }
        ]
      },
      {
        name: 'Fortuna Callejera',
        description: 'Bolsillos profundos, regateo y dados trucados',
        nodes: [
          {
            id: 'rog_sup_1',
            class_name: 'ROGUE',
            branch: 'Fortuna Callejera',
            tier: 1,
            name: 'Manos Rápidas',
            description: '+20% de Oro robado / ganado en todas partes',
            icon: '💰',
            max_points: 1,
            stat_bonus: { gold_pct: 20 }
          },
          {
            id: 'rog_sup_2',
            class_name: 'ROGUE',
            branch: 'Fortuna Callejera',
            tier: 2,
            name: 'Regateo Clandestino',
            description: '-10% de Descuento permanente en el Bazar del Gremio',
            icon: '🗝️',
            max_points: 1,
            stat_bonus: { shop_discount_pct: 10 }
          },
          {
            id: 'rog_sup_3',
            class_name: 'ROGUE',
            branch: 'Fortuna Callejera',
            tier: 3,
            name: 'Golpe Maestro',
            description: 'Cada crítico en Asedio o Duelo te otorga +25 de oro instantáneo',
            icon: '💎',
            max_points: 1,
            stat_bonus: { gold_pct: 20 }
          }
        ]
      }
    ]
  },
  BARD: {
    class_name: 'BARD',
    title: 'Colegio de Bardos',
    branches: [
      {
        name: 'Balada del Destino',
        description: 'Manipulación sónica de las tiradas de dados',
        nodes: [
          {
            id: 'brd_atk_1',
            class_name: 'BARD',
            branch: 'Balada del Destino',
            tier: 1,
            name: 'Cuerdas Encantadas',
            description: '+10 de Daño sónico resonante',
            icon: '🪕',
            max_points: 1,
            stat_bonus: { atk: 10 }
          },
          {
            id: 'brd_atk_2',
            class_name: 'BARD',
            branch: 'Balada del Destino',
            tier: 2,
            name: 'Armonía Cósmica',
            description: '+2 a todas tus tiradas de D20 en Asedios y Duelos',
            icon: '🎵',
            max_points: 1,
            stat_bonus: { d20_bonus: 2 }
          },
          {
            id: 'brd_atk_3',
            class_name: 'BARD',
            branch: 'Balada del Destino',
            tier: 3,
            name: 'Crescendo Heroico',
            description: 'Tiradas D20 >= 16 causan onda expansiva de +35% de daño',
            icon: '💥',
            max_points: 1,
            stat_bonus: { raid_dmg_pct: 25, crit_pct: 10 }
          }
        ]
      },
      {
        name: 'Carisma de Taberna',
        description: 'Persuasión magnética y descuentos comerciales',
        nodes: [
          {
            id: 'brd_def_1',
            class_name: 'BARD',
            branch: 'Carisma de Taberna',
            tier: 1,
            name: 'Labia del Juglar',
            description: '-15% de Descuento permanente en la Tienda del Gremio',
            icon: '🍻',
            max_points: 1,
            stat_bonus: { shop_discount_pct: 15 }
          },
          {
            id: 'brd_def_2',
            class_name: 'BARD',
            branch: 'Carisma de Taberna',
            tier: 2,
            name: 'Fascinación Hipnótica',
            description: 'Reduce el daño recibido de contragolpes un 20% y +8 DEF',
            icon: '🎭',
            max_points: 1,
            stat_bonus: { def: 8 }
          },
          {
            id: 'brd_def_3',
            class_name: 'BARD',
            branch: 'Carisma de Taberna',
            tier: 3,
            name: 'Presencia Escénica',
            description: 'Pifias D20=1 se convierten en comedia y otorgan +15 🪙 de oro',
            icon: '🎪',
            max_points: 1,
            stat_bonus: { gold_pct: 15 }
          }
        ]
      },
      {
        name: 'Inspiración de Grupo',
        description: 'Buffs masivos para toda la hermandad en Asedios',
        nodes: [
          {
            id: 'brd_sup_1',
            class_name: 'BARD',
            branch: 'Inspiración de Grupo',
            tier: 1,
            name: 'Himno Estimulante',
            description: '+15% de Experiencia (XP) para ti y aliados',
            icon: '📜',
            max_points: 1,
            stat_bonus: { xp_pct: 15 }
          },
          {
            id: 'brd_sup_2',
            class_name: 'BARD',
            branch: 'Inspiración de Grupo',
            tier: 2,
            name: 'Canto de Guerra',
            description: 'Atacar al Boss otorga +20% de daño al próximo aliado que ataque',
            icon: '🎺',
            max_points: 1,
            stat_bonus: { raid_dmg_pct: 20 }
          },
          {
            id: 'brd_sup_3',
            class_name: 'BARD',
            branch: 'Inspiración de Grupo',
            tier: 3,
            name: 'Sinfonía Legendaria',
            description: 'Multiplica x1.5 el botín de oro y XP recibido al derrotar al Boss',
            icon: '👑',
            max_points: 1,
            stat_bonus: { gold_pct: 25, xp_pct: 25 }
          }
        ]
      }
    ]
  }
};

const DEFAULT_RAID_BOSS: RaidBossState = {
  id: 'boss_01',
  name: '🐉 Ignis el Dragón de Obsidiana',
  title: 'Azote del Pico Nevado',
  current_hp: 5000,
  max_hp: 5000,
  element: 'FUEGO',
  level: 30,
  reward_gold: 300,
  reward_xp: 500,
  is_defeated: false,
  total_attacks: 0,
  top_contributors: [],
  weakness: 'HIELO / ARCANO',
  trait: 'Llamas Furiosas: A <50% HP entra en Furia Ígnea (+50% botín)',
  icon: '🐉',
  phase: 1
};

class JsonDatabase {
  private dbPath: string;
  public data: DbSchema = {
    players: [],
    items: [],
    inventory: [],
    scan_logs: [],
    global_states: [],
    titles: [],
    player_titles: [],
    daily_quests: [],
    player_quests: [],
    pvp_challenges: [],
    tavern_shouts: [],
    market_listings: [],
    raid_boss: { ...DEFAULT_RAID_BOSS },
    talents: [],
    pets: [],
    clans: [],
    clan_members: [],
    territories: [],
    achievements: [],
    player_achievements: [],
    active_expeditions: []
  };

  constructor() {
    this.dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'rpg_gremio_store.json');
    this.migrateLegacyIfNeeded();
    this.load();
    this.seedDefaultData();
  }

  private migrateLegacyIfNeeded() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        const candidatePaths = [
          '/app/rpg_gremio_store.json',
          path.join(__dirname, '..', 'rpg_gremio_store.json'),
          path.join(process.cwd(), 'rpg_gremio_store.json')
        ];
        for (const cand of candidatePaths) {
          if (fs.existsSync(cand) && cand !== this.dbPath) {
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.copyFileSync(cand, this.dbPath);
            console.log(`[DB] 📦 Migrado archivo heredado desde ${cand} a ${this.dbPath}`);
            break;
          }
        }
      }
    } catch (err) {
      console.error('[DB] ⚠️ Error en migración de archivo heredado:', err);
    }
  }

  private load() {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          players: parsed.players || [],
          items: parsed.items || [],
          inventory: parsed.inventory || [],
          scan_logs: parsed.scan_logs || [],
          global_states: parsed.global_states || [],
          titles: parsed.titles || [],
          player_titles: parsed.player_titles || [],
          daily_quests: parsed.daily_quests || [],
          player_quests: parsed.player_quests || [],
          pvp_challenges: parsed.pvp_challenges || [],
          tavern_shouts: parsed.tavern_shouts || [],
          market_listings: parsed.market_listings || [],
          raid_boss: parsed.raid_boss || { ...DEFAULT_RAID_BOSS },
          talents: parsed.talents || [],
          pets: parsed.pets || [],
          clans: parsed.clans || [],
          clan_members: parsed.clan_members || [],
          territories: parsed.territories || [],
          achievements: parsed.achievements || [],
          player_achievements: parsed.player_achievements || [],
          active_expeditions: parsed.active_expeditions || []
        };
        console.log(`[DB] ✅ Base de datos cargada exitosamente desde ${this.dbPath} (${this.data.players.length} jugadores, ${this.data.clans.length} clanes).`);
      } catch (e) {
        console.error('[DB] ❌ Error leyendo JSON DB, reiniciando estado...', e);
      }
    } else {
      console.log(`[DB] ℹ️ Base de datos no encontrada en ${this.dbPath}. Se creará al iniciar.`);
    }
  }

  public save() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${this.dbPath}.tmp_${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.dbPath);
    } catch (e) {
      console.error('[DB] ❌ Error guardando JSON DB atómicamente:', e);
    }
  }

  private seedDefaultData() {
    
    // Seed 50 Titles Catalog
    const catalogTitles: TitleRow[] = [
      {
            "id": "title_01",
            "name": "🎲 Favorito de la Fortuna",
            "description": "Obtener 3 Nat 20 seguidos en la taberna.",
            "category": "LUCK",
            "req_type": "NAT20_STREAK",
            "req_value": 3,
            "icon": "🎲"
      },
      {
            "id": "title_02",
            "name": "🥉 Novato de la Taberna",
            "description": "Iniciar la travesía en la taberna (Nivel 1+).",
            "category": "LEVEL",
            "req_type": "LEVEL",
            "req_value": 1,
            "icon": "🥉"
      },
      {
            "id": "title_03",
            "name": "🥈 Aventurero Consagrado",
            "description": "Alcanzar el Nivel 5.",
            "category": "LEVEL",
            "req_type": "LEVEL",
            "req_value": 5,
            "icon": "🥈"
      },
      {
            "id": "title_04",
            "name": "🥇 Héroe de la Taberna",
            "description": "Alcanzar el Nivel 10.",
            "category": "LEVEL",
            "req_type": "LEVEL",
            "req_value": 10,
            "icon": "🥇"
      },
      {
            "id": "title_05",
            "name": "👑 Leyenda Viviente",
            "description": "Alcanzar el Nivel 25.",
            "category": "LEVEL",
            "req_type": "LEVEL",
            "req_value": 25,
            "icon": "👑"
      },
      {
            "id": "title_06",
            "name": "🔱 Titán del Gremio",
            "description": "Alcanzar el Nivel 50.",
            "category": "LEVEL",
            "req_type": "LEVEL",
            "req_value": 50,
            "icon": "🔱"
      },
      {
            "id": "title_07",
            "name": "🛡️ Escudo Inquebrantable",
            "description": "Alcanzar Nivel 10 como Guerrero.",
            "category": "CLASS",
            "req_type": "CLASS_LEVEL_WARRIOR",
            "req_value": 10,
            "icon": "🛡️"
      },
      {
            "id": "title_08",
            "name": "🧙‍♂️ Archimago Arcano",
            "description": "Alcanzar Nivel 10 como Mago.",
            "category": "CLASS",
            "req_type": "CLASS_LEVEL_MAGE",
            "req_value": 10,
            "icon": "🧙‍♂️"
      },
      {
            "id": "title_09",
            "name": "🗡️ Sombra Nocturna",
            "description": "Alcanzar Nivel 10 como Pícaro.",
            "category": "CLASS",
            "req_type": "CLASS_LEVEL_ROGUE",
            "req_value": 10,
            "icon": "🗡️"
      },
      {
            "id": "title_10",
            "name": "🎭 Maestro Minstrel",
            "description": "Alcanzar Nivel 10 como Bardo.",
            "category": "CLASS",
            "req_type": "CLASS_LEVEL_BARD",
            "req_value": 10,
            "icon": "🎭"
      },
      {
            "id": "title_11",
            "name": "⚔️ Iniciado en la Arena",
            "description": "Ganar tu primer Duelo PvP.",
            "category": "PVP",
            "req_type": "PVP_WINS",
            "req_value": 1,
            "icon": "⚔️"
      },
      {
            "id": "title_12",
            "name": "🩸 Sediento de Sangre",
            "description": "Ganar 5 Duelos PvP.",
            "category": "PVP",
            "req_type": "PVP_WINS",
            "req_value": 5,
            "icon": "🩸"
      },
      {
            "id": "title_13",
            "name": "🏆 El Invicto",
            "description": "Ganar 10 Duelos PvP.",
            "category": "PVP",
            "req_type": "PVP_WINS",
            "req_value": 10,
            "icon": "🏆"
      },
      {
            "id": "title_14",
            "name": "👑 Señor de la Arena",
            "description": "Ganar 25 Duelos PvP.",
            "category": "PVP",
            "req_type": "PVP_WINS",
            "req_value": 25,
            "icon": "👑"
      },
      {
            "id": "title_15",
            "name": "💀 Gladiador Implacable",
            "description": "Ganar 50 Duelos PvP.",
            "category": "PVP",
            "req_type": "PVP_WINS",
            "req_value": 50,
            "icon": "💀"
      },
      {
            "id": "title_16",
            "name": "💰 Monedero Lleno",
            "description": "Acumular 100 de Oro.",
            "category": "GOLD",
            "req_type": "GOLD",
            "req_value": 100,
            "icon": "💰"
      },
      {
            "id": "title_17",
            "name": "🏦 Tesorero de la Taberna",
            "description": "Acumular 500 de Oro.",
            "category": "GOLD",
            "req_type": "GOLD",
            "req_value": 500,
            "icon": "🏦"
      },
      {
            "id": "title_18",
            "name": "🪙 Magnate del Gremio",
            "description": "Acumular 1,000 de Oro.",
            "category": "GOLD",
            "req_type": "GOLD",
            "req_value": 1000,
            "icon": "🪙"
      },
      {
            "id": "title_19",
            "name": "💎 Rey Midas",
            "description": "Acumular 5,000 de Oro.",
            "category": "GOLD",
            "req_type": "GOLD",
            "req_value": 5000,
            "icon": "💎"
      },
      {
            "id": "title_20",
            "name": "🎰 Millonario de la Casa",
            "description": "Acumular 10,000 de Oro.",
            "category": "GOLD",
            "req_type": "GOLD",
            "req_value": 10000,
            "icon": "🎰"
      },
      {
            "id": "title_21",
            "name": "🎲 Toque de Suerte",
            "description": "Sacar al menos 1 Nat 20.",
            "category": "LUCK",
            "req_type": "NAT20_COUNT",
            "req_value": 1,
            "icon": "🎲"
      },
      {
            "id": "title_22",
            "name": "⚡ Doble Destello",
            "description": "Sacar 2 Nat 20 seguidos.",
            "category": "LUCK",
            "req_type": "NAT20_STREAK",
            "req_value": 2,
            "icon": "⚡"
      },
      {
            "id": "title_23",
            "name": "🕯️ Portador de la Maldición",
            "description": "Usar el Candelabro de la Desdicha.",
            "category": "ITEMS",
            "req_type": "ITEM_USED_CANDLE",
            "req_value": 1,
            "icon": "🕯️"
      },
      {
            "id": "title_24",
            "name": "🩸 Pacto Oscuro",
            "description": "Activar el Pacto de Sangre.",
            "category": "ITEMS",
            "req_type": "ITEM_USED_BLOOD_PACT",
            "req_value": 1,
            "icon": "🩸"
      },
      {
            "id": "title_25",
            "name": "💀 Resucitado por Nigromante",
            "description": "Usar el Dado del Nigromante.",
            "category": "ITEMS",
            "req_type": "ITEM_USED_NECRO_DICE",
            "req_value": 1,
            "icon": "💀"
      },
      {
            "id": "title_26",
            "name": "🛡️ Pifia Inmune",
            "description": "Bloquear pifia 1 con el Escudo contra Pifias.",
            "category": "ITEMS",
            "req_type": "ANTI_FUMBLE_USED",
            "req_value": 1,
            "icon": "🛡️"
      },
      {
            "id": "title_27",
            "name": "🏅 Frecuentador de la Casa",
            "description": "Realizar 5 escaneos NFC.",
            "category": "SCANS",
            "req_type": "SCANS",
            "req_value": 5,
            "icon": "🏅"
      },
      {
            "id": "title_28",
            "name": "🚀 Parroquiano Fiel",
            "description": "Realizar 15 escaneos NFC.",
            "category": "SCANS",
            "req_type": "SCANS",
            "req_value": 15,
            "icon": "🚀"
      },
      {
            "id": "title_29",
            "name": "🏠 Guardián de la Taberna",
            "description": "Realizar 30 escaneos NFC.",
            "category": "SCANS",
            "req_type": "SCANS",
            "req_value": 30,
            "icon": "🏠"
      },
      {
            "id": "title_30",
            "name": "🌟 El Residente",
            "description": "Realizar 60 escaneos NFC.",
            "category": "SCANS",
            "req_type": "SCANS",
            "req_value": 60,
            "icon": "🌟"
      },
      {
            "id": "title_31",
            "name": "🔥 Racha Encendida",
            "description": "Racha de 3 días consecutivos.",
            "category": "STREAK",
            "req_type": "STREAK",
            "req_value": 3,
            "icon": "🔥"
      },
      {
            "id": "title_32",
            "name": "⚡ Racha Imparable",
            "description": "Racha de 7 días consecutivos.",
            "category": "STREAK",
            "req_type": "STREAK",
            "req_value": 7,
            "icon": "⚡"
      },
      {
            "id": "title_33",
            "name": "🌌 Leyenda de la Racha",
            "description": "Racha de 30 días consecutivos.",
            "category": "STREAK",
            "req_type": "STREAK",
            "req_value": 30,
            "icon": "🌌"
      },
      {
            "id": "title_34",
            "name": "🛍️ Comprador Compulsivo",
            "description": "Comprar 5 ítems en la tienda.",
            "category": "SHOP",
            "req_type": "SHOP_PURCHASES",
            "req_value": 5,
            "icon": "🛍️"
      },
      {
            "id": "title_35",
            "name": "🎒 Coleccionista de Artefactos",
            "description": "Comprar 15 ítems en la tienda.",
            "category": "SHOP",
            "req_type": "SHOP_PURCHASES",
            "req_value": 15,
            "icon": "🎒"
      },
      {
            "id": "title_36",
            "name": "📜 Cazador de Misiones",
            "description": "Completar 5 misiones diarias.",
            "category": "QUESTS",
            "req_type": "QUESTS_COMPLETED",
            "req_value": 5,
            "icon": "📜"
      },
      {
            "id": "title_37",
            "name": "🎖️ Héroe de las Misiones",
            "description": "Completar 20 misiones diarias.",
            "category": "QUESTS",
            "req_type": "QUESTS_COMPLETED",
            "req_value": 20,
            "icon": "🎖️"
      },
      {
            "id": "title_38",
            "name": "🔮 Sabio del Gremio",
            "description": "Realizar 10 acciones registradas.",
            "category": "SPECIAL",
            "req_type": "ACTIONS",
            "req_value": 10,
            "icon": "🔮"
      },
      {
            "id": "title_39",
            "name": "⚡ Golpe Relámpago",
            "description": "Ganar un Duelo PvP en la 1ª ronda.",
            "category": "PVP",
            "req_type": "FAST_DUEL_WIN",
            "req_value": 1,
            "icon": "⚡"
      },
      {
            "id": "title_40",
            "name": "🛡️ Muro de Piedra",
            "description": "Ganar un Duelo PvP 2-0 sin perder rondas.",
            "category": "PVP",
            "req_type": "CLEAN_DUEL_WIN",
            "req_value": 1,
            "icon": "🛡️"
      },
      {
            "id": "title_41",
            "name": "🎲 Dados Calientes",
            "description": "Tirada promedio de escaneo superior a 15.",
            "category": "LUCK",
            "req_type": "HIGH_AVG_ROLL",
            "req_value": 15,
            "icon": "🎲"
      },
      {
            "id": "title_42",
            "name": "🗡️ Asesino Furtivo",
            "description": "Realizar un K.O. Instantáneo con Pícaro.",
            "category": "CLASS",
            "req_type": "ROGUE_KO",
            "req_value": 1,
            "icon": "🗡️"
      },
      {
            "id": "title_43",
            "name": "🧙‍♂️ Sobrecarga Arcana",
            "description": "Ganar un Duelo usando la pasiva Arcana de Mago.",
            "category": "CLASS",
            "req_type": "MAGE_BUFF_WIN",
            "req_value": 1,
            "icon": "🧙‍♂️"
      },
      {
            "id": "title_44",
            "name": "🎭 Canto de Victoria",
            "description": "Ganar un Duelo como Bardo con comisión extra.",
            "category": "CLASS",
            "req_type": "BARD_BONUS_WIN",
            "req_value": 1,
            "icon": "🎭"
      },
      {
            "id": "title_45",
            "name": "☕ Madrugador",
            "description": "Escanear en la taberna entre las 6 AM y 9 AM.",
            "category": "SPECIAL",
            "req_type": "EARLY_SCAN",
            "req_value": 1,
            "icon": "☕"
      },
      {
            "id": "title_46",
            "name": "🌙 Noctámbulo de la Taberna",
            "description": "Escanear en la taberna después de las 11 PM.",
            "category": "SPECIAL",
            "req_type": "LATE_SCAN",
            "req_value": 1,
            "icon": "🌙"
      },
      {
            "id": "title_47",
            "name": "👑 Favorito del DM",
            "description": "Recibir una recompensa directa del Dungeon Master.",
            "category": "SPECIAL",
            "req_type": "DM_REWARD",
            "req_value": 1,
            "icon": "👑"
      },
      {
            "id": "title_48",
            "name": "🍻 Borracho Alegre",
            "description": "Realizar escaneos en 3 fines de semana.",
            "category": "SPECIAL",
            "req_type": "WEEKEND_SCANS",
            "req_value": 3,
            "icon": "🍻"
      },
      {
            "id": "title_49",
            "name": "🗡️ Cazador de Sombras",
            "description": "Derrotar a un Pícaro en Duelo PvP.",
            "category": "PVP",
            "req_type": "BEAT_ROGUE",
            "req_value": 1,
            "icon": "🗡️"
      },
      {
            "id": "title_50",
            "name": "🌌 Leyenda del Gremio",
            "description": "Desbloquear 20 Títulos del Gremio.",
            "category": "SPECIAL",
            "req_type": "TITLES_UNLOCKED",
            "req_value": 20,
            "icon": "🌌"
      }
];
    for (const t of catalogTitles) {
      if (!this.data.titles.find((x) => x.id === t.id)) {
        this.data.titles.push(t);
      }
    }

    // V3.6.0: Asignar Perks Pasivos a Títulos Honoríficos
    const titlePerksMap: Record<string, { desc: string; type: 'CRIT_PCT' | 'EXPEDITION_GOLD_PCT' | 'D20_EVENT_BONUS' | 'MAX_HP' | 'RAID_DMG_PCT' | 'XP_PCT'; val: number }> = {
      'title_01': { desc: '+2 a tiradas D20 en eventos de mazmorra', type: 'D20_EVENT_BONUS', val: 2 },
      'title_02': { desc: '+5% de Oro en expediciones', type: 'EXPEDITION_GOLD_PCT', val: 5 },
      'title_03': { desc: '+10% XP adicional en todas las actividades', type: 'XP_PCT', val: 10 },
      'title_04': { desc: '+15 HP Máximo en combate y expedición', type: 'MAX_HP', val: 15 },
      'title_05': { desc: '+8% Daño Crítico', type: 'CRIT_PCT', val: 8 },
      'title_06': { desc: '+15% Daño en Asedios de Raid Boss', type: 'RAID_DMG_PCT', val: 15 },
      'title_07': { desc: '+25 HP Máximo de combate', type: 'MAX_HP', val: 25 },
      'title_08': { desc: '+10% Daño Crítico elemental', type: 'CRIT_PCT', val: 10 },
      'title_09': { desc: '+2 a tiradas de iniciativa y trampas', type: 'D20_EVENT_BONUS', val: 2 },
      'title_10': { desc: '+12% de Oro en expediciones', type: 'EXPEDITION_GOLD_PCT', val: 12 },
      'title_11': { desc: '+5% Daño Crítico', type: 'CRIT_PCT', val: 5 },
      'title_12': { desc: '+10% Daño Crítico', type: 'CRIT_PCT', val: 10 }
    };

    for (const t of this.data.titles) {
      if (titlePerksMap[t.id]) {
        t.perk_description = titlePerksMap[t.id].desc;
        t.stat_bonus_type = titlePerksMap[t.id].type;
        t.stat_bonus_value = titlePerksMap[t.id].val;
      }
    }

    // V3.6.0: Catálogo de Logros del Gremio
    const catalogAchievements: AchievementRow[] = [
      {
        id: 'ach_01',
        title: 'Primeros Pasos en la Cripta',
        description: 'Explora y despeja 1 sala en las Catacumbas Olvidadas.',
        category: 'EXPEDITIONS',
        icon: '🧭',
        req_type: 'EXPEDITION_NODES',
        req_target: 1,
        reward_xp: 50,
        reward_gold: 30,
        unlocked_title_id: 'title_02'
      },
      {
        id: 'ach_02',
        title: 'Caminante de Criptas',
        description: 'Despeja 10 salas en expediciones a las Catacumbas.',
        category: 'EXPEDITIONS',
        icon: '🕯️',
        req_type: 'EXPEDITION_NODES',
        req_target: 10,
        reward_xp: 200,
        reward_gold: 100,
        unlocked_title_id: 'title_03'
      },
      {
        id: 'ach_03',
        title: 'Avaricia Triunfante',
        description: 'Retírate con éxito de una expedición con al menos 100 de oro en el saco.',
        category: 'EXPEDITIONS',
        icon: '💰',
        req_type: 'EXPEDITION_RETREAT',
        req_target: 100,
        reward_xp: 180,
        reward_gold: 80,
        unlocked_title_id: 'title_10'
      },
      {
        id: 'ach_04',
        title: 'Azote de Titanes',
        description: 'Participa en la derrota de un Raid Boss en el Asedio.',
        category: 'COMBAT',
        icon: '🐉',
        req_type: 'RAID_KILL',
        req_target: 1,
        reward_xp: 300,
        reward_gold: 150,
        unlocked_title_id: 'title_04'
      },
      {
        id: 'ach_05',
        title: 'Hoja Invicta',
        description: 'Alcanza 5 victorias en Duelos PvP de la Arena.',
        category: 'COMBAT',
        icon: '⚔️',
        req_type: 'PVP_WIN',
        req_target: 5,
        reward_xp: 250,
        reward_gold: 100,
        unlocked_title_id: 'title_12'
      },
      {
        id: 'ach_06',
        title: 'Maestro de la Fragua',
        description: 'Posee al menos un ítem refinado a nivel +7 o superior.',
        category: 'FORGE',
        icon: '🔥',
        req_type: 'FORGE_LEVEL',
        req_target: 7,
        reward_xp: 400,
        reward_gold: 200,
        unlocked_title_id: 'title_07'
      },
      {
        id: 'ach_07',
        title: 'Mecenas del Clan',
        description: 'Dona al menos 50 piezas de oro a la Tesorería de tu Clan.',
        category: 'GUILD',
        icon: '🏰',
        req_type: 'CLAN_DONATE',
        req_target: 50,
        reward_xp: 220,
        reward_gold: 60,
        unlocked_title_id: 'title_06'
      },
      {
        id: 'ach_08',
        title: 'Leyenda del Despertar',
        description: 'Alcanza el Nivel 15 con tu héroe.',
        category: 'COMBAT',
        icon: '👑',
        req_type: 'LEVEL',
        req_target: 15,
        reward_xp: 500,
        reward_gold: 250,
        unlocked_title_id: 'title_05'
      }
    ];

    for (const ach of catalogAchievements) {
      const idx = this.data.achievements.findIndex((a) => a.id === ach.id);
      if (idx === -1) {
        this.data.achievements.push(ach);
      } else {
        this.data.achievements[idx] = { ...ach, ...this.data.achievements[idx] };
      }
    }

    // Seed Daily Quests
    const baseQuests: DailyQuestRow[] = [
      {
            "id": "quest_01",
            "title": "⚔️ Desafío de la Arena",
            "description": "Completar o participar en 1 Duelo PvP en la taberna.",
            "reward_xp": 25,
            "reward_gold": 15,
            "quest_type": "PVP_DUEL",
            "target_value": 1
      },
      {
            "id": "quest_02",
            "title": "🎲 Prueba de la Suerte",
            "description": "Obtener una tirada final de d20 >= 12 en tu próximo escaneo.",
            "reward_xp": 30,
            "reward_gold": 20,
            "quest_type": "SCAN_ROLL",
            "target_value": 12
      },
      {
            "id": "quest_03",
            "title": "🏠 Visita a la Casa",
            "description": "Escanear tu tarjeta o celular NFC en la taberna presencial.",
            "reward_xp": 20,
            "reward_gold": 10,
            "quest_type": "NFC_SCAN",
            "target_value": 1
      },
      {
            "id": "quest_04",
            "title": "🛍️ Apoyo al Mercader",
            "description": "Comprar cualquier ítem o brebaje en la tienda.",
            "reward_xp": 15,
            "reward_gold": 25,
            "quest_type": "BUY_ITEM",
            "target_value": 1
      }
];
    for (const q of baseQuests) {
      if (!this.data.daily_quests.find((x) => x.id === q.id)) {
        this.data.daily_quests.push(q);
      }
    }

    // Seed Base Shop Items (25 Items across 5 Categories)
    const baseItems: ItemRow[] = [
      // === ARMAS (WEAPONS) ===
      {
        id: 'wpn_espada_acero',
        name: '🗡️ Espada Larga de Acero Forjado',
        description: 'Forjada en los fuegos de la taberna. Otorga +5 de Daño en duelos y asaltos.',
        slot: 'WEAPON',
        rarity: 'COMMON',
        gold_cost: 30,
        sell_value: 15,
        required_level: 1,
        class_req: 'ALL',
        stat_atk: 5,
        icon: '🗡️',
        effect_type: 'ATK_BOOST',
        is_active_in_shop: true
      },
      {
        id: 'wpn_baculo_arcano',
        name: '🔮 Báculo de Destello Arcano',
        description: 'Canaliza corrientes mágicas. +8 Daño, +1 a tiradas D20 y +5% de probabilidad crítica.',
        slot: 'WEAPON',
        rarity: 'UNCOMMON',
        gold_cost: 55,
        sell_value: 27,
        required_level: 3,
        class_req: 'MAGE',
        stat_atk: 8,
        stat_d20_bonus: 1,
        stat_crit_pct: 5,
        icon: '🔮',
        effect_type: 'SPELL_AMP',
        is_active_in_shop: true
      },
      {
        id: 'wpn_dagas_sombras',
        name: '🗡️ Dagas Gemelas de Asesino',
        description: 'Empapadas en veneno de cripta. +12 Daño, +12% Crítico y +10% de Oro obtenido.',
        slot: 'WEAPON',
        rarity: 'RARE',
        gold_cost: 90,
        sell_value: 45,
        required_level: 6,
        class_req: 'ROGUE',
        stat_atk: 12,
        stat_crit_pct: 12,
        stat_gold_pct: 10,
        icon: '🗡️',
        effect_type: 'CRIT_BLEED',
        is_active_in_shop: true
      },
      {
        id: 'wpn_mandoble_titanes',
        name: '⚔️ Mandoble del Rompedor de Muros',
        description: 'Espada colosal que quiebra escudos. +18 Daño y +2 permanente a tiradas D20.',
        slot: 'WEAPON',
        rarity: 'EPIC',
        gold_cost: 140,
        sell_value: 70,
        required_level: 10,
        class_req: 'WARRIOR',
        stat_atk: 18,
        stat_d20_bonus: 2,
        icon: '⚔️',
        effect_type: 'TITAN_CLEAVE',
        is_active_in_shop: true
      },
      {
        id: 'wpn_guadana_vacio',
        name: '💀 Guadaña Devoradora de Sombras',
        description: 'Reliquia legendaria forjada en el Vacío. +25 Daño, +2 a tiradas, +15% Crítico y +15% XP.',
        slot: 'WEAPON',
        rarity: 'LEGENDARY',
        gold_cost: 240,
        sell_value: 120,
        required_level: 14,
        class_req: 'ALL',
        stat_atk: 25,
        stat_d20_bonus: 2,
        stat_crit_pct: 15,
        stat_xp_pct: 15,
        icon: '💀',
        effect_type: 'SOUL_HARVEST',
        is_active_in_shop: true
      },

      // === ARMADURAS (ARMORS) ===
      {
        id: 'arm_cuero_reforzado',
        name: '🛡️ Jubón de Cuero Reforzado',
        description: 'Ligera y flexible para cualquier travesía. Otorga +4 de Defensa pasiva.',
        slot: 'ARMOR',
        rarity: 'COMMON',
        gold_cost: 25,
        sell_value: 12,
        required_level: 1,
        class_req: 'ALL',
        stat_def: 4,
        icon: '🛡️',
        effect_type: 'DEF_BOOST',
        is_active_in_shop: true
      },
      {
        id: 'arm_cota_elfica',
        name: '🛡️ Cota de Mallas de Acero Élfico',
        description: 'Mallas tejidas a mano por orfebres estelares. +8 Defensa y +1 a tiradas D20.',
        slot: 'ARMOR',
        rarity: 'UNCOMMON',
        gold_cost: 50,
        sell_value: 25,
        required_level: 4,
        class_req: 'ALL',
        stat_def: 8,
        stat_d20_bonus: 1,
        icon: '🛡️',
        effect_type: 'DODGE_CHANCE',
        is_active_in_shop: true
      },
      {
        id: 'arm_tunica_astral',
        name: '✨ Túnica Astral del Archicanciller',
        description: 'Imbuida con polvo de cometa. +10 Defensa y +15% de Experiencia en todas las acciones.',
        slot: 'ARMOR',
        rarity: 'RARE',
        gold_cost: 85,
        sell_value: 42,
        required_level: 7,
        class_req: 'MAGE',
        stat_def: 10,
        stat_xp_pct: 15,
        icon: '✨',
        effect_type: 'MANA_BARRIER',
        is_active_in_shop: true
      },
      {
        id: 'arm_placas_dragon',
        name: '🐉 Coraza de Escamas de Dragón Negro',
        description: 'Pechera impenetrable reforzada con escamas de Ignis. +18 Defensa y +5 Ataque.',
        slot: 'ARMOR',
        rarity: 'EPIC',
        gold_cost: 150,
        sell_value: 75,
        required_level: 11,
        class_req: 'WARRIOR',
        stat_def: 18,
        stat_atk: 5,
        icon: '🐉',
        effect_type: 'FLAME_RETALIATION',
        is_active_in_shop: true
      },
      {
        id: 'arm_manto_inmortal',
        name: '👑 Manto del Bastión Eterno',
        description: 'Armadura legendaria de los Reyes del Gremio. +24 Defensa, +2 a tiradas y +15% Oro.',
        slot: 'ARMOR',
        rarity: 'LEGENDARY',
        gold_cost: 260,
        sell_value: 130,
        required_level: 15,
        class_req: 'ALL',
        stat_def: 24,
        stat_d20_bonus: 2,
        stat_gold_pct: 15,
        icon: '👑',
        effect_type: 'IMMORTAL_WARD',
        is_active_in_shop: true
      },

      // === ANILLOS (RINGS) ===
      {
        id: 'rng_cobre_taberna',
        name: '💍 Sortija de Cobre del Aprendiz',
        description: 'Sencillo pero brillante. Concede +5% de Oro en todas las actividades.',
        slot: 'RING',
        rarity: 'COMMON',
        gold_cost: 20,
        sell_value: 10,
        required_level: 1,
        class_req: 'ALL',
        stat_gold_pct: 5,
        icon: '💍',
        effect_type: 'GOLD_TINY',
        is_active_in_shop: true
      },
      {
        id: 'rng_mercader_avaro',
        name: '🪙 Sello del Mercader Codicioso',
        description: 'Tallado con runas de prosperidad mercantil. +15% de Oro en taberna y misiones.',
        slot: 'RING',
        rarity: 'UNCOMMON',
        gold_cost: 45,
        sell_value: 22,
        required_level: 3,
        class_req: 'ALL',
        stat_gold_pct: 15,
        icon: '🪙',
        effect_type: 'TRADE_GREED',
        is_active_in_shop: true
      },
      {
        id: 'rng_ojo_esmeralda',
        name: '💚 Anillo del Ojo de la Fortuna',
        description: 'Engarzado con una esmeralda viva. +20% de Oro y +8% de probabilidad crítica.',
        slot: 'RING',
        rarity: 'RARE',
        gold_cost: 80,
        sell_value: 40,
        required_level: 6,
        class_req: 'ALL',
        stat_gold_pct: 20,
        stat_crit_pct: 8,
        icon: '💚',
        effect_type: 'LUCKY_TOUCH',
        is_active_in_shop: true
      },
      {
        id: 'rng_escarcha_glacial',
        name: '❄️ Sortija de Furia Glacial',
        description: 'Forjada en hielo perenne. +8 Ataque, +6 Defensa y +15% de Oro.',
        slot: 'RING',
        rarity: 'EPIC',
        gold_cost: 130,
        sell_value: 65,
        required_level: 10,
        class_req: 'ALL',
        stat_atk: 8,
        stat_def: 6,
        stat_gold_pct: 15,
        icon: '❄️',
        effect_type: 'FROST_SURGE',
        is_active_in_shop: true
      },
      {
        id: 'rng_soberania_aurica',
        name: '💍 Anillo de Soberanía Áurica',
        description: 'Toque de Midas legendario. +35% de Oro en todas las fuentes y +1 a tiradas D20.',
        slot: 'RING',
        rarity: 'LEGENDARY',
        gold_cost: 220,
        sell_value: 110,
        required_level: 13,
        class_req: 'ALL',
        stat_gold_pct: 35,
        stat_d20_bonus: 1,
        icon: '💍',
        effect_type: 'MIDAS_BLESSING',
        is_active_in_shop: true
      },

      // === AMULETOS (AMULETS) ===
      {
        id: 'amu_talisman_novicio',
        name: '📿 Talismán de Cuentas de Madera',
        description: 'Bendecido por el tabernero. Concede +5% de Experiencia ganada.',
        slot: 'AMULET',
        rarity: 'COMMON',
        gold_cost: 20,
        sell_value: 10,
        required_level: 1,
        class_req: 'ALL',
        stat_xp_pct: 5,
        icon: '📿',
        effect_type: 'XP_TINY',
        is_active_in_shop: true
      },
      {
        id: 'amu_ojo_tormenta',
        name: '⚡ Medalla de la Tormenta Eléctrica',
        description: 'Vibra con energía pura. +12% de XP y +6% de probabilidad de Nat 20.',
        slot: 'AMULET',
        rarity: 'UNCOMMON',
        gold_cost: 50,
        sell_value: 25,
        required_level: 4,
        class_req: 'ALL',
        stat_xp_pct: 12,
        stat_crit_pct: 6,
        icon: '⚡',
        effect_type: 'LIGHTNING_AURA',
        is_active_in_shop: true
      },
      {
        id: 'amu_perla_sabiduria',
        name: '🔮 Colgante de Sabiduría Ancestral',
        description: 'Contiene memorias de los antiguos héroes. +22% de XP y +1 a tiradas D20.',
        slot: 'AMULET',
        rarity: 'RARE',
        gold_cost: 85,
        sell_value: 42,
        required_level: 7,
        class_req: 'ALL',
        stat_xp_pct: 22,
        stat_d20_bonus: 1,
        icon: '🔮',
        effect_type: 'ANCIENT_INSIGHT',
        is_active_in_shop: true
      },
      {
        id: 'amu_corazon_fenix',
        name: '🔥 Medallón del Fénix Sagrado',
        description: 'Arde con una llama inmortal. +28% de XP, +1 a tiradas D20 y +10% Crítico.',
        slot: 'AMULET',
        rarity: 'EPIC',
        gold_cost: 145,
        sell_value: 72,
        required_level: 11,
        class_req: 'ALL',
        stat_xp_pct: 28,
        stat_d20_bonus: 1,
        stat_crit_pct: 10,
        icon: '🔥',
        effect_type: 'PHOENIX_REVIVE',
        is_active_in_shop: true
      },
      {
        id: 'amu_ojo_ignis',
        name: '👁️ Ojo Carmesí del Dragón Ignis',
        description: 'Arrancado del Dragón de Obsidiana. +35% XP, +10 Ataque y +2 permanente a tiradas D20.',
        slot: 'AMULET',
        rarity: 'LEGENDARY',
        gold_cost: 250,
        sell_value: 125,
        required_level: 15,
        class_req: 'ALL',
        stat_xp_pct: 35,
        stat_atk: 10,
        stat_d20_bonus: 2,
        icon: '👁️',
        effect_type: 'DRAGON_MAJESTY',
        is_active_in_shop: true
      },

      // === CONSUMIBLES & POCIONES (CONSUMABLES) ===
      {
        id: 'item_anti_fumble',
        name: '🛡️ Escudo contra Pifias',
        description: 'Transforma una pifia fatal (d20 = 1) en una tirada segura de 10.',
        slot: 'CONSUMABLE',
        rarity: 'COMMON',
        gold_cost: 25,
        sell_value: 12,
        required_level: 1,
        icon: '🛡️',
        effect_type: 'ANTI_FUMBLE',
        is_active_in_shop: true
      },
      {
        id: 'item_fortune_dice',
        name: '🎲 Dado de la Fortuna Doble',
        description: 'Tira 2d20 y selecciona automáticamente el valor más alto en el próximo escaneo.',
        slot: 'CONSUMABLE',
        rarity: 'UNCOMMON',
        gold_cost: 40,
        sell_value: 20,
        required_level: 2,
        icon: '🎲',
        effect_type: 'FORTUNE_DICE',
        is_active_in_shop: true
      },
      {
        id: 'item_xp_elixir',
        name: '🧪 Elixir de Erudición Suprema',
        description: 'Duplica el Oro y la Experiencia ganados en el próximo evento de la taberna.',
        slot: 'CONSUMABLE',
        rarity: 'RARE',
        gold_cost: 35,
        sell_value: 17,
        required_level: 3,
        icon: '🧪',
        effect_type: 'XP_ELIXIR',
        is_active_in_shop: true
      },
      {
        id: 'item_resonance',
        name: '✨ Poción de Resonancia Comunitaria',
        description: 'Concede un buff de +50% de XP a ti y al próximo aliado en escanear la taberna.',
        slot: 'CONSUMABLE',
        rarity: 'RARE',
        gold_cost: 30,
        sell_value: 15,
        required_level: 3,
        icon: '✨',
        effect_type: 'RESONANCE',
        is_active_in_shop: true
      },
      {
        id: 'item_cursed_blood_pact',
        name: '🩸 Brebaje de Pacto de Sangre',
        description: 'Poder prohibido: Triplica el Oro obtenido, pero una tirada <= 6 cuesta 20 XP.',
        slot: 'CONSUMABLE',
        rarity: 'MYTHIC',
        gold_cost: 45,
        sell_value: 22,
        required_level: 5,
        icon: '🩸',
        effect_type: 'CURSED_BLOOD_PACT',
        is_active_in_shop: true
      }
    ];

    for (const item of baseItems) {
      const existing = this.data.items.find((i) => i.id === item.id);
      if (!existing) {
        this.data.items.push(item);
      } else {
        Object.assign(existing, item);
      }
    }

    // Default values fallback for any custom legacy items
    this.data.items.forEach((item) => {
      if (!item.slot) item.slot = 'CONSUMABLE';
      if (!item.rarity) item.rarity = 'COMMON';
      if (!item.sell_value) item.sell_value = Math.max(1, Math.floor((item.gold_cost || 10) / 2));
      if (!item.required_level) item.required_level = 1;
      if (!item.icon) item.icon = '🎒';
    });

    // Seed DM Users
    if (!this.data.players.find((p) => p.username === 'zacrow')) {
      this.data.players.push({
        id: 'usr_zacrow_admin',
        nfc_uid: 'NFC_ZACROW_888888',
        name: 'Zacrow (Dungeon Master)',
        username: 'zacrow',
        password: 'ZacrowManda9803',
        secret_class: 'MAGE',
        role: 'DM',
        xp: 9999,
        gold: 9999,
        level: 99,
        private_token: 'dm_token_zacrow_2026',
        streak_days: 10,
        pvp_wins: 20,
        pvp_losses: 0,
        title: 'Supremo Dungeon Master',
        created_at: new Date().toISOString()
      });
    }

    if (!this.data.players.find((p) => p.id === 'usr_dm_master')) {
      this.data.players.push({
        id: 'usr_dm_master',
        nfc_uid: 'NFC_DM_00000000',
        name: 'Dungeon Master Admin',
        username: 'admin',
        password: 'admin123',
        secret_class: 'MAGE',
        role: 'DM',
        xp: 9999,
        gold: 9999,
        level: 99,
        private_token: 'dm_secret_token_777',
        created_at: new Date().toISOString()
      });
    }

    // Seed Sample Players
    const samplePlayers: PlayerRow[] = [
      {
        id: 'usr_kaelen',
        nfc_uid: '04A1B2C3D4E5',
        name: 'Kaelen el Pícaro',
        username: 'kaelen',
        password: 'rogue123',
        secret_class: 'ROGUE',
        role: 'PLAYER',
        xp: 2450,
        gold: 145,
        level: 12,
        private_token: 'token_kaelen_rogue_101',
        created_at: new Date().toISOString()
      },
      {
        id: 'usr_thorin',
        nfc_uid: '04B2C3D4E5F6',
        name: 'Thorin el Guerrero',
        username: 'thorin',
        password: 'warrior123',
        secret_class: 'WARRIOR',
        role: 'PLAYER',
        xp: 3100,
        gold: 210,
        level: 15,
        private_token: 'token_thorin_warrior_102',
        created_at: new Date().toISOString()
      },
      {
        id: 'usr_elara',
        nfc_uid: '04C3D4E5F6A7',
        name: 'Elara la Maga',
        username: 'elara',
        password: 'mage123',
        secret_class: 'MAGE',
        role: 'PLAYER',
        xp: 1890,
        gold: 95,
        level: 9,
        private_token: 'token_elara_mage_103',
        created_at: new Date().toISOString()
      },
      {
        id: 'usr_lyra',
        nfc_uid: '04D4E5F6A7B8',
        name: 'Lyra la Barda',
        username: 'lyra',
        password: 'bard123',
        secret_class: 'BARD',
        role: 'PLAYER',
        xp: 1200,
        gold: 85,
        level: 7,
        private_token: 'token_lyra_bard_104',
        created_at: new Date().toISOString()
      }
    ];

    for (const player of samplePlayers) {
      const existing = this.data.players.find((p) => p.id === player.id);
      if (!existing) {
        this.data.players.push(player);
      } else {
        existing.username = existing.username || player.username;
        existing.password = existing.password || player.password;
      }
    }

    // Ensure all players have default fields defined
    this.data.players.forEach((p) => {
      if (!p.username) p.username = p.name.toLowerCase().replace(/\s+/g, '_');
      if (!p.password) p.password = 'gremio123';
      if (p.streak_days === undefined) p.streak_days = Math.floor(Math.random() * 5);
      if (p.pvp_wins === undefined) p.pvp_wins = Math.floor(Math.random() * 8);
      if (p.pvp_losses === undefined) p.pvp_losses = Math.floor(Math.random() * 4);
      if (!p.title) {
        const titles = ['Novicio Sediento', 'Campeón de la Tormenta', 'Segadora de Almas', 'Sombra de la Barra', 'Alma de la Fiesta'];
        p.title = titles[Math.floor(Math.random() * titles.length)];
      }
    });

    // Seed Global States
    if (!this.data.global_states.find((g) => g.key === 'tavern_buff')) {
      this.data.global_states.push({
        key: 'tavern_buff',
        value: JSON.stringify({ active: false, name: 'Ninguno', xp_multiplier: 1.0, expires_at: null }),
        updated_at: new Date().toISOString()
      });
    }

    if (!this.data.global_states.find((g) => g.key === 'resonance_buff')) {
      this.data.global_states.push({
        key: 'resonance_buff',
        value: JSON.stringify({ active: false, bonus_xp_pct: 50, granted_by: null }),
        updated_at: new Date().toISOString()
      });
    }

    if (!this.data.tavern_shouts || this.data.tavern_shouts.length === 0) {
      this.data.tavern_shouts = [
        {
          id: 'shout_01',
          player_id: 'usr_dm_master',
          player_name: 'Dungeon Master',
          secret_class: 'MAGE',
          title: 'Amo del Calabozo',
          message: '¡Bienvenidos Aventureros a la Taberna! Que los dados rueden a su favor.',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'shout_02',
          player_id: 'usr_kaelen',
          player_name: 'Kaelen el Pícaro',
          secret_class: 'ROGUE',
          title: 'Sombra de la Barra',
          message: 'Cuidado con sus bolsas de oro... las sombras tienen ojos hoy.',
          created_at: new Date(Date.now() - 1800000).toISOString()
        }
      ];
    }

    if (!this.data.market_listings || this.data.market_listings.length === 0) {
      this.data.market_listings = [
        {
          id: 'mkt_01',
          seller_id: 'usr_thorin',
          seller_name: 'Thorin el Guerrero',
          item_id: 'item_pocion_vida',
          item_name: 'Poción de Vigor Legendario',
          item_description: 'Restaura vitalidad y otorga +2 en el próximo duelo.',
          item_icon: '🧪',
          gold_price: 35,
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        }
      ];
    }

    if (!this.data.clans || this.data.clans.length === 0) {
      this.data.clans = [
        {
          id: 'clan_cuervos',
          name: 'Los Cuervos Negros',
          tag: 'CRV',
          description: 'Veteranos de la Taberna y guardianes del honor arcano.',
          leader_id: 'usr_kaelen',
          treasury_gold: 520,
          level: 3,
          clan_xp: 340,
          clan_xp_next: 1000,
          emblem: '🦅',
          perks_unlocked: ['Paso Ligero (-15% Cooldown)', 'Llamada del Botín (+10% Oro)'],
          created_at: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
          id: 'clan_lobos',
          name: 'Furia Invernal',
          tag: 'LBO',
          description: 'Hermandad de gladiadores implacables del pico nevado.',
          leader_id: 'usr_thorin',
          treasury_gold: 380,
          level: 2,
          clan_xp: 180,
          clan_xp_next: 600,
          emblem: '🐺',
          perks_unlocked: ['Paso Ligero (-15% Cooldown)'],
          created_at: new Date(Date.now() - 86400000 * 3).toISOString()
        }
      ];

      this.data.clan_members = [
        {
          id: 'cm_01',
          clan_id: 'clan_cuervos',
          player_id: 'usr_kaelen',
          player_name: 'Kaelen el Pícaro',
          role: 'LEADER',
          contribution_points: 340,
          joined_at: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
          id: 'cm_02',
          clan_id: 'clan_lobos',
          player_id: 'usr_thorin',
          player_name: 'Thorin el Guerrero',
          role: 'LEADER',
          contribution_points: 210,
          joined_at: new Date(Date.now() - 86400000 * 3).toISOString()
        }
      ];
    }

    if (!this.data.territories || this.data.territories.length === 0 || !this.data.territories[0].buff_type) {
      const sixHoursAgo = new Date(Date.now() - 6 * 3600000).toISOString();
      this.data.territories = [
        {
          id: 'ter_01',
          name: '👑 El Trono de la Gran Barra',
          controlling_clan_id: 'clan_cuervos',
          controlling_clan_name: 'Los Cuervos Negros',
          controlling_clan_tag: 'CRV',
          bonus_description: '+15% de Oro en todas las tiradas y 10% de descuento en la Tienda.',
          buff_type: 'GOLD_DISCOUNT',
          buff_title: 'Soberanía Tabernera',
          defense_points: 160,
          fortification_level: 2,
          daily_gold_rate: 180,
          accumulated_gold: 45,
          last_payout_at: sixHoursAgo,
          siege_status: 'SIEGE_ACTIVE',
          siege_target_points: 1000,
          siege_progress: {
            clan_cuervos: { clan_name: 'Los Cuervos Negros', tag: 'CRV', points: 620 },
            clan_lobos: { clan_name: 'Furia Invernal', tag: 'LBO', points: 480 }
          }
        },
        {
          id: 'ter_02',
          name: '🍷 La Cripta de la Bodega Secreta',
          controlling_clan_id: 'clan_lobos',
          controlling_clan_name: 'Furia Invernal',
          controlling_clan_tag: 'LBO',
          bonus_description: '+20% de Experiencia (XP) en misiones diarias y Solo Raids.',
          buff_type: 'XP_BOOST',
          buff_title: 'Elixir Arcano',
          defense_points: 120,
          fortification_level: 1,
          daily_gold_rate: 150,
          accumulated_gold: 38,
          last_payout_at: sixHoursAgo,
          siege_status: 'SIEGE_ACTIVE',
          siege_target_points: 1000,
          siege_progress: {
            clan_lobos: { clan_name: 'Furia Invernal', tag: 'LBO', points: 550 },
            clan_cuervos: { clan_name: 'Los Cuervos Negros', tag: 'CRV', points: 310 }
          }
        },
        {
          id: 'ter_03',
          name: '⚔️ El Bastión del Patio de Armas',
          controlling_clan_id: null,
          controlling_clan_name: null,
          controlling_clan_tag: null,
          bonus_description: '+2 a las tiradas de dados en Duelos D20 y +15% de daño contra el Raid Boss.',
          buff_type: 'DUEL_DAMAGE',
          buff_title: 'Disciplinas de Guerra',
          defense_points: 100,
          fortification_level: 1,
          daily_gold_rate: 140,
          accumulated_gold: 35,
          last_payout_at: sixHoursAgo,
          siege_status: 'SIEGE_ACTIVE',
          siege_target_points: 1000,
          siege_progress: {
            clan_cuervos: { clan_name: 'Los Cuervos Negros', tag: 'CRV', points: 410 },
            clan_lobos: { clan_name: 'Furia Invernal', tag: 'LBO', points: 390 }
          }
        },
        {
          id: 'ter_04',
          name: '🕯️ El Santuario de los Arcanistas',
          controlling_clan_id: null,
          controlling_clan_name: null,
          controlling_clan_tag: null,
          bonus_description: 'Cooldowns de habilidades reducidos un 30% y coste de Forja al 50%.',
          buff_type: 'COOLDOWN_FORGE',
          buff_title: 'Poder de las Runas',
          defense_points: 90,
          fortification_level: 1,
          daily_gold_rate: 160,
          accumulated_gold: 40,
          last_payout_at: sixHoursAgo,
          siege_status: 'SIEGE_ACTIVE',
          siege_target_points: 1000,
          siege_progress: {
            clan_lobos: { clan_name: 'Furia Invernal', tag: 'LBO', points: 280 },
            clan_cuervos: { clan_name: 'Los Cuervos Negros', tag: 'CRV', points: 220 }
          }
        }
      ];
    }

    this.save();
  }

  public async get(sql: string, params: any[] = []): Promise<any> {
    const res = await this.all(sql, params);
    return res[0] || null;
  }

  public async all(sql: string, params: any[] = []): Promise<any[]> {
    const s = sql.toLowerCase();

    // SELECT * FROM players WHERE username = ? OR nfc_uid = ?
    if (s.includes('from players') && (s.includes('username =') || s.includes('where username'))) {
      const username = params[0] ? String(params[0]).trim().toLowerCase() : '';
      return this.data.players.filter(
        (p) =>
          (p.username && p.username.toLowerCase() === username) ||
          (p.name && p.name.toLowerCase() === username) ||
          (p.id && p.id.toLowerCase() === username) ||
          (p.nfc_uid && p.nfc_uid.toLowerCase() === username)
      );
    }

    // SELECT * FROM players WHERE telegram_id = ?
    if (s.includes('from players') && s.includes('telegram_id =')) {
      const tgId = String(params[0]);
      return this.data.players.filter((p) => p.telegram_id && String(p.telegram_id) === tgId);
    }

    // SELECT * FROM players WHERE nfc_uid = ?
    if (s.includes('from players') && s.includes('nfc_uid =')) {
      const nfcUid = params[0] ? String(params[0]).trim().toLowerCase() : '';
      return this.data.players.filter((p) => p.nfc_uid && p.nfc_uid.toLowerCase() === nfcUid);
    }

    // SELECT * FROM players WHERE private_token = ? OR id = ?
    if (s.includes('from players') && (s.includes('private_token =') || s.includes('id ='))) {
      const paramVal = params[0];
      return this.data.players.filter((p) => p.private_token === paramVal || p.id === paramVal);
    }

    // SELECT * FROM players WHERE id = ?
    if (s.includes('from players') && s.includes('where id =')) {
      return this.data.players.filter((p) => p.id === params[0]);
    }

    // SELECT id, nfc_uid, name... FROM players ORDER BY level DESC, xp DESC
    if (s.includes('from players') && s.includes('order by')) {
      return [...this.data.players].sort((a, b) => b.level - a.level || b.xp - a.xp);
    }

    // SELECT COUNT(DISTINCT id) as cnt FROM players WHERE id != ? AND last_scanned_at >= ...
    if (s.includes('count(distinct id)') && s.includes('from players')) {
      const excludeId = params[0];
      const count = this.data.players.filter((p) => {
        if (p.id === excludeId || !p.last_scanned_at) return false;
        const diffMs = Date.now() - new Date(p.last_scanned_at).getTime();
        return diffMs <= 12 * 60 * 60 * 1000;
      }).length;
      return [{ cnt: count }];
    }

    // Generic SELECT * FROM players fallback
    if (s.includes('from players')) {
      return [...this.data.players];
    }

    // SELECT * FROM items WHERE is_active_in_shop = TRUE
    if (s.includes('from items') && s.includes('is_active_in_shop')) {
      if (s.includes('where id =')) {
        return this.data.items.filter((i) => i.id === params[0] && i.is_active_in_shop);
      }
      return this.data.items.filter((i) => i.is_active_in_shop);
    }

    // SELECT inventory join items
    if (s.includes('from inventory i') || (s.includes('from inventory') && s.includes('join items'))) {
      const playerId = params[0];
      const invList = this.data.inventory.filter(
        (i) => i.player_id === playerId && (s.includes('consumed_at is null') ? !i.consumed_at : true)
      );

      return invList.map((inv) => {
        const item: ItemRow = this.data.items.find((it) => it.id === inv.item_id) || {
          id: inv.item_id,
          name: 'Item Desconocido',
          description: '',
          gold_cost: 0,
          sell_value: 0,
          slot: 'CONSUMABLE',
          rarity: 'COMMON',
          required_level: 1,
          icon: '🎒',
          effect_type: 'NONE',
          is_active_in_shop: false
        };
        return {
          inventory_id: inv.id,
          id: inv.id,
          player_id: inv.player_id,
          item_id: inv.item_id,
          is_equipped: inv.is_equipped,
          purchased_at: inv.purchased_at,
          consumed_at: inv.consumed_at,
          effect_type: item.effect_type,
          name: item.name,
          description: item.description,
          gold_cost: item.gold_cost,
          slot: item.slot || 'CONSUMABLE',
          rarity: item.rarity || 'COMMON',
          sell_value: item.sell_value || Math.max(1, Math.floor(item.gold_cost / 2)),
          required_level: item.required_level || 1,
          class_req: item.class_req || 'ALL',
          stat_atk: item.stat_atk || 0,
          stat_def: item.stat_def || 0,
          stat_d20_bonus: item.stat_d20_bonus || 0,
          stat_gold_pct: item.stat_gold_pct || 0,
          stat_xp_pct: item.stat_xp_pct || 0,
          stat_crit_pct: item.stat_crit_pct || 0,
          stat_raid_dmg_pct: item.stat_raid_dmg_pct || 0,
          icon: item.icon || '🎒',
          affixes: item.affixes || [],
          legendary_perk: item.legendary_perk,
          item_level: item.item_level || 1,
          refine_level: item.refine_level || 0
        };
      });
    }

    // SELECT * FROM inventory WHERE id = ? AND player_id = ?
    if (s.includes('from inventory') && s.includes('where id =')) {
      return this.data.inventory.filter((inv) => inv.id === params[0] && inv.player_id === params[1] && !inv.consumed_at);
    }

    // SELECT * FROM scan_logs
    if (s.includes('from scan_logs')) {
      if (s.includes('join players')) {
        return [...this.data.scan_logs]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 20)
          .map((log) => {
            const player = this.data.players.find((p) => p.id === log.player_id);
            return { ...log, player_name: player ? player.name : 'Desconocido' };
          });
      }

      const playerId = params[0];
      return [...this.data.scan_logs]
        .filter((l) => l.player_id === playerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    }

    // SELECT value FROM global_states WHERE key = ?
    if (s.includes('from global_states')) {
      const key = params[0];
      return this.data.global_states.filter((g) => g.key === key);
    }

    return [];
  }

  public async run(sql: string, params: any[] = []): Promise<void> {
    const s = sql.toLowerCase();

    // UPDATE players SET ... WHERE id = ?
    // UPDATE players SET ... WHERE id = ?
    if (s.includes('update players set')) {
      if (s.includes('last_scanned_at = null') && !s.includes('where id =')) {
        this.data.players.forEach((p) => {
          p.last_scanned_at = null;
        });
        this.save();
        return;
      }

      const idMatch = s.match(/where\s+id\s*=\s*\?/);
      if (idMatch) {
        const id = params[params.length - 1];
        const p = this.data.players.find((item) => item.id === id);
        if (p) {
          const setClause = s.substring(s.indexOf('set') + 3, s.indexOf('where')).trim();
          const assignments = setClause.split(',').map((col) => col.trim());
          let paramIdx = 0;
          for (const assign of assignments) {
            if (assign.includes('pvp_wins = pvp_wins + 1') || assign.includes('pvp_wins=pvp_wins+1')) {
              p.pvp_wins = (p.pvp_wins || 0) + 1;
            } else if (assign.includes('pvp_losses = pvp_losses + 1') || assign.includes('pvp_losses=pvp_losses+1')) {
              p.pvp_losses = (p.pvp_losses || 0) + 1;
            } else if (assign.includes('last_scanned_at = null') || assign.includes('last_scanned_at=null')) {
              p.last_scanned_at = null;
            } else if (assign.includes('telegram_id = null') || assign.includes('telegram_id=null')) {
              p.telegram_id = null;
            } else if (assign.includes('=')) {
              const colName = assign.split('=')[0].trim();
              const val = params[paramIdx++];
              if (colName === 'xp') p.xp = Number(val);
              else if (colName === 'gold') p.gold = Number(val);
              else if (colName === 'level') p.level = Number(val);
              else if (colName === 'streak_days') p.streak_days = Number(val);
              else if (colName === 'last_daily_claim_at') p.last_daily_claim_at = val;
              else if (colName === 'last_scanned_at') p.last_scanned_at = val;
              else if (colName === 'duel_disabled_until') p.duel_disabled_until = val;
              else if (colName === 'secret_class') p.secret_class = val;
              else if (colName === 'name') p.name = val;
              else if (colName === 'username') p.username = val;
              else if (colName === 'nfc_uid') p.nfc_uid = val;
              else if (colName === 'telegram_id') p.telegram_id = val ? String(val) : null;
              else if (colName === 'role') p.role = val;
              else if (colName === 'title') p.title = val;
              else (p as any)[colName] = val;
            }
          }
          this.save();
          return;
        }
      }
      this.save();
      return;
    }

    // DELETE FROM players
    if (s.includes('delete from players')) {
      const id = params[0];
      this.data.players = this.data.players.filter((p) => p.id !== id);
      this.save();
      return;
    }

    // DELETE FROM player_inventories
    if (s.includes('delete from player_inventories')) {
      const id = params[0];
      this.data.inventory = this.data.inventory.filter((i) => i.player_id !== id);
      this.save();
      return;
    }

    // DELETE FROM scan_logs
    if (s.includes('delete from scan_logs')) {
      const id = params[0];
      this.data.scan_logs = this.data.scan_logs.filter((l) => l.player_id !== id);
      this.save();
      return;
    }

    // INSERT INTO items
    if (s.includes('insert into items')) {
      const [id, name, description, price, type, effectValue, icon] = params;
      this.data.items.push({
        id,
        name,
        description,
        gold_cost: price,
        sell_value: Math.max(1, Math.floor((price || 10) / 2)),
        slot: 'CONSUMABLE',
        rarity: 'COMMON',
        required_level: 1,
        icon: icon || '🎒',
        effect_type: type,
        is_active_in_shop: true
      });
      this.save();
      return;
    }

    // DELETE FROM items
    if (s.includes('delete from items')) {
      const id = params[0];
      this.data.items = this.data.items.filter((i) => i.id !== id);
      this.save();
      return;
    }

    // INSERT INTO player_inventories
    if (s.includes('insert into player_inventories')) {
      const [id, playerId, itemId] = params;
      this.data.inventory.push({
        id,
        player_id: playerId,
        item_id: itemId,
        is_equipped: false,
        purchased_at: new Date().toISOString()
      });
      this.save();
      return;
    }

    // INSERT INTO players
    if (s.includes('insert into players')) {
      const colMatch = sql.match(/insert\s+into\s+players\s*\(([^)]+)\)/i);
      let newPlayer: any = {
        id: 'usr_' + Date.now(),
        nfc_uid: '04' + Math.random().toString(16).substring(2, 10).toUpperCase(),
        name: 'Aventurero',
        username: 'jugador',
        password: 'password123',
        secret_class: 'WARRIOR',
        role: 'PLAYER',
        xp: 0,
        gold: 50,
        level: 1,
        private_token: 'token_' + Date.now(),
        streak_days: 0,
        pvp_wins: 0,
        pvp_losses: 0,
        telegram_id: null,
        created_at: new Date().toISOString()
      };

      if (colMatch) {
        const cols = colMatch[1].split(',').map((c) => c.trim().toLowerCase());
        cols.forEach((col, idx) => {
          if (col === 'xp' || col === 'gold' || col === 'level' || col === 'streak_days') {
            newPlayer[col] = Number(params[idx]);
          } else {
            newPlayer[col] = params[idx];
          }
        });
      } else {
        const [id, nfcUid, name, secretClass, role, xp, gold, level, privateToken, username, password, telegramId, streakDays] = params;
        newPlayer = {
          ...newPlayer,
          id,
          nfc_uid: nfcUid,
          name,
          secret_class: secretClass,
          role: role || 'PLAYER',
          xp: Number(xp) || 0,
          gold: Number(gold) || 50,
          level: Number(level) || 1,
          private_token: privateToken,
          username: username || name.toLowerCase().replace(/\s+/g, '_'),
          password: password || 'gremio123',
          telegram_id: telegramId ? String(telegramId) : null,
          streak_days: Number(streakDays) || 0
        };
      }
      this.data.players.push(newPlayer);
      this.save();
      return;
    }

    // INSERT INTO inventory
    if (s.includes('insert into inventory')) {
      const [id, playerId, itemId] = params;
      this.data.inventory.push({
        id,
        player_id: playerId,
        item_id: itemId,
        is_equipped: false,
        purchased_at: new Date().toISOString()
      });
      this.save();
      return;
    }

    // UPDATE inventory SET ...
    if (s.includes('update inventory set')) {
      if (s.includes('consumed_at = current_timestamp')) {
        const id = params[0];
        const inv = this.data.inventory.find((i) => i.id === id);
        if (inv) {
          inv.consumed_at = new Date().toISOString();
          inv.is_equipped = false;
        }
      } else if (s.includes('is_equipped = ?')) {
        const [isEquipped, id] = params;
        const inv = this.data.inventory.find((i) => i.id === id);
        if (inv) inv.is_equipped = Boolean(isEquipped);
      }
      this.save();
      return;
    }

    // INSERT INTO scan_logs
    if (s.includes('insert into scan_logs')) {
      const [id, playerId, rawRoll, finalRoll, xpAwarded, goldAwarded, modifiersApplied] = params;
      this.data.scan_logs.push({
        id,
        player_id: playerId,
        raw_roll: rawRoll,
        final_roll: finalRoll,
        xp_awarded: xpAwarded,
        gold_awarded: goldAwarded,
        modifiers_applied: modifiersApplied,
        created_at: new Date().toISOString()
      });
      this.save();
      return;
    }

    // UPDATE global_states
    if (s.includes('update global_states set value = ? where key = ?')) {
      const [value, key] = params;
      const state = this.data.global_states.find((g) => g.key === key);
      if (state) {
        state.value = value;
        state.updated_at = new Date().toISOString();
      } else {
        this.data.global_states.push({
          key,
          value,
          updated_at: new Date().toISOString()
        });
      }
      this.save();
      return;
    }
  }

  public async exec(sql: string): Promise<void> {
    // No-op
  }
}

const db = new JsonDatabase();

export async function getDb(): Promise<JsonDatabase> {
  return db;
}
