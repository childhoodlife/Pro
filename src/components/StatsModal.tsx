import React, { useState } from 'react';
import { X, Award, Trash2 } from 'lucide-react';
import { Translations } from '../utils/translations';
import { loadStats, clearStats, GameStats } from '../utils/storage';
import { sound } from '../utils/audio';

interface StatsModalProps {
  t: Translations;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ t, onClose }) => {
  const [stats, setStats] = useState<GameStats>(() => loadStats());

  const handleReset = () => {
    sound.playPenClick();
    clearStats();
    setStats(loadStats());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-100 font-handwriting">
              {t.stats.title}
            </h2>
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

        {/* Stats Grid */}
        <div className="p-6 space-y-4">
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80 flex items-center justify-between">
            <span className="text-xs text-stone-300 font-medium">{t.stats.totalPlayed}</span>
            <span className="text-xl font-bold font-mono text-amber-400">{stats.totalPlayed}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800/80">
              <span className="text-[11px] text-stone-400 block mb-1">{t.stats.pfWins}</span>
              <div className="text-lg font-bold font-mono text-blue-400">
                P1: {stats.pfWinsP1} <span className="text-stone-500 font-normal">/</span> P2: {stats.pfWinsP2}
              </div>
            </div>

            <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800/80">
              <span className="text-[11px] text-stone-400 block mb-1">{t.stats.pfRingouts}</span>
              <div className="text-lg font-bold font-mono text-amber-400">
                {stats.pfRingouts}
              </div>
            </div>

            <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800/80">
              <span className="text-[11px] text-stone-400 block mb-1">{t.stats.dbWins}</span>
              <div className="text-lg font-bold font-mono text-emerald-400">
                P1: {stats.dbWinsP1} <span className="text-stone-500 font-normal">/</span> P2: {stats.dbWinsP2}
              </div>
            </div>

            <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800/80">
              <span className="text-[11px] text-stone-400 block mb-1">{t.stats.dbBoxesCaptured}</span>
              <div className="text-lg font-bold font-mono text-purple-400">
                {stats.dbBoxesCapturedP1 + stats.dbBoxesCapturedP2}
              </div>
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-2">
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-stone-400 hover:text-red-400 hover:bg-red-950/20 text-xs transition-colors border border-dashed border-stone-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.stats.resetStats}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
