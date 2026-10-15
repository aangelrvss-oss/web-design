// Integration tests against the real Socket.IO server with several independent clients.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { createGameServer, type GameServer } from '../src/server/app';
import type { Ack, StateMessage } from '../src/shared/protocol';

let server: GameServer;
let url = '';

beforeAll(async () => {
  server = await createGameServer({
    port: 0,
    host: '127.0.0.1',
    scenarios: SCENARIOS,
    skipValidation: true,
    hostGraceMs: 300,
    createLimit: 1000,
  });
  url = `http://127.0.0.1:${server.port()}`;
});

afterAll(async () => {
  await server.close();
});

interface Client {
  socket: Socket;
  states: StateMessage[];
  raw: string[];
  closed: string[];
  last: () => StateMessage;
  call: (event: string, payload?: unknown) => Promise<Ack>;
  next: (pred: (s: StateMessage) => boolean, timeoutMs?: number) => Promise<StateMessage>;
  id?: string;
  token?: string;
  code?: string;
}

function client(): Promise<Client> {
  const socket = connect(url, { transports: ['websocket'], forceNew: true, reconnection: false });
  const c: Client = {
    socket,
    states: [],
    raw: [],
    closed: [],
    last: () => c.states[c.states.length - 1],
    call: (event, payload = {}) => new Promise((done) => socket.emit(event, payload, (a: Ack) => done(a))),
    next: (pred, timeoutMs = 4000) =>
      new Promise((done, reject) => {
        const hit = c.states.find((s, i) => i >= c.states.length - 1 && pred(s));
        if (hit) return done(hit);
        const timer = setTimeout(() => reject(new Error('timeout waiting for state')), timeoutMs);
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
  socket.on('room:closed', (m: { reason: string }) => c.closed.push(m.reason));
  return new Promise((done, reject) => {
    socket.on('connect', () => done(c));
    socket.on('connect_error', reject);
  });
}

async function room(n: number): Promise<Client[]> {
  const host = await client();
  const a = await host.call('room:create', { name: 'Ana' });
  if (!a.ok) throw new Error(a.error);
  Object.assign(host, { id: a.playerId, token: a.token, code: a.code });
  const clients = [host];
  for (let i = 1; i < n; i++) {
    const c = await client();
    const j = await c.call('room:join', { code: a.code!.toLowerCase(), name: `Jugador ${i}` });
    if (!j.ok) throw new Error(j.error);
    Object.assign(c, { id: j.playerId, token: j.token, code: j.code });
    clients.push(c);
  }
  await host.next((s) => s.pub.players.filter((p) => p.connected).length === n);
  return clients;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const close = (cs: Client[]) => cs.forEach((c) => c.socket.disconnect());

describe('multiplayer server', () => {
  it('runs a complete 5-player match with rematch, and nobody sees secrets they should not', async () => {
    const cs = await room(5);
    const [host] = cs;
    expect((await cs[1].call('game:start')).ok).toBe(false);
    expect(await host.call('game:start')).toEqual({ ok: true });
    await Promise.all(cs.map((c) => c.next((s) => s.pub.phase === 'declare' && !!s.priv?.role)));

    // Each client sees only its own private card.
    const privs = cs.map((c) => c.last().priv!);
    privs.forEach((p, i) => expect(p.playerId).toBe(cs[i].id));
    expect(privs.filter((p) => p.role === 'culpable')).toHaveLength(1);
    const culpritIdx = privs.findIndex((p) => p.role === 'culpable');
    const culprit = cs[culpritIdx];
    const pub = host.last().pub;
    const scene = pub.round!.scene;

    // Declare: everyone honest except the culprit at the crime slot.
    for (const [i, c] of cs.entries()) {
      const zones = privs[i].truth!.slice();
      if (i === culpritIdx) zones[scene.slot] = pub.round!.scenario.zones.find((z) => z.id !== scene.zone)!.id;
      expect(await c.call('game:declare', { zones, lock: true })).toEqual({ ok: true });
      // A second lock is refused (the last lock also closes the phase).
      const again = await c.call('game:declare', { zones, lock: true });
      expect(again.ok).toBe(false);
      expect(['already_done', 'wrong_phase']).toContain(!again.ok && again.error);
    }
    await host.next((s) => s.pub.phase === 'investigate');
    expect(host.last().pub.round!.declarations).not.toBeNull();
    expect(host.last().pub.round!.traces).toHaveLength(1);

    // Testimonies from real memories.
    for (const [i, c] of cs.entries()) {
      const m = privs[i].memories![0];
      expect((await c.call('game:testify', { subject: m.with, slot: m.slot })).ok).toBe(true);
    }
    await host.next((s) => s.pub.round!.testimonies.length === 5);
    for (const c of cs) await c.call('game:ready', { ready: true });
    await host.next((s) => s.pub.round!.traces.length === 2);
    for (const c of cs) await c.call('game:ready', { ready: true });
    await host.next((s) => s.pub.phase === 'vote');

    for (const [k, c] of cs.entries()) {
      const target = c === culprit ? cs.find((x) => x !== c)!.id : culprit.id;
      expect(await c.call('game:vote', { target })).toEqual({ ok: true });
      if (k === 0) {
        // Votes are final: a second vote is refused while the vote is still open.
        const other = cs.find((x) => x !== c && x.id !== target)!;
        expect(await c.call('game:vote', { target: other.id })).toEqual({ ok: false, error: 'already_done' });
      }
    }
    const result = await host.next((s) => s.pub.phase === 'result');
    expect(result.pub.round!.reveal!.outcome.culpritCaught).toBe(true);
    // Every client converges on the same server-decided result.
    for (const c of cs) {
      const s = await c.next((x) => x.pub.phase === 'result');
      expect(s.pub.round!.reveal!.outcome.accused).toBe(culprit.id);
    }

    // Leak audit over every message each client received before the reveal.
    for (const [i, c] of cs.entries()) {
      const before = c.states.filter((s) => s.pub.phase !== 'result' && s.pub.phase !== 'final');
      for (const s of before) {
        expect(s.pub.round?.reveal ?? null).toBeNull();
        if (s.priv) expect(s.priv.playerId).toBe(cs[i].id);
        const pubJson = JSON.stringify(s.pub);
        expect(pubJson).not.toMatch(/"(roles|truth|memories|token|votes)"/);
        expect(pubJson).not.toContain('culpable');
      }
      for (const other of cs) if (other !== c) expect(c.raw.join('\n')).not.toContain(other.token!);
      if (i !== culpritIdx && privs[i].role === 'inocente') {
        expect(before.map((s) => JSON.stringify(s)).join('\n')).not.toContain('culpable');
      }
    }

    // Rematch without recreating the room; scores persist.
    expect((await cs[2].call('game:next')).ok).toBe(false);
    expect(await host.call('game:next')).toEqual({ ok: true });
    const r2 = await host.next((s) => s.pub.phase === 'declare' && s.pub.round!.number === 2);
    expect(r2.pub.players.reduce((a, p) => a + p.score, 0)).toBeGreaterThan(0);
    expect(r2.pub.round!.scenario.id).not.toBe(pub.round!.scenario.id);
    close(cs);
  });

  it('reconnects a player with their token and restores only their own card', async () => {
    const cs = await room(4);
    await cs[0].call('game:start');
    await cs[2].next((s) => !!s.priv?.role);
    const before = cs[2].last().priv!;
    cs[2].socket.disconnect();
    await cs[0].next((s) => s.pub.players.find((p) => p.id === cs[2].id)!.connected === false);

    const again = await client();
    expect(await again.call('room:resume', { code: cs[2].code, playerId: cs[2].id, token: 'x'.repeat(32) })).toEqual({
      ok: false,
      error: 'bad_token',
    });
    // Someone else's id with my token is rejected too.
    expect(await again.call('room:resume', { code: cs[2].code, playerId: cs[1].id, token: cs[2].token })).toEqual({
      ok: false,
      error: 'bad_token',
    });
    expect((await again.call('room:resume', { code: cs[2].code, playerId: cs[2].id, token: cs[2].token })).ok).toBe(true);
    const s = await again.next((x) => !!x.priv?.role);
    expect(s.priv).toEqual(before);
    expect(s.pub.players.find((p) => p.id === cs[2].id)!.connected).toBe(true);
    close([...cs, again]);
  });

  it('rejects malformed, oversized and unauthorized messages without crashing', async () => {
    const cs = await room(4);
    const [host, other] = cs;
    const bad: [string, unknown][] = [
      ['room:create', 'hola'],
      ['room:create', { name: '' }],
      ['room:create', { name: 'x', extra: true }],
      ['room:join', { code: '12', name: 'x' }],
      ['room:join', { code: 'AEIO', name: 'x' }],
      ['game:declare', { zones: ['a'], lock: true }],
      ['game:declare', { zones: ['a', 'b', 'c', 'd'], lock: true }],
      ['game:declare', null],
      ['game:testify', { subject: 'x', slot: 9 }],
      ['game:vote', { target: 42 }],
      ['room:settings', { rounds: 7 }],
      ['room:settings', { pace: 'turbo' }],
      ['room:resume', { code: 'BCDF', playerId: 'x', token: 'short' }],
    ];
    for (const [ev, payload] of bad) expect(await other.call(ev, payload)).toEqual({ ok: false, error: 'invalid' });
    expect(await other.call('room:settings', { pace: 'rapido' })).toEqual({ ok: false, error: 'not_host' });
    expect(await other.call('room:kick', { playerId: host.id })).toEqual({ ok: false, error: 'not_host' });
    expect(await other.call('game:advance')).toEqual({ ok: false, error: 'not_host' });
    expect(await other.call('game:vote', { target: host.id })).toEqual({ ok: false, error: 'wrong_phase' });
    // Unknown event names are ignored; oversized payloads drop only that socket.
    other.socket.emit('admin:win', {});
    const big = await client();
    big.socket.emit('room:create', { name: 'x'.repeat(40_000) });
    await wait(200);
    expect(big.socket.connected).toBe(false);
    const res = await fetch(`${url}/healthz`);
    expect(res.status).toBe(200);
    expect(await host.call('room:settings', { pace: 'rapido' })).toEqual({ ok: true });
    close(cs);
  });

  it('rate-limits floods', async () => {
    const cs = await room(4);
    const results = await Promise.all(Array.from({ length: 60 }, () => cs[1].call('game:ready', { ready: true })));
    expect(results.some((r) => !r.ok && r.error === 'rate_limited')).toBe(true);
    close(cs);
  });

  it('hands the host role over when the host disconnects, and the match continues', async () => {
    const cs = await room(5);
    const [host, ...rest] = cs;
    await host.call('game:start');
    await rest[0].next((s) => s.pub.phase === 'declare');
    host.socket.disconnect();
    const s = await rest[0].next((x) => x.pub.hostId !== host.id, 3000);
    expect(s.pub.hostId).toBe(rest[0].id);
    expect(s.pub.phase).toBe('declare');
    // The new host can drive the match; the old host's alibi is auto-filled.
    expect(await rest[0].call('game:advance')).toEqual({ ok: true });
    const inv = await rest[0].next((x) => x.pub.phase === 'investigate');
    expect(inv.pub.round!.declarations![host.id!].auto).toBe(true);
    close(cs);
  });

  it('a disconnection during the vote does not block resolution', async () => {
    const cs = await room(4);
    const [host] = cs;
    await host.call('game:start');
    await host.next((s) => s.pub.phase === 'declare');
    for (let k = 0; k < 3; k++) {
      await host.call('game:advance');
      await wait(30);
    }
    await host.next((s) => s.pub.phase === 'vote');
    cs[3].socket.disconnect();
    await host.next((s) => !s.pub.players.find((p) => p.id === cs[3].id)!.connected);
    await host.call('game:vote', { target: cs[1].id });
    await cs[1].call('game:vote', { target: cs[2].id });
    await cs[2].call('game:vote', { target: cs[1].id });
    const r = await host.next((s) => s.pub.phase === 'result' || s.pub.phase === 'runoff');
    expect(['result', 'runoff']).toContain(r.pub.phase);
    close(cs);
  });

  it('late joiners watch until the next round and cannot act', async () => {
    const cs = await room(4);
    await cs[0].call('game:start');
    await cs[0].next((s) => s.pub.phase === 'declare');
    const late = await client();
    const j = await late.call('room:join', { code: cs[0].code, name: 'Tarde' });
    expect(j.ok).toBe(true);
    const s = await late.next((x) => !!x.priv);
    expect(s.priv!.inRound).toBe(false);
    expect(s.priv!.role).toBeNull();
    expect(await late.call('game:declare', { zones: ['a', 'b', 'c'], lock: true })).toEqual({ ok: false, error: 'not_participant' });
    close([...cs, late]);
  });

  it('host can remove a disconnected player from the lobby', async () => {
    const cs = await room(5);
    cs[4].socket.disconnect();
    await cs[0].next((s) => !s.pub.players.find((p) => p.id === cs[4].id)!.connected);
    expect(await cs[0].call('room:kick', { playerId: cs[4].id })).toEqual({ ok: true });
    const s = await cs[0].next((x) => !x.pub.players.some((p) => p.id === cs[4].id));
    expect(s.pub.players).toHaveLength(4);
    close(cs);
  });

  it('leaving the room closes it for that player only', async () => {
    const cs = await room(4);
    expect(await cs[3].call('room:leave')).toEqual({ ok: true });
    expect(cs[3].closed).toContain('left');
    const s = await cs[0].next((x) => x.pub.players.length === 3);
    expect(s.pub.players.map((p) => p.id)).not.toContain(cs[3].id);
    expect(await cs[3].call('game:ready', { ready: true })).toEqual({ ok: false, error: 'not_in_room' });
    close(cs);
  });

  it('cleans up abandoned rooms', async () => {
    const cs = await room(4);
    const code = cs[0].code!;
    close(cs);
    await wait(150);
    expect(server.manager.get(code)).toBeDefined();
    // Simulate the TTL passing: everyone has been gone for a long time.
    const st = server.manager.get(code)!;
    for (const p of st.players) p.lastSeen -= 60 * 60_000;
    st.updatedAt -= 60 * 60_000;
    expect(server.manager.sweep()).toContain(code);
    expect(server.manager.get(code)).toBeUndefined();
    const c = await client();
    expect(await c.call('room:join', { code, name: 'Zoe' })).toEqual({ ok: false, error: 'no_room' });
    c.socket.disconnect();
  });

  it('a fresh room works after a previous one finished', async () => {
    const cs = await room(4);
    close(cs);
    const again = await room(4);
    expect(await again[0].call('game:start')).toEqual({ ok: true });
    close(again);
  });

  it('serves the health endpoint and refuses unknown methods', async () => {
    expect((await fetch(`${url}/healthz`)).status).toBe(200);
    expect((await fetch(`${url}/`, { method: 'POST' })).status).toBe(405);
  });
});
