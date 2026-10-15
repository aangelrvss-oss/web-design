export type EnemyId =
  | 'smoothbrain'
  | 'speedrunner'
  | 'hottake'
  | 'unit'
  | 'ratio'
  | 'ratiolet'
  | 'copypasta';

export type Behavior = 'chase' | 'dasher' | 'ranged' | 'heavy' | 'splitter' | 'copier';

export interface EnemyDef {
  id: EnemyId;
  name: string;
  /** One-line role shown in the bestiary / elite announcements. */
  role: string;
  behavior: Behavior;
  hp: number;
  speed: number;
  damage: number; // contact damage
  radius: number; // collision radius in world units
  xp: number;
  score: number;
  /** 0 = flies on any hit, 1 = immovable. */
  mass: number;
  texture: string;
  /** Hit-flash and death-particle tint. */
  color: number;
}

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  smoothbrain: {
    id: 'smoothbrain', name: 'Smooth Brain', role: 'Shambles toward you. Zero thoughts.',
    behavior: 'chase', hp: 14, speed: 80, damage: 8, radius: 15, xp: 1, score: 10, mass: 0.2,
    texture: 'e_smoothbrain', color: 0xff6fb5,
  },
  speedrunner: {
    id: 'speedrunner', name: 'Any% Andy', role: 'Crouches, flashes, then dashes in a straight line.',
    behavior: 'dasher', hp: 9, speed: 115, damage: 10, radius: 12, xp: 1, score: 15, mass: 0.1,
    texture: 'e_speedrunner', color: 0xc8ff3d,
  },
  hottake: {
    id: 'hottake', name: 'Hot Take', role: 'Keeps its distance and spits scorching takes.',
    behavior: 'ranged', hp: 18, speed: 72, damage: 8, radius: 15, xp: 2, score: 25, mass: 0.25,
    texture: 'e_hottake', color: 0xff8a2a,
  },
  unit: {
    id: 'unit', name: 'Absolute Unit', role: 'Slow. Enormous. Winds up a ground slam.',
    behavior: 'heavy', hp: 125, speed: 50, damage: 16, radius: 30, xp: 6, score: 80, mass: 0.88,
    texture: 'e_unit', color: 0x9a6bff,
  },
  ratio: {
    id: 'ratio', name: 'Ratio', role: 'Pops into two smaller replies when killed.',
    behavior: 'splitter', hp: 30, speed: 92, damage: 9, radius: 18, xp: 2, score: 25, mass: 0.3,
    texture: 'e_ratio', color: 0x3ee6ff,
  },
  ratiolet: {
    id: 'ratiolet', name: 'Reply', role: 'Tiny, fast, annoying.',
    behavior: 'chase', hp: 9, speed: 122, damage: 6, radius: 11, xp: 1, score: 8, mass: 0.1,
    texture: 'e_ratiolet', color: 0x3ee6ff,
  },
  copypasta: {
    id: 'copypasta', name: 'Copypasta', role: 'Duplicates itself until you delete the original.',
    behavior: 'copier', hp: 220, speed: 70, damage: 12, radius: 22, xp: 12, score: 300, mass: 0.6,
    texture: 'e_copypasta', color: 0xffe2a8,
  },
};

/** "Certified" elites: any regular archetype, promoted. */
export const ELITE = { hpMult: 9, radiusMult: 1.45, damageMult: 1.4, speedMult: 0.92, xpMult: 10, scoreMult: 12 };

export const BOSSES = {
  doomscroller: { name: 'THE DOOMSCROLLER', subtitle: 'it has not slept since 2019', hp: 3400, segments: 10, gates: [0.5] },
  algorithm: { name: 'THE ALGORITHM', subtitle: 'it knows what you watched', hp: 7200, gates: [0.66, 0.33] },
} as const;
export type BossId = keyof typeof BOSSES;
