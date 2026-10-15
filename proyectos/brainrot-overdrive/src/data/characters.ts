import type { Stats } from '../logic/stats';
import type { WeaponId } from './weapons';

export type CharacterId = 'npc' | 'gymbro' | 'gremlin' | 'spillqueen';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  tagline: string;
  perk: string;
  weapon: WeaponId;
  texture: string;
  accent: string; // CSS colour for menus
  /** How to unlock it (null = available from the start). */
  unlock: null | { achievement: string; hint: string };
  mod: (s: Stats) => void;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'npc', name: 'NPC #404', tagline: 'Gained sentience mid-scroll. Furious about it.',
    perk: 'Balanced. Starts with Clout Cannon.', weapon: 'cannon', texture: 'p_npc', accent: '#3ee6ff',
    unlock: null, mod: () => {},
  },
  {
    id: 'gymbro', name: 'Gym Bro', tagline: 'Has never once skipped leg day. Or any day.',
    perk: '+30 max HP, -8% speed. Starts with Bass Drop.', weapon: 'boom', texture: 'p_gymbro', accent: '#ff4fa3',
    unlock: { achievement: 'survive3', hint: 'Survive 3:00 in any run.' },
    mod: (s) => { s.maxHp += 30; s.moveSpeed *= 0.92; },
  },
  {
    id: 'gremlin', name: 'The Gremlin', tagline: 'Chronically online. Powered by router heat.',
    perk: '+10% speed, +10% crit, -20 max HP. Starts with Wi-Fi Zap.', weapon: 'zap', texture: 'p_gremlin', accent: '#b07bff',
    unlock: { achievement: 'doomkill', hint: 'Defeat The Doomscroller.' },
    mod: (s) => { s.moveSpeed *= 1.1; s.critChance += 0.1; s.maxHp -= 20; },
  },
  {
    id: 'spillqueen', name: 'Spill Queen', tagline: 'Knows everything about everyone. Shares it.',
    perk: '+15% area, +10% XP. Starts with Tea Spill.', weapon: 'puddle', texture: 'p_spillqueen', accent: '#ffb547',
    unlock: { achievement: 'synergy3', hint: 'Have 3 synergies active in one run.' },
    mod: (s) => { s.areaMult *= 1.15; s.xpMult *= 1.1; },
  },
];

export const CHARACTER_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c])) as Record<CharacterId, CharacterDef>;

/** Daily-challenge modifiers. Each changes how the run plays, not just a number. */
export interface Modifier {
  id: string;
  name: string;
  text: string;
  stat?: (s: Stats) => void;
  enemyHpMult?: number;
  enemySpeedMult?: number;
  spawnMult?: number;
  xpMult?: number;
}

export const MODIFIERS: Modifier[] = [
  { id: 'bigbrain', name: 'Big Brain Day', text: 'Everything is 40% bigger. Enemies have 25% more HP.', stat: (s) => { s.areaMult *= 1.4; }, enemyHpMult: 1.25 },
  { id: 'speedrun', name: 'Speedrun Day', text: 'You and every enemy move 20% faster.', stat: (s) => { s.moveSpeed *= 1.2; }, enemySpeedMult: 1.2 },
  { id: 'glass', name: 'Glass Day', text: 'Half max HP. Double damage.', stat: (s) => { s.maxHp *= 0.5; s.damageMult *= 2; } },
  { id: 'swarm', name: 'Swarm Day', text: '+45% enemies, +30% XP.', spawnMult: 1.45, xpMult: 1.3 },
  { id: 'crit', name: 'Crit Day', text: '+25% crit chance, but 25% less base damage.', stat: (s) => { s.critChance += 0.25; s.damageMult *= 0.75; } },
];
