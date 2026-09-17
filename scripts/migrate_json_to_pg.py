#!/usr/bin/env python3
"""
Migrator Script: JSON Store to PostgreSQL Seed SQL
Extracts all existing entities from rpg_gremio_store.json and generates db/seed_migrated_v4.sql.
Preserves UTF-8 characters and ensures referential integrity.
"""

import json
import os
import re

STORE_PATH = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'rpg_gremio_store.json')
OUTPUT_SQL = os.path.join(os.path.dirname(__file__), '..', 'db', 'seed_migrated_v4.sql')
CLASSES_CFG = os.path.join(os.path.dirname(__file__), '..', 'config', 'balance', 'classes.json')

def escape_sql(val):
    if val is None:
        return 'NULL'
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, bool):
        return 'TRUE' if val else 'FALSE'
    if isinstance(val, (dict, list)):
        s = json.dumps(val, ensure_ascii=False)
        return "'" + s.replace("'", "''") + "'::jsonb"
    s = str(val)
    return "'" + s.replace("'", "''") + "'"

def safe_int(val, default=0):
    try:
        return int(val)
    except (ValueError, TypeError):
        return default

def main():
    print(f"[MIGRATOR] Leyendo almacen JSON desde {STORE_PATH}...")
    with open(STORE_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    with open(CLASSES_CFG, 'r', encoding='utf-8') as f:
        classes_data = json.load(f).get('classes', {})

    sql_lines = [
        "-- ==============================================================================",
        "-- NIDO DE CUERVOS v4.0.0: Seed Migrado desde Almacen JSON Original",
        "-- ==============================================================================",
        "BEGIN;",
        ""
    ]

    # 1. USERS & CHARACTERS
    players = data.get('players', [])
    seen_usernames = set()
    user_char_map = []

    sql_lines.append("-- 1. USERS & CHARACTERS")
    for idx, p in enumerate(players):
        raw_user = p.get('username') or f"user_{p['id']}"
        raw_user = re.sub(r'[^a-zA-Z0-9_]', '_', raw_user).lower()
        if raw_user in seen_usernames:
            raw_user = f"{raw_user}_{idx}"
        seen_usernames.add(raw_user)

        user_id = f"usr_{p['id']}"
        char_id = p['id']
        char_name = p.get('name', f"Aventurero {idx+1}")
        role = 'DM' if p.get('role') == 'DM' else 'USER'
        secret_class = p.get('secret_class', 'WARRIOR')
        if secret_class not in ('WARRIOR', 'MAGE', 'ROGUE', 'BARD'):
            secret_class = 'WARRIOR'
        
        pwd = p.get('password', 'gremio123')
        pwd_hash = f"plain:{pwd}"

        sql_lines.append(f"""INSERT INTO users (id, username, password_hash, role, created_at)
VALUES ({escape_sql(user_id)}, {escape_sql(raw_user)}, {escape_sql(pwd_hash)}, {escape_sql(role)}, {escape_sql(p.get('created_at'))})
ON CONFLICT (id) DO NOTHING;""")

        lvl = safe_int(p.get('level'), 1)
        xp = safe_int(p.get('xp'), 0)
        gold = safe_int(p.get('gold'), 100)
        streak = safe_int(p.get('streak_days'), 0)
        nat20 = safe_int(p.get('nat20_streak'), 0)
        pvp_w = safe_int(p.get('pvp_wins'), 0)
        pvp_l = safe_int(p.get('pvp_losses'), 0)

        sql_lines.append(f"""INSERT INTO characters (id, user_id, name, class_id, level, xp, gold, gems, equipped_title, streak_days, nat20_streak, pvp_wins, pvp_losses, created_at)
VALUES ({escape_sql(char_id)}, {escape_sql(user_id)}, {escape_sql(char_name)}, {escape_sql(secret_class)}, {lvl}, {xp}, {gold}, 0, {escape_sql(p.get('title'))}, {streak}, {nat20}, {pvp_w}, {pvp_l}, {escape_sql(p.get('created_at'))})
ON CONFLICT (id) DO NOTHING;""")

        # Base Stats
        base_stats = classes_data.get(secret_class, {}).get('base_stats', {
            "strength": 10, "agility": 10, "intelligence": 10, "constitution": 10, "luck": 10
        })
        sql_lines.append(f"""INSERT INTO character_stats (character_id, strength, agility, intelligence, constitution, luck, stat_points_available)
VALUES ({escape_sql(char_id)}, {base_stats['strength']}, {base_stats['agility']}, {base_stats['intelligence']}, {base_stats['constitution']}, {base_stats['luck']}, {(lvl - 1) * 3})
ON CONFLICT (character_id) DO NOTHING;""")

        # Character Talents
        sql_lines.append(f"""INSERT INTO character_talents (character_id, offense_points, defense_points, utility_points, talents_unlocked)
VALUES ({escape_sql(char_id)}, 0, 0, 0, '[]'::jsonb)
ON CONFLICT (character_id) DO NOTHING;""")

    sql_lines.append("")

    # 2. ITEMS
    sql_lines.append("-- 2. ITEMS CATALOG")
    for item in data.get('items', []):
        slot = item.get('slot', 'WEAPON')
        if slot not in ('WEAPON', 'ARMOR', 'HELMET', 'BOOTS', 'RING', 'AMULET', 'SHIELD', 'CONSUMABLE'):
            slot = 'CONSUMABLE'
        rarity = item.get('rarity', 'COMMON')
        if rarity not in ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'ANCIENT', 'DIVINE', 'CELESTIAL', 'ETERNAL', 'PRIMORDIAL'):
            rarity = 'COMMON'
        sql_lines.append(f"""INSERT INTO items (id, name, description, slot, rarity, gold_cost, sell_value, required_level, class_req, stat_atk, stat_def, stat_d20_bonus, icon, is_active_in_shop)
VALUES ({escape_sql(item['id'])}, {escape_sql(item.get('name'))}, {escape_sql(item.get('description'))}, {escape_sql(slot)}, {escape_sql(rarity)}, {item.get('gold_cost', 0)}, {item.get('sell_value', 0)}, {item.get('required_level', 1)}, {escape_sql(item.get('class_req', 'ALL'))}, {item.get('stat_atk', 0)}, {item.get('stat_def', 0)}, {item.get('stat_d20_bonus', 0)}, {escape_sql(item.get('icon', '📦'))}, {escape_sql(item.get('is_active_in_shop', True))})
ON CONFLICT (id) DO NOTHING;""")

    sql_lines.append("")

    # 3. TITLES
    sql_lines.append("-- 3. TITLES")
    for t in data.get('titles', []):
        sql_lines.append(f"""INSERT INTO titles (id, name, description, category, req_type, req_value, icon, perk_description, stat_bonus_type, stat_bonus_value)
VALUES ({escape_sql(t['id'])}, {escape_sql(t.get('name'))}, {escape_sql(t.get('description'))}, {escape_sql(t.get('category'))}, {escape_sql(t.get('req_type'))}, {escape_sql(str(t.get('req_value')))}, {escape_sql(t.get('icon'))}, {escape_sql(t.get('perk_description'))}, {escape_sql(t.get('stat_bonus_type'))}, {t.get('stat_bonus_value', 0)})
ON CONFLICT (id) DO NOTHING;""")

    sql_lines.append("")

    # 4. ACHIEVEMENTS
    sql_lines.append("-- 4. ACHIEVEMENTS")
    for a in data.get('achievements', []):
        sql_lines.append(f"""INSERT INTO achievements (id, title, description, category, req_type, req_target, reward_xp, reward_gold, unlocked_title_id)
VALUES ({escape_sql(a['id'])}, {escape_sql(a.get('title'))}, {escape_sql(a.get('description'))}, {escape_sql(a.get('category'))}, {escape_sql(a.get('req_type'))}, {a.get('req_target', 1)}, {a.get('reward_xp', 50)}, {a.get('reward_gold', 25)}, {escape_sql(a.get('unlocked_title_id'))})
ON CONFLICT (id) DO NOTHING;""")

    sql_lines.append("")

    # 5. CLANS & MEMBERS
    sql_lines.append("-- 5. CLANS & CLAN MEMBERS")
    for c in data.get('clans', []):
        sql_lines.append(f"""INSERT INTO clans (id, name, tag, description, leader_id, treasury_gold, level, clan_xp, clan_xp_next, emblem, perks_unlocked, created_at)
VALUES ({escape_sql(c['id'])}, {escape_sql(c.get('name'))}, {escape_sql(c.get('tag'))}, {escape_sql(c.get('description'))}, {escape_sql(c.get('leader_id'))}, {c.get('treasury_gold', 0)}, {c.get('level', 1)}, {c.get('clan_xp', 0)}, {c.get('clan_xp_next', 1000)}, {escape_sql(c.get('emblem'))}, {escape_sql(c.get('perks_unlocked', []))}, {escape_sql(c.get('created_at'))})
ON CONFLICT (id) DO NOTHING;""")

    for cm in data.get('clan_members', []):
        role = cm.get('role', 'MEMBER')
        if role not in ('LEADER', 'OFFICER', 'VETERAN', 'MEMBER'):
            role = 'MEMBER'
        sql_lines.append(f"""INSERT INTO clan_members (id, clan_id, character_id, role, contribution_points, joined_at)
VALUES ({escape_sql(cm['id'])}, {escape_sql(cm.get('clan_id'))}, {escape_sql(cm.get('player_id'))}, {escape_sql(role)}, {cm.get('contribution_points', 0)}, {escape_sql(cm.get('joined_at'))})
ON CONFLICT (character_id) DO NOTHING;""")

    sql_lines.append("")

    # 6. TERRITORIES
    sql_lines.append("-- 6. TERRITORIES")
    for terr in data.get('territories', []):
        sql_lines.append(f"""INSERT INTO territories (id, name, controlling_clan_id, controlling_clan_name, controlling_clan_tag, defense_points, max_defense, income_gold_per_hour, income_fragments_per_hour)
VALUES ({escape_sql(terr['id'])}, {escape_sql(terr.get('name'))}, {escape_sql(terr.get('controlling_clan_id'))}, {escape_sql(terr.get('controlling_clan_name'))}, {escape_sql(terr.get('controlling_clan_tag'))}, {terr.get('defense_points', 1000)}, {terr.get('max_defense', 1000)}, {terr.get('income_gold_per_hour', 50)}, {terr.get('income_fragments_per_hour', 1)})
ON CONFLICT (id) DO NOTHING;""")

    sql_lines.append("")

    # 7. DAILY QUESTS
    sql_lines.append("-- 7. DAILY QUESTS")
    for q in data.get('daily_quests', []):
        sql_lines.append(f"""INSERT INTO daily_quests (id, title, description, reward_xp, reward_gold, quest_type, target_value)
VALUES ({escape_sql(q['id'])}, {escape_sql(q.get('title'))}, {escape_sql(q.get('description'))}, {q.get('reward_xp', 100)}, {q.get('reward_gold', 50)}, {escape_sql(q.get('quest_type'))}, {q.get('target_value', 1)})
ON CONFLICT (id) DO NOTHING;""")

    sql_lines.append("")

    # 8. TAVERN POSTS & MARKET LISTINGS
    sql_lines.append("-- 8. TAVERN POSTS & MARKET LISTINGS")
    for post in data.get('tavern_shouts', []):
        sql_lines.append(f"""INSERT INTO tavern_posts (id, character_id, character_name, secret_class, title, message, created_at)
VALUES ({escape_sql(post['id'])}, {escape_sql(post.get('player_id'))}, {escape_sql(post.get('player_name'))}, {escape_sql(post.get('secret_class'))}, {escape_sql(post.get('title'))}, {escape_sql(post.get('message'))}, {escape_sql(post.get('created_at'))})
ON CONFLICT (id) DO NOTHING;""")

    for m in data.get('market_listings', []):
        sql_lines.append(f"""INSERT INTO market_listings (id, seller_id, seller_name, item_id, item_name, item_description, item_icon, gold_price, status, created_at)
VALUES ({escape_sql(m['id'])}, {escape_sql(m.get('seller_id'))}, {escape_sql(m.get('seller_name'))}, {escape_sql(m.get('item_id'))}, {escape_sql(m.get('item_name'))}, {escape_sql(m.get('item_description'))}, {escape_sql(m.get('item_icon'))}, {m.get('gold_price', 100)}, {escape_sql(m.get('status', 'ACTIVE'))}, {escape_sql(m.get('created_at'))})
ON CONFLICT (id) DO NOTHING;""")

    # 9. RAID BOSS
    rb = data.get('raid_boss', {})
    if rb:
        sql_lines.append(f"""INSERT INTO raid_boss_state (id, name, title, current_hp, max_hp, element, level, reward_gold, reward_xp, is_defeated, total_attacks, top_contributors)
VALUES ({escape_sql(rb.get('id', 'boss_ignis'))}, {escape_sql(rb.get('name', '🐉 Ignis'))}, {escape_sql(rb.get('title'))}, {rb.get('current_hp', 5000)}, {rb.get('max_hp', 5000)}, {escape_sql(rb.get('element', 'FUEGO'))}, {rb.get('level', 30)}, {rb.get('reward_gold', 300)}, {rb.get('reward_xp', 500)}, {escape_sql(rb.get('is_defeated', False))}, {rb.get('total_attacks', 0)}, {escape_sql(rb.get('top_contributors', []))})
ON CONFLICT (id) DO NOTHING;""")

    sql_lines.append("")
    sql_lines.append("COMMIT;")

    os.makedirs(os.path.dirname(OUTPUT_SQL), exist_ok=True)
    with open(OUTPUT_SQL, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"[MIGRATOR] Migracion SQL generada exitosamente en {OUTPUT_SQL} ({len(sql_lines)} lineas de SQL).")

if __name__ == '__main__':
    main()
