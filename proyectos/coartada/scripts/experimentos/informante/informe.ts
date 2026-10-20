// Fase 6 · informe reproducible del experimento aislado (Markdown por la salida estándar).
//
//   npx tsx scripts/experimentos/informante/informe.ts            # 1500 rondas por tamaño
//   npx tsx scripts/experimentos/informante/informe.ts 300        # rápido, intervalos más anchos
//
// Semillas fijas `f6-{jugadores}-{i}`; la estrategia del culpable rota con i (mínimo, esquiva,
// total). Todas las celdas de una ronda comparten la misma noche, declaraciones, testimonios,
// pruebas, desempate de mesa y sorteos de la variante: las diferencias son emparejadas.
// Bots, no personas: ver scripts/experimentos/informante/modelo.ts y docs/INFORMANTE-evaluacion.md.

import { playRound, type CulpritStrategy } from '../../sim/core';
import type { PlayerId, Role } from '../../../src/shared/types';
import type { Trust, VariantRules } from './modelo';
import { firstRoundResult, prepare, resolveCell, type Cell, type CellResult, type EvilPolicy, type InformantPolicy, type Prepared } from './ronda';

const R = Number(process.argv[2] ?? 1500);
const SIZES = [4, 5, 6, 10];
const STRATS: CulpritStrategy[] = ['minimo', 'esquiva', 'total'];
const strategyOf = (i: number) => STRATS[i % 3];
const seedOf = (n: number, i: number) => `f6-${n}-${i}`;

// ───────────────────────────── estadística ─────────────────────────────

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
function wilson(k: number, n: number): [number, number, number] {
  if (n === 0) return [NaN, NaN, NaN];
  const z = 1.96;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [p, Math.max(0, c - h), Math.min(1, c + h)];
}
const pct = (x: number) => `${(100 * x).toFixed(1)} %`;
const rate = (xs: number[]) => {
  const [p, lo, hi] = wilson(xs.reduce((a, b) => a + b, 0), xs.length);
  return `${(100 * p).toFixed(1)} % [${(100 * lo).toFixed(1)}–${(100 * hi).toFixed(1)}]`;
};
function meanCI(xs: number[], digits = 2): string {
  const n = xs.length;
  const m = mean(xs);
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, n - 1));
  return `${m.toFixed(digits)} ±${((1.96 * sd) / Math.sqrt(n)).toFixed(digits)}`;
}
/** Diferencia emparejada (a − b) con IC 95 % normal. En puntos porcentuales si `pp`. */
function paired(a: number[], b: number[], pp = true): { m: number; lo: number; hi: number; text: string } {
  if (a.length !== b.length) throw new Error(`muestras no emparejadas: ${a.length} / ${b.length}`);
  const d = a.map((x, i) => x - b[i]);
  const n = d.length;
  const m = mean(d);
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, n - 1));
  const h = (1.96 * sd) / Math.sqrt(n);
  const k = pp ? 100 : 1;
  const f = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(k * x).toFixed(pp ? 1 : 2)}`;
  return { m, lo: m - h, hi: m + h, text: `${f(m)}${pp ? ' pp' : ''} [${f(m - h)}, ${f(m + h)}]` };
}

// ───────────────────────────── registros ─────────────────────────────

interface Rec {
  c: number; // grupo acusa al culpable
  acc: 'culpable' | 'complice' | 'inocente' | 'nadie';
  decoy: number;
  run: number;
  accused: PlayerId | null;
  /** Puntos por persona y ronda, por papel (NaN si no hay nadie con ese papel). */
  pts: Record<Role, number>;
  cv: number; // votos de inocentes que aciertan / inocentes
  eF: number;
  fF: number;
  fT: number;
  sole: number;
  iE: number;
  rC: number;
  fk: number;
  iA: number;
  fA: number;
  /** Acusado distinto del de la ronda base (misma ronda, sin variante). */
  chg: number;
}

function rec(p: Prepared, r: CellResult, base: CellResult | null): Rec {
  const pts = { inocente: NaN, culpable: NaN, complice: NaN } as Record<Role, number>;
  for (const role of ['inocente', 'culpable', 'complice'] as Role[]) if (r.roleCount[role]) pts[role] = r.points[role] / r.roleCount[role];
  return {
    c: +r.caught,
    acc: r.accusedRole ?? 'nadie',
    decoy: +(!!r.accused && p.decoys.includes(r.accused)),
    run: +r.runoff,
    accused: r.accused,
    pts,
    cv: r.correctInnocentVotes / r.innocents,
    eF: r.earlyFeasible,
    fF: r.finalFeasible,
    fT: r.finalTop,
    sole: r.culpritSoleFavourite,
    iE: +r.informantExists,
    rC: +r.realClaimed,
    fk: r.fakeClaims,
    iA: +r.informantAccused,
    fA: +r.fakeClaimerAccused,
    chg: base ? +(r.accused !== base.accused) : 0,
  };
}
const col = (rs: Rec[], f: (r: Rec) => number) => rs.map(f);

// ───────────────────────────── variantes y estrategias ─────────────────────────────

const VARIANTS: { key: string; name: string; rules: VariantRules }[] = [
  { key: 'libre', name: 'A · Informante libre', rules: { existence: 'cierta', target: 'inocente', info: 'limpia', mutual: false } },
  { key: 'incierto', name: 'C · Informante incierto (existe con probabilidad 1/2)', rules: { existence: 'incierta', target: 'inocente', info: 'limpia', mutual: false } },
  { key: 'nocupable', name: 'D · «X no es la persona culpable» (puede ser la cómplice)', rules: { existence: 'cierta', target: 'no-culpable', info: 'limpia', mutual: false } },
  { key: 'mutuo', name: 'E · Informante con aval (la persona nombrada sabe quién es)', rules: { existence: 'cierta', target: 'inocente', info: 'limpia', mutual: true } },
  { key: 'hora', name: 'F · Testigo de una hora («X estuvo en Z a las H»)', rules: { existence: 'cierta', target: 'cualquiera', info: 'hora', mutual: false } },
];
const INF: InformantPolicy[] = ['revela', 'reacciona', 'calla'];
const evilFor = (n: number): EvilPolicy[] => (n >= 6 ? ['nunca', 'reactivo', 'preventivo', 'encubre'] : ['nunca', 'reactivo', 'preventivo']);
const TRUSTS: (Trust | 'mixta')[] = ['credula', 'esceptica', 'mixta'];
const PROFILES = (n: number): [InformantPolicy, EvilPolicy][] => [
  ['revela', 'nunca'],
  ['revela', 'reactivo'],
  ['reacciona', 'preventivo'],
  ['calla', 'preventivo'],
  ...(n >= 6 ? ([['revela', 'encubre']] as [InformantPolicy, EvilPolicy][]) : []),
];
const WEIGHTS = [0.5, 0, -0.5];
const INF_NAME: Record<InformantPolicy, string> = { revela: 'lo cuenta', reacciona: 'solo si alguien finge', calla: 'nunca lo cuenta' };
const EVIL_NAME: Record<EvilPolicy, string> = {
  nunca: 'nunca finge',
  reactivo: 'culpable replica',
  preventivo: 'culpable se adelanta',
  encubre: 'cómplice encubre',
};

// ───────────────────────────── ejecución ─────────────────────────────

type Store = Map<string, Rec[]>;
const stores = new Map<number, Store>();
const v1Caught = new Map<number, Record<CulpritStrategy, number[]>>();
const v2Caught = new Map<number, Record<CulpritStrategy, number[]>>();
const v1v2Diff = new Map<number, number[]>();
const pivotal = new Map<number, Record<Role, [number, number]>>();
const encargo = new Map<number, { kinds: Map<string, number[]>; pts: Record<Role, number[]>; ptsOff: Record<Role, number[]>; caughtOn: number[] }>();
let unsound = 0;
let tallyMismatch = 0;
let blocked = 0;
const started = Date.now();

for (const n of SIZES) {
  const store: Store = new Map();
  const push = (k: string, r: Rec) => (store.get(k) ?? store.set(k, []).get(k)!).push(r);
  const v1c = { minimo: [], esquiva: [], total: [] } as Record<CulpritStrategy, number[]>;
  const v2c = { minimo: [], esquiva: [], total: [] } as Record<CulpritStrategy, number[]>;
  const diff: number[] = [];
  const piv: Record<Role, [number, number]> = { inocente: [0, 0], culpable: [0, 0], complice: [0, 0] };
  const enc = { kinds: new Map<string, number[]>(), pts: { inocente: [], culpable: [], complice: [] } as Record<Role, number[]>, ptsOff: { inocente: [], culpable: [], complice: [] } as Record<Role, number[]>, caughtOn: [] as number[] };
  for (let i = 0; i < R; i++) {
    const seed = seedOf(n, i);
    const strategy = strategyOf(i);
    let p: Prepared;
    try {
      p = prepare({ n, seed, strategy });
    } catch {
      blocked++;
      continue;
    }
    const base = resolveCell(p);
    for (const v of p.innocents) {
      const s = p.table.get(v)!;
      if ([...s.accomplices(p.culprit)].every((a) => s.cost(p.culprit, a) === Infinity)) unsound++;
    }
    const baseRec = rec(p, base, null);
    push('base', baseRec);
    push(`base|${strategy}`, baseRec);

    // v1 (fase 5) con la misma semilla: misma noche, mismas declaraciones y testimonios.
    const v1 = playRound({ n, seed, strategy });
    v1c[strategy].push(+v1.caught);
    v2c[strategy].push(+base.caught);
    diff.push(+(v1.caught !== base.caught));

    // Votos decisivos: ¿cambiaría el resultado de la primera votación si esta persona votara otra cosa?
    const first = firstRoundResult(base.votes, p.ids);
    const engineFirst = base.runoff ? 'desempate' : (base.outcome.accused ?? 'nadie');
    if ((first.startsWith('desempate') ? 'desempate' : first) !== engineFirst) tallyMismatch++;
    for (const v of p.ids) {
      let changes = false;
      for (const t of p.ids) {
        if (t === v || t === base.votes[v]) continue;
        if (firstRoundResult({ ...base.votes, [v]: t }, p.ids) !== first) {
          changes = true;
          break;
        }
      }
      piv[p.roles[v]][0] += +changes;
      piv[p.roles[v]][1]++;
    }

    // Ablaciones de información (misma ronda, los bots ignoran una fuente).
    for (const [k, o] of [
      ['sin-pruebas', { noTraces: true }],
      ['sin-testimonios', { noTestimonies: true }],
      ['sin-nada', { noTraces: true, noTestimonies: true }],
    ] as const) {
      const q = prepare({ n, seed, strategy, ...o });
      const r = rec(q, resolveCell(q), base);
      push(k, r);
      push(`${k}|${strategy}`, r);
    }
    // Peso de un desajuste con una prueba (cómo interpreta la mesa que alguien no encaje).
    for (const wt of WEIGHTS) {
      const q = wt === 0.5 ? p : prepare({ n, seed, strategy, w: { trace: wt, fake: 1 } });
      push(`peso${wt}|${strategy}`, rec(q, wt === 0.5 ? base : resolveCell(q), base));
    }
    // Objetivos secretos: la misma noche con objetivos (los bots no los persiguen).
    {
      const q = prepare({ n, seed, strategy, encargos: true });
      const r = resolveCell(q);
      enc.caughtOn.push(+r.caught);
      const setup = q.room.round!.setup;
      for (const x of q.ids) {
        const kind = `${setup.encargos![x].kind}|${q.roles[x]}`;
        (enc.kinds.get(kind) ?? enc.kinds.set(kind, []).get(kind)!).push(+!!r.outcome.encargoDone?.[x]);
      }
      for (const role of ['inocente', 'culpable', 'complice'] as Role[]) {
        if (!r.roleCount[role]) continue;
        enc.pts[role].push(r.points[role] / r.roleCount[role]);
        enc.ptsOff[role].push(base.points[role] / base.roleCount[role]);
      }
    }

    // Variantes del informante.
    for (const v of VARIANTS) {
      for (const inf of INF) {
        for (const ev of evilFor(n)) {
          const cell: Cell = { rules: v.rules, informant: inf, evil: ev, trust: 'logica' };
          push(`${v.key}|${inf}|${ev}|logica`, rec(p, resolveCell(p, cell), base));
        }
      }
      for (const [inf, ev] of PROFILES(n)) {
        for (const trust of TRUSTS) {
          push(`${v.key}|${inf}|${ev}|${trust}`, rec(p, resolveCell(p, { rules: v.rules, informant: inf, evil: ev, trust }), base));
        }
      }
    }
  }
  stores.set(n, store);
  v1Caught.set(n, v1c);
  v2Caught.set(n, v2c);
  v1v2Diff.set(n, diff);
  pivotal.set(n, piv);
  encargo.set(n, enc);
  process.stderr.write(`${n} jugadores: ${R} rondas (${((Date.now() - started) / 1000).toFixed(0)} s)\n`);
}

// ───────────────────────────── salida ─────────────────────────────

const out: string[] = [];
const P = (s = '') => out.push(s);
const get = (n: number, k: string) => stores.get(n)!.get(k) ?? [];
const caught = (n: number, k: string) => col(get(n, k), (r) => r.c);
const table = (head: string[], rows: string[][]) => {
  P(`| ${head.join(' | ')} |`);
  P(`| ${head.map(() => '---').join(' | ')} |`);
  for (const r of rows) P(`| ${r.join(' | ')} |`);
  P();
};

P('# Informante: datos del experimento aislado (fase 6)');
P();
P(`Generado con \`npx tsx scripts/experimentos/informante/informe.ts ${R}\`: ${R} rondas por tamaño de mesa, semillas fijas \`f6-{jugadores}-{i}\`, motor real. La estrategia de declaración del culpable rota con la semilla (mínimo, esquiva, total), así que cada estrategia tiene ${Math.floor(R / 3)} rondas por tamaño.`);
P();
P('Intervalos del 95 %: Wilson para porcentajes, normal para medias y diferencias emparejadas. «Emparejado» significa misma ronda (misma noche, papeles, declaraciones, testimonios, pruebas y desempate de mesa) con y sin la condición que se compara.');
P();
P('**Bots, no personas.** Deciden solo con lo que la app enseña a cada uno (vistas pública y privada), las personas inocentes nunca mienten, nadie cambia de idea tras la defensa y las estrategias son fijas. Las cifras dicen qué permite deducir la información de la ronda a una mesa disciplinada, no cómo jugará una mesa real. La interpretación está en `docs/INFORMANTE-evaluacion.md`.');
P();
P(`Comprobaciones de la ejecución: rondas bloqueadas o inválidas: **${blocked}**. Veces que un bot inocente descartó por lógica a la persona culpable verdadera (debe ser 0): **${unsound}**. Discrepancias entre el recuento propio de votos y el del motor (debe ser 0): **${tallyMismatch}**.`);
P();

// A · fidelidad
P('## 1. Simulador: v1 (fase 5) frente a v2 (fase 6)');
P();
P('Misma semilla ⇒ misma noche, mismas declaraciones, mismos testimonios y mismo desempate de mesa en los dos simuladores. Cambia solo cómo deducen y votan los bots: v2 lee únicamente las vistas, enumera la pareja culpable-cómplice de forma conjunta y vota el desempate por deducción en vez de al azar.');
P();
table(
  ['Jugadores', 'Estrategia', 'v1: grupo acusa al culpable', 'v2: grupo acusa al culpable', 'Diferencia v2 − v1'],
  SIZES.flatMap((n) =>
    STRATS.map((s) => {
      const a = v1Caught.get(n)![s];
      const b = v2Caught.get(n)![s];
      return [String(n), s, rate(a), rate(b), paired(b, a).text];
    }),
  ),
);
P(
  'Rondas en que v1 y v2 llegan a un resultado distinto (acusan o no a la persona culpable): ' +
    SIZES.map((n) => `${n} jug. ${pct(mean(v1v2Diff.get(n)!))}`).join(' · ') +
    '.',
);
P();

// B · juego base
P('## 2. Juego base con bots v2');
P();
P('### 2.1 Quién gana');
P();
P('La partida la gana un bando: el grupo (todas las personas inocentes) si se acusa a la persona culpable; el bando culpable (culpable y cómplice) en cualquier otro caso. Por eso «gana el grupo» y «escapa la persona culpable» suman 100 %: no son dos métricas independientes.');
P();
table(
  ['Jugadores', 'Gana el grupo', 'Escapa el culpable', 'Acusan a un inocente', '…de ellos, un señuelo', 'Acusan a la cómplice', 'Nadie acusado', 'Desempate'],
  SIZES.map((n) => {
    const b = get(n, 'base');
    const k = (f: (r: Rec) => boolean) => rate(b.map((r) => +f(r)));
    return [String(n), rate(col(b, (r) => r.c)), rate(col(b, (r) => 1 - r.c)), k((r) => r.acc === 'inocente'), k((r) => r.decoy === 1), n >= 6 ? k((r) => r.acc === 'complice') : 'n/a', k((r) => r.acc === 'nadie'), k((r) => r.run === 1)];
  }),
);
P('Por estrategia de declaración del culpable (grupo acusa al culpable):');
P();
table(
  ['Jugadores', ...STRATS],
  SIZES.map((n) => [String(n), ...STRATS.map((s) => rate(caught(n, `base|${s}`)))]),
);

P('### 2.2 Puntos');
P();
P('Puntuación individual, separada de la victoria del bando: media de puntos por persona y ronda según su papel, y lo que espera una persona cualquiera a lo largo de una partida de 5 rondas (los papeles se sortean cada ronda: culpable con probabilidad 1/N, cómplice 1/N desde 6 personas).');
P();
table(
  ['Jugadores', 'Inocente', 'Culpable', 'Cómplice', 'Inocentes que votan al culpable', 'Persona cualquiera, partida de 5 rondas'],
  SIZES.map((n) => {
    const b = get(n, 'base');
    const m = (role: Role) => b.map((r) => r.pts[role]).filter((x) => !Number.isNaN(x));
    const mi = mean(m('inocente'));
    const mc = mean(m('culpable'));
    const ma = n >= 6 ? mean(m('complice')) : 0;
    const acc = n >= 6 ? 1 : 0;
    const perRound = (mc + acc * ma + (n - 1 - acc) * mi) / n;
    return [String(n), meanCI(m('inocente')), meanCI(m('culpable')), n >= 6 ? meanCI(m('complice')) : 'n/a', pct(mean(col(b, (r) => r.cv))), (5 * perRound).toFixed(2)];
  }),
);

P('### 2.3 Objetivos secretos');
P();
P('La misma ronda con y sin objetivos. Los bots no los persiguen: solo se mide lo que se cumple de paso y cuánto cambian los puntos. Que alguien los persiga a propósito (y mienta para ello) solo se puede medir con personas.');
P();
table(
  ['Jugadores', 'Grupo acusa: con − sin objetivos', 'Inocente: puntos con / sin', 'Culpable: con / sin', 'Cómplice: con / sin'],
  SIZES.map((n) => {
    const e = encargo.get(n)!;
    const pr = (role: Role) => (e.pts[role].length ? `${mean(e.pts[role]).toFixed(2)} / ${mean(e.ptsOff[role]).toFixed(2)}` : 'n/a');
    return [String(n), paired(e.caughtOn, caught(n, 'base')).text, pr('inocente'), pr('culpable'), pr('complice')];
  }),
);
{
  const kinds = new Map<string, number[]>();
  for (const n of SIZES) for (const [k, xs] of encargo.get(n)!.kinds) (kinds.get(k) ?? kinds.set(k, []).get(k)!).push(...xs);
  table(
    ['Objetivo', 'Papel', 'Cumplido sin buscarlo (todos los tamaños)'],
    [...kinds.entries()].sort().map(([k, xs]) => [...k.split('|'), `${rate(xs)} (n=${xs.length})`]),
  );
}

P('### 2.4 Cuánto cambian una decisión las pruebas y los testimonios');
P();
P('Misma ronda; los bots ignoran una fuente. «Cambia el acusado» cuenta las rondas en que la persona acusada (o que no se acuse a nadie) es distinta: mide cuántas decisiones dependen de esa fuente, no solo si mejora el acierto.');
P();
table(
  ['Jugadores', 'Sin pruebas: Δ acierto', 'Sin pruebas: cambia el acusado', 'Sin testimonios: Δ acierto', 'Sin testimonios: cambia el acusado', 'Sin ninguna: Δ acierto', 'Sin ninguna: cambia el acusado'],
  SIZES.map((n) => {
    const b = caught(n, 'base');
    const c = (k: string) => [paired(caught(n, k), b).text, pct(mean(col(get(n, k), (r) => r.chg)))];
    return [String(n), ...c('sin-pruebas'), ...c('sin-testimonios'), ...c('sin-nada')];
  }),
);
P('Solo con la estrategia «mínimo» (el culpable dice la verdad a las horas de las pruebas):');
P();
table(
  ['Jugadores', 'Con todo', 'Sin pruebas: Δ acierto', 'Sin testimonios: Δ acierto', 'Sin ninguna: Δ acierto'],
  SIZES.map((n) => {
    const b = caught(n, 'base|minimo');
    return [String(n), pct(mean(b)), ...['sin-pruebas', 'sin-testimonios', 'sin-nada'].map((k) => paired(caught(n, `${k}|minimo`), b).text)];
  }),
);

P('### 2.5 ¿Hay una estrategia dominante para el culpable? Depende de cómo lea la mesa las pruebas');
P();
P('Filas: estrategia de declaración del culpable. Columnas: cuánto rebaja la sospecha que alguien NO encaje con una prueba (0,5 = la mesa cree que el culpable no suele mentir a esas horas, como en la fase 5; 0 = no cuenta; −0,5 = la mesa sospecha de quien no encaja). Celda: grupo acusa al culpable.');
P();
for (const n of SIZES) {
  const val = (s: CulpritStrategy, wt: number) => mean(caught(n, `peso${wt}|${s}`));
  table(
    [`${n} jug.`, ...WEIGHTS.map((w) => `peso ${w}`), 'Peor caso para el grupo'],
    STRATS.map((s) => [s, ...WEIGHTS.map((wt) => rate(caught(n, `peso${wt}|${s}`))), pct(Math.max(...WEIGHTS.map((wt) => val(s, wt))))]),
  );
  // Juego de suma cero: el culpable elige estrategia, la mesa elige cómo leer las pruebas.
  const maximin = Math.max(...WEIGHTS.map((wt) => Math.min(...STRATS.map((s) => val(s, wt)))));
  const bestW = WEIGHTS.find((wt) => Math.min(...STRATS.map((s) => val(s, wt))) === maximin)!;
  const minimax = Math.min(...STRATS.map((s) => Math.max(...WEIGHTS.map((wt) => val(s, wt)))));
  const bestS = STRATS.find((s) => Math.max(...WEIGHTS.map((wt) => val(s, wt))) === minimax)!;
  P(
    `- ${n} jug.: lo mejor que puede garantizarse el grupo es ${pct(maximin)} (lectura de pruebas con peso ${bestW}); lo mejor que puede garantizarse el culpable es dejar al grupo en ${pct(minimax)} (estrategia ${bestS}). ${Math.abs(maximin - minimax) < 1e-9 ? 'Coinciden: hay equilibrio con estrategias puras.' : 'No coinciden: no hay una estrategia pura dominante; el mejor plan de cada bando depende del otro.'}`,
  );
  P();
}

P('### 2.6 Casos extremos y decisiones con poco peso');
P();
table(
  ['Jugadores', 'Inocentes con un único favorito', '…y es el culpable', 'Sospechosos posibles al empezar (de N−1)', 'Sospechosos posibles al votar', 'Voto decisivo: inocente', 'Voto decisivo: culpable', 'Voto decisivo: cómplice'],
  SIZES.map((n) => {
    const b = get(n, 'base');
    const pv = pivotal.get(n)!;
    const pr = (role: Role) => (pv[role][1] ? pct(pv[role][0] / pv[role][1]) : 'n/a');
    return [String(n), pct(mean(col(b, (r) => (r.fT === 1 ? 1 : 0)))), pct(mean(col(b, (r) => r.sole))), mean(col(b, (r) => r.eF)).toFixed(2), mean(col(b, (r) => r.fF)).toFixed(2), pr('inocente'), pr('culpable'), pr('complice')];
  }),
);
P('«Voto decisivo»: proporción de votos que, cambiados a otra persona, cambiarían el resultado de la primera votación (acusado, desempate o nadie). «Sospechosos posibles»: personas que la lógica de un inocente aún no ha descartado, de media; al empezar la investigación solo hay declaraciones y la prueba 1.');
P();

// C · informante
P('## 3. Variantes del Informante');
P();
P('Definiciones completas en `docs/INFORMANTE-evaluacion.md`. En todas, el motor reparte la ronda igual y la puntuación no cambia; el informante y su dato se sortean con un flujo de azar propio, el mismo para todas las variantes (el informante es la misma persona en todas las celdas de una ronda).');
P();
P('Estrategias simuladas:');
P();
P('- **Informante**: lo cuenta al empezar (*lo cuenta*); solo lo cuenta si alguien finge serlo (*solo si alguien finge*); no lo cuenta nunca y solo lo usa para su voto (*nunca lo cuenta*).');
P('- **Bando culpable**: nunca finge; el culpable replica en cuanto el informante habla, «confirmando» a la misma persona (*culpable replica*); el culpable se adelanta y dice ser el informante antes que nadie (*culpable se adelanta*); la cómplice dice ser el informante y «confirma» al culpable (*cómplice encubre*, solo desde 6).');
P('- **Mesa**: lógica (usa las afirmaciones con las reglas de la variante y sabe que los inocentes no fingen); crédula (cree la primera afirmación); escéptica (ignora todas); mixta (cada inocente es de un tipo, al azar).');
P();
for (const v of VARIANTS) {
  P(`### ${v.name}`);
  P();
  for (const n of SIZES) {
    const ev = evilFor(n);
    const b = caught(n, 'base');
    const cell = (inf: InformantPolicy, e: EvilPolicy) => caught(n, `${v.key}|${inf}|${e}|logica`);
    table(
      [`${n} jug. (base ${pct(mean(b))})`, ...ev.map((e) => EVIL_NAME[e])],
      INF.map((inf) => [INF_NAME[inf], ...ev.map((e) => `${pct(mean(cell(inf, e)))} (${paired(cell(inf, e), b).text})`)]),
    );
    const val = (inf: InformantPolicy, e: EvilPolicy) => mean(cell(inf, e));
    const maximin = Math.max(...INF.map((i) => Math.min(...ev.map((e) => val(i, e)))));
    const bestI = INF.find((i) => Math.min(...ev.map((e) => val(i, e))) === maximin)!;
    const minimax = Math.min(...ev.map((e) => Math.max(...INF.map((i) => val(i, e)))));
    const bestE = ev.find((e) => Math.max(...INF.map((i) => val(i, e))) === minimax)!;
    // ¿Alguna estrategia del informante es la mejor (o empatada dentro del ruido) contra todo?
    const dominantI = INF.filter((i) => ev.every((e) => INF.every((j) => j === i || !(paired(cell(j, e), cell(i, e)).lo > 0))));
    const dominantE = ev.filter((e) => INF.every((i) => ev.every((f) => f === e || !(paired(cell(i, e), cell(i, f)).lo > 0))));
    P(
      `- Valor garantizado: informante «${INF_NAME[bestI]}» asegura ${pct(maximin)}; el bando culpable con «${EVIL_NAME[bestE]}» lo deja como mucho en ${pct(minimax)}${Math.abs(maximin - minimax) < 1e-9 ? ' (equilibrio con estrategias puras)' : ''}. ` +
        `Estrategia del informante que nunca es peor que otra (dentro del IC): ${dominantI.length ? dominantI.map((i) => `«${INF_NAME[i]}»`).join(', ') : 'ninguna'}. ` +
        `Del bando culpable: ${dominantE.length ? dominantE.map((e) => `«${EVIL_NAME[e]}»`).join(', ') : 'ninguna'}.`,
    );
    const nat = get(n, `${v.key}|revela|nunca|logica`);
    P(
      `- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en ${pct(mean(col(nat, (r) => r.chg)))} de las rondas; ` +
        `sospechosos posibles al empezar ${mean(col(nat, (r) => r.eF)).toFixed(2)} (base ${mean(col(get(n, 'base'), (r) => r.eF)).toFixed(2)}); ` +
        `inocentes cuyo único favorito es el culpable ${pct(mean(col(nat, (r) => r.sole)))} (base ${pct(mean(col(get(n, 'base'), (r) => r.sole)))}).`,
    );
    const fakeCells = ev.filter((e) => e !== 'nunca').flatMap((e) => INF.map((i) => get(n, `${v.key}|${i}|${e}|logica`)));
    const withFake = fakeCells.flat().filter((r) => r.fk > 0);
    if (withFake.length) {
      P(`- Cuando alguien finge ser el informante: se acusa a quien finge en ${pct(mean(col(withFake, (r) => r.fA)))} de esas rondas; se acusa al informante real en ${pct(mean(col(withFake, (r) => r.iA)))}.`);
    }
    if (v.rules.existence === 'incierta') P(`- Rondas con informante: ${pct(mean(col(nat, (r) => r.iE)))}.`);
    P();
  }
  P(`**Actitud de la mesa** (${v.key}): grupo acusa al culpable, diferencia con la mesa lógica en la misma ronda.`);
  P();
  table(
    ['Jugadores', 'Informante / bando culpable', 'Lógica', 'Crédula', 'Escéptica', 'Mixta'],
    SIZES.flatMap((n) =>
      PROFILES(n).map(([inf, ev]) => {
        const l = caught(n, `${v.key}|${inf}|${ev}|logica`);
        return [String(n), `${INF_NAME[inf]} / ${EVIL_NAME[ev]}`, pct(mean(l)), ...TRUSTS.map((t) => `${pct(mean(caught(n, `${v.key}|${inf}|${ev}|${t}`)))} (${paired(caught(n, `${v.key}|${inf}|${ev}|${t}`), l).text})`)];
      }),
    ),
  );
}

P('## 4. Resumen: valor garantizado de cada variante');
P();
P('Para cada variante y tamaño, el porcentaje que el grupo se asegura con su mejor estrategia del informante cuando el bando culpable responde con la suya (mesa lógica), frente al juego base. Es la cifra que no depende de suponer que el bando culpable juega mal.');
P();
table(
  ['Variante', ...SIZES.map((n) => `${n} jug.`)],
  [
    ['Juego base', ...SIZES.map((n) => pct(mean(caught(n, 'base'))))],
    ...VARIANTS.map((v) => [
      v.name,
      ...SIZES.map((n) => {
        const ev = evilFor(n);
        const val = (i: InformantPolicy, e: EvilPolicy) => mean(caught(n, `${v.key}|${i}|${e}|logica`));
        const maximin = Math.max(...INF.map((i) => Math.min(...ev.map((e) => val(i, e)))));
        return `${pct(maximin)} (${((100 * (maximin - mean(caught(n, 'base')))) >= 0 ? '+' : '−') + Math.abs(100 * (maximin - mean(caught(n, 'base')))).toFixed(1)} pp)`;
      }),
    ]),
  ],
);
P('Puntos por persona y ronda con la variante libre («lo cuenta», «nunca finge») frente a la base:');
P();
table(
  ['Jugadores', 'Inocente base → variante', 'Culpable base → variante', 'Cómplice base → variante'],
  SIZES.map((n) => {
    const b = get(n, 'base');
    const v = get(n, 'libre|revela|nunca|logica');
    const m = (rs: Rec[], role: Role) => mean(rs.map((r) => r.pts[role]).filter((x) => !Number.isNaN(x))).toFixed(2);
    return [String(n), `${m(b, 'inocente')} → ${m(v, 'inocente')}`, `${m(b, 'culpable')} → ${m(v, 'culpable')}`, n >= 6 ? `${m(b, 'complice')} → ${m(v, 'complice')}` : 'n/a'];
  }),
);
process.stderr.write(`Tiempo de cálculo: ${((Date.now() - started) / 1000).toFixed(0)} s\n`);
console.log(out.join('\n'));
