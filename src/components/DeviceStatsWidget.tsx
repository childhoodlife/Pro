import React, { useState, useEffect } from 'react';
import { Smartphone, Trophy, Volume2, Users, Calendar, TrendingUp, ShieldCheck } from 'lucide-react';
import { getDeviceData, getTodayStats, DeviceData, DailyRecord } from '../utils/deviceTracker';
import { getTotalRegisteredUsersCount } from '../utils/authManager';
import { sound } from '../utils/audio';
import { voiceCoach } from '../utils/voiceCoach';
import { Translations } from '../utils/translations';

interface DeviceStatsWidgetProps {
  t: Translations;
  language: 'en' | 'bn';
}

export const DeviceStatsWidget: React.FC<DeviceStatsWidgetProps> = ({ t, language }) => {
  const [deviceData, setDeviceData] = useState<DeviceData>(() => getDeviceData());
  const [todayStats, setTodayStats] = useState<DailyRecord>(() => getTodayStats());
  const [registeredUsersCount, setRegisteredUsersCount] = useState<number>(() => getTotalRegisteredUsersCount());

  useEffect(() => {
    setDeviceData(getDeviceData());
    setTodayStats(getTodayStats());
    setRegisteredUsersCount(getTotalRegisteredUsersCount());
  }, []);

  const handleSpeakStats = () => {
    sound.playPenClick();
    if (language === 'bn') {
      const text = `আপনার ডিভাইস আইডি ${deviceData.deviceId}। মোট নিবন্ধিত ইউজার ${registeredUsersCount} জন। আজ আপনি মোট ${todayStats.gamesPlayed}টি গেম খেলেছেন, যার মধ্যে ${todayStats.wins}টি ম্যাচে বিজয়ী হয়েছেন এবং ${todayStats.losses}টি ম্যাচে পরাজিত হয়েছেন। এইটি তৈরি করেছেন আর এম রাহিমুল।`;
      voiceCoach.speak(text, 'bn');
    } else {
      const text = `Your device ID is ${deviceData.deviceId}. Total registered users: ${registeredUsersCount}. Today you played ${todayStats.gamesPlayed} matches with ${todayStats.wins} victories and ${todayStats.losses} defeats. Created by RM.Rahimul.`;
      voiceCoach.speak(text, 'en');
    }
  };

  const winRate =
    todayStats.gamesPlayed > 0
      ? Math.round((todayStats.wins / todayStats.gamesPlayed) * 100)
      : 0;

  return (
    <div className="rounded-3xl p-5 bg-stone-900/90 border border-stone-800 shadow-xl backdrop-blur-md mb-8">
      {/* Top Header of Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-400 font-semibold tracking-wider">
                {language === 'bn' ? 'ডিভাইস আইডি' : 'DEVICE ID'}: {deviceData.deviceId}
              </span>
              <span className="text-[10px] bg-emerald-950/70 border border-emerald-800/80 text-emerald-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{language === 'bn' ? '১টি ফোন ১টি আইডি' : '1 Phone 1 ID'}</span>
              </span>
            </div>
            <div className="text-xs text-stone-300 flex items-center gap-2 mt-0.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {language === 'bn'
                  ? `মোট নিবন্ধিত ইউজার: ${registeredUsersCount} জন (সরাসরি লাইভ কাউন্টিং)`
                  : `Total Registered Users: ${registeredUsersCount} (Real-Time Live)`}
              </span>
            </div>
          </div>
        </div>

        {/* Listen Stats Aloud Button */}
        <button
          onClick={handleSpeakStats}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-amber-300 text-xs font-semibold transition-all shadow-xs self-start sm:self-auto"
        >
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span>{language === 'bn' ? 'আজকের তথ্য শুনুন' : 'Listen Daily Stats'}</span>
        </button>
      </div>

      {/* Daily Records Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {/* Total Registered Users Box */}
        <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800/80">
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'bn' ? 'নিবন্ধিত ইউজার' : 'Registered Users'}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1 flex items-baseline gap-1">
            <span>{registeredUsersCount}</span>
            <span className="text-xs text-amber-200/70 font-sans font-normal">জন</span>
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{language === 'bn' ? 'লাইভ ডাটাবেজ' : 'Live Verified'}</span>
          </div>
        </div>

        {/* Games Today */}
        <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800/80">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <span>{language === 'bn' ? 'আজকের ম্যাচ' : 'Today Matches'}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-stone-100 mt-1">
            {todayStats.gamesPlayed}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            {todayStats.date}
          </div>
        </div>

        {/* Wins Today */}
        <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800/80">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <Trophy className="w-3.5 h-3.5 text-emerald-500" />
            <span>{language === 'bn' ? 'আজকের জয়' : 'Victories Today'}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {todayStats.wins}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            {winRate}% {language === 'bn' ? 'জয় হার' : 'Win Rate'}
          </div>
        </div>

        {/* Losses Today */}
        <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800/80">
          <div className="flex items-center gap-1.5 text-[11px] text-red-400">
            <TrendingUp className="w-3.5 h-3.5 text-red-500" />
            <span>{language === 'bn' ? 'আজকের পরাজয়' : 'Defeats Today'}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1">
            {todayStats.losses}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5">
            {language === 'bn' ? 'শিখে এগিয়ে চলুন' : 'Keep practicing'}
          </div>
        </div>
      </div>
    </div>
  );
};
