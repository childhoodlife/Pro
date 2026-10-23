import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Phone,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  Database,
  ArrowRight,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import {
  loginAccount,
  registerAccount,
  initiatePasswordReset,
  completePasswordReset,
  getDeviceAccounts,
  isDeviceBlocked,
  UserProfile,
} from '../../utils/authManager';
import { firebaseConfig, isFirebaseConfigured } from '../../utils/firebaseClient';
import { sound } from '../../utils/audio';
import { voiceCoach } from '../../utils/voiceCoach';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
  language: 'en' | 'bn';
}

type AuthTab = 'login' | 'register' | 'forgot' | 'firebase';

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, language }) => {
  const [tab, setTab] = useState<AuthTab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot Password
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [codeGeneratedToast, setCodeGeneratedToast] = useState<string | null>(null);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const deviceAccounts = getDeviceAccounts();
  const deviceBlocked = isDeviceBlocked();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    sound.playPenClick();

    const res = await loginAccount(email, password);
    setIsLoading(false);

    if (res.success && res.user) {
      sound.playBoxComplete();
      voiceCoach.speak(language === 'bn' ? `স্বাগতম ${res.user.name}!` : `Welcome ${res.user.name}!`, language);
      onSuccess(res.user);
    } else {
      setErrorMsg(res.message);
      sound.playCollisionSound(0.5);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 4) {
      setErrorMsg('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('পাসওয়ার্ড দুটি মেলেনি।');
      return;
    }

    setIsLoading(true);
    sound.playPenClick();

    const res = await registerAccount(name, email, password, phone);
    setIsLoading(false);

    if (res.success && res.user) {
      sound.playVictoryBell();
      voiceCoach.speak('রেজিস্ট্রেশন সফল হয়েছে! চাইল্ডহুড লাইফে আপনাকে স্বাগতম!', 'bn');
      onSuccess(res.user);
    } else {
      setErrorMsg(res.message);
      sound.playCollisionSound(0.6);
    }
  };

  const handleForgotStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    sound.playPenClick();

    const res = initiatePasswordReset(email);
    if (res.success && res.resetCode) {
      setResetStep(2);
      setCodeGeneratedToast(`ভেরিফিকেশন কোড: ${res.resetCode}`);
      sound.playBoxComplete();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleForgotStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    sound.playPenClick();

    const res = completePasswordReset(email, resetCode, newPassword);
    if (res.success) {
      setSuccessMsg(res.message);
      setTab('login');
      setPassword(newPassword);
      setResetStep(1);
      sound.playVictoryBell();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-stone-900 border-2 border-amber-500/50 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header with App Logo & Branding */}
        <div className="p-6 pb-4 border-b border-stone-800 bg-stone-950/80 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 mx-auto flex items-center justify-center text-amber-400 mb-2.5 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-bold text-amber-100 font-handwriting tracking-wide">
            Childhood Life
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            {language === 'bn' ? 'খেলার জন্য একাউন্টে লগইন করুন' : 'Login or Register to Play'}
          </p>

          {/* Device Counter Badge */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-700 text-[10px] text-stone-300 font-mono">
            <Smartphone className="w-3 h-3 text-amber-400" />
            <span>এই ফোনে নিবন্ধিত একাউন্ট: {deviceAccounts.length}/৩ টি</span>
          </div>
        </div>

        {/* Device Blocked Banner */}
        {deviceBlocked && (
          <div className="p-4 bg-red-950/90 border-b border-red-800 text-red-200 text-xs flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <div className="font-bold text-red-300">ডিভাইস অটো-ব্লক করা হয়েছে!</div>
              <div className="text-[11px] text-red-200/90 mt-0.5">
                একটি ফোন থেকে সর্বোচ্চ ৩টি অ্যাকাউন্ট অনুমোদিত। অতিরিক্ত অ্যাকাউন্ট তৈরির চেষ্টার কারণে অটো ব্লক কার্যকর হয়েছে।
              </div>
            </div>
          </div>
        )}

        {/* Tabs: Login / Register / Forgot / Supabase */}
        {!deviceBlocked && (
          <div className="flex border-b border-stone-800 bg-stone-950/50 text-xs font-semibold">
            <button
              onClick={() => {
                sound.playPenClick();
                setTab('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                tab === 'login'
                  ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              লগইন (Login)
            </button>
            <button
              onClick={() => {
                sound.playPenClick();
                setTab('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                tab === 'register'
                  ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              রেজিস্ট্রেশন (Sign Up)
            </button>
            <button
              onClick={() => {
                sound.playPenClick();
                setTab('firebase');
                setErrorMsg(null);
              }}
              title="Firebase Connect"
              className={`px-3 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                tab === 'firebase'
                  ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                  : 'border-transparent text-stone-500 hover:text-amber-300'
              }`}
            >
              <Database className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-semibold">Firebase</span>
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {codeGeneratedToast && (
            <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-200 text-xs shadow-lg animate-bounce">
              <div className="font-bold text-amber-300 mb-0.5">📩 ইমেইল ভেরিফিকেশন কোড:</div>
              <div className="font-mono text-base font-bold text-amber-400">{codeGeneratedToast}</div>
              <div className="text-[10px] text-stone-400 mt-1">কোডটি নিচে টাইপ করে নতুন পাসওয়ার্ড দিন।</div>
            </div>
          )}

          {/* 1. LOGIN TAB */}
          {tab === 'login' && !deviceBlocked && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">ইমেইল এড্রেস (Email)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">পাসওয়ার্ড (Password)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    sound.playPenClick();
                    setTab('forgot');
                    setErrorMsg(null);
                  }}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  পাসওয়ার্ড ভুলে গেছেন? (Forgot Password)
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>লগইন করুন (Enter Game)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* 2. REGISTER TAB */}
          {tab === 'register' && !deviceBlocked && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">আপনার নাম (Full Name)</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanvir Rahman"
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">ইমেইল (Email)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">ফোন নম্বর (Phone Number)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">পাসওয়ার্ড</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">কনফার্ম পাসওয়ার্ড</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-950 border border-stone-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 text-[10px] text-stone-400 leading-relaxed">
                🛡️ <strong className="text-stone-300">ডিভাইস সুরক্ষা নিয়ম:</strong> একটি ফোন থেকে সর্বোচ্চ ৩টি অ্যাকাউন্ট খোলা যাবে। ৩টির বেশি খোলার চেষ্টা করলে ডিভাইস অটো-ব্লক হবে।
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>রেজিস্টার করুন ও ১ পয়েন্ট বোনাস পান</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD TAB */}
          {tab === 'forgot' && !deviceBlocked && (
            <div className="space-y-3.5">
              <div className="text-center">
                <KeyRound className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                <h3 className="text-sm font-bold text-amber-200">পাসওয়ার্ড রিসেট (Forgot Password)</h3>
                <p className="text-[11px] text-stone-400">আপনার নিবন্ধিত ইমেইল দিয়ে নতুন পাসওয়ার্ড সেট করুন</p>
              </div>

              {resetStep === 1 ? (
                <form onSubmit={handleForgotStep1} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">নিবন্ধিত ইমেইল এড্রেস</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition-all"
                  >
                    ভেরিফিকেশন কোড পাঠান
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotStep2} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">ভেরিফিকেশন কোড (৪ ডিজিট)</label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="e.g. 7421"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">নতুন পাসওয়ার্ড (New Password)</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition-all"
                  >
                    পাসওয়ার্ড পরিবর্তন করুন ও লগইন করুন
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playPenClick();
                    setTab('login');
                  }}
                  className="text-xs text-stone-400 hover:text-white"
                >
                  ← লগইনে ফিরে যান
                </button>
              </div>
            </div>
          )}

          {/* 4. FIREBASE CONFIGURATION TAB */}
          {tab === 'firebase' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <Database className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-amber-200">Firebase ক্লাউড ডাটাবেজ</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>সংযুক্ত (Connected)</span>
                </span>
              </div>

              <p className="text-[11px] text-stone-400 leading-relaxed">
                আপনার দেওয়া প্রজেক্ট <strong className="text-amber-300 font-mono">childhoodlife-acdc7</strong> এর সাথে গেমটি সরাসরি সংযুক্ত। প্রতিটি খেলোয়াড়ের প্রোফাইল, পয়েন্ট ও স্কিন স্বয়ংক্রিয়ভাবে ক্লাউডে সিঙ্ক হয়!
              </p>

              <div className="space-y-2 p-3 bg-stone-950/80 rounded-xl border border-stone-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-stone-500 block">Project ID:</span>
                  <span className="text-amber-300 font-semibold">{firebaseConfig.projectId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Auth Domain:</span>
                  <span className="text-stone-300 text-[11px]">{firebaseConfig.authDomain}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Database URL:</span>
                  <span className="text-stone-300 text-[11px] truncate block">{firebaseConfig.databaseURL}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Storage Bucket:</span>
                  <span className="text-stone-300 text-[11px]">{firebaseConfig.storageBucket}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">App ID:</span>
                  <span className="text-stone-400 text-[10px]">{firebaseConfig.appId}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300/90 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>সব ইউজার ডেটা ও ম্যাচ জয়ের পয়েন্ট ক্লাউডে রিয়েলটাইমে সংরক্ষিত হচ্ছে।</span>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition-all"
                >
                  ← লগইনে ফিরে যান
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
