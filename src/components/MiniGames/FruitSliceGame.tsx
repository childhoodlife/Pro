import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Volume2, Sparkles, HelpCircle, Trophy, Users, Zap, ShieldAlert, Lightbulb } from 'lucide-react';
import { sound } from '../../utils/audio';
import { voiceCoach } from '../../utils/voiceCoach';
import { Translations } from '../../utils/translations';
import { GameSettings } from '../../utils/storage';
import { recordGameResult } from '../../utils/deviceTracker';
import { getCurrentUser, awardMatchWinPoint } from '../../utils/authManager';
import { getGameLevel, advanceGameLevel, getLevelDetails } from '../../utils/levelManager';
import { PEN_SKINS } from '../../utils/skins';
import { VictoryModal } from '../VictoryModal';
import { IdeaModal } from '../IdeaModal';

interface FruitSliceGameProps {
  t: Translations;
  settings: GameSettings;
  onBack: () => void;
  onOpenRules: () => void;
  onOpenAITutorial?: () => void;
}

interface FlyingFruit {
  id: number;
  type: 'mango_green' | 'mango_ripe' | 'watermelon' | 'lychee' | 'guava' | 'pineapple' | 'bomb';
  nameBn: string;
  points: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  vRot: number;
  sliced: boolean;
  sliceAngle: number;
  color: string;
  innerColor: string;
  icon: string;
}

interface SliceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

export const FruitSliceGame: React.FC<FruitSliceGameProps> = ({
  t,
  settings,
  onBack,
  onOpenRules,
  onOpenAITutorial,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Setup / Mode: 'solo' or 'two_player' (1 vs 1 turn race)
  const [inSetup, setInSetup] = useState(false);
  const [gameMode, setGameMode] = useState<'solo' | 'two_player'>('solo');
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);

  // Level Progression: 1 - Unlimited
  const [currentLevel, setCurrentLevel] = useState<number>(() => getGameLevel('fruit_slice'));
  const [showIdea, setShowIdea] = useState(false);

  // Scores
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [comboToast, setComboToast] = useState<string | null>(null);

  // Victory State
  const [victoryWinner, setVictoryWinner] = useState<{
    name: string;
    score: number;
    pointsAwarded: number;
  } | null>(null);

  // Equipped Skin Trail
  const currentUser = getCurrentUser();
  const equippedSkin = PEN_SKINS.find((s) => s.id === currentUser?.equippedSkin) || PEN_SKINS[0];

  // Game internal refs
  const fruitsRef = useRef<FlyingFruit[]>([]);
  const particlesRef = useRef<SliceParticle[]>([]);
  const trailRef = useRef<TrailPoint[]>([]);
  const isPointerDownRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const nextSpawnTimeRef = useRef(Date.now() + 800);
  const isGameOverRef = useRef(false);

  const activeScore = currentTurn === 1 ? p1Score : p2Score;
  const WIN_TARGET = 100;

  // Speak voice instruction on mount
  useEffect(() => {
    if (settings.voiceCoach) {
      voiceCoach.speak(
        settings.language === 'bn'
          ? 'ফল কাটা খেলায় স্বাগতম! আঙুল দিয়ে ফল কেটে ১০০ পয়েন্ট করুন আর বিজয়ী হোন!'
          : 'Welcome to Fruit Slice! Slice school fruits and reach 100 points to win!',
        settings.language
      );
    }
  }, [settings.language, settings.voiceCoach]);

  const handleFruitSliced = useCallback(
    (fruit: FlyingFruit, sliceAngle: number) => {
      fruit.sliced = true;
      fruit.sliceAngle = sliceAngle;

      if (fruit.type === 'bomb') {
        // Bomb hit!
        sound.playPenFall();
        sound.triggerHaptic(50);
        if (currentTurn === 1) {
          setP1Score((s) => Math.max(0, s - 10));
        } else {
          setP2Score((s) => Math.max(0, s - 10));
        }
        setComboToast('বোমা আঘাত! -১০ পয়েন্ট!');
        setTimeout(() => setComboToast(null), 1500);

        // Explosion particles
        for (let i = 0; i < 20; i++) {
          particlesRef.current.push({
            x: fruit.x,
            y: fruit.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: '#ef4444',
            size: Math.random() * 4 + 2,
            alpha: 1.0,
          });
        }
        return;
      }

      // Fruit sliced
      sound.playLineDraw();
      sound.triggerHaptic(15);

      // Splatter particles
      for (let i = 0; i < 16; i++) {
        particlesRef.current.push({
          x: fruit.x,
          y: fruit.y,
          vx: (Math.random() - 0.5) * 7,
          vy: (Math.random() - 0.5) * 7,
          color: Math.random() > 0.4 ? fruit.innerColor : fruit.color,
          size: Math.random() * 5 + 3,
          alpha: 1.0,
        });
      }

      // Update score
      const awarded = fruit.points;
      if (currentTurn === 1) {
        setP1Score((prev) => {
          const next = prev + awarded;
          if (next >= WIN_TARGET && !isGameOverRef.current) {
            triggerVictory(1, next);
          }
          return next;
        });
      } else {
        setP2Score((prev) => {
          const next = prev + awarded;
          if (next >= WIN_TARGET && !isGameOverRef.current) {
            triggerVictory(2, next);
          }
          return next;
        });
      }
    },
    [currentTurn]
  );

  const triggerVictory = (winnerPlayer: 1 | 2, finalScore: number) => {
    isGameOverRef.current = true;
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    sound.playVictory();

    // Award +1 Match Point to account and advance level
    awardMatchWinPoint();
    recordGameResult('win');
    advanceGameLevel('fruit_slice');

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
          ? `অভিনন্দন ${winnerName}! ১০০ পয়েন্ট অর্জন করে ফল কাটায় বিজয়ী হয়েছেন!`
          : `Congratulations ${winnerName}! You reached 100 points in Fruit Slice!`,
        settings.language
      );
    }
  };

  const restartGame = () => {
    isGameOverRef.current = false;
    setP1Score(0);
    setP2Score(0);
    setComboCount(0);
    setVictoryWinner(null);
    fruitsRef.current = [];
    particlesRef.current = [];
    trailRef.current = [];
  };

  // Main Canvas Animation Loop
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

      // Dark nostalgic notebook schoolboard background
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, width, height);

      // Subtle ruled notebook lines
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 30; y < height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical red school margin line
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 0);
      ctx.lineTo(40, height);
      ctx.stroke();

      const now = Date.now();

      // Spawn Fruits
      if (!isGameOverRef.current && now > nextSpawnTimeRef.current) {
        const fruitTypes: Array<FlyingFruit['type']> = [
          'mango_green',
          'mango_ripe',
          'watermelon',
          'lychee',
          'guava',
          'pineapple',
          'bomb',
        ];
        // 12% chance for bomb
        const isBomb = Math.random() < 0.12;
        const selectedType = isBomb
          ? 'bomb'
          : fruitTypes[Math.floor(Math.random() * (fruitTypes.length - 1))];

        let nameBn = 'আম';
        let points = 10;
        let color = '#22c55e';
        let innerColor = '#facc15';
        let radius = 24;
        let icon = '🥭';

        if (selectedType === 'mango_green') {
          nameBn = 'কাঁচা আম';
          points = 6;
          color = '#65a30d';
          innerColor = '#d9f99d';
          radius = 22;
          icon = '🥭';
        } else if (selectedType === 'mango_ripe') {
          nameBn = 'পাকা মিষ্টি আম';
          points = 10;
          color = '#eab308';
          innerColor = '#fef08a';
          radius = 24;
          icon = '🥭';
        } else if (selectedType === 'watermelon') {
          nameBn = 'রসালো তরমুজ';
          points = 15;
          color = '#15803d';
          innerColor = '#ef4444';
          radius = 30;
          icon = '🍉';
        } else if (selectedType === 'lychee') {
          nameBn = 'মিষ্টি লিচু';
          points = 8;
          color = '#dc2626';
          innerColor = '#f8fafc';
          radius = 18;
          icon = '🍒';
        } else if (selectedType === 'guava') {
          nameBn = 'খাঁটি পেয়ারা';
          points = 7;
          color = '#4ade80';
          innerColor = '#fbcfe8';
          radius = 22;
          icon = '🍐';
        } else if (selectedType === 'pineapple') {
          nameBn = 'রসালো আনারস';
          points = 20;
          color = '#ca8a04';
          innerColor = '#fde047';
          radius = 28;
          icon = '🍍';
        } else if (selectedType === 'bomb') {
          nameBn = 'চক বোমা!';
          points = -10;
          color = '#475569';
          innerColor = '#ef4444';
          radius = 20;
          icon = '💣';
        }

        // Spawn from bottom arc
        const spawnX = Math.random() * (width - 120) + 60;
        const targetVx = (width / 2 - spawnX) * 0.015 + (Math.random() - 0.5) * 3;
        const targetVy = -(Math.random() * 3.5 + 10.5);

        fruitsRef.current.push({
          id: now + Math.random(),
          type: selectedType,
          nameBn,
          points,
          x: spawnX,
          y: height + 10,
          vx: targetVx,
          vy: targetVy,
          radius,
          rotation: 0,
          vRot: (Math.random() - 0.5) * 0.12,
          sliced: false,
          sliceAngle: 0,
          color,
          innerColor,
          icon,
        });

        // Next spawn random delay between 0.7s to 1.3s
        nextSpawnTimeRef.current = now + (Math.random() * 600 + 700);
      }

      // Physics Gravity for Fruits
      const gravity = 0.28;
      fruitsRef.current.forEach((f) => {
        f.x += f.vx;
        f.y += f.vy;
        f.vy += gravity;
        f.rotation += f.vRot;
      });

      // Remove fallen fruits below canvas
      fruitsRef.current = fruitsRef.current.filter((f) => f.y < height + 80);

      // Check Slicing against Trail
      if (trailRef.current.length >= 2 && !isGameOverRef.current) {
        const lastPt = trailRef.current[trailRef.current.length - 1];
        const prevPt = trailRef.current[trailRef.current.length - 2];

        fruitsRef.current.forEach((fruit) => {
          if (fruit.sliced) return;

          // Point to line segment distance
          const dx = lastPt.x - prevPt.x;
          const dy = lastPt.y - prevPt.y;
          const len = Math.hypot(dx, dy);
          if (len === 0) return;

          const u = ((fruit.x - prevPt.x) * dx + (fruit.y - prevPt.y) * dy) / (len * len);
          const clampedU = Math.max(0, Math.min(1, u));
          const nearestX = prevPt.x + clampedU * dx;
          const nearestY = prevPt.y + clampedU * dy;

          const dist = Math.hypot(fruit.x - nearestX, fruit.y - nearestY);
          if (dist < fruit.radius + 12) {
            const angle = Math.atan2(dy, dx);
            handleFruitSliced(fruit, angle);
          }
        });
      }

      // Render Fruits
      fruitsRef.current.forEach((f) => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);

        if (!f.sliced) {
          // Whole Fruit Outer Circle
          ctx.beginPath();
          ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
          ctx.fillStyle = f.color;
          ctx.fill();

          // Fruit inner pulp core
          ctx.beginPath();
          ctx.arc(0, 0, f.radius * 0.72, 0, Math.PI * 2);
          ctx.fillStyle = f.innerColor;
          ctx.fill();

          // Fruit emoji icon
          ctx.font = `${f.radius * 1.1}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(f.icon, 0, 1);
        } else {
          // Sliced into 2 halves drifting apart
          ctx.save();
          ctx.rotate(f.sliceAngle);

          // Top half
          ctx.beginPath();
          ctx.arc(0, -6, f.radius, Math.PI, Math.PI * 2);
          ctx.fillStyle = f.color;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, -6, f.radius * 0.7, Math.PI, Math.PI * 2);
          ctx.fillStyle = f.innerColor;
          ctx.fill();

          // Bottom half
          ctx.beginPath();
          ctx.arc(0, 6, f.radius, 0, Math.PI);
          ctx.fillStyle = f.color;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, 6, f.radius * 0.7, 0, Math.PI);
          ctx.fillStyle = f.innerColor;
          ctx.fill();

          ctx.restore();
        }

        ctx.restore();
      });

      // Render Particles
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.035;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0);

      // Render Blade / Pen Nib Ink Trail
      if (trailRef.current.length > 1) {
        ctx.save();
        for (let i = 1; i < trailRef.current.length; i++) {
          const pt1 = trailRef.current[i - 1];
          const pt2 = trailRef.current[i];
          const age = (now - pt2.time) / 300;
          if (age > 1) continue;

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.strokeStyle = equippedSkin.trailColor;
          ctx.lineWidth = (1 - age) * 6;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        ctx.restore();
      }

      // Purge old trail points
      trailRef.current = trailRef.current.filter((p) => now - p.time < 250);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [equippedSkin.trailColor, handleFruitSliced]);

  // Touch & Pointer Gesture Handling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    trailRef.current = [{ x, y, time: Date.now() }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    trailRef.current.push({ x, y, time: Date.now() });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }
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
            {settings.language === 'bn' ? 'ফল কাটা খেলা (Fruit Slice)' : 'Fruit Slice'}
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

      {/* Live 100-Point Target Progress Bar */}
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

        {/* Progress Fill */}
        <div className="h-3 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-300 transition-all duration-300 rounded-full"
            style={{ width: `${Math.min((activeScore / WIN_TARGET) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Main Slicing Play Area */}
      <div className="relative mt-3 flex-1 flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={420}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full max-w-[640px] h-[340px] sm:h-[420px] rounded-3xl border-2 border-stone-800 shadow-2xl touch-none cursor-crosshair select-none"
        />

        {/* Combo Toast Notification */}
        {comboToast && (
          <div className="absolute top-6 px-4 py-1.5 rounded-full bg-amber-500 text-stone-950 font-bold text-xs shadow-lg animate-bounce">
            {comboToast}
          </div>
        )}

        {/* Ink Blade Status */}
        <div className="absolute bottom-4 left-4 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-xs border border-white/10 text-[10px] text-stone-300 flex items-center gap-1.5">
          <span>কালির ব্লেড:</span>
          <div
            className="w-2.5 h-2.5 rounded-full border border-white/20"
            style={{ backgroundColor: equippedSkin.trailColor }}
          />
          <span className="font-semibold text-amber-300">{equippedSkin.name.bn}</span>
        </div>
      </div>

      {/* Instructions footer */}
      <div className="mt-3 text-center text-xs text-stone-400">
        {settings.language === 'bn'
          ? 'স্ক্রিনে আঙুল বা মাউস টেনে ফল কাটুন। চক বোমা এড়িয়ে চলুন। ১০০ স্কোর করলেই পাবেন ১ জয় পয়েন্ট!'
          : 'Slice fruits with finger swipes. Avoid chalk bombs. Reach 100 points to win +1 match point!'}
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
                ? getLevelDetails('fruit_slice', currentLevel).titleBn
                : getLevelDetails('fruit_slice', currentLevel).titleEn}
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
          gameKey="fruit_slice"
          level={currentLevel}
          language={settings.language}
          onClose={() => setShowIdea(false)}
          onOpenAIWithTutorial={onOpenAITutorial}
        />
      )}

      {/* Universal Victory Celebration Modal */}
      {victoryWinner && (
        <VictoryModal
          winnerName={victoryWinner.name}
          pointsAwarded={victoryWinner.pointsAwarded}
          totalPoints={getCurrentUser()?.points || 0}
          matchTitle={settings.language === 'bn' ? 'ফল কাটা খেলা' : 'Fruit Slice'}
          scoreDetail={`${victoryWinner.score} / ${WIN_TARGET} স্কোর`}
          language={settings.language}
          onPlayAgain={restartGame}
          onBackHome={onBack}
        />
      )}
    </div>
  );
};
