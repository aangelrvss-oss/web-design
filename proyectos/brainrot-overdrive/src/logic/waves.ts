import { BALANCE } from '../config/balance';
import type { Rng } from '../core/rng';
import type { BossId, EnemyId } from '../data/enemies';

export type Formation = 'cluster' | 'ring' | 'line';

export type DirectorEvent =
  | { kind: 'spawn'; enemy: EnemyId; count: number; elite: boolean; formation: Formation }
  | { kind: 'announce'; line: 'bossWarn' | 'horde' | 'rush' }
  | { kind: 'boss'; id: BossId };

interface Scheduled {
  at: number;
  ev: DirectorEvent;
  /** Hold the event until no boss is alive (bosses never stack). */
  needsNoBoss?: boolean;
}

/** Enemy mix over time: [enemy, from (s), weight at start, weight at 8:00, group min, group max]. */
const MIX: Array<[EnemyId, number, number, number, number, number]> = [
  ['smoothbrain', 0, 10, 5, 2, 5],
  ['speedrunner', 40, 3, 5, 2, 3],
  ['hottake', 85, 2.2, 4, 1, 2],
  ['ratio', 130, 2, 4, 1, 2],
  ['unit', 175, 0.8, 2.2, 1, 1],
];

const ELITE_POOL: EnemyId[] = ['smoothbrain', 'speedrunner', 'hottake', 'ratio', 'unit'];

export function buildSchedule(): Scheduled[] {
  const { midBossAt: mid, finalBossAt: fin } = BALANCE.run;
  const s: Scheduled[] = [
    { at: 85, ev: { kind: 'spawn', enemy: 'smoothbrain', count: 1, elite: true, formation: 'cluster' } },
    { at: 160, ev: { kind: 'spawn', enemy: 'copypasta', count: 1, elite: true, formation: 'cluster' } },
    { at: 205, ev: { kind: 'spawn', enemy: 'speedrunner', count: 1, elite: true, formation: 'cluster' } },
    { at: mid - 8, ev: { kind: 'announce', line: 'bossWarn' } },
    { at: mid, ev: { kind: 'boss', id: 'doomscroller' }, needsNoBoss: true },
    { at: 300, ev: { kind: 'announce', line: 'horde' }, needsNoBoss: true },
    { at: 301, ev: { kind: 'spawn', enemy: 'smoothbrain', count: 26, elite: false, formation: 'ring' }, needsNoBoss: true },
    { at: 330, ev: { kind: 'spawn', enemy: 'hottake', count: 1, elite: true, formation: 'cluster' } },
    { at: 358, ev: { kind: 'announce', line: 'rush' } },
    { at: 360, ev: { kind: 'spawn', enemy: 'speedrunner', count: 14, elite: false, formation: 'line' } },
    { at: 392, ev: { kind: 'spawn', enemy: 'copypasta', count: 1, elite: true, formation: 'cluster' } },
    { at: 395, ev: { kind: 'spawn', enemy: 'unit', count: 1, elite: true, formation: 'cluster' } },
    { at: 420, ev: { kind: 'announce', line: 'horde' } },
    { at: 421, ev: { kind: 'spawn', enemy: 'ratio', count: 22, elite: false, formation: 'ring' } },
    { at: 450, ev: { kind: 'spawn', enemy: 'ratio', count: 1, elite: true, formation: 'cluster' } },
    { at: 452, ev: { kind: 'spawn', enemy: 'smoothbrain', count: 1, elite: true, formation: 'cluster' } },
    { at: fin - 8, ev: { kind: 'announce', line: 'bossWarn' } },
    { at: fin, ev: { kind: 'boss', id: 'algorithm' }, needsNoBoss: true },
  ];
  return s.sort((a, b) => a.at - b.at);
}

export interface DirectorOptions {
  spawnMult?: number;
  hardCap?: number;
  enemyHpMult?: number;
}

/**
 * Decides what arrives and when. Pure logic (no Phaser): the scene feeds it time and
 * population, and it returns events. Population is always bounded by `hardCap`.
 */
export class WaveDirector {
  time = 0;
  private spawnAcc = 0;
  private schedule = buildSchedule();
  private nextRandomElite = 300;
  readonly spawnMult: number;
  readonly hardCap: number;
  private readonly hpMod: number;

  constructor(private readonly rng: Rng, opts: DirectorOptions = {}) {
    this.spawnMult = opts.spawnMult ?? 1;
    this.hardCap = opts.hardCap ?? BALANCE.spawns.hardCap;
    this.hpMod = opts.enemyHpMult ?? 1;
  }

  get minutes(): number {
    return this.time / 60;
  }

  targetPopulation(): number {
    const s = BALANCE.spawns;
    return Math.min(this.hardCap, Math.round((s.targetBase + s.targetPerMin * this.minutes) * this.spawnMult));
  }

  groupsPerSecond(bossAlive: boolean): number {
    const s = BALANCE.spawns;
    return (s.rateBase + s.ratePerMin * this.minutes) * this.spawnMult * (bossAlive ? s.bossTrickle : 1);
  }

  hpMult(): number {
    const h = BALANCE.spawns.hpScale;
    const m = this.minutes;
    return (1 + h.perMin * m + h.quad * m * m) * this.hpMod;
  }

  dmgMult(): number {
    return 1 + BALANCE.spawns.dmgScale.perMin * this.minutes;
  }

  /** Weighted enemy pick for the current time. */
  pickEnemy(): { enemy: EnemyId; count: number } {
    const t = this.time;
    const f = Math.min(1, t / BALANCE.run.finalBossAt);
    const weights = MIX.map(([, from, w0, w1]) => (t >= from ? w0 + (w1 - w0) * f : 0));
    const i = Math.max(0, this.rng.weightedIndex(weights));
    const [enemy, , , , gMin, gMax] = MIX[i];
    const bonus = Math.floor(this.minutes / 3); // groups grow a little over time
    return { enemy, count: this.rng.int(gMin, gMax + (gMax > 1 ? bonus : 0)) };
  }

  update(dt: number, alive: number, bossAlive: boolean): DirectorEvent[] {
    this.time += dt;
    const out: DirectorEvent[] = [];

    for (let i = 0; i < this.schedule.length; i++) {
      const s = this.schedule[i];
      if (s.at > this.time) break;
      if (s.needsNoBoss && bossAlive) continue; // held until the boss is gone
      out.push(s.ev);
      this.schedule.splice(i, 1);
      i--;
    }

    if (this.time >= this.nextRandomElite && !bossAlive) {
      this.nextRandomElite = this.time + this.rng.range(32, 48);
      out.push({ kind: 'spawn', enemy: this.rng.pick(ELITE_POOL), count: 1, elite: true, formation: 'cluster' });
    }

    this.spawnAcc += dt * this.groupsPerSecond(bossAlive);
    const target = this.targetPopulation();
    let budget = Math.max(0, this.hardCap - alive);
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (alive >= target || budget <= 0) continue; // population full: skip this group
      const g = this.pickEnemy();
      const count = Math.min(g.count, budget);
      out.push({ kind: 'spawn', enemy: g.enemy, count, elite: false, formation: 'cluster' });
      alive += count;
      budget -= count;
    }
    return out;
  }

  /** Remaining scheduled events (for tests / debugging). */
  pending(): number {
    return this.schedule.length;
  }
}
