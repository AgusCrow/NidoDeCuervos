import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Item, InventoryItem, Player, ItemSlot, ItemRarity } from '../types';
import { 
  ShoppingBag, 
  Sparkles, 
  Coins, 
  ArrowLeft, 
  Shield, 
  Sword, 
  CircleDot, 
  FlaskConical, 
  Search, 
  Tag, 
  DollarSign, 
  Check, 
  AlertCircle,
  Percent
} from 'lucide-react';
import { sfx } from '../services/sfx';

export const ShopInventoryPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [shopItems, setShopItems] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPct, setDiscountPct] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeMode, setActiveMode] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedSlot, setSelectedSlot] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [openingChest, setOpeningChest] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [meData, shopData] = await Promise.all([
        api.getMe(),
        api.getShopItems()
      ]);
      setPlayer(meData.player);
      setInventory(meData.inventory || []);
      setShopItems(shopData.items || []);
      setHasDiscount(Boolean(shopData.hasDiscount));
      setDiscountPct(shopData.discountPct || (shopData.hasDiscount ? 10 : 0));
    } catch (err: any) {
      console.error('Error al cargar tienda:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'ok' | 'err', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleBuy = async (item: Item) => {
    try {
      setActionId(item.id);
      sfx.coin();
      const res = await api.buyItem(item.id);
      showNotification('ok', res.message || `¡Compraste ${item.name}!`);
      await loadData();
    } catch (err: any) {
      sfx.playAudio('error');
      showNotification('err', err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleSell = async (inv: InventoryItem) => {
    try {
      setActionId(inv.inventory_id);
      sfx.coin();
      const res = await api.sellItem(inv.inventory_id);
      showNotification('ok', res.message || `¡Vendiste ${inv.name}!`);
      await loadData();
    } catch (err: any) {
      sfx.playAudio('error');
      showNotification('err', err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleOpenProceduralChest = async () => {
    if ((player?.gold || 0) < 40) {
      showNotification('err', 'Necesitas al menos 40 🪙 para abrir el Cofre Misterioso');
      return;
    }
    try {
      setOpeningChest(true);
      sfx.playAudio('dice');
      const res = await api.post('/player/items/generate-procedural', { source: 'SHOP' });
      if (res.data?.success) {
        sfx.playAudio('levelup');
        showNotification('ok', res.data.message || `¡Descubriste ${res.data.item?.name}!`);
        await loadData();
      }
    } catch (err: any) {
      showNotification('err', err.message || 'Error al forjar cofre');
    } finally {
      setOpeningChest(false);
    }
  };

  const getRarityBadge = (rarity?: ItemRarity) => {
    switch (rarity) {
      case 'UNCOMMON':
        return { label: 'Poco Común', border: 'border-emerald-500/50', text: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.15)]', cardBg: 'bg-gradient-to-b from-emerald-950/20 via-surface-card to-surface-card' };
      case 'RARE':
        return { label: 'Raro', border: 'border-blue-500/50', text: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'shadow-[0_0_12px_rgba(59,130,246,0.2)]', cardBg: 'bg-gradient-to-b from-blue-950/25 via-surface-card to-surface-card' };
      case 'EPIC':
        return { label: 'Épico', border: 'border-purple-500/60', text: 'text-purple-300', bg: 'bg-purple-500/10', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]', cardBg: 'bg-gradient-to-b from-purple-950/30 via-surface-card to-surface-card' };
      case 'LEGENDARY':
        return { label: 'Legendario', border: 'border-amber-400/70', text: 'text-amber-300', bg: 'bg-amber-400/15', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]', cardBg: 'bg-gradient-to-b from-amber-950/35 via-surface-card to-surface-card' };
      case 'MYTHIC':
        return { label: 'Mítico', border: 'border-rose-500/80', text: 'text-rose-300', bg: 'bg-rose-500/20', glow: 'shadow-[0_0_25px_rgba(244,63,94,0.35)]', cardBg: 'bg-gradient-to-b from-rose-950/40 via-surface-card to-surface-card' };
      case 'COMMON':
      default:
        return { label: 'Común', border: 'border-surface-border', text: 'text-gray-300', bg: 'bg-surface/40', glow: 'shadow-sm', cardBg: 'bg-surface-card' };
    }
  };

  const getSlotIcon = (slot?: ItemSlot) => {
    switch (slot) {
      case 'WEAPON': return <Sword className="w-3.5 h-3.5" />;
      case 'ARMOR': return <Shield className="w-3.5 h-3.5" />;
      case 'RING': return <CircleDot className="w-3.5 h-3.5" />;
      case 'AMULET': return <Sparkles className="w-3.5 h-3.5" />;
      case 'CONSUMABLE': return <FlaskConical className="w-3.5 h-3.5" />;
      default: return <Tag className="w-3.5 h-3.5" />;
    }
  };

  const filteredShopItems = shopItems.filter((i) => {
    const matchesSlot = selectedSlot === 'ALL' || (i.slot || 'CONSUMABLE') === selectedSlot;
    const matchesSearch = !searchQuery || 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      i.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSlot && matchesSearch;
  });

  const sellableItems = inventory.filter((inv) => !inv.is_equipped && !inv.consumed_at);

  if (loading) {
    return <div className="text-center p-12 font-cinzel text-primary font-bold text-lg animate-pulse">Consultando el Bazar del Gremio...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 px-3 sm:px-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface/90 border border-surface-border backdrop-blur-md shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white font-cinzel font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-primary" /> Volver al Grimorio
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {hasDiscount && (
            <span className="text-xs px-3 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>Descuento Activo: -{discountPct}%</span>
            </span>
          )}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-black/50 rounded-xl border border-primary/40 text-primary font-bold text-sm shadow">
            <Coins className="w-4 h-4 text-primary animate-bounce" />
            <span className="font-mono text-base">{player?.gold || 0}</span>
            <span className="text-xs uppercase text-gray-400">Oro</span>
          </div>
        </div>
      </div>

      {/* Mode Switcher: Buy vs Sell */}
      <div className="flex rounded-2xl bg-surface-card/90 p-1.5 border border-surface-border max-w-md mx-auto shadow-md">
        <button
          onClick={() => {
            sfx.haptic([15]);
            setActiveMode('BUY');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMode === 'BUY'
              ? 'bg-primary text-on-primary shadow-sm font-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Comprar ({shopItems.length})
        </button>
        <button
          onClick={() => {
            sfx.haptic([15]);
            setActiveMode('SELL');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeMode === 'SELL'
              ? 'bg-amber-400 text-black shadow-sm font-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Vender ({sellableItems.length})
        </button>
      </div>

      {/* Notification Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all animate-fadeIn ${
            feedbackMsg.type === 'ok'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'ok' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* ========================================== */}
      {/* MODO 1: COMPRAR AL MERCADER */}
      {/* ========================================== */}
      {activeMode === 'BUY' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Procedural ARPG Chest Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-surface-card to-amber-950/40 border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-3.5 text-left">
              <span className="text-3xl p-2.5 rounded-2xl bg-black/50 border border-purple-400/40 shadow-inner">
                🎁
              </span>
              <div>
                <h4 className="font-heading font-black text-sm text-white flex items-center gap-2">
                  <span>Cofre Misterioso del Gremio</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    Botín Procedural
                  </span>
                </h4>
                <p className="text-xs text-gray-300 font-sans mt-0.5">
                  Genera una pieza de equipo única adaptada a tu nivel con estadísticas aleatorias, afijos y posibles poderes legendarios.
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenProceduralChest}
              disabled={openingChest || (player?.gold || 0) < 40}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-amber-500 hover:brightness-110 text-white font-heading font-bold text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{openingChest ? 'Forjando...' : 'Abrir Cofre (40 🪙)'}</span>
            </button>
          </div>

          {/* Filters & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Slot Filter Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'WEAPON', label: '🗡️ Armas' },
                { id: 'ARMOR', label: '🛡️ Armaduras' },
                { id: 'RING', label: '💍 Anillos' },
                { id: 'AMULET', label: '📿 Amuletos' },
                { id: 'CONSUMABLE', label: '🧪 Pociones' }
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => {
                    sfx.haptic([10]);
                    setSelectedSlot(chip.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
                    selectedSlot === chip.id
                      ? 'bg-primary text-on-primary shadow-sm font-black scale-105'
                      : 'bg-surface-card border border-surface-border text-gray-300 hover:text-white hover:border-primary/40'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o efecto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-black/40 border border-surface-border text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Shop Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredShopItems.map((item) => {
              const rBadge = getRarityBadge(item.rarity);
              const cost = item.gold_cost || item.price || 0;
              const canAfford = (player?.gold || 0) >= cost;
              const levelReq = item.required_level || 1;
              const meetsLevel = (player?.level || 1) >= levelReq;
              const isBuying = actionId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl p-4 bg-surface-card/90 border border-surface-border hover:border-primary/40 flex flex-col justify-between space-y-3.5 transition-all duration-300 shadow-md hover:shadow-xl relative overflow-hidden group"
                >
                  {/* Item Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 rounded-xl bg-surface border border-surface-border shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                          {item.icon || '🎒'}
                        </span>
                        <div>
                          <h3 className="font-heading font-bold text-white text-sm leading-tight group-hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[9px] px-2 py-0.2 rounded-full border ${rBadge.border} ${rBadge.bg} ${rBadge.text} font-mono font-bold uppercase`}>
                              {rBadge.label}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                              {getSlotIcon(item.slot)} {item.slot || 'CONSUMABLE'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Gold Price Tag */}
                      <div className="text-right shrink-0">
                        <div className="px-2.5 py-1 bg-surface rounded-xl border border-primary/30 text-primary text-xs font-mono font-bold flex items-center gap-1 shadow-sm">
                          <Coins className="w-3.5 h-3.5 text-primary" />
                          <span>{cost}</span>
                        </div>
                        {item.original_cost && item.original_cost > cost && (
                          <span className="text-[9px] text-gray-500 line-through font-mono block mt-0.5">
                            {item.original_cost} 🪙
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed font-sans min-h-[32px]">
                      {item.description}
                    </p>

                    {/* Stats Matrix Pills */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {item.stat_atk ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold font-mono">
                          +{item.stat_atk} ATK
                        </span>
                      ) : null}
                      {item.stat_def ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold font-mono">
                          +{item.stat_def} DEF
                        </span>
                      ) : null}
                      {item.stat_d20_bonus ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold font-mono">
                          +{item.stat_d20_bonus} D20
                        </span>
                      ) : null}
                      {item.stat_gold_pct ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-bold font-mono">
                          +{item.stat_gold_pct}% Oro
                        </span>
                      ) : null}
                      {item.stat_xp_pct ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold font-mono">
                          +{item.stat_xp_pct}% XP
                        </span>
                      ) : null}
                      {item.stat_crit_pct ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-400/10 border border-rose-400/30 text-rose-300 font-bold font-mono">
                          +{item.stat_crit_pct}% Crítico
                        </span>
                      ) : null}
                      {levelReq > 1 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono font-bold ${
                          meetsLevel ? 'bg-surface border-surface-border text-gray-300' : 'bg-crimson/15 border-crimson/40 text-crimson'
                        }`}>
                          Req. Nv. {levelReq}
                        </span>
                      )}
                      {item.class_req && item.class_req !== 'ALL' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary font-mono font-bold">
                          Solo {item.class_req}
                        </span>
                      )}
                    </div>

                    {/* Affixes & Legendary Perk */}
                    {item.affixes && item.affixes.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.affixes.map((affix, aIdx) => (
                          <span key={aIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-surface-border text-primary font-mono">
                            ⚡ {affix}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.legendary_perk && (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-[10px] text-amber-200 font-sans space-y-0.5">
                        <div className="font-heading font-bold text-amber-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{item.legendary_perk.name}</span>
                        </div>
                        <p className="italic text-gray-300">{item.legendary_perk.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Refined Buy Button */}
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={isBuying || !canAfford || !meetsLevel}
                    className={`w-full py-2.5 px-3 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      canAfford && meetsLevel
                        ? 'bg-primary text-on-primary hover:brightness-110 shadow-sm hover:shadow-[0_0_15px_var(--accent-glow)] active:scale-[0.98]'
                        : 'bg-surface/50 text-gray-500 border border-surface-border cursor-not-allowed opacity-60'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isBuying 
                        ? 'Comprando...' 
                        : !meetsLevel
                        ? `Requiere Nivel ${levelReq}`
                        : canAfford 
                        ? `Comprar por ${cost} 🪙` 
                        : `Oro insuficiente (${cost} 🪙)`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODO 2: VENDER AL MERCADER */}
      {/* ========================================== */}
      {activeMode === 'SELL' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-amber-300 text-sm">Bolsa de Reventa al Mercader</h3>
              <p className="text-xs text-gray-300 mt-0.5">
                El mercader compra cualquier ítem no equipado por el <strong className="text-amber-400">50% de su valor</strong> en oro.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 px-3 py-1 bg-amber-500/20 rounded-xl border border-amber-500/40 shrink-0">
              {sellableItems.length} disponibles
            </span>
          </div>

          {sellableItems.length === 0 ? (
            <div className="rounded-2xl p-12 text-center text-gray-400 font-cinzel bg-surface-card border border-surface-border">
              <p className="text-sm">No tienes objetos libres para vender en este momento.</p>
              <p className="text-xs text-gray-500 mt-1">Desequipa ítems en tu mochila si deseas venderlos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sellableItems.map((inv) => {
                const rBadge = getRarityBadge(inv.rarity);
                const sellGold = inv.sell_value || Math.max(1, Math.floor(inv.gold_cost / 2));
                const isSelling = actionId === inv.inventory_id;

                return (
                  <div
                    key={inv.inventory_id}
                    className={`p-3.5 rounded-2xl border-2 ${rBadge.border} ${rBadge.glow} ${rBadge.cardBg} flex flex-col justify-between space-y-3 transition-all`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="text-xl p-1.5 rounded-lg bg-surface border border-surface-border shrink-0 block">
                              {inv.icon || '🎒'}
                            </span>
                            {(inv.refine_level || 0) > 0 && (
                              <span className="absolute -top-1 -right-1 px-1 rounded-full bg-amber-500 text-black font-mono font-black text-[9px]">
                                +{inv.refine_level}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-heading font-bold text-white text-xs">{inv.name}</h4>
                              {(inv.refine_level || 0) > 0 && (
                                <span className="text-amber-400 font-mono text-[11px] font-bold">+{inv.refine_level}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${rBadge.border} ${rBadge.text} font-mono font-bold uppercase`}>
                                {rBadge.label}
                              </span>
                              {inv.item_level && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 border border-surface-border text-gray-400 font-mono">
                                  iLvl {inv.item_level}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/30">
                          +{sellGold} 🪙
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-2">{inv.description}</p>
                      {inv.affixes && inv.affixes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {inv.affixes.map((affix, aIdx) => (
                            <span key={aIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-surface-border text-primary font-mono">
                              ⚡ {affix}
                            </span>
                          ))}
                        </div>
                      )}
                      {inv.legendary_perk && (
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-[10px] text-amber-200 font-sans mt-1">
                          <span className="font-bold text-amber-300">✨ {inv.legendary_perk.name}: </span>
                          <span className="italic text-gray-300">{inv.legendary_perk.description}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSell(inv)}
                      disabled={isSelling}
                      className="w-full py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isSelling ? 'Vendiendo...' : `Vender por +${sellGold} Oro`}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
