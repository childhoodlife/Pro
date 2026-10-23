import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google Gemini API on server side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Google Gemini API initialized successfully on server.');
  } catch (err) {
    console.warn('Failed to initialize Gemini API:', err);
  }
} else {
  console.log('Notice: GEMINI_API_KEY not set in environment. Smart fallback engine enabled.');
}

// Fallback smart response generator for school games and regional dialects
function getSmartFallbackReply(message: string, language: string = 'bn'): string {
  const lower = (message || '').toLowerCase();

  if (lower.includes('দাবা') || lower.includes('chess') || lower.includes('কিস্তিমাত')) {
    return language === 'bn'
      ? 'দাবা খেলায় প্রতিপক্ষের রাজাকে (King) চেকমেট করাই মূল লক্ষ্য! ঘোড়া ‘L’ আকারে লাফ দেয় এবং মন্ত্রী সবদিকে ছুটতে পারে। বোর্ডের মাঝখানের ঘরগুলো নিয়ন্ত্রণ করতে পারলে সহজেই ম্যাচ জয় নিশ্চিত করা যায়।'
      : 'In Chess, your goal is to deliver Checkmate to the enemy King! Control the center 4 squares early, develop your Knights and Bishops, and protect your King.';
  }

  if (lower.includes('পেন ফাইট') || lower.includes('pen fight')) {
    return language === 'bn'
      ? 'পেন ফাইটে কলমের মুখে ক্যাপ লাগালে ওজন ও ধাক্কার শক্তি বাড়ে, আর ক্যাপ ছাড়া কলম হালকা ও দ্রুত গতির হয়! প্রতিপক্ষের কলমের কিনারায় জোরে ফ্লিক করে বেঞ্চ থেকে ফেলে দিন!'
      : 'In Pen Fight, placing the cap on the front adds knockout punch weight! Angle your flick toward the edge of the school desk to achieve a ring-out!';
  }

  if (lower.includes('স্কিন') || lower.includes('skin') || lower.includes('পয়েন্ট') || lower.includes('point')) {
    return language === 'bn'
      ? 'প্রতিটি ম্যাচ জিতলে আপনি ১ পয়েন্ট পাবেন। সেই পয়েন্ট খরচ করে স্কিন কিনলে আপনার ব্যালেন্স থেকে পয়েন্ট কেটে যাবে এবং দারুণ সব বিশেষ কালির ট্রায়াল কলম আনলক হবে!'
      : 'Every match victory awards +1 point! You can spend these points in the skin closet to purchase custom fountain pens and ink trails.';
  }

  if (lower.includes('আঞ্চলিক') || lower.includes('কিরে') || lower.includes('ভালা নি') || lower.includes('ক্যাবা আছ') || lower.includes('কেমনে')) {
    return 'হেইডা তো একদম খাঁটি কথা কইছেন বন্ধু! চাটগাঁইয়া, নোয়াখালী, সিলেটি বা বরিশাইল্যা—যে ভাষাতেই কবেন, শৈশবের খেলাই সবথেকে সেরা! চলেন একসাথে খেলি!';
  }

  return language === 'bn'
    ? 'চাইল্ডহুড লাইফ এআই সবসময় আপনার সাথে আছে! পেন ফাইট, দাবা, কাটাকুটি কিংবা ফল কাটার যেকোনো বুদ্ধি ও স্ট্র্যাটেজি জানতে জিজ্ঞেস করুন।'
    : 'Childhood Life AI is here to coach you! Ask about Pen Fight flicking angles, Chess tactics, or Dots & Boxes strategy.';
}

// API endpoint for Gemini-powered Chat
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, language = 'bn', gameContext = 'home' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    if (ai) {
      const systemInstruction = `You are the super-smart, empathetic Childhood Life AI (শৈশব জীবন এআই), created by RM.Rahimul.
You are an expert grandmaster in retro schoolyard desk games:
1. Pen Fight (কলমে কলমের যুদ্ধ): Tabletop flicking physics, cap weight distribution, rubber grips, spin knockout tactics.
2. Dots and Boxes (বক্স বানানোর খেলা): Grid strategy, chain reactions, avoiding giving the 3rd line.
3. Katakuti & SOS (কাটাকুটি ও এস-ও-এস): 3x3 Tic-Tac-Toe center control, 5x5 SOS grid traps.
4. Fruit Slice (ফল কাটা খেলা): Pen blade multi-slice combos, avoiding chalk-duster bombs, reaching 100 points.
5. Bottle Smash (বোতল ভাঙ্গা খেলা): Slingshot stone projectile trajectory, breaking high-value glass bottles to reach 100 points.
6. International Chess (আন্তর্জাতিক দাবা): FIDE rules, piece movements (King, Queen, Rook, Bishop, Knight, Pawn), checks, pins, forks, and Checkmate.
You understand regional dialects (আঞ্চলিক ভাষা - যেমন চাটগাঁইয়া, নোয়াখালী, সিলেটি, পুরান ঢাকা, বরিশাল, রাজশাহী) and natural emotions!
Respond warmly, enthusiastically, and smartly in the user's language (${language === 'bn' ? 'Bengali' : 'English'}). Keep responses concise, friendly, and practical (2-4 sentences).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `User message: "${message}". Current game: ${gameContext}. Response language: ${language}.`,
        config: {
          systemInstruction,
          temperature: 0.8,
        },
      });

      const reply = response.text || getSmartFallbackReply(message, language);
      return res.json({ reply, poweredBy: 'gemini-3.8-flash' });
    }

    const reply = getSmartFallbackReply(message, language);
    return res.json({ reply, poweredBy: 'local-intelligence' });
  } catch (err: any) {
    console.error('Error generating AI response:', err);
    const reply = getSmartFallbackReply(req.body?.message, req.body?.language);
    return res.json({ reply, poweredBy: 'fallback-intelligence' });
  }
});

// Setup Vite in development or static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Childhood Life Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
