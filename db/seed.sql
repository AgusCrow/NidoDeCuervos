-- Initial Seed Data for El Gremio de la Taberna

-- Base Shop Items
INSERT INTO items (id, name, description, gold_cost, effect_type, is_active_in_shop) VALUES
('item_anti_fumble', 'Escudo contra Pifias', 'Transforma una pifia (R = 1) en un roll de 10.', 25, 'ANTI_FUMBLE', TRUE),
('item_fortune_dice', 'Dado de la Fortuna', 'Tira 2d20 y selecciona el valor más alto en el próximo scan.', 40, 'FORTUNE_DICE', TRUE),
('item_xp_elixir', 'Elixir de Erudición', 'Convierte todo el Oro obtenido en el doble de XP adicional.', 35, 'XP_ELIXIR', TRUE),
('item_resonance', 'Poción de Resonancia', 'Concede +50% de XP al próximo jugador en escanear la taberna.', 30, 'RESONANCE', TRUE)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
description = EXCLUDED.description,
gold_cost = EXCLUDED.gold_cost,
effect_type = EXCLUDED.effect_type;

-- DM Admin Users
INSERT INTO players (id, nfc_uid, name, username, password, secret_class, role, xp, gold, level, private_token, title) VALUES
('usr_zacrow_admin', 'NFC_ZACROW_888888', 'Zacrow (Dungeon Master)', 'zacrow', 'ZacrowManda9803', 'MAGE', 'DM', 9999, 9999, 99, 'dm_token_zacrow_2026', 'Supremo Dungeon Master'),
('usr_dm_master', 'NFC_DM_00000000', 'Dungeon Master Admin', 'admin', 'admin123', 'MAGE', 'DM', 9999, 9999, 99, 'dm_secret_token_777', 'Alma de la Fiesta')
ON CONFLICT (id) DO NOTHING;

-- Starter Players
INSERT INTO players (id, nfc_uid, name, secret_class, role, xp, gold, level, private_token) VALUES
('usr_kaelen', '04A1B2C3D4E5', 'Kaelen el Pícaro', 'ROGUE', 'PLAYER', 2450, 145, 12, 'token_kaelen_rogue_101'),
('usr_thorin', '04B2C3D4E5F6', 'Thorin el Guerrero', 'WARRIOR', 'PLAYER', 3100, 210, 15, 'token_thorin_warrior_102'),
('usr_elara', '04C3D4E5F6A7', 'Elara la Maga', 'MAGE', 'PLAYER', 1890, 95, 9, 'token_elara_mage_103'),
('usr_lyra', '04D4E5F6A7B8', 'Lyra la Barda', 'BARD', 'PLAYER', 1200, 85, 7, 'token_lyra_bard_104')
ON CONFLICT (id) DO NOTHING;

-- Global Buff Default State
INSERT INTO global_states (key, value) VALUES
('tavern_buff', '{"active": false, "name": "Ninguno", "xp_multiplier": 1.0, "expires_at": null}'),
('resonance_buff', '{"active": false, "bonus_xp_pct": 50, "granted_by": null}')
ON CONFLICT (key) DO NOTHING;
