import React, { useEffect, useState } from 'react';
import { X, Award, Flame, Clock, Sparkles, CheckCircle2, Coins, Trophy, Lock, Unlock, ArrowRight, Shield } from 'lucide-react';
import { api } from '../services/api';
import { sfx } from '../services/sfx';

interface PlayerActiveQuest {
  id: string;
  quest_id: string;
  cadence: 'DAILY' | 'WEEKLY';
  title: string;
  description: string;
  metric: string;
  progress: number;
  target_value: number;
  is_completed: boolean;
  is_claimed: boolean;
  reward_gold: number;
  reward_xp: number;
  icon: string;
  period_key: string;
}

interface QuestsState {
  dailyQuests: PlayerActiveQuest[];
  weeklyQuests: PlayerActiveQuest[];
  dailyExpiresInMs: number;
  weeklyExpiresInMs: number;
  vault: {
    isUnlocked: boolean;
    isClaimed: boolean;
    completedWeeklyCount: number;
    requiredWeeklyCount: number;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lastClaimAt?: string;
  streakDays?: number;
  onRefreshPlayer: () => Promise<void>;
}

export const GuildQuestsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  lastClaimAt,
  streakDays = 0,
  onRefreshPlayer
}) => {
  const [activeTab, setActiveTab] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [questData, setQuestData] = useState<QuestsState | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [vaultOpening, setVaultOpening] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [vaultReward, setVaultReward] = useState<any | null>(null);

  // Daily medal claim state
  const [medalClaiming, setMedalClaiming] = useState(false);
  const [effectiveClaimAt, setEffectiveClaimAt] = useState<string | undefined>(lastClaimAt);
  const [effectiveStreak, setEffectiveStreak] = useState<number>(streakDays);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    setEffectiveClaimAt(lastClaimAt);
    setEffectiveStreak(streakDays);
  }, [lastClaimAt, streakDays]);

  useEffect(() => {
    if (!isOpen) return;
    fetchQuests();
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/player/quests');
      if (res.data?.success) {
        setQuestData(res.data);
      }
    } catch (e) {
      console.error('Error cargando misiones', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculo de medalla diaria
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const lastClaimMs = effectiveClaimAt ? new Date(effectiveClaimAt).getTime() : 0;
  const timePassedMs = nowMs - lastClaimMs;
  const isMedalAvailable = !effectiveClaimAt || timePassedMs >= TWENTY_FOUR_HOURS_MS;
  const medalRemainingMs = Math.max(0, TWENTY_FOUR_HOURS_MS - timePassedMs);

  const formatCountdown = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleClaimMedal = async () => {
    setMedalClaiming(true);
    try {
      sfx.playAudio('coins');
      sfx.haptic([30, 40]);
      const res = await api.claimDailyMedal();
      const nowIso = res.last_daily_claim_at || new Date().toISOString();
      const newStreak = res.streakDays || effectiveStreak + 1;
      setEffectiveClaimAt(nowIso);
      setEffectiveStreak(newStreak);
      setBannerMsg({ type: 'ok', text: `¡Medalla diaria reclamada! Racha de ${newStreak} días activada 🔥` });
      await onRefreshPlayer();
    } catch (err: any) {
      setBannerMsg({ type: 'err', text: err.message || 'Error reclamando medalla' });
    } finally {
      setMedalClaiming(false);
    }
  };

  const handleClaimQuest = async (q: PlayerActiveQuest) => {
    try {
      setActionLoadingId(q.id);
      sfx.playAudio('coins');
      sfx.haptic([25, 35]);
      const res = await api.post(`/player/quests/${q.id}/claim`);
      if (res.data?.success) {
        setBannerMsg({ type: 'ok', text: res.data.message });
        await fetchQuests();
        await onRefreshPlayer();
      }
    } catch (err: any) {
      setBannerMsg({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenVault = async () => {
    try {
      setVaultOpening(true);
      sfx.playAudio('levelup');
      sfx.haptic([80, 50, 100]);
      const res = await api.post('/player/quests/vault/open');
      if (res.data?.success) {
        setVaultReward(res.data);
        setBannerMsg({ type: 'ok', text: res.data.message });
        await fetchQuests();
        await onRefreshPlayer();
      }
    } catch (err: any) {
      setBannerMsg({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setVaultOpening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl theme-card p-5 sm:p-6 space-y-5 relative overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] max-h-[92vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/20 border border-primary/50 text-primary shadow-[0_0_15px_var(--accent-glow)]">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-cinzel text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Tablón de Contratos del Gremio</span>
              </h2>
              <p className="text-[11px] text-gray-400 font-sans">
                Misiones persistentes en tiempo real y La Gran Bóveda Semanal
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-border text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Daily Streak & Medal Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-surface to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xl">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-xs text-white">Racha Diaria:</span>
                <span className="text-xs font-mono font-bold text-amber-300">{effectiveStreak} Días Consecutivos</span>
              </div>
              <p className="text-[10px] text-gray-400 font-sans">
                {isMedalAvailable ? '¡Tu medalla diaria está lista para ser reclamada!' : `Próxima medalla en ${formatCountdown(medalRemainingMs)}`}
              </p>
            </div>
          </div>

          <button
            onClick={handleClaimMedal}
            disabled={!isMedalAvailable || medalClaiming}
            className={`px-3 py-1.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow ${
              isMedalAvailable
                ? 'bg-amber-500 hover:bg-amber-400 text-black font-black animate-pulse'
                : 'bg-surface text-gray-500 border border-surface-border cursor-not-allowed opacity-60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{medalClaiming ? 'Reclamando...' : isMedalAvailable ? 'Reclamar Medalla' : 'Completado'}</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {bannerMsg && (
          <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            bannerMsg.type === 'ok' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-rose-500/20 border-rose-500 text-rose-300'
          }`}>
            <span>{bannerMsg.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-surface rounded-xl border border-surface-border">
          <button
            onClick={() => setActiveTab('DAILY')}
            className={`flex-1 py-2 rounded-lg font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'DAILY' ? 'bg-primary text-on-primary font-black shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🌅 Misiones Diarias (3)</span>
          </button>
          <button
            onClick={() => setActiveTab('WEEKLY')}
            className={`flex-1 py-2 rounded-lg font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'WEEKLY' ? 'bg-amber-500 text-black font-black shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🏆 Semanales & La Gran Bóveda</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-3 min-h-[260px]">
          {loading && !questData ? (
            <div className="text-center py-12 text-primary font-cinzel font-bold text-sm animate-pulse">
              Consultando el Tablón de Misiones del Gremio...
            </div>
          ) : activeTab === 'DAILY' ? (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                <span>Reinicia a medianoche (UTC)</span>
                <span className="flex items-center gap-1 text-primary">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatCountdown(questData?.dailyExpiresInMs || 0)}</span>
                </span>
              </div>

              {questData?.dailyQuests.map((q) => {
                const pct = Math.min(100, Math.round((q.progress / q.target_value) * 100));
                const canClaim = q.is_completed && !q.is_claimed;

                return (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      q.is_claimed
                        ? 'bg-surface/40 border-surface-border opacity-60'
                        : q.is_completed
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                        : 'bg-surface-card border-surface-border'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="text-2xl p-2 rounded-xl bg-black/40 border border-surface-border shrink-0">
                        {q.icon}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-white text-xs truncate">{q.title}</h4>
                          <span className="text-[10px] font-mono text-gray-400">
                            {q.progress} / {q.target_value}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 font-sans">{q.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-surface-border/60">
                          <div
                            className={`h-full transition-all duration-500 ${
                              q.is_completed ? 'bg-emerald-400' : 'bg-primary'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-surface-border/50 pt-2 sm:pt-0 shrink-0">
                      <div className="text-right font-mono text-[11px] space-y-0.5">
                        <span className="text-amber-400 font-bold block">+{q.reward_gold} 🪙</span>
                        <span className="text-purple-300 font-bold block">+{q.reward_xp} XP</span>
                      </div>

                      {q.is_claimed ? (
                        <div className="px-3 py-1.5 rounded-xl bg-surface border border-surface-border text-gray-500 text-xs font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
                          <span>Reclamado</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaimQuest(q)}
                          disabled={!canClaim || actionLoadingId === q.id}
                          className={`px-3 py-1.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                            canClaim
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-md active:scale-95 animate-pulse'
                              : 'bg-surface text-gray-500 border border-surface-border cursor-not-allowed opacity-50'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{actionLoadingId === q.id ? '...' : canClaim ? '¡Cobrar!' : `${pct}%`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Tab Semanal & La Gran Bóveda */
            <div className="space-y-4 animate-fadeIn">
              {/* Grand Vault Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-950/60 to-amber-500/20 border-2 border-amber-500/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl text-center sm:text-left relative overflow-hidden">
                <div className="flex items-center gap-3.5">
                  <span className="text-4xl p-2 rounded-2xl bg-black/60 border border-amber-500/50 shadow-inner animate-bounce">
                    🏆
                  </span>
                  <div>
                    <h3 className="font-heading font-black text-sm text-amber-300 flex items-center justify-center sm:justify-start gap-2">
                      <span>La Gran Bóveda Semanal</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400 text-amber-200">
                        {questData?.vault.completedWeeklyCount || 0} / 3 Objetivos
                      </span>
                    </h3>
                    <p className="text-xs text-gray-300 font-sans mt-0.5 max-w-sm">
                      Completa las 3 misiones semanales para desbloquear un **Ítem Legendario/Mítico Procedural** garantizado + Oro + XP.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  {questData?.vault.isClaimed ? (
                    <div className="px-4 py-2 rounded-xl bg-surface border border-surface-border text-gray-400 text-xs font-heading font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Bóveda Reclamada</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleOpenVault}
                      disabled={!questData?.vault.isUnlocked || vaultOpening}
                      className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                        questData?.vault.isUnlocked
                          ? 'bg-gradient-to-r from-amber-400 to-primary text-black hover:brightness-110 shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-pulse active:scale-95'
                          : 'bg-surface/50 text-gray-500 border border-surface-border cursor-not-allowed opacity-60'
                      }`}
                    >
                      {questData?.vault.isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span>{vaultOpening ? 'Abriendo Bóveda...' : questData?.vault.isUnlocked ? '¡Abrir Bóveda Mítica!' : 'Bóveda Bloqueada'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Vault Reward Display if freshly opened */}
              {vaultReward && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-primary/20 to-amber-500/20 border border-primary text-center space-y-1.5 shadow-[0_0_20px_rgba(251,191,36,0.3)] animate-fadeIn">
                  <div className="font-heading font-black text-sm text-amber-300">
                    👑 ¡HAS DESBLOQUEADO EL BOTÍN DE LA GRAN BÓVEDA!
                  </div>
                  <div className="text-white font-bold text-xs flex items-center justify-center gap-2">
                    <span>{vaultReward.item?.icon}</span>
                    <span>{vaultReward.item?.name}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/30 border border-primary text-primary font-mono font-bold">
                      {vaultReward.item?.rarity}
                    </span>
                  </div>
                  {vaultReward.item?.legendary_perk && (
                    <p className="text-[10px] text-amber-200 font-sans italic bg-black/50 p-2 rounded-lg border border-amber-500/30 max-w-md mx-auto">
                      ✨ <strong>{vaultReward.item.legendary_perk.name}:</strong> {vaultReward.item.legendary_perk.description}
                    </p>
                  )}
                </div>
              )}

              {/* Weekly Quests List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                  <span>Reinicia cada Lunes a las 00:00 UTC</span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatCountdown(questData?.weeklyExpiresInMs || 0)}</span>
                  </span>
                </div>

                {questData?.weeklyQuests.map((q) => {
                  const pct = Math.min(100, Math.round((q.progress / q.target_value) * 100));
                  const canClaim = q.is_completed && !q.is_claimed;

                  return (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        q.is_claimed
                          ? 'bg-surface/40 border-surface-border opacity-60'
                          : q.is_completed
                          ? 'bg-emerald-500/10 border-emerald-500/50'
                          : 'bg-surface-card border-surface-border'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="text-2xl p-2 rounded-xl bg-black/40 border border-surface-border shrink-0">
                          {q.icon}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-heading font-bold text-white text-xs truncate">{q.title}</h4>
                            <span className="text-[10px] font-mono text-gray-400">
                              {q.progress.toLocaleString()} / {q.target_value.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-300 font-sans">{q.description}</p>
                          
                          <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-surface-border/60">
                            <div
                              className={`h-full transition-all duration-500 ${
                                q.is_completed ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-surface-border/50 pt-2 sm:pt-0 shrink-0">
                        <div className="text-right font-mono text-[11px] space-y-0.5">
                          <span className="text-amber-400 font-bold block">+{q.reward_gold} 🪙</span>
                          <span className="text-purple-300 font-bold block">+{q.reward_xp} XP</span>
                        </div>

                        {q.is_claimed ? (
                          <div className="px-3 py-1.5 rounded-xl bg-surface border border-surface-border text-gray-500 text-xs font-mono font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
                            <span>Reclamado</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleClaimQuest(q)}
                            disabled={!canClaim || actionLoadingId === q.id}
                            className={`px-3 py-1.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                              canClaim
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-black shadow-md active:scale-95 animate-pulse'
                                : 'bg-surface text-gray-500 border border-surface-border cursor-not-allowed opacity-50'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{actionLoadingId === q.id ? '...' : canClaim ? '¡Cobrar!' : `${pct}%`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
