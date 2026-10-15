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
  point,
  setReady,
  startRound,
  testify,
  tick,
  vote,
  type EngineDeps,
} from '../src/shared/engine/game';
import { testimonyMatches } from '../src/shared/engine/encargos';
import { validateSetup } from '../src/shared/content/validate';
import { timingsFor } from '../src/shared/types';
import type { PlayerId, RoomState } from '../src/shared/types';

type CulpritStrategy = 'minimo' | 'esquiva' | 'total';

let idc = 0;
const deps: EngineDeps = {
  scenarios: SCENARIOS,
  makeId: () => `p${idc++}`,
  makeToken: () => 'x',
  makeSeed: () => 'unused',
};

function playRound(n: number, seed: string, strategy: CulpritStrategy, noise: number) {
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
  const pick: Record<PlayerId, PlayerId> = {};
  for (const voter of ids) {
    const evil = voter === culprit || voter === accomplice;
    const options = ids.filter((p) => p !== voter && !(evil && (p === culprit || p === accomplice)));
    // INDEPENDENT=1: every bot breaks ties on its own (no table consensus) → more ties.
    const scored = options.map((p) => ({ p, c: cost(p, voter) + (process.env.INDEPENDENT ? rng.next() * 2 : sharedNoise[p]) }));
    scored.sort((a, b) => a.c - b.c);
    if (voter === ids.find((q) => setup.roles[q] === 'inocente')) {
      const best = Math.min(...options.map((p) => cost(p, voter)));
      logicCandidates = options.filter((p) => cost(p, voter) === best).length;
    }
    pick[voter] = scored[0].p;
  }

  // ── Last defense: everyone points at their current top suspect.
  for (const voter of ids) point(room, voter, pick[voter], now);
  for (const p of ids) setReady(room, p, true, now);
  for (const p of ids) setReady(room, p, true, now);
  const phaseAfterInvestigation = room.phase as string;
  if (phaseAfterInvestigation !== 'defense' && phaseAfterInvestigation !== 'vote') throw new Error(`stuck in ${room.phase}`);
  const defense = round.defense!;
  // Bots don't change their minds after a defense (humans may): it ends by timer.
  if (phaseAfterInvestigation === 'defense') tick(room, room.phaseEndsAt!);
  if ((room.phase as string) !== 'vote') throw new Error(`expected vote, got ${room.phase}`);
  for (const voter of ids) vote(room, voter, pick[voter], now);
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
  const both = (zones: string[]) => setup.traces.every((t) => zones[t.slot] === t.zone);
  return {
    caught: round.outcome!.culpritCaught,
    logicCandidates,
    runoff: !!round.runoff,
    nobodyAccused: round.outcome!.accused === null,
    hasAccomplice: !!accomplice,
    defenseHeld: defense.reason === 'senalado' || defense.reason === 'sorteo',
    defenseTie: defense.reason === 'sorteo',
    defenderIsCulprit: defense.defender === culprit,
    compatibleTruth: ids.filter((p) => both(setup.truth[p])).length,
    compatibleDeclared: ids.filter((p) => both(round.declarations[p]!.zones)).length,
    invalid: validateSetup(setup, ids).length > 0,
  };
}

function main() {
  const rounds = Number(process.argv[2] ?? 300);
  const strategies: CulpritStrategy[] = ['minimo', 'esquiva', 'total'];
  const sizes = [4, 5, 6, 7, 8, 10];
  const pct = (a: number, b: number) => `${((100 * a) / b).toFixed(1)}%`.padStart(6);
  console.log(`COARTADA v1.1 — simulación con bots: ${rounds} rondas por celda (${rounds * sizes.length * strategies.length} en total)`);
  console.log(process.env.INDEPENDENT ? 'Modo: cada bot decide por su cuenta (sin consenso de mesa).' : 'Modo: la mesa comparte criterio de desempate (consenso tras hablar).');
  console.log('Bots, no personas: deducen con una fórmula fija, no leen caras ni cambian de idea tras la defensa.\n');
  console.log('jug. | estrategia | grupo gana | culpable escapa | cómplice escapa | desempate | nadie acusado | defensa | sorteo | defiende culpable | compatibles (verdad / declarado) | inválidas');
  const totals: Record<string, { caught: number; n: number }> = {};
  let stuck = 0;
  for (const n of sizes) {
    for (const strategy of strategies) {
      const acc = { caught: 0, runoff: 0, nobody: 0, acc: 0, defense: 0, tie: 0, defCulprit: 0, compT: 0, compD: 0, invalid: 0 };
      for (let i = 0; i < rounds; i++) {
        let r;
        try {
          r = playRound(n, `${n}-${strategy}-${i}`, strategy, 0.5);
        } catch (err) {
          stuck++;
          console.error(`  ronda bloqueada o inválida (${n}, ${strategy}, ${i}): ${(err as Error).message}`);
          continue;
        }
        if (r.caught) acc.caught++;
        if (r.runoff) acc.runoff++;
        if (r.nobodyAccused) acc.nobody++;
        if (r.hasAccomplice && !r.caught) acc.acc++;
        if (r.defenseHeld) acc.defense++;
        if (r.defenseTie) acc.tie++;
        if (r.defenderIsCulprit) acc.defCulprit++;
        acc.compT += r.compatibleTruth;
        acc.compD += r.compatibleDeclared;
        if (r.invalid) acc.invalid++;
      }
      (totals[strategy] ??= { caught: 0, n: 0 }).caught += acc.caught;
      totals[strategy].n += rounds;
      const accEsc = n >= 6 ? pct(acc.acc, rounds) : '   n/a';
      console.log(
        `${String(n).padStart(4)} | ${strategy.padEnd(10)} | ${pct(acc.caught, rounds).padStart(10)} | ${pct(rounds - acc.caught, rounds).padStart(15)} | ${accEsc.padStart(15)} | ${pct(acc.runoff, rounds).padStart(9)} | ${pct(acc.nobody, rounds).padStart(13)} | ${pct(acc.defense, rounds).padStart(7)} | ${pct(acc.tie, rounds).padStart(6)} | ${pct(acc.defCulprit, rounds).padStart(17)} | ${(acc.compT / rounds).toFixed(2).padStart(14)} / ${(acc.compD / rounds).toFixed(2).padStart(4)}     | ${String(acc.invalid).padStart(9)}`,
      );
    }
  }
  console.log('\nMedia del grupo por estrategia del culpable:');
  for (const [k, v] of Object.entries(totals)) console.log(`  ${k}: el grupo gana ${((100 * v.caught) / v.n).toFixed(1)}%`);
  console.log(`\nRondas bloqueadas o con estado inválido: ${stuck}`);
  console.log('\nDuración máxima por ronda con los temporizadores (sin veredicto ni desempate), ritmo normal:');
  for (const n of sizes) {
    const t = timingsFor('normal', n);
    const secs = t.declare + t.investigate1 + t.investigate2 + t.defense + t.vote;
    console.log(`  ${n} jugadores: ${(secs / 60).toFixed(1)} min (declaración ${t.declare}s, investigación ${t.investigate1}+${t.investigate2}s, defensa ${t.defense}s, votación ${t.vote}s)`);
  }
}

main();

export type { Rng, RoomState };
