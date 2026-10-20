// «Prueba falsificable» (experimental, docs/PRUEBA-FALSA.md): off by default, harmless when off, and
// when on: only the culprit forges, only one forgery, nobody but the server decides the examination,
// the true evidence never changes, nothing secret leaks early and the score never changes.
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { computeOutcome, declare, examine, forge, point, setReady, startRound, tick, updateSettings, vote } from '../src/shared/engine/game';
import { privateView, publicView } from '../src/shared/engine/views';
import { ClientMessages } from '../src/shared/protocol';
import { DEFAULT_SETTINGS, type PlayerId, type RoomState } from '../src/shared/types';
import { lobby, T0 } from './helpers';

function round(n: number, seed: string, variant: boolean) {
  const l = lobby(n);
  if (variant) expect(updateSettings(l.room, l.room.hostId, { variant: 'prueba_falsa' }, T0).ok).toBe(true);
  const res = startRound(l.room, l.room.hostId, T0, l.deps, seed);
  if (!res.ok) throw new Error(res.error);
  const setup = l.room.round!.setup;
  const culprit = l.ids.find((p) => setup.roles[p] === 'culpable')!;
  const accomplice = l.ids.find((p) => setup.roles[p] === 'complice') ?? null;
  const innocents = l.ids.filter((p) => setup.roles[p] === 'inocente');
  const T = setup.scene.slot;
  return { ...l, setup, culprit, accomplice, innocents, T };
}
type R = ReturnType<typeof round>;

/** Everyone seals: the truth, except the culprit, who avoids the scene at the crime hour. */
function declareAll(r: R) {
  for (const p of r.ids) {
    const zones = r.setup.truth[p].slice();
    if (p === r.culprit) zones[r.T] = r.setup.zones.find((z) => z !== r.setup.scene.zone)!;
    expect(declare(r.room, p, zones, true, T0).ok).toBe(true);
  }
  expect(r.room.phase).toBe('investigate');
}
const toPart2 = (room: RoomState, ids: PlayerId[]) => ids.forEach((p) => setReady(room, p, true, T0));
/** End the investigation (everyone asks), skip the defense if any, vote `target` for all. */
function finish(r: R, target: (p: PlayerId) => PlayerId) {
  for (const p of r.ids) point(r.room, p, target(p), T0);
  for (const p of r.ids) setReady(r.room, p, true, T0);
  if ((r.room.phase as string) === 'defense') tick(r.room, r.room.phaseEndsAt!);
  for (const p of r.ids) vote(r.room, p, target(p), T0);
  if ((r.room.phase as string) === 'runoff') for (const p of r.ids) vote(r.room, p, r.room.round!.runoff!.candidates.find((c) => c !== p)!, T0);
  expect(r.room.phase).toBe('result');
}
const otherSlot = (r: R) => r.setup.traces[0].slot;
const fakeZone = (r: R, slot: number) => r.setup.zones.find((z) => z !== r.setup.traces.find((t) => t.slot === slot)!.zone)!;
const pubOf = (room: RoomState) => publicView(room, SCENARIOS);

describe('prueba falsificable: desactivada, no cambia nada', () => {
  it('viene desactivada y una ronda normal no tiene ningún dato de la variante', () => {
    expect(DEFAULT_SETTINGS.variant).toBeNull();
    const r = round(5, 'normal', false);
    expect(r.room.settings.variant).toBeNull();
    expect(r.room.round!.variant).toBeNull();
    expect('forgery' in r.room.round!).toBe(false);
    expect('examineMarks' in r.room.round!).toBe(false);
    declareAll(r);
    const pub = pubOf(r.room);
    expect(pub.round!.variant).toBeNull();
    expect(pub.round!.examination).toBeNull();
    expect(pub.round!.traces.every((t) => !('status' in t))).toBe(true);
    // The actions of the variant are refused in a normal round.
    expect(forge(r.room, r.culprit, null, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(examine(r.room, r.innocents[0], 0, T0)).toEqual({ ok: false, error: 'invalid' });
    toPart2(r.room, r.ids);
    finish(r, (p) => (p === r.culprit ? r.innocents[0] : r.culprit));
    expect(pubOf(r.room).round!.reveal!.forgery).toBeNull();
  });

  it('activada pero sin falsificar ni peritar, la ronda se resuelve y puntúa exactamente igual', () => {
    for (const n of [4, 6]) {
      const a = round(n, `igual-${n}`, false);
      const b = round(n, `igual-${n}`, true);
      expect(b.setup).toEqual(a.setup);
      for (const r of [a, b]) {
        declareAll(r);
        toPart2(r.room, r.ids);
        finish(r, (p) => (p === r.culprit ? r.innocents[0] : r.culprit));
      }
      expect(b.room.round!.outcome).toEqual(a.room.round!.outcome);
      expect(b.room.players.map((p) => p.score)).toEqual(a.room.players.map((p) => p.score));
    }
  });
});

describe('prueba falsificable: quién puede falsificar y cuánto', () => {
  it('solo la persona culpable, solo durante la declaración, y solo una vez (la última elección cuenta)', () => {
    const r = round(6, 'quien', true);
    const slot = otherSlot(r);
    const zone = fakeZone(r, slot);
    for (const p of r.innocents) expect(forge(r.room, p, { slot, zone }, T0)).toEqual({ ok: false, error: 'invalid' });
    expect(forge(r.room, r.accomplice!, { slot, zone }, T0)).toEqual({ ok: false, error: 'invalid' });
    expect(forge(r.room, 'nadie', { slot, zone }, T0)).toEqual({ ok: false, error: 'not_participant' });
    expect(forge(r.room, r.culprit, { slot, zone }, T0).ok).toBe(true);
    // A second forgery replaces the first: there is never more than one.
    const other = r.setup.traces[1].slot;
    expect(forge(r.room, r.culprit, { slot: other, zone: fakeZone(r, other) }, T0).ok).toBe(true);
    expect(r.room.round!.forgery).toEqual({ slot: other, zone: fakeZone(r, other) });
    expect(forge(r.room, r.culprit, null, T0).ok).toBe(true);
    expect(r.room.round!.forgery).toBeNull();
    expect(forge(r.room, r.culprit, { slot, zone }, T0).ok).toBe(true);
    declareAll(r);
    // Closed once the declaration ends.
    expect(forge(r.room, r.culprit, null, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(r.room.round!.forgery).toEqual({ slot, zone });
  });

  it('rechaza falsificaciones imposibles: la hora del incidente, el lugar verdadero o un lugar fuera de la ronda', () => {
    const r = round(5, 'imposibles', true);
    const slot = otherSlot(r);
    const truthZone = r.setup.traces.find((t) => t.slot === slot)!.zone;
    expect(forge(r.room, r.culprit, { slot: r.T, zone: fakeZone(r, slot) }, T0).ok).toBe(false);
    expect(forge(r.room, r.culprit, { slot, zone: truthZone }, T0).ok).toBe(false);
    expect(forge(r.room, r.culprit, { slot, zone: 'no-existe' }, T0).ok).toBe(false);
    expect(r.room.round!.forgery).toBeNull();
  });

  it('el protocolo no deja que un cliente envíe un resultado ni campos de más', () => {
    expect(ClientMessages['game:examine'].safeParse({ index: 0 }).success).toBe(true);
    expect(ClientMessages['game:examine'].safeParse({ index: 0, result: 'falsa' }).success).toBe(false);
    expect(ClientMessages['game:examine'].safeParse({ index: 2 }).success).toBe(false);
    expect(ClientMessages['game:forge'].safeParse({ forgery: { slot: 0, zone: 'x' } }).success).toBe(true);
    expect(ClientMessages['game:forge'].safeParse({ forgery: { slot: 0, zone: 'x', also: 1 } }).success).toBe(false);
    expect(ClientMessages['game:forge'].safeParse({ forgery: null, examined: true }).success).toBe(false);
    expect(ClientMessages['room:settings'].safeParse({ variant: 'prueba_falsa' }).success).toBe(true);
    expect(ClientMessages['room:settings'].safeParse({ variant: 'informante' }).success).toBe(false);
  });

  it('el ajuste solo lo cambia quien dirige y nunca con una ronda en marcha; la ronda usa su copia', () => {
    const l = lobby(4);
    const other = l.ids.find((p) => p !== l.room.hostId)!;
    expect(updateSettings(l.room, other, { variant: 'prueba_falsa' }, T0)).toEqual({ ok: false, error: 'not_host' });
    expect(updateSettings(l.room, l.room.hostId, { variant: 'prueba_falsa' }, T0).ok).toBe(true);
    startRound(l.room, l.room.hostId, T0, l.deps, 'copia');
    expect(updateSettings(l.room, l.room.hostId, { variant: null }, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(l.room.round!.variant).toBe('prueba_falsa');
  });
});

describe('prueba falsificable: peritaje', () => {
  it('se perita la más marcada; si es la falsa, se descubre y se ve la verdadera; las pruebas reales no cambian', () => {
    const r = round(6, 'falsa', true);
    const truth = structuredClone(r.setup.traces);
    const slot = r.setup.traces[1].slot; // the second one to come out
    const zone = fakeZone(r, slot);
    forge(r.room, r.culprit, { slot, zone }, T0);
    declareAll(r);
    // Only published evidence can be marked.
    expect(examine(r.room, r.innocents[0], 1, T0)).toEqual({ ok: false, error: 'invalid' });
    toPart2(r.room, r.ids);
    let pub = pubOf(r.room);
    expect(pub.round!.traces[1]).toEqual({ slot, zone, text: SCENARIOS.find((s) => s.id === r.setup.scenarioId)!.zones.find((z) => z.id === zone)!.trace, status: 'sin_peritar' });
    for (const p of r.innocents) examine(r.room, p, 1, T0);
    examine(r.room, r.culprit, 0, T0);
    pub = pubOf(r.room);
    expect(pub.round!.examination!.counts).toEqual([1, r.innocents.length]);
    expect(pub.round!.examination!.done).toBeNull();
    for (const p of r.ids) setReady(r.room, p, true, T0);
    pub = pubOf(r.room);
    expect(pub.round!.examination!.done).toEqual({ index: 1, tied: false, result: 'falsa' });
    expect(pub.round!.traces[1]).toMatchObject({ slot, zone: truth[1].zone, status: 'falsa', forgedZone: zone });
    expect(pub.round!.traces[0]).toMatchObject({ zone: truth[0].zone, status: 'autentica' });
    expect(r.setup.traces).toEqual(truth); // the engine's facts never changed
  });

  it('si se perita una auténtica, lo dice; la otra sigue sin peritar (y sigue mostrando la falsa)', () => {
    const r = round(5, 'autentica', true);
    const slot = r.setup.traces[1].slot;
    const zone = fakeZone(r, slot);
    forge(r.room, r.culprit, { slot, zone }, T0);
    declareAll(r);
    for (const p of r.ids) examine(r.room, p, 0, T0);
    toPart2(r.room, r.ids);
    for (const p of r.ids) setReady(r.room, p, true, T0);
    const pub = pubOf(r.room);
    expect(pub.round!.examination!.done).toEqual({ index: 0, tied: false, result: 'autentica' });
    expect(pub.round!.traces[0].status).toBe('autentica');
    expect(pub.round!.traces[1]).toMatchObject({ zone, status: 'sin_peritar' });
  });

  it('empate: sorteo con la semilla de la ronda (reproducible); sin marcas: no hay peritaje; una marca se puede quitar', () => {
    const run = (seed: string) => {
      const r = round(4, seed, true);
      declareAll(r);
      toPart2(r.room, r.ids);
      examine(r.room, r.ids[0], 0, T0);
      examine(r.room, r.ids[1], 1, T0);
      for (const p of r.ids) setReady(r.room, p, true, T0);
      return r.room.round!.examination!;
    };
    const a = run('empate');
    expect(a.tied).toBe(true);
    expect(run('empate')).toEqual(a);
    const r = round(4, 'sin-marcas', true);
    declareAll(r);
    examine(r.room, r.ids[0], 0, T0);
    expect(r.room.round!.examineMarks![r.ids[0]]).toBe(0);
    examine(r.room, r.ids[0], null, T0);
    expect(r.room.round!.examineMarks![r.ids[0]]).toBeUndefined();
    toPart2(r.room, r.ids);
    for (const p of r.ids) setReady(r.room, p, true, T0);
    expect(r.room.round!.examination).toEqual({ index: null, tied: false, result: null });
    expect(pubOf(r.room).round!.traces.every((t) => t.status === 'sin_peritar')).toBe(true);
  });
});

describe('prueba falsificable: privacidad y puntos', () => {
  it('nada revela la falsificación antes de tiempo: la prueba falsa tiene los mismos campos que una auténtica', () => {
    const r = round(6, 'privacidad', true);
    const slot = r.setup.traces[0].slot;
    const zone = fakeZone(r, slot);
    forge(r.room, r.culprit, { slot, zone }, T0);
    // During the declaration: only the culprit knows.
    for (const p of r.ids) {
      const priv = privateView(r.room, p);
      expect(priv.forgery).toEqual(p === r.culprit ? { slot, zone } : null);
    }
    declareAll(r);
    toPart2(r.room, r.ids);
    // During the investigation: the accomplice is told; innocents never.
    expect(privateView(r.room, r.accomplice!).forgery).toEqual({ slot, zone });
    for (const p of r.innocents) expect(privateView(r.room, p).forgery).toBeNull();
    const pub = pubOf(r.room);
    // The chance of an opportunity to forge is a public setting, the same for everyone (shown in
    // the lobby): configuration, not information about this forgery. It is the only key exempt.
    expect(pub.settings.forgeryChance).toBe(100);
    expect(pub.round!.forgeryChance).toBe(100);
    // Exactly those two, and plain numbers: nothing else can hide under that name.
    expect(JSON.stringify(pub).match(/"forgeryChance":[^,}]*/g)).toEqual(['"forgeryChance":100', '"forgeryChance":100']);
    const json = JSON.stringify(pub, (k, v) => (k === 'forgeryChance' ? undefined : v));
    expect(json).not.toMatch(/forg/i);
    const [fake, real] = pub.round!.traces;
    expect(Object.keys(fake)).toEqual(Object.keys(real));
    expect(fake.status).toBe('sin_peritar');
    expect(real.status).toBe('sin_peritar');
    // Only at the verdict.
    finish(r, (p) => (p === r.culprit ? r.innocents[0] : r.culprit));
    expect(pubOf(r.room).round!.reveal!.forgery).toEqual({ slot, zone });
  });

  it('la variante nunca cambia la puntuación: mismos votos, mismos puntos, con o sin falsificación descubierta', () => {
    for (const n of [4, 5, 6, 10]) {
      const a = round(n, `puntos-${n}`, false);
      const b = round(n, `puntos-${n}`, true);
      const slot = b.setup.traces[0].slot;
      forge(b.room, b.culprit, { slot, zone: fakeZone(b, slot) }, T0);
      for (const r of [a, b]) {
        declareAll(r);
        toPart2(r.room, r.ids);
      }
      for (const p of b.ids) examine(b.room, p, 0, T0); // the fake is examined and exposed
      const target = (r: R) => (p: PlayerId) => (p === r.culprit ? r.innocents[0] : r.culprit);
      finish(a, target(a));
      finish(b, target(b));
      expect(b.room.round!.examination!.result).toBe('falsa');
      expect(b.room.round!.outcome!.score).toEqual(a.room.round!.outcome!.score);
      expect(computeOutcome(b.room.round!, b.room.round!.outcome!.accused)).toEqual(a.room.round!.outcome);
    }
  });

  it('funciona con 4, 5, 6 y 10 personas, también si quien marcó se desconecta', () => {
    for (const n of [4, 5, 6, 10]) {
      const r = round(n, `tamanos-${n}`, true);
      const slot = r.setup.traces[1].slot;
      forge(r.room, r.culprit, { slot, zone: fakeZone(r, slot) }, T0);
      declareAll(r);
      toPart2(r.room, r.ids);
      const marker = r.innocents[0];
      examine(r.room, marker, 1, T0);
      r.room.players.find((p) => p.id === marker)!.connected = false; // marks still count, like pointers
      for (const p of r.ids) if (p !== marker) setReady(r.room, p, true, T0);
      expect(r.room.round!.examination).toEqual({ index: 1, tied: false, result: 'falsa' });
      expect(pubOf(r.room).round!.examination!.done!.result).toBe('falsa');
    }
  });
});
