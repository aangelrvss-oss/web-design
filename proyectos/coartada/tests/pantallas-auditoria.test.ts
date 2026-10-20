// Screens checked before the first real playtest, rendered from real engine states (defects found
// in the audit, docs/AUDITORIA-playtest.md):
//  - after the last round, the verdict offers no way back to the room, where «Empezar» would play
//    a round past the end («Ronda 4 de 3»); before it, it does;
//  - with one shared phone, declaring and voting have no clock: no text talks about a time limit;
//    with one phone each, the timed rules are still said;
//  - the vote reminder says «vota», not «señala» (the word of the last-defense pick).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/shared/content/scenarios';
import { forceAdvance, nextRound, startRound, updateSettings } from '../src/shared/engine/game';
import { privateView, publicView, type PublicView } from '../src/shared/engine/views';
import { lobby, T0 } from './helpers';

// The client modules touch the page when they load; a minimal page is enough. Reduced motion
// shows the verdict whole at once (its buttons come after the staged reveal).
const g = globalThis as Record<string, unknown>;
g.document ??= { documentElement: { classList: { toggle: () => undefined } } };
g.localStorage ??= { getItem: (k: string) => (k === 'coartada:prefs' ? '{"reduceMotion":true}' : null), setItem: () => undefined, removeItem: () => undefined };
const { Result } = await import('../src/client/screens/Result');
const { Vote } = await import('../src/client/screens/Vote');
const { Declare } = await import('../src/client/screens/Declare');

const text = (el: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(el)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');
const noop = () => undefined;

/** A room after `played` rounds of a `rounds`-round match, on the verdict. */
function verdictAfter(rounds: 3 | 5, played: number) {
  const l = lobby(4);
  updateSettings(l.room, l.room.hostId, { rounds }, T0);
  startRound(l.room, l.room.hostId, T0, l.deps);
  for (let r = 1; r <= played; r++) {
    while (l.room.phase !== 'result') forceAdvance(l.room, l.room.hostId, T0);
    if (r < played) nextRound(l.room, l.room.hostId, T0, l.deps);
  }
  return l;
}
/** A room in `phase` of round 1. */
function at(phase: 'declare' | 'vote') {
  const l = lobby(4);
  startRound(l.room, l.room.hostId, T0, l.deps);
  while (l.room.phase !== phase) forceAdvance(l.room, l.room.hostId, T0);
  return l;
}
const untimed = (pub: PublicView): PublicView => ({ ...pub, phaseEndsAt: null });

describe('auditoría: pantallas', () => {
  it('tras la última ronda, el veredicto no ofrece volver a la sala (solo la clasificación final)', () => {
    const last = verdictAfter(3, 3);
    const host = last.room.hostId;
    const t = text(createElement(Result, { pub: publicView(last.room, SCENARIOS), priv: privateView(last.room, host), onMenu: noop }));
    expect(t).toContain('Ver clasificación final');
    expect(t).not.toContain('Ir a la sala');
    // Before the last round both are there.
    const mid = verdictAfter(3, 2);
    const t2 = text(createElement(Result, { pub: publicView(mid.room, SCENARIOS), priv: privateView(mid.room, mid.room.hostId), onMenu: noop }));
    expect(t2).toContain('Siguiente ronda');
    expect(t2).toContain('Ir a la sala');
  });

  it('votar: con un solo móvil no habla de tiempo; con un móvil por persona sí; el recordatorio dice «vota»', () => {
    const l = at('vote');
    const me = l.ids[1];
    const pub = publicView(l.room, SCENARIOS);
    const timed = text(createElement(Vote, { pub, priv: privateView(l.room, me), onMenu: noop }));
    expect(pub.phaseEndsAt).not.toBeNull();
    expect(timed).toContain('Quien no vote a tiempo no cuenta');
    expect(timed).toContain('vota a quien crees culpable');
    expect(timed).not.toMatch(/señala a quien/i);
    const shared = text(createElement(Vote, { pub: untimed(pub), priv: privateView(l.room, me), onMenu: noop }));
    expect(shared).not.toContain('a tiempo');
    expect(shared).toContain('vota a quien crees culpable');
  });

  it('declarar: con un solo móvil no habla de qué pasa si se acaba el tiempo', () => {
    const l = at('declare');
    const me = l.ids[0];
    const pub = publicView(l.room, SCENARIOS);
    expect(text(createElement(Declare, { pub, priv: privateView(l.room, me), onMenu: noop }))).toContain('Si se acaba el tiempo');
    expect(text(createElement(Declare, { pub: untimed(pub), priv: privateView(l.room, me), onMenu: noop }))).not.toContain('Si se acaba el tiempo');
  });
});
