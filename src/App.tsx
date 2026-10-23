import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Settings,
  HelpCircle,
  Award,
  Smartphone,
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  Mic,
  Bot,
  Palette,
  LogOut,
  Trophy,
  User,
  Home,
  Swords,
  Grid3X3,
  Apple,
  Target,
  Crown,
} from 'lucide-react';
import { translations, Language } from './utils/translations';
import {
  loadSettings,
  saveSettings,
  GameSettings,
  loadStats,
  GameStats,
} from './utils/storage';
import { sound } from './utils/audio';
import { voiceCoach } from './utils/voiceCoach';
import { getCurrentUser, logoutUser, UserProfile } from './utils/authManager';
import { PEN_SKINS } from './utils/skins';
import { PenFightGame } from './components/PenFight/PenFightGame';
import { DotsAndBoxesGame } from './components/DotsAndBoxes/DotsAndBoxesGame';
import { KatakutiGame } from './components/Katakuti/KatakutiGame';
import { FruitSliceGame } from './components/MiniGames/FruitSliceGame';
import { BottleSmashGame } from './components/MiniGames/BottleSmashGame';
import { ChessGame } from './components/Chess/ChessGame';
import { DailyMissionsWidget } from './components/DailyMissionsWidget';
import { LeaderboardWidget } from './components/LeaderboardWidget';
import { FloatingAIButton } from './components/FloatingAIButton';
import { RulesModal } from './components/RulesModal';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { AndroidExportModal } from './components/AndroidExportModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { CreatorFooter } from './components/CreatorFooter';
import { DeviceStatsWidget } from './components/DeviceStatsWidget';
import { AuthModal } from './components/Auth/AuthModal';
import { SkinsModal } from './components/SkinsModal';

// High-fidelity image assets generated for Childhood Life
import heroCoverImg from './assets/images/notebook_desk_cover_1792590335782.jpg';
import penFightImg from './assets/images/pen_fight_banner_1792590336274.jpg';
import dotsBoxesImg from './assets/images/dots_boxes_banner_1792590336752.jpg';
import katakutiImg from './assets/images/katakuti_sos_banner_1792591364947.jpg';
import appIconImg from './assets/images/app_icon_pen_games_1792590336699.jpg';

type ActiveView = 'home' | 'pen_fight' | 'dots_boxes' | 'katakuti' | 'fruit_slice' | 'bottle_smash' | 'chess';

export default function App() {
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [stats, setStats] = useState<GameStats>(() => loadStats());
  const [currentView, setCurrentView] = useState<ActiveView>('home');

  // User Authentication & Skin Wardrobe State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [showSkins, setShowSkins] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Modals
  const [showRules, setShowRules] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAndroidExport, setShowAndroidExport] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Sync audio & voice controller
  useEffect(() => {
    sound.sfxEnabled = settings.sfx;
    sound.vibrationEnabled = settings.vibration;
    voiceCoach.enabled = settings.voiceCoach;
    if (settings.music) {
      sound.startChildhoodMelody(settings.melodyId);
    }
  }, [settings.sfx, settings.music, settings.melodyId, settings.vibration, settings.voiceCoach]);

  const updateSettings = (newPartial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newPartial };
      saveSettings(updated);
      return updated;
    });
  };

  const t = translations[settings.language];

  // Refresh user points and stats whenever navigating to home
  useEffect(() => {
    if (currentView === 'home') {
      setStats(loadStats());
      setCurrentUser(getCurrentUser());
    }
  }, [currentView]);

  const toggleMelody = () => {
    const isPlaying = sound.toggleChildhoodMelody();
    updateSettings({ music: isPlaying });
    if (isPlaying) {
      sound.triggerHaptic(20);
    }
  };

  const toggleSfx = () => {
    const nextVal = !settings.sfx;
    sound.sfxEnabled = nextVal;
    updateSettings({ sfx: nextVal });
    if (nextVal) sound.playPenClick();
  };

  const handleListenOverview = () => {
    sound.playPenClick();
    if (settings.language === 'bn') {
      voiceCoach.speak(
        'চাইল্ডহুড লাইফ গেমে স্বাগতম! স্কুলের বেঞ্চের পেন ফাইট, খাতার বক্স খেলা, কাটাকুটি, ফল কাটা এবং বোতল ভাঙ্গা খেলে শৈশবের স্মৃতিতে ফিরে যান। এইটি তৈরি করেছেন আর এম রাহিমুল।',
        'bn'
      );
    } else {
      voiceCoach.speak(
        'Welcome to Childhood Life! Relive your school days with desk pen fight, dots and boxes, Katakuti, fruit slice, and bottle smash. Created by RM.Rahimul.',
        'en'
      );
    }
  };

  const themeClass =
    settings.theme === 'vintage_nostalgia'
      ? 'bg-vintage-nostalgia'
      : settings.theme === 'golden_school'
      ? 'bg-golden-school'
      : settings.theme === 'notebook'
      ? 'bg-notebook-ruled'
      : settings.theme === 'grid'
      ? 'bg-notebook-grid'
      : settings.theme === 'wood'
      ? 'bg-wood-desk'
      : 'bg-blackboard';

  return (
    <div className={`min-h-screen text-stone-100 flex flex-col transition-colors duration-300 ${themeClass}`}>
      {/* Top Bar Contract */}
      <header className="h-16 border-b border-amber-950/40 bg-stone-950/85 backdrop-blur-md px-4 md:px-8 flex items-center justify-between gap-6 z-40 sticky top-0 shrink-0">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => {
            sound.playPenClick();
            setCurrentView('home');
          }}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus:outline-hidden"
        >
          <img
            src={appIconImg}
            alt="Childhood Life Icon"
            className="w-8 h-8 rounded-lg shadow-md border border-amber-500/30 object-cover"
          />
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-bold tracking-tight text-amber-100 font-handwriting group-hover:text-amber-300 transition-colors leading-tight">
              {t.appName}
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono hidden sm:inline -mt-0.5">
              {t.appEdition}
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-stone-300">
          <button
            onClick={() => {
              sound.playPenClick();
              setCurrentView('pen_fight');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'pen_fight' ? 'text-amber-300 font-semibold underline underline-offset-4' : 'hover:text-amber-200'
            }`}
          >
            {t.penFightTitle}
          </button>
          <button
            onClick={() => {
              sound.playPenClick();
              setCurrentView('dots_boxes');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'dots_boxes' ? 'text-amber-300 font-semibold underline underline-offset-4' : 'hover:text-amber-200'
            }`}
          >
            {t.dotsBoxesTitle}
          </button>
          <button
            onClick={() => {
              sound.playPenClick();
              setCurrentView('katakuti');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'katakuti' ? 'text-amber-300 font-semibold underline underline-offset-4' : 'hover:text-amber-200'
            }`}
          >
            {t.katakutiTitle}
          </button>
          <button
            onClick={() => {
              sound.playPenClick();
              setCurrentView('fruit_slice');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'fruit_slice' ? 'text-amber-300 font-semibold underline underline-offset-4' : 'hover:text-amber-200'
            }`}
          >
            {t.fruitSliceTitle}
          </button>
          <button
            onClick={() => {
              sound.playPenClick();
              setCurrentView('bottle_smash');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'bottle_smash' ? 'text-amber-300 font-semibold underline underline-offset-4' : 'hover:text-amber-200'
            }`}
          >
            {t.bottleSmashTitle}
          </button>
          <button
            onClick={() => {
              sound.playPenClick();
              setCurrentView('chess');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'chess' ? 'text-amber-300 font-semibold underline underline-offset-4' : 'hover:text-amber-200'
            }`}
          >
            {t.chessTitle}
          </button>
          <button
            onClick={() => {
              sound.playPenClick();
              setShowRules(true);
            }}
            className="whitespace-nowrap shrink-0 hover:text-amber-200 transition-colors"
          >
            {t.instructions}
          </button>
        </nav>

        {/* Zone 3: Primary Action, User Profile, AI, & Audio */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* User Account & Skin Trigger */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  sound.playPenClick();
                  setShowSkins(true);
                }}
                title={settings.language === 'bn' ? 'কলমের স্কিন ও ট্রায়াল গ্যালারি' : 'Pen Skins & Trials'}
                className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/50 text-amber-300 hover:from-amber-500/30 hover:to-amber-600/30 transition-all flex items-center gap-1.5 text-xs shadow-xs"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-medium">স্কিন</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-bold font-mono text-[10px]">
                  {currentUser.points}★
                </span>
              </button>

              <button
                onClick={() => {
                  sound.playPenClick();
                  setShowAuthModal(true);
                }}
                title={`${currentUser.name} (${currentUser.email})`}
                className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700 transition-all flex items-center gap-1 text-xs"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline max-w-[80px] truncate">{currentUser.name}</span>
              </button>

              <button
                onClick={() => {
                  sound.playPenClick();
                  logoutUser();
                  setCurrentUser(null);
                  setShowAuthModal(true);
                }}
                title={settings.language === 'bn' ? 'লগআউট / অ্যাকাউন্ট বদল' : 'Logout / Switch'}
                className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sound.playPenClick();
                setShowAuthModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <User className="w-3.5 h-3.5" />
              <span>লগইন করুন</span>
            </button>
          )}

          {/* Spoken Rules Trigger */}
          <button
            onClick={handleListenOverview}
            title={t.listenRules}
            className="hidden sm:flex p-2 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 hover:bg-amber-900/50 transition-colors items-center gap-1.5"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span className="hidden lg:inline text-[11px] whitespace-nowrap">
              {settings.language === 'bn' ? 'নিয়ম শুনুন' : 'Voice'}
            </span>
          </button>

          {/* Childhood melody toggle */}
          <button
            onClick={toggleMelody}
            title={t.childhoodSong}
            className={`p-2 rounded-lg text-xs flex items-center gap-1.5 transition-all border ${
              settings.music
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            <Music className={`w-4 h-4 ${settings.music ? 'animate-bounce' : ''}`} />
            <span className="hidden lg:inline text-[11px] whitespace-nowrap">
              {settings.music ? 'Song On' : 'Song'}
            </span>
          </button>

          {/* SFX Toggle */}
          <button
            onClick={toggleSfx}
            title={t.soundFX}
            className="p-2 rounded-lg bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200 transition-colors"
          >
            {settings.sfx ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              sound.playPenClick();
              setShowSettings(true);
            }}
            title={t.settings}
            className="p-2 rounded-lg bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* 90s Vintage Edition Quick Switch */}
          <button
            onClick={() => {
              sound.playPenClick();
              updateSettings({ vintageRetroMode: !settings.vintageRetroMode });
            }}
            title={settings.language === 'bn' ? 'পুরাতন সংস্করণ মোড চালু/বন্ধ' : 'Toggle 90s Vintage Classroom Edition'}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs ${
              settings.vintageRetroMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-amber-500/10 ring-1 ring-amber-400/30'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            <span className="text-sm">📜</span>
            <span className="hidden md:inline font-mono">
              {settings.language === 'bn' ? 'পুরাতন সংস্করণ' : '90s Vintage'}
            </span>
          </button>

          {/* Instant 1-Tap Language Switcher */}
          <button
            onClick={() => {
              sound.playPenClick();
              const nextLang: Language = settings.language === 'bn' ? 'en' : 'bn';
              updateSettings({ language: nextLang });
            }}
            title={settings.language === 'bn' ? 'Switch to English' : 'বাংলা ভাষায় পরিবর্তন করুন'}
            className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-500/60 text-xs text-amber-300 font-bold transition-all flex items-center gap-1 shrink-0 shadow-xs"
          >
            <span className="text-sm">{settings.language === 'bn' ? '🇬🇧' : '🇧🇩'}</span>
            <span className="hidden sm:inline">{settings.language === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          {/* Android APK */}
          <button
            onClick={() => {
              sound.playPenClick();
              setShowAndroidExport(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android APK</span>
          </button>
        </div>
      </header>

      {/* Main Switcher */}
      <main className="flex-1 flex flex-col">
        {currentView === 'home' && (
          <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 md:p-8">
            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden border border-amber-950/40 bg-stone-900/90 shadow-2xl mb-8">
              <div className="h-56 sm:h-72 w-full relative overflow-hidden">
                <img
                  src={heroCoverImg}
                  alt="Childhood Life Classroom Setting"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-transparent to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-mono mb-1.5">
                    <span>CHILDHOOD LIFE</span>
                    <span>·</span>
                    <span>5 NOSTALGIC GAMES</span>
                    <span>·</span>
                    <span>1V1 &amp; VS AI</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-100 font-handwriting tracking-wide">
                    {t.appName}
                  </h1>
                  <p className="text-stone-300 text-xs sm:text-sm mt-1 leading-relaxed">
                    {t.appSubtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      sound.playPenClick();
                      setShowAI(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-lg active:scale-95"
                  >
                    <Bot className="w-4 h-4 text-stone-950" />
                    <span>{settings.language === 'bn' ? 'স্মার্ট এআই আলাপ' : 'Smart AI'}</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playPenClick();
                      setShowSkins(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/80 text-xs font-semibold text-amber-200 transition-colors shadow"
                  >
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>{settings.language === 'bn' ? 'স্কিন ট্রায়াল' : 'Skins & Trials'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Device Identification & Daily Match Stats Widget */}
            <DeviceStatsWidget t={t} language={settings.language} />

            {/* Daily Missions System Widget */}
            <DailyMissionsWidget
              language={settings.language}
              onRewardClaimed={() => setCurrentUser(getCurrentUser())}
            />

            {/* Top 3 Childhood Games Header */}
            <div className="flex items-center justify-between mb-4 mt-2">
              <div>
                <h3 className="text-lg font-bold text-amber-100 font-handwriting">
                  {settings.language === 'bn' ? 'শৈশবের ক্লাসিক ৩টি গেম' : 'Classic Childhood Games'}
                </h3>
                <p className="text-xs text-stone-400">
                  {settings.language === 'bn'
                    ? '১ বনাম ১ (একই ফোনে ২ জন) এবং ১ বনাম কম্পিউটার (AI)'
                    : '1 vs 1 (Pass & Play on same phone) and 1 vs Computer AI'}
                </p>
              </div>
            </div>

            {/* 3 Childhood Game Cards: Pen Fight, Dots and Boxes, Katakuti */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Card 1: Pen Fight */}
              <div className="group rounded-3xl overflow-hidden border border-stone-800 bg-stone-900/90 shadow-xl flex flex-col transition-all duration-200 hover:border-amber-500/50 hover:shadow-amber-500/10">
                <div className="h-44 w-full relative overflow-hidden bg-stone-950">
                  <img
                    src={penFightImg}
                    alt="Pen Fight"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-xs text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-stone-700/80">
                    GAME 01
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-950/80 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-800">
                    1v1 &amp; AI
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-amber-100 font-handwriting group-hover:text-amber-300 transition-colors">
                      {t.penFightTitle}
                    </h2>
                    <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                      {t.penFightSub}
                    </p>
                    <div className="mt-2 text-[10px] text-amber-400/90 font-mono">
                      ✦ Pen Mods &amp; Tuning · 1v1 &amp; AI
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => {
                        sound.playPenClick();
                        setCurrentView('pen_fight');
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      <Play className="w-3.5 h-3.5 fill-stone-950" />
                      <span>{t.playNow}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Dots and Boxes */}
              <div className="group rounded-3xl overflow-hidden border border-stone-800 bg-stone-900/90 shadow-xl flex flex-col transition-all duration-200 hover:border-amber-500/50 hover:shadow-amber-500/10">
                <div className="h-44 w-full relative overflow-hidden bg-stone-950">
                  <img
                    src={dotsBoxesImg}
                    alt="Dots and Boxes"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-xs text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-stone-700/80">
                    GAME 02
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-950/80 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-800">
                    1v1 &amp; AI
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-amber-100 font-handwriting group-hover:text-amber-300 transition-colors">
                      {t.dotsBoxesTitle}
                    </h2>
                    <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                      {t.dotsBoxesSub}
                    </p>
                    <div className="mt-2 text-[10px] text-amber-400/90 font-mono">
                      ✦ Smart Chain AI &amp; Undo · 1v1 &amp; AI
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => {
                        sound.playPenClick();
                        setCurrentView('dots_boxes');
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      <Play className="w-3.5 h-3.5 fill-stone-950" />
                      <span>{t.playNow}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3: Katakuti & SOS */}
              <div className="group rounded-3xl overflow-hidden border border-stone-800 bg-stone-900/90 shadow-xl flex flex-col transition-all duration-200 hover:border-amber-500/50 hover:shadow-amber-500/10">
                <div className="h-44 w-full relative overflow-hidden bg-stone-950">
                  <img
                    src={katakutiImg}
                    alt="Katakuti and SOS Notebook Page"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-xs text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-stone-700/80">
                    GAME 03
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-950/80 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-800">
                    1v1 &amp; AI
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-amber-100 font-handwriting group-hover:text-amber-300 transition-colors">
                      {t.katakutiTitle}
                    </h2>
                    <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                      {t.katakutiSub}
                    </p>
                    <div className="mt-2 text-[10px] text-amber-400/90 font-mono">
                      ✦ Tic-Tac-Toe &amp; SOS Grid · 1v1 &amp; AI
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => {
                        sound.playPenClick();
                        setCurrentView('katakuti');
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      <Play className="w-3.5 h-3.5 fill-stone-950" />
                      <span>{t.playNow}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* New Nostalgic Games: Fruit Slice & Bottle Smash (100 Pts = Win) */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-amber-100 font-handwriting">
                    {settings.language === 'bn' ? 'নতুন নস্টালজিক খেলা (১০০ পয়েন্ট = জয়)' : 'New Nostalgic Games (100 Pts = Win)'}
                  </h3>
                  <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full font-mono">
                    NEW +1★
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  {settings.language === 'bn'
                    ? '১০০ স্কোর করে ম্যাচ জিতুন এবং একাউন্টে সরাসরি জয় পয়েন্ট ও স্কিন আনলক করুন'
                    : 'Reach 100 points to win +1 victory point and unlock new skins'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Card 4: Fruit Slice (ফল কাটা) */}
              <div className="group rounded-3xl overflow-hidden border border-stone-800 bg-stone-900/90 shadow-xl flex flex-col transition-all duration-200 hover:border-amber-500/50 hover:shadow-amber-500/10">
                <div className="h-44 w-full relative overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-emerald-950 flex items-center justify-center">
                  {/* Decorative Fruit Slice Preview */}
                  <div className="text-6xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                    🥭🍉🍍
                  </div>
                  <div className="absolute inset-0 bg-radial from-transparent to-stone-950/60" />
                  <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-xs text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-stone-700/80">
                    GAME 04
                  </div>
                  <div className="absolute top-3 right-3 bg-amber-500 text-stone-950 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    ১০০ পয়েন্ট = জয়
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-amber-100 font-handwriting group-hover:text-amber-300 transition-colors">
                      {t.fruitSliceTitle}
                    </h2>
                    <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                      {t.fruitSliceSub}
                    </p>
                    <div className="mt-2 text-[10px] text-amber-400/90 font-mono">
                      ✦ মৌসুমি ফল (আম, তরমুজ, লিচু) · চক বোমা এড়িয়ে ১০০ করুন
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => {
                        sound.playPenClick();
                        setCurrentView('fruit_slice');
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      <Play className="w-3.5 h-3.5 fill-stone-950" />
                      <span>{t.playNow} (ফল কাটা)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 5: Bottle Smash (বোতল ভাঙ্গা) */}
              <div className="group rounded-3xl overflow-hidden border border-stone-800 bg-stone-900/90 shadow-xl flex flex-col transition-all duration-200 hover:border-amber-500/50 hover:shadow-amber-500/10">
                <div className="h-44 w-full relative overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-sky-950 flex items-center justify-center">
                  {/* Decorative Bottle Smash Preview */}
                  <div className="text-6xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                    🍾🎯🪨
                  </div>
                  <div className="absolute inset-0 bg-radial from-transparent to-stone-950/60" />
                  <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-xs text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-stone-700/80">
                    GAME 05
                  </div>
                  <div className="absolute top-3 right-3 bg-amber-500 text-stone-950 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    ১০০ পয়েন্ট = জয়
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-amber-100 font-handwriting group-hover:text-amber-300 transition-colors">
                      {t.bottleSmashTitle}
                    </h2>
                    <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                      {t.bottleSmashSub}
                    </p>
                    <div className="mt-2 text-[10px] text-amber-400/90 font-mono">
                      ✦ নস্টালজিক গুলতি শুটার · কাঁচের বোতল ভেঙ্গে ১০০ স্কোর
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => {
                        sound.playPenClick();
                        setCurrentView('bottle_smash');
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      <Play className="w-3.5 h-3.5 fill-stone-950" />
                      <span>{t.playNow} (বোতল ভাঙ্গা)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 6: International Chess (আন্তর্জাতিক দাবা) */}
              <div className="group rounded-3xl overflow-hidden border border-amber-900/50 bg-stone-900/90 shadow-xl flex flex-col transition-all duration-200 hover:border-amber-400 hover:shadow-amber-500/10">
                <div className="h-44 w-full relative overflow-hidden bg-gradient-to-br from-amber-950 via-stone-950 to-neutral-900 flex items-center justify-center">
                  {/* Decorative Chess Preview */}
                  <div className="text-6xl filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-300 flex items-center gap-2">
                    <span className="text-amber-200">♚</span>
                    <span className="text-amber-400 text-5xl">♛</span>
                    <span className="text-stone-400">♞</span>
                  </div>
                  <div className="absolute inset-0 bg-radial from-transparent to-stone-950/70" />
                  <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-xs text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-stone-700/80">
                    GAME 06 · NEW
                  </div>
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-[10px] font-bold px-2 py-0.5 rounded font-mono shadow-xs">
                    লেভেল ১-∞ · Idea 💡
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-amber-100 font-handwriting group-hover:text-amber-300 transition-colors flex items-center gap-2">
                      <span>{t.chessTitle}</span>
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    </h2>
                    <p className="text-stone-300 text-xs mt-1 leading-relaxed">
                      {t.chessSub}
                    </p>
                    <div className="mt-2 text-[10px] text-amber-400/90 font-mono">
                      ✦ আসল ৮x৮ বোর্ড · ১vs১ বা কম্পিউটার · নিয়ম ও বুদ্ধি অপশন
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => {
                        sound.playPenClick();
                        setCurrentView('chess');
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                    >
                      <Play className="w-3.5 h-3.5 fill-stone-950" />
                      <span>{t.playNow} (দাবা খেলা)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live-Updating Top Players Leaderboard */}
            <LeaderboardWidget language={settings.language} />

            {/* Background Melody Childhood Banner */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-amber-200">
                    {t.childhoodSong} · {settings.melodyId === 'purano_shei' ? 'পুরোনো দিনের গান' : 'টিফিন ছুটির সুর'}
                  </div>
                  <div className="text-xs text-stone-400">
                    {t.childhoodSongSub}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextMelody = settings.melodyId === 'purano_shei' ? 'tiffin_recess' : 'purano_shei';
                    updateSettings({ melodyId: nextMelody });
                    sound.startChildhoodMelody(nextMelody);
                  }}
                  className="py-2 px-3 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-300 hover:text-white"
                >
                  Change Tune
                </button>
                <button
                  onClick={toggleMelody}
                  className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all ${
                    settings.music
                      ? 'bg-amber-500 text-stone-950 font-bold shadow'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {settings.music ? 'Pause Song' : 'Play Song'}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView !== 'home' && (
          <div className="w-full shrink-0">
            {settings.vintageRetroMode ? (
              <div className="bg-gradient-to-r from-amber-950/80 via-stone-900/90 to-amber-950/80 border-b border-amber-800/50 py-1.5 px-4 flex items-center justify-between text-xs backdrop-blur-xs">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📜</span>
                  <span className="font-handwriting font-bold text-amber-300">
                    {settings.language === 'bn' ? 'পুরাতন ক্লাসরুম সংস্করণ (Vintage 90s Edition)' : 'Vintage 90s Classroom Edition'}
                  </span>
                  <span className="hidden sm:inline text-[10px] text-amber-400/80 font-mono">
                    · রুলটানা খাতা ও স্কুল বেঞ্চের খাঁটি স্মৃতি
                  </span>
                </div>
                <button
                  onClick={() => {
                    sound.playPenClick();
                    updateSettings({ vintageRetroMode: false });
                  }}
                  className="text-[10px] text-stone-400 hover:text-amber-200 transition-colors"
                >
                  {settings.language === 'bn' ? 'স্বাভাবিক মোড' : 'Modern Mode'}
                </button>
              </div>
            ) : (
              <div className="bg-stone-950/60 border-b border-stone-800/80 py-1 px-4 flex items-center justify-end text-[10px]">
                <button
                  onClick={() => {
                    sound.playPenClick();
                    updateSettings({ vintageRetroMode: true });
                  }}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono transition-colors"
                >
                  <span>📜 {settings.language === 'bn' ? 'পুরাতন সংস্করণে খেলুন' : 'Switch to 90s Vintage Edition'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'pen_fight' && (
          <PenFightGame
            t={t}
            settings={settings}
            onBack={() => {
              sound.playPenClick();
              setCurrentView('home');
            }}
            onOpenRules={() => {
              sound.playPenClick();
              setShowRules(true);
            }}
          />
        )}

        {currentView === 'dots_boxes' && (
          <DotsAndBoxesGame
            t={t}
            settings={settings}
            onBack={() => {
              sound.playPenClick();
              setCurrentView('home');
            }}
            onOpenRules={() => {
              sound.playPenClick();
              setShowRules(true);
            }}
          />
        )}

        {currentView === 'katakuti' && (
          <KatakutiGame
            t={t}
            settings={settings}
            onBack={() => {
              sound.playPenClick();
              setCurrentView('home');
            }}
            onOpenRules={() => {
              sound.playPenClick();
              setShowRules(true);
            }}
          />
        )}

        {currentView === 'fruit_slice' && (
          <FruitSliceGame
            t={t}
            settings={settings}
            onBack={() => {
              sound.playPenClick();
              setCurrentView('home');
            }}
            onOpenRules={() => {
              sound.playPenClick();
              setShowRules(true);
            }}
          />
        )}

        {currentView === 'bottle_smash' && (
          <BottleSmashGame
            t={t}
            settings={settings}
            onBack={() => {
              sound.playPenClick();
              setCurrentView('home');
            }}
            onOpenRules={() => {
              sound.playPenClick();
              setShowRules(true);
            }}
          />
        )}

        {currentView === 'chess' && (
          <ChessGame
            t={t}
            settings={settings}
            onBack={() => {
              sound.playPenClick();
              setCurrentView('home');
            }}
            onOpenRules={() => {
              sound.playPenClick();
              setShowRules(true);
            }}
          />
        )}
      </main>

      {/* Creator Footer with "এইটি তৈরি করেছেন RM.Rahimul" and Voice Sound Button */}
      <div className="pb-14 md:pb-0">
        <CreatorFooter
          language={settings.language}
          onOpenAI={() => setShowAI(true)}
        />
      </div>

      {/* Mobile Ergonomic Bottom Tab Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-stone-950/95 border-t border-amber-950/70 backdrop-blur-md flex items-center justify-around z-40 px-1 shadow-2xl">
        <button
          onClick={() => {
            sound.playPenClick();
            setCurrentView('home');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
            currentView === 'home' ? 'text-amber-400 font-bold' : 'text-stone-400'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            sound.playPenClick();
            setCurrentView('pen_fight');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
            currentView === 'pen_fight' ? 'text-amber-400 font-bold' : 'text-stone-400'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>পেন ফাইট</span>
        </button>

        <button
          onClick={() => {
            sound.playPenClick();
            setCurrentView('dots_boxes');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
            currentView === 'dots_boxes' ? 'text-amber-400 font-bold' : 'text-stone-400'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          <span>বক্স খেলা</span>
        </button>

        <button
          onClick={() => {
            sound.playPenClick();
            setCurrentView('chess');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
            currentView === 'chess' ? 'text-amber-400 font-bold' : 'text-stone-400'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>দাবা</span>
        </button>

        <button
          onClick={() => {
            sound.playPenClick();
            setCurrentView('fruit_slice');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
            currentView === 'fruit_slice' ? 'text-amber-400 font-bold' : 'text-stone-400'
          }`}
        >
          <Apple className="w-4 h-4" />
          <span>ফল কাটা</span>
        </button>

        <button
          onClick={() => {
            sound.playPenClick();
            setCurrentView('bottle_smash');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${
            currentView === 'bottle_smash' ? 'text-amber-400 font-bold' : 'text-stone-400'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>বোতল ভাঙ্গা</span>
        </button>

        <button
          onClick={() => {
            sound.playPenClick();
            setShowSkins(true);
          }}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-stone-400 hover:text-amber-300"
        >
          <Palette className="w-4 h-4 text-amber-400" />
          <span>স্কিন ({currentUser?.points || 0}★)</span>
        </button>
      </div>

      {/* Floating On-Screen AI Mascot Screen Button */}
      <FloatingAIButton
        onOpenAI={() => setShowAI(true)}
        language={settings.language}
      />

      {/* Modals */}
      {showRules && <RulesModal t={t} onClose={() => setShowRules(false)} />}
      {showStats && <StatsModal t={t} onClose={() => setShowStats(false)} />}
      {showSettings && (
        <SettingsModal
          t={t}
          settings={settings}
          onUpdateSettings={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showAndroidExport && (
        <AndroidExportModal t={t} onClose={() => setShowAndroidExport(false)} />
      )}
      {showAI && (
        <AIAssistantModal
          language={settings.language}
          onClose={() => setShowAI(false)}
        />
      )}

      {/* Mandatory Auth Gate & Account Management Modal */}
      {(!currentUser || showAuthModal) && (
        <AuthModal
          language={settings.language}
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowAuthModal(false);
          }}
        />
      )}

      {/* Pen Skins Closet & Trial Match Modal */}
      {showSkins && currentUser && (
        <SkinsModal
          user={currentUser}
          onUpdateUser={() => setCurrentUser(getCurrentUser())}
          onClose={() => setShowSkins(false)}
          language={settings.language}
        />
      )}
    </div>
  );
}
