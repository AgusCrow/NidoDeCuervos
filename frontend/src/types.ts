export interface Player {
  id: string;
  name: string;
  username?: string;
  secretClass?: 'ROGUE' | 'MAGE' | 'WARRIOR' | 'BARD' | string;
  secret_class?: string;
  role: 'PLAYER' | 'DM' | string;
  xp: number;
  gold: number;
  level: number;
  nfcUid?: string;
  nfc_uid?: string;
  privateToken?: string;
  streak_days?: number;
  last_daily_claim_at?: string;
  pvp_wins?: number;
  pvp_losses?: number;
  title?: string;
  equipped_title?: string;
  duel_disabled_until?: string;
  last_scanned_at?: string;
  created_at?: string;
}

export type ItemSlot = 'WEAPON' | 'ARMOR' | 'RING' | 'AMULET' | 'CONSUMABLE';
export type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC' | 'ANCIENT' | 'DIVINE' | 'CELESTIAL' | 'ETERNAL' | 'PRIMORDIAL';

export interface LegendaryPerk {
  id: string;
  name: string;
  description: string;
  effect_code: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  slot?: ItemSlot;
  rarity?: ItemRarity;
  price?: number;
  gold_cost?: number;
  original_cost?: number;
  sell_value?: number;
  required_level?: number;
  class_req?: string;
  stat_atk?: number;
  stat_def?: number;
  stat_d20_bonus?: number;
  stat_gold_pct?: number;
  stat_xp_pct?: number;
  stat_crit_pct?: number;
  stat_raid_dmg_pct?: number;
  type?: string;
  effect_type?: string;
  effectValue?: number;
  effect_value?: number;
  icon?: string;
  is_active_in_shop?: boolean;
  affixes?: string[];
  legendary_perk?: LegendaryPerk;
  item_level?: number;
  refine_level?: number;
  base_code?: string;
  elemental_theme?: string;
}

export interface InventoryItem {
  inventory_id: string;
  item_id: string;
  name: string;
  description: string;
  slot?: ItemSlot;
  rarity?: ItemRarity;
  gold_cost: number;
  sell_value?: number;
  required_level?: number;
  class_req?: string;
  stat_atk?: number;
  stat_def?: number;
  stat_d20_bonus?: number;
  stat_gold_pct?: number;
  stat_xp_pct?: number;
  stat_crit_pct?: number;
  stat_raid_dmg_pct?: number;
  icon?: string;
  effect_type: string;
  is_equipped: boolean;
  purchased_at: string;
  consumed_at?: string | null;
  affixes?: string[];
  legendary_perk?: LegendaryPerk;
  item_level?: number;
  refine_level?: number;
}

export interface ScanLog {
  id: string;
  player_id: string;
  raw_roll: number;
  final_roll: number;
  xp_awarded: number;
  gold_awarded: number;
  modifiers_applied: string; // JSON
  created_at: string;
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

export interface ScanResultEvent {
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
  weather?: {
    temp: number;
    precipitation: number;
    isNight: boolean;
    condition: 'RAIN' | 'NIGHT' | 'EXTREME_TEMP' | 'CLEAR';
    description: string;
  };
  duelResult?: DuelResult;
}
