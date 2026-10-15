// Client game store. Screens read a Snapshot and call `send()`; they don't know
// whether they're talking to the real server (online) or the in-browser engine
// used by the single-phone mode (local). The client never decides outcomes.

import { useSyncExternalStore } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Ack, ClientEvent, StateMessage } from '../../shared/protocol';
import type { PrivateView, PublicView } from '../../shared/engine/views';

export type ConnState = 'idle' | 'connecting' | 'online' | 'offline';

export interface Snapshot {
  mode: 'online' | 'local';
  pub: PublicView | null;
  priv: PrivateView | null;
  conn: ConnState;
  /** serverNow - clientNow, in ms. */
  clockOffset: number;
  me: string | null;
  notice: string | null;
  /** True while trying to resume a saved session at startup. */
  resuming: boolean;
}

export interface Session {
  code: string;
  playerId: string;
  token: string;
}

const SESSION_KEY = 'coartada:session';

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null): void {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode: the session simply won't survive a reload */
  }
}

export function setRoomInUrl(code: string | null): void {
  const url = new URL(location.href);
  if (code) url.searchParams.set('sala', code);
  else url.searchParams.delete('sala');
  history.replaceState(null, '', url.pathname + url.search);
}

export function roomFromUrl(): string | null {
  const v = new URL(location.href).searchParams.get('sala');
  return v ? v.trim().toUpperCase().slice(0, 8) : null;
}

type Listener = () => void;

export class Store {
  snap: Snapshot = { mode: 'online', pub: null, priv: null, conn: 'idle', clockOffset: 0, me: null, notice: null, resuming: false };
  private listeners = new Set<Listener>();
  private socket: Socket | null = null;
  /** Set by the local (single-phone) mode to intercept actions. */
  localHandler: ((event: ClientEvent, payload: unknown) => Ack) | null = null;

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  get = () => this.snap;

  set(patch: Partial<Snapshot>): void {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((l) => l());
  }

  now(): number {
    return Date.now() + this.snap.clockOffset;
  }

  // ───────────── online mode ─────────────

  connect(): Socket {
    if (this.socket) return this.socket;
    this.set({ conn: 'connecting' });
    const socket = io({ transports: ['websocket', 'polling'], reconnectionDelayMax: 4000, timeout: 8000 });
    this.socket = socket;
    socket.on('connect', () => {
      this.set({ conn: 'online' });
      const s = loadSession();
      if (s && (this.snap.me || this.snap.resuming)) void this.resume(s);
    });
    socket.on('disconnect', () => this.set({ conn: 'offline' }));
    socket.io.on('reconnect_attempt', () => this.set({ conn: 'connecting' }));
    socket.on('state', (msg: StateMessage) => this.onState(msg));
    socket.on('room:closed', ({ reason }) => {
      saveSession(null);
      setRoomInUrl(null);
      const notice =
        reason === 'kicked' ? 'Te han sacado de la sala.' : reason === 'expired' ? 'La sala se cerró por inactividad.' : null;
      this.set({ pub: null, priv: null, me: null, notice });
    });
    // Phones freeze background tabs; reconnect as soon as the game is visible again.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !socket.connected) socket.connect();
    });
    window.addEventListener('online', () => {
      if (!socket.connected) socket.connect();
    });
    return socket;
  }

  private onState(msg: StateMessage): void {
    // serverNow was stamped before the message travelled, so each sample underestimates the
    // real offset by that message's latency. Keep the largest sample (the least delayed one);
    // lower samples only nudge it, so a changed device clock is still followed slowly.
    const offset = msg.serverNow - Date.now();
    const prev = this.snap.clockOffset;
    const clockOffset = !this.snap.pub || offset > prev ? offset : Math.round(prev * 0.9 + offset * 0.1);
    this.set({ pub: msg.pub, priv: msg.priv, clockOffset, me: msg.priv?.playerId ?? this.snap.me });
  }

  private emit(event: ClientEvent, payload: unknown, timeoutMs = 6000): Promise<Ack> {
    const socket = this.connect();
    return new Promise((done) => {
      if (!socket.connected && event !== 'room:create' && event !== 'room:join' && event !== 'room:resume') {
        done({ ok: false, error: 'not_in_room' });
        return;
      }
      socket.timeout(timeoutMs).emit(event, payload, (err: Error | null, ack: Ack) => {
        done(err ? { ok: false, error: 'server_busy' } : ack);
      });
    });
  }

  async tryResumeAtStartup(): Promise<void> {
    const s = loadSession();
    const urlCode = roomFromUrl();
    if (!s || (urlCode && urlCode !== s.code)) return;
    this.set({ resuming: true });
    this.connect();
    // `connect` handler performs the resume; give up after a while.
    setTimeout(() => this.snap.resuming && this.set({ resuming: false }), 8000);
  }

  private async resume(s: Session): Promise<void> {
    const ack = await this.emit('room:resume', s);
    if (ack.ok) {
      this.set({ me: s.playerId, resuming: false });
      setRoomInUrl(s.code);
    } else {
      if (ack.error === 'no_room' || ack.error === 'bad_token') {
        saveSession(null);
        this.set({ pub: null, priv: null, me: null, notice: ack.error === 'no_room' ? 'Esa sala ya no existe.' : null });
      }
      this.set({ resuming: false });
    }
  }

  async create(name: string): Promise<Ack> {
    const ack = await this.emit('room:create', { name });
    if (ack.ok) this.adopt(ack);
    return ack;
  }

  async join(code: string, name: string): Promise<Ack> {
    const ack = await this.emit('room:join', { code, name });
    if (ack.ok) this.adopt(ack);
    return ack;
  }

  private adopt(ack: Extract<Ack, { ok: true }>): void {
    saveSession({ code: ack.code!, playerId: ack.playerId!, token: ack.token! });
    setRoomInUrl(ack.code!);
    this.set({ me: ack.playerId!, notice: null, mode: 'online' });
  }

  async leave(): Promise<void> {
    if (this.snap.mode === 'local') {
      this.localHandler = null;
      this.set({ mode: 'online', pub: null, priv: null, me: null });
      return;
    }
    await this.emit('room:leave', {});
    saveSession(null);
    setRoomInUrl(null);
    this.set({ pub: null, priv: null, me: null });
  }

  send(event: ClientEvent, payload: unknown = {}): Promise<Ack> {
    if (this.snap.mode === 'local' && this.localHandler) return Promise.resolve(this.localHandler(event, payload));
    return this.emit(event, payload);
  }

  clearNotice(): void {
    this.set({ notice: null });
  }
}

export const store = new Store();

export function useStore(): Snapshot {
  return useSyncExternalStore(store.subscribe, store.get);
}
