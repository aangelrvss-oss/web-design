import Phaser from 'phaser';
import { PAL } from '../art/palette';
import { ART_SCALE } from '../art/textures';
import type { GameCtx } from './ctx';
import type { Enemy } from './entities';

/**
 * Telegraphed enemy attacks. Every dangerous area is announced visually before it can
 * hurt: a warm outline appears immediately and a fill grows to the edge exactly when it
 * fires, so timing is readable at a glance.
 */
interface Circle {
  kind: 'circle';
  x: number;
  y: number;
  r: number;
  t: number;
  warn: number;
  dmg: number;
  owner: Enemy | null;
  ownerUid: number;
  cause: string;
}
interface Beam {
  kind: 'beam';
  x: number;
  y: number;
  angle: number;
  len: number;
  width: number;
  t: number;
  track: number; // seconds of tracking the player
  warn: number;
  active: number;
  dmg: number;
  hit: boolean;
  follow: { x: number; y: number } | null; // origin follows (boss)
}
interface Zone {
  kind: 'zone';
  x: number;
  y: number;
  r: number;
  img: Phaser.GameObjects.Image;
}

export class HazardSystem {
  private circles: Circle[] = [];
  private beams: Beam[] = [];
  readonly zones: Zone[] = [];
  private dashLines: number[] = []; // x,y,dx,dy,len,progress
  private readonly g: Phaser.GameObjects.Graphics;
  private time = 0;

  constructor(private readonly ctx: GameCtx) {
    this.g = ctx.sc.add.graphics().setDepth(3);
  }

  /** Ground slam from a heavy enemy; cancelled if the owner dies first. */
  slam(owner: Enemy, r: number, warn: number, dmg: number) {
    this.circles.push({ kind: 'circle', x: owner.x, y: owner.y, r, t: 0, warn, dmg, owner, ownerUid: owner.uid, cause: 'an Absolute Unit' });
  }

  bomb(x: number, y: number, r: number, warn: number, dmg: number, cause: string) {
    if (this.circles.length > 60) return;
    this.circles.push({ kind: 'circle', x, y, r, t: 0, warn, dmg, owner: null, ownerUid: 0, cause });
  }

  beam(x: number, y: number, angle: number, opts: { len?: number; width?: number; track?: number; warn?: number; active?: number; dmg: number; follow?: { x: number; y: number } }) {
    this.beams.push({
      kind: 'beam', x, y, angle, len: opts.len ?? 1800, width: opts.width ?? 34, t: 0,
      track: opts.track ?? 0.8, warn: opts.warn ?? 1.2, active: opts.active ?? 0.45, dmg: opts.dmg, hit: false, follow: opts.follow ?? null,
    });
  }

  /** Visual-only telegraph for a dasher's lane (drawn this frame only). */
  dashLine(x: number, y: number, dx: number, dy: number, len: number, progress: number) {
    this.dashLines.push(x, y, dx, dy, len, progress);
  }

  addZone(x: number, y: number, r: number): Zone {
    const img = this.ctx.sc.add.image(x, y, 'grasspatch').setDepth(2).setScale((r / 66) * ART_SCALE * 1.0);
    const z: Zone = { kind: 'zone', x, y, r, img };
    this.zones.push(z);
    return z;
  }

  clearZones() {
    for (const z of this.zones) z.img.destroy();
    this.zones.length = 0;
  }

  inZone(x: number, y: number): boolean {
    return this.zones.some((z) => (z.x - x) ** 2 + (z.y - y) ** 2 <= z.r * z.r);
  }

  update(dt: number) {
    this.time += dt;
    const p = this.ctx.player;
    for (let i = this.circles.length - 1; i >= 0; i--) {
      const c = this.circles[i];
      if (c.owner && (!c.owner.active || c.owner.uid !== c.ownerUid)) {
        this.circles.splice(i, 1);
        continue;
      }
      if (c.owner) {
        c.x = c.owner.x;
        c.y = c.owner.y;
      }
      c.t += dt;
      if (c.t >= c.warn) {
        this.circles.splice(i, 1);
        this.ctx.fx.ring(c.x, c.y, c.r * 0.3, c.r * 1.05, PAL.danger, 0.35);
        this.ctx.fx.burst(c.x, c.y, PAL.danger, 12);
        this.ctx.fx.shake(c.owner ? 6 : 3);
        this.ctx.sfx(c.owner ? 'slam' : 'explode');
        if (p.alive && (p.x - c.x) ** 2 + (p.y - c.y) ** 2 <= (c.r + p.r * 0.6) ** 2) this.ctx.hurtPlayer(c.dmg, c.x, c.y, c.cause);
      }
    }
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.t += dt;
      if (b.follow) {
        b.x = b.follow.x;
        b.y = b.follow.y;
      }
      if (b.t < b.track) {
        const want = Math.atan2(p.y - b.y, p.x - b.x);
        b.angle += Phaser.Math.Clamp(Phaser.Math.Angle.Wrap(want - b.angle), -2.2 * dt, 2.2 * dt);
      }
      if (b.t >= b.warn && !b.hit && p.alive) {
        // distance from player to the beam segment
        const dx = Math.cos(b.angle), dy = Math.sin(b.angle);
        const px = p.x - b.x, py = p.y - b.y;
        const along = px * dx + py * dy;
        const perp = Math.abs(px * dy - py * dx);
        if (along > 0 && along < b.len && perp < b.width / 2 + p.r * 0.5) {
          b.hit = true;
          this.ctx.hurtPlayer(b.dmg, p.x - dx * 10, p.y - dy * 10, 'a Shadowban Beam');
        }
      }
      if (b.t >= b.warn + b.active) this.beams.splice(i, 1);
    }
  }

  draw() {
    const g = this.g;
    g.clear();
    for (const c of this.circles) {
      const k = Math.min(1, c.t / c.warn);
      const blink = k > 0.75 && Math.floor(this.time * 18) % 2 === 0;
      g.fillStyle(PAL.danger, 0.08 + k * 0.1);
      g.fillCircle(c.x, c.y, c.r);
      g.fillStyle(blink ? 0xffe0a0 : PAL.dangerHot, 0.22 + k * 0.18);
      g.fillCircle(c.x, c.y, c.r * k);
      g.lineStyle(2.5, blink ? 0xffffff : PAL.danger, 0.9);
      g.strokeCircle(c.x, c.y, c.r);
    }
    for (const b of this.beams) {
      const dx = Math.cos(b.angle) * b.len, dy = Math.sin(b.angle) * b.len;
      if (b.t < b.warn) {
        const k = b.t / b.warn;
        const locked = b.t >= b.track;
        g.lineStyle(locked ? 3 : 1.5, locked ? 0xffe0a0 : PAL.danger, 0.35 + k * 0.5);
        g.lineBetween(b.x, b.y, b.x + dx, b.y + dy);
        g.lineStyle(b.width * k, PAL.dangerHot, 0.12);
        g.lineBetween(b.x, b.y, b.x + dx, b.y + dy);
      } else {
        const k = 1 - (b.t - b.warn) / b.active;
        g.lineStyle(b.width * 1.8, PAL.dangerHot, 0.35 * k);
        g.lineBetween(b.x, b.y, b.x + dx, b.y + dy);
        g.lineStyle(b.width, 0xff9a5a, 0.85 * k);
        g.lineBetween(b.x, b.y, b.x + dx, b.y + dy);
        g.lineStyle(b.width * 0.35, 0xffffff, k);
        g.lineBetween(b.x, b.y, b.x + dx, b.y + dy);
      }
    }
    const d = this.dashLines;
    for (let i = 0; i < d.length; i += 6) {
      const [x, y, dx, dy, len, k] = [d[i], d[i + 1], d[i + 2], d[i + 3], d[i + 4], d[i + 5]];
      g.lineStyle(10, PAL.danger, 0.1 + k * 0.15);
      g.lineBetween(x, y, x + dx * len, y + dy * len);
      g.lineStyle(2, 0xffe0a0, 0.3 + k * 0.6);
      g.lineBetween(x, y, x + dx * len * k, y + dy * len * k);
    }
    d.length = 0;
    for (const z of this.zones) z.img.setAlpha(0.75 + Math.sin(this.time * 6) * 0.2);
  }

  clearAll() {
    this.circles.length = 0;
    this.beams.length = 0;
    this.dashLines.length = 0;
    this.clearZones();
  }
}
