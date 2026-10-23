import React, { useState } from 'react';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';
import { sound } from '../utils/audio';

interface FloatingAIButtonProps {
  onOpenAI: () => void;
  language: 'en' | 'bn';
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onOpenAI, language }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    sound.playPenClick();
    onOpenAI();
  };

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-45 flex items-center gap-2 pointer-events-auto select-none">
      {/* Tooltip bubble on hover/idle */}
      <div
        className={`transition-all duration-300 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-stone-900/95 border border-amber-500/40 text-amber-200 text-xs font-medium shadow-xl backdrop-blur-md ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-80 translate-x-1'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>{language === 'bn' ? 'এআই বন্ধু সাথে আলাপ' : 'Chat with AI Guide'}</span>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={language === 'bn' ? 'এআই কে প্রশ্ন করুন' : 'Ask Childhood AI'}
        className="relative group p-3.5 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-stone-950 font-bold shadow-2xl transition-all duration-200 active:scale-90 hover:scale-110 flex items-center justify-center border-2 border-amber-300/80 focus:outline-hidden"
      >
        {/* Pulsing Aura Ring */}
        <span className="absolute -inset-1 rounded-full bg-amber-500/40 animate-ping pointer-events-none" />

        {/* Mascot Robot Icon */}
        <div className="relative flex items-center justify-center">
          <Bot className="w-6 h-6 text-stone-950 drop-shadow-xs group-hover:rotate-12 transition-transform duration-200" />
        </div>

        {/* Mini status indicator dot */}
        <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-stone-950 shadow-xs" />
      </button>
    </div>
  );
};
