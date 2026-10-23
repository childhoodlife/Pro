import { Language } from './translations';

class VoiceCoach {
  public enabled: boolean = true;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public stop() {
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  public speak(text: string, lang: Language = 'bn') {
    if (!this.enabled || !this.isSupported()) return;

    try {
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
      utterance.rate = lang === 'bn' ? 0.95 : 1.0;
      utterance.pitch = 1.05;

      // Try selecting native language voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchingVoice = voices.find((v) =>
          lang === 'bn'
            ? v.lang.startsWith('bn')
            : v.lang.startsWith('en')
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      // SpeechSynthesis can silently fail on restricted devices, safe fallback
    }
  }

  // Pre-configured spoken commentary phrases
  public announceEvent(
    event: 'game_start' | 'flick' | 'near_edge' | 'ringout' | 'extra_turn' | 'win_match' | 'tie',
    lang: Language
  ) {
    if (!this.enabled) return;

    const phrases = {
      bn: {
        game_start: 'খেলা শুরু! আঙুল টেনে ধরে শক্তি বাড়িয়ে কলম ছুড়ুন।',
        flick: 'সুন্দর শট!',
        near_edge: 'সাবধান! কলম বেঞ্চের একদম কিনারায়!',
        ringout: 'ইয়েস! বেঞ্চ থেকে নিচে ফেলে দিয়েছ! দারুণ নকআউট!',
        extra_turn: 'দারুণ! বক্স পূরণ হওয়ায় বোনাস চাল!',
        win_match: 'অভিনন্দন! অসাধারণ দক্ষতায় ম্যাচ জয়ী হলে!',
        tie: 'কড়া লড়াই! ম্যাচ ড্র হয়েছে!',
      },
      en: {
        game_start: 'Game on! Drag back to aim and flick your pen.',
        flick: 'Nice flick!',
        near_edge: 'Watch out! Right on the desk edge!',
        ringout: 'Knockout! Pen fell off the desk!',
        extra_turn: 'Awesome! Box captured, take an extra turn!',
        win_match: 'Victory! You won the championship match!',
        tie: 'Tough match! It is a draw!',
      },
    };

    const text = phrases[lang][event];
    if (text) {
      this.speak(text, lang);
    }
  }

  // Voice narration of game rules
  public readRules(gameType: 'pen_fight' | 'dots_boxes' | 'katakuti', lang: Language) {
    if (lang === 'bn') {
      if (gameType === 'pen_fight') {
        this.speak(
          'পেন ফাইট বা কলম যুদ্ধের নিয়ম: দুই খেলোয়াড় স্কুল বেঞ্চের দুই প্রান্তে কলম রাখবে। আঙুল দিয়ে টেনে দিক ও শক্তি নির্ধারণ করে ছুড়ুন। প্রতিপক্ষের কলম ধাক্কা দিয়ে বেঞ্চ থেকে নিচে ফেলে দিলেই নকআউটে পয়েন্ট পাবেন!',
          'bn'
        );
      } else if (gameType === 'dots_boxes') {
        this.speak(
          'বক্স বানানোর খেলার নিয়ম: খাতার পাতায় পাশাপাশি দুটি বিন্দুর মাঝে দাগ টানুন। একটি বক্সের চার নম্বর দাগটি যে টানবে, বক্সটি তার হবে এবং সে সাথে সাথে একটি বোনাস চাল পাবে। যে বেশি বক্স বানাবে সে বিজয়ী!',
          'bn'
        );
      } else {
        this.speak(
          'কাটাকুটি ও এস ও এস খেলার নিয়ম: খাতার শেষ পৃষ্ঠায় ৩ বাই ৩ ঘরে ক্রস ও শূন্য বসিয়ে এক লাইনে ৩টি মেলান, অথবা গ্রিডে এস আর ও লিখে এস-ও-এস শব্দ বানিয়ে স্কোর করুন!',
          'bn'
        );
      }
    } else {
      if (gameType === 'pen_fight') {
        this.speak(
          'Pen Fight Rules: Place your pens on the school desk. Drag back to aim and flick. Direct collisions transfer realistic physics. Push the opponent off the desk edge to score a knockout win!',
          'en'
        );
      } else if (gameType === 'dots_boxes') {
        this.speak(
          'Dots and Boxes Rules: Connect adjacent dots with lines. When you complete the 4th side of any box, you capture it and earn an immediate bonus turn. The player with the most boxes wins!',
          'en'
        );
      } else {
        this.speak(
          'Katakuti and SOS Rules: Play classic backpage notebook Tic-Tac-Toe to get 3-in-a-row, or place S and O letters to spell out SOS and score points!',
          'en'
        );
      }
    }
  }
}

export const voiceCoach = new VoiceCoach();
