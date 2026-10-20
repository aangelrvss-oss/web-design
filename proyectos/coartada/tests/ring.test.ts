// The evidence loop must hug exactly the pins of its cell: small for two, bigger for five,
// never past the cell's edges (where the neighbours' pins are).
import { describe, expect, it } from 'vitest';
import { RING_PAD, ringBox, type Box } from '../src/client/lib/ring';

const PIN = 26;
const GAP = 3;
// Pins laid out like the board does: centred rows of `perRow` in a cell `width` wide.
function layout(n: number, width: number, perRow: number, top = 14): Box[] {
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const rowWidth = inRow * PIN + (inRow - 1) * GAP;
    const col = i % perRow;
    return { left: (width - rowWidth) / 2 + col * (PIN + GAP), top: top + row * (PIN + GAP), width: PIN, height: PIN };
  });
}
const right = (b: Box) => b.left + b.width;
const bottom = (b: Box) => b.top + b.height;
const encloses = (r: Box, p: Box) => p.left >= r.left && p.top >= r.top && right(p) <= right(r) && bottom(p) <= bottom(r);

describe('evidence loop', () => {
  const cell = { width: 88, height: 120 };

  it('fits two pins snugly and grows for five', () => {
    const two = ringBox(layout(2, cell.width, 2), cell);
    const five = ringBox(layout(5, cell.width, 2), cell);
    expect(two.width).toBe(2 * PIN + GAP + 2 * RING_PAD);
    expect(two.height).toBe(PIN + 2 * RING_PAD);
    expect(five.height).toBe(3 * PIN + 2 * GAP + 2 * RING_PAD);
    expect(five.width * five.height).toBeGreaterThan(2.5 * two.width * two.height);
  });

  it('encloses every pin of the group, for 1 to 6 people, in narrow and wide cells', () => {
    for (const [width, perRow] of [
      [57, 1],
      [65, 2],
      [88, 2],
      [120, 3],
    ] as const)
      for (let n = 1; n <= 6; n++) {
        const c = { width, height: 14 + Math.ceil(n / perRow) * (PIN + GAP) + 6 };
        const pins = layout(n, width, perRow);
        const r = ringBox(pins, c);
        for (const p of pins) expect(encloses(r, p)).toBe(true);
        // Never outside its own cell, so nobody from another cell can end up inside.
        expect(r.left).toBeGreaterThanOrEqual(1);
        expect(r.top).toBeGreaterThanOrEqual(1);
        expect(right(r)).toBeLessThanOrEqual(c.width - 1);
        expect(bottom(r)).toBeLessThanOrEqual(c.height - 1);
      }
  });

  it('follows the real distribution, not the cell: one pin in a corner gets a small loop there', () => {
    const r = ringBox([{ left: 50, top: 60, width: PIN, height: PIN }], cell);
    expect(r).toEqual({ left: 45, top: 55, width: PIN + 2 * RING_PAD, height: PIN + 2 * RING_PAD });
  });

  it('marks an empty cell with a small loop in its middle', () => {
    const r = ringBox([], cell);
    expect(r.width).toBeLessThan(cell.width);
    expect(r.left + r.width / 2).toBe(cell.width / 2);
    expect(r.top + r.height / 2).toBe(cell.height / 2);
  });
});
