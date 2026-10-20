// One simulated round through the real engine, with scripted bots. Shared by `npm run simulate`
// (the long-standing report) and `npm run balance` (the audit with intervals and experiments).
//
// Bots are NOT humans: they publish only harmless true memories, deduce with a fixed formula
// ("how many lies does 'X is the culprit' need?"), never bluff socially, never read faces and
// never change their mind after the defense. They measure the information structure of a round,
// not how a real table plays.
//
// Experimental variants (Informante, Chivatazo) exist ONLY here, as extra information handed to
// the bots after the engine has dealt the round. The engine, its rules and normal games are not
// touched. With `variant` unset and no ablation, a round consumes the random stream exactly as the
// original simulator did, so `npm run simulate` prints the same numbers as before.

import { SCENARIOS } from '../../src/shared/content/scenarios';
import { createRng } from '../../src/shared/rng';
import { addPlayer, createRoom, declare, point, setReady, startRound, testify, tick, vote, type EngineDeps } from '../../src/shared/engine/game';
import { testimonyMatches } from '../../src/shared/engine/encargos';
import { validateSetup } from '../../src/shared/content/validate';
import type { EncargoKind, PlayerId, Role, ScoreReason } from '../../src/shared/types';

export type CulpritStrategy = 'minimo' | 'esquiva' | 'total';

/**
 * Experimental information, simulated outside the engine.
 *  - informante-oculto: one innocent privately knows another innocent is innocent and only uses it
 *    for their own vote.
 *  - informante-publico: the informant says it out loud and the table believes it.
 *  - informante-farol: the informant says it, the culprit also claims to be the informant, and the
 *    table, unable to tell them apart, ignores both claims (only the real informant still uses it).
 *  - chivatazo-libre: after evidence 2, a random participant accuses someone of lying at an hour of
 *    their choice; innocents aim at their honest top suspect, the culprit's side at an innocent.
 *  - chivatazo-verificado: the same, but the server only accepts a tip backed by one of the
 *    author's own memories that contradicts the target's sealed alibi (true by construction).
 */
export type Variant = 'informante-oculto' | 'informante-publico' | 'informante-farol' | 'chivatazo-libre' | 'chivatazo-verificado';

export interface RoundOptions {
  n: number;
  seed: string;
  strategy: CulpritStrategy;
  noise?: number;
  /** Every bot breaks ties on its own instead of sharing the table's hunch. */
  independent?: boolean;
  encargos?: boolean;
  /** Information ablations: what the round is worth without testimonies or evidence. */
  noTestimonies?: boolean;
  noTraces?: boolean;
  variant?: Variant;
  /** How much a tip lowers the "lies needed" cost of its target for the bots who believe it. */
  tipWeight?: number;
}

export interface RoundResult {
  caught: boolean;
  logicCandidates: number;
  runoff: boolean;
  nobodyAccused: boolean;
  accompliceAccused: boolean;
  hasAccomplice: boolean;
  defenseHeld: boolean;
  defenseTie: boolean;
  defenderIsCulprit: boolean;
  compatibleTruth: number;
  compatibleDeclared: number;
  invalid: boolean;
  /** Points this round, by role (summed over the players of that role). */
  points: Record<Role, number>;
  /** How many players had each role. */
  roleCount: Record<Role, number>;
  /** Scoring reasons awarded, counted. */
  reasons: Partial<Record<ScoreReason, number>>;
  /** Objectives: [kind, role, done]. */
  encargos: [EncargoKind, Role, boolean][];
  testimonies: number;
  /** Innocents whose first-round vote named the culprit. */
  correctInnocentVotes: number;
  innocents: number;
  /** Variant bookkeeping. */
  tip: { authorRole: Role; true: boolean; targetIsCulprit: boolean; verified: boolean } | null;
  tipOffered: boolean;
  /** Suspects left for an innocent viewer (participants minus self minus cleared). */
  informantCleared: boolean;
}

let idc = 0;
const deps: EngineDeps = {
  scenarios: SCENARIOS,
  makeId: () => `p${idc++}`,
  makeToken: () => 'x',
  makeSeed: () => 'unused',
};

export function playRound(o: RoundOptions): RoundResult {
  const { n, seed, strategy } = o;
  const noise = o.noise ?? 0.5;
  idc = 0;
  const rng = createRng(`sim|${seed}`);
  // Variants draw from their own stream, so a variant round is the base round plus information.
  const vrng = createRng(`variante|${seed}`);
  const now = 1_000_000;
  const created = createRoom('SIMU', 'Bot 0', now, deps);
  if (!created.ok) throw new Error('create');
  const room = created.room;
  for (let i = 1; i < n; i++) addPlayer(room, `Bot ${i}`, now, deps);
  if (o.encargos) room.settings.encargos = true;
  const host = room.hostId;
  const res = startRound(room, host, now, deps, seed);
  if (!res.ok) throw new Error(res.error);
  const round = room.round!;
  const { setup } = round;
  const ids = round.participants;
  const T = setup.scene.slot;
  const culprit = ids.find((p) => setup.roles[p] === 'culpable')!;
  const accomplice = ids.find((p) => setup.roles[p] === 'complice') ?? null;
  const innocents = ids.filter((p) => setup.roles[p] === 'inocente');
  const evilOf = (p: PlayerId) => p === culprit || p === accomplice;

  // ── Declarations
  for (const p of ids) {
    const zones = setup.truth[p].slice();
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
  const order = rng.shuffle(ids);
  if (!o.noTestimonies) {
    for (const p of order) {
      for (const m of setup.memories[p]) {
        const myDecl = round.declarations[p]!.zones;
        if (myDecl[m.slot] !== m.zone) continue; // would contradict my own alibi
        if (evilOf(p) && m.with === culprit && round.declarations[culprit]!.zones[m.slot] !== m.zone) continue;
        testify(room, p, m.with, m.slot, now);
      }
      if (p === accomplice && round.declarations[accomplice]!.zones[T] === round.declarations[culprit]!.zones[T]) {
        testify(room, p, culprit, T, now);
      }
    }
  }

  // ── Deduction: every voter scores each hypothesis "X is the culprit" by how many lies it
  // needs. Innocent declarations are assumed honest unless the hypothesis requires a liar, in
  // which case that liar must be the (single) accomplice.
  const traces = o.noTraces ? [] : setup.traces;
  const hasAccomplice = !!accomplice;
  const decl = (p: PlayerId) => round.declarations[p]!.zones;
  // Variant information: who each viewer knows is innocent, and suspicion added by a tip.
  const cleared: Record<PlayerId, Set<PlayerId>> = Object.fromEntries(ids.map((p) => [p, new Set<PlayerId>()]));
  const bias: Record<PlayerId, number> = {};
  const cost = (x: PlayerId, viewer: PlayerId): number => {
    if (cleared[viewer].has(x)) return Infinity;
    let c = -(bias[x] ?? 0);
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
      const pool = ids.filter((p) => (p !== x && p !== viewer) || (p === viewer && setup.roles[viewer] !== 'inocente' && p !== x));
      const feasible = pool.some((a) => needAccomplice.every((set) => set.includes(a)));
      if (!feasible) return Infinity;
      // …while each extra lie we must pin on an accomplice is a stretch.
      c += 1 + 0.5 * (needAccomplice.length - 1);
    }
    return c;
  };

  // ── Informante: one innocent learns that another innocent is innocent.
  let informantCleared = false;
  if (o.variant?.startsWith('informante') && innocents.length >= 2) {
    const informant = vrng.pick(innocents);
    const target = vrng.pick(innocents.filter((p) => p !== informant));
    informantCleared = true;
    cleared[informant].add(target);
    if (o.variant === 'informante-publico') for (const p of innocents) if (p !== target) cleared[p].add(target);
    // informante-farol: two contradicting claims, the table believes neither; nothing more is added.
  }

  // ── Chivatazo: one anonymous tip after evidence 2.
  let tip: RoundResult['tip'] = null;
  let tipOffered = false;
  if (o.variant?.startsWith('chivatazo')) {
    tipOffered = true;
    const author = vrng.pick(ids);
    const verified = o.variant === 'chivatazo-verificado';
    let target: PlayerId | null = null;
    let slot = T;
    if (verified) {
      // Only a tip one of the author's own memories proves: "at hour H, X was with me in Z, not
      // where X declared". The culprit's side never exposes the culprit.
      const proofs = setup.memories[author].filter((m) => decl(m.with)[m.slot] !== m.zone && !(evilOf(author) && evilOf(m.with)));
      if (proofs.length) {
        const m = vrng.pick(proofs);
        target = m.with;
        slot = m.slot;
      }
    } else if (evilOf(author)) {
      // The culprit's side frames the innocent the table already likes least.
      const pool = innocents.slice().sort((a, b) => cost(a, author) - cost(b, author));
      target = pool[0] ?? null;
    } else {
      // An honest author accuses their own top suspect (they can't know; they guess).
      const pool = ids.filter((p) => p !== author).sort((a, b) => cost(a, author) - cost(b, author));
      target = pool[0] ?? null;
      // If one of their memories really contradicts someone, they use that instead.
      const proof = setup.memories[author].find((m) => decl(m.with)[m.slot] !== m.zone);
      if (proof) {
        target = proof.with;
        slot = proof.slot;
      }
    }
    if (target) {
      const isTrue = decl(target)[slot] !== setup.truth[target][slot];
      tip = { authorRole: setup.roles[author], true: isTrue, targetIsCulprit: target === culprit, verified };
      // The table reacts to it; a verified tip is a proven lie, so it weighs more.
      bias[target] = (bias[target] ?? 0) + (o.tipWeight ?? 0.5) * (verified ? 2 : 1);
    }
  }

  let logicCandidates = 0;
  // Discussion makes the table share one tie-break ("we all find Marta shifty"), not 6 coin flips.
  const sharedNoise: Record<PlayerId, number> = Object.fromEntries(ids.map((p) => [p, rng.next() * noise]));
  const pick: Record<PlayerId, PlayerId> = {};
  for (const voter of ids) {
    const evil = evilOf(voter);
    const options = ids.filter((p) => p !== voter && !(evil && evilOf(p)));
    const scored = options.map((p) => ({ p, c: cost(p, voter) + (o.independent ? rng.next() * 2 : sharedNoise[p]) }));
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
      const evil = evilOf(voter);
      const options = cands.filter((p) => p !== voter && !(evil && evilOf(p)));
      const choice = options.length ? options[Math.floor(rng.next() * options.length)] : cands.find((c) => c !== voter)!;
      vote(room, voter, choice, now);
    }
  }
  if ((room.phase as string) !== 'result') throw new Error(`expected result, got ${room.phase}`);
  const outcome = round.outcome!;
  const both = (zones: string[]) => setup.traces.every((t) => zones[t.slot] === t.zone);

  const points: Record<Role, number> = { inocente: 0, culpable: 0, complice: 0 };
  const roleCount: Record<Role, number> = { inocente: 0, culpable: 0, complice: 0 };
  const reasons: Partial<Record<ScoreReason, number>> = {};
  for (const p of ids) {
    const role = setup.roles[p];
    roleCount[role]++;
    for (const line of outcome.score[p]) {
      points[role] += line.points;
      reasons[line.reason] = (reasons[line.reason] ?? 0) + 1;
    }
  }
  const encargos: RoundResult['encargos'] = setup.encargos
    ? ids.map((p) => [setup.encargos![p].kind, setup.roles[p], !!outcome.encargoDone?.[p]])
    : [];

  return {
    caught: outcome.culpritCaught,
    logicCandidates,
    runoff: !!round.runoff,
    nobodyAccused: outcome.accused === null,
    accompliceAccused: !!accomplice && outcome.accused === accomplice,
    hasAccomplice: !!accomplice,
    defenseHeld: defense.reason === 'senalado' || defense.reason === 'sorteo',
    defenseTie: defense.reason === 'sorteo',
    defenderIsCulprit: defense.defender === culprit,
    compatibleTruth: ids.filter((p) => both(setup.truth[p])).length,
    compatibleDeclared: ids.filter((p) => both(round.declarations[p]!.zones)).length,
    invalid: validateSetup(setup, ids).length > 0,
    points,
    roleCount,
    reasons,
    encargos,
    testimonies: round.testimonies.length,
    correctInnocentVotes: innocents.filter((p) => round.votes[p] === culprit).length,
    innocents: innocents.length,
    tip,
    tipOffered,
    informantCleared,
  };
}
