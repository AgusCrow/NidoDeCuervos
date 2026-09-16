import React, { useState } from 'react';
import { api, setStoredToken } from '../services/api';
import { Shield, Sparkles, KeyRound, Radio, Lock, User, Palette } from 'lucide-react';
import { AppDownloadSection } from '../components/AppDownloadSection';
import { ThemeType, THEME_OPTIONS } from '../components/ThemeSelectorModal';
import { Player } from '../types';

interface LoginPageProps {
  onLoginSuccess: (token: string, player?: Player) => void;
  onOpenTVMode: () => void;
  theme?: ThemeType;
  onOpenThemeModal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onOpenTVMode,
  theme = 'medieval',
  onOpenThemeModal
}) => {
  const [loginMode, setLoginMode] = useState<'CREDENTIALS' | 'REGISTER' | 'NFC'>('CREDENTIALS');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [secretClass, setSecretClass] = useState('WARRIOR');
  const [nfcUid, setNfcUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.login({ username, password });
      setStoredToken(res.token);
      onLoginSuccess(res.token, res.player);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.register({
        username,
        password,
        name: characterName,
        secretClass
      });
      setStoredToken(res.token);
      onLoginSuccess(res.token, res.player);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleNfcLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.login({ nfcUid });
      setStoredToken(res.token);
      onLoginSuccess(res.token, res.player);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-surface via-background to-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Absolute Header with Theme Selector Modal Trigger */}
      {onOpenThemeModal && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onOpenThemeModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary/20 via-surface-card to-surface-card hover:from-primary/30 text-xs font-heading font-extrabold text-primary border-2 border-primary flex items-center gap-2.5 shadow-[0_0_20px_var(--accent-glow)] transition-all cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap"
            title="Cambiar Estilo Visual RPG"
          >
            <Palette className="w-4.5 h-4.5 text-primary animate-pulse shrink-0" />
            <span className="uppercase tracking-wider">
              CAMBIAR TEMA: {THEME_OPTIONS.find((t) => t.id === theme)?.name || 'RPG'}
            </span>
          </button>
        </div>
      )}

      <div className="max-w-md w-full p-6 md:p-8 theme-card space-y-6 my-8 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-primary/10 border border-primary/40 rounded-full flex items-center justify-center shadow-[0_0_20px_var(--accent-glow)] d20-animate">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-widest text-primary uppercase">
            NIDO DE CUERVOS
          </h1>
          <p className="text-xs text-gray-300 font-heading">
            Crea tu aventurero o inicia sesión para ingresar a la barra
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-surface-card p-1 rounded-xl border border-surface-border gap-1">
          <button
            type="button"
            onClick={() => {
              setLoginMode('CREDENTIALS');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 font-cinzel text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              loginMode === 'CREDENTIALS' ? 'bg-primary text-black shadow-[0_0_10px_var(--accent-glow)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Ingresar
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('REGISTER');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 font-cinzel text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              loginMode === 'REGISTER' ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Crear Personaje
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode('NFC');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 font-cinzel text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              loginMode === 'NFC' ? 'bg-emerald text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald" /> NFC
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-crimson/10 border border-crimson/50 text-crimson p-3 rounded-lg text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* Form: Credentials Login */}
        {loginMode === 'CREDENTIALS' && (
          <form onSubmit={handleCredentialsLogin} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-cinzel text-gray-300 font-bold block">Nombre de Usuario</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: kaelen"
                  className="w-full bg-surface-card border border-surface-border rounded-lg pl-9 pr-3 py-2.5 text-white font-sans focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-cinzel text-gray-300 font-bold block">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-card border border-surface-border rounded-lg pl-9 pr-3 py-2.5 text-white font-sans focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-mobile-primary uppercase text-xs tracking-wider"
            >
              {loading ? 'Entrando a la Taberna...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {/* Form: Register Character */}
        {loginMode === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-cinzel text-gray-300 font-bold block">Nombre de Usuario (Para Login)</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: garrett"
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-white font-sans focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-cinzel text-gray-300 font-bold block">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-white font-sans focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-cinzel text-gray-300 font-bold block">Nombre del Personaje</label>
              <input
                type="text"
                required
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Ej: Garrett el Sombra"
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-white font-sans focus:border-amber-400 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-cinzel text-gray-300 font-bold block">Clase de Aventurero</label>
              <select
                value={secretClass}
                onChange={(e) => setSecretClass(e.target.value)}
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-white font-cinzel focus:border-amber-400 focus:outline-none transition-colors"
              >
                <option value="WARRIOR">🛡️ Guerrero (Piso de tirada 8 + Armadura en PvP)</option>
                <option value="MAGE">🧙‍♂️ Mago (+30% XP + Buff Arcano en Duelos)</option>
                <option value="ROGUE">🗡️ Pícaro (+30% Oro + K.O. Instantáneo en d20≥18)</option>
                <option value="BARD">🎭 Bardo (Bonus XP/Oro por Aliados + Duelos Épicos)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-mobile-primary uppercase text-xs tracking-wider"
            >
              {loading ? 'Creando Personaje...' : '⚡ Unirse al Gremio (Crear Personaje)'}
            </button>
          </form>
        )}

        {/* Form: NFC Scan */}
        {loginMode === 'NFC' && (
          <form onSubmit={handleNfcLogin} className="space-y-4 text-xs">
            <div className="bg-surface-card p-4 rounded-xl border border-surface-border text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-emerald/10 border border-emerald/40 rounded-full flex items-center justify-center d20-animate">
                <Radio className="w-6 h-6 text-emerald" />
              </div>
              <p className="font-cinzel text-xs text-gray-300">
                Ingresa el código hexadecimal de tu tag NFC o apoya tu llavero en el lector
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-cinzel text-gray-300 font-bold block">NFC Tag UID (Hex)</label>
              <input
                type="text"
                required
                value={nfcUid}
                onChange={(e) => setNfcUid(e.target.value)}
                placeholder="Ej: 04A1B2C3D4E5"
                className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-white font-mono uppercase focus:border-emerald focus:outline-none text-center tracking-widest text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald hover:bg-emerald/80 text-black font-cinzel font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all uppercase tracking-wider text-xs"
            >
              {loading ? 'Verificando Tag NFC...' : 'Autenticar Llavero NFC'}
            </button>

            {'NDEFReader' in window && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const ndef = new (window as any).NDEFReader();
                    await ndef.scan();
                    ndef.onreading = async (event: any) => {
                      if (event.serialNumber) {
                        const uid = event.serialNumber.replace(/:/g, '').toUpperCase();
                        setNfcUid(uid);
                        const res = await api.login({ nfcUid: uid });
                        setStoredToken(res.token);
                        onLoginSuccess(res.token, res.player);
                      }
                    };
                  } catch (e: any) {
                    setErrorMsg('Error escaneando NFC Celular: ' + e.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="btn-mobile-secondary"
              >
                <Radio className="w-4 h-4 animate-pulse text-emerald" />
                <span>📱 Escanear con Celular (NFC Táctil)</span>
              </button>
            )}
          </form>
        )}
      </div>

      <div className="max-w-md w-full">
        <AppDownloadSection />
      </div>
    </div>
  );
};
