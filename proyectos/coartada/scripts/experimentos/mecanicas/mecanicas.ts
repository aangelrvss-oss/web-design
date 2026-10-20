// Fase 7 · experimento aislado: tres mecánicas candidatas, simuladas sobre la misma ronda base que la
// fase 6 (scripts/experimentos/informante/ronda.ts → prepare). Nada de src/ importa este archivo, el
// motor no sabe que existen y la app no las tiene. Los bots solo usan lo que la app les enseñaría
// (modelo.ts → knowledgeFrom) más lo que la mecánica haría público.
//
//  M1 · Prueba falsificable: al declarar, la persona culpable puede falsificar una de las dos pruebas
//       (otro lugar a esa hora). La mesa tiene un peritaje por ronda: dice si una prueba es auténtica
//       y, si no lo es, cuál era la verdadera.
//  M2 · Registro en la defensa: quien defiende puede registrar un lugar a la hora del incidente; la
//       app dice a todos cuántas personas estaban allí de verdad (un número, sin nombres).
//  M3 · Archivar el caso: en la votación hay una opción más, «archivar». Si gana, nadie es acusado:
//       la persona culpable gana 2 (no 4), la cómplice 1 (no 3) y cada inocente 1. CAMBIA LA
//       PUNTUACIÓN de la variante: se calcula aquí, fuera del motor, y no se aplica al juego.

import { createRng } from '../../../src/shared/rng';
import { computeOutcome, point, setReady, tick, vote } from '../../../src/shared/engine/game';
import type { Outcome, PlayerId, Role } from '../../../src/shared/types';
import { baseTable, suspicion, DEFAULT_WEIGHTS, type Knowledge } from '../informante/modelo';
import type { Prepared } from '../informante/ronda';

const NOW = 1_000_000;
const ARCH = '__archivo__';

export interface MechResult {
  caught: boolean;
  accused: PlayerId | null;
  archived: boolean;
  /** Papel de la persona acusada, o 'nadie' / 'archivo'. */
  outcome: Role | 'nadie' | 'archivo';
  decoyAccused: boolean;
  /** Puntos por persona y ronda según su papel (NaN si nadie tiene ese papel). */
  points: Record<Role, number>;
  /** Sospechosos que la lógica de un inocente aún no descarta al votar (media). */
  finalFeasible: number;
  extra: Record<string, number>;
}

type Scores = Map<PlayerId, number>;

const argmin = (s: Scores, noise: Record<PlayerId, number>, among: PlayerId[]): PlayerId | null => {
  let best: PlayerId | null = null;
  let bv = Infinity;
  for (const p of among) {
    const x = s.get(p);
    if (x === undefined || x === Infinity) continue;
    if (x + noise[p] < bv) {
      bv = x + noise[p];
      best = p;
    }
  }
  return best;
};
const pickOrAny = (s: Scores, noise: Record<PlayerId, number>, among: PlayerId[]): PlayerId =>
  argmin(s, noise, among) ?? argmin(new Map(among.map((x) => [x, 0])), noise, among)!;

function perRole(p: Prepared, score: Outcome['score'], adjust?: (x: PlayerId) => number): Record<Role, number> {
  const sum: Record<Role, number> = { inocente: 0, culpable: 0, complice: 0 };
  const cnt: Record<Role, number> = { inocente: 0, culpable: 0, complice: 0 };
  for (const x of p.ids) {
    const r = p.roles[x];
    cnt[r]++;
    sum[r] += score[x].reduce((s, l) => s + l.points, 0) + (adjust ? adjust(x) : 0);
  }
  return { inocente: sum.inocente / cnt.inocente, culpable: sum.culpable / cnt.culpable, complice: cnt.complice ? sum.complice / cnt.complice : NaN };
}

/**
 * Señalar, defensa y votación con el motor real, sobre una copia. `scores` da lo que piensa cada
 * inocente y la mesa en público; `onDefense` puede cambiarlo antes de votar (M2).
 */
function playThrough(
  p: Prepared,
  scores: () => { inn: Map<PlayerId, Scores>; pub: Scores },
  onDefense?: (defender: PlayerId | null) => void,
) {
  const { ids, culprit, accomplice, noise } = p;
  const evil = (x: PlayerId) => x === culprit || x === accomplice;
  const choose = (v: PlayerId, among?: PlayerId[]): PlayerId => {
    const { inn, pub } = scores();
    if (evil(v)) {
      const opts = (among ?? ids).filter((x) => x !== v && !evil(x));
      const fallback = (among ?? ids).filter((x) => x !== v);
      return pickOrAny(pub, noise, opts.length ? opts : fallback);
    }
    return pickOrAny(inn.get(v)!, noise, (among ?? ids).filter((x) => x !== v));
  };
  const room = structuredClone(p.room);
  for (const v of ids) point(room, v, choose(v), NOW);
  for (const v of ids) setReady(room, v, true, NOW);
  const defender = room.round!.defense?.defender ?? null;
  if ((room.phase as string) === 'defense') {
    onDefense?.(defender);
    tick(room, room.phaseEndsAt!);
  }
  for (const v of ids) vote(room, v, choose(v), NOW);
  if ((room.phase as string) === 'runoff') {
    const cands = room.round!.runoff!.candidates;
    for (const v of ids) vote(room, v, choose(v, cands), NOW);
  }
  if ((room.phase as string) !== 'result') throw new Error(`expected result, got ${room.phase}`);
  return { outcome: room.round!.outcome!, defender };
}

function result(p: Prepared, outcome: Outcome, inn: Map<PlayerId, Scores>, extra: Record<string, number>): MechResult {
  const finite = [...inn.values()].map((s) => [...s.values()].filter((x) => x < Infinity).length);
  return {
    caught: outcome.culpritCaught,
    accused: outcome.accused,
    archived: false,
    outcome: outcome.accused ? p.roles[outcome.accused] : 'nadie',
    decoyAccused: !!outcome.accused && p.decoys.includes(outcome.accused),
    points: perRole(p, outcome.score),
    finalFeasible: finite.reduce((a, b) => a + b, 0) / Math.max(1, finite.length),
    extra,
  };
}

const withTraces = (k: Knowledge, traces: Knowledge['traces']): Knowledge => ({ ...k, traces });

// ───────────────────────────── M1 · Prueba falsificable ─────────────────────────────

/** f1/f2: falsifica la prueba 1 o la 2 al declarar, con un lugar al azar. f2p: falsifica la 2 durante
 * la primera parte, ya vistas las coartadas, con el lugar que más gente declaró a esa hora. */
export type M1Culprit = 'no' | 'f1' | 'f2' | 'f2p';
export type M1Peritaje = 'e1' | 'e2' | 'coherencia';
export type M1Trust = 'confiada' | 'prudente' | 'desconfiada';
export const M1_FAKE_COST: Record<M1Trust, number> = { confiada: Infinity, prudente: 1, desconfiada: 0 };

/** Lugar que pondría la persona culpable en la prueba falsa (otro sitio a esa hora, al azar). */
export function m1FakeZone(p: Prepared, index: number): string {
  const real = p.knowledge.get(null)!.traces[index];
  return createRng(`m1|${p.o.seed}|${index}`).pick(p.zones.filter((z) => z !== real.zone));
}

/**
 * Sospechas de un observador con las pruebas que ve (`shown`), si una de ellas (`doubtful`, −1 si
 * ninguna) puede ser falsa: cada hipótesis puede suponer que esa prueba es falsa pagando `wF`.
 */
export function m1Scores(p: Prepared, v: PlayerId | null, shown: Knowledge['traces'], doubtful: number, wF: number): Scores {
  const k = withTraces(p.knowledge.get(v)!, shown);
  const full = baseTable(k, p.o.w ?? DEFAULT_WEIGHTS);
  if (doubtful < 0 || wF === Infinity) return suspicion(full);
  const drop = baseTable(withTraces(k, shown.filter((_, i) => i !== doubtful)), p.o.w ?? DEFAULT_WEIGHTS);
  const a = suspicion(full);
  const b = suspicion(drop);
  return new Map([...a.keys()].map((x) => [x, Math.min(a.get(x)!, b.get(x)! + wF)]));
}

export function resolveM1(p: Prepared, culprit: M1Culprit, peritaje: M1Peritaje, trust: M1Trust): MechResult {
  const real = p.knowledge.get(null)!.traces;
  const fakeIndex = culprit === 'no' ? -1 : culprit === 'f1' ? 0 : 1;
  const decl = p.knowledge.get(null)!.decl;
  const plausible = (i: number) => {
    const t = real[i];
    const count = (z: string) => p.ids.filter((x) => decl[x][t.slot] === z).length;
    return p.zones.filter((z) => z !== t.zone).sort((a, b) => count(b) - count(a) || a.localeCompare(b))[0];
  };
  const seen = real.map((t, i) => (i === fakeIndex ? { slot: t.slot, zone: culprit === 'f2p' ? plausible(i) : m1FakeZone(p, i) } : { ...t }));

  // La mesa decide qué prueba peritar (una sola, de todas las que ha visto).
  let check: number;
  if (peritaje === 'e1') check = 0;
  else if (peritaje === 'e2') check = 1;
  else {
    // «Coherencia»: la prueba con la que encajan menos coartadas parece la sospechosa.
    const fits = seen.map((t) => p.ids.filter((x) => decl[x][t.slot] === t.zone).length);
    check = fits[0] < fits[1] ? 0 : 1;
  }
  const caughtFake = check === fakeIndex;
  // Tras el peritaje: si era falsa, la mesa ve la verdadera; si no, la otra sigue en duda (solo puede
  // haber una falsa).
  const shown = caughtFake ? real.map((t) => ({ ...t })) : seen;
  const doubtful = caughtFake ? -1 : 1 - check;
  const wF = M1_FAKE_COST[trust];

  const tableFor = (v: PlayerId | null) => m1Scores(p, v, shown, doubtful, wF);
  const inn = new Map(p.innocents.map((v) => [v, tableFor(v)]));
  const pub = tableFor(null);
  const { outcome } = playThrough(p, () => ({ inn, pub }));
  return result(p, outcome, inn, { fake: +(fakeIndex >= 0), fakeCaught: +caughtFake, checked: check });
}

// ───────────────────────────── M2 · Registro en la defensa ─────────────────────────────

/**
 * Lo que permite deducir «en `zone`, a la hora del incidente, había `count` personas» para cada
 * hipótesis (X culpable, A cómplice): Infinity si es imposible, +1 si obliga a que la cómplice
 * mintiera en su coartada. La persona culpable estaba en el lugar del incidente y nunca cuenta.
 */
export function m2CountCost(p: Prepared, zone: string, count: number) {
  const k = p.knowledge.get(null)!;
  const decl = k.decl;
  const T = k.T;
  return (X: PlayerId, A: PlayerId | null): number => {
    const honest = p.ids.filter((x) => x !== X && x !== A && decl[x][T] === zone).length;
    if (A === null) return count === honest ? 0 : Infinity;
    if (count === honest) return decl[A][T] === zone ? 1 : 0; // la cómplice dijo estar allí y no estaba
    if (count === honest + 1) return decl[A][T] !== zone ? 1 : 0; // estaba allí y dijo otro sitio
    return Infinity;
  };
}

/** propia: registra su propio lugar. caza: el de su sospechoso favorito. concurrida: el lugar ajeno
 * con más gente declarada. */
export type M2Innocent = 'propia' | 'caza' | 'concurrida';
/** cualquiera: se puede registrar cualquier lugar. ajena: nunca el lugar que declaró quien defiende. */
export type M2Rule = 'cualquiera' | 'ajena';
export type M2Culprit = 'caza' | 'minima';
export type M2Table = 'literal' | 'suspicaz';

export function resolveM2(p: Prepared, innocentPolicy: M2Innocent, culpritPolicy: M2Culprit, mesa: M2Table, rule: M2Rule = 'cualquiera'): MechResult {
  const { ids, culprit, accomplice, noise } = p;
  const k0 = p.knowledge.get(null)!;
  const T = k0.T;
  const decl = k0.decl;
  const evil = (x: PlayerId) => x === culprit || x === accomplice;
  const cells = p.zones.filter((z) => z !== k0.sceneZone);
  const declaredIn = (z: string) => ids.filter((x) => decl[x][T] === z).length;

  const baseInn = new Map(p.innocents.map((v) => [v, suspicion(p.table.get(v)!)]));
  const basePub = suspicion(p.table.get(null)!);
  let inn = baseInn;
  let pub = basePub;
  let searched: string | null = null;
  let count = -1;
  let ownSearch = 0;
  let defenderRole: Role | null = null;

  const { outcome } = playThrough(
    p,
    () => ({ inn, pub }),
    (d) => {
      if (!d) return;
      defenderRole = p.roles[d];
      const own = decl[d][T];
      const crowdedOther = cells.filter((z) => z !== own).sort((a, b) => declaredIn(b) - declaredIn(a) || a.localeCompare(b))[0];
      if (p.roles[d] === 'inocente') {
        if (innocentPolicy === 'propia' && rule === 'cualquiera') searched = own;
        else if (innocentPolicy === 'caza') {
          const top = pickOrAny(baseInn.get(d)!, noise, ids.filter((x) => x !== d));
          searched = rule === 'ajena' && decl[top][T] === own ? crowdedOther : decl[top][T];
        } else searched = crowdedOther;
      } else if (d === culprit) {
        const others = cells.filter((z) => z !== own);
        if (culpritPolicy === 'caza') {
          // Finge buscar a su sospechoso favorito de la mesa; nunca su propio lugar.
          const top = pickOrAny(basePub, noise, ids.filter((x) => !evil(x)));
          searched = decl[top][T] !== own ? decl[top][T] : others.slice().sort((a, b) => declaredIn(b) - declaredIn(a))[0];
        } else {
          searched = others.slice().sort((a, b) => declaredIn(a) - declaredIn(b) || a.localeCompare(b))[0];
        }
      } else {
        // La cómplice declaró la verdad: su lugar le da la razón (si la regla le deja registrarlo).
        searched = rule === 'cualquiera' ? own : crowdedOther;
      }
      ownSearch = +(searched === own);
      count = ids.filter((x) => p.truth[x][T] === searched).length;
      const zone = searched!;
      // Lo que el número permite deducir para cada hipótesis (X culpable, A cómplice). La persona
      // culpable estaba en el lugar del incidente, así que nunca cuenta.
      const fromCount = m2CountCost(p, zone, count);
      // Una mesa suspicaz desconfía de quien no registra su propio lugar.
      const extra = (X: PlayerId, A: PlayerId | null) => fromCount(X, A) - (mesa === 'suspicaz' && X === d && !ownSearch ? 1 : 0);
      inn = new Map(p.innocents.map((v) => [v, suspicion(p.table.get(v)!, extra)]));
      pub = suspicion(p.table.get(null)!, extra);
    },
  );
  const declared = searched ? declaredIn(searched) : -1;
  return result(p, outcome, inn, {
    defense: +(searched !== null),
    defenderCulprit: +(defenderRole === 'culpable'),
    defenderInnocent: +(defenderRole === 'inocente'),
    ownSearch,
    mismatch: +(searched !== null && count !== declared),
  });
}

// ───────────────────────────── M3 · Archivar el caso ─────────────────────────────

/** Umbral de la mesa: archiva si la ventaja de su favorito es menor que esto (−1: nunca). */
export type M3Theta = number;
export type M3Evil = 'nunca' | 'si-peligro';

export function resolveM3(p: Prepared, theta: M3Theta, evilPolicy: M3Evil): MechResult {
  const { ids, culprit, accomplice, noise, innocents } = p;
  const evil = (x: PlayerId) => x === culprit || x === accomplice;
  const inn = new Map(innocents.map((v) => [v, suspicion(p.table.get(v)!)]));
  const pub = suspicion(p.table.get(null)!);
  const confident = (s: Scores) => {
    if (theta < 0) return true;
    const f = [...s.values()].filter((x) => x < Infinity).sort((a, b) => a - b);
    return f.length < 2 || f[1] - f[0] >= theta;
  };
  const publicTop = pickOrAny(pub, noise, ids);
  const danger = publicTop === culprit;
  const ballot = (v: PlayerId, among: string[]): string => {
    const people = among.filter((x) => x !== ARCH && x !== v);
    if (evil(v)) {
      if (evilPolicy === 'si-peligro' && danger && among.includes(ARCH)) return ARCH;
      const safe = people.filter((x) => !evil(x));
      if (safe.length) return pickOrAny(pub, noise, safe);
      return among.includes(ARCH) ? ARCH : pickOrAny(pub, noise, people);
    }
    const s = inn.get(v)!;
    if (among.includes(ARCH) && !confident(s)) return ARCH;
    if (people.length) return pickOrAny(s, noise, people);
    return ARCH;
  };
  const tally = (votes: Record<PlayerId, string>, options: string[]) => {
    const t = new Map(options.map((o) => [o, 0]));
    for (const x of Object.values(votes)) if (t.has(x)) t.set(x, t.get(x)! + 1);
    const max = Math.max(0, ...t.values());
    return { max, top: [...t.entries()].filter(([, c]) => c === max).map(([o]) => o) };
  };
  // La defensa no cambia nada en los bots (nadie cambia de idea): se vota directamente.
  const first: Record<PlayerId, string> = Object.fromEntries(ids.map((v) => [v, ballot(v, [...ids, ARCH])]));
  let { max, top } = tally(first, [...ids, ARCH]);
  let decided: string | null = null;
  if (max > 0 && top.length === 1) decided = top[0];
  else if (max > 0) {
    const second = Object.fromEntries(ids.map((v) => [v, ballot(v, top)]));
    ({ max, top } = tally(second, top));
    decided = max > 0 && top.length === 1 ? top[0] : null;
  }
  // Puntos: los del motor para «acusado» o «nadie»; el archivo se ajusta aquí (fuera del motor).
  const round = structuredClone(p.room.round!);
  round.votes = Object.fromEntries(Object.entries(first).filter(([, t]) => t !== ARCH)) as Record<PlayerId, PlayerId>;
  const archived = decided === ARCH;
  const accused = archived ? null : decided;
  const outcome = computeOutcome(round, accused);
  const adjust = archived ? (x: PlayerId) => (p.roles[x] === 'inocente' ? 1 : -2) : undefined;
  const archVotes = Object.entries(first).filter(([, t]) => t === ARCH).map(([v]) => v);
  const r = result(p, outcome, inn, {
    archVotes: archVotes.length,
    archVotesEvil: archVotes.filter(evil).length,
  });
  return { ...r, archived, outcome: archived ? 'archivo' : r.outcome, points: perRole(p, outcome.score, adjust) };
}
