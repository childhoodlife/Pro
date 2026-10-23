import { getCurrentUser, awardMatchWinPoint } from './authManager';

export interface DailyMission {
  id: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  targetCount: number;
  currentCount: number;
  rewardPoints: number;
  isClaimed: boolean;
  type: 'pen_fight_win' | 'katakuti_play' | 'fruit_slice_score' | 'bottle_smash_win';
}

const MISSIONS_STORAGE_KEY = 'childhood_daily_missions_v1';

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadDailyMissions(): DailyMission[] {
  if (typeof window === 'undefined') return [];

  const today = getTodayDateString();
  try {
    const raw = localStorage.getItem(MISSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today && Array.isArray(parsed.missions)) {
        return parsed.missions;
      }
    }
  } catch {}

  // Generate fresh missions for today
  const defaultMissions: DailyMission[] = [
    {
      id: 'mission_pen_1',
      titleBn: 'পেন ফাইটে ২টি জয়',
      titleEn: 'Win 2 Pen Fights',
      descBn: 'ডেস্কে বন্ধুদের সাথে বা এআইকে ২ বার পরাজিত করুন',
      descEn: 'Defeat AI or friends twice in Pen Fight',
      targetCount: 2,
      currentCount: 0,
      rewardPoints: 1,
      isClaimed: false,
      type: 'pen_fight_win',
    },
    {
      id: 'mission_katakuti_1',
      titleBn: 'কাটাকুটি খেলুন',
      titleEn: 'Play Katakuti & SOS',
      descBn: 'খাতার পাতায় টিক-ট্যাক-টো বা এসওএস খেলুন',
      descEn: 'Play 2 games of Katakuti or SOS',
      targetCount: 2,
      currentCount: 0,
      rewardPoints: 1,
      isClaimed: false,
      type: 'katakuti_play',
    },
    {
      id: 'mission_fruit_1',
      titleBn: 'ফল কাটায় ৫০ স্কোর',
      titleEn: 'Score 50 in Fruit Slice',
      descBn: 'আঙুল টেনে সুস্বাদু মৌসুমি ফল কাটুন',
      descEn: 'Slice seasonal fruits and reach 50 points',
      targetCount: 50,
      currentCount: 0,
      rewardPoints: 1,
      isClaimed: false,
      type: 'fruit_slice_score',
    },
    {
      id: 'mission_bottle_1',
      titleBn: 'বোতল ভাঙ্গায় ১০০ করে জয়',
      titleEn: 'Smash Bottles to 100',
      descBn: 'গুলতি ছুড়ে ১০০ পয়েন্ট অর্জন করে বিজয়ী হোন',
      descEn: 'Shatter glass bottles with slingshot and hit 100',
      targetCount: 1,
      currentCount: 0,
      rewardPoints: 2,
      isClaimed: false,
      type: 'bottle_smash_win',
    },
  ];

  try {
    localStorage.setItem(
      MISSIONS_STORAGE_KEY,
      JSON.stringify({ date: today, missions: defaultMissions })
    );
  } catch {}

  return defaultMissions;
}

export function saveDailyMissions(missions: DailyMission[]) {
  if (typeof window === 'undefined') return;
  const today = getTodayDateString();
  try {
    localStorage.setItem(
      MISSIONS_STORAGE_KEY,
      JSON.stringify({ date: today, missions })
    );
  } catch {}
}

export function updateMissionProgress(
  type: DailyMission['type'],
  amount: number = 1
) {
  const missions = loadDailyMissions();
  let updated = false;

  missions.forEach((m) => {
    if (m.type === type && !m.isClaimed) {
      m.currentCount = Math.min(m.targetCount, m.currentCount + amount);
      updated = true;
    }
  });

  if (updated) {
    saveDailyMissions(missions);
  }
}

export function claimMissionReward(missionId: string): { success: boolean; reward: number } {
  const missions = loadDailyMissions();
  const mission = missions.find((m) => m.id === missionId);

  if (!mission || mission.isClaimed || mission.currentCount < mission.targetCount) {
    return { success: false, reward: 0 };
  }

  mission.isClaimed = true;
  saveDailyMissions(missions);

  // Award the star points to user profile
  for (let i = 0; i < mission.rewardPoints; i++) {
    awardMatchWinPoint();
  }

  return { success: true, reward: mission.rewardPoints };
}
