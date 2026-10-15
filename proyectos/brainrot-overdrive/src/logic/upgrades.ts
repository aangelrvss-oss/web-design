import type { Rng } from '../core/rng';
import { BALANCE } from '../config/balance';
import { FALLBACKS, RARITY_WEIGHT, UPGRADES, UPGRADE_BY_ID, type Rarity, type UpgradeDef } from '../data/upgrades';
import { baseStats, sanitizeStats, type Stats } from './stats';

export type Owned = Record<string, number>;

export const levelOf = (owned: Owned, id: string) => owned[id] ?? 0;

export function weaponCount(owned: Owned): number {
  let n = 0;
  for (const u of UPGRADES) if (u.kind === 'weapon' && levelOf(owned, u.id) > 0) n++;
  return n;
}

export function requirementsMet(def: UpgradeDef, owned: Owned): boolean {
  if (!def.requires) return true;
  return def.requires.every((group) => group.some((r) => levelOf(owned, r.id) >= r.level));
}

export function isEligible(def: UpgradeDef, owned: Owned, slots: number = BALANCE.run.weaponSlots): boolean {
  const lvl = levelOf(owned, def.id);
  if (lvl >= def.maxStacks) return false;
  if (def.kind === 'weapon' && lvl === 0 && weaponCount(owned) >= slots) return false;
  return requirementsMet(def, owned);
}

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export interface OfferOptions {
  count?: number;
  luck?: number;
  /** Crates guarantee at least this rarity when anything that rare is eligible. */
  minRarity?: Rarity;
  exclude?: string[];
  slots?: number;
  /** Upgrades that must be included (e.g. a newly unlocked synergy). Ignored if ineligible. */
  force?: string[];
}

/**
 * Pick distinct upgrade offers. Weighting: rarity × per-def weight. Owned weapons and
 * newly unlocked synergies get a boost so build-defining picks surface reliably, and
 * luck flattens the rarity curve. Falls back to always-useful consolation picks.
 */
export function rollOffers(rng: Rng, owned: Owned, opts: OfferOptions = {}): UpgradeDef[] {
  const count = opts.count ?? 3;
  const luck = opts.luck ?? 0;
  const minIdx = opts.minRarity ? RARITY_ORDER.indexOf(opts.minRarity) : 0;
  let pool = UPGRADES.filter((u) => isEligible(u, owned, opts.slots) && !opts.exclude?.includes(u.id));
  const rareEnough = pool.filter((u) => RARITY_ORDER.indexOf(u.rarity) >= minIdx);
  if (minIdx > 0 && rareEnough.length > 0) pool = rareEnough;

  const weights = pool.map((u) => {
    let w = RARITY_WEIGHT[u.rarity] * (u.weight ?? 1);
    if (u.rarity !== 'common') w *= 1 + 0.25 * luck;
    const lvl = levelOf(owned, u.id);
    if (u.kind === 'weapon' && lvl > 0) w *= 1.6; // keep owned weapons growing
    if (u.kind === 'synergy') w *= 5; // unlocked combos should surface: they are the point
    return w;
  });

  const picks: UpgradeDef[] = [];
  for (const id of opts.force ?? []) {
    const i = pool.findIndex((u) => u.id === id);
    if (i >= 0 && picks.length < count) {
      picks.push(pool[i]);
      pool.splice(i, 1);
      weights.splice(i, 1);
    }
  }
  while (picks.length < count && pool.length > 0) {
    const i = rng.weightedIndex(weights);
    if (i < 0) break;
    picks.push(pool[i]);
    pool.splice(i, 1);
    weights.splice(i, 1);
  }
  for (const f of FALLBACKS) if (picks.length < count) picks.push(f);
  // don't always put a forced pick in the first slot
  if (opts.force?.length && picks.length > 1) {
    const j = rng.int(0, picks.length - 1);
    [picks[0], picks[j]] = [picks[j], picks[0]];
  }
  return picks;
}

/** Rebuild stats from scratch from owned upgrades — no incremental drift possible. */
export function computeStats(owned: Owned, mods: Array<(s: Stats) => void> = []): Stats {
  const s = baseStats();
  for (const m of mods) m(s);
  for (const [id, lvl] of Object.entries(owned)) {
    const def = UPGRADE_BY_ID[id];
    if (def?.apply && lvl > 0) def.apply(s, lvl);
  }
  return sanitizeStats(s);
}

export function activeSynergies(owned: Owned): UpgradeDef[] {
  return UPGRADES.filter((u) => u.kind === 'synergy' && levelOf(owned, u.id) > 0);
}
