import React, { useState, useEffect } from 'react';
import { X, Award, Trophy, Sparkles, CheckCircle, Lock, RefreshCw, Zap } from 'lucide-react';
import api from '../services/api';
import { sfx } from '../services/sfx';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'COMBAT' | 'FORGE' | 'EXPEDITIONS' | 'GUILD';
  icon: string;
  req_target: number;
  reward_xp: number;
  reward_gold: number;
  unlocked_title_id?: string;
  currentProgress: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

interface TitleDef {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  perk_description?: string;
}

interface UnlockedTitle {
  id: string;
  title_id: string;
  unlocked_at: string;
  titleDef: TitleDef;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefreshPlayer: () => void;
}

export const AchievementsAndTitlesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRefreshPlayer
}) => {
  const [tab, setTab] = useState<'ACHIEVEMENTS' | 'TITLES'>('ACHIEVEMENTS');
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedTitles, setUnlockedTitles] = useState<UnlockedTitle[]>([]);
  const [catalogTitles, setCatalogTitles] = useState<TitleDef[]>([]);
  const [equippedTitle, setEquippedTitle] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/player/achievements');
      if (res.data.success) {
        setAchievements(res.data.achievements || []);
        setUnlockedTitles(res.data.unlockedTitles || []);
        setCatalogTitles(res.data.allTitlesCatalog || []);
        setEquippedTitle(res.data.equippedTitle || null);
      }
    } catch (e) {
      console.error('Error cargando logros', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAchievement = async (achievementId: string) => {
    try {
      sfx.playAudio('coins');
      sfx.haptic([50, 70]);
      const res = await api.post('/player/achievements/claim', { achievementId });
      if (res.data.success) {
        sfx.playAudio('levelup');
        setActionMsg(res.data.message);
        fetchData();
        onRefreshPlayer();
      }
    } catch (e: any) {
      setActionMsg(e.response?.data?.error || 'Error al reclamar el logro.');
    }
  };

  const handleEquipTitle = async (titleId: string) => {
    try {
      sfx.playAudio('click');
      sfx.haptic([40]);
      const res = await api.post('/player/titles/equip', { titleId });
      if (res.data.success) {
        setEquippedTitle(res.data.equipped_title);
        setActionMsg(res.data.message);
        onRefreshPlayer();
      }
    } catch (e: any) {
      setActionMsg(e.response?.data?.error || 'Error al equipar el título.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-card border-2 border-primary/50 w-full max-w-xl rounded-2xl shadow-[0_0_50px_rgba(251,191,36,0.25)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60 bg-gradient-to-r from-surface to-surface-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/40">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Hazañas del Gremio & Títulos
              </h2>
              <p className="text-xs text-gray-400 font-serif">Desbloquea pergaminos de gloria y perks pasivos para tu héroe</p>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-border/50 bg-surface/80 p-1.5 gap-2">
          <button
            onClick={() => {
              sfx.playAudio('click');
              setTab('ACHIEVEMENTS');
              setActionMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-heading font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'ACHIEVEMENTS'
                ? 'bg-primary text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-surface-card'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Logros del Gremio ({achievements.filter(a => a.isCompleted && !a.isClaimed).length > 0 ? `+${achievements.filter(a => a.isCompleted && !a.isClaimed).length}` : ''})</span>
          </button>
          <button
            onClick={() => {
              sfx.playAudio('click');
              setTab('TITLES');
              setActionMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-heading font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'TITLES'
                ? 'bg-primary text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-surface-card'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Títulos Honoríficos & Perks</span>
          </button>
        </div>

        {/* Action Message Feedback */}
        {actionMsg && (
          <div className="p-2.5 mx-4 mt-3 rounded-xl bg-primary/20 border border-primary/50 text-amber-300 text-xs font-heading font-bold text-center animate-fadeIn">
            {actionMsg}
          </div>
        )}

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : tab === 'ACHIEVEMENTS' ? (
            /* TAB: LOGROS */
            <div className="space-y-2.5">
              {achievements.map((ach) => {
                const percent = Math.min(100, Math.round((ach.currentProgress / ach.req_target) * 100));

                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      ach.isClaimed
                        ? 'bg-surface/50 border-border/40 opacity-70'
                        : ach.isCompleted
                        ? 'bg-gradient-to-r from-amber-500/15 via-surface to-surface-card border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-surface-card border-border/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl select-none">{ach.icon}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading text-xs sm:text-sm font-bold text-white">
                            {ach.title}
                          </h4>
                          <span className="text-[9px] px-2 py-0.2 rounded-full bg-surface border border-border text-gray-400 font-mono">
                            {ach.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 font-sans">{ach.description}</p>

                        {/* Barra de Progreso */}
                        <div className="w-48 sm:w-60 space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono text-gray-400">
                            <span>Progreso</span>
                            <span className={ach.isCompleted ? 'text-amber-300 font-bold' : ''}>
                              {ach.currentProgress} / {ach.req_target}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-border/40">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-amber-400 transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botón o Estado */}
                    <div className="self-end sm:self-center">
                      {ach.isClaimed ? (
                        <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Reclamado</span>
                        </span>
                      ) : ach.isCompleted ? (
                        <button
                          onClick={() => handleClaimAchievement(ach.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer animate-pulse"
                        >
                          Reclamar (+{ach.reward_gold}🪙)
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-serif italic flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>En Progreso</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TAB: TÍTULOS HONORÍFICOS & PERKS */
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-black/40 border border-primary/30 text-xs font-serif text-gray-300">
                💡 Los títulos desbloqueados otorgan <strong>perks pasivos permanentes</strong> mientras los lleves equipados en tu héroe.
              </div>

              {catalogTitles.map((t) => {
                const isUnlocked = unlockedTitles.some((ut) => ut.title_id === t.id) || t.id === 'title_02';
                const isEquipped = equippedTitle === t.id || equippedTitle === t.name;

                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isEquipped
                        ? 'bg-gradient-to-r from-primary/20 via-surface to-surface-card border-primary shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : isUnlocked
                        ? 'bg-surface-card border-border/60 hover:border-primary/40'
                        : 'bg-surface/40 border-border/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl select-none">{t.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading text-xs sm:text-sm font-black text-white">
                            {t.name}
                          </h4>
                          {isEquipped && (
                            <span className="text-[9px] px-2 py-0.2 rounded-full bg-primary text-black font-heading font-black">
                              EQUIPADO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 font-sans">{t.description}</p>
                        {t.perk_description && (
                          <p className="text-[10px] text-amber-300 font-mono font-semibold mt-0.5">
                            ✨ Bono: {t.perk_description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <button
                          onClick={() => handleEquipTitle(t.id)}
                          disabled={isEquipped}
                          className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-gray-800 text-gray-500 cursor-default'
                              : 'bg-surface hover:bg-primary hover:text-black border border-border hover:border-primary text-white active:scale-95'
                          }`}
                        >
                          {isEquipped ? 'Activo' : 'Equipar'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Bloqueado</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
