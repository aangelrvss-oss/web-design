// The balance simulator must be reproducible and must compare like with like: a variant round is
// the base round (same night, roles and declarations) plus extra information, and nothing in it
// reaches the engine or a normal game.
import { describe, expect, it } from 'vitest';
import { playRound, type Variant } from '../scripts/sim/core';

const SIZES = [4, 5, 6, 10];
const VARIANTS: Variant[] = ['informante-oculto', 'informante-publico', 'informante-farol', 'chivatazo-libre', 'chivatazo-verificado'];

describe('balance simulator', () => {
  it('gives the same result for the same seed', () => {
    for (const n of SIZES) {
      const a = playRound({ n, seed: `rep-${n}`, strategy: 'esquiva' });
      const b = playRound({ n, seed: `rep-${n}`, strategy: 'esquiva' });
      expect(a).toEqual(b);
    }
  });

  it('plays every size and strategy to a valid result without blocking', () => {
    for (const n of [4, 5, 6, 7, 8, 9, 10]) {
      for (const strategy of ['minimo', 'esquiva', 'total'] as const) {
        for (let i = 0; i < 15; i++) {
          const r = playRound({ n, seed: `ok-${i}`, strategy, encargos: i % 2 === 0 });
          expect(r.invalid).toBe(false);
          expect(r.roleCount.culpable).toBe(1);
          expect(r.roleCount.complice).toBe(n >= 6 ? 1 : 0);
        }
      }
    }
  });

  it('keeps the base round under a variant: same night, roles and declarations', () => {
    for (const n of SIZES) {
      for (let i = 0; i < 20; i++) {
        const base = playRound({ n, seed: `pair-${i}`, strategy: 'total' });
        for (const variant of VARIANTS) {
          const v = playRound({ n, seed: `pair-${i}`, strategy: 'total', variant });
          expect([v.compatibleTruth, v.compatibleDeclared, v.hasAccomplice, v.testimonies, v.roleCount]).toEqual([
            base.compatibleTruth,
            base.compatibleDeclared,
            base.hasAccomplice,
            base.testimonies,
            base.roleCount,
          ]);
        }
      }
    }
  });

  it('only lets a verified tip through when it is true, and never against the author’s own side', () => {
    let tips = 0;
    for (const n of SIZES) {
      for (let i = 0; i < 150; i++) {
        const r = playRound({ n, seed: `tip-${i}`, strategy: i % 2 ? 'esquiva' : 'total', variant: 'chivatazo-verificado' });
        if (!r.tip) continue;
        tips++;
        expect(r.tip.true).toBe(true);
        if (r.tip.authorRole !== 'inocente') expect(r.tip.targetIsCulprit).toBe(false);
      }
    }
    expect(tips).toBeGreaterThan(0);
  });

  it('leaves the result alone when secret objectives are on (bots never chase them)', () => {
    for (const n of SIZES) {
      for (let i = 0; i < 20; i++) {
        const off = playRound({ n, seed: `enc-${i}`, strategy: 'esquiva' });
        const on = playRound({ n, seed: `enc-${i}`, strategy: 'esquiva', encargos: true });
        expect(on.caught).toBe(off.caught);
        expect(on.encargos).toHaveLength(n);
      }
    }
  });
});
