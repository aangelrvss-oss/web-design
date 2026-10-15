import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { WaveDirector, buildSchedule } from '../src/logic/waves';
import { BALANCE } from '../src/config/balance';
import { defaultSave, loadSave, sanitizeSave, writeSave, SAVE_KEY } from '../src/core/save';
import { dailySpec, localDateKey, msUntilNextDaily } from '../src/logic/daily';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { CHARACTERS } from '../src/data/characters';
import { emptyRunStats } from '../src/logic/runStats';

class MemStore {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

describe('wave director', () => {
  it('is deterministic for a seed', () => {
    const run = (seed: number) => {
      const d = new WaveDirector(new Rng(seed));
      const log: string[] = [];
      for (let i = 0; i < 60 * 120; i++) for (const e of d.update(1 / 60, 30, false)) log.push(JSON.stringify(e));
      return log;
    };
    expect(run(7)).toEqual(run(7));
    expect(run(7)).not.toEqual(run(8));
  });
  it('never exceeds the population cap with regular spawns', () => {
    const d = new WaveDirector(new Rng(3), { hardCap: 100 });
    let alive = 0;
    for (let i = 0; i < 60 * 480; i++) {
      for (const e of d.update(1 / 60, alive, false)) if (e.kind === 'spawn' && !e.elite && e.formation === 'cluster') alive += e.count;
      expect(alive).toBeLessThanOrEqual(100);
      alive = Math.max(0, alive - (i % 7 === 0 ? 1 : 0)); // the player kills some
    }
  });
  it('brings the mid boss and holds the final boss while a boss is alive', () => {
    const d = new WaveDirector(new Rng(1));
    const bosses: string[] = [];
    let bossAlive = false;
    for (let t = 0; t < 60 * 700; t++) {
      for (const e of d.update(1 / 60, 50, bossAlive)) if (e.kind === 'boss') { bosses.push(`${e.id}@${Math.round(d.time)}`); bossAlive = true; }
      if (bossAlive && d.time > 330 && bosses.length === 1) bossAlive = false; // mid boss dies at 5:30
    }
    expect(bosses[0]).toBe(`doomscroller@${BALANCE.run.midBossAt}`);
    expect(bosses[1]).toBe(`algorithm@${BALANCE.run.finalBossAt}`);
  });
  it('introduces enemy types over time (mechanics escalate, not just numbers)', () => {
    const d = new WaveDirector(new Rng(5));
    const firstSeen: Record<string, number> = {};
    for (let i = 0; i < 60 * 230; i++) for (const e of d.update(1 / 60, 0, false)) if (e.kind === 'spawn' && !e.elite) firstSeen[e.enemy] ??= d.time;
    expect(firstSeen.smoothbrain).toBeLessThan(2);
    expect(firstSeen.speedrunner).toBeGreaterThanOrEqual(40);
    expect(firstSeen.unit).toBeGreaterThanOrEqual(175);
  });
  it('scales enemy hp up over time', () => {
    const d = new WaveDirector(new Rng(1));
    const h0 = d.hpMult();
    d.update(240, 0, false);
    expect(d.hpMult()).toBeGreaterThan(h0 * 1.4);
  });
  it('schedule is sorted', () => {
    const s = buildSchedule();
    for (let i = 1; i < s.length; i++) expect(s[i].at).toBeGreaterThanOrEqual(s[i - 1].at);
  });
});

describe('persistence', () => {
  it('round-trips through storage', () => {
    const store = new MemStore();
    const d = defaultSave();
    d.records.bestScore = 1234;
    d.achievements.push('firstrun');
    d.settings.music = 0.2;
    expect(writeSave(d, store)).toBe(true);
    const back = loadSave(store);
    expect(back.records.bestScore).toBe(1234);
    expect(back.achievements).toEqual(['firstrun']);
    expect(back.settings.music).toBe(0.2);
  });
  it('survives corrupt or hostile data', () => {
    const store = new MemStore();
    store.setItem(SAVE_KEY, '{not json');
    expect(loadSave(store).records.bestScore).toBe(0);
    const s = sanitizeSave({ settings: { master: 9, intensity: 'ultra', aim: 5 }, records: { bestScore: 'lots', runs: -3 }, achievements: ['a', 1, 'a'], daily: { 'x': 5, '2026-01-02': 10 } });
    expect(s.settings.master).toBe(1);
    expect(s.settings.intensity).toBe('high');
    expect(s.records.bestScore).toBe(0);
    expect(s.records.runs).toBe(0);
    expect(s.achievements).toEqual(['a']);
    expect(s.daily).toEqual({ '2026-01-02': 10 });
  });
  it('null storage falls back to defaults without throwing', () => {
    expect(loadSave(null).v).toBe(1);
    expect(writeSave(defaultSave(), null)).toBe(false);
    const throwing = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); } };
    expect(loadSave(throwing).v).toBe(1);
    expect(writeSave(defaultSave(), throwing)).toBe(false);
  });
});

describe('daily challenge', () => {
  it('uses the local date and is stable for a day', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localDateKey(new Date(2026, 0, 6, 0, 0))).toBe('2026-01-06');
    expect(dailySpec('2026-01-05')).toEqual(dailySpec('2026-01-05'));
    expect(dailySpec('2026-01-05').seed).not.toBe(dailySpec('2026-01-06').seed);
  });
  it('counts down to local midnight', () => {
    expect(msUntilNextDaily(new Date(2026, 0, 5, 23, 59, 0))).toBe(60_000);
  });
  it('varies character and modifier across days', () => {
    const chars = new Set<string>(), mods = new Set<string>();
    for (let d = 1; d <= 28; d++) { const s = dailySpec(`2026-02-${String(d).padStart(2, '0')}`); chars.add(s.character); mods.add(s.modifier.id); }
    expect(chars.size).toBeGreaterThan(2);
    expect(mods.size).toBeGreaterThan(2);
  });
});

describe('achievements and unlocks', () => {
  it('every character unlock refers to an existing achievement', () => {
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    for (const c of CHARACTERS) if (c.unlock) expect(ids.has(c.unlock.achievement)).toBe(true);
  });
  it('checks evaluate from run stats', () => {
    const s = emptyRunStats('npc', false);
    s.time = 200;
    const a = (id: string) => ACHIEVEMENTS.find((x) => x.id === id)!;
    expect(a('survive3').check(s, { totalKills: 0, runs: 1 })).toBe(true);
    expect(a('victory').check(s, { totalKills: 0, runs: 1 })).toBe(false);
    expect(a('kills5000').check(s, { totalKills: 5000, runs: 9 })).toBe(true);
  });
});
