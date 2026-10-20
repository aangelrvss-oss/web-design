// «Prueba falsificable», chance of an opportunity to forge (docs/PRUEBA-FALSA.md, R14–R17): a test
// condition of 100 %, 50 % or 25 %. The draw decides whether the culprit MAY forge, never whether
// a forgery happens; it is drawn once per round from the round's seed, frozen with the round,
// secret until the verdict, and changes neither the true evidence nor the score. 100 % keeps the
// prototype exactly as it was.
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { declare, examine, forge, point, setReady, startRound, tick, updateSettings, vote } from '../src/shared/engine/game';
import { drawForgeryOpportunity } from '../src/shared/engine/prueba-falsa';
import { privateView, publicView } from '../src/shared/engine/views';
import { ClientMessages } from '../src/shared/protocol';
import { DEFAULT_SETTINGS, type ForgeryChance, type PlayerId } from '../src/shared/types';
import { lobby, T0 } from './helpers';

function round(n: number, seed: string, opts: { variant?: boolean; chance?: ForgeryChance } = {}) {
  const l = lobby(n);
  if (opts.variant !== false) expect(updateSettings(l.room, l.room.hostId, { variant: 'prueba_falsa', ...(opts.chance ? { forgeryChance: opts.chance } : {}) }, T0).ok).toBe(true);
  const res = startRound(l.room, l.room.hostId, T0, l.deps, seed);
  if (!res.ok) throw new Error(res.error);
  const setup = l.room.round!.setup;
  const culprit = l.ids.find((p) => setup.roles[p] === 'culpable')!;
  const innocents = l.ids.filter((p) => setup.roles[p] === 'inocente');
  return { ...l, setup, culprit, innocents };
}
type R = ReturnType<typeof round>;
const pubOf = (r: R) => publicView(r.room, SCENARIOS);
const fakeZone = (r: R, slot: number) => r.setup.zones.find((z) => z !== r.setup.traces.find((t) => t.slot === slot)!.zone)!;

function declareAll(r: R) {
  for (const p of r.ids) {
    const zones = r.setup.truth[p].slice();
    if (p === r.culprit) zones[r.setup.scene.slot] = r.setup.zones.find((z) => z !== r.setup.scene.zone)!;
    expect(declare(r.room, p, zones, true, T0).ok).toBe(true);
  }
}
function finish(r: R, target: (p: PlayerId) => PlayerId) {
  for (const p of r.ids) setReady(r.room, p, true, T0);
  for (const p of r.ids) point(r.room, p, target(p), T0);
  for (const p of r.ids) setReady(r.room, p, true, T0);
  if ((r.room.phase as string) === 'defense') tick(r.room, r.room.phaseEndsAt!);
  for (const p of r.ids) vote(r.room, p, target(p), T0);
  if ((r.room.phase as string) === 'runoff') for (const p of r.ids) vote(r.room, p, r.room.round!.runoff!.candidates.find((c) => c !== p)!, T0);
  expect(r.room.phase).toBe('result');
}
/** First seeds (in a fixed list) whose round gets / does not get the opportunity. */
function seedWhere(chance: ForgeryChance, allowed: boolean): string {
  for (let i = 0; i < 200; i++) if (drawForgeryOpportunity(`s${i}`, chance) === allowed) return `s${i}`;
  throw new Error('no seed');
}

describe('prueba falsificable: probabilidad de oportunidad', () => {
  it('ajuste: 100 % por defecto; el protocolo solo admite 100, 50 y 25; solo quien dirige y fuera de una ronda', () => {
    expect(DEFAULT_SETTINGS.forgeryChance).toBe(100);
    const schema = ClientMessages['room:settings'];
    for (const v of [100, 50, 25]) expect(schema.safeParse({ forgeryChance: v }).success).toBe(true);
    for (const v of [0, 30, 75, '50', null, 100.5]) expect(schema.safeParse({ forgeryChance: v }).success).toBe(false);
    const l = lobby(5);
    expect(updateSettings(l.room, l.ids[1], { forgeryChance: 25 }, T0)).toEqual({ ok: false, error: 'not_host' });
    expect(updateSettings(l.room, l.room.hostId, { variant: 'prueba_falsa', forgeryChance: 25 }, T0).ok).toBe(true);
    startRound(l.room, l.room.hostId, T0, l.deps, 'congelada');
    expect(updateSettings(l.room, l.room.hostId, { forgeryChance: 100 }, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(l.room.round!.forgeryChance).toBe(25);
  });

  it('100 %: siempre hay oportunidad y la ronda es la del prototipo (mismo reparto, misma falsificación, mismo resultado)', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      expect(drawForgeryOpportunity(seed, 100)).toBe(true);
      const r = round(6, seed);
      expect(r.room.round!.forgeryAllowed).toBe(true);
      expect(privateView(r.room, r.culprit).canForge).toBe(true);
      const slot = r.setup.traces[0].slot;
      expect(forge(r.room, r.culprit, { slot, zone: fakeZone(r, slot) }, T0)).toEqual({ ok: true });
    }
    // The draw has its own random stream: the rest of the round is what the same seed gave before.
    const plain = round(6, 'mismo', { variant: false });
    for (const chance of [100, 50, 25] as const) expect(round(6, 'mismo', { chance }).setup).toEqual(plain.setup);
  });

  it('50 % y 25 %: la frecuencia es la configurada (2 000 semillas fijas) y cada semilla da siempre lo mismo', () => {
    for (const [chance, lo, hi] of [
      [50, 0.46, 0.54],
      [25, 0.21, 0.29],
    ] as const) {
      const seeds = Array.from({ length: 2000 }, (_, i) => `freq-${i}`);
      const share = seeds.filter((s) => drawForgeryOpportunity(s, chance)).length / seeds.length;
      expect(share).toBeGreaterThan(lo);
      expect(share).toBeLessThan(hi);
      for (const s of seeds.slice(0, 50)) expect(drawForgeryOpportunity(s, chance)).toBe(drawForgeryOpportunity(s, chance));
    }
  });

  it('se sortea una sola vez: ni las vistas, ni repetir acciones, ni el avance de fases lo cambian', () => {
    for (const allowed of [true, false]) {
      const r = round(6, seedWhere(50, allowed), { chance: 50 });
      expect(r.room.round!.forgeryAllowed).toBe(allowed);
      for (let k = 0; k < 5; k++) {
        pubOf(r);
        for (const p of r.ids) privateView(r.room, p);
        forge(r.room, r.culprit, null, T0);
      }
      declareAll(r);
      for (const p of r.ids) setReady(r.room, p, true, T0);
      expect(r.room.round!.forgeryAllowed).toBe(allowed);
      finish(r, (p) => (p === r.culprit ? r.innocents[0] : r.culprit));
      expect(r.room.round!.forgeryAllowed).toBe(allowed);
      // Changing the setting after the round (between rounds) does not touch the round played.
      expect(updateSettings(r.room, r.room.hostId, { forgeryChance: 100 }, T0).ok).toBe(true);
      expect(r.room.round!.forgeryChance).toBe(50);
      expect(pubOf(r).round!.reveal!.forgeryAllowed).toBe(allowed);
    }
  });

  it('sin oportunidad: la culpable no puede falsificar (sí elegir no hacerlo), nadie más lo sabe y el veredicto lo cuenta', () => {
    const r = round(6, seedWhere(25, false), { chance: 25 });
    const slot = r.setup.traces[0].slot;
    expect(forge(r.room, r.culprit, { slot, zone: fakeZone(r, slot) }, T0)).toEqual({ ok: false, error: 'invalid' });
    expect(forge(r.room, r.culprit, null, T0)).toEqual({ ok: true });
    expect(r.room.round!.forgery).toBeNull();
    for (const p of r.ids) expect(privateView(r.room, p).canForge).toBe(p === r.culprit ? false : null);
    declareAll(r);
    for (const p of r.ids) setReady(r.room, p, true, T0);
    // Before the verdict the public view says the chance, never the draw.
    const json = JSON.stringify(pubOf(r));
    expect(json).not.toMatch(/forgeryAllowed|canForge/);
    expect(pubOf(r).round!.forgeryChance).toBe(25);
    finish(r, (p) => (p === r.culprit ? r.innocents[0] : r.culprit));
    expect(pubOf(r).round!.reveal).toMatchObject({ forgery: null, forgeryAllowed: false });
  });

  it('con oportunidad: decidir no usarla es válido; usarla funciona como siempre y las dos revisiones resuelven igual', () => {
    // Not using it.
    const a = round(6, seedWhere(50, true), { chance: 50 });
    expect(privateView(a.room, a.culprit).canForge).toBe(true);
    declareAll(a);
    finish(a, (p) => (p === a.culprit ? a.innocents[0] : a.culprit));
    expect(pubOf(a).round!.reveal).toMatchObject({ forgery: null, forgeryAllowed: true });
    // Using it; the examined piece is the fake one, then the authentic one.
    for (const examineFake of [true, false]) {
      const r = round(6, seedWhere(50, true), { chance: 50 });
      const truth = structuredClone(r.setup.traces);
      const slot = r.setup.traces[1].slot;
      const zone = fakeZone(r, slot);
      expect(forge(r.room, r.culprit, { slot, zone }, T0)).toEqual({ ok: true });
      declareAll(r);
      for (const p of r.ids) setReady(r.room, p, true, T0); // second piece out
      for (const p of r.ids) examine(r.room, p, examineFake ? 1 : 0, T0);
      finish(r, (p) => (p === r.culprit ? r.innocents[0] : r.culprit));
      expect(r.room.round!.examination).toMatchObject({ index: examineFake ? 1 : 0, result: examineFake ? 'falsa' : 'autentica' });
      expect(r.setup.traces).toEqual(truth); // the true evidence is never modified
    }
  });

  it('no cambia puntos ni ganadores: con o sin oportunidad, mismos votos dan los mismos puntos que sin la variante', () => {
    for (const chance of [100, 50, 25] as const) {
      for (const allowed of chance === 100 ? [true] : [true, false]) {
        const seed = seedWhere(chance, allowed);
        const plain = round(5, seed, { variant: false });
        const exp = round(5, seed, { chance });
        for (const r of [plain, exp]) {
          declareAll(r);
          finish(r, (p) => (p === r.culprit ? r.innocents[0] : r.culprit));
        }
        expect(exp.room.round!.outcome).toEqual(plain.room.round!.outcome);
        expect(exp.room.players.map((p) => p.score)).toEqual(plain.room.players.map((p) => p.score));
      }
    }
  });

  it('variante apagada: el ajuste de probabilidad no existe para la ronda', () => {
    const r = round(5, 'normal', { variant: false });
    expect(updateSettings(r.room, r.room.hostId, {}, T0).ok).toBe(false); // round running
    expect('forgeryAllowed' in r.room.round!).toBe(false);
    expect('forgeryChance' in r.room.round!).toBe(false);
    expect(pubOf(r).round!.forgeryChance).toBeNull();
    for (const p of r.ids) expect(privateView(r.room, p).canForge).toBeNull();
  });
});
