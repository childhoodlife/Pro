import React from 'react';
import { X, Settings as SettingsIcon, Volume2, VolumeX, Music, Smartphone, Palette, Globe, Mic } from 'lucide-react';
import { Translations, Language } from '../utils/translations';
import { GameSettings, AppTheme } from '../utils/storage';
import { sound, ChildhoodMelodyId } from '../utils/audio';
import { voiceCoach } from '../utils/voiceCoach';

interface SettingsModalProps {
  t: Translations;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  t,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-100 font-handwriting">
              {t.settings}
            </h2>
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

        {/* Settings Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-stone-300">
          {/* Language Selection */}
          <div>
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>{t.language}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  sound.playPenClick();
                  onUpdateSettings({ language: 'bn' });
                }}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  settings.language === 'bn'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow'
                    : 'bg-stone-950/60 text-stone-300 hover:bg-stone-800 border border-stone-800'
                }`}
              >
                বাংলা (Bengali)
              </button>
              <button
                onClick={() => {
                  sound.playPenClick();
                  onUpdateSettings({ language: 'en' });
                }}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  settings.language === 'en'
                    ? 'bg-amber-500 text-stone-950 font-bold shadow'
                    : 'bg-stone-950/60 text-stone-300 hover:bg-stone-800 border border-stone-800'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Voice Coach & Audio Controls */}
          <div className="space-y-3 pt-2 border-t border-stone-800">
            {/* Voice Referee & Rules Announcer */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800">
              <div className="flex items-center gap-3">
                <Mic className={`w-5 h-5 ${settings.voiceCoach ? 'text-amber-400' : 'text-stone-500'}`} />
                <div>
                  <div className="text-sm font-medium text-stone-200">{t.voiceCoach}</div>
                  <div className="text-[11px] text-stone-400">{t.voiceCoachSub}</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceCoach}
                onChange={(e) => {
                  voiceCoach.enabled = e.target.checked;
                  onUpdateSettings({ voiceCoach: e.target.checked });
                  if (e.target.checked) sound.playPenClick();
                }}
                className="w-5 h-5 rounded-md accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Sound FX */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800">
              <div className="flex items-center gap-3">
                {settings.sfx ? (
                  <Volume2 className="w-5 h-5 text-amber-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-stone-500" />
                )}
                <div>
                  <div className="text-sm font-medium text-stone-200">{t.soundFX}</div>
                  <div className="text-[11px] text-stone-400">Pen clatters, clicks & bell chimes</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.sfx}
                onChange={(e) => {
                  sound.sfxEnabled = e.target.checked;
                  onUpdateSettings({ sfx: e.target.checked });
                  if (e.target.checked) sound.playPenClick();
                }}
                className="w-5 h-5 rounded-md accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Childhood School Melodies */}
            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Music className={`w-5 h-5 ${settings.music ? 'text-amber-400 animate-pulse' : 'text-stone-500'}`} />
                  <div>
                    <div className="text-sm font-medium text-stone-200">{t.childhoodSong}</div>
                    <div className="text-[11px] text-stone-400">{t.childhoodSongSub}</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.music}
                  onChange={(e) => {
                    const active = e.target.checked;
                    if (active) sound.startChildhoodMelody(settings.melodyId);
                    else sound.stopChildhoodMelody();
                    onUpdateSettings({ music: active });
                  }}
                  className="w-5 h-5 rounded-md accent-amber-500 cursor-pointer"
                />
              </div>

              {settings.music && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800">
                  <button
                    onClick={() => {
                      onUpdateSettings({ melodyId: 'purano_shei' });
                      sound.startChildhoodMelody('purano_shei');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                      settings.melodyId === 'purano_shei'
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    🎵 পুরোনো দিনের গান
                  </button>
                  <button
                    onClick={() => {
                      onUpdateSettings({ melodyId: 'tiffin_recess' });
                      sound.startChildhoodMelody('tiffin_recess');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                      settings.melodyId === 'tiffin_recess'
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'bg-stone-900 text-stone-400 hover:text-white'
                    }`}
                  >
                    🔔 টিফিন বেলের সুর
                  </button>
                </div>
              )}
            </div>

            {/* Vibration */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-sm font-medium text-stone-200">{t.vibration}</div>
                  <div className="text-[11px] text-stone-400">Tactile buzz on mobile phones</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.vibration}
                onChange={(e) => {
                  sound.vibrationEnabled = e.target.checked;
                  onUpdateSettings({ vibration: e.target.checked });
                  if (e.target.checked) sound.triggerHaptic(40);
                }}
                className="w-5 h-5 rounded-md accent-amber-500 cursor-pointer"
              />
            </div>
            {/* Vintage Retro Nostalgic Gameplay Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/30 border border-amber-600/40 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                  90s
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-200">{t.vintageRetro}</div>
                  <div className="text-[11px] text-stone-400">{t.vintageRetroSub}</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.vintageRetroMode}
                onChange={(e) => {
                  onUpdateSettings({ vintageRetroMode: e.target.checked });
                  sound.playPenClick();
                }}
                className="w-5 h-5 rounded-md accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Theme Selection */}
          <div className="pt-2 border-t border-stone-800">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Palette className="w-4 h-4" />
              <span>{t.theme}</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { id: 'vintage_nostalgia', label: t.themes.vintage_nostalgia, desc: '90s lined paper & red margin' },
                  { id: 'golden_school', label: t.themes.golden_school, desc: 'Golden teakwood school bench' },
                  { id: 'notebook', label: t.themes.notebook, desc: 'Clean ruled classroom paper' },
                  { id: 'grid', label: t.themes.grid, desc: 'Math checkered paper' },
                  { id: 'wood', label: t.themes.wood, desc: 'Teak wooden classroom desk' },
                  { id: 'blackboard', label: t.themes.blackboard, desc: 'Dark slate chalk' },
                ] as const
              ).map((th) => (
                <button
                  key={th.id}
                  onClick={() => {
                    sound.playPenClick();
                    onUpdateSettings({ theme: th.id });
                  }}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    settings.theme === th.id
                      ? 'border-amber-400 bg-amber-950/40 text-amber-200 shadow-md ring-1 ring-amber-400/40'
                      : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-stone-200">{th.label}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">{th.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/40 text-right">
          <button
            onClick={() => {
              sound.playPenClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
