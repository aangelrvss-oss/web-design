// Fase 6 · experimento aislado: una ronda con el motor real y los bots v2 (modelo.ts).
//
// La ronda base (noche, papeles, declaraciones, testimonios y las dos pruebas) se juega UNA vez y
// consume el azar exactamente igual que scripts/sim/core.ts: con la misma semilla, las declaraciones
// y los testimonios son los mismos que en el simulador de la fase 5, y la comparación v1/v2 es
// ronda a ronda. Después, cada «celda» (variante + estrategias) se resuelve sobre una copia del
// estado: señalar, defensa, votación, desempate y puntos los decide el motor real.
//
// La variante solo existe aquí: el informante, su dato y las afirmaciones se sortean con un flujo
// de azar propio (`informante|{semilla}`) y se entregan a los bots; el motor no sabe nada de ellos.

import { SCENARIOS } from '../../../src/shared/content/scenarios';
import { createRng } from '../../../src/shared/rng';
import { addPlayer, createRoom, declare, point, setReady, startRound, testify, tick, vote, type EngineDeps } from '../../../src/shared/engine/game';
import { privateView, publicView } from '../../../src/shared/engine/views';
import type { Outcome, PlayerId, Role, RoomState } from '../../../src/shared/types';
import type { CulpritStrategy } from '../../sim/core';
import {
  DEFAULT_WEIGHTS,
  baseTable,
  claimCost,
  knowledgeFrom,
  suspicion,
  type BaseTable,
  type Claim,
  type Datum,
  type Knowledge,
  type PrivateInfo,
  type Trust,
  type VariantRules,
  type Weights,
} from './modelo';

export interface PrepareOptions {
  n: number;
  seed: string;
  strategy: CulpritStrategy;
  noise?: number;
  noTraces?: boolean;
  noTestimonies?: boolean;
  encargos?: boolean;
  w?: Weights;
}

/** Sorteos de la variante, comunes a todas las celdas de una ronda (comparaciones emparejadas). */
export interface Draws {
  exists: boolean;
  informant: PlayerId;
  targetInocente: PlayerId;
  targetNoCulpable: PlayerId;
  targetCualquiera: PlayerId;
  hour: number;
  trustMix: Record<PlayerId, Trust>;
}

export interface Prepared {
  o: PrepareOptions;
  room: RoomState;
  ids: PlayerId[];
  culprit: PlayerId;
  accomplice: PlayerId | null;
  innocents: PlayerId[];
  roles: Record<PlayerId, Role>;
  noise: Record<PlayerId, number>;
  /** Tablas de deducción con toda la información (las dos pruebas y los testimonios). */
  table: Map<PlayerId | null, BaseTable>;
  /** Lo mismo al empezar la investigación: declaraciones y la prueba 1, sin testimonios. */
  early: Map<PlayerId | null, BaseTable>;
  knowledge: Map<PlayerId | null, Knowledge>;
  draws: Draws;
  /** Verdad de la noche: solo la usa el «servidor» de la variante para escribir el dato real. */
  truth: Record<PlayerId, string[]>;
  zones: string[];
  decoys: PlayerId[];
  testimonies: number;
}

let idc = 0;
const deps: EngineDeps = { scenarios: SCENARIOS, makeId: () => `p${idc++}`, makeToken: () => 'x', makeSeed: () => 'unused' };
const NOW = 1_000_000;

export function prepare(o: PrepareOptions): Prepared {
  const { n, seed, strategy } = o;
  const noise = o.noise ?? 0.5;
  const w = o.w ?? DEFAULT_WEIGHTS;
  idc = 0;
  const rng = createRng(`sim|${seed}`);
  const created = createRoom('SIMU', 'Bot 0', NOW, deps);
  if (!created.ok) throw new Error('create');
  const room = created.room;
  for (let i = 1; i < n; i++) addPlayer(room, `Bot ${i}`, NOW, deps);
  if (o.encargos) room.settings.encargos = true;
  const res = startRound(room, room.hostId, NOW, deps, seed);
  if (!res.ok) throw new Error(res.error);
  const round = room.round!;
  const { setup } = round;
  const ids = round.participants.slice();
  const T = setup.scene.slot;
  const roles = { ...setup.roles };
  const culprit = ids.find((p) => roles[p] === 'culpable')!;
  const accomplice = ids.find((p) => roles[p] === 'complice') ?? null;
  const innocents = ids.filter((p) => roles[p] === 'inocente');
  const evilOf = (p: PlayerId) => p === culprit || p === accomplice;

  // ── Declaraciones: idénticas a scripts/sim/core.ts (mismo flujo de azar, mismas llamadas).
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
    declare(room, p, zones, true, NOW);
  }
  if (room.phase !== 'investigate') throw new Error('expected investigate');
  const knowAt = (viewer: PlayerId | null) =>
    knowledgeFrom(publicView(room, SCENARIOS), viewer ? privateView(room, viewer) : null, { noTraces: o.noTraces });
  const viewers: (PlayerId | null)[] = [null, ...innocents];
  const early = new Map(viewers.map((v) => [v, baseTable(knowAt(v), w)]));

  // ── Testimonios: idénticos a scripts/sim/core.ts.
  const order = rng.shuffle(ids);
  if (!o.noTestimonies) {
    for (const p of order) {
      for (const m of setup.memories[p]) {
        const myDecl = round.declarations[p]!.zones;
        if (myDecl[m.slot] !== m.zone) continue;
        if (evilOf(p) && m.with === culprit && round.declarations[culprit]!.zones[m.slot] !== m.zone) continue;
        testify(room, p, m.with, m.slot, NOW);
      }
      if (p === accomplice && round.declarations[accomplice]!.zones[T] === round.declarations[culprit]!.zones[T]) {
        testify(room, p, culprit, T, NOW);
      }
    }
  }
  // Segunda parte de la investigación: sale la prueba 2.
  for (const p of ids) setReady(room, p, true, NOW);
  if (room.phase !== 'investigate' || round.tracesRevealed !== 2) throw new Error('expected investigation part 2');

  // Desempate común de mesa: los mismos sorteos que scripts/sim/core.ts.
  const sharedNoise: Record<PlayerId, number> = Object.fromEntries(ids.map((p) => [p, rng.next() * noise]));

  const knowledge = new Map(viewers.map((v) => [v, knowAt(v)]));
  const table = new Map(viewers.map((v) => [v, baseTable(knowledge.get(v)!, w)]));

  // ── Sorteos de la variante, con su propio flujo: no tocan la ronda base.
  const vrng = createRng(`informante|${seed}`);
  const exists = vrng.next() < 0.5;
  const informant = vrng.pick(innocents);
  const targetInocente = vrng.pick(innocents.filter((p) => p !== informant));
  const targetNoCulpable = vrng.pick(ids.filter((p) => p !== informant && p !== culprit));
  const targetCualquiera = vrng.pick(ids.filter((p) => p !== informant));
  const hour = vrng.pick([0, 1, 2].filter((s) => s !== T));
  const kinds: Trust[] = ['logica', 'credula', 'esceptica'];
  const trustMix = Object.fromEntries(innocents.map((p) => [p, kinds[vrng.int(3)]]));

  return {
    o,
    room: structuredClone(room),
    ids,
    culprit,
    accomplice,
    innocents,
    roles,
    noise: sharedNoise,
    table,
    early,
    knowledge,
    draws: { exists, informant, targetInocente, targetNoCulpable, targetCualquiera, hour, trustMix },
    truth: structuredClone(setup.truth),
    zones: setup.zones.slice(),
    decoys: setup.decoys.slice(),
    testimonies: round.testimonies.length,
  };
}

// ───────────────────────────── celdas ─────────────────────────────

export type InformantPolicy = 'revela' | 'reacciona' | 'calla';
export type EvilPolicy = 'nunca' | 'reactivo' | 'preventivo' | 'encubre';

export interface Cell {
  rules?: VariantRules;
  informant?: InformantPolicy;
  evil?: EvilPolicy;
  trust?: Trust | 'mixta';
  w?: Weights;
}

export interface CellResult {
  caught: boolean;
  accused: PlayerId | null;
  accusedRole: Role | null;
  runoff: boolean;
  points: Record<Role, number>;
  roleCount: Record<Role, number>;
  votes: Record<PlayerId, PlayerId>;
  outcome: Outcome;
  correctInnocentVotes: number;
  innocents: number;
  /** Variante. */
  informantExists: boolean;
  realClaimed: boolean;
  fakeClaims: number;
  claims: Claim[];
  informantAccused: boolean;
  fakeClaimerAccused: boolean;
  /** Personas que siguen siendo posibles culpables, de media por inocente que no es el informante. */
  earlyFeasible: number;
  finalFeasible: number;
  /** Tamaño del grupo de favoritos empatados (antes del desempate de mesa). */
  finalTop: number;
  /** Proporción de esos inocentes cuyo único favorito es la persona culpable. */
  culpritSoleFavourite: number;
}

const argmin = (scores: Map<PlayerId, number>, noise: Record<PlayerId, number>, among: PlayerId[]): PlayerId | null => {
  let best: PlayerId | null = null;
  let bv = Infinity;
  for (const p of among) {
    const s = scores.get(p);
    if (s === undefined || s === Infinity) continue;
    const v = s + noise[p];
    if (v < bv) {
      bv = v;
      best = p;
    }
  }
  return best;
};

export function resolveCell(p: Prepared, cell: Cell = {}): CellResult {
  const { ids, culprit, accomplice, innocents, roles, draws } = p;
  const evil = (x: PlayerId) => x === culprit || x === accomplice;
  const w = cell.w ?? p.o.w ?? DEFAULT_WEIGHTS;
  const rules = cell.rules;
  const claims: Claim[] = [];
  const privs: Record<PlayerId, PrivateInfo> = Object.fromEntries(ids.map((x) => [x, {}]));
  let informantExists = false;
  let realClaimed = false;
  const pub = p.table.get(null)!;
  const pubScore = suspicion(pub);

  if (rules) {
    informantExists = rules.existence === 'cierta' || draws.exists;
    const I = draws.informant;
    let datum: Datum | null = null;
    if (informantExists) {
      if (rules.info === 'limpia') {
        datum = { target: rules.target === 'no-culpable' ? draws.targetNoCulpable : draws.targetInocente };
      } else {
        const t = draws.targetCualquiera;
        datum = { target: t, hour: draws.hour, zone: p.truth[t][draws.hour] };
      }
      privs[I].informant = datum;
      if (rules.mutual) privs[datum.target].knownInformant = I;
    }
    const traces = p.knowledge.get(null)!.traces;
    const firstTrace = traces[0];
    // Inocentes ordenados por lo que sospecha la mesa (la información pública, sin afirmaciones);
    // los que la lógica pública ya descarta van al final.
    const byPublic = innocents.slice().sort((a, b) => {
      const sa = pubScore.get(a)!;
      const sb = pubScore.get(b)!;
      return sa === sb ? a.localeCompare(b) : sa === Infinity ? 1 : sb === Infinity ? -1 : sa - sb;
    });
    const culpritFake = (): Claim => {
      if (rules.info === 'limpia') {
        if (rules.mutual && accomplice) return { by: culprit, target: accomplice };
        // «Confirma» a quien la mesa ya descarta o menos sospecha: es lo que menos información regala.
        return { by: culprit, target: byPublic[byPublic.length - 1] };
      }
      // Dato inventado que incrimina a la persona más sospechosa: «estuvo donde dice la prueba 1».
      const y = byPublic[0] ?? innocents[0];
      return { by: culprit, target: y, hour: firstTrace?.slot ?? draws.hour, zone: firstTrace?.zone ?? p.zones[0] };
    };
    const accompliceFake = (): Claim => {
      if (rules.info === 'limpia') return { by: accomplice!, target: culprit };
      const h = firstTrace?.slot ?? draws.hour;
      const declared = p.knowledge.get(null)!.decl[culprit][h];
      const zone = declared !== firstTrace?.zone ? declared : p.zones.find((z) => z !== firstTrace?.zone)!;
      return { by: accomplice!, target: culprit, hour: h, zone };
    };
    const policyE = cell.evil ?? 'nunca';
    const policyI = cell.informant ?? 'revela';
    if (policyE === 'preventivo') claims.push(culpritFake());
    if (policyE === 'encubre' && accomplice) claims.push(accompliceFake());
    const realClaim = (): Claim => ({ by: I, ...datum! });
    if (informantExists && policyI === 'revela') {
      claims.push(realClaim());
      realClaimed = true;
    }
    if (informantExists && policyI === 'reacciona' && claims.some((c) => c.by !== I)) {
      claims.push(realClaim());
      realClaimed = true;
    }
    if (policyE === 'reactivo' && realClaimed && !claims.some((c) => c.by === culprit)) {
      const real = claims.find((c) => c.by === I)!;
      claims.push(rules.info === 'limpia' ? { by: culprit, target: real.target } : culpritFake());
    }
    if (rules.mutual) {
      for (const c of claims) {
        const real = informantExists && c.by === I;
        c.response = evil(c.target) ? (evil(c.by) ? 'confirma' : 'niega') : real ? 'confirma' : 'niega';
      }
    }
  }

  const trustOf = (v: PlayerId): Trust => (cell.trust === 'mixta' ? draws.trustMix[v] : (cell.trust ?? 'logica'));
  const extraFor = (v: PlayerId | null, trust: Trust, table: BaseTable, cls: Claim[]) =>
    rules ? (X: PlayerId, A: PlayerId | null) => claimCost(rules, table, v, cls, v ? privs[v] : {}, trust, w, X, A) : undefined;

  // ── Lo que piensa cada inocente; el bando culpable elige a quién cargar el muerto.
  const scores = new Map<PlayerId, Map<PlayerId, number>>();
  const pick: Record<PlayerId, PlayerId> = {};
  for (const v of innocents) {
    const t = p.table.get(v)!;
    let s = suspicion(t, extraFor(v, trustOf(v), t, claims));
    if ([...s.values()].every((x) => x === Infinity)) s = suspicion(t); // afirmaciones imposibles: se ignoran
    scores.set(v, s);
    pick[v] = argmin(s, p.noise, t.candidates) ?? argmin(new Map(t.candidates.map((x) => [x, 0])), p.noise, t.candidates)!;
  }
  let pubWithClaims = rules ? suspicion(pub, extraFor(null, 'logica', pub, claims)) : pubScore;
  if ([...pubWithClaims.values()].every((x) => x === Infinity)) pubWithClaims = pubScore;
  for (const v of ids.filter(evil)) {
    const options = ids.filter((x) => x !== v && !evil(x));
    pick[v] = argmin(pubWithClaims, p.noise, options) ?? argmin(new Map(options.map((x) => [x, 0])), p.noise, options)!;
  }

  // ── Señalar, defensa, votación y desempate: el motor real, sobre una copia.
  const room = structuredClone(p.room);
  for (const v of ids) point(room, v, pick[v], NOW);
  for (const v of ids) setReady(room, v, true, NOW);
  if ((room.phase as string) === 'defense') tick(room, room.phaseEndsAt!);
  if ((room.phase as string) !== 'vote') throw new Error(`expected vote, got ${room.phase}`);
  for (const v of ids) vote(room, v, pick[v], NOW);
  const round = room.round!;
  const runoff = (room.phase as string) === 'runoff';
  if (runoff) {
    const cands = round.runoff!.candidates;
    for (const v of ids) {
      const options = cands.filter((x) => x !== v && !(evil(v) && evil(x)));
      const fallback = cands.filter((x) => x !== v);
      const s = evil(v) ? pubWithClaims : scores.get(v)!;
      const choice =
        argmin(s, p.noise, options.length ? options : fallback) ??
        argmin(new Map(fallback.map((x) => [x, 0])), p.noise, fallback)!;
      vote(room, v, choice, NOW);
    }
  }
  if ((room.phase as string) !== 'result') throw new Error(`expected result, got ${room.phase}`);
  const outcome = round.outcome!;

  const points: Record<Role, number> = { inocente: 0, culpable: 0, complice: 0 };
  const roleCount: Record<Role, number> = { inocente: 0, culpable: 0, complice: 0 };
  for (const x of ids) {
    roleCount[roles[x]]++;
    for (const line of outcome.score[x]) points[roles[x]] += line.points;
  }

  // ── Espacio de deducción de los inocentes que no son el informante.
  const watchers = innocents.filter((v) => !rules || v !== draws.informant);
  let earlyFeasible = 0;
  let finalFeasible = 0;
  let finalTop = 0;
  let sole = 0;
  for (const v of watchers) {
    const e = p.early.get(v)!;
    // Al empezar la investigación ya están las afirmaciones hechas en ese momento (todas, en el
    // modelo: los bots no tienen ritmo). La variante «tardía» se mide sin ellas: ver informe.
    const es = suspicion(e, extraFor(v, trustOf(v), e, claims));
    earlyFeasible += [...es.values()].filter((x) => x < Infinity).length;
    const fs = scores.get(v)!;
    const finite = [...fs.entries()].filter(([, x]) => x < Infinity);
    finalFeasible += finite.length;
    const min = Math.min(...finite.map(([, x]) => x));
    const top = finite.filter(([, x]) => x === min).map(([q]) => q);
    finalTop += top.length;
    if (top.length === 1 && top[0] === culprit) sole++;
  }
  const k = Math.max(1, watchers.length);
  const fakeClaimers = claims.filter((c) => !(informantExists && c.by === draws.informant)).map((c) => c.by);

  return {
    caught: outcome.culpritCaught,
    accused: outcome.accused,
    accusedRole: outcome.accused ? roles[outcome.accused] : null,
    runoff,
    points,
    roleCount,
    votes: { ...round.votes },
    outcome,
    correctInnocentVotes: innocents.filter((v) => round.votes[v] === culprit).length,
    innocents: innocents.length,
    informantExists,
    realClaimed,
    fakeClaims: fakeClaimers.length,
    claims,
    informantAccused: !!rules && informantExists && outcome.accused === draws.informant,
    fakeClaimerAccused: !!outcome.accused && fakeClaimers.includes(outcome.accused),
    earlyFeasible: earlyFeasible / k,
    finalFeasible: finalFeasible / k,
    finalTop: finalTop / k,
    culpritSoleFavourite: sole / k,
  };
}

/** Resultado de la primera votación con un voto cambiado: el acusado, o 'desempate' / 'nadie'. */
export function firstRoundResult(votes: Record<PlayerId, PlayerId>, participants: PlayerId[]): string {
  const tally: Record<PlayerId, number> = Object.fromEntries(participants.map((c) => [c, 0]));
  for (const t of Object.values(votes)) if (t in tally) tally[t]++;
  const max = Math.max(0, ...Object.values(tally));
  const top = Object.keys(tally).filter((id) => tally[id] === max);
  if (max === 0) return 'nadie';
  return top.length === 1 ? top[0] : `desempate:${top.sort().join(',')}`;
}
