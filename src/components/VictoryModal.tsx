import React from 'react';
import { Trophy, Sparkles, RotateCcw, Home, Star, Award, CheckCircle } from 'lucide-react';
import { sound } from '../utils/audio';

interface VictoryModalProps {
  winnerName: string;
  pointsAwarded: number;
  totalPoints: number;
  matchTitle: string;
  scoreDetail?: string;
  language: 'en' | 'bn';
  onPlayAgain: () => void;
  onBackHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winnerName,
  pointsAwarded,
  totalPoints,
  matchTitle,
  scoreDetail,
  language,
  onPlayAgain,
  onBackHome,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-stone-900 border-2 border-amber-500 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Decorative Golden Rays background */}
        <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent pointer-events-none" />

        {/* Big Trophy Badge */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shadow-xl mx-auto animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>
          <div className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 p-1 rounded-full shadow">
            <Sparkles className="w-4 h-4 fill-stone-950" />
          </div>
        </div>

        {/* Title & Winner Name */}
        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 font-semibold">
          {matchTitle} · {language === 'bn' ? 'ম্যাচ সমাপ্ত' : 'Match Victory'}
        </span>

        <h3 className="text-2xl sm:text-3xl font-bold text-amber-100 font-handwriting mt-1">
          {winnerName} {language === 'bn' ? 'বিজয়ী!' : 'Wins!'}
        </h3>

        {scoreDetail && (
          <p className="text-xs text-stone-400 mt-1 font-mono">
            {scoreDetail}
          </p>
        )}

        {/* Points Award Card */}
        <div className="my-5 w-full p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="text-[10px] text-stone-400 font-medium">
                {language === 'bn' ? 'ম্যাচ পুরস্কার' : 'Match Reward'}
              </div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                +{pointsAwarded} {language === 'bn' ? 'পয়েন্ট যুক্ত হয়েছে' : 'Points Earned'}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-stone-400">
              {language === 'bn' ? 'মোট পয়েন্ট' : 'Total Points'}
            </div>
            <div className="text-lg font-bold font-mono text-amber-400">
              {totalPoints}★
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            onClick={() => {
              sound.playPenClick();
              onPlayAgain();
            }}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'আবার খেলুন' : 'Play Again'}</span>
          </button>

          <button
            onClick={() => {
              sound.playPenClick();
              onBackHome();
            }}
            className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'হোম স্ক্রিন' : 'Home'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
