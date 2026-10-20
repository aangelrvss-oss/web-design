// Fase 7 · informe reproducible (Markdown por la salida estándar) de las tres mecánicas candidatas y
// del «Testigo de una hora» de la fase 6, sobre las mismas rondas.
//
//   npx tsx scripts/experimentos/mecanicas/informe.ts           # 1500 rondas por tamaño
//   npx tsx scripts/experimentos/mecanicas/informe.ts 200       # rápido
//
// Semillas fijas `f7-{jugadores}-{i}`; la estrategia de declaración del culpable rota con i. Todas
// las celdas de una ronda comparten noche, declaraciones, testimonios, pruebas y desempate de mesa.
// Bots, no personas: ver docs/MECANICAS-propuesta.md, sección «Qué se puede simular».

import type { CulpritStrategy } from '../../sim/core';
import type { Role } from '../../../src/shared/types';
import type { VariantRules } from '../informante/modelo';
import { prepare, resolveCell, type EvilPolicy, type InformantPolicy, type Prepared } from '../informante/ronda';
import { decisionWeight, solveZeroSum, type Equilibrium } from './equilibrio';
import {
  resolveM1,
  resolveM2,
  resolveM3,
  type M1Culprit,
  type M1Peritaje,
  type M1Trust,
  type M2Culprit,
  type M2Innocent,
  type M2Table,
  type M3Evil,
  type MechResult,
} from './mecanicas';

const R = Number(process.argv[2] ?? 1500);
const SIZES = [4, 5, 6, 10];
const STRATS: CulpritStrategy[] = ['minimo', 'esquiva', 'total'];
const started = Date.now();

// ───────────────────────────── estrategias ─────────────────────────────

const HORA: VariantRules = { existence: 'cierta', target: 'cualquiera', info: 'hora', mutual: false };
const F_ROWS: InformantPolicy[] = ['revela', 'reacciona', 'calla'];
const F_COLS = (n: number): EvilPolicy[] => (n >= 6 ? ['nunca', 'reactivo', 'preventivo', 'encubre'] : ['nunca', 'reactivo', 'preventivo']);
const M1_ROWS: [M1Peritaje, M1Trust][] = (['e1', 'e2', 'coherencia'] as M1Peritaje[]).flatMap((a) => (['confiada', 'prudente', 'desconfiada'] as M1Trust[]).map((b) => [a, b] as [M1Peritaje, M1Trust]));
const M1_COLS: M1Culprit[] = ['no', 'f1', 'f2', 'f2p'];
const M2_ROWS: [M2Innocent, M2Table][] = [
  ['propia', 'literal'],
  ['propia', 'suspicaz'],
  ['caza', 'literal'],
  ['caza', 'suspicaz'],
];
const M2_COLS: M2Culprit[] = ['caza', 'minima'];
const M2B_ROWS: M2Innocent[] = ['caza', 'concurrida'];
const M3_THETAS = [-1, 0.5, 1, 1.5];
const M3_COLS: M3Evil[] = ['nunca', 'si-peligro'];

// ───────────────────────────── estadística ─────────────────────────────

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const pct = (x: number) => `${(100 * x).toFixed(1)} %`;
function ci(d: number[]) {
  const m = mean(d);
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, d.length - 1));
  return { m, h: (1.96 * sd) / Math.sqrt(d.length) };
}
const pp = (d: number[]) => {
  const { m, h } = ci(d);
  const f = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(100 * x).toFixed(1)}`;
  return `${f(m)} pp [${f(m - h)}, ${f(m + h)}]`;
};
const wilson = (k: number, n: number) => {
  const z = 1.96;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return `${(100 * p).toFixed(1)} % [${(100 * (c - h)).toFixed(1)}–${(100 * (c + h)).toFixed(1)}]`;
};

// ───────────────────────────── ejecución ─────────────────────────────

interface Cellrec {
  c: number;
  decoy: number;
  arch: number;
  nadie: number;
  inn: number;
  cul: number;
  com: number;
  feas: number;
  x: Record<string, number>;
}
const fromMech = (r: MechResult): Cellrec => ({
  c: +r.caught,
  decoy: +r.decoyAccused,
  arch: +r.archived,
  nadie: +(r.outcome === 'nadie'),
  inn: r.points.inocente,
  cul: r.points.culpable,
  com: r.points.complice,
  feas: r.finalFeasible,
  x: r.extra,
});

type Grid = Cellrec[][][]; // [fila][columna][ronda]
interface SizeData {
  base: Cellrec[];
  F: Grid;
  M1: Grid;
  M2: Grid;
  M2b: Grid;
  M3: Grid;
}
const data = new Map<number, SizeData>();
let blocked = 0;
let unsound = 0;
const grid = (r: number, c: number): Grid => Array.from({ length: r }, () => Array.from({ length: c }, () => [] as Cellrec[]));

for (const n of SIZES) {
  const d: SizeData = { base: [], F: grid(F_ROWS.length, F_COLS(n).length), M1: grid(M1_ROWS.length, M1_COLS.length), M2: grid(M2_ROWS.length, M2_COLS.length), M2b: grid(M2B_ROWS.length, M2_COLS.length), M3: grid(M3_THETAS.length, M3_COLS.length) };
  for (let i = 0; i < R; i++) {
    let p: Prepared;
    try {
      p = prepare({ n, seed: `f7-${n}-${i}`, strategy: STRATS[i % 3] });
    } catch {
      blocked++;
      continue;
    }
    const b = resolveCell(p);
    const pts = (role: Role) => (b.roleCount[role] ? b.points[role] / b.roleCount[role] : NaN);
    d.base.push({ c: +b.caught, decoy: +(!!b.accused && p.decoys.includes(b.accused)), arch: 0, nadie: +(b.accused === null), inn: pts('inocente'), cul: pts('culpable'), com: pts('complice'), feas: b.finalFeasible, x: {} });
    F_ROWS.forEach((inf, ri) =>
      F_COLS(n).forEach((ev, ci2) => {
        const r = resolveCell(p, { rules: HORA, informant: inf, evil: ev, trust: 'logica' });
        const q = (role: Role) => (r.roleCount[role] ? r.points[role] / r.roleCount[role] : NaN);
        d.F[ri][ci2].push({ c: +r.caught, decoy: +(!!r.accused && p.decoys.includes(r.accused)), arch: 0, nadie: +(r.accused === null), inn: q('inocente'), cul: q('culpable'), com: q('complice'), feas: r.finalFeasible, x: { fake: r.fakeClaims, fakeAccused: +r.fakeClaimerAccused } });
      }),
    );
    M1_ROWS.forEach(([per, trust], ri) => M1_COLS.forEach((cul, ci2) => d.M1[ri][ci2].push(fromMech(resolveM1(p, cul, per, trust)))));
    M2_ROWS.forEach(([inn, mesa], ri) => M2_COLS.forEach((cul, ci2) => d.M2[ri][ci2].push(fromMech(resolveM2(p, inn, cul, mesa)))));
    M2B_ROWS.forEach((inn, ri) => M2_COLS.forEach((cul, ci2) => d.M2b[ri][ci2].push(fromMech(resolveM2(p, inn, cul, 'literal', 'ajena')))));
    M3_THETAS.forEach((th, ri) => M3_COLS.forEach((ev, ci2) => d.M3[ri][ci2].push(fromMech(resolveM3(p, th, ev)))));
    // Corrección: en la ronda base, ningún inocente descarta por lógica al culpable verdadero.
    for (const v of p.innocents) {
      const t = p.table.get(v)!;
      if (t.accomplices(p.culprit).every((a) => t.cost(p.culprit, a) === Infinity)) unsound++;
    }
  }
  data.set(n, d);
  process.stderr.write(`${n} jugadores: ${R} rondas (${((Date.now() - started) / 1000).toFixed(0)} s)\n`);
}

// ───────────────────────────── análisis ─────────────────────────────

const matrix = (g: Grid, f: (r: Cellrec) => number = (r) => r.c) => g.map((row) => row.map((cell) => mean(cell.map(f))));
/** Diferencia emparejada entre el valor de equilibrio (mezcla) y la base, ronda a ronda. */
function eqDiff(g: Grid, eq: Equilibrium, base: Cellrec[]) {
  return base.map((b, k) => {
    let v = 0;
    g.forEach((row, i) => row.forEach((cell, j) => (v += eq.rows[i] * eq.cols[j] * cell[k].c)));
    return v - b.c;
  });
}
const mixText = (labels: string[], w: number[]) =>
  labels
    .map((l, i) => [l, w[i]] as [string, number])
    .filter(([, x]) => x >= 0.02)
    .sort((a, b) => b[1] - a[1])
    .map(([l, x]) => `${l} ${Math.round(100 * x)} %`)
    .join(', ');
const support = (w: number[]) => w.filter((x) => x >= 0.05).length;
/** Media de una magnitud bajo la mezcla de equilibrio. */
const eqMean = (g: Grid, eq: Equilibrium, f: (r: Cellrec) => number) => {
  let v = 0;
  g.forEach((row, i) => row.forEach((cell, j) => (v += eq.rows[i] * eq.cols[j] * mean(cell.map(f).filter((x) => !Number.isNaN(x))))));
  return v;
};

const out: string[] = [];
const P = (s = '') => out.push(s);
const table = (head: string[], rows: string[][]) => {
  P(`| ${head.join(' | ')} |`);
  P(`| ${head.map(() => '---').join(' | ')} |`);
  for (const r of rows) P(`| ${r.join(' | ')} |`);
  P();
};

P('# Mecánicas candidatas: datos del experimento aislado (fase 7)');
P();
P(`Generado con \`npx tsx scripts/experimentos/mecanicas/informe.ts ${R}\`: ${R} rondas por tamaño, semillas \`f7-{jugadores}-{i}\`, motor real, estrategia de declaración del culpable rotando (mínimo, esquiva, total). Cada ronda se resuelve con todas las combinaciones de estrategias de cada mecánica sobre copias del mismo estado: las comparaciones son emparejadas.`);
P();
P('**Bots, no personas.** Las tasas miden qué permite deducir la información a una mesa disciplinada con estrategias fijas. No miden diversión, comprensión, faroles hablados ni ritmo. La interpretación está en `docs/MECANICAS-propuesta.md`.');
P();
P(`Comprobaciones: rondas bloqueadas o inválidas: **${blocked}**. Veces que un bot inocente descartó por lógica al culpable verdadero en la ronda base (debe ser 0): **${unsound}**.`);
P();
P('**Cómo leer el equilibrio.** Cada mecánica es un juego entre el grupo (filas) y el bando culpable (columnas) con la tasa de acierto del grupo como resultado. El equilibrio dice qué mezcla de estrategias le conviene a cada bando cuando el otro también juega lo mejor posible. Si un bando mezcla varias opciones, su decisión no tiene una respuesta fija: hay farol. «Peso de la decisión» es cuánto cambia el acierto entre la mejor y la peor opción de ese bando contra la mezcla del rival: cerca de 0 significa que la decisión no importa.');
P();

const summary: Record<string, string[]> = {};
const addSummary = (key: string, cell: string) => (summary[key] ??= []).push(cell);

for (const n of SIZES) {
  const d = data.get(n)!;
  const base = d.base;
  P(`## ${n} jugadores`);
  P();
  P(`Base: grupo acusa al culpable ${wilson(base.reduce((s, r) => s + r.c, 0), base.length)}; se acusa a un señuelo ${pct(mean(base.map((r) => r.decoy)))}; sospechosos posibles al votar ${mean(base.map((r) => r.feas)).toFixed(2)}.`);
  P();
  addSummary('Juego base', pct(mean(base.map((r) => r.c))));

  const zeroSum = (key: string, name: string, g: Grid, rowLabels: string[], colLabels: string[]) => {
    const m = matrix(g);
    const eq = solveZeroSum(m);
    const w = decisionWeight(m, eq);
    P(`### ${name}`);
    P();
    table([`Grupo \\ bando culpable`, ...colLabels], m.map((row, i) => [rowLabels[i], ...row.map((x) => pct(x))]));
    const diff = eqDiff(g, eq, base);
    P(`- Equilibrio: el grupo acierta ${pct((eq.lower + eq.upper) / 2)} (cotas ${pct(eq.lower)}–${pct(eq.upper)}); frente a la base, ${pp(diff)}.`);
    P(`- Mezcla del grupo: ${mixText(rowLabels, eq.rows)}. Mezcla del bando culpable: ${mixText(colLabels, eq.cols)}.`);
    P(`- Peso de la decisión: grupo ${(100 * w.group).toFixed(1)} pp, bando culpable ${(100 * w.evil).toFixed(1)} pp.`);
    P(`- En equilibrio: se acusa a un señuelo ${pct(eqMean(g, eq, (r) => r.decoy))}; puntos por ronda inocente ${eqMean(g, eq, (r) => r.inn).toFixed(2)}, culpable ${eqMean(g, eq, (r) => r.cul).toFixed(2)}; sospechosos posibles al votar ${eqMean(g, eq, (r) => r.feas).toFixed(2)}.`);
    addSummary(key, `${pct((eq.lower + eq.upper) / 2)} (${ci(diff).m >= 0 ? '+' : '−'}${Math.abs(100 * ci(diff).m).toFixed(1)} pp) · mezcla ${support(eq.rows)}/${support(eq.cols)} · peso ${(100 * w.group).toFixed(0)}/${(100 * w.evil).toFixed(0)} pp`);
    return { m, eq };
  };

  zeroSum('F · Testigo de una hora', 'F · Testigo de una hora (referencia, fase 6)', d.F, F_ROWS.map((x) => ({ revela: 'lo cuenta', reacciona: 'solo si alguien finge', calla: 'nunca lo cuenta' })[x]), F_COLS(n).map((x) => ({ nunca: 'nunca finge', reactivo: 'culpable replica', preventivo: 'culpable se adelanta', encubre: 'cómplice encubre' })[x]));

  zeroSum('M1 · Prueba falsificable', 'M1 · Prueba falsificable', d.M1, M1_ROWS.map(([a, b]) => `peritaje ${a === 'coherencia' ? 'a la que menos encaja' : a === 'e1' ? 'prueba 1' : 'prueba 2'}, mesa ${b}`), ['no falsifica', 'falsifica la 1 (al azar)', 'falsifica la 2 (al azar)', 'falsifica la 2 (lugar concurrido)']);
  {
    const fakes = d.M1.flatMap((row) => row.slice(1).flat());
    const coh = d.M1.filter((_, i) => M1_ROWS[i][0] === 'coherencia').flatMap((row) => row.slice(1).flat());
    P(`- Cuando el culpable falsifica: el peritaje descubre la falsa en ${pct(mean(fakes.map((r) => r.x.fakeCaught)))} de los casos (${pct(mean(coh.map((r) => r.x.fakeCaught)))} si la mesa perita «la que menos encaja»).`);
    P();
  }

  zeroSum('M2 · Registro en la defensa', 'M2 · Registro en la defensa', d.M2, M2_ROWS.map(([a, b]) => `inocente registra ${a === 'propia' ? 'su lugar' : 'el de su sospechoso'}, mesa ${b}`), ['culpable «caza»', 'culpable registra el lugar con menos gente']);
  {
    const all = d.M2.flat(2);
    P(`- Hay defensa en ${pct(mean(all.map((r) => r.x.defense)))} de las rondas; defiende la persona culpable en ${pct(mean(all.map((r) => r.x.defenderCulprit)))}; el registro descubre un desajuste en ${pct(mean(all.map((r) => r.x.mismatch)))}.`);
    const own = d.M2[0][0];
    const byDef = (f: (r: Cellrec) => boolean) => own.filter(f);
    P(`- Con «inocente registra su lugar», mesa literal: grupo acierta ${pct(mean(byDef((r) => r.x.defenderCulprit === 1).map((r) => r.c)))} cuando defiende el culpable y ${pct(mean(byDef((r) => r.x.defenderInnocent === 1).map((r) => r.c)))} cuando defiende un inocente (base en esas mismas rondas: ${pct(mean(base.filter((_, k) => own[k].x.defenderCulprit === 1).map((r) => r.c)))} y ${pct(mean(base.filter((_, k) => own[k].x.defenderInnocent === 1).map((r) => r.c)))}).`);
    P();
  }

  zeroSum('M2b · Registro en la defensa, solo un lugar ajeno', 'M2b · Registro en la defensa, solo un lugar que no sea el propio', d.M2b, M2B_ROWS.map((a) => (a === 'caza' ? 'inocente registra el lugar de su sospechoso' : 'inocente registra el lugar ajeno más concurrido')), ['culpable «caza»', 'culpable registra el lugar con menos gente']);
  P();

  // M3 no es de suma cero: el archivo da puntos a los dos bandos.
  {
    P('### M3 · Archivar el caso (cambia la puntuación de la variante: no es de suma cero)');
    P();
    const label = (th: number) => (th < 0 ? 'nunca archiva' : `archiva si su ventaja < ${th}`);
    const rows: string[][] = [];
    M3_THETAS.forEach((th, i) =>
      M3_COLS.forEach((ev, j) => {
        const cell = d.M3[i][j];
        const wrong = mean(cell.map((r) => +(r.c === 0 && r.arch === 0 && r.nadie === 0)));
        const archVotes = cell.reduce((s, r) => s + (r.x.archVotes ?? 0), 0);
        const archEvil = cell.reduce((s, r) => s + (r.x.archVotesEvil ?? 0), 0);
        rows.push([
          label(th),
          ev === 'nunca' ? 'nunca empuja a archivar' : 'empuja a archivar si está en peligro',
          pct(mean(cell.map((r) => r.c))),
          pct(mean(cell.map((r) => r.arch))),
          pct(wrong),
          mean(cell.map((r) => r.inn)).toFixed(2),
          mean(cell.map((r) => r.cul)).toFixed(2),
          archVotes ? pct(archEvil / archVotes) : '—',
        ]);
      }),
    );
    table(['Grupo', 'Bando culpable', 'Acusan al culpable', 'Archivado', 'Acusan a un inocente', 'Puntos inocente', 'Puntos culpable', 'Votos de archivo del bando culpable'], rows);
    const inn = matrix(d.M3, (r) => r.inn);
    const cul = matrix(d.M3, (r) => r.cul);
    const nash: string[] = [];
    M3_THETAS.forEach((th, i) =>
      M3_COLS.forEach((ev, j) => {
        const rowBest = inn.every((row) => row[j] <= inn[i][j] + 1e-9);
        const colBest = cul[i].every((x) => x <= cul[i][j] + 1e-9);
        if (rowBest && colBest) nash.push(`${label(th)} / ${ev}`);
      }),
    );
    P(`- Equilibrios con estrategias puras (cada bando maximiza sus propios puntos): ${nash.join('; ') || 'ninguno'}.`);
    const bestTh = M3_THETAS[inn.map((row) => Math.min(...row)).indexOf(Math.max(...inn.map((row) => Math.min(...row))))];
    P(`- Mejor umbral para los inocentes en el peor caso: ${label(bestTh)}.`);
    P();
    const iBest = M3_THETAS.indexOf(bestTh);
    const jWorst = inn[iBest].indexOf(Math.min(...inn[iBest]));
    addSummary('M3 · Archivar el caso', `${pct(mean(d.M3[iBest][jWorst].map((r) => r.c)))} acusan al culpable, ${pct(mean(d.M3[iBest][jWorst].map((r) => r.arch)))} archivado · umbral ${bestTh < 0 ? 'nunca' : bestTh}`);
  }
}

P('## Resumen');
P();
P('Valor de equilibrio (acierto del grupo) y diferencia emparejada con la base; «mezcla g/c» es cuántas estrategias usa cada bando con al menos un 5 %; «peso g/c» es el peso de la decisión de cada bando. En M3, el resultado con el mejor umbral de los inocentes y la peor respuesta del bando culpable.');
P();
table(['Mecánica', ...SIZES.map((n) => `${n} jug.`)], Object.entries(summary).map(([k, v]) => [k, ...v]));
process.stderr.write(`Tiempo: ${((Date.now() - started) / 1000).toFixed(0)} s\n`);
console.log(out.join('\n'));
