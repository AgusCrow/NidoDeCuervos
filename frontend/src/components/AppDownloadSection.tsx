import React from 'react';
import { Smartphone, Monitor, Download, Terminal, ShieldCheck } from 'lucide-react';

export const AppDownloadSection: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-surface via-surface-card to-background border border-primary/40 rounded-2xl p-5 md:p-6 shadow-[0_0_35px_rgba(245,158,11,0.2)] space-y-5">
      <div className="flex items-center gap-3 border-b border-surface-border pb-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <Download className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h3 className="font-cinzel text-lg font-bold text-amber-300 flex items-center gap-2">
            <span>DESCARGAR APLICACIONES (MÓVIL Y PC)</span>
          </h3>
          <p className="text-xs text-gray-400 font-sans">
            Descarga la aplicación directa para Celular o PC para ingresar en 1 toque a pantalla completa.
          </p>
        </div>
      </div>

      {/* Download Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Android Mobile APK Download Card */}
        <div className="bg-surface/70 border border-emerald/40 rounded-xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-cinzel text-xs font-bold text-emerald flex items-center gap-1.5 uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-emerald" /> App Celular Android (.apk)
              </span>
              <span className="text-[10px] bg-emerald/20 text-emerald border border-emerald/40 px-2 py-0.5 rounded font-mono">
                v1.0 Nativo
              </span>
            </div>
            <p className="text-xs text-gray-300">
              Instala la aplicación completa en tu Android directamente sin navegadores ni avisos de seguridad.
            </p>
          </div>

          <a
            href="/downloads/ElGremioRPG.apk"
            download="ElGremioRPG.apk"
            className="w-full bg-emerald hover:bg-emerald/80 active:scale-95 text-black font-cinzel font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer select-none"
          >
            <Download className="w-4 h-4" />
            <span>Descargar ElGremioRPG.apk</span>
          </a>
        </div>

        {/* Desktop PC Launcher Card */}
        <div className="bg-surface/70 border border-amber-500/40 rounded-xl p-4 space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-cinzel text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Monitor className="w-4 h-4 text-amber-400" /> App de Escritorio PC (.bat)
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                Windows
              </span>
            </div>
            <p className="text-xs text-gray-300">
              Ejecutable nativo para PC que abre la Taberna en una ventana independiente a pantalla completa.
            </p>
          </div>

          <a
            href="/downloads/Iniciar_El_Gremio_Desktop.bat"
            download="Iniciar_El_Gremio_Desktop.bat"
            className="w-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-cinzel font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer select-none"
          >
            <Terminal className="w-4 h-4" />
            <span>Descargar Launcher PC (.bat)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
