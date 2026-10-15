// Wire protocol. Every client→server payload is validated with these schemas on the
// server before it reaches the engine; anything else is rejected with `invalid`.
import { z } from 'zod';
import { MAX_PLAYERS, NAME_MAX, SLOT_COUNT } from './types';
import type { PrivateView, PublicView } from './engine/views';

export const ROOM_CODE_ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ';
export const ROOM_CODE_LENGTH = 4;

const id = z.string().min(1).max(40);
const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`));
const name = z.string().min(1).max(NAME_MAX * 4);
const zoneId = z.string().min(1).max(24);

export const ClientMessages = {
  'room:create': z.object({ name }).strict(),
  'room:join': z.object({ code, name }).strict(),
  'room:resume': z.object({ code, playerId: id, token: z.string().min(16).max(80) }).strict(),
  'room:leave': z.object({}).strict(),
  'room:settings': z
    .object({
      pace: z.enum(['relajado', 'normal', 'rapido']).optional(),
      rounds: z.union([z.literal(0), z.literal(3), z.literal(5), z.literal(8)]).optional(),
      encargos: z.boolean().optional(),
    })
    .strict(),
  'room:kick': z.object({ playerId: id }).strict(),
  'game:start': z.object({}).strict(),
  'game:declare': z.object({ zones: z.array(zoneId).length(SLOT_COUNT), lock: z.boolean() }).strict(),
  'game:testify': z.object({ subject: id, slot: z.number().int().min(0).max(SLOT_COUNT - 1) }).strict(),
  'game:ready': z.object({ ready: z.boolean() }).strict(),
  'game:vote': z.object({ target: id }).strict(),
  'game:point': z.object({ target: id.nullable() }).strict(),
  'game:endDefense': z.object({}).strict(),
  'game:advance': z.object({}).strict(),
  'game:next': z.object({}).strict(),
  'game:lobby': z.object({}).strict(),
} as const;

export type ClientEvent = keyof typeof ClientMessages;
export type ClientPayload<E extends ClientEvent> = z.infer<(typeof ClientMessages)[E]>;

export type ErrorCode =
  | 'invalid'
  | 'rate_limited'
  | 'no_room'
  | 'bad_token'
  | 'not_in_room'
  | 'too_many_rooms'
  | 'server_busy'
  | 'not_host'
  | 'wrong_phase'
  | 'not_participant'
  | 'already_done'
  | 'not_enough_players'
  | 'too_many_players'
  | 'room_full'
  | 'limit_reached'
  | 'unknown_player';

export type Ack =
  | { ok: true; code?: string; playerId?: string; token?: string }
  | { ok: false; error: ErrorCode };

export interface StateMessage {
  pub: PublicView;
  priv: PrivateView | null;
  /** Server clock (ms) when the message was built, for client clock-offset estimation. */
  serverNow: number;
}

export interface ServerToClient {
  state: (msg: StateMessage) => void;
  'room:closed': (msg: { reason: 'kicked' | 'expired' | 'left' }) => void;
}

export type ClientToServer = {
  [E in ClientEvent]: (payload: ClientPayload<E>, ack: (a: Ack) => void) => void;
};

export const MAX_ROOM_MEMBERS = MAX_PLAYERS;
