import { BALANCE } from '../config/balance';
import type { Rng } from '../core/rng';
import type { Stats } from './stats';

export interface HitContext {
  hpFrac: number; // player hp / max
  overdrive: boolean;
  comeback: boolean; // Comeback Arc owned
  mainCharacter: boolean; // Main Character Syndrome owned
}

/** Global damage multiplier from conditional effects (excluding crits). */
export function conditionalMult(ctx: HitContext): number {
  const syn = BALANCE.synergy;
  let m = 1;
  if (ctx.overdrive) m *= BALANCE.overdrive.damageMult;
  if (ctx.comeback && ctx.hpFrac <= syn.comebackThreshold) m *= syn.comebackDamage;
  if (ctx.mainCharacter && ctx.hpFrac >= 0.999) m *= syn.mainCharDamage;
  return m;
}

export interface HitResult {
  amount: number;
  crit: boolean;
}

export function rollHit(base: number, stats: Stats, ctx: HitContext, rng: Rng, canCrit = true): HitResult {
  const crit = canCrit && rng.next() < stats.critChance;
  const amount = base * stats.damageMult * conditionalMult(ctx) * (crit ? stats.critMult : 1);
  return { amount, crit };
}

/** Damage the player takes after reductions. Never below 1 for a real hit. */
export function incomingDamage(raw: number, stats: Stats): number {
  return Math.max(1, Math.round(raw * stats.damageTaken));
}
