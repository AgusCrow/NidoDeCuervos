import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Flame, 
  Trophy, 
  RefreshCw, 
  Zap, 
  Shield, 
  Sparkles, 
  AlertTriangle, 
  Gift, 
  Crown, 
  Coins, 
  Clock, 
  Swords, 
  Store, 
  Medal, 
  ChevronRight,
  ShieldAlert,
  Skull,
  Award,
  Play
} from 'lucide-react';
import { api } from '../services/api';
import { sfx } from '../services/sfx';

interface Contributor {
  player_id: string;
  player_name: string;
  damage: number;
  rank: number;
  medal: string;
  sharePct: number;
}

interface Milestone {
  id: '75' | '50' | '25' | '0';
  targetPercent: number;
  label: string;
  description: string;
  isReached: boolean;
  hasClaimed: boolean;
  reward: {
    gold: number;
    xp: number;
    guild_tokens: number;
    isItem?: boolean;
  };
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost_tokens: number;
  icon: string;
}

interface BossState {
  id: string;
  name: string;
  title: string;
  current_hp: number;
  max_hp: number;
  hpPercent: number;
  element: string;
  level: number;
  reward_gold: number;
  reward_xp: number;
  is_defeated: boolean;
  weakness?: string;
  trait?: string;
  icon?: string;
  phase?: number;
  lore_description?: string;
  combat_cries?: {
    enter: string;
    half_hp: string;
    defeat: string;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerLevel: number;
  playerClass?: string;
  onRefreshPlayer: () => void;
}

type WarRoomTab = 'ASSAULT' | 'MILESTONES' | 'RANKING' | 'SHOP';

export const RaidBossModal: React.FC<Props> = ({
  isOpen,
  onClose,
  playerLevel,
  playerClass = 'WARRIOR',
  onRefreshPlayer
}) => {
  // Estado de Salón de Guerra
  const [activeTab, setActiveTab] = useState<WarRoomTab>('ASSAULT');
  const [boss, setBoss] = useState<BossState | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [guildShop, setGuildShop] = useState<ShopItem[]>([]);
  const [dailyAttempts, setDailyAttempts] = useState<{ attempts_left: number; max_attempts: number; total_session_damage: number }>({
    attempts_left: 3,
    max_attempts: 3,
    total_session_damage: 0
  });
  const [playerStats, setPlayerStats] = useState<{ personalDamage: number; rank: number | null; guild_tokens: number }>({
    personalDamage: 0,
    rank: null,
    guild_tokens: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ==========================================
  // ESTADO DE LA ARENA DE ASALTO (60s DPS CHECK)
  // ==========================================
  const [inCombatArena, setInCombatArena] = useState<boolean>(false);
  const [arenaSecondsLeft, setArenaSecondsLeft] = useState<number>(60);
  const [sessionDamage, setSessionDamage] = useState<number>(0);
  const [attacksCount, setAttacksCount] = useState<number>(0);
  const [critsCount, setCritsCount] = useState<number>(0);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [isHeroStriking, setIsHeroStriking] = useState<boolean>(false);
  const [isColossusHit, setIsColossusHit] = useState<boolean>(false);
  const [floatingHits, setFloatingHits] = useState<{ id: number; text: string; isCrit: boolean; x: number; y: number }[]>([]);

  // Habilidades de Asalto con Cooldown (en segundos)
  const [skill1Cd, setSkill1Cd] = useState<number>(0); // Tajo Voraz (6s)
  const [skill2Cd, setSkill2Cd] = useState<number>(0); // Guardia Férrea (8s)
  const [skill3Cd, setSkill3Cd] = useState<number>(0); // Furia de Berserker (15s)
  const [isGuardActive, setIsGuardActive] = useState<boolean>(false);
  const [isBerserkActive, setIsBerserkActive] = useState<boolean>(false);
  const [isStunned, setIsStunned] = useState<boolean>(false);

  // Mecánica de Furia / Advertencia del Coloso
  const [colossusTelegraph, setColossusTelegraph] = useState<{ active: boolean; message: string; msLeft: number } | null>(null);

  // Pantalla de Veredicto Final del Asalto
  const [assaultVerdict, setAssaultVerdict] = useState<{
    damageDealt: number;
    tokensEarned: number;
    goldEarned: number;
    xpEarned: number;
  } | null>(null);

  const normClass = (playerClass || 'WARRIOR').toUpperCase();
  const heroAvatar = {
    MAGE: '🧙‍♂️',
    ROGUE: '🗡️',
    BARD: '🎺',
    WARRIOR: '🛡️'
  }[normClass] || '⚔️';

  // Carga inicial y refresco cada 5s
  useEffect(() => {
    if (isOpen) {
      fetchGuildState();
      const interval = setInterval(fetchGuildState, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const fetchGuildState = async () => {
    try {
      const res = await api.getGuildRaidState();
      if (res && res.success) {
        setBoss(res.boss);
        if (res.catalog) setCatalog(res.catalog);
        if (res.milestones) setMilestones(res.milestones);
        if (res.topContributors) setTopContributors(res.topContributors);
        if (res.dailyAttempts) setDailyAttempts(res.dailyAttempts);
        if (res.playerStats) setPlayerStats(res.playerStats);
        if (res.guildShop) setGuildShop(res.guildShop);
      }
    } catch (e) {
      console.warn('Error al cargar estado de Guild Raid:', e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // ==========================================
  // BUCLE DE COMBATE DE 60 SEGUNDOS (DPS CHECK)
  // ==========================================
  useEffect(() => {
    if (!inCombatArena) return;

    // Reloj principal de 60 segundos
    const countdownTimer = setInterval(() => {
      setArenaSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          finishAssaultSession();
          return 0;
        }
        if (prev <= 10) {
          sfx.playAudio('dice');
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-ataque del héroe continuo (cada 1.2s o 0.6s con berserk)
    const autoAttackSpeed = isBerserkActive ? 600 : 1200;
    const autoAttackTimer = setInterval(() => {
      if (!isStunned) {
        performHeroStrike(false);
      }
    }, autoAttackSpeed);

    // Reducción de cooldowns de habilidades cada 1s
    const cdTimer = setInterval(() => {
      setSkill1Cd((p) => Math.max(0, p - 1));
      setSkill2Cd((p) => Math.max(0, p - 1));
      setSkill3Cd((p) => Math.max(0, p - 1));
    }, 1000);

    return () => {
      clearInterval(countdownTimer);
      clearInterval(autoAttackTimer);
      clearInterval(cdTimer);
    };
  }, [inCombatArena, isBerserkActive, isStunned, sessionDamage]);

  // Generador de ataques devastadores del Coloso (cada ~12 segundos)
  useEffect(() => {
    if (!inCombatArena || isStunned) return;

    const furyInterval = setInterval(() => {
      if (!colossusTelegraph) {
        triggerColossusFuryTelegraph();
      }
    }, 12000 + Math.random() * 4000);

    return () => clearInterval(furyInterval);
  }, [inCombatArena, colossusTelegraph, isStunned]);

  const triggerColossusFuryTelegraph = () => {
    sfx.playAudio('fumble');
    sfx.haptic([60, 40, 60]);
    const attacks = [
      '¡TERREMOTO CATACLÍSMICO EN 2.5s! ¡ACTIVA GUARDIA!',
      '¡ALIENTO DE MAGMA VOLCÁNICO EN 2.5s! ¡PROTÉGETE!',
      '¡ONDA EXPANSIVA DE SOMBRAS EN 2.5s! ¡BLOQUEA O CAE!'
    ];
    const msg = attacks[Math.floor(Math.random() * attacks.length)];
    setColossusTelegraph({ active: true, message: msg, msLeft: 2500 });

    // Cuenta regresiva de canalización del Coloso
    const castTimer = setTimeout(() => {
      setColossusTelegraph(null);
      resolveColossusAttack();
    }, 2500);

    return () => clearTimeout(castTimer);
  };

  const resolveColossusAttack = () => {
    if (isGuardActive) {
      // Bloqueo exitoso
      sfx.playAudio('shield');
      sfx.haptic([80, 50]);
      spawnCombatNumber('🛡️ ¡BLOQUEO PERFECTO! 0 DMG', true);
    } else {
      // Impacto directo: aturdimiento de 2s
      sfx.playAudio('hit');
      sfx.haptic([100, 80, 100]);
      setIsStunned(true);
      spawnCombatNumber('💥 ¡IMPACTADO! ATURDIDO 2s', true);
      setTimeout(() => setIsStunned(false), 2000);
    }
  };

  const spawnCombatNumber = (text: string, isCrit: boolean = false) => {
    const id = Date.now() + Math.random();
    const x = 45 + Math.random() * 20;
    const y = 30 + Math.random() * 25;
    setFloatingHits((prev) => [...prev.slice(-8), { id, text, isCrit, x, y }]);
    setTimeout(() => {
      setFloatingHits((prev) => prev.filter((h) => h.id !== id));
    }, 1000);
  };

  const performHeroStrike = (isManual: boolean = false, multiplier: number = 1.0) => {
    if (isStunned) return;

    setIsHeroStriking(true);
    setTimeout(() => setIsHeroStriking(false), 200);

    setIsColossusHit(true);
    setTimeout(() => setIsColossusHit(false), 200);

    // Cálculo de daño escalado por nivel y equipo
    const baseAtk = 25 + (playerLevel * 7);
    const critChance = isBerserkActive ? 0.60 : 0.25;
    const isCrit = Math.random() < critChance;
    const critMult = isCrit ? 2.0 : 1.0;
    const rawDmg = Math.round((baseAtk + (Math.random() * 12)) * critMult * multiplier * (isBerserkActive ? 1.4 : 1.0));

    setSessionDamage((prev) => prev + rawDmg);
    setAttacksCount((prev) => prev + 1);
    if (isCrit) setCritsCount((prev) => prev + 1);
    setComboStreak((prev) => prev + 1);

    spawnCombatNumber(`-${rawDmg}`, isCrit);

    if (isManual) {
      sfx.playAudio('sword');
      sfx.haptic([25]);
    }
  };

  // Iniciar el asalto
  const handleStartAssault = async () => {
    if (dailyAttempts.attempts_left <= 0) {
      showToast('err', 'No dispones de intentos de asalto hoy. Vuelve mañana.');
      return;
    }

    try {
      setActionLoading(true);
      sfx.playAudio('click');
      const res = await api.startGuildRaidAssault();
      if (res && res.success) {
        setSessionDamage(0);
        setAttacksCount(0);
        setCritsCount(0);
        setComboStreak(0);
        setArenaSecondsLeft(60);
        setSkill1Cd(0);
        setSkill2Cd(0);
        setSkill3Cd(0);
        setIsGuardActive(false);
        setIsBerserkActive(false);
        setIsStunned(false);
        setColossusTelegraph(null);
        setAssaultVerdict(null);
        setInCombatArena(true);
        sfx.playAudio('sword');
      }
    } catch (err: any) {
      showToast('err', err.message || 'Error al iniciar asalto.');
    } finally {
      setActionLoading(false);
    }
  };

  // Finalizar asalto y reportar daño
  const finishAssaultSession = async () => {
    try {
      const res = await api.finishGuildRaidAssault({
        sessionDamage,
        attacksCount,
        critsCount
      });

      if (res && res.success) {
        sfx.playAudio('levelup');
        sfx.playAudio('coins');
        setAssaultVerdict({
          damageDealt: res.cleanDamage,
          tokensEarned: res.tokensEarned,
          goldEarned: res.goldEarned,
          xpEarned: res.xpEarned
        });
        onRefreshPlayer();
        fetchGuildState();
      }
    } catch (err: any) {
      console.error('Error reportando asalto:', err);
      setInCombatArena(false);
    }
  };

  // Habilidad 1: Tajo Voraz (Daño masivo)
  const handleUseSkill1 = () => {
    if (skill1Cd > 0 || isStunned) return;
    setSkill1Cd(6);
    sfx.playAudio('crit');
    sfx.haptic([80, 50, 80]);
    performHeroStrike(true, 3.2);
    spawnCombatNumber('💥 ¡TAJO VORAZ!', true);
  };

  // Habilidad 2: Guardia Férrea (Bloqueo 2.5s)
  const handleUseSkill2 = () => {
    if (skill2Cd > 0 || isStunned) return;
    setSkill2Cd(8);
    setIsGuardActive(true);
    sfx.playAudio('shield');
    sfx.haptic([40, 30]);
    spawnCombatNumber('🛡️ GUARDIA ACTIVADA', false);
    setTimeout(() => setIsGuardActive(false), 2500);
  };

  // Habilidad 3: Furia de Berserker (Buff temporal)
  const handleUseSkill3 = () => {
    if (skill3Cd > 0 || isStunned) return;
    setSkill3Cd(15);
    setIsBerserkActive(true);
    sfx.playAudio('levelup');
    sfx.haptic([100, 80, 100]);
    spawnCombatNumber('🔥 ¡FURIA DE BERSERKER!', true);
    setTimeout(() => setIsBerserkActive(false), 5000);
  };

  // Reclamar Cofre de Hito Comunitario (-25% vida)
  const handleClaimMilestone = async (milestoneId: string) => {
    try {
      setActionLoading(true);
      sfx.playAudio('coins');
      const res = await api.claimGuildRaidMilestone(milestoneId);
      if (res && res.success) {
        showToast('ok', res.message);
        onRefreshPlayer();
        fetchGuildState();
      }
    } catch (err: any) {
      showToast('err', err.message || 'No se pudo reclamar el hito.');
    } finally {
      setActionLoading(false);
    }
  };

  // Comprar en la Tienda de Hermandad
  const handleBuyShopItem = async (itemId: string) => {
    try {
      setActionLoading(true);
      sfx.playAudio('coins');
      const res = await api.buyGuildRaidShopItem(itemId);
      if (res && res.success) {
        showToast('ok', res.message);
        onRefreshPlayer();
        fetchGuildState();
      }
    } catch (err: any) {
      showToast('err', err.message || 'No se pudo comprar el artículo.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentHp = boss?.current_hp ?? 0;
  const maxHp = boss?.max_hp ?? 1;
  const hpPercent = boss?.hpPercent ?? Math.round((currentHp / maxHp) * 100);
  const currentDPS = Math.round(sessionDamage / Math.max(1, (60 - arenaSecondsLeft)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-surface-card via-surface to-black border border-red-500/40 rounded-3xl shadow-[0_0_60px_rgba(220,38,38,0.35)] flex flex-col overflow-hidden my-auto max-h-[94vh]">
        
        {/* ========================================================================= */}
        {/* MODO 2: ARENA DE ASALTO CRONOMETRADO (60s DPS CHECK)                       */}
        {/* ========================================================================= */}
        {inCombatArena ? (
          <div className="flex flex-col h-full select-none">
            {/* Cabecera de Combate & Temporizador 60s */}
            <div className="px-5 py-3 bg-red-950/40 border-b border-red-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-pulse">🐉</span>
                <div>
                  <div className="font-heading font-black text-sm text-white flex items-center gap-2">
                    <span>{boss?.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                      Nvl {boss?.level}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-serif">Asalto Cooperativo • Haz el mayor DPS posible</div>
                </div>
              </div>

              {/* Temporizador Circular 60s */}
              <div className={`px-4 py-1.5 rounded-2xl border flex items-center gap-2 font-mono font-black text-sm tracking-wider shadow-inner ${
                arenaSecondsLeft <= 10 
                  ? 'bg-red-500/30 border-red-500 text-red-300 animate-ping' 
                  : 'bg-black/60 border-white/20 text-amber-300'
              }`}>
                <Clock className="w-4 h-4 text-amber-400" />
                <span>00:{arenaSecondsLeft < 10 ? `0${arenaSecondsLeft}` : arenaSecondsLeft}</span>
              </div>
            </div>

            {/* Barra de Salud Colosal Comunitaria */}
            <div className="px-5 py-2 bg-black/60 border-b border-white/5">
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-300 mb-1">
                <span>Vida del Coloso ({boss?.element})</span>
                <span className="font-bold text-red-400">{currentHp.toLocaleString()} / {maxHp.toLocaleString()} HP ({hpPercent}%)</span>
              </div>
              <div className="h-3 w-full bg-black/80 rounded-full overflow-hidden border border-white/10 p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-red-500 to-rose-600 transition-all duration-300"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Escenario Central de Asalto */}
            <div 
              onClick={() => performHeroStrike(true)}
              className="relative h-64 sm:h-76 bg-gradient-to-b from-black via-zinc-950 to-black overflow-hidden flex items-center justify-between px-8 sm:px-16 cursor-pointer border-b border-red-500/20 group"
              title="¡Haz clic o tap para acelerar ataques!"
            >
              {/* Partículas y Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

              {/* Advertencia de Furia del Coloso (Telegraph) */}
              {colossusTelegraph && (
                <div className="absolute top-4 inset-x-8 sm:inset-x-24 z-30 pointer-events-none animate-bounce">
                  <div className="px-4 py-2 rounded-2xl bg-red-600/90 border-2 border-yellow-400 text-white font-heading font-black text-xs sm:text-sm text-center shadow-[0_0_30px_rgba(239,68,68,0.9)] flex items-center justify-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-yellow-300 animate-pulse" />
                    <span>{colossusTelegraph.message}</span>
                  </div>
                </div>
              )}

              {/* Aturdimiento */}
              {isStunned && (
                <div className="absolute inset-0 bg-red-950/60 z-20 flex items-center justify-center pointer-events-none">
                  <div className="px-4 py-2 rounded-xl bg-black/80 border border-red-500 text-red-300 font-heading font-black text-base animate-pulse">
                    💫 ¡ESTÁS ATURDIDO POR EL IMPACTO!
                  </div>
                </div>
              )}

              {/* Héroe Asaltante (Izquierda) */}
              <div className={`relative z-10 flex flex-col items-center transition-transform duration-150 ${
                isHeroStriking ? 'translate-x-6 scale-110' : 'translate-x-0'
              }`}>
                <div className={`relative text-5xl sm:text-6xl ${isGuardActive ? 'ring-4 ring-cyan-400 rounded-full' : ''}`}>
                  <div className="absolute -inset-2 bg-primary/20 rounded-full blur-md" />
                  {heroAvatar}
                  {isGuardActive && (
                    <div className="absolute -top-3 -right-3 text-xl animate-spin text-cyan-300">
                      🛡️
                    </div>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-xs font-heading font-black text-white">{normClass}</div>
                  <div className="text-[10px] font-mono text-primary font-bold">Nvl {playerLevel}</div>
                </div>
              </div>

              {/* Métricas Centrales de DPS en Vivo */}
              <div className="relative z-10 text-center pointer-events-none">
                <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Daño Total en Sesión</div>
                <div className="text-3xl sm:text-4xl font-heading font-black text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                  {sessionDamage.toLocaleString()}
                </div>
                <div className="flex items-center justify-center gap-3 mt-1 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-bold">
                    ⚡ {currentDPS} DPS
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    🔥 Combo x{comboStreak}
                  </span>
                </div>
              </div>

              {/* El Coloso Semanal (Derecha) */}
              <div className={`relative z-10 flex flex-col items-center transition-transform duration-150 ${
                isColossusHit ? 'scale-95 brightness-150 -translate-x-2' : 'scale-105 animate-pulse'
              }`} style={{ animationDuration: '3s' }}>
                <div className="relative">
                  <div className="absolute -inset-4 bg-red-600/20 rounded-full blur-xl" />
                  <div className="relative text-6xl sm:text-8xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]">
                    {boss?.icon || '🐉'}
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <div className="text-xs font-heading font-black text-red-400">{boss?.name}</div>
                  <div className="text-[10px] font-mono text-gray-400">Fase {boss?.phase || 1}</div>
                </div>
              </div>

              {/* Números flotantes de combate */}
              {floatingHits.map((h) => (
                <div
                  key={h.id}
                  className={`absolute font-heading font-black pointer-events-none animate-bounce z-30 ${
                    h.isCrit
                      ? 'text-amber-300 text-lg sm:text-xl drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]'
                      : 'text-white text-sm sm:text-base drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                  }`}
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                >
                  {h.text}
                </div>
              ))}
            </div>

            {/* Barra de Habilidades Tácticas de Asalto */}
            <div className="p-4 bg-surface-card border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Habilidad 1: Tajo Voraz */}
                <button
                  onClick={handleUseSkill1}
                  disabled={skill1Cd > 0 || isStunned}
                  className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-heading font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  <span>[1] Tajo Voraz</span>
                  {skill1Cd > 0 && <span className="font-mono text-[10px]">({skill1Cd}s)</span>}
                </button>

                {/* Habilidad 2: Guardia Férrea */}
                <button
                  onClick={handleUseSkill2}
                  disabled={skill2Cd > 0 || isStunned}
                  className={`px-3.5 py-2.5 rounded-2xl font-heading font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border ${
                    isGuardActive 
                      ? 'bg-cyan-500 text-black border-cyan-300 animate-pulse' 
                      : 'bg-zinc-800 text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/40'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>[2] Guardia / Bloqueo</span>
                  {skill2Cd > 0 && <span className="font-mono text-[10px]">({skill2Cd}s)</span>}
                </button>

                {/* Habilidad 3: Furia de Berserker */}
                <button
                  onClick={handleUseSkill3}
                  disabled={skill3Cd > 0 || isStunned}
                  className={`px-3.5 py-2.5 rounded-2xl font-heading font-black text-xs flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border ${
                    isBerserkActive
                      ? 'bg-amber-500 text-black border-amber-300 animate-pulse'
                      : 'bg-zinc-800 text-amber-300 border-amber-500/40 hover:bg-amber-950/40'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>[3] Furia Berserker</span>
                  {skill3Cd > 0 && <span className="font-mono text-[10px]">({skill3Cd}s)</span>}
                </button>
              </div>

              {/* Botón de Golpe Manual Extra */}
              <button
                onClick={() => performHeroStrike(true)}
                disabled={isStunned}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 text-black font-heading font-black text-xs hover:brightness-110 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Flame className="w-4 h-4" />
                <span>¡GOLPEAR (Espacio / Tap)!</span>
              </button>
            </div>

            {/* Modal de Veredicto Final al culminar los 60s */}
            {assaultVerdict && (
              <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
                <div className="max-w-md w-full bg-gradient-to-b from-surface-card to-black border border-amber-500/60 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(251,191,36,0.3)]">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
                    🏆
                  </div>
                  <h3 className="font-heading font-black text-xl text-white">¡Asalto al Coloso Finalizado!</h3>
                  <p className="text-xs text-gray-400 font-serif mt-1">Tu daño ha sido acreditado a la vida colectiva del Coloso.</p>

                  <div className="my-5 p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 text-left text-xs font-mono">
                    <div className="flex justify-between items-center text-amber-300">
                      <span>Daño Infligido al Coloso:</span>
                      <span className="font-bold text-base">{assaultVerdict.damageDealt.toLocaleString()} DMG</span>
                    </div>
                    <div className="flex justify-between items-center text-purple-300">
                      <span>Fichas de Gremio Ganadas:</span>
                      <span className="font-bold">+{assaultVerdict.tokensEarned} 🪙</span>
                    </div>
                    <div className="flex justify-between items-center text-yellow-300">
                      <span>Oro Obtenido:</span>
                      <span className="font-bold">+{assaultVerdict.goldEarned} 🪙</span>
                    </div>
                    <div className="flex justify-between items-center text-cyan-300">
                      <span>Experiencia Acreditada:</span>
                      <span className="font-bold">+{assaultVerdict.xpEarned} XP</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setInCombatArena(false);
                      setAssaultVerdict(null);
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-heading font-black text-sm hover:brightness-110 active:scale-95 shadow-lg transition-all cursor-pointer"
                  >
                    Volver al Salón de Guerra
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* MODO 1: SALÓN DE GUERRA DEL GREMIO (LOBBY, HITOS, RANKING, TIENDA)        */
          /* ========================================================================= */
          <div className="flex flex-col h-full">
            {/* Header del Salón */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-surface/60">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center justify-center text-2xl shadow-inner">
                  🐉
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading font-black text-lg sm:text-xl text-white tracking-wide">
                      Asedio al Raid Boss
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-mono font-bold">
                      Gremio Asíncrono
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-serif">
                    Combate cooperativo semanal • Contribuye con tu DPS y desbloquea tesoros de hermandad
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
                  <Coins className="w-4 h-4 text-purple-400" />
                  <span>{playerStats.guild_tokens} Fichas de Gremio</span>
                </div>
                <button
                  onClick={() => {
                    sfx.playAudio('click');
                    onClose();
                  }}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Barra de Vida Comunitaria con Marcadores de Hitos */}
            <div className="p-4 sm:p-5 bg-black/40 border-b border-white/10">
              <div className="flex justify-between items-center text-xs font-mono text-gray-300 mb-1.5">
                <span className="flex items-center gap-2 font-bold text-white">
                  <span>{boss?.name}</span>
                  <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/20 text-amber-300">
                    Debilidad: {boss?.weakness || 'General'}
                  </span>
                </span>
                <span className="font-bold text-red-400">
                  {currentHp.toLocaleString()} / {maxHp.toLocaleString()} HP ({hpPercent}%)
                </span>
              </div>

              {/* Barra con Marcadores */}
              <div className="relative h-4 w-full bg-black/80 rounded-full border border-white/10 p-0.5 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-red-500 to-rose-600 transition-all duration-500"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              {/* Marcadores de Hitos Comunitarios */}
              <div className="relative w-full flex justify-between text-[10px] font-mono text-gray-400 mt-1.5 px-1">
                <span>0% (Derrota)</span>
                <span>25%</span>
                <span>50% (Furia)</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Pestañas de Navegación del Salón */}
            <div className="flex border-b border-white/10 bg-black/30 px-5 gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  sfx.playAudio('click');
                  setActiveTab('ASSAULT');
                }}
                className={`py-3 px-3 text-xs font-heading font-black flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'ASSAULT'
                    ? 'border-red-500 text-red-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Swords className="w-4 h-4" />
                <span>Asalto al Coloso</span>
              </button>

              <button
                onClick={() => {
                  sfx.playAudio('click');
                  setActiveTab('MILESTONES');
                }}
                className={`py-3 px-3 text-xs font-heading font-black flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'MILESTONES'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>Hitos de Hermandad</span>
              </button>

              <button
                onClick={() => {
                  sfx.playAudio('click');
                  setActiveTab('RANKING');
                }}
                className={`py-3 px-3 text-xs font-heading font-black flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'RANKING'
                    ? 'border-yellow-500 text-yellow-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Muro de Honor</span>
              </button>

              <button
                onClick={() => {
                  sfx.playAudio('click');
                  setActiveTab('SHOP');
                }}
                className={`py-3 px-3 text-xs font-heading font-black flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'SHOP'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Tienda de Gremio</span>
              </button>
            </div>

            {/* Mensajes Toast Flotantes */}
            {toastMsg && (
              <div className="mx-6 mt-3 p-3 rounded-xl bg-surface border border-white/10 text-xs font-heading font-bold text-center animate-fade-in flex items-center justify-center gap-2">
                <span>{toastMsg.type === 'ok' ? '✨' : '⚠️'}</span>
                <span className={toastMsg.type === 'ok' ? 'text-amber-300' : 'text-red-300'}>
                  {toastMsg.text}
                </span>
              </div>
            )}

            {/* Contenido de la Pestaña Activa */}
            <div className="p-5 overflow-y-auto flex-1 max-h-[58vh]">
              {/* TAB 1: ASALTO AL COLOSO */}
              {activeTab === 'ASSAULT' && (
                <div className="space-y-4">
                  {/* Ficha Táctica del Jefe */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-surface-card to-surface-card border border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl sm:text-6xl animate-pulse">
                        {boss?.icon || '🐉'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading font-black text-base sm:text-lg text-white">
                            {boss?.name}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono font-bold">
                            Fase {boss?.phase || 1}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 font-serif mt-1 max-w-md">
                          {boss?.lore_description || 'Una abominación ancestral que amenaza los cimientos de la taberna.'}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 text-[11px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-black/50 text-amber-300 border border-amber-500/30">
                            🛡️ Rasgo: {boss?.trait || 'Furia'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-black/50 text-cyan-300 border border-cyan-500/30">
                            ⚡ Debilidad: {boss?.weakness || 'General'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Intentos Diarios Disponibles */}
                    <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-center shrink-0 w-full sm:w-auto">
                      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Tus Asaltos Hoy</div>
                      <div className="text-2xl font-heading font-black text-amber-400 mt-0.5">
                        {dailyAttempts.attempts_left} / {dailyAttempts.max_attempts}
                      </div>
                      <div className="text-[10px] text-gray-400 font-serif">Reinicia a medianoche</div>
                    </div>
                  </div>

                  {/* Cita de Combate */}
                  {boss?.combat_cries?.enter && (
                    <div className="p-3.5 rounded-xl bg-black/40 border-l-4 border-red-500 text-xs font-serif italic text-gray-300">
                      "{boss.combat_cries.enter}"
                    </div>
                  )}

                  {/* Botón de Inicio de Asalto */}
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-surface-card to-black border border-white/10 text-center space-y-3">
                    <h4 className="font-heading font-black text-base text-white">
                      ¿Preparado para entrar al ruedo?
                    </h4>
                    <p className="text-xs text-gray-400 font-serif max-w-lg mx-auto">
                      Dispondrás de <strong>60 segundos</strong> para ejecutar el mayor daño posible. Los auto-ataques serán continuos, podrás golpear con tajos manuales rápidos y usar habilidades de guardia para mitigar los embates del coloso.
                    </p>

                    <button
                      onClick={handleStartAssault}
                      disabled={dailyAttempts.attempts_left <= 0 || actionLoading || (boss?.is_defeated)}
                      className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-black font-heading font-black text-sm tracking-wider hover:brightness-110 active:scale-95 shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span>
                        {boss?.is_defeated 
                          ? 'COLOSO DERROTADO' 
                          : dailyAttempts.attempts_left > 0 
                            ? '¡INICIAR ASALTO DE 60 SEGUNDOS!' 
                            : 'SIN INTENTOS HOY (0/3)'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: HITOS DE HERMANDAD (-25% VIDA) */}
              {activeTab === 'MILESTONES' && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-400 font-serif mb-2">
                    Cada vez que todo el gremio reduce un 25% de salud del Coloso, todos los miembros pueden reclamar el cofre comunitario:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {milestones.map((m) => (
                      <div
                        key={m.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          m.hasClaimed
                            ? 'bg-black/40 border-emerald-500/40 opacity-80'
                            : m.isReached
                              ? 'bg-gradient-to-br from-amber-950/40 to-surface-card border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                              : 'bg-black/30 border-white/5 opacity-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-heading font-black text-white flex items-center gap-1.5">
                              <span>🎁</span>
                              <span>{m.label}</span>
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                              m.hasClaimed 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : m.isReached 
                                  ? 'bg-amber-500/20 text-amber-300 animate-pulse' 
                                  : 'bg-zinc-800 text-gray-500'
                            }`}>
                              {m.hasClaimed ? '✅ Reclamado' : m.isReached ? '¡Listo para Reclamar!' : 'Bloqueado'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-serif mt-1">{m.description}</p>
                        </div>

                        {/* Recompensas del cofre */}
                        <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-amber-300 font-bold flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5" />
                            <span>+{m.reward.gold}🪙</span>
                          </span>
                          <span className="text-cyan-300 font-bold">+{m.reward.xp} XP</span>
                          <span className="text-purple-300 font-bold">+{m.reward.guild_tokens} Fichas</span>
                        </div>

                        {/* Botón de Reclamo */}
                        {m.isReached && !m.hasClaimed ? (
                          <button
                            onClick={() => handleClaimMilestone(m.id)}
                            disabled={actionLoading}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-heading font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                          >
                            Reclamar Cofre Comunitario
                          </button>
                        ) : (
                          <div className="text-[10px] text-center font-serif text-gray-500">
                            {m.hasClaimed ? 'Recompensa ya acreditada a tu héroe' : `Requiere bajar la vida a ${m.targetPercent}%`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MURO DE HONOR (RANKING) */}
              {activeTab === 'RANKING' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 font-serif mb-2">
                    <span>Clasificación interna de daño aportado por cada miembro:</span>
                    {playerStats.rank && (
                      <span className="font-mono text-amber-300 font-bold">
                        Tu Posición: #{playerStats.rank} ({playerStats.personalDamage.toLocaleString()} DMG)
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {topContributors.length === 0 ? (
                      <div className="p-8 text-center text-xs font-serif text-gray-500">
                        Aún no se han registrado asaltos contra este Coloso. ¡Sé el primero en golpear!
                      </div>
                    ) : (
                      topContributors.map((c) => (
                        <div
                          key={c.player_id}
                          className="p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 flex items-center justify-between text-xs font-mono transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg w-6 text-center">{c.medal}</span>
                            <div>
                              <div className="font-heading font-black text-white text-xs flex items-center gap-1.5">
                                <span>{c.player_name}</span>
                                <span className="text-[10px] text-gray-500 font-normal">#{c.rank}</span>
                              </div>
                              <div className="text-[10px] text-gray-400 font-serif">
                                {c.sharePct}% de la vida total del Coloso
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-heading font-black text-amber-300">
                              {c.damage.toLocaleString()} DMG
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: TIENDA DE HERMANDAD */}
              {activeTab === 'SHOP' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 font-serif mb-2">
                    <span>Canjea tus Fichas de Gremio ganadas en asaltos por artículos exclusivos:</span>
                    <span className="font-mono text-purple-300 font-bold">
                      Saldo: {playerStats.guild_tokens} 🪙
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {guildShop.map((item) => {
                      const canAfford = playerStats.guild_tokens >= item.cost_tokens;
                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/30 transition-all flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-3xl p-2 rounded-xl bg-purple-950/40 border border-purple-500/30">
                              {item.icon}
                            </div>
                            <div>
                              <div className="font-heading font-black text-white text-xs">{item.name}</div>
                              <p className="text-[11px] text-gray-400 font-serif mt-0.5">{item.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-xs font-mono font-bold text-purple-300">
                              {item.cost_tokens} Fichas
                            </span>
                            <button
                              onClick={() => handleBuyShopItem(item.id)}
                              disabled={!canAfford || actionLoading}
                              className="py-1.5 px-4 rounded-xl bg-purple-600 text-white font-heading font-bold text-xs hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                            >
                              Canjear
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
