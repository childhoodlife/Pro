export interface PenSkin {
  id: string;
  name: { bn: string; en: string };
  desc: { bn: string; en: string };
  pointsRequired: number;
  barrelColor: string;
  capColor: string;
  accentColor: string;
  trailColor: string;
  weightGrams: number;
  speed: number;       // 1 - 100
  power: number;       // 1 - 100
  friction: number;    // 1 - 100 (desk grip)
  soundType: 'ballpoint' | 'click' | 'gel' | 'heavy' | 'metallic';
  perk: { bn: string; en: string };
  isUnlockedDefault?: boolean;
}

export const PEN_SKINS: PenSkin[] = [
  {
    id: 'reynolds_blue',
    name: { bn: 'ক্লাসিক রেয়নল্ডস নীল', en: 'Classic Reynolds 045 Blue' },
    desc: { bn: 'শৈশবের সবচেয়ে জনপ্রিয় নস্টালজিক বলপেন। হালকা ও ক্ষিপ্র গতি।', en: 'The quintessential school ballpoint. Lightweight and swift.' },
    pointsRequired: 0,
    barrelColor: '#1d4ed8',
    capColor: '#2563eb',
    accentColor: '#60a5fa',
    trailColor: '#3b82f6',
    weightGrams: 12,
    speed: 85,
    power: 60,
    friction: 55,
    soundType: 'ballpoint',
    perk: { bn: 'সুষম ভারসাম্য ও দ্রুত স্লাইড স্পিড', en: 'Balanced control & quick desk drift' },
    isUnlockedDefault: true,
  },
  {
    id: 'crimson_fighter',
    name: { bn: 'রক্তিম যোদ্ধা লাল', en: 'Crimson Fighter Red' },
    desc: { bn: 'খাতার লাল মার্জিনের মতো উজ্জ্বল ও মারাত্মক ধারালো শট।', en: 'Sharp crimson finish like a red notebook margin line.' },
    pointsRequired: 2,
    barrelColor: '#dc2626',
    capColor: '#991b1b',
    accentColor: '#f87171',
    trailColor: '#ef4444',
    weightGrams: 14,
    speed: 92,
    power: 70,
    friction: 48,
    soundType: 'click',
    perk: { bn: '+১২% ক্ষিপ্র গতি ও ধারালো অ্যাঙ্গেল অ্যাটাক', en: '+12% rapid flick & sharp cutting angles' },
  },
  {
    id: 'emerald_nib',
    name: { bn: 'পান্না সবুজ জেল পেন', en: 'Emerald Gel Nib Green' },
    desc: { bn: 'মসৃণ জেল ফ্লো ও বেঞ্চে দুর্দান্ত নিয়ন্ত্রণ। রিংআউট প্রতিরোধক।', en: 'Smooth gel flow with high desk surface adhesion.' },
    pointsRequired: 5,
    barrelColor: '#15803d',
    capColor: '#166534',
    accentColor: '#4ade80',
    trailColor: '#22c55e',
    weightGrams: 16,
    speed: 78,
    power: 75,
    friction: 80,
    soundType: 'gel',
    perk: { bn: 'বেঞ্চে শক্ত গ্রিপ ও অ্যান্টি-স্লিপ নিয়ন্ত্রণ', en: 'Superior desk grip & anti-slip braking' },
  },
  {
    id: 'golden_hero',
    name: { bn: 'সোনার হিরো ৩৩২ ঝর্ণা কলম', en: 'Golden Hero 332 Fountain' },
    desc: { bn: 'সোনার নিব ও ভারী মেটাল ক্যাপ সম্বলিত রাজকীয় নকআউট কলম।', en: 'Royal fountain pen with brass weight and massive knockback.' },
    pointsRequired: 10,
    barrelColor: '#854d0e',
    capColor: '#eab308',
    accentColor: '#fef08a',
    trailColor: '#eab308',
    weightGrams: 28,
    speed: 68,
    power: 96,
    friction: 70,
    soundType: 'metallic',
    perk: { bn: 'দানবীয় ধাক্কা শক্তি (Heavy Impact Knockback)', en: 'Devastating heavy impact knockback' },
  },
  {
    id: 'shadow_stealth',
    name: { bn: 'শ্যাডো ব্ল্যাক মার্কার', en: 'Shadow Stealth Permanent' },
    desc: { bn: 'কালো কালির গভীর ওজন, বেঞ্চের প্রান্ত থেকে ফেলে দেওয়া প্রায় অসম্ভব।', en: 'Heavy desk anchor mass with dark matte finish.' },
    pointsRequired: 15,
    barrelColor: '#18181b',
    capColor: '#27272a',
    accentColor: '#71717a',
    trailColor: '#52525b',
    weightGrams: 32,
    speed: 62,
    power: 90,
    friction: 92,
    soundType: 'heavy',
    perk: { bn: 'বেঞ্চের কিনারে অটোরোধক নোঙর মাস', en: 'Edge anchor defense & edge rebound stability' },
  },
  {
    id: 'rainbow_master',
    name: { bn: 'রংধনু কালির গ্র্যান্ডমাস্টার', en: 'Grandmaster Rainbow Magic' },
    desc: { bn: 'শৈশবের ৪ রঙের মাল্টিকালার ম্যাজিক কলম! মাল্টি-কালার ট্রায়াল।', en: 'Legendary 4-color school magic pen with rainbow sparkles.' },
    pointsRequired: 25,
    barrelColor: '#7c3aed',
    capColor: '#ec4899',
    accentColor: '#06b6d4',
    trailColor: '#ec4899',
    weightGrams: 22,
    speed: 90,
    power: 94,
    friction: 75,
    soundType: 'metallic',
    perk: { bn: 'রংধনু স্পার্ক ট্রায়াল ও অল-রাউন্ডার সুপার পাওয়ার', en: 'Rainbow spark trail & all-round championship boost' },
  },
];
