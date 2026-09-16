import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Coins, Swords, Sparkles, X, RefreshCw, Shield, Award } from 'lucide-react';
import { api } from '../services/api';

interface LeaderboardPlayer {
  id: string;
  name: string;
  username: string;
  secret_class: string;
  level: number;
  xp: number;
  gold: number;
  pvp_wins?: number;
  pvp_losses?: number;
  equipped_title?: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabCategory = 'LEVEL' | 'GOLD' | 'DUELS';

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabCategory>('LEVEL');
  const [loading, setLoading] = useState<boolean>(true);
  const [topLevel, setTopLevel] = useState<LeaderboardPlayer[]>([]);
  const [topGold, setTopGold] = useState<LeaderboardPlayer[]>([]);
  const [topDuels, setTopDuels] = useState<LeaderboardPlayer[]>([]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.getLeaderboard();
      if (res && res.success) {
        setTopLevel(res.topLevel || []);
        setTopGold(res.topGold || []);
        setTopDuels(res.topDuels || []);
      }
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentList: LeaderboardPlayer[] =
    activeTab === 'LEVEL' ? topLevel : activeTab === 'GOLD' ? topGold : topDuels;

  const rank1 = currentList[0];
  const rank2 = currentList[1];
  const rank3 = currentList[2];
  const runnersUp = currentList.slice(3);

  const renderStatBadge = (p: LeaderboardPlayer) => {
    if (activeTab === 'LEVEL') {
      return (
        <span className="font-mono font-black text-primary text-xs sm:text-sm">
          Nvl {p.level} ({p.xp} XP)
        </span>
      );
    }
    if (activeTab === 'GOLD') {
      return (
        <span className="font-mono font-black text-amber-400 text-xs sm:text-sm flex items-center gap-1 justify-center">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          {p.gold} Oro
        </span>
      );
    }
    return (
      <span className="font-mono font-black text-crimson text-xs sm:text-sm flex items-center gap-1 justify-center">
        <Swords className="w-3.5 h-3.5 text-crimson" />
        {p.pvp_wins || 0}W - {p.pvp_losses || 0}L
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="theme-card max-w-2xl w-full p-5 sm:p-6 relative overflow-hidden border-2 border-primary/70 shadow-[0_0_50px_var(--accent-glow)] space-y-5 animate-scaleUp max-h-[90vh] flex flex-col">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/60 flex items-center justify-center text-primary shadow-[0_0_15px_var(--accent-glow)]">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-white tracking-wider uppercase">
                SALÓN DE LA FAMA
              </h2>
              <p className="text-xs text-gray-300">
                Los mayores héroes y leyendas reconocidos en El Gremio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="p-2 rounded-xl bg-surface-card hover:bg-surface-border text-gray-400 hover:text-white border border-surface-border transition-all cursor-pointer"
              title="Actualizar Podio"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-card hover:bg-surface-border text-gray-400 hover:text-white border border-surface-border transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs Selector */}
        <div className="grid grid-cols-3 gap-2 bg-surface-card/80 p-1.5 rounded-xl border border-surface-border relative z-10 shrink-0">
          <button
            onClick={() => setActiveTab('LEVEL')}
            className={`py-2 rounded-lg font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'LEVEL'
                ? 'bg-primary text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Nivel & XP</span>
          </button>

          <button
            onClick={() => setActiveTab('GOLD')}
            className={`py-2 rounded-lg font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'GOLD'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Fortuna</span>
          </button>

          <button
            onClick={() => setActiveTab('DUELS')}
            className={`py-2 rounded-lg font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'DUELS'
                ? 'bg-crimson text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Gladiadores</span>
          </button>
        </div>

        {/* Podium View (Top 3) */}
        <div className="overflow-y-auto space-y-4 pr-1 relative z-10 flex-1">
          {loading ? (
            <div className="text-center py-12 font-heading text-primary font-bold animate-pulse text-sm">
              Invocando a los Grandes Campeones...
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs font-sans">
              Aún no hay campeones registrados en esta categoría.
            </div>
          ) : (
            <>
              {/* Visual 3-Step Podium */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-4 pb-2">
                {/* 2nd Place (Silver) */}
                <div className="flex flex-col items-center">
                  {rank2 ? (
                    <div className="w-full bg-surface-card/80 border border-slate-400/40 p-3 rounded-2xl text-center space-y-1.5 hover:border-slate-300 transition-all shadow-md">
                      <div className="w-8 h-8 mx-auto rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/60 flex items-center justify-center font-heading font-black text-xs">
                        2º
                      </div>
                      <div className="font-heading font-bold text-white text-xs truncate">
                        {rank2.name}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate font-sans">
                        {rank2.secret_class}
                      </div>
                      {renderStatBadge(rank2)}
                    </div>
                  ) : (
                    <div className="w-full h-24 border border-dashed border-surface-border rounded-2xl flex items-center justify-center text-[10px] text-gray-500">
                      Vacante
                    </div>
                  )}
                  <div className="h-10 w-full bg-slate-400/15 border-t border-slate-400/30 rounded-b-xl mt-1 flex items-center justify-center text-[11px] font-mono font-bold text-slate-300">
                    Plata
                  </div>
                </div>

                {/* 1st Place (Gold - Elevated) */}
                <div className="flex flex-col items-center -mt-4">
                  {rank1 ? (
                    <div className="w-full bg-gradient-to-b from-primary/25 via-surface-card to-surface-card border-2 border-primary p-3.5 rounded-2xl text-center space-y-2 shadow-[0_0_25px_var(--accent-glow)] scale-105">
                      <div className="w-9 h-9 mx-auto rounded-full bg-primary/30 text-yellow-300 border-2 border-primary flex items-center justify-center font-heading font-black text-sm shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-heading font-black text-white text-xs sm:text-sm truncate">
                          {rank1.name}
                        </div>
                        <div className="text-[10px] text-primary font-bold truncate">
                          {rank1.equipped_title || rank1.secret_class}
                        </div>
                      </div>
                      {renderStatBadge(rank1)}
                    </div>
                  ) : null}
                  <div className="h-14 w-full bg-primary/25 border-t-2 border-primary rounded-b-xl mt-1 flex items-center justify-center text-xs font-mono font-black text-primary">
                    Oro #1
                  </div>
                </div>

                {/* 3rd Place (Bronze) */}
                <div className="flex flex-col items-center">
                  {rank3 ? (
                    <div className="w-full bg-surface-card/80 border border-amber-700/40 p-3 rounded-2xl text-center space-y-1.5 hover:border-amber-600 transition-all shadow-md">
                      <div className="w-8 h-8 mx-auto rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/60 flex items-center justify-center font-heading font-black text-xs">
                        3º
                      </div>
                      <div className="font-heading font-bold text-white text-xs truncate">
                        {rank3.name}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate font-sans">
                        {rank3.secret_class}
                      </div>
                      {renderStatBadge(rank3)}
                    </div>
                  ) : (
                    <div className="w-full h-20 border border-dashed border-surface-border rounded-2xl flex items-center justify-center text-[10px] text-gray-500">
                      Vacante
                    </div>
                  )}
                  <div className="h-7 w-full bg-amber-700/15 border-t border-amber-700/30 rounded-b-xl mt-1 flex items-center justify-center text-[11px] font-mono font-bold text-amber-500">
                    Bronce
                  </div>
                </div>
              </div>

              {/* Runners up (4th and 5th places) */}
              {runnersUp.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-surface-border">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 px-1">
                    Otros Héroes Destacados
                  </div>
                  {runnersUp.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-3 bg-surface-card/60 hover:bg-surface-card border border-surface-border rounded-xl flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono font-black text-gray-400 w-5 text-center">
                          #{idx + 4}
                        </span>
                        <div className="min-w-0">
                          <div className="font-heading font-bold text-white truncate">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">
                            {p.equipped_title ? `[${p.equipped_title}] ` : ''}{p.secret_class}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {renderStatBadge(p)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-surface-border shrink-0">
          <button
            onClick={onClose}
            className="w-full theme-btn-primary py-2.5 text-xs font-heading font-bold uppercase tracking-wider cursor-pointer"
          >
            Cerrar Salón de la Fama
          </button>
        </div>
      </div>
    </div>
  );
};
