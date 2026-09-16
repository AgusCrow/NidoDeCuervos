import React from 'react';
import { Sparkles, Download, X, CheckCircle2, History, Smartphone, Monitor } from 'lucide-react';

export interface VersionData {
  currentVersion: string;
  versionCode: number;
  releaseDate: string;
  appName: string;
  downloads: {
    androidApkUrl: string;
    pcLauncherUrl: string;
    pwaUrl: string;
  };
  changelog: {
    version: string;
    date: string;
    title: string;
    highlights: string[];
    isLatest?: boolean;
  }[];
}

interface UpdateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  versionData: VersionData | null;
  onGoToDownloads: () => void;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  isOpen,
  onClose,
  versionData,
  onGoToDownloads
}) => {
  if (!isOpen || !versionData) return null;

  const latestPatch = versionData.changelog[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="theme-card max-w-lg w-full p-6 relative overflow-hidden border-2 border-primary/60 shadow-[0_0_40px_var(--accent-glow)] space-y-5 animate-scaleUp">
        {/* Ambient background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-surface-border pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/50 flex items-center justify-center text-primary shadow-[0_0_15px_var(--accent-glow)]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-lg font-black text-white uppercase tracking-wider">
                  Novedades de la Taberna
                </h3>
                <span className="text-[11px] bg-primary text-black font-extrabold px-2 py-0.5 rounded-full font-mono shadow-sm">
                  v{versionData.currentVersion}
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Parche oficial liberado el {latestPatch?.date || versionData.releaseDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-card hover:bg-surface-border text-gray-400 hover:text-white transition-all cursor-pointer border border-surface-border"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Parchment Highlights Container */}
        <div className="space-y-3 relative z-10">
          <div className="bg-surface-card/90 p-4 rounded-xl border border-surface-border space-y-3">
            <div className="flex items-center gap-2 text-primary font-heading font-bold text-xs uppercase tracking-wider">
              <History className="w-4 h-4" />
              <span>{latestPatch?.title || 'Mejoras y Nuevos Sistemas'}</span>
            </div>

            <ul className="space-y-2.5">
              {(latestPatch?.highlights || []).map((highlight, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-200 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fast Action Buttons */}
        <div className="space-y-2 relative z-10 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <a
              href={versionData.downloads.androidApkUrl}
              download="ElGremioRPG.apk"
              className="px-3 py-2.5 bg-emerald/20 hover:bg-emerald/30 text-emerald border border-emerald/50 rounded-xl text-xs font-heading font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 text-center shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span className="truncate">Descargar APK v{versionData.currentVersion}</span>
            </a>

            <button
              onClick={() => {
                onClose();
                onGoToDownloads();
              }}
              className="px-3 py-2.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-xl text-xs font-heading font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 text-center shadow-[0_0_15px_var(--accent-glow)] cursor-pointer"
            >
              <Monitor className="w-4 h-4 shrink-0" />
              <span className="truncate">Centro de Descargas</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full theme-btn-primary py-2.5 text-xs font-heading uppercase font-bold tracking-wider cursor-pointer"
          >
            ¡Entendido, entrar al juego!
          </button>
        </div>
      </div>
    </div>
  );
};
