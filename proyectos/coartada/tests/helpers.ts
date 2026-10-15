import { SCENARIOS } from '../src/shared/content/scenarios';
import { addPlayer, createRoom, startRound, type EngineDeps } from '../src/shared/engine/game';
import type { PlayerId, RoomState } from '../src/shared/types';

export function makeDeps(): EngineDeps {
  let i = 0;
  return {
    scenarios: SCENARIOS,
    makeId: () => `p${i++}`,
    makeToken: () => `token-${i}-${'x'.repeat(20)}`,
    makeSeed: () => `seed-${i++}`,
  };
}

export const T0 = 1_700_000_000_000;

export function lobby(n: number, deps = makeDeps()): { room: RoomState; ids: PlayerId[]; deps: EngineDeps } {
  const created = createRoom('BCDF', 'Ana', T0, deps);
  if (!created.ok) throw new Error('create failed');
  const room = created.room;
  const names = ['Bea', 'Carlos', 'Dani', 'Eva', 'Fran', 'Gala', 'Hugo', 'Irene', 'Jon', 'Kike'];
  for (let k = 1; k < n; k++) addPlayer(room, names[k - 1], T0, deps);
  return { room, ids: room.players.map((p) => p.id), deps };
}

export function started(n: number, seed = 'fixed-seed', opts: { encargos?: boolean } = {}) {
  const l = lobby(n);
  if (opts.encargos) l.room.settings.encargos = true;
  const res = startRound(l.room, l.room.hostId, T0, l.deps, seed);
  if (!res.ok) throw new Error(res.error);
  const setup = l.room.round!.setup;
  const culprit = l.ids.find((p) => setup.roles[p] === 'culpable')!;
  const accomplice = l.ids.find((p) => setup.roles[p] === 'complice') ?? null;
  const innocents = l.ids.filter((p) => setup.roles[p] === 'inocente');
  return { ...l, setup, culprit, accomplice, innocents };
}
