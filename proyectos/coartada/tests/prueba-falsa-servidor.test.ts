// «Prueba falsificable» over the real Socket.IO server, with independent clients: only the host turns
// it on, only the culprit can forge, every client receives the same examination, and no innocent's
// socket ever carries the forgery before the verdict.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { createGameServer, type GameServer } from '../src/server/app';
import type { Ack, StateMessage } from '../src/shared/protocol';

let server: GameServer;
let url = '';
beforeAll(async () => {
  server = await createGameServer({ port: 0, host: '127.0.0.1', scenarios: SCENARIOS, skipValidation: true, hostGraceMs: 300, createLimit: 1000 });
  url = `http://127.0.0.1:${server.port()}`;
});
afterAll(async () => {
  await server.close();
});

interface Client {
  socket: Socket;
  states: StateMessage[];
  raw: string[];
  last: () => StateMessage;
  call: (event: string, payload?: unknown) => Promise<Ack>;
  next: (pred: (s: StateMessage) => boolean) => Promise<StateMessage>;
  id?: string;
}

function client(): Promise<Client> {
  const socket = connect(url, { transports: ['websocket'], forceNew: true, reconnection: false });
  const c: Client = {
    socket,
    states: [],
    raw: [],
    last: () => c.states[c.states.length - 1],
    call: (event, payload = {}) => new Promise((done) => socket.emit(event, payload, (a: Ack) => done(a))),
    next: (pred) =>
      new Promise((done, reject) => {
        if (c.states.length && pred(c.last())) return done(c.last());
        const timer = setTimeout(() => reject(new Error('timeout waiting for state')), 4000);
        const on = (s: StateMessage) => {
          if (pred(s)) {
            clearTimeout(timer);
            socket.off('state', on);
            done(s);
          }
        };
        socket.on('state', on);
      }),
  };
  socket.on('state', (s: StateMessage) => {
    c.states.push(s);
    c.raw.push(JSON.stringify(s));
  });
  return new Promise((done, reject) => {
    socket.on('connect', () => done(c));
    socket.on('connect_error', reject);
  });
}

async function room(n: number): Promise<Client[]> {
  const host = await client();
  const a = await host.call('room:create', { name: 'Ana' });
  if (!a.ok) throw new Error(a.error);
  host.id = a.playerId;
  const cs = [host];
  for (let i = 1; i < n; i++) {
    const c = await client();
    const j = await c.call('room:join', { code: a.code!, name: `Jugador ${i}` });
    if (!j.ok) throw new Error(j.error);
    c.id = j.playerId;
    cs.push(c);
  }
  await host.next((s) => s.pub.players.filter((p) => p.connected).length === n);
  return cs;
}

describe('prueba falsificable en el servidor', () => {
  it('una sala normal no envía nada de la variante', async () => {
    const cs = await room(4);
    expect(cs[0].last().pub.settings.variant).toBeNull();
    expect((await cs[0].call('game:start')).ok).toBe(true);
    await Promise.all(cs.map((c) => c.next((s) => s.pub.phase === 'declare' && !!s.priv?.role)));
    const culprit = cs.find((c) => c.last().priv!.role === 'culpable')!;
    const traceSlot = [0, 1, 2].find((s) => s !== culprit.last().pub.round!.scene.slot)!;
    expect(await culprit.call('game:forge', { forgery: { slot: traceSlot, zone: 'x' } })).toEqual({ ok: false, error: 'invalid' });
    for (const c of cs) {
      expect(c.last().pub.round!.variant).toBeNull();
      expect(c.last().pub.round!.examination).toBeNull();
      expect(c.last().priv!.forgery).toBeNull();
    }
    cs.forEach((c) => c.socket.disconnect());
  });

  it('solo quien dirige la activa; solo la culpable falsifica; todos reciben el mismo peritaje y nadie ve la falsificación antes de tiempo', async () => {
    const cs = await room(6);
    const [host] = cs;
    expect(await cs[1].call('room:settings', { variant: 'prueba_falsa' })).toEqual({ ok: false, error: 'not_host' });
    expect(await host.call('room:settings', { variant: 'prueba_falsa' })).toEqual({ ok: true });
    await Promise.all(cs.map((c) => c.next((s) => s.pub.settings.variant === 'prueba_falsa')));
    expect(await host.call('game:start')).toEqual({ ok: true });
    await Promise.all(cs.map((c) => c.next((s) => s.pub.phase === 'declare' && !!s.priv?.role)));
    expect(await host.call('room:settings', { variant: null })).toEqual({ ok: false, error: 'wrong_phase' });

    const role = (c: Client) => c.last().priv!.role;
    const culprit = cs.find((c) => role(c) === 'culpable')!;
    const accomplice = cs.find((c) => role(c) === 'complice')!;
    const innocents = cs.filter((c) => role(c) === 'inocente');
    const pub = host.last().pub.round!;
    expect(pub.variant).toBe('prueba_falsa');
    const T = pub.scene.slot;
    const slot = [0, 1, 2].find((s) => s !== T)!;
    const truth = culprit.last().priv!.truth!;
    const fake = pub.scenario.zones.find((z) => z.id !== truth[slot])!.id;
    for (const c of [...innocents, accomplice]) expect(await c.call('game:forge', { forgery: { slot, zone: fake } })).toEqual({ ok: false, error: 'invalid' });
    expect(await culprit.call('game:forge', { forgery: { slot, zone: fake } })).toEqual({ ok: true });
    await culprit.next((s) => s.priv!.forgery?.zone === fake);

    for (const c of cs) {
      const zones = c.last().priv!.truth!.slice();
      if (c === culprit) zones[T] = pub.scenario.zones.find((z) => z.id !== pub.scene.zone)!.id;
      expect(await c.call('game:declare', { zones, lock: true })).toEqual({ ok: true });
    }
    await host.next((s) => s.pub.phase === 'investigate');
    await accomplice.next((s) => s.priv!.forgery?.zone === fake);
    for (const c of cs) await c.call('game:ready', { ready: true });
    await host.next((s) => s.pub.round!.traces.length === 2);
    const forgedIndex = host.last().pub.round!.traces.findIndex((t) => t.slot === slot);
    expect(host.last().pub.round!.traces[forgedIndex]).toMatchObject({ zone: fake, status: 'sin_peritar' });
    // A client cannot mark evidence that does not exist, nor send a result.
    expect(await innocents[0].call('game:examine', { index: 0, result: 'falsa' })).toEqual({ ok: false, error: 'invalid' });
    for (const c of cs) expect(await c.call('game:examine', { index: forgedIndex })).toEqual({ ok: true });
    await host.next((s) => s.pub.round!.examination!.counts[forgedIndex] === 6);
    for (const c of cs) await c.call('game:ready', { ready: true });
    await Promise.all(cs.map((c) => c.next((s) => !!s.pub.round!.examination?.done)));
    const results = cs.map((c) => JSON.stringify(c.last().pub.round!.examination!.done));
    expect(new Set(results).size).toBe(1);
    expect(host.last().pub.round!.examination!.done).toEqual({ index: forgedIndex, tied: false, result: 'falsa' });
    expect(host.last().pub.round!.traces[forgedIndex]).toMatchObject({ zone: truth[slot], status: 'falsa', forgedZone: fake });

    // Before the verdict, no innocent socket ever carried the forgery.
    for (const c of innocents) for (const m of c.raw) expect(m).not.toMatch(/"forgery":\{/);

    if (host.last().pub.phase === 'defense') await host.call('game:advance');
    await host.next((s) => s.pub.phase === 'vote');
    for (const c of cs) await c.call('game:vote', { target: c === culprit ? innocents[0].id! : culprit.id! });
    await Promise.all(cs.map((c) => c.next((s) => s.pub.phase === 'result')));
    for (const c of cs) expect(c.last().pub.round!.reveal!.forgery).toEqual({ slot, zone: fake });
    cs.forEach((c) => c.socket.disconnect());
  });

  it('probabilidad: el servidor sortea una vez por ronda, solo la culpable sabe si tiene oportunidad y sin ella no puede falsificar', async () => {
    const cs = await room(5);
    const [host] = cs;
    expect(await cs[1].call('room:settings', { forgeryChance: 25 })).toEqual({ ok: false, error: 'not_host' });
    expect(await host.call('room:settings', { forgeryChance: 30 })).toMatchObject({ ok: false });
    expect(await host.call('room:settings', { variant: 'prueba_falsa', forgeryChance: 25 })).toEqual({ ok: true });
    expect(await host.call('game:start')).toEqual({ ok: true });
    await Promise.all(cs.map((c) => c.next((s) => s.pub.phase === 'declare' && !!s.priv?.role)));
    expect(await host.call('room:settings', { forgeryChance: 100 })).toEqual({ ok: false, error: 'wrong_phase' });
    const culprit = cs.find((c) => c.last().priv!.role === 'culpable')!;
    const others = cs.filter((c) => c !== culprit);
    const can = culprit.last().priv!.canForge;
    expect(typeof can).toBe('boolean');
    for (const c of others) expect(c.last().priv!.canForge).toBeNull();
    for (const c of cs) expect(c.last().pub.round!.forgeryChance).toBe(25);
    const pub = host.last().pub.round!;
    const slot = [0, 1, 2].find((s) => s !== pub.scene.slot)!;
    const fake = pub.scenario.zones.find((z) => z.id !== culprit.last().priv!.truth![slot])!.id;
    // Asking again never re-draws: the answer is the same every time.
    for (let k = 0; k < 3; k++) {
      expect(await culprit.call('game:forge', { forgery: { slot, zone: fake } })).toEqual(can ? { ok: true } : { ok: false, error: 'invalid' });
      expect(culprit.last().priv!.canForge).toBe(can);
    }
    expect(await culprit.call('game:forge', { forgery: null })).toEqual({ ok: true });
    for (const c of cs) {
      const zones = c.last().priv!.truth!.slice();
      if (c === culprit) zones[pub.scene.slot] = pub.scenario.zones.find((z) => z.id !== pub.scene.zone)!.id;
      expect(await c.call('game:declare', { zones, lock: true })).toEqual({ ok: true });
    }
    await host.next((s) => s.pub.phase === 'investigate');
    // Nobody but the culprit ever received whether the opportunity came up.
    for (const c of others) for (const m of c.raw) expect(m).not.toMatch(/"canForge":(true|false)|forgeryAllowed/);
    expect(culprit.last().priv!.canForge).toBe(can);
    cs.forEach((c) => c.socket.disconnect());
  });
});
