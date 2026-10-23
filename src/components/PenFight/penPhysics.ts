export interface PenArchetype {
  id: string;
  name: { en: string; bn: string };
  desc: { en: string; bn: string };
  mass: number;
  friction: number;
  maxPower: number;
  length: number;
  width: number;
  defaultColor: string;
  defaultCap: string;
}

export type CapPosition = 'cap_back' | 'cap_front' | 'no_cap';
export type SpringMod = 'normal' | 'tightened';
export type GripWrap = 'bare' | 'rubber_band';

export interface PenMods {
  capPos: CapPosition;
  spring: SpringMod;
  grip: GripWrap;
}

export const PEN_ARCHETYPES: PenArchetype[] = [
  {
    id: 'ballpoint',
    name: { en: 'Classic Ballpoint (Reynolds 045)', bn: 'হালকা বলপেন (রেয়নল্ডস ০৪৫)' },
    desc: { en: 'Fast & agile classic school pen. Slides quickly across the desk.', bn: 'দ্রুত ও চটপটে ক্লাসিক স্কুল পেন। বেঞ্চে দ্রুত পিছলে যায়।' },
    mass: 1.0,
    friction: 0.965,
    maxPower: 26,
    length: 120,
    width: 20,
    defaultColor: '#1d4ed8',
    defaultCap: '#2563eb',
  },
  {
    id: 'gel',
    name: { en: 'Sleek Gel Pen (Cello Gripper)', bn: 'গ্রিপার জেল পেন (সিলো)' },
    desc: { en: 'Excellent rubber grip and balanced spin control.', bn: 'রবার গ্রিপ ও নিখুঁত স্পিন কন্ট্রোল যুক্ত ভারসাম্যপূর্ণ পেন।' },
    mass: 1.25,
    friction: 0.955,
    maxPower: 24,
    length: 124,
    width: 22,
    defaultColor: '#dc2626',
    defaultCap: '#b91c1c',
  },
  {
    id: 'fountain',
    name: { en: 'Heavy Fountain Pen (Hero 332)', bn: 'ভারী ঝর্ণা কলম (হিরো ৩৩২)' },
    desc: { en: 'Heavy metal body with high collision momentum and knockout punch.', bn: 'ভারী মেটাল বডি। জোরদার ধাক্কায় প্রতিপক্ষকে ছিটকে ফেলে দেয়।' },
    mass: 1.75,
    friction: 0.948,
    maxPower: 22,
    length: 130,
    width: 24,
    defaultColor: '#15803d',
    defaultCap: '#eab308',
  },
  {
    id: 'marker',
    name: { en: 'Fat Desk Marker (Bold)', bn: 'মোটা মার্কার পেন (বোল্ড)' },
    desc: { en: 'Solid heavy anchor. Hard to knock off the desk edge.', bn: 'ভারী ও স্থিতিশীল। বেঞ্চ থেকে ফেলে দেওয়া খুব কঠিন।' },
    mass: 2.15,
    friction: 0.935,
    maxPower: 20,
    length: 110,
    width: 30,
    defaultColor: '#7c3aed',
    defaultCap: '#5b21b6',
  },
];

export interface PenEntity {
  id: 1 | 2;
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  vAngle: number;
  mass: number;
  friction: number;
  maxPower: number;
  length: number;
  width: number;
  color: string;
  capColor: string;
  archetypeId: string;
  mods: PenMods;
  hp: number;
  isFellOff: boolean;
  fallProgress: number;
}

// Apply childhood pen modifications to stats
export function applyPenMods(base: PenArchetype, mods: PenMods) {
  let mass = base.mass;
  let friction = base.friction;
  let maxPower = base.maxPower;

  // Cap position effect
  if (mods.capPos === 'cap_front') {
    mass += 0.25; // Front-heavy punch
    friction -= 0.005;
  } else if (mods.capPos === 'no_cap') {
    mass -= 0.2; // Lightweight
    maxPower += 3; // Extra fast flick
  }

  // Spring tuning effect
  if (mods.spring === 'tightened') {
    maxPower += 4; // Extra launch velocity
  }

  // Rubber band grip effect
  if (mods.grip === 'rubber_band') {
    friction -= 0.012; // High desk grip, stops faster
  }

  return { mass, friction, maxPower };
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function checkPenCollision(p1: PenEntity, p2: PenEntity): { collided: boolean; normalX: number; normalY: number; overlap: number } {
  const getCircles = (p: PenEntity) => {
    const halfL = p.length / 2;
    const cos = Math.cos(p.angle);
    const sin = Math.sin(p.angle);
    const radius = p.width / 2;

    return [
      { x: p.x - cos * (halfL - radius), y: p.y - sin * (halfL - radius), r: radius },
      { x: p.x, y: p.y, r: radius },
      { x: p.x + cos * (halfL - radius), y: p.y + sin * (halfL - radius), r: radius },
    ];
  };

  const circles1 = getCircles(p1);
  const circles2 = getCircles(p2);

  for (const c1 of circles1) {
    for (const c2 of circles2) {
      const d = distance(c1.x, c1.y, c2.x, c2.y);
      const minDist = c1.r + c2.r;
      if (d < minDist && d > 0.001) {
        return {
          collided: true,
          normalX: (c2.x - c1.x) / d,
          normalY: (c2.y - c1.y) / d,
          overlap: minDist - d,
        };
      }
    }
  }

  return { collided: false, normalX: 0, normalY: 0, overlap: 0 };
}

export function resolveCollision(p1: PenEntity, p2: PenEntity, normalX: number, normalY: number, overlap: number) {
  const percent = 0.5;
  p1.x -= normalX * overlap * percent;
  p1.y -= normalY * overlap * percent;
  p2.x += normalX * overlap * percent;
  p2.y += normalY * overlap * percent;

  const kx = p1.vx - p2.vx;
  const ky = p1.vy - p2.vy;
  const p = 2 * (normalX * kx + normalY * ky) / (p1.mass + p2.mass);

  const restitution = 0.84;
  p1.vx -= p * p2.mass * normalX * restitution;
  p1.vy -= p * p2.mass * normalY * restitution;
  p2.vx += p * p1.mass * normalX * restitution;
  p2.vy += p * p1.mass * normalY * restitution;

  const spinForce = (Math.random() - 0.5) * 0.28 * (Math.abs(kx) + Math.abs(ky));
  p1.vAngle += spinForce / p1.mass;
  p2.vAngle -= spinForce / p2.mass;
}
