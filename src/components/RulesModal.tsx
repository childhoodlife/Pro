import React from 'react';
import { X, BookOpen, ShieldCheck, Volume2 } from 'lucide-react';
import { Translations } from '../utils/translations';
import { sound } from '../utils/audio';
import { voiceCoach } from '../utils/voiceCoach';

interface RulesModalProps {
  t: Translations;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ t, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-100 font-handwriting">
              {t.rules.title}
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playPenClick();
              voiceCoach.stop();
              onClose();
            }}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-stone-300">
          {/* Pen Fight Section */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-amber-300 text-base font-handwriting">
                {t.rules.pfRulesHeader}
              </h3>
              <button
                onClick={() => {
                  sound.playPenClick();
                  voiceCoach.readRules('pen_fight', t.appName.includes('চাইল্ডহুড') ? 'bn' : 'en');
                }}
                className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-950/50 border border-amber-800/60 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t.rules.listenSpoken}</span>
              </button>
            </div>
            <ul className="space-y-2 text-stone-300 text-xs leading-relaxed list-disc list-inside">
              <li>{t.rules.pfRule1}</li>
              <li>{t.rules.pfRule2}</li>
              <li>{t.rules.pfRule3}</li>
              <li>{t.rules.pfRule4}</li>
            </ul>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-400/90 pt-2 border-t border-stone-800/60">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{t.penFight.safeDisclaimer}</span>
            </div>
          </div>

          {/* Dots and Boxes Section */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-amber-300 text-base font-handwriting">
                {t.rules.dbRulesHeader}
              </h3>
              <button
                onClick={() => {
                  sound.playPenClick();
                  voiceCoach.readRules('dots_boxes', t.appName.includes('চাইল্ডহুড') ? 'bn' : 'en');
                }}
                className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-950/50 border border-amber-800/60 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t.rules.listenSpoken}</span>
              </button>
            </div>
            <ul className="space-y-2 text-stone-300 text-xs leading-relaxed list-disc list-inside">
              <li>{t.rules.dbRule1}</li>
              <li>{t.rules.dbRule2}</li>
              <li>{t.rules.dbRule3}</li>
              <li>{t.rules.dbRule4}</li>
            </ul>
          </div>

          {/* Katakuti & SOS Section */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-amber-300 text-base font-handwriting">
                {t.rules.katakutiHeader}
              </h3>
              <button
                onClick={() => {
                  sound.playPenClick();
                  voiceCoach.readRules('katakuti', t.appName.includes('চাইল্ডহুড') ? 'bn' : 'en');
                }}
                className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 bg-amber-950/50 border border-amber-800/60 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t.rules.listenSpoken}</span>
              </button>
            </div>
            <ul className="space-y-2 text-stone-300 text-xs leading-relaxed list-disc list-inside">
              <li>{t.rules.katakutiRule1}</li>
              <li>{t.rules.katakutiRule2}</li>
            </ul>
          </div>

          {/* Fruit Slice Section */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
            <h3 className="font-bold text-amber-300 text-base font-handwriting mb-2">
              {t.fruitSliceTitle} (১০০ স্কোর = জয়)
            </h3>
            <ul className="space-y-2 text-stone-300 text-xs leading-relaxed list-disc list-inside">
              <li>স্ক্রিনে আঙুল বা মাউস টেনে উড়ে আসা ফল কাটুন। প্রতিটি ফলের আলাদা পয়েন্ট আছে (আম, তরমুজ, লিচু)।</li>
              <li>এক টানে একাধিক ফল কাটলে কম্বো বোনাস স্কোর পাবেন।</li>
              <li>চক ও ডাস্টার বোমা কাটলে ১০ পয়েন্ট কাটা যাবে!</li>
              <li>মোট ১০০ পয়েন্ট অর্জন করলেই ম্যাচ জয় এবং একাউন্টে +১ পয়েন্ট যুক্ত হবে।</li>
            </ul>
          </div>

          {/* Bottle Smash Section */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
            <h3 className="font-bold text-amber-300 text-base font-handwriting mb-2">
              {t.bottleSmashTitle} (১০০ স্কোর = জয়)
            </h3>
            <ul className="space-y-2 text-stone-300 text-xs leading-relaxed list-disc list-inside">
              <li>গুলতির চামড়ার খোলসে আঙুল দিয়ে পেছনের দিকে টেনে লক্ষ্য স্থির করুন ও ছেড়ে দিন।</li>
              <li>সবুজ, লাল ও স্বচ্ছ বোতলে ১০-১৫ পয়েন্ট, আর সোনালী ও চলমান বোতলে ২৫-৩০ পয়েন্ট পাওয়া যায়।</li>
              <li>পটকা বোমায় নিশানা লাগলে পয়েন্ট কাটা যাবে।</li>
              <li>১০০ পয়েন্ট সম্পূর্ণ করলেই খেলা জয় এবং স্কিন কেনার স্টার পয়েন্ট অর্জিত হবে।</li>
            </ul>
          </div>

          {/* Chess Section */}
          <div className="bg-stone-950/60 p-4 rounded-xl border border-stone-800/80">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-amber-300 text-base font-handwriting">
                {t.rules.chessHeader}
              </h3>
            </div>
            <ul className="space-y-2 text-stone-300 text-xs leading-relaxed list-disc list-inside">
              <li>{t.rules.chessRule1}</li>
              <li>{t.rules.chessRule2}</li>
              <li>{t.rules.chessRule3}</li>
              <li>{t.rules.chessRule4}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/40 text-right">
          <button
            onClick={() => {
              sound.playPenClick();
              voiceCoach.stop();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
