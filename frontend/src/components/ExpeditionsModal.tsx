import React, { useState, useEffect } from 'react';
import { 
  X, 
  Compass, 
  Shield, 
  Skull, 
  Heart, 
  Award, 
  RefreshCw, 
  Zap, 
  DoorOpen, 
  CheckCircle, 
  ChevronRight, 
  AlertTriangle, 
  Sparkles,
  Swords,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import { sfx } from '../services/sfx';
import { CatacombsAutoBattler } from './CatacombsAutoBattler';

interface ExpeditionNode {
  id: string;
  floor: number;
  step: number;
  type: 'COMBAT' | 'ELITE' | 'EVENT' | 'REST' | 'BOSS';
  title: string;
  description: string;
  icon: string;
  is_cleared: boolean;
  enemy?: {
    name: string;
    hp: number;
    max_hp: number;
    atk: number;
    dc: number;
    icon: string;
  };
  event?: {
    prompt: string;
    choices: {
      id: string;
      label: string;
      dc: number;
      success_flavor: string;
      failure_flavor: string;
      reward_gold?: number;
      reward_xp?: number;
      damage_on_fail?: number;
    }[];
  };
  connected_to: string[];
}

interface ExpeditionSession {
  id: string;
  player_id: string;
  floor: number;
  current_hp: number;
  max_hp: number;
  current_node_id: string | null;
  nodes: ExpeditionNode[];
  loot_bag: {
    gold: number;
    xp: number;
    items_found: string[];
    relics_found: string[];
  };
  status: 'ACTIVE' | 'RETREATED' | 'DEFEATED' | 'VICTORIOUS';
  buff_damage_pct: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerLevel: number;
  playerClass?: string;
  playerName?: string;
  onRefreshPlayer: () => void;
}

export const ExpeditionsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  playerLevel,
  playerClass = 'WARRIOR',
  playerName = 'Aventurero',
  onRefreshPlayer
}) => {
  const [activeTab, setActiveTab] = useState<'AUTO_BATTLER' | 'NODE_MAP'>('AUTO_BATTLER');
  const [session, setSession] = useState<ExpeditionSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/player/expedition/status');
      if (res.data.success && res.data.active) {
        setSession(res.data.session);
      } else {
        setSession(null);
      }
    } catch (e) {
      console.error('Error cargando expedición', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExpedition = async () => {
    setActionLoading(true);
    setStatusMessage(null);
    setLastActionResult(null);
    try {
      sfx.playAudio('click');
      sfx.haptic([40, 60]);
      const res = await api.post('/player/expedition/start');
      if (res.data.success) {
        setSession(res.data.session);
        sfx.playAudio('sword');
      }
    } catch (e: any) {
      setStatusMessage(e.response?.data?.error || 'Error al iniciar expedición.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChooseNode = async (nodeId: string) => {
    if (actionLoading) return;
    setActionLoading(true);
    setStatusMessage(null);
    setLastActionResult(null);
    try {
      sfx.playAudio('click');
      const res = await api.post('/player/expedition/node/choose', { nodeId });
      if (res.data.success) {
        setSession(res.data.session);
      }
    } catch (e: any) {
      setStatusMessage(e.response?.data?.error || 'Error al entrar al nodo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNodeAction = async (actionType: string, choiceId?: string) => {
    if (actionLoading || !session) return;
    setActionLoading(true);
    setStatusMessage(null);
    try {
      sfx.playAudio('dice');
      sfx.haptic([30, 40]);
      const res = await api.post('/player/expedition/node/action', {
        actionType,
        choiceId
      });

      if (res.data.success) {
        setLastActionResult(res.data.actionResult);
        setSession(res.data.session);

        if (res.data.actionResult.isCrit) {
          sfx.playAudio('crit');
        } else if (res.data.actionResult.status === 'DEFEATED') {
          sfx.playAudio('fumble');
          onRefreshPlayer();
        } else if (res.data.actionResult.status === 'VICTORIOUS') {
          sfx.playAudio('levelup');
          sfx.playAudio('coins');
          onRefreshPlayer();
        } else {
          sfx.playAudio('sword');
        }
      }
    } catch (e: any) {
      setStatusMessage(e.response?.data?.error || 'Error al realizar acción.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetreat = async () => {
    if (actionLoading || !session) return;
    setActionLoading(true);
    try {
      sfx.playAudio('coins');
      sfx.haptic([50, 70]);
      const res = await api.post('/player/expedition/retreat');
      if (res.data.success) {
        setStatusMessage(res.data.message);
        setSession(null);
        onRefreshPlayer();
      }
    } catch (e: any) {
      setStatusMessage(e.response?.data?.error || 'Error al retirarse.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentNode = session?.nodes.find((n) => n.id === session.current_node_id);
  const hpPercent = session ? Math.max(0, Math.min(100, Math.round((session.current_hp / session.max_hp) * 100))) : 100;
  const steps = [0, 1, 2, 3].map((st) => session?.nodes.filter((n) => n.step === st) || []);

  const isNodeAccessible = (node: ExpeditionNode) => {
    if (!session) return false;
    if (node.is_cleared) return false;
    if (!session.current_node_id) {
      return node.step === 0;
    }
    const prevNode = session.nodes.find((n) => n.id === session.current_node_id);
    if (!prevNode) return false;
    if (!prevNode.is_cleared) {
      return node.id === prevNode.id;
    }
    return prevNode.connected_to.includes(node.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-surface-card border-2 border-primary/60 w-full max-w-3xl rounded-3xl shadow-[0_0_60px_rgba(251,191,36,0.25)] flex flex-col max-h-[94vh] overflow-hidden">
        {/* Cabecera Principal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-border/80 bg-gradient-to-r from-surface to-surface-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary border border-primary/50 shadow-[0_0_15px_var(--accent-glow)]">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Catacumbas Olvidadas</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  Auto-Battler & Incursión
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-serif">
                Combate continuo en carril horizontal, oleadas de monstruos y jefes de zona
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.click();
              onClose();
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface border border-transparent hover:border-surface-border transition-all cursor-pointer"
            title="Cerrar Catacumbas (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Modalidad */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-surface-border/60 bg-black/30">
          <button
            onClick={() => {
              sfx.click();
              setActiveTab('AUTO_BATTLER');
            }}
            className={`pb-2.5 px-3 text-xs font-heading font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'AUTO_BATTLER'
                ? 'border-primary text-primary font-black shadow-sm'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Carril de Combate Continuo (Auto-Battler)</span>
          </button>

          <button
            onClick={() => {
              sfx.click();
              setActiveTab('NODE_MAP');
            }}
            className={`pb-2.5 px-3 text-xs font-heading font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'NODE_MAP'
                ? 'border-primary text-primary font-black shadow-sm'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Cripta Ramificada (Rogue-Lite)</span>
          </button>
        </div>

        {/* Área de Contenido Principal */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* ========================================================================= */}
          {/* MODO 1: AUTO-BATTLER EN CARRIL HORIZONTAL (CORREDOR DE COMBATE PASIVO + ACTIVO) */}
          {/* ========================================================================= */}
          {activeTab === 'AUTO_BATTLER' && (
            <CatacombsAutoBattler
              playerClass={playerClass}
              playerName={playerName}
              playerLevel={playerLevel}
              onRefreshPlayer={onRefreshPlayer}
            />
          )}

          {/* ========================================================================= */}
          {/* MODO 2: MAPA DE NODOS RAMIFICADO (ROGUE-LITE ANCESTRAL) */}
          {/* ========================================================================= */}
          {activeTab === 'NODE_MAP' && (
            <div className="space-y-4 animate-fadeIn">
              {loading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : !session || session.status !== 'ACTIVE' ? (
                /* Pantalla inicial del mapa */
                <div className="text-center py-8 px-4 space-y-4">
                  <div className="text-6xl select-none animate-bounce">🕯️</div>
                  <h3 className="font-cinzel text-xl sm:text-2xl font-black text-white">
                    Las Puertas de la Cripta Subterránea
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 font-serif max-w-md mx-auto">
                    Navega pasajes ramificados, enfréntate a monstruos en combates con tiradas D20 y acumula tesoros en tu saco de botín.
                  </p>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/30 max-w-md mx-auto text-left space-y-1 text-xs">
                    <div className="text-amber-300 font-heading font-bold flex items-center gap-1.5">
                      <span>⚖️ Regla de Riesgo vs. Recompensa:</span>
                    </div>
                    <ul className="text-gray-300 text-[11px] font-sans list-disc list-inside space-y-0.5">
                      <li>Puedes <strong>Retirarte</strong> para asegurar el <strong>100%</strong> del botín.</li>
                      <li>Si tu salud cae a 0 HP en la cripta, <strong>perderás el 60%</strong> de lo acumulado.</li>
                    </ul>
                  </div>

                  {statusMessage && (
                    <div className="p-2.5 rounded-xl bg-primary/20 border border-primary text-amber-300 text-xs font-bold font-heading">
                      {statusMessage}
                    </div>
                  )}

                  <div>
                    <button
                      onClick={handleStartExpedition}
                      disabled={actionLoading}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-heading font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                    >
                      <Compass className="w-5 h-5" />
                      <span>{actionLoading ? 'Abriendo portón...' : 'Descender a la Cripta'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Nodos activos */
                <div className="space-y-4">
                  {/* HUD Superior */}
                  <div className="p-3.5 rounded-2xl bg-surface border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                    <div className="space-y-1 w-full sm:w-1/2">
                      <div className="flex justify-between text-xs font-mono font-bold">
                        <span className="text-red-300 flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                          <span>Salud de Expedición</span>
                        </span>
                        <span className={session.current_hp < session.max_hp * 0.3 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}>
                          {session.current_hp} / {session.max_hp} HP
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-surface-border">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            hpPercent > 50
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : hpPercent > 25
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : 'bg-gradient-to-r from-red-600 to-crimson animate-pulse'
                          }`}
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <div className="p-2 rounded-xl bg-black/50 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-2">
                        <span className="text-amber-400">🪙 {session.loot_bag.gold}</span>
                        <span className="text-cyan-400">⭐ {session.loot_bag.xp} XP</span>
                      </div>

                      <button
                        onClick={handleRetreat}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white font-heading font-bold text-xs uppercase tracking-wider shadow flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        title="Retirarse a la taberna asegurando el 100% de lo acumulado"
                      >
                        <DoorOpen className="w-3.5 h-3.5" />
                        <span>Retirarse</span>
                      </button>
                    </div>
                  </div>

                  {/* Mapa de Nodos */}
                  <div className="space-y-2 p-3 bg-black/40 rounded-2xl border border-surface-border">
                    <div className="text-[11px] font-heading font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                      <span>🗺️ Pasajes de la Cripta (Piso {session.floor})</span>
                      {session.buff_damage_pct > 0 && (
                        <span className="text-primary font-mono text-[10px] animate-pulse">
                          ⚔️ Filo Rúnico (+{session.buff_damage_pct}% daño)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {steps.map((nodesInStep, stepIdx) => (
                        <div key={stepIdx} className="flex flex-col gap-2 items-center">
                          <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">
                            {stepIdx === 3 ? 'Jefe' : `Paso ${stepIdx + 1}`}
                          </span>

                          {nodesInStep.map((node) => {
                            const isCurrent = session.current_node_id === node.id;
                            const isAccessible = isNodeAccessible(node);

                            return (
                              <button
                                key={node.id}
                                onClick={() => isAccessible && handleChooseNode(node.id)}
                                disabled={!isAccessible || actionLoading}
                                className={`w-full p-2.5 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                                  node.is_cleared
                                    ? 'bg-surface/40 border-gray-800 text-gray-600 opacity-60'
                                    : isCurrent
                                    ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_var(--accent-glow)] scale-105'
                                    : isAccessible
                                    ? 'bg-surface hover:bg-surface-card border-amber-500/50 text-amber-300 animate-pulse'
                                    : 'bg-black/50 border-gray-800 text-gray-600 cursor-not-allowed'
                                }`}
                              >
                                <span className="text-2xl">{node.icon}</span>
                                <span className="text-[10px] font-heading font-bold truncate max-w-full mt-1">
                                  {node.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Acciones de Nodo */}
                  {currentNode && !currentNode.is_cleared && (
                    <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{currentNode.icon}</span>
                        <div>
                          <h4 className="font-heading font-bold text-sm text-white">{currentNode.title}</h4>
                          <p className="text-xs text-gray-400 font-sans">{currentNode.description}</p>
                        </div>
                      </div>

                      {currentNode.type === 'COMBAT' || currentNode.type === 'ELITE' || currentNode.type === 'BOSS' ? (
                        <button
                          onClick={() => handleNodeAction('ATTACK')}
                          disabled={actionLoading}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-crimson text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95"
                        >
                          <Swords className="w-4 h-4" />
                          <span>{actionLoading ? 'Combatiendo...' : 'Luchar contra el Monstruo'}</span>
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
