// Fase 7: las tres mecánicas candidatas (scripts/experimentos/mecanicas) viven fuera de la app.
// Estas pruebas vigilan que sigan aisladas, que el resolutor de equilibrios sea correcto y que la
// información nueva que simulan nunca descarte por lógica a la persona culpable verdadera.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { suspicion } from '../scripts/experimentos/informante/modelo';
import { prepare, resolveCell } from '../scripts/experimentos/informante/ronda';
import { decisionWeight, solveZeroSum } from '../scripts/experimentos/mecanicas/equilibrio';
import { m1FakeZone, m1Scores, m2CountCost, resolveM1, resolveM2, resolveM3, type M1Culprit, type M1Peritaje } from '../scripts/experimentos/mecanicas/mecanicas';

const STRATS = ['minimo', 'esquiva', 'total'] as const;

describe('experimento de mecánicas (aislado)', () => {
  it('no lo importa nada de la aplicación ni existe en ella', () => {
    const walk = (dir: URL): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(new URL(`${e.name}/`, dir)) : /\.(ts|tsx)$/.test(e.name) ? [readFileSync(new URL(e.name, dir), 'utf8')] : [],
      );
    for (const src of walk(new URL('../src/', import.meta.url))) {
      expect(src).not.toMatch(/(from|import)\s*\(?\s*['"][^'"]*(experimentos|scripts\/)/);
      // M2 y M3 no existen en la app. M1 («Prueba falsificable») sí, desde la fase 8, como prototipo
      // desactivado por defecto (docs/PRUEBA-FALSA.md): su lógica vive en un único módulo del motor.
      expect(src).not.toMatch(/archivar el caso|registro en la defensa/i);
    }
    const engine = new URL('../src/shared/engine/', import.meta.url);
    const users = readdirSync(engine).filter((f) => f !== 'prueba-falsa.ts' && /from '\.\/prueba-falsa'/.test(readFileSync(new URL(f, engine), 'utf8')));
    expect(users.sort()).toEqual(['game.ts', 'views.ts']);
  });

  it('resuelve juegos de suma cero conocidos', () => {
    const pennies = solveZeroSum([
      [1, 0],
      [0, 1],
    ]);
    expect(pennies.rows[0]).toBeCloseTo(0.5, 2);
    expect(pennies.cols[0]).toBeCloseTo(0.5, 2);
    expect((pennies.lower + pennies.upper) / 2).toBeCloseTo(0.5, 2);
    const rps = solveZeroSum([
      [0.5, 0, 1],
      [1, 0.5, 0],
      [0, 1, 0.5],
    ]);
    for (const x of [...rps.rows, ...rps.cols]) expect(x).toBeCloseTo(1 / 3, 1);
    // Una fila dominante: equilibrio puro y la decisión del rival no pesa nada.
    const dom = [
      [0.8, 0.6],
      [0.3, 0.2],
    ];
    const eq = solveZeroSum(dom);
    expect(eq.rows[0]).toBeCloseTo(1, 3);
    expect(eq.cols[1]).toBeCloseTo(1, 3);
    expect(decisionWeight(dom, eq).group).toBeCloseTo(0.4, 3);
  });

  it('M1: sin falsificación y con una mesa confiada, la ronda es la de siempre', () => {
    for (const n of [4, 6, 10]) {
      for (let i = 0; i < 12; i++) {
        const p = prepare({ n, seed: `m1-${n}-${i}`, strategy: STRATS[i % 3] });
        const base = resolveCell(p);
        for (const per of ['e1', 'e2', 'coherencia'] as M1Peritaje[]) {
          expect(resolveM1(p, 'no', per, 'confiada').accused, `${n}/${i}/${per}`).toBe(base.accused);
        }
      }
    }
  });

  it('M1: con la prueba falsa en duda, ningún inocente descarta al culpable verdadero', () => {
    let checked = 0;
    for (const n of [4, 5, 6, 10]) {
      for (let i = 0; i < 15; i++) {
        const p = prepare({ n, seed: `m1s-${n}-${i}`, strategy: STRATS[i % 3] });
        const real = p.knowledge.get(null)!.traces;
        for (const fake of [0, 1]) {
          const shown = real.map((t, j) => (j === fake ? { slot: t.slot, zone: m1FakeZone(p, j) } : { ...t }));
          for (const wF of [0, 1]) {
            for (const v of p.innocents) {
              expect(m1Scores(p, v, shown, fake, wF).get(p.culprit), `${n}/${i}/${fake}/${v}`).toBeLessThan(Infinity);
              checked++;
            }
          }
        }
        for (const c of ['no', 'f1', 'f2', 'f2p'] as M1Culprit[]) expect(resolveM1(p, c, 'coherencia', 'prudente').outcome).not.toBe('nadie');
      }
    }
    expect(checked).toBeGreaterThan(500);
  });

  it('M2: el número del registro nunca descarta al culpable verdadero', () => {
    let checked = 0;
    for (const n of [4, 5, 6, 10]) {
      for (let i = 0; i < 15; i++) {
        const p = prepare({ n, seed: `m2-${n}-${i}`, strategy: STRATS[i % 3] });
        const T = p.knowledge.get(null)!.T;
        const scene = p.knowledge.get(null)!.sceneZone;
        for (const zone of p.zones.filter((z) => z !== scene)) {
          const count = p.ids.filter((x) => p.truth[x][T] === zone).length;
          const extra = m2CountCost(p, zone, count);
          for (const v of p.innocents) {
            expect(suspicion(p.table.get(v)!, extra).get(p.culprit), `${n}/${i}/${zone}/${v}`).toBeLessThan(Infinity);
            checked++;
          }
        }
        // Y la mecánica completa se resuelve sin estados imposibles.
        expect(resolveM2(p, 'propia', 'caza', 'literal').outcome).not.toBe('nadie');
      }
    }
    expect(checked).toBeGreaterThan(500);
  });

  it('M3: si nadie archiva, el resultado es el de la ronda base', () => {
    for (const n of [4, 6, 10]) {
      for (let i = 0; i < 15; i++) {
        const p = prepare({ n, seed: `m3-${n}-${i}`, strategy: STRATS[i % 3] });
        const base = resolveCell(p);
        const r = resolveM3(p, -1, 'nunca');
        expect(r.archived).toBe(false);
        expect(r.accused, `${n}/${i}`).toBe(base.accused);
      }
    }
  });

  it('M3: archivar da 2 a la persona culpable, 1 a la cómplice y 1 más a cada inocente', () => {
    let archived = 0;
    for (const n of [4, 6]) {
      for (let i = 0; i < 40; i++) {
        const p = prepare({ n, seed: `m3a-${n}-${i}`, strategy: STRATS[i % 3] });
        const r = resolveM3(p, 1.5, 'nunca');
        if (!r.archived) continue;
        archived++;
        // culpable: 4 por escapar − 2 (más un posible +1 de cazador)
        expect([2, 3]).toContain(r.points.culpable);
        if (n >= 6) expect([1, 2]).toContain(r.points.complice);
      }
    }
    expect(archived).toBeGreaterThan(0);
  });
});
