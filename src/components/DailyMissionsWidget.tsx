import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Star, Sparkles, Gift } from 'lucide-react';
import { loadDailyMissions, claimMissionReward, DailyMission } from '../utils/missions';
import { sound } from '../utils/audio';

interface DailyMissionsWidgetProps {
  language: 'en' | 'bn';
  onRewardClaimed: () => void;
}

export const DailyMissionsWidget: React.FC<DailyMissionsWidgetProps> = ({
  language,
  onRewardClaimed,
}) => {
  const [missions, setMissions] = useState<DailyMission[]>(() => loadDailyMissions());

  useEffect(() => {
    setMissions(loadDailyMissions());
  }, []);

  const handleClaim = (missionId: string) => {
    sound.playBoxComplete();
    const res = claimMissionReward(missionId);
    if (res.success) {
      setMissions(loadDailyMissions());
      onRewardClaimed();
    }
  };

  const completedCount = missions.filter((m) => m.isClaimed).length;

  return (
    <div className="rounded-3xl p-5 bg-stone-900/90 border border-stone-800 shadow-xl backdrop-blur-md mb-8">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-amber-100 font-handwriting">
              {language === 'bn' ? 'দৈনিক নস্টালজিক মিশন (Daily Missions)' : 'Daily Childhood Missions'}
            </h3>
            <p className="text-[11px] text-stone-400">
              {language === 'bn'
                ? 'প্রতিদিনের ছোট চ্যালেঞ্জ সম্পন্ন করে বোনাস স্টার পয়েন্ট অর্জন করুন'
                : 'Complete small fun challenges each day to earn bonus points'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-amber-400 font-bold bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/80">
            {completedCount}/{missions.length} সম্পন্ন
          </span>
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {missions.map((m) => {
          const isComplete = m.currentCount >= m.targetCount;
          const progressPct = Math.min((m.currentCount / m.targetCount) * 100, 100);

          return (
            <div
              key={m.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                m.isClaimed
                  ? 'border-emerald-900/60 bg-emerald-950/20 opacity-75'
                  : isComplete
                  ? 'border-amber-500/70 bg-amber-950/30 shadow-md ring-1 ring-amber-500/30'
                  : 'border-stone-800 bg-stone-950/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-stone-100 font-handwriting">
                    {language === 'bn' ? m.titleBn : m.titleEn}
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">
                    +{m.rewardPoints}★
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {language === 'bn' ? m.descBn : m.descEn}
                </p>
              </div>

              <div className="mt-3">
                {/* Progress bar */}
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mb-1">
                  <span>অগ্রগতি</span>
                  <span>
                    {m.currentCount} / {m.targetCount}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isComplete ? 'bg-amber-400' : 'bg-amber-600'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Claim or Status Button */}
                <div className="mt-2.5 flex justify-end">
                  {m.isClaimed ? (
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-lg">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{language === 'bn' ? 'পুরস্কার গ্রহণকৃত' : 'Claimed'}</span>
                    </span>
                  ) : isComplete ? (
                    <button
                      onClick={() => handleClaim(m.id)}
                      className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] shadow transition-all active:scale-95 flex items-center gap-1 animate-pulse"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{language === 'bn' ? 'পুরস্কার নিন (+১★)' : 'Claim Star'}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-stone-500 font-mono">
                      {language === 'bn' ? 'চলমান...' : 'In Progress'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
