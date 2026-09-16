import React, { useState, useEffect } from 'react';
import { X, Send, ShoppingBag, MessageSquare, Coins, ArrowRight, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import api from '../services/api';
import { sfx } from '../services/sfx';

interface Shout {
  id: string;
  player_id: string;
  player_name: string;
  secret_class: string;
  title?: string;
  message: string;
  created_at: string;
}

interface MarketListing {
  id: string;
  seller_id: string;
  seller_name: string;
  item_id: string;
  item_name: string;
  item_description: string;
  item_icon: string;
  gold_price: number;
  status: string;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerGold: number;
  inventory: any[];
  onRefreshPlayer: () => void;
}

export const TavernWallAndMarketModal: React.FC<Props> = ({
  isOpen,
  onClose,
  playerGold,
  inventory,
  onRefreshPlayer
}) => {
  const [activeTab, setActiveTab] = useState<'WALL' | 'MARKET' | 'SELL'>('WALL');
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [newShout, setNewShout] = useState('');
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [selectedInvId, setSelectedInvId] = useState('');
  const [sellPrice, setSellPrice] = useState('20');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchShouts();
      fetchListings();
    }
  }, [isOpen]);

  const fetchShouts = async () => {
    try {
      const res = await api.get('/player/tavern/shouts');
      if (res.data.success) {
        setShouts(res.data.shouts);
      }
    } catch (e) {
      console.error('Error cargando muro de taberna', e);
    }
  };

  const fetchListings = async () => {
    try {
      const res = await api.get('/player/market/listings');
      if (res.data.success) {
        setListings(res.data.listings);
      }
    } catch (e) {
      console.error('Error cargando mercado', e);
    }
  };

  const handlePostShout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShout.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/player/tavern/shouts', { message: newShout.trim() });
      if (res.data.success) {
        sfx.playAudio('click');
        sfx.haptic([30, 20]);
        setNewShout('');
        setShouts((prev) => [res.data.shout, ...prev]);
        setStatusMsg({ type: 'ok', text: '¡Tu voz resonó en toda la Taberna!' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || 'Error al gritar en la taberna' });
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (listing: MarketListing) => {
    if (playerGold < listing.gold_price) {
      sfx.playAudio('fumble');
      setStatusMsg({ type: 'err', text: `Oro insuficiente. Necesitas ${listing.gold_price} 🪙.` });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/player/market/buy/${listing.id}`);
      if (res.data.success) {
        sfx.playAudio('coins');
        sfx.playAudio('equip');
        sfx.haptic([40, 30, 50]);
        setStatusMsg({ type: 'ok', text: `¡Compraste "${listing.item_name}" con éxito!` });
        fetchListings();
        onRefreshPlayer();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || 'Error en la transacción' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvId || !sellPrice) return;
    setLoading(true);
    try {
      const res = await api.post('/player/market/list', {
        inventory_id: selectedInvId,
        gold_price: Number(sellPrice)
      });
      if (res.data.success) {
        sfx.playAudio('coins');
        sfx.haptic([30]);
        setStatusMsg({ type: 'ok', text: '¡Oferta publicada en el Mercado P2P!' });
        setSelectedInvId('');
        setActiveTab('MARKET');
        fetchListings();
        onRefreshPlayer();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || 'Error al listar ítem' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const unequippedInventory = inventory.filter((i) => !i.is_equipped && !i.consumed_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-card border-2 border-primary/50 w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.25)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60 bg-surface/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/40">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-black text-primary flex items-center gap-2">
                Taberna & Comercio P2P
              </h2>
              <p className="text-xs text-gray-400 font-serif">Muro de anuncios comunitarios y bazar de aventureros</p>
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-border/50 bg-black/20 p-2 gap-2">
          <button
            onClick={() => {
              sfx.haptic([15]);
              setActiveTab('WALL');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'WALL' ? 'bg-primary text-black shadow-md font-black' : 'text-gray-400 hover:text-white hover:bg-surface'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Muro ({shouts.length})</span>
          </button>
          <button
            onClick={() => {
              sfx.haptic([15]);
              setActiveTab('MARKET');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'MARKET' ? 'bg-primary text-black shadow-md font-black' : 'text-gray-400 hover:text-white hover:bg-surface'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bazar P2P ({listings.length})</span>
          </button>
          <button
            onClick={() => {
              sfx.haptic([15]);
              setActiveTab('SELL');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'SELL' ? 'bg-amber-400 text-black shadow-md font-black' : 'text-gray-400 hover:text-white hover:bg-surface'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Vender Ítem</span>
          </button>
        </div>

        {/* Status Alert Banner */}
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

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: EL MURO DE LA TABERNA */}
          {activeTab === 'WALL' && (
            <div className="space-y-4">
              <form onSubmit={handlePostShout} className="flex gap-2">
                <input
                  type="text"
                  value={newShout}
                  onChange={(e) => setNewShout(e.target.value)}
                  placeholder="¡Haz oír tu voz en la taberna! (máx. 140 letras)..."
                  maxLength={140}
                  className="flex-1 bg-surface border border-border/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary placeholder:text-gray-500 font-serif"
                />
                <button
                  type="submit"
                  disabled={loading || !newShout.trim()}
                  className="px-4 py-2.5 bg-primary text-black font-heading font-black text-xs rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Gritar</span>
                </button>
              </form>

              <div className="space-y-3 pt-2">
                {shouts.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 text-sm font-serif">El silencio reina en la taberna... ¡sé el primero en hablar!</p>
                ) : (
                  shouts.map((shout) => (
                    <div
                      key={shout.id}
                      className="p-3.5 rounded-xl bg-surface/60 border border-border/50 hover:border-primary/40 transition-all space-y-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-primary">{shout.player_name}</span>
                          {shout.title && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-serif">
                              {shout.title}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.2 bg-surface text-gray-400 rounded border border-border/40 uppercase">
                            {shout.secret_class}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(shout.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200 font-serif leading-relaxed italic">"{shout.message}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MERCADO DE INTERCAMBIO P2P */}
          {activeTab === 'MARKET' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400 font-serif pb-1">
                <span>Ofertas activas de otros aventureros</span>
                <span className="text-primary font-mono font-bold">Tu fortuna: {playerGold} 🪙</span>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <ShoppingBag className="w-10 h-10 text-gray-600 mx-auto" />
                  <p className="text-gray-400 font-serif text-sm">No hay ofertas activas en el bazar en este momento.</p>
                  <button
                    onClick={() => setActiveTab('SELL')}
                    className="text-xs font-heading font-bold text-primary hover:underline"
                  >
                    ¡Sé el primero en vender un objeto de tu mochila!
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {listings.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-surface/80 border border-border/60 hover:border-primary/50 transition-all flex flex-col justify-between gap-3 shadow-md"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-black text-sm text-white flex items-center gap-1.5">
                            <span>{item.item_icon || '📦'}</span>
                            <span>{item.item_name}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold text-xs border border-amber-400/40">
                            {item.gold_price} 🪙
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-serif line-clamp-2">{item.item_description}</p>
                        <p className="text-[10px] text-gray-500 font-sans pt-1">Vendedor: <strong className="text-primary">{item.seller_name}</strong></p>
                      </div>

                      <button
                        onClick={() => handleBuy(item)}
                        disabled={loading || playerGold < item.gold_price}
                        className="w-full py-2 bg-primary text-black font-heading font-black text-xs rounded-lg hover:bg-primary-hover disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Comprar por {item.gold_price} Oro</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VENDER ÍTEM DE TU INVENTARIO */}
          {activeTab === 'SELL' && (
            <form onSubmit={handleCreateListing} className="space-y-4 max-w-md mx-auto py-2">
              <div className="space-y-2">
                <label className="text-xs font-heading font-bold text-gray-300">Selecciona el Ítem a Vender:</label>
                {unequippedInventory.length === 0 ? (
                  <p className="text-xs text-crimson font-serif p-3 bg-crimson/10 rounded-xl border border-crimson/30">
                    No tienes ítems desequipados para vender. Desequipa un ítem en tu Mochila primero.
                  </p>
                ) : (
                  <select
                    value={selectedInvId}
                    onChange={(e) => setSelectedInvId(e.target.value)}
                    className="w-full bg-surface border border-border/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary font-serif"
                    required
                  >
                    <option value="">-- Elige un ítem de tu inventario --</option>
                    {unequippedInventory.map((i) => (
                      <option key={i.inventory_id} value={i.inventory_id}>
                        {i.name} ({i.gold_cost || 50} 🪙 valor base)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-heading font-bold text-gray-300">Precio en Oro (🪙):</label>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="w-full bg-surface border border-border/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary font-mono"
                  required
                />
                <p className="text-[11px] text-gray-500 font-serif">El oro se acreditará automáticamente en tu bolsa cuando otro jugador compre el ítem.</p>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedInvId || !sellPrice}
                className="w-full py-3 bg-amber-400 text-black font-heading font-black text-sm rounded-xl hover:bg-amber-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-4"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publicar Oferta en el Mercado P2P</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
