import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Player, InventoryItem, ScanLog, DuelResult } from '../types';
import { subscribeToEvents } from '../services/sse';
import { 
  Coins, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  Trophy, 
  Flame, 
  Swords, 
  Award, 
  Clock, 
  Crown,
  Backpack,
  Shield,
  ScrollText,
  Volume2,
  VolumeX,
  Store,
  ChevronRight,
  CheckCircle2,
  LayoutGrid,
  ListFilter,
  SlidersHorizontal,
  Eye,
  Filter,
  ArrowUpDown,
  Check,
  Hammer,
  Compass,
  Search
} from 'lucide-react';
import { GuildQuestsModal } from '../components/GuildQuestsModal';
import { D20DuelArenaModal } from '../components/D20DuelArenaModal';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { TavernWallAndMarketModal } from '../components/TavernWallAndMarketModal';
import { TalentsAndForgeModal } from '../components/TalentsAndForgeModal';
import { PetsAndGamesModal } from '../components/PetsAndGamesModal';
import { ClanTerritoryModal } from '../components/ClanTerritoryModal';
import { ItemInspectModal } from '../components/ItemInspectModal';
import { ExpeditionsModal } from '../components/ExpeditionsModal';
import { AchievementsAndTitlesModal } from '../components/AchievementsAndTitlesModal';
import { PaperDollAvatar } from '../components/PaperDollAvatar';
import { InfiniteJourneyWidget } from '../components/InfiniteJourneyWidget';
import { InfiniteJourneyModal } from '../components/InfiniteJourneyModal';
import { RpgToastContainer, RpgToastMessage, RpgToastType } from '../components/RpgToast';
import { sfx } from '../services/sfx';

type GrimorioTab = 'HERO' | 'CLAN' | 'ARENA' | 'CHRONICLES';

export const PlayerDashboard: React.FC<{ onNavigateShop: () => void }> = ({ onNavigateShop }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [party, setParty] = useState<Player[]>([]);
  const [quests, setQuests] = useState<any[]>([]);
  const [titles, setTitles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<GrimorioTab>('HERO');

  // SFX State
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(sfx.enabled);

  // Modals
  const [isDailyModalOpen, setIsDailyModalOpen] = useState<boolean>(false);
  const [hasAutoPoppedDaily, setHasAutoPoppedDaily] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [lastDuelModal, setLastDuelModal] = useState<DuelResult | null>(null);

  // Roadmap Modals (v1.5 to v3.6)
  const [isTavernWallOpen, setIsTavernWallOpen] = useState<boolean>(false);
  const [isTalentsForgeOpen, setIsTalentsForgeOpen] = useState<boolean>(false);
  const [isPetsGamesOpen, setIsPetsGamesOpen] = useState<boolean>(false);
  const [isClanTerritoryOpen, setIsClanTerritoryOpen] = useState<boolean>(false);
  const [clanInitialTab, setClanInitialTab] = useState<'WAR' | 'SIEGES' | 'GENS' | 'RANKINGS' | 'CLAN' | 'SOLO_RAIDS' | 'PERKS'>('WAR');
  const [isExpeditionsModalOpen, setIsExpeditionsModalOpen] = useState<boolean>(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState<boolean>(false);
  const [isInfiniteJourneyModalOpen, setIsInfiniteJourneyModalOpen] = useState<boolean>(false);
  const [generatingItem, setGeneratingItem] = useState<boolean>(false);

  // Estados de Visualización y Gestión Avanzada de Inventario (v3.4.0)
  const [inventoryFilter, setInventoryFilter] = useState<'ALL' | 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'CONSUMABLE' | 'EQUIPPED'>('ALL');
  const [inventorySort, setInventorySort] = useState<'RARITY' | 'ILVL' | 'REFINE' | 'GOLD' | 'NAME'>('RARITY');
  const [inventoryViewMode, setInventoryViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [inspectingItem, setInspectingItem] = useState<InventoryItem | null>(null);

  // Sistema de Notificaciones RPG Flotantes (v3.7.0)
  const [toasts, setToasts] = useState<RpgToastMessage[]>([]);
  const addToast = (type: RpgToastType, title: string, description?: string, icon?: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, description, icon }]);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // PvP State
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>('');
  const [pvpWager, setPvpWager] = useState<number>(10);
  const [pvpLoading, setPvpLoading] = useState<boolean>(false);
  const [pendingChallenges, setPendingChallenges] = useState<any[]>([]);
  const [pvpMsg, setPvpMsg] = useState<string | null>(null);

  // Live timer tick calculation for the dashboard daily medal banner
  const [timerNowMs, setTimerNowMs] = useState<number>(Date.now());

  // Lore & NPC Whispers de la Taberna (v3.4.0)
  const [npcWhisper, setNpcWhisper] = useState<{ speaker: string; text: string; avatar: string }>({
    speaker: 'Valerius "Ojo de Cuervo"',
    text: 'Arrímate al fuego, camarada. La hidromiel está fría pero los hierros templados aguardan.',
    avatar: '🍺'
  });

  const fetchNextNpcWhisper = async () => {
    try {
      sfx.playAudio('click');
      const npcs = ['valerius', 'brida', 'vael'];
      const pick = npcs[Math.floor(Math.random() * npcs.length)];
      const res = await api.getNPCTalk(pick);
      if (res && res.speech) {
        setNpcWhisper({
          speaker: res.speech.npcName,
          text: res.speech.dialogue,
          avatar: res.speech.avatar
        });
      }
    } catch (_) {}
  };

  const rarityRank: Record<string, number> = {
    MYTHIC: 6,
    LEGENDARY: 5,
    EPIC: 4,
    RARE: 3,
    UNCOMMON: 2,
    COMMON: 1
  };

  const filteredAndSortedInventory = (inventory || [])
    .filter((inv) => {
      if (inventorySearch.trim()) {
        const q = inventorySearch.toLowerCase().trim();
        const matchName = (inv.name || '').toLowerCase().includes(q);
        const matchDesc = (inv.description || '').toLowerCase().includes(q);
        const matchRarity = (inv.rarity || '').toLowerCase().includes(q);
        const matchAffix = (inv.affixes || []).some((a) => a.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchRarity && !matchAffix) return false;
      }
      if (inventoryFilter === 'EQUIPPED') return inv.is_equipped;
      if (inventoryFilter === 'WEAPON') return inv.slot === 'WEAPON';
      if (inventoryFilter === 'ARMOR') return inv.slot === 'ARMOR';
      if (inventoryFilter === 'ACCESSORY') return inv.slot === 'RING' || inv.slot === 'AMULET';
      if (inventoryFilter === 'CONSUMABLE') return inv.slot === 'CONSUMABLE' || (!inv.slot && inv.gold_cost);
      return true;
    })
    .sort((a, b) => {
      if (inventorySort === 'RARITY') {
        const rA = rarityRank[a.rarity || 'COMMON'] || 1;
        const rB = rarityRank[b.rarity || 'COMMON'] || 1;
        if (rB !== rA) return rB - rA;
        return (b.item_level || 1) - (a.item_level || 1);
      }
      if (inventorySort === 'ILVL') {
        return (b.item_level || 1) - (a.item_level || 1);
      }
      if (inventorySort === 'REFINE') {
        return (b.refine_level || 0) - (a.refine_level || 0);
      }
      if (inventorySort === 'GOLD') {
        const gA = a.sell_value || Math.floor((a.gold_cost || 20) / 2);
        const gB = b.sell_value || Math.floor((b.gold_cost || 20) / 2);
        return gB - gA;
      }
      if (inventorySort === 'NAME') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

  const paperDollEquippedItems = (inventory || [])
    .filter((item) => item.is_equipped)
    .map((item) => ({
      id: item.inventory_id || item.item_id,
      name: item.name,
      slot: (item.slot || 'WEAPON') as any,
      rarity: (item.rarity || 'COMMON') as any,
      icon: item.icon || '🗡️',
      refine_level: item.refine_level || 0,
      item_level: item.item_level,
      stat_atk: item.stat_atk,
      stat_def: item.stat_def,
      stat_d20_bonus: item.stat_d20_bonus,
      stat_crit_pct: item.stat_crit_pct,
      stat_raid_dmg_pct: item.stat_raid_dmg_pct,
      stat_gold_pct: item.stat_gold_pct,
      stat_xp_pct: item.stat_xp_pct,
      rawItem: item
    }));

  const getItemRarityVisuals = (rarity?: string) => {
    switch ((rarity || 'COMMON').toUpperCase()) {
      case 'MYTHIC':
        return {
          border: 'border-rose-500/80 hover:border-rose-400',
          glow: 'shadow-[0_0_15px_rgba(244,63,94,0.35)]',
          badge: 'bg-rose-500/25 text-rose-300 border-rose-500/60',
          slotBg: 'bg-gradient-to-b from-rose-950/40 via-surface to-surface'
        };
      case 'LEGENDARY':
        return {
          border: 'border-amber-400/80 hover:border-amber-300',
          glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]',
          badge: 'bg-amber-400/25 text-amber-300 border-amber-400/60',
          slotBg: 'bg-gradient-to-b from-amber-950/40 via-surface to-surface'
        };
      case 'EPIC':
        return {
          border: 'border-purple-500/80 hover:border-purple-400',
          glow: 'shadow-[0_0_12px_rgba(168,85,247,0.25)]',
          badge: 'bg-purple-500/25 text-purple-300 border-purple-500/60',
          slotBg: 'bg-gradient-to-b from-purple-950/30 via-surface to-surface'
        };
      case 'RARE':
        return {
          border: 'border-blue-500/70 hover:border-blue-400',
          glow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]',
          badge: 'bg-blue-500/25 text-blue-300 border-blue-500/60',
          slotBg: 'bg-gradient-to-b from-blue-950/30 via-surface to-surface'
        };
      case 'UNCOMMON':
        return {
          border: 'border-emerald-500/60 hover:border-emerald-400',
          glow: 'shadow-[0_0_8px_rgba(16,185,129,0.15)]',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          slotBg: 'bg-gradient-to-b from-emerald-950/20 via-surface to-surface'
        };
      case 'COMMON':
      default:
        return {
          border: 'border-surface-border hover:border-primary/40',
          glow: 'shadow-sm',
          badge: 'bg-surface text-gray-400 border-surface-border',
          slotBg: 'bg-surface/80'
        };
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadPendingChallenges = async () => {
    try {
      const res = await api.getPendingChallenges();
      setPendingChallenges(res.challenges || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [meRes, partyRes, questsRes, titlesRes] = await Promise.all([
        api.getMe(),
        api.getParty(),
        api.getQuests().catch(() => ({ quests: [] })),
        api.getTitles().catch(() => ({ titles: [] }))
      ]);

      const p = meRes.player;
      setPlayer(p);
      setInventory(meRes.inventory || []);
      setScanLogs(meRes.scanLogs || []);
      setParty((partyRes.party || []).filter((item: Player) => item.id !== meRes.player.id));
      setQuests(questsRes.quests || []);
      setTitles(titlesRes.titles || []);

      // Offline persistence: cache in localStorage
      try {
        localStorage.setItem('cached_player_me', JSON.stringify(meRes));
        localStorage.setItem('cached_party', JSON.stringify(partyRes.party || []));
      } catch (err) {}

      if (partyRes.party && partyRes.party.length > 0 && !selectedOpponentId) {
        const firstOpp = partyRes.party.find((item: Player) => item.id !== meRes.player.id);
        if (firstOpp) setSelectedOpponentId(firstOpp.id);
      }
      await loadPendingChallenges();

      // Check if 24 hours have passed since last daily claim to auto-open popup
      if (p) {
        const lastClaimMs = p.last_daily_claim_at ? new Date(p.last_daily_claim_at).getTime() : 0;
        const isAvailable = !p.last_daily_claim_at || (Date.now() - lastClaimMs >= 24 * 60 * 60 * 1000);
        if (isAvailable && !hasAutoPoppedDaily) {
          setIsDailyModalOpen(true);
          setHasAutoPoppedDaily(true);
        }
      }
    } catch (e) {
      console.error('Error cargando datos del servidor, recurriendo a persistencia local offline:', e);
      try {
        const cachedMe = localStorage.getItem('cached_player_me');
        const cachedParty = localStorage.getItem('cached_party');
        if (cachedMe) {
          const parsed = JSON.parse(cachedMe);
          setPlayer(parsed.player);
          setInventory(parsed.inventory || []);
          setScanLogs(parsed.scanLogs || []);
        }
        if (cachedParty) {
          setParty(JSON.parse(cachedParty));
        }
      } catch (cacheErr) {
        console.error('Error restaurando caché local:', cacheErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const cleanup = subscribeToEvents(
      () => loadData(),
      () => loadData()
    );
    return () => cleanup();
  }, [player?.id]);

  const handleLaunchPvPDuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpponentId) return;
    setPvpLoading(true);
    setPvpMsg(null);
    try {
      sfx.swordClash();
      const res = await api.challengePvPDuel(selectedOpponentId, pvpWager);
      setPvpMsg(res.message);
      addToast('INFO', '⚔️ ¡Desafío Enviado!', res.message, '⚔️');
      await loadData();
    } catch (err: any) {
      addToast('ERROR', 'Fallo al Desafiar', err.message);
    } finally {
      setPvpLoading(false);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    setPvpLoading(true);
    try {
      sfx.swordClash();
      const res = await api.acceptPvPDuel(challengeId);
      setLastDuelModal(res.result);
      await loadData();
    } catch (err: any) {
      addToast('ERROR', 'Error al Aceptar Duelo', err.message);
    } finally {
      setPvpLoading(false);
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      await api.declinePvPDuel(challengeId);
      await loadPendingChallenges();
      addToast('INFO', 'Desafío Rechazado', 'Has declinado el duelo de arena', '🛡️');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleEquip = async (inventoryId: string) => {
    const target = inventory.find((i) => i.inventory_id === inventoryId);
    if (!target) return;
    const willEquip = !target.is_equipped;
    const targetSlot = target.slot || 'CONSUMABLE';

    // Actualización optimista inmediata (<50ms)
    setInventory((prev) =>
      prev.map((it) => {
        if (it.inventory_id === inventoryId) {
          return { ...it, is_equipped: willEquip };
        }
        if (willEquip && it.is_equipped && (it.slot || 'CONSUMABLE') === targetSlot) {
          return { ...it, is_equipped: false };
        }
        return it;
      })
    );

    if (willEquip) {
      sfx.equip();
      addToast('EQUIP', `¡Equipaste ${target.name}!`, `Ranura activa: ${targetSlot}`, target.icon || '⚔️');
    } else {
      sfx.click();
      addToast('UNEQUIP', `Desequipaste ${target.name}`, 'Objeto devuelto a la mochila', target.icon || '🛡️');
    }

    try {
      await api.equipItem(inventoryId);
      await loadData();
    } catch (err: any) {
      await loadData();
      addToast('ERROR', 'Error al Equipar', err.message);
    }
  };

  const handleUseConsumable = async (inventoryId: string) => {
    const target = inventory.find((i) => i.inventory_id === inventoryId);
    if (!target) return;

    sfx.playAudio('levelup');
    sfx.haptic([30, 30]);
    addToast('CONSUME', `Consumiste ${target.name}`, 'Efecto mágico aplicado a tu aventurero', target.icon || '🧪');

    // Retiro optimista de la mochila
    setInventory((prev) => prev.filter((it) => it.inventory_id !== inventoryId));

    try {
      const res = await api.useConsumable(inventoryId);
      if (res.message) {
        addToast('INFO', 'Efecto de Elixir', res.message, '✨');
      }
      await loadData();
    } catch (err: any) {
      await loadData();
      addToast('ERROR', 'Fallo al Consumir', err.message);
    }
  };

  const handleSellItem = async (inventoryId: string) => {
    const target = inventory.find((i) => i.inventory_id === inventoryId);
    if (!target) return;
    const sellGold = target.sell_value || Math.max(1, Math.floor((target.gold_cost || 20) / 2));

    sfx.coin();
    sfx.haptic([20]);
    addToast('SELL', `Vendiste ${target.name}`, `Recibiste +${sellGold} 🪙 de Oro`, '🪙');

    // Actualización optimista de inventario y oro del jugador
    setInventory((prev) => prev.filter((it) => it.inventory_id !== inventoryId));
    if (player) {
      setPlayer((prev) => (prev ? { ...prev, gold: (prev.gold || 0) + sellGold } : null));
    }

    try {
      await api.sellItem(inventoryId);
      await loadData();
    } catch (err: any) {
      await loadData();
      addToast('ERROR', 'Fallo al Vender', err.message);
    }
  };

  const handleGenerateProceduralItem = async () => {
    try {
      setGeneratingItem(true);
      sfx.playAudio('dice');
      const res = await api.post('/player/items/generate-procedural', { source: 'CHEST' });
      if (res.data?.success) {
        sfx.playAudio('levelup');
        addToast(
          'INFO',
          '¡Reliquia Descubierta!',
          res.data.message || `Descubriste ${res.data.item?.name}`,
          res.data.item?.icon || '✨'
        );
        await loadData();
      }
    } catch (err: any) {
      addToast('ERROR', 'Fallo de Forja', err.message);
    } finally {
      setGeneratingItem(false);
    }
  };

  const handleEquipTitle = async (titleId: string) => {
    try {
      sfx.levelUp();
      await api.equipTitle(titleId);
      addToast('INFO', '¡Título Consagrado!', 'Has equipado un nuevo título de honor', '👑');
      await loadData();
    } catch (err: any) {
      addToast('ERROR', 'Error con Título', err.message);
    }
  };

  const toggleSfx = () => {
    const newState = sfx.toggle();
    setSfxEnabled(newState);
  };

  // Helper for dynamic Class Auras
  const getClassAuraStyles = (className?: string) => {
    const c = (className || '').toLowerCase();
    if (c.includes('guerrero') || c.includes('bárbaro') || c.includes('berserker') || c.includes('gladiador')) {
      return {
        cardBorder: 'border-red-500/70',
        bgGradient: 'from-red-950/40 via-surface-card to-surface-card',
        glowShadow: 'shadow-[0_0_35px_rgba(239,68,68,0.25)]',
        badgeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
        avatarBorder: 'border-red-500',
        auraName: 'Fuego Carmesí'
      };
    }
    if (c.includes('mago') || c.includes('hechicero') || c.includes('nigromante') || c.includes('arcano') || c.includes('brujo')) {
      return {
        cardBorder: 'border-purple-500/70',
        bgGradient: 'from-purple-950/40 via-surface-card to-surface-card',
        glowShadow: 'shadow-[0_0_35px_rgba(168,85,247,0.25)]',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        avatarBorder: 'border-purple-500',
        auraName: 'Vórtice Arcano'
      };
    }
    if (c.includes('pícaro') || c.includes('cazador') || c.includes('explorador') || c.includes('asesino') || c.includes('sombra')) {
      return {
        cardBorder: 'border-emerald-500/70',
        bgGradient: 'from-emerald-950/40 via-surface-card to-surface-card',
        glowShadow: 'shadow-[0_0_35px_rgba(16,185,129,0.25)]',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        avatarBorder: 'border-emerald-500',
        auraName: 'Sombra Élfica'
      };
    }
    if (c.includes('paladín') || c.includes('clérigo') || c.includes('cruzado') || c.includes('santo')) {
      return {
        cardBorder: 'border-amber-400/80',
        bgGradient: 'from-amber-950/40 via-surface-card to-surface-card',
        glowShadow: 'shadow-[0_0_35px_rgba(245,158,11,0.3)]',
        badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/50',
        avatarBorder: 'border-amber-400',
        auraName: 'Luz Divina'
      };
    }
    // Default Taberna Oro
    return {
      cardBorder: 'border-primary/60',
      bgGradient: 'from-primary/20 via-surface-card to-surface-card',
      glowShadow: 'shadow-[0_0_30px_var(--accent-glow)]',
      badgeBg: 'bg-primary/20 text-primary border-primary/40',
      avatarBorder: 'border-primary',
      auraName: 'Espíritu de la Taberna'
    };
  };

  if (loading && !player) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 font-cinzel text-lg font-bold text-primary">Cargando Grimorio del Aventurero...</span>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-5 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-crimson/20 border border-crimson/50 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)]">
          <Shield className="w-8 h-8 text-crimson" />
        </div>
        <div className="space-y-1">
          <h2 className="font-cinzel text-xl font-bold text-crimson uppercase tracking-wider">
            NO SE PUDO CARGAR EL PERSONAJE
          </h2>
          <p className="text-xs text-gray-300 font-cinzel max-w-md">
            No se pudieron obtener los datos de tu aventurero desde el servidor. Es posible que tu sesión haya caducado o la red esté inestable.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black font-cinzel font-bold text-xs uppercase tracking-wider shadow transition-all cursor-pointer"
          >
            🔄 Reintentar Carga
          </button>
          <button
            onClick={() => {
              api.getMe();
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl bg-surface-card hover:bg-crimson/20 border border-surface-border text-gray-300 hover:text-crimson font-cinzel font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            🔑 Reiniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  const xpCurrentLevel = player.xp % 250;
  const xpPct = Math.min(100, (xpCurrentLevel / 250) * 100);
  const equippedItems = inventory.filter((item) => item.is_equipped);
  const aura = getClassAuraStyles(player.secretClass || player.secret_class);

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-16 animate-fadeIn">
      {/* Top Header Controls: Sound & Quick Status */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-heading text-xs font-bold text-primary uppercase tracking-wider">
            GRIMORIO TÁCTICO v3.6.0
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${aura.badgeBg}`}>
            {aura.auraName}
          </span>
        </div>

        <button
          onClick={toggleSfx}
          className={`p-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            sfxEnabled
              ? 'bg-primary/20 border-primary/50 text-primary'
              : 'bg-surface-card border-surface-border text-gray-400'
          }`}
          title={sfxEnabled ? 'Silenciar Efectos de Sonido' : 'Activar Sonidos RPG'}
        >
          {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="font-mono text-[10px] hidden sm:inline">SFX {sfxEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>



      {/* 4-Tab Modular Selector Bar */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2 bg-surface-card/90 p-1.5 rounded-2xl border border-surface-border shadow-md">
        <button
          onClick={() => {
            sfx.haptic([20]);
            setActiveTab('HERO');
          }}
          className={`py-2.5 px-2 rounded-xl font-heading text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer relative ${
            activeTab === 'HERO'
              ? 'bg-primary text-on-primary shadow-[0_0_15px_var(--accent-glow)] font-black'
              : 'text-gray-400 hover:text-white hover:bg-surface'
          }`}
        >
          <Shield className="w-4 h-4 shrink-0" />
          <span className="truncate">Héroe & Mochila</span>
          {equippedItems.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald absolute top-1 right-1 sm:static sm:w-auto sm:h-auto sm:px-1 sm:py-0 sm:text-[9px] sm:bg-emerald/20 sm:text-emerald sm:border sm:border-emerald/40 sm:font-mono">
              {equippedItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            sfx.haptic([20]);
            setActiveTab('CLAN');
          }}
          className={`py-2.5 px-2 rounded-xl font-heading text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'CLAN'
              ? 'bg-primary text-on-primary shadow-[0_0_15px_var(--accent-glow)] font-black'
              : 'text-gray-400 hover:text-white hover:bg-surface'
          }`}
        >
          <Crown className="w-4 h-4 shrink-0" />
          <span className="truncate">Clan & Territorios</span>
        </button>

        <button
          onClick={() => {
            sfx.haptic([20]);
            setActiveTab('ARENA');
          }}
          className={`py-2.5 px-2 rounded-xl font-heading text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer relative ${
            activeTab === 'ARENA'
              ? 'bg-crimson text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] font-black'
              : 'text-gray-400 hover:text-white hover:bg-surface'
          }`}
        >
          <Swords className="w-4 h-4 shrink-0" />
          <span className="truncate">Arena PvP</span>
          {pendingChallenges.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-crimson animate-ping absolute top-1 right-1 sm:static sm:w-auto sm:h-auto sm:px-1.5 sm:py-0 sm:text-[9px] sm:bg-crimson sm:text-white sm:font-bold sm:rounded-full">
              {pendingChallenges.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            sfx.haptic([20]);
            setActiveTab('CHRONICLES');
          }}
          className={`py-2.5 px-2 rounded-xl font-heading text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'CHRONICLES'
              ? 'bg-primary text-on-primary shadow-[0_0_15px_var(--accent-glow)] font-black'
              : 'text-gray-400 hover:text-white hover:bg-surface'
          }`}
        >
          <ScrollText className="w-4 h-4 shrink-0" />
          <span className="truncate">Crónicas</span>
        </button>
      </div>

      {/* Centro de Actividades Principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => {
            sfx.playAudio('click');
            sfx.haptic([30]);
            setIsInfiniteJourneyModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/70 via-surface-card to-surface-card border border-amber-500/60 hover:border-amber-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md group text-left ring-1 ring-amber-500/20"
        >
          <span className="text-xl group-hover:scale-120 transition-transform">⚔️</span>
          <div>
            <div className="font-heading font-black text-xs text-amber-300 flex items-center gap-1">
              <span>Senda Infinita</span>
              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-200">CORE</span>
            </div>
            <div className="text-[10px] text-gray-400 font-serif">Aventura Procedural</div>
          </div>
        </button>

        <button
          onClick={() => {
            sfx.playAudio('click');
            sfx.haptic([20]);
            setIsAchievementsModalOpen(true);
          }}
          className="p-2.5 rounded-xl bg-gradient-to-r from-yellow-950/40 to-surface-card border border-yellow-500/40 hover:border-yellow-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group text-left"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">🏆</span>
          <div>
            <div className="font-heading font-black text-xs text-yellow-300">Logros</div>
            <div className="text-[10px] text-gray-400 font-serif">Títulos & Perks</div>
          </div>
        </button>

        <button
          onClick={() => {
            sfx.playAudio('click');
            sfx.haptic([20]);
            setIsTalentsForgeOpen(true);
          }}
          className="p-2.5 rounded-xl bg-surface-card border border-purple-500/30 hover:border-purple-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group text-left"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">⚡</span>
          <div>
            <div className="font-heading font-black text-xs text-purple-300">Talentos</div>
            <div className="text-[10px] text-gray-400 font-serif">Árbol & Forja</div>
          </div>
        </button>

        <button
          onClick={() => {
            sfx.playAudio('click');
            sfx.haptic([20]);
            setIsPetsGamesOpen(true);
          }}
          className="p-2.5 rounded-xl bg-surface-card border border-emerald-500/30 hover:border-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group text-left"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">🐾</span>
          <div>
            <div className="font-heading font-black text-xs text-emerald-400">Mascotas</div>
            <div className="text-[10px] text-gray-400 font-serif">& Minijuegos</div>
          </div>
        </button>
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA 1: HÉROE & ESTADÍSTICAS */}
      {/* ========================================================= */}
      {activeTab === 'HERO' && (
        <div className="space-y-5 animate-fadeIn">
          {/* V3.7.0: Paper Doll Rúnico Interactivo con Menú Rápido y Stats Acumuladas */}
          <PaperDollAvatar
            playerClass={player.secretClass || player.secret_class || 'WARRIOR'}
            playerName={player.name}
            playerLevel={player.level}
            equippedItems={paperDollEquippedItems}
            equippedTitle={player.equipped_title || player.title}
            titlePerkDesc={titles.find(t => t.id === player.equipped_title || t.name === player.equipped_title)?.perk_description}
            onSlotClick={(slot) => {
              setInventoryFilter(slot as any);
              sfx.click();
              const el = document.getElementById('backpack-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onInspectItem={(raw) => setInspectingItem(raw)}
            onUnequipItem={(id) => handleToggleEquip(id)}
            onOpenTitlesModal={() => setIsAchievementsModalOpen(true)}
          />

          {/* Hero Profile Card with Class Aura */}
          <section className={`p-6 rounded-2xl bg-gradient-to-br ${aura.bgGradient} border-2 ${aura.cardBorder} ${aura.glowShadow} relative overflow-hidden transition-all duration-500`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 font-heading text-8xl font-bold select-none pointer-events-none text-primary">
              {(player.secretClass || player.secret_class || 'R')[0]}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              {/* Avatar Ring */}
              <div className={`w-24 h-24 rounded-full border-2 ${aura.avatarBorder} overflow-hidden shrink-0 shadow-lg bg-surface-card flex items-center justify-center`}>
                <span className="font-cinzel text-4xl text-primary font-bold">{player.name[0]}</span>
              </div>

              {/* Details */}
              <div className="flex-1 w-full text-center md:text-left space-y-2">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h2 className="font-cinzel text-2xl font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
                      {player.name}
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-primary/20 border border-primary/40 text-primary flex items-center gap-1 font-bold">
                        <Award className="w-3 h-3 text-primary" /> {player.title || player.equipped_title || 'Novicio Sediento'}
                      </span>
                    </h2>
                  </div>

                  <div className="inline-flex items-center gap-3 justify-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-card rounded-xl border border-primary/40 text-primary font-bold shadow-sm text-xs">
                      <Coins className="w-4 h-4 text-primary" />
                      <span>{player.gold} Oro</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-300 font-bold text-xs">
                      <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                      <span>{player.streak_days || 0} Días Racha</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span className={`font-cinzel text-xs uppercase font-extrabold px-2.5 py-1 rounded-lg border ${aura.badgeBg} tracking-wider`}>
                      Clase: {player.secretClass || player.secret_class}
                    </span>
                    <span className="text-xs text-gray-300">
                      PvP: <strong className="text-emerald font-bold">{player.pvp_wins || 0}W</strong> / <strong className="text-crimson font-bold">{player.pvp_losses || 0}L</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      sfx.coin();
                      setIsLeaderboardOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-primary/20 via-surface-card to-surface-card hover:from-primary/30 border border-primary/50 text-xs font-heading font-extrabold text-primary flex items-center gap-1.5 transition-all shadow-[0_0_15px_var(--accent-glow)] cursor-pointer hover:scale-105 active:scale-95"
                    title="Ver Salón de la Fama de Aventureros"
                  >
                    <Trophy className="w-4 h-4 text-primary animate-pulse" />
                    <span>Salón de la Fama</span>
                  </button>
                </div>

                {/* Level & XP Progress Bar */}
                <div className="mt-4 space-y-1.5 w-full">
                  <div className="flex justify-between text-xs text-gray-200 font-bold">
                    <span>Nivel {player.level}</span>
                    <span>{xpCurrentLevel} / 250 XP hacia Nivel {player.level + 1} (Total: {player.xp} XP)</span>
                  </div>
                  <div className="h-3.5 w-full bg-background/80 border border-surface-border rounded-full overflow-hidden relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-magic via-primary to-emerald transition-all duration-700 rounded-full"
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Mini Widget Recompensa Diaria */}
          {(() => {
            const lastClaimMs = player.last_daily_claim_at ? new Date(player.last_daily_claim_at).getTime() : 0;
            const timePassedMs = timerNowMs - lastClaimMs;
            const isAvailable = !player.last_daily_claim_at || timePassedMs >= 24 * 60 * 60 * 1000;
            const msRemaining = Math.max(0, 24 * 60 * 60 * 1000 - timePassedMs);
            const hours = Math.floor(msRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((msRemaining % (1000 * 60)) / 1000);
            const countdownFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            return (
              <div className="p-3.5 rounded-2xl bg-surface-card/90 border border-surface-border flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isAvailable ? 'bg-primary/20 border-primary text-primary animate-pulse shadow-[0_0_12px_var(--accent-glow)]' : 'bg-surface border-surface-border text-gray-400'
                  }`}>
                    {isAvailable ? <Award className="w-5 h-5 text-primary" /> : <Clock className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-bold text-white text-xs">Medalla Diaria</h4>
                      <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full uppercase ${
                        isAvailable ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-surface text-gray-400 font-mono'
                      }`}>
                        {isAvailable ? '¡Listo!' : countdownFormatted}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-sans hidden sm:block">
                      {isAvailable ? '¡Reclama tu botín de taberna (+15 XP, +5 🪙)!' : 'Vuelve mañana para continuar tu racha heroica.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sfx.coin();
                    setIsDailyModalOpen(true);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-heading font-bold text-xs uppercase transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isAvailable
                      ? 'bg-primary text-on-primary hover:brightness-110 shadow-sm hover:shadow-[0_0_15px_var(--accent-glow)] active:scale-95'
                      : 'bg-surface text-gray-300 border border-surface-border hover:text-white font-mono'
                  }`}
                >
                  {isAvailable ? (
                    <>
                      <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                      <span>Reclamar</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{countdownFormatted}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })()}

          {/* Ranuras de Equipamiento & Mochila Integradas */}
          {(() => {
            const equippedWeapon = inventory.find((i) => i.is_equipped && i.slot === 'WEAPON');
            const equippedArmor = inventory.find((i) => i.is_equipped && i.slot === 'ARMOR');
            const equippedRing = inventory.find((i) => i.is_equipped && i.slot === 'RING');
            const equippedAmulet = inventory.find((i) => i.is_equipped && i.slot === 'AMULET');

        const totalAtk = equippedItems.reduce((acc, it) => acc + (it.stat_atk || 0), 0);
        const totalDef = equippedItems.reduce((acc, it) => acc + (it.stat_def || 0), 0);
        const totalD20 = equippedItems.reduce((acc, it) => acc + (it.stat_d20_bonus || 0), 0);
        const totalGoldPct = equippedItems.reduce((acc, it) => acc + (it.stat_gold_pct || 0), 0);
        const totalXpPct = equippedItems.reduce((acc, it) => acc + (it.stat_xp_pct || 0), 0);
        const totalCritPct = equippedItems.reduce((acc, it) => acc + (it.stat_crit_pct || 0), 0);

        const paperDollSlots = [
          { slot: 'WEAPON', label: 'Arma Principal', icon: '🗡️', item: equippedWeapon, desc: 'Ataque & Críticos' },
          { slot: 'ARMOR', label: 'Armadura de Pecho', icon: '🛡️', item: equippedArmor, desc: 'Defensa & Salvación' },
          { slot: 'RING', label: 'Anillo Místico', icon: '💍', item: equippedRing, desc: 'Bono de Oro & Fortuna' },
          { slot: 'AMULET', label: 'Amuleto Sagrado', icon: '📿', item: equippedAmulet, desc: 'Bono de XP & Sabiduría' }
        ];

        return (
          <div className="space-y-5 animate-fadeIn">
            {/* Paper Doll Header & Gear Stats Summary */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-cinzel text-base font-extrabold text-primary flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> Ranuras de Equipamiento Activo (Paper Doll)
                  </h3>
                  <p className="text-xs text-gray-400">Toca cualquier ranura equipada para inspeccionar sus encantamientos o compararla.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTalentsForgeOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
                    title="Abrir la Forja de Refinamiento y Sets"
                  >
                    <Hammer className="w-4 h-4 text-amber-400" /> Taller de Forja
                  </button>
                  <button
                    onClick={onNavigateShop}
                    className="px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/40 hover:bg-primary/30 text-primary text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    <Store className="w-4 h-4" /> Ir a la Tienda
                  </button>
                </div>
              </div>

              {/* Total Stats Banner */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 rounded-2xl bg-black/50 border border-primary/30 shadow-inner text-center font-mono">
                <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-[10px] text-gray-400 block uppercase">Ataque</span>
                  <span className="text-xs font-bold text-rose-300">+{totalAtk} ATK</span>
                </div>
                <div className="p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <span className="text-[10px] text-gray-400 block uppercase">Defensa</span>
                  <span className="text-xs font-bold text-blue-300">+{totalDef} DEF</span>
                </div>
                <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-[10px] text-gray-400 block uppercase">Bono D20</span>
                  <span className="text-xs font-bold text-amber-300">+{totalD20} D20</span>
                </div>
                <div className="p-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <span className="text-[10px] text-gray-400 block uppercase">Bono Oro</span>
                  <span className="text-xs font-bold text-yellow-300">+{totalGoldPct}%</span>
                </div>
                <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <span className="text-[10px] text-gray-400 block uppercase">Bono XP</span>
                  <span className="text-xs font-bold text-purple-300">+{totalXpPct}%</span>
                </div>
                <div className="p-1.5 rounded-xl bg-rose-400/10 border border-rose-400/30">
                  <span className="text-[10px] text-gray-400 block uppercase">Crítico</span>
                  <span className="text-xs font-bold text-rose-300">+{totalCritPct}%</span>
                </div>
              </div>

              {/* 4 Specialized Equipment Slots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paperDollSlots.map((s) => {
                  const it = s.item;
                  const visuals = it ? getItemRarityVisuals(it.rarity) : null;

                  return (
                    <div
                      key={s.slot}
                      onClick={() => {
                        if (it) {
                          sfx.playAudio('click');
                          setInspectingItem(it);
                        }
                      }}
                      className={`p-3.5 rounded-2xl relative flex items-center justify-between gap-3 border transition-all ${
                        it
                          ? `${visuals?.slotBg} ${visuals?.border} ${visuals?.glow} cursor-pointer hover:brightness-110 shadow-md`
                          : 'bg-surface-card/40 border-dashed border-surface-border text-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-black/60 border border-surface-border flex items-center justify-center shrink-0 text-2xl shadow">
                            {it ? it.icon || s.icon : s.icon}
                          </div>
                          {it && (it.refine_level || 0) > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-mono font-black text-[9px] shadow border border-amber-300">
                              +{it.refine_level}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-primary font-mono font-bold uppercase tracking-wider">
                              {s.label}
                            </span>
                            {it && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald/20 text-emerald border border-emerald/40 font-mono font-bold">
                                ACTIVO
                              </span>
                            )}
                          </div>
                          {it ? (
                            <>
                              <h4 className="font-heading font-black text-white text-xs truncate flex items-center gap-1">
                                <span>{it.name}</span>
                                {(it.refine_level || 0) > 0 && (
                                  <span className="text-amber-400 font-mono text-[11px]">+{it.refine_level}</span>
                                )}
                              </h4>
                              <p className="text-[11px] text-gray-400 line-clamp-1">{it.description}</p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-500 italic">Ranura vacía — {s.desc}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {it && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleEquip(it.inventory_id);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs text-crimson border border-crimson/30 hover:bg-crimson/20 font-heading font-bold cursor-pointer shrink-0 transition-colors"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Modernized Full Inventory Section */}
            <section id="backpack-section" className="space-y-3 pt-2 scroll-mt-24">
              {/* Header & Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface/90 rounded-2xl border border-surface-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-magic/20 border border-magic/40 text-magic">
                    <Backpack className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                      Mochila del Héroe ({inventory.length} Objetos)
                    </h3>
                    <p className="text-[11px] text-gray-400 font-sans">
                      Equipados: <strong className="text-primary">{equippedItems.length} / 4</strong> • Mostrando: <span className="text-gray-300 font-mono font-bold">{filteredAndSortedInventory.length}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Live Search Input */}
                  <div className="relative flex-1 min-w-[150px] sm:w-48">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      placeholder="Buscar por nombre, afijo..."
                      className="w-full bg-black/50 border border-surface-border focus:border-primary text-gray-200 text-xs rounded-xl pl-8 pr-6 py-1.5 outline-none font-sans transition-colors"
                    />
                    {inventorySearch && (
                      <button
                        onClick={() => setInventorySearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
                        title="Limpiar búsqueda"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex bg-black/40 p-1 rounded-xl border border-surface-border">
                    <button
                      type="button"
                      onClick={() => {
                        sfx.haptic([10]);
                        setInventoryViewMode('GRID');
                      }}
                      className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        inventoryViewMode === 'GRID' ? 'bg-primary text-black font-black shadow' : 'text-gray-400 hover:text-white'
                      }`}
                      title="Vista en Casillas / Cuadrícula RPG"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sfx.haptic([10]);
                        setInventoryViewMode('LIST');
                      }}
                      className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        inventoryViewMode === 'LIST' ? 'bg-primary text-black font-black shadow' : 'text-gray-400 hover:text-white'
                      }`}
                      title="Vista en Lista Detallada"
                    >
                      <ListFilter className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sort Selector Dropdown */}
                  <div className="relative">
                    <select
                      value={inventorySort}
                      onChange={(e) => setInventorySort(e.target.value as any)}
                      className="bg-black/50 border border-surface-border text-gray-300 hover:text-white rounded-xl px-2.5 py-1.5 text-xs font-heading font-bold outline-none cursor-pointer pr-7"
                    >
                      <option value="RARITY">💎 Rareza (Mayor a Menor)</option>
                      <option value="ILVL">⭐ Nivel de Ítem (iLvl)</option>
                      <option value="REFINE">🔨 Refinamiento (+X)</option>
                      <option value="GOLD">🪙 Valor en Oro</option>
                      <option value="NAME">🔤 Nombre Alfabético</option>
                    </select>
                  </div>

                  {/* Procedural Forge Quick Test */}
                  <button
                    onClick={handleGenerateProceduralItem}
                    disabled={generatingItem}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-amber-500/30 hover:from-purple-600/50 hover:to-amber-500/50 border border-purple-400/50 text-purple-200 text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow active:scale-95 disabled:opacity-50"
                    title="Forjar una pieza de botín procedural única (ARPG Loot)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden xs:inline">{generatingItem ? 'Forjando...' : 'Forjar Ítem'}</span>
                  </button>
                </div>
              </div>

              {/* Slot Filter Pills con Contadores Vivos */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'ALL', label: 'Todos', count: inventory.length, icon: '🎒' },
                  { id: 'WEAPON', label: 'Armas', count: inventory.filter((i) => i.slot === 'WEAPON').length, icon: '🗡️' },
                  { id: 'ARMOR', label: 'Armaduras', count: inventory.filter((i) => i.slot === 'ARMOR').length, icon: '🛡️' },
                  { id: 'ACCESSORY', label: 'Accesorios', count: inventory.filter((i) => i.slot === 'RING' || i.slot === 'AMULET').length, icon: '💍' },
                  { id: 'CONSUMABLE', label: 'Pociones', count: inventory.filter((i) => i.slot === 'CONSUMABLE' || !i.slot).length, icon: '🧪' },
                  { id: 'EQUIPPED', label: 'Equipados', count: equippedItems.length, icon: '⭐' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      sfx.haptic([10]);
                      setInventoryFilter(f.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      inventoryFilter === f.id
                        ? 'bg-primary text-black shadow-md font-black'
                        : 'bg-surface text-gray-400 hover:text-white border border-surface-border'
                    }`}
                  >
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      inventoryFilter === f.id ? 'bg-black/30 text-black' : 'bg-black/40 text-gray-400'
                    }`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Inventory Content Display */}
              {filteredAndSortedInventory.length === 0 ? (
                <div className="theme-card p-8 text-center text-gray-400 text-xs font-sans space-y-3">
                  <p>No hay objetos que coincidan con este filtro o búsqueda en tu mochila.</p>
                  <button
                    onClick={() => {
                      setInventoryFilter('ALL');
                      setInventorySearch('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-surface border border-surface-border hover:bg-surface-card text-xs font-heading text-white cursor-pointer"
                  >
                    Restablecer filtros y búsqueda
                  </button>
                </div>
              ) : inventoryViewMode === 'GRID' ? (
                /* GRID MODE (Casillas tácticas con acción rápida integrada) */
                <div className="p-3 bg-black/40 rounded-2xl border border-surface-border">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-2.5">
                    {filteredAndSortedInventory.map((inv) => {
                      const visuals = getItemRarityVisuals(inv.rarity);
                      const isConsumable = (inv.slot || 'CONSUMABLE') === 'CONSUMABLE';

                      return (
                        <div
                          key={inv.inventory_id}
                          onClick={() => {
                            sfx.click();
                            setInspectingItem(inv);
                          }}
                          className={`group relative aspect-square rounded-2xl bg-surface/90 border-2 ${visuals.border} ${visuals.glow} flex flex-col items-center justify-center p-1.5 transition-all duration-200 hover:scale-105 hover:z-20 cursor-pointer shadow-md select-none overflow-hidden`}
                          title={`${inv.name} (${inv.rarity || 'COMMON'}) - Clic para ver ficha completa`}
                        >
                          {/* Equipped Indicator Badge (Top-Left) */}
                          {inv.is_equipped && (
                            <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-emerald-500 text-black font-mono font-black text-[8px] flex items-center justify-center shadow">
                              EQUIP
                            </div>
                          )}

                          {/* Refine Level Badge (Top-Right) */}
                          {(inv.refine_level || 0) > 0 && (
                            <div className="absolute top-1 right-1 px-1 py-0.2 rounded-md bg-amber-500 text-black font-mono font-black text-[9px] shadow animate-pulse">
                              +{inv.refine_level}
                            </div>
                          )}

                          {/* Item Icon */}
                          <span className="text-2xl sm:text-3xl transition-transform group-hover:scale-110 drop-shadow">
                            {inv.icon || (isConsumable ? '🧪' : '⚔️')}
                          </span>

                          {/* Quick Action Button (Esquina inferior derecha) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isConsumable) {
                                handleUseConsumable(inv.inventory_id);
                              } else {
                                handleToggleEquip(inv.inventory_id);
                              }
                            }}
                            className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded-lg text-[9px] font-mono font-black shadow-md cursor-pointer z-30 transition-all active:scale-90 ${
                              inv.is_equipped
                                ? 'bg-crimson/90 hover:bg-crimson text-white'
                                : isConsumable
                                ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white'
                                : 'bg-primary text-black hover:brightness-110'
                            }`}
                            title={inv.is_equipped ? 'Desequipar en 1 toque' : isConsumable ? 'Consumir en 1 toque' : 'Equipar en 1 toque'}
                          >
                            {inv.is_equipped ? '✕' : isConsumable ? '🧪' : '⚡'}
                          </button>

                          {/* Bottom Level indicator */}
                          <div className="absolute bottom-1 left-1 pointer-events-none">
                            {inv.item_level ? (
                              <span className="text-[8px] font-mono font-bold text-gray-300 bg-black/60 px-1 rounded">
                                L{inv.item_level}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-center text-gray-400 font-sans mt-3 italic">
                    💡 Toca una casilla para inspeccionar o usa el botón <span className="text-primary font-bold">⚡/🧪</span> para equipar o beber al instante.
                  </p>
                </div>
              ) : (
                /* LIST MODE (Tarjetas detalladas) */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredAndSortedInventory.map((inv) => {
                    const isConsumable = (inv.slot || 'CONSUMABLE') === 'CONSUMABLE';
                    const sellGold = inv.sell_value || Math.max(1, Math.floor((inv.gold_cost || 20) / 2));
                    const visuals = getItemRarityVisuals(inv.rarity);

                    return (
                      <div
                        key={inv.inventory_id}
                        className={`p-3.5 rounded-2xl border-2 ${visuals.border} ${visuals.glow} ${visuals.slotBg} flex flex-col justify-between gap-3 transition-all`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            onClick={() => {
                              sfx.playAudio('click');
                              setInspectingItem(inv);
                            }}
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                          >
                            <div className="relative">
                              <span className="text-2xl p-1.5 rounded-xl bg-black/50 border border-border/40 shrink-0 block group-hover:scale-105 transition-transform">
                                {inv.icon || (isConsumable ? '🧪' : '⚔️')}
                              </span>
                              {(inv.refine_level || 0) > 0 && (
                                <span className="absolute -top-1 -right-1 px-1 rounded-full bg-amber-500 text-black font-mono font-black text-[9px]">
                                  +{inv.refine_level}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-heading font-bold text-white text-xs truncate group-hover:text-primary transition-colors">
                                  {inv.name}
                                </span>
                                {(inv.refine_level || 0) > 0 && (
                                  <span className="text-amber-400 font-mono font-bold text-[11px]">
                                    +{inv.refine_level}
                                  </span>
                                )}
                                {inv.is_equipped && (
                                  <span className="text-[9px] bg-emerald/20 text-emerald border border-emerald/50 px-1.5 py-0.2 rounded font-mono font-bold">
                                    EQUIPADO
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-gray-400 font-mono uppercase">
                                  {inv.slot || 'CONSUMABLE'}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold uppercase border ${visuals.badge}`}>
                                  {inv.rarity || 'COMMON'}
                                </span>
                                {inv.item_level && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface border border-surface-border text-gray-400 font-mono">
                                    iLvl {inv.item_level}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              sfx.playAudio('click');
                              setInspectingItem(inv);
                            }}
                            className="p-1.5 rounded-lg bg-surface hover:bg-surface-card text-gray-400 hover:text-white border border-surface-border shrink-0 cursor-pointer"
                            title="Inspeccionar detalles y comparativa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-[11px] text-gray-300 line-clamp-2">{inv.description}</p>

                        {/* Stats Matrix Pills */}
                        <div className="flex flex-wrap gap-1">
                          {inv.stat_atk ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold font-mono">+{inv.stat_atk} ATK</span> : null}
                          {inv.stat_def ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold font-mono">+{inv.stat_def} DEF</span> : null}
                          {inv.stat_d20_bonus ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold font-mono">+{inv.stat_d20_bonus} D20</span> : null}
                          {inv.stat_crit_pct ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-400/10 border border-rose-400/30 text-rose-300 font-bold font-mono">+{inv.stat_crit_pct}% Crit</span> : null}
                          {inv.stat_raid_dmg_pct ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-300 font-bold font-mono">+{inv.stat_raid_dmg_pct}% Raid</span> : null}
                          {inv.stat_gold_pct ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-bold font-mono">+{inv.stat_gold_pct}% Oro</span> : null}
                          {inv.stat_xp_pct ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold font-mono">+{inv.stat_xp_pct}% XP</span> : null}
                        </div>

                        {/* Affixes */}
                        {inv.affixes && inv.affixes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {inv.affixes.map((affix, aIdx) => (
                              <span key={aIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-surface-border text-primary font-mono">
                                ⚡ {affix}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Legendary Perk */}
                        {inv.legendary_perk && (
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-[10px] text-amber-200 font-sans space-y-0.5">
                            <span className="font-bold text-amber-300">✨ {inv.legendary_perk.name}: </span>
                            <span className="italic text-gray-300">{inv.legendary_perk.description}</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                          <span className="text-[10px] font-mono text-gray-400">
                            Valor: {sellGold} 🪙
                          </span>

                          <div className="flex items-center gap-1.5">
                            {!inv.is_equipped && (
                              <button
                                onClick={() => handleSellItem(inv.inventory_id)}
                                className="px-2.5 py-1 text-xs rounded-lg text-amber-400 hover:bg-amber-400/10 font-heading font-bold cursor-pointer transition-colors"
                              >
                                Vender
                              </button>
                            )}

                            {isConsumable ? (
                              <button
                                onClick={() => handleUseConsumable(inv.inventory_id)}
                                className="px-3 py-1 rounded-xl bg-gradient-to-r from-purple-500/30 to-purple-600/30 hover:from-purple-500/50 text-purple-200 border border-purple-400/50 font-heading font-bold text-xs uppercase transition-all cursor-pointer shadow active:scale-95"
                              >
                                🧪 Beber
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleEquip(inv.inventory_id)}
                                className={`px-3 py-1 rounded-xl text-xs font-heading font-bold uppercase transition-all cursor-pointer shadow active:scale-95 ${
                                  inv.is_equipped
                                    ? 'bg-crimson/20 text-crimson border border-crimson/40 hover:bg-crimson/30'
                                    : 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30'
                                }`}
                              >
                                {inv.is_equipped ? 'Quitar' : 'Equipar'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Titles Selector Section */}
            {titles.length > 0 && (
              <section className="space-y-3 pt-2">
                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" /> Títulos Legendarios Desbloqueados
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {titles.map((t: any) => {
                    const isCurrent = player.equipped_title === t.name || player.title === t.name;
                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-amber-400/15 border-amber-400/60 shadow-sm'
                            : 'bg-surface-card border-surface-border'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-heading font-bold text-white text-xs truncate">
                            {t.name}
                          </div>
                          <div className="text-[10px] text-gray-400 line-clamp-1">{t.description}</div>
                        </div>

                        <button
                          onClick={() => handleEquipTitle(t.id)}
                          disabled={isCurrent}
                          className={`px-3 py-1 rounded-lg text-[11px] font-heading font-bold uppercase cursor-pointer shrink-0 ${
                            isCurrent
                              ? 'bg-amber-400 text-black font-black'
                              : 'bg-surface-card hover:bg-surface-border text-gray-300 border border-surface-border'
                          }`}
                        >
                          {isCurrent ? 'Activo' : 'Usar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        );
      })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: CLAN & TERRITORIOS (VISTA INTEGRADA) */}
      {/* ========================================================= */}
      {activeTab === 'CLAN' && (
        <div className="space-y-4 animate-fadeIn">
          <ClanTerritoryModal
            isEmbedded
            playerGold={player.gold}
            playerName={player.name}
            onRefreshPlayer={loadData}
            initialTab={clanInitialTab}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 3: ARENA DE COMBATE PVP */}
      {/* ========================================================= */}
      {activeTab === 'ARENA' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Pending Challenges Alert Banner */}
          {pendingChallenges.length > 0 && (
            <section className="bg-gradient-to-r from-crimson/20 via-primary/20 to-surface border border-primary/60 rounded-2xl p-4 shadow-[0_0_25px_var(--accent-glow)] space-y-3 theme-card">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-extrabold text-primary flex items-center gap-2 uppercase tracking-wider">
                  <Swords className="w-5 h-5 text-primary animate-pulse" />
                  <span>¡RETOS DE COMBATE PENDIENTES!</span>
                </h3>
                <span className="text-[10px] bg-primary/30 text-primary border border-primary/50 px-2 py-0.5 rounded-lg font-mono font-bold">
                  {pendingChallenges.length} Desafío(s)
                </span>
              </div>

              <div className="space-y-2">
                {pendingChallenges.map((ch) => (
                  <div key={ch.id} className="bg-surface-card/90 border border-surface-border rounded-xl p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-heading text-xs text-white font-bold">
                        ⚔️ <span className="text-primary">{ch.challenger_name}</span> te ha desafiado por <span className="text-emerald">{ch.wager} Oro</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">Apuesta en juego: {ch.wager}G</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptChallenge(ch.id)}
                        disabled={pvpLoading}
                        className="bg-emerald hover:bg-emerald/80 active:scale-95 text-black font-heading font-extrabold px-3 py-1.5 rounded-xl text-xs uppercase shadow-[0_0_10px_rgba(16,185,129,0.4)] cursor-pointer"
                      >
                        ⚔️ Aceptar Duelo
                      </button>
                      <button
                        onClick={() => handleDeclineChallenge(ch.id)}
                        className="bg-crimson/20 hover:bg-crimson/40 text-crimson border border-crimson/40 font-heading font-bold px-2.5 py-1.5 rounded-xl text-xs uppercase cursor-pointer"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pvpMsg && (
            <div className="bg-emerald/10 border border-emerald/40 text-emerald text-xs p-3 rounded-xl font-heading font-bold text-center">
              {pvpMsg}
            </div>
          )}

          {/* Launch New PvP Challenge Form */}
          <section className="p-5 theme-card space-y-4">
            <div className="flex items-center gap-2.5 border-b border-surface-border pb-3">
              <Swords className="w-6 h-6 text-crimson animate-pulse" />
              <div>
                <h3 className="font-heading text-base font-bold text-crimson uppercase tracking-wider">
                  Desafiar a un Aventurero (PvP Bo3)
                </h3>
                <p className="text-xs text-gray-400 font-sans">
                  Fórmula de Tirada: 1d20 + [Nivel / 5] + Bono de Clase. El primero en ganar 2 rondas se lleva el botín.
                </p>
              </div>
            </div>

            <form onSubmit={handleLaunchPvPDuel} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-heading text-gray-300 block mb-1 font-bold">Aventurero Rival</label>
                <select
                  value={selectedOpponentId}
                  onChange={(e) => setSelectedOpponentId(e.target.value)}
                  className="w-full bg-surface-card border border-surface-border rounded-xl p-2.5 text-xs text-white font-sans focus:border-crimson focus:outline-none"
                >
                  {party.map((opp) => (
                    <option key={opp.id} value={opp.id}>
                      {opp.name} (Nvl {opp.level} - {opp.secret_class || opp.secretClass})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-heading text-gray-300 block mb-1 font-bold">Apuesta en Oro</label>
                <select
                  value={pvpWager}
                  onChange={(e) => setPvpWager(parseInt(e.target.value))}
                  className="w-full bg-surface-card border border-surface-border rounded-xl p-2.5 text-xs text-primary font-bold font-mono focus:border-crimson focus:outline-none"
                >
                  <option value={10}>10 Oro (Duelo Amistoso)</option>
                  <option value={25}>25 Oro (Apuesta Media)</option>
                  <option value={50}>50 Oro (Apuesta Leyenda)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={pvpLoading || !selectedOpponentId}
                  className="w-full bg-crimson hover:bg-red-600 text-white font-heading font-extrabold py-2.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all uppercase text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Swords className="w-4 h-4" />
                  <span>{pvpLoading ? 'Invocando...' : 'Lanzar Desafío Bo3'}</span>
                </button>
              </div>
            </form>
          </section>

          {/* Quick Duel Record Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-surface-card p-4 rounded-xl border border-emerald/40 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Victorias PvP</span>
              <div className="font-heading text-2xl font-black text-emerald">{player.pvp_wins || 0}</div>
            </div>
            <div className="bg-surface-card p-4 rounded-xl border border-crimson/40 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Derrotas PvP</span>
              <div className="font-heading text-2xl font-black text-crimson">{player.pvp_losses || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 4: CRÓNICAS & MISIONES */}
      {/* ========================================================= */}
      {activeTab === 'CHRONICLES' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Muro de la Comunidad & Comercio P2P */}
          <section className="bg-gradient-to-r from-primary/10 via-surface-card to-surface-card border border-primary/40 rounded-2xl p-4 shadow-md flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-extrabold text-primary uppercase tracking-wider flex items-center gap-2">
                <span>📜 Muro de la Taberna & Mercado P2P</span>
              </h3>
              <p className="text-xs text-gray-300 font-sans">
                Publica anuncios, lee los rumores de los taberneros y comercia ítems directamente con la comunidad.
              </p>
            </div>
            <button
              onClick={() => {
                sfx.playAudio('click');
                sfx.haptic([20]);
                setIsTavernWallOpen(true);
              }}
              className="bg-primary hover:bg-primary/90 text-black font-heading font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-md hover:scale-105"
            >
              Abrir Muro & P2P
            </button>
          </section>
          {/* Daily Quests Section */}
          {quests.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-primary" /> Misiones Diarias del Gremio
              </h3>

              <div className="space-y-2.5">
                {quests.map((q: any) => (
                  <div key={q.id} className="p-4 theme-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-white text-xs">{q.title}</h4>
                        {q.is_completed && (
                          <span className="text-[9px] bg-emerald/20 text-emerald border border-emerald/40 px-1.5 py-0.5 rounded font-mono font-bold">
                            COMPLETADA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-sans">{q.description}</p>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs shrink-0">
                      <span className="text-magic font-bold">+{q.reward_xp} XP</span>
                      <span className="text-primary font-bold">+{q.reward_gold} G</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent NFC Scan Logs */}
          <section className="space-y-3">
            <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Historial de Tiradas y Botín NFC
            </h3>

            <div className="theme-card overflow-hidden">
              {scanLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs font-sans">
                  Aún no has registrado tiradas presenciales. ¡Reclama tu Medalla Diaria o apoya tu llavero NFC en la taberna!
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {scanLogs.map((log) => (
                    <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-surface-card/60 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-xs text-white">Tirada d20: {log.final_roll}</span>
                          {log.final_roll === 20 && (
                            <span className="text-[9px] bg-primary/20 border border-primary text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                              Nat 20 Crítico
                            </span>
                          )}
                          {log.final_roll === 1 && (
                            <span className="text-[9px] bg-crimson/20 border border-crimson text-crimson px-1.5 py-0.5 rounded font-bold uppercase">
                              Pifia
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-xs font-bold">
                        <span className="text-magic">+{log.xp_awarded} XP</span>
                        <span className="text-primary">+{log.gold_awarded} Oro</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALES GLOBALES */}
      {/* ========================================================= */}

      {/* Interactive D20 PvP Duel Arena Modal */}
      <D20DuelArenaModal
        isOpen={Boolean(lastDuelModal)}
        onClose={() => setLastDuelModal(null)}
        duelResult={lastDuelModal}
        currentUserId={player.id}
      />

      {/* Salón de la Fama Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* Tablón de Misiones Diarias, Semanales & La Gran Bóveda */}
      <GuildQuestsModal
        isOpen={isDailyModalOpen}
        onClose={() => setIsDailyModalOpen(false)}
        lastClaimAt={player.last_daily_claim_at}
        streakDays={player.streak_days}
        onRefreshPlayer={loadData}
      />

      {/* V1.5.0: Muro de la Taberna & Mercado P2P */}
      <TavernWallAndMarketModal
        isOpen={isTavernWallOpen}
        onClose={() => setIsTavernWallOpen(false)}
        playerGold={player.gold}
        inventory={inventory}
        onRefreshPlayer={loadData}
      />

      {/* V2.2.0: Árbol de Talentos & Taller de Forja */}
      <TalentsAndForgeModal
        isOpen={isTalentsForgeOpen}
        onClose={() => setIsTalentsForgeOpen(false)}
        playerLevel={player.level}
        playerGold={player.gold}
        playerClass={player.secretClass || player.secret_class}
        inventory={inventory}
        onRefreshPlayer={loadData}
      />

      {/* V2.5.0: Compañeros Místicos & Dados de Mentiroso */}
      <PetsAndGamesModal
        isOpen={isPetsGamesOpen}
        onClose={() => setIsPetsGamesOpen(false)}
        playerGold={player.gold}
        onRefreshPlayer={loadData}
      />

      {/* V3.0.0: Guerra de Clanes & Mapa Territorial */}
      <ClanTerritoryModal
        isOpen={isClanTerritoryOpen}
        onClose={() => setIsClanTerritoryOpen(false)}
        playerGold={player.gold}
        playerName={player.name}
        onRefreshPlayer={loadData}
        initialTab={clanInitialTab}
      />

      {/* V3.4.0: Modal de Inspección Detallada de Ítems & Comparativa de Equipo */}
      <ItemInspectModal
        isOpen={!!inspectingItem}
        onClose={() => setInspectingItem(null)}
        item={inspectingItem}
        currentlyEquippedItem={
          inspectingItem
            ? inventory.find((i) => i.is_equipped && i.slot === inspectingItem.slot)
            : null
        }
        onToggleEquip={handleToggleEquip}
        onUseConsumable={handleUseConsumable}
        onSellItem={handleSellItem}
        onOpenForge={() => setIsTalentsForgeOpen(true)}
      />

      {/* V3.6.0: Dungeon Crawler - Expediciones a las Catacumbas */}
      <ExpeditionsModal
        isOpen={isExpeditionsModalOpen}
        onClose={() => setIsExpeditionsModalOpen(false)}
        playerLevel={player.level}
        playerClass={player.secretClass || player.secret_class}
        onRefreshPlayer={loadData}
      />

      {/* V3.6.0: Logros del Gremio & Títulos Honoríficos con Perks */}
      <AchievementsAndTitlesModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
        onRefreshPlayer={loadData}
      />

      {/* Senda Infinita: Aventura Procedural Continua (Widget & Modal) */}
      <InfiniteJourneyWidget
        playerClass={player.secretClass || player.secret_class || 'WARRIOR'}
        playerName={player.name}
        playerLevel={player.level}
        onOpenModal={() => setIsInfiniteJourneyModalOpen(true)}
        onRefreshPlayer={loadData}
      />

      <InfiniteJourneyModal
        isOpen={isInfiniteJourneyModalOpen}
        onClose={() => setIsInfiniteJourneyModalOpen(false)}
        playerClass={player.secretClass || player.secret_class || 'WARRIOR'}
        playerName={player.name}
        playerLevel={player.level}
        onRefreshPlayer={loadData}
        onShowToast={addToast}
      />

      {/* Sistema de Notificaciones RPG Flotantes (Toasts) */}
      <RpgToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
