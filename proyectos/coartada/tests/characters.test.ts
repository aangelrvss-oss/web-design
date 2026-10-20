// Characters are cosmetic: one per player in a room, chosen in the lobby, kept through a drop and
// a whole match, freed when the player is removed, and unrelated to roles and scores.
import { describe, expect, it } from 'vitest';
import { AVATARS } from '../src/shared/characters';
import { addPlayer, chooseAvatar, kick, leave, setConnected, startRound } from '../src/shared/engine/game';
import { privateView, publicView } from '../src/shared/engine/views';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { lobby, makeDeps, started, T0 } from './helpers';

const avatars = (room: ReturnType<typeof lobby>['room']) => room.players.filter((p) => !p.left).map((p) => p.avatar);

describe('characters', () => {
  it('everyone gets a different one on joining, up to a full room', () => {
    const { room } = lobby(10);
    const a = avatars(room);
    expect(a.every((x) => x !== null && AVATARS.includes(x))).toBe(true);
    expect(new Set(a).size).toBe(10);
  });

  it('a character belongs to one player: taken ones are refused, free ones and your own are fine', () => {
    const { room, ids } = lobby(4);
    const [a, b] = ids;
    const taken = room.players[1].avatar!;
    expect(chooseAvatar(room, a, taken, T0)).toEqual({ ok: false, error: 'avatar_taken' });
    const free = AVATARS.find((x) => !avatars(room).includes(x))!;
    expect(chooseAvatar(room, a, free, T0).ok).toBe(true);
    expect(chooseAvatar(room, b, free, T0)).toEqual({ ok: false, error: 'avatar_taken' });
    expect(chooseAvatar(room, a, free, T0).ok).toBe(true); // choosing your own again: no-op
    expect(chooseAvatar(room, a, 'pirata', T0)).toEqual({ ok: false, error: 'invalid' });
    expect(new Set(avatars(room)).size).toBe(4);
  });

  it('two players asking for the same free character: the first gets it, the second is refused', () => {
    const { room, ids } = lobby(5);
    const free = AVATARS.find((x) => !avatars(room).includes(x))!;
    const results = [chooseAvatar(room, ids[3], free, T0), chooseAvatar(room, ids[4], free, T0)];
    expect(results.map((r) => r.ok)).toEqual([true, false]);
    expect(room.players.filter((p) => p.avatar === free).map((p) => p.id)).toEqual([ids[3]]);
  });

  it('only in the lobby; kept while offline and across rounds; freed when the player is removed', () => {
    const { room, ids, deps } = lobby(5);
    const mine = room.players[2].avatar;
    setConnected(room, ids[2], false, T0);
    const free = AVATARS.find((x) => !avatars(room).includes(x))!;
    expect(chooseAvatar(room, ids[0], mine!, T0)).toEqual({ ok: false, error: 'avatar_taken' }); // offline still owns it
    setConnected(room, ids[2], true, T0 + 1000);
    expect(startRound(room, room.hostId, T0 + 2000, deps).ok).toBe(true);
    expect(chooseAvatar(room, ids[0], free, T0)).toEqual({ ok: false, error: 'wrong_phase' });
    expect(room.players[2].avatar).toBe(mine);
    // Kicked from the lobby (or left): the character is free for anyone, including a newcomer.
    const l2 = lobby(4);
    const gone = l2.room.players[3].avatar!;
    expect(kick(l2.room, l2.room.hostId, l2.ids[3], T0).ok).toBe(true);
    expect(chooseAvatar(l2.room, l2.ids[1], gone, T0).ok).toBe(true);
    const l3 = lobby(4);
    const left = l3.room.players[2].avatar!;
    leave(l3.room, l3.ids[2], T0);
    expect(chooseAvatar(l3.room, l3.ids[0], left, T0).ok).toBe(true);
  });

  it('a player who leaves mid-round keeps it until the round ends, so nobody can take it meanwhile', () => {
    const { room, ids, deps } = started(5);
    const theirs = room.players[4].avatar;
    leave(room, ids[4], T0);
    const r = addPlayer(room, 'Zoe', T0, deps);
    expect(r.ok && r.player.avatar).not.toBe(theirs);
  });

  it('is public and says nothing about roles; the role deal ignores it', () => {
    const a = started(6, 'same-seed');
    const b = lobby(6, makeDeps());
    // Same seed, different characters: the same roles.
    b.room.players.forEach((p, i) => (p.avatar = AVATARS[(i + 5) % AVATARS.length]));
    expect(startRound(b.room, b.room.hostId, T0, b.deps, 'same-seed').ok).toBe(true);
    expect(b.room.round!.setup.roles).toEqual(a.room.round!.setup.roles);
    const pub = publicView(a.room, SCENARIOS);
    expect(pub.players.map((p) => p.avatar)).toEqual(a.room.players.map((p) => p.avatar));
    const priv = privateView(a.room, a.ids[0]);
    expect(JSON.stringify(priv)).not.toContain('avatar');
  });
});
