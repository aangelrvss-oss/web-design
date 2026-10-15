import { BALANCE } from '../config/balance';

/** Everything the end-of-run screen, titles and achievements are computed from. */
export interface RunStats {
  time: number;
  kills: number;
  eliteKills: number;
  level: number;
  score: number;
  damageDealt: number;
  damageTaken: number;
  crits: number;
  maxCombo: number;
  overdrives: number;
  dashes: number;
  bossesKilled: string[];
  victory: boolean;
  synergies: string[];
  weaponDamage: Record<string, number>;
  dominoKills: number;
  hitlessUntil: number; // time of first damage taken (Infinity if never hit)
  lowestHpFrac: number;
  character: string;
  daily: boolean;
}

export function emptyRunStats(character: string, daily: boolean): RunStats {
  return {
    time: 0, kills: 0, eliteKills: 0, level: 1, score: 0, damageDealt: 0, damageTaken: 0, crits: 0,
    maxCombo: 0, overdrives: 0, dashes: 0, bossesKilled: [], victory: false, synergies: [],
    weaponDamage: {}, dominoKills: 0, hitlessUntil: Infinity, lowestHpFrac: 1, character, daily,
  };
}

export function comboMultiplier(combo: number): number {
  const c = BALANCE.combo;
  return Math.min(c.maxMult, 1 + Math.floor(combo / c.stepKills) * c.stepMult);
}

/** XP needed to advance from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  const x = BALANCE.xp;
  const l = Math.max(0, level - 1);
  return Math.round(x.base + x.linear * l + x.curveCoef * Math.pow(l, x.curveExp));
}

/** Total XP needed to reach `level` from level 1. */
export function xpTotalFor(level: number): number {
  let t = 0;
  for (let l = 1; l < level; l++) t += xpToNext(l);
  return t;
}

/** Final score: running score plus end-of-run bonuses. Pure for testability. */
export function finalScore(s: RunStats, hpLeft: number): number {
  const b = BALANCE.score;
  let total = s.score;
  if (s.victory) total += b.victoryBonus + Math.max(0, Math.round(hpLeft)) * b.hpBonusPerPoint;
  return Math.round(total);
}

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';
export function grade(s: RunStats): Grade {
  if (s.victory && s.damageTaken < 120) return 'S';
  if (s.victory) return 'A';
  if (s.bossesKilled.length > 0 || s.time >= BALANCE.run.midBossAt) return 'B';
  if (s.time >= 120) return 'C';
  return 'D';
}

/** Weapon that dealt the most damage, or null. */
export function topWeapon(s: RunStats): string | null {
  let best: string | null = null;
  let v = 0;
  for (const [k, d] of Object.entries(s.weaponDamage)) if (d > v) { v = d; best = k; }
  return best;
}
