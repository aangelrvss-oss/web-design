// End of a match: once its rounds are played, no request can start another one. Two ways used to
// lead to «Ronda 4 de 3» (docs/AUDITORIA-playtest.md):
//  A. from the verdict of the last round, «go to the room» and then «start»;
//  B. back in the room mid-match, set the rounds to those already played (or fewer) and «start».
// The engine now refuses both, and the legitimate flows (start, next round, a pause in the room
// mid-match, rematch from the final standings, «sin fin») work as before.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { createGameServer, type GameServer } from '../src/server/app';
import { forceAdvance, nextRound, startRound, toLobby, updateSettings } from '../src/shared/engine/game';
import type { Ack, StateMessage } from '../src/shared/protocol';
import type { RoomState } from '../src/shared/types';
import { lobby, T0 } from './helpers';

/** Play rounds to their verdict with the host's «end this step» (timers alone, no votes needed). */
function playTo(room: RoomState, hostId: string, deps: Parameters<typeof startRound>[3], played: number, rounds: 0 | 3 | 5 | 8) {
  updateSettings(room, hostId, { rounds }, T0);
  expect(startRound(room, hostId, T0, deps)).toEqual({ ok: true });
  for (let r = 1; r <= played; r++) {
    while (room.phase !== 'result') expect(forceAdvance(room, hostId, T0).ok).toBe(true);
    if (r < played) expect(nextRound(room, hostId, T0, deps)).toEqual({ ok: true });
  }
}
const snapshot = (room: RoomState) =>
  JSON.stringify({ phase: room.phase, played: room.roundsPlayed, round: room.round?.number, scores: room.players.map((p) => p.score), history: room.history.length });

describe('fin de partida (motor)', () => {
  it('A. tras la última ronda no se vuelve a la sala ni se empieza otra; solo queda la clasificación final', () => {
    const l = lobby(4);
    playTo(l.room, l.room.hostId, l.deps, 3, 3);
    const before = snapshot(l.room);
    expect(toLobby(l.room, l.room.hostId, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(startRound(l.room, l.room.hostId, T0, l.deps)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(snapshot(l.room)).toBe(before); // nothing moved: no round, no points, no history
    const scores = l.room.players.map((p) => p.score);
    expect(nextRound(l.room, l.room.hostId, T0, l.deps)).toEqual({ ok: true });
    expect(l.room.phase).toBe('final');
    expect(l.room.players.map((p) => p.score)).toEqual(scores);
  });

  it('A. aunque la sala llegara a tener la partida terminada, el motor no empieza otra ronda', () => {
    const l = lobby(4);
    playTo(l.room, l.room.hostId, l.deps, 3, 3);
    // A room in the lobby with its match over (e.g. a state from before this guard).
    l.room.phase = 'lobby';
    l.room.round = null;
    const before = snapshot(l.room);
    expect(startRound(l.room, l.room.hostId, T0, l.deps)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(snapshot(l.room)).toBe(before);
  });

  it('B. en la sala a mitad de partida no se puede dejar la partida en las rondas ya jugadas (ni menos)', () => {
    const l = lobby(4);
    playTo(l.room, l.room.hostId, l.deps, 3, 5);
    expect(toLobby(l.room, l.room.hostId, T0)).toEqual({ ok: true }); // a pause mid-match: allowed
    for (const rounds of [3] as const) expect(updateSettings(l.room, l.room.hostId, { rounds }, T0)).toEqual({ ok: false, error: 'invalid' });
    expect(l.room.settings.rounds).toBe(5);
    // Longer, or «sin fin», is fine; then the match goes on with round 4.
    expect(updateSettings(l.room, l.room.hostId, { rounds: 8 }, T0)).toEqual({ ok: true });
    expect(updateSettings(l.room, l.room.hostId, { rounds: 0 }, T0)).toEqual({ ok: true });
    expect(updateSettings(l.room, l.room.hostId, { rounds: 5 }, T0)).toEqual({ ok: true });
    expect(updateSettings(l.room, l.room.hostId, { pace: 'rapido' }, T0)).toEqual({ ok: true }); // other settings unaffected
    expect(startRound(l.room, l.room.hostId, T0, l.deps)).toEqual({ ok: true });
    expect(l.room.round!.number).toBe(4);
  });

  it('flujos legítimos: empezar, avanzar, pausa en la sala, revancha y nueva partida desde la clasificación final', () => {
    const l = lobby(4);
    playTo(l.room, l.room.hostId, l.deps, 2, 3);
    expect(toLobby(l.room, l.room.hostId, T0)).toEqual({ ok: true });
    expect(startRound(l.room, l.room.hostId, T0, l.deps)).toEqual({ ok: true });
    expect(l.room.round!.number).toBe(3);
    while (l.room.phase !== 'result') forceAdvance(l.room, l.room.hostId, T0);
    expect(nextRound(l.room, l.room.hostId, T0, l.deps)).toEqual({ ok: true });
    expect(l.room.phase).toBe('final');
    expect(startRound(l.room, l.room.hostId, T0, l.deps)).toEqual({ ok: false, error: 'wrong_phase' });
    // «Nueva partida»: back to the room with everything at zero; any number of rounds; round 1.
    expect(toLobby(l.room, l.room.hostId, T0)).toEqual({ ok: true });
    expect(l.room.roundsPlayed).toBe(0);
    expect(l.room.players.every((p) => p.score === 0)).toBe(true);
    expect(updateSettings(l.room, l.room.hostId, { rounds: 3 }, T0)).toEqual({ ok: true });
    expect(startRound(l.room, l.room.hostId, T0, l.deps)).toEqual({ ok: true });
    expect(l.room.round!.number).toBe(1);
  });

  it('«sin fin» nunca termina; y bajar las rondas desde el veredicto solo adelanta la clasificación final', () => {
    const l = lobby(4);
    playTo(l.room, l.room.hostId, l.deps, 9, 0);
    expect(toLobby(l.room, l.room.hostId, T0)).toEqual({ ok: true });
    expect(startRound(l.room, l.room.hostId, T0, l.deps)).toEqual({ ok: true });
    expect(l.room.round!.number).toBe(10);
    const m = lobby(4);
    playTo(m.room, m.room.hostId, m.deps, 2, 5);
    expect(updateSettings(m.room, m.room.hostId, { rounds: 3 }, T0)).toEqual({ ok: true });
    while (m.room.phase !== 'result') forceAdvance(m.room, m.room.hostId, T0);
    expect(nextRound(m.room, m.room.hostId, T0, m.deps)).toEqual({ ok: true });
    expect(m.room.round!.number).toBe(3);
    while (m.room.phase !== 'result') forceAdvance(m.room, m.room.hostId, T0);
    expect(toLobby(m.room, m.room.hostId, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(nextRound(m.room, m.room.hostId, T0, m.deps)).toEqual({ ok: true });
    expect(m.room.phase).toBe('final');
  });
});

// ───────────── the attack over the real server, with direct requests ─────────────

let server: GameServer;
let url = '';
beforeAll(async () => {
  server = await createGameServer({ port: 0, host: '127.0.0.1', scenarios: SCENARIOS, skipValidation: true, createLimit: 1000 });
  url = `http://127.0.0.1:${server.port()}`;
});
afterAll(async () => {
  await server.close();
});

interface Client {
  s: Socket;
  states: StateMessage[];
  last: () => StateMessage;
  call: (event: string, payload?: unknown) => Promise<Ack>;
}
async function client(): Promise<Client> {
  const s = connect(url, { transports: ['websocket'], forceNew: true, reconnection: false });
  const c: Client = {
    s,
    states: [],
    last: () => c.states[c.states.length - 1],
    // The server allows a few messages per second; a test that fires faster waits and retries.
    call: async (event, payload = {}) => {
      for (let k = 0; ; k++) {
        const ack = await new Promise<Ack>((done) => s.emit(event, payload, done));
        if (ack.ok || ack.error !== 'rate_limited' || k > 20) return ack;
        await new Promise((r) => setTimeout(r, 250));
      }
    },
  };
  s.on('state', (m: StateMessage) => c.states.push(m));
  await new Promise<void>((r) => s.on('connect', () => r()));
  return c;
}
const settle = () => new Promise((r) => setTimeout(r, 60));

describe('fin de partida (servidor real, peticiones directas)', () => {
  it('tras la ronda 3 de 3, «ir a la sala» y «empezar» enviados a mano se rechazan y nada cambia para nadie', async () => {
    const host = await client();
    const a = await host.call('room:create', { name: 'Ana' });
    if (!a.ok) throw new Error(a.error);
    const others: Client[] = [];
    for (const n of ['Bea', 'Ciro', 'Dani']) {
      const c = await client();
      expect((await c.call('room:join', { code: a.code, name: n })).ok).toBe(true);
      others.push(c);
    }
    await settle();
    expect(await host.call('room:settings', { rounds: 3 })).toEqual({ ok: true });
    expect(await host.call('game:start')).toEqual({ ok: true });
    for (let r = 1; r <= 3; r++) {
      for (let k = 0; k < 10 && host.last().pub.phase !== 'result'; k++) {
        await host.call('game:advance');
        await settle();
      }
      expect(host.last().pub.phase).toBe('result');
      if (r < 3) expect(await host.call('game:next')).toEqual({ ok: true });
    }
    await settle();
    const view = (c: Client) => {
      const p = c.last().pub;
      return JSON.stringify({ phase: p.phase, played: p.roundsPlayed, round: p.round?.number, scores: p.players.map((x) => [x.name, x.score]) });
    };
    const before = [host, ...others].map(view);
    // The attack: a modified client asks for the room and a new round, several times.
    for (let k = 0; k < 3; k++) {
      expect(await host.call('game:lobby')).toEqual({ ok: false, error: 'wrong_phase' });
      expect(await host.call('game:start')).toEqual({ ok: false, error: 'wrong_phase' });
    }
    await settle();
    expect([host, ...others].map(view)).toEqual(before);
    expect(host.last().pub.round!.number).toBe(3);
    // The legitimate way on: final standings with the same points, then a new match at zero.
    const scores = host.last().pub.players.map((p) => p.score);
    expect(await host.call('game:next')).toEqual({ ok: true });
    await settle();
    expect(host.last().pub.phase).toBe('final');
    expect(host.last().pub.players.map((p) => p.score)).toEqual(scores);
    expect(await host.call('game:start')).toEqual({ ok: false, error: 'wrong_phase' });
    expect(await host.call('game:lobby')).toEqual({ ok: true });
    await settle();
    expect(host.last().pub).toMatchObject({ phase: 'lobby', roundsPlayed: 0 });
    expect(host.last().pub.players.every((p) => p.score === 0)).toBe(true);
    expect(await host.call('game:start')).toEqual({ ok: true });
    await settle();
    expect(host.last().pub.round!.number).toBe(1);
    [host, ...others].forEach((c) => c.s.disconnect());
  });

  it('en la sala a mitad de partida, acortar la partida a las rondas jugadas se rechaza; seguir funciona', async () => {
    const host = await client();
    const a = await host.call('room:create', { name: 'Ana' });
    if (!a.ok) throw new Error(a.error);
    const others: Client[] = [];
    for (const n of ['Bea', 'Ciro', 'Dani']) {
      const c = await client();
      await c.call('room:join', { code: a.code, name: n });
      others.push(c);
    }
    await settle();
    await host.call('room:settings', { rounds: 5 });
    await host.call('game:start');
    for (let r = 1; r <= 3; r++) {
      for (let k = 0; k < 10 && host.last().pub.phase !== 'result'; k++) {
        await host.call('game:advance');
        await settle();
      }
      if (r < 3) await host.call('game:next');
    }
    expect(await host.call('game:lobby')).toEqual({ ok: true });
    expect(await host.call('room:settings', { rounds: 3 })).toEqual({ ok: false, error: 'invalid' });
    await settle();
    expect(host.last().pub.settings.rounds).toBe(5);
    expect(await host.call('game:start')).toEqual({ ok: true });
    await settle();
    expect(host.last().pub.round!.number).toBe(4);
    [host, ...others].forEach((c) => c.s.disconnect());
  });
});
