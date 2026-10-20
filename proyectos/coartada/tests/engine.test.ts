import { describe, expect, it } from 'vitest';
import {
  addPlayer,
  cleanName,
  computeOutcome,
  declare,
  forceAdvance,
  HOST_GRACE_MS,
  SEAT_GRACE_MS,
  kick,
  leave,
  nextRound,
  setConnected,
  setReady,
  startRound,
  testify,
  tick,
  toLobby,
  updateSettings,
  vote,
} from '../src/shared/engine/game';
import { evaluateEncargo } from '../src/shared/engine/encargos';
import { MAX_TESTIMONIES, PACE_TIMINGS, type RoomState } from '../src/shared/types';
import { lobby, started, T0 } from './helpers';

function declareAllTruth(room: RoomState, now = T0) {
  const round = room.round!;
  for (const p of round.participants) declare(room, p, round.setup.truth[p], true, now);
}

function toVote(room: RoomState) {
  declareAllTruth(room);
  const ids = room.round!.participants;
  for (const p of ids) setReady(room, p, true, T0);
  for (const p of ids) setReady(room, p, true, T0);
  expect(room.phase).toBe('vote');
}

describe('lobby & players', () => {
  it('requires 4–10 players to start', () => {
    const { room, deps } = lobby(3);
    expect(startRound(room, room.hostId, T0, deps)).toEqual({ ok: false, error: 'not_enough_players' });
    addPlayer(room, 'Zoe', T0, deps);
    expect(startRound(room, room.hostId, T0, deps).ok).toBe(true);
  });

  it('caps the room at 10 members', () => {
    const { room, deps } = lobby(10);
    expect(addPlayer(room, 'Once', T0, deps)).toEqual({ ok: false, error: 'room_full' });
  });

  it('only the host can start, change settings or kick', () => {
    const { room, ids, deps } = lobby(5);
    expect(startRound(room, ids[1], T0, deps)).toEqual({ ok: false, error: 'not_host' });
    expect(updateSettings(room, ids[1], { pace: 'rapido' }, T0)).toEqual({ ok: false, error: 'not_host' });
    expect(kick(room, ids[1], ids[2], T0)).toEqual({ ok: false, error: 'not_host' });
    expect(updateSettings(room, room.hostId, { pace: 'rapido' }, T0).ok).toBe(true);
    expect(room.settings.pace).toBe('rapido');
  });

  it('cleans and de-duplicates names', () => {
    expect(cleanName('  Ana​   María\u0007 ')).toBe('Ana María');
    expect(cleanName('x'.repeat(40))).toHaveLength(16);
    const { room, deps } = lobby(4);
    const res = addPlayer(room, 'bea', T0, deps);
    expect(res.ok && res.player.name).toBe('bea 2');
    expect(addPlayer(room, '   ', T0, deps)).toEqual({ ok: false, error: 'invalid' });
  });

  it('transfers host only after the grace period', () => {
    const { room, ids } = lobby(5);
    setConnected(room, ids[0], false, T0);
    expect(room.hostId).toBe(ids[0]);
    setConnected(room, ids[2], true, T0 + HOST_GRACE_MS + 1); // any event re-checks the host
    expect(room.hostId).toBe(ids[1]);
  });

  it('host leaving hands the role over immediately', () => {
    const { room, ids } = lobby(5);
    leave(room, ids[0], T0);
    expect(room.hostId).toBe(ids[1]);
    expect(room.players.find((p) => p.id === ids[0])).toBeUndefined();
  });
});

describe('phase flow', () => {
  it('runs declare → investigate(1) → investigate(2) → vote → result', () => {
    const { room, culprit, ids } = started(6);
    expect(room.phase).toBe('declare');
    expect(room.round!.tracesRevealed).toBe(0);
    declareAllTruth(room);
    expect(room.phase).toBe('investigate');
    expect(room.round!.tracesRevealed).toBe(1);
    for (const p of ids) setReady(room, p, true, T0);
    expect(room.round!.tracesRevealed).toBe(2);
    expect(room.round!.ready).toEqual([]);
    for (const p of ids) setReady(room, p, true, T0);
    expect(room.phase).toBe('vote');
    for (const p of ids) vote(room, p, p === culprit ? ids.find((q) => q !== p)! : culprit, T0);
    expect(room.phase).toBe('result');
    expect(room.round!.outcome!.culpritCaught).toBe(true);
    expect(room.roundsPlayed).toBe(1);
  });

  it('timers advance phases and fill missing alibis', () => {
    const { room, culprit, setup, ids } = started(5);
    declare(room, ids[0], setup.truth[ids[0]], false, T0); // draft only
    const end = room.phaseEndsAt!;
    expect(tick(room, end - 1)).toBe(false);
    expect(tick(room, end)).toBe(true);
    expect(room.phase).toBe('investigate');
    const decl = room.round!.declarations;
    expect(decl[ids[0]]).toEqual({ zones: setup.truth[ids[0]], auto: false });
    // The culprit's auto-alibi never confesses.
    expect(decl[culprit]!.zones[setup.scene.slot]).not.toBe(setup.scene.zone);
    expect(decl[culprit]!.auto).toBe(ids[0] === culprit ? false : true);
    tick(room, room.phaseEndsAt!);
    expect(room.round!.tracesRevealed).toBe(2);
    tick(room, room.phaseEndsAt!);
    expect(room.phase).toBe('vote');
    tick(room, room.phaseEndsAt!);
    expect(room.phase).toBe('result');
    expect(room.round!.outcome!.accused).toBeNull();
    expect(room.round!.outcome!.culpritCaught).toBe(false);
  });

  it('uses the pace timings', () => {
    const { room } = started(4);
    expect(room.phaseEndsAt! - T0).toBe(PACE_TIMINGS.normal.declare * 1000);
  });

  it('rejects actions in the wrong phase', () => {
    const { room, ids, setup } = started(5);
    expect(vote(room, ids[0], ids[1], T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(testify(room, ids[0], ids[1], 0, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(setReady(room, ids[0], true, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    declareAllTruth(room);
    expect(declare(room, ids[0], setup.truth[ids[0]], true, T0)).toEqual({ ok: false, error: 'wrong_phase' });
  });

  it('locked alibis are final and validated', () => {
    const { room, ids, setup } = started(5);
    expect(declare(room, ids[0], ['nope', 'x', 'y'], true, T0)).toEqual({ ok: false, error: 'invalid' });
    expect(declare(room, ids[0], setup.truth[ids[0]].slice(0, 2), true, T0)).toEqual({ ok: false, error: 'invalid' });
    expect(declare(room, ids[0], setup.truth[ids[0]], true, T0).ok).toBe(true);
    expect(declare(room, ids[0], setup.truth[ids[0]], true, T0)).toEqual({ ok: false, error: 'already_done' });
  });

  it('players outside the round cannot act', () => {
    const { room, deps } = started(4);
    const late = addPlayer(room, 'Tarde', T0, deps);
    expect(late.ok).toBe(true);
    if (!late.ok) return;
    expect(room.round!.participants).not.toContain(late.player.id);
    expect(declare(room, late.player.id, room.round!.setup.truth[room.round!.participants[0]], true, T0)).toEqual({
      ok: false,
      error: 'not_participant',
    });
  });

  it('host can force the current step; others cannot', () => {
    const { room, ids } = started(5);
    expect(forceAdvance(room, ids[1], T0)).toEqual({ ok: false, error: 'not_host' });
    expect(forceAdvance(room, room.hostId, T0).ok).toBe(true);
    expect(room.phase).toBe('investigate');
  });

  it('a disconnected player does not block early advance', () => {
    const { room, ids } = started(5);
    setConnected(room, ids[4], false, T0);
    const round = room.round!;
    for (const p of ids.slice(0, 4)) declare(room, p, round.setup.truth[p], true, T0);
    expect(room.phase).toBe('investigate');
    expect(round.declarations[ids[4]]!.auto).toBe(true);
  });
});

describe('testimonies', () => {
  it('records "I was with X" using the speaker\'s declared zone and checks it', () => {
    const { room, ids, setup } = started(6);
    declareAllTruth(room);
    const [a, b] = ids;
    expect(testify(room, a, b, 1, T0).ok).toBe(true);
    const t = room.round!.testimonies[0];
    expect(t.zone).toBe(setup.truth[a][1]);
    expect(testify(room, a, b, 1, T0)).toEqual({ ok: false, error: 'already_done' });
    expect(testify(room, a, a, 0, T0)).toEqual({ ok: false, error: 'invalid' });
    expect(testify(room, a, 'ghost', 0, T0)).toEqual({ ok: false, error: 'invalid' });
    expect(testify(room, a, b, 7, T0)).toEqual({ ok: false, error: 'invalid' });
  });

  it(`limits each player to ${MAX_TESTIMONIES} testimonies`, () => {
    const { room, ids } = started(6);
    declareAllTruth(room);
    for (let i = 0; i < MAX_TESTIMONIES; i++) expect(testify(room, ids[0], ids[1 + i], 0, T0).ok).toBe(true);
    expect(testify(room, ids[0], ids[4], 0, T0)).toEqual({ ok: false, error: 'limit_reached' });
  });

  it('a new testimony clears readiness so people can react', () => {
    const { room, ids } = started(5);
    declareAllTruth(room);
    setReady(room, ids[1], true, T0);
    expect(room.round!.ready).toContain(ids[1]);
    testify(room, ids[0], ids[2], 0, T0);
    expect(room.round!.ready).toEqual([]);
  });
});

describe('voting', () => {
  it('rejects self-votes, unknown targets and double votes', () => {
    const { room, ids } = started(5);
    toVote(room);
    expect(vote(room, ids[0], ids[0], T0)).toEqual({ ok: false, error: 'invalid' });
    expect(vote(room, ids[0], 'ghost', T0)).toEqual({ ok: false, error: 'invalid' });
    expect(vote(room, ids[0], ids[1], T0).ok).toBe(true);
    expect(vote(room, ids[0], ids[2], T0)).toEqual({ ok: false, error: 'already_done' });
    expect(room.round!.votes[ids[0]]).toBe(ids[1]);
  });

  it('a tie triggers a runoff between the tied players', () => {
    const { room, ids } = started(4);
    toVote(room);
    const [a, b, c, d] = ids;
    vote(room, a, b, T0);
    vote(room, b, a, T0);
    vote(room, c, a, T0);
    vote(room, d, b, T0);
    expect(room.phase).toBe('runoff');
    expect(room.round!.runoff!.candidates.sort()).toEqual([a, b].sort());
    expect(vote(room, c, d, T0)).toEqual({ ok: false, error: 'invalid' });
    vote(room, a, b, T0);
    vote(room, b, a, T0);
    vote(room, c, a, T0);
    vote(room, d, a, T0);
    expect(room.phase).toBe('result');
    expect(room.round!.outcome!.accused).toBe(a);
  });

  it('a tied runoff convicts nobody, so the culprit escapes', () => {
    const { room, ids, culprit } = started(4);
    toVote(room);
    const [a, b, c, d] = ids;
    vote(room, a, b, T0);
    vote(room, b, a, T0);
    vote(room, c, a, T0);
    vote(room, d, b, T0);
    vote(room, a, b, T0);
    vote(room, b, a, T0);
    vote(room, c, a, T0);
    vote(room, d, b, T0);
    const o = room.round!.outcome!;
    expect(o.accused).toBeNull();
    expect(o.culpritCaught).toBe(false);
    expect(o.score[culprit].map((l) => l.reason)).toContain('culpable_escapa');
  });

  it('nobody voting means nobody is accused', () => {
    const { room } = started(5);
    toVote(room);
    tick(room, room.phaseEndsAt!);
    expect(room.round!.outcome!.accused).toBeNull();
  });

  it('a player disconnecting during the vote does not stall it', () => {
    const { room, ids, culprit } = started(5);
    toVote(room);
    const gone = ids.find((p) => p !== culprit)!;
    setConnected(room, gone, false, T0);
    for (const p of ids) if (p !== gone) vote(room, p, p === culprit ? gone : culprit, T0);
    expect(room.phase).toBe('result');
  });
});

describe('scoring', () => {
  it('culprit caught: innocents +2, correct voters +1, evil 0', () => {
    const { room, ids, culprit, accomplice, innocents } = started(6);
    toVote(room);
    const wrong = innocents[0];
    for (const p of ids) {
      if (p === culprit || p === accomplice) vote(room, p, wrong, T0);
      else if (p === wrong) vote(room, p, accomplice!, T0);
      else vote(room, p, culprit, T0);
    }
    const o = room.round!.outcome!;
    expect(o.culpritCaught).toBe(true);
    const pts = (p: string) => o.score[p].reduce((s, l) => s + l.points, 0);
    expect(pts(culprit)).toBe(0);
    expect(pts(accomplice!)).toBe(0);
    expect(pts(wrong)).toBe(2);
    for (const p of innocents.filter((q) => q !== wrong)) expect(pts(p)).toBe(3);
    expect(room.players.find((p) => p.id === culprit)!.score).toBe(0);
  });

  it('culprit escapes: culprit +4, accomplice +3, innocents only for correct votes', () => {
    const { room, ids, culprit, accomplice, innocents } = started(7);
    toVote(room);
    const scapegoat = innocents[0];
    for (const p of ids) vote(room, p, p === scapegoat ? culprit : scapegoat, T0);
    const o = room.round!.outcome!;
    const pts = (p: string) => o.score[p].reduce((s, l) => s + l.points, 0);
    expect(o.accused).toBe(scapegoat);
    expect(pts(culprit)).toBe(4);
    expect(pts(accomplice!)).toBe(3);
    expect(pts(scapegoat)).toBe(1);
    for (const p of innocents.slice(1)) expect(pts(p)).toBe(0);
  });

  it('"cazador" rewards a true testimony that exposes a real lie, once', () => {
    let checked = 0;
    for (let i = 0; i < 20 && checked < 3; i++) {
      const { room, setup, culprit, ids } = started(6, `cazador-${i}`);
      const round = room.round!;
      // An honest memory about the culprit at a non-crime slot.
      const holder = ids.find((p) => setup.roles[p] === 'inocente' && setup.memories[p].some((m) => m.with === culprit));
      if (!holder) continue;
      const mem = setup.memories[holder].find((m) => m.with === culprit)!;
      for (const p of round.participants) {
        const zones = setup.truth[p].slice();
        if (p === culprit) {
          zones[setup.scene.slot] = setup.zones.find((z) => z !== setup.scene.zone)!;
          zones[mem.slot] = setup.zones.find((z) => z !== setup.truth[p][mem.slot] && z !== setup.scene.zone)!;
        }
        declare(room, p, zones, true, T0);
      }
      testify(room, holder, culprit, mem.slot, T0);
      const o = computeOutcome(round, null);
      expect(o.exposing).toHaveLength(1);
      expect(o.score[holder].filter((l) => l.reason === 'cazador')).toHaveLength(1);
      expect(o.lies[culprit]).toContain(mem.slot);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('encargos', () => {
  it('are dealt to everyone when enabled and evaluated objectively', () => {
    const { room, ids, setup } = started(6, 'enc-seed', { encargos: true });
    expect(Object.keys(setup.encargos!)).toHaveLength(6);
    toVote(room);
    const round = room.round!;
    for (const p of ids) vote(room, p, p === ids[0] ? ids[1] : ids[0], T0);
    const o = round.outcome!;
    for (const p of ids) expect(o.encargoDone![p]).toBe(evaluateEncargo(round, p, setup.encargos![p]));
  });

  it('evaluates each kind', () => {
    const { room, ids } = started(5);
    toVote(room);
    const round = room.round!;
    const [a, b, c, d, e] = ids;
    vote(room, a, c, T0);
    vote(room, b, c, T0);
    vote(room, d, c, T0);
    vote(room, e, a, T0);
    expect(evaluateEncargo(round, a, { kind: 'votes_on', target: c })).toBe(true);
    expect(evaluateEncargo(round, e, { kind: 'votes_on', target: a })).toBe(false);
    expect(evaluateEncargo(round, b, { kind: 'no_votes' })).toBe(true);
    expect(evaluateEncargo(round, a, { kind: 'no_votes' })).toBe(false);
    expect(evaluateEncargo(round, a, { kind: 'same_vote', target: b })).toBe(true);
    expect(evaluateEncargo(round, e, { kind: 'same_vote', target: b })).toBe(false);
    const zone = round.declarations[a]!.zones[0];
    expect(evaluateEncargo(round, a, { kind: 'claim_zone', zone })).toBe(true);
  });
});

describe('match flow', () => {
  it('next round keeps scores; final after the configured rounds; new match resets', () => {
    const { room, ids, deps } = lobby(4);
    room.settings.rounds = 3;
    startRound(room, room.hostId, T0, deps);
    for (let r = 1; r <= 3; r++) {
      expect(room.round!.number).toBe(r);
      toVote(room);
      tick(room, room.phaseEndsAt!);
      expect(room.phase).toBe('result');
      expect(nextRound(room, ids[1], T0, deps)).toEqual({ ok: false, error: 'not_host' });
      expect(nextRound(room, room.hostId, T0, deps).ok).toBe(true);
    }
    expect(room.phase).toBe('final');
    room.players[0].score = 9;
    expect(toLobby(room, room.hostId, T0).ok).toBe(true);
    expect(room.phase).toBe('lobby');
    expect(room.players.every((p) => p.score === 0)).toBe(true);
    expect(room.history).toEqual([]);
  });

  it('a player momentarily disconnected when the next round starts still gets a seat in it', () => {
    const { room, ids, deps } = lobby(6);
    room.settings.rounds = 0;
    startRound(room, room.hostId, T0, deps);
    toVote(room);
    tick(room, room.phaseEndsAt!);
    expect(room.phase).toBe('result');
    const t = room.phaseEndsAt ?? T0;
    // Two phones lock while the group talks over the verdict.
    setConnected(room, ids[4], false, t);
    setConnected(room, ids[5], false, t);
    expect(nextRound(room, room.hostId, t + 5 * 60_000, deps).ok).toBe(true);
    expect(room.round!.participants).toEqual(ids);
    expect(Object.keys(room.round!.setup.roles).sort()).toEqual([...ids].sort());
    // Gone for longer than the grace period: left out of the round after that.
    toVote(room);
    tick(room, room.phaseEndsAt!);
    setConnected(room, ids[0], true, t + SEAT_GRACE_MS + 1); // any event; ids[4] and ids[5] stay offline
    expect(nextRound(room, room.hostId, t + SEAT_GRACE_MS + 1, deps).ok).toBe(true);
    expect(room.round!.participants).toEqual(ids.slice(0, 4));
    // Someone who pressed «Salir» is never dealt in, even right away.
    toVote(room);
    tick(room, room.phaseEndsAt!);
    leave(room, ids[3], T0);
    expect(nextRound(room, room.hostId, t + SEAT_GRACE_MS + 2, deps)).toEqual({ ok: false, error: 'not_enough_players' });
  });

  it('absent players get a seat but never make up the minimum of connected people', () => {
    const { room, ids, deps } = lobby(4);
    room.settings.rounds = 0;
    startRound(room, room.hostId, T0, deps);
    toVote(room);
    tick(room, room.phaseEndsAt!);
    const t = room.phaseEndsAt ?? T0;
    setConnected(room, ids[2], false, t);
    setConnected(room, ids[3], false, t);
    // 2 here + 2 locked phones: not a game yet; the host can try again when they are back.
    expect(nextRound(room, room.hostId, t + 1000, deps)).toEqual({ ok: false, error: 'not_enough_players' });
    expect(room.phase).toBe('result');
    setConnected(room, ids[2], true, t + 20_000);
    setConnected(room, ids[3], true, t + 21_000);
    expect(nextRound(room, room.hostId, t + 22_000, deps).ok).toBe(true);
    expect(room.round!.participants).toEqual(ids);
    // 5 players, one absent: the 4 here are enough and the absent one still gets a seat.
    const five = lobby(5);
    five.room.settings.rounds = 0;
    setConnected(five.room, five.ids[4], false, T0);
    expect(startRound(five.room, five.room.hostId, T0 + 1000, five.deps).ok).toBe(true);
    expect(five.room.round!.participants).toEqual(five.ids);
  });

  it('does not repeat scenarios back to back', () => {
    const { room, deps } = lobby(5);
    room.settings.rounds = 0;
    const seen: string[] = [];
    startRound(room, room.hostId, T0, deps);
    for (let r = 0; r < Math.min(deps.scenarios.length, 8); r++) {
      seen.push(room.round!.setup.scenarioId);
      toVote(room);
      tick(room, room.phaseEndsAt!);
      nextRound(room, room.hostId, T0, deps);
    }
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('a player who leaves mid-round stays until the round ends, then is removed', () => {
    const { room, ids, deps } = started(5);
    leave(room, ids[3], T0);
    expect(room.players.find((p) => p.id === ids[3])?.left).toBe(true);
    declareAllTruth(room);
    expect(room.phase).toBe('investigate');
    forceAdvance(room, room.hostId, T0);
    forceAdvance(room, room.hostId, T0);
    forceAdvance(room, room.hostId, T0);
    expect(room.phase).toBe('result');
    nextRound(room, room.hostId, T0, deps);
    expect(room.players.find((p) => p.id === ids[3])).toBeUndefined();
    expect(room.round!.participants).toHaveLength(4);
  });
});
