import type { Stats } from '../logic/stats';
import { WEAPONS, WEAPON_MAX_LEVEL, type WeaponId } from './weapons';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type UpgradeKind = 'weapon' | 'passive' | 'cursed' | 'synergy';
export type Tag = 'projectile' | 'area' | 'crit' | 'tank' | 'speed' | 'economy' | 'chain';

/** A requirement is satisfied when the owned level of `id` is at least `level`. */
export interface Requirement {
  id: string;
  level: number;
}

export interface UpgradeDef {
  id: string;
  name: string;
  kind: UpgradeKind;
  rarity: Rarity;
  maxStacks: number;
  icon: string;
  tags: Tag[];
  /** Text for taking the upgrade at `nextLevel` (1-based). */
  text: (nextLevel: number) => string;
  flavor: string;
  /** All groups must pass; within a group, any one requirement passes (AND of ORs). */
  requires?: Requirement[][];
  weight?: number;
  /** Stat changes for owning this upgrade at `level` (cumulative). */
  apply?: (s: Stats, level: number) => void;
}

const weapon = (id: WeaponId, icon: string, tags: Tag[], flavor: string): UpgradeDef => ({
  id,
  name: WEAPONS[id].name,
  kind: 'weapon',
  rarity: 'common',
  maxStacks: WEAPON_MAX_LEVEL,
  icon,
  tags,
  text: (l) => WEAPONS[id].levelText[l - 1],
  flavor,
  weight: 1.15,
});

const pct = (v: number) => `${Math.round(v * 100)}%`;

export const UPGRADES: UpgradeDef[] = [
  // ── Weapons ────────────────────────────────────────────────────────────────
  weapon('cannon', 'bolt', ['projectile'], 'Every post is a banger if you post enough of them.'),
  weapon('orbit', 'spinner', ['area', 'tank'], 'Anxiety, but make it a weapon.'),
  weapon('boom', 'boom', ['area'], 'The sound effect is the damage.'),
  weapon('zap', 'wifi', ['chain'], 'Full bars. Full send.'),
  weapon('homing', 'reply', ['projectile', 'chain'], '"Well, actually…" — every missile, on impact.'),
  weapon('puddle', 'tea', ['area'], 'Sis, the tea is literally scalding.'),

  // ── Passives ───────────────────────────────────────────────────────────────
  {
    id: 'gym', name: 'Gym Arc', kind: 'passive', rarity: 'common', maxStacks: 5, icon: 'fist', tags: ['projectile', 'area'],
    text: () => '+12% damage.', flavor: 'Day one of never skipping.',
    apply: (s, l) => { s.damageMult *= 1 + 0.12 * l; },
  },
  {
    id: 'caffeine', name: 'Caffeine Drip', kind: 'passive', rarity: 'common', maxStacks: 5, icon: 'cup', tags: ['projectile'],
    text: () => '+10% attack speed.', flavor: 'Heart rate: yes.',
    apply: (s, l) => { s.fireRateMult *= 1 + 0.1 * l; },
  },
  {
    id: 'split', name: 'Split Personality', kind: 'passive', rarity: 'rare', maxStacks: 2, icon: 'split', tags: ['projectile'],
    text: () => '+1 projectile for Clout Cannon and Reply Guys.', flavor: 'Both of us agree this is fine.',
    apply: (s, l) => { s.extraProjectiles += l; },
  },
  {
    id: 'bigbrain', name: 'Big Brain', kind: 'passive', rarity: 'common', maxStacks: 5, icon: 'brain', tags: ['area'],
    text: () => '+12% area for every weapon.', flavor: 'Galaxy-sized, physically.',
    apply: (s, l) => { s.areaMult *= 1 + 0.12 * l; },
  },
  {
    id: 'zoomies', name: 'Zoomies', kind: 'passive', rarity: 'common', maxStacks: 4, icon: 'wing', tags: ['speed'],
    text: () => '+8% move speed.', flavor: 'Sprinting for no reason at 3 a.m.',
    apply: (s, l) => { s.moveSpeed *= 1 + 0.08 * l; },
  },
  {
    id: 'thicc', name: 'Thicc Skin', kind: 'passive', rarity: 'common', maxStacks: 5, icon: 'shield', tags: ['tank'],
    text: () => '+20 max HP and heal 20.', flavor: 'Comments simply bounce off.',
    apply: (s, l) => { s.maxHp += 20 * l; },
  },
  {
    id: 'hydrate', name: 'Hydrate', kind: 'passive', rarity: 'common', maxStacks: 4, icon: 'drop', tags: ['tank'],
    text: () => 'Regenerate +0.6 HP per second.', flavor: 'Reminder: drink water, bestie.',
    apply: (s, l) => { s.regen += 0.6 * l; },
  },
  {
    id: 'lucky', name: 'Lucky Streak', kind: 'passive', rarity: 'common', maxStacks: 5, icon: 'clover', tags: ['crit'],
    text: () => '+6% critical hit chance.', flavor: 'The algorithm likes you today.',
    apply: (s, l) => { s.critChance += 0.06 * l; },
  },
  {
    id: 'ruthless', name: 'Brutal Honesty', kind: 'passive', rarity: 'rare', maxStacks: 3, icon: 'blade', tags: ['crit'],
    text: () => '+35% critical hit damage.', flavor: 'No thoughts. Only facts.',
    apply: (s, l) => { s.critMult += 0.35 * l; },
  },
  {
    id: 'magnet', name: 'Clout Magnet', kind: 'passive', rarity: 'common', maxStacks: 4, icon: 'magnet', tags: ['economy'],
    text: () => '+35% pickup range.', flavor: 'Followers just… appear.',
    apply: (s, l) => { s.pickupRadius *= 1 + 0.35 * l; },
  },
  {
    id: 'grind', name: 'Grindset', kind: 'passive', rarity: 'common', maxStacks: 4, icon: 'up', tags: ['economy'],
    text: () => '+12% XP gained.', flavor: 'Rise and grind. Mostly grind.',
    apply: (s, l) => { s.xpMult *= 1 + 0.12 * l; },
  },
  {
    id: 'copium', name: 'Copium', kind: 'passive', rarity: 'rare', maxStacks: 4, icon: 'mask', tags: ['tank'],
    text: () => 'Take 8% less damage.', flavor: "It doesn't hurt if you don't read it.",
    apply: (s, l) => { s.damageTaken *= Math.pow(0.92, l); },
  },
  {
    id: 'unfiltered', name: 'Unfiltered', kind: 'passive', rarity: 'rare', maxStacks: 3, icon: 'arrow', tags: ['projectile'],
    text: () => 'Projectiles pierce +1 enemy.', flavor: 'Says it. Means it. Goes through it.',
    apply: (s, l) => { s.pierce += l; },
  },
  {
    id: 'speedtech', name: 'Speedrun Tech', kind: 'passive', rarity: 'rare', maxStacks: 3, icon: 'dash', tags: ['speed'],
    text: () => '-15% dash cooldown, longer dash invulnerability.', flavor: 'Frame-perfect. Allegedly.',
    apply: (s, l) => { s.dashCooldown *= Math.pow(0.85, l); s.dashInvulnExtra += 0.06 * l; },
  },
  {
    id: 'hyper', name: 'Hyperfixation', kind: 'passive', rarity: 'common', maxStacks: 3, icon: 'eye', tags: ['projectile', 'area'],
    text: () => '+15% projectile speed and +12% effect duration.', flavor: 'Locked onto one thing. Forever.',
    apply: (s, l) => { s.projSpeedMult *= 1 + 0.15 * l; s.durationMult *= 1 + 0.12 * l; },
  },

  // ── Cursed trade-offs ──────────────────────────────────────────────────────
  {
    id: 'glass', name: 'Glass Cannon', kind: 'cursed', rarity: 'epic', maxStacks: 1, icon: 'glass', tags: ['projectile', 'crit'],
    text: () => `+45% damage. ${pct(0.25)} less max HP.`, flavor: 'Built different. Built fragile.',
    apply: (s) => { s.damageMult *= 1.45; s.maxHp *= 0.75; },
  },
  {
    id: 'doomscroll', name: 'Doomscrolling', kind: 'cursed', rarity: 'epic', maxStacks: 1, icon: 'scroll', tags: ['economy'],
    text: () => '+35% XP and +15% attack speed. Enemies move 12% faster.', flavor: 'Just one more. Just one more.',
    apply: (s) => { s.xpMult *= 1.35; s.fireRateMult *= 1.15; s.enemySpeedMult *= 1.12; },
  },
  {
    id: 'unhinged', name: 'Unhinged Mode', kind: 'cursed', rarity: 'epic', maxStacks: 1, icon: 'bolt2', tags: ['speed'],
    text: () => '+25% move speed and +20% attack speed. Take 20% more damage.', flavor: 'No brakes. No regrets. Some regrets.',
    apply: (s) => { s.moveSpeed *= 1.25; s.fireRateMult *= 1.2; s.damageTaken *= 1.2; },
  },

  // ── Synergies (real interactions, implemented in the combat systems) ──────
  {
    id: 'ricochet', name: 'Ricochet Rizz', kind: 'synergy', rarity: 'legendary', maxStacks: 1, icon: 'ricochet', tags: ['projectile', 'chain'],
    text: () => 'Clout bolts bounce to a new enemy on every hit (+2 bounces).', flavor: 'Smooth enough to hit twice.',
    requires: [[{ id: 'cannon', level: 2 }], [{ id: 'unfiltered', level: 1 }, { id: 'split', level: 1 }]], weight: 3,
  },
  {
    id: 'meltdown', name: 'Critical Meltdown', kind: 'synergy', rarity: 'legendary', maxStacks: 1, icon: 'nuke', tags: ['crit', 'area'],
    text: () => 'Critical hits explode for 45% of their damage around the target.', flavor: 'Not a crit. A whole event.',
    requires: [[{ id: 'lucky', level: 2 }, { id: 'ruthless', level: 1 }]], weight: 3,
  },
  {
    id: 'domino', name: 'Domino Theory', kind: 'synergy', rarity: 'legendary', maxStacks: 1, icon: 'domino', tags: ['area', 'chain'],
    text: () => 'Kills have a 30% chance to detonate. Detonations can chain.', flavor: 'One falls. They all fall. Content.',
    requires: [[{ id: 'boom', level: 1 }, { id: 'bigbrain', level: 2 }, { id: 'homing', level: 2 }]], weight: 3,
  },
  {
    id: 'comeback', name: 'Comeback Arc', kind: 'synergy', rarity: 'legendary', maxStacks: 1, icon: 'heart', tags: ['tank'],
    text: () => 'Below 40% HP: +35% damage, and every 8 kills heal 4 HP.', flavor: 'They counted you out. Classic mistake.',
    requires: [[{ id: 'thicc', level: 1 }, { id: 'copium', level: 1 }, { id: 'hydrate', level: 1 }]], weight: 2.5,
  },
  {
    id: 'burnout', name: 'Burnout Trail', kind: 'synergy', rarity: 'legendary', maxStacks: 1, icon: 'fire', tags: ['speed', 'area'],
    text: () => 'Dashing leaves a burning trail that scorches enemies.', flavor: 'Leaving skid marks on the timeline.',
    requires: [[{ id: 'speedtech', level: 1 }, { id: 'zoomies', level: 2 }]], weight: 3,
  },
  {
    id: 'static', name: 'Static Spin', kind: 'synergy', rarity: 'legendary', maxStacks: 1, icon: 'static', tags: ['chain', 'area'],
    text: () => 'Fidget spinner hits have a 22% chance to launch a Wi-Fi zap chain.', flavor: 'Friction-based networking.',
    requires: [[{ id: 'orbit', level: 1 }], [{ id: 'zap', level: 1 }]], weight: 3.5,
  },
  {
    id: 'ratiod', name: "Ratio'd", kind: 'synergy', rarity: 'legendary', maxStacks: 1, icon: 'ratio', tags: ['projectile', 'chain'],
    text: () => 'Enemies killed by Reply Guys release 3 mini-missiles.', flavor: 'Replies to the replies.',
    requires: [[{ id: 'homing', level: 2 }]], weight: 3,
  },
  {
    id: 'conductive', name: 'Electric Tea', kind: 'synergy', rarity: 'legendary', maxStacks: 1, icon: 'teazap', tags: ['chain', 'area'],
    text: () => 'Zapping an enemy in tea shocks every enemy in that puddle.', flavor: 'Hot. Wet. Conductive. Science.',
    requires: [[{ id: 'puddle', level: 1 }], [{ id: 'zap', level: 1 }]], weight: 3.5,
  },
  {
    id: 'maincharacter', name: 'Main Character Syndrome', kind: 'synergy', rarity: 'legendary', maxStacks: 1, icon: 'crown', tags: ['projectile', 'tank'],
    text: () => 'At full HP: +50% damage and giant golden clout bolts.', flavor: 'Everyone else is an NPC. Literally.',
    requires: [[{ id: 'thicc', level: 2 }, { id: 'hydrate', level: 2 }], [{ id: 'gym', level: 2 }, { id: 'cannon', level: 4 }]], weight: 2,
  },
];

/** Consolation picks that are always valid when nothing else is left to offer. */
export const FALLBACKS: UpgradeDef[] = [
  {
    id: 'snack', name: 'Gas Station Sushi', kind: 'passive', rarity: 'common', maxStacks: 999, icon: 'snack', tags: ['tank'],
    text: () => 'Heal 35% of max HP.', flavor: 'Questionable. Effective.',
  },
  {
    id: 'cloutbag', name: 'Bag of Clout', kind: 'passive', rarity: 'common', maxStacks: 999, icon: 'bag', tags: ['economy'],
    text: () => '+2,500 score.', flavor: 'Numbers go up. That is the whole point.',
  },
];

export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(
  [...UPGRADES, ...FALLBACKS].map((u) => [u.id, u]),
);

export const RARITY_WEIGHT: Record<Rarity, number> = { common: 60, rare: 28, epic: 9, legendary: 4 };
