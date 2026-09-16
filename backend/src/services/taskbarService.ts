import { getDb, PlayerRow, ItemRow } from '../db';
import { generateProceduralItem } from './itemGenerator';

export interface TaskbarBiomeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  minLevel: number;
  bgGradient: string;
  badgeBg: string;
  monsters: {
    name: string;
    icon: string;
    maxHp: number;
    atk: number;
    rewardGold: number;
    rewardXp: number;
    isBoss?: boolean;
  }[];
}

export interface TaskbarProgressState {
  player_id: string;
  biome_id: string;
  wave_depth: number;
  current_monster_index: number;
  monster_current_hp: number;
  monster_max_hp: number;
  monster_name: string;
  monster_icon: string;
  is_boss?: boolean;
  total_monsters_slain: number;
  accumulated_gold: number;
  accumulated_xp: number;
  accumulated_items: ItemRow[];
  last_tick_at: string;
  combo_streak: number;
}

export const TASKBAR_BIOMES: TaskbarBiomeDef[] = [
  {
    id: 'BOSQUE_RUNICO',
    name: 'Bosque de los Glifos Rúnicos',
    description: 'Frondosos bosques encantados donde las sombras de los árboles ocultan duendes y bestias arcanas.',
    icon: '🌲',
    minLevel: 1,
    bgGradient: 'from-emerald-950/70 via-surface-card to-black',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    monsters: [
      { name: 'Slime de Maná', icon: '🧪', maxHp: 45, atk: 5, rewardGold: 8, rewardXp: 15 },
      { name: 'Goblin Cazador', icon: '👺', maxHp: 70, atk: 9, rewardGold: 14, rewardXp: 25 },
      { name: 'Lobo de Sombras', icon: '🐺', maxHp: 95, atk: 12, rewardGold: 22, rewardXp: 35 },
      { name: 'Ent Corrupto (Jefe)', icon: '🪵', maxHp: 240, atk: 25, rewardGold: 70, rewardXp: 110, isBoss: true }
    ]
  },
  {
    id: 'MAZMORRA_CUERVO',
    name: 'Criptas de la Senda Sombría',
    description: 'Galerías subterráneas y osarios infinitos custodiados por no-muertos y caballeros malditos.',
    icon: '💀',
    minLevel: 5,
    bgGradient: 'from-purple-950/70 via-surface-card to-black',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    monsters: [
      { name: 'Esqueleto Legionario', icon: '💀', maxHp: 120, atk: 15, rewardGold: 25, rewardXp: 45 },
      { name: 'Gárgola Rúnica', icon: '🗿', maxHp: 175, atk: 20, rewardGold: 38, rewardXp: 65 },
      { name: 'Nigromante del Ocaso', icon: '🧙‍♂️', maxHp: 230, atk: 28, rewardGold: 55, rewardXp: 90 },
      { name: 'Lich del Viento Oscuro (Jefe)', icon: '👑', maxHp: 480, atk: 45, rewardGold: 150, rewardXp: 240, isBoss: true }
    ]
  },
  {
    id: 'CAVERNA_ESPECTRAL',
    name: 'Cavernas de Cristal Profundo',
    description: 'Túneles luminiscentes habitados por gólems de cuarzo y monstruosidades del abismo.',
    icon: '💎',
    minLevel: 10,
    bgGradient: 'from-cyan-950/70 via-surface-card to-black',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    monsters: [
      { name: 'Gólem de Amatista', icon: '💎', maxHp: 260, atk: 30, rewardGold: 60, rewardXp: 100 },
      { name: 'Araña de Prisma', icon: '🕷️', maxHp: 310, atk: 38, rewardGold: 75, rewardXp: 120 },
      { name: 'Mantícora de Obsidiana', icon: '🦁', maxHp: 410, atk: 48, rewardGold: 100, rewardXp: 160 },
      { name: 'Beholder del Prisma (Jefe)', icon: '👁️', maxHp: 800, atk: 65, rewardGold: 260, rewardXp: 400, isBoss: true }
    ]
  },
  {
    id: 'PICO_VOLCANICO',
    name: 'Caldera del Coloso Primordial',
    description: 'Tierras de ceniza y ríos de magma custodiados por wyverns y dragones antiguos.',
    icon: '🌋',
    minLevel: 15,
    bgGradient: 'from-rose-950/70 via-surface-card to-black',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    monsters: [
      { name: 'Elemental de Magma', icon: '🔥', maxHp: 480, atk: 55, rewardGold: 120, rewardXp: 200 },
      { name: 'Drake de Sulfuro', icon: '🐉', maxHp: 620, atk: 70, rewardGold: 160, rewardXp: 260 },
      { name: 'Fénix Cenizo', icon: '🦅', maxHp: 760, atk: 85, rewardGold: 220, rewardXp: 340 },
      { name: 'Wyrm del Cataclismo (Jefe)', icon: '🐲', maxHp: 1450, atk: 120, rewardGold: 550, rewardXp: 850, isBoss: true }
    ]
  },
  {
    id: 'SENDERO_ASTRAL',
    name: 'Vacío y Bastión Astral',
    description: 'El umbral del cosmos donde la realidad se distorsiona ante entidades cósmicas ancestrales.',
    icon: '🌌',
    minLevel: 20,
    bgGradient: 'from-indigo-950/70 via-surface-card to-black',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    monsters: [
      { name: 'Espectro Dimensional', icon: '👻', maxHp: 750, atk: 90, rewardGold: 200, rewardXp: 380 },
      { name: 'Devorador de Estrellas', icon: '🪐', maxHp: 950, atk: 110, rewardGold: 280, rewardXp: 480 },
      { name: 'Centinela Cósmico', icon: '⚔️', maxHp: 1200, atk: 135, rewardGold: 360, rewardXp: 600 },
      { name: 'Heraldo del Infinito (Jefe)', icon: '🪐', maxHp: 2200, atk: 180, rewardGold: 800, rewardXp: 1300, isBoss: true }
    ]
  }
];

export async function getOrCreateTaskbarProgress(playerId: string): Promise<TaskbarProgressState> {
  const db = await getDb();
  if (!db.data.taskbar_progress) {
    db.data.taskbar_progress = [];
  }

  let progress = db.data.taskbar_progress.find((p: any) => p.player_id === playerId);
  const defaultBiome = TASKBAR_BIOMES[0];
  const defaultMonster = defaultBiome.monsters[0];

  if (!progress) {
    progress = {
      player_id: playerId,
      biome_id: defaultBiome.id,
      wave_depth: 1,
      current_monster_index: 0,
      monster_name: defaultMonster.name,
      monster_icon: defaultMonster.icon,
      monster_current_hp: defaultMonster.maxHp,
      monster_max_hp: defaultMonster.maxHp,
      is_boss: false,
      total_monsters_slain: 0,
      accumulated_gold: 0,
      accumulated_xp: 0,
      accumulated_items: [],
      last_tick_at: new Date().toISOString(),
      combo_streak: 0
    };
    db.data.taskbar_progress.push(progress);
    await db.save();
  } else {
    // Migración transparente de campos para soportar escalado infinito
    if (!progress.wave_depth) progress.wave_depth = Math.max(1, progress.total_monsters_slain || 1);
    if (!progress.monster_name) progress.monster_name = defaultMonster.name;
    if (!progress.monster_icon) progress.monster_icon = defaultMonster.icon;
    if (!progress.monster_max_hp || progress.monster_max_hp <= 0) progress.monster_max_hp = defaultMonster.maxHp;
    if (progress.monster_current_hp === undefined) progress.monster_current_hp = progress.monster_max_hp;
  }

  return progress;
}

export async function processTaskbarTick(player: PlayerRow): Promise<{
  progress: TaskbarProgressState;
  combatLog: { text: string; isCrit: boolean; damage: number; defeatedMonster?: string; rewardGold?: number; rewardXp?: number };
}> {
  const db = await getDb();
  const progress = await getOrCreateTaskbarProgress(player.id);
  const biome = TASKBAR_BIOMES.find((b) => b.id === progress.biome_id) || TASKBAR_BIOMES[0];

  // Escalado procedural por profundidad de oleadas (wave_depth)
  const depth = progress.wave_depth || 1;
  const depthScale = 1 + (depth - 1) * 0.08;

  // Cálculo del poder de ataque del héroe basado en nivel y stats reales
  const baseAtk = 15 + ((player.level || 1) * 5);
  const isCrit = Math.random() < 0.25; // 25% crit
  const multiplier = isCrit ? 1.85 : 1.0;
  const rollBonus = Math.floor(Math.random() * 8) + 1;
  const damage = Math.max(10, Math.round((baseAtk + rollBonus) * multiplier));

  progress.monster_current_hp = Math.max(0, progress.monster_current_hp - damage);
  progress.last_tick_at = new Date().toISOString();

  let defeatedMonster: string | undefined;
  let rewardGold: number | undefined;
  let rewardXp: number | undefined;

  if (progress.monster_current_hp <= 0) {
    defeatedMonster = progress.monster_name;
    const isCurrentBoss = !!progress.is_boss;

    const baseRewardGold = Math.round((12 + depth * 3) * (isCurrentBoss ? 3.5 : 1.0));
    const baseRewardXp = Math.round((20 + depth * 5) * (isCurrentBoss ? 3.5 : 1.0));

    rewardGold = baseRewardGold;
    rewardXp = baseRewardXp;

    progress.total_monsters_slain += 1;
    progress.wave_depth = depth + 1;
    progress.accumulated_gold += rewardGold;
    progress.accumulated_xp += rewardXp;
    progress.combo_streak = (progress.combo_streak || 0) + 1;

    // Drop procedural garantizado en jefes (cada 10) y 35% en enemigos estándar
    const dropChance = isCurrentBoss ? 0.95 : 0.35;
    if (Math.random() < dropChance && progress.accumulated_items.length < 12) {
      const droppedItem = generateProceduralItem({
        playerLevel: Math.max(player.level || 1, Math.floor(depth / 2)),
        rarity: isCurrentBoss ? (Math.random() < 0.4 ? 'MYTHIC' : 'LEGENDARY') : (Math.random() < 0.25 ? 'EPIC' : 'RARE'),
        source: isCurrentBoss ? 'BOSS_DROP' : 'CHEST'
      });
      progress.accumulated_items.push(droppedItem);
    }

    // Generar el siguiente monstruo proceduralmente
    const nextDepth = progress.wave_depth;
    const nextIsBoss = nextDepth % 10 === 0;
    const monsterCatalog = biome.monsters;
    const randomTemplate = monsterCatalog[Math.floor(Math.random() * monsterCatalog.length)];

    let nextName = randomTemplate.name;
    let nextIcon = randomTemplate.icon;
    let nextMaxHp = Math.round(randomTemplate.maxHp * depthScale);

    if (nextIsBoss) {
      const bossPrefixes = ['Colosal', 'Devastador', 'Ancestral', 'Corrupto', 'Sanguinario'];
      const prefix = bossPrefixes[Math.floor(Math.random() * bossPrefixes.length)];
      nextName = `👑 ${prefix} ${randomTemplate.name.replace(' (Jefe)', '')} [Jefe Nvl ${nextDepth}]`;
      nextIcon = '👑';
      nextMaxHp = Math.round(nextMaxHp * 2.8);
    }

    progress.monster_name = nextName;
    progress.monster_icon = nextIcon;
    progress.monster_max_hp = nextMaxHp;
    progress.monster_current_hp = nextMaxHp;
    progress.is_boss = nextIsBoss;
  }

  await db.save();

  const combatLog = {
    text: defeatedMonster
      ? `💥 ¡Asestaste ${damage} ATK (${isCrit ? 'CRÍTICO 🔥' : 'Normal'}) y derrotaste a ${defeatedMonster}! +${rewardGold}🪙 +${rewardXp}XP`
      : `⚔️ Asestaste ${damage} ATK (${isCrit ? 'CRÍTICO 🔥' : 'Normal'}) a ${progress.monster_name}.`,
    isCrit,
    damage,
    defeatedMonster,
    rewardGold,
    rewardXp
  };

  return { progress, combatLog };
}
