// Golden fingerprints of the rules engine, recorded before the per-case scenes and the balance
// tooling were added. Visual or tooling work must never move them: if one of these fails, a change
// touched role dealing, the generated night, evidence, scoring or resolution, and that has to be a
// deliberate, documented rules change (then re-record the value in the same commit).
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { declare, point, setReady, startRound, testify, tick, vote } from '../src/shared/engine/game';
import { generateRound, rolesFor, zoneCountFor } from '../src/shared/engine/generate';
import { SCORE_POINTS } from '../src/shared/types';
import { lobby, T0 } from './helpers';

const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 16);
const SIZES = [4, 5, 6, 7, 8, 10];

describe('engine golden fingerprints', () => {
  it('keeps the scoring table and the role and zone counts per group size', () => {
    expect(SCORE_POINTS).toEqual({ grupo_gana: 2, culpable_escapa: 4, complice_escapa: 3, voto_certero: 1, cazador: 1, encargo: 1 });
    expect(SIZES.map((n) => [n, rolesFor(n).complices, zoneCountFor(n)])).toEqual([
      [4, 0, 4],
      [5, 0, 4],
      [6, 1, 4],
      [7, 1, 5],
      [8, 1, 5],
      [10, 1, 5],
    ]);
  });

  it('generates exactly the same nights, roles, memories, evidence and objectives', () => {
    const all = [];
    for (const scenario of SCENARIOS) {
      for (const n of SIZES) {
        const players = Array.from({ length: n }, (_, i) => `p${i}`);
        for (const encargos of [false, true]) all.push(generateRound({ scenario, players, seed: `golden-${n}`, encargos }));
      }
    }
    expect(all).toHaveLength(SCENARIOS.length * SIZES.length * 2);
    expect(hash(all)).toBe('413ff0962e9cd8c4');
  });

  it('resolves and scores scripted rounds exactly as before', () => {
    const outcomes = [];
    for (const n of SIZES) {
      for (let k = 0; k < 6; k++) {
        const { room, ids, deps } = lobby(n);
        room.settings.encargos = k % 2 === 1;
        const res = startRound(room, room.hostId, T0, deps, `golden-play-${n}-${k}`);
        if (!res.ok) throw new Error(res.error);
        const round = room.round!;
        const { setup } = round;
        // Everyone tells the truth except the culprit, who moves away from the scene.
        for (const p of ids) {
          const zones = setup.truth[p].slice();
          if (setup.roles[p] === 'culpable') zones[setup.scene.slot] = setup.zones.find((z) => z !== setup.scene.zone)!;
          declare(room, p, zones, true, T0);
        }
        // Each player publishes their first memory, points and votes at a fixed neighbour.
        for (const p of ids) testify(room, p, setup.memories[p][0].with, setup.memories[p][0].slot, T0);
        const target = (p: string, step: number) => ids[(ids.indexOf(p) + step) % ids.length];
        for (const p of ids) point(room, p, target(p, 1 + (k % 2)), T0);
        for (const p of ids) setReady(room, p, true, T0);
        for (const p of ids) setReady(room, p, true, T0);
        if (room.phase === 'defense') tick(room, room.phaseEndsAt!);
        for (const p of ids) vote(room, p, target(p, 1 + (k % 3)), T0);
        if (room.phase === 'runoff') for (const p of ids) vote(room, p, round.runoff!.candidates.find((c) => c !== p)!, T0);
        expect(room.phase).toBe('result');
        outcomes.push({ outcome: round.outcome, scores: room.players.map((p) => p.score), history: room.history });
      }
    }
    expect(hash(outcomes)).toBe('04f1d09024190063');
  });
});
