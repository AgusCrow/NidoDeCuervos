import React, { useEffect } from 'react';
import { Shield, Sparkles, Coins, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { sfx } from '../services/sfx';

export type RpgToastType = 'EQUIP' | 'UNEQUIP' | 'CONSUME' | 'SELL' | 'ERROR' | 'INFO';

export interface RpgToastMessage {
  id: string;
  type: RpgToastType;
  title: string;
  description?: string;
  icon?: string;
}

interface Props {
  toasts: RpgToastMessage[];
  onDismiss: (id: string) => void;
}

export const RpgToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {toasts.map((toast) => (
        <RpgToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const RpgToastItem: React.FC<{ toast: RpgToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3800);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'EQUIP':
        return {
          border: 'border-amber-400/80',
          bg: 'from-amber-950/90 via-surface-card/95 to-surface-card/95',
          glow: 'shadow-[0_0_20px_rgba(251,191,36,0.35)]',
          badgeText: 'text-amber-300',
          defaultIcon: '⚔️'
        };
      case 'UNEQUIP':
        return {
          border: 'border-blue-400/70',
          bg: 'from-blue-950/90 via-surface-card/95 to-surface-card/95',
          glow: 'shadow-[0_0_15px_rgba(59,130,246,0.25)]',
          badgeText: 'text-blue-300',
          defaultIcon: '🛡️'
        };
      case 'CONSUME':
        return {
          border: 'border-emerald-400/80',
          bg: 'from-emerald-950/90 via-surface-card/95 to-surface-card/95',
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
          badgeText: 'text-emerald-300',
          defaultIcon: '🧪'
        };
      case 'SELL':
        return {
          border: 'border-yellow-400/80',
          bg: 'from-yellow-950/90 via-surface-card/95 to-surface-card/95',
          glow: 'shadow-[0_0_25px_rgba(234,179,8,0.4)]',
          badgeText: 'text-yellow-300',
          defaultIcon: '🪙'
        };
      case 'ERROR':
        return {
          border: 'border-crimson/80',
          bg: 'from-red-950/95 via-surface-card/95 to-surface-card/95',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
          badgeText: 'text-red-400',
          defaultIcon: '⚠️'
        };
      case 'INFO':
      default:
        return {
          border: 'border-primary/60',
          bg: 'from-surface via-surface-card/95 to-surface-card/95',
          glow: 'shadow-[0_0_15px_var(--accent-glow)]',
          badgeText: 'text-primary',
          defaultIcon: '📜'
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-gradient-to-r ${style.bg} border-2 ${style.border} ${style.glow} backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-fadeIn`}
    >
      <div className="w-10 h-10 rounded-xl bg-black/60 border border-surface-border flex items-center justify-center text-xl shrink-0 shadow-inner">
        {toast.icon || style.defaultIcon}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h4 className={`font-heading text-xs font-black uppercase tracking-wider ${style.badgeText} truncate`}>
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-[11px] text-gray-200 font-sans leading-snug mt-0.5 break-words">
            {toast.description}
          </p>
        )}
      </div>

      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
