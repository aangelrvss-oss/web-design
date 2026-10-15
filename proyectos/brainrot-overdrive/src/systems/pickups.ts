import { BALANCE } from '../config/balance';
import { ART_SCALE } from '../art/textures';
import type { GameCtx } from './ctx';
import { Pickup, type PickupKind } from './entities';

export type CollectFn = (kind: PickupKind, value: number, x: number, y: number) => void;

/** XP gems and items. Gems merge past the cap so the field stays readable and cheap. */
export class PickupSystem {
  readonly list: Pickup[] = [];
  private free: Pickup[] = [];
  private gems = 0;

  constructor(private readonly ctx: GameCtx, private readonly onCollect: CollectFn) {}

  private make(kind: PickupKind, x: number, y: number): Pickup {
    let p = this.free.pop();
    if (!p) {
      p = new Pickup();
      p.sprite = this.ctx.sc.add.image(0, 0, 'gem', 0).setDepth(6);
    }
    p.active = true;
    p.kind = kind;
    p.x = x;
    p.y = y;
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 70;
    p.vx = Math.cos(a) * sp;
    p.vy = Math.sin(a) * sp;
    p.magnet = false;
    p.t = Math.random() * 6;
    p.sprite.setVisible(true).setAlpha(1);
    this.list.push(p);
    return p;
  }

  static gemFrame(value: number) {
    return value >= 20 ? 2 : value >= 5 ? 1 : 0;
  }

  gem(x: number, y: number, value: number) {
    const X = BALANCE.xp;
    if (this.gems >= X.gemCap) {
      // merge into the nearest gem instead of adding another sprite
      let best: Pickup | null = null;
      let bd = Infinity;
      for (const p of this.list) {
        if (!p.active || p.kind !== 'gem') continue;
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bd) { bd = d; best = p; }
      }
      if (best) {
        best.value += value;
        best.sprite.setFrame(PickupSystem.gemFrame(best.value));
        return;
      }
    }
    const p = this.make('gem', x, y);
    p.value = value;
    p.sprite.setTexture('gem', PickupSystem.gemFrame(value)).setScale(ART_SCALE * (value >= 20 ? 1.3 : 1));
    this.gems++;
  }

  item(kind: Exclude<PickupKind, 'gem'>, x: number, y: number) {
    const p = this.make(kind, x, y);
    p.value = 1;
    const tex = kind === 'grass' ? 'grass' : kind === 'router' ? 'router' : 'crate';
    p.sprite.setTexture(tex, 0).setScale(ART_SCALE * (kind === 'crate' ? 1.2 : 1));
    p.vx *= 0.4;
    p.vy *= 0.4;
  }

  /** Router pickup / boss death: every gem flies to the player. */
  vacuum() {
    for (const p of this.list) if (p.active && p.kind === 'gem') p.magnet = true;
  }

  update(dt: number) {
    const pl = this.ctx.player;
    const R = this.ctx.stats.pickupRadius;
    for (const p of this.list) {
      if (!p.active) continue;
      p.t += dt;
      const dx = pl.x - p.x, dy = pl.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const reach = p.kind === 'gem' ? R : p.kind === 'crate' ? 40 : R * 0.6;
      if (!p.magnet && d < reach && pl.alive) p.magnet = true;
      if (p.magnet) {
        const sp = 260 + (1 / Math.max(0.2, d / 300)) * 180 + p.t * 40;
        p.vx += ((dx / d) * sp - p.vx) * Math.min(1, dt * 9);
        p.vy += ((dy / d) * sp - p.vy) * Math.min(1, dt * 9);
      } else {
        p.vx *= Math.exp(-dt * 5);
        p.vy *= Math.exp(-dt * 5);
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (d < pl.r + 10 && pl.alive) {
        p.active = false;
        p.sprite.setVisible(false);
        if (p.kind === 'gem') this.gems--;
        this.onCollect(p.kind, p.value, p.x, p.y);
      }
    }
    let w = 0;
    for (let r = 0; r < this.list.length; r++) {
      const p = this.list[r];
      if (p.active) this.list[w++] = p;
      else this.free.push(p);
    }
    this.list.length = w;
  }

  sync() {
    for (const p of this.list) {
      const bob = Math.sin(p.t * 4) * 2;
      p.sprite.setPosition(p.x, p.y + bob);
      if (p.kind === 'crate') p.sprite.setFrame(Math.floor(p.t * 3) % 2);
    }
  }

  clearAll() {
    for (const p of this.list) {
      p.active = false;
      p.sprite.setVisible(false);
      this.free.push(p);
    }
    this.list.length = 0;
    this.gems = 0;
  }
}
