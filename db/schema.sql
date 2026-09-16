-- Database Schema for El Gremio de la Taberna (PostgreSQL & SQLite compatible)

-- Players & Roles
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    nfc_uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    secret_class TEXT NOT NULL CHECK (secret_class IN ('ROGUE', 'MAGE', 'WARRIOR', 'BARD')),
    role TEXT NOT NULL DEFAULT 'PLAYER' CHECK (role IN ('PLAYER', 'DM')),
    xp INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    private_token TEXT UNIQUE NOT NULL,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Items Catalog
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    gold_cost INTEGER NOT NULL,
    effect_type TEXT NOT NULL CHECK (effect_type IN ('ANTI_FUMBLE', 'FORTUNE_DICE', 'XP_ELIXIR', 'RESONANCE')),
    is_active_in_shop BOOLEAN NOT NULL DEFAULT TRUE
);

-- Player Inventory & Equipped Items
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES items(id),
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    consumed_at TIMESTAMP WITH TIME ZONE
);

-- Scan Logs & Audit Trail
CREATE TABLE IF NOT EXISTS scan_logs (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id),
    raw_roll INTEGER NOT NULL,
    final_roll INTEGER NOT NULL,
    xp_awarded INTEGER NOT NULL,
    gold_awarded INTEGER NOT NULL,
    modifiers_applied TEXT NOT NULL, -- JSON formatted string
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Global System States & Telemetry / Buffs
CREATE TABLE IF NOT EXISTS global_states (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL, -- JSON formatted string
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_token ON players(private_token);
CREATE INDEX IF NOT EXISTS idx_players_nfc ON players(nfc_uid);
CREATE INDEX IF NOT EXISTS idx_scan_logs_player ON scan_logs(player_id, created_at DESC);
