import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Coins, Swords, Sparkles, X, RefreshCw, Shield, Award, Users, Star, ArrowUpRight } from 'lucide-react';
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
  isOpen?: boolean;
  onClose?: () => void;
  currentUser?: Player | null;
  isEmbedded?: boolean;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen = true,
  onClose,
  currentUser,
  isEmbedded = false
}) => {
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
    if (isOpen || isEmbedded) {
      fetchLeaderboard();
    }
  }, [isOpen, isEmbedded]);

  if (!isOpen && !isEmbedded) return null;

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
  const userClanRank = 4;
  const userClan = clansList.find((c) => c.name.includes('Cuervos')) || clansList[3];

  const content = (
    <div className={`w-full space-y-6 ${isEmbedded ? 'animate-fadeIn max-w-6xl mx-auto pb-16' : 'max-w-5xl p-4 sm:p-6 shadow-[0_16px_50px_rgba(0,0,0,0.8)]'}`}>
      {/* Background Cyber-Glows */}
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Header Banner - Glassmorphism + Cyberpunk High-Contrast */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/80 via-black/70 to-slate-900/80 backdrop-blur-xl border border-white/10 p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.5)] shrink-0">
            <div className="w-full h-full bg-black/90 rounded-[14px] flex items-center justify-center text-amber-400">
              <Trophy className="w-8 h-8 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg sm:text-2xl font-black text-white tracking-wider uppercase">
                SALÓN DE LA FAMA & RANKINGS
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold uppercase tracking-widest hidden sm:inline-block">
                LIVE HUD 24/7
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              Clasificación Oficial de Leyendas Individuales e Imperios de Clan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Actualizar Datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">RECARGAR</span>
          </button>
          {!isEmbedded && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2-COLUMN DUAL RANKINGS SYSTEM */}
      {loading ? (
        <div className="text-center py-20 font-heading text-cyan-400 font-bold animate-pulse text-base">
          ⚡ Conectando con los datos de combate del servidor...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* ========================================================= */}
          {/* COLUMNA 1: RANKING INDIVIDUAL DE JUGADORES */}
          {/* ========================================================= */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm text-cyan-300 uppercase tracking-wider">
                      Ranking Individual de Jugadores
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans">Ordenado por Nivel, XP y Fortuna</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full font-extrabold">
                  {playersList.length} Aventureros
                </span>
              </div>

              {/* PODIUM TOP 3 JUGADORES */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-2 pb-1">
                {/* 2º Plata */}
                <div className="flex flex-col items-center">
                  {p2 ? (
                    <div className="w-full bg-slate-800/80 backdrop-blur-md border border-slate-400/50 p-3 rounded-2xl text-center space-y-1.5 shadow-lg hover:border-slate-300 transition-all group">
                      <div className="w-7 h-7 mx-auto rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/60 flex items-center justify-center font-heading font-black text-xs shadow-sm">
                        🥈 2º
                      </div>
                      <div className="font-heading font-bold text-white text-xs truncate group-hover:text-cyan-300 transition-colors">
                        {p2.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate font-sans">{p2.secret_class}</div>
                      <div className="text-[11px] font-mono font-black text-cyan-400">Nvl {p2.level}</div>
                    </div>
                  ) : null}
                </div>

                {/* 1º Oro */}
                <div className="flex flex-col items-center">
                  {p1 ? (
                    <div className="w-full bg-gradient-to-b from-amber-500/25 via-slate-900/90 to-black border-2 border-amber-400 p-3.5 rounded-2xl text-center space-y-2 shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-105 group">
                      <div className="w-9 h-9 mx-auto rounded-full bg-amber-400/30 text-yellow-300 border-2 border-amber-400 flex items-center justify-center font-heading font-black text-sm shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                        👑 1º
                      </div>
                      <div>
                        <div className="font-heading font-black text-white text-xs sm:text-sm truncate group-hover:text-amber-300 transition-colors">
                          {p1.name}
                        </div>
                        <div className="text-[10px] text-amber-400 font-bold truncate">{p1.secret_class}</div>
                      </div>
                      <div className="text-[11px] font-mono font-black text-amber-300 bg-amber-500/20 py-0.5 px-2 rounded-lg border border-amber-500/40 inline-block">
                        Nvl {p1.level} ({p1.xp} XP)
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 3º Bronce */}
                <div className="flex flex-col items-center">
                  {p3 ? (
                    <div className="w-full bg-slate-800/80 backdrop-blur-md border border-amber-700/50 p-3 rounded-2xl text-center space-y-1.5 shadow-lg hover:border-amber-600 transition-all group">
                      <div className="w-7 h-7 mx-auto rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/60 flex items-center justify-center font-heading font-black text-xs shadow-sm">
                        🥉 3º
                      </div>
                      <div className="font-heading font-bold text-white text-xs truncate group-hover:text-amber-400 transition-colors">
                        {p3.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate font-sans">{p3.secret_class}</div>
                      <div className="text-[11px] font-mono font-black text-amber-500">Nvl {p3.level}</div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* RESTO DE LA LISTA (4+) - Flat Card Design */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {pRunnersUp.map((p, idx) => {
                  const isSelf = currentUser && p.id === currentUser.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                        isSelf
                          ? 'bg-gradient-to-r from-cyan-500/20 via-slate-800 to-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                          : 'bg-slate-800/50 border-white/5 hover:border-white/20 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono font-black text-slate-400 text-xs w-6 text-center">
                          #{idx + 4}
                        </span>
                        <div className="min-w-0">
                          <div className="font-heading font-bold text-white truncate flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {isSelf && (
                              <span className="text-[8px] bg-cyan-400 text-black px-1.5 py-0.2 rounded font-mono font-black uppercase">
                                TU
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate font-sans">
                            {p.equipped_title ? `[${p.equipped_title}] ` : ''}{p.secret_class}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-cyan-400 font-extrabold shrink-0 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-xl">
                        Nvl {p.level}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TU POSICIÓN ACTUAL FIX BANNER (JUGADOR) */}
            {currentUser && (
              <div className="bg-gradient-to-r from-cyan-500/20 via-slate-900 to-black border-2 border-cyan-400 rounded-2xl p-3.5 flex items-center justify-between shadow-[0_0_20px_rgba(0,240,255,0.25)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-400 text-black flex items-center justify-center font-mono font-black text-sm shadow-md">
                    #{userRank || '?'}
                  </div>
                  <div>
                    <div className="text-[10px] text-cyan-300 font-heading font-black tracking-wider uppercase">
                      TU POSICIÓN ACTUAL EN EL REINO
                    </div>
                    <div className="font-heading font-bold text-sm text-white">{currentUser.name}</div>
                  </div>
                </div>
                <div className="font-mono text-xs font-black text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 px-3 py-1.5 rounded-xl">
                  Nvl {currentUser.level} ({currentUser.xp} XP)
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* COLUMNA 2: RANKING DE CLANES & GREMIOS */}
          {/* ========================================================= */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-sm text-purple-300 uppercase tracking-wider">
                      Ranking de Clanes & Gremios
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans">Ordenado por Puntos de Dominio Territoriales</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-full font-extrabold">
                  {clansList.length} Gremios
                </span>
              </div>

              {/* PODIUM TOP 3 CLANES */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-2 pb-1">
                {/* 2º Plata Clan */}
                <div className="flex flex-col items-center">
                  {c2 ? (
                    <div className="w-full bg-slate-800/80 backdrop-blur-md border border-slate-400/50 p-3 rounded-2xl text-center space-y-1.5 shadow-lg hover:border-slate-300 transition-all group">
                      <div className="text-xl group-hover:scale-110 transition-transform">{c2.crest}</div>
                      <div className="font-heading font-bold text-white text-xs truncate group-hover:text-purple-300 transition-colors">
                        {c2.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate font-sans">Líder: {c2.leaderName}</div>
                      <div className="text-[11px] font-mono font-black text-purple-400">{c2.points} Pts</div>
                    </div>
                  ) : null}
                </div>

                {/* 1º Oro Clan */}
                <div className="flex flex-col items-center">
                  {c1 ? (
                    <div className="w-full bg-gradient-to-b from-purple-500/25 via-slate-900/90 to-black border-2 border-purple-400 p-3.5 rounded-2xl text-center space-y-2 shadow-[0_0_25px_rgba(168,85,247,0.4)] scale-105 group">
                      <div className="text-2xl group-hover:scale-120 transition-transform">{c1.crest}</div>
                      <div>
                        <div className="font-heading font-black text-white text-xs sm:text-sm truncate group-hover:text-purple-300 transition-colors">
                          {c1.name}
                        </div>
                        <div className="text-[10px] text-purple-300 font-bold truncate">Líder: {c1.leaderName}</div>
                      </div>
                      <div className="text-[11px] font-mono font-black text-purple-300 bg-purple-500/20 py-0.5 px-2 rounded-lg border border-purple-500/40 inline-block">
                        {c1.points} Pts (Nvl {c1.level})
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 3º Bronce Clan */}
                <div className="flex flex-col items-center">
                  {c3 ? (
                    <div className="w-full bg-slate-800/80 backdrop-blur-md border border-amber-700/50 p-3 rounded-2xl text-center space-y-1.5 shadow-lg hover:border-amber-600 transition-all group">
                      <div className="text-xl group-hover:scale-110 transition-transform">{c3.crest}</div>
                      <div className="font-heading font-bold text-white text-xs truncate group-hover:text-amber-400 transition-colors">
                        {c3.name}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate font-sans">Líder: {c3.leaderName}</div>
                      <div className="text-[11px] font-mono font-black text-amber-500">{c3.points} Pts</div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* RESTO DE LA LISTA DE CLANES (4+) */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cRunnersUp.map((c, idx) => {
                  return (
                    <div
                      key={c.id}
                      className="p-3 rounded-2xl border border-white/5 hover:border-white/20 bg-slate-800/50 hover:bg-slate-800/80 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono font-black text-slate-400 text-xs w-6 text-center">
                          #{idx + 4}
                        </span>
                        <span className="text-base shrink-0">{c.crest}</span>
                        <div className="min-w-0">
                          <div className="font-heading font-bold text-white truncate">{c.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">Líder: {c.leaderName}</div>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-purple-400 font-extrabold shrink-0 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-xl">
                        {c.points} Pts
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TU CLAN ACTUAL FIX BANNER */}
            {userClan && (
              <div className="bg-gradient-to-r from-purple-500/20 via-slate-900 to-black border-2 border-purple-400 rounded-2xl p-3.5 flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-400 text-black flex items-center justify-center font-mono font-black text-sm shadow-md">
                    #{userClanRank}
                  </div>
                  <div>
                    <div className="text-[10px] text-purple-300 font-heading font-black tracking-wider uppercase">
                      TU CLAN Y GUERRA TERRITORIAL
                    </div>
                    <div className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{userClan.crest}</span>
                      <span>{userClan.name}</span>
                    </div>
                  </div>
                </div>
                <div className="font-mono text-xs font-black text-purple-300 bg-purple-500/20 border border-purple-400/40 px-3 py-1.5 rounded-xl">
                  Nvl {userClan.level} ({userClan.points} Pts)
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      {content}
    </div>
  );
};
