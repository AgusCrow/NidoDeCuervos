import React from 'react';
import { X, Check, Palette, Sparkles, Shield, Flame, Trees, Wand2 } from 'lucide-react';

export type ThemeType = 'medieval' | 'modern' | 'arcane' | 'elven' | 'crimson';

export interface ThemeOption {
  id: ThemeType;
  name: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  primaryColor: string;
  bgColor: string;
  cardColor: string;
  borderColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'medieval',
    name: 'La Taberna Ancestral',
    badge: 'Fantasía Clásica',
    description: 'La calidez de la madera noble, pergaminos antiguos y jarras de hidromiel bañadas en oro brillante.',
    icon: <Shield className="w-5 h-5 text-amber-400" />,
    primaryColor: '#f59e0b',
    bgColor: '#090a0f',
    cardColor: '#181c28',
    borderColor: '#334155'
  },
  {
    id: 'modern',
    name: 'Neócrata Cyberpunk 2077',
    badge: 'Obsidiana & Neón HUD',
    description: 'Matriz digital con redes de cian neón, paneles HUD angulares y tecnología de vanguardia.',
    icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
    primaryColor: '#00f0ff',
    bgColor: '#060815',
    cardColor: '#141b2d',
    borderColor: 'rgba(0, 240, 255, 0.4)'
  },
  {
    id: 'arcane',
    name: 'Grimorio del Nigromante',
    badge: 'Mística Cósmica',
    description: 'Rituales de púrpura estelar, abismos oscuros y resplandor de magia etérea de invocación.',
    icon: <Wand2 className="w-5 h-5 text-purple-400" />,
    primaryColor: '#a855f7',
    bgColor: '#0b0518',
    cardColor: '#20103e',
    borderColor: '#5b21b6'
  },
  {
    id: 'elven',
    name: 'Dominio Silvano Elfo',
    badge: 'Bosque Ancestral',
    description: 'La mística de las hojas de esmeralda, destellos dorados y el sosiego de la naturaleza sagrada.',
    icon: <Trees className="w-5 h-5 text-emerald-400" />,
    primaryColor: '#10b981',
    bgColor: '#04140c',
    cardColor: '#0f3523',
    borderColor: '#15803d'
  },
  {
    id: 'crimson',
    name: 'Forja Sangrienta del Basilisco',
    badge: 'Furia Vampírica',
    description: 'La agresividad del fuego ardiente, el acero gótico afilado y el carmesí de las batallas épicas.',
    icon: <Flame className="w-5 h-5 text-red-500" />,
    primaryColor: '#ef4444',
    bgColor: '#140507',
    cardColor: '#340f14',
    borderColor: '#991b1b'
  }
];

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-xl bg-surface border-2 border-primary/50 rounded-2xl p-5 md:p-7 shadow-[0_0_50px_rgba(0,0,0,0.9)] space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 border-2 border-primary/50 text-primary shadow-[0_0_15px_var(--accent-glow)]">
              <Palette className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-extrabold text-white tracking-wider uppercase">
                SELECTOR DE TEMAS RPG
              </h3>
              <p className="text-xs text-gray-300 font-sans">
                Cambia por completo la estética, fuentes y estructura de El Gremio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-card hover:bg-crimson/20 border border-surface-border text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme List */}
        <div className="space-y-3.5">
          {THEME_OPTIONS.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-start gap-4 relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-surface-card shadow-[0_0_20px_var(--accent-glow)] ring-2 ring-primary/30'
                    : 'border-surface-border hover:border-primary/60 bg-surface-card/80 hover:bg-surface-card'
                }`}
              >
                {/* Theme Color Bar Indicator */}
                <div
                  className="w-3 self-stretch rounded-full flex-shrink-0 transition-transform group-hover:scale-y-105 shadow-md"
                  style={{ backgroundColor: theme.primaryColor }}
                />

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="flex items-center gap-2 font-heading text-base font-extrabold text-white">
                      {theme.icon}
                      {theme.name}
                    </span>
                    <span
                      className="text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border shadow-sm"
                      style={{
                        color: '#ffffff',
                        backgroundColor: theme.primaryColor,
                        borderColor: theme.primaryColor
                      }}
                    >
                      {theme.badge}
                    </span>
                  </div>

                  <p className="text-xs text-gray-200 font-sans leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                {/* Selected Checkmark Badge */}
                {isSelected ? (
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-black font-bold flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full border-2 border-gray-500 group-hover:border-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full max-w-xs mx-auto py-3 bg-primary text-black font-extrabold rounded-xl shadow-[0_0_20px_var(--accent-glow)] hover:brightness-110 active:scale-95 transition-all text-xs uppercase cursor-pointer tracking-wider font-heading"
          >
            Aceptar / Guardar Tema
          </button>
        </div>
      </div>
    </div>
  );
};
