import React, { useState, useEffect } from 'react';
import { X, Dices, Heart, Coins, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { sfx } from '../services/sfx';

interface PetCatalogItem {
  type: string;
  name: string;
  bonus: string;
  cost: number;
}

interface UserPet {
  id: string;
  pet_type: string;
  name: string;
  level: number;
  bonus_type: string;
  bonus_value: number;
  is_active: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerGold: number;
  onRefreshPlayer: () => void;
}

export const PetsAndGamesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  playerGold,
  onRefreshPlayer
}) => {
  const [activeTab, setActiveTab] = useState<'PETS' | 'DICE'>('PETS');
  const [catalog, setCatalog] = useState<PetCatalogItem[]>([]);
  const [userPets, setUserPets] = useState<UserPet[]>([]);
  const [wager, setWager] = useState('10');
  const [diceResult, setDiceResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPets();
    }
  }, [isOpen]);

  const fetchPets = async () => {
    try {
      const res = await api.get('/player/pets');
      if (res.data.success) {
        setCatalog(res.data.catalog);
        setUserPets(res.data.userPets);
      }
    } catch (e) {
      console.error('Error cargando mascotas', e);
    }
  };

  const handleAdopt = async (type: string, cost: number) => {
    if (playerGold < cost || loading) {
      setStatusMsg({ type: 'err', text: `Oro insuficiente para adoptar. Necesitas ${cost} 🪙.` });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/player/pets/adopt', { pet_type: type });
      if (res.data.success) {
        sfx.playAudio('coins');
        sfx.playAudio('levelup');
        sfx.haptic([50, 40]);
        setStatusMsg({ type: 'ok', text: `¡Has adoptado a tu nuevo compañero!` });
        fetchPets();
        onRefreshPlayer();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || 'Error al adoptar mascota' });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayDice = async (e: React.FormEvent) => {
    e.preventDefault();
    const wagerNum = Number(wager);
    if (playerGold < wagerNum || loading) return;
    setLoading(true);
    sfx.playAudio('dice');
    sfx.haptic([20, 30]);

    try {
      const res = await api.post('/player/minigame/liars-dice', { wager: wagerNum });
      if (res.data.success) {
        setDiceResult(res.data);
        if (res.data.won) {
          sfx.playAudio('coins');
          sfx.playAudio('crit');
          sfx.haptic([50, 40, 50]);
          setStatusMsg({ type: 'ok', text: `¡Ganaste la apuesta! Recibes +${wagerNum} 🪙` });
        } else {
          sfx.playAudio('fumble');
          sfx.haptic([40]);
          setStatusMsg({ type: 'err', text: `El Tabernero ganó esta ronda. Pierdes -${wagerNum} 🪙` });
        }
        onRefreshPlayer();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || 'Error en el juego de dados' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-card border-2 border-emerald-500/70 w-full max-w-xl rounded-2xl shadow-[0_0_60px_rgba(16,185,129,0.3)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 to-surface">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-emerald-300 flex items-center gap-2">
                Compañeros Místicos & Juegos de Azar
              </h2>
              <p className="text-xs text-gray-400 font-serif">Mascotas del Gremio y Dados de Mentiroso</p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.playAudio('click');
              onClose();
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface border border-transparent hover:border-border transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/50 bg-black/20 p-2 gap-2">
          <button
            onClick={() => {
              sfx.haptic([15]);
              setActiveTab('PETS');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'PETS' ? 'bg-emerald-600 text-white shadow-md font-black' : 'text-gray-400 hover:text-white hover:bg-surface'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Mascotas ({userPets.length})</span>
          </button>
          <button
            onClick={() => {
              sfx.haptic([15]);
              setActiveTab('DICE');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'DICE' ? 'bg-primary text-black shadow-md font-black' : 'text-gray-400 hover:text-white hover:bg-surface'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Dados de Mentiroso</span>
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
            <button onClick={() => setStatusMsg(null)} className="text-gray-400 hover:text-white ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'PETS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-400 font-serif">
                <span>Adopta un compañero para potenciar tus atributos pasivos</span>
                <span className="font-mono font-bold text-primary">Tu Oro: {playerGold} 🪙</span>
              </div>

              <div className="space-y-3">
                {catalog.map((pet) => {
                  const alreadyAdopted = userPets.some((p) => p.pet_type === pet.type);
                  return (
                    <div
                      key={pet.type}
                      className="p-4 rounded-xl bg-surface/80 border border-emerald-500/30 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-heading font-black text-sm text-white">{pet.name}</h4>
                        <p className="text-xs text-emerald-400 font-serif">{pet.bonus}</p>
                        <p className="text-[11px] text-gray-400 font-mono">Coste de adopción: {pet.cost} 🪙</p>
                      </div>

                      {alreadyAdopted ? (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald/20 text-emerald font-heading font-bold text-xs border border-emerald/40">
                          Adoptado ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAdopt(pet.type, pet.cost)}
                          disabled={playerGold < pet.cost || loading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-heading font-bold text-xs rounded-lg transition-all cursor-pointer shadow"
                        >
                          Adoptar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'DICE' && (
            <div className="space-y-4 text-center max-w-md mx-auto py-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/50 flex items-center justify-center mx-auto text-3xl">
                🎲
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-white">Mesa de Dados del Tabernero</h3>
                <p className="text-xs text-gray-400 font-serif">
                  Tira 3 dados contra el Tabernero. Si la suma de tus dados supera a la suya, duplicas tu apuesta.
                </p>
              </div>

              <form onSubmit={handlePlayDice} className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  {[10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setWager(String(amount))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        wager === String(amount) ? 'bg-primary text-black font-black shadow' : 'bg-surface border border-border text-gray-400'
                      }`}
                    >
                      {amount} 🪙
                    </button>
                  ))}
                </div>

                {diceResult && (
                  <div className="p-4 rounded-xl bg-surface/90 border border-border/80 space-y-2 animate-fadeIn">
                    <div className="flex justify-around text-xs font-heading">
                      <div>
                        <span className="text-gray-400">Tus Dados:</span>
                        <div className="font-mono text-base font-black text-primary mt-1">
                          [{diceResult.playerDice.join(', ')}] = {diceResult.playerTotal}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Tabernero:</span>
                        <div className="font-mono text-base font-black text-crimson mt-1">
                          [{diceResult.tavernDice.join(', ')}] = {diceResult.tavernTotal}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={playerGold < Number(wager) || loading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-amber-400 text-black font-heading font-black text-sm rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Dices className="w-4 h-4" />
                  <span>Apostar {wager} Oro & Tirar Dados</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
