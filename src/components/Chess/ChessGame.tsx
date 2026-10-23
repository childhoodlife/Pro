import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Trophy,
  Users,
  Lightbulb,
  ShieldAlert,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { voiceCoach } from '../../utils/voiceCoach';
import { Translations } from '../../utils/translations';
import { GameSettings } from '../../utils/storage';
import { recordGameResult } from '../../utils/deviceTracker';
import { getCurrentUser, awardMatchWinPoint } from '../../utils/authManager';
import {
  getGameLevel,
  advanceGameLevel,
  getLevelDetails,
} from '../../utils/levelManager';
import { VictoryModal } from '../VictoryModal';
import { IdeaModal } from '../IdeaModal';

interface ChessGameProps {
  t: Translations;
  settings: GameSettings;
  onBack: () => void;
  onOpenRules: () => void;
  onOpenAITutorial?: () => void;
}

export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface ChessPiece {
  color: PieceColor;
  type: PieceType;
  hasMoved?: boolean;
}

type BoardState = Array<Array<ChessPiece | null>>;

const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  w: {
    k: '♔',
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
    p: '♙',
  },
  b: {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  },
};

const PIECE_NAMES_BN: Record<PieceType, string> = {
  k: 'রাজা',
  q: 'মন্ত্রী (রানী)',
  r: 'নৌকা (রুক)',
  b: 'গজ (বিশপ)',
  n: 'ঘোড়া (নাইট)',
  p: 'বোড়ে (পন)',
};

export function createInitialBoard(): BoardState {
  const board: BoardState = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Back ranks
  const backRow: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

  // Black pieces (top: row 0 & 1)
  for (let c = 0; c < 8; c++) {
    board[0][c] = { color: 'b', type: backRow[c], hasMoved: false };
    board[1][c] = { color: 'b', type: 'p', hasMoved: false };
  }

  // White pieces (bottom: row 6 & 7)
  for (let c = 0; c < 8; c++) {
    board[6][c] = { color: 'w', type: 'p', hasMoved: false };
    board[7][c] = { color: 'w', type: backRow[c], hasMoved: false };
  }

  return board;
}

export const ChessGame: React.FC<ChessGameProps> = ({
  t,
  settings,
  onBack,
  onOpenRules,
  onOpenAITutorial,
}) => {
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard());
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [legalMoves, setLegalMoves] = useState<Array<[number, number]>>([]);
  const [capturedByWhite, setCapturedByWhite] = useState<ChessPiece[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<ChessPiece[]>([]);
  const [isCheck, setIsCheck] = useState<PieceColor | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // Opponent mode: 'ai' (Computer 💻) or 'two_player' (Pass & Play)
  const [opponent, setOpponent] = useState<'ai' | 'two_player'>('ai');

  // Level Progression: 1 - Unlimited
  const [currentLevel, setCurrentLevel] = useState<number>(() => getGameLevel('chess'));
  const [showIdea, setShowIdea] = useState(false);

  // Victory State
  const [victoryWinner, setVictoryWinner] = useState<{
    name: string;
    pointsAwarded: number;
    scoreDetail: string;
  } | null>(null);

  const currentUser = getCurrentUser();
  const levelInfo = getLevelDetails('chess', currentLevel);

  // Announce voice commentary
  useEffect(() => {
    if (settings.voiceCoach) {
      voiceCoach.speak(
        settings.language === 'bn'
          ? `দাবা খেলায় স্বাগতম! লেভেল ${currentLevel}। বন্ধুদের সাথে বা কম্পিউটারের সাথে খেলুন। সাহায্য পেতে আইডিয়া বাটনে চাপুন!`
          : `Welcome to Chess! Level ${currentLevel}. Play with friends or against Computer AI. Tap the Idea button for tactical hints!`,
        settings.language
      );
    }
  }, [currentLevel, settings.language, settings.voiceCoach]);

  // Compute raw moves for a piece without recursive check filter
  const getRawPieceMoves = useCallback(
    (b: BoardState, r: number, c: number): Array<[number, number]> => {
      const piece = b[r][c];
      if (!piece) return [];
      const moves: Array<[number, number]> = [];
      const { color, type } = piece;
      const enemyColor: PieceColor = color === 'w' ? 'b' : 'w';

      const inBounds = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8;

      if (type === 'p') {
        const dir = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;

        // 1 step forward
        if (inBounds(r + dir, c) && !b[r + dir][c]) {
          moves.push([r + dir, c]);
          // 2 steps from start
          if (r === startRow && !b[r + 2 * dir][c]) {
            moves.push([r + 2 * dir, c]);
          }
        }
        // Diagonal captures
        [-1, 1].forEach((dc) => {
          if (inBounds(r + dir, c + dc)) {
            const target = b[r + dir][c + dc];
            if (target && target.color === enemyColor) {
              moves.push([r + dir, c + dc]);
            }
          }
        });
      } else if (type === 'n') {
        const knightJumps = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1],
        ];
        knightJumps.forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(nr, nc)) {
            const target = b[nr][nc];
            if (!target || target.color === enemyColor) {
              moves.push([nr, nc]);
            }
          }
        });
      } else if (type === 'b' || type === 'r' || type === 'q') {
        const directions: Array<[number, number]> = [];
        if (type === 'b' || type === 'q') {
          directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
        }
        if (type === 'r' || type === 'q') {
          directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
        }

        directions.forEach(([dr, dc]) => {
          let step = 1;
          while (true) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (!inBounds(nr, nc)) break;
            const target = b[nr][nc];
            if (!target) {
              moves.push([nr, nc]);
            } else {
              if (target.color === enemyColor) {
                moves.push([nr, nc]);
              }
              break;
            }
            step++;
          }
        });
      } else if (type === 'k') {
        const kingSteps = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1],           [0, 1],
          [1, -1],  [1, 0],  [1, 1],
        ];
        kingSteps.forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(nr, nc)) {
            const target = b[nr][nc];
            if (!target || target.color === enemyColor) {
              moves.push([nr, nc]);
            }
          }
        });
      }

      return moves;
    },
    []
  );

  // Find King position
  const findKing = useCallback((b: BoardState, color: PieceColor): [number, number] | null => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (p && p.color === color && p.type === 'k') {
          return [r, c];
        }
      }
    }
    return null;
  }, []);

  // Is King in check?
  const isKingInCheck = useCallback(
    (b: BoardState, color: PieceColor): boolean => {
      const kingPos = findKing(b, color);
      if (!kingPos) return false;
      const enemyColor: PieceColor = color === 'w' ? 'b' : 'w';

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = b[r][c];
          if (p && p.color === enemyColor) {
            const rawMoves = getRawPieceMoves(b, r, c);
            if (rawMoves.some(([mr, mc]) => mr === kingPos[0] && mc === kingPos[1])) {
              return true;
            }
          }
        }
      }
      return false;
    },
    [findKing, getRawPieceMoves]
  );

  // Valid legal moves (cannot leave own king in check)
  const getLegalMoves = useCallback(
    (b: BoardState, r: number, c: number): Array<[number, number]> => {
      const piece = b[r][c];
      if (!piece) return [];
      const rawMoves = getRawPieceMoves(b, r, c);

      return rawMoves.filter(([toR, toC]) => {
        // Clone board and test
        const testBoard = b.map((row) => [...row]);
        testBoard[toR][toC] = testBoard[r][c];
        testBoard[r][c] = null;
        return !isKingInCheck(testBoard, piece.color);
      });
    },
    [getRawPieceMoves, isKingInCheck]
  );

  // Check if a player has any legal moves
  const hasAnyLegalMoves = useCallback(
    (b: BoardState, color: PieceColor): boolean => {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = b[r][c];
          if (p && p.color === color) {
            const moves = getLegalMoves(b, r, c);
            if (moves.length > 0) return true;
          }
        }
      }
      return false;
    },
    [getLegalMoves]
  );

  // Handle Square Click
  const handleSquareClick = (r: number, c: number) => {
    if (isAiThinking) return;

    const clickedPiece = board[r][c];

    // If currently selected, check if clicked on one of the legal moves
    if (selectedPos) {
      const [fromR, fromC] = selectedPos;
      const isMoveTarget = legalMoves.some(([mr, mc]) => mr === r && mc === c);

      if (isMoveTarget) {
        executeMove(fromR, fromC, r, c);
        return;
      }
    }

    // Select piece of current turn's color
    if (clickedPiece && clickedPiece.color === turn) {
      sound.playPenClick();
      setSelectedPos([r, c]);
      const moves = getLegalMoves(board, r, c);
      setLegalMoves(moves);
    } else {
      setSelectedPos(null);
      setLegalMoves([]);
    }
  };

  // Execute a move on the board
  const executeMove = (fromR: number, fromC: number, toR: number, toC: number) => {
    const movingPiece = board[fromR][fromC];
    if (!movingPiece) return;

    const captured = board[toR][toC];
    const newBoard = board.map((row) => [...row]);

    // Handle Pawn Promotion to Queen if reaching end rank
    let finalType = movingPiece.type;
    if (movingPiece.type === 'p' && (toR === 0 || toR === 7)) {
      finalType = 'q';
      sound.playBoxComplete();
    }

    newBoard[toR][toC] = {
      ...movingPiece,
      type: finalType,
      hasMoved: true,
    };
    newBoard[fromR][fromC] = null;

    if (captured) {
      sound.playPenClash(0.8);
      sound.triggerHaptic(30);
      if (captured.color === 'b') {
        setCapturedByWhite((prev) => [...prev, captured]);
      } else {
        setCapturedByBlack((prev) => [...prev, captured]);
      }
    } else {
      sound.playLineDraw();
      sound.triggerHaptic(15);
    }

    // Record notation
    const colLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const fromNotation = `${colLabels[fromC]}${8 - fromR}`;
    const toNotation = `${colLabels[toC]}${8 - toR}`;
    const notation = `${movingPiece.type.toUpperCase()}${captured ? 'x' : '-'}${toNotation}`;
    setMoveHistory((prev) => [...prev, notation]);

    setBoard(newBoard);
    setSelectedPos(null);
    setLegalMoves([]);

    const nextTurn: PieceColor = turn === 'w' ? 'b' : 'w';
    setTurn(nextTurn);

    // Check & Checkmate Detection
    const inCheck = isKingInCheck(newBoard, nextTurn);
    if (inCheck) {
      setIsCheck(nextTurn);
      sound.playVictoryBell();
      if (settings.voiceCoach) {
        voiceCoach.speak(
          settings.language === 'bn'
            ? `${nextTurn === 'w' ? 'সাদা' : 'কালো'} রাজাকে কিস্তি (Check)!`
            : `Check on ${nextTurn === 'w' ? 'White' : 'Black'} King!`,
          settings.language
        );
      }
    } else {
      setIsCheck(null);
    }

    // Checkmate / Game Over
    const nextHasMoves = hasAnyLegalMoves(newBoard, nextTurn);
    if (!nextHasMoves) {
      if (inCheck) {
        // Checkmate!
        handleCheckmate(turn); // current mover wins
      } else {
        // Stalemate
        handleStalemate();
      }
    }
  };

  // AI Move Engine (Computer 💻)
  useEffect(() => {
    if (opponent !== 'ai' || turn !== 'b' || victoryWinner) return;

    setIsAiThinking(true);

    const timer = setTimeout(() => {
      // Find all black legal moves
      const allMoves: Array<{
        from: [number, number];
        to: [number, number];
        weight: number;
      }> = [];

      const pieceValues: Record<PieceType, number> = {
        p: 10,
        n: 32,
        b: 33,
        r: 50,
        q: 90,
        k: 1000,
      };

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.color === 'b') {
            const legal = getLegalMoves(board, r, c);
            legal.forEach(([toR, toC]) => {
              const target = board[toR][toC];
              let weight = 0;

              // Captures
              if (target) {
                weight += pieceValues[target.type] * 3;
              }

              // Center control preference (d4, d5, e4, e5)
              if ((toR === 3 || toR === 4) && (toC === 3 || toC === 4)) {
                weight += 8;
              }

              // Advance pieces forward
              weight += toR * 2;

              // Higher level AI considers checking white king
              if (currentLevel >= 2) {
                const testBoard = board.map((row) => [...row]);
                testBoard[toR][toC] = testBoard[r][c];
                testBoard[r][c] = null;
                if (isKingInCheck(testBoard, 'w')) {
                  weight += 15;
                }
              }

              // Random variety to prevent predictability
              weight += Math.random() * 4;

              allMoves.push({ from: [r, c], to: [toR, toC], weight });
            });
          }
        }
      }

      setIsAiThinking(false);

      if (allMoves.length > 0) {
        // Sort descending by calculated weight
        allMoves.sort((a, b) => b.weight - a.weight);
        const bestMove = allMoves[0];
        executeMove(bestMove.from[0], bestMove.from[1], bestMove.to[0], bestMove.to[1]);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [opponent, turn, board, currentLevel, getLegalMoves, isKingInCheck, victoryWinner]);

  // Handle Checkmate Victory
  const handleCheckmate = (winningColor: PieceColor) => {
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    sound.playVictory();

    const isP1Win = winningColor === 'w';
    if (isP1Win) {
      awardMatchWinPoint();
      recordGameResult('win');
      advanceGameLevel('chess');
    } else {
      recordGameResult('loss');
    }

    const winnerName =
      opponent === 'ai'
        ? isP1Win
          ? currentUser?.name || 'প্লেয়ার'
          : 'কম্পিউটার (AI)'
        : isP1Win
        ? `${currentUser?.name || 'প্লেয়ার ১ (সাদা)'}`
        : 'প্লেয়ার ২ (কালো)';

    setVictoryWinner({
      name: winnerName,
      pointsAwarded: isP1Win ? 1 : 0,
      scoreDetail:
        settings.language === 'bn'
          ? `কিস্তিমাত (Checkmate)! লেভেল ${currentLevel} সম্পন্ন`
          : `Checkmate! Level ${currentLevel} Complete`,
    });

    if (settings.voiceCoach) {
      voiceCoach.speak(
        settings.language === 'bn'
          ? `কিস্তিমাত! ${winnerName} দাবা ম্যাচে বিজয়ী হয়েছেন!`
          : `Checkmate! ${winnerName} won the chess match!`,
        settings.language
      );
    }
  };

  const handleStalemate = () => {
    sound.playFallOffDesk();
    setVictoryWinner({
      name: settings.language === 'bn' ? 'ড্র (Stalemate)' : 'Draw',
      pointsAwarded: 0,
      scoreDetail: settings.language === 'bn' ? 'কোনো চাল বাকি নেই' : 'No legal moves remaining',
    });
  };

  const resetGame = () => {
    setBoard(createInitialBoard());
    setTurn('w');
    setSelectedPos(null);
    setLegalMoves([]);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setIsCheck(null);
    setMoveHistory([]);
    setVictoryWinner(null);
    setCurrentLevel(getGameLevel('chess'));
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800 gap-3">
        <button
          onClick={() => {
            sound.playPenClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{settings.language === 'bn' ? 'হোম পেজ' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-bold text-amber-100 font-handwriting">
            {settings.language === 'bn' ? 'আন্তর্জাতিক দাবা (Chess)' : 'Grandmaster Chess'}
          </span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
            {levelInfo.titleBn.split(':')[0]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playPenClick();
              resetGame();
            }}
            className="p-1.5 rounded-lg bg-stone-900 text-stone-400 hover:text-white border border-stone-800 transition-colors"
            title="রিস্টার্ট"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenRules}
            className="p-1.5 rounded-lg bg-stone-900 text-stone-400 hover:text-white border border-stone-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Opponent Selector & Level Objective Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-3 bg-stone-900/80 rounded-2xl border border-stone-800 mt-3 gap-2 text-xs">
        {/* Opponent Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playPenClick();
              setOpponent('ai');
              resetGame();
            }}
            className={`px-3 py-1 rounded-xl font-medium transition-all ${
              opponent === 'ai'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            {settings.language === 'bn' ? 'Computer 💻 (AI)' : 'vs Computer'}
          </button>
          <button
            onClick={() => {
              sound.playPenClick();
              setOpponent('two_player');
              resetGame();
            }}
            className={`px-3 py-1 rounded-xl font-medium transition-all ${
              opponent === 'two_player'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            {settings.language === 'bn' ? 'বন্ধুদের সাথে 👥 (1v1)' : '2 Player (1v1)'}
          </button>
        </div>

        {/* Level and Turn Status */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-stone-400 font-mono">
            {settings.language === 'bn' ? 'চাল:' : 'Turn:'}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-lg font-bold font-mono text-xs flex items-center gap-1 ${
              turn === 'w'
                ? 'bg-stone-200 text-stone-950 border border-stone-300'
                : 'bg-stone-950 text-stone-200 border border-stone-700'
            }`}
          >
            <span>{turn === 'w' ? '♔ সাদা (White)' : '♚ কালো (Black)'}</span>
            {isAiThinking && <span className="animate-pulse text-amber-400">...</span>}
          </span>
          {isCheck && (
            <span className="px-2 py-0.5 rounded-lg bg-red-950/80 border border-red-700 text-red-300 font-bold text-xs animate-bounce">
              কিস্তি (Check)!
            </span>
          )}
        </div>
      </div>

      {/* Captured Pieces Bar (Black's captures) */}
      <div className="flex items-center justify-between px-3 py-1.5 mt-2 bg-stone-950/60 rounded-xl border border-stone-800 text-xs">
        <span className="text-stone-400 text-[11px]">
          {settings.language === 'bn' ? 'কালো খেলোয়াড়ের প্রাপ্ত গুটি:' : 'Black Captured:'}
        </span>
        <div className="flex items-center gap-1 text-base text-stone-200">
          {capturedByBlack.map((p, i) => (
            <span key={i} title={PIECE_NAMES_BN[p.type]}>
              {PIECE_SYMBOLS.w[p.type]}
            </span>
          ))}
          {capturedByBlack.length === 0 && <span className="text-[10px] text-stone-600">-</span>}
        </div>
      </div>

      {/* 8x8 Authentic Chess Board */}
      <div className="relative my-3 flex flex-col items-center justify-center select-none">
        <div className="p-3 bg-amber-950/40 rounded-3xl border-4 border-amber-900/60 shadow-2xl">
          <div className="grid grid-cols-8 border-2 border-stone-900 rounded-xl overflow-hidden shadow-inner">
            {board.map((row, r) =>
              row.map((piece, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selectedPos && selectedPos[0] === r && selectedPos[1] === c;
                const isLegal = legalMoves.some(([mr, mc]) => mr === r && mc === c);
                const isKingCheckSquare =
                  isCheck && piece && piece.type === 'k' && piece.color === isCheck;

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    disabled={isAiThinking}
                    className={`w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center relative transition-colors ${
                      isKingCheckSquare
                        ? 'bg-red-700/80 animate-pulse'
                        : isSelected
                        ? 'bg-amber-400/80 ring-2 ring-amber-300'
                        : isLegal
                        ? isDark
                          ? 'bg-emerald-900/70 hover:bg-emerald-800/80'
                          : 'bg-emerald-200/80 hover:bg-emerald-300'
                        : isDark
                        ? 'bg-[#78350f] hover:bg-[#854d0e]'
                        : 'bg-[#fef3c7] hover:bg-[#fde68a]'
                    }`}
                  >
                    {/* Legal move indicator dot */}
                    {isLegal && !piece && (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-600/70 shadow-xs" />
                    )}

                    {/* Legal move capture ring */}
                    {isLegal && piece && (
                      <span className="absolute inset-1 rounded-xl border-2 border-red-500 pointer-events-none" />
                    )}

                    {/* Chess Piece Graphic */}
                    {piece && (
                      <span
                        className={`text-2xl sm:text-4xl filter drop-shadow-md transition-transform ${
                          isSelected ? 'scale-115' : 'hover:scale-105'
                        } ${
                          piece.color === 'w'
                            ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]'
                            : 'text-stone-950 drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]'
                        }`}
                      >
                        {PIECE_SYMBOLS[piece.color][piece.type]}
                      </span>
                    )}

                    {/* Coordinate notation indicators on edges */}
                    {c === 0 && (
                      <span
                        className={`absolute top-0.5 left-0.5 text-[8px] font-mono font-bold ${
                          isDark ? 'text-amber-200/60' : 'text-stone-700/60'
                        }`}
                      >
                        {8 - r}
                      </span>
                    )}
                    {r === 7 && (
                      <span
                        className={`absolute bottom-0.5 right-0.5 text-[8px] font-mono font-bold ${
                          isDark ? 'text-amber-200/60' : 'text-stone-700/60'
                        }`}
                      >
                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][c]}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Captured Pieces Bar (White's captures) */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-950/60 rounded-xl border border-stone-800 text-xs">
        <span className="text-stone-400 text-[11px]">
          {settings.language === 'bn' ? 'সাদা খেলোয়াড়ের প্রাপ্ত গুটি:' : 'White Captured:'}
        </span>
        <div className="flex items-center gap-1 text-base text-stone-200">
          {capturedByWhite.map((p, i) => (
            <span key={i} title={PIECE_NAMES_BN[p.type]}>
              {PIECE_SYMBOLS.b[p.type]}
            </span>
          ))}
          {capturedByWhite.length === 0 && <span className="text-[10px] text-stone-600">-</span>}
        </div>
      </div>

      {/* Bottom Bar: Idea 💡 Button & Level Progression */}
      <div className="mt-3 flex items-center justify-between py-2.5 px-4 bg-stone-900/90 rounded-2xl border border-stone-800 shadow-md">
        {/* Left: Level Details */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono text-xs">
            Lv {currentLevel}
          </div>
          <div>
            <div className="text-xs font-bold text-amber-200 font-handwriting">
              {settings.language === 'bn' ? levelInfo.titleBn : levelInfo.titleEn}
            </div>
            <div className="text-[10px] text-stone-400">
              {settings.language === 'bn' ? '১ থেকে আনলিমিটেড লেভেল' : 'Level 1 to Unlimited'}
            </div>
          </div>
        </div>

        {/* Right: Idea 💡 Button */}
        <button
          onClick={() => {
            sound.playPenClick();
            setShowIdea(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95"
        >
          <Lightbulb className="w-4 h-4 fill-stone-950" />
          <span>{settings.language === 'bn' ? 'Idea 💡 বুদ্ধি' : 'Idea 💡 Advice'}</span>
        </button>
      </div>

      {/* Idea Modal */}
      {showIdea && (
        <IdeaModal
          gameKey="chess"
          level={currentLevel}
          language={settings.language}
          onClose={() => setShowIdea(false)}
          onOpenAIWithTutorial={onOpenAITutorial}
        />
      )}

      {/* Victory Celebration Modal */}
      {victoryWinner && (
        <VictoryModal
          winnerName={victoryWinner.name}
          pointsAwarded={victoryWinner.pointsAwarded}
          totalPoints={getCurrentUser()?.points || 0}
          matchTitle={settings.language === 'bn' ? 'আন্তর্জাতিক দাবা' : 'Chess'}
          scoreDetail={victoryWinner.scoreDetail}
          language={settings.language}
          onPlayAgain={resetGame}
          onBackHome={onBack}
        />
      )}
    </div>
  );
};
