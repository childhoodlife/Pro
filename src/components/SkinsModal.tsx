import React, { useState } from 'react';
import { X, Sparkles, Check, Lock, Trophy, Palette, Play, Zap, Shield, Gauge } from 'lucide-react';
import { PEN_SKINS, PenSkin } from '../utils/skins';
import { UserProfile, equipSkin, purchaseSkinWithPoints } from '../utils/authManager';
import { sound } from '../utils/audio';
import { PenTrialArena } from './PenFight/PenTrialArena';

interface SkinsModalProps {
  user: UserProfile;
  onUpdateUser: () => void;
  onClose: () => void;
  language: 'en' | 'bn';
}

export const SkinsModal: React.FC<SkinsModalProps> = ({
  user,
  onUpdateUser,
  onClose,
  language,
}) => {
  const [trialSkin, setTrialSkin] = useState<PenSkin | null>(null);
  const [purchaseMsg, setPurchaseMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleEquip = (skinId: string) => {
    sound.playPenClick();
    const success = equipSkin(skinId);
    if (success) {
      sound.playBoxComplete();
      onUpdateUser();
    }
  };

  const handlePurchase = (skin: PenSkin) => {
    sound.playPenClick();
    const res = purchaseSkinWithPoints(skin.id, skin.pointsRequired);
    setPurchaseMsg({ text: res.message, error: !res.success });
    if (res.success) {
      sound.playBoxComplete();
      onUpdateUser();
    }
    setTimeout(() => setPurchaseMsg(null), 3000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-stone-900 border-2 border-amber-500/50 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-amber-100 font-handwriting">
                  {language === 'bn' ? 'কলমের স্কিন ও ট্রায়াল গ্যালারি' : 'Pen Skin & Trial Closet'}
                </h2>
                <p className="text-[11px] text-stone-400">
                  {language === 'bn'
                    ? 'পয়েন্ট দিয়ে স্কিন নিন এবং ট্রায়াল ম্যাচে ফিচার পরীক্ষা করুন'
                    : 'Unlock pen skins with points & test drive ink trails'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playPenClick();
                onClose();
              }}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Points Badge Banner */}
          <div className="p-4 bg-amber-950/40 border-b border-amber-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-xs text-stone-300 font-medium">
                  {language === 'bn' ? 'আপনার বর্তমান জয় পয়েন্ট' : 'Your Victory Points'}
                </span>
                <div className="text-xl font-bold font-mono text-amber-400 leading-tight">
                  {user.points} <span className="text-xs font-normal text-amber-200/80">★ পয়েন্ট</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-stone-400">
                আনলক করা স্কিন:
                <strong className="text-amber-300 font-mono ml-1">
                  {user.unlockedSkins.length}/{PEN_SKINS.length}
                </strong>
              </div>
              <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                প্রতি জয়ে +১ পয়েন্ট
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {purchaseMsg && (
            <div
              className={`px-4 py-2 text-xs font-medium text-center ${
                purchaseMsg.error ? 'bg-red-950/80 text-red-200' : 'bg-emerald-950/80 text-emerald-200'
              }`}
            >
              {purchaseMsg.text}
            </div>
          )}

          {/* Skins Grid */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            {PEN_SKINS.map((skin) => {
              const isUnlocked =
                user.unlockedSkins.includes(skin.id) ||
                skin.isUnlockedDefault;
              const isEquipped = user.equippedSkin === skin.id;
              const canAfford = user.points >= skin.pointsRequired;

              return (
                <div
                  key={skin.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                    isEquipped
                      ? 'border-amber-400 bg-amber-950/30 shadow-md ring-1 ring-amber-400/30'
                      : isUnlocked
                      ? 'border-stone-800 bg-stone-950/60 hover:border-stone-700'
                      : 'border-stone-800/60 bg-stone-950/30 opacity-80'
                  }`}
                >
                  {/* Top info row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner shrink-0 border border-black/30 relative overflow-hidden"
                        style={{ backgroundColor: skin.barrelColor }}
                      >
                        <div
                          className="w-4 h-6 rounded-xs shadow"
                          style={{ backgroundColor: skin.capColor }}
                        />
                        <div
                          className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-black/30"
                          style={{ backgroundColor: skin.trailColor }}
                          title="কালির ট্রায়াল রং"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-stone-100 font-handwriting">
                            {language === 'bn' ? skin.name.bn : skin.name.en}
                          </h4>
                          {isEquipped && (
                            <span className="text-[10px] bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full">
                              {language === 'bn' ? 'ব্যবহার হচ্ছে' : 'Equipped'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {language === 'bn' ? skin.desc.bn : skin.desc.en}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-amber-400">
                        {skin.pointsRequired === 0 ? 'ফ্রি' : `${skin.pointsRequired}★`}
                      </div>
                    </div>
                  </div>

                  {/* Pen Specs Mini Pills */}
                  <div className="grid grid-cols-4 gap-1.5 py-1.5 px-2.5 bg-stone-900/60 rounded-xl border border-stone-800/60 text-[10px]">
                    <div className="text-stone-300">
                      <span className="text-stone-500">ওজন:</span> {skin.weightGrams}g
                    </div>
                    <div className="text-stone-300">
                      <span className="text-stone-500">গতি:</span> {skin.speed}%
                    </div>
                    <div className="text-stone-300">
                      <span className="text-stone-500">ধাক্কা:</span> {skin.power}%
                    </div>
                    <div className="text-stone-300">
                      <span className="text-stone-500">গ্রিপ:</span> {skin.friction}%
                    </div>
                  </div>

                  {/* Special Perk info */}
                  <div className="text-[11px] text-amber-300/90 bg-amber-950/20 px-2 py-1 rounded-lg border border-amber-900/30 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{language === 'bn' ? skin.perk.bn : skin.perk.en}</span>
                  </div>

                  {/* Action Buttons Row: Trial Match & Equip/Purchase */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-800/60">
                    {/* Trial Match Button (ALWAYS AVAILABLE TO TEST) */}
                    <button
                      onClick={() => {
                        sound.playPenClick();
                        setTrialSkin(skin);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                    >
                      <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{language === 'bn' ? 'ট্রায়াল খেলুন (Test)' : 'Test Drive'}</span>
                    </button>

                    {/* Equip / Unlock / Need Points */}
                    {isEquipped ? (
                      <button
                        disabled
                        className="px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'চালু আছে' : 'Active'}</span>
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => handleEquip(skin.id)}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'ব্যবহার করুন' : 'Equip Skin'}</span>
                      </button>
                    ) : canAfford ? (
                      <button
                        onClick={() => handlePurchase(skin)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? `কিনুন (-${skin.pointsRequired}★ কাটবে)` : `Buy (-${skin.pointsRequired}★)`}</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3.5 py-1.5 rounded-xl bg-stone-800 border border-stone-700/60 text-stone-400 text-xs flex items-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          {language === 'bn'
                            ? `আর ${skin.pointsRequired - user.points} পয়েন্ট বাকি`
                            : `${skin.pointsRequired - user.points}★ needed`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/60 flex items-center justify-between">
            <span className="text-[11px] text-stone-400">
              যেকোনো স্কিনের ফিচার দেখতে "ট্রায়াল খেলুন" বাটনে চাপুন
            </span>
            <button
              onClick={() => {
                sound.playPenClick();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>

      {/* Trial Arena Overlay */}
      {trialSkin && (
        <PenTrialArena
          skin={trialSkin}
          language={language}
          onClose={() => setTrialSkin(null)}
          isEquipped={user.equippedSkin === trialSkin.id}
          canEquip={
            user.unlockedSkins.includes(trialSkin.id) ||
            trialSkin.isUnlockedDefault ||
            user.points >= trialSkin.pointsRequired
          }
          onEquip={() => {
            handleEquip(trialSkin.id);
          }}
        />
      )}
    </>
  );
};
