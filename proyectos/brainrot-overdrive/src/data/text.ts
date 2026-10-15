import type { RunStats } from '../logic/runStats';
import { topWeapon } from '../logic/runStats';

/** Announcer lines. Kept short, used sparingly (see Announcer cooldowns in GameScene). */
export const LINES = {
  start: ['THE FEED IS LIVE', 'YOU ARE NOW ONLINE', 'DO NOT LOG OFF'],
  firstLevel: ['LEVEL UP. PICK ONE. CHOOSE WISELY. OR DON’T.'],
  combo50: ['COMBO 50 · UNHINGED'],
  combo100: ['COMBO 100 · GENUINELY CONCERNING'],
  combo200: ['COMBO 200 · TOUCH GRASS IMMEDIATELY'],
  elite: ['A CERTIFIED {name} HAS ENTERED THE CHAT', 'IT’S GIVING DANGER: CERTIFIED {name}'],
  copypasta: ['COPYPASTA DETECTED · DELETE THE ORIGINAL', 'CTRL+C CTRL+V CTRL+C CTRL+V'],
  lowHp: ['ABSOLUTELY COOKED', 'LOW HP · LOCK IN', 'THIS IS YOUR COMEBACK ARC'],
  overdriveReady: ['OVERDRIVE READY · PRESS E'],
  overdrive: ['BRAINROT OVERDRIVE', 'LOCKED IN', 'NO THOUGHTS · ONLY DAMAGE'],
  synergy: ['SYNERGY UNLOCKED: {name}'],
  horde: ['THEY’RE SURROUNDING YOU · THIS IS FINE', 'ENGAGEMENT BAIT INCOMING'],
  rush: ['ANY% RUSH INCOMING'],
  bossWarn: ['WARNING · SOMETHING IS TRENDING'],
  touchGrass: ['THE ALGORITHM DEMANDS YOU TOUCH GRASS'],
  bossPhase: ['IT’S MAD NOW', 'PHASE 2 · THE RATIO ARC'],
  victory: ['YOU LOGGED OFF'],
};

export const fill = (line: string, vars: Record<string, string>) =>
  line.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');

const WEAPON_TITLES: Record<string, string> = {
  cannon: 'Professional Poster',
  orbit: 'Fidget Overlord',
  boom: 'Bass-Boosted Menace',
  zap: 'Router Goblin',
  homing: 'Reply Guy Supreme',
  puddle: 'Spiller of Tea',
};

/** A funny, performance-derived title. Deterministic for a given stat block. */
export function runTitle(s: RunStats): { title: string; reason: string } {
  if (s.victory && s.damageTaken < 120) return { title: 'Untouchable Aura', reason: 'Won while barely getting hit.' };
  if (s.victory && s.lowestHpFrac < 0.15) return { title: 'Comeback Arc Protagonist', reason: 'Won from under 15% HP.' };
  if (s.victory) return { title: 'Officially Logged Off', reason: 'Defeated The Algorithm.' };
  if (s.time < 45) return { title: 'Speedran Getting Ratio’d', reason: 'Out in under 45 seconds.' };
  if (s.dominoKills >= 60) return { title: 'Chain Reaction Enjoyer', reason: `${s.dominoKills} kills by detonation.` };
  if (s.maxCombo >= 200) return { title: 'Combo Gremlin', reason: `Peak combo of ${s.maxCombo}.` };
  if (s.crits > 0 && s.crits >= s.kills * 0.6 && s.kills > 100) return { title: 'Crit Goblin', reason: 'Most hits were critical.' };
  if (s.dashes > 120 && s.time < 300) return { title: 'Dashed Into Every Problem', reason: `${s.dashes} dashes.` };
  if (s.bossesKilled.includes('doomscroller')) return { title: 'Scrolled Past It', reason: 'Beat The Doomscroller.' };
  if (s.overdrives >= 3) return { title: 'Permanently Locked In', reason: `${s.overdrives} Overdrives.` };
  const w = topWeapon(s);
  if (w && WEAPON_TITLES[w]) return { title: WEAPON_TITLES[w], reason: 'Your top damage dealer did the talking.' };
  return { title: 'Background NPC', reason: 'Showed up. Was there.' };
}

export const DEATH_QUIPS = [
  'You have been ratio’d.',
  'Connection lost. Vibes lost.',
  'The feed moved on without you.',
  'Skill issue (affectionate).',
  'Ok but that was kind of iconic.',
];
