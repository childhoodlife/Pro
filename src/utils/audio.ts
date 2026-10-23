/**
 * Web Audio API synthesizer for nostalgic school-desk sound effects
 * and childhood school melodies.
 * Zero external audio file dependencies - works 100% offline!
 */

export type ChildhoodMelodyId = 'purano_shei' | 'tiffin_recess';

class SoundController {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public musicEnabled: boolean = false;
  public vibrationEnabled: boolean = true;
  public volume: number = 0.5;
  public currentMelody: ChildhoodMelodyId = 'purano_shei';

  private isMusicPlaying: boolean = false;
  private musicTimeout: number | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public triggerHaptic(duration: number | number[] = 30) {
    if (!this.vibrationEnabled || typeof window === 'undefined') return;
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Ignore mobile browser restrictions
      }
    }
  }

  // Realistic ballpoint pen push-button click
  public playPenClick() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);

    setTimeout(() => {
      if (!ctx || !this.sfxEnabled) return;
      const t = ctx.currentTime;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2400, t);
      osc2.frequency.exponentialRampToValueAtTime(600, t + 0.03);

      gain2.gain.setValueAtTime(0.18 * this.volume, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + 0.03);
    }, 50);

    this.triggerHaptic(20);
  }

  // Swoosh sound when flicking the pen
  public playFlickSound(powerRatio: number = 0.5) {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1400 + powerRatio * 800, now + 0.08);

    const freqStart = 150 + powerRatio * 200;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25 * this.volume, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);

    this.triggerHaptic(Math.floor(20 + powerRatio * 30));
  }

  // Wooden desk / pen clatter collision sound
  public playCollisionSound(intensity: number = 0.5) {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const clampedIntensity = Math.max(0.1, Math.min(1.0, intensity));
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220 + Math.random() * 60, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.4 * clampedIntensity * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    const noiseOsc = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    noiseOsc.type = 'triangle';
    noiseOsc.frequency.setValueAtTime(1200 + Math.random() * 400, now);
    noiseOsc.frequency.exponentialRampToValueAtTime(300, now + 0.06);

    noiseGain.gain.setValueAtTime(0.3 * clampedIntensity * this.volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noiseOsc.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseOsc.start(now);
    noiseOsc.stop(now + 0.06);

    this.triggerHaptic(Math.floor(30 * clampedIntensity));
  }

  // Drawing ink line scratch on paper
  public playLineDraw() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450 + Math.random() * 100, now);
    osc.frequency.linearRampToValueAtTime(700 + Math.random() * 80, now + 0.08);

    gain.gain.setValueAtTime(0.12 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);

    this.triggerHaptic(15);
  }

  // Box completed chime
  public playBoxComplete() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const now = ctx.currentTime + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    });

    this.triggerHaptic([30, 40, 40]);
  }

  // School bell ring (recess / match victory celebration)
  public playVictoryBell() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    [0, 0.22, 0.44, 0.66].forEach((timeOffset) => {
      const now = ctx.currentTime + timeOffset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.35);

      gain.gain.setValueAtTime(0.3 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    });

    this.triggerHaptic([50, 60, 50, 60, 80]);
  }

  // Pen fell off table (Desk knockout)
  public playFallOffDesk() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.4);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);

    setTimeout(() => {
      if (!ctx || !this.sfxEnabled) return;
      const t = ctx.currentTime;
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(90, t);
      thud.frequency.exponentialRampToValueAtTime(30, t + 0.18);

      thudGain.gain.setValueAtTime(0.35 * this.volume, t);
      thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      thud.connect(thudGain);
      thudGain.connect(ctx.destination);
      thud.start(t);
      thud.stop(t + 0.18);
    }, 380);

    this.triggerHaptic([40, 80, 100]);
  }

  public playVictory() {
    this.playVictoryBell();
  }

  public playPenFall() {
    this.playFallOffDesk();
  }

  public playPenFlick(powerRatio: number = 0.5) {
    this.playFlickSound(powerRatio);
  }

  public playPenClash(intensity: number = 0.5) {
    this.playCollisionSound(intensity);
  }

  /**

   * Nostalgic childhood tune generator (শৈশব এর মিষ্টি সুর - Music Box / Flute melody)
   */
  public startChildhoodMelody(melodyId: ChildhoodMelodyId = this.currentMelody) {
    this.currentMelody = melodyId;
    if (this.isMusicPlaying) {
      this.stopChildhoodMelody();
    }
    this.musicEnabled = true;
    this.isMusicPlaying = true;
    this.playMelodyLoop();
  }

  public stopChildhoodMelody() {
    this.musicEnabled = false;
    this.isMusicPlaying = false;
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
  }

  public toggleChildhoodMelody(): boolean {
    if (this.isMusicPlaying) {
      this.stopChildhoodMelody();
      return false;
    } else {
      this.startChildhoodMelody(this.currentMelody);
      return true;
    }
  }

  public isMelodyActive(): boolean {
    return this.isMusicPlaying;
  }

  private playMelodyLoop() {
    if (!this.musicEnabled || !this.isMusicPlaying) return;
    const ctx = this.getContext();
    if (!ctx) return;

    let melody: Array<{ freq: number; dur: number; rest: number }> = [];

    if (this.currentMelody === 'purano_shei') {
      // "Purano Shei Diner Kotha" / nostalgic school memories tune
      melody = [
        { freq: 523.25, dur: 0.35, rest: 0.1 },  // C5
        { freq: 587.33, dur: 0.35, rest: 0.1 },  // D5
        { freq: 659.25, dur: 0.5, rest: 0.15 },  // E5
        { freq: 783.99, dur: 0.45, rest: 0.15 }, // G5
        { freq: 659.25, dur: 0.4, rest: 0.1 },   // E5
        { freq: 587.33, dur: 0.55, rest: 0.2 },  // D5
        { freq: 523.25, dur: 0.7, rest: 0.3 },   // C5
        
        { freq: 659.25, dur: 0.35, rest: 0.1 },  // E5
        { freq: 783.99, dur: 0.35, rest: 0.1 },  // G5
        { freq: 880.00, dur: 0.6, rest: 0.2 },   // A5
        { freq: 783.99, dur: 0.4, rest: 0.1 },   // G5
        { freq: 659.25, dur: 0.4, rest: 0.1 },   // E5
        { freq: 587.33, dur: 0.8, rest: 0.4 },   // D5
        
        { freq: 523.25, dur: 0.35, rest: 0.1 },  // C5
        { freq: 440.00, dur: 0.45, rest: 0.15 }, // A4
        { freq: 523.25, dur: 0.5, rest: 0.2 },   // C5
        { freq: 587.33, dur: 0.5, rest: 0.2 },   // D5
        { freq: 523.25, dur: 1.1, rest: 0.8 },   // C5
      ];
    } else {
      // Playful Tiffin Recess Bell Tune
      melody = [
        { freq: 659.25, dur: 0.3, rest: 0.08 },
        { freq: 783.99, dur: 0.3, rest: 0.08 },
        { freq: 987.77, dur: 0.4, rest: 0.1 },
        { freq: 880.00, dur: 0.35, rest: 0.08 },
        { freq: 783.99, dur: 0.5, rest: 0.2 },
        { freq: 659.25, dur: 0.3, rest: 0.08 },
        { freq: 587.33, dur: 0.35, rest: 0.1 },
        { freq: 659.25, dur: 0.6, rest: 0.3 },
      ];
    }

    let delay = 0;
    melody.forEach((item) => {
      const startTime = delay;
      setTimeout(() => {
        if (!this.musicEnabled || !this.isMusicPlaying) return;
        this.playMusicBoxNote(item.freq, item.dur);
      }, startTime * 1000);
      delay += item.dur + item.rest;
    });

    this.musicTimeout = window.setTimeout(() => {
      if (this.musicEnabled && this.isMusicPlaying) {
        this.playMelodyLoop();
      }
    }, (delay + 1.2) * 1000);
  }

  private playMusicBoxNote(freq: number, duration: number) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12 * this.volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }
}

export const sound = new SoundController();
