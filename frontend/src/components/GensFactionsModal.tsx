import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  Swords, 
  Crown, 
  Flame, 
  Sparkles, 
  Award, 
  Users, 
  CheckCircle2, 
  RefreshCw,
  Trophy,
  Zap,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { sfx } from '../services/sfx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefreshPlayer: () => void;
}

export const GensFactionsModal: React.FC<Props> = ({ isOpen, onClose, onRefreshPlayer }) => {
  const [activeTab, setActiveTab] = useState<'FACTION' | 'RANKINGS' | 'QUESTS'>('FACTION');
  const [loading, setLoading] = useState(false);
  const [gensData, setGensData] = useState<any>(null);
  const [clanRankings, setClanRankings] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGensState();
      loadClanRankings();
    }
  }, [isOpen]);

  const loadGensState = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gens/state');
      setGensData(res.data);
    } catch (err: any) {
      console.warn('Error al cargar estado de Gens:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClanRankings = async () => {
    try {
      const res = await api.get('/gens/clan-rankings');
      setClanRankings(res.data?.clans || []);
    } catch (err: any) {
      console.warn('Error al cargar ranking de clanes:', err);
    }
  };

  const handleJoinFaction = async (faction: 'DUPRIAN' | 'VANERT') => {
    try {
      setLoading(true);
      sfx.playAudio('fanfare');
      const res = (await api.post('/gens/join', { faction })).data;
      setStatusMsg({ type: 'ok', text: res.message });
      loadGensState();
      onRefreshPlayer();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const userGens = gensData?.gensFaction;
  const userRank = gensData?.gensRank;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-surface via-background to-black border-2 border-amber-500/50 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.3)] p-5 sm:p-7 space-y-6 text-white my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header Principal */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-black/70 rounded-[14px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <span>FACCIONES GENS & GUILD RANKING</span>
              </h2>
              <p className="text-xs text-gray-400 font-serif italic">
                Alineación Duprian vs Vanert • Rangos de Élite • Clasificación de Clanes
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

        {/* Tab Selector */}
        <div className="flex bg-surface-card/90 p-1.5 rounded-2xl border border-surface-border gap-1.5">
          <button
            onClick={() => setActiveTab('FACTION')}
            className={`flex-1 py-2.5 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'FACTION'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" /> Mi Facción Gens
          </button>

          <button
            onClick={() => setActiveTab('RANKINGS')}
            className={`flex-1 py-2.5 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'RANKINGS'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" /> Ranking de Clanes (MU)
          </button>

          <button
            onClick={() => setActiveTab('QUESTS')}
            className={`flex-1 py-2.5 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'QUESTS'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-black shadow-lg font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4" /> Misiones de Facción
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className={`p-3 rounded-xl border text-xs font-semibold text-center ${
            statusMsg.type === 'ok' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-crimson/20 border-crimson/50 text-crimson'
          }`}>
            {statusMsg.text}
          </div>
        )}

        {/* TAB 1: MI FACCIÓN GENS */}
        {activeTab === 'FACTION' && (
          <div className="space-y-6">
            {userGens ? (
              <div className="p-6 rounded-2xl bg-surface-card/60 border border-amber-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{userGens === 'DUPRIAN' ? '🌹' : '☀️'}</span>
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Facción Actual</span>
                      <h3 className="font-heading text-xl font-black text-amber-300 uppercase">
                        {userGens === 'DUPRIAN' ? 'GENS DUPRIAN (Rosa Sangrienta)' : 'GENS VANERT (Sol Arcano)'}
                      </h3>
                      <p className="text-xs text-gray-300 font-serif">
                        {userGens === 'DUPRIAN' ? 'Defensores de la fuerza militar y el honor imperecedero.' : 'Guardianes de la sabiduría arcana y los misterios antiguos.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/50 px-4 py-2 rounded-2xl border border-amber-500/40 text-right">
                    <span className="text-[10px] font-mono text-gray-400 block">PUNTOS DE CONTRIBUCIÓN</span>
                    <span className="font-mono text-lg font-bold text-amber-400">{(gensData?.gensPoints || 0).toLocaleString()} PTS</span>
                  </div>
                </div>

                {/* Rango Actual */}
                {userRank && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-surface to-black border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{userRank.icon}</span>
                      <div>
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Rango de Élite</span>
                        <h4 className="font-heading text-base font-bold text-white">{userRank.name}</h4>
                        <span className="text-xs text-emerald-400 font-mono">Bono Pasivo: {userRank.statBonus}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gray-400">Título: "{userRank.bonusTitle}"</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="font-heading text-lg font-bold text-amber-400 uppercase">ELIGE TU ALINEACIÓN GENS</h3>
                  <p className="text-xs text-gray-300 font-serif max-w-lg mx-auto">
                    Únete a una de las dos facciones rivales globales. La elección influirá en tus guerras de clan, alianzas y rangos militares.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Duprian Card */}
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-red-950/40 via-surface to-black border-2 border-red-500/50 space-y-4 text-center hover:border-red-400 transition-all shadow-xl">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-3xl">
                      🌹
                    </div>
                    <h4 className="font-heading text-xl font-black text-red-400 uppercase">GENS DUPRIAN</h4>
                    <p className="text-xs text-gray-300 font-serif">
                      La Rosa Sangrienta. Enfocada en la dominación física, asedios feroces y valor guerrero incontestable.
                    </p>
                    <button
                      onClick={() => handleJoinFaction('DUPRIAN')}
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                    >
                      Jurar Lealtad a Duprian
                    </button>
                  </div>

                  {/* Vanert Card */}
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-950/40 via-surface to-black border-2 border-amber-500/50 space-y-4 text-center hover:border-amber-400 transition-all shadow-xl">
                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-3xl">
                      ☀️
                    </div>
                    <h4 className="font-heading text-xl font-black text-amber-400 uppercase">GENS VANERT</h4>
                    <p className="text-xs text-gray-300 font-serif">
                      El Sol Arcano. Guiados por la sabiduría de los sabios, la estrategia mágica y la diplomacia de las estrellas.
                    </p>
                    <button
                      onClick={() => handleJoinFaction('VANERT')}
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                    >
                      Jurar Lealtad a Vanert
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RANKING DE CLANES (GUILD RANKING MU ONLINE) */}
        {activeTab === 'RANKINGS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-amber-400 uppercase flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>TABLA GENERAL DE CLANES (GUILD HALL)</span>
              </h3>
              <button
                onClick={loadClanRankings}
                className="px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-xs text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Actualizar
              </button>
            </div>

            <div className="space-y-2">
              {clanRankings.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-serif text-sm">
                  No hay clanes registrados en el reino por el momento.
                </div>
              ) : (
                clanRankings.map((c, idx) => (
                  <div 
                    key={c.id} 
                    className="p-4 rounded-xl bg-surface-card/70 border border-surface-border flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                        idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-surface border border-surface-border text-gray-400'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="text-2xl">{c.emblem}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-black text-sm text-white">{c.name}</h4>
                          <span className="text-[10px] font-mono text-amber-400 border border-amber-500/40 px-1.5 rounded">[{c.tag}]</span>
                          <span className="text-[10px] font-mono text-gray-400">Nvl {c.level}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-serif">
                          Líder: <span className="text-gray-200 font-semibold">{c.leader_name}</span> • Facción: <span className="text-amber-300 font-bold">{c.gens_faction}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs space-y-0.5">
                      <div className="text-amber-400 font-bold">{c.clan_xp.toLocaleString()} XP Clan</div>
                      <div className="text-gray-400">{c.treasury_gold.toLocaleString()} 🪙 Tesorería</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MISIONES DE FACCIÓN */}
        {activeTab === 'QUESTS' && (
          <div className="space-y-4">
            <h3 className="font-heading text-base font-bold text-amber-400 uppercase flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              <span>ASIGNACIONES PERIÓDICAS DE FACCIÓN</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(gensData?.quests || []).map((q: any) => (
                <div key={q.id} className="p-4 rounded-2xl bg-surface-card/80 border border-surface-border space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-sm text-white">{q.title}</h4>
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                      +{q.rewardPoints} PTS Gens
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-serif">{q.description}</p>

                  <div className="flex items-center justify-between text-xs font-mono border-t border-white/10 pt-2">
                    <span className="text-gray-400">Recompensa: +{q.rewardGold} 🪙</span>
                    <span className="text-emerald-400 font-bold">Progreso: {q.current}/{q.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
