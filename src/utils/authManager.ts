import { db, isFirebaseConfigured } from './firebaseClient';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { getDeviceData } from './deviceTracker';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  unlockedSkins: string[];
  equippedSkin: string;
  createdAt: string;
  deviceId: string;
}

const USERS_STORAGE_KEY = 'childhood_registered_users_v2';
const CURRENT_USER_KEY = 'childhood_current_user_v2';
const DEVICE_ACCOUNTS_KEY = 'childhood_device_accounts_v2';
const DEVICE_BLOCKED_KEY = 'childhood_device_blocked_v2';

export function isDeviceBlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DEVICE_BLOCKED_KEY) === 'true';
}

export function setDeviceBlocked(blocked: boolean) {
  if (typeof window === 'undefined') return;
  if (blocked) {
    localStorage.setItem(DEVICE_BLOCKED_KEY, 'true');
  } else {
    localStorage.removeItem(DEVICE_BLOCKED_KEY);
  }
}

export function getDeviceAccounts(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEVICE_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserProfile | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function getStoredUsers(): Record<string, { user: UserProfile; passwordHash: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredUsers(users: Record<string, { user: UserProfile; passwordHash: string }>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

// 1. REGISTER ACCOUNT WITH 3-ACCOUNT DEVICE LIMIT & AUTO-BLOCK
export async function registerAccount(
  name: string,
  email: string,
  password: string,
  phone: string
): Promise<{ success: boolean; message: string; user?: UserProfile }> {
  const normEmail = email.trim().toLowerCase();

  // Check if device is already auto-blocked
  if (isDeviceBlocked()) {
    return {
      success: false,
      message: 'এই ফোনটি নিরাপত্তা জনিত কারণে অটো-ব্লক করা হয়েছে (৩টির বেশি একাউন্ট তৈরি করায়)।',
    };
  }

  const deviceAccounts = getDeviceAccounts();
  const deviceData = getDeviceData();

  // Check device limit (Max 3 accounts per device)
  if (deviceAccounts.length >= 3 && !deviceAccounts.includes(normEmail)) {
    setDeviceBlocked(true);
    return {
      success: false,
      message: 'নিরাপত্তা সতর্কতা! একটি ফোনে সর্বোচ্চ ৩টি একাউন্ট অনুমোদনযোগ্য। সীমা অতিক্রম করায় ডিভাইসটি অটো-ব্লক করা হয়েছে!',
    };
  }

  const allUsers = getStoredUsers();
  if (allUsers[normEmail]) {
    return {
      success: false,
      message: 'এই ইমেইল দিয়ে ইতোমধ্যে একটি একাউন্ট তৈরি করা আছে। দয়া করে লগইন করুন।',
    };
  }

  const newUser: UserProfile = {
    id: `USER-${Date.now()}`,
    name: name.trim(),
    email: normEmail,
    phone: phone.trim(),
    points: 0,
    unlockedSkins: ['reynolds_blue'],
    equippedSkin: 'reynolds_blue',
    createdAt: new Date().toISOString(),
    deviceId: deviceData.deviceId,
  };

  // Save to local database
  allUsers[normEmail] = {
    user: newUser,
    passwordHash: btoa(password), // Simple encoding for local store
  };
  saveStoredUsers(allUsers);

  // Update device registered accounts list
  if (!deviceAccounts.includes(normEmail)) {
    deviceAccounts.push(normEmail);
    localStorage.setItem(DEVICE_ACCOUNTS_KEY, JSON.stringify(deviceAccounts));
  }

  // Attempt Firebase Firestore sync
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'profiles', newUser.id), {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        points: newUser.points,
        unlockedSkins: newUser.unlockedSkins,
        equippedSkin: newUser.equippedSkin,
        deviceId: newUser.deviceId,
        createdAt: newUser.createdAt,
      });
    } catch (e) {
      console.warn('Firebase registration sync note:', e);
    }
  }

  setCurrentUser(newUser);
  return { success: true, message: 'রেজিস্ট্রেশন সফল হয়েছে!', user: newUser };
}

// 2. LOGIN ACCOUNT
export async function loginAccount(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: UserProfile }> {
  if (isDeviceBlocked()) {
    return {
      success: false,
      message: 'এই ডিভাইসটি অটো-ব্লকড। অ্যাডমিনের সাথে যোগাযোগ করুন।',
    };
  }

  const normEmail = email.trim().toLowerCase();
  const allUsers = getStoredUsers();
  const entry = allUsers[normEmail];

  if (!entry) {
    return {
      success: false,
      message: 'এই ইমেইল দিয়ে কোনো একাউন্ট খুঁজে পাওয়া যায়নি। দয়া করে সঠিক ইমেইল দিন বা রেজিস্টার করুন।',
    };
  }

  if (entry.passwordHash !== btoa(password)) {
    return {
      success: false,
      message: 'ভুল পাসওয়ার্ড! দয়া করে সঠিক পাসওয়ার্ড দিন অথবা Forgot Password ব্যবহার করুন।',
    };
  }

  setCurrentUser(entry.user);
  return { success: true, message: 'লগইন সফল হয়েছে!', user: entry.user };
}

// 3. FORGOT PASSWORD & PASSWORD RESET
export function initiatePasswordReset(email: string): { success: boolean; resetCode?: string; message: string } {
  const normEmail = email.trim().toLowerCase();
  const allUsers = getStoredUsers();

  if (!allUsers[normEmail]) {
    return {
      success: false,
      message: 'এই ইমেইলটি আমাদের সিস্টেমে নিবন্ধিত নেই।',
    };
  }

  // Generate 4-digit verification code
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  sessionStorage.setItem(`reset_${normEmail}`, code);

  return {
    success: true,
    resetCode: code,
    message: `ভেরিফিকেশন কোড পাঠানো হয়েছে: ${code}`,
  };
}

export function completePasswordReset(
  email: string,
  code: string,
  newPassword: string
): { success: boolean; message: string } {
  const normEmail = email.trim().toLowerCase();
  const storedCode = sessionStorage.getItem(`reset_${normEmail}`);

  if (!storedCode || storedCode !== code.trim()) {
    return {
      success: false,
      message: 'ভেরিফিকেশন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ হয়েছে।',
    };
  }

  const allUsers = getStoredUsers();
  if (!allUsers[normEmail]) {
    return { success: false, message: 'একাউন্ট খুঁজে পাওয়া যায়নি।' };
  }

  allUsers[normEmail].passwordHash = btoa(newPassword);
  saveStoredUsers(allUsers);
  sessionStorage.removeItem(`reset_${normEmail}`);

  return {
    success: true,
    message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।',
  };
}

// 4. AWARD MATCH WIN POINT (+1 POINT ON EACH VICTORY)
export function awardMatchWinPoint(): { points: number; newUnlock?: string } {
  const user = getCurrentUser();
  if (!user) return { points: 0 };

  user.points += 1;
  setCurrentUser(user);

  // Sync locally
  const allUsers = getStoredUsers();
  if (allUsers[user.email]) {
    allUsers[user.email].user = user;
    saveStoredUsers(allUsers);
  }

  // Sync to Firebase if configured
  if (isFirebaseConfigured() && db) {
    try {
      updateDoc(doc(db, 'profiles', user.id), {
        points: user.points,
      }).catch(() => {});
    } catch {}
  }

  return { points: user.points };
}

// 5. EQUIP SKIN
export function equipSkin(skinId: string): boolean {
  const user = getCurrentUser();
  if (!user || !user.unlockedSkins.includes(skinId)) return false;

  user.equippedSkin = skinId;
  setCurrentUser(user);

  const allUsers = getStoredUsers();
  if (allUsers[user.email]) {
    allUsers[user.email].user = user;
    saveStoredUsers(allUsers);
  }

  // Sync to Firebase if configured
  if (isFirebaseConfigured() && db) {
    try {
      updateDoc(doc(db, 'profiles', user.id), {
        equippedSkin: user.equippedSkin,
      }).catch(() => {});
    } catch {}
  }

  return true;
}

// 6. PURCHASE SKIN WITH POINTS (DEDUCTS COST FROM USER BALANCE)
export function purchaseSkinWithPoints(skinId: string, cost: number): { success: boolean; message: string; remainingPoints?: number } {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, message: 'দয়া করে প্রথমে একাউন্টে লগইন করুন।' };
  }

  if (user.unlockedSkins.includes(skinId)) {
    return { success: true, message: 'এই স্কিনটি ইতোমধ্যেই কেনা আছে!' };
  }

  if (user.points < cost) {
    return {
      success: false,
      message: `অপর্যাপ্ত পয়েন্ট! এই স্কিনটি কিনতে ${cost} পয়েন্ট লাগবে, আপনার ব্যালেন্সে আছে ${user.points}★ পয়েন্ট (আরও ${cost - user.points} পয়েন্ট প্রয়োজন)।`,
    };
  }

  // DEDUCT POINTS FROM USER BALANCE
  user.points -= cost;
  user.unlockedSkins.push(skinId);
  user.equippedSkin = skinId;
  setCurrentUser(user);

  const allUsers = getStoredUsers();
  if (allUsers[user.email]) {
    allUsers[user.email].user = user;
    saveStoredUsers(allUsers);
  }

  if (isFirebaseConfigured() && db) {
    try {
      updateDoc(doc(db, 'profiles', user.id), {
        points: user.points,
        unlockedSkins: user.unlockedSkins,
        equippedSkin: user.equippedSkin,
      }).catch(() => {});
    } catch {}
  }

  return {
    success: true,
    message: `অভিনন্দন! আপনার ব্যালেন্স থেকে ${cost}★ পয়েন্ট কেটে স্কিনটি কেনা হয়েছে এবং ইক্যুইপ করা হয়েছে। বর্তমান ব্যালেন্স: ${user.points}★`,
    remainingPoints: user.points,
  };
}

// 7. TOTAL REAL REGISTERED USERS COUNT (NO FAKE STATIC NUMBERS)
export function getTotalRegisteredUsersCount(): number {
  const stored = getStoredUsers();
  const keys = Object.keys(stored);
  // Ensure we count real registered accounts
  return Math.max(keys.length, 1);
}

// 8. LIVE TOP PLAYERS LEADERBOARD
export function getAllPlayersLeaderboard(): Array<{
  id: string;
  name: string;
  points: number;
  equippedSkin: string;
  isCurrentDevice?: boolean;
}> {
  const stored = getStoredUsers();
  const current = getCurrentUser();
  const list = Object.values(stored).map((entry) => ({
    id: entry.user.id,
    name: entry.user.name,
    points: entry.user.points,
    equippedSkin: entry.user.equippedSkin,
    isCurrentDevice: current ? entry.user.id === current.id : false,
  }));

  if (current && !list.find((p) => p.id === current.id)) {
    list.push({
      id: current.id,
      name: current.name,
      points: current.points,
      equippedSkin: current.equippedSkin,
      isCurrentDevice: true,
    });
  }

  return list.sort((a, b) => b.points - a.points);
}

// Logout
export function logoutUser() {
  setCurrentUser(null);
}


