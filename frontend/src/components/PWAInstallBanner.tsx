import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, Plus, X, Sparkles, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isHttp, setIsHttp] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (standalone) {
      setIsStandalone(true);
      return;
    }

    // Check if user is accessing over HTTP instead of HTTPS
    if (window.location.protocol === 'http:') {
      setIsHttp(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Catch Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isHttp) {
      // Switch to HTTPS port 8099 for PWA installation
      const httpsUrl = `https://${window.location.hostname}:8099${window.location.pathname}`;
      window.location.href = httpsUrl;
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(!showInstructions);
    }
  };

  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-950/95 via-surface-card to-amber-900/90 border-2 border-amber-500/60 rounded-2xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.3)] relative text-white space-y-3 font-sans transition-all">
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute right-3 top-3 text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        title="Cerrar aviso"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 pr-6">
        <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
          <Smartphone className="w-6 h-6 text-amber-400" />
        </div>

        <div className="space-y-0.5 flex-1 min-w-0">
          <h4 className="font-cinzel text-sm font-bold text-amber-300 flex items-center gap-1.5 truncate">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>Aplicación Móvil de El Gremio</span>
          </h4>
          <p className="text-[11px] text-gray-300 leading-tight">
            {isHttp
              ? 'Para habilitar la instalación en celular, activa el canal seguro de la Taberna.'
              : 'Instala la aplicación en tu celular para ingresar en 1-Tap a pantalla completa.'}
          </p>
        </div>
      </div>

      {/* Main Install Button (Mobile-First Touch Target) */}
      <button
        onClick={handleInstallClick}
        className="w-full min-h-[48px] bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-cinzel font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer select-none"
      >
        {isHttp ? (
          <>
            <Lock className="w-4 h-4 text-black" />
            <span>🔒 Activar Modo Instalable en Celular</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4 text-black" />
            <span>{deferredPrompt ? '📲 Instalar App en tu Celular' : '📱 ¿Cómo Instalar en Celular?'}</span>
            {!deferredPrompt && (showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
          </>
        )}
      </button>

      {/* Manual Installation Instructions Popup */}
      {(showInstructions || isIOS) && !isHttp && (
        <div className="bg-black/60 border border-amber-500/40 rounded-xl p-3.5 text-xs space-y-2 font-cinzel text-gray-200 animate-fadeIn">
          {isIOS ? (
            <>
              <p className="text-amber-300 font-bold flex items-center gap-1">
                🍎 iPhone / iPad (Safari):
              </p>
              <div className="flex items-center gap-2 text-gray-300 text-[11px]">
                <span>1️⃣ Toca el botón </span>
                <span className="inline-flex items-center gap-1 bg-surface px-2 py-1 rounded border border-surface-border font-bold text-amber-300">
                  <Share className="w-3.5 h-3.5" /> Compartir
                </span>
                <span> en Safari.</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-[11px]">
                <span>2️⃣ Desliza y selecciona </span>
                <span className="inline-flex items-center gap-1 bg-surface px-2 py-1 rounded border border-surface-border font-bold text-emerald">
                  <Plus className="w-3.5 h-3.5" /> Agregar a Inicio
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-amber-300 font-bold flex items-center gap-1">
                🤖 Android (Chrome / Edge / Firefox):
              </p>
              <div className="flex items-center gap-2 text-gray-300 text-[11px]">
                <span>1️⃣ Toca el menú de </span>
                <span className="inline-flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-surface-border font-bold text-amber-300">
                  ⋮ 3 Puntos
                </span>
                <span> arriba en tu navegador.</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-[11px]">
                <span>2️⃣ Toca </span>
                <span className="inline-flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-surface-border font-bold text-emerald">
                  <Download className="w-3.5 h-3.5" /> Instalar Aplicación
                </span>
                <span> u <i>Agregar a Pantalla Principal</i>.</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
