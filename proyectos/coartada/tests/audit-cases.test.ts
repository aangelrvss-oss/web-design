// Independent audit: one test per situation in the v1.1 QA brief. Each checks the engine
// state, the outcome shown in the public view and the points awarded.
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/shared/content/scenarios';
import {
  declare,
  endDefense,
  leave,
  nextRound,
  point,
  setReady,
  startRound,
  testify,
  tick,
  toLobby,
  vote,
} from '../src/shared/engine/game';
import { testimonyStatus } from '../src/shared/engine/encargos';
import { publicView } from '../src/shared/engine/views';
import type { RoomState } from '../src/shared/types';
import { lobby, started, T0 } from './helpers';

const pts = (room: RoomState, id: string) => room.round!.outcome!.score[id].reduce((s, l) => s + l.points, 0);
const reasons = (room: RoomState, id: string) => room.round!.outcome!.score[id].map((l) => l.reason).sort();

function honest(room: RoomState) {
  const r = room.round!;
  for (const p of r.participants) {
    const z = r.setup.truth[p].slice();
    if (r.setup.roles[p] === 'culpable') z[r.setup.scene.slot] = r.setup.zones.find((x) => x !== r.setup.scene.zone)!;
    declare(room, p, z, true, T0);
  }
}
function toVote(room: RoomState) {
  honest(room);
  const ids = room.round!.participants;
  for (const p of ids) setReady(room, p, true, T0);
  for (const p of ids) setReady(room, p, true, T0);
  expect(room.phase).toBe('vote');
}
const other = (ids: string[], not: string[]) => ids.find((p) => !not.includes(p))!;

describe('auditoría de reglas: casos concretos', () => {
  it('1. el grupo descubre a la persona culpable', () => {
    const { room, ids, culprit, innocents } = started(5, 'a1');
    toVote(room);
    for (const p of ids) vote(room, p, p === culprit ? innocents[0] : culprit, T0);
    const pub = publicView(room, SCENARIOS);
    expect(pub.round!.reveal!.outcome.culpritCaught).toBe(true);
    for (const p of innocents) expect(reasons(room, p)).toEqual(['grupo_gana', 'voto_certero']);
    expect(pts(room, culprit)).toBe(0);
  });

  it('2. la persona culpable escapa (sin cómplice)', () => {
    const { room, ids, culprit, innocents } = started(5, 'a2');
    toVote(room);
    for (const p of ids) vote(room, p, p === innocents[0] ? innocents[1] : innocents[0], T0);
    expect(room.round!.outcome!.accused).toBe(innocents[0]);
    expect(pts(room, culprit)).toBe(4);
    for (const p of innocents) expect(pts(room, p)).toBe(0);
  });

  it('3. la persona culpable escapa con cómplice', () => {
    const { room, ids, culprit, accomplice, innocents } = started(6, 'a3');
    toVote(room);
    for (const p of ids) vote(room, p, p === innocents[0] ? innocents[1] : innocents[0], T0);
    expect(pts(room, culprit)).toBe(4);
    expect(pts(room, accomplice!)).toBe(3);
  });

  it('4. la persona culpable es descubierta y hay cómplice: el cómplice no puntúa', () => {
    const { room, ids, culprit, accomplice } = started(6, 'a4');
    toVote(room);
    for (const p of ids) vote(room, p, p === culprit ? other(ids, [p]) : culprit, T0);
    expect(room.round!.outcome!.culpritCaught).toBe(true);
    expect(pts(room, accomplice!)).toBe(0);
    expect(pts(room, culprit)).toBe(0);
  });

  it('5. alguien vota bien pero la persona culpable escapa: +1 de todos modos', () => {
    const { room, ids, culprit, innocents } = started(5, 'a5');
    toVote(room);
    const [sharp, ...rest] = innocents;
    vote(room, sharp, culprit, T0);
    for (const p of ids) if (p !== sharp) vote(room, p, p === rest[0] ? rest[1] : rest[0], T0);
    expect(room.round!.outcome!.culpritCaught).toBe(false);
    expect(reasons(room, sharp)).toEqual(['voto_certero']);
  });

  it('6. alguien no vota: no cuenta y no recibe el punto de voto', () => {
    const { room, ids, culprit, innocents } = started(5, 'a6');
    toVote(room);
    const silent = innocents[0];
    for (const p of ids) if (p !== silent) vote(room, p, p === culprit ? innocents[1] : culprit, T0);
    expect(room.phase).toBe('vote');
    tick(room, room.phaseEndsAt!);
    expect(room.round!.votes[silent]).toBeUndefined();
    expect(room.round!.outcome!.culpritCaught).toBe(true);
    expect(reasons(room, silent)).toEqual(['grupo_gana']);
  });

  it('7. empate y segundo empate: nadie es acusado y la persona culpable se libra', () => {
    const { room, ids, culprit, innocents } = started(4, 'a7');
    toVote(room);
    const [a, b, c] = innocents;
    vote(room, culprit, a, T0);
    vote(room, a, b, T0);
    vote(room, b, a, T0);
    vote(room, c, b, T0);
    expect(room.phase).toBe('runoff');
    expect(room.round!.runoff!.candidates.sort()).toEqual([a, b].sort());
    vote(room, culprit, a, T0);
    vote(room, a, b, T0);
    vote(room, b, a, T0);
    vote(room, c, b, T0);
    const o = room.round!.outcome!;
    expect(o.accused).toBeNull();
    expect(o.culpritCaught).toBe(false);
    expect(pts(room, culprit)).toBe(4);
    void ids;
  });

  it('8. alguien no sella a tiempo: coartada automática marcada, nunca confiesa', () => {
    for (let i = 0; i < 6; i++) {
      const { room, ids, culprit, setup } = started(5, `a8-${i}`);
      for (const p of ids) if (p !== culprit) declare(room, p, setup.truth[p], true, T0);
      tick(room, room.phaseEndsAt!);
      const d = room.round!.declarations[culprit]!;
      expect(d.auto).toBe(true);
      expect(d.zones[setup.scene.slot]).not.toBe(setup.scene.zone);
      expect(publicView(room, SCENARIOS).round!.declarations![culprit].auto).toBe(true);
    }
  });

  it('9 y 11. un testimonio que coincide no demuestra quién dice la verdad', () => {
    // Two people can coincide while both lie: the status only compares declarations.
    const { room, ids, setup } = started(5, 'a9');
    const [x, y] = ids;
    const fake = setup.zones.find((z) => z !== setup.truth[x][0] && z !== setup.truth[y][0] && !(setup.scene.slot === 0 && z === setup.scene.zone))!;
    for (const p of ids) {
      const zones = setup.truth[p].slice();
      if (p === x || p === y) zones[0] = fake;
      if (setup.roles[p] === 'culpable') zones[setup.scene.slot] = setup.zones.find((z) => z !== setup.scene.zone && z !== zones[setup.scene.slot]) ?? zones[setup.scene.slot];
      declare(room, p, zones, true, T0);
    }
    testify(room, x, y, 0, T0);
    const t = room.round!.testimonies[0];
    expect(testimonyStatus(room.round!, t)).toBe('coincide');
    // ...and yet it is false: neither was there.
    expect(setup.truth[x][0]).not.toBe(t.zone);
  });

  it('10. un testimonio contradice: la app no decide quién miente', () => {
    const { room, ids, setup } = started(5, 'a10');
    honest(room);
    const [x] = ids;
    const y = ids.find((p) => p !== x && room.round!.declarations[p]!.zones[0] !== room.round!.declarations[x]!.zones[0])!;
    testify(room, x, y, 0, T0);
    const pub = publicView(room, SCENARIOS);
    expect(pub.round!.testimonies[0].status).toBe('contradice');
    // Nothing in the public view says which of the two lies.
    expect(JSON.stringify(pub.round!.testimonies[0])).not.toMatch(/truth|liar|true|false/i);
    void setup;
  });

  it('12. objetivos secretos desactivados: ninguno repartido ni puntuado', () => {
    const { room, setup, ids } = started(6, 'a12');
    expect(setup.encargos).toBeNull();
    toVote(room);
    tick(room, room.phaseEndsAt!);
    expect(room.round!.outcome!.encargoDone).toBeNull();
    for (const p of ids) expect(reasons(room, p)).not.toContain('encargo');
  });

  it('13. objetivos secretos activados: uno por persona, evaluado al final', () => {
    const { room, setup, ids } = started(6, 'a13', { encargos: true });
    expect(Object.keys(setup.encargos!).sort()).toEqual([...ids].sort());
    toVote(room);
    tick(room, room.phaseEndsAt!);
    const done = room.round!.outcome!.encargoDone!;
    for (const p of ids) expect(reasons(room, p).includes('encargo')).toBe(done[p]);
    // Objectives never change who wins: nobody accused → culprit escapes regardless.
    expect(room.round!.outcome!.culpritCaught).toBe(false);
  });

  it('14. termina una ronda y empieza la siguiente con todo reiniciado salvo los puntos', () => {
    const { room, deps } = lobby(5);
    startRound(room, room.hostId, T0, deps, 'a14');
    toVote(room);
    tick(room, room.phaseEndsAt!);
    const scores = room.players.map((p) => p.score);
    nextRound(room, room.hostId, T0, deps);
    expect(room.round!.number).toBe(2);
    expect(room.round!.setup.seed).not.toBe('a14');
    expect(room.players.map((p) => p.score)).toEqual(scores);
    expect(room.round!.declarations).toEqual({});
  });

  it('15. termina la última ronda: clasificación final; nueva partida pone puntos a cero', () => {
    const { room, deps } = lobby(4);
    room.settings.rounds = 3;
    startRound(room, room.hostId, T0, deps);
    for (let r = 0; r < 3; r++) {
      toVote(room);
      tick(room, room.phaseEndsAt!);
      nextRound(room, room.hostId, T0, deps);
    }
    expect(room.phase).toBe('final');
    expect(startRound(room, room.hostId, T0, deps)).toEqual({ ok: false, error: 'wrong_phase' });
    toLobby(room, room.hostId, T0);
    expect(room.players.every((p) => p.score === 0)).toBe(true);
  });

  it('16. abandonar durante una fase no bloquea la ronda (declaración, defensa, votación)', () => {
    // During the declaration
    {
      const { room, ids, setup } = started(5, 'a16a');
      leave(room, ids[4], T0);
      for (const p of ids.slice(0, 4)) declare(room, p, setup.truth[p], true, T0);
      expect(room.phase).toBe('investigate');
      expect(room.round!.declarations[ids[4]]!.auto).toBe(true);
    }
    // During the defense (the defender leaves)
    {
      const { room, ids } = started(5, 'a16b');
      honest(room);
      point(room, ids[0], ids[3], T0);
      for (const p of ids) setReady(room, p, true, T0);
      for (const p of ids) setReady(room, p, true, T0);
      expect(room.phase).toBe('defense');
      leave(room, ids[3], T0);
      expect(room.phase).toBe('vote');
    }
    // During the vote: the rest vote and the round resolves
    {
      const { room, ids, culprit } = started(5, 'a16c');
      toVote(room);
      const gone = ids.find((p) => p !== culprit && p !== room.hostId)!;
      leave(room, gone, T0);
      for (const p of ids) if (p !== gone) vote(room, p, p === culprit ? other(ids, [p, gone]) : culprit, T0);
      expect(room.phase).toBe('result');
    }
    // Host goes back to the lobby only after a verdict, never mid-round
    {
      const { room } = started(5, 'a16d');
      expect(toLobby(room, room.hostId, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    }
  });

  it('defensa: no se puede votar dos veces ni saltarse la votación', () => {
    const { room, ids, culprit } = started(5, 'a17');
    honest(room);
    point(room, ids[1], culprit, T0);
    for (const p of ids) setReady(room, p, true, T0);
    for (const p of ids) setReady(room, p, true, T0);
    expect(room.phase).toBe('defense');
    expect(vote(room, ids[1], culprit, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    endDefense(room, culprit, T0);
    expect(room.phase).toBe('vote');
    expect(vote(room, ids[1], culprit, T0).ok).toBe(true);
    expect(vote(room, ids[1], ids[2], T0)).toEqual({ ok: false, error: 'already_done' });
    // The defense's timer is gone: the deadline now belongs to the vote.
    expect(room.phaseEndsAt! - T0).toBe(45_000);
  });
});
