import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Flame, 
  Coins, 
  Sparkles, 
  Skull, 
  Swords, 
  Trophy, 
  ShieldAlert, 
  ChevronRight,
  RefreshCw,
  Gift,
  Heart,
  Crown
} from 'lucide-react';
import { api } from '../services/api';
import { sfx } from '../services/sfx';

interface FloatingNumber {
  id: number;
  text: string;
  isCrit: boolean;
  x: number;
  y: number;
}

interface Props {
  playerClass: string;
  playerName: string;
  playerLevel: number;
  onRefreshPlayer: () => Promise<void> | void;
  onShowToast?: (type: 'EQUIP' | 'UNEQUIP' | 'CONSUME' | 'SELL' | 'ERROR' | 'INFO', title: string, desc?: string, icon?: string) => void;
}

export const CatacombsAutoBattler: React.FC<Props> = ({
  playerClass,
  playerName,
  playerLevel,
  onRefreshPlayer,
  onShowToast
}) => {
  const [taskbarState, setTaskbarState] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAttackingHero, setIsAttackingHero] = useState<boolean>(false);
  const [isHitMonster, setIsHitMonster] = useState<boolean>(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [claiming, setClaiming] = useState<boolean>(false);

  // Cooldown de habilidad especial (segundos restantes)
  const [abilityCooldown, setAbilityCooldown] = useState<number>(0);
  const [abilityActive, setAbilityActive] = useState<boolean>(false);

  // Contador de toques rápidos manuales para acelerar ataques
  const [tapStreak, setTapStreak] = useState<number>(0);

  const laneRef = useRef<HTMLDivElement>(null);
  const normClass = (playerClass || 'WARRIOR').toUpperCase();

  const getClassAbility = () => {
    switch (normClass) {
      case 'MAGE':
        return {
          name: 'Cometa Arcano',
          icon: '🔮',
          desc: 'Explosión arcana que inflige 350% de daño mágico.',
          cooldownSec: 12,
          dmgMultiplier: 3.5
        };
      case 'ROGUE':
        return {
          name: 'Asalto Sombrío',
          icon: '🗡️',
          desc: 'Golpe crítico letal garantizado e impulso de velocidad.',
          cooldownSec: 10,
          dmgMultiplier: 3.0
        };
      case 'BARD':
        return {
          name: 'Fanfarria de Guerra',
          icon: '🎺',
          desc: 'Cántico marcial que inflige daño rítmico y duplica el oro.',
          cooldownSec: 14,
          dmgMultiplier: 2.2
        };
      case 'WARRIOR':
      default:
        return {
          name: 'Torbellino de Acero',
          icon: '💥',
          desc: 'Giro devastador de hierro con 300% de daño de impacto.',
          cooldownSec: 12,
          dmgMultiplier: 3.0
        };
    }
  };

  const ability = getClassAbility();

  const heroIcon = {
    MAGE: '🧙‍♂️',
    ROGUE: '🗡️',
    BARD: '🎺',
    WARRIOR: '🛡️'
  }[normClass] || '⚔️';

  const loadState = async () => {
    try {
      setLoading(true);
      const res = await api.getTaskbarState();
      if (res && res.success) {
        setTaskbarState(res);
      }
    } catch (err) {
      console.warn('Error cargando estado de catacumbas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  // Temporizador de reducción de cooldown de habilidad
  useEffect(() => {
    if (abilityCooldown <= 0) return;
    const t = setInterval(() => {
      setAbilityCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [abilityCooldown]);

  // Bucle automático pasivo de ataque (cada 1.8s el héroe golpea automáticamente)
  useEffect(() => {
    const autoAttackTimer = setInterval(async () => {
      await executeCombatStrike(false);
    }, 1800);
    return () => clearInterval(autoAttackTimer);
  }, [taskbarState?.progress?.biome_id, abilityActive]);

  // Ejecuta un golpe (pasivo o manual por tap)
  const executeCombatStrike = async (isManualTap: boolean = false, multiplier: number = 1.0) => {
    try {
      setIsAttackingHero(true);
      setIsHitMonster(true);
      setTimeout(() => setIsAttackingHero(false), 200);
      setTimeout(() => setIsHitMonster(false), 250);

      if (isManualTap) {
        sfx.click();
        sfx.haptic([15]);
        setTapStreak((prev) => prev + 1);
      }

      const res = await api.taskbarTick();
      if (res && res.success) {
        const damage = Math.round((res.combatLog?.damage || 15) * multiplier);
        const isCrit = res.combatLog?.isCrit || multiplier > 1;

        // Añadir número flotante
        spawnFloatingDamage(damage, isCrit);

        setTaskbarState((prev: any) => ({
          ...prev,
          progress: res.progress
        }));

        if (res.combatLog?.defeatedMonster) {
          sfx.coin();
          sfx.playAudio('levelup');
          if (onShowToast) {
            onShowToast('INFO', `¡${res.combatLog.defeatedMonster} Derrotado!`, `+${res.combatLog.rewardGold} 🪙 Oro • +${res.combatLog.rewardXp} XP`, '💀');
          }
          if (onRefreshPlayer) onRefreshPlayer();
        }
      }
    } catch (e) {
      // Manejo silencioso de ticks
    }
  };

  const spawnFloatingDamage = (damage: number, isCrit: boolean) => {
    const id = Date.now() + Math.random();
    const x = Math.floor(Math.random() * 60) - 30;
    const y = Math.floor(Math.random() * 40) - 20;
    setFloatingNumbers((prev) => [...prev.slice(-6), { id, text: `-${damage}`, isCrit, x, y }]);
    setTimeout(() => {
      setFloatingNumbers((prev) => prev.filter((fn) => fn.id !== id));
    }, 900);
  };

  // Disparar habilidad especial manual
  const handleTriggerSpecialAbility = async () => {
    if (abilityCooldown > 0) return;
    sfx.swordClash();
    sfx.haptic([60, 40, 80]);
    setAbilityActive(true);
    setAbilityCooldown(ability.cooldownSec);
    setTimeout(() => setAbilityActive(false), 600);

    await executeCombatStrike(true, ability.dmgMultiplier);
    if (onShowToast) {
      onShowToast('INFO', `¡${ability.name}!`, ability.desc, ability.icon);
    }
  };

  // Reclamar botín acumulado de la mochila
  const handleClaimLoot = async () => {
    if (claiming) return;
    try {
      setClaiming(true);
      sfx.coin();
      sfx.playAudio('levelup');
      const res = await api.claimTaskbarAfk();
      if (res && res.success) {
        if (onShowToast) {
          onShowToast('INFO', '¡Tesoro Reclamado!', res.message, '🪙');
        }
        await loadState();
        if (onRefreshPlayer) await onRefreshPlayer();
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('ERROR', 'Fallo al Reclamar', err.message || 'No hay botín acumulado');
      }
    } finally {
      setClaiming(false);
    }
  };

  // Cambiar Bioma
  const handleSelectBiome = async (biomeId: string) => {
    try {
      sfx.click();
      const res = await api.selectTaskbarBiome(biomeId);
      if (res && res.success) {
        await loadState();
        if (onShowToast) {
          onShowToast('INFO', 'Nueva Zona de Catacumbas', `Has descendido a ${res.biome?.name}`, '🧭');
        }
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('ERROR', 'Zona Bloqueada', err.message);
      }
    }
  };

  if (loading || !taskbarState) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-3 bg-black/60 rounded-3xl border border-surface-border">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="font-heading text-xs text-primary font-bold uppercase tracking-wider">
          Descendiendo a las Catacumbas...
        </span>
      </div>
    );
  }

  const progress = taskbarState.progress;
  const biome = taskbarState.biome || taskbarState.biomesCatalog?.[0];
  const monsters = biome?.monsters || [];
  const currentMonster = monsters[progress.current_monster_index % monsters.length] || {
    name: 'Espectro Errante',
    icon: '💀',
    maxHp: 100,
    atk: 10,
    isBoss: false
  };

  const hpPct = Math.max(0, Math.min(100, (progress.monster_current_hp / progress.monster_max_hp) * 100));
  const isBoss = currentMonster.isBoss;

  return (
    <div className="space-y-4">
      {/* Selector Rápido de Profundidad / Biomas de Catacumbas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(taskbarState.biomesCatalog || []).map((b: any) => {
          const isSelected = b.id === biome.id;
          const isLocked = playerLevel < b.minLevel;

          return (
            <button
              key={b.id}
              onClick={() => !isLocked && handleSelectBiome(b.id)}
              disabled={isLocked}
              className={`px-3 py-1.5 rounded-2xl text-xs font-heading font-bold whitespace-nowrap flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-primary text-black border-primary shadow-[0_0_15px_var(--accent-glow)] font-black'
                  : isLocked
                  ? 'bg-black/40 text-gray-600 border-gray-800 cursor-not-allowed opacity-50'
                  : 'bg-surface-card hover:bg-surface-border text-gray-300 border-surface-border'
              }`}
            >
              <span>{b.icon}</span>
              <span>{b.name}</span>
              {isLocked && <span className="text-[9px] font-mono text-crimson font-bold">Nv.{b.minLevel}</span>}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* FRANJA HORIZONTAL DE COMBATE 2D CONTINUO (AUTO-BATTLER RUNNER) */}
      {/* ========================================================================= */}
      <div
        ref={laneRef}
        onClick={() => executeCombatStrike(true, 1.0)}
        className="relative h-48 sm:h-56 rounded-3xl bg-gradient-to-r from-black via-zinc-950 to-black border-2 border-primary/50 overflow-hidden shadow-2xl cursor-crosshair select-none group"
        title="¡Haz clic o toca en cualquier lugar para asestar golpes rápidos manuales!"
      >
        {/* Fondo de Catacumba con Efecto de Profundidad Parallax */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-black/80 to-black pointer-events-none" />

        {/* Antorchas Parpadeantes en los Muros */}
        <div className="absolute top-3 left-10 text-xl animate-pulse select-none opacity-70 pointer-events-none">
          🔥
        </div>
        <div className="absolute top-3 right-10 text-xl animate-pulse select-none opacity-70 pointer-events-none">
          🔥
        </div>

        {/* Suelo de Piedra Rúnica */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent border-t border-zinc-800 flex items-center justify-around opacity-40">
          <span className="text-[10px] font-mono text-zinc-600 tracking-widest">▲ ▲ ▲</span>
          <span className="text-[10px] font-mono text-zinc-600 tracking-widest">▲ ▲ ▲</span>
          <span className="text-[10px] font-mono text-zinc-600 tracking-widest">▲ ▲ ▲</span>
        </div>

        {/* Aviso de Tap Rápido para el Jugador */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-black/70 border border-primary/40 text-primary tracking-widest shadow-md">
            ⚡ TOCA LA PANTALLA PARA GOLPES RÁPIDOS ({tapStreak > 0 ? `${tapStreak} Hits!` : 'Combate Continuo'})
          </span>
        </div>

        {/* ================= HERO POSITION (LEFT) ================= */}
        <div
          className={`absolute bottom-6 left-6 sm:left-12 flex flex-col items-center z-10 transition-transform duration-100 ${
            isAttackingHero ? 'translate-x-6 sm:translate-x-10 scale-110' : 'translate-x-0'
          }`}
        >
          {/* Aura de Habilidad Activa */}
          {abilityActive && (
            <div className="absolute -inset-4 rounded-full bg-primary/40 filter blur-md animate-ping pointer-events-none" />
          )}

          {/* Sprite del Héroe */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-surface via-surface-card to-black border-2 border-primary/60 shadow-[0_0_20px_var(--accent-glow)] flex items-center justify-center">
            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
              {heroIcon}
            </span>
            <div className="absolute -bottom-2 px-1.5 py-0.2 rounded-full bg-black text-[9px] font-mono font-bold text-primary border border-primary/40">
              Nv.{playerLevel}
            </div>
          </div>
          <span className="font-heading font-black text-xs text-white mt-2 drop-shadow truncate max-w-[90px]">
            {playerName}
          </span>
        </div>

        {/* ================= MONSTER POSITION (RIGHT) ================= */}
        <div
          className={`absolute bottom-6 right-6 sm:right-12 flex flex-col items-center z-10 transition-transform duration-100 ${
            isHitMonster ? 'translate-x-2 filter brightness-150 animate-shake' : 'translate-x-0'
          }`}
        >
          {/* Barra de Vida del Monstruo / Jefe */}
          <div className="w-28 sm:w-36 space-y-1 mb-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <span className={`truncate flex items-center gap-1 ${isBoss ? 'text-amber-300 font-black' : 'text-gray-300'}`}>
                {isBoss && <Crown className="w-3 h-3 text-amber-400" />}
                <span>{currentMonster.name}</span>
              </span>
              <span className="text-rose-400">
                {progress.monster_current_hp}/{progress.monster_max_hp}
              </span>
            </div>
            <div className="h-2 w-full bg-black/80 rounded-full border border-surface-border overflow-hidden">
              <div
                className={`h-full transition-all duration-200 rounded-full ${
                  isBoss
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-rose-600 to-crimson'
                }`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          {/* Sprite del Monstruo */}
          <div
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2 transition-all ${
              isBoss
                ? 'bg-gradient-to-b from-amber-950/60 via-black to-black border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] ring-2 ring-amber-400/40'
                : 'bg-surface-card/90 border-crimson/60 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
            }`}
          >
            <span className={`text-3xl sm:text-4xl filter drop-shadow ${isBoss ? 'scale-110' : ''}`}>
              {currentMonster.icon}
            </span>
            {isBoss && (
              <span className="absolute -top-2.5 px-2 py-0.2 rounded-full bg-amber-500 text-black font-mono font-black text-[9px] shadow-md uppercase">
                JEFE DE ZONA
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-gray-400 mt-1">
            Oleada {progress.current_monster_index + 1}/{monsters.length}
          </span>
        </div>

        {/* Números de Daño Flotantes (Floating Combat Text) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {floatingNumbers.map((fn) => (
            <div
              key={fn.id}
              style={{ transform: `translate(${fn.x + 80}px, ${fn.y}px)` }}
              className={`absolute font-heading font-black text-xl sm:text-2xl animate-bounce transition-all ${
                fn.isCrit ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] text-2xl sm:text-3xl' : 'text-rose-400 drop-shadow-md'
              }`}
            >
              {fn.text} {fn.isCrit ? '🔥' : ''}
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTONERA TÁCTICA: HABILIDAD DE CLASE & SACO DE BOTÍN */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Habilidad Especial de Clase con Cooldown Radial */}
        <div className="p-3 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              {ability.icon}
            </div>
            <div className="min-w-0">
              <h4 className="font-heading font-black text-xs text-white truncate flex items-center gap-1.5">
                <span>{ability.name}</span>
                <span className="text-[9px] font-mono text-primary font-bold">({ability.dmgMultiplier}x DMG)</span>
              </h4>
              <p className="text-[10px] text-gray-400 font-sans line-clamp-1">{ability.desc}</p>
            </div>
          </div>

          <button
            onClick={handleTriggerSpecialAbility}
            disabled={abilityCooldown > 0}
            className={`px-4 py-2.5 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-md ${
              abilityCooldown > 0
                ? 'bg-surface text-gray-500 border border-surface-border cursor-not-allowed font-mono'
                : 'bg-gradient-to-r from-primary to-amber-500 hover:brightness-110 text-black active:scale-95 shadow-[0_0_15px_var(--accent-glow)]'
            }`}
          >
            {abilityCooldown > 0 ? `${abilityCooldown}s` : '¡DESATAR!'}
          </button>
        </div>

        {/* Saco de Botín Acumulado & Botón de Cobro */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/30 via-surface-card to-surface-card border border-amber-500/40 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              💰
            </div>
            <div>
              <h4 className="font-heading font-bold text-xs text-amber-300">Botín Acumulado</h4>
              <div className="flex items-center gap-2 text-xs font-mono font-bold mt-0.5">
                <span className="text-primary flex items-center gap-0.5">
                  <Coins className="w-3.5 h-3.5 text-primary" /> +{progress.accumulated_gold}
                </span>
                <span className="text-magic">+{progress.accumulated_xp} XP</span>
                {progress.accumulated_items?.length > 0 && (
                  <span className="text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded text-[10px] border border-amber-500/40">
                    🎁 {progress.accumulated_items.length} Ítems
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleClaimLoot}
            disabled={claiming || (progress.accumulated_gold === 0 && progress.accumulated_xp === 0 && (!progress.accumulated_items || progress.accumulated_items.length === 0))}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-heading font-black text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {claiming ? 'Cobrando...' : 'Cobrar Botín'}
          </button>
        </div>
      </div>

      {/* Bitácora de Estadísticas de la Mazmorra */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
        <div className="p-2 rounded-xl bg-surface-card border border-surface-border">
          <span className="text-[9px] text-gray-400 uppercase">Monstruos Caídos</span>
          <div className="font-bold text-white text-sm">{progress.total_monsters_slain || 0}</div>
        </div>
        <div className="p-2 rounded-xl bg-surface-card border border-surface-border">
          <span className="text-[9px] text-gray-400 uppercase">Racha de Combos</span>
          <div className="font-bold text-amber-400 text-sm">{progress.combo_streak || 0}x</div>
        </div>
        <div className="p-2 rounded-xl bg-surface-card border border-surface-border">
          <span className="text-[9px] text-gray-400 uppercase">Ataque Base</span>
          <div className="font-bold text-rose-400 text-sm">+{12 + (playerLevel * 4)} ATK</div>
        </div>
        <div className="p-2 rounded-xl bg-surface-card border border-surface-border">
          <span className="text-[9px] text-gray-400 uppercase">Zona Actual</span>
          <div className="font-bold text-primary text-sm truncate">{biome.name}</div>
        </div>
      </div>
    </div>
  );
};
