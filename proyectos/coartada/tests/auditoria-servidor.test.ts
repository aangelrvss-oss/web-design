// Audit before the first real playtest: what a real table can do to the server that the engine
// tests don't reach. Kicked phones that stay connected, double taps and retries arriving at the
// same time, settings changed mid-round, the host leaving mid-vote, the same person on two tabs,
// and, on every message any socket received, nobody else's private view and no secret in the
// public one before the verdict.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { createGameServer, type GameServer } from '../src/server/app';
import type { Ack, StateMessage } from '../src/shared/protocol';
import { AVATARS } from '../src/shared/characters';

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
    closed: [],
    last: () => c.states[c.states.length - 1],
    call: (event, payload = {}) => new Promise((done) => socket.emit(event, payload, (a: Ack) => done(a))),
    next: (pred, timeoutMs = 4000) =>
      new Promise((done, reject) => {
        if (c.states.length && pred(c.last())) return done(c.last());
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
  socket.on('state', (s: StateMessage) => c.states.push(s));
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
  const cs = [host];
  for (let i = 1; i < n; i++) {
    const c = await client();
    const j = await c.call('room:join', { code: a.code!, name: `Jugador ${i}` });
    if (!j.ok) throw new Error(j.error);
    Object.assign(c, { id: j.playerId, token: j.token, code: j.code });
    cs.push(c);
  }
  await host.next((s) => s.pub.players.filter((p) => p.connected).length === n);
  return cs;
}
const close = (cs: Client[]) => cs.forEach((c) => c.socket.disconnect());
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Everyone seals their true night (the culprit avoids the scene at the crime hour). */
async function declareAll(cs: Client[]) {
  for (const c of cs) {
    const s = c.last();
    const zones = s.priv!.truth!.slice();
    if (s.priv!.role === 'culpable') zones[s.pub.round!.scene.slot] = s.pub.round!.scenario.zones.find((z) => z.id !== s.pub.round!.scene.zone)!.id;
    expect(await c.call('game:declare', { zones, lock: true })).toEqual({ ok: true });
  }
  await cs[0].next((s) => s.pub.phase === 'investigate');
}

/** No message ever carried someone else's private view, nor a secret in the public view before the verdict. */
function checkEveryMessage(cs: Client[]) {
  for (const c of cs) {
    for (const s of c.states) {
      if (s.priv) expect(s.priv.playerId).toBe(c.id);
      const r = s.pub.round;
      if (r && s.pub.phase !== 'result' && s.pub.phase !== 'final') {
        expect(r.reveal).toBeNull();
        const json = JSON.stringify(s.pub);
        // `settings.encargos` is the public on/off switch; the objectives themselves are an object.
        for (const key of ['"roles"', '"truth"', '"memories"', '"encargos":{', '"votes"', '"pointers"', '"drafts"', '"token"', '"seed"', '"forgery"', '"forgeryAllowed"', '"canForge"', '"examineMarks"'])
          expect(json).not.toContain(key);
      }
    }
  }
}

describe('auditoría: lo que una mesa real puede hacerle al servidor', () => {
  it('un móvil expulsado que sigue conectado ya no recibe nada ni puede actuar ni volver con su token', async () => {
    const cs = await room(4);
    const [host, , , kicked] = cs;
    expect(await host.call('room:kick', { playerId: kicked.id })).toEqual({ ok: true });
    await wait(100);
    expect(kicked.closed).toContain('kicked');
    const seen = kicked.states.length;
    const free = AVATARS.find((a) => !host.last().pub.players.some((p) => p.avatar === a))!;
    for (const [event, payload] of [
      ['room:avatar', { avatar: free }],
      ['room:settings', { pace: 'rapido' }],
      ['game:start', {}],
      ['room:leave', {}],
    ] as const) {
      expect((await kicked.call(event, payload)).ok).toBe(false);
    }
    expect(await kicked.call('room:resume', { code: kicked.code, playerId: kicked.id, token: kicked.token })).toEqual({ ok: false, error: 'bad_token' });
    // The room goes on without them, and they hear nothing of it.
    expect(await host.call('room:settings', { pace: 'rapido' })).toEqual({ ok: true });
    await wait(100);
    expect(kicked.states.length).toBe(seen);
    expect(host.last().pub.players.some((p) => p.id === kicked.id)).toBe(false);
    close(cs);
  });

  it('dobles toques y reintentos simultáneos cuentan una sola vez', async () => {
    const cs = await room(4);
    const [host] = cs;
    const starts = await Promise.all([host.call('game:start'), host.call('game:start')]);
    expect(starts.filter((a) => a.ok)).toHaveLength(1);
    await Promise.all(cs.map((c) => c.next((s) => s.pub.phase === 'declare' && !!s.priv?.truth)));
    // A double tap on «Sellar»: one alibi, the second is refused.
    const zones = host.last().priv!.truth!.slice();
    const seals = await Promise.all([host.call('game:declare', { zones, lock: true }), host.call('game:declare', { zones, lock: true })]);
    expect(seals.map((a) => a.ok).sort()).toEqual([false, true]);
    await declareAll(cs.slice(1));
    // The same testimony twice at once: published once.
    const other = cs[1].id!;
    const t = await Promise.all([host.call('game:testify', { subject: other, slot: 0 }), host.call('game:testify', { subject: other, slot: 0 })]);
    expect(t.filter((a) => a.ok)).toHaveLength(1);
    await host.next((s) => s.pub.round!.testimonies.length === 1);
    // To the vote: everyone asks to move on twice.
    for (let k = 0; k < 2; k++) for (const c of cs) await c.call('game:ready', { ready: true });
    await host.next((s) => s.pub.phase === 'vote' || s.pub.phase === 'defense');
    if (host.last().pub.phase === 'defense') await host.call('game:advance');
    await host.next((s) => s.pub.phase === 'vote');
    // A double tap on «Acusar» with two different targets: the first one counts, the second is refused.
    const v = await Promise.all([cs[1].call('game:vote', { target: cs[2].id }), cs[1].call('game:vote', { target: cs[3].id })]);
    expect(v.map((a) => a.ok)).toEqual([true, false]);
    expect(v[1]).toEqual({ ok: false, error: 'already_done' });
    for (const c of [cs[0], cs[2], cs[3]]) await c.call('game:vote', { target: cs[1].id });
    await host.next((s) => s.pub.phase === 'result' || s.pub.phase === 'runoff');
    if (host.last().pub.phase === 'runoff') {
      for (const c of cs) {
        const cand = host.last().pub.round!.runoff!.candidates.find((x) => x !== c.id)!;
        await c.call('game:vote', { target: cand });
      }
      await host.next((s) => s.pub.phase === 'result');
    }
    expect(host.last().pub.round!.reveal!.votes[cs[1].id!]).toBe(cs[2].id);
    // «Siguiente ronda» twice: one new round, not two.
    const nexts = await Promise.all([host.call('game:next'), host.call('game:next')]);
    expect(nexts.filter((a) => a.ok)).toHaveLength(1);
    await host.next((s) => s.pub.phase === 'declare');
    expect(host.last().pub.round!.number).toBe(2);
    checkEveryMessage(cs);
    close(cs);
  });

  it('a mitad de ronda no se puede cambiar ningún ajuste (tampoco la variante ni su probabilidad)', async () => {
    const cs = await room(4);
    const [host] = cs;
    expect(await host.call('room:settings', { variant: 'prueba_falsa', forgeryChance: 50 })).toEqual({ ok: true });
    expect(await host.call('game:start')).toEqual({ ok: true });
    await host.next((s) => s.pub.phase === 'declare');
    for (const patch of [{ variant: null }, { forgeryChance: 100 }, { forgeryChance: 25 }, { pace: 'rapido' }, { encargos: true }, { rounds: 3 }])
      expect(await host.call('room:settings', patch)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(await cs[1].call('room:settings', { forgeryChance: 100 })).toEqual({ ok: false, error: 'not_host' });
    expect(host.last().pub.round!.forgeryChance).toBe(50);
    expect(host.last().pub.settings.forgeryChance).toBe(50);
    close(cs);
  });

  it('si quien dirige se va en plena votación, otra persona dirige al momento y la ronda termina', async () => {
    const cs = await room(5);
    const [host, ...rest] = cs;
    await host.call('game:start');
    await Promise.all(cs.map((c) => c.next((s) => s.pub.phase === 'declare' && !!s.priv?.truth)));
    await declareAll(cs);
    for (const c of cs) await c.call('game:ready', { ready: true });
    for (const c of cs) await c.call('game:ready', { ready: true });
    await host.next((s) => s.pub.phase === 'vote' || s.pub.phase === 'defense');
    if (host.last().pub.phase === 'defense') await host.call('game:advance');
    await host.next((s) => s.pub.phase === 'vote');
    expect(await host.call('room:leave')).toEqual({ ok: true });
    const s = await rest[0].next((x) => x.pub.hostId !== host.id);
    const newHost = rest.find((c) => c.id === s.pub.hostId)!;
    expect(newHost).toBeTruthy();
    // The one who left is still in this round's list (their name appears in the verdict), not connected.
    expect(s.pub.players.find((p) => p.id === host.id)).toMatchObject({ connected: false, left: true });
    for (const c of rest) await c.call('game:vote', { target: rest.find((x) => x !== c)!.id });
    await rest[0].next((x) => x.pub.phase === 'result' || x.pub.phase === 'runoff');
    if (rest[0].last().pub.phase === 'runoff') expect(await newHost.call('game:advance')).toEqual({ ok: true });
    await rest[0].next((x) => x.pub.phase === 'result');
    // Next round without them.
    expect(await newHost.call('game:next')).toEqual({ ok: true });
    const r2 = await rest[0].next((x) => x.pub.phase === 'declare');
    expect(r2.pub.round!.participants).not.toContain(host.id);
    expect(r2.pub.players.some((p) => p.id === host.id)).toBe(false);
    checkEveryMessage(rest);
    close(cs);
  });

  it('la misma persona en dos pestañas recibe lo mismo y no puede votar dos veces', async () => {
    const cs = await room(4);
    const [host] = cs;
    const twin = await client();
    expect(await twin.call('room:resume', { code: cs[1].code, playerId: cs[1].id, token: cs[1].token })).toMatchObject({ ok: true });
    Object.assign(twin, { id: cs[1].id });
    await host.call('game:start');
    await Promise.all([...cs, twin].map((c) => c.next((s) => s.pub.phase === 'declare' && !!s.priv?.truth)));
    expect(twin.last().priv!.truth).toEqual(cs[1].last().priv!.truth);
    await declareAll(cs);
    for (const c of cs) await c.call('game:ready', { ready: true });
    for (const c of cs) await c.call('game:ready', { ready: true });
    await host.next((s) => s.pub.phase === 'vote' || s.pub.phase === 'defense');
    if (host.last().pub.phase === 'defense') await host.call('game:advance');
    await host.next((s) => s.pub.phase === 'vote');
    const v = await Promise.all([cs[1].call('game:vote', { target: cs[2].id }), twin.call('game:vote', { target: cs[3].id })]);
    expect(v.filter((a) => a.ok)).toHaveLength(1);
    // Closing one tab doesn't disconnect the person.
    cs[1].socket.disconnect();
    await wait(150);
    expect(host.last().pub.players.find((p) => p.id === cs[1].id)!.connected).toBe(true);
    checkEveryMessage([cs[0], cs[2], cs[3], twin]);
    close([...cs, twin]);
  });

  it('con la variante, una desconexión y una vuelta a mitad de ronda no enseñan nada de más', async () => {
    const cs = await room(6);
    const [host] = cs;
    await host.call('room:settings', { variant: 'prueba_falsa' });
    await host.call('game:start');
    await Promise.all(cs.map((c) => c.next((s) => s.pub.phase === 'declare' && !!s.priv?.role)));
    const culprit = cs.find((c) => c.last().priv!.role === 'culpable')!;
    const innocent = cs.find((c) => c.last().priv!.role === 'inocente' && c !== host)!;
    const pub = host.last().pub.round!;
    const slot = [0, 1, 2].find((x) => x !== pub.scene.slot)!;
    const fake = pub.scenario.zones.find((z) => z.id !== culprit.last().priv!.truth![slot])!.id;
    expect(await culprit.call('game:forge', { forgery: { slot, zone: fake } })).toEqual({ ok: true });
    // An innocent drops and comes back with their token mid-declaration.
    innocent.socket.disconnect();
    await wait(100);
    const back = await client();
    expect(await back.call('room:resume', { code: innocent.code, playerId: innocent.id, token: innocent.token })).toMatchObject({ ok: true });
    Object.assign(back, { id: innocent.id, token: innocent.token, code: innocent.code });
    const s = await back.next((x) => !!x.priv);
    expect(s.priv!.forgery).toBeNull();
    expect(s.priv!.canForge).toBeNull();
    expect(s.priv!.role).toBe('inocente');
    const all = cs.map((c) => (c === innocent ? back : c));
    await declareAll(all);
    checkEveryMessage(all);
    close([...cs, back]);
  });
});
