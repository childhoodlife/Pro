/**
 * Unlimited Progressive Level System for Childhood Life games.
 * Levels progress: 1, 2, 3, ... unlimited!
 * Each level increases difficulty, AI intelligence, and awards bonus match points.
 */

export type GameKey =
  | 'pen_fight'
  | 'dots_boxes'
  | 'katakuti'
  | 'fruit_slice'
  | 'bottle_smash'
  | 'chess';

const LEVELS_STORAGE_KEY = 'childhood_game_levels_v1';

export interface LevelInfo {
  level: number;
  titleBn: string;
  titleEn: string;
  objectiveBn: string;
  objectiveEn: string;
  difficultyLabelBn: string;
  difficultyLabelEn: string;
  aiDifficultyRatio: number; // 0.2 (easy) to 1.5+ (hardest)
  targetScore: number;
}

export function getAllGameLevels(): Record<GameKey, number> {
  if (typeof window === 'undefined') {
    return {
      pen_fight: 1,
      dots_boxes: 1,
      katakuti: 1,
      fruit_slice: 1,
      bottle_smash: 1,
      chess: 1,
    };
  }

  try {
    const raw = localStorage.getItem(LEVELS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        pen_fight: parsed.pen_fight || 1,
        dots_boxes: parsed.dots_boxes || 1,
        katakuti: parsed.katakuti || 1,
        fruit_slice: parsed.fruit_slice || 1,
        bottle_smash: parsed.bottle_smash || 1,
        chess: parsed.chess || 1,
      };
    }
  } catch {}

  return {
    pen_fight: 1,
    dots_boxes: 1,
    katakuti: 1,
    fruit_slice: 1,
    bottle_smash: 1,
    chess: 1,
  };
}

export function getGameLevel(gameKey: GameKey): number {
  const levels = getAllGameLevels();
  return levels[gameKey] || 1;
}

export function advanceGameLevel(gameKey: GameKey): {
  newLevel: number;
  bonusPoints: number;
} {
  const levels = getAllGameLevels();
  const current = levels[gameKey] || 1;
  const newLevel = current + 1;
  levels[gameKey] = newLevel;

  try {
    localStorage.setItem(LEVELS_STORAGE_KEY, JSON.stringify(levels));
  } catch {}

  // Bonus points scale with level: +1 point per level milestone
  return { newLevel, bonusPoints: 1 };
}

export function getLevelDetails(gameKey: GameKey, level: number): LevelInfo {
  // Scaling difficulty ratio based on level
  const aiDifficultyRatio = Math.min(0.3 + level * 0.15, 2.5);

  switch (gameKey) {
    case 'pen_fight':
      return {
        level,
        titleBn: `লেভেল ${level}: ${level <= 2 ? 'প্রাথমিক বেঞ্চ ম্যাচ' : level <= 5 ? 'টিফিন বিরতির যুদ্ধ' : 'গ্র্যান্ডমাস্টার পেন ফাইট'}`,
        titleEn: `Level ${level}: ${level <= 2 ? 'Beginner Bench Match' : level <= 5 ? 'Tiffin Recess Clash' : 'Grandmaster Pen Fight'}`,
        objectiveBn: `প্রতিপক্ষকে বেঞ্চ থেকে রিংআউট করে ৩টি রাউন্ডে বিজয়ী হোন (কম্পিউটার গতি: +${level * 10}%)`,
        objectiveEn: `Knock opponent off desk to win 3 rounds (AI Speed: +${level * 10}%)`,
        difficultyLabelBn: level === 1 ? 'সহজ' : level <= 3 ? 'মাঝারি' : level <= 7 ? 'কঠিন' : 'দানবীয় ওস্তাদ',
        difficultyLabelEn: level === 1 ? 'Casual' : level <= 3 ? 'Smart' : level <= 7 ? 'Hard' : 'Legendary',
        aiDifficultyRatio,
        targetScore: 3,
      };

    case 'dots_boxes':
      return {
        level,
        titleBn: `লেভেল ${level}: ${level <= 2 ? 'খাতার গ্রিড দখল' : level <= 5 ? 'বক্স ক্যাপচার মাস্টার' : 'অসীম বক্স স্ট্র্যাটেজিস্ট'}`,
        titleEn: `Level ${level}: ${level <= 2 ? 'Notebook Grid Grab' : level <= 5 ? 'Box Capture Master' : 'Infinite Box Strategist'}`,
        objectiveBn: `কম্পিউটারকে ফাঁদে ফেলে সর্বাধিক বক্স দখল করুন (AI গভীরতা: লেভেল ${level})`,
        objectiveEn: `Outsmart the AI and capture the majority of boxes (AI Depth: Lv ${level})`,
        difficultyLabelBn: level === 1 ? 'সহজ' : level <= 3 ? 'মাঝারি' : 'কঠিন',
        difficultyLabelEn: level === 1 ? 'Easy' : level <= 3 ? 'Medium' : 'Hard',
        aiDifficultyRatio,
        targetScore: Math.min(8 + level * 2, 20),
      };

    case 'katakuti':
      return {
        level,
        titleBn: `লেভেল ${level}: ${level <= 2 ? 'টিক-ট্যাক-টো চ্যাম্পিয়ন' : 'এস-ও-এস কিং গ্রিড'}`,
        titleEn: `Level ${level}: ${level <= 2 ? 'Tic-Tac-Toe Pro' : 'SOS Master Grid'}`,
        objectiveBn: `টানা ৩টি ঘর বা SOS পূর্ণ করে কম্পিউটারকে পরাজিত করুন`,
        objectiveEn: `Align 3 marks or complete SOS lines against the AI`,
        difficultyLabelBn: level <= 2 ? 'সাধারণ' : level <= 5 ? 'বুদ্ধিদীপ্ত' : 'অপরাজেয়',
        difficultyLabelEn: level <= 2 ? 'Normal' : level <= 5 ? 'Smart' : 'Invincible',
        aiDifficultyRatio,
        targetScore: 1,
      };

    case 'fruit_slice': {
      const targetScore = Math.min(100 + (level - 1) * 20, 300);
      return {
        level,
        titleBn: `লেভেল ${level}: ${level <= 2 ? 'মৌসুমি ফল কাটার সূচনা' : level <= 5 ? 'দ্রুত নিব ব্লেড সোয়াইপ' : 'সুপার নিনজা ফ্রুট কাটার'}`,
        titleEn: `Level ${level}: ${level <= 2 ? 'Seasonal Harvest' : level <= 5 ? 'Rapid Blade Swipe' : 'Grandmaster Fruit Slicer'}`,
        objectiveBn: `চক বোমা এড়িয়ে দ্রুত ফল কেটে ${targetScore} স্কোর অর্জন করে লেভেল শেষ করুন`,
        objectiveEn: `Slice flying fruits and dodge chalk bombs to reach ${targetScore} points`,
        difficultyLabelBn: level === 1 ? 'সহজ' : level <= 3 ? 'চ্যালেঞ্জিং' : 'দ্রুততম গতি',
        difficultyLabelEn: level === 1 ? 'Easy' : level <= 3 ? 'Challenging' : 'Hyper Speed',
        aiDifficultyRatio,
        targetScore,
      };
    }

    case 'bottle_smash': {
      const targetScore = Math.min(100 + (level - 1) * 20, 300);
      return {
        level,
        titleBn: `লেভেল ${level}: ${level <= 2 ? 'গুলতির সহজ নিশানা' : level <= 5 ? 'চলমান কাঁচের বোতল' : 'স্নাইপার গুলতি ওস্তাদ'}`,
        titleEn: `Level ${level}: ${level <= 2 ? 'Slingshot Aim' : level <= 5 ? 'Moving Target Ledge' : 'Sniper Slingshot Master'}`,
        objectiveBn: `পাথর ছুড়ে কাঁচের বোতল ভেঙে ${targetScore} স্কোর অর্জন করুন`,
        objectiveEn: `Smash glass bottles with slingshot pebbles to reach ${targetScore} points`,
        difficultyLabelBn: level === 1 ? 'সহজ' : level <= 3 ? 'মাঝারি' : 'কঠিন নিশানা',
        difficultyLabelEn: level === 1 ? 'Easy' : level <= 3 ? 'Medium' : 'Hard Target',
        aiDifficultyRatio,
        targetScore,
      };
    }

    case 'chess':
      return {
        level,
        titleBn: `লেভেল ${level}: ${level <= 2 ? 'স্কুল দাবা নবাগত' : level <= 5 ? 'ক্লাব চ্যাম্পিয়ন দাবাড়ু' : 'গ্র্যান্ডমাস্টার দাবা রণক্ষেত্র'}`,
        titleEn: `Level ${level}: ${level <= 2 ? 'School Chess Novice' : level <= 5 ? 'Club Chess Fighter' : 'Grandmaster Chess Battlefield'}`,
        objectiveBn: `বোর্ডের কেন্দ্র দখল করে প্রতিপক্ষের রাজাকে কিস্তিমাত (Checkmate) করুন (AI ডেপথ: ${level})`,
        objectiveEn: `Control center and checkmate the opponent King (Engine Depth: ${level})`,
        difficultyLabelBn: level === 1 ? 'সহজ (নবাগত)' : level <= 3 ? 'মাঝারি (চালাক)' : 'কঠিন (গ্র্যান্ডমাস্টার)',
        difficultyLabelEn: level === 1 ? 'Novice' : level <= 3 ? 'Intermediate' : 'Master',
        aiDifficultyRatio,
        targetScore: 1,
      };
  }
}
