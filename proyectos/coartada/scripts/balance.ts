// Balance audit: thousands of seeded rounds through the real engine (scripts/sim/core.ts), with
// 95% intervals, information ablations and the experimental variants compared round by round
// against the same seeds. Prints Markdown.
//
//   npm run balance                 # 2000 rounds per cell (reproducible: same seeds every run)
//   npm run balance -- 500          # quicker, wider intervals
//
// Bots are NOT humans (see scripts/sim/core.ts). Read every number as "what the information in a
// round allows a fixed, honest deduction to do", never as "how a real table will play".

import { playRound, type CulpritStrategy, type RoundOptions, type RoundResult, type Variant } from './sim/core';
import { PACE_TIMINGS, timingsFor, type Pace } from '../src/shared/types';

const N = Number(process.argv[2] ?? 2000);
const SIZES = [4, 5, 6, 7, 8, 10];
const KEY_SIZES = [4, 5, 6, 10];
const STRATEGIES: CulpritStrategy[] = ['minimo', 'esquiva', 'total'];
let blocked = 0;

/** 95% Wilson interval for a proportion, as "52.3% [50.1–54.5]". */
function wilson(k: number, n: number): string {
  if (n === 0) return 'n/a';
  const z = 1.96;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return `${(100 * p).toFixed(1)}% [${(100 * Math.max(0, c - h)).toFixed(1)}–${(100 * Math.min(1, c + h)).toFixed(1)}]`;
}
/** Mean with a 95% normal interval, as "1.23 ±0.04". */
function meanCI(xs: number[], digits = 2): string {
  const n = xs.length;
  const m = xs.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, n - 1));
  return `${m.toFixed(digits)} ±${((1.96 * sd) / Math.sqrt(n)).toFixed(digits)}`;
}
/** Paired difference in percentage points (variant − base, same seeds), with a 95% interval. */
function pairedDiff(a: boolean[], b: boolean[]): { text: string; lo: number; hi: number; mean: number } {
  if (a.length !== b.length) throw new Error(`unpaired samples: ${a.length} vs ${b.length}`);
  const d = a.map((x, i) => Number(x) - Number(b[i]));
  const n = d.length;
  const m = d.reduce((s, x) => s + x, 0) / n;
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, n - 1));
  const h = (1.96 * sd) / Math.sqrt(n);
  const f = (x: number) => `${x >= 0 ? '+' : ''}${(100 * x).toFixed(1)}`;
  return { text: `${f(m)} pp [${f(m - h)}, ${f(m + h)}]`, lo: m - h, hi: m + h, mean: m };
}

function run(base: Omit<RoundOptions, 'seed'>, tag: string): RoundResult[] {
  const out: RoundResult[] = [];
  for (let i = 0; i < N; i++) {
    try {
      out.push(playRound({ ...base, seed: `${tag}-${base.n}-${base.strategy}-${i}` }));
    } catch {
      blocked++;
    }
  }
  return out;
}
const count = (rs: RoundResult[], f: (r: RoundResult) => boolean) => rs.filter(f).length;
const caught = (rs: RoundResult[]) => count(rs, (r) => r.caught);
const line = (cells: (string | number)[]) => console.log(`| ${cells.join(' | ')} |`);

console.log(`# Auditoría de equilibrio: datos de simulación\n`);
console.log(`Generado con \`npm run balance -- ${N}\`: ${N} rondas por celda, semillas fijas \`{bloque}-{jugadores}-{estrategia}-{i}\`, motor real.`);
console.log('Los intervalos son del 95 % (Wilson para porcentajes; normal para medias y diferencias emparejadas).');
console.log('Bots, no personas: publican solo recuerdos ciertos que no les perjudican, deducen con una fórmula fija y no cambian de idea tras la defensa.\n');

// ── 1. Base: who wins, by size and culprit strategy.
console.log('## 1. Juego base: quién gana\n');
console.log('Estrategias del culpable: **mínimo** (solo miente a la hora del incidente), **esquiva** (miente además a una de las horas de las pruebas), **total** (miente a las tres horas).\n');
line(['Jugadores', 'Estrategia', 'Grupo acusa al culpable', 'Nadie acusado', 'Acusan al cómplice', 'Desempate', 'Favoritos empatados del bot inocente', 'El bot tiene un único favorito']);
line(['---', '---', '---', '---', '---', '---', '---', '---']);
const baseRuns: Record<string, RoundResult[]> = {};
for (const n of SIZES) {
  for (const strategy of STRATEGIES) {
    const rs = run({ n, strategy }, 'base');
    baseRuns[`${n}-${strategy}`] = rs;
    line([
      n,
      strategy,
      wilson(caught(rs), rs.length),
      wilson(count(rs, (r) => r.nobodyAccused), rs.length),
      n >= 6 ? wilson(count(rs, (r) => r.accompliceAccused), rs.length) : 'n/a',
      wilson(count(rs, (r) => r.runoff), rs.length),
      meanCI(rs.map((r) => r.logicCandidates)),
      wilson(count(rs, (r) => r.logicCandidates === 1), rs.length),
    ]);
  }
}
console.log('\nMejor estrategia del culpable (la que más baja el porcentaje del grupo) por tamaño:\n');
for (const n of SIZES) {
  const ranked = STRATEGIES.map((s) => ({ s, p: caught(baseRuns[`${n}-${s}`]) / N })).sort((a, b) => a.p - b.p);
  const gap = pairedDiff(baseRuns[`${n}-${ranked[1].s}`].map((r) => r.caught), baseRuns[`${n}-${ranked[0].s}`].map((r) => r.caught));
  console.log(`- ${n} jugadores: **${ranked[0].s}** (${(100 * ranked[0].p).toFixed(1)} %); la siguiente, ${ranked[1].s}, da al grupo ${gap.text} más (misma noche, semillas emparejadas).`);
}

// ── 2. Table cohesion: shared hunch vs every bot on its own.
console.log('\n## 2. Mesa con criterio compartido frente a cada uno por su cuenta\n');
line(['Jugadores', 'Grupo acusa (compartido)', 'Grupo acusa (independiente)', 'Nadie acusado (indep.)', 'Desempate (indep.)']);
line(['---', '---', '---', '---', '---']);
for (const n of KEY_SIZES) {
  const shared = baseRuns[`${n}-esquiva`];
  const ind = run({ n, strategy: 'esquiva', independent: true }, 'base');
  line([n, wilson(caught(shared), shared.length), wilson(caught(ind), ind.length), wilson(count(ind, (r) => r.nobodyAccused), ind.length), wilson(count(ind, (r) => r.runoff), ind.length)]);
}
console.log('\nEstrategia del culpable: esquiva. La diferencia mide cuánto pesa ponerse de acuerdo hablando, algo que los bots no hacen y las personas sí.');

// ── 3. Points by role.
console.log('\n## 3. Puntos por papel y ronda\n');
console.log('Media de puntos por persona y ronda, con las tres estrategias del culpable mezcladas a partes iguales.\n');
line(['Jugadores', 'Inocente', 'Culpable', 'Cómplice', 'Inocente: «votó al culpable» (+1)', 'Testimonios que destapan una mentira (+1)']);
line(['---', '---', '---', '---', '---', '---']);
for (const n of SIZES) {
  const rs = STRATEGIES.flatMap((s) => baseRuns[`${n}-${s}`]);
  const per = (role: 'inocente' | 'culpable' | 'complice') => rs.filter((r) => r.roleCount[role] > 0).map((r) => r.points[role] / r.roleCount[role]);
  const correct = rs.reduce((a, r) => a + r.correctInnocentVotes, 0) / rs.reduce((a, r) => a + r.innocents, 0);
  line([n, meanCI(per('inocente')), meanCI(per('culpable')), n >= 6 ? meanCI(per('complice')) : 'n/a', `${(100 * correct).toFixed(1)} % de los votos`, meanCI(rs.map((r) => r.reasons.cazador ?? 0))]);
}
console.log('\nCon los mismos papeles repartidos al azar cada ronda, lo que importa en una partida es la media por persona a lo largo de las rondas: cada persona es culpable con probabilidad 1/N.\n');
line(['Jugadores', 'Puntos esperados por ronda de una persona cualquiera', 'De ellos, como culpable', 'Como cómplice', 'Como inocente']);
line(['---', '---', '---', '---', '---']);
for (const n of SIZES) {
  const rs = STRATEGIES.flatMap((s) => baseRuns[`${n}-${s}`]);
  const avg = (f: (r: RoundResult) => number) => rs.reduce((a, r) => a + f(r), 0) / rs.length / n;
  line([n, avg((r) => r.points.inocente + r.points.culpable + r.points.complice).toFixed(2), avg((r) => r.points.culpable).toFixed(2), avg((r) => r.points.complice).toFixed(2), avg((r) => r.points.inocente).toFixed(2)]);
}

// ── 4. Secret objectives.
console.log('\n## 4. Objetivos secretos\n');
console.log('Los bots no persiguen los objetivos: solo se mide cuántos se cumplen «de paso» y si cambian quién gana. Que una persona los persiga a propósito (mentir para cumplir «di que estuviste en…», votar con alguien) solo se puede medir con partidas reales.\n');
const encRuns = KEY_SIZES.flatMap((n) => STRATEGIES.flatMap((strategy) => run({ n, strategy, encargos: true }, 'base')));
const encBase = KEY_SIZES.flatMap((n) => STRATEGIES.flatMap((s) => baseRuns[`${n}-${s}`]));
console.log(`- Grupo acusa al culpable con objetivos: ${wilson(caught(encRuns), encRuns.length)}; sin ellos: ${wilson(caught(encBase), encBase.length)}. Diferencia emparejada: ${pairedDiff(encRuns.map((r) => r.caught), encBase.map((r) => r.caught)).text} (los objetivos no cambian la noche ni las declaraciones de los bots).`);
const kinds = new Map<string, { done: number; n: number }>();
for (const r of encRuns) for (const [kind, role, done] of r.encargos) {
  const k = `${kind}|${role}`;
  const v = kinds.get(k) ?? { done: 0, n: 0 };
  v.n++;
  if (done) v.done++;
  kinds.set(k, v);
}
console.log('\n| Objetivo | Papel | Cumplido sin buscarlo |\n|---|---|---|');
for (const [k, v] of [...kinds.entries()].sort()) {
  const [kind, role] = k.split('|');
  console.log(`| ${kind} | ${role} | ${wilson(v.done, v.n)} (n=${v.n}) |`);
}

// ── 5. Information value.
console.log('\n## 5. Valor de cada fuente de información\n');
console.log('Misma noche, mismas declaraciones; se le quita a los bots una fuente. Diferencia en el porcentaje de rondas en que el grupo acusa al culpable.\n');
line(['Jugadores', 'Estrategia', 'Con todo', 'Sin testimonios', 'Sin pruebas', 'Sin testimonios ni pruebas', 'Valor de los testimonios', 'Valor de las pruebas']);
line(['---', '---', '---', '---', '---', '---', '---', '---']);
for (const strategy of ['minimo', 'esquiva'] as CulpritStrategy[]) {
  for (const n of KEY_SIZES) {
    const all = baseRuns[`${n}-${strategy}`];
    const noT = run({ n, strategy, noTestimonies: true }, 'base');
    const noP = run({ n, strategy, noTraces: true }, 'base');
    const none = run({ n, strategy, noTestimonies: true, noTraces: true }, 'base');
    const pc = (rs: RoundResult[]) => `${((100 * caught(rs)) / rs.length).toFixed(1)}%`;
    line([n, strategy, pc(all), pc(noT), pc(noP), pc(none), pairedDiff(all.map((r) => r.caught), noT.map((r) => r.caught)).text, pairedDiff(all.map((r) => r.caught), noP.map((r) => r.caught)).text]);
  }
}
console.log('\nCon «esquiva» el culpable miente justo a la hora de una prueba: su declaración no encaja y la fórmula de los bots (que cobra cada desajuste como una mentira) se va al señuelo, el inocente que sí encaja. Es una limitación de los bots, no un defecto demostrado: una persona sospecharía precisamente de quien no encaja con una prueba.');
console.log(`\nReferencia: votar al azar a otra persona acusaría al culpable alrededor de 1/(N−1) de las veces: ${KEY_SIZES.map((n) => `${n} jug. ≈ ${(100 / (n - 1)).toFixed(0)} %`).join(', ')}.`);

// ── 6. Experimental variants.
const VARIANTS: { v: Variant; label: string }[] = [
  { v: 'informante-oculto', label: 'Informante (lo guarda para sí)' },
  { v: 'informante-publico', label: 'Informante (lo dice y la mesa le cree)' },
  { v: 'informante-farol', label: 'Informante + farol del culpable (la mesa no cree a ninguno)' },
  { v: 'chivatazo-libre', label: 'Chivatazo libre (peso 0,5)' },
  { v: 'chivatazo-verificado', label: 'Chivatazo verificado (peso 1)' },
];
console.log('\n## 6. Variantes experimentales (solo en la simulación)\n');
console.log('Cada ronda con variante es la misma ronda base (misma semilla, misma noche, mismas declaraciones) más la información de la variante. Diferencia en puntos porcentuales del porcentaje de rondas en que el grupo acusa al culpable, mezclando las tres estrategias del culpable.\n');
line(['Variante', ...KEY_SIZES.map((n) => `${n} jugadores`)]);
line(['---', ...KEY_SIZES.map(() => '---')]);
const variantRuns: Record<string, RoundResult[]> = {};
for (const { v, label } of VARIANTS) {
  const cells: string[] = [];
  for (const n of KEY_SIZES) {
    const base = STRATEGIES.flatMap((s) => baseRuns[`${n}-${s}`]);
    const rs = STRATEGIES.flatMap((strategy) => run({ n, strategy, variant: v }, 'base'));
    variantRuns[`${v}-${n}`] = rs;
    const d = pairedDiff(rs.map((r) => r.caught), base.map((r) => r.caught));
    cells.push(`${((100 * caught(rs)) / rs.length).toFixed(1)}% (${d.text})`);
  }
  line([label, ...cells]);
}
console.log(`\nPorcentaje base (sin variante), mismas semillas: ${KEY_SIZES.map((n) => `${n} jug. ${((100 * caught(STRATEGIES.flatMap((s) => baseRuns[`${n}-${s}`]))) / (3 * N)).toFixed(1)} %`).join(' · ')}.`);

console.log('\n### Sensibilidad del chivatazo al crédito que le da la mesa\n');
line(['Peso del chivatazo', ...KEY_SIZES.map((n) => `${n} jugadores`)]);
line(['---', ...KEY_SIZES.map(() => '---')]);
for (const w of [0.25, 0.5, 1, 2]) {
  for (const v of ['chivatazo-libre', 'chivatazo-verificado'] as Variant[]) {
    const cells: string[] = [];
    for (const n of KEY_SIZES) {
      const base = STRATEGIES.flatMap((s) => baseRuns[`${n}-${s}`]);
      const rs = STRATEGIES.flatMap((strategy) => run({ n, strategy, variant: v, tipWeight: w }, 'base'));
      cells.push(pairedDiff(rs.map((r) => r.caught), base.map((r) => r.caught)).text);
    }
    line([`${v} ×${w}${v === 'chivatazo-verificado' ? ' (×2 por verificado)' : ''}`, ...cells]);
  }
}

console.log('\n### Qué dicen los chivatazos\n');
line(['Jugadores', 'Libre: hay chivatazo', 'Libre: es cierto', 'Libre: señala al culpable', 'Libre: autor del bando culpable', 'Libre: falso y del bando culpable', 'Verificado: hay chivatazo', 'Verificado: señala al culpable']);
line(['---', '---', '---', '---', '---', '---', '---', '---']);
for (const n of KEY_SIZES) {
  const free = variantRuns[`chivatazo-libre-${n}`];
  const ver = variantRuns[`chivatazo-verificado-${n}`];
  const tips = free.filter((r) => r.tip);
  const vt = ver.filter((r) => r.tip);
  line([
    n,
    wilson(tips.length, free.length),
    wilson(count(tips, (r) => r.tip!.true), tips.length),
    wilson(count(tips, (r) => r.tip!.targetIsCulprit), tips.length),
    wilson(count(tips, (r) => r.tip!.authorRole !== 'inocente'), tips.length),
    wilson(count(tips, (r) => !r.tip!.true && r.tip!.authorRole !== 'inocente'), tips.length),
    wilson(vt.length, ver.length),
    wilson(count(vt, (r) => r.tip!.targetIsCulprit), vt.length),
  ]);
}

console.log('\n### Cuánto estrecha el informante\n');
line(['Jugadores', 'Favoritos empatados (base)', 'Con informante público', 'Rondas con un único favorito (base → público)']);
line(['---', '---', '---', '---']);
for (const n of KEY_SIZES) {
  const base = STRATEGIES.flatMap((s) => baseRuns[`${n}-${s}`]);
  const pub = variantRuns[`informante-publico-${n}`];
  line([n, meanCI(base.map((r) => r.logicCandidates)), meanCI(pub.map((r) => r.logicCandidates)), `${((100 * count(base, (r) => r.logicCandidates === 1)) / base.length).toFixed(1)} % → ${((100 * count(pub, (r) => r.logicCandidates === 1)) / pub.length).toFixed(1)} %`]);
}

// ── 7. Duration and blocking.
console.log('\n## 7. Duración máxima y bloqueos\n');
console.log('Duración con todos los temporizadores agotados (sin veredicto ni desempate). Es un techo: una mesa que termina antes avanza sola. La duración real necesita partidas con personas.\n');
line(['Ritmo', ...SIZES.map((n) => `${n} jug.`)]);
line(['---', ...SIZES.map(() => '---')]);
for (const pace of Object.keys(PACE_TIMINGS) as Pace[]) {
  line([pace, ...SIZES.map((n) => {
    const t = timingsFor(pace, n);
    return `${((t.declare + t.investigate1 + t.investigate2 + t.defense + t.vote) / 60).toFixed(1)} min`;
  })]);
}
console.log(`\nRondas que se bloquearon o acabaron en un estado inválido en toda la auditoría: **${blocked}**.`);
