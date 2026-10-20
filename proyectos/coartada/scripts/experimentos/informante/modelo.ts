// Fase 6 · experimento aislado. Nada de src/ importa este archivo, no cambia el motor ni el
// protocolo, y la variante no existe en la aplicación (tests/informante-experimento.test.ts).
//
// Bots v2: cada bot decide SOLO con lo que la app le enseña (publicView + privateView), más la
// información simulada de la variante (afirmaciones públicas y el dato privado del informante).
// Por construcción no pueden leer papeles, noches ni recuerdos ajenos.
//
// Deducción: para cada hipótesis «X es la persona culpable y A la cómplice» se comprueba si todo
// lo que han dicho las personas que la hipótesis da por honestas es compatible, y se cuentan las
// mentiras que hay que atribuir a X y a A. Como en el simulador de la fase 5 (scripts/sim/core.ts):
//  - un desajuste de X con una prueba cuesta `w.trace` (0,5: el culpable suele decir la verdad
//    fuera de la hora del incidente);
//  - cada mentira que hay que cargar a la cómplice cuesta 1 la primera y 0,5 las siguientes;
//  - cada afirmación «soy el informante» que la hipótesis obliga a dar por falsa cuesta `w.fake`.
// Las personas inocentes nunca mienten (supuesto del modelo, no de las reglas).

import type { PublicView, PrivateView } from '../../../src/shared/engine/views';
import { rolesFor } from '../../../src/shared/engine/generate';
import type { Memory, PlayerId, Role } from '../../../src/shared/types';

export interface Knowledge {
  /** null: la perspectiva pública (lo que sabe cualquiera de la mesa sin información privada). */
  me: PlayerId | null;
  role: Role | null;
  partner: PlayerId | null;
  participants: PlayerId[];
  T: number;
  sceneZone: string;
  decl: Record<PlayerId, string[]>;
  traces: { slot: number; zone: string }[];
  testimonies: { by: PlayerId; subject: PlayerId; slot: number; zone: string }[];
  memories: Memory[];
  hasAccomplice: boolean;
}

/** Lo que una persona sabe, leído de las dos vistas que le envía el servidor y de nada más. */
export function knowledgeFrom(pub: PublicView, priv: PrivateView | null, opts: { noTraces?: boolean } = {}): Knowledge {
  const r = pub.round;
  if (!r || !r.declarations) throw new Error('knowledgeFrom: sin declaraciones públicas todavía');
  return {
    me: priv?.playerId ?? null,
    role: priv?.role ?? null,
    partner: priv?.partner?.id ?? null,
    participants: r.participants.slice(),
    T: r.scene.slot,
    sceneZone: r.scene.zone,
    decl: Object.fromEntries(Object.entries(r.declarations).map(([p, d]) => [p, d.zones.slice()])),
    traces: opts.noTraces ? [] : r.traces.map((t) => ({ slot: t.slot, zone: t.zone })),
    testimonies: r.testimonies.map((t) => ({ by: t.by, subject: t.subject, slot: t.slot, zone: t.zone })),
    memories: priv?.memories?.map((m) => ({ ...m })) ?? [],
    // Regla pública: hay cómplice desde 6 personas.
    hasAccomplice: rolesFor(r.participants.length).complices > 0,
  };
}

// ───────────────────────────── variante: reglas y afirmaciones ─────────────────────────────

export interface VariantRules {
  /** cierta: siempre hay informante. incierta: lo hay con probabilidad 1/2 y nadie sabe si lo hay. */
  existence: 'cierta' | 'incierta';
  /** A quién puede referirse el dato del informante. */
  target: 'inocente' | 'no-culpable' | 'cualquiera';
  /** limpia: «X es inocente» / «X no es la persona culpable». hora: «X estuvo en Z a las H». */
  info: 'limpia' | 'hora';
  /** La persona a la que se refiere el dato sabe quién es el informante y lo confirma o lo niega. */
  mutual: boolean;
}

/** Una afirmación pública «soy el informante y sé que…». */
export interface Claim {
  by: PlayerId;
  target: PlayerId;
  hour?: number;
  zone?: string;
  /** Respuesta pública de la persona nombrada (solo en la variante mutua). */
  response?: 'confirma' | 'niega';
}

/** El dato privado del informante (lo mismo que diría si lo cuenta). */
export interface Datum {
  target: PlayerId;
  hour?: number;
  zone?: string;
}

export interface PrivateInfo {
  /** Soy el informante y este es mi dato. */
  informant?: Datum;
  /** Variante mutua: soy la persona nombrada y sé quién es el informante. */
  knownInformant?: PlayerId;
}

/** logica: usa las afirmaciones con las reglas. credula: cree la primera. esceptica: las ignora. */
export type Trust = 'logica' | 'credula' | 'esceptica';

export interface Weights {
  trace: number;
  fake: number;
}
export const DEFAULT_WEIGHTS: Weights = { trace: 0.5, fake: 1 };

const OK = 0;
const IMPOSSIBLE = 1;
const ALIE = 2;

/**
 * Coste base de cada hipótesis (X culpable, A cómplice) para un observador: pruebas, testimonios y
 * sus propios recuerdos. No depende de la variante, así que se calcula una vez por ronda.
 * Devuelve una función que da el coste (Infinity si la hipótesis es imposible) y la lista de X.
 */
export interface BaseTable {
  candidates: PlayerId[];
  accomplices: (X: PlayerId) => (PlayerId | null)[];
  cost: (X: PlayerId, A: PlayerId | null) => number;
  /** «q estuvo en z a la hora h» según la hipótesis: OK, IMPOSSIBLE o mentira de la cómplice. */
  fact: (X: PlayerId, A: PlayerId | null, q: PlayerId, h: number, z: string) => number;
}

export function baseTable(k: Knowledge, w: Weights = DEFAULT_WEIGHTS): BaseTable {
  const others = k.participants.filter((p) => p !== k.me);
  const traceAt = new Map(k.traces.map((t) => [t.slot, t.zone]));
  const fact = (X: PlayerId, A: PlayerId | null, q: PlayerId, h: number, z: string): number => {
    if (q === X) {
      if (h === k.T) return IMPOSSIBLE; // a la hora del incidente estaba sola en el lugar del incidente
      const tz = traceAt.get(h);
      return tz !== undefined && tz !== z ? IMPOSSIBLE : OK;
    }
    if (q === A) return k.decl[A][h] === z ? OK : ALIE;
    return k.decl[q][h] === z ? OK : IMPOSSIBLE; // alguien honesto declaró otro sitio
  };
  const accomplices = (X: PlayerId): (PlayerId | null)[] => (k.hasAccomplice ? others.filter((a) => a !== X) : [null]);
  const memo = new Map<string, number>();
  const cost = (X: PlayerId, A: PlayerId | null): number => {
    const key = `${X}|${A}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let soft = 0;
    let aLies = 0;
    let possible = true;
    for (const t of k.traces) if (k.decl[X][t.slot] !== t.zone) soft += w.trace;
    for (const t of k.testimonies) {
      if (t.by === X) continue; // la persona culpable puede decir cualquier cosa
      const f = fact(X, A, t.subject, t.slot, t.zone);
      if (t.by === A) {
        if (f !== OK) aLies++; // la cómplice mintió en este testimonio
        continue;
      }
      if (f === IMPOSSIBLE) {
        possible = false;
        break;
      }
      if (f === ALIE) aLies++;
    }
    if (possible) {
      for (const m of k.memories) {
        const f = fact(X, A, m.with, m.slot, m.zone);
        if (f === IMPOSSIBLE) {
          possible = false;
          break;
        }
        if (f === ALIE) aLies++;
      }
    }
    const c = possible ? soft + (aLies > 0 ? 1 + 0.5 * (aLies - 1) : 0) : Infinity;
    memo.set(key, c);
    return c;
  };
  return { candidates: others, accomplices, cost, fact };
}

/** ¿Es cierto el dato `d` si X es la persona culpable y A la cómplice? */
function datumHolds(rules: VariantRules, table: BaseTable, X: PlayerId, A: PlayerId | null, d: Datum): boolean {
  if (rules.info === 'limpia') return rules.target === 'no-culpable' ? d.target !== X : d.target !== X && d.target !== A;
  return table.fact(X, A, d.target, d.hour!, d.zone!) !== IMPOSSIBLE; // si es A, pudo mentir en su declaración
}

/**
 * Coste extra que las afirmaciones y el dato privado añaden a la hipótesis (X, A), o Infinity si la
 * hacen imposible. Supuesto: una persona inocente nunca dice ser el informante si no lo es.
 */
export function claimCost(
  rules: VariantRules,
  table: BaseTable,
  me: PlayerId | null,
  claims: Claim[],
  priv: PrivateInfo,
  trust: Trust,
  w: Weights,
  X: PlayerId,
  A: PlayerId | null,
): number {
  const evil = (p: PlayerId) => p === X || p === A;
  // Lo que sé con certeza vale siempre, sea cual sea mi actitud ante lo que dicen los demás.
  if (priv.informant && !datumHolds(rules, table, X, A, priv.informant)) return Infinity;
  if (priv.knownInformant && evil(priv.knownInformant)) return Infinity;
  const usable = trust === 'esceptica' && !priv.informant && !priv.knownInformant ? [] : claims;
  if (usable.length === 0) return 0;
  if (trust === 'credula' && !priv.informant && !priv.knownInformant) {
    const first = usable[0];
    return !evil(first.by) && datumHolds(rules, table, X, A, first) ? 0 : Infinity;
  }
  // ¿Quién es el informante de verdad? Yo, el que me consta, alguno de los que lo dicen, o nadie
  // de los que lo dicen (calla, o en la variante incierta puede no existir).
  const options: (PlayerId | null)[] = priv.informant ? [me] : priv.knownInformant ? [priv.knownInformant] : [...usable.map((c) => c.by), null];
  let best = Infinity;
  for (const I of options) {
    if (I !== null && evil(I)) continue;
    let c = 0;
    let possible = true;
    for (const cl of usable) {
      if (cl.by === I) {
        if (!datumHolds(rules, table, X, A, cl)) possible = false;
      } else {
        if (!evil(cl.by)) possible = false; // solo el bando culpable finge ser el informante
        c += w.fake;
      }
      if (rules.mutual && cl.response && !evil(cl.target)) {
        // Una persona inocente nombrada dice la verdad: confirma solo al informante real.
        if ((cl.by === I) !== (cl.response === 'confirma')) possible = false;
      }
      if (!possible) break;
    }
    if (possible) best = Math.min(best, c);
  }
  return best;
}

/** Puntuación de sospecha de cada candidato (menor = más sospechoso; Infinity = descartado). */
export function suspicion(
  table: BaseTable,
  extra?: (X: PlayerId, A: PlayerId | null) => number,
  among: PlayerId[] = table.candidates,
): Map<PlayerId, number> {
  const out = new Map<PlayerId, number>();
  for (const X of among) {
    let best = Infinity;
    for (const A of table.accomplices(X)) {
      const b = table.cost(X, A);
      if (b === Infinity) continue;
      const e = extra ? extra(X, A) : 0;
      if (b + e < best) best = b + e;
    }
    out.set(X, best);
  }
  return out;
}
