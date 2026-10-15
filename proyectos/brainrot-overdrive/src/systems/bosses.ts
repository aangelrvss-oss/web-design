import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { ART_SCALE } from '../art/textures';
import { PAL } from '../art/palette';
import { clamp, TAU } from '../core/math';
import { BOSSES, type BossId } from '../data/enemies';
import { LINES } from '../data/text';
import type { GameCtx } from './ctx';
import type { BossLike, Enemy } from './entities';

export interface BossHooks {
  onDefeated(id: BossId, x: number, y: number): void;
  onPhase(id: BossId, phase: number): void;
  caption(text: string): void;
}

const MIN_PHASE_SECONDS = 9;

abstract class Boss implements BossLike {
  abstract readonly id: BossId;
  hp: number;
  maxHp: number;
  parts: Enemy[] = [];
  dying = false;
  done = false;
  phase = 1;
  protected t = 0;
  /** Seconds since the current phase began. */
  protected phaseAge = 0;
  /** HP fractions that end each phase (phase n ends at gates[n-1]). */
  protected abstract readonly gates: readonly number[];
  protected state = 'enter';
  protected stateT = 0;
  protected step = 0;

  constructor(protected readonly ctx: GameCtx, protected readonly hooks: BossHooks, hp: number) {
    this.hp = this.maxHp = hp;
  }

  onPartHit(_part: Enemy, amount: number) {
    if (this.dying) return;
    // brief shield while a new phase is introduced
    if (this.phase > 1 && this.phaseAge < 1) return;
    // phase lock: a phase can't be skipped before it has had time to show its patterns
    const gate = this.gates[this.phase - 1];
    const floor = gate !== undefined && this.phaseAge < MIN_PHASE_SECONDS ? gate * this.maxHp + 1 : 0;
    this.hp = Math.max(floor, this.hp - amount);
    if (this.hp <= 0) {
      this.hp = 0;
      this.beginDeath();
    }
  }

  protected to(state: string) {
    this.state = state;
    this.stateT = 0;
    this.step = 0;
  }

  get head(): Enemy {
    return this.parts[0];
  }

  abstract update(dt: number): void;
  abstract beginDeath(): void;
  sync(_time: number) {}
  destroy() {
    for (const p of this.parts) this.ctx.enemies.despawn(p);
    this.parts.length = 0;
  }
}

// ───────────────────────────────────────────────────────────────────────────────

export class Doomscroller extends Boss {
  readonly id = 'doomscroller' as const;
  protected readonly gates = BOSSES.doomscroller.gates;
  private heading = 0;
  private speed = 0;
  private cycle = ['charge', 'barrage', 'ragebait'];
  private cycleIdx = 0;
  private charges = 0;
  private deathT = 0;
  private popped = 0;

  constructor(ctx: GameCtx, hooks: BossHooks) {
    super(ctx, hooks, BOSSES.doomscroller.hp);
    const pos = ctx.enemies.findSpawnPoint(ctx.viewRadius() + 160);
    const p = ctx.player;
    this.heading = Math.atan2(p.y - pos.y, p.x - pos.x);
    const head = ctx.enemies.spawn('smoothbrain', pos.x, pos.y, { boss: this, texture: 'b_doomhead', radius: 34 });
    head.damage = 20;
    head.sprite.setScale(ART_SCALE * 0.95);
    this.parts.push(head);
    for (let i = 0; i < BOSSES.doomscroller.segments; i++) {
      const s = ctx.enemies.spawn('smoothbrain', pos.x - Math.cos(this.heading) * 38 * (i + 1), pos.y - Math.sin(this.heading) * 38 * (i + 1), {
        boss: this, texture: 'b_doomseg', radius: 22,
      });
      s.damage = 12;
      s.sprite.setFrame(i % 2).setScale(ART_SCALE * (0.9 - i * 0.025));
      this.parts.push(s);
    }
  }

  private steer(dt: number, turn: number, speed: number) {
    const h = this.head;
    const p = this.ctx.player;
    const want = Math.atan2(p.y - h.y, p.x - h.x) + Math.sin(this.t * 2.2) * 0.35;
    this.heading += clamp(Phaser.Math.Angle.Wrap(want - this.heading), -turn * dt, turn * dt);
    this.speed += (speed - this.speed) * Math.min(1, dt * 3);
  }

  update(dt: number) {
    this.t += dt;
    this.stateT += dt;
    this.phaseAge += dt;
    const h = this.head;
    const fast = this.phase === 2 ? 1.25 : 1;
    if (this.dying) return this.updateDeath(dt);
    switch (this.state) {
      case 'enter':
      case 'chase':
        this.steer(dt, 2.3, 150 * fast);
        if (this.stateT > (this.state === 'enter' ? 2.2 : this.phase === 2 ? 1.8 : 2.6)) {
          const next = this.cycle[this.cycleIdx++ % this.cycle.length];
          this.charges = this.phase === 2 ? 2 : 1;
          this.to(next);
          if (next === 'barrage') this.hooks.caption('NOTIFICATION BARRAGE');
          if (next === 'ragebait') this.hooks.caption('RAGE BAIT');
          if (next === 'charge') this.hooks.caption('INFINITE SCROLL');
        }
        break;
      case 'charge': {
        const aim = 0.95;
        if (this.stateT < aim) {
          this.speed *= Math.exp(-dt * 6);
          if (this.stateT < aim * 0.6) {
            const p = this.ctx.player;
            const want = Math.atan2(p.y - h.y, p.x - h.x);
            this.heading += clamp(Phaser.Math.Angle.Wrap(want - this.heading), -5 * dt, 5 * dt);
          }
          this.ctx.hazards.dashLine(h.x, h.y, Math.cos(this.heading), Math.sin(this.heading), 980, this.stateT / aim);
          if (this.step === 0) {
            this.step = 1;
            this.ctx.sfx('telegraph');
          }
        } else if (this.stateT < aim + 1.15) {
          this.speed = 820 * (this.phase === 2 ? 1.1 : 1);
          if (Math.random() < 0.5) this.ctx.fx.trailAt(h.x, h.y, PAL.dangerHot);
          const A = BALANCE.arena;
          if (h.x <= h.r + 2 || h.y <= h.r + 2 || h.x >= A.width - h.r - 2 || h.y >= A.height - h.r - 2) {
            this.ctx.fx.shake(10);
            this.ctx.fx.burst(h.x, h.y, PAL.dangerHot, 18);
            this.ctx.sfx('slam');
            this.stateT = aim + 1.15;
          }
        } else if (this.stateT < aim + 1.7) {
          this.speed *= Math.exp(-dt * 5);
        } else if (--this.charges > 0) this.to('charge');
        else this.to('chase');
        break;
      }
      case 'barrage': {
        this.steer(dt, 1.5, 55);
        if (this.step === 0) {
          this.step = 1;
          const p = this.ctx.player;
          const n = this.phase === 2 ? 12 : 8;
          for (let i = 0; i < n; i++) {
            const a = this.ctx.rng.range(0, TAU);
            const d = i === 0 ? 0 : this.ctx.rng.range(70, 300);
            const A = BALANCE.arena;
            const x = clamp(p.x + Math.cos(a) * d, 40, A.width - 40);
            const y = clamp(p.y + Math.sin(a) * d, 40, A.height - 40);
            this.ctx.hazards.bomb(x, y, 62, 1.15 + i * 0.07, 16, 'a notification');
          }
          this.ctx.sfx('telegraph');
        }
        if (this.stateT > 2.2) this.to('chase');
        break;
      }
      case 'ragebait': {
        this.steer(dt, 1.2, 70);
        const waves = [0.25, 0.8, 1.35];
        if (this.step < waves.length && this.stateT >= waves[this.step]) {
          const n = this.phase === 2 ? 18 : 14;
          const off = this.step * 0.4;
          for (let i = 0; i < n; i++) {
            const a = off + (i / n) * TAU;
            this.ctx.shots.enemyShot(h.x, h.y, Math.cos(a) * 165, Math.sin(a) * 165, 12);
          }
          this.ctx.fx.ring(h.x, h.y, 20, 80, PAL.danger, 0.3);
          this.ctx.sfx('enemyShot');
          this.step++;
        }
        if (this.stateT > 2) this.to('chase');
        break;
      }
    }
    // move head, clamp, then follow-the-leader for segments
    const A = BALANCE.arena;
    h.x = clamp(h.x + Math.cos(this.heading) * this.speed * dt, h.r, A.width - h.r);
    h.y = clamp(h.y + Math.sin(this.heading) * this.speed * dt, h.r, A.height - h.r);
    const spacing = 36;
    for (let i = 1; i < this.parts.length; i++) {
      const a = this.parts[i - 1], b = this.parts[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > spacing) {
        b.x = a.x + (dx / d) * spacing;
        b.y = a.y + (dy / d) * spacing;
      }
    }
    if (this.phase === 1 && this.hp < this.maxHp * 0.5) {
      this.phase = 2;
      this.phaseAge = 0;
      this.hooks.onPhase(this.id, 2);
    }
  }

  sync(time: number) {
    const h = this.head;
    if (!h) return;
    h.sprite.setRotation(this.heading + Math.PI / 2);
    h.sprite.setFrame(this.state === 'charge' ? 1 : 0);
    for (let i = 1; i < this.parts.length; i++) {
      const a = this.parts[i - 1], b = this.parts[i];
      b.sprite.setRotation(Math.atan2(a.y - b.y, a.x - b.x) + Math.PI / 2 + Math.sin(time * 6 + i) * 0.06);
      b.sprite.setDepth(10 + b.y * 0.001 - i * 0.00001);
      if (this.phase === 2 && b.flash <= 0) b.sprite.setTint(0xffb0c0);
    }
  }

  beginDeath() {
    this.dying = true;
    this.deathT = 0;
    this.popped = 0;
    for (const p of this.parts) p.damage = 0;
    this.ctx.shots.clearEnemyShots();
    this.ctx.sfx('bossRoar');
  }

  private updateDeath(dt: number) {
    this.deathT += dt;
    const want = Math.floor(this.deathT / 0.08);
    while (this.popped < want && this.popped < this.parts.length) {
      const part = this.parts[this.parts.length - 1 - this.popped];
      this.ctx.fx.burst(part.x, part.y, PAL.magenta, 14);
      this.ctx.fx.shatter(part.x, part.y, PAL.violet, 8);
      this.ctx.fx.ring(part.x, part.y, 10, 70, PAL.dangerHot, 0.3);
      this.ctx.fx.shake(5);
      this.ctx.sfx('explode');
      part.sprite.setVisible(false);
      this.popped++;
    }
    if (this.popped >= this.parts.length && !this.done) {
      this.done = true;
      const h = this.head;
      this.hooks.onDefeated(this.id, h.x, h.y);
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────────

export class Algorithm extends Boss {
  readonly id = 'algorithm' as const;
  protected readonly gates = BOSSES.algorithm.gates;
  private iris: Phaser.GameObjects.Image;
  private orbs: Phaser.GameObjects.Image[] = [];
  private cycleIdx = 0;
  private spiralA = 0;
  private emitT = 0;
  private deathT = 0;
  private grassCount = 0;

  constructor(ctx: GameCtx, hooks: BossHooks) {
    super(ctx, hooks, BOSSES.algorithm.hp);
    const pos = ctx.enemies.findSpawnPoint(ctx.viewRadius() * 0.7);
    const e = ctx.enemies.spawn('smoothbrain', pos.x, pos.y, { boss: this, texture: 'b_algo', radius: 66 });
    e.damage = 22;
    e.sprite.setScale(ART_SCALE);
    this.parts.push(e);
    this.iris = ctx.sc.add.image(pos.x, pos.y, 'b_algo_iris', 0).setScale(ART_SCALE);
    for (let i = 0; i < 4; i++) {
      this.orbs.push(ctx.sc.add.image(pos.x, pos.y, 'glow').setTint(PAL.magenta).setBlendMode(Phaser.BlendModes.ADD).setScale(0.6));
    }
  }

  private cycle(): string[] {
    if (this.phase === 1) return ['spiral', 'beam', 'summon'];
    if (this.phase === 2) return ['spiral', 'beam', 'summon', 'beam'];
    return ['grass', 'spiral', 'beam', 'grass', 'summon', 'beam'];
  }

  update(dt: number) {
    this.t += dt;
    this.stateT += dt;
    this.phaseAge += dt;
    const e = this.head;
    if (this.dying) return this.updateDeath(dt);
    // hover at a respectful distance, drifting around the player
    const p = this.ctx.player;
    const ang = Math.atan2(e.y - p.y, e.x - p.x) + dt * 0.25;
    const want = this.state === 'grass' ? 420 : 330;
    const tx = p.x + Math.cos(ang) * want, ty = p.y + Math.sin(ang) * want;
    const A = BALANCE.arena;
    const k = Math.min(1, dt * (this.state === 'enter' ? 0.8 : 1.4));
    e.x = clamp(e.x + (tx - e.x) * k, 90, A.width - 90);
    e.y = clamp(e.y + (ty - e.y) * k, 90, A.height - 90);

    const P = this.phase;
    switch (this.state) {
      case 'enter':
      case 'idle':
        if (this.stateT > (this.state === 'enter' ? 2.4 : P === 3 ? 0.7 : 1.1)) {
          const c = this.cycle();
          const next = c[this.cycleIdx++ % c.length];
          this.to(next);
          const caps: Record<string, string> = { spiral: 'FEED SPIRAL', beam: 'SHADOWBAN BEAM', summon: 'ENGAGEMENT FARMING', grass: '' };
          if (caps[next]) this.hooks.caption(caps[next]);
        }
        break;
      case 'spiral': {
        this.emitT -= dt;
        const arms = P === 1 ? 2 : 3;
        if (this.emitT <= 0) {
          this.emitT = P === 3 ? 0.09 : 0.11;
          this.spiralA += 0.23;
          for (let i = 0; i < arms; i++) {
            const a = this.spiralA + (i / arms) * TAU;
            this.ctx.shots.enemyShot(e.x, e.y, Math.cos(a) * (P === 3 ? 165 : 150), Math.sin(a) * (P === 3 ? 165 : 150), 12, 6);
          }
          if (this.step++ % 3 === 0) this.ctx.sfx('enemyShot');
        }
        if (this.stateT > 3.2) this.to('idle');
        break;
      }
      case 'beam': {
        if (this.step === 0) {
          this.step = 1;
          const base = Math.atan2(p.y - e.y, p.x - e.x);
          const dmg = 26;
          this.ctx.hazards.beam(e.x, e.y, base, { dmg, track: 0.8, warn: 1.25, follow: e });
          if (P >= 2) {
            this.ctx.hazards.beam(e.x, e.y, base - 0.5, { dmg, track: 0, warn: 1.25, follow: e });
            this.ctx.hazards.beam(e.x, e.y, base + 0.5, { dmg, track: 0, warn: 1.25, follow: e });
          }
          this.ctx.sfx('telegraph');
        }
        if (this.step === 1 && this.stateT > 1.25) {
          this.step = 2;
          this.ctx.fx.shake(6);
          this.ctx.sfx('zap');
        }
        if (this.stateT > 2.3) this.to('idle');
        break;
      }
      case 'summon': {
        if (this.step === 0) {
          this.step = 1;
          const room = this.ctx.enemies.capFor() - this.ctx.enemies.population;
          const n = Math.min(10, Math.max(0, room));
          for (let i = 0; i < n; i++) {
            const a = (i / Math.max(1, n)) * TAU;
            const id = i % 5 === 4 ? 'hottake' : 'smoothbrain';
            this.ctx.enemies.spawn(id, clamp(e.x + Math.cos(a) * 120, 40, A.width - 40), clamp(e.y + Math.sin(a) * 120, 40, A.height - 40));
          }
          this.ctx.fx.ring(e.x, e.y, 30, 150, PAL.magenta, 0.4);
        }
        if (this.stateT > 1.4) this.to('idle');
        break;
      }
      case 'grass': {
        const countdown = 3.4;
        if (this.step === 0) {
          this.step = 1;
          this.grassCount++;
          this.ctx.announce(LINES.touchGrass[0], 'boss');
          for (let i = 0; i < 3; i++) {
            const a = this.ctx.rng.range(0, TAU);
            const d = this.ctx.rng.range(150, 340);
            const x = clamp(p.x + Math.cos(a) * d, 120, A.width - 120);
            const y = clamp(p.y + Math.sin(a) * d, 120, A.height - 120);
            this.ctx.hazards.addZone(x, y, 80);
          }
          this.ctx.sfx('bossWarn');
        }
        const left = Math.ceil(countdown - this.stateT);
        if (this.step >= 1 && this.step <= 3 && left <= 3 - (this.step - 1) && left > 0) {
          this.hooks.caption(`TOUCH GRASS IN ${left}`);
          this.step++;
        }
        if (this.stateT >= countdown && this.step < 10) {
          this.step = 10;
          const safe = this.ctx.hazards.inZone(p.x, p.y);
          this.ctx.fx.flash(safe ? PAL.grass : PAL.dangerHot, 0.35, 220);
          this.ctx.fx.shake(12);
          if (safe) {
            p.hp = Math.min(p.maxHp, p.hp + 8);
            this.ctx.fx.number(p.x, p.y - 20, 8, false, PAL.grass);
            this.ctx.sfx('heal');
            this.hooks.caption('GRASS TOUCHED. RESPECT.');
          } else this.ctx.hurtPlayer(32, e.x, e.y, 'not touching grass');
          this.ctx.hazards.clearZones();
        }
        if (this.stateT > countdown + 0.8) this.to('idle');
        break;
      }
    }
    if (this.phase === 1 && this.hp < this.maxHp * 0.66) this.setPhase(2);
    else if (this.phase === 2 && this.hp < this.maxHp * 0.33) this.setPhase(3);
  }

  private setPhase(n: number) {
    this.phase = n;
    this.phaseAge = 0;
    this.cycleIdx = 0;
    this.to('idle');
    this.stateT = -0.6;
    this.ctx.shots.clearEnemyShots();
    this.hooks.onPhase(this.id, n);
  }

  sync(time: number) {
    const e = this.head;
    if (!e) return;
    const bob = Math.sin(time * 2) * 6;
    e.sprite.setPosition(e.x, e.y + bob);
    const p = this.ctx.player;
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    this.iris.setPosition(e.x + Math.cos(a) * 12, e.y - 14 + bob + Math.sin(a) * 7)
      .setFrame(this.phase === 3 ? 1 : 0).setDepth(e.sprite.depth + 0.001).setVisible(!this.dying || this.deathT < 1.2);
    if (e.flash > 0) this.iris.setTintFill(0xffffff);
    else this.iris.clearTint();
    for (let i = 0; i < this.orbs.length; i++) {
      const oa = time * 1.4 + (i / this.orbs.length) * TAU;
      this.orbs[i].setPosition(e.x + Math.cos(oa) * 118, e.y + bob + Math.sin(oa) * 60).setDepth(e.sprite.depth + (Math.sin(oa) > 0 ? 0.002 : -0.002))
        .setTint(this.phase === 3 ? PAL.dangerHot : PAL.magenta).setVisible(!this.dying);
    }
  }

  beginDeath() {
    this.dying = true;
    this.deathT = 0;
    this.head.damage = 0;
    this.ctx.shots.clearEnemyShots();
    this.ctx.hazards.clearAll();
    this.ctx.sfx('bossRoar');
  }

  private updateDeath(dt: number) {
    const e = this.head;
    const before = this.deathT;
    this.deathT += dt;
    if (Math.floor(this.deathT / 0.14) !== Math.floor(before / 0.14) && this.deathT < 1.4) {
      const x = e.x + this.ctx.rng.range(-80, 80), y = e.y + this.ctx.rng.range(-60, 60);
      this.ctx.fx.burst(x, y, this.ctx.rng.chance(0.5) ? PAL.magenta : PAL.cyan, 16);
      this.ctx.fx.ring(x, y, 10, 90, PAL.white, 0.35);
      this.ctx.fx.shake(6);
      this.ctx.sfx('explode');
    }
    if (this.deathT >= 1.5 && !this.done) {
      this.done = true;
      e.sprite.setVisible(false);
      this.iris.setVisible(false);
      this.ctx.fx.flash(0xffffff, 0.7, 500);
      this.ctx.fx.burst(e.x, e.y, PAL.white, 60);
      this.ctx.fx.shatter(e.x, e.y, PAL.magenta, 30);
      this.hooks.onDefeated(this.id, e.x, e.y);
    }
  }

  destroy() {
    super.destroy();
    this.iris.destroy();
    for (const o of this.orbs) o.destroy();
  }
}

export type AnyBoss = Doomscroller | Algorithm;

export function createBoss(id: BossId, ctx: GameCtx, hooks: BossHooks): AnyBoss {
  return id === 'doomscroller' ? new Doomscroller(ctx, hooks) : new Algorithm(ctx, hooks);
}
