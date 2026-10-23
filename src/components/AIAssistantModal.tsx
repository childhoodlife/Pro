import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, Volume2, RotateCcw, CheckCircle2, BookOpen, Layers, Lightbulb } from 'lucide-react';
import { sound } from '../utils/audio';
import { voiceCoach } from '../utils/voiceCoach';
import creatorPhoto from '/assets/aistudio/file_000000005a5481fa8028a3b1b44f9c42_b1c18261.png';

export type TutorialGameType = 'pen_fight' | 'dots_boxes' | 'katakuti' | 'fruit_slice' | 'bottle_smash' | 'chess';

export interface TutorialStep {
  stepNumber: number;
  title: string;
  desc: string;
}

export interface TutorialCardData {
  gameName: string;
  gameKey: TutorialGameType;
  diagramTitle: string;
  steps: TutorialStep[];
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  hasPhoto?: boolean;
  photoUrl?: string;
  showPhotoPrompt?: boolean;
  tutorialCard?: TutorialCardData;
}

interface AIAssistantModalProps {
  onClose: () => void;
  language: 'en' | 'bn';
  initialTutorialGame?: TutorialGameType;
}

// Visual SVG Diagram for each game
const TutorialVisualDiagram: React.FC<{ gameKey: TutorialGameType; language: 'en' | 'bn' }> = ({
  gameKey,
  language,
}) => {
  if (gameKey === 'pen_fight') {
    return (
      <div className="w-full h-32 rounded-xl bg-amber-950/40 border border-amber-800/60 p-2 relative overflow-hidden flex items-center justify-around">
        {/* Desk wood lines */}
        <div className="absolute inset-0 bg-wood-desk opacity-40 pointer-events-none" />
        {/* Player Pen */}
        <div className="relative flex flex-col items-center">
          <div className="w-20 h-5 rounded-md bg-blue-600 border border-blue-400 relative shadow-md flex items-center justify-end px-1">
            <div className="w-5 h-5 rounded-xs bg-blue-800" />
            <div className="absolute -left-2 w-3 h-1.5 bg-amber-300" />
          </div>
          <span className="text-[9px] text-blue-300 font-mono mt-1 font-bold">আপনার কলম</span>
        </div>
        {/* Aim Trajectory Arrow */}
        <div className="flex flex-col items-center text-amber-400">
          <span className="text-xs font-mono font-bold animate-pulse">⤏ ⤏ 💥</span>
          <span className="text-[8px] text-stone-400">কোণ ও ধাক্কা</span>
        </div>
        {/* Opponent Dummy */}
        <div className="relative flex flex-col items-center">
          <div className="w-18 h-5 rounded-md bg-red-600 border border-red-400 relative shadow-md flex items-center px-1">
            <div className="w-4 h-5 rounded-xs bg-red-800" />
          </div>
          <span className="text-[9px] text-red-300 font-mono mt-1 font-bold">প্রতিপক্ষ</span>
        </div>
      </div>
    );
  }

  if (gameKey === 'dots_boxes') {
    return (
      <div className="w-full h-32 rounded-xl bg-stone-900 border border-stone-800 p-2 relative overflow-hidden flex items-center justify-center gap-6">
        {/* Mini 3x3 dots grid with captured box */}
        <div className="grid grid-cols-3 gap-6 relative">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow" />
          ))}
          {/* Blue line */}
          <div className="absolute top-1 left-2 w-14 h-1 bg-blue-500 rounded" />
          <div className="absolute top-2 left-1 w-1 h-14 bg-blue-500 rounded" />
          <div className="absolute top-1 left-16 w-1 h-14 bg-blue-500 rounded" />
          {/* Box claim */}
          <div className="absolute top-3 left-3 w-12 h-12 bg-blue-500/30 rounded flex items-center justify-center font-bold text-blue-300 font-mono text-xs">
            P1
          </div>
        </div>
        <div className="text-[10px] text-stone-300 max-w-[120px] leading-tight">
          <span className="text-amber-400 font-bold block mb-1">৪র্থ রেখা = ১ পয়েন্ট</span>
          ৩য় রেখা এড়িয়ে চলুন, প্রতিপক্ষকে ফাঁদে ফেলুন!
        </div>
      </div>
    );
  }

  if (gameKey === 'katakuti') {
    return (
      <div className="w-full h-32 rounded-xl bg-stone-900 border border-stone-800 p-2 relative overflow-hidden flex items-center justify-center gap-6">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-950 rounded-lg border border-stone-800 font-handwriting text-base font-bold">
          <div className="w-8 h-8 flex items-center justify-center text-blue-400 border border-stone-800">X</div>
          <div className="w-8 h-8 flex items-center justify-center text-red-400 border border-stone-800">O</div>
          <div className="w-8 h-8 flex items-center justify-center text-stone-600 border border-stone-800">-</div>
          <div className="w-8 h-8 flex items-center justify-center text-stone-600 border border-stone-800">-</div>
          <div className="w-8 h-8 flex items-center justify-center text-blue-400 bg-blue-950/40 border border-blue-600 font-bold">X</div>
          <div className="w-8 h-8 flex items-center justify-center text-stone-600 border border-stone-800">-</div>
          <div className="w-8 h-8 flex items-center justify-center text-red-400 border border-stone-800">O</div>
          <div className="w-8 h-8 flex items-center justify-center text-stone-600 border border-stone-800">-</div>
          <div className="w-8 h-8 flex items-center justify-center text-blue-400 border border-stone-800">X</div>
        </div>
        <div className="text-[10px] text-stone-300 max-w-[120px] leading-tight">
          <span className="text-amber-400 font-bold block mb-1">কর্ণ বরাবর ৩টি X</span>
          মাঝের ঘর দখল করলেই ম্যাচ জেতা নিশ্চিত!
        </div>
      </div>
    );
  }

  if (gameKey === 'fruit_slice') {
    return (
      <div className="w-full h-32 rounded-xl bg-stone-950 border border-stone-800 p-2 relative overflow-hidden flex items-center justify-around">
        <div className="text-3xl filter drop-shadow">🥭</div>
        <div className="text-4xl filter drop-shadow animate-bounce">🍉</div>
        <div className="text-3xl filter drop-shadow">🍍</div>
        {/* Blade slash trail */}
        <div className="absolute inset-x-4 top-1/2 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-lg transform -rotate-12" />
        <div className="absolute bottom-1 right-2 bg-amber-500/20 text-amber-300 text-[9px] px-2 py-0.5 rounded border border-amber-500/40 font-mono">
          ১০০ পয়েন্ট = বিজয়
        </div>
      </div>
    );
  }

  if (gameKey === 'bottle_smash') {
    return (
      <div className="w-full h-32 rounded-xl bg-stone-950 border border-stone-800 p-2 relative overflow-hidden flex items-center justify-around">
        {/* Slingshot */}
        <div className="text-3xl filter drop-shadow">🪵</div>
        <div className="text-xs font-mono text-amber-400">--- 🪨 ---&gt;</div>
        {/* Glass bottles */}
        <div className="flex items-end gap-1.5">
          <span className="text-2xl">🍾</span>
          <span className="text-3xl">🍷</span>
          <span className="text-2xl">🍺</span>
        </div>
      </div>
    );
  }

  // Chess diagram
  return (
    <div className="w-full h-32 rounded-xl bg-stone-950 border border-amber-900/60 p-2 relative overflow-hidden flex items-center justify-around">
      <div className="grid grid-cols-4 gap-0.5 border-2 border-stone-800 rounded bg-[#78350f]">
        <div className="w-6 h-6 bg-[#fef3c7] flex items-center justify-center text-sm">♜</div>
        <div className="w-6 h-6 bg-[#78350f] flex items-center justify-center text-sm">♞</div>
        <div className="w-6 h-6 bg-[#fef3c7] flex items-center justify-center text-sm">♝</div>
        <div className="w-6 h-6 bg-[#78350f] flex items-center justify-center text-sm text-yellow-500">♚</div>
        <div className="w-6 h-6 bg-[#78350f] flex items-center justify-center text-sm">♟</div>
        <div className="w-6 h-6 bg-[#fef3c7] flex items-center justify-center text-sm">♟</div>
        <div className="w-6 h-6 bg-[#78350f] flex items-center justify-center text-sm">♟</div>
        <div className="w-6 h-6 bg-[#fef3c7] flex items-center justify-center text-sm">♟</div>
      </div>
      <div className="text-[10px] text-stone-300 max-w-[130px] leading-tight">
        <span className="text-amber-400 font-bold block mb-1">দাবার মূল নিয়ম</span>
        ঘোড়া (L-আকার), মন্ত্রী (সবদিকে), রাজাকে কিস্তিমাত করলেই জয়!
      </div>
    </div>
  );
};

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  onClose,
  language,
  initialTutorialGame,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text:
        language === 'bn'
          ? 'হ্যালো! আমি চাইল্ডহুড লাইফ এআই (Childhood Life AI)। আপনি গেমের নিয়ম, কৌশল, বা যেকোনো বিষয় সম্পর্কে আমাকে জিজ্ঞেস করতে পারেন। নিচে প্রতিটি গেমের ছবিসহ ধাপে ধাপে টিউটোরিয়াল দেখতে বাটনে ক্লিক করুন!'
          : 'Hello! I am Childhood Life AI. You can ask me how to play any game, pen tuning, level strategy, or creator information. Tap below for visual step-by-step game guides!',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Open initial tutorial if passed
  useEffect(() => {
    if (initialTutorialGame) {
      sendTutorial(initialTutorialGame);
    }
  }, [initialTutorialGame]);

  const sendTutorial = (gameKey: TutorialGameType) => {
    sound.playPenClick();
    let card: TutorialCardData;

    switch (gameKey) {
      case 'pen_fight':
        card = {
          gameName: language === 'bn' ? 'পেন ফাইট (Pen Fight)' : 'Pen Fight',
          gameKey: 'pen_fight',
          diagramTitle: language === 'bn' ? 'ডেস্কে কলমের যুদ্ধ ও নকআউট ফিজিক্স' : 'Tabletop Pen Knockout Physics',
          steps: [
            {
              stepNumber: 1,
              title: language === 'bn' ? 'ধাপ ১: কলম ও মড নির্বাচন' : 'Step 1: Choose & Mod Pen',
              desc: language === 'bn' ? 'পছন্দের বলপেন বা ঝর্ণা কলম বেছে নিন। ক্যাপ পেছনে লাগালে ভারসাম্য ভালো থাকে।' : 'Pick your pen archetype. Rear cap gives balanced center of gravity.',
            },
            {
              stepNumber: 2,
              title: language === 'bn' ? 'ধাপ ২: আঙুল টেনে শক্তি ও কোণ নির্ধারণ' : 'Step 2: Aim & Flick',
              desc: language === 'bn' ? 'কলমের উপর আঙুল টেনে পেছনের দিকে টানুন। ডটেড লাইনে লক্ষ্য স্থির করে ছেড়ে দিন।' : 'Pull back on pen with finger to charge power, align angle, and release.',
            },
            {
              stepNumber: 3,
              title: language === 'bn' ? 'ধাপ ৩: রিংআউট ও জয়' : 'Step 3: Ringout & Victory',
              desc: language === 'bn' ? 'প্রতিপক্ষকে ডেস্কে ধাক্কা মেরে নিচে ফেলে দিন। ৩টি রাউন্ড জিতলেই ম্যাচ জয় ও পয়েন্ট!' : 'Knock opponent pen off the table ledge to score ringouts and earn points.',
            },
          ],
        };
        break;

      case 'dots_boxes':
        card = {
          gameName: language === 'bn' ? 'বক্স বানানোর খেলা (Dots & Boxes)' : 'Dots and Boxes',
          gameKey: 'dots_boxes',
          diagramTitle: language === 'bn' ? 'বিন্দু জুড়ে খাতার গ্রিড দখল' : 'Grid Dot-to-Dot Box Capture',
          steps: [
            {
              stepNumber: 1,
              title: language === 'bn' ? 'ধাপ ১: দুইটি বিন্দুর মাঝে রেখা টানুন' : 'Step 1: Draw Connecting Lines',
              desc: language === 'bn' ? 'প্রতি চালে পাশাপাশি দুইটি বিন্দুর মাঝে একটি অনুভূমিক বা উল্লম্ব রেখা টানুন।' : 'Draw a line connecting two adjacent dots on your turn.',
            },
            {
              stepNumber: 2,
              title: language === 'bn' ? 'ধাপ ২: ৩য় বাহু এড়িয়ে চলুন' : 'Step 2: Avoid the 3rd Line Trap',
              desc: language === 'bn' ? 'কোনো বক্সের ৩য় রেখা দিলে প্রতিপক্ষ ৪র্থ রেখা টেনে বক্স দখল করে বোনাস চাল পাবে।' : 'Never complete the 3rd side of a box, or opponent gets free captures!',
            },
            {
              stepNumber: 3,
              title: language === 'bn' ? 'ধাপ ৩: সর্বাধিক বক্স দখল' : 'Step 3: Capture Majority',
              desc: language === 'bn' ? 'সবচেয়ে বেশি সংখ্যক বক্স যার নামের রঙে পূর্ণ হবে, তিনিই ম্যাচ বিজয়ী হবেন।' : 'The player who captures the most boxes wins the match.',
            },
          ],
        };
        break;

      case 'katakuti':
        card = {
          gameName: language === 'bn' ? 'কাটাকুটি ও এস-ও-এস (Katakuti & SOS)' : 'Katakuti & SOS',
          gameKey: 'katakuti',
          diagramTitle: language === 'bn' ? 'খাতার শেষ পাতার টিক-ট্যাক-টো' : 'Notebook Backpage SOS & Tic-Tac-Toe',
          steps: [
            {
              stepNumber: 1,
              title: language === 'bn' ? 'ধাপ ১: ৩x৩ গ্রিডে প্রতীক বসান' : 'Step 1: Place Marks',
              desc: language === 'bn' ? 'খেলোয়াড় ১ দেবে X এবং খেলোয়াড় ২ দেবে O। ফাঁকা ঘরে চাপ দিয়ে চিহ্ন বসান।' : 'Take turns marking X or O on the 3x3 grid.',
            },
            {
              stepNumber: 2,
              title: language === 'bn' ? 'ধাপ ২: মাঝের ঘর দখল করুন' : 'Step 2: Center Control',
              desc: language === 'bn' ? 'শুরুতেই মাঝের ঘর দখল করলে জয় প্রায় সুনিশ্চিত হয়ে যায়।' : 'Claiming the center square unlocks winning diagonal double-traps.',
            },
            {
              stepNumber: 3,
              title: language === 'bn' ? 'ধাপ ৩: ৩টি এক লাইনে মেলানো' : 'Step 3: Align 3 to Win',
              desc: language === 'bn' ? 'লম্বালম্বি, আড়াআড়ি বা কোণাকুণি টানা ৩টি প্রতীক মেলাতে পারলে কাটাকুটি জয়!' : 'Align 3 matching marks in a row, column, or diagonal to win.',
            },
          ],
        };
        break;

      case 'fruit_slice':
        card = {
          gameName: language === 'bn' ? 'ফল কাটা খেলা (Fruit Slice)' : 'Fruit Slice',
          gameKey: 'fruit_slice',
          diagramTitle: language === 'bn' ? 'মৌসুমি ফল কাটা ও ১০০ পয়েন্ট' : 'Seasonal Fruits & 100 Pts Target',
          steps: [
            {
              stepNumber: 1,
              title: language === 'bn' ? 'ধাপ ১: স্ক্রিনে আঙুল সোয়াইপ করুন' : 'Step 1: Finger Swipe Slicing',
              desc: language === 'bn' ? 'উড়ে আসা ফলগুলোর উপর দিয়ে দ্রুত আঙুল বা মাউস টেনে ব্লেড দিয়ে কেটে ফেলুন।' : 'Drag your finger across flying fruits to slice them with your ink blade.',
            },
            {
              stepNumber: 2,
              title: language === 'bn' ? 'ধাপ ২: চক বোমা পরিহার করুন' : 'Step 2: Dodge Chalk Bombs',
              desc: language === 'bn' ? 'কালো চক ও ডাস্টার বোমা কাটলে ১০ পয়েন্ট কাটা যাবে! সাবধানে ফল কাটুন।' : 'Avoid slicing black chalkboard bombs to prevent point deductions.',
            },
            {
              stepNumber: 3,
              title: language === 'bn' ? 'ধাপ ৩: ১০০ স্কোর করলেই জয়' : 'Step 3: Hit 100 to Win',
              desc: language === 'bn' ? 'মোট ১০০ পয়েন্ট করতে পারলেই খেলা সমাপ্ত হয়ে বিজয় মুকুট ও +১ স্টার পয়েন্ট পাবেন।' : 'Reach 100 points to complete the level and claim +1 match star point.',
            },
          ],
        };
        break;

      case 'bottle_smash':
        card = {
          gameName: language === 'bn' ? 'বোতল ভাঙ্গা খেলা (Bottle Smash)' : 'Bottle Smash',
          gameKey: 'bottle_smash',
          diagramTitle: language === 'bn' ? 'গুলতি ছুড়ে কাঁচের বোতল ভাঙ্গা' : 'Schoolyard Slingshot Bottle Shatter',
          steps: [
            {
              stepNumber: 1,
              title: language === 'bn' ? 'ধাপ ১: গুলতির চামড়া পেছনের দিকে টানুন' : 'Step 1: Pull Elastic Band',
              desc: language === 'bn' ? 'রাবার ব্যান্ড পেছনে টেনে পাথর নিশানায় রেখে লক্ষ্য স্থির করুন।' : 'Pull back on the slingshot pouch to aim trajectory at bottles.',
            },
            {
              stepNumber: 2,
              title: language === 'bn' ? 'ধাপ ২: প্যারাবলিক আর্কে ছুড়ে মারুন' : 'Step 2: Release to Fire',
              desc: language === 'bn' ? 'ছেড়ে দিলে পাথর বোতলে আঘাত করে কাঁচ ভেঙে চুরমার করে দেবে।' : 'Release to fling the pebble and smash glass bottles into shards.',
            },
            {
              stepNumber: 3,
              title: language === 'bn' ? 'ধাপ ৩: ১০০ পয়েন্ট লক্ষ্যমাত্রা' : 'Step 3: Reach 100 Pts Target',
              desc: language === 'bn' ? 'সোনালী ও চলমান বোতলে বেশি পয়েন্ট। ১০০ পয়েন্ট সম্পূর্ণ করলেই ম্যাচ জয়!' : 'Shatter moving and golden bottles to reach 100 points for match victory.',
            },
          ],
        };
        break;

      case 'chess':
        card = {
          gameName: language === 'bn' ? 'আন্তর্জাতিক দাবা (Chess)' : 'Grandmaster Chess',
          gameKey: 'chess',
          diagramTitle: language === 'bn' ? 'দাবার ৮x৮ বোর্ড ও কিস্তিমাত কৌশল' : '8x8 Chessboard & Checkmate Rules',
          steps: [
            {
              stepNumber: 1,
              title: language === 'bn' ? 'ধাপ ১: প্রতিটি গুটির চাল শিখুন' : 'Step 1: Learn Piece Moves',
              desc: language === 'bn' ? 'পন (সামনে ১/২ ঘর), ঘোড়া (L-আকার), বিশপ (কোণাকুণি), রুক (সোজা), রানী (সবদিকে), রাজা (১ ঘর)।' : 'Pawns move forward, Knights jump L-shape, Bishops diagonal, Rooks straight, Queen all ways.',
            },
            {
              stepNumber: 2,
              title: language === 'bn' ? 'ধাপ ২: বোর্ডের কেন্দ্র দখল ও আক্রমণ' : 'Step 2: Control Board Center',
              desc: language === 'bn' ? 'সেন্টারের ঘরে পন ও নাইট আগে বাড়িয়ে রাজার সুরক্ষা নিশ্চিত করুন।' : 'Develop Knights and advance central pawns to dominate the board.',
            },
            {
              stepNumber: 3,
              title: language === 'bn' ? 'ধাপ ৩: কিস্তিমাত (Checkmate)' : 'Step 3: Checkmate the King',
              desc: language === 'bn' ? 'প্রতিপক্ষের রাজাকে চেক দিয়ে এমন ফাঁদে ফেলুন যেখান থেকে বাঁচার কোনো বৈধ চাল না থাকে।' : 'Attack the enemy King with no legal escapes to win by Checkmate!',
            },
          ],
        };
        break;
    }

    const aiMsg: Message = {
      id: Date.now().toString(),
      sender: 'ai',
      text:
        language === 'bn'
          ? `নিচে ${card.gameName} খেলার ছবি ও ধাপে ধাপে নিয়ম দেওয়া হলো:`
          : `Here is the visual step-by-step guide for ${card.gameName}:`,
      tutorialCard: card,
    };

    setMessages((prev) => [...prev, aiMsg]);
    voiceCoach.speak(
      language === 'bn'
        ? `${card.gameName} খেলার টিউটোরিয়াল। ধাপ এক: ${card.steps[0].title}। ধাপ দুই: ${card.steps[1].title}। ধাপ তিন: ${card.steps[2].title}!`
        : `Tutorial for ${card.gameName}. Step one: ${card.steps[0].title}. Step two: ${card.steps[1].title}. Step three: ${card.steps[2].title}!`,
      language
    );
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isChatLocked) return;

    sound.playPenClick();
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');

    const lower = text.toLowerCase();

    // Check if user is answering creator photo prompt
    if (isWaitingForConfirmation) {
      if (
        lower.includes('হ্যাঁ') ||
        lower.includes('জি') ||
        lower.includes('হাঁ') ||
        lower.includes('হুম') ||
        lower.includes('yes') ||
        lower.includes('yeah') ||
        lower.includes('show') ||
        lower.includes('দেখাও') ||
        lower.includes('চাই')
      ) {
        setIsWaitingForConfirmation(false);
        setIsChatLocked(true);
        const aiResponseText = 'বর্তমান আর কোন আমি কথা বলতে পারবো না';

        setTimeout(() => {
          sound.playBoxComplete();
          const photoMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: aiResponseText,
            hasPhoto: true,
            photoUrl: creatorPhoto,
          };
          setMessages((prev) => [...prev, photoMsg]);
          voiceCoach.speak(aiResponseText, 'bn');
        }, 600);
        return;
      } else {
        setIsWaitingForConfirmation(false);
        const reply = language === 'bn' ? 'ঠিক আছে বন্ধু! খেলার যেকোনো নিয়ম জানতে প্রশ্ন করুন।' : 'Alright! Ask me anything about the games.';
        setTimeout(() => {
          setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: reply }]);
          voiceCoach.speak(reply, language);
        }, 500);
        return;
      }
    }

    // Check if user is asking about Creator (RM.Rahimul / Rishad)
    const isAskingAboutCreator =
      lower.includes('তৈরি') ||
      lower.includes('বানাই') ||
      lower.includes('creator') ||
      lower.includes('developer') ||
      lower.includes('rahimul') ||
      lower.includes('রাহিমুল') ||
      lower.includes('রিশাদ') ||
      lower.includes('rishad') ||
      lower.includes('কে তৈরি');

    if (isAskingAboutCreator) {
      setIsWaitingForConfirmation(true);
      const reply = 'আমাকে এবং এই গেমটি আমার বস রাহিমুল ইসলাম রিশাদ তৈরি করছেন। আপনি কি তাকে দেখতে চান?';
      setTimeout(() => {
        sound.playLineDraw();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: reply,
            showPhotoPrompt: true,
          },
        ]);
        voiceCoach.speak(reply, 'bn');
      }, 600);
      return;
    }

    // Direct game tutorial triggers
    if (lower.includes('দাবা') || lower.includes('chess') || lower.includes('কিস্তিমাত')) {
      sendTutorial('chess');
      return;
    }
    if (lower.includes('পেন ফাইট') || lower.includes('pen fight')) {
      sendTutorial('pen_fight');
      return;
    }
    if (lower.includes('বক্স') || lower.includes('dots') || lower.includes('খোপ')) {
      sendTutorial('dots_boxes');
      return;
    }
    if (lower.includes('কাটাকুটি') || lower.includes('sos') || lower.includes('টিকট্যাক')) {
      sendTutorial('katakuti');
      return;
    }
    if (lower.includes('ফল কাটা') || lower.includes('fruit')) {
      sendTutorial('fruit_slice');
      return;
    }
    if (lower.includes('বোতল') || lower.includes('গুলতি') || lower.includes('bottle')) {
      sendTutorial('bottle_smash');
      return;
    }

    // Query Google Gemini API on the backend for ChatGPT-level reasoning
    setIsThinking(true);
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        language,
        gameContext: 'general',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setIsThinking(false);
        const replyText =
          data.reply ||
          (language === 'bn'
            ? 'চমৎকার চাল! শৈশবের খেলায় আরও মনযোগ দিন।'
            : 'Great move! Keep enjoying nostalgic games.');
        sound.playLineDraw();
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: replyText,
          },
        ]);
        voiceCoach.speak(replyText, language);
      })
      .catch((err) => {
        setIsThinking(false);
        console.error('AI chat error:', err);
        const fallbackText =
          language === 'bn'
            ? 'শৈশব জীবন এআই আপনার সাথে আছে! যেকোনো খেলার কৌশল ও নিয়ম জানতে জিজ্ঞেস করুন।'
            : 'Childhood Life AI is here! Ask me about rules or tactics for any game.';
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: fallbackText,
          },
        ]);
        voiceCoach.speak(fallbackText, language);
      });
  };

  const handleResetChat = () => {
    sound.playPenClick();
    setIsChatLocked(false);
    setIsWaitingForConfirmation(false);
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'ai',
        text:
          language === 'bn'
            ? 'চ্যাট পুনরায় শুরু হয়েছে! আপনি যেকোনো গেমের টিউটোরিয়াল দেখতে নিচের বাটনে চাপুন।'
            : 'Chat restarted! Tap below to view tutorials for any game.',
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-amber-100 font-handwriting tracking-wide">
                  Childhood Life AI Guide
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-amber-500/20 border border-amber-400/40 text-[9px] font-mono font-bold text-amber-300 shadow-xs">
                  ✦ Gemini Flash
                </span>
              </div>
              <p className="text-[10px] text-stone-400">
                {language === 'bn' ? 'ছবি ও ধাপে ধাপে গেম টিউটোরিয়াল' : 'Visual Step-by-Step Game Tutorials'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isChatLocked && (
              <button
                onClick={handleResetChat}
                title="রিসেট করুন"
                className="p-1.5 rounded-lg text-stone-400 hover:text-white bg-stone-800/80"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                sound.playPenClick();
                voiceCoach.stop();
                onClose();
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Tutorial Selector Pills */}
        <div className="px-4 py-2 bg-stone-950/50 border-b border-stone-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => sendTutorial('chess')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-medium whitespace-nowrap flex items-center gap-1"
          >
            <span>♚ দাবা</span>
          </button>
          <button
            onClick={() => sendTutorial('pen_fight')}
            className="px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[11px] font-medium whitespace-nowrap flex items-center gap-1"
          >
            <span>🖊️ পেন ফাইট</span>
          </button>
          <button
            onClick={() => sendTutorial('fruit_slice')}
            className="px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[11px] font-medium whitespace-nowrap flex items-center gap-1"
          >
            <span>🥭 ফল কাটা</span>
          </button>
          <button
            onClick={() => sendTutorial('bottle_smash')}
            className="px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[11px] font-medium whitespace-nowrap flex items-center gap-1"
          >
            <span>🍾 বোতল ভাঙ্গা</span>
          </button>
          <button
            onClick={() => sendTutorial('dots_boxes')}
            className="px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[11px] font-medium whitespace-nowrap flex items-center gap-1"
          >
            <span>🔲 বক্স খেলা</span>
          </button>
          <button
            onClick={() => sendTutorial('katakuti')}
            className="px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[11px] font-medium whitespace-nowrap flex items-center gap-1"
          >
            <span>❌ কাটাকুটি</span>
          </button>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 self-end">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[90%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-stone-950 font-medium rounded-br-xs'
                    : 'bg-stone-950/80 border border-stone-800 text-stone-200 rounded-bl-xs'
                }`}
              >
                {/* Message Text */}
                <p className="text-xs">{msg.text}</p>

                {/* Step-by-Step Visual Tutorial Card */}
                {msg.tutorialCard && (
                  <div className="mt-3 rounded-2xl border-2 border-amber-500/60 bg-stone-900 shadow-xl p-3 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-stone-800">
                      <span className="font-bold text-amber-300 font-handwriting text-sm">
                        {msg.tutorialCard.gameName}
                      </span>
                      <span className="text-[10px] text-amber-400/90 font-mono">
                        {msg.tutorialCard.diagramTitle}
                      </span>
                    </div>

                    {/* Visual Illustrated Board/Diagram */}
                    <TutorialVisualDiagram
                      gameKey={msg.tutorialCard.gameKey}
                      language={language}
                    />

                    {/* Step-by-Step Written Rules */}
                    <div className="space-y-2 mt-2">
                      {msg.tutorialCard.steps.map((st) => (
                        <div key={st.stepNumber} className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/80">
                          <div className="flex items-center gap-1.5 font-bold text-amber-200 text-xs font-handwriting">
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-mono font-bold text-[10px] flex items-center justify-center">
                              {st.stepNumber}
                            </span>
                            <span>{st.title}</span>
                          </div>
                          <p className="text-[11px] text-stone-400 mt-1 pl-6 leading-relaxed">
                            {st.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Creator Photo Card */}
                {msg.hasPhoto && msg.photoUrl && (
                  <div className="mt-3.5 rounded-2xl overflow-hidden border-2 border-amber-500/60 bg-stone-900 shadow-xl p-3">
                    <div className="relative rounded-xl overflow-hidden aspect-square w-full mb-3 shadow-md bg-stone-950">
                      <img
                        src={msg.photoUrl}
                        alt="RM.Rahimul (রাহিমুল ইসলাম রিশাদ)"
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute top-2 right-2 bg-stone-950/80 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-md border border-amber-500/40">
                        CREATOR
                      </div>
                    </div>

                    <div className="text-center">
                      <h4 className="font-bold text-sm text-amber-200 font-handwriting">
                        রাহিমুল ইসলাম রিশাদ (RM.Rahimul)
                      </h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Founder &amp; Creator of Childhood Life
                      </p>
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 mt-2 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Developer</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Confirmation Buttons */}
                {msg.showPhotoPrompt && isWaitingForConfirmation && (
                  <div className="flex gap-2 mt-3 pt-2 border-t border-stone-800">
                    <button
                      onClick={() => handleSend('হ্যাঁ')}
                      className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition-all active:scale-95"
                    >
                      হ্যাঁ / জি (দেখতে চাই)
                    </button>
                    <button
                      onClick={() => handleSend('না')}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
                    >
                      না, থাক
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* AI Thinking Animation */}
          {isThinking && (
            <div className="flex gap-2.5 items-end animate-in fade-in">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-stone-950/80 border border-stone-800 text-stone-300 rounded-2xl rounded-bl-xs p-3 text-xs flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <span className="text-[11px] text-stone-400">
                  {language === 'bn' ? 'জেমিনাই এআই চিন্তা করছে...' : 'Gemini AI is thinking...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/90 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isChatLocked}
            placeholder={
              isChatLocked
                ? 'বর্তমান আর কোন আমি কথা বলতে পারবো না'
                : language === 'bn'
                ? 'দাবা কিভাবে খেলবো, পেন ফাইট বা যেকোনো প্রশ্ন লিখুন...'
                : 'Ask how to play chess, pen fight, or anything...'
            }
            className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isChatLocked}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 text-stone-950 font-bold transition-all disabled:text-stone-600 disabled:cursor-not-allowed shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
