import React, { useEffect } from 'react';
import { X, Shield, Zap, Sparkles, Coins, ArrowUpRight, ArrowDownRight, Hammer, CheckCircle2, FlaskConical } from 'lucide-react';
import { InventoryItem } from '../types';
import { sfx } from '../services/sfx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  currentlyEquippedItem?: InventoryItem | null;
  onToggleEquip?: (inventoryId: string) => void;
  onUseConsumable?: (inventoryId: string) => void;
  onSellItem?: (inventoryId: string) => void;
  onOpenForge?: (item?: InventoryItem) => void;
}

export const ItemInspectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  currentlyEquippedItem,
  onToggleEquip,
  onUseConsumable,
  onSellItem,
  onOpenForge
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isConsumable = (item.slot || 'CONSUMABLE') === 'CONSUMABLE';
  const isEquipped = item.is_equipped;
  const sellGold = item.sell_value || Math.max(1, Math.floor((item.gold_cost || 20) / 2));
  const refineLevel = item.refine_level || 0;

  // Comparativa contra el objeto equipado actualmente en la misma ranura
  const showCompare = !isConsumable && !isEquipped && currentlyEquippedItem && currentlyEquippedItem.inventory_id !== item.inventory_id;

  const diffAtk = showCompare ? (item.stat_atk || 0) - (currentlyEquippedItem?.stat_atk || 0) : 0;
  const diffDef = showCompare ? (item.stat_def || 0) - (currentlyEquippedItem?.stat_def || 0) : 0;
  const diffCrit = showCompare ? (item.stat_crit_pct || 0) - (currentlyEquippedItem?.stat_crit_pct || 0) : 0;
  const diffRaidDmg = showCompare ? (item.stat_raid_dmg_pct || 0) - (currentlyEquippedItem?.stat_raid_dmg_pct || 0) : 0;
  const diffD20 = showCompare ? (item.stat_d20_bonus || 0) - (currentlyEquippedItem?.stat_d20_bonus || 0) : 0;
  const diffGold = showCompare ? (item.stat_gold_pct || 0) - (currentlyEquippedItem?.stat_gold_pct || 0) : 0;
  const diffXp = showCompare ? (item.stat_xp_pct || 0) - (currentlyEquippedItem?.stat_xp_pct || 0) : 0;

  const getRarityConfig = (rarity?: string) => {
    switch ((rarity || 'COMMON').toUpperCase()) {
      case 'MYTHIC':
        return {
          label: 'MÍTICO',
          border: 'border-rose-500',
          glow: 'shadow-[0_0_35px_rgba(244,63,94,0.45)]',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/70',
          titleColor: 'text-rose-400',
          gradient: 'from-rose-950/70 via-surface-card to-surface-card'
        };
      case 'LEGENDARY':
        return {
          label: 'LEGENDARIO',
          border: 'border-amber-400',
          glow: 'shadow-[0_0_30px_rgba(251,191,36,0.4)]',
          badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/70',
          titleColor: 'text-amber-300',
          gradient: 'from-amber-950/70 via-surface-card to-surface-card'
        };
      case 'EPIC':
        return {
          label: 'ÉPICO',
          border: 'border-purple-500',
          glow: 'shadow-[0_0_25px_rgba(168,85,247,0.35)]',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/70',
          titleColor: 'text-purple-300',
          gradient: 'from-purple-950/70 via-surface-card to-surface-card'
        };
      case 'RARE':
        return {
          label: 'RARO',
          border: 'border-blue-500',
          glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/70',
          titleColor: 'text-blue-300',
          gradient: 'from-blue-950/60 via-surface-card to-surface-card'
        };
      case 'UNCOMMON':
        return {
          label: 'POCO COMÚN',
          border: 'border-emerald-500',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60',
          titleColor: 'text-emerald-300',
          gradient: 'from-emerald-950/50 via-surface-card to-surface-card'
        };
      case 'COMMON':
      default:
        return {
          label: 'COMÚN',
          border: 'border-surface-border',
          glow: 'shadow-xl',
          badgeBg: 'bg-surface text-gray-400 border-surface-border',
          titleColor: 'text-white',
          gradient: 'from-surface/80 via-surface-card to-surface-card'
        };
    }
  };

  const rarityCfg = getRarityConfig(item.rarity);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-surface-card border-2 ${rarityCfg.border} ${rarityCfg.glow} w-full max-w-lg rounded-3xl flex flex-col max-h-[92vh] overflow-hidden transition-all duration-300 shadow-2xl`}
      >
        {/* Header con estilo RPG y Badge de Rareza */}
        <div className={`p-4 sm:p-5 border-b border-surface-border/80 bg-gradient-to-r ${rarityCfg.gradient} flex items-center justify-between`}>
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-black/70 border border-surface-border flex items-center justify-center text-3xl shadow-inner shrink-0">
                {item.icon || (isConsumable ? '🧪' : '⚔️')}
              </div>
              {refineLevel > 0 && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black font-mono font-black text-[10px] shadow-md border border-amber-300 animate-pulse">
                  +{refineLevel}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-cinzel text-base sm:text-lg font-black truncate ${rarityCfg.titleColor}`}>
                  {item.name}
                </h3>
                {refineLevel > 0 && (
                  <span className="text-amber-400 font-mono font-black text-sm">+{refineLevel}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase border ${rarityCfg.badgeBg}`}>
                  {rarityCfg.label}
                </span>
                <span className="text-[10px] text-gray-300 font-mono uppercase bg-black/50 px-2 py-0.5 rounded-lg border border-surface-border">
                  {item.slot || 'CONSUMIBLE'}
                </span>
                {item.item_level && (
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/40">
                    iLvl {item.item_level}
                  </span>
                )}
                {isEquipped && (
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/50 flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" /> EQUIPADO
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.click();
              onClose();
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface border border-transparent hover:border-surface-border transition-all cursor-pointer shrink-0 ml-2"
            title="Cerrar Ficha"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo de la Ficha */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Descripción de Lore y Crónica */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/20 via-black/40 to-black/40 border border-primary/25 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold tracking-wider text-primary">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Crónica del Artefacto
            </div>
            <p className="text-xs text-gray-300 font-serif italic leading-relaxed">
              "{item.description || 'Una reliquia rescatada de las profundidades de la taberna de Valerius.'}"
            </p>
          </div>

          {/* Estadísticas del Objeto */}
          <div className="space-y-2">
            <h4 className="font-heading font-extrabold text-xs text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" /> Atributos Mágicos
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
              {item.stat_atk ? (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between shadow-sm">
                  <span className="text-gray-400 text-[11px]">Ataque:</span>
                  <span className="font-bold text-rose-300">+{item.stat_atk} ATK</span>
                </div>
              ) : null}
              {item.stat_def ? (
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between shadow-sm">
                  <span className="text-gray-400 text-[11px]">Defensa:</span>
                  <span className="font-bold text-blue-300">+{item.stat_def} DEF</span>
                </div>
              ) : null}
              {item.stat_d20_bonus ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between shadow-sm">
                  <span className="text-gray-400 text-[11px]">Tirada D20:</span>
                  <span className="font-bold text-amber-300">+{item.stat_d20_bonus} D20</span>
                </div>
              ) : null}
              {item.stat_crit_pct ? (
                <div className="p-2.5 rounded-xl bg-rose-400/10 border border-rose-400/30 flex items-center justify-between shadow-sm">
                  <span className="text-gray-400 text-[11px]">Crítico:</span>
                  <span className="font-bold text-rose-300">+{item.stat_crit_pct}%</span>
                </div>
              ) : null}
              {item.stat_raid_dmg_pct ? (
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between shadow-sm">
                  <span className="text-gray-400 text-[11px]">Daño Boss:</span>
                  <span className="font-bold text-orange-300">+{item.stat_raid_dmg_pct}%</span>
                </div>
              ) : null}
              {item.stat_gold_pct ? (
                <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between shadow-sm">
                  <span className="text-gray-400 text-[11px]">Bono Oro:</span>
                  <span className="font-bold text-yellow-300">+{item.stat_gold_pct}%</span>
                </div>
              ) : null}
              {item.stat_xp_pct ? (
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between shadow-sm">
                  <span className="text-gray-400 text-[11px]">Bono XP:</span>
                  <span className="font-bold text-purple-300">+{item.stat_xp_pct}%</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Comparador Táctico contra el Objeto Equipado */}
          {showCompare && currentlyEquippedItem && (
            <div className="p-3.5 rounded-2xl bg-black/60 border-2 border-primary/40 space-y-2 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-extrabold text-primary flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Comparativa contra lo equipado:
                </span>
                <span className="text-[11px] font-mono text-gray-300 truncate max-w-[180px]">
                  {currentlyEquippedItem.name}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-mono">
                {diffAtk !== 0 && (
                  <div className={`p-2 rounded-xl border flex items-center justify-between ${diffAtk > 0 ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-red-500/15 border-red-500/50 text-red-300'}`}>
                    <span>Ataque:</span>
                    <span className="font-bold flex items-center">
                      {diffAtk > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {diffAtk > 0 ? `+${diffAtk}` : diffAtk} ATK
                    </span>
                  </div>
                )}
                {diffDef !== 0 && (
                  <div className={`p-2 rounded-xl border flex items-center justify-between ${diffDef > 0 ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-red-500/15 border-red-500/50 text-red-300'}`}>
                    <span>Defensa:</span>
                    <span className="font-bold flex items-center">
                      {diffDef > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {diffDef > 0 ? `+${diffDef}` : diffDef} DEF
                    </span>
                  </div>
                )}
                {diffCrit !== 0 && (
                  <div className={`p-2 rounded-xl border flex items-center justify-between ${diffCrit > 0 ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-red-500/15 border-red-500/50 text-red-300'}`}>
                    <span>Crítico:</span>
                    <span className="font-bold flex items-center">
                      {diffCrit > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {diffCrit > 0 ? `+${diffCrit}%` : `${diffCrit}%`}
                    </span>
                  </div>
                )}
                {diffD20 !== 0 && (
                  <div className={`p-2 rounded-xl border flex items-center justify-between ${diffD20 > 0 ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-red-500/15 border-red-500/50 text-red-300'}`}>
                    <span>D20:</span>
                    <span className="font-bold flex items-center">
                      {diffD20 > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {diffD20 > 0 ? `+${diffD20}` : diffD20}
                    </span>
                  </div>
                )}
                {diffGold !== 0 && (
                  <div className={`p-2 rounded-xl border flex items-center justify-between ${diffGold > 0 ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-red-500/15 border-red-500/50 text-red-300'}`}>
                    <span>Oro:</span>
                    <span className="font-bold flex items-center">
                      {diffGold > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {diffGold > 0 ? `+${diffGold}%` : `${diffGold}%`}
                    </span>
                  </div>
                )}
                {diffXp !== 0 && (
                  <div className={`p-2 rounded-xl border flex items-center justify-between ${diffXp > 0 ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-red-500/15 border-red-500/50 text-red-300'}`}>
                    <span>XP:</span>
                    <span className="font-bold flex items-center">
                      {diffXp > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {diffXp > 0 ? `+${diffXp}%` : `${diffXp}%`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Afijos Rúnicos Procedurales */}
          {item.affixes && item.affixes.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-heading font-extrabold text-xs text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Encantamientos Rúnicos ({item.affixes.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {item.affixes.map((affix, aIdx) => (
                  <div
                    key={aIdx}
                    className="p-2 rounded-xl bg-surface border border-primary/35 text-primary text-xs font-mono flex items-center gap-1.5 shadow-sm"
                  >
                    <span>⚡</span>
                    <span className="truncate">{affix}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Poder Pasivo Legendario */}
          {item.legendary_perk && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-primary/10 to-amber-500/20 border-2 border-amber-500/60 shadow-[0_0_20px_rgba(251,191,36,0.25)] space-y-1">
              <div className="flex items-center gap-1.5 font-heading font-black text-amber-300 text-xs uppercase tracking-wider">
                <span>🌟 Poder Pasivo Legendario</span>
              </div>
              <div className="font-heading font-bold text-white text-sm">
                {item.legendary_perk.name}
              </div>
              <p className="text-xs text-amber-100/90 font-sans leading-relaxed">
                {item.legendary_perk.description}
              </p>
            </div>
          )}

          {/* Valor de Empeño */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface/80 border border-surface-border text-xs font-mono">
            <span className="text-gray-400">Tasación en el Bazar del Gremio:</span>
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> {sellGold} 🪙 de Oro
            </span>
          </div>
        </div>

        {/* Barra de Acciones del Pie */}
        <div className="p-4 border-t border-surface-border/80 bg-black/60 flex flex-wrap items-center justify-between gap-2">
          {/* Botón de Venta */}
          {!isEquipped && onSellItem ? (
            <button
              onClick={() => {
                sfx.coin();
                onSellItem(item.inventory_id);
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl text-amber-400 hover:bg-amber-400/15 border border-amber-500/30 text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Vender (+{sellGold} 🪙)</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {/* Ir al Yunque de Forja */}
            {!isConsumable && onOpenForge && (
              <button
                onClick={() => {
                  sfx.click();
                  onClose();
                  onOpenForge(item);
                }}
                className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-card text-gray-300 hover:text-white border border-surface-border text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Llevar al Yunque de Valerius para refinar"
              >
                <Hammer className="w-3.5 h-3.5 text-amber-400" />
                <span>Yunque</span>
              </button>
            )}

            {/* Acción Primaria: Consumir o Equipar/Desequipar */}
            {isConsumable && onUseConsumable ? (
              <button
                onClick={() => {
                  onUseConsumable(item.inventory_id);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Consumir Elixir</span>
              </button>
            ) : onToggleEquip ? (
              <button
                onClick={() => {
                  onToggleEquip(item.inventory_id);
                  onClose();
                }}
                className={`px-5 py-2 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  isEquipped
                    ? 'bg-crimson/30 hover:bg-crimson/50 text-crimson border border-crimson/50'
                    : 'bg-gradient-to-r from-primary to-amber-500 hover:brightness-110 text-black font-black'
                }`}
              >
                <span>{isEquipped ? 'Desequipar de Ranura' : 'Equipar en Ranura'}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
