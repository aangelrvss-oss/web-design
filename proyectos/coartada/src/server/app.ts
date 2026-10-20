// HTTP + Socket.IO game server. `createGameServer()` is used by main.ts and by the
// integration tests (which start it on a random port).

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { Server, type Socket } from 'socket.io';
import { validateCatalogue } from '../shared/content/validate';
import type { ScenarioDef } from '../shared/content/types';
import {
  addPlayer,
  chooseAvatar,
  createRoom,
  declare,
  endDefense,
  examine,
  forceAdvance,
  forge,
  kick,
  leave,
  nextRound,
  point,
  setReady,
  startRound,
  testify,
  toLobby,
  updateSettings,
  vote,
} from '../shared/engine/game';
import { ClientMessages, type Ack, type ClientEvent, type ClientToServer, type ServerToClient } from '../shared/protocol';
import { RoomManager } from './rooms';

export interface ServerConfig {
  port: number;
  host: string;
  scenarios: ScenarioDef[];
  /** Built client (dist/client). Omit in dev (Vite serves the client). */
  clientDir?: string;
  /** Allowed browser origins for Socket.IO in dev (Vite on another port). */
  corsOrigins?: string[];
  trustProxy?: boolean;
  emptyTtlMs?: number;
  idleTtlMs?: number;
  maxRooms?: number;
  hostGraceMs?: number;
  /** Rooms one IP may create per 10 minutes. */
  createLimit?: number;
  log?: (msg: string, data?: Record<string, unknown>) => void;
  /** Skip the (slow) full content validation at boot, e.g. in tests. */
  skipValidation?: boolean;
}

export interface GameServer {
  http: HttpServer;
  io: Server<ClientToServer, ServerToClient>;
  manager: RoomManager;
  port: () => number;
  close: () => Promise<void>;
}

interface SocketData {
  code: string | null;
  playerId: string | null;
  tokens: number;
  last: number;
  strikes: number;
  ip: string;
}

const BUCKET_CAPACITY = 20;
const BUCKET_REFILL_PER_SEC = 6;
const MAX_STRIKES = 60;

export async function createGameServer(config: ServerConfig): Promise<GameServer> {
  const log = config.log ?? (() => {});
  if (!config.skipValidation) {
    const errors = validateCatalogue(config.scenarios, 5);
    if (errors.length) throw new Error(`Scenario validation failed:\n${errors.join('\n')}`);
  }

  const manager = new RoomManager({
    scenarios: config.scenarios,
    emptyTtlMs: config.emptyTtlMs ?? 15 * 60_000,
    idleTtlMs: config.idleTtlMs ?? 6 * 60 * 60_000,
    maxRooms: config.maxRooms ?? 1000,
    hostGraceMs: config.hostGraceMs,
    log,
  });

  const http = createServer((req, res) => handleHttp(req, res, config, manager));
  const io = new Server<ClientToServer, ServerToClient, Record<string, never>, SocketData>(http, {
    maxHttpBufferSize: 16 * 1024,
    pingInterval: 10_000,
    pingTimeout: 8_000,
    cors: config.corsOrigins?.length ? { origin: config.corsOrigins } : undefined,
    connectionStateRecovery: undefined,
  });

  manager.bind(
    (socketId, msg) => io.to(socketId).emit('state', msg),
    (socketId, reason) => io.to(socketId).emit('room:closed', { reason }),
  );
  manager.startSweeper();

  const createLog = new Map<string, number[]>();
  const createLimit = config.createLimit ?? 30;
  const allowCreate = (ip: string): boolean => {
    const now = Date.now();
    const recent = (createLog.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
    if (recent.length >= createLimit) return false;
    recent.push(now);
    createLog.set(ip, recent);
    return true;
  };

  io.on('connection', (socket) => {
    const forwarded = config.trustProxy ? String(socket.handshake.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '';
    socket.data = { code: null, playerId: null, tokens: BUCKET_CAPACITY, last: Date.now(), strikes: 0, ip: forwarded || socket.handshake.address };

    const takeToken = (): boolean => {
      const d = socket.data;
      const now = Date.now();
      d.tokens = Math.min(BUCKET_CAPACITY, d.tokens + ((now - d.last) / 1000) * BUCKET_REFILL_PER_SEC);
      d.last = now;
      if (d.tokens < 1) return false;
      d.tokens -= 1;
      return true;
    };

    const unbind = () => {
      const { code, playerId } = socket.data;
      if (code && playerId) {
        socket.leave(`room:${code}`);
        manager.detach(code, playerId, socket.id);
      }
      socket.data.code = null;
      socket.data.playerId = null;
    };

    const bind = (code: string, playerId: string) => {
      socket.data.code = code;
      socket.data.playerId = playerId;
      socket.join(`room:${code}`);
      manager.attach(code, playerId, socket.id);
    };

    const handlers: { [E in ClientEvent]: (p: never) => Ack } = {
      'room:create': (p: { name: string }) => {
        if (!manager.canCreate()) return { ok: false, error: 'server_busy' };
        if (!allowCreate(socket.data.ip)) return { ok: false, error: 'too_many_rooms' };
        const code = manager.newCode();
        if (!code) return { ok: false, error: 'server_busy' };
        const res = createRoom(code, p.name, Date.now(), manager.deps);
        if (!res.ok) return res;
        unbind();
        manager.add(res.room);
        bind(code, res.player.id);
        return { ok: true, code, playerId: res.player.id, token: res.player.token };
      },
      'room:join': (p: { code: string; name: string }) => {
        if (!manager.get(p.code)) return { ok: false, error: 'no_room' };
        const res = manager.act(p.code, (room, now) => addPlayer(room, p.name, now, manager.deps));
        if (!res.ok) return res;
        unbind();
        bind(p.code, res.player.id);
        return { ok: true, code: p.code, playerId: res.player.id, token: res.player.token };
      },
      'room:resume': (p: { code: string; playerId: string; token: string }) => {
        if (!manager.get(p.code)) return { ok: false, error: 'no_room' };
        if (!manager.authenticate(p.code, p.playerId, p.token)) return { ok: false, error: 'bad_token' };
        if (socket.data.code !== p.code || socket.data.playerId !== p.playerId) {
          unbind();
          bind(p.code, p.playerId);
        } else {
          manager.broadcast(p.code);
        }
        return { ok: true, code: p.code, playerId: p.playerId };
      },
      'room:leave': () => {
        const { code, playerId } = socket.data;
        if (!code || !playerId) return { ok: false, error: 'not_in_room' };
        const res = manager.act(code, (room, now) => leave(room, playerId, now));
        manager.dropSockets(code, playerId, 'left');
        socket.leave(`room:${code}`);
        socket.data.code = null;
        socket.data.playerId = null;
        return res.ok ? { ok: true } : res;
      },
      'room:settings': (p: { pace?: 'relajado' | 'normal' | 'rapido'; rounds?: 0 | 3 | 5 | 8; encargos?: boolean; variant?: 'prueba_falsa' | null }) =>
        inRoom((code, me) => manager.act(code, (room, now) => updateSettings(room, me, p, now))),
      'room:avatar': (p: { avatar: string }) => inRoom((code, me) => manager.act(code, (room, now) => chooseAvatar(room, me, p.avatar, now))),
      'room:kick': (p: { playerId: string }) =>
        inRoom((code, me) => {
          const res = manager.act(code, (room, now) => kick(room, me, p.playerId, now));
          if (res.ok) manager.dropSockets(code, p.playerId, 'kicked');
          return res;
        }),
      'game:start': () =>
        inRoom((code, me) => {
          const res = manager.act(code, (room, now) => startRound(room, me, now, manager.deps));
          if (res.ok) logRound(code);
          return res;
        }),
      'game:declare': (p: { zones: string[]; lock: boolean }) =>
        inRoom((code, me) => manager.act(code, (room, now) => declare(room, me, p.zones, p.lock, now))),
      'game:testify': (p: { subject: string; slot: number }) =>
        inRoom((code, me) => manager.act(code, (room, now) => testify(room, me, p.subject, p.slot, now))),
      'game:ready': (p: { ready: boolean }) => inRoom((code, me) => manager.act(code, (room, now) => setReady(room, me, p.ready, now))),
      'game:vote': (p: { target: string }) => inRoom((code, me) => manager.act(code, (room, now) => vote(room, me, p.target, now))),
      'game:point': (p: { target: string | null }) => inRoom((code, me) => manager.act(code, (room, now) => point(room, me, p.target, now))),
      'game:forge': (p: { forgery: { slot: number; zone: string } | null }) =>
        inRoom((code, me) => manager.act(code, (room, now) => forge(room, me, p.forgery, now))),
      'game:examine': (p: { index: number | null }) => inRoom((code, me) => manager.act(code, (room, now) => examine(room, me, p.index, now))),
      'game:endDefense': () => inRoom((code, me) => manager.act(code, (room, now) => endDefense(room, me, now))),
      'game:advance': () => inRoom((code, me) => manager.act(code, (room, now) => forceAdvance(room, me, now))),
      'game:next': () =>
        inRoom((code, me) => {
          const res = manager.act(code, (room, now) => nextRound(room, me, now, manager.deps));
          if (res.ok) logRound(code);
          return res;
        }),
      'game:lobby': () => inRoom((code, me) => manager.act(code, (room, now) => toLobby(room, me, now))),
    };

    function inRoom(fn: (code: string, me: string) => { ok: boolean; error?: string }): Ack {
      const { code, playerId } = socket.data;
      if (!code || !playerId || !manager.get(code)) return { ok: false, error: 'not_in_room' };
      const res = fn(code, playerId);
      return res.ok ? { ok: true } : ({ ok: false, error: res.error } as Ack);
    }

    function logRound(code: string) {
      const room = manager.get(code);
      if (room?.round && room.round.tracesRevealed === 0 && room.phase === 'declare') {
        log('round started', {
          code,
          round: room.round.number,
          scenario: room.round.setup.scenarioId,
          seed: room.round.setup.seed,
          players: room.round.participants.length,
        });
      }
    }

    for (const event of Object.keys(ClientMessages) as ClientEvent[]) {
      socket.on(event, (payload: unknown, ack: unknown) => {
        const reply = typeof ack === 'function' ? (ack as (a: Ack) => void) : () => {};
        if (!takeToken()) {
          socket.data.strikes++;
          if (socket.data.strikes > MAX_STRIKES) socket.disconnect(true);
          return reply({ ok: false, error: 'rate_limited' });
        }
        const parsed = ClientMessages[event].safeParse(payload ?? {});
        if (!parsed.success) return reply({ ok: false, error: 'invalid' });
        try {
          reply(handlers[event](parsed.data as never));
        } catch (err) {
          log('handler error', { event, error: (err as Error).message });
          reply({ ok: false, error: 'invalid' });
        }
      });
    }

    socket.on('disconnect', () => unbind());
  });

  await new Promise<void>((done) => http.listen(config.port, config.host, done));
  const addr = http.address();
  const port = () => (typeof addr === 'object' && addr ? addr.port : config.port);
  log('listening', { host: config.host, port: port() });

  return {
    http,
    io,
    manager,
    port,
    close: async () => {
      manager.stop();
      io.disconnectSockets(true);
      await new Promise<void>((done) => io.close(() => done()));
    },
  };
}

// ───────────────────────────── static files ─────────────────────────────

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws: wss:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
};

function handleHttp(req: IncomingMessage, res: ServerResponse, config: ServerConfig, manager: RoomManager): void {
  const url = new URL(req.url ?? '/', 'http://local');
  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok: true, rooms: manager.rooms.size }));
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  if (!config.clientDir) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Client not built. In dev, open the Vite URL.');
    return;
  }
  const root = resolve(config.clientDir);
  let path: string;
  try {
    path = normalize(join(root, decodeURIComponent(url.pathname)));
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (path !== root && !path.startsWith(root + sep)) {
    res.writeHead(403).end();
    return;
  }
  let file = path;
  if (!existsSync(file) || statSync(file).isDirectory()) {
    // SPA fallback: unknown paths (e.g. /?sala=XXXX deep links) get the app shell.
    if (extname(url.pathname)) {
      res.writeHead(404, SECURITY_HEADERS).end();
      return;
    }
    file = join(root, 'index.html');
  }
  const ext = extname(file);
  const immutable = file.includes(`${sep}assets${sep}`);
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(file).pipe(res);
}

export type { Socket };
