import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { validateCatalogue, validateSetup } from '../src/shared/content/validate';
import { generateRound } from '../src/shared/engine/generate';
import { declare, setReady, vote } from '../src/shared/engine/game';
import { privateView, publicView } from '../src/shared/engine/views';
import { started, T0 } from './helpers';

describe('content', () => {
  it('ships at least 20 scenarios', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(20);
  });

  it('every scenario passes shape + generation validation for 4–10 players', () => {
    expect(validateCatalogue(SCENARIOS, 6)).toEqual([]);
  });

  it('generation is reproducible from the seed', () => {
    const players = ['a', 'b', 'c', 'd', 'e', 'f'];
    const one = generateRound({ scenario: SCENARIOS[0], players, seed: 'repro', encargos: true });
    const two = generateRound({ scenario: SCENARIOS[0], players, seed: 'repro', encargos: true });
    expect(two).toEqual(one);
    const other = generateRound({ scenario: SCENARIOS[0], players, seed: 'repro-2', encargos: true });
    expect(other).not.toEqual(one);
  });

  it('roles scale with player count', () => {
    for (let n = 4; n <= 10; n++) {
      const players = Array.from({ length: n }, (_, i) => `q${i}`);
      const s = generateRound({ scenario: SCENARIOS[1], players, seed: `roles-${n}`, encargos: false });
      const roles = Object.values(s.roles);
      expect(roles.filter((r) => r === 'culpable')).toHaveLength(1);
      expect(roles.filter((r) => r === 'complice')).toHaveLength(n >= 6 ? 1 : 0);
      expect(s.zones).toHaveLength(n <= 6 ? 4 : 5);
      expect(validateSetup(s, players)).toEqual([]);
    }
  });

  it('distributes roles fairly across seats', () => {
    const players = ['a', 'b', 'c', 'd', 'e'];
    const count: Record<string, number> = {};
    for (let i = 0; i < 500; i++) {
      const s = generateRound({ scenario: SCENARIOS[i % SCENARIOS.length], players, seed: `fair-${i}`, encargos: false });
      const c = players.find((p) => s.roles[p] === 'culpable')!;
      count[c] = (count[c] ?? 0) + 1;
    }
    for (const p of players) expect(count[p]).toBeGreaterThan(60); // expected 100
  });
});

describe('privacy boundary', () => {
  const SECRET_KEYS = ['roles', 'truth', 'memories', 'encargos', 'drafts', 'token', 'votes', 'seed'];

  it('public view hides roles, nights, memories, drafts, tokens and votes until resolution', () => {
    const { room, ids, setup, culprit } = started(7, 'privacy', { encargos: true });
    declare(room, ids[0], setup.truth[ids[0]], false, T0); // a private draft
    const check = () => {
      const pub = publicView(room, SCENARIOS);
      // settings.encargos is the public on/off switch, not secret content.
      const json = JSON.stringify({ ...pub, settings: null });
      for (const k of SECRET_KEYS) expect(json.includes(`"${k}"`), `${room.phase} leaks ${k}`).toBe(false);
      for (const p of room.players) expect(json.includes(p.token)).toBe(false);
      expect(json.includes('culpable')).toBe(false);
      expect(json.includes('complice')).toBe(false);
      expect(pub.round!.reveal).toBeNull();
      return pub;
    };
    let pub = check();
    expect(pub.round!.declarations).toBeNull(); // alibis stay sealed while declaring
    expect(pub.round!.traces).toHaveLength(0);
    for (const p of ids) declare(room, p, setup.truth[p], true, T0);
    pub = check();
    expect(pub.round!.traces).toHaveLength(1);
    for (const p of ids) setReady(room, p, true, T0);
    pub = check();
    expect(pub.round!.traces).toHaveLength(2);
    for (const p of ids) setReady(room, p, true, T0);
    expect(room.phase).toBe('vote');
    vote(room, ids[0], ids[1], T0);
    pub = check();
    expect(pub.round!.voted).toEqual([ids[0]]); // who voted is public, not for whom
    for (const p of ids.slice(1)) vote(room, p, p === culprit ? ids[0] : culprit, T0);
    expect(room.phase).toBe('result');
    const final = publicView(room, SCENARIOS);
    expect(final.round!.reveal!.roles[culprit]).toBe('culpable');
    expect(JSON.stringify(final).includes(room.players[0].token)).toBe(false);
  });

  it('private view only describes its owner', () => {
    const { room, ids, setup, culprit, accomplice } = started(6, 'privacy-2');
    for (const p of ids) {
      const priv = privateView(room, p);
      expect(priv.playerId).toBe(p);
      expect(priv.role).toBe(setup.roles[p]);
      expect(priv.truth).toEqual(setup.truth[p]);
      expect(priv.memories).toEqual(setup.memories[p]);
      const json = JSON.stringify(priv);
      for (const q of ids) {
        if (q === p) continue;
        // Other players' roles never appear, except the culprit↔accomplice pairing.
        const pairing = (p === culprit && q === accomplice) || (p === accomplice && q === culprit);
        if (!pairing) expect(priv.partner?.id).not.toBe(q);
      }
      if (setup.roles[p] === 'inocente') expect(priv.partner).toBeNull();
      expect(json.includes('token')).toBe(false);
    }
    const cp = privateView(room, culprit);
    expect(cp.partner).toEqual({ id: accomplice, role: 'complice' });
    expect(privateView(room, accomplice!).partner).toEqual({ id: culprit, role: 'culpable' });
  });
});
