import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, RefreshCw, Crown, User, Sparkles } from 'lucide-react';
import { getAllPlayersLeaderboard } from '../utils/authManager';
import { PEN_SKINS } from '../utils/skins';
import { sound } from '../utils/audio';

interface LeaderboardWidgetProps {
  language: 'en' | 'bn';
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ language }) => {
  const [players, setPlayers] = useState(() => getAllPlayersLeaderboard());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshLeaderboard = () => {
    sound.playPenClick();
    setIsRefreshing(true);
    setTimeout(() => {
      setPlayers(getAllPlayersLeaderboard());
      setIsRefreshing(false);
    }, 400);
  };

  useEffect(() => {
    setPlayers(getAllPlayersLeaderboard());
  }, []);

  return (
    <div className="rounded-3xl p-5 bg-stone-900/90 border border-stone-800 shadow-xl backdrop-blur-md mb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-amber-100 font-handwriting">
                {language === 'bn' ? 'শীর্ষ খেলোয়াড়দের লিডারবোর্ড' : 'Top Players Leaderboard'}
              </h3>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono">
                {language === 'bn' ? 'লাইভ পয়েন্ট' : 'Live Points'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {language === 'bn'
                ? 'সকল খেলায় অর্জিত মোট জয় পয়েন্টের ভিত্তিতে শীর্ষ তালিকা'
                : 'Rankings based on total points won across all childhood games'}
            </p>
          </div>
        </div>

        <button
          onClick={refreshLeaderboard}
          title="রিফ্রেশ করুন"
          className="p-2 rounded-xl bg-stone-950/70 border border-stone-800 text-stone-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          <span className="hidden sm:inline font-mono text-[11px]">Sync</span>
        </button>
      </div>

      {/* Players List */}
      <div className="mt-4 space-y-2.5">
        {players.length === 0 ? (
          <div className="text-center py-6 text-stone-500 text-xs">
            {language === 'bn' ? 'কোনো প্লেয়ারের তথ্য পাওয়া যায়নি' : 'No player records yet'}
          </div>
        ) : (
          players.slice(0, 10).map((player, index) => {
            const rank = index + 1;
            const skin = PEN_SKINS.find((s) => s.id === player.equippedSkin) || PEN_SKINS[0];

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  player.isCurrentDevice
                    ? 'bg-amber-950/30 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                    : rank === 1
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-stone-950/50 border-stone-800/80 hover:border-stone-700'
                }`}
              >
                {/* Left: Rank & Player info */}
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-xs ${
                      rank === 1
                        ? 'bg-amber-500 text-stone-950'
                        : rank === 2
                        ? 'bg-slate-300 text-stone-950'
                        : rank === 3
                        ? 'bg-amber-700 text-stone-100'
                        : 'bg-stone-800 text-stone-400 border border-stone-700'
                    }`}
                  >
                    {rank === 1 ? <Crown className="w-4 h-4 fill-stone-950" /> : rank}
                  </div>

                  {/* Equipped Pen Avatar Pill */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-black/30 shrink-0 shadow-inner"
                    style={{ backgroundColor: skin.barrelColor }}
                    title={language === 'bn' ? skin.name.bn : skin.name.en}
                  >
                    <div className="w-2.5 h-4 rounded-xs" style={{ backgroundColor: skin.capColor }} />
                  </div>

                  {/* Name & Badge */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-stone-100 font-handwriting">
                        {player.name}
                      </span>
                      {player.isCurrentDevice && (
                        <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-1.5 py-0.2 rounded-full font-sans">
                          {language === 'bn' ? 'আপনি' : 'You'}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {language === 'bn' ? skin.name.bn : skin.name.en}
                    </div>
                  </div>
                </div>

                {/* Right: Points */}
                <div className="flex items-center gap-1.5 font-mono">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-base font-bold text-amber-300">
                    {player.points}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {language === 'bn' ? 'পয়েন্ট' : 'pts'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
