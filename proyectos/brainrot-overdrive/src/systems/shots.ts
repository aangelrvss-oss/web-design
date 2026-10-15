import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { ART_SCALE } from '../art/textures';
import { PAL } from '../art/palette';
import type { GameCtx } from './ctx';
import { Shot, type Enemy } from './entities';

const MAX_PLAYER_SHOTS = 420;
const MAX_ENEMY_SHOTS = 320;

/** Player projectiles (bolts, missiles) and enemy bullets, pooled and bounded. */
export class ShotSystem {
  readonly player: Shot[] = [];
  readonly enemy: Shot[] = [];
  private freeP: Shot[] = [];
  private freeE: Shot[] = [];

  constructor(private readonly ctx: GameCtx) {}

  private make(enemy: boolean): Shot | null {
    const free = enemy ? this.freeE : this.freeP;
    const list = enemy ? this.enemy : this.player;
    let s = free.pop();
    if (!s) {
      if (list.length >= (enemy ? MAX_ENEMY_SHOTS : MAX_PLAYER_SHOTS)) return null;
      s = new Shot();
      s.sprite = this.ctx.sc.add.image(0, 0, 'bolt').setDepth(enemy ? 33 : 30);
    }
    s.active = true;
    s.hit.length = 0;
    s.target = null;
    s.trailT = 0;
    s.sprite.setVisible(true).setAlpha(1).clearTint();
    list.push(s);
    return s;
  }

  private kill(s: Shot) {
    s.active = false;
    s.sprite.setVisible(false);
  }

  bolt(x: number, y: number, angle: number, speed: number, dmg: number, pierce: number, bounces: number, gold: boolean, size: number) {
    const s = this.make(false);
    if (!s) return;
    s.kind = 'bolt';
    s.x = x;
    s.y = y;
    s.vx = Math.cos(angle) * speed;
    s.vy = Math.sin(angle) * speed;
    s.speed = speed;
    s.dmg = dmg;
    s.pierce = pierce;
    s.bounces = bounces;
    s.gold = gold;
    s.r = 7 * size;
    s.life = 1.1;
    s.sprite.setTexture(gold ? 'bolt_gold' : 'bolt').setScale(ART_SCALE * size).setRotation(angle).setBlendMode(Phaser.BlendModes.ADD);
  }

  missile(x: number, y: number, angle: number, dmg: number, radius: number, speed: number, target: Enemy | null, mini = false) {
    const s = this.make(false);
    if (!s) return;
    s.kind = mini ? 'mini' : 'missile';
    s.x = x;
    s.y = y;
    s.speed = speed;
    s.vx = Math.cos(angle) * speed * 0.55;
    s.vy = Math.sin(angle) * speed * 0.55;
    s.dmg = dmg;
    s.radius = radius;
    s.r = mini ? 6 : 8;
    s.life = mini ? 1.6 : 3.2;
    s.pierce = 0;
    s.bounces = 0;
    s.gold = false;
    s.target = target;
    s.targetUid = target?.uid ?? 0;
    s.sprite.setTexture('missile').setScale(ART_SCALE * (mini ? 0.7 : 1)).setRotation(angle).setBlendMode(Phaser.BlendModes.ADD);
  }

  enemyShot(x: number, y: number, vx: number, vy: number, dmg: number, life = 5) {
    const s = this.make(true);
    if (!s) return;
    s.kind = 'ebullet';
    s.x = x;
    s.y = y;
    s.vx = vx;
    s.vy = vy;
    s.dmg = dmg;
    s.r = 7;
    s.life = life;
    s.sprite.setTexture('ebullet').setScale(ART_SCALE).setBlendMode(Phaser.BlendModes.NORMAL);
  }

  private nearestEnemy(x: number, y: number, range: number, exclude?: number[]): Enemy | null {
    const list = this.ctx.enemies.active;
    const near = this.ctx.grid.query(x, y, range);
    let best: Enemy | null = null;
    let bd = range * range;
    for (const i of near) {
      const e = list[i];
      if (!e || !e.active || (exclude && exclude.includes(e.uid))) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  update(dt: number) {
    const ctx = this.ctx;
    const A = BALANCE.arena;
    const list = ctx.enemies.active;
    for (const s of this.player) {
      if (!s.active) continue;
      s.life -= dt;
      if (s.kind !== 'bolt') {
        // homing: reacquire if the target died
        if (!s.target || !s.target.active || s.target.uid !== s.targetUid) {
          s.target = this.nearestEnemy(s.x, s.y, 520);
          s.targetUid = s.target?.uid ?? 0;
        }
        const sp = Math.min(s.speed, Math.hypot(s.vx, s.vy) + s.speed * 2.5 * dt);
        let ang = Math.atan2(s.vy, s.vx);
        if (s.target) {
          const want = Math.atan2(s.target.y - s.y, s.target.x - s.x);
          let da = Phaser.Math.Angle.Wrap(want - ang);
          const turn = 7 * dt;
          da = Phaser.Math.Clamp(da, -turn, turn);
          ang += da;
        }
        s.vx = Math.cos(ang) * sp;
        s.vy = Math.sin(ang) * sp;
        s.trailT -= dt;
        if (s.trailT <= 0) {
          s.trailT = 0.03;
          ctx.fx.trailAt(s.x, s.y, PAL.magenta);
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.x < -50 || s.y < -50 || s.x > A.width + 50 || s.y > A.height + 50) {
        if (s.kind !== 'bolt' && s.life <= 0) this.explode(s);
        this.kill(s);
        continue;
      }
      const near = ctx.grid.query(s.x, s.y, s.r + 40);
      for (const i of near) {
        const e = list[i];
        if (!e || !e.active || s.hit.includes(e.uid)) continue;
        const rr = s.r + e.r;
        if ((e.x - s.x) ** 2 + (e.y - s.y) ** 2 > rr * rr) continue;
        if (s.kind === 'bolt') {
          s.hit.push(e.uid);
          const l = Math.hypot(s.vx, s.vy) || 1;
          ctx.damageEnemy(e, s.dmg, 'cannon', { knock: 70, kx: s.vx / l, ky: s.vy / l });
          ctx.fx.burst(s.x, s.y, s.gold ? PAL.gold : PAL.cyan, 3);
          if (s.pierce > 0) { s.pierce--; continue; }
          if (s.bounces > 0) {
            const next = this.nearestEnemy(s.x, s.y, 260, s.hit);
            if (next) {
              s.bounces--;
              const a = Math.atan2(next.y - s.y, next.x - s.x);
              s.vx = Math.cos(a) * s.speed;
              s.vy = Math.sin(a) * s.speed;
              s.life = Math.max(s.life, 0.6);
              ctx.fx.ring(s.x, s.y, 4, 18, PAL.cyan, 0.18);
              break;
            }
          }
          this.kill(s);
        } else {
          this.explode(s);
          this.kill(s);
        }
        break;
      }
    }
    // enemy bullets vs player
    const p = ctx.player;
    const pr = p.r * 0.75; // forgiving hurtbox
    for (const s of this.enemy) {
      if (!s.active) continue;
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.x < -20 || s.y < -20 || s.x > A.width + 20 || s.y > A.height + 20) {
        this.kill(s);
        continue;
      }
      const rr = s.r + pr;
      if (p.alive && (p.x - s.x) ** 2 + (p.y - s.y) ** 2 < rr * rr) {
        if (p.invuln <= 0) {
          ctx.hurtPlayer(s.dmg, s.x, s.y, 'a Hot Take');
          this.kill(s);
        }
      }
    }
    this.compact(this.player, this.freeP);
    this.compact(this.enemy, this.freeE);
  }

  private explode(s: Shot) {
    const ctx = this.ctx;
    const R = s.radius * ctx.stats.areaMult;
    const list = ctx.enemies.active;
    for (const i of ctx.grid.query(s.x, s.y, R + 30)) {
      const e = list[i];
      if (!e || !e.active) continue;
      if ((e.x - s.x) ** 2 + (e.y - s.y) ** 2 > (R + e.r) ** 2) continue;
      ctx.damageEnemy(e, s.dmg, s.kind === 'mini' ? 'ratiod' : 'homing', { knock: 120, silent: true });
    }
    ctx.fx.ring(s.x, s.y, 6, R, PAL.magenta, 0.25);
    ctx.fx.burst(s.x, s.y, PAL.magenta, 6);
    ctx.sfx('explode');
  }

  private compact(list: Shot[], free: Shot[]) {
    let w = 0;
    for (let r = 0; r < list.length; r++) {
      const s = list[r];
      if (s.active) list[w++] = s;
      else free.push(s);
    }
    list.length = w;
  }

  sync() {
    for (const s of this.player) {
      if (!s.active) continue;
      s.sprite.setPosition(s.x, s.y).setRotation(Math.atan2(s.vy, s.vx));
    }
    for (const s of this.enemy) {
      if (!s.active) continue;
      s.sprite.setPosition(s.x, s.y).setRotation(s.sprite.rotation + 0.15);
    }
  }

  clearEnemyShots() {
    for (const s of this.enemy) if (s.active) {
      this.ctx.fx.glow(s.x, s.y, PAL.danger, 1);
      this.kill(s);
    }
  }

  clearAll() {
    for (const s of this.player) this.kill(s);
    for (const s of this.enemy) this.kill(s);
    this.compact(this.player, this.freeP);
    this.compact(this.enemy, this.freeE);
  }
}
