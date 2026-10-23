import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Volume2, Sparkles, HelpCircle, Trophy, Lightbulb } from 'lucide-react';
import { sound } from '../../utils/audio';
import { voiceCoach } from '../../utils/voiceCoach';
import { Translations } from '../../utils/translations';
import { GameSettings, recordKatakutiWin } from '../../utils/storage';
import { recordGameResult } from '../../utils/deviceTracker';
import { awardMatchWinPoint } from '../../utils/authManager';
import { getGameLevel, advanceGameLevel, getLevelDetails } from '../../utils/levelManager';
import { IdeaModal } from '../IdeaModal';

interface KatakutiGameProps {
  t: Translations;
  settings: GameSettings;
  onBack: () => void;
  onOpenRules: () => void;
  onOpenAITutorial?: () => void;
}

export type SubGameMode = 'tictactoe' | 'sos';

export const KatakutiGame: React.FC<KatakutiGameProps> = ({
  t,
  settings,
  onBack,
  onOpenRules,
  onOpenAITutorial,
}) => {
  const [subMode, setSubMode] = useState<SubGameMode>('tictactoe');
  const [opponent, setOpponent] = useState<'ai' | 'two_player'>('ai');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Level Progression: 1 - Unlimited
  const [currentLevel, setCurrentLevel] = useState<number>(() => getGameLevel('katakuti'));
  const [showIdea, setShowIdea] = useState(false);

  // --- TICTACTOE STATE ---
  const [tttBoard, setTttBoard] = useState<Array<'X' | 'O' | null>>(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState<'X' | 'O'>('X');
  const [tttWinner, setTttWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [tttWinLine, setTttWinLine] = useState<number[] | null>(null);

  // --- SOS STATE ---
  const sosGridSize = 5; // 5x5 grid
  const [sosBoard, setSosBoard] = useState<Array<'S' | 'O' | null>>(Array(sosGridSize * sosGridSize).fill(null));
  const [sosSelectedLetter, setSosSelectedLetter] = useState<'S' | 'O'>('S');
  const [sosTurn, setSosTurn] = useState<1 | 2>(1);
  const [sosScores, setSosScores] = useState<{ p1: number; p2: number }>({ p1: 0, p2: 0 });
  const [sosLines, setSosLines] = useState<Array<{ from: number; to: number; player: 1 | 2 }>>([]);
  const [sosGameOver, setSosGameOver] = useState(false);

  // Check TicTacToe Winner
  const checkTttWinner = (board: Array<'X' | 'O' | null>) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6],             // Diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: [a, b, c] };
      }
    }

    if (board.every((cell) => cell !== null)) {
      return { winner: 'draw' as const, line: null };
    }

    return null;
  };

  // TicTacToe Click
  const handleTttClick = (idx: number) => {
    if (tttBoard[idx] !== null || tttWinner || isAiThinking) return;

    sound.playLineDraw();
    const nextBoard = [...tttBoard];
    nextBoard[idx] = tttTurn;
    setTttBoard(nextBoard);

    const res = checkTttWinner(nextBoard);
    if (res) {
      setTttWinner(res.winner);
      setTttWinLine(res.line);
      if (res.winner === 'draw') {
        voiceCoach.announceEvent('tie', settings.language);
        recordGameResult('draw');
      } else {
        voiceCoach.announceEvent('win_match', settings.language);
        sound.playVictoryBell();
        recordKatakutiWin();
        if (res.winner === 'X') {
          recordGameResult('win');
          advanceGameLevel('katakuti');
          awardMatchWinPoint();
        } else if (opponent === 'ai') {
          recordGameResult('loss');
        } else {
          recordGameResult('win');
          advanceGameLevel('katakuti');
          awardMatchWinPoint();
        }
        try { confetti({ particleCount: 50 }); } catch {}
      }
    } else {
      setTttTurn((prev) => (prev === 'X' ? 'O' : 'X'));
    }
  };

  // TicTacToe AI Move
  useEffect(() => {
    if (subMode !== 'tictactoe' || opponent !== 'ai' || tttTurn !== 'O' || tttWinner) return;

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      // Find winning or blocking move, or random
      const emptyIdxs = tttBoard.map((val, i) => (val === null ? i : null)).filter((v) => v !== null) as number[];
      if (emptyIdxs.length === 0) {
        setIsAiThinking(false);
        return;
      }

      // Check if O can win
      let chosen = emptyIdxs[0];
      for (const idx of emptyIdxs) {
        const test = [...tttBoard];
        test[idx] = 'O';
        if (checkTttWinner(test)?.winner === 'O') {
          chosen = idx;
          break;
        }
      }

      // Check if need to block X
      if (chosen === emptyIdxs[0]) {
        for (const idx of emptyIdxs) {
          const test = [...tttBoard];
          test[idx] = 'X';
          if (checkTttWinner(test)?.winner === 'X') {
            chosen = idx;
            break;
          }
        }
      }

      // Center move preference
      if (chosen === emptyIdxs[0] && emptyIdxs.includes(4)) {
        chosen = 4;
      }

      handleTttClick(chosen);
      setIsAiThinking(false);
    }, 550);

    return () => clearTimeout(timer);
  }, [subMode, opponent, tttTurn, tttWinner, tttBoard]);

  // Restart TicTacToe
  const resetTtt = () => {
    sound.playPenClick();
    setTttBoard(Array(9).fill(null));
    setTttTurn('X');
    setTttWinner(null);
    setTttWinLine(null);
  };

  // --- SOS GAME LOGIC ---
  // Find all new SOS sequences formed by placing a letter at index
  const checkSosFormed = (board: Array<'S' | 'O' | null>, placedIdx: number, letter: 'S' | 'O') => {
    const r = Math.floor(placedIdx / sosGridSize);
    const c = placedIdx % sosGridSize;
    const newSequences: Array<{ from: number; to: number }> = [];

    // Direction offsets: [dr, dc]
    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal Down-Right
      [1, -1],  // Diagonal Down-Left
    ];

    const getAt = (row: number, col: number) => {
      if (row < 0 || row >= sosGridSize || col < 0 || col >= sosGridSize) return null;
      return board[row * sosGridSize + col];
    };

    if (letter === 'O') {
      // O must be in the middle of S - O - S
      for (const [dr, dc] of directions) {
        if (getAt(r - dr, c - dc) === 'S' && getAt(r + dr, c + dc) === 'S') {
          newSequences.push({
            from: (r - dr) * sosGridSize + (c - dc),
            to: (r + dr) * sosGridSize + (c + dc),
          });
        }
      }
    } else {
      // S can be either end: S - O - S
      for (const [dr, dc] of directions) {
        // S - O - S forward
        if (getAt(r + dr, c + dc) === 'O' && getAt(r + 2 * dr, c + 2 * dc) === 'S') {
          newSequences.push({
            from: r * sosGridSize + c,
            to: (r + 2 * dr) * sosGridSize + (c + 2 * dc),
          });
        }
        // S - O - S backward
        if (getAt(r - dr, c - dc) === 'O' && getAt(r - 2 * dr, c - 2 * dc) === 'S') {
          newSequences.push({
            from: r * sosGridSize + c,
            to: (r - 2 * dr) * sosGridSize + (c - 2 * dc),
          });
        }
      }
    }

    return newSequences;
  };

  // Place SOS letter
  const handleSosClick = (idx: number, letter = sosSelectedLetter) => {
    if (sosBoard[idx] !== null || sosGameOver || isAiThinking) return;

    sound.playLineDraw();
    const nextBoard = [...sosBoard];
    nextBoard[idx] = letter;
    setSosBoard(nextBoard);

    const newSeqs = checkSosFormed(nextBoard, idx, letter);

    if (newSeqs.length > 0) {
      sound.playBoxComplete();
      voiceCoach.announceEvent('extra_turn', settings.language);

      setSosLines((prev) => [
        ...prev,
        ...newSeqs.map((s) => ({ ...s, player: sosTurn })),
      ]);

      setSosScores((prev) => ({
        ...prev,
        p1: sosTurn === 1 ? prev.p1 + newSeqs.length : prev.p1,
        p2: sosTurn === 2 ? prev.p2 + newSeqs.length : prev.p2,
      }));
      // Extra turn maintained!
    } else {
      // Switch turn
      setSosTurn((prev) => (prev === 1 ? 2 : 1));
    }

    // Check game over
    if (nextBoard.every((cell) => cell !== null)) {
      setSosGameOver(true);
      sound.playVictoryBell();
      voiceCoach.announceEvent('win_match', settings.language);
      try { confetti({ particleCount: 60 }); } catch {}
    }
  };

  // SOS AI Move
  useEffect(() => {
    if (subMode !== 'sos' || opponent !== 'ai' || sosTurn !== 2 || sosGameOver) return;

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      const emptyIdxs = sosBoard.map((val, i) => (val === null ? i : null)).filter((v) => v !== null) as number[];
      if (emptyIdxs.length === 0) {
        setIsAiThinking(false);
        return;
      }

      // Check if AI can score an SOS
      let chosenIdx = emptyIdxs[0];
      let chosenLetter: 'S' | 'O' = 'S';
      let foundScore = false;

      for (const idx of emptyIdxs) {
        // Test S
        if (checkSosFormed(sosBoard, idx, 'S').length > 0) {
          chosenIdx = idx;
          chosenLetter = 'S';
          foundScore = true;
          break;
        }
        // Test O
        if (checkSosFormed(sosBoard, idx, 'O').length > 0) {
          chosenIdx = idx;
          chosenLetter = 'O';
          foundScore = true;
          break;
        }
      }

      if (!foundScore) {
        chosenIdx = emptyIdxs[Math.floor(Math.random() * emptyIdxs.length)];
        chosenLetter = Math.random() > 0.5 ? 'S' : 'O';
      }

      handleSosClick(chosenIdx, chosenLetter);
      setIsAiThinking(false);
    }, 650);

    return () => clearTimeout(timer);
  }, [subMode, opponent, sosTurn, sosGameOver, sosBoard]);

  const resetSos = () => {
    sound.playPenClick();
    setSosBoard(Array(sosGridSize * sosGridSize).fill(null));
    setSosTurn(1);
    setSosScores({ p1: 0, p2: 0 });
    setSosLines([]);
    setSosGameOver(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto p-2 md:p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-stone-900/90 border border-stone-800 rounded-2xl px-4 py-2.5 mb-2 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white py-1 px-2.5 rounded-lg bg-stone-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Menu</span>
          </button>
          <div className="text-sm font-bold text-amber-100 font-handwriting">
            {subMode === 'tictactoe'
              ? (settings.language === 'bn' ? 'খাতার শেষ পৃষ্ঠার কাটাকুটি' : 'Backpage Katakuti (Tic-Tac-Toe)')
              : (settings.language === 'bn' ? 'এস-ও-এস খেলা (SOS Grid)' : 'SOS Notebook Challenge')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* SubMode Toggle */}
          <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => {
                sound.playPenClick();
                setSubMode('tictactoe');
              }}
              className={`px-3 py-1 rounded-lg transition-colors ${
                subMode === 'tictactoe' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'
              }`}
            >
              Katakuti (3×3)
            </button>
            <button
              onClick={() => {
                sound.playPenClick();
                setSubMode('sos');
              }}
              className={`px-3 py-1 rounded-lg transition-colors ${
                subMode === 'sos' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'
              }`}
            >
              SOS (5×5)
            </button>
          </div>

          <button
            onClick={onOpenRules}
            className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-amber-300"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Ruled Notebook Page Container */}
      <div className="relative flex-1 rounded-2xl overflow-auto flex flex-col items-center justify-center p-4 shadow-xl border border-stone-800 bg-notebook-ruled">
        {/* Notebook Doodles in corners */}
        <div className="absolute top-4 left-6 text-blue-900/40 text-xs font-handwriting -rotate-12 pointer-events-none">
          ✎ CLASS NOTES (DO NOT TEAR)
        </div>
        <div className="absolute bottom-4 right-6 text-red-900/40 text-xs font-handwriting rotate-6 pointer-events-none">
          ★ LAST BENCH LEGEND ★
        </div>

        {/* --- TIC-TAC-TOE VIEW --- */}
        {subMode === 'tictactoe' && (
          <div className="flex flex-col items-center">
            {/* Status HUD */}
            <div className="mb-4 text-center">
              <div className="text-sm font-bold text-stone-800 font-handwriting">
                {tttWinner
                  ? tttWinner === 'draw'
                    ? "It's a Tie! (ম্যাচ ড্র)"
                    : `${tttWinner === 'X' ? settings.player1Name : (opponent === 'ai' ? 'Computer AI' : settings.player2Name)} Wins!`
                  : isAiThinking
                  ? 'Computer is thinking...'
                  : `${tttTurn === 'X' ? settings.player1Name : (opponent === 'ai' ? 'Computer AI' : settings.player2Name)}'s Turn (${tttTurn})`}
              </div>
            </div>

            {/* 3x3 Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-white/80 backdrop-blur-xs rounded-2xl shadow-md border-2 border-dashed border-stone-400">
              {tttBoard.map((val, i) => (
                <button
                  key={i}
                  onClick={() => handleTttClick(i)}
                  disabled={val !== null || !!tttWinner || isAiThinking}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center text-4xl sm:text-5xl font-handwriting font-bold transition-all ${
                    val === 'X'
                      ? 'text-blue-600 bg-blue-50/60'
                      : val === 'O'
                      ? 'text-red-600 bg-red-50/60'
                      : 'hover:bg-amber-100/50 bg-stone-100/40'
                  } border border-stone-300 shadow-xs`}
                >
                  {val}
                </button>
              ))}
            </div>

            <button
              onClick={resetTtt}
              className="mt-6 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-stone-200 hover:text-amber-300 text-xs font-semibold shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Katakuti</span>
            </button>
          </div>
        )}

        {/* --- SOS GAME VIEW --- */}
        {subMode === 'sos' && (
          <div className="flex flex-col items-center w-full max-w-md">
            {/* SOS Scores & Turn */}
            <div className="flex items-center justify-between w-full bg-white/85 px-4 py-2 rounded-xl shadow border border-stone-300 mb-4">
              <div className="text-left">
                <span className="text-[11px] text-blue-600 font-semibold">{settings.player1Name}</span>
                <div className="text-xl font-bold font-mono text-blue-700">{sosScores.p1}</div>
              </div>

              {/* Letter selector */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-300">
                <button
                  onClick={() => setSosSelectedLetter('S')}
                  className={`px-3 py-1 text-xs font-bold rounded ${
                    sosSelectedLetter === 'S' ? 'bg-amber-500 text-stone-950' : 'text-stone-600'
                  }`}
                >
                  Place S
                </button>
                <button
                  onClick={() => setSosSelectedLetter('O')}
                  className={`px-3 py-1 text-xs font-bold rounded ${
                    sosSelectedLetter === 'O' ? 'bg-amber-500 text-stone-950' : 'text-stone-600'
                  }`}
                >
                  Place O
                </button>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-red-600 font-semibold">{opponent === 'ai' ? 'Computer' : settings.player2Name}</span>
                <div className="text-xl font-bold font-mono text-red-700">{sosScores.p2}</div>
              </div>
            </div>

            {/* 5x5 Grid */}
            <div className="grid grid-cols-5 gap-2 p-3 bg-white/85 backdrop-blur-xs rounded-2xl shadow-md border-2 border-stone-400">
              {sosBoard.map((val, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSosClick(idx)}
                  disabled={val !== null || sosGameOver || isAiThinking}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center text-2xl font-bold font-handwriting border transition-all ${
                    val === 'S'
                      ? 'text-blue-600 bg-blue-50/50 border-blue-200'
                      : val === 'O'
                      ? 'text-red-600 bg-red-50/50 border-red-200'
                      : 'hover:bg-amber-100/60 bg-stone-50 border-stone-300'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            <button
              onClick={resetSos}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-stone-200 hover:text-amber-300 text-xs font-semibold shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset SOS</span>
            </button>
          </div>
        )}

        {/* Bottom Bar: Level & Idea 💡 Button */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between py-2.5 px-4 bg-stone-900/90 rounded-2xl border border-stone-800 shadow-md gap-2 w-full max-w-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono text-xs">
              Lv {currentLevel}
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200 font-handwriting">
                {settings.language === 'bn'
                  ? getLevelDetails('katakuti', currentLevel).titleBn
                  : getLevelDetails('katakuti', currentLevel).titleEn}
              </div>
              <div className="text-[10px] text-stone-400">
                {settings.language === 'bn' ? '১ থেকে আনলিমিটেড লেভেল' : 'Level 1 to Unlimited'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playPenClick();
              setShowIdea(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs shadow-lg hover:from-amber-400 transition-all active:scale-95"
          >
            <Lightbulb className="w-4 h-4 fill-stone-950" />
            <span>{settings.language === 'bn' ? 'Idea 💡 বুদ্ধি' : 'Idea 💡 Advice'}</span>
          </button>
        </div>

        {/* Idea Modal */}
        {showIdea && (
          <IdeaModal
            gameKey="katakuti"
            level={currentLevel}
            language={settings.language}
            onClose={() => setShowIdea(false)}
            onOpenAIWithTutorial={onOpenAITutorial}
          />
        )}
      </div>
    </div>
  );
};
