import React, { useEffect, useState } from 'react';
import { PlayerDashboard } from './pages/PlayerDashboard';
import { ShopInventoryPage } from './pages/ShopInventoryPage';
import { DMDashboard } from './pages/DMDashboard';
import { TVMode } from './pages/TVMode';
import { LoginPage } from './pages/LoginPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { ThemeSelectorModal, ThemeType, THEME_OPTIONS } from './components/ThemeSelectorModal';
import { UpdateNotificationModal, VersionData } from './components/UpdateNotificationModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { Shield, Sparkles, Tv, UserCheck, Store, LogOut, User, Palette, Download, Info, ChevronDown, ChevronRight, Trophy, Volume2, VolumeX } from 'lucide-react';
import { getStoredToken, clearStoredToken, api } from './services/api';
import { sfx } from './services/sfx';
import { Player } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('PLAYER');
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(Boolean(getStoredToken()));
  const [versionData, setVersionData] = useState<VersionData | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(sfx.enabled);

  // Theme state: 'medieval' | 'modern' | 'arcane' | 'elven' | 'crimson'
  const [theme, setTheme] = useState<ThemeType>(() => {
    return (localStorage.getItem('rpg_theme') as ThemeType) || 'medieval';
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Check if running in Standalone PWA, Electron Desktop or Mobile APK
  const isAppMode = Boolean(
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as any).standalone ||
    (window as any).electronAPI ||
    navigator.userAgent.includes('Electron') ||
    navigator.userAgent.includes('ElGremioApp') ||
    document.referrer.includes('android-app://')
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rpg_theme', theme);
  }, [theme]);

  const loadUser = async () => {
    if (!token) {
      setUserLoading(false);
      return;
    }
    setUserLoading(true);
    try {
      const data = await api.getMe();
      setCurrentUser(data.player);
    } catch (err) {
      clearStoredToken();
      setToken(null);
      setCurrentUser(null);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [token]);

  const handleLoginSuccess = (newToken: string, player?: Player) => {
    setToken(newToken);
    if (player) {
      setCurrentUser(player);
      setUserLoading(false);
    }
  };

  useEffect(() => {
    api.getVersionInfo().then((res) => {
      if (res && res.data) {
        setVersionData(res.data);
        const seen = localStorage.getItem('gremio_seen_version');
        if (seen !== res.data.currentVersion) {
          setIsVersionModalOpen(true);
        }
      }
    }).catch((err) => {
      console.warn('Could not fetch version data:', err);
    });
  }, []);

  const handleLogout = () => {
    clearStoredToken();
    setToken(null);
    setCurrentUser(null);
  };

  const currentThemeObj = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  // TV Mode is strictly accessible by DM
  if (currentTab === 'TV') {
    if (!currentUser || currentUser.role !== 'DM') {
      return (
        <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-crimson/20 border border-crimson/50 flex items-center justify-center">
            <Shield className="w-8 h-8 text-crimson" />
          </div>
          <h2 className="font-cinzel text-xl font-bold text-crimson">ACCESO RESTRINGIDO A MODO TV</h2>
          <p className="text-xs text-gray-400 font-cinzel max-w-sm">
            Solo el Dungeon Master (DM) posee el privilegio de activar y proyectar el Modo TV en la taberna.
          </p>
          <button
            onClick={() => setCurrentTab('PLAYER')}
            className="btn-mobile-primary max-w-xs text-xs uppercase"
          >
            Volver al Grimorio
          </button>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="bg-black/80 hover:bg-black text-primary border border-surface-border text-xs font-heading px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-[0_0_15px_var(--accent-glow)] transition-all cursor-pointer"
            title="Cambiar Tema Visual"
          >
            <Palette className="w-3.5 h-3.5 text-primary" />
            <span>Tema: {currentThemeObj.name}</span>
          </button>

          <button
            onClick={() => setCurrentTab('DM')}
            className="bg-black/80 hover:bg-black text-amber-300 border border-amber-500/50 text-xs font-cinzel px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
          >
            <span>🛡️ Volver al Panel DM</span>
          </button>
        </div>
        <TVMode />
        <ThemeSelectorModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          currentTheme={theme}
          onSelectTheme={setTheme}
        />
      </div>
    );
  }

  // Show Loading screen while fetching user with a valid stored token
  if (token && (userLoading || !currentUser)) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h2 className="font-cinzel text-xl font-bold text-primary tracking-widest uppercase">ENTRANDO A LA TABERNA...</h2>
        <p className="text-xs text-gray-400 font-cinzel max-w-sm">
          Cargando pergaminos y estadísticas de tu aventurero...
        </p>
      </div>
    );
  }

  // Show Login Page if not authenticated
  if (!token || !currentUser) {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onOpenTVMode={() => {}}
          theme={theme}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
        />
        <ThemeSelectorModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          currentTheme={theme}
          onSelectTheme={setTheme}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white font-sans flex flex-col transition-colors duration-300 relative">
      {theme === 'modern' && <div className="fixed inset-0 cyber-scanlines z-30 pointer-events-none" />}
      {/* Top Header Navigation */}
      <header className="fixed top-0 left-0 w-full z-40 bg-surface/90 backdrop-blur-md border-b border-surface-border h-16 px-4 md:px-8 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          <h1 className="font-cinzel text-base md:text-lg font-extrabold tracking-widest text-primary uppercase">
            NIDO DE CUERVOS
          </h1>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => setCurrentTab('PLAYER')}
            className={`px-3 py-1.5 rounded-lg font-cinzel text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentTab === 'PLAYER'
                ? 'bg-primary text-black shadow-[0_0_12px_var(--accent-glow)]'
                : 'text-gray-400 hover:text-white hover:bg-surface-card'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Grimorio
          </button>

          <button
            onClick={() => setCurrentTab('SHOP')}
            className={`px-3 py-1.5 rounded-lg font-cinzel text-xs font-bold transition-all flex items-center gap-1.5 ${
              currentTab === 'SHOP'
                ? 'bg-primary text-black shadow-[0_0_12px_var(--accent-glow)]'
                : 'text-gray-400 hover:text-white hover:bg-surface-card'
            }`}
          >
            <Store className="w-4 h-4" /> Tienda
          </button>

          {/* Downloads tab shown ONLY if not already inside the app */}
          {!isAppMode && (
            <button
              onClick={() => setCurrentTab('DOWNLOADS')}
              className={`px-3 py-1.5 rounded-lg font-cinzel text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'DOWNLOADS'
                  ? 'bg-emerald text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-surface-card'
              }`}
            >
              <Download className="w-4 h-4 text-emerald" /> Descargas
            </button>
          )}

          {/* DM Panel & TV Mode tabs visible if user is DM */}
          {currentUser.role === 'DM' && (
            <>
              <button
                onClick={() => setCurrentTab('DM')}
                className={`px-3 py-1.5 rounded-lg font-cinzel text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentTab === 'DM'
                    ? 'bg-crimson text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                    : 'text-gray-400 hover:text-white hover:bg-surface-card'
                }`}
              >
                <Shield className="w-4 h-4" /> Panel DM
              </button>

              <button
                onClick={() => setCurrentTab('TV')}
                className={`px-3 py-1.5 rounded-lg font-cinzel text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentTab === 'TV'
                    ? 'bg-emerald text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    : 'text-gray-400 hover:text-white hover:bg-surface-card'
                }`}
              >
                <Tv className="w-4 h-4 text-emerald" /> Modo TV
              </button>
            </>
          )}
        </nav>

        {/* Botón de Perfil con Menú Desplegable Integrado */}
        <div className="relative">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary/20 via-surface-card to-surface-card hover:border-primary border-2 border-primary/70 text-xs font-heading font-extrabold text-white flex items-center gap-2 transition-all shadow-[0_0_15px_var(--accent-glow)] cursor-pointer hover:scale-105 active:scale-95"
            title="Abrir Menú de Aventurero & Ajustes"
          >
            <div className="w-6 h-6 rounded-full bg-primary text-black font-black flex items-center justify-center text-xs shadow-sm">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <span className="hidden sm:inline font-bold text-white">{currentUser.name}</span>
            <span className="text-[10px] text-primary font-mono font-extrabold hidden md:inline">
              (Nvl {currentUser.level})
            </span>
            <ChevronDown className={`w-4 h-4 text-primary transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Menú Desplegable de Perfil */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-surface-card/95 backdrop-blur-xl border-2 border-primary/60 rounded-2xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-50 space-y-2 animate-fadeIn">
              {/* Encabezado del Perfil */}
              <div className="p-2.5 rounded-xl bg-surface border border-surface-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary font-heading font-black text-sm shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0">
                  <div className="font-heading font-bold text-white text-xs truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-magic font-mono truncate">
                    {currentUser.secretClass || currentUser.secret_class} | Nvl {currentUser.level}
                  </div>
                  <div className="text-[9px] text-gray-400 font-sans truncate">{currentUser.username}</div>
                </div>
              </div>

              <div className="divide-y divide-surface-border/60">
                {/* 1. Ajustes de Perfil */}
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsProfileSettingsOpen(true);
                  }}
                  className="w-full p-2.5 hover:bg-surface rounded-lg text-left text-xs font-heading font-bold text-gray-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Ajustes de Perfil & Datos
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {/* 2. Rankings Unificados (2 Columnas) */}
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsLeaderboardOpen(true);
                  }}
                  className="w-full p-2.5 hover:bg-surface rounded-lg text-left text-xs font-heading font-bold text-amber-300 hover:text-amber-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400 animate-pulse" /> Rankings (Jugadores & Clanes)
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                </button>

                {/* 3. Selector de Tema Visual */}
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsThemeModalOpen(true);
                  }}
                  className="w-full p-2.5 hover:bg-surface rounded-lg text-left text-xs font-heading font-bold text-gray-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-400" /> Tema: <span className="text-primary font-mono text-[11px] uppercase">{currentThemeObj.name}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {/* 4. Efectos de Sonido */}
                <button
                  onClick={() => {
                    const newState = sfx.toggle();
                    setSfxEnabled(newState);
                  }}
                  className="w-full p-2.5 hover:bg-surface rounded-lg text-left text-xs font-heading font-bold text-gray-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {sfxEnabled ? <Volume2 className="w-4 h-4 text-emerald" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
                    Efectos de Sonido (SFX)
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${sfxEnabled ? 'bg-emerald/20 text-emerald' : 'bg-surface text-gray-400'}`}>
                    {sfxEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* 5. Versión del Sistema */}
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsVersionModalOpen(true);
                  }}
                  className="w-full p-2.5 hover:bg-surface rounded-lg text-left text-xs font-heading font-bold text-gray-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Novedades Versión
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">v{versionData?.currentVersion || '1.4.0'}</span>
                </button>

                {/* 6. Cerrar Sesión */}
                <button
                  onClick={handleLogout}
                  className="w-full p-2.5 hover:bg-crimson/20 rounded-lg text-left text-xs font-heading font-bold text-crimson flex items-center gap-2 transition-colors cursor-pointer pt-2"
                >
                  <LogOut className="w-4 h-4 text-crimson" /> Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Body View */}
      <main className="flex-1 pt-24 px-4 md:px-8">
        {currentTab === 'PLAYER' && <PlayerDashboard onNavigateShop={() => setCurrentTab('SHOP')} />}
        {currentTab === 'SHOP' && <ShopInventoryPage onBack={() => setCurrentTab('PLAYER')} />}
        {currentTab === 'DOWNLOADS' && <DownloadsPage onBack={() => setCurrentTab('PLAYER')} />}
        {currentTab === 'DM' && <DMDashboard />}
      </main>

      {/* Mobile Floating Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-surface/95 backdrop-blur-md border-t border-surface-border h-16 flex justify-around items-center px-2">
        <button
          onClick={() => setCurrentTab('PLAYER')}
          className={`flex flex-col items-center justify-center font-cinzel text-[10px] ${
            currentTab === 'PLAYER' ? 'text-primary font-bold' : 'text-gray-400'
          }`}
        >
          <UserCheck className="w-5 h-5 mb-0.5" /> Grimorio
        </button>

        {!isAppMode && (
          <button
            onClick={() => setCurrentTab('DOWNLOADS')}
            className={`flex flex-col items-center justify-center font-cinzel text-[10px] ${
              currentTab === 'DOWNLOADS' ? 'text-emerald font-bold' : 'text-gray-400'
            }`}
          >
            <Download className="w-5 h-5 mb-0.5 text-emerald" /> Apps
          </button>
        )}

        {currentUser.role === 'DM' && (
          <button
            onClick={() => setCurrentTab('DM')}
            className={`flex flex-col items-center justify-center font-cinzel text-[10px] ${
              currentTab === 'DM' ? 'text-crimson font-bold' : 'text-gray-400'
            }`}
          >
            <Shield className="w-5 h-5 mb-0.5" /> Panel DM
          </button>
        )}

        <button
          onClick={() => setIsThemeModalOpen(true)}
          className="flex flex-col items-center justify-center text-primary font-heading font-extrabold text-[10px] active:scale-95 transition-transform"
        >
          <Palette className="w-5 h-5 mb-0.5 animate-pulse" /> Temas
        </button>

        {currentUser.role === 'DM' && (
          <button
            onClick={() => setCurrentTab('TV')}
            className="flex flex-col items-center justify-center text-emerald font-cinzel text-[10px]"
          >
            <Tv className="w-5 h-5 mb-0.5" /> TV
          </button>
        )}
      </nav>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={theme}
        onSelectTheme={setTheme}
      />

      {/* Update Notification Modal */}
      <UpdateNotificationModal
        isOpen={isVersionModalOpen}
        onClose={() => {
          if (versionData?.currentVersion) {
            localStorage.setItem('gremio_seen_version', versionData.currentVersion);
          }
          setIsVersionModalOpen(false);
        }}
        versionData={versionData}
        onGoToDownloads={() => {
          if (versionData?.currentVersion) {
            localStorage.setItem('gremio_seen_version', versionData.currentVersion);
          }
          setCurrentTab('DOWNLOADS');
        }}
      />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        currentUser={currentUser}
        onRefreshUser={loadUser}
      />

      {/* Unified 2-Column Rankings Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
