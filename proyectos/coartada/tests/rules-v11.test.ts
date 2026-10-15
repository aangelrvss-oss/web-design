// v1.1 rules: last defense, timings by group size, testimony status, scoring edge cases,
// full rounds for every supported group size.
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { validateSetup } from '../src/shared/content/validate';
import {
  declare,
  endDefense,
  forceAdvance,
  nextRound,
  point,
  setConnected,
  setReady,
  testify,
  tick,
  vote,
} from '../src/shared/engine/game';
import { evaluateEncargo, testimonyStatus } from '../src/shared/engine/encargos';
import { publicView } from '../src/shared/engine/views';
import { PACE_TIMINGS, SCORE_POINTS, timingsFor, type RoomState } from '../src/shared/types';
import { lobby, started, T0 } from './helpers';
import { startRound } from '../src/shared/engine/game';

const total = (room: RoomState, id: string) => room.round!.outcome!.score[id].reduce((s, l) => s + l.points, 0);

function declareTruth(room: RoomState, liarAtCrime = true) {
  const r = room.round!;
  for (const p of r.participants) {
    const zones = r.setup.truth[p].slice();
    if (liarAtCrime && r.setup.roles[p] === 'culpable') zones[r.setup.scene.slot] = r.setup.zones.find((z) => z !== r.setup.scene.zone)!;
    declare(room, p, zones, true, T0);
  }
}

/** Both investigation steps, everyone ready. */
function finishInvestigation(room: RoomState) {
  const ids = room.round!.participants;
  for (const p of ids) setReady(room, p, true, T0);
  expect(room.round!.tracesRevealed).toBe(2);
  for (const p of ids) setReady(room, p, true, T0);
}

describe('timings are centralized by pace and group size', () => {
  it('scales the investigation, not the declaration or the defense', () => {
    for (const pace of ['rapido', 'normal', 'relajado'] as const) {
      const small = timingsFor(pace, 4);
      const mid = timingsFor(pace, 6);
      const big = timingsFor(pace, 10);
      expect(mid).toEqual(PACE_TIMINGS[pace]);
      expect(small.investigate1).toBeLessThan(mid.investigate1);
      expect(big.investigate2).toBeGreaterThan(mid.investigate2);
      expect(big.vote).toBe(mid.vote + 10);
      for (const t of [small, mid, big]) {
        expect(t.declare).toBe(PACE_TIMINGS[pace].declare);
        expect(t.defense).toBe(PACE_TIMINGS[pace].defense);
        expect(t.investigate1 % 5).toBe(0);
      }
    }
    expect(timingsFor('normal', 6).defense).toBe(15);
    expect(timingsFor('rapido', 6).defense).toBe(12);
    expect(timingsFor('relajado', 6).defense).toBe(20);
  });

  it('round length grows moderately with group size (normal pace, full timers)', () => {
    const len = (n: number) => {
      const t = timingsFor('normal', n);
      return t.declare + t.investigate1 + t.investigate2 + t.defense + t.vote;
    };
    expect(len(10) / len(4)).toBeLessThan(1.35);
  });

  it('the engine uses those timings', () => {
    const { room } = started(8, 'timing-8');
    expect(room.phaseEndsAt! - T0).toBe(timingsFor('normal', 8).declare * 1000);
    declareTruth(room);
    expect(room.phaseEndsAt! - T0).toBe(timingsFor('normal', 8).investigate1 * 1000);
  });
});

describe('última defensa', () => {
  it('the most-pointed person defends; pointers stay secret until the verdict', () => {
    const { room, ids, culprit } = started(6, 'def-1');
    declareTruth(room);
    const target = ids.find((p) => p !== ids[0])!;
    for (const p of ids) if (p !== target) point(room, p, target, T0);
    point(room, target, ids[0], T0);
    const pub = publicView(room, SCENARIOS);
    expect(pub.round!.pointedCount).toBe(6);
    expect(JSON.stringify(pub)).not.toContain('"pointers"');
    finishInvestigation(room);
    expect(room.phase).toBe('defense');
    expect(room.round!.defense).toEqual({ defender: target, pointerCount: 5, tiedCount: 1, reason: 'senalado' });
    expect(room.phaseEndsAt! - T0).toBe(timingsFor('normal', 6).defense * 1000);
    // Nothing can change during the defense.
    expect(testify(room, ids[1], ids[2], 0, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(declare(room, target, room.round!.setup.truth[target], true, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(point(room, ids[1], ids[2], T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(setReady(room, ids[1], true, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(vote(room, ids[1], ids[2], T0)).toEqual({ ok: false, error: 'wrong_phase' });
    // The defense reveals no role.
    expect(JSON.stringify(publicView(room, SCENARIOS).round)).not.toContain('culpable');
    tick(room, room.phaseEndsAt!);
    expect(room.phase).toBe('vote');
    for (const p of ids) vote(room, p, p === culprit ? ids.find((q) => q !== p)! : culprit, T0);
    expect(publicView(room, SCENARIOS).round!.reveal!.pointers[target]).toBe(ids[0]);
  });

  it('a tie is broken by a draw seeded with the round: same seed, same defender', () => {
    const pick = () => {
      const { room, ids } = started(6, 'def-tie');
      declareTruth(room);
      point(room, ids[0], ids[1], T0);
      point(room, ids[1], ids[2], T0);
      point(room, ids[2], ids[1], T0);
      point(room, ids[3], ids[2], T0);
      finishInvestigation(room);
      return { d: room.round!.defense!, ids };
    };
    const a = pick();
    const b = pick();
    expect(a.d.reason).toBe('sorteo');
    expect(a.d.tiedCount).toBe(2);
    expect(a.d.pointerCount).toBe(2);
    expect([a.ids[1], a.ids[2]]).toContain(a.d.defender);
    expect(b.d.defender).toBe(a.d.defender);
  });

  it('nobody pointed: no defense, straight to the vote', () => {
    const { room } = started(5, 'def-none');
    declareTruth(room);
    finishInvestigation(room);
    expect(room.phase).toBe('vote');
    expect(room.round!.defense).toEqual({ defender: null, pointerCount: 0, tiedCount: 0, reason: 'nadie_senalado' });
  });

  it('pointers can be changed or withdrawn; invalid targets are rejected', () => {
    const { room, ids } = started(5, 'def-change');
    expect(point(room, ids[0], ids[1], T0)).toEqual({ ok: false, error: 'wrong_phase' });
    declareTruth(room);
    expect(point(room, ids[0], ids[0], T0)).toEqual({ ok: false, error: 'invalid' });
    expect(point(room, ids[0], 'ghost', T0)).toEqual({ ok: false, error: 'invalid' });
    point(room, ids[0], ids[1], T0);
    point(room, ids[0], ids[2], T0);
    point(room, ids[3], ids[2], T0);
    point(room, ids[3], null, T0);
    finishInvestigation(room);
    expect(room.round!.defense!.defender).toBe(ids[2]);
    expect(room.round!.defense!.pointerCount).toBe(1);
  });

  it('defender offline when chosen: skipped; defender drops mid-defense: ends', () => {
    {
      const { room, ids } = started(5, 'def-off');
      declareTruth(room);
      point(room, ids[0], ids[4], T0);
      setConnected(room, ids[4], false, T0);
      finishInvestigation(room);
      expect(room.phase).toBe('vote');
      expect(room.round!.defense!.reason).toBe('desconectado');
    }
    {
      const { room, ids } = started(5, 'def-drop');
      declareTruth(room);
      point(room, ids[0], ids[4], T0);
      finishInvestigation(room);
      expect(room.phase).toBe('defense');
      setConnected(room, ids[4], false, T0);
      expect(room.phase).toBe('vote');
    }
  });

  it('the defender or the host can end it early; nobody else can', () => {
    const { room, ids } = started(5, 'def-end');
    declareTruth(room);
    const defender = ids[3];
    point(room, ids[1], defender, T0);
    finishInvestigation(room);
    const other = ids.find((p) => p !== defender && p !== room.hostId)!;
    expect(endDefense(room, other, T0)).toEqual({ ok: false, error: 'not_host' });
    expect(endDefense(room, defender, T0).ok).toBe(true);
    expect(room.phase).toBe('vote');
    expect(endDefense(room, defender, T0)).toEqual({ ok: false, error: 'wrong_phase' });

    const second = started(5, 'def-host');
    declareTruth(second.room);
    point(second.room, second.ids[1], second.ids[3], T0);
    finishInvestigation(second.room);
    expect(forceAdvance(second.room, second.room.hostId, T0).ok).toBe(true);
    expect(second.room.phase).toBe('vote');
  });

  it('works on every pace, ending by timer', () => {
    for (const pace of ['rapido', 'normal', 'relajado'] as const) {
      const l = lobby(7);
      l.room.settings.pace = pace;
      startRound(l.room, l.room.hostId, T0, l.deps, `pace-${pace}`);
      declareTruth(l.room);
      point(l.room, l.ids[0], l.ids[1], T0);
      finishInvestigation(l.room);
      expect(l.room.phase).toBe('defense');
      expect(l.room.phaseEndsAt! - T0).toBe(PACE_TIMINGS[pace].defense * 1000);
      expect(tick(l.room, l.room.phaseEndsAt! - 1)).toBe(false);
      expect(tick(l.room, l.room.phaseEndsAt!)).toBe(true);
      expect(l.room.phase).toBe('vote');
    }
  });

  it('the whole round can run on timers alone without getting stuck', () => {
    const { room, ids } = started(6, 'def-timers');
    let guard = 0;
    while (room.phase !== 'result' && guard++ < 20) {
      if (room.phase === 'investigate' && !room.round!.pointers[ids[0]]) point(room, ids[0], ids[1], T0);
      tick(room, room.phaseEndsAt!);
    }
    expect(room.phase).toBe('result');
    expect(room.round!.defense!.defender).toBe(ids[1]);
  });
});

describe('testimony status', () => {
  it('coincide / contradice / sin contraste (automatic alibi)', () => {
    const { room, ids, setup } = started(6, 'status');
    const auto = ids[5];
    for (const p of ids.slice(0, 5)) declare(room, p, setup.truth[p], true, T0);
    tick(room, room.phaseEndsAt!); // ids[5] gets an automatic alibi
    expect(room.round!.declarations[auto]!.auto).toBe(true);
    testify(room, ids[0], ids[1], 0, T0);
    testify(room, ids[0], auto, 0, T0);
    const r = room.round!;
    const [t1, t2] = r.testimonies;
    expect(['coincide', 'contradice']).toContain(testimonyStatus(r, t1));
    expect(testimonyStatus(r, t2)).toBe('sin_contraste');
    expect(publicView(room, SCENARIOS).round!.testimonies[1].status).toBe('sin_contraste');
    // A non-verifiable testimony never satisfies "corroborated" or "contradict" objectives.
    expect(evaluateEncargo(r, auto, { kind: 'corroborated' })).toBe(false);
    expect(evaluateEncargo(r, ids[0], { kind: 'contradict', target: auto })).toBe(false);
  });
});

describe('scoring edge cases', () => {
  it('no valid vote: nobody accused, culprit +4, accomplice +3, innocents 0', () => {
    const { room, culprit, accomplice, innocents } = started(6, 'score-novote');
    declareTruth(room);
    finishInvestigation(room);
    tick(room, room.phaseEndsAt!);
    const o = room.round!.outcome!;
    expect(o.accused).toBeNull();
    expect(total(room, culprit)).toBe(SCORE_POINTS.culpable_escapa);
    expect(total(room, accomplice!)).toBe(SCORE_POINTS.complice_escapa);
    for (const p of innocents) expect(total(room, p)).toBe(0);
  });

  it('accusing the accomplice lets the culprit escape (accomplice still +3)', () => {
    const { room, ids, culprit, accomplice } = started(7, 'score-acc');
    declareTruth(room);
    finishInvestigation(room);
    for (const p of ids) vote(room, p, p === accomplice ? culprit : accomplice!, T0);
    const o = room.round!.outcome!;
    expect(o.accused).toBe(accomplice);
    expect(o.culpritCaught).toBe(false);
    expect(total(room, accomplice!)).toBe(3);
    expect(total(room, culprit)).toBe(4);
  });

  it('only the first vote earns "votaste al culpable", even if the runoff goes another way', () => {
    const { room, ids, culprit, innocents } = started(4, 'score-runoff');
    declareTruth(room);
    finishInvestigation(room);
    const [a, b] = innocents;
    // 2 votes culprit, 2 votes innocent a → tie → runoff → a accused.
    for (const p of ids) {
      if (p === culprit) vote(room, p, a, T0);
      else if (p === a) vote(room, p, culprit, T0);
      else if (p === b) vote(room, p, culprit, T0);
      else vote(room, p, a, T0);
    }
    expect(room.phase).toBe('runoff');
    for (const p of ids) vote(room, p, p === a ? culprit : a, T0);
    const o = room.round!.outcome!;
    expect(o.accused).toBe(a);
    expect(total(room, a)).toBe(1); // voted the culprit in the first round
    expect(total(room, b)).toBe(1);
  });

  it('objectives off: no objective lines; on: exactly one possible +1 each', () => {
    const off = started(5, 'obj-off');
    declareTruth(off.room);
    finishInvestigation(off.room);
    tick(off.room, off.room.phaseEndsAt!);
    expect(off.room.round!.outcome!.encargoDone).toBeNull();
    expect(Object.values(off.room.round!.outcome!.score).flat().some((l) => l.reason === 'encargo')).toBe(false);

    const on = started(5, 'obj-on', { encargos: true });
    declareTruth(on.room);
    finishInvestigation(on.room);
    tick(on.room, on.room.phaseEndsAt!);
    for (const lines of Object.values(on.room.round!.outcome!.score)) {
      expect(lines.filter((l) => l.reason === 'encargo').length).toBeLessThanOrEqual(1);
      expect(lines.filter((l) => l.reason === 'cazador').length).toBeLessThanOrEqual(1);
    }
  });

  it('points accumulate across rounds and the round state resets', () => {
    const { room, deps } = lobby(5);
    startRound(room, room.hostId, T0, deps, 'acc-1');
    declareTruth(room);
    point(room, room.round!.participants[0], room.round!.participants[1], T0);
    finishInvestigation(room);
    tick(room, room.phaseEndsAt!);
    tick(room, room.phaseEndsAt!);
    expect(room.phase).toBe('result');
    const after1 = room.players.map((p) => p.score);
    expect(after1.reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    nextRound(room, room.hostId, T0, deps);
    const r2 = room.round!;
    expect(r2.number).toBe(2);
    expect(r2.pointers).toEqual({});
    expect(r2.defense).toBeNull();
    expect(r2.testimonies).toEqual([]);
    expect(r2.votes).toEqual({});
    expect(r2.tracesRevealed).toBe(0);
    expect(room.phase).toBe('declare');
    expect(room.players.map((p) => p.score)).toEqual(after1);
  });
});

describe('a complete round for every group size', () => {
  for (const n of [4, 5, 6, 7, 8, 10]) {
    it(`${n} players`, () => {
      const { room, ids, setup, culprit, accomplice } = started(n, `full-${n}`);
      expect(validateSetup(setup, ids)).toEqual([]);
      expect(accomplice !== null).toBe(n >= 6);
      expect(setup.zones).toHaveLength(n <= 6 ? 4 : 5);
      // Evidence matches the culprit's real night and never the crime hour.
      for (const t of setup.traces) {
        expect(setup.truth[culprit][t.slot]).toBe(t.zone);
        expect(t.slot).not.toBe(setup.scene.slot);
      }
      declareTruth(room);
      expect(room.phase).toBe('investigate');
      const pub = publicView(room, SCENARIOS);
      expect(Object.keys(pub.round!.declarations!)).toHaveLength(n);
      const m = setup.memories[ids[0]][0];
      if (room.round!.declarations[ids[0]]!.zones[m.slot] === m.zone) expect(testify(room, ids[0], m.with, m.slot, T0).ok).toBe(true);
      for (const p of ids) point(room, p, p === culprit ? ids.find((q) => q !== p)! : culprit, T0);
      finishInvestigation(room);
      expect(room.phase).toBe('defense');
      expect(room.round!.defense!.defender).toBe(culprit);
      endDefense(room, culprit, T0);
      for (const p of ids) vote(room, p, p === culprit ? ids.find((q) => q !== p)! : culprit, T0);
      expect(room.phase).toBe('result');
      const o = room.round!.outcome!;
      expect(o.culpritCaught).toBe(true);
      for (const p of ids) {
        const role = setup.roles[p];
        const pts = total(room, p);
        if (role === 'inocente') expect(pts).toBeGreaterThanOrEqual(3);
        else expect(pts).toBeLessThanOrEqual(1); // only a possible cazador point
      }
    });
  }
});
