import React, { useState } from 'react';
import { Shield, Sparkles, Zap, Award, ChevronRight, Swords, Eye, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { sfx } from '../services/sfx';
import { InventoryItem } from '../types';

export interface EquippedSlotItem {
  id: string;
  name: string;
  slot: 'WEAPON' | 'ARMOR' | 'RING' | 'AMULET' | 'CONSUMABLE';
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  icon: string;
  refine_level?: number;
  item_level?: number;
  stat_atk?: number;
  stat_def?: number;
  stat_d20_bonus?: number;
  stat_crit_pct?: number;
  stat_raid_dmg_pct?: number;
  stat_gold_pct?: number;
  stat_xp_pct?: number;
  rawItem?: InventoryItem;
}

interface Props {
  playerClass: string;
  playerName: string;
  playerLevel: number;
  equippedItems: EquippedSlotItem[];
  equippedTitle?: string | null;
  titlePerkDesc?: string | null;
  onSlotClick: (slot: string) => void;
  onInspectItem?: (item: InventoryItem) => void;
  onUnequipItem?: (inventoryId: string) => void;
  onOpenTitlesModal: () => void;
}

export const PaperDollAvatar: React.FC<Props> = ({
  playerClass,
  playerName,
  playerLevel,
  equippedItems,
  equippedTitle,
  titlePerkDesc,
  onSlotClick,
  onInspectItem,
  onUnequipItem,
  onOpenTitlesModal
}) => {
  const normClass = (playerClass || 'WARRIOR').toUpperCase();
  const [selectedSlotForMenu, setSelectedSlotForMenu] = useState<string | null>(null);

  const getClassTheme = () => {
    switch (normClass) {
      case 'MAGE':
        return {
          title: 'Canalizador de los Arcanos',
          avatarIcon: '🧙‍♂️',
          auraColor: 'from-blue-600/30 via-purple-600/20 to-transparent',
          borderGlow: 'border-blue-500/50',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          glowShadow: 'shadow-[0_0_25px_rgba(59,130,246,0.3)]'
        };
      case 'ROGUE':
        return {
          title: 'Sombra del Bajo Fondo',
          avatarIcon: '🗡️',
          auraColor: 'from-rose-600/30 via-emerald-600/20 to-transparent',
          borderGlow: 'border-rose-500/50',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          glowShadow: 'shadow-[0_0_25px_rgba(244,63,94,0.3)]'
        };
      case 'BARD':
        return {
          title: 'Minstrel de la Taberna',
          avatarIcon: '🎺',
          auraColor: 'from-amber-600/30 via-yellow-600/20 to-transparent',
          borderGlow: 'border-amber-500/50',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          glowShadow: 'shadow-[0_0_25px_rgba(251,191,36,0.3)]'
        };
      case 'WARRIOR':
      default:
        return {
          title: 'Baluarte de Hierro',
          avatarIcon: '🛡️',
          auraColor: 'from-red-600/30 via-orange-600/20 to-transparent',
          borderGlow: 'border-red-500/50',
          badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
          glowShadow: 'shadow-[0_0_25px_rgba(239,68,68,0.3)]'
        };
    }
  };

  const theme = getClassTheme();

  // Helper para buscar ítem por ranura
  const getItemInSlot = (slot: string) => {
    return equippedItems.find((i) => i.slot === slot);
  };

  // Helper de resplandor de forja
  const getForgeGlowStyle = (refineLevel?: number) => {
    const lvl = refineLevel || 0;
    if (lvl >= 10) {
      return 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.9)] ring-2 ring-purple-500/60 animate-pulse';
    }
    if (lvl >= 7) {
      return 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.85)] ring-1 ring-amber-400/60';
    }
    if (lvl >= 4) {
      return 'border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]';
    }
    return 'border-primary/40 hover:border-primary';
  };

  // Totales acumulados del equipamiento activo
  const totalAtk = equippedItems.reduce((acc, it) => acc + (it.stat_atk || 0), 0);
  const totalDef = equippedItems.reduce((acc, it) => acc + (it.stat_def || 0), 0);
  const totalD20 = equippedItems.reduce((acc, it) => acc + (it.stat_d20_bonus || 0), 0);
  const totalCrit = equippedItems.reduce((acc, it) => acc + (it.stat_crit_pct || 0), 0);
  const totalGoldPct = equippedItems.reduce((acc, it) => acc + (it.stat_gold_pct || 0), 0);
  const totalXpPct = equippedItems.reduce((acc, it) => acc + (it.stat_xp_pct || 0), 0);

  const slotConfigs: { slot: 'WEAPON' | 'ARMOR' | 'RING' | 'AMULET'; label: string; defaultIcon: string; hint: string }[] = [
    { slot: 'WEAPON', label: 'Arma', defaultIcon: '🗡️', hint: 'Poder de Ataque' },
    { slot: 'RING', label: 'Anillo', defaultIcon: '💍', hint: 'Fortuna & D20' },
    { slot: 'ARMOR', label: 'Pechera', defaultIcon: '🛡️', hint: 'Defensa de Hierro' },
    { slot: 'AMULET', label: 'Amuleto', defaultIcon: '📿', hint: 'XP & Mística' }
  ];

  const handleSlotClick = (slot: 'WEAPON' | 'ARMOR' | 'RING' | 'AMULET') => {
    sfx.click();
    sfx.haptic([15]);
    const equipped = getItemInSlot(slot);
    if (equipped) {
      // Abre el mini menú contextual de ranura
      setSelectedSlotForMenu(selectedSlotForMenu === slot ? null : slot);
    } else {
      // Ranura vacía: filtra inventario de inmediato
      onSlotClick(slot);
      setSelectedSlotForMenu(null);
    }
  };

  const renderSlotCard = (slotCfg: typeof slotConfigs[0]) => {
    const item = getItemInSlot(slotCfg.slot);
    const refineLvl = item?.refine_level || 0;
    const isMenuOpen = selectedSlotForMenu === slotCfg.slot;
    const forgeStyle = item ? getForgeGlowStyle(refineLvl) : 'border-dashed border-gray-600/70 hover:border-primary/70 bg-surface/50';

    return (
      <div key={slotCfg.slot} className="relative flex flex-col items-center">
        <button
          onClick={() => handleSlotClick(slotCfg.slot)}
          className={`relative group w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-card/95 border-2 flex flex-col items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg select-none ${forgeStyle}`}
          title={item ? `${slotCfg.label}: ${item.name} (+${refineLvl})` : `${slotCfg.label} Vacía - Toca para equipar`}
        >
          {item ? (
            <>
              <span className="text-2xl sm:text-3xl transition-transform group-hover:scale-110 drop-shadow-md">
                {item.icon || slotCfg.defaultIcon}
              </span>
              {refineLvl > 0 && (
                <span
                  className={`absolute -top-1.5 -right-1.5 text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full border shadow-md ${
                    refineLvl >= 10
                      ? 'bg-purple-900/95 text-purple-200 border-purple-400'
                      : refineLvl >= 7
                      ? 'bg-amber-900/95 text-amber-200 border-amber-400'
                      : 'bg-cyan-900/95 text-cyan-200 border-cyan-400'
                  }`}
                >
                  +{refineLvl}
                </span>
              )}
              <span className="text-[9px] text-gray-300 font-heading font-bold truncate max-w-[90%] tracking-tight mt-0.5">
                {item.name}
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-1">
              <span className="text-xl sm:text-2xl opacity-40 group-hover:opacity-75 transition-opacity">
                {slotCfg.defaultIcon}
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono text-gray-500 group-hover:text-primary uppercase mt-0.5 font-bold">
                + {slotCfg.label}
              </span>
            </div>
          )}
        </button>

        {/* Mini Menú Contextual de Ranura Equipada */}
        {isMenuOpen && item && (
          <div className="absolute top-full mt-2 z-40 w-44 bg-surface-card/95 border-2 border-primary/60 rounded-xl p-1.5 shadow-2xl backdrop-blur-md animate-fadeIn space-y-1">
            <div className="text-[10px] font-heading font-black text-amber-300 px-2 py-0.5 truncate border-b border-surface-border">
              {item.name} {refineLvl > 0 ? `+${refineLvl}` : ''}
            </div>

            {onInspectItem && item.rawItem && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.click();
                  setSelectedSlotForMenu(null);
                  onInspectItem(item.rawItem!);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface text-[11px] font-heading text-gray-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>Inspeccionar Ficha</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                sfx.click();
                setSelectedSlotForMenu(null);
                onSlotClick(slotCfg.slot);
              }}
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface text-[11px] font-heading text-gray-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Cambiar Objeto</span>
            </button>

            {onUnequipItem && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSlotForMenu(null);
                  onUnequipItem(item.id);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-crimson/20 text-[11px] font-heading text-crimson flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Desequipar a Mochila</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-surface-card via-surface to-surface border-2 ${theme.borderGlow} ${theme.glowShadow} shadow-2xl overflow-hidden transition-all duration-300`}>
      {/* Resplandor místico de fondo */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.auraColor} pointer-events-none opacity-30`} />

      <div className="relative z-10 flex flex-col items-center space-y-4">
        {/* Cabecera del Paper Doll con Títulos y Nivel */}
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${theme.badgeBg}`}>
              Nv. {playerLevel} • {theme.title}
            </span>
          </div>
          <button
            onClick={() => {
              sfx.click();
              onOpenTitlesModal();
            }}
            className="flex items-center gap-1.5 text-[11px] font-heading font-extrabold text-primary hover:text-white transition-all cursor-pointer bg-primary/15 hover:bg-primary/25 px-2.5 py-1 rounded-xl border border-primary/40 shadow-sm hover:scale-105 active:scale-95"
            title="Ver Títulos Honoríficos y Medallas"
          >
            <Award className="w-3.5 h-3.5 text-primary" />
            <span className="hidden xs:inline">Títulos & Logros</span>
            <ChevronRight className="w-3 h-3 text-primary" />
          </button>
        </div>

        {/* Paper Doll Framework: 2 Ranuras Izquierda | Avatar Central | 2 Ranuras Derecha */}
        <div className="w-full max-w-md flex items-center justify-around gap-2 sm:gap-4 my-1">
          {/* Lado Izquierdo: Arma Principal y Anillo */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {renderSlotCard(slotConfigs[0])} {/* WEAPON */}
            {renderSlotCard(slotConfigs[1])} {/* RING */}
          </div>

          {/* Centro: Efigie / Avatar del Aventurero */}
          <div className="relative flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-b from-surface via-black/70 to-surface border-2 border-primary/50 shadow-inner flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-primary/10 animate-pulse pointer-events-none" />
              <div className="text-5xl sm:text-6xl select-none filter drop-shadow-[0_0_15px_rgba(251,191,36,0.35)] transform group-hover:scale-110 transition-transform duration-300">
                {theme.avatarIcon}
              </div>
            </div>

            <div className="mt-2 text-center">
              <span className="font-cinzel text-sm sm:text-base font-black text-white block">
                {playerName}
              </span>
              <span className="text-[10px] text-gray-400 font-serif italic">
                {equippedItems.length}/4 Ranuras Equipadas
              </span>
            </div>
          </div>

          {/* Lado Derecho: Pechera y Amuleto */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {renderSlotCard(slotConfigs[2])} {/* ARMOR */}
            {renderSlotCard(slotConfigs[3])} {/* AMULET */}
          </div>
        </div>

        {/* Tira Táctica de Estadísticas Acumuladas del Equipo */}
        <div className="w-full grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-2 rounded-2xl bg-black/50 border border-surface-border text-center">
          <div className="p-1.5 rounded-xl bg-surface/60 border border-surface-border">
            <div className="text-[9px] font-mono text-gray-400 uppercase">Ataque</div>
            <div className="font-mono font-bold text-rose-400 text-xs sm:text-sm">+{totalAtk}</div>
          </div>
          <div className="p-1.5 rounded-xl bg-surface/60 border border-surface-border">
            <div className="text-[9px] font-mono text-gray-400 uppercase">Defensa</div>
            <div className="font-mono font-bold text-blue-400 text-xs sm:text-sm">+{totalDef}</div>
          </div>
          <div className="p-1.5 rounded-xl bg-surface/60 border border-surface-border">
            <div className="text-[9px] font-mono text-gray-400 uppercase">Bono D20</div>
            <div className="font-mono font-bold text-amber-400 text-xs sm:text-sm">+{totalD20}</div>
          </div>
          <div className="p-1.5 rounded-xl bg-surface/60 border border-surface-border">
            <div className="text-[9px] font-mono text-gray-400 uppercase">Crítico</div>
            <div className="font-mono font-bold text-rose-300 text-xs sm:text-sm">+{totalCrit}%</div>
          </div>
          <div className="p-1.5 rounded-xl bg-surface/60 border border-surface-border">
            <div className="text-[9px] font-mono text-gray-400 uppercase">Bono Oro</div>
            <div className="font-mono font-bold text-yellow-400 text-xs sm:text-sm">+{totalGoldPct}%</div>
          </div>
          <div className="p-1.5 rounded-xl bg-surface/60 border border-surface-border">
            <div className="text-[9px] font-mono text-gray-400 uppercase">Bono XP</div>
            <div className="font-mono font-bold text-purple-400 text-xs sm:text-sm">+{totalXpPct}%</div>
          </div>
        </div>

        {/* Título Honorífico Activo y Perk Pasivo */}
        <div className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-amber-950/20 via-black/60 to-amber-950/20 border border-amber-500/30 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-heading font-extrabold text-amber-300">
            <span>👑</span>
            <span>{equippedTitle || 'Novicio de la Taberna'}</span>
          </div>
          {titlePerkDesc && (
            <p className="text-[11px] text-gray-300 font-sans italic mt-0.5">
              ✨ Perk Pasivo: <strong className="text-primary font-mono">{titlePerkDesc}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
