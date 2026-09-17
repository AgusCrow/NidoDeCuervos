-- ==============================================================================
-- NIDO DE CUERVOS v4.0.0: Seed Migrado desde Almacen JSON Original
-- ==============================================================================
BEGIN;

-- 1. USERS & CHARACTERS
INSERT INTO users (id, username, password_hash, role, created_at)
VALUES ('usr_usr_dm_master', 'dungeon_master_admin', 'plain:gremio123', 'DM', '2026-08-27T13:22:10.810Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO characters (id, user_id, name, class_id, level, xp, gold, gems, equipped_title, streak_days, nat20_streak, pvp_wins, pvp_losses, created_at)
VALUES ('usr_dm_master', 'usr_usr_dm_master', 'Dungeon Master Admin', 'MAGE', 99, 9999, 9999, 0, 'Novicio Sediento', 0, 0, 0, 0, '2026-08-27T13:22:10.810Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO character_stats (character_id, strength, agility, intelligence, constitution, luck, stat_points_available)
VALUES ('usr_dm_master', 5, 7, 15, 8, 10, 294)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO character_talents (character_id, offense_points, defense_points, utility_points, talents_unlocked)
VALUES ('usr_dm_master', 0, 0, 0, '[]'::jsonb)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO users (id, username, password_hash, role, created_at)
VALUES ('usr_usr_kaelen', 'kaelen', 'plain:rogue123', 'USER', '2026-08-27T13:22:10.811Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO characters (id, user_id, name, class_id, level, xp, gold, gems, equipped_title, streak_days, nat20_streak, pvp_wins, pvp_losses, created_at)
VALUES ('usr_kaelen', 'usr_usr_kaelen', 'Kaelen el Pícaro', 'ROGUE', 10, 2473, 17, 0, 'Segadora de Almas', 3, 0, 6, 3, '2026-08-27T13:22:10.811Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO character_stats (character_id, strength, agility, intelligence, constitution, luck, stat_points_available)
VALUES ('usr_kaelen', 7, 15, 8, 7, 12, 27)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO character_talents (character_id, offense_points, defense_points, utility_points, talents_unlocked)
VALUES ('usr_kaelen', 0, 0, 0, '[]'::jsonb)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO users (id, username, password_hash, role, created_at)
VALUES ('usr_usr_thorin', 'thorin', 'plain:warrior123', 'USER', '2026-08-27T13:22:10.811Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO characters (id, user_id, name, class_id, level, xp, gold, gems, equipped_title, streak_days, nat20_streak, pvp_wins, pvp_losses, created_at)
VALUES ('usr_thorin', 'usr_usr_thorin', 'Thorin el Guerrero', 'WARRIOR', 15, 3100, 210, 0, 'Campeón de la Tormenta', 3, 0, 6, 1, '2026-08-27T13:22:10.811Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO character_stats (character_id, strength, agility, intelligence, constitution, luck, stat_points_available)
VALUES ('usr_thorin', 14, 8, 6, 12, 5, 42)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO character_talents (character_id, offense_points, defense_points, utility_points, talents_unlocked)
VALUES ('usr_thorin', 0, 0, 0, '[]'::jsonb)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO users (id, username, password_hash, role, created_at)
VALUES ('usr_usr_elara', 'elara', 'plain:mage123', 'USER', '2026-08-27T13:22:10.811Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO characters (id, user_id, name, class_id, level, xp, gold, gems, equipped_title, streak_days, nat20_streak, pvp_wins, pvp_losses, created_at)
VALUES ('usr_elara', 'usr_usr_elara', 'Elara la Maga', 'MAGE', 9, 1890, 95, 0, 'Segadora de Almas', 0, 0, 3, 0, '2026-08-27T13:22:10.811Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO character_stats (character_id, strength, agility, intelligence, constitution, luck, stat_points_available)
VALUES ('usr_elara', 5, 7, 15, 8, 10, 24)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO character_talents (character_id, offense_points, defense_points, utility_points, talents_unlocked)
VALUES ('usr_elara', 0, 0, 0, '[]'::jsonb)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO users (id, username, password_hash, role, created_at)
VALUES ('usr_usr_lyra', 'lyra', 'plain:bard123', 'USER', '2026-08-27T13:22:10.811Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO characters (id, user_id, name, class_id, level, xp, gold, gems, equipped_title, streak_days, nat20_streak, pvp_wins, pvp_losses, created_at)
VALUES ('usr_lyra', 'usr_usr_lyra', 'Lyra la Barda', 'BARD', 7, 1200, 85, 0, 'Sombra de la Barra', 3, 0, 6, 3, '2026-08-27T13:22:10.811Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO character_stats (character_id, strength, agility, intelligence, constitution, luck, stat_points_available)
VALUES ('usr_lyra', 10, 8, 10, 11, 8, 18)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO character_talents (character_id, offense_points, defense_points, utility_points, talents_unlocked)
VALUES ('usr_lyra', 0, 0, 0, '[]'::jsonb)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO users (id, username, password_hash, role, created_at)
VALUES ('usr_usr_zacrow_admin', 'zacrow', 'plain:ZacrowManda9803', 'DM', '2026-09-04T22:16:46.725Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO characters (id, user_id, name, class_id, level, xp, gold, gems, equipped_title, streak_days, nat20_streak, pvp_wins, pvp_losses, created_at)
VALUES ('usr_zacrow_admin', 'usr_usr_zacrow_admin', 'Zacrow (Dungeon Master)', 'MAGE', 99, 9999, 9999, 0, 'Supremo Dungeon Master', 10, 0, 20, 0, '2026-09-04T22:16:46.725Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO character_stats (character_id, strength, agility, intelligence, constitution, luck, stat_points_available)
VALUES ('usr_zacrow_admin', 5, 7, 15, 8, 10, 294)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO character_talents (character_id, offense_points, defense_points, utility_points, talents_unlocked)
VALUES ('usr_zacrow_admin', 0, 0, 0, '[]'::jsonb)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO users (id, username, password_hash, role, created_at)
VALUES ('usr_usr_a0e3c186', 'valquiria_de_las_sombras', 'plain:gremio123', 'USER', '2026-09-04T22:16:46.860Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO characters (id, user_id, name, class_id, level, xp, gold, gems, equipped_title, streak_days, nat20_streak, pvp_wins, pvp_losses, created_at)
VALUES ('usr_a0e3c186', 'usr_usr_a0e3c186', 'Valquiria de las Sombras', 'ROGUE', 9998881, 0, 100, 0, 'Novicio Sediento', 1, 0, 1, 1, '2026-09-04T22:16:46.860Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO character_stats (character_id, strength, agility, intelligence, constitution, luck, stat_points_available)
VALUES ('usr_a0e3c186', 7, 15, 8, 7, 12, 29996640)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO character_talents (character_id, offense_points, defense_points, utility_points, talents_unlocked)
VALUES ('usr_a0e3c186', 0, 0, 0, '[]'::jsonb)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO users (id, username, password_hash, role, created_at)
VALUES ('usr_usr_e3be0928', 'valkyrie_hero', 'plain:passValkyrie99', 'USER', '2026-09-04T22:19:28.503Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO characters (id, user_id, name, class_id, level, xp, gold, gems, equipped_title, streak_days, nat20_streak, pvp_wins, pvp_losses, created_at)
VALUES ('usr_e3be0928', 'usr_usr_e3be0928', 'Valquiria de las Sombras (Heroica)', 'ROGUE', 1, 15, 55, 0, 'Alma de la Fiesta', 1, 0, 0, 0, '2026-09-04T22:19:28.503Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO character_stats (character_id, strength, agility, intelligence, constitution, luck, stat_points_available)
VALUES ('usr_e3be0928', 7, 15, 8, 7, 12, 0)
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO character_talents (character_id, offense_points, defense_points, utility_points, talents_unlocked)
VALUES ('usr_e3be0928', 0, 0, 0, '[]'::jsonb)
ON CONFLICT (character_id) DO NOTHING;

-- 2. ITEMS CATALOG
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('item_anti_fumble', '🛡️ Escudo contra Pifias', 'Transforma una pifia fatal (d20 = 1) en una tirada segura de 10.', 'CONSUMABLE', 'COMMON', 25, 12, 1, 'ALL', 0, 0, 0, '🛡️', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('item_fortune_dice', '🎲 Dado de la Fortuna Doble', 'Tira 2d20 y selecciona automáticamente el valor más alto en el próximo escaneo.', 'CONSUMABLE', 'UNCOMMON', 40, 20, 2, 'ALL', 0, 0, 0, '🎲', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('item_xp_elixir', '🧪 Elixir de Erudición Suprema', 'Duplica el Oro y la Experiencia ganados en el próximo evento de la taberna.', 'CONSUMABLE', 'RARE', 35, 17, 3, 'ALL', 0, 0, 0, '🧪', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('item_resonance', '✨ Poción de Resonancia Comunitaria', 'Concede un buff de +50% de XP a ti y al próximo aliado en escanear la taberna.', 'CONSUMABLE', 'RARE', 30, 15, 3, 'ALL', 0, 0, 0, '✨', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('item_cursed_blood_pact', '🩸 Brebaje de Pacto de Sangre', 'Poder prohibido: Triplica el Oro obtenido, pero una tirada <= 6 cuesta 20 XP.', 'CONSUMABLE', 'MYTHIC', 45, 22, 5, 'ALL', 0, 0, 0, '🩸', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('item_cursed_necromancer_dice', '💀 Dado del Nigromante', 'Tirada de 13 a 19 se considera Nat 20 (25 XP/25 Gold). Maldición: Si saca par menor a 10, otorga 0 XP y 0 Oro.', 'CONSUMABLE', 'COMMON', 20, 10, 1, 'ALL', 0, 0, 0, '🎒', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('item_cursed_misfortune_candle', '🕯️ Candelabro de la Desdicha', 'Otorga +50 XP fijos. Maldición: El próximo aliado en escanear recibe -30% en su botín.', 'CONSUMABLE', 'COMMON', 10, 5, 1, 'ALL', 0, 0, 0, '🎒', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('wpn_espada_acero', '🗡️ Espada Larga de Acero Forjado', 'Forjada en los fuegos de la taberna. Otorga +5 de Daño en duelos y asaltos.', 'WEAPON', 'COMMON', 30, 15, 1, 'ALL', 5, 0, 0, '🗡️', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('wpn_baculo_arcano', '🔮 Báculo de Destello Arcano', 'Canaliza corrientes mágicas. +8 Daño, +1 a tiradas D20 y +5% de probabilidad crítica.', 'WEAPON', 'UNCOMMON', 55, 27, 3, 'MAGE', 8, 0, 1, '🔮', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('wpn_dagas_sombras', '🗡️ Dagas Gemelas de Asesino', 'Empapadas en veneno de cripta. +12 Daño, +12% Crítico y +10% de Oro obtenido.', 'WEAPON', 'RARE', 90, 45, 6, 'ROGUE', 12, 0, 0, '🗡️', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('wpn_mandoble_titanes', '⚔️ Mandoble del Rompedor de Muros', 'Espada colosal que quiebra escudos. +18 Daño y +2 permanente a tiradas D20.', 'WEAPON', 'EPIC', 140, 70, 10, 'WARRIOR', 18, 0, 2, '⚔️', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('wpn_guadana_vacio', '💀 Guadaña Devoradora de Sombras', 'Reliquia legendaria forjada en el Vacío. +25 Daño, +2 a tiradas, +15% Crítico y +15% XP.', 'WEAPON', 'LEGENDARY', 240, 120, 14, 'ALL', 25, 0, 2, '💀', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('arm_cuero_reforzado', '🛡️ Jubón de Cuero Reforzado', 'Ligera y flexible para cualquier travesía. Otorga +4 de Defensa pasiva.', 'ARMOR', 'COMMON', 25, 12, 1, 'ALL', 0, 4, 0, '🛡️', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('arm_cota_elfica', '🛡️ Cota de Mallas de Acero Élfico', 'Mallas tejidas a mano por orfebres estelares. +8 Defensa y +1 a tiradas D20.', 'ARMOR', 'UNCOMMON', 50, 25, 4, 'ALL', 0, 8, 1, '🛡️', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('arm_tunica_astral', '✨ Túnica Astral del Archicanciller', 'Imbuida con polvo de cometa. +10 Defensa y +15% de Experiencia en todas las acciones.', 'ARMOR', 'RARE', 85, 42, 7, 'MAGE', 0, 10, 0, '✨', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('arm_placas_dragon', '🐉 Coraza de Escamas de Dragón Negro', 'Pechera impenetrable reforzada con escamas de Ignis. +18 Defensa y +5 Ataque.', 'ARMOR', 'EPIC', 150, 75, 11, 'WARRIOR', 5, 18, 0, '🐉', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('arm_manto_inmortal', '👑 Manto del Bastión Eterno', 'Armadura legendaria de los Reyes del Gremio. +24 Defensa, +2 a tiradas y +15% Oro.', 'ARMOR', 'LEGENDARY', 260, 130, 15, 'ALL', 0, 24, 2, '👑', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('rng_cobre_taberna', '💍 Sortija de Cobre del Aprendiz', 'Sencillo pero brillante. Concede +5% de Oro en todas las actividades.', 'RING', 'COMMON', 20, 10, 1, 'ALL', 0, 0, 0, '💍', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('rng_mercader_avaro', '🪙 Sello del Mercader Codicioso', 'Tallado con runas de prosperidad mercantil. +15% de Oro en taberna y misiones.', 'RING', 'UNCOMMON', 45, 22, 3, 'ALL', 0, 0, 0, '🪙', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('rng_ojo_esmeralda', '💚 Anillo del Ojo de la Fortuna', 'Engarzado con una esmeralda viva. +20% de Oro y +8% de probabilidad crítica.', 'RING', 'RARE', 80, 40, 6, 'ALL', 0, 0, 0, '💚', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('rng_escarcha_glacial', '❄️ Sortija de Furia Glacial', 'Forjada en hielo perenne. +8 Ataque, +6 Defensa y +15% de Oro.', 'RING', 'EPIC', 130, 65, 10, 'ALL', 8, 6, 0, '❄️', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('rng_soberania_aurica', '💍 Anillo de Soberanía Áurica', 'Toque de Midas legendario. +35% de Oro en todas las fuentes y +1 a tiradas D20.', 'RING', 'LEGENDARY', 220, 110, 13, 'ALL', 0, 0, 1, '💍', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('amu_talisman_novicio', '📿 Talismán de Cuentas de Madera', 'Bendecido por el tabernero. Concede +5% de Experiencia ganada.', 'AMULET', 'COMMON', 20, 10, 1, 'ALL', 0, 0, 0, '📿', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('amu_ojo_tormenta', '⚡ Medalla de la Tormenta Eléctrica', 'Vibra con energía pura. +12% de XP y +6% de probabilidad de Nat 20.', 'AMULET', 'UNCOMMON', 50, 25, 4, 'ALL', 0, 0, 0, '⚡', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('amu_perla_sabiduria', '🔮 Colgante de Sabiduría Ancestral', 'Contiene memorias de los antiguos héroes. +22% de XP y +1 a tiradas D20.', 'AMULET', 'RARE', 85, 42, 7, 'ALL', 0, 0, 1, '🔮', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('amu_corazon_fenix', '🔥 Medallón del Fénix Sagrado', 'Arde con una llama inmortal. +28% de XP, +1 a tiradas D20 y +10% Crítico.', 'AMULET', 'EPIC', 145, 72, 11, 'ALL', 0, 0, 1, '🔥', True)
ON CONFLICT (id) DO NOTHING;
INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ('amu_ojo_ignis', '👁️ Ojo Carmesí del Dragón Ignis', 'Arrancado del Dragón de Obsidiana. +35% XP, +10 Ataque y +2 permanente a tiradas D20.', 'AMULET', 'LEGENDARY', 250, 125, 15, 'ALL', 10, 0, 2, '👁️', True)
ON CONFLICT (id) DO NOTHING;

-- 3. TITLES
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_01', '🎲 Favorito de la Fortuna', 'Obtener 3 Nat 20 seguidos en la taberna.', 'LUCK', 'NAT20_STREAK', '3', '🎲', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_02', '🥉 Novato de la Taberna', 'Iniciar la travesía en la taberna (Nivel 1+).', 'LEVEL', 'LEVEL', '1', '🥉', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_03', '🥈 Aventurero Consagrado', 'Alcanzar el Nivel 5.', 'LEVEL', 'LEVEL', '5', '🥈', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_04', '🥇 Héroe de la Taberna', 'Alcanzar el Nivel 10.', 'LEVEL', 'LEVEL', '10', '🥇', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_05', '👑 Leyenda Viviente', 'Alcanzar el Nivel 25.', 'LEVEL', 'LEVEL', '25', '👑', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_06', '🔱 Titán del Gremio', 'Alcanzar el Nivel 50.', 'LEVEL', 'LEVEL', '50', '🔱', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_07', '🛡️ Escudo Inquebrantable', 'Alcanzar Nivel 10 como Guerrero.', 'CLASS', 'CLASS_LEVEL_WARRIOR', '10', '🛡️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_08', '🧙‍♂️ Archimago Arcano', 'Alcanzar Nivel 10 como Mago.', 'CLASS', 'CLASS_LEVEL_MAGE', '10', '🧙‍♂️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_09', '🗡️ Sombra Nocturna', 'Alcanzar Nivel 10 como Pícaro.', 'CLASS', 'CLASS_LEVEL_ROGUE', '10', '🗡️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_10', '🎭 Maestro Minstrel', 'Alcanzar Nivel 10 como Bardo.', 'CLASS', 'CLASS_LEVEL_BARD', '10', '🎭', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_11', '⚔️ Iniciado en la Arena', 'Ganar tu primer Duelo PvP.', 'PVP', 'PVP_WINS', '1', '⚔️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_12', '🩸 Sediento de Sangre', 'Ganar 5 Duelos PvP.', 'PVP', 'PVP_WINS', '5', '🩸', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_13', '🏆 El Invicto', 'Ganar 10 Duelos PvP.', 'PVP', 'PVP_WINS', '10', '🏆', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_14', '👑 Señor de la Arena', 'Ganar 25 Duelos PvP.', 'PVP', 'PVP_WINS', '25', '👑', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_15', '💀 Gladiador Implacable', 'Ganar 50 Duelos PvP.', 'PVP', 'PVP_WINS', '50', '💀', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_16', '💰 Monedero Lleno', 'Acumular 100 de Oro.', 'GOLD', 'GOLD', '100', '💰', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_17', '🏦 Tesorero de la Taberna', 'Acumular 500 de Oro.', 'GOLD', 'GOLD', '500', '🏦', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_18', '🪙 Magnate del Gremio', 'Acumular 1,000 de Oro.', 'GOLD', 'GOLD', '1000', '🪙', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_19', '💎 Rey Midas', 'Acumular 5,000 de Oro.', 'GOLD', 'GOLD', '5000', '💎', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_20', '🎰 Millonario de la Casa', 'Acumular 10,000 de Oro.', 'GOLD', 'GOLD', '10000', '🎰', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_21', '🎲 Toque de Suerte', 'Sacar al menos 1 Nat 20.', 'LUCK', 'NAT20_COUNT', '1', '🎲', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_22', '⚡ Doble Destello', 'Sacar 2 Nat 20 seguidos.', 'LUCK', 'NAT20_STREAK', '2', '⚡', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_23', '🕯️ Portador de la Maldición', 'Usar el Candelabro de la Desdicha.', 'ITEMS', 'ITEM_USED_CANDLE', '1', '🕯️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_24', '🩸 Pacto Oscuro', 'Activar el Pacto de Sangre.', 'ITEMS', 'ITEM_USED_BLOOD_PACT', '1', '🩸', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_25', '💀 Resucitado por Nigromante', 'Usar el Dado del Nigromante.', 'ITEMS', 'ITEM_USED_NECRO_DICE', '1', '💀', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_26', '🛡️ Pifia Inmune', 'Bloquear pifia 1 con el Escudo contra Pifias.', 'ITEMS', 'ANTI_FUMBLE_USED', '1', '🛡️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_27', '🏅 Frecuentador de la Casa', 'Realizar 5 escaneos NFC.', 'SCANS', 'SCANS', '5', '🏅', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_28', '🚀 Parroquiano Fiel', 'Realizar 15 escaneos NFC.', 'SCANS', 'SCANS', '15', '🚀', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_29', '🏠 Guardián de la Taberna', 'Realizar 30 escaneos NFC.', 'SCANS', 'SCANS', '30', '🏠', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_30', '🌟 El Residente', 'Realizar 60 escaneos NFC.', 'SCANS', 'SCANS', '60', '🌟', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_31', '🔥 Racha Encendida', 'Racha de 3 días consecutivos.', 'STREAK', 'STREAK', '3', '🔥', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_32', '⚡ Racha Imparable', 'Racha de 7 días consecutivos.', 'STREAK', 'STREAK', '7', '⚡', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_33', '🌌 Leyenda de la Racha', 'Racha de 30 días consecutivos.', 'STREAK', 'STREAK', '30', '🌌', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_34', '🛍️ Comprador Compulsivo', 'Comprar 5 ítems en la tienda.', 'SHOP', 'SHOP_PURCHASES', '5', '🛍️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_35', '🎒 Coleccionista de Artefactos', 'Comprar 15 ítems en la tienda.', 'SHOP', 'SHOP_PURCHASES', '15', '🎒', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_36', '📜 Cazador de Misiones', 'Completar 5 misiones diarias.', 'QUESTS', 'QUESTS_COMPLETED', '5', '📜', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_37', '🎖️ Héroe de las Misiones', 'Completar 20 misiones diarias.', 'QUESTS', 'QUESTS_COMPLETED', '20', '🎖️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_38', '🔮 Sabio del Gremio', 'Realizar 10 acciones registradas.', 'SPECIAL', 'ACTIONS', '10', '🔮', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_39', '⚡ Golpe Relámpago', 'Ganar un Duelo PvP en la 1ª ronda.', 'PVP', 'FAST_DUEL_WIN', '1', '⚡', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_40', '🛡️ Muro de Piedra', 'Ganar un Duelo PvP 2-0 sin perder rondas.', 'PVP', 'CLEAN_DUEL_WIN', '1', '🛡️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_41', '🎲 Dados Calientes', 'Tirada promedio de escaneo superior a 15.', 'LUCK', 'HIGH_AVG_ROLL', '15', '🎲', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_42', '🗡️ Asesino Furtivo', 'Realizar un K.O. Instantáneo con Pícaro.', 'CLASS', 'ROGUE_KO', '1', '🗡️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_43', '🧙‍♂️ Sobrecarga Arcana', 'Ganar un Duelo usando la pasiva Arcana de Mago.', 'CLASS', 'MAGE_BUFF_WIN', '1', '🧙‍♂️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_44', '🎭 Canto de Victoria', 'Ganar un Duelo como Bardo con comisión extra.', 'CLASS', 'BARD_BONUS_WIN', '1', '🎭', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_45', '☕ Madrugador', 'Escanear en la taberna entre las 6 AM y 9 AM.', 'SPECIAL', 'EARLY_SCAN', '1', '☕', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_46', '🌙 Noctámbulo de la Taberna', 'Escanear en la taberna después de las 11 PM.', 'SPECIAL', 'LATE_SCAN', '1', '🌙', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_47', '👑 Favorito del DM', 'Recibir una recompensa directa del Dungeon Master.', 'SPECIAL', 'DM_REWARD', '1', '👑', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_48', '🍻 Borracho Alegre', 'Realizar escaneos en 3 fines de semana.', 'SPECIAL', 'WEEKEND_SCANS', '3', '🍻', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_49', '🗡️ Cazador de Sombras', 'Derrotar a un Pícaro en Duelo PvP.', 'PVP', 'BEAT_ROGUE', '1', '🗡️', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ('title_50', '🌌 Leyenda del Gremio', 'Desbloquear 20 Títulos del Gremio.', 'SPECIAL', 'TITLES_UNLOCKED', '20', '🌌', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- 4. ACHIEVEMENTS

-- 5. CLANS & CLAN MEMBERS
INSERT INTO clans (id, name, tag, description, leader_id, treasury_gold, level, clan_xp, clan_xp_next, emblem, perks_unlocked, created_at)
VALUES ('clan_cuervos', 'Los Cuervos Negros', 'CRV', 'Veteranos de la Taberna y guardianes del honor arcano.', 'usr_kaelen', 520, 3, 340, 1000, '🦅', '["Paso Ligero (-15% Cooldown)", "Llamada del Botín (+10% Oro)"]'::jsonb, '2026-09-03T23:27:45.595Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO clans (id, name, tag, description, leader_id, treasury_gold, level, clan_xp, clan_xp_next, emblem, perks_unlocked, created_at)
VALUES ('clan_lobos', 'Furia Invernal', 'LBO', 'Hermandad de gladiadores implacables del pico nevado.', 'usr_thorin', 380, 2, 180, 600, '🐺', '["Paso Ligero (-15% Cooldown)"]'::jsonb, '2026-09-05T23:27:45.595Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO clan_members (id, clan_id, character_id, role, contribution_points, joined_at)
VALUES ('cm_01', 'clan_cuervos', 'usr_kaelen', 'LEADER', 340, '2026-09-03T23:27:45.595Z')
ON CONFLICT (character_id) DO NOTHING;
INSERT INTO clan_members (id, clan_id, character_id, role, contribution_points, joined_at)
VALUES ('cm_02', 'clan_lobos', 'usr_thorin', 'LEADER', 210, '2026-09-05T23:27:45.595Z')
ON CONFLICT (character_id) DO NOTHING;

-- 6. TERRITORIES
INSERT INTO territories (id, name, controlling_clan_id, controlling_clan_name, controlling_clan_tag, defense_points, max_defense, income_gold_per_hour, income_fragments_per_hour)
VALUES ('ter_01', '👑 El Trono de la Gran Barra', 'clan_cuervos', 'Los Cuervos Negros', 'CRV', 160, 1000, 50, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO territories (id, name, controlling_clan_id, controlling_clan_name, controlling_clan_tag, defense_points, max_defense, income_gold_per_hour, income_fragments_per_hour)
VALUES ('ter_02', '🍷 La Cripta de la Bodega Secreta', 'clan_lobos', 'Furia Invernal', 'LBO', 120, 1000, 50, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO territories (id, name, controlling_clan_id, controlling_clan_name, controlling_clan_tag, defense_points, max_defense, income_gold_per_hour, income_fragments_per_hour)
VALUES ('ter_03', '⚔️ El Bastión del Patio de Armas', NULL, NULL, NULL, 100, 1000, 50, 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO territories (id, name, controlling_clan_id, controlling_clan_name, controlling_clan_tag, defense_points, max_defense, income_gold_per_hour, income_fragments_per_hour)
VALUES ('ter_04', '🕯️ El Santuario de los Arcanistas', NULL, NULL, NULL, 90, 1000, 50, 1)
ON CONFLICT (id) DO NOTHING;

-- 7. DAILY QUESTS
INSERT INTO daily_quests (id, title, description, reward_xp, reward_gold, quest_type, target_value)
VALUES ('quest_01', '⚔️ Desafío de la Arena', 'Completar o participar en 1 Duelo PvP en la taberna.', 25, 15, 'PVP_DUEL', 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO daily_quests (id, title, description, reward_xp, reward_gold, quest_type, target_value)
VALUES ('quest_02', '🎲 Prueba de la Suerte', 'Obtener una tirada final de d20 >= 12 en tu próximo escaneo.', 30, 20, 'SCAN_ROLL', 12)
ON CONFLICT (id) DO NOTHING;
INSERT INTO daily_quests (id, title, description, reward_xp, reward_gold, quest_type, target_value)
VALUES ('quest_03', '🏠 Visita a la Casa', 'Escanear tu tarjeta o celular NFC en la taberna presencial.', 20, 10, 'NFC_SCAN', 1)
ON CONFLICT (id) DO NOTHING;
INSERT INTO daily_quests (id, title, description, reward_xp, reward_gold, quest_type, target_value)
VALUES ('quest_04', '🛍️ Apoyo al Mercader', 'Comprar cualquier ítem o brebaje en la tienda.', 15, 25, 'BUY_ITEM', 1)
ON CONFLICT (id) DO NOTHING;

-- 8. TAVERN POSTS & MARKET LISTINGS
INSERT INTO tavern_posts (id, character_id, character_name, secret_class, title, message, created_at)
VALUES ('shout_01', 'usr_dm_master', 'Dungeon Master', 'MAGE', 'Amo del Calabozo', '¡Bienvenidos Aventureros a la Taberna! Que los dados rueden a su favor.', '2026-09-08T22:27:45.595Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tavern_posts (id, character_id, character_name, secret_class, title, message, created_at)
VALUES ('shout_02', 'usr_kaelen', 'Kaelen el Pícaro', 'ROGUE', 'Sombra de la Barra', 'Cuidado con sus bolsas de oro... las sombras tienen ojos hoy.', '2026-09-08T22:57:45.595Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO market_listings (id, seller_id, seller_name, item_id, item_name, item_description, item_icon, gold_price, status, created_at)
VALUES ('mkt_01', 'usr_thorin', 'Thorin el Guerrero', 'item_pocion_vida', 'Poción de Vigor Legendario', 'Restaura vitalidad y otorga +2 en el próximo duelo.', '🧪', 35, 'ACTIVE', '2026-09-08T23:27:45.595Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO raid_boss_state (id, name, title, current_hp, max_hp, element, level, reward_gold, reward_xp, is_defeated, total_attacks, top_contributors)
VALUES ('boss_01', '🐉 Ignis el Dragón de Obsidiana', 'Azote del Pico Nevado', 5000, 5000, 'FUEGO', 30, 300, 500, False, 0, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

COMMIT;