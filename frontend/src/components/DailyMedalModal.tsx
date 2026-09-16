import React, { useEffect, useState } from 'react';
import { X, Award, Flame, Clock, Sparkles, CheckCircle2, Coins } from 'lucide-react';
import { api } from '../services/api';

interface DailyMedalModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastClaimAt?: string;
  streakDays?: number;
  onClaimSuccess: () => Promise<void>;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const DailyMedalModal: React.FC<DailyMedalModalProps> = ({
  isOpen,
  onClose,
  lastClaimAt,
  streakDays = 0,
  onClaimSuccess
}) => {
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rewardWon, setRewardWon] = useState<{ xp: number; gold: number; streak: number } | null>(null);

  // Local state for lastClaimAt to react instantly upon claim
  const [effectiveClaimAt, setEffectiveClaimAt] = useState<string | undefined>(lastClaimAt);
  const [effectiveStreak, setEffectiveStreak] = useState<number>(streakDays);

  // Live timer tick calculation
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    setEffectiveClaimAt(lastClaimAt);
    setEffectiveStreak(streakDays);
  }, [lastClaimAt, streakDays]);

  useEffect(() => {
    if (!isOpen) return;
    setNowMs(Date.now());
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const lastClaimMs = effectiveClaimAt ? new Date(effectiveClaimAt).getTime() : 0;
  const timePassedMs = nowMs - lastClaimMs;
  const isAvailable = !effectiveClaimAt || timePassedMs >= TWENTY_FOUR_HOURS_MS;
  const msRemaining = Math.max(0, TWENTY_FOUR_HOURS_MS - timePassedMs);

  const hours = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((msRemaining % (1000 * 60)) / 1000);

  const countdownFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPct = Math.min(100, Math.max(0, (timePassedMs / TWENTY_FOUR_HOURS_MS) * 100));

  const handleClaim = async () => {
    setClaiming(true);
    setErrorMsg(null);
    setClaimMsg(null);
    try {
      const res = await api.claimDailyMedal();
      const nowIso = res.last_daily_claim_at || new Date().toISOString();
      const newStreak = res.streakDays || effectiveStreak + 1;
      
      // Update local states immediately
      setEffectiveClaimAt(nowIso);
      setEffectiveStreak(newStreak);
      setRewardWon({
        xp: res.gainedXp || 15,
        gold: res.gainedGold || 5,
        streak: newStreak
      });
      setClaimMsg(res.message || `¡Medalla Diaria Reclamada! +15 XP, +5 Oro. Racha: ${newStreak} días 🔥`);

      // Refresh parent dashboard data in background
      await onClaimSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo reclamar la medalla');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md theme-card p-6 md:p-7 space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 border-2 border-primary/50 text-primary shadow-[0_0_15px_var(--accent-glow)]">
              <Award className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-extrabold text-white tracking-wider uppercase">
                MEDALLA DIARIA MISO
              </h3>
              <p className="text-xs text-gray-300 font-sans">
                Check-in de Asistencia 24 Horas en Nido de Cuervos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-card hover:bg-crimson/20 border border-surface-border text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="text-center space-y-4 py-2">
          {/* Main Visual Icon & Status Badge */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
              isAvailable 
                ? 'border-primary bg-primary/20 gold-glow d20-animate' 
                : 'border-surface-border bg-surface-card/60'
            }`}>
              {isAvailable ? (
                <Sparkles className="w-12 h-12 text-primary" />
              ) : (
                <Clock className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {/* Streak Badge */}
            <div className="absolute -bottom-2 bg-surface-card border border-amber-500/50 text-amber-300 px-3 py-0.5 rounded-full text-[11px] font-extrabold font-heading flex items-center gap-1 shadow-md">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Racha: {effectiveStreak}d</span>
            </div>
          </div>

          {/* Reward Perks Summary */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="bg-surface-card px-3.5 py-1.5 rounded-xl border border-surface-border flex items-center gap-1.5 text-xs font-bold text-magic shadow-sm">
              <Sparkles className="w-4 h-4 text-magic" />
              <span>+15 XP</span>
            </div>
            <div className="bg-surface-card px-3.5 py-1.5 rounded-xl border border-surface-border flex items-center gap-1.5 text-xs font-bold text-primary shadow-sm">
              <Coins className="w-4 h-4 text-primary" />
              <span>+5 Oro</span>
            </div>
          </div>

          {/* Success Reward Banner if just claimed */}
          {rewardWon && (
            <div className="p-3.5 bg-emerald/20 border border-emerald/50 text-emerald rounded-xl space-y-1 animate-fadeIn text-left">
              <div className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0" />
                <span>¡Recompensa Reclamada con Éxito!</span>
              </div>
              <p className="text-xs text-gray-200">
                Ganaste: <strong className="text-magic font-extrabold">+{rewardWon.xp} XP</strong> y <strong className="text-primary font-extrabold">+{rewardWon.gold} Oro</strong>.
              </p>
              <p className="text-[11px] text-amber-300 font-mono">
                🔥 Racha de Aventurero actualizada: <strong>{rewardWon.streak} días consecutivos</strong>
              </p>
            </div>
          )}

          {/* Status Message / Countdown Timer Display */}
          {isAvailable ? (
            <div className="space-y-1">
              <h4 className="font-heading text-xl font-extrabold text-primary uppercase">
                ¡RECOMPENSA DISPONIBLE!
              </h4>
              <p className="text-xs text-gray-300">
                Reclama tu botín diario para mantener tu racha de aventurero activa.
              </p>
            </div>
          ) : (
            <div className="space-y-3 bg-surface-card p-4 rounded-xl border border-surface-border text-left">
              <div className="flex items-center justify-between text-xs text-gray-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Próxima recompensa diaria en:</span>
                </span>
                <span className="font-mono text-lg font-extrabold text-primary tracking-wider bg-background/80 px-2.5 py-0.5 rounded-lg border border-primary/30">
                  {countdownFormatted}
                </span>
              </div>

              {/* Progress Bar of 24h Cooldown */}
              <div className="h-3 w-full bg-background border border-surface-border rounded-full overflow-hidden relative shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary via-emerald to-magic transition-all duration-1000 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <p className="text-[11px] text-gray-400">
                La nueva recompensa diaria estará disponible exactamente dentro de 24 hs ({countdownFormatted}).
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-crimson/20 border border-crimson/50 text-crimson text-xs font-extrabold rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div>
          {isAvailable ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="theme-btn-primary text-xs uppercase font-extrabold shadow-lg tracking-wider cursor-pointer"
            >
              <Award className="w-5 h-5" />
              <span>{claiming ? 'Reclamando Botín...' : 'RECLAMAR RECOMPENSA DIARIA'}</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-surface-card hover:bg-surface-border text-white border border-surface-border font-heading font-extrabold rounded-xl text-xs uppercase cursor-pointer transition-colors"
            >
              Cerrar (Vuelve en {countdownFormatted})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
