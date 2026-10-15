// Seeded, reproducible PRNG (xmur3 string hash + sfc32). Every round logs its
// seed so any configuration can be regenerated exactly for debugging.

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  /** True with probability p. */
  chance(p: number): boolean;
  /** Pick an index with probability proportional to weights. */
  weighted(weights: readonly number[]): number;
}

export function createRng(seed: string): Rng {
  const h = xmur3(seed);
  let a = h(), b = h(), c = h(), d = h();
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  // Warm up so similar seeds diverge immediately.
  for (let i = 0; i < 12; i++) next();
  const rng: Rng = {
    next,
    int: (n) => Math.floor(next() * n),
    pick: (items) => {
      if (items.length === 0) throw new Error('pick() on empty list');
      return items[Math.floor(next() * items.length)];
    },
    shuffle: (items) => {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    chance: (p) => next() < p,
    weighted: (weights) => {
      const total = weights.reduce((s, w) => s + w, 0);
      let r = next() * total;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r < 0) return i;
      }
      return weights.length - 1;
    },
  };
  return rng;
}

/** Random seed for production rounds (not cryptographic; only for content variety). */
export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
