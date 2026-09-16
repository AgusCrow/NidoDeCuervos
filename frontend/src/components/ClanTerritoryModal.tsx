import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  MapPin, 
  Flag, 
  Users, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw,
  Coins,
  Swords,
  Zap,
  Crown,
  Flame,
  Bomb,
  Award,
  Clock,
  ChevronRight,
  ShieldAlert,
  Gift,
  Play,
  Skull,
  Trophy
} from 'lucide-react';
import api from '../services/api';
import { sfx } from '../services/sfx';

interface Territory {
  id: string;
  name: string;
  controlling_clan_id?: string | null;
  controlling_clan_name?: string | null;
  controlling_clan_tag?: string | null;
  bonus_description: string;
  buff_type: string;
  buff_title: string;
  defense_points: number;
  fortification_level: number;
  daily_gold_rate: number;
  accumulated_gold: number;
  last_payout_at: string;
  siege_status: string;
  siege_target_points: number;
  siege_progress: Record<string, { clan_name: string; tag: string; points: number }>;
}

interface Clan {
  id: string;
  name: string;
  tag: string;
  emblem: string;
  treasury_gold: number;
  level: number;
  description?: string;
  clan_xp: number;
  clan_xp_next: number;
  perks_unlocked: string[];
}

interface ClanMember {
  id: string;
  clan_id: string;
  player_id: string;
  player_name: string;
  role: 'LEADER' | 'OFFICER' | 'VETERAN' | 'MEMBER';
  contribution_points: number;
  joined_at: string;
}

interface TugOfWarState {
  warId: string;
  territoryName: string;
  clanA: { id: string; name: string; tag: string; emblem: string };
  clanB: { id: string; name: string; tag: string; emblem: string };
  flagPosition: number; // -100 (Clan A) a +100 (Clan B), 0 neutral
  hoursRemaining: number;
  shieldWallClanA: boolean;
  shieldWallClanB: boolean;
  moraleBuffClanA: boolean;
  moraleBuffClanB: boolean;
  historyLogs: { timestamp: string; clanTag: string; playerName: string; text: string; deltaMeters: number }[];
}

export type ClanTabType = 'WAR' | 'SIEGES' | 'GENS' | 'RANKINGS' | 'CLAN' | 'SOLO_RAIDS' | 'PERKS';

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  playerGold: number;
  playerName: string;
  onRefreshPlayer: () => void;
  isEmbedded?: boolean;
  initialTab?: ClanTabType;
}

export const ClanTerritoryModal: React.FC<Props> = ({
  isOpen = false,
  onClose = () => {},
  playerGold,
  playerName,
  onRefreshPlayer,
  isEmbedded = false,
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<ClanTabType>(initialTab || 'WAR');
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [myClanData, setMyClanData] = useState<{ inClan: boolean; clan?: Clan; member?: ClanMember; allMembers?: ClanMember[] }>({ inClan: false });
  const [allClans, setAllClans] = useState<Clan[]>([]);
  
  // Creation state
  const [newClanName, setNewClanName] = useState('');
  const [newClanTag, setNewClanTag] = useState('');
  const [donationAmount, setDonationAmount] = useState('50');

  // Solo Raids State
  const [selectedDungeonId, setSelectedDungeonId] = useState<'catacombs' | 'sagrario' | 'chaos_rift'>('catacombs');
  const [soloRaidState, setSoloRaidState] = useState<{
    inRaid: boolean;
    dungeonId: string;
    currentRoomIndex: number;
    roomLogs: any[];
    status: 'LOBBY' | 'IN_PROGRESS' | 'VICTORY' | 'DEFEATED';
    finalLoot?: any;
  }>({
    inRaid: false,
    dungeonId: 'catacombs',
    currentRoomIndex: 0,
    roomLogs: [],
    status: 'LOBBY'
  });
  const [selectedTactic, setSelectedTactic] = useState<'CHARGE' | 'STEALTH' | 'ARCANE'>('CHARGE');
  const [lastRollResult, setLastRollResult] = useState<{ d20: number; isCrit: boolean; passed: boolean; flavor: string } | null>(null);

  // Tug of War State
  const [tugOfWar, setTugOfWar] = useState<TugOfWarState | null>(null);
  const [myClanSide, setMyClanSide] = useState<'CLAN_A' | 'CLAN_B'>('CLAN_A');

  // Gens & Siege Events States
  const [gensData, setGensData] = useState<any>(null);
  const [clanRankings, setClanRankings] = useState<any[]>([]);
  const [arkaState, setArkaState] = useState<any>(null);
  const [acheronState, setAcheronState] = useState<any>(null);
  const [activeSiegeSubTab, setActiveSiegeSubTab] = useState<'OBELISKS' | 'ACHERON' | 'TORMENTED' | 'CHAOS_CASTLE'>('OBELISKS');

  // Network State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen || isEmbedded) {
      fetchAllData();
      fetchTugOfWar();
      loadGensState();
      loadClanRankings();
      loadArkaState();
      loadAcheronState();
    }
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOpen, isEmbedded]);

  const fetchAllData = async () => {
    try {
      const [tRes, cRes, mRes] = await Promise.all([
        api.get('/player/territories'),
        api.get('/player/clans'),
        api.get('/player/clans/my-clan')
      ]);
      if (tRes.data.success) {
        setTerritories(tRes.data.territories);
        try { localStorage.setItem('cached_territories', JSON.stringify(tRes.data.territories)); } catch {}
      }
      if (cRes.data.success) {
        setAllClans(cRes.data.clans);
        try { localStorage.setItem('cached_clans', JSON.stringify(cRes.data.clans)); } catch {}
      }
      if (mRes.data.success) {
        setMyClanData(mRes.data);
        try { localStorage.setItem('cached_my_clan', JSON.stringify(mRes.data)); } catch {}
      }
    } catch (e) {
      try {
        const cT = localStorage.getItem('cached_territories');
        const cC = localStorage.getItem('cached_clans');
        const cM = localStorage.getItem('cached_my_clan');
        if (cT) setTerritories(JSON.parse(cT));
        if (cC) setAllClans(JSON.parse(cC));
        if (cM) setMyClanData(JSON.parse(cM));
      } catch {}
    }
  };

  const fetchTugOfWar = async () => {
    try {
      const res = await api.getTugOfWarState();
      if (res && res.success) {
        setTugOfWar(res.warState);
        if (res.myClanSide) setMyClanSide(res.myClanSide);
      }
    } catch (e) {}
  };

  const loadGensState = async () => {
    try {
      const res = (await api.get('/gens/state')).data;
      setGensData(res);
    } catch (e) {}
  };

  const loadClanRankings = async () => {
    try {
      const res = (await api.get('/gens/clan-rankings')).data;
      setClanRankings(res?.clans || []);
    } catch (e) {}
  };

  const loadArkaState = async () => {
    try {
      const res = (await api.get('/events/arka-war/state')).data;
      setArkaState(res.state);
    } catch (e) {}
  };

  const loadAcheronState = async () => {
    try {
      const res = (await api.get('/events/acheron/state')).data;
      setAcheronState(res.state);
    } catch (e) {}
  };

  // Handlers for Clan War (Tug of War)
  const handleTugOfWarAction = async (actionType: 'PUSH_ASSAULT' | 'SHIELD_WALL' | 'SABOTAGE' | 'RALLY_MORALE') => {
    if (!myClanData.inClan) {
      setStatusMsg({ type: 'err', text: '¡Debes pertenecer a un Clan para combatir en la Guerra!' });
      return;
    }
    try {
      setActionLoading(true);
      sfx.playAudio(actionType === 'PUSH_ASSAULT' ? 'sword' : actionType === 'SHIELD_WALL' ? 'shield' : 'dice');
      sfx.haptic([40, 50]);

      const res = await api.sendTugOfWarAction(actionType);
      if (res && res.success) {
        setTugOfWar(res.warState);
        sfx.playAudio(res.isCrit ? 'crit' : 'coins');
        setStatusMsg({
          type: 'ok',
          text: `🚩 Tirada D20=[${res.d20}] ${res.isCrit ? '🔥 CRÍTICO' : ''} ➔ ¡Moviste el estandarte ${Math.abs(res.deltaMeters)}m! (+${res.fameReward} Fama de Clan)`
        });
        fetchAllData();
        onRefreshPlayer();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || err.message || 'Error al ejecutar acción' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers for Siege Events
  const handleArkaAction = async (nodeId: string) => {
    try {
      setActionLoading(true);
      sfx.playAudio('sword');
      const res = (await api.post('/events/arka-war/action', { nodeId })).data;
      setArkaState(res.state);
      sfx.playAudio(res.isCrit ? 'crit' : 'coins');
      setStatusMsg({
        type: 'ok',
        text: `🚩 Tirada D20=[${res.d20}] ${res.isCrit ? '🔥 CRÍTICO' : ''} ➔ Sumaste +${res.pointsEarned} Pts para ${res.faction}! (+${res.goldEarned} 🪙, +${res.xpEarned} XP)`
      });
      onRefreshPlayer();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcheronAction = async (actionType: string) => {
    try {
      setActionLoading(true);
      sfx.playAudio(actionType === 'REPAIR_MONOLITH' ? 'shield' : 'fire');
      const res = (await api.post('/events/acheron/action', { actionType })).data;
      setAcheronState(res.state);
      sfx.playAudio(res.isCrit ? 'crit' : 'coins');
      setStatusMsg({
        type: 'ok',
        text: `🛡️ Tirada D20=[${res.d20}] ➔ ${res.log}`
      });
      onRefreshPlayer();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlayTormented = async () => {
    try {
      setActionLoading(true);
      sfx.playAudio('dice');
      const res = (await api.post('/events/tormented-square/play', {})).data;
      sfx.playAudio(res.isCrit ? 'crit' : 'coins');
      setStatusMsg({
        type: 'ok',
        text: `⚔️ Tirada D20=[${res.d20}] ➔ Puntuación: ${res.score} Pts (+${res.goldEarned} 🪙, +${res.xpEarned} XP)${res.droppedItem ? ` 🎁 ¡Desbloqueaste ${res.droppedItem.name}!`: ''}`
      });
      onRefreshPlayer();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnterChaosCastle = async () => {
    try {
      setActionLoading(true);
      sfx.playAudio('sword');
      const res = (await api.post('/events/chaos-castle/enter', {})).data;
      sfx.playAudio(res.isVictory ? 'fanfare' : 'd20fail');
      setStatusMsg({
        type: res.isVictory ? 'ok' : 'err',
        text: `🛡️ [${res.anonymousAlias}] Tirada D20=[${res.d20}] ➔ ${res.message}${res.droppedItem ? ` 🏆 Recompensa Mítica+: ${res.droppedItem.name}`: ''}`
      });
      onRefreshPlayer();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for Faction Join
  const handleJoinFaction = async (faction: 'DUPRIAN' | 'VANERT') => {
    try {
      setActionLoading(true);
      sfx.playAudio('fanfare');
      const res = (await api.post('/gens/join', { faction })).data;
      setStatusMsg({ type: 'ok', text: res.message });
      loadGensState();
      onRefreshPlayer();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Solo Raids Handlers
  const handleStartSoloRaid = async () => {
    try {
      setActionLoading(true);
      sfx.playAudio('sword');
      setSoloRaidState({
        inRaid: true,
        dungeonId: selectedDungeonId,
        currentRoomIndex: 1,
        roomLogs: [],
        status: 'IN_PROGRESS'
      });
    } catch (e: any) {
      setStatusMsg({ type: 'err', text: 'Error iniciando raid' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveRoom = async () => {
    try {
      setActionLoading(true);
      sfx.playAudio(selectedTactic === 'CHARGE' ? 'sword' : selectedTactic === 'STEALTH' ? 'shield' : 'dice');

      const res = await api.resolveSoloRaidRoom({
        dungeon_id: soloRaidState.dungeonId,
        room_index: soloRaidState.currentRoomIndex,
        tactic: selectedTactic
      });

      if (res.data && res.data.success) {
        const { rollResult, roomLog, isFinalRoom, raidCompleted, finalLoot } = res.data;
        setLastRollResult(rollResult);
        sfx.playAudio(rollResult.isCrit ? 'crit' : rollResult.passed ? 'coins' : 'd20fail');

        if (raidCompleted) {
          setSoloRaidState((prev) => ({
            ...prev,
            status: 'VICTORY',
            roomLogs: [roomLog, ...prev.roomLogs],
            finalLoot
          }));
          onRefreshPlayer();
        } else if (!rollResult.passed && soloRaidState.currentRoomIndex === 3) {
          setSoloRaidState((prev) => ({
            ...prev,
            status: 'DEFEATED',
            roomLogs: [roomLog, ...prev.roomLogs]
          }));
        } else {
          setSoloRaidState((prev) => ({
            ...prev,
            currentRoomIndex: prev.currentRoomIndex + 1,
            roomLogs: [roomLog, ...prev.roomLogs]
          }));
        }
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || err.message || 'Error en sala' });
    } finally {
      setActionLoading(false);
    }
  };

  // Clan actions
  const handleCreateClan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClanName || !newClanTag) return;
    try {
      setActionLoading(true);
      sfx.playAudio('fanfare');
      const res = await api.post('/player/clans/create', { name: newClanName, tag: newClanTag });
      if (res.data.success) {
        setStatusMsg({ type: 'ok', text: `🛡️ ¡Clan [${newClanTag}] "${newClanName}" fundado con éxito!` });
        setNewClanName('');
        setNewClanTag('');
        fetchAllData();
        onRefreshPlayer();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDonateGold = async () => {
    const amount = parseInt(donationAmount, 10);
    if (!amount || amount <= 0) return;
    try {
      setActionLoading(true);
      sfx.playAudio('coins');
      const res = await api.post('/player/clans/donate', { amount });
      if (res.data.success) {
        setStatusMsg({ type: 'ok', text: `🪙 Donaste ${amount} oro al tesoro de tu clan (+${res.data.xpGained} XP Clan)` });
        fetchAllData();
        onRefreshPlayer();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinClan = async (clanId: string) => {
    try {
      setActionLoading(true);
      sfx.playAudio('click');
      const res = await api.post(`/player/clans/join/${clanId}`);
      if (res.data.success) {
        setStatusMsg({ type: 'ok', text: '⚔️ ¡Te has unido al clan con éxito!' });
        fetchAllData();
        onRefreshPlayer();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen && !isEmbedded) return null;

  const flagPos = tugOfWar?.flagPosition || 0;
  const flagPercent = Math.min(100, Math.max(0, ((flagPos + 100) / 200) * 100));

  return (
    <div className={isEmbedded ? "w-full text-white" : "fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"}>
      <div className={isEmbedded ? "w-full bg-surface-card rounded-2xl p-4 border border-surface-border space-y-4" : "relative w-full max-w-4xl bg-gradient-to-b from-surface via-background to-black border-2 border-primary/50 rounded-3xl shadow-[0_0_50px_var(--accent-glow)] p-4 sm:p-6 space-y-4 text-white my-auto max-h-[92vh] flex flex-col"}>
        
        {/* Header Principal */}
        {!isEmbedded && (
          <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-amber-600 p-0.5 shadow-lg flex items-center justify-center">
                <div className="w-full h-full bg-black/70 rounded-[14px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary animate-pulse" />
                </div>
              </div>
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <span>CENTRO TÁCTICO DE CLANES & ASEDIOS</span>
                </h2>
                <p className="text-[11px] text-gray-400 font-serif italic">
                  Guerreo de Estandarte • Asedios de Gremio • Facciones Gens • Salón de Clanes
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
        )}

        {/* Pestañas de Navegación del Centro de Clanes */}
        <div className="flex border-b border-white/10 bg-black/40 p-1.5 gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => { sfx.haptic([15]); setActiveTab('WAR'); }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'WAR' ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-amber-300" />
            <span>Guerra 24h</span>
          </button>

          <button
            onClick={() => { sfx.haptic([15]); setActiveTab('SIEGES'); }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'SIEGES' ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>Asedios de Clan</span>
          </button>

          <button
            onClick={() => { sfx.haptic([15]); setActiveTab('GENS'); }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'GENS' ? 'bg-amber-600 text-white shadow font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Facciones Gens</span>
          </button>

          <button
            onClick={() => { sfx.haptic([15]); setActiveTab('RANKINGS'); }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'RANKINGS' ? 'bg-yellow-600 text-black shadow font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-black" />
            <span>Ranking Clanes</span>
          </button>

          <button
            onClick={() => { sfx.haptic([15]); setActiveTab('CLAN'); }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'CLAN' ? 'bg-purple-600 text-white shadow font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Mi Clan & Banco</span>
          </button>

          <button
            onClick={() => { sfx.haptic([15]); setActiveTab('SOLO_RAIDS'); }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'SOLO_RAIDS' ? 'bg-primary text-on-primary shadow font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Solo Raids</span>
          </button>

          <button
            onClick={() => { sfx.haptic([15]); setActiveTab('PERKS'); }}
            className={`flex-1 py-2 px-3 rounded-xl font-heading text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'PERKS' ? 'bg-emerald-600 text-white shadow font-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ventajas</span>
          </button>
        </div>

        {/* Status Notification Banner */}
        {statusMsg && (
          <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 shrink-0 ${
            statusMsg.type === 'ok' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300' : 'bg-crimson/20 border-crimson/50 text-crimson'
          }`}>
            <div className="flex items-center gap-2">
              {statusMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="p-2 sm:p-4 overflow-y-auto flex-1 space-y-4 max-h-[62vh]">
          
          {/* TAB 1: CLAN WARS - TIRÓN DE ESTANDARTE */}
          {activeTab === 'WAR' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-surface-card to-amber-950/40 border border-red-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚩</span>
                    <h3 className="font-heading font-black text-sm sm:text-base text-white">
                      Guerra de Asedio: {tugOfWar?.territoryName || 'Fortaleza en Disputa'}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 font-serif mt-0.5">
                    Tirón de Estandarte Asíncrono de 24 Horas • Empuja la bandera hacia la fortaleza enemiga
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 border border-white/10 text-amber-300 font-mono text-xs font-bold shrink-0">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{tugOfWar?.hoursRemaining || 18}h restantes</span>
                </div>
              </div>

              {/* Visual 2D Banner Track */}
              <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-red-950/60 border-2 border-red-500 flex items-center justify-center text-2xl shadow">
                      {tugOfWar?.clanA.emblem || '🦅'}
                    </div>
                    <div>
                      <div className="font-heading font-black text-xs sm:text-sm text-red-400">
                        [{tugOfWar?.clanA.tag}] {tugOfWar?.clanA.name}
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-black text-gray-400">VS</span>

                  <div className="flex items-center gap-2.5 text-right">
                    <div>
                      <div className="font-heading font-black text-xs sm:text-sm text-cyan-400">
                        [{tugOfWar?.clanB.tag}] {tugOfWar?.clanB.name}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border-2 border-cyan-500 flex items-center justify-center text-2xl shadow">
                      {tugOfWar?.clanB.emblem || '🐺'}
                    </div>
                  </div>
                </div>

                <div className="relative pt-4 pb-2">
                  <div className="relative h-4 w-full bg-black/80 rounded-full border border-white/10 p-0.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-red-600 via-yellow-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${flagPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <button
                    onClick={() => handleTugOfWarAction('PUSH_ASSAULT')}
                    disabled={actionLoading}
                    className="py-3 px-2 rounded-xl bg-gradient-to-b from-red-600 to-red-800 hover:brightness-110 font-heading font-black text-xs uppercase shadow flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <span>⚔️ Embestida D20</span>
                  </button>
                  <button
                    onClick={() => handleTugOfWarAction('SHIELD_WALL')}
                    disabled={actionLoading}
                    className="py-3 px-2 rounded-xl bg-gradient-to-b from-blue-600 to-blue-800 hover:brightness-110 font-heading font-black text-xs uppercase shadow flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <span>🛡️ Muro de Escudos</span>
                  </button>
                  <button
                    onClick={() => handleTugOfWarAction('SABOTAGE')}
                    disabled={actionLoading}
                    className="py-3 px-2 rounded-xl bg-gradient-to-b from-purple-600 to-purple-800 hover:brightness-110 font-heading font-black text-xs uppercase shadow flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <span>💣 Sabotaje</span>
                  </button>
                  <button
                    onClick={() => handleTugOfWarAction('RALLY_MORALE')}
                    disabled={actionLoading}
                    className="py-3 px-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 text-black hover:brightness-110 font-heading font-black text-xs uppercase shadow flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <span>🎺 Arenga Héroes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVEENTOS DE ASEDIO DE CLAN */}
          {activeTab === 'SIEGES' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-card p-1.5 rounded-xl border border-surface-border">
                <button
                  onClick={() => setActiveSiegeSubTab('OBELISKS')}
                  className={`py-2 rounded-lg font-heading text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    activeSiegeSubTab === 'OBELISKS' ? 'bg-red-600 text-white font-black shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" /> Obeliscos
                </button>
                <button
                  onClick={() => setActiveSiegeSubTab('ACHERON')}
                  className={`py-2 rounded-lg font-heading text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    activeSiegeSubTab === 'ACHERON' ? 'bg-amber-500 text-black font-black shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Sagrario
                </button>
                <button
                  onClick={() => setActiveSiegeSubTab('TORMENTED')}
                  className={`py-2 rounded-lg font-heading text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    activeSiegeSubTab === 'TORMENTED' ? 'bg-purple-600 text-white font-black shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" /> Arena Tormentosa
                </button>
                <button
                  onClick={() => setActiveSiegeSubTab('CHAOS_CASTLE')}
                  className={`py-2 rounded-lg font-heading text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    activeSiegeSubTab === 'CHAOS_CASTLE' ? 'bg-crimson text-white font-black shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Skull className="w-3.5 h-3.5" /> Bastión Colapsable
                </button>
              </div>

              {activeSiegeSubTab === 'OBELISKS' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-surface-card border border-red-500/30">
                    <h4 className="font-heading font-black text-sm text-red-400 uppercase">Conquista de Obeliscos Ritual de Asedio</h4>
                    <p className="text-xs text-gray-300 font-serif">Canaliza tiradas D20 sobre los obeliscos para asegurar el control de la zona.</p>
                  </div>
                  {(arkaState?.nodes || []).map((node: any) => (
                    <div key={node.id} className="p-3.5 rounded-xl bg-black/50 border border-surface-border flex items-center justify-between gap-2">
                      <div>
                        <h5 className="font-heading font-bold text-xs text-white">{node.name}</h5>
                        <p className="text-[11px] text-gray-400 font-serif">Titular: {node.currentHolder} • Dominio: {node.controlledBy}</p>
                      </div>
                      <button
                        onClick={() => handleArkaAction(node.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-black font-heading font-black text-xs uppercase shadow cursor-pointer"
                      >
                        🚩 Canalizar D20
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeSiegeSubTab === 'ACHERON' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-surface-card border border-amber-500/30">
                    <h4 className="font-heading font-black text-sm text-amber-400 uppercase">Defensa del Sagrario Elemental</h4>
                    <p className="text-xs text-gray-300 font-serif">Monolito HP: {acheronState?.monolithHp || 0} / {acheronState?.maxMonolithHp || 1000}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcheronAction('INTERCEPT_KAMIKAZE')}
                      disabled={actionLoading}
                      className="flex-1 py-3 rounded-xl bg-red-600 text-white font-heading font-black text-xs uppercase shadow cursor-pointer"
                    >
                      ⚔️ Interceptar Hordas (D20)
                    </button>
                    <button
                      onClick={() => handleAcheronAction('REPAIR_MONOLITH')}
                      disabled={actionLoading}
                      className="flex-1 py-3 rounded-xl bg-amber-500 text-black font-heading font-black text-xs uppercase shadow cursor-pointer"
                    >
                      🛡️ Reparar Barrera (D20)
                    </button>
                  </div>
                </div>
              )}

              {activeSiegeSubTab === 'TORMENTED' && (
                <div className="p-4 rounded-xl bg-surface-card border border-purple-500/30 space-y-3">
                  <h4 className="font-heading font-black text-sm text-purple-400 uppercase">Prueba de la Arena Tormentosa</h4>
                  <p className="text-xs text-gray-300 font-serif">Combate encadenado por fases de tiempo con multiplicadores de puntuación.</p>
                  <button
                    onClick={handlePlayTormented}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 text-white font-heading font-black text-xs uppercase shadow cursor-pointer"
                  >
                    🔥 Iniciar Reto de Puntuación (D20)
                  </button>
                </div>
              )}

              {activeSiegeSubTab === 'CHAOS_CASTLE' && (
                <div className="p-4 rounded-xl bg-surface-card border border-crimson/40 space-y-3">
                  <h4 className="font-heading font-black text-sm text-crimson uppercase">Asedio del Bastión Colapsable</h4>
                  <p className="text-xs text-gray-300 font-serif">
                    Anonimato absoluto. Plataforma destructible. ¡Garantiza <span className="text-amber-400 font-bold">Recompensa de Rareza &gt; 5 (Mítica o superior)</span> al vencer!
                  </p>
                  <button
                    onClick={handleEnterChaosCastle}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-xl bg-crimson text-white font-heading font-black text-xs uppercase shadow cursor-pointer"
                  >
                    💀 Entrar al Bastión Colapsable (D20)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FACCIONES GENS */}
          {activeTab === 'GENS' && (
            <div className="space-y-4">
              {gensData?.gensFaction ? (
                <div className="p-4 rounded-xl bg-surface-card border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-sm text-amber-300">
                      {gensData.gensFaction === 'DUPRIAN' ? '🌹 GENS DUPRIAN (Rosa Sangrienta)' : '☀️ GENS VANERT (Sol Arcano)'}
                    </h4>
                    <span className="font-mono text-xs font-bold text-amber-400">{gensData?.gensPoints || 0} PTS</span>
                  </div>
                  {gensData?.gensRank && (
                    <div className="text-xs font-mono text-emerald-400">
                      Rango: {gensData.gensRank.icon} {gensData.gensRank.name} • {gensData.gensRank.statBonus}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-center space-y-2">
                    <span className="text-3xl">🌹</span>
                    <h5 className="font-heading font-black text-sm text-red-400">GENS DUPRIAN</h5>
                    <button
                      onClick={() => handleJoinFaction('DUPRIAN')}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl bg-red-600 text-white font-heading font-black text-xs uppercase shadow cursor-pointer"
                    >
                      Jurar Lealtad
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-center space-y-2">
                    <span className="text-3xl">☀️</span>
                    <h5 className="font-heading font-black text-sm text-amber-400">GENS VANERT</h5>
                    <button
                      onClick={() => handleJoinFaction('VANERT')}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-heading font-black text-xs uppercase shadow cursor-pointer"
                    >
                      Jurar Lealtad
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RANKING CLANES */}
          {activeTab === 'RANKINGS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-xs text-amber-400 uppercase">SALÓN DE LA FAMA DE CLANES (GUILD HALL)</h4>
                <button onClick={loadClanRankings} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer">
                  <RefreshCw className="w-3 h-3" /> Actualizar
                </button>
              </div>

              <div className="space-y-2">
                {clanRankings.map((c, idx) => (
                  <div key={c.id} className="p-3 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">#{idx + 1}</span>
                      <span className="text-lg">{c.emblem}</span>
                      <div>
                        <span className="font-heading font-bold text-white">[{c.tag}] {c.name}</span>
                        <div className="text-[10px] text-gray-400 font-serif">Líder: {c.leader_name} • Facción: {c.gens_faction}</div>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-amber-400 font-bold">{c.clan_xp.toLocaleString()} XP</div>
                      <div className="text-gray-400">{c.treasury_gold.toLocaleString()} 🪙</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MI CLAN & BANCO DE RELIQUIAS */}
          {activeTab === 'CLAN' && (
            <div className="space-y-4">
              {myClanData.inClan && myClanData.clan ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-surface-card to-black border border-purple-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{myClanData.clan.emblem || '🛡️'}</span>
                      <div>
                        <h4 className="font-heading font-black text-sm text-white">[{myClanData.clan.tag}] {myClanData.clan.name}</h4>
                        <p className="text-xs text-gray-400 font-serif">Nivel de Gremio {myClanData.clan.level} • {myClanData.clan.clan_xp} XP</p>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs text-amber-400">
                      Tesorería: {myClanData.clan.treasury_gold.toLocaleString()} 🪙
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-3">
                    <h5 className="font-heading font-bold text-xs text-amber-400 uppercase">Donar al Tesoro del Clan</h5>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        className="bg-black/60 border border-surface-border rounded-xl px-3 py-2 text-xs text-white font-mono w-32"
                      />
                      <button
                        onClick={handleDonateGold}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-amber-500 text-black font-heading font-bold text-xs rounded-xl shadow cursor-pointer"
                      >
                        🪙 Donar Oro
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <form onSubmit={handleCreateClan} className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-3">
                    <h4 className="font-heading font-bold text-xs text-amber-400 uppercase">Fundar Nuevo Clan</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre del Clan"
                        value={newClanName}
                        onChange={(e) => setNewClanName(e.target.value)}
                        className="bg-black/60 border border-surface-border rounded-xl px-3 py-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="TAG (3 letras)"
                        value={newClanTag}
                        onChange={(e) => setNewClanTag(e.target.value.toUpperCase())}
                        maxLength={4}
                        className="bg-black/60 border border-surface-border rounded-xl px-3 py-2 text-xs text-white uppercase font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-2.5 bg-primary text-black font-heading font-bold text-xs rounded-xl shadow cursor-pointer"
                    >
                      🛡️ Fundar Clan
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SOLO RAIDS */}
          {activeTab === 'SOLO_RAIDS' && (
            <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-3">
              <h4 className="font-heading font-black text-sm text-primary uppercase">Incursión Táctica Solo (3 Salas)</h4>
              <button
                onClick={handleStartSoloRaid}
                disabled={actionLoading}
                className="w-full py-3 bg-primary text-black font-heading font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                ⚔️ Iniciar Solo Raid
              </button>
            </div>
          )}

          {/* TAB 7: PERKS */}
          {activeTab === 'PERKS' && (
            <div className="p-4 rounded-2xl bg-surface-card border border-surface-border space-y-2 text-xs text-gray-300 font-serif">
              <h4 className="font-heading font-bold text-amber-400 uppercase">Ventajas Territoriales Desbloqueadas</h4>
              <p>• +15% Bonificación de Oro en Duelos PvP para miembros de clanes con territorio activo.</p>
              <p>• +10% Experiencia pasiva en Senda Infinita.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
