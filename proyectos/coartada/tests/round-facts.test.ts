// The case file at the verdict states only facts the round's data supports, and the data it
// reads (roles, truth, votes) is not public before the verdict.
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { declare, forceAdvance, point, testify, vote } from '../src/shared/engine/game';
import { publicView } from '../src/shared/engine/views';
import { roundFacts } from '../src/client/lib/summary';
import { started, T0 } from './helpers';

function playRound(seed: string) {
  const s = started(6, seed);
  const { room, ids, setup, culprit } = s;
  const T = setup.scene.slot;
  const zoneIds = publicView(room, SCENARIOS).round!.scenario.zones.map((z) => z.id);
  for (const id of ids) {
    const zones = [...setup.truth[id]];
    // The culprit lies about the crime hour (as the game asks).
    if (id === culprit) zones[T] = zoneIds.find((z) => z !== zones[T])!;
    declare(room, id, zones, true, T0);
  }
  return s;
}

describe('round facts (case file)', () => {
  it('reports evidence, the culprit\'s lies, the defense, testimonies and the vote from real data', () => {
    for (const seed of ['facts-a', 'facts-b', 'facts-c']) {
      const s = playRound(seed);
      const { room, ids, culprit } = s;
      expect(room.phase).toBe('investigate');
      // Someone really with the culprit at a non-crime hour where the culprit told the truth testifies (coincide).
      const witness = ids.find((id) => id !== culprit);
      testify(room, witness!, culprit, 0, T0);
      for (const id of ids) point(room, id, id === culprit ? witness! : culprit, T0);
      expect(publicView(room, SCENARIOS).round!.reveal).toBeNull(); // nothing secret before the verdict
      forceAdvance(room, room.hostId, T0);
      forceAdvance(room, room.hostId, T0);
      expect(room.phase).toBe('defense');
      forceAdvance(room, room.hostId, T0);
      expect(room.phase).toBe('vote');
      for (const id of ids) vote(room, id, id === culprit ? witness! : culprit, T0);
      expect(room.phase).toBe('result');

      const pub = publicView(room, SCENARIOS);
      const facts = roundFacts(pub);
      const name = (id: string) => pub.players.find((p) => p.id === id)!.name;
      expect(facts.filter((f) => f.kind === 'evidence')).toHaveLength(2);
      const lies = pub.round!.reveal!.outcome.lies[culprit];
      const lie = facts.find((f) => f.kind === 'lie')!;
      expect(lie.text).toContain(name(culprit));
      expect(lie.text).toContain(lies.length === 1 ? 'en 1 hora' : `en ${lies.length} horas`);
      expect(facts.find((f) => f.kind === 'defense')!.text).toContain(`${name(culprit)} fue la persona más señalada (5)`);
      expect(facts.some((f) => f.kind === 'testimony' && f.text.startsWith('Se publicó 1 testimonio'))).toBe(true);
      const v = facts.filter((f) => f.kind === 'vote').at(-1)!;
      expect(v.text).toBe(`${name(culprit)} recibió 5 votos y fue la persona acusada.`);
      // No causal story: facts never explain why something happened.
      for (const f of facts) expect(f.text).not.toMatch(/porque|por eso|así que|para (esquivar|ocultar|salvar)/i);
    }
  });
});
