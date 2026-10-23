import React, { useState, useEffect, useRef } from 'react';
import { X, Lightbulb, Play, RotateCcw, Sparkles, CheckCircle2, Bot, ArrowRight } from 'lucide-react';
import { GameKey, getLevelDetails } from '../utils/levelManager';
import { sound } from '../utils/audio';

interface IdeaModalProps {
  gameKey: GameKey;
  level: number;
  language: 'en' | 'bn';
  onClose: () => void;
  onOpenAIWithTutorial?: () => void;
}

export const IdeaModal: React.FC<IdeaModalProps> = ({
  gameKey,
  level,
  language,
  onClose,
  onOpenAIWithTutorial,
}) => {
  const [isPlayingDemo, setIsPlayingDemo] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const levelInfo = getLevelDetails(gameKey, level);

  // Animated auto-demo canvas simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = Date.now();
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      const elapsed = (Date.now() - startTime) % 4000; // 4s loop
      const progress = elapsed / 4000;

      const w = canvas.width;
      const h = canvas.height;

      // Dark background
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, w, h);

      if (gameKey === 'pen_fight') {
        // Pen Fight Demo: Draw wooden desk, pen flicking dummy
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1;
        for (let y = 15; y < h; y += 25) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Table boundary
        ctx.strokeStyle = '#eab308';
        ctx.strokeRect(10, 10, w - 20, h - 20);

        // Target dummy pen
        const dummyX = w * 0.7;
        const dummyY = h * 0.5;
        const dummyFallen = progress > 0.6;
        const dummyDispX = dummyFallen ? dummyX + (progress - 0.6) * 200 : dummyX;

        ctx.save();
        ctx.translate(dummyDispX, dummyY);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-25, -6, 50, 12);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-25, -6, 14, 12);
        ctx.restore();

        // Player pen
        let pX = w * 0.25;
        let pY = h * 0.5;

        if (progress < 0.35) {
          // Aiming phase (pull back)
          const pull = (progress / 0.35) * 30;
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(pX, pY);
          ctx.lineTo(pX + 80, pY);
          ctx.stroke();
          ctx.setLineDash([]);
          pX -= pull * 0.5;
        } else if (progress < 0.6) {
          // Rush flick
          const t = (progress - 0.35) / 0.25;
          pX = w * 0.25 + t * (dummyX - w * 0.25 - 15);
        } else {
          pX = dummyX - 15;
        }

        ctx.save();
        ctx.translate(pX, pY);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-30, -7, 60, 14);
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(10, -7, 20, 14);
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(-30, -7, 5, 14);
        ctx.restore();

        // Ink trail
        if (progress >= 0.35) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(w * 0.25, h * 0.5);
          ctx.lineTo(pX, pY);
          ctx.stroke();
        }

        // Demo label
        ctx.fillStyle = '#fef08a';
        ctx.font = '11px sans-serif';
        ctx.fillText(
          language === 'bn' ? 'বুদ্ধি: কোণ সোজা রেখে মাঝারি শক্তিতে আঘাত করুন' : 'Idea: Direct angle with balanced power',
          16,
          h - 18
        );
      } else if (gameKey === 'dots_boxes') {
        // Dots & boxes demo: showing avoiding 3rd line
        const ox = 70;
        const oy = 35;
        const sz = 60;

        // Draw 2x2 grid
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 2; c++) {
            const bx = ox + c * sz;
            const by = oy + r * sz;
            ctx.strokeStyle = '#44403c';
            ctx.strokeRect(bx, by, sz, sz);
          }
        }

        // Completed 2 safe lines
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + sz, oy);
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox, oy + sz);
        ctx.stroke();

        // Safe line drawn in demo
        if (progress > 0.4) {
          ctx.strokeStyle = '#22c55e';
          ctx.beginPath();
          ctx.moveTo(ox + sz, oy + sz);
          ctx.lineTo(ox + sz * 2, oy + sz);
          ctx.stroke();
        }

        // Red cross on danger 3rd line
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ox, oy + sz);
        ctx.lineTo(ox + sz, oy + sz);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('❌ ৩য় বাহু দেওয়া নিষেধ', ox + 10, oy + sz + 25);
      } else if (gameKey === 'katakuti') {
        // Katakuti: center square move demo
        const ox = w / 2 - 45;
        const oy = 25;
        const sz = 30;

        ctx.strokeStyle = '#78716c';
        ctx.lineWidth = 2;
        // 3x3 grid
        ctx.beginPath();
        ctx.moveTo(ox + sz, oy);
        ctx.lineTo(ox + sz, oy + sz * 3);
        ctx.moveTo(ox + sz * 2, oy);
        ctx.lineTo(ox + sz * 2, oy + sz * 3);
        ctx.moveTo(ox, oy + sz);
        ctx.lineTo(ox + sz * 3, oy + sz);
        ctx.moveTo(ox, oy + sz * 2);
        ctx.lineTo(ox + sz * 3, oy + sz * 2);
        ctx.stroke();

        if (progress > 0.3) {
          // X in center
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ox + sz + 5, oy + sz + 5);
          ctx.lineTo(ox + sz * 2 - 5, oy + sz * 2 - 5);
          ctx.moveTo(ox + sz * 2 - 5, oy + sz + 5);
          ctx.lineTo(ox + sz + 5, oy + sz * 2 - 5);
          ctx.stroke();
        }

        ctx.fillStyle = '#38bdf8';
        ctx.font = '11px sans-serif';
        ctx.fillText(
          language === 'bn' ? 'বুদ্ধি: সবসময় কেন্দ্রের ঘর দখল করুন' : 'Idea: Always claim the center tile first',
          20,
          h - 18
        );
      } else if (gameKey === 'fruit_slice') {
        // Fruit Slice combo demo
        const fx1 = w * 0.25;
        const fy1 = h * 0.6;
        const fx2 = w * 0.5;
        const fy2 = h * 0.35;
        const fx3 = w * 0.75;
        const fy3 = h * 0.55;

        // Draw fruits
        ctx.font = '22px sans-serif';
        ctx.fillText('🥭', fx1 - 10, fy1);
        ctx.fillText('🍉', fx2 - 10, fy2);
        ctx.fillText('🍍', fx3 - 10, fy3);

        // Avoid bomb at bottom
        ctx.fillText('💣', w * 0.5 - 10, h * 0.78);

        // Blade stroke animation
        if (progress > 0.25) {
          const cutPct = Math.min((progress - 0.25) / 0.5, 1);
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(fx1 - 20, fy1 + 10);
          ctx.lineTo(
            fx1 - 20 + cutPct * (fx3 + 30 - (fx1 - 20)),
            fy1 + 10 + Math.sin(cutPct * Math.PI) * -60
          );
          ctx.stroke();
        }

        ctx.fillStyle = '#f472b6';
        ctx.font = '11px sans-serif';
        ctx.fillText(
          language === 'bn' ? 'বুদ্ধি: এক টানে ৩টি ফল কেটে ট্রিপল কম্বো নিন!' : 'Idea: Swipe 3 fruits in one curve for combo!',
          16,
          h - 14
        );
      } else if (gameKey === 'bottle_smash') {
        // Bottle smash trajectory demo
        const sx = 60;
        const sy = h * 0.75;
        const bx = w * 0.75;
        const by = h * 0.45;

        // Bottle
        ctx.fillStyle = '#15803d';
        ctx.fillRect(bx, by, 18, 40);
        ctx.fillRect(bx + 4, by - 12, 10, 12);

        // Dotted trajectory
        ctx.strokeStyle = '#f59e0b';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo((sx + bx) / 2, by - 40, bx + 10, by + 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // Pebble
        if (progress > 0.3) {
          const t = Math.min((progress - 0.3) / 0.4, 1);
          const px = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * ((sx + bx) / 2) + t * t * (bx + 10);
          const py = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * (by - 40) + t * t * (by + 10);

          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#fbbf24';
        ctx.font = '11px sans-serif';
        ctx.fillText(
          language === 'bn' ? 'বুদ্ধি: গুলতি ৪৫° কোণে টেনে লক্ষ্য স্থির করুন' : 'Idea: Pull back at 45° angle to hit target',
          16,
          h - 14
        );
      } else if (gameKey === 'chess') {
        // Chess center control demo
        const ox = w / 2 - 60;
        const oy = 20;
        const sz = 30;

        // Mini 4x4 central board
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? '#d6d3d1' : '#78716c';
            ctx.fillRect(ox + c * sz, oy + r * sz, sz, sz);
          }
        }

        // Highlight central squares e4/d4
        ctx.fillStyle = 'rgba(234, 179, 8, 0.45)';
        ctx.fillRect(ox + sz, oy + sz, sz, sz);
        ctx.fillRect(ox + sz * 2, oy + sz, sz, sz);

        // Pawn move e2 to e4
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♟', ox + sz * 1.5, progress > 0.4 ? oy + sz * 1.5 : oy + sz * 2.5);

        ctx.fillStyle = '#fde047';
        ctx.font = '11px sans-serif';
        ctx.fillText(
          language === 'bn' ? 'বুদ্ধি: পন ও ঘোড়া দিয়ে আগে বোর্ডের কেন্দ্র দখল করুন' : 'Idea: Control center squares with Pawns & Knights',
          14,
          h - 14
        );
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameKey, language]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border-2 border-amber-500/70 rounded-3xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lightbulb className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-100 text-sm font-handwriting">
                  {language === 'bn' ? 'স্মার্ট আইডিয়া ও অটো-ডেমো 💡' : 'Smart Idea & Auto Demo 💡'}
                </h3>
                <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-2 py-0.2 rounded-full font-mono">
                  {levelInfo.titleBn.split(':')[0]}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                {language === 'bn'
                  ? 'গেমটি সহজে জয় করার কৌশল ও বুদ্ধি স্বয়ংক্রিয়ভাবে দেখুন'
                  : 'Watch automatic tactical demonstrations to master this level'}
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

        {/* Level Objective Badge */}
        <div className="px-5 py-2.5 bg-amber-950/30 border-b border-amber-900/30 flex items-center justify-between text-xs">
          <div>
            <span className="text-amber-400 font-bold font-mono text-[11px]">
              {language === 'bn' ? levelInfo.titleBn : levelInfo.titleEn}
            </span>
            <p className="text-stone-300 text-[11px] mt-0.5">
              {language === 'bn' ? levelInfo.objectiveBn : levelInfo.objectiveEn}
            </p>
          </div>
          <span className="text-[10px] bg-stone-900 border border-stone-700 px-2 py-0.5 rounded-lg text-stone-300 font-mono shrink-0">
            {language === 'bn' ? `কঠিনতা: ${levelInfo.difficultyLabelBn}` : `Diff: ${levelInfo.difficultyLabelEn}`}
          </span>
        </div>

        {/* Animated Auto-Demo Canvas */}
        <div className="p-4 bg-stone-950 flex flex-col items-center">
          <div className="w-full relative">
            <canvas
              ref={canvasRef}
              width={440}
              height={190}
              className="w-full h-[180px] rounded-2xl border border-stone-800 shadow-inner"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs border border-white/10 text-[10px] text-amber-300 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{language === 'bn' ? 'অটো-ডেমো চলছে' : 'Auto-Demo Live'}</span>
            </div>
          </div>
        </div>

        {/* Tactical Strategy Wisdom */}
        <div className="p-5 overflow-y-auto space-y-2.5 text-xs text-stone-300">
          <h4 className="font-bold text-amber-300 text-sm flex items-center gap-1.5 font-handwriting">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{language === 'bn' ? 'এই লেভেলের জাদুকরী বুদ্ধি:' : 'Tactical Keys to Win:'}</span>
          </h4>

          {gameKey === 'pen_fight' && (
            <ul className="space-y-1.5 list-disc list-inside text-stone-300">
              <li>কলম ডেস্কে বেশি জোরে টানলে নিয়ন্ত্রণ হারিয়ে নিচে পড়ে যেতে পারে। ৫০%-৭০% শক্তিতে ফ্লিক করুন।</li>
              <li>প্রতিপক্ষকে কোণাকুণি ধাক্কা দিলে সে সোজা বেঞ্চের বাইরে চলে যাবে।</li>
              <li>লেভেল বাড়ার সাথে সাথে প্রতিপক্ষের ওজন ও গ্রিপ বাড়ে, তাই নিব দিয়ে নিরেট ধাক্কা দিন।</li>
            </ul>
          )}

          {gameKey === 'dots_boxes' && (
            <ul className="space-y-1.5 list-disc list-inside text-stone-300">
              <li>কোনো বক্সের ৩য় বাহু দেওয়া আত্মঘাতী! ৩য় বাহু দিলেই কম্পিউটার ৪ নম্বর বাহু দিয়ে পুরো চেইন দখল করবে।</li>
              <li>নিরাপদ বাহু বেছে নিন যেখানে কোনো বক্সের ২টির বেশি রেখা পূর্ণ হয় না।</li>
              <li>কম্পিউটার যখন ফাঁদে পড়বে, তখনই একটানা সব বক্স দখল করুন।</li>
            </ul>
          )}

          {gameKey === 'katakuti' && (
            <ul className="space-y-1.5 list-disc list-inside text-stone-300">
              <li>শুরুতেই মাঝের ঘর দখল করলে প্রতিপক্ষের জেতার সম্ভাবনা প্রায় শূন্য হয়ে যায়।</li>
              <li>কোণাকুণি দুইটি চাল দিয়ে "ডাবল ট্র্যাপ" তৈরি করুন যাতে দুই দিকেই জেতার পথ তৈরি হয়।</li>
              <li>এস-ও-এস খেলায় S এবং O এমনভাবে রাখুন যাতে শেষ ঘরে নিজেই S বা O দিয়ে পয়েন্ট পান।</li>
            </ul>
          )}

          {gameKey === 'fruit_slice' && (
            <ul className="space-y-1.5 list-disc list-inside text-stone-300">
              <li>আঙুল তুলে না রেখে একটি লম্বা স্লাইপে ২-৩টি ফল কাটুন, এতে ট্রিপল কম্বো বোনাস পাবেন।</li>
              <li>চক বোমা সবসময় উপরে ওঠার সর্বোচ্চ শিখরে ধীর হয়ে যায়, বোমার পথ খেয়াল রেখে পাশ কাটিয়ে সোয়াইপ করুন।</li>
              <li>সোনার আনারসে ২০ পয়েন্ট পাওয়া যায়, মিস করবেন না!</li>
            </ul>
          )}

          {gameKey === 'bottle_smash' && (
            <ul className="space-y-1.5 list-disc list-inside text-stone-300">
              <li>গুলতির রাবার ৩৫°-৪৫° কোণে টানলে পাথর নিখুঁত প্যারাবলিক আর্কে বোতলে আঘাত করে।</li>
              <li>চলমান বেগুনী বোতলটি যখন দিক পরিবর্তন করতে থামে, তখনই ছুড়ুন!</li>
              <li>বোমা বোতলের ঠিক পাশে না মেরে দূরবর্তী স্পষ্ট বোতল আগে ভাঙুন।</li>
            </ul>
          )}

          {gameKey === 'chess' && (
            <ul className="space-y-1.5 list-disc list-inside text-stone-300">
              <li>দাবায় শুরুর প্রধান নিয়ম: সেন্টারের পন (e4 বা d4) এগিয়ে দিন এবং নাইট (ঘোড়া) ও বিশপ বের করুন।</li>
              <li>একই গুটি বারবার না চেলে সব গুটিকে যুদ্ধের জন্য সামনে এগিয়ে আনুন।</li>
              <li>রাজাকে সুরক্ষিত রাখতে দ্রুত ক্যাসলিং (Castling) সম্পন্ন করুন।</li>
            </ul>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950/70 flex items-center justify-between gap-3">
          {onOpenAIWithTutorial ? (
            <button
              onClick={() => {
                sound.playPenClick();
                onClose();
                onOpenAIWithTutorial();
              }}
              className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>{language === 'bn' ? 'এআই টিউটোরিয়াল দেখুন' : 'View AI Tutorial'}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={() => {
              sound.playPenClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
          >
            {language === 'bn' ? 'বুঝেছি, খেলা শুরু করি!' : 'Understood, Let\'s Play!'}
          </button>
        </div>
      </div>
    </div>
  );
};
