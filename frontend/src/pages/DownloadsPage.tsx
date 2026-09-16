import React, { useEffect, useState } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Download, 
  Terminal, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Apple, 
  ArrowLeft,
  History,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { VersionData, UpdateNotificationModal } from '../components/UpdateNotificationModal';

interface DownloadsPageProps {
  onBack?: () => void;
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({ onBack }) => {
  const [versionData, setVersionData] = useState<VersionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPatchModalOpen, setIsPatchModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchVersionInfo();
  }, []);

  const fetchVersionInfo = async () => {
    setIsLoading(true);
    try {
      const res = await api.getVersionInfo();
      if (res && res.data) {
        setVersionData(res.data);
      }
    } catch (err) {
      console.error('Error fetching version data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentVersionStr = versionData?.currentVersion || '1.2.0';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-fadeIn">
      {/* Page Header */}
      <div className="theme-card p-6 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border-2 border-primary/60 flex items-center justify-center shrink-0 shadow-[0_0_20px_var(--accent-glow)]">
            <Download className="w-7 h-7 text-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-xl md:text-2xl font-extrabold text-white tracking-wider uppercase">
                CENTRO DE ACTUALIZACIONES & DESCARGAS
              </h2>
              <span className="text-[11px] bg-primary text-black px-2.5 py-0.5 rounded-full font-mono font-black shadow-md">
                v{currentVersionStr}
              </span>
            </div>
            <p className="text-xs text-gray-300 font-sans mt-0.5">
              Instaladores oficiales, historial de parches y versiones para Android, PC y PWA.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPatchModalOpen(true)}
            className="px-3.5 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_var(--accent-glow)] active:scale-95"
            title="Ver Pergamino de Novedades"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Novedades v{currentVersionStr}</span>
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-2 bg-surface-card hover:bg-surface-border text-white border border-surface-border rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          )}
        </div>
      </div>

      {/* Version Status Banner */}
      <div className="bg-surface-card/90 p-4 rounded-xl border border-primary/30 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          <div>
            <span className="font-bold text-white">Servidor Sincronizado: </span>
            <span className="text-primary font-mono font-bold">v{currentVersionStr}</span>
            <span className="text-gray-400 ml-2">({versionData?.releaseDate ? `Lanzado el ${versionData.releaseDate}` : 'Compilación oficial'})</span>
          </div>
        </div>

        <button
          onClick={fetchVersionInfo}
          disabled={isLoading}
          className="text-gray-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer font-mono text-[11px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          <span>Comprobar</span>
        </button>
      </div>

      {/* Primary Download Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Android Native APK Card */}
        <div className="theme-card p-6 flex flex-col justify-between space-y-6 border-2 border-emerald/40 hover:border-emerald/70 transition-all shadow-[0_0_25px_rgba(16,185,129,0.15)] relative overflow-hidden group">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald/20 text-emerald border border-emerald/40">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-extrabold text-white uppercase">
                    App Celular Android
                  </h3>
                  <span className="text-[11px] text-emerald font-mono font-bold">
                    ElGremioRPG.apk (v{currentVersionStr})
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald/20 text-emerald border border-emerald/50 px-2.5 py-1 rounded-full font-mono font-extrabold">
                100% Instalable
              </span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Paquete compilado y firmado oficialmente para dispositivos Android. Abre la taberna en pantalla completa sin barra de navegación, con aceleración por hardware y soporte de lector NFC.
            </p>

            {/* Feature List */}
            <div className="space-y-2 text-xs text-gray-300 bg-surface-card/60 p-3.5 rounded-xl border border-surface-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0" />
                <span>Versión APK sincronizada (v{currentVersionStr})</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0" />
                <span>Compatible con Android 5.0 hasta Android 14+</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0" />
                <span>Acceso directo en 1 toque sin abrir navegador</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href="/downloads/ElGremioRPG.apk"
              download="ElGremioRPG.apk"
              className="w-full bg-emerald hover:bg-emerald/80 active:scale-95 text-black font-heading font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer select-none"
            >
              <Download className="w-4 h-4" />
              <span>Descargar ElGremioRPG.apk (v{currentVersionStr})</span>
            </a>
            <p className="text-[10px] text-center text-gray-400">
              Al descargarlo en Android, abre el archivo y selecciona <i>Instalar</i> o <i>Actualizar</i>.
            </p>
          </div>
        </div>

        {/* Desktop PC Launcher Card */}
        <div className="theme-card p-6 flex flex-col justify-between space-y-6 border-2 border-primary/40 hover:border-primary/70 transition-all shadow-[0_0_25px_var(--accent-glow)] relative overflow-hidden group">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/40">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-extrabold text-white uppercase">
                    App de Escritorio PC
                  </h3>
                  <span className="text-[11px] text-primary font-mono font-bold">
                    Launcher Windows (.bat)
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-primary/20 text-primary border border-primary/50 px-2.5 py-1 rounded-full font-mono font-extrabold">
                Windows 10/11
              </span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Ejecutable nativo ultraliviano para Windows que lanza la Taberna en una ventana independiente a pantalla completa con rendimiento optimizado para monitores de cualquier resolución.
            </p>

            {/* Feature List */}
            <div className="space-y-2 text-xs text-gray-300 bg-surface-card/60 p-3.5 rounded-xl border border-surface-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Ventana exclusiva sin pestañas de navegador</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Resolución nativa y pantalla completa con F11</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Carga directa de la versión más reciente v{currentVersionStr}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href="/downloads/Iniciar_El_Gremio_Desktop.bat"
              download="Iniciar_El_Gremio_Desktop.bat"
              className="w-full theme-btn-primary text-xs uppercase font-extrabold shadow-lg tracking-wider cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>Descargar Launcher PC (.bat)</span>
            </a>
            <p className="text-[10px] text-center text-gray-400">
              Guarda el archivo en tu Escritorio y haz doble clic para iniciar.
            </p>
          </div>
        </div>
      </div>

      {/* Patch History / Changelog Section */}
      <div className="theme-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-primary" />
            <h3 className="font-heading text-base font-extrabold text-white uppercase tracking-wider">
              Historial de Parches & Novedades
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {versionData?.changelog.length || 0} versiones registradas
          </span>
        </div>

        <div className="space-y-4">
          {(versionData?.changelog || []).map((item, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border transition-all ${
                item.isLatest 
                  ? 'bg-primary/5 border-primary/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                  : 'bg-surface-card/60 border-surface-border'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-surface-border/60 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
                    item.isLatest ? 'bg-primary text-black' : 'bg-surface-card text-gray-300 border border-surface-border'
                  }`}>
                    v{item.version}
                  </span>
                  <span className="font-heading text-sm font-bold text-white">
                    {item.title}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 font-mono">
                  {item.date}
                </span>
              </div>

              <ul className="space-y-1.5 text-xs text-gray-300">
                {item.highlights.map((h, hIdx) => (
                  <li key={hIdx} className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* iOS & PWA Direct Install Alternatives */}
      <div className="theme-card p-6 space-y-4">
        <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Instalación Directa PWA (iPhone / iPad / Navegadores)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
          <div className="bg-surface-card p-4 rounded-xl border border-surface-border space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Apple className="w-4 h-4 text-gray-300" />
              <span>En iPhone o iPad (Apple Safari):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Abre esta página en el navegador <strong>Safari</strong>.</li>
              <li>Toca el botón <strong>Compartir</strong> (icono de cuadro con flecha hacia arriba).</li>
              <li>Desliza hacia abajo y pulsa <strong>Agregar a Inicio</strong>.</li>
            </ol>
          </div>

          <div className="bg-surface-card p-4 rounded-xl border border-surface-border space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald" />
              <span>En Google Chrome / Edge:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-400">
              <li>Haz clic en los <strong>3 puntos (⋮)</strong> arriba a la derecha.</li>
              <li>Selecciona <strong>Instalar aplicación</strong> o <i>Agregar a la pantalla principal</i>.</li>
              <li>Listo: se creará el icono de acceso directo.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Update Notification Modal */}
      <UpdateNotificationModal
        isOpen={isPatchModalOpen}
        onClose={() => setIsPatchModalOpen(false)}
        versionData={versionData}
        onGoToDownloads={() => setIsPatchModalOpen(false)}
      />
    </div>
  );
};
