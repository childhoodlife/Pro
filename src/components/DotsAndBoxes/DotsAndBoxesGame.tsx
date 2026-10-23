import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Undo2, HelpCircle, Sparkles, Trophy, Volume2, Lightbulb } from 'lucide-react';
import { sound } from '../../utils/audio';
import { voiceCoach } from '../../utils/voiceCoach';
import { Translations } from '../../utils/translations';
import { GameSettings, recordDotsBoxesWin } from '../../utils/storage';
import { recordGameResult } from '../../utils/deviceTracker';
import { awardMatchWinPoint } from '../../utils/authManager';
import { getGameLevel, advanceGameLevel, getLevelDetails } from '../../utils/levelManager';
import { IdeaModal } from '../IdeaModal';
import {
  DotsState,
  EdgeType,
  createInitialDotsState,
  findCompletedBoxesForEdge,
  selectAIMove,
} from './dotsLogic';

interface DotsAndBoxesGameProps {
  t: Translations;
  settings: GameSettings;
  onBack: () => void;
  onOpenRules: () => void;
  onOpenAITutorial?: () => void;
}

export type DotsOpponent = 'two_player' | 'ai';
export type DotsAIDifficulty = 'easy' | 'medium' | 'hard';

export const DotsAndBoxesGame: React.FC<DotsAndBoxesGameProps> = ({
  t,
  settings,
  onBack,
  onOpenRules,
  onOpenAITutorial,
}) => {
  // Setup State
  const [inSetup, setInSetup] = useState(true);
  const [gridSize, setGridSize] = useState<number>(4); // 4x4 boxes (5x5 dots) default
  const [opponentType, setOpponentType] = useState<DotsOpponent>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<DotsAIDifficulty>('medium');

  // Level Progression: 1 - Unlimited
  const [currentLevel, setCurrentLevel] = useState<number>(() => getGameLevel('dots_boxes'));
  const [showIdea, setShowIdea] = useState(false);

  // Active Game State
  const [state, setState] = useState<DotsState>(() => createInitialDotsState(4));
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [extraTurnToast, setExtraTurnToast] = useState(false);
  const [lastDrawnEdge, setLastDrawnEdge] = useState<string | null>(null);

  // Total boxes on board
  const totalBoxes = state.gridSize * state.gridSize;
  const isGameOver = state.p1Score + state.p2Score === totalBoxes;

  // Winner calculation
  let winner: 1 | 2 | 0 | null = null;
  if (isGameOver) {
    if (state.p1Score > state.p2Score) winner = 1;
    else if (state.p2Score > state.p1Score) winner = 2;
    else winner = 0; // Draw
  }

  // Handle Game Over
  const gameOverHandled = useRef(false);
  useEffect(() => {
    if (isGameOver && !gameOverHandled.current) {
      gameOverHandled.current = true;
      if (winner === 1 || winner === 2) {
        sound.playVictoryBell();
        voiceCoach.announceEvent('win_match', settings.language);
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
      } else {
        sound.playBoxComplete();
        voiceCoach.announceEvent('tie', settings.language);
      }
      recordDotsBoxesWin(winner ?? 0, state.p1Score, state.p2Score);
      if (winner === 1) {
        recordGameResult('win');
        advanceGameLevel('dots_boxes');
        awardMatchWinPoint();
      } else if (winner === 2 && opponentType === 'ai') {
        recordGameResult('loss');
      } else if (winner === 2) {
        recordGameResult('win');
        advanceGameLevel('dots_boxes');
        awardMatchWinPoint();
      } else {
        recordGameResult('draw');
      }
    } else if (!isGameOver) {
      gameOverHandled.current = false;
    }
  }, [isGameOver, winner, state.p1Score, state.p2Score]);

  // Start new game
  const startGame = (size = gridSize) => {
    setGridSize(size);
    setState(createInitialDotsState(size));
    setInSetup(false);
    setExtraTurnToast(false);
    setLastDrawnEdge(null);
    sound.playPenClick();
  };

  // Place Edge
  const placeEdge = useCallback((type: EdgeType, r: number, c: number) => {
    setState((prevState) => {
      const key = `${r}_${c}`;
      if (type === 'horizontal' && prevState.horizontalEdges[key]) return prevState;
      if (type === 'vertical' && prevState.verticalEdges[key]) return prevState;

      const player = prevState.currentTurn;
      const completedBoxes = findCompletedBoxesForEdge(
        type,
        r,
        c,
        prevState.gridSize,
        prevState.horizontalEdges,
        prevState.verticalEdges,
        prevState.boxes
      );

      const nextH = { ...prevState.horizontalEdges };
      const nextV = { ...prevState.verticalEdges };
      const nextBoxes = { ...prevState.boxes };

      if (type === 'horizontal') nextH[key] = player;
      else nextV[key] = player;

      let nextP1Score = prevState.p1Score;
      let nextP2Score = prevState.p2Score;

      completedBoxes.forEach((bKey) => {
        nextBoxes[bKey] = player;
        if (player === 1) nextP1Score++;
        else nextP2Score++;
      });

      // Extra turn if completed at least one box!
      const earnedExtraTurn = completedBoxes.length > 0;
      const nextTurn = earnedExtraTurn ? player : player === 1 ? 2 : 1;

      if (earnedExtraTurn) {
        sound.playBoxComplete();
        voiceCoach.announceEvent('extra_turn', settings.language);
        setExtraTurnToast(true);
        setTimeout(() => setExtraTurnToast(false), 1400);
      } else {
        sound.playLineDraw();
      }

      setLastDrawnEdge(`${type}_${r}_${c}`);

      return {
        ...prevState,
        horizontalEdges: nextH,
        verticalEdges: nextV,
        boxes: nextBoxes,
        currentTurn: nextTurn,
        p1Score: nextP1Score,
        p2Score: nextP2Score,
        history: [
          ...prevState.history,
          {
            edgeType: type,
            r,
            c,
            player,
            boxesCompleted: completedBoxes,
            previousTurn: prevState.currentTurn,
          },
        ],
      };
    });
  }, []);

  // AI Turn Handling
  useEffect(() => {
    if (inSetup || isGameOver || opponentType !== 'ai' || state.currentTurn !== 2) return;

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      const move = selectAIMove(state, aiDifficulty);
      setIsAiThinking(false);
      if (move) {
        placeEdge(move.type, move.r, move.c);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [state, inSetup, isGameOver, opponentType, aiDifficulty, placeEdge]);

  // Undo Move
  const handleUndo = () => {
    if (state.history.length === 0 || isAiThinking) return;
    sound.playPenClick();

    setState((prev) => {
      const last = prev.history[prev.history.length - 1];
      const nextH = { ...prev.horizontalEdges };
      const nextV = { ...prev.verticalEdges };
      const nextBoxes = { ...prev.boxes };

      if (last.edgeType === 'horizontal') {
        delete nextH[`${last.r}_${last.c}`];
      } else {
        delete nextV[`${last.r}_${last.c}`];
      }

      last.boxesCompleted.forEach((bKey) => {
        delete nextBoxes[bKey];
      });

      const p1Diff = last.boxesCompleted.filter(() => last.player === 1).length;
      const p2Diff = last.boxesCompleted.filter(() => last.player === 2).length;

      return {
        ...prev,
        horizontalEdges: nextH,
        verticalEdges: nextV,
        boxes: nextBoxes,
        currentTurn: last.previousTurn,
        p1Score: prev.p1Score - p1Diff,
        p2Score: prev.p2Score - p2Diff,
        history: prev.history.slice(0, -1),
      };
    });
  };

  // Setup Screen
  if (inSetup) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-64px)] p-4 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors text-sm font-medium py-2 px-3 rounded-lg bg-stone-800/80 border border-stone-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.penFight.backToMenu}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playPenClick();
                voiceCoach.readRules('dots_boxes', settings.language);
              }}
              className="flex items-center gap-1.5 text-xs text-amber-300 font-medium py-2 px-3 rounded-lg bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/40 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>{t.rules.listenSpoken}</span>
            </button>
            <button
              onClick={onOpenRules}
              className="flex items-center gap-1.5 text-stone-300 hover:text-amber-300 transition-colors text-sm font-medium py-2 px-3 rounded-lg bg-stone-800/80 border border-stone-700/60"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{t.instructions}</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-100 font-handwriting tracking-wide">
            {t.dotsBoxesTitle}
          </h1>
          <p className="text-stone-400 text-sm mt-1 max-w-md mx-auto">
            {t.dotsBoxesSub}
          </p>
        </div>

        {/* Grid Size Selection */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl mb-6">
          <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider block mb-3">
            {t.dotsBoxes.gridSize}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { size: 3, label: '3 × 3 (Quick)', boxes: 9 },
              { size: 4, label: '4 × 4 (Classic)', boxes: 16 },
              { size: 5, label: '5 × 5 (Challenging)', boxes: 25 },
              { size: 6, label: '6 × 6 (Master)', boxes: 36 },
            ].map((item) => (
              <button
                key={item.size}
                onClick={() => setGridSize(item.size)}
                className={`py-3.5 px-3 rounded-xl text-center transition-all border ${
                  gridSize === item.size
                    ? 'bg-amber-500 border-amber-400 text-stone-950 font-bold shadow-lg'
                    : 'bg-stone-800/80 border-stone-700/70 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <div className="text-base font-semibold">{item.label}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{item.boxes} Boxes</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mode & Opponent */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl mb-8">
          <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider block mb-3">
            {t.gameModes}
          </label>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setOpponentType('ai')}
              className={`py-3.5 px-4 rounded-xl text-sm font-medium transition-all ${
                opponentType === 'ai'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {t.practiceAI}
            </button>
            <button
              onClick={() => setOpponentType('two_player')}
              className={`py-3.5 px-4 rounded-xl text-sm font-medium transition-all ${
                opponentType === 'two_player'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {t.twoPlayer}
            </button>
          </div>

          {opponentType === 'ai' && (
            <div className="pt-4 border-t border-stone-800">
              <span className="text-xs text-stone-400 block mb-2">AI Opponent Intelligence:</span>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as DotsAIDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setAiDifficulty(diff)}
                    className={`py-2 px-3 text-xs rounded-lg transition-all ${
                      aiDifficulty === diff
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    {t.difficulties[diff]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Big Start Button */}
        <button
          onClick={() => startGame()}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-lg shadow-lg active:scale-[0.99] transition-all tracking-wide"
        >
          {t.playNow} ({gridSize}×{gridSize} Boxes)
        </button>
      </div>
    );
  }

  // Active Dots & Boxes Game Board
  const n = state.gridSize;
  const boxesRemaining = totalBoxes - (state.p1Score + state.p2Score);

  // Compute adaptive cell size for responsiveness
  // Mobile: ~48px-64px per cell, Desktop: ~70px-90px
  const cellSize = n <= 3 ? 84 : n <= 4 ? 72 : n <= 5 ? 60 : 48;
  const dotRadius = n >= 6 ? 4 : 5;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto p-2 md:p-4 select-none">
      {/* Top HUD: Scores, Turn, Extra turn banner */}
      <div className="flex items-center justify-between bg-stone-900/90 border border-stone-800/90 rounded-2xl px-4 py-2.5 mb-2 shadow-md">
        {/* P1 Score */}
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow" />
          <div>
            <div className="text-xs font-semibold text-blue-300 leading-tight">
              {settings.player1Name}
            </div>
            <div className="text-xl font-bold font-mono text-white leading-none">
              {state.p1Score}
            </div>
          </div>
        </div>

        {/* Center Info */}
        <div className="text-center">
          <div className="text-[11px] text-stone-400 font-mono">
            {boxesRemaining} {t.dotsBoxes.boxesLeft}
          </div>
          <div className="text-xs font-bold mt-0.5">
            {extraTurnToast ? (
              <span className="text-amber-400 font-bold animate-bounce flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {t.dotsBoxes.extraTurn}
              </span>
            ) : isAiThinking ? (
              <span className="text-amber-400 animate-pulse">{t.penFight.aiTurn}</span>
            ) : state.currentTurn === 1 ? (
              <span className="text-blue-400">{t.penFight.p1Turn}</span>
            ) : (
              <span className="text-red-400">
                {opponentType === 'ai' ? 'Computer Turn' : t.penFight.p2Turn}
              </span>
            )}
          </div>
        </div>

        {/* P2 Score */}
        <div className="flex items-center gap-2 text-right">
          <div>
            <div className="text-xs font-semibold text-red-300 leading-tight">
              {opponentType === 'ai' ? 'Computer AI' : settings.player2Name}
            </div>
            <div className="text-xl font-bold font-mono text-white leading-none">
              {state.p2Score}
            </div>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-red-600 shadow" />
        </div>
      </div>

      {/* Main Ruled / Grid Notebook Paper Container */}
      <div className="relative flex-1 rounded-2xl overflow-auto flex items-center justify-center p-4 shadow-xl border border-stone-800 bg-notebook-ruled">
        {/* Red notebook margin line on left */}
        <div className="absolute top-0 bottom-0 left-12 w-0.5 bg-red-400/40 pointer-events-none hidden md:block" />

        {/* The Grid SVG / Interactive Canvas */}
        <div
          className="relative select-none p-6 bg-white/70 backdrop-blur-xs rounded-2xl shadow-sm border border-stone-300/60"
          style={{
            width: `${n * cellSize + 48}px`,
            height: `${n * cellSize + 48}px`,
          }}
        >
          {/* Box Fills with player ink and initials */}
          {Array.from({ length: n }).map((_, r) =>
            Array.from({ length: n }).map((_, c) => {
              const owner = state.boxes[`${r}_${c}`];
              if (!owner) return null;

              return (
                <div
                  key={`box-${r}-${c}`}
                  className="absolute flex items-center justify-center font-handwriting font-bold transition-all duration-300 animate-in zoom-in-75"
                  style={{
                    left: `${c * cellSize + 24}px`,
                    top: `${r * cellSize + 24}px`,
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    backgroundColor: owner === 1 ? 'rgba(37, 99, 235, 0.18)' : 'rgba(220, 38, 38, 0.18)',
                    color: owner === 1 ? '#1d4ed8' : '#b91c1c',
                    fontSize: `${Math.round(cellSize * 0.45)}px`,
                  }}
                >
                  {owner === 1 ? 'P1' : opponentType === 'ai' ? 'AI' : 'P2'}
                </div>
              );
            })
          )}

          {/* Horizontal Edges */}
          {Array.from({ length: n + 1 }).map((_, r) =>
            Array.from({ length: n }).map((_, c) => {
              const key = `${r}_${c}`;
              const owner = state.horizontalEdges[key];
              const isLast = lastDrawnEdge === `horizontal_${r}_${c}`;

              return (
                <button
                  key={`h-${r}-${c}`}
                  onClick={() => placeEdge('horizontal', r, c)}
                  disabled={!!owner || isAiThinking}
                  className="absolute group z-20 focus:outline-hidden"
                  style={{
                    left: `${c * cellSize + 24}px`,
                    top: `${r * cellSize + 24 - 14}px`,
                    width: `${cellSize}px`,
                    height: '28px', // Generous 28px touch target
                  }}
                  aria-label={`Horizontal line row ${r} col ${c}`}
                >
                  {/* Visual drawn line */}
                  <div
                    className={`h-1.5 rounded-full mx-1.5 transition-all duration-150 ${
                      owner === 1
                        ? 'bg-blue-600 shadow-sm'
                        : owner === 2
                        ? 'bg-red-600 shadow-sm'
                        : 'bg-transparent group-hover:bg-amber-400/50'
                    } ${isLast ? 'ring-2 ring-amber-400/80' : ''}`}
                    style={{
                      height: owner ? '4px' : '3px',
                    }}
                  />
                </button>
              );
            })
          )}

          {/* Vertical Edges */}
          {Array.from({ length: n }).map((_, r) =>
            Array.from({ length: n + 1 }).map((_, c) => {
              const key = `${r}_${c}`;
              const owner = state.verticalEdges[key];
              const isLast = lastDrawnEdge === `vertical_${r}_${c}`;

              return (
                <button
                  key={`v-${r}-${c}`}
                  onClick={() => placeEdge('vertical', r, c)}
                  disabled={!!owner || isAiThinking}
                  className="absolute group z-20 focus:outline-hidden"
                  style={{
                    left: `${c * cellSize + 24 - 14}px`,
                    top: `${r * cellSize + 24}px`,
                    width: '28px', // Generous 28px touch target
                    height: `${cellSize}px`,
                  }}
                  aria-label={`Vertical line row ${r} col ${c}`}
                >
                  {/* Visual drawn line */}
                  <div
                    className={`w-1.5 rounded-full my-1.5 mx-auto transition-all duration-150 ${
                      owner === 1
                        ? 'bg-blue-600 shadow-sm'
                        : owner === 2
                        ? 'bg-red-600 shadow-sm'
                        : 'bg-transparent group-hover:bg-amber-400/50'
                    } ${isLast ? 'ring-2 ring-amber-400/80' : ''}`}
                    style={{
                      width: owner ? '4px' : '3px',
                      height: `calc(100% - 12px)`,
                    }}
                  />
                </button>
              );
            })
          )}

          {/* Grid Dots */}
          {Array.from({ length: n + 1 }).map((_, r) =>
            Array.from({ length: n + 1 }).map((_, c) => (
              <div
                key={`dot-${r}-${c}`}
                className="absolute rounded-full bg-stone-800 shadow-xs z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${c * cellSize + 24}px`,
                  top: `${r * cellSize + 24}px`,
                  width: `${dotRadius * 2}px`,
                  height: `${dotRadius * 2}px`,
                }}
              />
            ))
          )}
        </div>

        {/* Game Over Victory Modal */}
        {isGameOver && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-stone-900 border-2 border-amber-500/80 rounded-3xl p-6 md:p-8 text-center max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="text-4xl mb-2">
                {winner === 1 ? '🎉' : winner === 2 ? '🎖️' : '🤝'}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-amber-100 font-handwriting">
                {winner === 1
                  ? `${settings.player1Name} ${t.dotsBoxes.winner}!`
                  : winner === 2
                  ? `${opponentType === 'ai' ? 'Computer AI' : settings.player2Name} ${t.dotsBoxes.winner}!`
                  : t.dotsBoxes.draw}
              </h2>
              <p className="text-stone-400 text-xs mt-1">
                {t.dotsBoxes.gameOver}
              </p>

              {/* Score breakdown */}
              <div className="my-6 p-4 rounded-xl bg-stone-950/60 border border-stone-800 flex justify-around font-mono">
                <div>
                  <div className="text-xs text-stone-400">{settings.player1Name}</div>
                  <div className="text-3xl font-bold text-blue-400">{state.p1Score}</div>
                  <div className="text-[10px] text-stone-500">{t.dotsBoxes.completedBoxes}</div>
                </div>
                <div className="text-stone-600 text-3xl font-light">vs</div>
                <div>
                  <div className="text-xs text-stone-400">
                    {opponentType === 'ai' ? 'Computer' : settings.player2Name}
                  </div>
                  <div className="text-3xl font-bold text-red-400">{state.p2Score}</div>
                  <div className="text-[10px] text-stone-500">{t.dotsBoxes.completedBoxes}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => startGame(gridSize)}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow transition-all"
                >
                  {t.penFight.playAgain}
                </button>
                <button
                  onClick={() => setInSetup(true)}
                  className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-sm transition-all"
                >
                  {t.dotsBoxes.gridSize} / {t.gameModes}
                </button>
                <button
                  onClick={onBack}
                  className="w-full py-2.5 rounded-xl text-stone-400 hover:text-stone-200 text-xs transition-colors"
                >
                  {t.penFight.backToMenu}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls with Level & Idea 💡 Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-3 px-2 py-2 bg-stone-900/90 rounded-2xl border border-stone-800 gap-2 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono text-xs">
            Lv {currentLevel}
          </div>
          <div>
            <span className="text-xs font-bold text-amber-200 font-handwriting">
              {settings.language === 'bn'
                ? getLevelDetails('dots_boxes', currentLevel).titleBn
                : getLevelDetails('dots_boxes', currentLevel).titleEn}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playPenClick();
              setShowIdea(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs shadow-md hover:from-amber-400 transition-all active:scale-95"
          >
            <Lightbulb className="w-3.5 h-3.5 fill-stone-950" />
            <span>{settings.language === 'bn' ? 'Idea 💡 বুদ্ধি' : 'Idea 💡 Advice'}</span>
          </button>

          <button
            onClick={handleUndo}
            disabled={state.history.length === 0 || isAiThinking || isGameOver}
            className="flex items-center gap-1.5 text-stone-300 hover:text-white text-xs font-medium py-1.5 px-3 rounded-xl bg-stone-800 border border-stone-700 disabled:opacity-40"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>{t.dotsBoxes.undo}</span>
          </button>

          <button
            onClick={() => startGame(gridSize)}
            className="flex items-center gap-1.5 text-stone-300 hover:text-white text-xs font-medium py-1.5 px-3 rounded-xl bg-stone-800 border border-stone-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.dotsBoxes.restart}</span>
          </button>
        </div>
      </div>

      {/* Idea Modal */}
      {showIdea && (
        <IdeaModal
          gameKey="dots_boxes"
          level={currentLevel}
          language={settings.language}
          onClose={() => setShowIdea(false)}
          onOpenAIWithTutorial={onOpenAITutorial}
        />
      )}
    </div>
  );
};
