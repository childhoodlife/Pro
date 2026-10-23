import React from 'react';
import { Volume2, Sparkles, Heart, Bot } from 'lucide-react';
import { sound } from '../utils/audio';
import { voiceCoach } from '../utils/voiceCoach';

interface CreatorFooterProps {
  onOpenAI: () => void;
  language: 'en' | 'bn';
}

export const CreatorFooter: React.FC<CreatorFooterProps> = ({ onOpenAI, language }) => {
  const handleSpeakCreator = () => {
    sound.playPenClick();
    if (language === 'bn') {
      voiceCoach.speak('এইটি তৈরি করেছেন আর এম রাহিমুল, রাহিমুল ইসলাম রিশাদ।', 'bn');
    } else {
      voiceCoach.speak('This application was created by RM.Rahimul, Rahimul Islam Rishad.', 'en');
    }
  };

  return (
    <footer className="mt-auto border-t border-amber-950/40 bg-stone-950/90 backdrop-blur-md py-6 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Creator Name & Voice Audio Button */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Heart className="w-4 h-4 fill-amber-400/30 text-amber-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-amber-100 font-handwriting tracking-wide">
                এইটি তৈরি করেছেন <span className="text-amber-400 font-bold font-sans">RM.Rahimul</span>
              </span>

              {/* Sound Audio Option */}
              <button
                onClick={handleSpeakCreator}
                title="পড়ে শুনুন (Listen Aloud)"
                className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/80 text-amber-300 transition-colors flex items-center justify-center group"
                aria-label="পড়ে শুনুন"
              >
                <Volume2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <p className="text-[11px] text-stone-400">
              রাহিমুল ইসলাম রিশাদ · Childhood Life Edition
            </p>
          </div>
        </div>

        {/* Ask AI Assistant Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playPenClick();
              onOpenAI();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-all shadow-xs"
          >
            <Bot className="w-4 h-4 text-amber-400" />
            <span>{language === 'bn' ? 'এআই কে প্রশ্ন করুন' : 'Ask AI Assistant'}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>
    </footer>
  );
};
