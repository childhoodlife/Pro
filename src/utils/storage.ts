import { Language } from './translations';
import { ChildhoodMelodyId } from './audio';

export type AppTheme = 'vintage_nostalgia' | 'golden_school' | 'notebook' | 'grid' | 'wood' | 'blackboard';

export interface GameSettings {
  language: Language;
  theme: AppTheme;
  vintageRetroMode: boolean;
  sfx: boolean;
  music: boolean;
  melodyId: ChildhoodMelodyId;
  voiceCoach: boolean;
  vibration: boolean;
  player1Name: string;
  player2Name: string;
  player1Color: string;
  player2Color: string;
}

export interface GameStats {
  totalPlayed: number;
  pfWinsP1: number;
  pfWinsP2: number;
  pfRingouts: number;
  dbWinsP1: number;
  dbWinsP2: number;
  dbBoxesCapturedP1: number;
  dbBoxesCapturedP2: number;
  katakutiWins: number;
}

const SETTINGS_KEY = 'childhood_life_settings_v2';
const STATS_KEY = 'childhood_life_stats_v2';

const DEFAULT_SETTINGS: GameSettings = {
  language: 'bn',
  theme: 'vintage_nostalgia',
  vintageRetroMode: true,
  sfx: true,
  music: false,
  melodyId: 'purano_shei',
  voiceCoach: true,
  vibration: true,
  player1Name: 'P1 (নীল কলম)',
  player2Name: 'P2 (লাল কলম)',
  player1Color: '#1d4ed8',
  player2Color: '#dc2626',
};

const DEFAULT_STATS: GameStats = {
  totalPlayed: 0,
  pfWinsP1: 0,
  pfWinsP2: 0,
  pfRingouts: 0,
  dbWinsP1: 0,
  dbWinsP2: 0,
  dbBoxesCapturedP1: 0,
  dbBoxesCapturedP2: 0,
  katakutiWins: 0,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: GameStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export function recordPenFightWin(winner: 1 | 2, wasRingout: boolean) {
  const stats = loadStats();
  stats.totalPlayed += 1;
  if (winner === 1) stats.pfWinsP1 += 1;
  else stats.pfWinsP2 += 1;
  if (wasRingout) stats.pfRingouts += 1;
  saveStats(stats);
}

export function recordDotsBoxesWin(winner: 1 | 2 | 0, p1Boxes: number, p2Boxes: number) {
  const stats = loadStats();
  stats.totalPlayed += 1;
  if (winner === 1) stats.dbWinsP1 += 1;
  else if (winner === 2) stats.dbWinsP2 += 1;
  stats.dbBoxesCapturedP1 += p1Boxes;
  stats.dbBoxesCapturedP2 += p2Boxes;
  saveStats(stats);
}

export function recordKatakutiWin() {
  const stats = loadStats();
  stats.totalPlayed += 1;
  stats.katakutiWins += 1;
  saveStats(stats);
}

export function clearStats() {
  saveStats(DEFAULT_STATS);
}
