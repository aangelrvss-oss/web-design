// The quick guide must say exactly what the engine does: every number on it comes from the
// game's constants, and it never explains single-phone vs one-phone-each play.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Section } from '../src/client/screens/QuickGuide';
import { rolesFor } from '../src/shared/engine/generate';
import { MAX_TESTIMONIES, SCORE_POINTS, SLOT_COUNT, timingsFor, type Pace } from '../src/shared/types';

// The client modules touch the page when they load (preferences); a minimal page is enough here.
const g = globalThis as Record<string, unknown>;
g.document ??= { documentElement: { classList: { toggle: () => undefined } } };
g.localStorage ??= { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
const { QuickGuide } = await import('../src/client/screens/QuickGuide');

const ALL: Section[] = ['ronda', 'papeles', 'defensa', 'puntos'];
const text = (props: Parameters<typeof QuickGuide>[0]) =>
  renderToStaticMarkup(createElement(QuickGuide, props))
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

describe('quick guide', () => {
  it('shows the points of every scoring reason, from SCORE_POINTS', () => {
    const t = text({ all: ['puntos'] });
    for (const v of Object.values(SCORE_POINTS)) expect(t).toContain(`+${v}`);
    expect(t.match(/\+\d/g)).toHaveLength(Object.keys(SCORE_POINTS).length);
    expect(t).toContain('primera votación');
    expect(t).toContain('Una vez por ronda');
  });

  it('uses the real timers for the room: pace and group size', () => {
    for (const pace of ['relajado', 'normal', 'rapido'] as Pace[])
      for (const players of [4, 6, 9]) {
        const tm = timingsFor(pace, players);
        const t = text({ pace, players, all: ALL });
        expect(t).toContain(`Declaración ${mmss(tm.declare)}`);
        expect(t).toContain(`${mmss(tm.investigate1)} + ${mmss(tm.investigate2)}`);
        expect(t).toContain(`${tm.defense} s`);
        expect(t).toContain(`Votación secreta ${tm.vote} s`);
        expect(t).toContain(`(${tm.runoff} s)`);
      }
  });

  it('takes counts and thresholds from the engine', () => {
    const t = text({ all: ALL });
    expect(t).toContain(`Hasta ${MAX_TESTIMONIES} testimonios`.replace('Hasta', 'hasta'));
    expect(t).toContain(`las ${SLOT_COUNT} horas`);
    expect(t).toContain(`salen ${SLOT_COUNT - 1}`);
    const firstWithAccomplice = [4, 5, 6, 7, 8, 9, 10].find((n) => rolesFor(n).complices > 0);
    expect(t).toContain(`Solo con ${firstWithAccomplice} personas o más`);
  });

  it('never explains single-phone vs one-phone-each play', () => {
    const t = text({ all: ALL });
    expect(t).not.toMatch(/un solo móvil|un móvil por persona|pasad el móvil|servidor|wifi/i);
  });

  it('hides the declaring and voting timers when those turns are untimed', () => {
    const tm = timingsFor('normal', 6);
    const t = text({ pace: 'normal', players: 6, untimedTurns: true, all: ALL });
    expect(t).toContain('Declaración Elige'); // no time label between the title and the text
    expect(t).toContain('Votación secreta Si la persona');
    expect(t).not.toContain(`${tm.vote} s`);
    expect(t).not.toContain(`(${tm.runoff} s)`);
    expect(t).toContain(`Última defensa ${tm.defense} s`); // the defense is still timed
    expect(t).toContain(`Investigación ${mmss(tm.investigate1)} + ${mmss(tm.investigate2)}`);
  });

  it('opens on «La ronda» with the four sections as tabs', () => {
    const html = renderToStaticMarkup(createElement(QuickGuide, {}));
    expect(html.match(/role="tab"/g)).toHaveLength(4);
    expect(html).toContain('aria-selected="true" aria-controls="qg-panel-ronda"');
  });
});
