import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { ART_SCALE } from '../art/textures';
import { PAL } from '../art/palette';
import { TAU } from '../core/math';
import { WEAPON_IDS, weaponAt, type WeaponId } from '../data/weapons';
import type { GameCtx } from './ctx';
import { Puddle, type Enemy } from './entities';

/**
 * Fires every owned weapon and runs the weapon-side synergies:
 *  Ricochet Rizz (bolt bounces), Static Spin (spinner → zap), Electric Tea (zap → puddle),
 *  Burnout Trail (dash fire), Main Character Syndrome (golden bolts).
 */
export class WeaponSystem {
  private timers: Partial<Record<WeaponId, number>> = {};
  private blades: Phaser.GameObjects.Image[] = [];
  private orbitAngle = 0;
  readonly puddles: Puddle[] = [];
  private pendingBooms: Array<{ t: number; scale: number }> = [];
  private lastTrailX = 0;
  private lastTrailY = 0;

  constructor(private readonly ctx: GameCtx) {}

  private lvl(id: WeaponId) {
    return this.ctx.owned[id] ?? 0;
  }

  private rate() {
    return this.ctx.stats.fireRateMult * (this.ctx.overdrive ? BALANCE.overdrive.fireRateMult : 1);
  }

  update(dt: number) {
    for (const id of WEAPON_IDS) {
      const l = this.lvl(id);
      if (l <= 0 || id === 'orbit') continue;
      const p = weaponAt(id, l);
      const t = (this.timers[id] ?? 0.3) - dt * this.rate();
      if (t <= 0) {
        this.timers[id] = p.cooldown;
        this.fire(id, l);
      } else this.timers[id] = t;
    }
    this.updateOrbit(dt);
    this.updatePuddles(dt);
    for (let i = this.pendingBooms.length - 1; i >= 0; i--) {
      const b = this.pendingBooms[i];
      b.t -= dt;
      if (b.t <= 0) {
        this.pendingBooms.splice(i, 1);
        this.boomWave(this.lvl('boom'), b.scale);
      }
    }
    this.burnout();
  }

  private fire(id: WeaponId, l: number) {
    switch (id) {
      case 'cannon': return this.cannon(l);
      case 'boom': return this.boomWave(l, 1, true);
      case 'zap': return this.zap(l);
      case 'homing': return this.homing(l);
      case 'puddle': return this.spill(l);
    }
  }

  private cannon(l: number) {
    const ctx = this.ctx;
    const pl = ctx.player;
    const p = weaponAt('cannon', l);
    const st = ctx.stats;
    const count = p.count + st.extraProjectiles;
    const base = Math.atan2(pl.aimY, pl.aimX);
    const gold = ctx.has('maincharacter') && pl.hpFrac >= 0.999;
    const size = (gold ? 1.6 : 1) * Math.sqrt(st.areaMult);
    const bounces = ctx.has('ricochet') ? 2 : 0;
    const spread = 0.11;
    for (let i = 0; i < count; i++) {
      const a = base + (i - (count - 1) / 2) * spread;
      ctx.shots.bolt(pl.x + Math.cos(a) * 14, pl.y - 4 + Math.sin(a) * 14, a, p.speed * st.projSpeedMult, p.damage, p.pierce + st.pierce, bounces, gold, size);
    }
    ctx.fx.glow(pl.x + Math.cos(base) * 18, pl.y - 4 + Math.sin(base) * 18, gold ? PAL.gold : PAL.cyan, 1);
    ctx.sfx('shoot', gold ? 0.8 : 1);
  }

  boomWave(l: number, scale = 1, primary = false) {
    if (l <= 0) return;
    const ctx = this.ctx;
    const pl = ctx.player;
    const p = weaponAt('boom', l);
    const R = p.radius * ctx.stats.areaMult * scale;
    const list = ctx.enemies.active;
    for (const i of ctx.grid.query(pl.x, pl.y, R + 40)) {
      const e = list[i];
      if (!e || !e.active) continue;
      const dx = e.x - pl.x, dy = e.y - pl.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > R + e.r) continue;
      ctx.damageEnemy(e, p.damage * (scale < 1 ? 0.7 : 1), 'boom', { knock: 420, kx: dx / d, ky: dy / d, silent: true });
    }
    ctx.fx.ring(pl.x, pl.y, 20, R, PAL.violet, 0.42, 0.75);
    ctx.fx.ring(pl.x, pl.y, 10, R * 0.75, PAL.cyan, 0.3, 0.3);
    ctx.fx.shake(3);
    ctx.sfx('boom');
    if (primary && p.extra > 0) this.pendingBooms.push({ t: 0.28, scale: 1.25 });
  }

  /** Chain lightning. Exposed for Static Spin. */
  zapFrom(x: number, y: number, first: Enemy, hops: number, damage: number) {
    const ctx = this.ctx;
    const hitUids: number[] = [];
    let cur: Enemy | null = first;
    let fx = x, fy = y;
    const list = ctx.enemies.active;
    const hopR = 150 * ctx.stats.areaMult;
    for (let h = 0; h <= hops && cur; h++) {
      hitUids.push(cur.uid);
      ctx.fx.lightningBolt(fx, fy, cur.x, cur.y, PAL.cyan, 2.6);
      ctx.damageEnemy(cur, damage, 'zap', { knock: 40, silent: true });
      if (ctx.has('conductive') && cur.inPuddle && cur.inPuddle.active) this.shockPuddle(cur.inPuddle, cur, damage);
      fx = cur.x;
      fy = cur.y;
      let next: Enemy | null = null;
      let bd = hopR * hopR;
      for (const i of ctx.grid.query(fx, fy, hopR)) {
        const e = list[i];
        if (!e || !e.active || hitUids.includes(e.uid)) continue;
        const d = (e.x - fx) ** 2 + (e.y - fy) ** 2;
        if (d < bd) { bd = d; next = e; }
      }
      cur = next;
    }
  }

  private shockPuddle(pd: Puddle, src: Enemy, damage: number) {
    const ctx = this.ctx;
    const list = ctx.enemies.active;
    let n = 0;
    for (const i of ctx.grid.query(pd.x, pd.y, pd.r + 30)) {
      const e = list[i];
      if (!e || !e.active || e === src || n >= 12) continue;
      if ((e.x - pd.x) ** 2 + (e.y - pd.y) ** 2 > (pd.r + e.r) ** 2) continue;
      ctx.fx.lightningBolt(src.x, src.y, e.x, e.y, 0xffd27a, 1.8, 0.12);
      ctx.damageEnemy(e, damage * 0.6, 'conductive', { silent: true });
      n++;
    }
    if (n > 0) ctx.fx.ring(pd.x, pd.y, pd.r * 0.5, pd.r * 1.1, 0xffd27a, 0.25);
  }

  private zap(l: number) {
    const ctx = this.ctx;
    const pl = ctx.player;
    const p = weaponAt('zap', l);
    const range = p.radius * Math.sqrt(ctx.stats.areaMult);
    const list = ctx.enemies.active;
    const cands: Enemy[] = [];
    for (const i of ctx.grid.query(pl.x, pl.y, range)) {
      const e = list[i];
      if (e && e.active && (e.x - pl.x) ** 2 + (e.y - pl.y) ** 2 < range * range) cands.push(e);
    }
    if (cands.length === 0) {
      this.timers.zap = 0.15; // try again soon instead of wasting the cooldown
      return;
    }
    cands.sort((a, b) => (a.x - pl.x) ** 2 + (a.y - pl.y) ** 2 - ((b.x - pl.x) ** 2 + (b.y - pl.y) ** 2));
    for (let k = 0; k < Math.min(p.count, cands.length); k++) this.zapFrom(pl.x, pl.y - 8, cands[k], p.chains, p.damage);
    ctx.sfx('zap');
  }

  private homing(l: number) {
    const ctx = this.ctx;
    const pl = ctx.player;
    const p = weaponAt('homing', l);
    const n = p.count + ctx.stats.extraProjectiles;
    const back = Math.atan2(-pl.aimY, -pl.aimX);
    const list = ctx.enemies.active.filter((e) => e.active);
    for (let i = 0; i < n; i++) {
      const a = back + (i - (n - 1) / 2) * 0.5 + ctx.rng.range(-0.15, 0.15);
      const target = list.length ? list[ctx.rng.int(0, Math.min(list.length, 12) - 1)] : null;
      ctx.shots.missile(pl.x, pl.y - 6, a, p.damage, p.radius, p.speed * ctx.stats.projSpeedMult, target);
    }
    ctx.sfx('missile');
  }

  /** Ratio'd: called by the scene when a Reply Guys missile kills. */
  ratiod(x: number, y: number) {
    const ctx = this.ctx;
    const p = weaponAt('homing', Math.max(1, this.lvl('homing')));
    for (let i = 0; i < BALANCE.synergy.ratiodMinis; i++) {
      const a = (i / BALANCE.synergy.ratiodMinis) * TAU + ctx.rng.next();
      ctx.shots.missile(x, y, a, p.damage * 0.45, p.radius * 0.6, p.speed * 1.1, null, true);
    }
  }

  private spill(l: number) {
    const ctx = this.ctx;
    const pl = ctx.player;
    const p = weaponAt('puddle', l);
    const list = ctx.enemies.active;
    for (let k = 0; k < p.count; k++) {
      let tx = pl.x + ctx.rng.range(-180, 180), ty = pl.y + ctx.rng.range(-180, 180);
      const near = ctx.grid.query(pl.x, pl.y, 320);
      if (near.length) {
        const e = list[near[ctx.rng.int(0, near.length - 1)]];
        if (e && e.active) { tx = e.x; ty = e.y; }
      }
      this.addPuddle(tx, ty, p.radius * ctx.stats.areaMult, p.damage, p.duration * ctx.stats.durationMult, false);
      ctx.fx.shatter(tx, ty, 0xffb547, 5);
    }
  }

  private addPuddle(x: number, y: number, r: number, dps: number, life: number, fire: boolean) {
    let pd = this.puddles.find((q) => !q.active);
    if (!pd) {
      if (this.puddles.length >= 90) return;
      pd = new Puddle();
      pd.sprite = this.ctx.sc.add.image(0, 0, 'puddle').setDepth(2.5);
      this.puddles.push(pd);
    }
    pd.active = true;
    pd.x = x;
    pd.y = y;
    pd.r = r;
    pd.dps = dps;
    pd.life = pd.max = life;
    pd.tick = 0;
    pd.fire = fire;
    pd.sprite.setVisible(true).setPosition(x, y).setScale(0).setTint(fire ? PAL.magenta : 0xffffff)
      .setBlendMode(fire ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
  }

  private updatePuddles(dt: number) {
    const ctx = this.ctx;
    const list = ctx.enemies.active;
    for (const e of list) e.inPuddle = null;
    for (const pd of this.puddles) {
      if (!pd.active) continue;
      pd.life -= dt;
      if (pd.life <= 0) {
        pd.active = false;
        pd.sprite.setVisible(false);
        continue;
      }
      pd.tick -= dt;
      const doTick = pd.tick <= 0;
      if (doTick) pd.tick = 0.25;
      for (const i of ctx.grid.query(pd.x, pd.y, pd.r + 30)) {
        const e = list[i];
        if (!e || !e.active) continue;
        if ((e.x - pd.x) ** 2 + (e.y - pd.y) ** 2 > (pd.r + e.r * 0.5) ** 2) continue;
        if (!pd.fire) {
          e.slow = Math.min(e.slow, 0.6);
          e.inPuddle = pd;
        }
        if (doTick) ctx.damageEnemy(e, pd.dps * 0.25, pd.fire ? 'burnout' : 'puddle', { silent: true, knock: 0 });
      }
    }
  }

  private syncPuddles() {
    for (const pd of this.puddles) {
      if (!pd.active) continue;
      const age = pd.max - pd.life;
      const grow = Math.min(1, age / 0.18);
      const fade = Math.min(1, pd.life / 0.4);
      // texture radius is 64 logical px → 128 texture px at RES 2
      pd.sprite.setScale((pd.r / 64) * ART_SCALE * grow * (1 + Math.sin(age * 6) * 0.03)).setAlpha(fade * (pd.fire ? 0.8 : 0.9));
    }
  }

  private burnout() {
    const ctx = this.ctx;
    const pl = ctx.player;
    if (!ctx.has('burnout') || !pl.dashing) {
      this.lastTrailX = pl.x;
      this.lastTrailY = pl.y;
      return;
    }
    if ((pl.x - this.lastTrailX) ** 2 + (pl.y - this.lastTrailY) ** 2 > 22 * 22) {
      this.lastTrailX = pl.x;
      this.lastTrailY = pl.y;
      this.addPuddle(pl.x, pl.y, 30 * ctx.stats.areaMult, BALANCE.synergy.burnoutDps, BALANCE.synergy.burnoutLife, true);
    }
  }

  private updateOrbit(dt: number) {
    const ctx = this.ctx;
    const l = this.lvl('orbit');
    const pl = ctx.player;
    const p = l > 0 ? weaponAt('orbit', l) : null;
    const n = p ? p.count : 0;
    while (this.blades.length < n) {
      this.blades.push(ctx.sc.add.image(pl.x, pl.y, 'blade').setScale(ART_SCALE).setDepth(31));
    }
    for (let i = 0; i < this.blades.length; i++) this.blades[i].setVisible(i < n);
    if (!p) return;
    this.orbitAngle += p.speed * dt * (ctx.overdrive ? 1.4 : 1);
    const R = p.radius * ctx.stats.areaMult;
    const hitR = 15 * Math.sqrt(ctx.stats.areaMult);
    const list = ctx.enemies.active;
    for (let i = 0; i < n; i++) {
      const a = this.orbitAngle + (i / n) * TAU;
      const bx = pl.x + Math.cos(a) * R, by = pl.y + Math.sin(a) * R;
      const b = this.blades[i];
      b.setPosition(bx, by).setRotation(this.orbitAngle * 3).setScale(ART_SCALE * Math.sqrt(ctx.stats.areaMult));
      for (const k of ctx.grid.query(bx, by, hitR + 40)) {
        const e = list[k];
        if (!e || !e.active || e.orbitCd > 0) continue;
        if ((e.x - bx) ** 2 + (e.y - by) ** 2 > (hitR + e.r) ** 2) continue;
        e.orbitCd = p.cooldown;
        const dx = e.x - pl.x, dy = e.y - pl.y;
        const d = Math.hypot(dx, dy) || 1;
        ctx.damageEnemy(e, p.damage, 'orbit', { knock: 160, kx: dx / d, ky: dy / d });
        ctx.fx.burst(bx, by, PAL.cyan, 2);
        if (ctx.has('static') && e.active && ctx.rng.chance(BALANCE.synergy.staticChance)) {
          const z = weaponAt('zap', Math.max(1, this.lvl('zap')));
          this.zapFrom(bx, by, e, z.chains, z.damage * 0.8);
          ctx.sfx('zap');
        }
      }
    }
  }

  sync() {
    this.syncPuddles();
  }

  /** Cooldown fraction for HUD weapon icons (0 = ready). */
  cooldownFrac(id: WeaponId): number {
    const l = this.lvl(id);
    if (l <= 0 || id === 'orbit') return 0;
    return Math.max(0, Math.min(1, (this.timers[id] ?? 0) / weaponAt(id, l).cooldown));
  }

  clearAll() {
    for (const b of this.blades) b.destroy();
    this.blades.length = 0;
    for (const pd of this.puddles) pd.sprite.destroy();
    this.puddles.length = 0;
    this.pendingBooms.length = 0;
  }
}
