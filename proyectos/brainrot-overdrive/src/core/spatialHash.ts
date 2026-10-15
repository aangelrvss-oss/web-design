/** Uniform grid over the bounded arena. Rebuilt every simulation step; queries return
 *  candidate indices whose cells overlap the query circle. Allocation-free after warmup. */
export class SpatialGrid {
  private cells: number[][];
  private readonly cols: number;
  private readonly rows: number;
  private readonly used: number[] = [];
  readonly result: number[] = [];

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly cell: number,
  ) {
    this.cols = Math.ceil(width / cell) + 1;
    this.rows = Math.ceil(height / cell) + 1;
    this.cells = Array.from({ length: this.cols * this.rows }, () => []);
  }

  clear(): void {
    for (const c of this.used) this.cells[c].length = 0;
    this.used.length = 0;
  }

  private key(x: number, y: number): number {
    const cx = Math.min(this.cols - 1, Math.max(0, Math.floor(x / this.cell)));
    const cy = Math.min(this.rows - 1, Math.max(0, Math.floor(y / this.cell)));
    return cy * this.cols + cx;
  }

  insert(index: number, x: number, y: number): void {
    const k = this.key(x, y);
    const c = this.cells[k];
    if (c.length === 0) this.used.push(k);
    c.push(index);
  }

  /** Fills and returns `this.result` (reused array — copy if you need to keep it). */
  query(x: number, y: number, r: number): number[] {
    const out = this.result;
    out.length = 0;
    const x0 = Math.max(0, Math.floor((x - r) / this.cell));
    const x1 = Math.min(this.cols - 1, Math.floor((x + r) / this.cell));
    const y0 = Math.max(0, Math.floor((y - r) / this.cell));
    const y1 = Math.min(this.rows - 1, Math.floor((y + r) / this.cell));
    for (let cy = y0; cy <= y1; cy++) {
      const row = cy * this.cols;
      for (let cx = x0; cx <= x1; cx++) {
        const c = this.cells[row + cx];
        for (let i = 0; i < c.length; i++) out.push(c[i]);
      }
    }
    return out;
  }

  get size(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}
