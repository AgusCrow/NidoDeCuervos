-- ==============================================================================
-- NIDO DE CUERVOS v4.0.0: PostgreSQL Relational Database Schema
-- Compatible with PostgreSQL 14, 15, 16
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ACCOUNTS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'DM', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CHARACTERS
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT UNIQUE NOT NULL,
    class_id TEXT NOT NULL CHECK (class_id IN ('WARRIOR', 'MAGE', 'ROGUE', 'BARD')),
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 100,
    gems INTEGER NOT NULL DEFAULT 0,
    equipped_title TEXT,
    streak_days INTEGER NOT NULL DEFAULT 0,
    nat20_streak INTEGER NOT NULL DEFAULT 0,
    last_daily_claim_at TIMESTAMP WITH TIME ZONE,
    pvp_wins INTEGER NOT NULL DEFAULT 0,
    pvp_losses INTEGER NOT NULL DEFAULT 0,
    guild_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CHARACTER STATS
CREATE TABLE IF NOT EXISTS character_stats (
    character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    strength INTEGER NOT NULL DEFAULT 10,
    agility INTEGER NOT NULL DEFAULT 10,
    intelligence INTEGER NOT NULL DEFAULT 10,
    constitution INTEGER NOT NULL DEFAULT 10,
    luck INTEGER NOT NULL DEFAULT 10,
    stat_points_available INTEGER NOT NULL DEFAULT 0
);

-- 4. CHARACTER TALENTS
CREATE TABLE IF NOT EXISTS character_talents (
    character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    offense_points INTEGER NOT NULL DEFAULT 0,
    defense_points INTEGER NOT NULL DEFAULT 0,
    utility_points INTEGER NOT NULL DEFAULT 0,
    talents_unlocked JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 5. ITEMS CATALOG
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slot TEXT NOT NULL CHECK (slot IN ('WEAPON', 'ARMOR', 'HELMET', 'BOOTS', 'RING', 'AMULET', 'SHIELD', 'CONSUMABLE')),
    rarity TEXT NOT NULL CHECK (rarity IN ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'ANCIENT', 'DIVINE', 'CELESTIAL', 'ETERNAL', 'PRIMORDIAL')),
    gold_cost INTEGER NOT NULL DEFAULT 0,
    sell_value INTEGER NOT NULL DEFAULT 0,
    required_level INTEGER NOT NULL DEFAULT 1,
    class_req TEXT NOT NULL DEFAULT 'ALL',
    stat_atk INTEGER NOT NULL DEFAULT 0,
    stat_def INTEGER NOT NULL DEFAULT 0,
    stat_d20_bonus INTEGER NOT NULL DEFAULT 0,
    stat_crit_pct INTEGER NOT NULL DEFAULT 0,
    stat_gold_pct INTEGER NOT NULL DEFAULT 0,
    stat_xp_pct INTEGER NOT NULL DEFAULT 0,
    icon TEXT,
    effect_type TEXT,
    is_active_in_shop BOOLEAN NOT NULL DEFAULT TRUE
);

-- 6. INVENTORY & EQUIPPED GEAR
CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES items(id),
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    refine_level INTEGER NOT NULL DEFAULT 0,
    stats_bonus JSONB NOT NULL DEFAULT '{}'::jsonb,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. UPGRADE MATERIALS (Fixed Raid Drops)
CREATE TABLE IF NOT EXISTS character_materials (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    material_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, material_id)
);

-- 8. CLANS
CREATE TABLE IF NOT EXISTS clans (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT UNIQUE NOT NULL,
    tag TEXT UNIQUE NOT NULL,
    description TEXT,
    leader_id TEXT,
    treasury_gold INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    clan_xp INTEGER NOT NULL DEFAULT 0,
    clan_xp_next INTEGER NOT NULL DEFAULT 1000,
    emblem TEXT,
    perks_unlocked JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CLAN MEMBERS
CREATE TABLE IF NOT EXISTS clan_members (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    clan_id TEXT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('LEADER', 'OFFICER', 'VETERAN', 'MEMBER')),
    contribution_points INTEGER NOT NULL DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id)
);

-- 10. TERRITORIES & SIEGES
CREATE TABLE IF NOT EXISTS territories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    controlling_clan_id TEXT REFERENCES clans(id) ON DELETE SET NULL,
    controlling_clan_name TEXT,
    controlling_clan_tag TEXT,
    defense_points INTEGER NOT NULL DEFAULT 1000,
    max_defense INTEGER NOT NULL DEFAULT 1000,
    income_gold_per_hour INTEGER NOT NULL DEFAULT 50,
    income_fragments_per_hour INTEGER NOT NULL DEFAULT 1,
    last_payout TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS territory_siege_contributions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    territory_id TEXT NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
    clan_id TEXT NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. FACTIONS (Tug of War)
CREATE TABLE IF NOT EXISTS faction_standings (
    character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
    faction TEXT NOT NULL CHECK (faction IN ('FACTION_A', 'FACTION_B')),
    contribution_points INTEGER NOT NULL DEFAULT 0,
    rank_tier TEXT NOT NULL DEFAULT 'Recluta',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. RAID BOSS STATE (3-minute window, 4-hour rotation)
CREATE TABLE IF NOT EXISTS raid_boss_state (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    element TEXT,
    level INTEGER,
    reward_gold INTEGER,
    reward_xp INTEGER,
    is_defeated BOOLEAN NOT NULL DEFAULT FALSE,
    rotation_starts_at TIMESTAMP WITH TIME ZONE,
    rotation_ends_at TIMESTAMP WITH TIME ZONE,
    total_attacks INTEGER NOT NULL DEFAULT 0,
    top_contributors JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 13. MARKET LISTINGS (P2P)
CREATE TABLE IF NOT EXISTS market_listings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    seller_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    seller_name TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_description TEXT,
    item_icon TEXT,
    gold_price INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SOLD', 'CANCELLED')),
    buyer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. TAVERN POSTS (Community Wall)
CREATE TABLE IF NOT EXISTS tavern_posts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    character_name TEXT NOT NULL,
    secret_class TEXT,
    title TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. TITLES & ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS titles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    req_type TEXT,
    req_value TEXT,
    icon TEXT,
    perk_description TEXT,
    stat_bonus_type TEXT,
    stat_bonus_value INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS character_titles (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    title_id TEXT NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, title_id)
);

CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    req_type TEXT,
    req_target INTEGER,
    reward_xp INTEGER,
    reward_gold INTEGER,
    unlocked_title_id TEXT
);

CREATE TABLE IF NOT EXISTS character_achievements (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    current_progress INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(character_id, achievement_id)
);

-- 16. DAILY & WEEKLY QUESTS
CREATE TABLE IF NOT EXISTS daily_quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    reward_xp INTEGER,
    reward_gold INTEGER,
    quest_type TEXT,
    target_value INTEGER
);

CREATE TABLE IF NOT EXISTS character_quests (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    quest_id TEXT NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0,
    target_value INTEGER NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(character_id, quest_id, assigned_date)
);

-- 17. PETS
CREATE TABLE IF NOT EXISTS character_pets (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    pet_type TEXT NOT NULL,
    name TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    bonus_type TEXT,
    bonus_value INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    feed_count INTEGER NOT NULL DEFAULT 0
);

-- 18. DM GAME BALANCE OVERRIDES
CREATE TABLE IF NOT EXISTS game_balance_overrides (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_characters_user ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_character ON inventory_items(character_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_market_status ON market_listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tavern_posts_created ON tavern_posts(created_at DESC);

-- 19. NESTJS TYPEORM UNIFIED TABLES
CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(64) PRIMARY KEY,
    nfc_uid VARCHAR(64) UNIQUE,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    secret_class VARCHAR(32) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'PLAYER',
    stat_str INT NOT NULL DEFAULT 10,
    stat_dex INT NOT NULL DEFAULT 10,
    stat_int INT NOT NULL DEFAULT 10,
    stat_con INT NOT NULL DEFAULT 10,
    avatar_url VARCHAR(255),
    xp BIGINT NOT NULL DEFAULT 0,
    gold BIGINT NOT NULL DEFAULT 50,
    level INT NOT NULL DEFAULT 1,
    private_token VARCHAR(128) UNIQUE NOT NULL,
    streak_days INT NOT NULL DEFAULT 0,
    last_daily_claim_at TIMESTAMPTZ,
    pvp_wins INT NOT NULL DEFAULT 0,
    pvp_losses INT NOT NULL DEFAULT 0,
    equipped_title VARCHAR(128),
    telegram_id VARCHAR(64),
    duel_disabled_until TIMESTAMPTZ,
    last_scanned_at TIMESTAMPTZ,
    gens_faction VARCHAR(32),
    gens_contribution_points BIGINT NOT NULL DEFAULT 0,
    gens_rank VARCHAR(64) NOT NULL DEFAULT 'Recluta',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(64) PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    item_id VARCHAR(64) NOT NULL,
    is_equipped BOOLEAN NOT NULL DEFAULT false,
    slot_equipped VARCHAR(32),
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS player_talents (
    id VARCHAR(64) PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    node_id VARCHAR(64) NOT NULL,
    points_invested INT NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tavern_shouts (
    id VARCHAR(64) PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    secret_class VARCHAR(32) NOT NULL,
    title VARCHAR(128),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transmute_logs (
    id VARCHAR(64) PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    consumed_item_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    result_item_id VARCHAR(64) NOT NULL,
    result_rarity VARCHAR(32) NOT NULL,
    was_critical_double_jump BOOLEAN NOT NULL DEFAULT false,
    gold_spent BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dm_balance_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    dm_user_id VARCHAR(64) NOT NULL,
    section_modified VARCHAR(64) NOT NULL,
    previous_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    new_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raid_boss (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    title VARCHAR(128) NOT NULL,
    current_hp BIGINT NOT NULL,
    max_hp BIGINT NOT NULL,
    tier VARCHAR(32) NOT NULL DEFAULT 'MYTHIC',
    phase INT NOT NULL DEFAULT 1,
    element VARCHAR(32) NOT NULL DEFAULT 'FIRE',
    is_active BOOLEAN NOT NULL DEFAULT true,
    milestones_achieved JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS raid_contributions (
    id VARCHAR(64) PRIMARY KEY,
    raid_id VARCHAR(64) NOT NULL,
    player_id VARCHAR(64) NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    damage_dealt BIGINT NOT NULL DEFAULT 0,
    last_attack_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journey_progress (
    player_id VARCHAR(64) PRIMARY KEY,
    biome_id VARCHAR(64) NOT NULL DEFAULT 'bosque_sombras',
    wave_depth INT NOT NULL DEFAULT 1,
    current_monster_index INT NOT NULL DEFAULT 0,
    monster_current_hp INT NOT NULL DEFAULT 100,
    monster_max_hp INT NOT NULL DEFAULT 100,
    monster_name VARCHAR(100) NOT NULL DEFAULT 'Lobo Sombrío',
    monster_icon VARCHAR(32) NOT NULL DEFAULT '🐺',
    total_monsters_slain INT NOT NULL DEFAULT 0,
    accumulated_gold BIGINT NOT NULL DEFAULT 0,
    accumulated_xp BIGINT NOT NULL DEFAULT 0,
    accumulated_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_tick_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

