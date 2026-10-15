import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { ART_SCALE } from '../art/textures';
import { PAL } from '../art/palette';
import { clamp, TAU } from '../core/math';
import { ELITE, ENEMIES, type EnemyDef, type EnemyId } from '../data/enemies';
import type { Formation } from '../logic/waves';
import type { GameCtx } from './ctx';
import { Enemy, type CopyFamily } from './entities';

let nextUid = 1;

/**
 * Owns every enemy: pooled sprites, per-archetype behaviour, separation and population
 * bookkeeping. Killing is decided by GameScene (score, drops, synergies).
 */
export class EnemySystem {
  readonly active: Enemy[] = [];
  private free: Enemy[] = [];
  private dead: Enemy[] = [];
  hpMult = 1;
  dmgMult = 1;
  speedMult = 1;

  constructor(private readonly ctx: GameCtx) {}

  get count() {
    return this.active.length;
  }

  /** Regular enemies only (boss parts don't count toward population). */
  get population() {
    let n = 0;
    for (const e of this.active) if (e.active && !e.boss) n++;
    return n;
  }

  private obtain(): Enemy {
    const e = this.free.pop() ?? this.create();
    e.active = true;
    e.uid = nextUid++;
    return e;
  }

  private create(): Enemy {
    const e = new Enemy();
    const s = this.ctx.sc;
    e.shadow = s.add.image(0, 0, 'shadow').setDepth(4.5);
    e.sprite = s.add.image(0, 0, 'e_smoothbrain', 0).setOrigin(0.5, 0.7);
    return e;
  }

  spawn(id: EnemyId, x: number, y: number, opts: { elite?: boolean; hpScale?: number; scale?: number; boss?: Enemy['boss']; texture?: string; radius?: number } = {}): Enemy {
    const def: EnemyDef = ENEMIES[id];
    const e = this.obtain();
    const elite = !!opts.elite && !opts.boss;
    e.def = def;
    e.x = x;
    e.y = y;
    e.kvx = e.kvy = 0;
    e.elite = elite;
    e.scale = (opts.scale ?? 1) * (elite && id !== 'copypasta' ? ELITE.radiusMult : 1);
    e.r = opts.radius ?? def.radius * e.scale;
    e.maxHp = e.hp = Math.max(1, def.hp * this.hpMult * (opts.hpScale ?? 1) * (elite && id !== 'copypasta' ? ELITE.hpMult : 1));
    e.speed = def.speed * (elite ? ELITE.speedMult : 1);
    e.damage = def.damage * this.dmgMult * (elite ? ELITE.damageMult : 1);
    e.t = Math.random() * 10;
    e.state = 0;
    e.stateT = 0;
    e.cd = 1 + Math.random() * 1.5;
    e.slow = 1;
    e.flash = 0;
    e.orbitCd = 0;
    e.spawnT = opts.boss ? 0 : 0.35;
    e.boss = opts.boss ?? null;
    e.contactMult = 1;
    e.family = null;
    e.original = false;
    e.inPuddle = null;
    e.lastSource = '';
    e.sprite.setTexture(opts.texture ?? def.texture, 0).setVisible(true).setAlpha(1).clearTint().setRotation(0).setFlipX(false);
    e.sprite.setScale(ART_SCALE * e.scale);
    e.sprite.setOrigin(0.5, opts.boss ? 0.5 : 0.7);
    e.shadow.setVisible(!opts.boss || id !== 'smoothbrain').setScale(ART_SCALE * (e.r / 15) * 1.2);
    if (elite) {
      e.crown ??= this.ctx.sc.add.image(0, 0, 'crown').setScale(ART_SCALE);
      e.crown.setVisible(true);
      e.aura ??= this.ctx.sc.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(PAL.gold);
      e.aura.setVisible(true).setScale((e.r / 32) * 2.6).setAlpha(0.45).setDepth(4.6);
    } else {
      e.crown?.setVisible(false);
      e.aura?.setVisible(false);
    }
    this.active.push(e);
    return e;
  }

  /**
   * Remove without rewards. Removal from `active` is deferred to `flush()` so grid indices
   * stay valid for the rest of the simulation step; always check `e.active` in loops.
   */
  despawn(e: Enemy) {
    if (!e.active) return;
    e.active = false;
    e.sprite.setVisible(false);
    e.shadow.setVisible(false);
    e.crown?.setVisible(false);
    e.aura?.setVisible(false);
    this.dead.push(e);
  }

  flush() {
    if (this.dead.length === 0) return;
    let w = 0;
    for (let r = 0; r < this.active.length; r++) {
      const e = this.active[r];
      if (e.active) this.active[w++] = e;
    }
    this.active.length = w;
    for (const e of this.dead) this.free.push(e);
    this.dead.length = 0;
  }

  /** Spawn a director group at a fair off-screen position. */
  spawnGroup(id: EnemyId, count: number, elite: boolean, formation: Formation): Enemy[] {
    const out: Enemy[] = [];
    const p = this.ctx.player;
    const rng = this.ctx.rng;
    const R = this.ctx.viewRadius() + BALANCE.spawns.minSpawnDist;
    if (formation === 'ring') {
      const gap = rng.range(0, TAU);
      const rr = Math.min(R, 560);
      for (let i = 0; i < count; i++) {
        const a = gap + 0.5 + (i / count) * (TAU - 1); // leave an escape gap
        const pos = this.clampSpawn(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
        out.push(this.spawn(id, pos.x, pos.y));
      }
      return out;
    }
    if (formation === 'line') {
      const a = rng.range(0, TAU);
      const cx = p.x + Math.cos(a) * R, cy = p.y + Math.sin(a) * R;
      const nx = -Math.sin(a), ny = Math.cos(a);
      for (let i = 0; i < count; i++) {
        const o = (i - (count - 1) / 2) * 46;
        const pos = this.clampSpawn(cx + nx * o, cy + ny * o);
        const e = this.spawn(id, pos.x, pos.y);
        e.cd = 0.4 + i * 0.05; // rush: dash almost immediately
        out.push(e);
      }
      return out;
    }
    const base = this.findSpawnPoint(R);
    for (let i = 0; i < count; i++) {
      const pos = this.clampSpawn(base.x + rng.range(-40, 40), base.y + rng.range(-40, 40));
      const e = this.spawn(id, pos.x, pos.y, { elite });
      if (id === 'copypasta') this.makeFamily(e);
      out.push(e);
    }
    return out;
  }

  private clampSpawn(x: number, y: number) {
    const A = BALANCE.arena;
    return { x: clamp(x, 40, A.width - 40), y: clamp(y, 40, A.height - 40) };
  }

  /** A point at distance ≥ R from the player inside the arena. Never on top of the player. */
  findSpawnPoint(R: number): { x: number; y: number } {
    const p = this.ctx.player;
    const rng = this.ctx.rng;
    for (let tries = 0; tries < 10; tries++) {
      const a = rng.range(0, TAU);
      const d = R + rng.range(0, 90);
      const pos = this.clampSpawn(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
      if (Math.hypot(pos.x - p.x, pos.y - p.y) >= R * 0.85) return pos;
    }
    // fallback: farthest arena corner region
    const A = BALANCE.arena;
    return { x: p.x < A.width / 2 ? A.width - 80 : 80, y: p.y < A.height / 2 ? A.height - 80 : 80 };
  }

  private makeFamily(e: Enemy) {
    const fam: CopyFamily = { members: [e], alive: true };
    e.family = fam;
    e.original = true;
    e.cd = 2.2;
  }

  update(dt: number) {
    const ctx = this.ctx;
    const p = ctx.player;
    const spdMul = this.speedMult * ctx.stats.enemySpeedMult;
    const A = BALANCE.arena;
    for (let i = 0; i < this.active.length; i++) {
      const e = this.active[i];
      if (!e.active) continue;
      e.t += dt;
      e.flash = Math.max(0, e.flash - dt);
      e.orbitCd = Math.max(0, e.orbitCd - dt);
      e.spawnT = Math.max(0, e.spawnT - dt);
      if (e.boss) continue; // bosses drive their parts
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d;
      const sp = e.speed * spdMul * e.slow;
      let mx = 0, my = 0;
      switch (e.def.behavior) {
        case 'chase':
        case 'splitter':
          mx = ux * sp;
          my = uy * sp;
          break;
        case 'copier':
          mx = ux * sp;
          my = uy * sp;
          if (e.original && e.family && e.family.alive) {
            e.cd -= dt;
            if (e.cd <= 0) {
              e.cd = 3.4;
              if (e.family.members.length < 7 && this.population < this.ctx.enemies.capFor()) this.copy(e);
            }
          }
          break;
        case 'dasher':
          ({ mx, my } = this.dasher(e, dt, ux, uy, d, sp));
          break;
        case 'ranged':
          ({ mx, my } = this.ranged(e, dt, ux, uy, d, sp));
          break;
        case 'heavy':
          ({ mx, my } = this.heavy(e, dt, ux, uy, d, sp));
          break;
      }
      e.slow = 1;
      e.kvx *= Math.exp(-dt * 7);
      e.kvy *= Math.exp(-dt * 7);
      e.x = clamp(e.x + (mx + e.kvx) * dt, e.r, A.width - e.r);
      e.y = clamp(e.y + (my + e.kvy) * dt, e.r, A.height - e.r);
      if (Math.abs(mx) > 1) e.sprite.setFlipX(mx < 0);
    }
  }

  private copy(src: Enemy) {
    const a = this.ctx.rng.range(0, TAU);
    const c = this.spawn('copypasta', src.x + Math.cos(a) * 46, src.y + Math.sin(a) * 46, { hpScale: 0.4, scale: 0.82 });
    c.family = src.family;
    c.original = false;
    src.family!.members.push(c);
    this.ctx.fx.ring(c.x, c.y, 6, 40, PAL.cyan, 0.3);
    this.ctx.fx.burst(c.x, c.y, PAL.cyan, 6);
  }

  private dasher(e: Enemy, dt: number, ux: number, uy: number, d: number, sp: number) {
    // 0 approach → 1 crouch/telegraph → 2 dash → 3 recover
    e.stateT += dt;
    if (e.state === 0) {
      e.cd -= dt;
      if (e.cd <= 0 && d < 430) {
        e.state = 1;
        e.stateT = 0;
        e.dirX = ux;
        e.dirY = uy;
      }
      return { mx: ux * sp, my: uy * sp };
    }
    if (e.state === 1) {
      const wind = e.elite ? 0.4 : 0.5;
      // track during the first half of the telegraph, then lock
      if (e.stateT < wind * 0.5) {
        e.dirX = ux;
        e.dirY = uy;
      }
      this.ctx.hazards.dashLine(e.x, e.y, e.dirX, e.dirY, e.elite ? 260 : 190, e.stateT / wind);
      if (e.stateT >= wind) {
        e.state = 2;
        e.stateT = 0;
        e.contactMult = 1.2;
      }
      return { mx: -e.dirX * 20, my: -e.dirY * 20 };
    }
    if (e.state === 2) {
      const dashSp = (e.elite ? 640 : 560) * this.speedMult;
      if (Math.random() < 0.6) this.ctx.fx.trailAt(e.x, e.y, 0xc8ff3d);
      if (e.stateT >= (e.elite ? 0.42 : 0.32)) {
        e.state = 3;
        e.stateT = 0;
        e.contactMult = 1;
      }
      return { mx: e.dirX * dashSp, my: e.dirY * dashSp };
    }
    if (e.stateT >= 0.55) {
      e.state = 0;
      e.stateT = 0;
      e.cd = 1.4 + Math.random() * 1.2;
    }
    return { mx: ux * sp * 0.3, my: uy * sp * 0.3 };
  }

  private ranged(e: Enemy, dt: number, ux: number, uy: number, d: number, sp: number) {
    let mx: number, my: number;
    if (d > 350) { mx = ux * sp; my = uy * sp; }
    else if (d < 230) { mx = -ux * sp; my = -uy * sp; }
    else {
      const side = (e.uid & 1) ? 1 : -1; // strafe
      mx = -uy * sp * 0.6 * side;
      my = ux * sp * 0.6 * side;
    }
    if (e.state === 0) {
      e.cd -= dt;
      if (e.cd <= 0 && d < 520) {
        e.state = 1;
        e.stateT = 0;
      }
    } else {
      e.stateT += dt;
      mx *= 0.2;
      my *= 0.2;
      if (e.stateT >= 0.6) {
        e.state = 0;
        e.cd = e.elite ? 1.9 : 2.8;
        const spd = 215;
        const n = e.elite ? 3 : 1;
        for (let i = 0; i < n; i++) {
          const a = Math.atan2(uy, ux) + (i - (n - 1) / 2) * 0.28;
          this.ctx.shots.enemyShot(e.x, e.y - 6, Math.cos(a) * spd, Math.sin(a) * spd, e.def.damage * this.dmgMult * (e.elite ? 1.2 : 1));
        }
        this.ctx.sfx('enemyShot');
      }
    }
    return { mx, my };
  }

  private heavy(e: Enemy, dt: number, ux: number, uy: number, d: number, sp: number) {
    const R = e.elite ? 165 : 125;
    if (e.state === 0) {
      e.cd -= dt;
      if (e.cd <= 0 && d < R + 40) {
        e.state = 1;
        e.stateT = 0;
        this.ctx.hazards.slam(e, R, e.elite ? 0.85 : 1.0, e.damage * 1.3);
        this.ctx.sfx('telegraph');
      }
      return { mx: ux * sp, my: uy * sp };
    }
    e.stateT += dt;
    if (e.stateT > (e.elite ? 0.85 : 1.0) + 0.35) {
      e.state = 0;
      e.cd = 2.4;
    }
    return { mx: 0, my: 0 };
  }

  /** Soft separation so crowds don't collapse into one blob. Uses the shared grid. */
  separate() {
    const grid = this.ctx.grid;
    const list = this.active;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a.active || a.boss) continue;
      const near = grid.query(a.x, a.y, a.r + 34);
      let n = 0;
      for (let k = 0; k < near.length && n < 6; k++) {
        const j = near[k];
        if (j <= i) continue;
        const b = list[j];
        if (!b || !b.active || b.boss) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 < 0.0001) continue;
        const d = Math.sqrt(d2);
        const push = (min - d) * 0.5;
        const nx = dx / d, ny = dy / d;
        const wa = 1 - a.def.mass * 0.7, wb = 1 - b.def.mass * 0.7;
        a.x -= nx * push * wa;
        a.y -= ny * push * wa;
        b.x += nx * push * wb;
        b.y += ny * push * wb;
        n++;
      }
    }
  }

  rebuildGrid() {
    const g = this.ctx.grid;
    g.clear();
    for (let i = 0; i < this.active.length; i++) g.insert(i, this.active[i].x, this.active[i].y);
  }

  /** Population cap for the current visual tier. */
  capFor() {
    return this.ctx.settings.intensity === 'low' ? BALANCE.spawns.hardCapLow : BALANCE.spawns.hardCap;
  }

  sync() {
    for (const e of this.active) {
      if (!e.active) continue;
      const s = e.sprite;
      if (e.boss) {
        s.setPosition(e.x, e.y).setDepth(10 + e.y * 0.001);
        if (e.flash > 0) s.setTintFill(0xffffff);
        else s.clearTint();
        continue;
      }
      const moving = e.def.behavior !== 'heavy' || e.state === 0;
      const hop = moving ? Math.abs(Math.sin(e.t * 9)) * 2.2 * e.scale : 0;
      const spawnK = e.spawnT > 0 ? 1 - e.spawnT / 0.35 : 1;
      let frame = Math.floor(e.t * 6) % 2;
      let sx = 1, sy = 1;
      switch (e.def.behavior) {
        case 'ranged':
          frame = e.state === 1 ? 2 : Math.floor(e.t * 8) % 2;
          sy = 1 + Math.sin(e.t * 7) * 0.05;
          break;
        case 'heavy':
          frame = e.state === 1 && e.stateT < 1 ? 1 : 0;
          if (e.state === 1) { sx = 1 + e.stateT * 0.12; sy = 1 - e.stateT * 0.08; }
          break;
        case 'dasher':
          if (e.state === 1) { sx = 1.15; sy = 0.82; frame = 0; }
          if (e.state === 2) { sx = 1.25; sy = 0.85; }
          break;
        default:
          sy = 1 + Math.sin(e.t * 9) * 0.05;
          sx = 2 - sy;
      }
      s.setFrame(frame);
      const k = ART_SCALE * e.scale * spawnK;
      s.setScale(k * sx, k * sy);
      s.setPosition(e.x, e.y + 4 * e.scale - hop);
      s.setDepth(10 + e.y * 0.001);
      s.setAlpha(spawnK);
      const telegraphFlash = (e.def.behavior === 'dasher' && e.state === 1) || (e.def.behavior === 'ranged' && e.state === 1 && e.stateT > 0.35);
      if (e.flash > 0) s.setTintFill(0xffffff);
      else if (telegraphFlash && Math.floor(e.t * 20) % 2 === 0) s.setTintFill(0xffe0a0);
      else s.clearTint();
      e.shadow.setPosition(e.x, e.y + e.r * 0.55);
      if (e.crown) {
        e.crown.setPosition(e.x, e.y - e.r * 1.25 - hop - Math.sin(e.t * 3) * 2).setDepth(s.depth + 0.0005);
      }
      if (e.aura) e.aura.setPosition(e.x, e.y).setAlpha(0.35 + Math.sin(e.t * 5) * 0.12);
    }
  }

  clearAll() {
    for (const e of this.active) this.despawn(e);
    this.flush();
  }
}
