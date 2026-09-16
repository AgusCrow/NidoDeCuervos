import React, { useState, useEffect } from 'react';
import { 
  X, 
  Flag, 
  ShieldAlert, 
  Flame, 
  Swords, 
  Skull, 
  Crown, 
  RefreshCw,
  Sparkles,
  Zap,
  CheckCircle2,
  Award
} from 'lucide-react';
import api from '../services/api';
import { sfx } from '../services/sfx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefreshPlayer: () => void;
}

export const MUEventsModal: React.FC<Props> = ({ isOpen, onClose, onRefreshPlayer }) => {
  const [activeEvent, setActiveEvent] = useState<'ARKA_WAR' | 'ACHERON' | 'TORMENTED' | 'CHAOS_CASTLE'>('ARKA_WAR');
  const [loading, setLoading] = useState(false);
  const [arkaState, setArkaState] = useState<any>(null);
  const [acheronState, setAcheronState] = useState<any>(null);
  const [resultMessage, setResultMessage] = useState<{ type: 'ok' | 'err'; text: string; details?: any } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadArkaState();
      loadAcheronState();
    }
  }, [isOpen]);

  const loadArkaState = async () => {
    try {
      const res = (await api.get('/events/arka-war/state')).data;
      setArkaState(res.state);
    } catch (e) {}
  };

  const loadAcheronState = async () => {
    try {
      const res = (await api.get('/events/acheron/state')).data;
      setAcheronState(res.state);
    } catch (e) {}
  };

  const handleArkaAction = async (nodeId: string) => {
    try {
      setLoading(true);
      sfx.playAudio('sword');
      const res = (await api.post('/events/arka-war/action', { nodeId })).data;
      setArkaState(res.state);
      sfx.playAudio(res.isCrit ? 'crit' : 'coins');
      setResultMessage({
        type: 'ok',
        text: `🚩 Tirada D20=[${res.d20}] ${res.isCrit ? '🔥 CRÍTICO' : ''} ➔ Sumaste +${res.pointsEarned} Pts a la facción ${res.faction}! (+${res.goldEarned} 🪙, +${res.xpEarned} XP)`
      });
      onRefreshPlayer();
    } catch (err: any) {
      setResultMessage({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAcheronAction = async (actionType: string) => {
    try {
      setLoading(true);
      sfx.playAudio(actionType === 'REPAIR_MONOLITH' ? 'shield' : 'fire');
      const res = (await api.post('/events/acheron/action', { actionType })).data;
      setAcheronState(res.state);
      sfx.playAudio(res.isCrit ? 'crit' : 'coins');
      setResultMessage({
        type: 'ok',
        text: `🛡️ Tirada D20=[${res.d20}] ${res.isCrit ? '🔥 CRÍTICO' : ''} ➔ ${res.log}`
      });
      onRefreshPlayer();
    } catch (err: any) {
      setResultMessage({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTormented = async () => {
    try {
      setLoading(true);
      sfx.playAudio('dice');
      const res = (await api.post('/events/tormented-square/play', {})).data;
      sfx.playAudio(res.isCrit ? 'crit' : 'coins');
      setResultMessage({
        type: 'ok',
        text: `⚔️ Tirada D20=[${res.d20}] ➔ ¡Obtuviste ${res.score} Pts! (+${res.goldEarned} 🪙, +${res.xpEarned} XP)${res.droppedItem ? ` 🎁 ¡Desbloqueaste ${res.droppedItem.name}!`: ''}`,
        details: res.droppedItem
      });
      onRefreshPlayer();
    } catch (err: any) {
      setResultMessage({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEnterChaosCastle = async () => {
    try {
      setLoading(true);
      sfx.playAudio('sword');
      const res = (await api.post('/events/chaos-castle/enter', {})).data;
      sfx.playAudio(res.isVictory ? 'fanfare' : 'd20fail');
      setResultMessage({
        type: res.isVictory ? 'ok' : 'err',
        text: `🛡️ [${res.anonymousAlias}] Tirada D20=[${res.d20}] ➔ ${res.message}${res.droppedItem ? ` 🏆 Recompensa Mítica: ${res.droppedItem.name}`: ''}`,
        details: res.droppedItem
      });
      onRefreshPlayer();
    } catch (err: any) {
      setResultMessage({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-surface via-background to-black border-2 border-red-500/50 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.3)] p-5 sm:p-7 space-y-6 text-white my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header Principal */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-black/70 rounded-[14px] flex items-center justify-center">
                <Swords className="w-6 h-6 text-red-500 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                <span>EVENTOS COMPETITIVOS MU ONLINE</span>
              </h2>
              <p className="text-xs text-gray-400 font-serif italic">
                Arka War • Protector of Acheron • Tormented Square • Chaos Castle
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-card hover:bg-crimson/20 border border-surface-border text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Selector for 4 MU Events */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-surface-card/90 p-1.5 rounded-2xl border border-surface-border">
          <button
            onClick={() => { setActiveEvent('ARKA_WAR'); setResultMessage(null); }}
            className={`py-2.5 rounded-xl font-heading text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeEvent === 'ARKA_WAR'
                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flag className="w-4 h-4" /> Arka War
          </button>

          <button
            onClick={() => { setActiveEvent('ACHERON'); setResultMessage(null); }}
            className={`py-2.5 rounded-xl font-heading text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeEvent === 'ACHERON'
                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Acheron Tower
          </button>

          <button
            onClick={() => { setActiveEvent('TORMENTED'); setResultMessage(null); }}
            className={`py-2.5 rounded-xl font-heading text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeEvent === 'TORMENTED'
                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" /> Tormented Square
          </button>

          <button
            onClick={() => { setActiveEvent('CHAOS_CASTLE'); setResultMessage(null); }}
            className={`py-2.5 rounded-xl font-heading text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeEvent === 'CHAOS_CASTLE'
                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Skull className="w-4 h-4" /> Chaos Castle
          </button>
        </div>

        {/* Result Message Banner */}
        {resultMessage && (
          <div className={`p-4 rounded-2xl border text-xs font-semibold space-y-2 ${
            resultMessage.type === 'ok' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-crimson/20 border-crimson/50 text-crimson'
          }`}>
            <p>{resultMessage.text}</p>
            {resultMessage.details && (
              <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/40 flex items-center gap-3">
                <span className="text-2xl">{resultMessage.details.icon || '⚔️'}</span>
                <div>
                  <h4 className="font-heading font-black text-amber-300">{resultMessage.details.name}</h4>
                  <p className="text-[10px] font-mono text-gray-300">Rareza: {resultMessage.details.rarity} • Niv. {resultMessage.details.item_level}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EVENT 1: ARKA WAR (KING OF THE HILL) */}
        {activeEvent === 'ARKA_WAR' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-card/60 border border-red-500/30 space-y-2">
              <h3 className="font-heading text-base font-black text-red-400 uppercase flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                <span>ARKA WAR: TOMA Y RETENCIÓN DE NODOS</span>
              </h3>
              <p className="text-xs text-gray-300 font-serif">
                Canaliza tu poder sobre los obeliscos rituales. Acumula puntos de control periódicos para tu facción Gens (Duprian vs Vanert).
              </p>
            </div>

            {/* Marker Scoreboard */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-center">
                <span className="text-xs font-mono text-red-300 uppercase block">MARCADOR DUPRIAN</span>
                <span className="font-mono text-2xl font-black text-red-400">{arkaState?.scores?.Duprian || 0} PTS</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-center">
                <span className="text-xs font-mono text-amber-300 uppercase block">MARCADOR VANERT</span>
                <span className="font-mono text-2xl font-black text-amber-400">{arkaState?.scores?.Vanert || 0} PTS</span>
              </div>
            </div>

            {/* Obelisks Grid */}
            <div className="space-y-3">
              {(arkaState?.nodes || []).map((node: any) => (
                <div key={node.id} className="p-4 rounded-2xl bg-surface-card border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-black text-sm text-white">{node.name}</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        node.controlledBy === 'Duprian' ? 'bg-red-500/20 text-red-400 border-red-500' : node.controlledBy === 'Vanert' ? 'bg-amber-500/20 text-amber-300 border-amber-500' : 'bg-gray-500/20 text-gray-400 border-gray-500'
                      }`}>
                        {node.controlledBy}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-serif">
                      Guardián Dominante: <span className="text-gray-200 font-bold">{node.currentHolder}</span> • Generación: +{node.pointsPerSec} Pts/sec
                    </p>
                  </div>

                  <button
                    onClick={() => handleArkaAction(node.id)}
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-110 text-black font-heading font-black text-xs uppercase shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    🚩 Canalizar D20 en Nodo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EVENT 2: PROTECTOR OF ACHERON (TOWER DEFENSE) */}
        {activeEvent === 'ACHERON' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-card/60 border border-amber-500/30 space-y-2">
              <h3 className="font-heading text-base font-black text-amber-400 uppercase flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>PROTECTOR OF ACHERON: DEFENSA DE MONOLITO</span>
              </h3>
              <p className="text-xs text-gray-300 font-serif">
                Protege el monolito elemental en el centro del mapa de las oleadas kamikazes de monstruos abisales.
              </p>
            </div>

            {/* Monolith HP Gauge */}
            <div className="p-5 rounded-2xl bg-black/60 border border-amber-500/40 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold">ESTADO DEL MONOLITO ELEMENTAL (Oleada {acheronState?.wave || 1}/{acheronState?.maxWaves || 5})</span>
                <span className="text-white font-bold">{acheronState?.monolithHp || 0} / {acheronState?.maxMonolithHp || 1000} HP</span>
              </div>
              <div className="w-full h-3 bg-surface-card rounded-full overflow-hidden border border-surface-border">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, ((acheronState?.monolithHp || 0) / (acheronState?.maxMonolithHp || 1000)) * 100))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleAcheronAction('INTERCEPT_KAMIKAZE')}
                disabled={loading}
                className="py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-heading font-black text-xs uppercase shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Swords className="w-4 h-4" />
                <span>Interceptar Horda Kamikaze (D20)</span>
              </button>

              <button
                onClick={() => handleAcheronAction('REPAIR_MONOLITH')}
                disabled={loading}
                className="py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Restaurar Barrera Elemental (D20)</span>
              </button>
            </div>
          </div>
        )}

        {/* EVENT 3: TORMENTED SQUARE (ARENA SCORE ATTACK) */}
        {activeEvent === 'TORMENTED' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-card/60 border border-purple-500/30 space-y-2">
              <h3 className="font-heading text-base font-black text-purple-400 uppercase flex items-center gap-2">
                <Flame className="w-5 h-5 text-purple-500" />
                <span>TORMENTED SQUARE: ARENA SCORE ATTACK</span>
              </h3>
              <p className="text-xs text-gray-300 font-serif">
                Rondas encadenadas con escalado exponencial de dificultad. Elimina jefes fugaces antes de que expire el temporizador.
              </p>
            </div>

            <button
              onClick={handlePlayTormented}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-heading font-black text-sm uppercase shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-5 h-5" />
              <span>Desafiar Arena Tormented Square (D20 Gauntlet)</span>
            </button>
          </div>
        )}

        {/* EVENT 4: CHAOS CASTLE BATTLE CORE (BATTLE ROYALE) */}
        {activeEvent === 'CHAOS_CASTLE' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-card/60 border border-crimson/40 space-y-2">
              <h3 className="font-heading text-base font-black text-crimson uppercase flex items-center gap-2">
                <Skull className="w-5 h-5 text-crimson" />
                <span>CHAOS CASTLE: ARENA COLAPSABLE (BATTLE ROYALE)</span>
              </h3>
              <p className="text-xs text-gray-300 font-serif">
                Anonimato absoluto. Todos adoptan el avatar de Soldado Oscuro. Las casillas del mapa se derrumban al vacío. ¡Último superviviente en pie!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-crimson/30 space-y-2 text-xs text-gray-300 font-serif">
              <span className="font-heading font-bold text-amber-300 uppercase block">Reglas de Asedio Chaos Castle:</span>
              <ul className="list-disc pl-5 space-y-1">
                <li>Sin nombres visibles ni chat de grupo (Anonimato Forzado).</li>
                <li>Las casillas exteriores se desmoronan hacia el abismo cada asalto.</li>
                <li>Garantiza <span className="text-amber-400 font-bold">Recompensa de Rareza &gt; 5 (Mítica o superior)</span> en caso de Victoria.</li>
              </ul>
            </div>

            <button
              onClick={handleEnterChaosCastle}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-crimson via-red-600 to-amber-500 text-white font-heading font-black text-sm uppercase shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Skull className="w-5 h-5" />
              <span>Entrar al Chaos Castle Battle Core (D20)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
