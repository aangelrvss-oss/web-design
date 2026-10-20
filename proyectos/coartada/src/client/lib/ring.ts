// Where the evidence loop goes inside a board cell: around exactly the pins of the people who
// say they were at that place and hour, with a small margin, and never outside the cell (so it
// can never take in somebody from a neighbouring cell). Pure geometry, measured by the board.

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Space between the pins and the drawn line. */
export const RING_PAD = 5;

export function ringBox(pins: Box[], cell: { width: number; height: number }, pad = RING_PAD): Box {
  if (pins.length === 0) {
    // Nobody claims to have been there: a small loop in the middle of the empty cell.
    const width = Math.max(0, Math.min(cell.width - 8, 44));
    const height = Math.max(0, Math.min(cell.height - 8, 34));
    return { left: (cell.width - width) / 2, top: (cell.height - height) / 2, width, height };
  }
  const left = Math.max(1, Math.min(...pins.map((p) => p.left)) - pad);
  const top = Math.max(1, Math.min(...pins.map((p) => p.top)) - pad);
  const right = Math.min(cell.width - 1, Math.max(...pins.map((p) => p.left + p.width)) + pad);
  const bottom = Math.min(cell.height - 1, Math.max(...pins.map((p) => p.top + p.height)) + pad);
  return { left, top, width: right - left, height: bottom - top };
}
