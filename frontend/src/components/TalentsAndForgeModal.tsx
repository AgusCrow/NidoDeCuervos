import React, { useState, useEffect } from 'react';
import { X, Zap, Shield, Swords, Coins, Hammer, CheckCircle2, AlertTriangle, RotateCcw, Lock, Sparkles, Check } from 'lucide-react';
import api from '../services/api';
import { sfx } from '../services/sfx';

interface ClassTalentNode {
  id: string;
  class_name: string;
  branch: string;
  tier: number;
  name: string;
  description: string;
  icon: string;
  max_points: number;
  stat_bonus: {
    atk?: number;
    def?: number;
    crit_pct?: number;
    d20_bonus?: number;
    gold_pct?: number;
    xp_pct?: number;
    raid_dmg_pct?: number;
    shop_discount_pct?: number;
  };
}

interface ClassBranch {
  name: string;
  description: string;
  nodes: ClassTalentNode[];
}

interface ClassTree {
  class_name: 'WARRIOR' | 'MAGE' | 'ROGUE' | 'BARD';
  title: string;
  branches: ClassBranch[];
}

interface PlayerTalent {
  id: string;
  player_id: string;
  branch: string;
  tier: number;
  points: number;
  talent_id?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerLevel: number;
  playerGold: number;
  playerClass?: string;
  inventory?: any[];
  onRefreshPlayer: () => void;
}

export const TalentsAndForgeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  playerLevel,
  playerGold,
  playerClass = 'WARRIOR',
  inventory = [],
  onRefreshPlayer
}) => {
  const [activeTab, setActiveTab] = useState<'TALENTS' | 'FORGE'>('TALENTS');
  const [forgeSubTab, setForgeSubTab] = useState<'REFINE' | 'SALVAGE' | 'SETS' | 'RUNES'>('REFINE');
  const [classTree, setClassTree] = useState<ClassTree | null>(null);
  const [talents, setTalents] = useState<PlayerTalent[]>([]);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [spentPoints, setSpentPoints] = useState(0);
  const [selectedRune, setSelectedRune] = useState('FIRE');
  const [selectedRefineItem, setSelectedRefineItem] = useState<any | null>(null);
  const [selectedSalvageItem, setSelectedSalvageItem] = useState<any | null>(null);
  const [setsData, setSetsData] = useState<{ activeSets: any[]; bonuses: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTalents();
      fetchSets();
    }
  }, [isOpen]);

  const fetchTalents = async () => {
    try {
      const res = await api.get('/player/talents');
      if (res.data.success) {
        setClassTree(res.data.classTree);
        setTalents(res.data.talents || []);
        setAvailablePoints(res.data.availablePoints ?? 0);
        setSpentPoints(res.data.spentPoints ?? 0);
      }
    } catch (e) {
      console.error('Error cargando árbol de talentos', e);
    }
  };

  const handleAllocate = async (node: ClassTalentNode) => {
    if (availablePoints <= 0 || loading) return;
    setLoading(true);
    try {
      const res = await api.post('/player/talents/allocate', { talent_id: node.id });
      if (res.data.success) {
        sfx.playAudio('levelup');
        sfx.haptic([30, 40]);
        setStatusMsg({ type: 'ok', text: res.data.message || `¡Aprendiste ${node.name}!` });
        await fetchTalents();
        onRefreshPlayer();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || 'Error asignando talento' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post('/player/talents/reset', {});
      if (res.data.success) {
        sfx.playAudio('coins');
        sfx.haptic([20, 20]);
        setStatusMsg({ type: 'ok', text: res.data.message || '¡Talentos reestablecidos!' });
        await fetchTalents();
        onRefreshPlayer();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || 'Error al reestablecer talentos' });
    } finally {
      setLoading(false);
    }
  };

  const handleForge = async () => {
    if (playerGold < 25 || loading) return;
    setLoading(true);
    try {
      const res = await api.post('/player/forge/runic', { rune_type: selectedRune });
      if (res.data.success) {
        sfx.playAudio('coins');
        sfx.playAudio('equip');
        sfx.haptic([50, 40, 60]);
        setStatusMsg({ type: 'ok', text: res.data.message });
        onRefreshPlayer();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || 'Error en la Forja' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSets = async () => {
    try {
      const res = await api.get('/player/sets/active');
      if (res.data.success) {
        setSetsData({
          activeSets: res.data.activeSets || [],
          bonuses: res.data.bonuses || {}
        });
      }
    } catch (e) {
      console.error('Error cargando sets activos', e);
    }
  };

  const handleRefine = async () => {
    if (!selectedRefineItem || loading) return;
    const invId = selectedRefineItem.inventory_id || selectedRefineItem.id;
    setLoading(true);
    try {
      const res = await api.post('/player/forge/refine', { inventoryId: invId });
      if (res.data.success) {
        if (res.data.isUpgraded) {
          sfx.playAudio('levelup');
          sfx.playAudio('coins');
          sfx.haptic([40, 50, 60]);
        } else {
          sfx.playAudio('fumble');
          sfx.haptic([30]);
        }
        setStatusMsg({ type: 'ok', text: res.data.message });
        onRefreshPlayer();
        fetchSets();
        if (res.data.item) {
          setSelectedRefineItem((prev: any) => ({ ...prev, ...res.data.item, refine_level: res.data.refineLevel }));
        }
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || 'Error en el refinamiento' });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvage = async () => {
    if (!selectedSalvageItem || loading) return;
    const invId = selectedSalvageItem.inventory_id || selectedSalvageItem.id;
    setLoading(true);
    try {
      const res = await api.post('/player/forge/salvage', { inventoryId: invId });
      if (res.data.success) {
        sfx.playAudio('coins');
        sfx.haptic([30, 40]);
        setStatusMsg({ type: 'ok', text: res.data.message });
        setSelectedSalvageItem(null);
        onRefreshPlayer();
        fetchSets();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || 'Error al desguazar el ítem' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isNodeLearned = (nodeId: string) => {
    return talents.some((t) => t.talent_id === nodeId && t.points > 0);
  };

  const getBranchPoints = (branch: ClassBranch) => {
    return talents
      .filter((t) => branch.nodes.some((n) => n.id === t.talent_id))
      .reduce((sum, t) => sum + (t.points || 1), 0);
  };

  const isNodeUnlockable = (node: ClassTalentNode, branch: ClassBranch) => {
    if (isNodeLearned(node.id)) return false;
    if (availablePoints <= 0) return false;
    const pts = getBranchPoints(branch);
    if (node.tier === 1) return true;
    if (node.tier === 2) return pts >= 1;
    if (node.tier === 3) return pts >= 2;
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-card border-2 border-purple-500/70 w-full max-w-3xl rounded-2xl shadow-[0_0_60px_rgba(168,85,247,0.3)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-purple-500/30 bg-gradient-to-r from-purple-950/60 to-surface">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-purple-300 flex items-center gap-2">
                Árbol de Talentos: {classTree?.title || `Senda de ${playerClass}`}
              </h2>
              <p className="text-xs text-gray-400 font-serif">Poderes pasivos y mejoras permanentes por nivel</p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playAudio('click');
              onClose();
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface border border-transparent hover:border-border transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/50 bg-black/20 p-2 gap-2">
          <button
            onClick={() => {
              sfx.haptic([15]);
              setActiveTab('TALENTS');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'TALENTS' ? 'bg-purple-600 text-white shadow-md font-black' : 'text-gray-400 hover:text-white hover:bg-surface'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Árbol de Talentos ({availablePoints} disponibles)</span>
          </button>
          <button
            onClick={() => {
              sfx.haptic([15]);
              setActiveTab('FORGE');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'FORGE' ? 'bg-amber-500 text-black shadow-md font-black' : 'text-gray-400 hover:text-white hover:bg-surface'
            }`}
          >
            <Hammer className="w-4 h-4" />
            <span>La Forja de Runas</span>
          </button>
        </div>

        {/* Status Msg */}
        {statusMsg && (
          <div
            className={`mx-4 mt-3 p-3 rounded-xl flex items-center justify-between text-xs font-heading ${
              statusMsg.type === 'ok' ? 'bg-emerald/20 text-emerald border border-emerald/40' : 'bg-crimson/20 text-crimson border border-crimson/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-gray-400 hover:text-white ml-2 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'TALENTS' && (
            <div className="space-y-4">
              {/* Points Summary & Respec Bar */}
              <div className="p-3.5 bg-gradient-to-r from-purple-950/40 via-surface to-surface border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-black text-base shadow">
                    ⭐
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-sm text-white">
                        Puntos de Talento: <strong className="text-purple-300">{availablePoints} Disponibles</strong>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                        Nivel {playerLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-sans">
                      Asignados: <span className="text-purple-300 font-bold">{spentPoints}</span> / {playerLevel} puntos totales
                    </p>
                  </div>
                </div>

                {spentPoints > 0 && (
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-xl bg-surface border border-purple-500/40 hover:bg-purple-950/40 text-purple-300 text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-105"
                    title="Reiniciar y recuperar todos los puntos de talento"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reiniciar Puntos (Respec)</span>
                  </button>
                )}
              </div>

              {/* 3 Class Branches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {classTree?.branches.map((branch, bIdx) => {
                  const branchPts = getBranchPoints(branch);

                  return (
                    <div
                      key={branch.name}
                      className="p-4 rounded-2xl bg-surface/90 border border-surface-border flex flex-col justify-between space-y-3 shadow-sm hover:border-purple-500/40 transition-all"
                    >
                      {/* Branch Header */}
                      <div className="space-y-1 pb-1 border-b border-surface-border/60">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-bold text-white text-xs flex items-center gap-1.5">
                            <span className="text-primary font-mono">{bIdx + 1}.</span> {branch.name}
                          </h4>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            {branchPts}/3 pts
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-sans line-clamp-2">{branch.description}</p>
                      </div>

                      {/* Tier Nodes */}
                      <div className="space-y-2.5 flex-1">
                        {branch.nodes.map((node) => {
                          const learned = isNodeLearned(node.id);
                          const canUnlock = isNodeUnlockable(node, branch);

                          return (
                            <div
                              key={node.id}
                              className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-2 ${
                                learned
                                  ? 'bg-purple-950/40 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                                  : canUnlock
                                  ? 'bg-surface-card border-purple-400/50 hover:border-purple-400'
                                  : 'bg-surface/40 border-surface-border/50 opacity-60'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-xl p-1 rounded-lg bg-black/40 shrink-0 shadow">
                                  {node.icon}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="font-heading font-bold text-white text-[11px] truncate">
                                      {node.name}
                                    </h5>
                                    <span className="text-[9px] font-mono font-bold text-gray-400 shrink-0">
                                      Tier {node.tier}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-gray-300 font-sans mt-0.5 leading-snug">
                                    {node.description}
                                  </p>
                                </div>
                              </div>

                              {/* Node Action */}
                              <div>
                                {learned ? (
                                  <div className="w-full py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-[10px] font-heading font-bold text-emerald-300 flex items-center justify-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Dominado</span>
                                  </div>
                                ) : canUnlock ? (
                                  <button
                                    onClick={() => handleAllocate(node)}
                                    disabled={loading}
                                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-heading font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-300" />
                                    <span>Aprender (1 Pto)</span>
                                  </button>
                                ) : (
                                  <div className="w-full py-1 bg-surface border border-surface-border/50 rounded-lg text-[10px] font-mono text-gray-500 flex items-center justify-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    <span>Req. Tier {node.tier === 2 ? '1 pto en rama' : '2 ptos en rama'}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'FORGE' && (
            <div className="space-y-4">
              {/* Forge Sub-Tabs Navigation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl border border-surface-border">
                <button
                  type="button"
                  onClick={() => {
                    sfx.haptic([10]);
                    setForgeSubTab('REFINE');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    forgeSubTab === 'REFINE' ? 'bg-amber-500 text-black shadow font-black' : 'text-gray-400 hover:text-white hover:bg-surface'
                  }`}
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span>Refinar (+10)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.haptic([10]);
                    setForgeSubTab('SALVAGE');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    forgeSubTab === 'SALVAGE' ? 'bg-emerald-600 text-white shadow font-black' : 'text-gray-400 hover:text-white hover:bg-surface'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Desguazar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.haptic([10]);
                    setForgeSubTab('SETS');
                    fetchSets();
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    forgeSubTab === 'SETS' ? 'bg-purple-600 text-white shadow font-black' : 'text-gray-400 hover:text-white hover:bg-surface'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Sets de Bosses</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.haptic([10]);
                    setForgeSubTab('RUNES');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-heading font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    forgeSubTab === 'RUNES' ? 'bg-blue-600 text-white shadow font-black' : 'text-gray-400 hover:text-white hover:bg-surface'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Runas</span>
                </button>
              </div>

              {/* SUBTAB 1: REFINAMIENTO (+1 A +10) */}
              {forgeSubTab === 'REFINE' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                    💡 <strong>Yunque de Refinamiento:</strong> Eleva el poder de tus armas y armaduras hasta +10. Aumenta Atk, Def y daño contra Raid Bosses. (+1 a +4: 100% de éxito, +5 a +7: 75%, +8 a +10: 50%).
                  </div>

                  {/* Item Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-heading font-bold text-gray-300">
                      Selecciona una pieza de equipamiento para refinar:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {inventory
                        .filter((inv) => inv.slot !== 'CONSUMABLE')
                        .map((inv) => {
                          const isSel = (selectedRefineItem?.inventory_id || selectedRefineItem?.id) === (inv.inventory_id || inv.id);
                          return (
                            <div
                              key={inv.inventory_id || inv.id}
                              onClick={() => setSelectedRefineItem(inv)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isSel
                                  ? 'bg-amber-500/20 border-amber-500 shadow-md'
                                  : 'bg-surface/70 border-surface-border hover:border-amber-500/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xl shrink-0">{inv.icon || '⚔️'}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-heading font-bold text-white truncate flex items-center gap-1.5">
                                    <span>{inv.name}</span>
                                    {(inv.refine_level || 0) > 0 && (
                                      <span className="text-amber-400 font-mono font-black text-[11px]">
                                        +{inv.refine_level}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono">
                                    {inv.slot} • iLvl {inv.item_level || 1} • {inv.is_equipped ? '🛡️ Equipado' : 'Mochila'}
                                  </div>
                                </div>
                              </div>
                              {isSel && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Refine Workbench details */}
                  {selectedRefineItem ? (
                    <div className="p-4 bg-gradient-to-b from-amber-950/30 to-surface border border-amber-500/40 rounded-2xl space-y-3 shadow-inner">
                      <div className="flex items-center justify-between border-b border-surface-border/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{selectedRefineItem.icon || '⚔️'}</span>
                          <div>
                            <h4 className="font-heading font-bold text-white text-sm">
                              {selectedRefineItem.name}{' '}
                              <strong className="text-amber-400">+{selectedRefineItem.refine_level || 0}</strong>
                            </h4>
                            <p className="text-[10px] text-gray-400 font-mono">
                              Rareza: {selectedRefineItem.rarity || 'COMMON'} | Ranura: {selectedRefineItem.slot}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 font-serif">Nivel Objetivo</span>
                          <div className="font-heading font-black text-amber-300 text-sm">
                            {(selectedRefineItem.refine_level || 0) >= 10 ? '¡MÁXIMO (+10)!' : `➔ +${(selectedRefineItem.refine_level || 0) + 1}`}
                          </div>
                        </div>
                      </div>

                      {/* Stats Upgrade Preview */}
                      {(selectedRefineItem.refine_level || 0) < 10 ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <div className="p-2 bg-black/40 rounded-xl border border-surface-border">
                              <span className="text-gray-400 text-[10px]">Costo de Temple:</span>
                              <div className="font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                                <Coins className="w-3.5 h-3.5" />
                                <span>{20 + ((selectedRefineItem.refine_level || 0) * 18)} 🪙 de Oro</span>
                              </div>
                            </div>
                            <div className="p-2 bg-black/40 rounded-xl border border-surface-border">
                              <span className="text-gray-400 text-[10px]">Probabilidad de Éxito:</span>
                              <div className="font-bold text-emerald-400 mt-0.5">
                                {(selectedRefineItem.refine_level || 0) >= 7 ? '50% (Riesgoso)' : (selectedRefineItem.refine_level || 0) >= 4 ? '75% (Seguro)' : '100% (Garantizado)'}
                              </div>
                            </div>
                          </div>

                          <div className="text-[11px] text-gray-300 bg-black/20 p-2 rounded-xl border border-surface-border space-y-0.5">
                            <span className="text-amber-400 font-heading font-bold">Ganancia al mejorar:</span>
                            <div>• {selectedRefineItem.slot === 'WEAPON' ? '+3 Ataque y +2% Daño a Bosses' : selectedRefineItem.slot === 'ARMOR' ? '+3 Defensa' : '+1 Ataque y +1 Defensa'}</div>
                          </div>

                          <button
                            onClick={handleRefine}
                            disabled={loading || playerGold < (20 + ((selectedRefineItem.refine_level || 0) * 18))}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-heading font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <Hammer className="w-4 h-4" />
                            <span>{loading ? 'Templando en el Yunque...' : `Refinar por ${20 + ((selectedRefineItem.refine_level || 0) * 18)} 🪙`}</span>
                          </button>
                        </>
                      ) : (
                        <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-xl text-center text-xs font-heading font-bold text-amber-300">
                          🌟 ¡Esta reliquia ha alcanzado la perfección suprema del refinamiento (+10)!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-surface-border rounded-2xl text-center text-xs text-gray-500 font-serif">
                      Selecciona arriba un ítem de tu inventario para colocarlo sobre el yunque.
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 2: DESGUACE (SALVAGE) */}
              {forgeSubTab === 'SALVAGE' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200">
                    ♻️ <strong>Desguace Arcano:</strong> Desarma piezas de equipamiento que no uses para recuperar oro y recolectar valiosos materiales de artesanía (Polvo Arcano, Esencias Raras y Fragmentos Míticos).
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-heading font-bold text-gray-300">
                      Selecciona un ítem de tu mochila para desguazar:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {inventory
                        .filter((inv) => !inv.is_equipped && inv.slot !== 'CONSUMABLE')
                        .map((inv) => {
                          const isSel = (selectedSalvageItem?.inventory_id || selectedSalvageItem?.id) === (inv.inventory_id || inv.id);
                          return (
                            <div
                              key={inv.inventory_id || inv.id}
                              onClick={() => setSelectedSalvageItem(inv)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                isSel
                                  ? 'bg-emerald-500/20 border-emerald-500 shadow-md'
                                  : 'bg-surface/70 border-surface-border hover:border-emerald-500/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xl shrink-0">{inv.icon || '🛡️'}</span>
                                <div className="min-w-0">
                                  <div className="text-xs font-heading font-bold text-white truncate">
                                    {inv.name}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono">
                                    {inv.rarity} • iLvl {inv.item_level || 1}
                                  </div>
                                </div>
                              </div>
                              {isSel && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {selectedSalvageItem ? (
                    <div className="p-4 bg-gradient-to-b from-emerald-950/30 to-surface border border-emerald-500/40 rounded-2xl space-y-3 shadow-inner">
                      <div className="flex items-center justify-between border-b border-surface-border/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{selectedSalvageItem.icon || '🛡️'}</span>
                          <div>
                            <h4 className="font-heading font-bold text-white text-sm">{selectedSalvageItem.name}</h4>
                            <p className="text-[10px] text-gray-400 font-mono">
                              Rareza: {selectedSalvageItem.rarity || 'COMMON'} | Nivel de Ítem: {selectedSalvageItem.item_level || 1}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 bg-black/40 rounded-xl border border-surface-border text-xs space-y-1.5">
                        <span className="text-emerald-400 font-heading font-bold text-[11px]">Materiales estimados al desguazar:</span>
                        <div className="flex flex-wrap gap-2 text-gray-300 font-mono text-[11px]">
                          <span className="px-2 py-0.5 bg-surface rounded-lg border border-surface-border">
                            🪙 +{selectedSalvageItem.sell_value || Math.floor((selectedSalvageItem.gold_cost || 20) / 2)} Oro
                          </span>
                          <span className="px-2 py-0.5 bg-surface rounded-lg border border-surface-border">
                            ✨ Polvo Arcano x{Math.max(1, Math.floor((selectedSalvageItem.item_level || 1) / 2) + 1)}
                          </span>
                          {(selectedSalvageItem.rarity === 'RARE' || selectedSalvageItem.rarity === 'EPIC' || selectedSalvageItem.rarity === 'LEGENDARY' || selectedSalvageItem.rarity === 'MYTHIC') && (
                            <span className="px-2 py-0.5 bg-purple-950/50 text-purple-300 rounded-lg border border-purple-500/40">
                              🔮 Esencia Rara x1
                            </span>
                          )}
                          {(selectedSalvageItem.rarity === 'EPIC' || selectedSalvageItem.rarity === 'LEGENDARY' || selectedSalvageItem.rarity === 'MYTHIC') && (
                            <span className="px-2 py-0.5 bg-amber-950/50 text-amber-300 rounded-lg border border-amber-500/40">
                              💎 Esencia Épica x1
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleSalvage}
                        disabled={loading}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{loading ? 'Desguazando pieza...' : 'Desguazar y Recuperar Materiales'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-surface-border rounded-2xl text-center text-xs text-gray-500 font-serif">
                      Selecciona arriba un ítem desequipado para reciclar sus materiales.
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 3: SETS DE BOSSES */}
              {forgeSubTab === 'SETS' && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-200 flex items-center justify-between">
                    <div>
                      🛡️ <strong>Conjuntos Legendarios de Bosses:</strong> Equipa 2 o 4 piezas de la misma afinidad elemental para activar bonificaciones de asedio colosales.
                    </div>
                    <button
                      onClick={fetchSets}
                      className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 rounded-lg text-[10px] font-heading font-bold text-purple-200 cursor-pointer"
                    >
                      Actualizar
                    </button>
                  </div>

                  {/* Sets Overview Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      {
                        code: 'SET_IGNIS',
                        name: 'Set de Obsidiana Ígnea',
                        boss: 'Ignis el Primordial',
                        element: 'FUEGO',
                        color: 'from-orange-950/40 border-orange-500/40 text-orange-300',
                        icon: '🐉',
                        bonus2: '+15% Daño a Raid Bosses y +10 de Ataque',
                        bonus4: 'Aura Ígnea: Tiradas D20 >= 18 infligen quemadura cataclísmica (+35% daño)'
                      },
                      {
                        code: 'SET_MALAKOR',
                        name: 'Set del Soberano de la Plaga',
                        boss: 'Malakor el Portador',
                        element: 'VENENO',
                        color: 'from-emerald-950/40 border-emerald-500/40 text-emerald-300',
                        icon: '☠️',
                        bonus2: '+15 de Defensa y +20% de Oro obtenido',
                        bonus4: 'Baluarte Tóxico: Reduce el impacto de los contragolpes de Bosses un 35%'
                      },
                      {
                        code: 'SET_AURELIUS',
                        name: 'Set del Titán de Runas',
                        boss: 'Aurelius el Rúnico',
                        element: 'TIERRA',
                        color: 'from-amber-950/40 border-amber-500/40 text-amber-300',
                        icon: '🗿',
                        bonus2: '+1 permanente a todas las tiradas de dados D20',
                        bonus4: 'Coraza Telúrica: Las pifias (D20 = 1) otorgan escudo protector'
                      },
                      {
                        code: 'SET_KAELITH',
                        name: 'Set de la Reina Glacial',
                        boss: 'Kaelith la Guardiana',
                        element: 'HIELO',
                        color: 'from-cyan-950/40 border-cyan-500/40 text-cyan-300',
                        icon: '❄️',
                        bonus2: '+12% Probabilidad Crítica y +10% XP',
                        bonus4: 'Cero Absoluto: Impactos críticos enfrían al Boss duplicando el siguiente ataque de la party'
                      }
                    ].map((setDef) => {
                      const activeInfo = (setsData?.activeSets || []).find((s: any) => s.setCode === setDef.code);
                      const pieces = activeInfo?.equippedPieces || 0;
                      const has2 = pieces >= 2;
                      const has4 = pieces >= 4;

                      return (
                        <div
                          key={setDef.code}
                          className={`p-3.5 rounded-2xl bg-gradient-to-b ${setDef.color} bg-surface border space-y-2.5 shadow-md`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{setDef.icon}</span>
                              <div>
                                <h4 className="font-heading font-bold text-xs text-white">{setDef.name}</h4>
                                <p className="text-[10px] text-gray-400 font-sans">Afinidad: {setDef.element} ({setDef.boss})</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/40 border border-surface-border text-white">
                              {pieces}/4 Piezas
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[11px] font-sans">
                            <div className={`p-2 rounded-xl border flex items-start gap-2 ${has2 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold' : 'bg-black/30 border-surface-border/50 text-gray-400'}`}>
                              <span className="font-mono font-black text-xs shrink-0">{has2 ? '✅' : '⚪'} (2P):</span>
                              <span>{setDef.bonus2}</span>
                            </div>
                            <div className={`p-2 rounded-xl border flex items-start gap-2 ${has4 ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 font-bold' : 'bg-black/30 border-surface-border/50 text-gray-400'}`}>
                              <span className="font-mono font-black text-xs shrink-0">{has4 ? '✅' : '⚪'} (4P):</span>
                              <span>{setDef.bonus4}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBTAB 4: RUNAS SAGRADAS */}
              {forgeSubTab === 'RUNES' && (
                <div className="space-y-4 text-center py-2">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center mx-auto text-3xl">
                    🔮
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-white">Yunque Sagrado de las Runas</h3>
                    <p className="text-xs text-gray-400 font-serif max-w-sm mx-auto">
                      Imbuye tu equipamiento activo con esencias místicas por un costo de 25 🪙 de oro.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedRune('FIRE')}
                      className={`p-3 rounded-xl border text-xs font-heading font-bold transition-all cursor-pointer ${
                        selectedRune === 'FIRE' ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md' : 'bg-surface border-surface-border text-gray-400'
                      }`}
                    >
                      🔥 Runa de Fuego (+Ataque)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRune('PROTECTION')}
                      className={`p-3 rounded-xl border text-xs font-heading font-bold transition-all cursor-pointer ${
                        selectedRune === 'PROTECTION' ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md' : 'bg-surface border-surface-border text-gray-400'
                      }`}
                    >
                      🛡️ Runa de Escudo (+Defensa)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRune('FORTUNE')}
                      className={`p-3 rounded-xl border text-xs font-heading font-bold transition-all cursor-pointer ${
                        selectedRune === 'FORTUNE' ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md' : 'bg-surface border-surface-border text-gray-400'
                      }`}
                    >
                      🪙 Runa de Oro (+Fortuna)
                    </button>
                  </div>

                  <button
                    onClick={handleForge}
                    disabled={playerGold < 25 || loading}
                    className="w-full max-w-md mx-auto py-3 bg-gradient-to-r from-amber-500 to-primary text-black font-heading font-black text-sm rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-4"
                  >
                    <Hammer className="w-4 h-4" />
                    <span>Forjar Runa (Costo: 25 Oro)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
