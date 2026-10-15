/**
 * Central balance sheet. Every number a designer would want to tune lives here (or in the
 * data tables under src/data). Values are reasoned first-pass tuning, refined by the
 * pacing simulation in tests/pacing.test.ts and by observed play — not by large play data.
 */
export const BALANCE = {
  arena: { width: 2600, height: 2600, wallPush: 900 },

  run: {
    /** Seconds at which the bosses arrive. Killing the final boss wins the run. */
    midBossAt: 240,
    finalBossAt: 480,
    rerollsPerRun: 2,
    weaponSlots: 4,
  },

  player: {
    maxHp: 100,
    moveSpeed: 235,
    accel: 16, // exponential approach rate toward target velocity
    friction: 12,
    radius: 15,
    hurtInvuln: 0.7,
    pickupRadius: 110,
    critChance: 0.05,
    critMult: 1.75,
    dash: { duration: 0.17, speedMult: 3.3, cooldown: 1.55, invulnExtra: 0.09 },
    contactKnockback: 260,
  },

  overdrive: {
    perKill: 1.1,
    perEliteKill: 12,
    perBossHitFraction: 6, // meter gained per 1% of boss hp dealt
    decayDelay: 3.2,
    decayPerSec: 4,
    hurtPenalty: 14,
    duration: 7,
    fireRateMult: 2,
    damageMult: 1.25,
    moveMult: 1.15,
  },

  combo: { window: 2.6, stepKills: 25, stepMult: 0.25, maxMult: 3 },

  xp: {
    /** XP needed to go from `level` to `level + 1`. */
    base: 5,
    linear: 5,
    curveCoef: 0.85,
    curveExp: 2.2,
    gemCap: 280,
    mergeRadius: 140,
  },

  spawns: {
    /** Desired on-screen population: base + perMin * minutes, bounded by the cap. */
    targetBase: 14,
    targetPerMin: 24,
    rateBase: 1.3, // spawn groups per second at t=0
    ratePerMin: 0.75,
    hardCap: 190,
    hardCapLow: 120, // used on the low visual-intensity tier
    minSpawnDist: 30, // extra margin beyond the visible half-diagonal
    hpScale: { perMin: 0.15, quad: 0.05 },
    dmgScale: { perMin: 0.1 },
    bossTrickle: 0.35, // spawn-rate multiplier while a boss is alive
  },

  drops: {
    grassChance: 0.012, // per normal kill
    vacuumChance: 0.0035,
    grassHealFrac: 0.22,
  },

  score: {
    perSecond: 10,
    midBossKill: 6000,
    finalBossKill: 20000,
    victoryBonus: 25000,
    hpBonusPerPoint: 100,
  },

  synergy: {
    meltdownFrac: 0.45,
    meltdownRadius: 62,
    dominoChance: 0.3,
    dominoBase: 18,
    dominoRadius: 74,
    dominoMaxPerFrame: 14,
    comebackThreshold: 0.4,
    comebackDamage: 1.35,
    comebackHealEvery: 8,
    comebackHeal: 4,
    burnoutDps: 34,
    burnoutLife: 2.4,
    staticChance: 0.22,
    ratiodMinis: 3,
    mainCharDamage: 1.5,
  },
} as const;

export type Balance = typeof BALANCE;
