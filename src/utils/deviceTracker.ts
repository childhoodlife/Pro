/**
 * Device Identification and Daily Gameplay Analytics
 * Ensures 1 device is uniquely identified and tracks daily match wins & losses.
 */

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  gamesPlayed: number;
  wins: number;
  losses: number;
}

export interface DeviceData {
  deviceId: string;
  createdDate: string;
  totalDevicesCount: number; // Simulated community device count + 1 for this device
  dailyRecords: Record<string, DailyRecord>; // keyed by date string
}

const DEVICE_STORAGE_KEY = 'childhood_life_device_data_v1';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateDeviceId(): string {
  const randNum = Math.floor(10000 + Math.random() * 90000);
  return `DEV-CL-${randNum}`;
}

export function getDeviceData(): DeviceData {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'DEV-CL-10001',
      createdDate: getTodayKey(),
      totalDevicesCount: 1248,
      dailyRecords: {},
    };
  }

  try {
    const raw = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (raw) {
      const parsed: DeviceData = JSON.parse(raw);
      // Ensure today's record exists
      const today = getTodayKey();
      if (!parsed.dailyRecords[today]) {
        parsed.dailyRecords[today] = {
          date: today,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
        };
      }
      return parsed;
    }
  } catch {}

  // Initialize new device
  const today = getTodayKey();
  const newDevice: DeviceData = {
    deviceId: generateDeviceId(),
    createdDate: today,
    totalDevicesCount: 1284, // Base active devices count
    dailyRecords: {
      [today]: {
        date: today,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
      },
    },
  };

  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(newDevice));
  } catch {}

  return newDevice;
}

export function recordGameResult(result: 'win' | 'loss' | 'draw') {
  const data = getDeviceData();
  const today = getTodayKey();

  if (!data.dailyRecords[today]) {
    data.dailyRecords[today] = {
      date: today,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
    };
  }

  data.dailyRecords[today].gamesPlayed += 1;
  if (result === 'win') {
    data.dailyRecords[today].wins += 1;
  } else if (result === 'loss') {
    data.dailyRecords[today].losses += 1;
  }

  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function getTodayStats(): DailyRecord {
  const data = getDeviceData();
  const today = getTodayKey();
  return (
    data.dailyRecords[today] || {
      date: today,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
    }
  );
}
