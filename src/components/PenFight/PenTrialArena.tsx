import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, RotateCcw, Sparkles, Check, Gauge, Shield, Zap, Volume2 } from 'lucide-react';
import { PenSkin } from '../../utils/skins';
import { sound } from '../../utils/audio';

interface PenTrialArenaProps {
  skin: PenSkin;
  onClose: () => void;
  onEquip?: () => void;
  isEquipped?: boolean;
  canEquip?: boolean;
  language: 'en' | 'bn';
}

interface TrialPen {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // in radians
  width: number;
  length: number;
  color: string;
  capColor: string;
  isPlayer: boolean;
  isFallen: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export const PenTrialArena: React.FC<PenTrialArenaProps> = ({
  skin,
  onClose,
  onEquip,
  isEquipped = false,
  canEquip = false,
  language,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Drag aiming state
  const [isAiming, setIsAiming] = useState(false);
  const [aimStart, setAimStart] = useState<{ x: number; y: number } | null>(null);
  const [aimCurrent, setAimCurrent] = useState<{ x: number; y: number } | null>(null);
  const [aimPower, setAimPower] = useState(0);

  // Feedback display
  const [lastClashImpact, setLastClashImpact] = useState<number | null>(null);
  const [shotsCount, setShotsCount] = useState(0);
  const [dummiesKnocked, setDummiesKnocked] = useState(0);

  // Entities in simulation
  const playerPenRef = useRef<TrialPen>({
    x: 120,
    y: 200,
    vx: 0,
    vy: 0,
    angle: 0,
    width: 14,
    length: 80,
    color: skin.barrelColor,
    capColor: skin.capColor,
    isPlayer: true,
    isFallen: false,
  });

  const dummyPensRef = useRef<TrialPen[]>([
    {
      x: 340,
      y: 150,
      vx: 0,
      vy: 0,
      angle: Math.PI / 4,
      width: 13,
      length: 75,
      color: '#64748b',
      capColor: '#334155',
      isPlayer: false,
      isFallen: false,
    },
    {
      x: 380,
      y: 260,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 6,
      width: 13,
      length: 75,
      color: '#a1a1aa',
      capColor: '#71717a',
      isPlayer: false,
      isFallen: false,
    },
  ]);

  const inkTrailRef = useRef<Array<{ x: number; y: number; alpha: number }>>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const resetArena = useCallback(() => {
    playerPenRef.current = {
      x: 120,
      y: 200,
      vx: 0,
      vy: 0,
      angle: 0,
      width: 14,
      length: 80,
      color: skin.barrelColor,
      capColor: skin.capColor,
      isPlayer: true,
      isFallen: false,
    };

    dummyPensRef.current = [
      {
        x: 340,
        y: 150,
        vx: 0,
        vy: 0,
        angle: Math.PI / 4,
        width: 13,
        length: 75,
        color: '#64748b',
        capColor: '#334155',
        isPlayer: false,
        isFallen: false,
      },
      {
        x: 380,
        y: 260,
        vx: 0,
        vy: 0,
        angle: -Math.PI / 6,
        width: 13,
        length: 75,
        color: '#a1a1aa',
        capColor: '#71717a',
        isPlayer: false,
        isFallen: false,
      },
    ];

    inkTrailRef.current = [];
    particlesRef.current = [];
    setLastClashImpact(null);
  }, [skin.barrelColor, skin.capColor]);

  // Main Physics & Render loop
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

      // Clear desk surface
      ctx.fillStyle = '#261a12';
      ctx.fillRect(0, 0, width, height);

      // Wood plank lines
      ctx.strokeStyle = 'rgba(74, 45, 23, 0.4)';
      ctx.lineWidth = 1;
      for (let y = 30; y < height; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Desk margin ring (ringout boundary)
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(20, 20, width - 40, height - 40);
      ctx.setLineDash([]);

      // Draw ink trail
      if (inkTrailRef.current.length > 1) {
        ctx.save();
        for (let i = 1; i < inkTrailRef.current.length; i++) {
          const pt1 = inkTrailRef.current[i - 1];
          const pt2 = inkTrailRef.current[i];
          ctx.strokeStyle = skin.trailColor;
          ctx.globalAlpha = pt2.alpha * 0.75;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Fade existing ink trail slowly
      inkTrailRef.current.forEach((p) => {
        p.alpha -= 0.003;
      });
      inkTrailRef.current = inkTrailRef.current.filter((p) => p.alpha > 0.05);

      // Physics friction factor based on skin specs
      // Base friction ~0.94; higher friction stat = stops faster, less slippery
      const baseFriction = 0.96 - (skin.friction / 100) * 0.035;

      const pPen = playerPenRef.current;
      if (!pPen.isFallen) {
        pPen.x += pPen.vx;
        pPen.y += pPen.vy;
        pPen.vx *= baseFriction;
        pPen.vy *= baseFriction;

        if (Math.abs(pPen.vx) > 0.1 || Math.abs(pPen.vy) > 0.1) {
          pPen.angle = Math.atan2(pPen.vy, pPen.vx);
          // Add to ink trail
          inkTrailRef.current.push({ x: pPen.x, y: pPen.y, alpha: 1.0 });
        } else {
          pPen.vx = 0;
          pPen.vy = 0;
        }

        // Boundary check (fallen off desk)
        if (pPen.x < 15 || pPen.x > width - 15 || pPen.y < 15 || pPen.y > height - 15) {
          pPen.isFallen = true;
          sound.playPenFall();
        }
      }

      // Dummy pens physics
      dummyPensRef.current.forEach((dPen) => {
        if (!dPen.isFallen) {
          dPen.x += dPen.vx;
          dPen.y += dPen.vy;
          dPen.vx *= 0.93;
          dPen.vy *= 0.93;

          if (Math.abs(dPen.vx) > 0.1 || Math.abs(dPen.vy) > 0.1) {
            dPen.angle = Math.atan2(dPen.vy, dPen.vx);
          } else {
            dPen.vx = 0;
            dPen.vy = 0;
          }

          // Boundary check
          if (dPen.x < 15 || dPen.x > width - 15 || dPen.y < 15 || dPen.y > height - 15) {
            dPen.isFallen = true;
            sound.playPenFall();
            setDummiesKnocked((prev) => prev + 1);
          }
        }
      });

      // Collision Detection: Player Pen vs Dummy Pens
      if (!pPen.isFallen && (Math.abs(pPen.vx) > 0.2 || Math.abs(pPen.vy) > 0.2)) {
        dummyPensRef.current.forEach((dPen) => {
          if (dPen.isFallen) return;
          const dx = dPen.x - pPen.x;
          const dy = dPen.y - pPen.y;
          const dist = Math.hypot(dx, dy);
          const collisionDist = 32;

          if (dist < collisionDist && dist > 0) {
            // Collision normal
            const nx = dx / dist;
            const ny = dy / dist;

            // Knockback calculation boosted by skin power & weight
            const pSpeed = Math.hypot(pPen.vx, pPen.vy);
            const knockbackMultiplier = (skin.power / 50) * (skin.weightGrams / 14);
            const impactForce = Math.min(Math.round(pSpeed * knockbackMultiplier * 10), 100);

            setLastClashImpact(impactForce);
            sound.playPenClash(Math.min(1.0, impactForce / 70));

            // Generate sparks
            for (let i = 0; i < 12; i++) {
              particlesRef.current.push({
                x: (pPen.x + dPen.x) / 2,
                y: (pPen.y + dPen.y) / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: Math.random() > 0.5 ? skin.trailColor : '#fef08a',
                size: Math.random() * 3 + 2,
                alpha: 1.0,
                life: 25,
              });
            }

            // Impulse push
            dPen.vx += nx * pSpeed * knockbackMultiplier * 0.9;
            dPen.vy += ny * pSpeed * knockbackMultiplier * 0.9;

            pPen.vx *= 0.5;
            pPen.vy *= 0.5;
          }
        });
      }

      // Render Particles
      particlesRef.current.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.04;
      });
      particlesRef.current = particlesRef.current.filter((pt) => pt.alpha > 0);

      // Render Dummy Pens
      dummyPensRef.current.forEach((dPen) => {
        if (dPen.isFallen) return;
        ctx.save();
        ctx.translate(dPen.x, dPen.y);
        ctx.rotate(dPen.angle);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(-dPen.length / 2 + 3, -dPen.width / 2 + 3, dPen.length, dPen.width);

        // Body
        ctx.fillStyle = dPen.color;
        ctx.fillRect(-dPen.length / 2, -dPen.width / 2, dPen.length, dPen.width);

        // Cap
        ctx.fillStyle = dPen.capColor;
        ctx.fillRect(-dPen.length / 2, -dPen.width / 2, 22, dPen.width);

        // Label
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '9px monospace';
        ctx.fillText('DUMMY', -6, 3);
        ctx.restore();
      });

      // Render Player Pen
      if (!pPen.isFallen) {
        ctx.save();
        ctx.translate(pPen.x, pPen.y);
        ctx.rotate(pPen.angle);

        // Pen drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(-pPen.length / 2 + 4, -pPen.width / 2 + 4, pPen.length, pPen.width);

        // Barrel
        ctx.fillStyle = pPen.color;
        ctx.fillRect(-pPen.length / 2, -pPen.width / 2, pPen.length, pPen.width);

        // Cap
        ctx.fillStyle = pPen.capColor;
        ctx.fillRect(pPen.length / 2 - 24, -pPen.width / 2, 24, pPen.width);

        // Accent nib ring
        ctx.fillStyle = skin.accentColor;
        ctx.fillRect(-pPen.length / 2, -pPen.width / 2, 6, pPen.width);

        // Metallic pen clip
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(pPen.length / 2 - 20, -pPen.width / 2 - 2, 14, 2);

        ctx.restore();
      }

      // Render Aim Vector
      if (isAiming && aimStart && aimCurrent && !pPen.isFallen) {
        const dx = aimCurrent.x - aimStart.x;
        const dy = aimCurrent.y - aimStart.y;
        const dist = Math.hypot(dx, dy);
        const powerRatio = Math.min(dist / 140, 1.0);

        ctx.save();
        ctx.strokeStyle = powerRatio > 0.7 ? '#ef4444' : '#eab308';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(pPen.x, pPen.y);
        // Shoot in OPPOSITE direction of pull (slingshot flick)
        ctx.lineTo(pPen.x - dx * 1.5, pPen.y - dy * 1.5);
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = powerRatio > 0.7 ? '#ef4444' : '#eab308';
        ctx.beginPath();
        ctx.arc(pPen.x - dx * 1.5, pPen.y - dy * 1.5, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [skin, isAiming, aimStart, aimCurrent]);

  // Pointer drag aiming
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || playerPenRef.current.isFallen) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Check if clicked near the player pen
    const pPen = playerPenRef.current;
    const dist = Math.hypot(x - pPen.x, y - pPen.y);

    if (dist < 80) {
      setIsAiming(true);
      setAimStart({ x, y });
      setAimCurrent({ x, y });
      setAimPower(0);
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAiming || !aimStart) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setAimCurrent({ x, y });

    const dx = x - aimStart.x;
    const dy = y - aimStart.y;
    const dist = Math.hypot(dx, dy);
    const power = Math.min(Math.round((dist / 140) * 100), 100);
    setAimPower(power);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isAiming || !aimStart || !aimCurrent) {
      setIsAiming(false);
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }

    const dx = aimCurrent.x - aimStart.x;
    const dy = aimCurrent.y - aimStart.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 10) {
      // Release shot
      const powerRatio = Math.min(dist / 140, 1.0);
      const speedMultiplier = (skin.speed / 70) * 16;
      const angle = Math.atan2(dy, dx) + Math.PI; // Inverted flick

      playerPenRef.current.vx = Math.cos(angle) * powerRatio * speedMultiplier;
      playerPenRef.current.vy = Math.sin(angle) * powerRatio * speedMultiplier;

      sound.playPenFlick();
      setShotsCount((prev) => prev + 1);
    }

    setIsAiming(false);
    setAimStart(null);
    setAimCurrent(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border-2 border-amber-500/60 rounded-3xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-black/40 shadow-inner"
              style={{ backgroundColor: skin.barrelColor }}
            >
              <div className="w-3.5 h-5 rounded-xs" style={{ backgroundColor: skin.capColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-100 text-sm font-handwriting">
                  {language === 'bn' ? skin.name.bn : skin.name.en}
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full font-mono">
                  {language === 'bn' ? 'ট্রায়াল ম্যাচ' : 'Test Drive'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {language === 'bn'
                  ? 'কলমের গতি, ওজন ও ধাক্কা শক্তি পরীক্ষা করুন'
                  : 'Test pen weight, knockback & ink trail before real matches'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playPenClick();
              onClose();
            }}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Specs Dashboard */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-stone-950/50 border-b border-stone-800/80 text-center text-xs">
          <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-800">
            <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>ওজন (Weight)</span>
            </div>
            <div className="font-bold font-mono text-amber-300 mt-0.5">{skin.weightGrams}g</div>
          </div>

          <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-800">
            <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>গতি (Speed)</span>
            </div>
            <div className="font-bold font-mono text-emerald-400 mt-0.5">{skin.speed}%</div>
          </div>

          <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-800">
            <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
              <Gauge className="w-3 h-3 text-red-400" />
              <span>ধাক্কা (Power)</span>
            </div>
            <div className="font-bold font-mono text-red-400 mt-0.5">{skin.power}%</div>
          </div>

          <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-800">
            <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>গ্রিপ (Grip)</span>
            </div>
            <div className="font-bold font-mono text-cyan-400 mt-0.5">{skin.friction}%</div>
          </div>
        </div>

        {/* Special Perk Banner */}
        <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-900/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold font-mono text-[11px]">✦ বিশেষ বৈশিষ্ট্য:</span>
            <span className="text-stone-300 text-[11px]">
              {language === 'bn' ? skin.perk.bn : skin.perk.en}
            </span>
          </div>
          {lastClashImpact !== null && (
            <span className="text-emerald-400 font-mono font-bold text-[11px] animate-pulse">
              সংঘর্ষ বল: {lastClashImpact} pts!
            </span>
          )}
        </div>

        {/* Sandbox Canvas */}
        <div className="relative p-2 bg-stone-950 flex flex-col items-center justify-center select-none overflow-hidden">
          <canvas
            ref={canvasRef}
            width={480}
            height={320}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full max-w-[480px] h-[260px] sm:h-[300px] rounded-2xl border border-stone-800 shadow-inner cursor-crosshair touch-none"
          />

          {/* Canvas Floating Overlay Controls */}
          <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs border border-white/10 text-[10px] text-stone-300 font-mono">
              ফ্লিকের শক্তি: <span className="text-amber-400 font-bold">{aimPower}%</span>
            </div>
            {dummiesKnocked > 0 && (
              <div className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-[10px] text-emerald-300 font-mono">
                নকআউট: {dummiesKnocked}টি
              </div>
            )}
          </div>

          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              onClick={() => {
                sound.playPenClick();
                resetArena();
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs flex items-center gap-1.5 shadow"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>রিসেট বেঞ্চ</span>
            </button>
          </div>

          {/* Hint Overlay */}
          <div className="text-[11px] text-stone-400 mt-1.5 flex items-center gap-1.5">
            <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>
              {language === 'bn'
                ? 'কলমের উপর আঙুল টেনে পেছনের দিকে টানুন ও ছেড়ে দিন'
                : 'Touch & pull back on your pen to launch and test knockback'}
            </span>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/70 flex items-center justify-between gap-3">
          <div className="text-xs text-stone-400">
            কালির ট্রায়াল রং:
            <span
              className="inline-block w-3.5 h-3.5 rounded-full ml-1.5 align-middle border border-white/30"
              style={{ backgroundColor: skin.trailColor }}
            />
          </div>

          <div className="flex items-center gap-2">
            {canEquip && !isEquipped && onEquip && (
              <button
                onClick={() => {
                  sound.playPenClick();
                  onEquip();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'bn' ? 'এই স্কিনটি ব্যবহার করুন' : 'Equip This Pen'}</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playPenClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
