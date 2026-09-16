import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Coins, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  ChevronRight,
  Swords,
  Shield,
  Package
} from 'lucide-react';
import { api } from '../services/api';
import { sfx } from '../services/sfx';

interface Props {
  playerClass: string;
  playerName: string;
  playerLevel: number;
  onOpenModal: () => void;
  onRefreshPlayer: () => Promise<void>;
}

export const InfiniteJourneyWidget: React.FC<Props> = ({
  playerClass,
  playerName,
  playerLevel,
  onOpenModal,
  onRefreshPlayer
}) => {
  const [minimized, setMinimized] = useState(false);
  const [journeyState, setJourneyState] = useState<any>(null);
  const [combatLogText, setCombatLogText] = useState<string>('🚶‍♂️ El Cuervo avanza por la Senda Infinita...');
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [isCritDamage, setIsCritDamage] = useState<boolean>(false);
  const [claiming, setClaiming] = useState<boolean>(false);

  const heroIcon = {
    MAGE: '🧙‍♂️',
    ROGUE: '🗡️',
    BARD: '🎺',
    WARRIOR: '🛡️'
  }[(playerClass || 'WARRIOR').toUpperCase()] || '⚔️';

  const fetchJourneyState = async () => {
    try {
      const res = await api.getJourneyState();
      if (res && res.success) {
        setJourneyState(res);
      }
    } catch (e) {
      console.warn('No se pudo cargar el estado de la Senda Infinita:', e);
    }
  };

  useEffect(() => {
    fetchJourneyState();

    // Pulso de combate pasivo continuo (Tick cada 3.2 segundos)
    const tickInterval = setInterval(async () => {
      try {
        const res = await api.journeyTick();
        if (res && res.success) {
          setJourneyState((prev: any) => ({
            ...prev,
            progress: res.progress
          }));

          if (res.combatLog) {
            setCombatLogText(res.combatLog.text);
            setLastDamage(res.combatLog.damage);
            setIsCritDamage(res.combatLog.isCrit);
            setTimeout(() => setLastDamage(null), 1200);

            if (res.combatLog.defeatedMonster) {
              sfx.playAudio('coins');
              onRefreshPlayer();
            }
          }
        }
      } catch (_) {}
    }, 3200);

    return () => clearInterval(tickInterval);
  }, []);

  const handleClaimLoot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (claiming) return;

    try {
      setClaiming(true);
      sfx.playAudio('coins');
      const res = await api.claimJourneyAfk();
      if (res && res.success) {
        await onRefreshPlayer();
        await fetchJourneyState();
      }
    } catch (err) {
      console.warn('Error cobrando botín de senda:', err);
    } finally {
      setClaiming(false);
    }
  };

  const progress = journeyState?.progress;
  const biome = journeyState?.biome;
  const currentHp = progress?.monster_current_hp ?? 50;
  const maxHp = progress?.monster_max_hp ?? 50;
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));
  const accumulatedGold = progress?.accumulated_gold ?? 0;
  const accumulatedItems = progress?.accumulated_items?.length ?? 0;
  const waveDepth = progress?.wave_depth ?? progress?.total_monsters_slain ?? 1;

  if (minimized) {
    return (
      <div 
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-40 bg-surface/90 border border-primary/50 backdrop-blur-md rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 cursor-pointer hover:border-primary transition-all duration-300 group animate-pulse"
      >
        <span className="text-xl group-hover:scale-120 transition-transform">⚔️</span>
        <div className="text-left">
          <div className="font-heading text-xs font-black text-primary flex items-center gap-1.5">
            <span>Senda Infinita</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-accent font-mono font-bold">Nvl {waveDepth}</span>
          </div>
          <div className="text-[10px] text-gray-400 font-serif truncate max-w-[140px]">{biome?.name || 'Avanzando...'}</div>
        </div>
        <Maximize2 className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0 ml-1" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 sm:right-6 z-40 max-w-sm sm:max-w-md w-full bg-gradient-to-r from-surface-card/95 via-surface/95 to-surface-card/95 border border-primary/40 backdrop-blur-xl rounded-2xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)] transition-all duration-300">
      {/* Header del Widget */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div 
          onClick={onOpenModal}
          className="flex items-center gap-2 cursor-pointer group flex-1 mr-2"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-sm group-hover:scale-110 transition-transform shadow-inner">
            {heroIcon}
          </div>
          <div className="truncate">
            <div className="font-heading font-black text-xs text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
              <span>Senda Infinita</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Profundidad {waveDepth}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 font-serif truncate flex items-center gap-1">
              <span>{biome?.icon || '🌲'}</span>
              <span>{biome?.name || 'Tierras Salvajes'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setMinimized(true)}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Minimizar"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenModal}
            className="p-1.5 rounded-lg bg-primary/20 border border-primary/40 text-primary hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1 text-[11px] font-heading font-bold"
            title="Abrir Senda Completa"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expandir</span>
          </button>
        </div>
      </div>

      {/* Escenario Miniatura de Combate Continuo */}
      <div 
        onClick={onOpenModal}
        className="relative bg-black/40 border border-white/5 rounded-xl p-2.5 mb-2 cursor-pointer hover:border-primary/30 transition-all group overflow-hidden"
      >
        {/* Glow de fondo procedural */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 relative z-10">
          {/* Héroe en marcha */}
          <div className="flex items-center gap-1.5">
            <span className="text-xl group-hover:scale-110 transition-transform inline-block animate-bounce" style={{ animationDuration: '2s' }}>
              {heroIcon}
            </span>
            <div className="text-[11px] font-heading font-bold text-gray-200">
              {playerName}
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-gray-500">VS</span>

          {/* Monstruo Procedural Actual */}
          <div className="flex items-center gap-1.5 text-right">
            <div className="text-[11px] font-heading font-bold text-amber-300 truncate max-w-[120px]">
              {progress?.monster_name || 'Enemigo'}
            </div>
            <span className="text-xl group-hover:scale-110 transition-transform">
              {progress?.monster_icon || '👾'}
            </span>
          </div>
        </div>

        {/* Barra de Vida del Monstruo */}
        <div className="mt-2 relative">
          <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/10 relative">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${
                progress?.is_boss 
                  ? 'bg-gradient-to-r from-amber-500 to-red-500' 
                  : 'bg-gradient-to-r from-red-600 to-amber-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 mt-1">
            <span>{progress?.is_boss ? '👑 JEFE DE ZONA' : 'Enemigo'}</span>
            <span>{currentHp} / {maxHp} HP ({hpPercent}%)</span>
          </div>

          {/* Daño flotante */}
          {lastDamage !== null && (
            <div className={`absolute -top-4 right-1/4 text-xs font-heading font-black animate-bounce pointer-events-none ${
              isCritDamage ? 'text-amber-400 text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]' : 'text-cyan-300'
            }`}>
              -{lastDamage} {isCritDamage ? '🔥 CRIT!' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Footer con Botín Acumulado & Cobro Inmediato */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-2.5 text-gray-300 font-mono text-[11px]">
          <span className="flex items-center gap-1 text-amber-300 font-bold" title="Oro acumulado">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{accumulatedGold}</span>
          </span>
          <span className="flex items-center gap-1 text-purple-300 font-bold" title="Cofres/Ítems encontrados">
            <Package className="w-3.5 h-3.5 text-purple-400" />
            <span>{accumulatedItems}</span>
          </span>
        </div>

        {(accumulatedGold > 0 || accumulatedItems > 0) && (
          <button
            onClick={handleClaimLoot}
            disabled={claiming}
            className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-heading font-black text-[10px] hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            <span>{claiming ? 'Cobrando...' : 'Cobrar Botín'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
