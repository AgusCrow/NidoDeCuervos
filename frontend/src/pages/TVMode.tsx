import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Player, ScanResultEvent, DuelResult } from '../types';
import { subscribeToEvents } from '../services/sse';
import { Trophy, Dices, Radio, Sparkles, Activity, Play, CloudRain, Moon, Thermometer, Sun, Swords, Flame } from 'lucide-react';

export const TVMode: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [recentLoot, setRecentLoot] = useState<any[]>([]);
  const [currentScanEvent, setCurrentScanEvent] = useState<ScanResultEvent | null>(null);
  const [activeDuelEvent, setActiveDuelEvent] = useState<DuelResult | null>(null);

  // Scanner Simulator State inside TV Mode
  const [selectedNfcUid, setSelectedNfcUid] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Weather status
  const [weatherInfo, setWeatherInfo] = useState<any>(null);

  // Raid Boss & Tavern Shouts State on TV
  const [bossState, setBossState] = useState<any>(null);
  const [latestShout, setLatestShout] = useState<any>(null);

  const fetchBossAndShouts = async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        api.get('/player/raid/boss'),
        api.get('/player/tavern/shouts')
      ]);
      if (bRes.data.success) setBossState(bRes.data.boss);
      if (sRes.data.success && sRes.data.shouts.length > 0) setLatestShout(sRes.data.shouts[0]);
    } catch (e) {}
  };

  const loadPublicData = async () => {
    try {
      const data = await api.getParty();
      // Sort leaderboard: Level DESC, XP DESC, Streak DESC, PvP Winrate DESC
      const sorted = [...data.party].sort((a: Player, b: Player) => {
        if (b.level !== a.level) return b.level - a.level;
        if (b.xp !== a.xp) return b.xp - a.xp;
        if ((b.streak_days || 0) !== (a.streak_days || 0)) return (b.streak_days || 0) - (a.streak_days || 0);
        const winrateA = (a.pvp_wins || 0) / Math.max(1, (a.pvp_wins || 0) + (a.pvp_losses || 0));
        const winrateB = (b.pvp_wins || 0) / Math.max(1, (b.pvp_wins || 0) + (b.pvp_losses || 0));
        return winrateB - winrateA;
      });
      setLeaderboard(sorted);
      if (sorted.length > 0 && !selectedNfcUid) {
        setSelectedNfcUid(sorted[0].nfc_uid || sorted[0].nfcUid || '');
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadPublicData();
    fetchBossAndShouts();
    const bossTimer = setInterval(fetchBossAndShouts, 5000);

    const cleanup = subscribeToEvents((data: any) => {
      if (data.type === 'scan_event' || data.finalRoll !== undefined) {
        const scanData = data.payload || data;
        setCurrentScanEvent(scanData);
        if (scanData.weather) setWeatherInfo(scanData.weather);
        if (scanData.duelResult) setActiveDuelEvent(scanData.duelResult);
        setRecentLoot((prev) => [scanData, ...prev.slice(0, 15)]);
        loadPublicData();

        setTimeout(() => {
          setCurrentScanEvent(null);
        }, 8000);
      } else if (data.type === 'duel_event') {
        setActiveDuelEvent(data.payload);
        setTimeout(() => {
          setActiveDuelEvent(null);
        }, 10000);
      }
    });

    return () => {
      cleanup();
      clearInterval(bossTimer);
    };
  }, []);

  const handleSimulateScan = async () => {
    if (!selectedNfcUid) return;
    setScanError(null);
    setScanning(true);
    try {
      await api.triggerScan(selectedNfcUid, true);
    } catch (err: any) {
      setScanError(err.message || 'Error al escanear tag NFC');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-surface via-background to-black text-white flex flex-col relative select-none">
      {/* Subtle CRT Scanlines */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/20 pointer-events-none z-40" />

      {/* Weather Rain Overlay Effect */}
      {weatherInfo?.condition === 'RAIN' && (
        <div className="absolute inset-0 pointer-events-none z-10 bg-blue-950/20 backdrop-blur-[1px] animate-pulse">
          <div className="absolute top-2 left-10 text-blue-300 text-xs font-mono flex items-center gap-1 font-bold">
            <CloudRain className="w-4 h-4 text-blue-400 animate-bounce" /> 🌧️ Tormenta Activa (+35 XP / +15 Oro)
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="h-20 px-8 flex justify-between items-center bg-surface/80 border-b border-surface-border backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          <div>
            <h1 className="font-cinzel text-xl md:text-2xl font-extrabold tracking-widest text-primary">
              NIDO DE CUERVOS - MODO TV
            </h1>
            <p className="text-[10px] text-gray-400 font-cinzel tracking-wider uppercase font-bold">
              Pantalla 24/7 de Taberna & Lector Hardware ESP32
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Weather Widget */}
          <div className="flex items-center gap-2 text-xs font-cinzel font-bold text-primary bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-full shadow-sm">
            {weatherInfo?.condition === 'RAIN' ? (
              <CloudRain className="w-4 h-4 text-blue-400" />
            ) : weatherInfo?.isNight ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : weatherInfo?.condition === 'EXTREME_TEMP' ? (
              <Thermometer className="w-4 h-4 text-cyan-400" />
            ) : (
              <Sun className="w-4 h-4 text-yellow-400" />
            )}
            <span>{weatherInfo?.description || '☀️ Día Templado'}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-cinzel text-gray-300 bg-surface-card border border-surface-border px-3 py-1.5 rounded-full font-bold">
            <Radio className="w-4 h-4 text-emerald animate-pulse" />
            <span>ESP32 ONLINE</span>
          </div>
        </div>
      </header>

      {/* Dynamic Boss Raid & Tavern Live Ticker Banner */}
      {bossState && (
        <div className="bg-gradient-to-r from-red-950/80 via-black to-red-950/80 border-b border-red-500/40 px-8 py-2.5 flex items-center justify-between text-xs z-30 font-heading">
          <div className="flex items-center gap-3">
            <span className="text-xl animate-bounce">🐉</span>
            <div>
              <span className="font-black text-red-400 mr-2">{bossState.name}</span>
              <span className="text-gray-400 font-serif">HP: {bossState.current_hp?.toLocaleString()} / {bossState.max_hp?.toLocaleString()}</span>
            </div>
            <div className="w-36 h-2.5 bg-black/60 rounded-full overflow-hidden border border-red-500/50">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, Math.round((bossState.current_hp / bossState.max_hp) * 100)))}%` }}
              />
            </div>
          </div>

          {latestShout && (
            <div className="flex items-center gap-2 text-gray-300 font-serif max-w-lg truncate">
              <span className="text-primary font-bold font-heading shrink-0">📜 {latestShout.player_name}:</span>
              <span className="italic truncate">"{latestShout.message}"</span>
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <main className="flex-1 p-8 grid grid-cols-12 gap-8 z-30 relative overflow-hidden">
        {/* Left Column: Compact Top 5 Leaderboard */}
        <section className="col-span-4 flex flex-col space-y-3">
          <h2 className="font-cinzel text-lg font-extrabold text-primary flex items-center justify-between border-b border-surface-border pb-2">
            <span className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Top 5 Aventureros
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Ranking Global</span>
          </h2>

          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {leaderboard.slice(0, 5).map((player, rank) => (
              <div
                key={player.id}
                className={`p-3.5 rounded-2xl flex items-center gap-3 border transition-all ${
                  rank === 0
                    ? 'modern-glass-card gold-glow'
                    : rank === 1
                    ? 'modern-glass-card magic-glow'
                    : 'modern-glass-card border-surface-border'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-surface-border/60 flex items-center justify-center font-cinzel font-extrabold text-base text-primary shrink-0">
                  {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-cinzel font-extrabold text-sm text-white truncate">{player.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-cinzel font-bold">
                    <span>Lv.{player.level} {player.secret_class || player.secretClass}</span>
                    <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                      <Flame className="w-3 h-3 text-amber-400" /> {player.streak_days || 0}d
                    </span>
                    <span className="text-emerald font-bold">
                      PvP: {player.pvp_wins || 0}W/{player.pvp_losses || 0}L
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-cinzel text-xs font-extrabold text-magic block">{player.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Center Column: Giant Interactive D20 & NFC Scanner Trigger */}
        <section className="col-span-4 flex flex-col items-center justify-center relative space-y-4">
          <div className="relative w-56 h-56 rounded-full border-2 border-primary/40 flex items-center justify-center d20-animate shadow-[0_0_60px_var(--accent-glow)] modern-glass-card">
            <Dices className="w-36 h-36 text-primary" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="font-cinzel text-xl font-extrabold text-white tracking-widest uppercase">
              PUNTO DE ESCANEO NFC Y TIRADA DE DADO
            </h2>
            <p className="text-xs text-gray-400 font-cinzel">
              Apoya tu llavero en el lector de la barra o selecciona abajo
            </p>
          </div>

          {/* Scanner Simulator Control for TV Mode */}
          <div className="modern-glass-card p-4 rounded-2xl border border-surface-border w-full max-w-sm space-y-3 shadow-xl">
            <select
              value={selectedNfcUid}
              onChange={(e) => setSelectedNfcUid(e.target.value)}
              className="w-full bg-surface-card border border-surface-border rounded-xl p-2.5 text-xs text-white font-cinzel focus:border-primary focus:outline-none font-bold"
            >
              {leaderboard.map((p) => (
                <option key={p.id} value={p.nfc_uid || p.nfcUid || ''}>
                  {p.name} (Lv.{p.level} {p.secret_class || p.secretClass}) - Tag: {p.nfc_uid || p.nfcUid}
                </option>
              ))}
            </select>

            {scanError && (
              <p className="text-red-400 text-[10px] font-semibold text-center">{scanError}</p>
            )}

            <button
              onClick={handleSimulateScan}
              disabled={scanning || !selectedNfcUid}
              className="btn-mobile-primary text-xs uppercase tracking-wider disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>{scanning ? 'Lanzando Dado 1d20...' : 'Tirar Dado & Escanear NFC'}</span>
            </button>
          </div>
        </section>

        {/* Right Column: Live Loot Ticker */}
        <section className="col-span-4 flex flex-col space-y-3">
          <h2 className="font-cinzel text-lg font-extrabold text-primary flex items-center gap-2 border-b border-surface-border pb-2">
            <Activity className="w-5 h-5 text-primary" /> Feed de Botín en Vivo
          </h2>

          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {recentLoot.length === 0 ? (
              <div className="text-center p-8 font-cinzel text-gray-500 italic text-xs">
                Aún no hay escaneos recientes en esta sesión.
              </div>
            ) : (
              recentLoot.map((item, idx) => (
                <div
                  key={idx}
                  className="modern-glass-card rounded-2xl p-3.5 border border-surface-border space-y-1.5 transform hover:scale-[1.01] transition-transform"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-cinzel font-extrabold text-primary">{item.playerName}</span>
                    <span className="text-gray-300 font-cinzel text-[11px] font-bold">Tirada: {item.finalRoll}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-magic">+{item.xpAwarded} XP</span>
                    <span className="text-primary">+{item.goldAwarded} G</span>
                  </div>
                  {item.modifiersApplied?.length > 0 && (
                    <p className="text-[10px] text-gray-400 italic">
                      {item.modifiersApplied.join(' | ')}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Giant Fullscreen Scan Overlay for TV Broadcast */}
      {currentScanEvent && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 space-y-6 animate-fade-in">
          <h2 className="font-cinzel text-4xl font-extrabold text-primary tracking-widest uppercase animate-pulse">
            ¡NUEVA TIRADA DE TABERNA!
          </h2>

          <div className="w-44 h-44 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center d20-animate shadow-[0_0_80px_var(--accent-glow)]">
            <span className="font-cinzel text-6xl font-extrabold text-white">
              {currentScanEvent.finalRoll}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="font-cinzel text-3xl font-bold text-white">
              {currentScanEvent.playerName}
            </h3>
            <p className="font-cinzel text-base text-primary uppercase tracking-wider font-extrabold">
              {currentScanEvent.finalRoll === 20
                ? '¡CRÍTICO ABSOLUTO NAT 20!'
                : currentScanEvent.finalRoll === 1
                ? '¡PIFIA CRÍTICA!'
                : `Tirada Obtenida: ${currentScanEvent.finalRoll}`}
            </p>
          </div>

          <div className="flex items-center gap-8 modern-glass-card p-5 rounded-2xl border-2 border-surface-border">
            <div>
              <span className="text-xs text-gray-400 uppercase font-cinzel block font-bold">XP Concedida</span>
              <span className="font-cinzel text-2xl font-bold text-magic">+{currentScanEvent.xpAwarded} XP</span>
            </div>
            <div className="w-px h-10 bg-surface-border" />
            <div>
              <span className="text-xs text-gray-400 uppercase font-cinzel block font-bold">Oro Ganado</span>
              <span className="font-cinzel text-2xl font-bold text-primary">+{currentScanEvent.goldAwarded} G</span>
            </div>
          </div>
        </div>
      )}

      {/* Giant Fullscreen PvP Duel Arena Overlay for TV Broadcast */}
      {activeDuelEvent && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-8 space-y-6 animate-fade-in border-4 border-crimson">
          <div className="flex items-center gap-3 text-crimson animate-pulse">
            <Swords className="w-10 h-10" />
            <h2 className="font-cinzel text-4xl font-extrabold tracking-widest uppercase">
              ARENA DE DUELO DE TABERNA (PvP Bo3)
            </h2>
            <Swords className="w-10 h-10" />
          </div>

          <div className="grid grid-cols-2 gap-12 w-full max-w-3xl items-center modern-glass-card p-6 rounded-2xl border-2 border-crimson/50">
            <div className="space-y-2">
              <h3 className="font-cinzel text-2xl font-bold text-white">{activeDuelEvent.player1Name}</h3>
              <div className="font-cinzel text-5xl font-extrabold text-primary">{activeDuelEvent.p1Score}</div>
              <span className="text-xs text-gray-400 font-cinzel uppercase block font-bold">Victorias de Ronda</span>
            </div>

            <div className="space-y-2">
              <h3 className="font-cinzel text-2xl font-bold text-white">{activeDuelEvent.player2Name}</h3>
              <div className="font-cinzel text-5xl font-extrabold text-primary">{activeDuelEvent.p2Score}</div>
              <span className="text-xs text-gray-400 font-cinzel uppercase block font-bold">Victorias de Ronda</span>
            </div>
          </div>

          <div className="bg-surface-card p-4 rounded-xl border border-surface-border w-full max-w-2xl space-y-2 font-mono text-xs text-gray-300">
            {activeDuelEvent.rounds.map((r, idx) => (
              <div key={idx} className="border-b border-surface-border/50 pb-1">
                {r.note}
              </div>
            ))}
          </div>

          <h3 className="font-cinzel text-3xl font-bold text-emerald uppercase tracking-widest">
            🏆 GANADOR: {activeDuelEvent.winnerName} (+{activeDuelEvent.wager} Oro)
          </h3>
        </div>
      )}
    </div>
  );
};
