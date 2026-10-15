import { describe, expect, it } from 'vitest';
import { Rng, hash32 } from '../src/core/rng';
import { SpatialGrid } from '../src/core/spatialHash';
import { UPGRADES, UPGRADE_BY_ID } from '../src/data/upgrades';
import { WEAPONS, WEAPON_IDS, weaponAt } from '../src/data/weapons';
import { activeSynergies, computeStats, isEligible, requirementsMet, rollOffers, weaponCount } from '../src/logic/upgrades';
import { conditionalMult, incomingDamage, rollHit } from '../src/logic/combat';
import { baseStats } from '../src/logic/stats';
import { comboMultiplier, emptyRunStats, finalScore, grade, xpToNext, xpTotalFor } from '../src/logic/runStats';
import { runTitle } from '../src/data/text';
import { BALANCE } from '../src/config/balance';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(42), b = new Rng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });
  it('stays in range and differs across seeds', () => {
    const r = new Rng(1);
    for (let i = 0; i < 1000; i++) {
      const v = r.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });
  it('weightedIndex never picks zero-weight entries', () => {
    const r = new Rng(9);
    for (let i = 0; i < 500; i++) expect(r.weightedIndex([0, 1, 0, 3])).not.toBe(0);
    expect(r.weightedIndex([0, 0])).toBe(-1);
  });
  it('hash32 is stable', () => {
    expect(hash32('abc')).toBe(hash32('abc'));
    expect(hash32('abc')).not.toBe(hash32('abd'));
  });
});

describe('spatial grid', () => {
  it('finds nearby items and ignores far ones', () => {
    const g = new SpatialGrid(1000, 1000, 64);
    g.insert(0, 100, 100);
    g.insert(1, 900, 900);
    const near = [...g.query(110, 110, 30)];
    expect(near).toContain(0);
    expect(near).not.toContain(1);
    g.clear();
    expect(g.query(100, 100, 30)).toHaveLength(0);
  });
});

describe('xp curve', () => {
  it('first level-up is quick and the curve grows monotonically', () => {
    expect(xpToNext(1)).toBe(BALANCE.xp.base);
    for (let l = 1; l < 40; l++) expect(xpToNext(l + 1)).toBeGreaterThan(xpToNext(l));
    expect(xpTotalFor(1)).toBe(0);
    expect(xpTotalFor(3)).toBe(xpToNext(1) + xpToNext(2));
  });
});

describe('weapons', () => {
  it('every weapon has text for 5 levels and folds deltas', () => {
    for (const id of WEAPON_IDS) {
      expect(WEAPONS[id].levelText).toHaveLength(5);
      expect(WEAPONS[id].levels).toHaveLength(4);
      const l1 = weaponAt(id, 1), l5 = weaponAt(id, 5);
      expect(l5.damage).toBeGreaterThanOrEqual(l1.damage);
    }
    expect(weaponAt('cannon', 5).count).toBe(3);
    expect(weaponAt('homing', 5).count).toBe(4);
    expect(weaponAt('cannon', 5).pierce).toBe(1);
    expect(weaponAt('cannon', 3).damage).toBeCloseTo(12 * 1.3);
    expect(weaponAt('boom', 5).extra).toBe(1);
  });
});

describe('upgrades', () => {
  it('ids are unique', () => {
    const ids = UPGRADES.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every requirement references a real upgrade at a reachable level', () => {
    for (const u of UPGRADES) for (const g of u.requires ?? []) for (const r of g) {
      expect(UPGRADE_BY_ID[r.id], `${u.id} -> ${r.id}`).toBeDefined();
      expect(r.level).toBeLessThanOrEqual(UPGRADE_BY_ID[r.id].maxStacks);
    }
  });
  it('synergies require prerequisites (AND of ORs)', () => {
    const ric = UPGRADE_BY_ID.ricochet;
    expect(requirementsMet(ric, { cannon: 2 })).toBe(false);
    expect(requirementsMet(ric, { cannon: 2, unfiltered: 1 })).toBe(true);
    expect(requirementsMet(ric, { cannon: 1, split: 1 })).toBe(false);
    expect(requirementsMet(UPGRADE_BY_ID.static, { orbit: 1 })).toBe(false);
    expect(requirementsMet(UPGRADE_BY_ID.static, { orbit: 1, zap: 1 })).toBe(true);
  });
  it('respects stacking limits and weapon slots', () => {
    expect(isEligible(UPGRADE_BY_ID.cannon, { cannon: 5 })).toBe(false);
    const full = { cannon: 1, orbit: 1, boom: 1, zap: 1 };
    expect(weaponCount(full)).toBe(4);
    expect(isEligible(UPGRADE_BY_ID.homing, full)).toBe(false);
    expect(isEligible(UPGRADE_BY_ID.cannon, full)).toBe(true);
  });
  it('offers are distinct, eligible and deterministic per seed', () => {
    for (let seed = 1; seed < 200; seed++) {
      const owned = { cannon: 2, lucky: 2, orbit: 1 };
      const a = rollOffers(new Rng(seed), owned);
      const b = rollOffers(new Rng(seed), owned);
      expect(a.map((u) => u.id)).toEqual(b.map((u) => u.id));
      expect(new Set(a.map((u) => u.id)).size).toBe(3);
      for (const u of a) if (u.kind !== 'passive' || UPGRADE_BY_ID[u.id].maxStacks < 999) expect(isEligible(u, owned)).toBe(true);
    }
  });
  it('falls back to consolation picks when everything is maxed', () => {
    const owned: Record<string, number> = {};
    for (const u of UPGRADES) owned[u.id] = u.maxStacks;
    const offers = rollOffers(new Rng(3), owned);
    expect(offers.map((o) => o.id)).toEqual(['snack', 'cloutbag']);
  });
  it('crates honour minimum rarity when possible', () => {
    for (let seed = 1; seed < 50; seed++) {
      const offers = rollOffers(new Rng(seed), { cannon: 1 }, { minRarity: 'rare' });
      for (const o of offers) expect(o.rarity).not.toBe('common');
    }
  });
  it('stats are rebuilt from owned upgrades and clamped', () => {
    const s = computeStats({ gym: 2, lucky: 5, copium: 4, glass: 1 });
    expect(s.damageMult).toBeCloseTo(1.24 * 1.45);
    expect(s.critChance).toBeCloseTo(BALANCE.player.critChance + 0.3);
    expect(s.maxHp).toBe(75);
    expect(s.damageTaken).toBeGreaterThanOrEqual(0.45);
    const extreme = computeStats({ copium: 4, lucky: 5 }, [(x) => { x.critChance = 5; x.damageTaken = 0.01; }]);
    expect(extreme.critChance).toBeLessThanOrEqual(0.85);
    expect(extreme.damageTaken).toBe(0.45);
  });
  it('forced picks are included when eligible and ignored when not', () => {
    for (let seed = 1; seed < 40; seed++) {
      expect(rollOffers(new Rng(seed), { orbit: 1, zap: 1 }, { force: ['static'] }).map((o) => o.id)).toContain('static');
      expect(rollOffers(new Rng(seed), { orbit: 1 }, { force: ['static'] }).map((o) => o.id)).not.toContain('static');
    }
  });
  it('lists active synergies', () => {
    expect(activeSynergies({ ricochet: 1, gym: 3 }).map((u) => u.id)).toEqual(['ricochet']);
  });
});

describe('combat', () => {
  const ctx = { hpFrac: 1, overdrive: false, comeback: false, mainCharacter: false };
  it('crits multiply damage', () => {
    const s = baseStats();
    s.critChance = 1;
    const r = rollHit(10, s, ctx, new Rng(1));
    expect(r.crit).toBe(true);
    expect(r.amount).toBeCloseTo(10 * s.critMult);
    s.critChance = 0;
    expect(rollHit(10, s, ctx, new Rng(1)).crit).toBe(false);
  });
  it('conditional multipliers', () => {
    expect(conditionalMult({ ...ctx, overdrive: true })).toBeCloseTo(BALANCE.overdrive.damageMult);
    expect(conditionalMult({ ...ctx, comeback: true, hpFrac: 0.3 })).toBeCloseTo(BALANCE.synergy.comebackDamage);
    expect(conditionalMult({ ...ctx, comeback: true, hpFrac: 0.9 })).toBe(1);
    expect(conditionalMult({ ...ctx, mainCharacter: true })).toBeCloseTo(BALANCE.synergy.mainCharDamage);
    expect(conditionalMult({ ...ctx, mainCharacter: true, hpFrac: 0.9 })).toBe(1);
  });
  it('incoming damage respects armor and floors at 1', () => {
    const s = baseStats();
    s.damageTaken = 0.5;
    expect(incomingDamage(10, s)).toBe(5);
    expect(incomingDamage(0.2, s)).toBe(1);
  });
});

describe('run summary', () => {
  it('combo multiplier steps and caps', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(25)).toBe(1.25);
    expect(comboMultiplier(10_000)).toBe(BALANCE.combo.maxMult);
  });
  it('grades and titles reflect performance', () => {
    const s = emptyRunStats('npc', false);
    s.time = 20;
    expect(grade(s)).toBe('D');
    expect(runTitle(s).title).toMatch(/Ratio/);
    s.time = 500; s.victory = true; s.damageTaken = 50;
    expect(grade(s)).toBe('S');
    expect(runTitle(s).title).toBe('Untouchable Aura');
  });
  it('final score adds victory bonus only on victory', () => {
    const s = emptyRunStats('npc', false);
    s.score = 1000;
    expect(finalScore(s, 50)).toBe(1000);
    s.victory = true;
    expect(finalScore(s, 50)).toBe(1000 + BALANCE.score.victoryBonus + 50 * BALANCE.score.hpBonusPerPoint);
  });
});
