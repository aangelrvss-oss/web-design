// Authoritative game state machine. Pure TypeScript, no I/O: the server (and the local
// pass-and-play mode) call these functions and own the clock. Every action validates
// phase, membership and permissions and returns a typed error instead of throwing.

import { AVATARS, isAvatar, type AvatarId } from '../characters';
import { createRng } from '../rng';
import type { ScenarioDef } from '../content/types';
import {
  DEFAULT_SETTINGS,
  MAX_PLAYERS,
  MAX_TESTIMONIES,
  MIN_PLAYERS,
  NAME_MAX,
  timingsFor,
  SCORE_POINTS,
  SLOT_COUNT,
  type Forgery,
  type Outcome,
  type PlayerId,
  type PlayerRec,
  type RoomState,
  type RoundState,
  type ScoreLine,
  type ScoreReason,
  type Settings,
} from '../types';
import { generateRound } from './generate';
import { evaluateEncargo, testimonyStatus } from './encargos';
import { drawForgeryOpportunity, forgeryAllowed, resolveExamination, validForgery } from './prueba-falsa';

export type ActionError =
  | 'not_host'
  | 'wrong_phase'
  | 'not_participant'
  | 'already_done'
  | 'invalid'
  | 'not_enough_players'
  | 'too_many_players'
  | 'room_full'
  | 'limit_reached'
  | 'unknown_player'
  | 'avatar_taken';

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: ActionError };

const ok = <T extends object>(extra?: T): Result<T> => ({ ok: true, ...(extra ?? ({} as T)) });
const fail = (error: ActionError): { ok: false; error: ActionError } => ({ ok: false, error });

export interface EngineDeps {
  scenarios: ScenarioDef[];
  makeId: () => string;
  makeToken: () => string;
  makeSeed: () => string;
}

/** How long a disconnected host keeps the role before it moves on. */
export const HOST_GRACE_MS = 20_000;
/**
 * A player who is momentarily disconnected when a round starts (phone locked or app in the
 * background while the group talks over the verdict) still gets a seat in it, exactly like a
 * participant who disconnects mid-round. Someone gone for longer than this is left out.
 */
export const SEAT_GRACE_MS = 15 * 60_000;
/** Do not repeat a scenario within this many rounds in the same room (bounded by catalogue size). */
export const SCENARIO_COOLDOWN = 12;

// ───────────────────────────── names & players ─────────────────────────────

export function cleanName(raw: string): string {
  const visible = Array.from(raw.normalize('NFC'))
    .filter((ch) => !isInvisible(ch.codePointAt(0)!))
    .join('');
  return visible.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

/** Control, zero-width, bidi-override and BOM characters are stripped from names. */
function isInvisible(cp: number): boolean {
  return (
    cp < 0x20 ||
    (cp >= 0x7f && cp <= 0x9f) ||
    (cp >= 0x200b && cp <= 0x200f) ||
    (cp >= 0x2028 && cp <= 0x202e) ||
    (cp >= 0x2060 && cp <= 0x206f) ||
    cp === 0xfeff
  );
}

function uniqueName(room: RoomState, name: string): string {
  const taken = new Set(room.players.map((p) => p.name.toLocaleLowerCase('es')));
  if (!taken.has(name.toLocaleLowerCase('es'))) return name;
  for (let i = 2; i < 100; i++) {
    const candidate = `${name.slice(0, NAME_MAX - 2)} ${i}`;
    if (!taken.has(candidate.toLocaleLowerCase('es'))) return candidate;
  }
  return name;
}

/** A free character for a newcomer: picked from the free ones by their id, so it varies by
 *  player but never depends on anything secret (roles don't exist yet when it happens). */
function freeAvatar(room: RoomState, playerId: PlayerId): AvatarId | null {
  const used = new Set(room.players.map((p) => p.avatar));
  const free = AVATARS.filter((a) => !used.has(a));
  if (!free.length) return null;
  let h = 0;
  for (const ch of playerId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return free[h % free.length];
}

/** Pick the character to be drawn as. Only in the lobby; a character belongs to one player of
 *  the room at a time (anyone still in it, even offline) and is free again when they're removed. */
export function chooseAvatar(room: RoomState, id: PlayerId, avatar: string, now: number): Result {
  const p = findPlayer(room, id);
  if (!p || p.left) return fail('unknown_player');
  if (room.phase !== 'lobby') return fail('wrong_phase');
  if (!isAvatar(avatar)) return fail('invalid');
  if (p.avatar === avatar) return ok();
  if (room.players.some((q) => q.id !== id && q.avatar === avatar)) return fail('avatar_taken');
  p.avatar = avatar;
  touch(room, now);
  return ok();
}

function freeColor(room: RoomState): number {
  const used = new Set(room.players.map((p) => p.color));
  for (let c = 0; c < MAX_PLAYERS; c++) if (!used.has(c)) return c;
  return room.players.length % MAX_PLAYERS;
}

export function createRoom(code: string, hostName: string, now: number, deps: EngineDeps): Result<{ room: RoomState; player: PlayerRec }> {
  const name = cleanName(hostName);
  if (!name) return fail('invalid');
  const id = deps.makeId();
  const player: PlayerRec = {
    id,
    name,
    color: 0,
    token: deps.makeToken(),
    joinedAt: now,
    connected: true,
    lastSeen: now,
    left: false,
    score: 0,
    avatar: null,
  };
  const room: RoomState = {
    code,
    createdAt: now,
    updatedAt: now,
    hostId: player.id,
    players: [player],
    settings: { ...DEFAULT_SETTINGS },
    phase: 'lobby',
    phaseEndsAt: null,
    round: null,
    roundsPlayed: 0,
    history: [],
    recentScenarios: [],
    nextTestimonyId: 1,
  };
  player.avatar = freeAvatar(room, id);
  return ok({ room, player });
}

export function addPlayer(room: RoomState, rawName: string, now: number, deps: EngineDeps): Result<{ player: PlayerRec }> {
  const name = cleanName(rawName);
  if (!name) return fail('invalid');
  const present = room.players.filter((p) => !p.left);
  if (present.length >= MAX_PLAYERS) return fail('room_full');
  const id = deps.makeId();
  const player: PlayerRec = {
    id,
    name: uniqueName(room, name),
    color: freeColor(room),
    token: deps.makeToken(),
    joinedAt: now,
    connected: true,
    lastSeen: now,
    left: false,
    score: 0,
    avatar: freeAvatar(room, id),
  };
  room.players.push(player);
  touch(room, now);
  return ok({ player });
}

export function findPlayer(room: RoomState, id: PlayerId): PlayerRec | undefined {
  return room.players.find((p) => p.id === id);
}

export function setConnected(room: RoomState, id: PlayerId, connected: boolean, now: number): void {
  const p = findPlayer(room, id);
  if (!p) return;
  p.connected = connected;
  p.lastSeen = now;
  touch(room, now);
  ensureHost(room, now);
  autoAdvance(room, now);
}

/** Player leaves on purpose. Mid-round they stay as a ghost until the round ends. */
export function leave(room: RoomState, id: PlayerId, now: number): Result {
  const p = findPlayer(room, id);
  if (!p) return fail('unknown_player');
  p.left = true;
  p.connected = false;
  p.lastSeen = now;
  if (!roundActive(room) || !room.round?.participants.includes(id)) purgeLeft(room);
  ensureHost(room, now);
  autoAdvance(room, now);
  touch(room, now);
  return ok();
}

export function kick(room: RoomState, by: PlayerId, target: PlayerId, now: number): Result {
  if (by !== room.hostId) return fail('not_host');
  if (by === target) return fail('invalid');
  const p = findPlayer(room, target);
  if (!p) return fail('unknown_player');
  if (roundActive(room) && p.connected && room.round?.participants.includes(target)) return fail('wrong_phase');
  return leave(room, target, now);
}

function purgeLeft(room: RoomState): void {
  const inRound = roundActive(room) ? new Set(room.round!.participants) : new Set<string>();
  room.players = room.players.filter((p) => !p.left || inRound.has(p.id));
}

export function ensureHost(room: RoomState, now: number, graceMs = HOST_GRACE_MS): void {
  const host = findPlayer(room, room.hostId);
  const hostOk = host && !host.left && (host.connected || now - host.lastSeen < graceMs);
  if (hostOk) return;
  const next = room.players
    .filter((p) => !p.left && p.connected)
    .sort((a, b) => a.joinedAt - b.joinedAt)[0];
  if (next) room.hostId = next.id;
}

export function updateSettings(room: RoomState, by: PlayerId, patch: Partial<Settings>, now: number): Result {
  if (by !== room.hostId) return fail('not_host');
  if (roundActive(room)) return fail('wrong_phase');
  // Back in the room mid-match, the match can't be made shorter than what was already played:
  // the room would be left with a finished match and no way on (or with a round past the end).
  if (room.phase === 'lobby' && patch.rounds !== undefined && patch.rounds > 0 && room.roundsPlayed >= patch.rounds) return fail('invalid');
  room.settings = { ...room.settings, ...patch };
  touch(room, now);
  return ok();
}

// ───────────────────────────── round flow ─────────────────────────────

export function roundActive(room: RoomState): boolean {
  return (
    room.phase === 'declare' ||
    room.phase === 'investigate' ||
    room.phase === 'defense' ||
    room.phase === 'vote' ||
    room.phase === 'runoff'
  );
}

export function eligiblePlayers(room: RoomState, now: number): PlayerRec[] {
  return room.players.filter((p) => !p.left && (p.connected || now - p.lastSeen < SEAT_GRACE_MS));
}

/** The match has played all its rounds (never with «sin fin»): only the final standings remain. */
function matchOver(room: RoomState): boolean {
  return room.settings.rounds > 0 && room.roundsPlayed >= room.settings.rounds;
}

export function startRound(room: RoomState, by: PlayerId, now: number, deps: EngineDeps, seedOverride?: string): Result {
  if (by !== room.hostId) return fail('not_host');
  if (room.phase !== 'lobby' && room.phase !== 'result') return fail('wrong_phase');
  // From the verdict or from the room alike: no round past the end of the match.
  if (matchOver(room)) return fail('wrong_phase');
  purgeLeft(room);
  const players = eligiblePlayers(room, now);
  // Starting still needs MIN_PLAYERS people actually here: momentarily absent players get a seat,
  // but they can't make up the minimum (a round of mostly empty seats is no game).
  if (players.filter((p) => p.connected).length < MIN_PLAYERS) return fail('not_enough_players');
  if (players.length > MAX_PLAYERS) return fail('too_many_players');

  const seed = seedOverride ?? deps.makeSeed();
  const scenario = chooseScenario(room, deps.scenarios, seed);
  const ids = players.map((p) => p.id);
  const setup = generateRound({ scenario, players: ids, seed, encargos: room.settings.encargos });

  room.round = {
    number: room.roundsPlayed + 1,
    setup,
    participants: ids,
    declarations: {},
    drafts: {},
    testimonies: [],
    tracesRevealed: 0,
    ready: [],
    votes: {},
    runoff: null,
    pointers: {},
    defense: null,
    outcome: null,
    startedAt: now,
    // The round keeps its own copy: what it is played with never depends on later settings.
    variant: room.settings.variant ?? null,
    ...(room.settings.variant === 'prueba_falsa'
      ? {
          forgeryChance: room.settings.forgeryChance ?? 100,
          forgeryAllowed: drawForgeryOpportunity(setup.seed, room.settings.forgeryChance ?? 100),
          forgery: null,
          examineMarks: {},
          examination: null,
        }
      : {}),
  };
  room.recentScenarios = [scenario.id, ...room.recentScenarios].slice(0, SCENARIO_COOLDOWN);
  setPhase(room, 'declare', now, timingsFor(room.settings.pace, ids.length).declare);
  return ok();
}

function chooseScenario(room: RoomState, scenarios: ScenarioDef[], seed: string): ScenarioDef {
  const rng = createRng(`scenario|${seed}`);
  const cooldown = Math.min(SCENARIO_COOLDOWN, Math.max(0, scenarios.length - 1));
  const recent = new Set(room.recentScenarios.slice(0, cooldown));
  const fresh = scenarios.filter((s) => !recent.has(s.id));
  return rng.pick(fresh.length > 0 ? fresh : scenarios);
}

function setPhase(room: RoomState, phase: RoomState['phase'], now: number, seconds: number | null): void {
  room.phase = phase;
  room.phaseEndsAt = seconds === null ? null : now + seconds * 1000;
  touch(room, now);
}

function requireRound(room: RoomState, id: PlayerId): Result<{ round: RoundState }> {
  const round = room.round;
  if (!round || !roundActive(room)) return fail('wrong_phase');
  if (!round.participants.includes(id)) return fail('not_participant');
  return ok({ round });
}

/** Save a draft (lock=false) or lock the alibi (lock=true). Locked alibis are final. */
export function declare(room: RoomState, id: PlayerId, zones: string[], lock: boolean, now: number): Result {
  if (room.phase !== 'declare') return fail('wrong_phase');
  const r = requireRound(room, id);
  if (!r.ok) return r;
  const { round } = r;
  if (round.declarations[id]) return fail('already_done');
  if (!Array.isArray(zones) || zones.length !== SLOT_COUNT || !zones.every((z) => round.setup.zones.includes(z))) {
    return fail('invalid');
  }
  if (lock) {
    round.declarations[id] = { zones: zones.slice(), auto: false };
    delete round.drafts[id];
  } else {
    round.drafts[id] = zones.slice();
  }
  touch(room, now);
  autoAdvance(room, now);
  return ok();
}

export function testify(room: RoomState, id: PlayerId, subject: PlayerId, slot: number, now: number): Result {
  if (room.phase !== 'investigate') return fail('wrong_phase');
  const r = requireRound(room, id);
  if (!r.ok) return r;
  const { round } = r;
  if (subject === id || !round.participants.includes(subject)) return fail('invalid');
  if (!Number.isInteger(slot) || slot < 0 || slot >= SLOT_COUNT) return fail('invalid');
  const mine = round.testimonies.filter((t) => t.by === id);
  if (mine.length >= MAX_TESTIMONIES) return fail('limit_reached');
  if (mine.some((t) => t.subject === subject && t.slot === slot)) return fail('already_done');
  const zone = round.declarations[id]?.zones[slot];
  if (!zone) return fail('invalid');
  round.testimonies.push({ id: room.nextTestimonyId++, by: id, subject, slot, zone, at: now });
  // New information: everyone gets to react before the step closes.
  round.ready = [];
  touch(room, now);
  return ok();
}

export function setReady(room: RoomState, id: PlayerId, ready: boolean, now: number): Result {
  if (room.phase !== 'investigate') return fail('wrong_phase');
  const r = requireRound(room, id);
  if (!r.ok) return r;
  const { round } = r;
  round.ready = round.ready.filter((p) => p !== id);
  if (ready) round.ready.push(id);
  touch(room, now);
  autoAdvance(room, now);
  return ok();
}

/**
 * Secretly point at the person who should get the last defense (or clear with null).
 * Allowed during the whole investigation and changeable until it ends. Only the result
 * (who defends, and with how many pointers) is ever made public before the verdict.
 */
export function point(room: RoomState, id: PlayerId, target: PlayerId | null, now: number): Result {
  if (room.phase !== 'investigate') return fail('wrong_phase');
  const r = requireRound(room, id);
  if (!r.ok) return r;
  const { round } = r;
  if (target === null) {
    delete round.pointers[id];
  } else {
    if (target === id || !round.participants.includes(target)) return fail('invalid');
    round.pointers[id] = target;
  }
  touch(room, now);
  return ok();
}

/**
 * Prueba falsificable (experimental, docs/PRUEBA-FALSA.md): the culprit picks the one forgery of the
 * round, changes it or clears it (null), only while the declaration lasts.
 */
export function forge(room: RoomState, id: PlayerId, forgery: Forgery | null, now: number): Result {
  if (room.phase !== 'declare') return fail('wrong_phase');
  const r = requireRound(room, id);
  if (!r.ok) return r;
  const { round } = r;
  if (round.variant !== 'prueba_falsa' || round.setup.roles[id] !== 'culpable') return fail('invalid');
  // Without the opportunity this round, the only valid choice is not forging.
  if (forgery && !forgeryAllowed(round)) return fail('invalid');
  if (forgery && !validForgery(round, forgery)) return fail('invalid');
  round.forgery = forgery ? { slot: forgery.slot, zone: forgery.zone } : null;
  touch(room, now);
  return ok();
}

/** Prueba falsificable: mark (or clear) which published piece of evidence you want examined. */
export function examine(room: RoomState, id: PlayerId, index: number | null, now: number): Result {
  if (room.phase !== 'investigate') return fail('wrong_phase');
  const r = requireRound(room, id);
  if (!r.ok) return r;
  const { round } = r;
  if (round.variant !== 'prueba_falsa') return fail('invalid');
  const marks = (round.examineMarks ??= {});
  if (index === null) delete marks[id];
  else if (Number.isInteger(index) && index >= 0 && index < round.tracesRevealed) marks[id] = index;
  else return fail('invalid');
  touch(room, now);
  return ok();
}

/** The defender (or the host) ends the last defense early. */
export function endDefense(room: RoomState, id: PlayerId, now: number): Result {
  if (room.phase !== 'defense') return fail('wrong_phase');
  const defender = room.round?.defense?.defender;
  if (id !== defender && id !== room.hostId) return fail('not_host');
  timeout(room, now);
  return ok();
}

export function vote(room: RoomState, id: PlayerId, target: PlayerId, now: number): Result {
  if (room.phase !== 'vote' && room.phase !== 'runoff') return fail('wrong_phase');
  const r = requireRound(room, id);
  if (!r.ok) return r;
  const { round } = r;
  if (target === id) return fail('invalid');
  if (room.phase === 'vote') {
    if (!round.participants.includes(target)) return fail('invalid');
    if (round.votes[id]) return fail('already_done');
    round.votes[id] = target;
  } else {
    const runoff = round.runoff!;
    if (!runoff.candidates.includes(target)) return fail('invalid');
    if (runoff.votes[id]) return fail('already_done');
    runoff.votes[id] = target;
  }
  touch(room, now);
  autoAdvance(room, now);
  return ok();
}

/** Host skips the current timed step (same effect as the timer running out). */
export function forceAdvance(room: RoomState, by: PlayerId, now: number): Result {
  if (by !== room.hostId) return fail('not_host');
  if (!roundActive(room)) return fail('wrong_phase');
  timeout(room, now);
  return ok();
}

/** Host: after a result, start the next round or go to the final standings. */
export function nextRound(room: RoomState, by: PlayerId, now: number, deps: EngineDeps): Result {
  if (by !== room.hostId) return fail('not_host');
  if (room.phase !== 'result') return fail('wrong_phase');
  if (matchOver(room)) {
    setPhase(room, 'final', now, null);
    purgeLeft(room);
    return ok();
  }
  return startRound(room, by, now, deps);
}

/** Host: back to the lobby (keeps scores) — or, from the final screen, a fresh match. */
export function toLobby(room: RoomState, by: PlayerId, now: number): Result {
  if (by !== room.hostId) return fail('not_host');
  if (room.phase !== 'result' && room.phase !== 'final' && room.phase !== 'lobby') return fail('wrong_phase');
  // After the last round the way on is the final standings («Nueva partida» from there resets).
  if (room.phase === 'result' && matchOver(room)) return fail('wrong_phase');
  if (room.phase === 'final') {
    for (const p of room.players) p.score = 0;
    room.roundsPlayed = 0;
    room.history = [];
  }
  room.round = null;
  setPhase(room, 'lobby', now, null);
  purgeLeft(room);
  return ok();
}

/** Called by the clock. Returns true if the state changed. */
export function tick(room: RoomState, now: number): boolean {
  if (room.phaseEndsAt !== null && now >= room.phaseEndsAt && roundActive(room)) {
    timeout(room, now);
    return true;
  }
  return false;
}

function activeParticipants(room: RoomState): PlayerId[] {
  const round = room.round!;
  return round.participants.filter((id) => {
    const p = findPlayer(room, id);
    return p && p.connected && !p.left;
  });
}

/** Advance early when every connected participant has acted. */
function autoAdvance(room: RoomState, now: number): void {
  if (!roundActive(room) || !room.round) return;
  const round = room.round;
  const active = activeParticipants(room);
  if (active.length === 0) return; // nobody to wait for; the timer decides
  switch (room.phase) {
    case 'declare':
      if (active.every((id) => round.declarations[id])) timeout(room, now);
      break;
    case 'investigate':
      if (active.every((id) => round.ready.includes(id))) timeout(room, now);
      break;
    case 'defense':
      // Nobody to listen to: a defender who drops out ends the defense.
      if (!round.defense?.defender || !active.includes(round.defense.defender)) timeout(room, now);
      break;
    case 'vote':
      if (active.every((id) => round.votes[id])) timeout(room, now);
      break;
    case 'runoff':
      if (active.every((id) => round.runoff!.votes[id])) timeout(room, now);
      break;
  }
}

function timeout(room: RoomState, now: number): void {
  const round = room.round!;
  const t = timingsFor(room.settings.pace, round.participants.length);
  switch (room.phase) {
    case 'declare': {
      for (const id of round.participants) {
        if (round.declarations[id]) continue;
        round.declarations[id] = { zones: round.drafts[id] ?? autoAlibi(round, id), auto: !round.drafts[id] };
      }
      round.drafts = {};
      round.tracesRevealed = 1;
      round.ready = [];
      setPhase(room, 'investigate', now, t.investigate1);
      break;
    }
    case 'investigate':
      if (round.tracesRevealed < 2) {
        round.tracesRevealed = 2;
        round.ready = [];
        setPhase(room, 'investigate', now, t.investigate2);
      } else {
        round.ready = [];
        beginDefense(room, now);
      }
      break;
    case 'defense':
      setPhase(room, 'vote', now, t.vote);
      break;
    case 'vote': {
      const tally = countVotes(round.votes, round.participants);
      const top = topOf(tally);
      if (top.length > 1 && tally[top[0]] > 0) {
        round.runoff = { candidates: top, votes: {} };
        setPhase(room, 'runoff', now, t.runoff);
      } else {
        resolve(room, top.length === 1 && tally[top[0]] > 0 ? top[0] : null, now);
      }
      break;
    }
    case 'runoff': {
      const runoff = round.runoff!;
      const tally = countVotes(runoff.votes, runoff.candidates);
      const top = topOf(tally);
      resolve(room, top.length === 1 && tally[top[0]] > 0 ? top[0] : null, now);
      break;
    }
    default:
      break;
  }
}

/**
 * Pick who gets the last defense: the participant with the most secret pointers.
 * A tie is broken by a draw seeded with the round seed (reproducible, reveals nothing).
 * No pointers, or a chosen person who is offline, means straight to the vote.
 */
function beginDefense(room: RoomState, now: number): void {
  const round = room.round!;
  // Prueba falsificable: the examination is settled the moment the investigation ends.
  if (round.variant === 'prueba_falsa') resolveExamination(round);
  const t = timingsFor(room.settings.pace, round.participants.length);
  const counts: Record<PlayerId, number> = {};
  for (const [by, target] of Object.entries(round.pointers)) {
    if (!round.participants.includes(by) || !round.participants.includes(target)) continue;
    counts[target] = (counts[target] ?? 0) + 1;
  }
  const max = Math.max(0, ...Object.values(counts));
  if (max === 0) {
    round.defense = { defender: null, pointerCount: 0, tiedCount: 0, reason: 'nadie_senalado' };
    setPhase(room, 'vote', now, t.vote);
    return;
  }
  const top = round.participants.filter((id) => counts[id] === max);
  const defender = top.length === 1 ? top[0] : createRng(`defensa|${round.setup.seed}`).pick(top.slice().sort());
  const p = findPlayer(room, defender);
  const present = !!p && p.connected && !p.left;
  round.defense = {
    defender,
    pointerCount: max,
    tiedCount: top.length,
    reason: !present ? 'desconectado' : top.length > 1 ? 'sorteo' : 'senalado',
  };
  if (present) setPhase(room, 'defense', now, t.defense);
  else setPhase(room, 'vote', now, t.vote);
}

/** Alibi used when a player never submitted one: the truth, except the culprit avoids the scene. */
function autoAlibi(round: RoundState, id: PlayerId): string[] {
  const { setup } = round;
  const zones = setup.truth[id].slice();
  if (setup.roles[id] === 'culpable') {
    const rng = createRng(`auto|${setup.seed}|${id}`);
    zones[setup.scene.slot] = rng.pick(setup.zones.filter((z) => z !== setup.scene.zone));
  }
  return zones;
}

function countVotes(votes: Record<PlayerId, PlayerId>, candidates: PlayerId[]): Record<PlayerId, number> {
  const tally: Record<PlayerId, number> = Object.fromEntries(candidates.map((c) => [c, 0]));
  for (const target of Object.values(votes)) if (target in tally) tally[target]++;
  return tally;
}

function topOf(tally: Record<PlayerId, number>): PlayerId[] {
  const max = Math.max(0, ...Object.values(tally));
  return Object.keys(tally).filter((id) => tally[id] === max);
}

// ───────────────────────────── resolution & scoring ─────────────────────────────

export function computeOutcome(round: RoundState, accused: PlayerId | null): Outcome {
  const { setup } = round;
  const culprit = Object.keys(setup.roles).find((p) => setup.roles[p] === 'culpable')!;
  const caught = accused === culprit;
  const tally = countVotes(round.votes, round.participants);
  const runoffTally = round.runoff ? countVotes(round.runoff.votes, round.runoff.candidates) : null;

  const lies: Record<PlayerId, number[]> = {};
  for (const id of round.participants) {
    const decl = round.declarations[id]?.zones ?? [];
    lies[id] = [0, 1, 2].filter((s) => decl[s] !== setup.truth[id][s]);
  }

  // Testimonies that exposed a real lie with a true statement.
  const exposing = round.testimonies
    .filter(
      (t) =>
        testimonyStatus(round, t) === 'contradice' &&
        setup.truth[t.by][t.slot] === t.zone &&
        setup.truth[t.subject][t.slot] === t.zone,
    )
    .map((t) => t.id);

  const encargoDone: Record<PlayerId, boolean> | null = setup.encargos ? {} : null;
  const score: Record<PlayerId, ScoreLine[]> = {};
  const add = (id: PlayerId, reason: ScoreReason) => score[id].push({ reason, points: SCORE_POINTS[reason] });

  for (const id of round.participants) {
    score[id] = [];
    const role = setup.roles[id];
    if (role === 'inocente') {
      if (caught) add(id, 'grupo_gana');
      if (round.votes[id] === culprit) add(id, 'voto_certero');
    } else if (role === 'culpable') {
      if (!caught) add(id, 'culpable_escapa');
    } else if (role === 'complice') {
      if (!caught) add(id, 'complice_escapa');
    }
    if (round.testimonies.some((t) => t.by === id && exposing.includes(t.id))) add(id, 'cazador');
    if (setup.encargos && encargoDone) {
      const done = evaluateEncargo(round, id, setup.encargos[id]);
      encargoDone[id] = done;
      if (done) add(id, 'encargo');
    }
  }
  return { accused, culpritCaught: caught, tally, runoffTally, lies, encargoDone, score, exposing };
}

function resolve(room: RoomState, accused: PlayerId | null, now: number): void {
  const round = room.round!;
  const outcome = computeOutcome(round, accused);
  round.outcome = outcome;
  for (const id of round.participants) {
    const p = findPlayer(room, id);
    if (p) p.score += outcome.score[id].reduce((s, l) => s + l.points, 0);
  }
  const roles = round.setup.roles;
  room.roundsPlayed += 1;
  room.history.push({
    number: round.number,
    scenarioId: round.setup.scenarioId,
    seed: round.setup.seed,
    culprit: Object.keys(roles).find((p) => roles[p] === 'culpable')!,
    accomplice: Object.keys(roles).find((p) => roles[p] === 'complice') ?? null,
    accused,
    caught: outcome.culpritCaught,
  });
  setPhase(room, 'result', now, null);
}

function touch(room: RoomState, now: number): void {
  room.updatedAt = now;
}
