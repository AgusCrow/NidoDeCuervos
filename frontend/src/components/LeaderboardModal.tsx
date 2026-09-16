import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Coins, Swords, Sparkles, X, RefreshCw, Shield, Award, Users, Star } from 'lucide-react';
import { api } from '../services/api';
import { Player } from '../types';

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

interface LeaderboardClan {
  id: string;
  name: string;
  leaderName: string;
  level: number;
  points: number;
  wins: number;
  members: number;
  maxMembers: number;
  crest: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: Player | null;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [playersList, setPlayersList] = useState<LeaderboardPlayer[]>([]);
  const [clansList, setClansList] = useState<LeaderboardClan[]>([]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.getLeaderboard();
      if (res && res.success) {
        setPlayersList(res.playersLeaderboard || res.topLevel || []);
        setClansList(res.clansLeaderboard || []);
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

  // Individual Podium
  const p1 = playersList[0];
  const p2 = playersList[1];
  const p3 = playersList[2];
  const pRunnersUp = playersList.slice(3);

  // User position in individual ranking
  const userRankIdx = currentUser ? playersList.findIndex((p) => p.id === currentUser.id) : -1;
  const userRank = userRankIdx !== -1 ? userRankIdx + 1 : null;

  // Clan Podium
  const c1 = clansList[0];
  const c2 = clansList[1];
  const c3 = clansList[2];
  const cRunnersUp = clansList.slice(3);

  // User clan rank
  const userClanRank = 4; // Default rank for user's clan "Orden de los Cuervos"
  const userClan = clansList.find((c) => c.name.includes('Cuervos')) || clansList[3];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="theme-card max-w-5xl w-full p-4 sm:p-6 relative overflow-hidden border-2 border-primary/70 shadow-[0_0_50px_var(--accent-glow)] space-y-4 animate-scaleUp max-h-[92vh] flex flex-col">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/60 flex items-center justify-center text-primary shadow-[0_0_15px_var(--accent-glow)]">
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-white tracking-wider uppercase">
                SALÓN DE LA FAMA & CLASIFICACIÓN DE GUERRA
              </h2>
              <p className="text-xs text-gray-300 font-sans">
                Ranking Global Unificado de Aventureros e Imperios de Clan
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

        {/* 2-COLUMN RANKINGS GRID */}
        {loading ? (
          <div className="text-center py-16 font-heading text-primary font-bold animate-pulse text-sm">
            Cargando pergaminos y estadísticas de los campeones...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1 relative z-10">
            
            {/* ========================================================= */}
            {/* COLUMNA 1: RANKING INDIVIDUAL DE JUGADORES */}
            {/* ========================================================= */}
            <div className="bg-surface-card/60 border border-surface-border rounded-2xl p-3.5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-surface-border/80 pb-2">
                  <h3 className="font-heading font-black text-sm text-primary uppercase tracking-wider flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    <span>Ranking Individual de Jugadores</span>
                  </h3>
                  <span className="text-[10px] font-mono bg-primary/20 text-primary border border-primary/40 px-2 py-0.5 rounded font-bold">
                    {playersList.length} Aventureros
                  </span>
                </div>

                {/* PODIUM TOP 3 INDIVIDUAL */}
                <div className="grid grid-cols-3 gap-2 items-end pt-2">
                  {/* 2º Plata */}
                  <div className="flex flex-col items-center">
                    {p2 ? (
                      <div className="w-full bg-surface-card border border-slate-400/50 p-2 rounded-xl text-center space-y-1 shadow-sm">
                        <div className="w-6 h-6 mx-auto rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/60 flex items-center justify-center font-heading font-black text-[10px]">
                          🥈 2º
                        </div>
                        <div className="font-heading font-bold text-white text-xs truncate">{p2.name}</div>
                        <div className="text-[9px] text-gray-400 truncate">{p2.secret_class}</div>
                        <div className="text-[10px] font-mono font-bold text-primary">Nvl {p2.level}</div>
                      </div>
                    ) : null}
                  </div>

                  {/* 1º Oro */}
                  <div className="flex flex-col items-center">
                    {p1 ? (
                      <div className="w-full bg-gradient-to-b from-primary/30 to-surface-card border-2 border-primary p-2.5 rounded-xl text-center space-y-1 shadow-[0_0_15px_var(--accent-glow)] scale-105">
                        <div className="w-7 h-7 mx-auto rounded-full bg-primary/30 text-yellow-300 border border-primary flex items-center justify-center font-heading font-black text-xs">
                          🥇 1º
                        </div>
                        <div className="font-heading font-black text-white text-xs truncate">{p1.name}</div>
                        <div className="text-[9px] text-primary font-bold truncate">{p1.secret_class}</div>
                        <div className="text-[10px] font-mono font-bold text-primary">Nvl {p1.level} ({p1.xp} XP)</div>
                      </div>
                    ) : null}
                  </div>

                  {/* 3º Bronce */}
                  <div className="flex flex-col items-center">
                    {p3 ? (
                      <div className="w-full bg-surface-card border border-amber-700/50 p-2 rounded-xl text-center space-y-1 shadow-sm">
                        <div className="w-6 h-6 mx-auto rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/60 flex items-center justify-center font-heading font-black text-[10px]">
                          🥉 3º
                        </div>
                        <div className="font-heading font-bold text-white text-xs truncate">{p3.name}</div>
                        <div className="text-[9px] text-gray-400 truncate">{p3.secret_class}</div>
                        <div className="text-[10px] font-mono font-bold text-primary">Nvl {p3.level}</div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* RESTO DE LA LISTA (4+) */}
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {pRunnersUp.map((p, idx) => {
                    const isSelf = currentUser && p.id === currentUser.id;
                    return (
                      <div
                        key={p.id}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                          isSelf
                            ? 'bg-primary/20 border-primary text-white font-bold shadow-sm'
                            : 'bg-surface-card/80 border-surface-border text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-gray-400 text-[11px] w-5">#{idx + 4}</span>
                          <span className="font-heading font-bold text-white text-xs truncate">{p.name}</span>
                          <span className="text-[10px] text-gray-400 font-serif">({p.secret_class})</span>
                        </div>
                        <span className="font-mono text-[11px] text-primary font-bold shrink-0">Nvl {p.level}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TU POSICIÓN ACTUAL (JUGADOR) */}
              {currentUser && (
                <div className="mt-2 bg-gradient-to-r from-primary/20 via-surface-card to-surface-card border-2 border-primary rounded-xl p-2.5 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary text-black flex items-center justify-center font-mono font-black text-xs">
                      #{userRank || '?'}
                    </div>
                    <div>
                      <div className="text-[10px] text-primary font-heading uppercase font-bold tracking-wider">Tu Posición Actual</div>
                      <div className="font-heading font-bold text-xs text-white">{currentUser.name}</div>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-bold text-primary">
                    Nvl {currentUser.level} ({currentUser.xp} XP)
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* COLUMNA 2: RANKING DE CLANES & GREMIOS */}
            {/* ========================================================= */}
            <div className="bg-surface-card/60 border border-surface-border rounded-2xl p-3.5 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-surface-border/80 pb-2">
                  <h3 className="font-heading font-black text-sm text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Ranking de Clanes & Gremios</span>
                  </h3>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                    {clansList.length} Gremios
                  </span>
                </div>

                {/* PODIUM TOP 3 CLANES */}
                <div className="grid grid-cols-3 gap-2 items-end pt-2">
                  {/* 2º Plata Clan */}
                  <div className="flex flex-col items-center">
                    {c2 ? (
                      <div className="w-full bg-surface-card border border-slate-400/50 p-2 rounded-xl text-center space-y-1 shadow-sm">
                        <div className="text-base">{c2.crest}</div>
                        <div className="font-heading font-bold text-white text-xs truncate">{c2.name}</div>
                        <div className="text-[9px] text-gray-400 truncate">Líder: {c2.leaderName}</div>
                        <div className="text-[10px] font-mono font-bold text-amber-400">{c2.points} Pts</div>
                      </div>
                    ) : null}
                  </div>

                  {/* 1º Oro Clan */}
                  <div className="flex flex-col items-center">
                    {c1 ? (
                      <div className="w-full bg-gradient-to-b from-amber-500/30 to-surface-card border-2 border-amber-400 p-2.5 rounded-xl text-center space-y-1 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105">
                        <div className="text-xl">{c1.crest}</div>
                        <div className="font-heading font-black text-white text-xs truncate">{c1.name}</div>
                        <div className="text-[9px] text-amber-300 font-bold truncate">Líder: {c1.leaderName}</div>
                        <div className="text-[10px] font-mono font-bold text-amber-400">{c1.points} Pts (Nvl {c1.level})</div>
                      </div>
                    ) : null}
                  </div>

                  {/* 3º Bronce Clan */}
                  <div className="flex flex-col items-center">
                    {c3 ? (
                      <div className="w-full bg-surface-card border border-amber-700/50 p-2 rounded-xl text-center space-y-1 shadow-sm">
                        <div className="text-base">{c3.crest}</div>
                        <div className="font-heading font-bold text-white text-xs truncate">{c3.name}</div>
                        <div className="text-[9px] text-gray-400 truncate">Líder: {c3.leaderName}</div>
                        <div className="text-[10px] font-mono font-bold text-amber-400">{c3.points} Pts</div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* RESTO DE LA LISTA DE CLANES (4+) */}
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {cRunnersUp.map((c, idx) => {
                    return (
                      <div
                        key={c.id}
                        className="p-2 rounded-xl border border-surface-border bg-surface-card/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-gray-400 text-[11px] w-5">#{idx + 4}</span>
                          <span className="text-sm shrink-0">{c.crest}</span>
                          <span className="font-heading font-bold text-white text-xs truncate">{c.name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-amber-400 font-bold shrink-0">{c.points} Pts</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TU CLAN ACTUAL */}
              {userClan && (
                <div className="mt-2 bg-gradient-to-r from-amber-500/20 via-surface-card to-surface-card border-2 border-amber-500/60 rounded-xl p-2.5 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-mono font-black text-xs">
                      #{userClanRank}
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-300 font-heading uppercase font-bold tracking-wider">Tu Clan Actual</div>
                      <div className="font-heading font-bold text-xs text-white">{userClan.name}</div>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-bold text-amber-400">
                    Nvl {userClan.level} ({userClan.points} Pts)
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

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
