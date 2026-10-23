import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Volume2, Sparkles, HelpCircle, Trophy, Target, ShieldAlert, Lightbulb } from 'lucide-react';
import { sound } from '../../utils/audio';
import { voiceCoach } from '../../utils/voiceCoach';
import { Translations } from '../../utils/translations';
import { GameSettings } from '../../utils/storage';
import { recordGameResult } from '../../utils/deviceTracker';
import { getCurrentUser, awardMatchWinPoint } from '../../utils/authManager';
import { getGameLevel, advanceGameLevel, getLevelDetails } from '../../utils/levelManager';
import { VictoryModal } from '../VictoryModal';
import { IdeaModal } from '../IdeaModal';

interface BottleSmashGameProps {
  t: Translations;
  settings: GameSettings;
  onBack: () => void;
  onOpenRules: () => void;
  onOpenAITutorial?: () => void;
}

interface Bottle {
  id: number;
  type: 'green' | 'red' | 'clear' | 'golden' | 'moving' | 'bomb';
  nameBn: string;
  x: number;
  y: number;
  width: number;
  height: number;
  points: number;
  color: string;
  isBroken: boolean;
  vx?: number;
}

interface GlassShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  rotation: number;
  vRot: number;
}

interface Pebble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
}

export const BottleSmashGame: React.FC<BottleSmashGameProps> = ({
  t,
  settings,
  onBack,
  onOpenRules,
  onOpenAITutorial,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Setup / Mode
  const [gameMode, setGameMode] = useState<'solo' | 'two_player'>('solo');
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);

  // Level Progression: 1 - Unlimited
  const [currentLevel, setCurrentLevel] = useState<number>(() => getGameLevel('bottle_smash'));
  const [showIdea, setShowIdea] = useState(false);

  // Scores
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [lastHitMessage, setLastHitMessage] = useState<string | null>(null);

  // Victory State
  const [victoryWinner, setVictoryWinner] = useState<{
    name: string;
    score: number;
    pointsAwarded: number;
  } | null>(null);

  const currentUser = getCurrentUser();
  const WIN_TARGET = 100;
  const activeScore = currentTurn === 1 ? p1Score : p2Score;

  // Slingshot / Guloti Origin Position
  const slingshotOrigin = { x: 300, y: 350 };
  const [isPulling, setIsPulling] = useState(false);
  const [pullPos, setPullPos] = useState({ x: 300, y: 350 });

  // Refs for animation
  const bottlesRef = useRef<Bottle[]>([]);
  const shardsRef = useRef<GlassShard[]>([]);
  const pebbleRef = useRef<Pebble | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isGameOverRef = useRef(false);

  const spawnInitialBottles = useCallback(() => {
    const list: Bottle[] = [
      {
        id: 1,
        type: 'green',
        nameBn: 'সবুজ সোডা বোতল',
        x: 80,
        y: 110,
        width: 32,
        height: 70,
        points: 10,
        color: '#15803d',
        isBroken: false,
      },
      {
        id: 2,
        type: 'red',
        nameBn: 'লাল মিরিন্ডা বোতল',
        x: 160,
        y: 110,
        width: 30,
        height: 68,
        points: 15,
        color: '#b91c1c',
        isBroken: false,
      },
      {
        id: 3,
        type: 'golden',
        nameBn: 'সোনালী রাজকীয় বোতল',
        x: 240,
        y: 105,
        width: 34,
        height: 75,
        points: 25,
        color: '#eab308',
        isBroken: false,
      },
      {
        id: 4,
        type: 'clear',
        nameBn: 'স্বচ্ছ লেমোনেড বোতল',
        x: 330,
        y: 110,
        width: 30,
        height: 68,
        points: 12,
        color: '#38bdf8',
        isBroken: false,
      },
      {
        id: 5,
        type: 'bomb',
        nameBn: 'পটকা বোমা!',
        x: 410,
        y: 120,
        width: 32,
        height: 55,
        points: -15,
        color: '#475569',
        isBroken: false,
      },
      {
        id: 6,
        type: 'moving',
        nameBn: 'চলমান বোনাস বোতল',
        x: 480,
        y: 105,
        width: 32,
        height: 72,
        points: 30,
        color: '#a855f7',
        isBroken: false,
        vx: 1.8,
      },
    ];
    bottlesRef.current = list;
  }, []);

  useEffect(() => {
    spawnInitialBottles();
  }, [spawnInitialBottles]);

  // Voice instruction on mount
  useEffect(() => {
    if (settings.voiceCoach) {
      voiceCoach.speak(
        settings.language === 'bn'
          ? 'বোতল ভাঙ্গা খেলায় স্বাগতম! গুলতি টেনে বোতল লক্ষ্য করে পাথর ছুড়ুন এবং ১০০ স্কোর করে বিজয়ী হোন!'
          : 'Welcome to Bottle Smash! Pull back the slingshot and smash glass bottles to reach 100 points!',
        settings.language
      );
    }
  }, [settings.language, settings.voiceCoach]);

  const triggerVictory = (winnerPlayer: 1 | 2, finalScore: number) => {
    isGameOverRef.current = true;
    confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } });
    sound.playVictory();

    // Award +1 Match Point & advance level
    awardMatchWinPoint();
    recordGameResult('win');
    advanceGameLevel('bottle_smash');

    const winnerName =
      gameMode === 'solo'
        ? currentUser?.name || 'খেলোয়াড়'
        : winnerPlayer === 1
        ? `${currentUser?.name || 'প্লেয়ার ১'}`
        : 'প্লেয়ার ২';

    setVictoryWinner({
      name: winnerName,
      score: finalScore,
      pointsAwarded: 1,
    });

    if (settings.voiceCoach) {
      voiceCoach.speak(
        settings.language === 'bn'
          ? `অভিনন্দন ${winnerName}! আপনি বোতল ভাঙ্গায় ১০০ পয়েন্ট করে চ্যাম্পিয়ন হয়েছেন!`
          : `Congratulations ${winnerName}! You reached 100 points in Bottle Smash!`,
        settings.language
      );
    }
  };

  const handleBottleHit = useCallback(
    (bottle: Bottle) => {
      bottle.isBroken = true;

      if (bottle.type === 'bomb') {
        sound.playPenFall();
        sound.triggerHaptic(50);
        if (currentTurn === 1) {
          setP1Score((s) => Math.max(0, s - 15));
        } else {
          setP2Score((s) => Math.max(0, s - 15));
        }
        setLastHitMessage('বোমা বিস্ফোরণ! -১৫ পয়েন্ট!');
        setTimeout(() => setLastHitMessage(null), 1500);

        for (let i = 0; i < 25; i++) {
          shardsRef.current.push({
            x: bottle.x + bottle.width / 2,
            y: bottle.y + bottle.height / 2,
            vx: (Math.random() - 0.5) * 9,
            vy: (Math.random() - 0.5) * 9,
            color: '#ef4444',
            size: Math.random() * 5 + 3,
            alpha: 1.0,
            rotation: 0,
            vRot: (Math.random() - 0.5) * 0.3,
          });
        }
        return;
      }

      // Glass shatter sound & haptics
      sound.playBoxComplete();
      sound.triggerHaptic(30);

      // Glass Shards Particles
      for (let i = 0; i < 28; i++) {
        shardsRef.current.push({
          x: bottle.x + bottle.width / 2,
          y: bottle.y + bottle.height / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          color: bottle.color,
          size: Math.random() * 6 + 2,
          alpha: 1.0,
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.25,
        });
      }

      const pointsWon = bottle.points;
      setLastHitMessage(`${bottle.nameBn}: +${pointsWon} পয়েন্ট!`);
      setTimeout(() => setLastHitMessage(null), 1400);

      if (currentTurn === 1) {
        setP1Score((prev) => {
          const next = prev + pointsWon;
          if (next >= WIN_TARGET && !isGameOverRef.current) {
            triggerVictory(1, next);
          }
          return next;
        });
      } else {
        setP2Score((prev) => {
          const next = prev + pointsWon;
          if (next >= WIN_TARGET && !isGameOverRef.current) {
            triggerVictory(2, next);
          }
          return next;
        });
      }

      // Check if all bottles broken, respawn new set
      setTimeout(() => {
        const remaining = bottlesRef.current.filter((b) => !b.isBroken);
        if (remaining.length === 0) {
          spawnInitialBottles();
        }
      }, 700);
    },
    [currentTurn, spawnInitialBottles]
  );

  const restartGame = () => {
    isGameOverRef.current = false;
    setP1Score(0);
    setP2Score(0);
    setVictoryWinner(null);
    shardsRef.current = [];
    pebbleRef.current = null;
    spawnInitialBottles();
  };

  // Main Canvas Render & Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;

      // Nostalgic Schoolyard Brick Wall & Wood Bench Background
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, width, height);

      // Red brick pattern at top
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 40, width, 140);
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
      ctx.lineWidth = 1.5;
      for (let y = 40; y < 180; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Wooden Bench Ledge where bottles stand
      ctx.fillStyle = '#78350f';
      ctx.fillRect(20, 180, width - 40, 18);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(20, 180, width - 40, 4);

      // Update Moving Bottles
      bottlesRef.current.forEach((b) => {
        if (!b.isBroken && b.vx) {
          b.x += b.vx;
          if (b.x < 380 || b.x > width - 80) {
            b.vx = -b.vx;
          }
        }
      });

      // Render Bottles
      bottlesRef.current.forEach((b) => {
        if (b.isBroken) return;

        ctx.save();
        // Bottle Drop Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(b.x + 3, 178, b.width, 4);

        if (b.type === 'bomb') {
          // Bomb body
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
          ctx.fill();

          // Spark fuse
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x + b.width / 2, b.y + 6);
          ctx.lineTo(b.x + b.width / 2 + 6, b.y - 4);
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(b.x + b.width / 2 + 7, b.y - 5, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('💣', b.x + b.width / 2, b.y + b.height / 2 + 3);
        } else {
          // Glass Bottle Shape: Neck + Body
          ctx.fillStyle = b.color;

          // Main body
          ctx.beginPath();
          ctx.roundRect(b.x, b.y + 22, b.width, b.height - 22, [0, 0, 4, 4]);
          ctx.fill();

          // Neck
          const neckWidth = b.width * 0.42;
          const neckX = b.x + (b.width - neckWidth) / 2;
          ctx.beginPath();
          ctx.roundRect(neckX, b.y, neckWidth, 22, [3, 3, 0, 0]);
          ctx.fill();

          // Glass Highlights
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.fillRect(b.x + 4, b.y + 24, 3, b.height - 28);

          // Crown Cap
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(neckX - 1, b.y, neckWidth + 2, 4);

          // Points Label on bottle
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`+${b.points}`, b.x + b.width / 2, b.y + 44);
        }

        ctx.restore();
      });

      // Update Pebble Physics
      if (pebbleRef.current && pebbleRef.current.active) {
        const pb = pebbleRef.current;
        pb.x += pb.vx;
        pb.y += pb.vy;
        pb.vy += 0.28; // Gravity

        // Check Collision with Bottles
        bottlesRef.current.forEach((bottle) => {
          if (bottle.isBroken) return;
          if (
            pb.x > bottle.x - 6 &&
            pb.x < bottle.x + bottle.width + 6 &&
            pb.y > bottle.y - 6 &&
            pb.y < bottle.y + bottle.height + 6
          ) {
            pb.active = false;
            handleBottleHit(bottle);
          }
        });

        // Check Boundaries
        if (pb.x < 0 || pb.x > width || pb.y > height) {
          pb.active = false;
        }

        // Render Pebble
        ctx.save();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(pb.x, pb.y, pb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Render Glass Shards
      shardsRef.current.forEach((sh) => {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.rotation);
        ctx.globalAlpha = sh.alpha;
        ctx.fillStyle = sh.color;

        ctx.beginPath();
        ctx.moveTo(0, -sh.size);
        ctx.lineTo(sh.size, sh.size);
        ctx.lineTo(-sh.size, sh.size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        sh.x += sh.vx;
        sh.y += sh.vy;
        sh.vy += 0.25;
        sh.rotation += sh.vRot;
        sh.alpha -= 0.02;
      });
      shardsRef.current = shardsRef.current.filter((sh) => sh.alpha > 0);

      // Render Guloti / Slingshot
      const originX = width / 2;
      const originY = 350;

      // Slingshot wooden Y-frame
      ctx.save();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Handle
      ctx.moveTo(originX, originY + 50);
      ctx.lineTo(originX, originY + 10);
      // Left fork
      ctx.lineTo(originX - 35, originY - 20);
      // Right fork
      ctx.moveTo(originX, originY + 10);
      ctx.lineTo(originX + 35, originY - 20);
      ctx.stroke();

      // Elastic rubber bands
      const pX = isPulling ? pullPos.x : originX;
      const pY = isPulling ? pullPos.y : originY;

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 4;
      // Band to left fork
      ctx.beginPath();
      ctx.moveTo(originX - 35, originY - 20);
      ctx.lineTo(pX, pY);
      ctx.stroke();

      // Band to right fork
      ctx.beginPath();
      ctx.moveTo(originX + 35, originY - 20);
      ctx.lineTo(pX, pY);
      ctx.stroke();

      // Leather pouch with pebble
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(pX, pY, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(pX, pY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Trajectory Aiming Guide when pulling
      if (isPulling) {
        const dx = originX - pX;
        const dy = originY - pY;
        const powerRatio = Math.min(Math.hypot(dx, dy) / 100, 1.0);

        ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);

        ctx.beginPath();
        let simX = originX;
        let simY = originY - 10;
        let simVx = dx * 0.22;
        let simVy = dy * 0.22;

        ctx.moveTo(simX, simY);
        for (let i = 0; i < 18; i++) {
          simX += simVx;
          simY += simVy;
          simVy += 0.28;
          ctx.lineTo(simX, simY);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPulling, pullPos, handleBottleHit]);

  // Pointer drag to shoot slingshot
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pebbleRef.current && pebbleRef.current.active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setIsPulling(true);
    setPullPos({ x, y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPulling) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setPullPos({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPulling) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }

    const originX = (canvas?.width || 600) / 2;
    const originY = 350;

    const dx = originX - pullPos.x;
    const dy = originY - pullPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 15) {
      // Fire pebble!
      const power = Math.min(dist / 100, 1.0);
      const speed = 18 * power;
      const angle = Math.atan2(dy, dx);

      pebbleRef.current = {
        x: originX,
        y: originY - 15,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 6,
        active: true,
      };

      sound.playPenFlick();
      sound.triggerHaptic(20);
    }

    setIsPulling(false);
    setPullPos({ x: originX, y: originY });
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
            {settings.language === 'bn' ? 'বোতল ভাঙ্গা খেলা (Bottle Smash)' : 'Bottle Smash'}
          </span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
            {settings.language === 'bn' ? '১০০ স্কোর = জয়' : '100 Pts = Win'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playPenClick();
              restartGame();
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

      {/* Mode Switcher Banner */}
      <div className="flex items-center justify-between py-2 px-3 bg-stone-900/80 rounded-2xl border border-stone-800 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playPenClick();
              setGameMode('solo');
              restartGame();
            }}
            className={`px-3 py-1 rounded-xl font-medium transition-all ${
              gameMode === 'solo'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            {settings.language === 'bn' ? 'একক মোড (Solo)' : 'Solo'}
          </button>
          <button
            onClick={() => {
              sound.playPenClick();
              setGameMode('two_player');
              restartGame();
            }}
            className={`px-3 py-1 rounded-xl font-medium transition-all ${
              gameMode === 'two_player'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'bg-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            {settings.language === 'bn' ? '১ বনাম ১ (Pass & Play)' : '1 vs 1'}
          </button>
        </div>

        {gameMode === 'two_player' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTurn(1)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] ${
                currentTurn === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-stone-400'
              }`}
            >
              প্লেয়ার ১: {p1Score}
            </button>
            <button
              onClick={() => setCurrentTurn(2)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] ${
                currentTurn === 2 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-stone-400'
              }`}
            >
              প্লেয়ার ২: {p2Score}
            </button>
          </div>
        )}
      </div>

      {/* Target Progress Bar */}
      <div className="mt-3 p-3 bg-stone-950/70 border border-stone-800 rounded-2xl flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-400 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {gameMode === 'solo'
                ? `${currentUser?.name || 'প্লেয়ার'}-এর স্কোর`
                : `প্লেয়ার ${currentTurn}-এর স্কোর`}
            </span>
          </span>
          <span className="font-mono font-bold text-amber-300 text-sm">
            {activeScore} / {WIN_TARGET}
          </span>
        </div>

        <div className="h-3 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-300 transition-all duration-300 rounded-full"
            style={{ width: `${Math.min((activeScore / WIN_TARGET) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Main Slingshot Play Area */}
      <div className="relative mt-3 flex-1 flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={430}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full max-w-[640px] h-[340px] sm:h-[430px] rounded-3xl border-2 border-stone-800 shadow-2xl touch-none cursor-crosshair select-none"
        />

        {/* Hit Toast Notification */}
        {lastHitMessage && (
          <div className="absolute top-6 px-4 py-1.5 rounded-full bg-amber-500 text-stone-950 font-bold text-xs shadow-lg animate-bounce">
            {lastHitMessage}
          </div>
        )}

        <div className="absolute bottom-4 left-4 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-xs border border-white/10 text-[10px] text-stone-300 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span>নস্টালজিক গুলতি শুটার</span>
        </div>
      </div>

      {/* Instructions footer */}
      <div className="mt-3 text-center text-xs text-stone-400">
        {settings.language === 'bn'
          ? 'গুলতির রাবার পেছনের দিকে টেনে লক্ষ্য স্থির করুন ও ছেড়ে দিন। ১০০ স্কোর করলেই পাবেন ১ জয় পয়েন্ট!'
          : 'Pull back slingshot rubber band, aim at bottles, and release! Reach 100 pts to win +1 match point!'}
      </div>

      {/* Bottom Bar: Idea 💡 Button & Level Progression */}
      <div className="mt-3 flex items-center justify-between py-2.5 px-4 bg-stone-900/90 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono text-xs">
            Lv {currentLevel}
          </div>
          <div>
            <div className="text-xs font-bold text-amber-200 font-handwriting">
              {settings.language === 'bn'
                ? getLevelDetails('bottle_smash', currentLevel).titleBn
                : getLevelDetails('bottle_smash', currentLevel).titleEn}
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
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all active:scale-95"
        >
          <Lightbulb className="w-4 h-4 fill-stone-950" />
          <span>{settings.language === 'bn' ? 'Idea 💡 বুদ্ধি' : 'Idea 💡 Advice'}</span>
        </button>
      </div>

      {/* Idea Modal */}
      {showIdea && (
        <IdeaModal
          gameKey="bottle_smash"
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
          matchTitle={settings.language === 'bn' ? 'বোতল ভাঙ্গা খেলা' : 'Bottle Smash'}
          scoreDetail={`${victoryWinner.score} / ${WIN_TARGET} স্কোর`}
          language={settings.language}
          onPlayAgain={restartGame}
          onBackHome={onBack}
        />
      )}
    </div>
  );
};
