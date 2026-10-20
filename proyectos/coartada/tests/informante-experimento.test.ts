// Fase 6: el experimento del Informante (scripts/experimentos/informante) vive fuera de la app.
// Estas pruebas vigilan que siga aislado, que sea reproducible y que sus bots no hagan trampa:
// deciden solo con las vistas, nunca descartan por lógica a la persona culpable verdadera y la
// variante no cambia la ronda base ni la puntuación del motor.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { playRound } from '../scripts/sim/core';
import { claimCost, suspicion, type VariantRules } from '../scripts/experimentos/informante/modelo';
import { prepare, resolveCell, type EvilPolicy, type InformantPolicy } from '../scripts/experimentos/informante/ronda';

const LIBRE: VariantRules = { existence: 'cierta', target: 'inocente', info: 'limpia', mutual: false };
const VARIANTS: VariantRules[] = [
  LIBRE,
  { existence: 'incierta', target: 'inocente', info: 'limpia', mutual: false },
  { existence: 'cierta', target: 'no-culpable', info: 'limpia', mutual: false },
  { existence: 'cierta', target: 'inocente', info: 'limpia', mutual: true },
  { existence: 'cierta', target: 'cualquiera', info: 'hora', mutual: false },
];
const STRATS = ['minimo', 'esquiva', 'total'] as const;

describe('experimento del Informante (aislado)', () => {
  it('no lo importa nada de la aplicación', () => {
    const walk = (dir: URL): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(new URL(`${e.name}/`, dir)) : /\.(ts|tsx)$/.test(e.name) ? [readFileSync(new URL(e.name, dir), 'utf8')] : [],
      );
    for (const src of walk(new URL('../src/', import.meta.url))) {
      expect(src).not.toMatch(/(from|import)\s*\(?\s*['"][^'"]*(experimentos|scripts\/)/);
      expect(src).not.toMatch(/informante/i); // la variante no existe en la app
    }
  });

  it('juega la misma ronda base que el simulador de la fase 5 y es reproducible', () => {
    for (const n of [4, 6, 10]) {
      for (let i = 0; i < 12; i++) {
        const o = { n, seed: `test-${n}-${i}`, strategy: STRATS[i % 3] };
        const p = prepare(o);
        expect(p.testimonies).toBe(playRound(o).testimonies);
        const again = prepare(o);
        expect(resolveCell(again).outcome).toEqual(resolveCell(p).outcome);
      }
    }
  });

  it('nunca descarta por lógica a la persona culpable verdadera, con o sin informante', () => {
    for (const n of [4, 5, 6, 10]) {
      for (let i = 0; i < 25; i++) {
        const p = prepare({ n, seed: `sound-${n}-${i}`, strategy: STRATS[i % 3] });
        for (const v of p.innocents) expect(suspicion(p.table.get(v)!).get(p.culprit), `${n}/${i}/${v}`).toBeLessThan(Infinity);
        for (const rules of VARIANTS) {
          for (const evil of ['nunca', 'reactivo', 'preventivo', 'encubre'] as EvilPolicy[]) {
            const r = resolveCell(p, { rules, informant: 'revela', evil, trust: 'logica' });
            const datum = rules.info === 'limpia' ? null : r.claims.find((c) => c.by === p.draws.informant);
            for (const v of p.innocents) {
              const t = p.table.get(v)!;
              const priv = v === p.draws.informant && r.informantExists
                ? { informant: datum ?? { target: rules.target === 'no-culpable' ? p.draws.targetNoCulpable : p.draws.targetInocente } }
                : {};
              const s = suspicion(t, (X, A) => claimCost(rules, t, v, r.claims, priv, 'logica', { trace: 0.5, fake: 1 }, X, A));
              expect(s.get(p.culprit), `${n}/${i}/${v}/${evil}`).toBeLessThan(Infinity);
            }
          }
        }
      }
    }
  });

  it('sortea al informante entre inocentes y su dato según la variante', () => {
    for (const n of [4, 6, 10]) {
      for (let i = 0; i < 30; i++) {
        const p = prepare({ n, seed: `draw-${n}-${i}`, strategy: 'minimo' });
        const { informant, targetInocente, targetNoCulpable, targetCualquiera, hour } = p.draws;
        expect(p.roles[informant]).toBe('inocente');
        expect(p.roles[targetInocente]).toBe('inocente');
        expect(targetInocente).not.toBe(informant);
        expect(p.roles[targetNoCulpable]).not.toBe('culpable');
        expect(targetNoCulpable).not.toBe(informant);
        expect(targetCualquiera).not.toBe(informant);
        expect(hour).not.toBe(p.room.round!.setup.scene.slot);
      }
    }
  });

  it('no cambia la ronda base ni la puntuación: mismo acusado, mismos puntos', () => {
    let same = 0;
    for (const n of [4, 6]) {
      for (let i = 0; i < 20; i++) {
        const p = prepare({ n, seed: `score-${n}-${i}`, strategy: STRATS[i % 3] });
        const snapshot = JSON.stringify(p.room);
        const base = resolveCell(p);
        for (const informant of ['revela', 'calla'] as InformantPolicy[]) {
          const r = resolveCell(p, { rules: LIBRE, informant, evil: 'nunca', trust: 'logica' });
          if (r.accused === base.accused && JSON.stringify(r.votes) === JSON.stringify(base.votes)) {
            same++;
            expect(r.outcome.score).toEqual(base.outcome.score);
          }
        }
        expect(JSON.stringify(p.room)).toBe(snapshot); // cada celda juega sobre una copia
      }
    }
    expect(same).toBeGreaterThan(0);
  });

  it('con 4 o 5 personas, quien replica al informante real queda al descubierto para él', () => {
    let checked = 0;
    for (const n of [4, 5]) {
      for (let i = 0; i < 30; i++) {
        const p = prepare({ n, seed: `duel-${n}-${i}`, strategy: STRATS[i % 3] });
        const r = resolveCell(p, { rules: LIBRE, informant: 'revela', evil: 'reactivo', trust: 'logica' });
        expect(r.claims.map((c) => c.by)).toEqual([p.draws.informant, p.culprit]);
        const I = p.draws.informant;
        const t = p.table.get(I)!;
        const s = suspicion(t, (X, A) => claimCost(LIBRE, t, I, r.claims, { informant: { target: p.draws.targetInocente } }, 'logica', { trace: 0.5, fake: 1 }, X, A));
        expect([...s.entries()].filter(([, x]) => x < Infinity).map(([q]) => q)).toEqual([p.culprit]);
        checked++;
      }
    }
    expect(checked).toBe(60);
  });
});
