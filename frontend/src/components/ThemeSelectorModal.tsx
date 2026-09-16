import React from 'react';
import { X, Check, Palette, Crown, Layers, Zap, Trees, Flame } from 'lucide-react';

export type ThemeType = 'gothic' | 'glass' | 'flat' | 'medieval' | 'modern' | 'arcane' | 'elven' | 'crimson';

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
    id: 'gothic',
    name: '1. Fantasía Oscura & Gótico',
    badge: 'Dorado & Bronce Noble',
    description: 'Estética gótica cargada de mística medieval, tonos madera oscura, pergamino antiguo, jarras de hidromiel y reliquias en oro forjado.',
    icon: <Crown className="w-5 h-5 text-amber-400" />,
    primaryColor: '#d4af37',
    bgColor: '#0c0a08',
    cardColor: 'rgba(36, 24, 16, 0.75)',
    borderColor: 'rgba(212, 175, 55, 0.4)'
  },
  {
    id: 'glass',
    name: '2. Glassmorphism Premium',
    badge: 'Cristal Traslúcido & Helado',
    description: 'Diseño ultra moderno con cristalería profunda (blur 28px), reflejos de luz especular, degradados azul noche y acentos cian cristalinos.',
    icon: <Layers className="w-5 h-5 text-cyan-400" />,
    primaryColor: '#38bdf8',
    bgColor: '#060913',
    cardColor: 'rgba(30, 41, 59, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  {
    id: 'flat',
    name: '3. Flat E-Sports Minimalista',
    badge: 'Limpio & Alto Contraste',
    description: 'Diseño plano moderno para e-sports, enfocado en legibilidad máxima sin sombras ni efectos distractores. Tipografía Inter de alta precisión.',
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
    primaryColor: '#10b981',
    bgColor: '#0a0d14',
    cardColor: '#192234',
    borderColor: '#2a364f'
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
    name: 'Forja Sangrienta Basilisco',
    badge: 'Furia Carmesí',
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
                REDISEÑOS VISUALES RPG
              </h3>
              <p className="text-xs text-gray-300 font-sans">
                Selecciona entre los 3 estilos completos de rediseño de interfaz
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
            const isSelected = currentTheme === theme.id || 
              (currentTheme === 'medieval' && theme.id === 'gothic') ||
              (currentTheme === 'modern' && theme.id === 'glass') ||
              (currentTheme === 'arcane' && theme.id === 'flat');
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
            Aceptar / Aplicar Rediseño
          </button>
        </div>
      </div>
    </div>
  );
};
