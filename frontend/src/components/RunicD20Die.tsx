import React, { useState, useEffect } from 'react';
import { Sparkles, Skull, Flame, ShieldAlert } from 'lucide-react';
import { sfx } from '../services/sfx';

interface RunicD20DieProps {
  targetValue: number;
  isRolling: boolean;
  onRollComplete?: () => void;
  dieColor?: 'challenger' | 'opponent';
}

export const RunicD20Die: React.FC<RunicD20DieProps> = ({
  targetValue,
  isRolling,
  onRollComplete,
  dieColor = 'challenger'
}) => {
  const [displayValue, setDisplayValue] = useState<number>(targetValue);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);

  useEffect(() => {
    if (!isRolling) {
      setDisplayValue(targetValue);
      return;
    }

    // Intervalo de cambio rápido de números con desaceleración progresiva
    let frame = 0;
    const maxFrames = 18;
    let delay = 40;

    const rollStep = () => {
      frame++;
      const randomFace = Math.floor(Math.random() * 20) + 1;
      setDisplayValue(randomFace);
      setRotationDegrees((prev) => prev + 45);

      // Reproducir sonido sutil de dado
      if (frame % 3 === 0) {
        sfx.click();
      }

      if (frame < maxFrames) {
        delay += 12; // Desaceleración estocástica realista
        setTimeout(rollStep, delay);
      } else {
        // Impacto final
        setDisplayValue(targetValue);
        setRotationDegrees(0);

        if (targetValue === 20) {
          sfx.swordClash();
          sfx.haptic([50, 30, 80]);
        } else if (targetValue === 1) {
          sfx.fumble();
          sfx.haptic([60, 40]);
        } else {
          sfx.click();
          sfx.haptic([25]);
        }

        if (onRollComplete) {
          onRollComplete();
        }
      }
    };

    const timeoutId = setTimeout(rollStep, delay);
    return () => clearTimeout(timeoutId);
  }, [isRolling, targetValue]);

  const isNat20 = !isRolling && targetValue === 20;
  const isNat1 = !isRolling && targetValue === 1;
  const isHighRoll = !isRolling && targetValue >= 15 && targetValue < 20;

  const getThemeStyles = () => {
    if (isRolling) {
      return {
        bg: dieColor === 'challenger' ? 'bg-primary/20 border-primary/50' : 'bg-crimson/20 border-crimson/50',
        text: 'text-gray-200',
        glow: 'shadow-[0_0_15px_rgba(255,255,255,0.1)] animate-pulse',
        badge: null
      };
    }

    if (isNat20) {
      return {
        bg: 'bg-gradient-to-br from-amber-500/30 via-yellow-400/20 to-amber-600/40 border-amber-400',
        text: 'text-yellow-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]',
        glow: 'shadow-[0_0_35px_rgba(251,191,36,0.75)] ring-2 ring-amber-400/60 animate-bounce',
        badge: 'NAT 20 CRÍTICO'
      };
    }

    if (isNat1) {
      return {
        bg: 'bg-gradient-to-br from-red-950/60 via-red-900/40 to-black/80 border-crimson',
        text: 'text-crimson drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]',
        glow: 'shadow-[0_0_30px_rgba(239,68,68,0.7)] ring-1 ring-crimson/80 animate-shake',
        badge: 'PIFIA TOTAL'
      };
    }

    if (isHighRoll) {
      return {
        bg: 'bg-gradient-to-br from-cyan-950/40 via-blue-900/30 to-surface border-cyan-400',
        text: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]',
        glow: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
        badge: null
      };
    }

    return {
      bg: dieColor === 'challenger' ? 'bg-surface-card border-primary/70' : 'bg-surface-card border-crimson/70',
      text: 'text-white',
      glow: 'shadow-lg',
      badge: null
    };
  };

  const style = getThemeStyles();

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Insignia superior de Crítico o Pifia */}
      <div className="h-5 flex items-center justify-center mb-1">
        {style.badge && (
          <span
            className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider border shadow-md flex items-center gap-1 ${
              isNat20
                ? 'bg-amber-400 text-black border-amber-300 animate-pulse'
                : 'bg-crimson text-white border-red-400 animate-shake'
            }`}
          >
            {isNat20 ? <Sparkles className="w-2.5 h-2.5" /> : <Skull className="w-2.5 h-2.5" />}
            <span>{style.badge}</span>
          </span>
        )}
      </div>

      {/* Dado D20 Icosaédrico / Poliédrico Estilizado */}
      <div
        style={{
          transform: isRolling ? `rotate(${rotationDegrees}deg)` : 'none',
          transition: isRolling ? 'transform 0.08s ease-out' : 'transform 0.3s ease-out'
        }}
        className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 flex flex-col items-center justify-center p-2 backdrop-blur-md transition-all duration-300 ${style.bg} ${style.glow}`}
      >
        {/* Marcadores de aristas rúnicas en las esquinas */}
        <div className="absolute top-1 left-1.5 text-[8px] font-mono text-gray-500 opacity-60">▲</div>
        <div className="absolute top-1 right-1.5 text-[8px] font-mono text-gray-500 opacity-60">▲</div>
        <div className="absolute bottom-1 left-1.5 text-[8px] font-mono text-gray-500 opacity-60">▼</div>
        <div className="absolute bottom-1 right-1.5 text-[8px] font-mono text-gray-500 opacity-60">▼</div>

        {/* Número Central */}
        <span
          className={`font-heading font-black text-3xl sm:text-4xl tracking-tight leading-none ${style.text} ${
            isRolling ? 'filter blur-[0.5px] scale-90' : 'scale-100'
          }`}
        >
          {displayValue}
        </span>

        {/* Etiqueta inferior */}
        <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 mt-1 font-bold">
          {isRolling ? 'Rodando...' : 'd20'}
        </span>
      </div>
    </div>
  );
};
