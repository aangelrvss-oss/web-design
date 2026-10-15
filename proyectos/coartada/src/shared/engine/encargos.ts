// Secret side missions ("encargos"). Optional, +1 point each, always verifiable by
// the server from declarations, testimonies and votes — never by subjective judgement.

import type { Rng } from '../rng';
import type { Encargo, EncargoKind, PlayerId, RoundSetup, RoundState } from '../types';

const KINDS: EncargoKind[] = ['votes_on', 'no_votes', 'same_vote', 'corroborated', 'contradict', 'claim_zone'];

export function assignEncargos(rng: Rng, setup: RoundSetup): Record<PlayerId, Encargo> {
  const players = Object.keys(setup.roles);
  const out: Record<PlayerId, Encargo> = {};
  // Deal kinds from a shuffled deck so a table sees variety; refill when exhausted.
  let deck: EncargoKind[] = [];
  for (const p of rng.shuffle(players)) {
    if (deck.length === 0) deck = rng.shuffle(KINDS);
    const kind = deck.pop()!;
    const others = players.filter((q) => q !== p);
    switch (kind) {
      case 'votes_on':
      case 'same_vote':
      case 'contradict':
        out[p] = { kind, target: rng.pick(others) };
        break;
      case 'claim_zone': {
        // A zone you never actually visited: completing it requires a lie.
        const visited = new Set(setup.truth[p]);
        const unvisited = setup.zones.filter((z) => !visited.has(z) && z !== setup.scene.zone);
        if (unvisited.length === 0) out[p] = { kind: 'no_votes' };
        else out[p] = { kind, zone: rng.pick(unvisited) };
        break;
      }
      default:
        out[p] = { kind };
    }
  }
  return out;
}

/**
 * What the app can say about a testimony, comparing it ONLY with the subject's sealed
 * alibi (never with the truth, which stays hidden until the verdict):
 *  - coincide: the subject declared the same place at that hour (both versions fit;
 *    that does not prove either is true),
 *  - contradice: the subject declared another place (at least one of the two lies),
 *  - sin_contraste: the subject's alibi was filled in automatically because they never
 *    sealed one, so there is no claim of theirs to compare with.
 */
export type TestimonyStatus = 'coincide' | 'contradice' | 'sin_contraste';

export function testimonyStatus(round: RoundState, t: { subject: PlayerId; slot: number; zone: string }): TestimonyStatus {
  const decl = round.declarations[t.subject];
  if (!decl || decl.auto) return 'sin_contraste';
  return decl.zones[t.slot] === t.zone ? 'coincide' : 'contradice';
}

/** Shorthand used by older code and the simulator. */
export function testimonyMatches(round: RoundState, t: { subject: PlayerId; slot: number; zone: string }): boolean {
  return testimonyStatus(round, t) === 'coincide';
}

export function evaluateEncargo(round: RoundState, player: PlayerId, e: Encargo): boolean {
  const votes = round.votes;
  switch (e.kind) {
    case 'votes_on': {
      const count = Object.entries(votes).filter(([voter, target]) => target === e.target && voter !== player).length;
      return count >= 2;
    }
    case 'no_votes':
      return !Object.values(votes).includes(player);
    case 'same_vote':
      return !!votes[player] && !!e.target && votes[e.target] === votes[player];
    case 'corroborated':
      return round.testimonies.some((t) => t.subject === player && t.by !== player && testimonyStatus(round, t) === 'coincide');
    case 'contradict':
      return round.testimonies.some((t) => t.by === player && t.subject === e.target && testimonyStatus(round, t) === 'contradice');
    case 'claim_zone':
      return !!round.declarations[player]?.zones.includes(e.zone!);
  }
}

/** Human text (Spanish). `name` resolves player ids, `zoneName` resolves zone ids. */
export function describeEncargo(e: Encargo, name: (id: PlayerId) => string, zoneName: (id: string) => string): string {
  switch (e.kind) {
    case 'votes_on':
      return `Que ${name(e.target!)} reciba al menos 2 votos en la primera votación (el tuyo no cuenta).`;
    case 'no_votes':
      return 'Que nadie te vote en la primera votación.';
    case 'same_vote':
      return `Vota a la misma persona que ${name(e.target!)} en la primera votación.`;
    case 'corroborated':
      return 'Que otra persona publique un testimonio que coincida con alguna de tus coartadas.';
    case 'contradict':
      return `Publica un testimonio que contradiga la coartada de ${name(e.target!)}.`;
    case 'claim_zone':
      return `Que tu declaración diga que estuviste en ${zoneName(e.zone!)} al menos a una hora (aunque no estuvieras allí).`;
  }
}
