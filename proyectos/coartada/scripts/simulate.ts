// Balance simulator: plays thousands of seeded rounds through the real engine with
// simple scripted bots, and reports how often the group catches the culprit.
//
// Bots are NOT humans: they never read faces, never bluff socially and use a fixed
// suspicion formula. The numbers show whether the information structure is sane
// (neither trivially solvable nor hopeless), not how a real table will play.
//
//   npm run simulate              # default 300 rounds per configuration
//   npm run simulate -- 1000      # more rounds

import { SCENARIOS } from '../src/shared/content/scenarios';
import { createRng, type Rng } from '../src/shared/rng';
import {
  addPlayer,
  createRoom,
  declare,
  setReady,
  startRound,
  testify,
  vote,
  type EngineDeps,
} from '../src/shared/engine/game';
import { testimonyMatches } from '../src/shared/engine/encargos';
import type { PlayerId, RoomState } from '../src/shared/types';

type CulpritStrategy = 'minimo' | 'esquiva' | 'total';

let idc = 0;
const deps: EngineDeps = {
  scenarios: SCENARIOS,
  makeId: () => `p${idc++}`,
  makeToken: () => 'x',
  makeSeed: () => 'unused',
};

function playRound(n: number, seed: string, strategy: CulpritStrategy, noise: number): { caught: boolean; logicCandidates: number } {
  idc = 0;
  const rng = createRng(`sim|${seed}`);
  const now = 1_000_000;
  const created = createRoom('SIMU', 'Bot 0', now, deps);
  if (!created.ok) throw new Error('create');
  const room = created.room;
  for (let i = 1; i < n; i++) addPlayer(room, `Bot ${i}`, now, deps);
  const host = room.hostId;
  const res = startRound(room, host, now, deps, seed);
  if (!res.ok) throw new Error(res.error);
  const round = room.round!;
  const { setup } = round;
  const ids = round.participants;
  const T = setup.scene.slot;
  const culprit = ids.find((p) => setup.roles[p] === 'culpable')!;
  const accomplice = ids.find((p) => setup.roles[p] === 'complice') ?? null;

  // ── Declarations
  for (const p of ids) {
    let zones = setup.truth[p].slice();
    if (p === culprit) {
      const nonScene = setup.zones.filter((z) => z !== setup.scene.zone);
      zones[T] = rng.pick(nonScene);
      const others = [0, 1, 2].filter((s) => s !== T);
      if (strategy === 'esquiva') {
        const s = rng.pick(others);
        zones[s] = rng.pick(setup.zones.filter((z) => z !== setup.truth[p][s]));
      } else if (strategy === 'total') {
        for (const s of others) zones[s] = rng.pick(setup.zones.filter((z) => z !== setup.truth[p][s]));
      }
    }
    declare(room, p, zones, true, now);
  }
  if (room.phase !== 'investigate') throw new Error('expected investigate');

  // ── Testimonies: everyone publishes true memories that don't hurt their side.
  for (const p of rng.shuffle(ids)) {
    for (const m of setup.memories[p]) {
      const myDecl = round.declarations[p]!.zones;
      if (myDecl[m.slot] !== m.zone) continue; // would contradict my own alibi
      const evil = p === culprit || p === accomplice;
      if (evil && m.with === culprit && round.declarations[culprit]!.zones[m.slot] !== m.zone) continue;
      testify(room, p, m.with, m.slot, now);
    }
    if (p === accomplice && round.declarations[accomplice]!.zones[T] === round.declarations[culprit]!.zones[T]) {
      testify(room, p, culprit, T, now);
    }
  }
  for (const p of ids) setReady(room, p, true, now);
  for (const p of ids) setReady(room, p, true, now);
  if ((room.phase as string) !== 'vote') throw new Error(`expected vote, got ${room.phase}`);

  // ── Deduction: every voter scores each hypothesis "X is the culprit" by how many lies
  // it needs. Innocent declarations are assumed honest unless the hypothesis requires a
  // liar, in which case that liar must be the (single) accomplice.
  const traces = setup.traces;
  const hasAccomplice = !!accomplice;
  const decl = (p: PlayerId) => round.declarations[p]!.zones;
  const cost = (x: PlayerId, viewer: PlayerId): number => {
    let c = 0;
    // A culprit is expected to lie, so their own mismatches are cheap…
    for (const t of traces) if (decl(x)[t.slot] !== t.zone) c += 0.5;
    const needAccomplice: PlayerId[][] = [];
    for (const t of round.testimonies) {
      const match = testimonyMatches(round, t);
      if (t.by === x) continue; // the culprit may say anything
      // An honest speaker really was in t.zone at t.slot with t.subject.
      if (t.subject === x) {
        if (t.slot === T) needAccomplice.push([t.by]); // nobody was with the culprit at the crime
        const tr = traces.find((q) => q.slot === t.slot);
        if (tr && tr.zone !== t.zone) needAccomplice.push([t.by]);
      } else if (!match) {
        needAccomplice.push([t.by, t.subject]);
      }
    }
    // The viewer's own memories are certain.
    if (setup.roles[viewer] === 'inocente') {
      for (const m of setup.memories[viewer]) {
        if (m.with !== x) continue;
        if (m.slot === T) return Infinity;
        const tr = traces.find((q) => q.slot === m.slot);
        if (tr && tr.zone !== m.zone) return Infinity;
      }
    }
    if (needAccomplice.length > 0) {
      if (!hasAccomplice) return Infinity;
      const pool = ids.filter((p) => p !== x && p !== viewer || (p === viewer && setup.roles[viewer] !== 'inocente' && p !== x));
      const feasible = pool.some((a) => needAccomplice.every((set) => set.includes(a)));
      if (!feasible) return Infinity;
      // …while each extra lie we must pin on an accomplice is a stretch.
      c += 1 + 0.5 * (needAccomplice.length - 1);
    }
    return c;
  };

  let logicCandidates = 0;
  // Discussion makes the table share one tie-break ("we all find Marta shifty"), not 6 coin flips.
  const sharedNoise: Record<PlayerId, number> = Object.fromEntries(ids.map((p) => [p, rng.next() * noise]));
  for (const voter of ids) {
    const evil = voter === culprit || voter === accomplice;
    const options = ids.filter((p) => p !== voter && !(evil && (p === culprit || p === accomplice)));
    const scored = options.map((p) => ({ p, c: cost(p, voter) + sharedNoise[p] }));
    scored.sort((a, b) => a.c - b.c);
    if (voter === ids.find((q) => setup.roles[q] === 'inocente')) {
      const best = Math.min(...options.map((p) => cost(p, voter)));
      logicCandidates = options.filter((p) => cost(p, voter) === best).length;
    }
    vote(room, voter, scored[0].p, now);
  }
  if ((room.phase as string) === 'runoff') {
    const cands = round.runoff!.candidates;
    for (const voter of ids) {
      const evil = voter === culprit || voter === accomplice;
      const options = cands.filter((p) => p !== voter && !(evil && (p === culprit || p === accomplice)));
      const pick = options.length ? options[Math.floor(rng.next() * options.length)] : cands.find((c) => c !== voter)!;
      vote(room, voter, pick, now);
    }
  }
  if ((room.phase as string) !== 'result') throw new Error(`expected result, got ${room.phase}`);
  return { caught: round.outcome!.culpritCaught, logicCandidates };
}

function main() {
  const rounds = Number(process.argv[2] ?? 300);
  const strategies: CulpritStrategy[] = ['minimo', 'esquiva', 'total'];
  console.log(`COARTADA balance simulation — ${rounds} rounds per cell, scripted bots (not humans)\n`);
  console.log('players | culprit strategy | group catches culprit | avg tied top suspects');
  const summary: Record<string, number[]> = {};
  for (let n = 4; n <= 10; n++) {
    for (const strategy of strategies) {
      let caught = 0;
      let cands = 0;
      for (let i = 0; i < rounds; i++) {
        const r = playRound(n, `${n}-${strategy}-${i}`, strategy, 0.5);
        if (r.caught) caught++;
        cands += r.logicCandidates;
      }
      const pct = (100 * caught) / rounds;
      (summary[strategy] ??= []).push(pct);
      console.log(`${String(n).padStart(7)} | ${strategy.padEnd(16)} | ${pct.toFixed(1).padStart(20)}% | ${(cands / rounds).toFixed(2)}`);
    }
  }
  console.log('\nMean catch rate by strategy:');
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)}%`);
}

main();

export type { Rng, RoomState };
