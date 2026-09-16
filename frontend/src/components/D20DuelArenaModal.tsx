import React, { useState, useEffect } from 'react';
import { DuelResult, RoundDetail } from '../types';
import { Swords, Trophy, Sparkles, Coins, Flame, Skull, ChevronRight, X, Zap, FastForward, Shield, Award } from 'lucide-react';
import { RunicD20Die } from './RunicD20Die';
import { sfx } from '../services/sfx';

interface D20DuelArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  duelResult: DuelResult | null;
  currentUserId?: string;
}

export const D20DuelArenaModal: React.FC<D20DuelArenaModalProps> = ({
  isOpen,
  onClose,
  duelResult,
  currentUserId
}) => {
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [roundRolled, setRoundRolled] = useState<boolean>(false);
  const [showFinalSummary, setShowFinalSummary] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && duelResult) {
      setCurrentRoundIdx(0);
      setIsRolling(false);
      setRoundRolled(false);
      setShowFinalSummary(false);
      setScreenShake(false);
      sfx.swordClash();
    }
  }, [isOpen, duelResult]);

  // Teclado: Espacio/Enter para tirar dados o avanzar ronda, Esc para salir
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (showFinalSummary) {
          onClose();
        } else if (!roundRolled && !isRolling) {
          handleTriggerRoll();
        } else if (roundRolled && !isRolling) {
          handleNextRound();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentRoundIdx, showFinalSummary, isRolling, roundRolled]);

  if (!isOpen || !duelResult) return null;

  const rounds = duelResult.rounds || [];
  const currentRound: RoundDetail | undefined = rounds[currentRoundIdx];
  const isLastRound = currentRoundIdx >= rounds.length - 1;

  // Disparar tirada de la ronda actual
  const handleTriggerRoll = () => {
    if (isRolling) return;
    setIsRolling(true);
    setRoundRolled(true);

    setTimeout(() => {
      setIsRolling(false);

      // Si hubo crítico (20) o KO de pícaro, sacudir pantalla
      if (currentRound && (currentRound.roll1 === 20 || currentRound.roll2 === 20 || currentRound.note.includes('K.O.'))) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 450);
      }
    }, 950);
  };

  const handleNextRound = () => {
    if (isRolling) return;
    if (!isLastRound) {
      setCurrentRoundIdx((prev) => prev + 1);
      setIsRolling(false);
      setRoundRolled(false);
    } else {
      setShowFinalSummary(true);
      sfx.levelUp();
    }
  };

  // Salto rápido / Resolver de inmediato
  const handleFastForward = () => {
    setIsRolling(false);
    setShowFinalSummary(true);
    sfx.levelUp();
  };

  // Puntuación acumulada visual hasta la ronda actual (si ya se tiró)
  const currentP1Score = rounds
    .slice(0, roundRolled ? currentRoundIdx + 1 : currentRoundIdx)
    .filter((r) => r.score1 > r.score2 || (r.score1 === r.score2 && r.note.includes(duelResult.player1Name))).length;

  const currentP2Score = rounds
    .slice(0, roundRolled ? currentRoundIdx + 1 : currentRoundIdx)
    .filter((r) => r.score2 > r.score1 || (r.score2 === r.score1 && r.note.includes(duelResult.player2Name))).length;

  const isUserWinner = currentUserId
    ? duelResult.winnerName.toLowerCase() !== 'empate' && duelResult.summary.toLowerCase().includes('ganó')
    : duelResult.winnerName !== 'EMPATE';

  const isRogueKO = currentRound?.note.includes('K.O.');
  const isMageSurge = currentRound?.note.includes('Sobrecarga Arcana') || currentRound?.note.includes('Arcano');
  const isWarriorArmor = currentRound?.note.includes('Armadura de Guerrero');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div
        className={`bg-surface-card max-w-xl w-full p-5 sm:p-6 rounded-3xl relative overflow-hidden border-2 border-primary/70 shadow-[0_0_50px_var(--accent-glow)] space-y-5 transition-transform duration-200 ${
          screenShake ? 'animate-shake' : 'animate-scaleUp'
        }`}
      >
        {/* Luces de fondo de la arena */}
        <div className="absolute -top-24 -left-24 w-52 h-52 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 rounded-full bg-crimson/25 blur-3xl pointer-events-none" />

        {/* Cabecera de la Arena */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/30 to-amber-500/20 border border-primary/60 flex items-center justify-center text-primary shadow-[0_0_15px_var(--accent-glow)]">
              <Swords className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-heading text-base sm:text-lg font-black text-white tracking-wider uppercase flex items-center gap-1.5">
                <span>ARENA DE COMBATE D20</span>
                <span className="text-[9px] px-2 py-0.2 rounded-full bg-crimson/20 border border-crimson/40 text-crimson font-mono">
                  Bo3 PvP
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span>Bolsa de Oro en Juego:</span>
                <span className="text-amber-400 font-mono font-black flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  {duelResult.wager} Oro
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!showFinalSummary && (
              <button
                onClick={handleFastForward}
                className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-surface-card text-gray-300 hover:text-white border border-surface-border text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                title="Resolver combate al instante"
              >
                <FastForward className="w-3.5 h-3.5 text-primary" />
                <span className="hidden xs:inline text-[10px]">Saltar</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-card hover:bg-surface-border text-gray-400 hover:text-white border border-surface-border transition-all cursor-pointer"
              title="Cerrar Arena (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Marcador de Gladiadores con Pips de Ronda */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          {/* Gladiador 1 (Desafiante) */}
          <div
            className={`p-3 rounded-2xl border-2 transition-all ${
              duelResult.winnerName === duelResult.player1Name && showFinalSummary
                ? 'bg-primary/20 border-primary shadow-[0_0_25px_var(--accent-glow)]'
                : 'bg-surface/80 border-surface-border'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[9px] uppercase font-mono tracking-widest text-primary font-bold">
                Desafiante
              </span>
              {/* Pips de Victorias */}
              <div className="flex items-center gap-1">
                {[1, 2].map((pip) => (
                  <span
                    key={pip}
                    className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-mono border ${
                      currentP1Score >= pip
                        ? 'bg-primary border-primary text-black font-black shadow-[0_0_8px_var(--accent-glow)]'
                        : 'bg-black/40 border-gray-600 text-gray-600'
                    }`}
                  >
                    ⚔️
                  </span>
                ))}
              </div>
            </div>

            <div className="font-heading font-extrabold text-white text-sm sm:text-base truncate">
              {duelResult.player1Name}
            </div>
            <div className="text-xs font-mono font-bold text-primary mt-0.5">
              Rondas: <strong className="text-white text-sm">{currentP1Score}</strong> / 2
            </div>
          </div>

          {/* Gladiador 2 (Rival) */}
          <div
            className={`p-3 rounded-2xl border-2 transition-all ${
              duelResult.winnerName === duelResult.player2Name && showFinalSummary
                ? 'bg-crimson/20 border-crimson shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                : 'bg-surface/80 border-surface-border'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[9px] uppercase font-mono tracking-widest text-crimson font-bold">
                Rival
              </span>
              {/* Pips de Victorias */}
              <div className="flex items-center gap-1">
                {[1, 2].map((pip) => (
                  <span
                    key={pip}
                    className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-mono border ${
                      currentP2Score >= pip
                        ? 'bg-crimson border-crimson text-white font-black shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                        : 'bg-black/40 border-gray-600 text-gray-600'
                    }`}
                  >
                    ⚔️
                  </span>
                ))}
              </div>
            </div>

            <div className="font-heading font-extrabold text-white text-sm sm:text-base truncate">
              {duelResult.player2Name}
            </div>
            <div className="text-xs font-mono font-bold text-crimson mt-0.5">
              Rondas: <strong className="text-white text-sm">{currentP2Score}</strong> / 2
            </div>
          </div>
        </div>

        {/* Escenario de Combate: Rondas o Veredicto Final */}
        {!showFinalSummary && currentRound ? (
          <div className="space-y-4 relative z-10">
            {/* Indicador de Rondas en Curso */}
            <div className="flex items-center justify-center gap-2">
              {rounds.map((r, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1 rounded-full font-mono text-[11px] font-bold border transition-all ${
                    idx === currentRoundIdx
                      ? 'bg-primary text-black border-primary shadow-md scale-105 font-black'
                      : idx < currentRoundIdx
                      ? 'bg-surface-card text-gray-300 border-surface-border'
                      : 'bg-black/40 text-gray-500 border-surface-border/40'
                  }`}
                >
                  Ronda {r.round}
                </div>
              ))}
            </div>

            {/* Duelos de Dados D20 Rúnicos Poliédricos */}
            <div className="grid grid-cols-2 gap-4 items-center justify-items-center py-5 px-3 bg-gradient-to-b from-black/60 via-surface-card/60 to-black/60 rounded-3xl border border-surface-border relative overflow-hidden">
              {/* Emblema Central de Choque VS */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20">
                <div className="w-10 h-10 rounded-full bg-surface-card border-2 border-primary/50 shadow-xl flex items-center justify-center">
                  <span className="font-heading font-black text-xs text-primary animate-pulse">
                    VS
                  </span>
                </div>
              </div>

              {/* Dado D20 del Jugador 1 */}
              <div className="flex flex-col items-center space-y-2">
                <RunicD20Die
                  targetValue={currentRound.roll1}
                  isRolling={isRolling}
                  dieColor="challenger"
                />
                <div className="text-xs text-center font-mono">
                  <span className="text-gray-400">Poder Total: </span>
                  <span className="text-primary font-bold text-sm">
                    {isRolling ? '...' : roundRolled ? currentRound.score1 : '?'}
                  </span>
                </div>
              </div>

              {/* Dado D20 del Jugador 2 */}
              <div className="flex flex-col items-center space-y-2">
                <RunicD20Die
                  targetValue={currentRound.roll2}
                  isRolling={isRolling}
                  dieColor="opponent"
                />
                <div className="text-xs text-center font-mono">
                  <span className="text-gray-400">Poder Total: </span>
                  <span className="text-crimson font-bold text-sm">
                    {isRolling ? '...' : roundRolled ? currentRound.score2 : '?'}
                  </span>
                </div>
              </div>
            </div>

            {/* Alerta de Habilidad de Clase o Crónica de Asalto */}
            {roundRolled && !isRolling && (
              <div className="space-y-2 animate-fadeIn">
                {isRogueKO && (
                  <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500 text-purple-200 text-xs font-heading font-bold text-center flex items-center justify-center gap-2 shadow-lg">
                    <span>🗡️</span>
                    <span>¡GOLPE DE SOMBRAS LETAL! K.O. Instantáneo ejecutado con maestría.</span>
                  </div>
                )}
                {isWarriorArmor && (
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500 text-amber-200 text-xs font-heading font-bold text-center flex items-center justify-center gap-2 shadow-lg">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>¡BALUARTE DE HIERRO! La armadura del Guerrero desempata el choque.</span>
                  </div>
                )}
                {isMageSurge && (
                  <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-500 text-blue-200 text-xs font-heading font-bold text-center flex items-center justify-center gap-2 shadow-lg">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>¡SOBRECARGA ARCANA! El Mago canaliza energía para el siguiente asalto.</span>
                  </div>
                )}

                <div className="bg-surface-card p-3 rounded-2xl border border-surface-border text-center text-xs text-gray-200">
                  <p className="font-serif italic">{currentRound.note}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Cuadro Triunfal de Veredicto Final y Botín */
          <div className="space-y-4 relative z-10 animate-fadeIn">
            <div className="p-6 rounded-3xl bg-gradient-to-b from-primary/20 via-surface-card to-surface-card border-2 border-primary/60 text-center space-y-3.5 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-amber-500/20 border-2 border-primary flex items-center justify-center text-primary shadow-[0_0_30px_var(--accent-glow)] animate-bounce">
                <Trophy className="w-8 h-8 text-primary" />
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                  VEREDICTO DE LA TABERNA DE CUERVOS
                </span>
                <h3 className="font-heading text-xl sm:text-2xl font-black text-white mt-1 uppercase tracking-wide">
                  {duelResult.winnerName === 'EMPATE'
                    ? '¡EMPATE HEROICO!'
                    : `¡GLORIA A ${duelResult.winnerName.toUpperCase()}!`}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-gray-200 font-sans max-w-md mx-auto leading-relaxed">
                {duelResult.summary}
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/50 text-amber-300 font-mono font-black text-sm shadow-md">
                <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Botín Transferido: +{duelResult.wager} Oro</span>
              </div>
            </div>
          </div>
        )}

        {/* Botonera de Acción Primaria */}
        <div className="pt-2 relative z-10">
          {!showFinalSummary ? (
            !roundRolled ? (
              <button
                onClick={handleTriggerRoll}
                disabled={isRolling}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-amber-500 hover:brightness-110 text-black font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_var(--accent-glow)] cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>¡LANZAR DADOS (RONDA {currentRoundIdx + 1})!</span>
              </button>
            ) : (
              <button
                onClick={handleNextRound}
                disabled={isRolling}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary/90 to-amber-500/90 hover:brightness-110 text-black font-heading font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_var(--accent-glow)] cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <span>
                  {isLastRound
                    ? 'Ver Veredicto Final de la Taberna'
                    : `Siguiente Asalto (${currentRoundIdx + 2}/${rounds.length})`}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-amber-500 hover:brightness-110 text-black font-heading font-black text-sm uppercase tracking-wider cursor-pointer shadow-[0_0_25px_var(--accent-glow)] transition-all active:scale-95"
            >
              Cerrar Arena y Reclamar Honor
            </button>
          )}
          <p className="text-[10px] text-center text-gray-400 mt-2 font-mono">
            Tip: Presiona <strong className="text-primary">Espacio</strong> para tirar dados o avanzar, o <strong className="text-gray-300">Esc</strong> para cerrar.
          </p>
        </div>
      </div>
    </div>
  );
};
