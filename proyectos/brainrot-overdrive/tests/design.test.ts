import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { Rng } from '../src/core/rng';
import { UPGRADES } from '../src/data/upgrades';
import { WEAPON_IDS } from '../src/data/weapons';
import { baseStats } from '../src/logic/stats';
import { rollOffers } from '../src/logic/upgrades';

const src = (() => {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.ts')) files.push(fs.readFileSync(p, 'utf8'));
    }
  };
  walk(path.resolve('src'));
  return files.join('\n');
})();

describe('design guards', () => {
  it('every passive and cursed upgrade changes at least one stat', () => {
    for (const u of UPGRADES.filter((x) => x.kind === 'passive' || x.kind === 'cursed')) {
      const a = baseStats();
      const b = baseStats();
      u.apply!(b, 1);
      expect(JSON.stringify(a), u.id).not.toBe(JSON.stringify(b));
    }
  });

  it('every synergy is wired into gameplay code (not just a card)', () => {
    for (const u of UPGRADES.filter((x) => x.kind === 'synergy')) {
      expect(src.includes(`has('${u.id}')`), `${u.id} is never checked in src/`).toBe(true);
    }
  });

  it('every weapon has a firing implementation', () => {
    for (const id of WEAPON_IDS) {
      const fired = src.includes(`case '${id}':`) || src.includes(`lvl('${id}')`);
      expect(fired, id).toBe(true);
    }
  });

  it('an unlocked synergy shows up in level-up offers often enough to be discovered', () => {
    let seen = 0;
    const N = 600;
    for (let seed = 1; seed <= N; seed++) {
      const offers = rollOffers(new Rng(seed), { orbit: 1, zap: 1, cannon: 1 });
      if (offers.some((o) => o.id === 'static')) seen++;
    }
    expect(seen / N).toBeGreaterThan(0.12);
  });

  it('at least three distinct build directions exist (tag coverage)', () => {
    const tags = new Set(UPGRADES.flatMap((u) => u.tags));
    for (const t of ['projectile', 'area', 'crit', 'tank', 'chain']) expect(tags.has(t as never), t).toBe(true);
    expect(UPGRADES.filter((u) => u.kind === 'synergy').length).toBeGreaterThanOrEqual(5);
  });
});
