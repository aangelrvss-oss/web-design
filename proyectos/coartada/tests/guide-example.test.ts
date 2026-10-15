// The guide's example must be exactly what the engine generates, and obey the same rules.
import { describe, expect, it } from 'vitest';
import { getScenario } from '../src/shared/content/scenarios';
import { GUIDE_EXAMPLE as G } from '../src/shared/content/example';
import { validateSetup } from '../src/shared/content/validate';
import { generateRound } from '../src/shared/engine/generate';
import { createRoom, addPlayer, declare, startRound, testify, type EngineDeps } from '../src/shared/engine/game';
import { testimonyStatus } from '../src/shared/engine/encargos';

describe('guide example', () => {
  const players = [...G.players];
  const setup = generateRound({ scenario: getScenario(G.scenarioId), players, seed: G.seed, encargos: false });

  it('is reproduced exactly by the engine from its seed', () => {
    expect(validateSetup(setup, players)).toEqual([]);
    expect(players.find((p) => setup.roles[p] === 'culpable')).toBe(G.culprit);
    expect(setup.zones).toEqual(G.zones);
    expect(setup.scene).toEqual(G.scene);
    for (const p of players) expect(setup.truth[p]).toEqual(G.truth[p]);
    expect(setup.memories.Eva).toEqual(G.evaMemories);
    expect(setup.traces.map((t) => ({ slot: t.slot, zone: t.zone }))).toEqual(G.traces);
  });

  it('only the culprit lies in the example declarations, and only at the crime hour', () => {
    for (const p of players) {
      const lies = [0, 1, 2].filter((s) => G.declarations[p][s] !== G.truth[p][s]);
      expect(lies).toEqual(p === G.culprit ? [G.scene.slot] : []);
    }
    // The example lie does not name the scene.
    expect(G.declarations[G.culprit][G.scene.slot]).not.toBe(G.scene.zone);
  });

  it('the testimonies shown in the guide get the statuses the guide shows', () => {
    let n = 0;
    // A catalogue with only the example case, so the room plays exactly that case.
    const deps: EngineDeps = { scenarios: [getScenario(G.scenarioId)], makeId: () => players[n++], makeToken: () => 'x'.repeat(20), makeSeed: () => G.seed };
    const made = createRoom('GUIA', 'Ana', 0, deps);
    if (!made.ok) throw new Error('room');
    const room = made.room;
    for (const p of players.slice(1)) addPlayer(room, p, 0, deps);
    expect(startRound(room, 'Ana', 0, deps, G.seed).ok).toBe(true);
    expect(room.round!.setup.scenarioId).toBe(G.scenarioId);
    for (const p of players) declare(room, p, [...G.declarations[p]], true, 0);
    // «Ana: Estuve con Eva en La barra libre a las 00:00» → coincide (and is false).
    testify(room, 'Ana', 'Eva', 2, 0);
    const t = room.round!.testimonies[0];
    expect(t.zone).toBe('barra');
    expect(testimonyStatus(room.round!, t)).toBe('coincide');
    expect(G.truth.Ana[2]).not.toBe('barra');
  });
});
