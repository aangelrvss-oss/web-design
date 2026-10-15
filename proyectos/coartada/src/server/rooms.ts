// Room registry: owns every RoomState, its server-side timer and which sockets belong
// to which player. All mutations go through `act()`, which runs the engine function,
// reschedules the phase timer and pushes fresh state to every member.

import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { ScenarioDef } from '../shared/content/types';
import { ensureHost, findPlayer, HOST_GRACE_MS, setConnected, tick, type EngineDeps, type Result } from '../shared/engine/game';
import { privateView, publicView } from '../shared/engine/views';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, type StateMessage } from '../shared/protocol';
import type { PlayerId, RoomState } from '../shared/types';

export interface RoomManagerOptions {
  scenarios: ScenarioDef[];
  /** Delete a room after this long with nobody connected. */
  emptyTtlMs: number;
  /** Delete any room idle (no state change) for this long. */
  idleTtlMs: number;
  maxRooms: number;
  /** How long a disconnected host keeps the role (default HOST_GRACE_MS). */
  hostGraceMs?: number;
  log?: (msg: string, data?: Record<string, unknown>) => void;
  now?: () => number;
}

export type Emit = (socketId: string, msg: StateMessage) => void;
export type EmitClosed = (socketId: string, reason: 'kicked' | 'expired' | 'left') => void;

interface Entry {
  state: RoomState;
  timer: NodeJS.Timeout | null;
  hostTimer: NodeJS.Timeout | null;
  sockets: Map<PlayerId, Set<string>>;
}

export class RoomManager {
  readonly rooms = new Map<string, Entry>();
  readonly deps: EngineDeps;
  private emit: Emit = () => {};
  private emitClosed: EmitClosed = () => {};
  private sweepTimer: NodeJS.Timeout | null = null;
  private readonly now: () => number;
  private readonly hostGrace: number;

  constructor(private readonly opts: RoomManagerOptions) {
    this.now = opts.now ?? Date.now;
    this.hostGrace = opts.hostGraceMs ?? HOST_GRACE_MS;
    this.deps = {
      scenarios: opts.scenarios,
      makeId: () => randomUUID().slice(0, 12),
      makeToken: () => randomBytes(24).toString('base64url'),
      makeSeed: () => randomBytes(6).toString('hex'),
    };
  }

  bind(emit: Emit, emitClosed: EmitClosed): void {
    this.emit = emit;
    this.emitClosed = emitClosed;
  }

  startSweeper(intervalMs = 60_000): void {
    this.sweepTimer = setInterval(() => this.sweep(), intervalMs);
    this.sweepTimer.unref();
  }

  stop(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    for (const e of this.rooms.values()) this.clearTimers(e);
    this.rooms.clear();
  }

  newCode(): string | null {
    for (let i = 0; i < 200; i++) {
      const bytes = randomBytes(ROOM_CODE_LENGTH);
      let code = '';
      for (const b of bytes) code += ROOM_CODE_ALPHABET[b % ROOM_CODE_ALPHABET.length];
      if (!this.rooms.has(code)) return code;
    }
    return null;
  }

  canCreate(): boolean {
    return this.rooms.size < this.opts.maxRooms;
  }

  add(state: RoomState): void {
    this.rooms.set(state.code, { state, timer: null, hostTimer: null, sockets: new Map() });
    this.opts.log?.('room created', { code: state.code });
  }

  get(code: string): RoomState | undefined {
    return this.rooms.get(code)?.state;
  }

  /** Constant-time token check. */
  authenticate(code: string, playerId: string, token: string): boolean {
    const room = this.get(code);
    const p = room && findPlayer(room, playerId);
    if (!p || p.left) return false;
    const a = Buffer.from(p.token);
    const b = Buffer.from(token);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  attach(code: string, playerId: PlayerId, socketId: string): void {
    const entry = this.rooms.get(code);
    if (!entry) return;
    const set = entry.sockets.get(playerId) ?? new Set<string>();
    set.add(socketId);
    entry.sockets.set(playerId, set);
    setConnected(entry.state, playerId, true, this.now());
    this.afterChange(entry);
  }

  detach(code: string, playerId: PlayerId, socketId: string): void {
    const entry = this.rooms.get(code);
    if (!entry) return;
    const set = entry.sockets.get(playerId);
    set?.delete(socketId);
    if (set && set.size > 0) return;
    entry.sockets.delete(playerId);
    const p = findPlayer(entry.state, playerId);
    if (p && !p.left) setConnected(entry.state, playerId, false, this.now());
    // Re-check the host once the grace period is over.
    if (entry.state.hostId === playerId) {
      if (entry.hostTimer) clearTimeout(entry.hostTimer);
      entry.hostTimer = setTimeout(() => {
        entry.hostTimer = null;
        if (!this.rooms.has(code)) return;
        ensureHost(entry.state, this.now(), this.hostGrace);
        this.afterChange(entry);
      }, this.hostGrace + 50);
      entry.hostTimer.unref();
    }
    this.afterChange(entry);
  }

  /** Run an engine action against a room, then reschedule and broadcast. */
  act<T extends object>(code: string, fn: (room: RoomState, now: number) => Result<T>): Result<T> | { ok: false; error: 'no_room' } {
    const entry = this.rooms.get(code);
    if (!entry) return { ok: false, error: 'no_room' };
    const res = fn(entry.state, this.now());
    if (res.ok) this.afterChange(entry);
    return res;
  }

  /** Socket ids of a player (used to notify kicked players). */
  socketsOf(code: string, playerId: PlayerId): string[] {
    return [...(this.rooms.get(code)?.sockets.get(playerId) ?? [])];
  }

  dropSockets(code: string, playerId: PlayerId, reason: 'kicked' | 'left'): string[] {
    const entry = this.rooms.get(code);
    if (!entry) return [];
    const ids = [...(entry.sockets.get(playerId) ?? [])];
    entry.sockets.delete(playerId);
    for (const s of ids) this.emitClosed(s, reason);
    return ids;
  }

  broadcast(code: string): void {
    const entry = this.rooms.get(code);
    if (entry) this.push(entry);
  }

  private afterChange(entry: Entry): void {
    this.schedule(entry);
    this.push(entry);
    if (entry.state.players.every((p) => p.left)) this.remove(entry.state.code, 'expired');
  }

  private push(entry: Entry): void {
    const now = this.now();
    const pub = publicView(entry.state, this.opts.scenarios);
    for (const [playerId, sockets] of entry.sockets) {
      const priv = findPlayer(entry.state, playerId) ? privateView(entry.state, playerId) : null;
      const msg: StateMessage = { pub, priv, serverNow: now };
      for (const s of sockets) this.emit(s, msg);
    }
  }

  private schedule(entry: Entry): void {
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = null;
    const endsAt = entry.state.phaseEndsAt;
    if (endsAt === null) return;
    const delay = Math.max(0, endsAt - this.now()) + 30;
    entry.timer = setTimeout(() => {
      entry.timer = null;
      if (!this.rooms.has(entry.state.code)) return;
      if (tick(entry.state, this.now())) this.afterChange(entry);
      else this.schedule(entry);
    }, delay);
    entry.timer.unref();
  }

  private clearTimers(entry: Entry): void {
    if (entry.timer) clearTimeout(entry.timer);
    if (entry.hostTimer) clearTimeout(entry.hostTimer);
    entry.timer = null;
    entry.hostTimer = null;
  }

  remove(code: string, reason: 'expired' | 'left' = 'expired'): void {
    const entry = this.rooms.get(code);
    if (!entry) return;
    this.clearTimers(entry);
    for (const sockets of entry.sockets.values()) for (const s of sockets) this.emitClosed(s, reason);
    this.rooms.delete(code);
    this.opts.log?.('room removed', { code, reason });
  }

  /** Remove abandoned rooms. Returns the codes removed. */
  sweep(): string[] {
    const now = this.now();
    const removed: string[] = [];
    for (const [code, entry] of this.rooms) {
      const anyoneHere = entry.state.players.some((p) => p.connected);
      const lastPresence = Math.max(...entry.state.players.map((p) => p.lastSeen), entry.state.updatedAt);
      const empty = !anyoneHere && now - lastPresence > this.opts.emptyTtlMs;
      const idle = now - entry.state.updatedAt > this.opts.idleTtlMs;
      if (empty || idle) {
        this.remove(code, 'expired');
        removed.push(code);
      }
    }
    return removed;
  }
}
