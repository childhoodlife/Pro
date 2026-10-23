import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, ShieldAlert, Sparkles, HelpCircle, Volume2, Wrench, Lightbulb } from 'lucide-react';
import { sound } from '../../utils/audio';
import { voiceCoach } from '../../utils/voiceCoach';
import { Translations } from '../../utils/translations';
import { GameSettings, recordPenFightWin } from '../../utils/storage';
import { recordGameResult } from '../../utils/deviceTracker';
import { getCurrentUser, awardMatchWinPoint } from '../../utils/authManager';
import { getGameLevel, advanceGameLevel, getLevelDetails } from '../../utils/levelManager';
import { PEN_SKINS } from '../../utils/skins';
import { IdeaModal } from '../IdeaModal';
import {
  PenArchetype,
  PEN_ARCHETYPES,
  PenEntity,
  PenMods,
  applyPenMods,
  checkPenCollision,
  resolveCollision,
} from './penPhysics';
import { PenGraphic } from './PenGraphic';

interface PenFightGameProps {
  t: Translations;
  settings: GameSettings;
  onBack: () => void;
  onOpenRules: () => void;
  onOpenAITutorial?: () => void;
}

export type PenFightMode = 'ringout' | 'durability';
export type OpponentType = 'two_player' | 'ai';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export const PenFightGame: React.FC<PenFightGameProps> = ({
  t,
  settings,
  onBack,
  onOpenRules,
  onOpenAITutorial,
}) => {
  // Setup State
  const [inSetup, setInSetup] = useState(true);
  const [opponentType, setOpponentType] = useState<OpponentType>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [gameMode, setGameMode] = useState<PenFightMode>('ringout');
  const [targetWins, setTargetWins] = useState<number>(3);

  // Level Progression: 1 - Unlimited
  const [currentLevel, setCurrentLevel] = useState<number>(() => getGameLevel('pen_fight'));
  const [showIdea, setShowIdea] = useState(false);

  // Pen Archetype & Custom Modifications
  const [p1Archetype, setP1Archetype] = useState<PenArchetype>(PEN_ARCHETYPES[0]);
  const [p2Archetype, setP2Archetype] = useState<PenArchetype>(PEN_ARCHETYPES[1]);
  const [p1Mods, setP1Mods] = useState<PenMods>({ capPos: 'cap_back', spring: 'normal', grip: 'bare' });
  const [p2Mods, setP2Mods] = useState<PenMods>({ capPos: 'cap_back', spring: 'normal', grip: 'bare' });

  // In-Game State
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [scores, setScores] = useState<{ p1: number; p2: number }>({ p1: 0, p2: 0 });
  const [roundNumber, setRoundNumber] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [roundWinner, setRoundWinner] = useState<1 | 2 | null>(null);
  const [matchWinner, setMatchWinner] = useState<1 | 2 | null>(null);
  const [knockoutReason, setKnockoutReason] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Desk Container Dimensions
  const deskRef = useRef<HTMLDivElement>(null);
  const [deskSize, setDeskSize] = useState({ width: 720, height: 480 });

  // Physics Pens State
  const p1Tuned = applyPenMods(p1Archetype, p1Mods);
  const p2Tuned = applyPenMods(p2Archetype, p2Mods);

  const pensRef = useRef<{ p1: PenEntity; p2: PenEntity }>({
    p1: {
      id: 1,
      x: 180,
      y: 240,
      angle: 0,
      vx: 0,
      vy: 0,
      vAngle: 0,
      mass: p1Tuned.mass,
      friction: p1Tuned.friction,
      maxPower: p1Tuned.maxPower,
      length: p1Archetype.length,
      width: p1Archetype.width,
      color: p1Archetype.defaultColor,
      capColor: p1Archetype.defaultCap,
      archetypeId: p1Archetype.id,
      mods: p1Mods,
      hp: 100,
      isFellOff: false,
      fallProgress: 0,
    },
    p2: {
      id: 2,
      x: 540,
      y: 240,
      angle: Math.PI,
      vx: 0,
      vy: 0,
      vAngle: 0,
      mass: p2Tuned.mass,
      friction: p2Tuned.friction,
      maxPower: p2Tuned.maxPower,
      length: p2Archetype.length,
      width: p2Archetype.width,
      color: p2Archetype.defaultColor,
      capColor: p2Archetype.defaultCap,
      archetypeId: p2Archetype.id,
      mods: p2Mods,
      hp: 100,
      isFellOff: false,
      fallProgress: 0,
    },
  });

  const [, setTick] = useState(0);

  // Slingshot Aiming Drag State
  const [dragState, setDragState] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    currX: number;
    currY: number;
    power: number;
    angle: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    currX: 0,
    currY: 0,
    power: 0,
    angle: 0,
  });

  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  const [shockwaves, setShockwaves] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);
  const [clashPops, setClashPops] = useState<Array<{ id: number; x: number; y: number; text: string }>>([]);
  const [newSkinUnlockedToast, setNewSkinUnlockedToast] = useState<string | null>(null);

  // Responsive Desk Resizing
  useEffect(() => {
    const updateSize = () => {
      if (deskRef.current) {
        const rect = deskRef.current.getBoundingClientRect();
        setDeskSize({
          width: Math.max(340, rect.width),
          height: Math.max(280, rect.height),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [inSetup]);

  // Reset pens to starting positions
  const resetPens = useCallback((w = deskSize.width, h = deskSize.height) => {
    const isMobile = w < 500;
    const tuned1 = applyPenMods(p1Archetype, p1Mods);
    const tuned2 = applyPenMods(p2Archetype, p2Mods);

    // Apply active user skin if unlocked & equipped
    const user = getCurrentUser();
    const activeSkin = PEN_SKINS.find((s) => s.id === user?.equippedSkin);
    const p1BarrelColor = activeSkin ? activeSkin.barrelColor : p1Archetype.defaultColor;
    const p1CapColor = activeSkin ? activeSkin.capColor : p1Archetype.defaultCap;

    if (isMobile) {
      pensRef.current = {
        p1: {
          id: 1,
          x: w / 2,
          y: h * 0.8,
          angle: -Math.PI / 2,
          vx: 0,
          vy: 0,
          vAngle: 0,
          mass: tuned1.mass,
          friction: tuned1.friction,
          maxPower: tuned1.maxPower,
          length: p1Archetype.length,
          width: p1Archetype.width,
          color: p1BarrelColor,
          capColor: p1CapColor,
          archetypeId: p1Archetype.id,
          mods: p1Mods,
          hp: 100,
          isFellOff: false,
          fallProgress: 0,
        },
        p2: {
          id: 2,
          x: w / 2,
          y: h * 0.2,
          angle: Math.PI / 2,
          vx: 0,
          vy: 0,
          vAngle: 0,
          mass: tuned2.mass,
          friction: tuned2.friction,
          maxPower: tuned2.maxPower,
          length: p2Archetype.length,
          width: p2Archetype.width,
          color: p2Archetype.defaultColor,
          capColor: p2Archetype.defaultCap,
          archetypeId: p2Archetype.id,
          mods: p2Mods,
          hp: 100,
          isFellOff: false,
          fallProgress: 0,
        },
      };
    } else {
      pensRef.current = {
        p1: {
          id: 1,
          x: w * 0.22,
          y: h / 2,
          angle: 0,
          vx: 0,
          vy: 0,
          vAngle: 0,
          mass: tuned1.mass,
          friction: tuned1.friction,
          maxPower: tuned1.maxPower,
          length: p1Archetype.length,
          width: p1Archetype.width,
          color: p1BarrelColor,
          capColor: p1CapColor,
          archetypeId: p1Archetype.id,
          mods: p1Mods,
          hp: 100,
          isFellOff: false,
          fallProgress: 0,
        },
        p2: {
          id: 2,
          x: w * 0.78,
          y: h / 2,
          angle: Math.PI,
          vx: 0,
          vy: 0,
          vAngle: 0,
          mass: tuned2.mass,
          friction: tuned2.friction,
          maxPower: tuned2.maxPower,
          length: p2Archetype.length,
          width: p2Archetype.width,
          color: p2Archetype.defaultColor,
          capColor: p2Archetype.defaultCap,
          archetypeId: p2Archetype.id,
          mods: p2Mods,
          hp: 100,
          isFellOff: false,
          fallProgress: 0,
        },
      };
    }
    setRoundWinner(null);
    setKnockoutReason('');
    setIsSimulating(false);
    setTick((t) => t + 1);
  }, [deskSize, p1Archetype, p2Archetype, p1Mods, p2Mods]);

  // Start game from setup
  const startGame = () => {
    setInSetup(false);
    setScores({ p1: 0, p2: 0 });
    setRoundNumber(1);
    setCurrentTurn(1);
    setMatchWinner(null);
    sound.playPenClick();
    voiceCoach.announceEvent('game_start', settings.language);
    setTimeout(() => resetPens(), 50);
  };

  const nextRound = () => {
    setRoundNumber((r) => r + 1);
    resetPens();
    setCurrentTurn((prev) => (prev === 1 ? 2 : 1));
  };

  const restartMatch = () => {
    setScores({ p1: 0, p2: 0 });
    setRoundNumber(1);
    setMatchWinner(null);
    setCurrentTurn(1);
    resetPens();
    voiceCoach.announceEvent('game_start', settings.language);
  };

  // Physics animation frame loop
  useEffect(() => {
    if (!isSimulating || inSetup) return;

    let animId: number;
    const deskW = deskSize.width;
    const deskH = deskSize.height;
    const deskMargin = 30;

    const step = () => {
      const { p1, p2 } = pensRef.current;
      let motionRemaining = false;

      [p1, p2].forEach((pen) => {
        if (pen.isFellOff) {
          if (pen.fallProgress < 1) {
            pen.fallProgress += 0.05;
            motionRemaining = true;
          }
          return;
        }

        const speed = Math.hypot(pen.vx, pen.vy);
        if (speed > 0.1 || Math.abs(pen.vAngle) > 0.01) {
          motionRemaining = true;

          pen.x += pen.vx;
          pen.y += pen.vy;
          pen.angle += pen.vAngle;

          pen.vx *= pen.friction;
          pen.vy *= pen.friction;
          pen.vAngle *= 0.94;

          // Check if dangerously close to edge
          if (
            (pen.x < deskMargin + 18 || pen.x > deskW - deskMargin - 18 ||
             pen.y < deskMargin + 18 || pen.y > deskH - deskMargin - 18) &&
            Math.random() < 0.02
          ) {
            voiceCoach.announceEvent('near_edge', settings.language);
          }

          if (gameMode === 'ringout') {
            const outLeft = pen.x < deskMargin;
            const outRight = pen.x > deskW - deskMargin;
            const outTop = pen.y < deskMargin;
            const outBottom = pen.y > deskH - deskMargin;

            if (outLeft || outRight || outTop || outBottom) {
              pen.isFellOff = true;
              sound.playFallOffDesk();
              voiceCoach.announceEvent('ringout', settings.language);
              const loser = pen.id;
              const winner = loser === 1 ? 2 : 1;
              const loserName = loser === 1 ? settings.player1Name : (opponentType === 'ai' ? 'Computer AI' : settings.player2Name);

              setKnockoutReason(`${loserName} ${t.penFight.fellOffDesk}`);
              handleRoundWin(winner, true);
            }
          } else {
            if (pen.x < deskMargin + pen.width) {
              pen.x = deskMargin + pen.width;
              pen.vx = -pen.vx * 0.7;
              sound.playCollisionSound(0.3);
            } else if (pen.x > deskW - deskMargin - pen.width) {
              pen.x = deskW - deskMargin - pen.width;
              pen.vx = -pen.vx * 0.7;
              sound.playCollisionSound(0.3);
            }
            if (pen.y < deskMargin + pen.width) {
              pen.y = deskMargin + pen.width;
              pen.vy = -pen.vy * 0.7;
              sound.playCollisionSound(0.3);
            } else if (pen.y > deskH - deskMargin - pen.width) {
              pen.y = deskH - deskMargin - pen.width;
              pen.vy = -pen.vy * 0.7;
              sound.playCollisionSound(0.3);
            }
          }
        } else {
          pen.vx = 0;
          pen.vy = 0;
          pen.vAngle = 0;
        }
      });

      // Pen-to-pen collision
      if (!p1.isFellOff && !p2.isFellOff) {
        const col = checkPenCollision(p1, p2);
        if (col.collided) {
          const impactSpeed = Math.hypot(p1.vx - p2.vx, p1.vy - p2.vy);
          resolveCollision(p1, p2, col.normalX, col.normalY, col.overlap);

          sound.playCollisionSound(Math.min(1.0, impactSpeed / 15));
          sound.triggerHaptic(30);

          const sparkX = (p1.x + p2.x) / 2;
          const sparkY = (p1.y + p2.y) / 2;
          const newParticles = Array.from({ length: 8 }).map((_, i) => ({
            id: Date.now() + i,
            x: sparkX + (Math.random() - 0.5) * 26,
            y: sparkY + (Math.random() - 0.5) * 26,
            color: Math.random() > 0.5 ? p1.color : p2.color,
          }));
          setParticles((prev) => [...prev.slice(-16), ...newParticles]);

          // Shockwave hit ring animation
          const shockId = Date.now();
          setShockwaves((prev) => [
            ...prev.slice(-3),
            { id: shockId, x: sparkX, y: sparkY, color: p1.color },
          ]);
          setTimeout(() => {
            setShockwaves((prev) => prev.filter((s) => s.id !== shockId));
          }, 600);

          // Comic clash popup on heavy hit
          if (impactSpeed > 3) {
            const bangWords = settings.language === 'bn' ? ['ধুম!', 'ঠাস!', 'টক্কর!', 'বুম!'] : ['CLASH!', 'WHAM!', 'BOOM!', 'POW!'];
            const randomWord = bangWords[Math.floor(Math.random() * bangWords.length)];
            setClashPops((prev) => [
              ...prev.slice(-2),
              { id: shockId, x: sparkX, y: sparkY - 20, text: randomWord },
            ]);
            setTimeout(() => {
              setClashPops((prev) => prev.filter((c) => c.id !== shockId));
            }, 800);
          }

          if (gameMode === 'durability') {
            const damage = Math.floor(impactSpeed * 5);
            p1.hp = Math.max(0, p1.hp - damage);
            p2.hp = Math.max(0, p2.hp - damage);

            if (p1.hp <= 0 && p2.hp <= 0) {
              setKnockoutReason('Double Knockout!');
              handleRoundWin(1, false);
            } else if (p1.hp <= 0) {
              setKnockoutReason(`${settings.player1Name}'s pen ran out of ink!`);
              handleRoundWin(2, false);
            } else if (p2.hp <= 0) {
              const p2Name = opponentType === 'ai' ? 'Computer AI' : settings.player2Name;
              setKnockoutReason(`${p2Name}'s pen ran out of ink!`);
              handleRoundWin(1, false);
            }
          }
        }
      }

      setTick((t) => t + 1);

      if (motionRemaining) {
        animId = requestAnimationFrame(step);
      } else {
        setIsSimulating(false);
        if (!p1.isFellOff && !p2.isFellOff && !roundWinner) {
          setCurrentTurn((prev) => (prev === 1 ? 2 : 1));
        }
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, inSetup, deskSize, gameMode, roundWinner, opponentType, settings, t]);

  const handleRoundWin = useCallback((winner: 1 | 2, wasRingout: boolean) => {
    setRoundWinner(winner);
    setIsSimulating(false);

    setScores((prev) => {
      const nextP1 = winner === 1 ? prev.p1 + 1 : prev.p1;
      const nextP2 = winner === 2 ? prev.p2 + 1 : prev.p2;

      if (nextP1 >= targetWins || nextP2 >= targetWins) {
        const finalWinner = nextP1 >= targetWins ? 1 : 2;
        setMatchWinner(finalWinner);
        recordPenFightWin(finalWinner, wasRingout);

        if (finalWinner === 1) {
          recordGameResult('win');
          // Award +1 Match Point to account and advance level
          advanceGameLevel('pen_fight');
          const award = awardMatchWinPoint();
          if (award.newUnlock) {
            const unlocked = PEN_SKINS.find((s) => s.id === award.newUnlock);
            const skinName = unlocked ? (settings.language === 'bn' ? unlocked.name.bn : unlocked.name.en) : award.newUnlock;
            setNewSkinUnlockedToast(skinName);
            voiceCoach.speak(
              settings.language === 'bn' ? `অভিনন্দন! নতুন স্কিন আনলক হয়েছে: ${skinName}!` : `Congrats! New skin unlocked: ${skinName}!`,
              settings.language
            );
          }
        } else if (opponentType === 'ai') {
          recordGameResult('loss');
        } else {
          recordGameResult('win');
        }
        sound.playVictoryBell();
        voiceCoach.announceEvent('win_match', settings.language);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      } else {
        sound.playBoxComplete();
      }

      return { p1: nextP1, p2: nextP2 };
    });
  }, [targetWins, settings.language, opponentType]);

  const executeFlick = useCallback((penId: 1 | 2, power: number, angle: number) => {
    const pen = penId === 1 ? pensRef.current.p1 : pensRef.current.p2;
    const flickSpeed = (power / 100) * pen.maxPower;

    pen.vx = Math.cos(angle) * flickSpeed;
    pen.vy = Math.sin(angle) * flickSpeed;
    pen.vAngle = (Math.random() - 0.5) * 0.16 * (power / 50);

    sound.playFlickSound(power / 100);
    setIsSimulating(true);
  }, []);

  // AI Turn Logic
  useEffect(() => {
    if (inSetup || isSimulating || roundWinner || matchWinner) return;
    if (opponentType === 'ai' && currentTurn === 2) {
      setIsAiThinking(true);

      const aiTimer = setTimeout(() => {
        const { p1, p2 } = pensRef.current;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        let baseAngle = Math.atan2(dy, dx);
        const dist = Math.hypot(dx, dy);

        let power = Math.min(100, Math.max(35, (dist / deskSize.width) * 110));
        let angleError = 0;

        if (aiDifficulty === 'easy') {
          angleError = (Math.random() - 0.5) * 0.7;
          power = Math.max(30, power * (0.6 + Math.random() * 0.5));
        } else if (aiDifficulty === 'medium') {
          angleError = (Math.random() - 0.5) * 0.25;
          power = Math.min(95, power * (0.85 + Math.random() * 0.3));
        } else {
          angleError = (Math.random() - 0.5) * 0.08;
          power = Math.min(100, power * 1.15 + 15);
        }

        const finalAngle = baseAngle + angleError;
        setIsAiThinking(false);
        executeFlick(2, power, finalAngle);
      }, 1050);

      return () => clearTimeout(aiTimer);
    }
  }, [currentTurn, inSetup, isSimulating, opponentType, aiDifficulty, roundWinner, matchWinner, deskSize, executeFlick]);

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (inSetup || isSimulating || roundWinner || matchWinner) return;
    if (opponentType === 'ai' && currentTurn === 2) return;

    const rect = deskRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const activePen = currentTurn === 1 ? pensRef.current.p1 : pensRef.current.p2;

    const dist = Math.hypot(clientX - activePen.x, clientY - activePen.y);
    if (dist < 75) {
      sound.playPenClick();
      setDragState({
        active: true,
        startX: activePen.x,
        startY: activePen.y,
        currX: clientX,
        currY: clientY,
        power: 0,
        angle: 0,
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.active) return;
    const rect = deskRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const pullX = dragState.startX - clientX;
    const pullY = dragState.startY - clientY;
    const pullDist = Math.hypot(pullX, pullY);

    const maxPull = 140;
    const power = Math.min(100, Math.round((pullDist / maxPull) * 100));
    const angle = Math.atan2(pullY, pullX);

    setDragState((prev) => ({
      ...prev,
      currX: clientX,
      currY: clientY,
      power,
      angle,
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState.active) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const { power, angle } = dragState;
    setDragState({
      active: false,
      startX: 0,
      startY: 0,
      currX: 0,
      currY: 0,
      power: 0,
      angle: 0,
    });

    if (power > 12) {
      executeFlick(currentTurn, power, angle);
    }
  };

  // Listen to spoken rules
  const handleListenRules = () => {
    sound.playPenClick();
    voiceCoach.readRules('pen_fight', settings.language);
  };

  // Setup / Pen Selection Screen
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
              onClick={handleListenRules}
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
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-amber-100 font-handwriting tracking-wide">
            {t.penFightTitle}
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            {t.penFightSub}
          </p>
        </div>

        {/* Game Mode & AI Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider block mb-3">
              {t.gameModes}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOpponentType('ai')}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  opponentType === 'ai'
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-md'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {t.practiceAI}
              </button>
              <button
                onClick={() => setOpponentType('two_player')}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  opponentType === 'two_player'
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-md'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {t.twoPlayer}
              </button>
            </div>

            {opponentType === 'ai' && (
              <div className="mt-4 pt-4 border-t border-stone-800">
                <span className="text-xs text-stone-400 block mb-2">AI Difficulty:</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setAiDifficulty(diff)}
                      className={`py-2 px-2 text-xs rounded-lg transition-all ${
                        aiDifficulty === diff
                          ? 'bg-amber-600 text-white font-semibold'
                          : 'bg-stone-800/80 text-stone-400 hover:text-white'
                      }`}
                    >
                      {t.difficulties[diff]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider block mb-3">
              {t.penFight.targetScore}
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 3, 5].map((target) => (
                <button
                  key={target}
                  onClick={() => setTargetWins(target)}
                  className={`py-3 px-3 rounded-xl text-sm font-medium transition-all ${
                    targetWins === target
                      ? 'bg-amber-500 text-stone-950 font-semibold shadow-md'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {target} {target === 1 ? 'Win' : 'Wins'}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-800">
              <span className="text-xs text-stone-400 block mb-2">Play Style:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGameMode('ringout')}
                  className={`py-2 px-3 text-xs rounded-lg transition-all ${
                    gameMode === 'ringout'
                      ? 'bg-stone-700 text-white font-medium border border-amber-400/50'
                      : 'bg-stone-800/80 text-stone-400'
                  }`}
                >
                  {t.penFight.modeDeskKnockout}
                </button>
                <button
                  onClick={() => setGameMode('durability')}
                  className={`py-2 px-3 text-xs rounded-lg transition-all ${
                    gameMode === 'durability'
                      ? 'bg-stone-700 text-white font-medium border border-amber-400/50'
                      : 'bg-stone-800/80 text-stone-400'
                  }`}
                >
                  {t.penFight.modeInkDurability}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Unique Pen Selection & Tuning Modifications */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl mb-6">
          <h2 className="text-base font-semibold text-amber-200 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>{t.penFight.choosePen} &amp; {t.penFight.penMods}</span>
            </div>
            <span className="text-[11px] font-normal text-amber-400/80 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              ইউনিক টিউনিং
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player 1 Pen Tuning */}
            <div className="border border-stone-800 bg-stone-950/60 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-blue-400">{settings.player1Name}</span>
                <span className="text-xs text-stone-400 font-mono">P1 Pen</span>
              </div>

              {/* Archetype list */}
              <div className="space-y-2 mb-4">
                {PEN_ARCHETYPES.map((arch) => (
                  <button
                    key={arch.id}
                    onClick={() => setP1Archetype(arch)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                      p1Archetype.id === arch.id
                        ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                        : 'border-stone-800 bg-stone-900/50 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-semibold text-stone-200 text-xs">
                      {settings.language === 'bn' ? arch.name.bn : arch.name.en}
                    </div>
                  </button>
                ))}
              </div>

              {/* P1 Modifications */}
              <div className="pt-3 border-t border-stone-800/80 space-y-2.5">
                <div>
                  <span className="text-[11px] text-stone-400 block mb-1">{t.penFight.capPosition}:</span>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <button
                      onClick={() => setP1Mods((m) => ({ ...m, capPos: 'cap_back' }))}
                      className={`p-1.5 rounded border ${p1Mods.capPos === 'cap_back' ? 'border-blue-400 bg-blue-900/40 text-white' : 'border-stone-800 text-stone-400'}`}
                    >
                      {t.penFight.caps.back}
                    </button>
                    <button
                      onClick={() => setP1Mods((m) => ({ ...m, capPos: 'cap_front' }))}
                      className={`p-1.5 rounded border ${p1Mods.capPos === 'cap_front' ? 'border-blue-400 bg-blue-900/40 text-white' : 'border-stone-800 text-stone-400'}`}
                    >
                      {t.penFight.caps.front}
                    </button>
                    <button
                      onClick={() => setP1Mods((m) => ({ ...m, capPos: 'no_cap' }))}
                      className={`p-1.5 rounded border ${p1Mods.capPos === 'no_cap' ? 'border-blue-400 bg-blue-900/40 text-white' : 'border-stone-800 text-stone-400'}`}
                    >
                      {t.penFight.caps.none}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setP1Mods((m) => ({ ...m, spring: m.spring === 'normal' ? 'tightened' : 'normal' }))}
                    className={`flex-1 p-2 rounded text-[11px] border ${p1Mods.spring === 'tightened' ? 'border-amber-400 bg-amber-950/40 text-amber-200' : 'border-stone-800 text-stone-400'}`}
                  >
                    ⚡ {p1Mods.spring === 'tightened' ? t.penFight.springs.tight : t.penFight.springs.normal}
                  </button>
                  <button
                    onClick={() => setP1Mods((m) => ({ ...m, grip: m.grip === 'bare' ? 'rubber_band' : 'bare' }))}
                    className={`flex-1 p-2 rounded text-[11px] border ${p1Mods.grip === 'rubber_band' ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200' : 'border-stone-800 text-stone-400'}`}
                  >
                    🌀 {p1Mods.grip === 'rubber_band' ? t.penFight.grips.rubber : t.penFight.grips.bare}
                  </button>
                </div>
              </div>
            </div>

            {/* Player 2 Pen Tuning */}
            <div className="border border-stone-800 bg-stone-950/60 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-red-400">
                  {opponentType === 'ai' ? 'Computer AI Pen' : settings.player2Name}
                </span>
                <span className="text-xs text-stone-400 font-mono">P2 Pen</span>
              </div>

              <div className="space-y-2 mb-4">
                {PEN_ARCHETYPES.map((arch) => (
                  <button
                    key={arch.id}
                    onClick={() => setP2Archetype(arch)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                      p2Archetype.id === arch.id
                        ? 'border-red-500 bg-red-950/40 text-red-200'
                        : 'border-stone-800 bg-stone-900/50 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="font-semibold text-stone-200 text-xs">
                      {settings.language === 'bn' ? arch.name.bn : arch.name.en}
                    </div>
                  </button>
                ))}
              </div>

              {/* P2 Modifications */}
              <div className="pt-3 border-t border-stone-800/80 space-y-2.5">
                <div>
                  <span className="text-[11px] text-stone-400 block mb-1">{t.penFight.capPosition}:</span>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <button
                      onClick={() => setP2Mods((m) => ({ ...m, capPos: 'cap_back' }))}
                      className={`p-1.5 rounded border ${p2Mods.capPos === 'cap_back' ? 'border-red-400 bg-red-900/40 text-white' : 'border-stone-800 text-stone-400'}`}
                    >
                      {t.penFight.caps.back}
                    </button>
                    <button
                      onClick={() => setP2Mods((m) => ({ ...m, capPos: 'cap_front' }))}
                      className={`p-1.5 rounded border ${p2Mods.capPos === 'cap_front' ? 'border-red-400 bg-red-900/40 text-white' : 'border-stone-800 text-stone-400'}`}
                    >
                      {t.penFight.caps.front}
                    </button>
                    <button
                      onClick={() => setP2Mods((m) => ({ ...m, capPos: 'no_cap' }))}
                      className={`p-1.5 rounded border ${p2Mods.capPos === 'no_cap' ? 'border-red-400 bg-red-900/40 text-white' : 'border-stone-800 text-stone-400'}`}
                    >
                      {t.penFight.caps.none}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setP2Mods((m) => ({ ...m, spring: m.spring === 'normal' ? 'tightened' : 'normal' }))}
                    className={`flex-1 p-2 rounded text-[11px] border ${p2Mods.spring === 'tightened' ? 'border-amber-400 bg-amber-950/40 text-amber-200' : 'border-stone-800 text-stone-400'}`}
                  >
                    ⚡ {p2Mods.spring === 'tightened' ? t.penFight.springs.tight : t.penFight.springs.normal}
                  </button>
                  <button
                    onClick={() => setP2Mods((m) => ({ ...m, grip: m.grip === 'bare' ? 'rubber_band' : 'bare' }))}
                    className={`flex-1 p-2 rounded text-[11px] border ${p2Mods.grip === 'rubber_band' ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200' : 'border-stone-800 text-stone-400'}`}
                  >
                    🌀 {p2Mods.grip === 'rubber_band' ? t.penFight.grips.rubber : t.penFight.grips.bare}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Big Start Button */}
        <button
          onClick={startGame}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-lg shadow-lg active:scale-[0.99] transition-all tracking-wide"
        >
          {t.playNow}
        </button>
      </div>
    );
  }

  // Active Desk Tabletop Arena
  const p1 = pensRef.current.p1;
  const p2 = pensRef.current.p2;
  const activePen = currentTurn === 1 ? p1 : p2;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-5xl mx-auto p-2 md:p-4 select-none">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-stone-900/90 border border-stone-800/90 rounded-2xl px-4 py-2.5 mb-2 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow" />
          <div>
            <div className="text-xs font-semibold text-blue-300 leading-tight">
              {settings.player1Name}
            </div>
            <div className="text-xl font-bold font-mono text-white leading-none">
              {scores.p1}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-[11px] text-stone-400 font-mono">
            {t.penFight.round} {roundNumber} · {t.penFight.targetScore} {targetWins}
          </div>
          <div className="text-xs font-bold mt-0.5">
            {isAiThinking ? (
              <span className="text-amber-400 animate-pulse">{t.penFight.aiTurn}</span>
            ) : currentTurn === 1 ? (
              <span className="text-blue-400 font-semibold">{t.penFight.p1Turn}</span>
            ) : (
              <span className="text-red-400 font-semibold">
                {opponentType === 'ai' ? 'Computer Turn' : t.penFight.p2Turn}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            <div className="text-xs font-semibold text-red-300 leading-tight">
              {opponentType === 'ai' ? 'Computer AI' : settings.player2Name}
            </div>
            <div className="text-xl font-bold font-mono text-white leading-none">
              {scores.p2}
            </div>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow" />
        </div>
      </div>

      {/* Main Tabletop Wooden Desk Arena */}
      <div
        ref={deskRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex-1 rounded-2xl overflow-hidden cursor-crosshair shadow-2xl border-4 border-amber-950/80 touch-none bg-wood-desk"
        style={{
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.7), 0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="absolute inset-7 border-2 border-dashed border-amber-200/25 pointer-events-none rounded-xl"
          style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)' }}
        >
          <div className="absolute top-4 left-4 text-amber-200/20 text-xs font-handwriting rotate-[-6deg]">
            ★ CHILDHOOD LIFE ★
          </div>
          <div className="absolute bottom-4 right-4 text-amber-200/20 text-xs font-handwriting rotate-[4deg]">
            PEN FIGHT CHAMPION
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-200/10 text-2xl font-handwriting select-none">
            {settings.language === 'bn' ? 'শৈশবের কলম যুদ্ধ' : 'PEN FIGHT ARENA'}
          </div>
        </div>

        {/* Slingshot Trajectory line */}
        {dragState.active && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <polygon points="0 0, 8 4, 0 8" fill={activePen.color} />
              </marker>
            </defs>
            <line
              x1={dragState.startX}
              y1={dragState.startY}
              x2={dragState.currX}
              y2={dragState.currY}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <line
              x1={dragState.startX}
              y1={dragState.startY}
              x2={dragState.startX + Math.cos(dragState.angle) * (dragState.power * 1.5)}
              y2={dragState.startY + Math.sin(dragState.angle) * (dragState.power * 1.5)}
              stroke={activePen.color}
              strokeWidth="3.5"
              markerEnd="url(#arrowhead)"
            />
          </svg>
        )}

        {/* Power meter */}
        {dragState.active && (
          <div
            className="absolute z-40 bg-stone-900/90 text-white text-xs font-mono px-2.5 py-1 rounded-md border border-stone-700 pointer-events-none shadow-lg -translate-x-1/2 -translate-y-12"
            style={{
              left: `${dragState.startX}px`,
              top: `${dragState.startY}px`,
            }}
          >
            {t.penFight.power}: {dragState.power}%
          </div>
        )}

        {/* Sparks */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-2.5 h-2.5 rounded-full pointer-events-none animate-ping"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              backgroundColor: p.color,
            }}
          />
        ))}

        {/* Shockwave Hit Rings */}
        {shockwaves.map((s) => (
          <div
            key={s.id}
            className="absolute pointer-events-none rounded-full border-4 animate-ping z-30"
            style={{
              left: `${s.x}px`,
              top: `${s.y}px`,
              borderColor: s.color,
              width: '70px',
              height: '70px',
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 25px ${s.color}`,
            }}
          />
        ))}

        {/* Comic Clash Text Popups */}
        {clashPops.map((c) => (
          <div
            key={c.id}
            className="absolute pointer-events-none z-40 font-black text-sm text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-bounce font-mono -translate-x-1/2 -translate-y-1/2 bg-stone-950/85 px-2.5 py-1 rounded-lg border border-amber-400/80 shadow-xl"
            style={{ left: `${c.x}px`, top: `${c.y}px` }}
          >
            💥 {c.text}
          </div>
        ))}

        {/* New Skin Unlock Notification Toast */}
        {newSkinUnlockedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce border-2 border-white">
            <Sparkles className="w-5 h-5 text-stone-950 animate-spin" />
            <span className="text-xs sm:text-sm">
              🎉 {settings.language === 'bn' ? `নতুন স্কিন আনলক: ${newSkinUnlockedToast}` : `New Skin Unlocked: ${newSkinUnlockedToast}`}
            </span>
          </div>
        )}

        {/* Render Pens */}
        <PenGraphic
          pen={p1}
          isTurn={currentTurn === 1 && !isSimulating}
          isDragging={dragState.active && currentTurn === 1}
        />
        <PenGraphic
          pen={p2}
          isTurn={currentTurn === 2 && !isSimulating}
          isDragging={dragState.active && currentTurn === 2}
        />

        {/* Round Winner Overlay */}
        {roundWinner && !matchWinner && (
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-700 rounded-2xl p-6 text-center max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="text-3xl mb-2">{roundWinner === 1 ? '🎯' : '💥'}</div>
              <h3 className="text-xl font-bold text-white font-handwriting">
                {roundWinner === 1 ? settings.player1Name : (opponentType === 'ai' ? 'Computer AI' : settings.player2Name)} Wins Round {roundNumber}!
              </h3>
              {knockoutReason && (
                <p className="text-amber-300 text-xs mt-1.5 font-medium">{knockoutReason}</p>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={nextRound}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow transition-all"
                >
                  {t.penFight.playAgain}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Match Finished Victory Modal */}
        {matchWinner && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-stone-900 border-2 border-amber-500/80 rounded-3xl p-6 md:p-8 text-center max-w-md w-full shadow-2xl">
              <div className="text-4xl mb-3">🏆</div>
              <h2 className="text-2xl md:text-3xl font-bold text-amber-100 font-handwriting">
                {matchWinner === 1 ? settings.player1Name : (opponentType === 'ai' ? 'Computer AI' : settings.player2Name)}
              </h2>
              <p className="text-amber-400 font-semibold text-sm mt-1">
                {t.penFight.winsMatch}
              </p>
              <div className="my-6 p-4 rounded-xl bg-stone-950/60 border border-stone-800 flex justify-around font-mono">
                <div>
                  <div className="text-xs text-stone-400">{settings.player1Name}</div>
                  <div className="text-2xl font-bold text-blue-400">{scores.p1}</div>
                </div>
                <div className="text-stone-600 text-2xl font-light">vs</div>
                <div>
                  <div className="text-xs text-stone-400">{opponentType === 'ai' ? 'Computer' : settings.player2Name}</div>
                  <div className="text-2xl font-bold text-red-400">{scores.p2}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={restartMatch}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow transition-all"
                >
                  {t.penFight.rematch}
                </button>
                <button
                  onClick={() => setInSetup(true)}
                  className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-sm transition-all"
                >
                  {t.penFight.choosePen} &amp; {t.penFight.penMods}
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
                ? getLevelDetails('pen_fight', currentLevel).titleBn
                : getLevelDetails('pen_fight', currentLevel).titleEn}
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
            onClick={() => resetPens()}
            disabled={isSimulating}
            className="flex items-center gap-1 text-stone-300 hover:text-white text-xs font-medium py-1.5 px-3 rounded-xl bg-stone-800 border border-stone-700 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Idea Modal */}
      {showIdea && (
        <IdeaModal
          gameKey="pen_fight"
          level={currentLevel}
          language={settings.language}
          onClose={() => setShowIdea(false)}
          onOpenAIWithTutorial={onOpenAITutorial}
        />
      )}
    </div>
  );
};
