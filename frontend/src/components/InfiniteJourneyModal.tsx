import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Zap, 
  Flame, 
  Coins, 
  Sparkles, 
  Skull, 
  Swords, 
  Trophy, 
  ChevronRight,
  RefreshCw,
  Gift,
  Crown,
  MapPin,
  Package,
  Shield,
  Compass
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
  isOpen: boolean;
  onClose: () => void;
  playerClass: string;
  playerName: string;
  playerLevel: number;
  onRefreshPlayer: () => Promise<void> | void;
  onShowToast?: (type: 'EQUIP' | 'UNEQUIP' | 'CONSUME' | 'SELL' | 'ERROR' | 'INFO', title: string, desc?: string, icon?: string) => void;
}

export const InfiniteJourneyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  playerClass,
  playerName,
  playerLevel,
  onRefreshPlayer,
  onShowToast
}) => {
  const [journeyState, setJourneyState] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAttackingHero, setIsAttackingHero] = useState<boolean>(false);
  const [isHitMonster, setIsHitMonster] = useState<boolean>(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [selectedBiomeTab, setSelectedBiomeTab] = useState<string>('');

  // Cooldown de habilidad especial
  const [abilityCooldown, setAbilityCooldown] = useState<number>(0);
  const [abilityActive, setAbilityActive] = useState<boolean>(false);
  const [tapStreak, setTapStreak] = useState<number>(0);

  const laneRef = useRef<HTMLDivElement>(null);
  const normClass = (playerClass || 'WARRIOR').toUpperCase();

  const getClassAbility = () => {
    switch (normClass) {
      case 'MAGE':
        return {
          name: 'Cometa Arcano',
          icon: '🔮',
          desc: 'Explosión de supernova arcana que inflige 350% de daño cósmico.',
          cooldownSec: 10,
          dmgMultiplier: 3.5
        };
      case 'ROGUE':
        return {
          name: 'Asalto Sombrío',
          icon: '🗡️',
          desc: 'Golpe crítico letal a la yugular con 300% de daño.',
          cooldownSec: 8,
          dmgMultiplier: 3.0
        };
      case 'BARD':
        return {
          name: 'Himno de Guerra',
          icon: '🎺',
          desc: 'Fanfarria resonante que desata ondas sonoras y duplica el botín.',
          cooldownSec: 12,
          dmgMultiplier: 2.5
        };
      case 'WARRIOR':
      default:
        return {
          name: 'Torbellino de Acero',
          icon: '💥',
          desc: 'Giro devastador de hierro con 300% de daño de impacto.',
          cooldownSec: 10,
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

  const fetchJourneyState = async () => {
    try {
      setLoading(true);
      const res = await api.getJourneyState();
      if (res && res.success) {
        setJourneyState(res);
        if (res.biome) setSelectedBiomeTab(res.biome.id);
      }
    } catch (e) {
      console.warn('Error al cargar estado de la Senda Infinita:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchJourneyState();
    }
  }, [isOpen]);

  // Temporizador de recarga de habilidad activa
  useEffect(() => {
    if (abilityCooldown <= 0) return;
    const timer = setInterval(() => {
      setAbilityCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [abilityCooldown]);

  // Tick de combate automático pasivo cada 2.5 segundos mientras el modal está abierto
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      triggerHeroAttack(false);
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, journeyState?.progress]);

  // Spawn de números flotantes de daño
  const spawnFloatingNumber = (text: string, isCrit: boolean = false) => {
    const id = Date.now() + Math.random();
    const x = 60 + Math.random() * 20; // Porcentaje relativo al monstruo
    const y = 30 + Math.random() * 25;
    setFloatingNumbers((prev) => [...prev.slice(-6), { id, text, isCrit, x, y }]);
    setTimeout(() => {
      setFloatingNumbers((prev) => prev.filter((fn) => fn.id !== id));
    }, 1100);
  };

  const triggerHeroAttack = async (isManualTap: boolean = false, isSpecialAbility: boolean = false) => {
    setIsAttackingHero(true);
    setTimeout(() => setIsAttackingHero(false), 260);

    if (isSpecialAbility) {
      sfx.playAudio('crit');
      sfx.haptic([80, 50, 80]);
    } else if (isManualTap) {
      sfx.playAudio('sword');
      sfx.haptic([25]);
    }

    try {
      const res = await api.journeyTick();
      if (res && res.success) {
        const { progress, combatLog } = res;
        setJourneyState((prev: any) => ({
          ...prev,
          progress
        }));

        setIsHitMonster(true);
        setTimeout(() => setIsHitMonster(false), 220);

        if (combatLog) {
          const dmg = isSpecialAbility ? Math.round(combatLog.damage * ability.dmgMultiplier) : combatLog.damage;
          spawnFloatingNumber(
            isSpecialAbility ? `⚡ ¡${ability.name}! -${dmg}` : `-${dmg}`, 
            combatLog.isCrit || isSpecialAbility
          );

          if (combatLog.defeatedMonster) {
            sfx.playAudio('coins');
            sfx.haptic([50, 40]);
            if (onShowToast) {
              onShowToast(
                'INFO', 
                `¡${combatLog.defeatedMonster} Derrotado!`, 
                `+${combatLog.rewardGold} 🪙 Oro  |  +${combatLog.rewardXp} XP`, 
                progress.is_boss ? '👑' : '💀'
              );
            }
            onRefreshPlayer();
          }
        }
      }
    } catch (_) {}
  };

  const handleManualTap = (e: React.MouseEvent) => {
    e.preventDefault();
    setTapStreak((prev) => prev + 1);
    triggerHeroAttack(true, false);
  };

  const handleUseAbility = () => {
    if (abilityCooldown > 0) return;
    setAbilityCooldown(ability.cooldownSec);
    setAbilityActive(true);
    setTimeout(() => setAbilityActive(false), 800);
    triggerHeroAttack(true, true);
  };

  const handleSelectBiome = async (biomeId: string) => {
    try {
      sfx.playAudio('click');
      const res = await api.selectJourneyBiome(biomeId);
      if (res && res.success) {
        setSelectedBiomeTab(biomeId);
        await fetchJourneyState();
        if (onShowToast) {
          onShowToast('INFO', 'Nueva Zona de la Senda', res.message, '🌲');
        }
      }
    } catch (err: any) {
      if (onShowToast) onShowToast('ERROR', 'Zona Bloqueada', err.message, '🔒');
    }
  };

  const handleClaimLoot = async () => {
    if (claiming) return;
    try {
      setClaiming(true);
      sfx.playAudio('coins');
      const res = await api.claimJourneyAfk();
      if (res && res.success) {
        if (onShowToast) {
          onShowToast('INFO', '¡Botín de la Senda Reclamado!', res.message, '💰');
        }
        await onRefreshPlayer();
        await fetchJourneyState();
      }
    } catch (err: any) {
      if (onShowToast) onShowToast('ERROR', 'Error al reclamar', err.message, '⚠️');
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  const progress = journeyState?.progress;
  const biome = journeyState?.biome;
  const biomesCatalog = journeyState?.biomesCatalog || [];

  const currentHp = progress?.monster_current_hp ?? 50;
  const maxHp = progress?.monster_max_hp ?? 50;
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));
  const accumulatedGold = progress?.accumulated_gold ?? 0;
  const accumulatedXp = progress?.accumulated_xp ?? 0;
  const accumulatedItems = progress?.accumulated_items || [];
  const waveDepth = progress?.wave_depth ?? progress?.total_monsters_slain ?? 1;
  const isBoss = progress?.is_boss || (waveDepth % 10 === 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-surface-card via-surface to-black border border-primary/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden my-auto max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-amber-500/20 border border-primary/50 flex items-center justify-center text-2xl shadow-inner">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-lg sm:text-xl text-white tracking-wide">
                  Senda Infinita
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                  Profundidad {waveDepth}
                </span>
                {isBoss && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-heading font-black animate-pulse">
                    👑 JEFE DE ZONA
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-serif">
                Aventura procedural continua • Avanza, combate y recolecta reliquias sin límites
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sfx.playAudio('click');
              onClose();
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Biomas de la Senda */}
        <div className="px-5 py-2.5 bg-black/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-heading font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-primary" />
            Zonas:
          </span>
          {biomesCatalog.map((b: any) => {
            const isSelected = (selectedBiomeTab || biome?.id) === b.id;
            const isLocked = playerLevel < b.minLevel;
            return (
              <button
                key={b.id}
                onClick={() => !isLocked && handleSelectBiome(b.id)}
                disabled={isLocked}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-[0_0_12px_var(--accent-glow)]'
                    : 'bg-surface-card/60 text-gray-300 hover:text-white hover:bg-surface-card border border-white/5'
                }`}
              >
                <span>{b.icon}</span>
                <span>{b.name.split(' ')[0]}</span>
                {isLocked ? (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/50 text-gray-400">Nvl {b.minLevel}</span>
                ) : (
                  <span className="text-[9px] font-mono opacity-70">Nvl {b.minLevel}+</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Carril de Combate Horizontal 2D con Parallax & Monstruos en Marcha */}
        <div 
          ref={laneRef}
          onClick={handleManualTap}
          className="relative h-64 sm:h-76 w-full overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-black select-none cursor-pointer border-y border-primary/20 group"
          title="¡Haz clic o tap para acelerar ataques!"
        >
          {/* Fondo Parallax Dinámico con Bruma y Antorchas */}
          <div 
            className="absolute inset-0 opacity-40 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none animate-pulse" 
            style={{ animationDuration: '4s' }}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-zinc-950/80 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-12 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />

          {/* Banner de Aviso de Jefe de Zona */}
          {isBoss && (
            <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none z-20 animate-fade-in">
              <div className="px-4 py-1 rounded-full bg-red-950/80 border border-red-500/60 backdrop-blur-md text-red-300 text-xs font-heading font-black tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                <Crown className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>¡COMBATE CONTRA EL JEFE DE ZONA! (BOTÍN LEGENDARIO)</span>
              </div>
            </div>
          )}

          {/* Indicador de Acción Táctil (Tap-to-Attack) */}
          <div className="absolute bottom-2 left-4 text-[10px] font-serif text-gray-500 flex items-center gap-1 pointer-events-none">
            <span className="animate-ping inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Toca el carril para acelerar los tajos de espada</span>
          </div>

          {/* HÉROE A LA IZQUIERDA */}
          <div 
            className={`absolute bottom-8 left-8 sm:left-16 flex flex-col items-center transition-transform duration-200 pointer-events-none z-10 ${
              isAttackingHero ? 'translate-x-6 scale-110' : 'translate-x-0'
            }`}
          >
            <div className="relative">
              {/* Resplandor del Héroe */}
              <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md" />
              <div className="relative text-5xl sm:text-6xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                {heroIcon}
              </div>
              {/* Efecto de estocada con espada */}
              {isAttackingHero && (
                <div className="absolute top-2 -right-4 text-2xl animate-spin text-amber-300">
                  ⚔️
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs font-heading font-black text-white">{playerName}</div>
              <div className="text-[10px] font-mono text-primary font-bold">Nvl {playerLevel} • {normClass}</div>
            </div>
          </div>

          {/* MONSTRUO / JEFE PROCEDURAL A LA DERECHA */}
          <div 
            className={`absolute bottom-8 right-8 sm:right-20 flex flex-col items-center transition-transform duration-200 pointer-events-none z-10 ${
              isHitMonster ? 'translate-x-3 brightness-150 scale-95' : 'translate-x-0'
            }`}
          >
            <div className="relative">
              {/* Aura del Enemigo */}
              <div className={`absolute -inset-3 rounded-full blur-lg ${isBoss ? 'bg-red-500/30 animate-pulse' : 'bg-amber-500/10'}`} />
              <div className={`relative text-5xl sm:text-7xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] ${
                isBoss ? 'scale-125' : ''
              }`}>
                {progress?.monster_icon || '👾'}
              </div>
              {isBoss && (
                <div className="absolute -top-4 inset-x-0 flex justify-center text-xl">
                  👑
                </div>
              )}
            </div>

            <div className="mt-2 text-center max-w-[180px]">
              <div className="text-xs font-heading font-black text-amber-300 truncate">
                {progress?.monster_name || 'Enemigo'}
              </div>
              <div className="text-[10px] font-mono text-gray-400">
                {currentHp} / {maxHp} HP
              </div>
            </div>
          </div>

          {/* Barra de Vida Superior del Monstruo */}
          <div className="absolute top-12 sm:top-14 inset-x-8 sm:inset-x-24 z-20 pointer-events-none">
            <div className="h-3 w-full bg-black/70 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-lg">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  isBoss 
                    ? 'bg-gradient-to-r from-amber-500 via-red-500 to-rose-600' 
                    : 'bg-gradient-to-r from-amber-400 to-red-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Números Flotantes de Daño */}
          {floatingNumbers.map((fn) => (
            <div
              key={fn.id}
              className={`absolute font-heading font-black pointer-events-none animate-bounce z-30 ${
                fn.isCrit
                  ? 'text-amber-300 text-lg sm:text-xl drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]'
                  : 'text-cyan-300 text-sm sm:text-base drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]'
              }`}
              style={{ left: `${fn.x}%`, top: `${fn.y}%` }}
            >
              {fn.text} {fn.isCrit ? '🔥' : ''}
            </div>
          ))}
        </div>

        {/* Panel de Habilidades de Clase & Controles Rápidos */}
        <div className="px-5 py-3 bg-surface-card border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Habilidad de Clase Activa */}
            <button
              onClick={handleUseAbility}
              disabled={abilityCooldown > 0}
              className={`relative px-4 py-2 rounded-2xl font-heading font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                abilityCooldown === 0
                  ? 'bg-gradient-to-r from-primary to-amber-600 text-on-primary hover:brightness-110 shadow-[0_0_15px_var(--accent-glow)]'
                  : 'bg-zinc-800 text-gray-400 border border-white/10'
              }`}
            >
              <span className="text-base">{ability.icon}</span>
              <div>
                <div>{ability.name}</div>
                <div className="text-[9px] opacity-80 font-mono font-normal">
                  {abilityCooldown > 0 ? `Recargando (${abilityCooldown}s)` : '¡Listo para usar! (300% DMG)'}
                </div>
              </div>
              {abilityCooldown > 0 && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center font-mono font-black text-white text-xs">
                  {abilityCooldown}s
                </div>
              )}
            </button>

            {/* Botón de Golpe Táctil Rápido */}
            <button
              onClick={handleManualTap}
              className="px-3.5 py-2 rounded-2xl bg-surface border border-white/10 hover:border-primary/50 text-gray-200 hover:text-white transition-all text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
            >
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>Golpear (Tap)</span>
              {tapStreak > 0 && (
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                  x{tapStreak}
                </span>
              )}
            </button>
          </div>

          {/* Estadísticas de Progresión Continua */}
          <div className="flex items-center gap-4 text-xs font-mono text-gray-300">
            <div>
              <span className="text-gray-400">Monstruos Caídos:</span>{' '}
              <span className="font-bold text-white">{progress?.total_monsters_slain || 0}</span>
            </div>
            <div>
              <span className="text-gray-400">Racha de Combos:</span>{' '}
              <span className="font-bold text-amber-300">{progress?.combo_streak || 0}</span>
            </div>
          </div>
        </div>

        {/* Cofre de Botín Vivo Acumulado */}
        <div className="p-5 bg-black/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner">
              📦
            </div>
            <div>
              <div className="font-heading font-black text-sm text-white flex items-center gap-2">
                <span>Botín Acumulado en la Marcha</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-gray-300">
                  {accumulatedItems.length} ítems guardados
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono mt-0.5">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>+{accumulatedGold} 🪙 Oro</span>
                </span>
                <span className="text-cyan-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+{accumulatedXp} XP</span>
                </span>
              </div>
            </div>
          </div>

          {/* Botón de Cobro de Botín */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleClaimLoot}
              disabled={claiming || (accumulatedGold === 0 && accumulatedXp === 0 && accumulatedItems.length === 0)}
              className="w-full sm:w-auto py-2.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black font-heading font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Gift className="w-4 h-4" />
              <span>{claiming ? 'Transfiriendo...' : 'Reclamar Botín y Salir'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
