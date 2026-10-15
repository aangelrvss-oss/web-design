import Phaser from 'phaser';
import { BALANCE } from '../config/balance';
import { ART_SCALE } from '../art/textures';
import { PAL } from '../art/palette';
import { clamp, damp } from '../core/math';
import type { GameCtx } from './ctx';

export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  r = BALANCE.player.radius;
  hp: number;
  maxHp: number;
  invuln = 0;
  dashT = 0;
  dashCd = 0;
  dashDirX = 1;
  dashDirY = 0;
  aimX = 1;
  aimY = 0;
  alive = true;
  private anim = 0;
  private blinkT = 2;
  private afterT = 0;
  private hurtFlash = 0;
  readonly sprite: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly aura: Phaser.GameObjects.Image;
  private readonly reticle: Phaser.GameObjects.Image;

  constructor(private readonly ctx: GameCtx, texture: string, x: number, y: number, maxHp: number) {
    this.x = x;
    this.y = y;
    this.hp = this.maxHp = maxHp;
    const s = ctx.sc;
    this.aura = s.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(PAL.cyan).setAlpha(0.35).setScale(1.6).setDepth(4);
    this.shadow = s.add.image(x, y, 'shadow').setScale(ART_SCALE * 1.1).setDepth(4.5);
    this.sprite = s.add.image(x, y, texture, 0).setScale(ART_SCALE).setOrigin(0.5, 0.78);
    this.reticle = s.add.image(x, y, 'ring').setScale(0.09).setTint(PAL.cyan).setAlpha(0.7).setDepth(36).setBlendMode(Phaser.BlendModes.ADD);
  }

  get dashing() {
    return this.dashT > 0;
  }

  get hpFrac() {
    return this.hp / this.maxHp;
  }

  tryDash(mx: number, my: number): boolean {
    if (this.dashCd > 0 || !this.alive) return false;
    const d = BALANCE.player.dash;
    let dx = mx, dy = my;
    if (!dx && !dy) { dx = this.aimX; dy = this.aimY; }
    const l = Math.hypot(dx, dy) || 1;
    this.dashDirX = dx / l;
    this.dashDirY = dy / l;
    this.dashT = d.duration;
    this.dashCd = this.ctx.stats.dashCooldown;
    this.invuln = Math.max(this.invuln, d.duration + this.ctx.stats.dashInvulnExtra);
    this.sprite.setScale(ART_SCALE * 1.18, ART_SCALE * 0.84);
    return true;
  }

  update(dt: number, mx: number, my: number) {
    const st = this.ctx.stats;
    const p = BALANCE.player;
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);

    const speedMul = this.ctx.overdrive ? BALANCE.overdrive.moveMult : 1;
    if (this.dashT > 0) {
      this.dashT -= dt;
      const sp = st.moveSpeed * p.dash.speedMult;
      this.vx = this.dashDirX * sp;
      this.vy = this.dashDirY * sp;
      this.afterT -= dt;
      if (this.afterT <= 0) {
        this.afterT = 0.028;
        this.ctx.fx.afterimage(this.sprite, this.ctx.overdrive ? PAL.magenta : PAL.cyan);
      }
    } else {
      const tx = mx * st.moveSpeed * speedMul;
      const ty = my * st.moveSpeed * speedMul;
      const k = damp(mx || my ? p.accel : p.friction, dt);
      this.vx += (tx - this.vx) * k;
      this.vy += (ty - this.vy) * k;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const A = BALANCE.arena;
    this.x = clamp(this.x, this.r, A.width - this.r);
    this.y = clamp(this.y, this.r, A.height - this.r);

    if (st.regen > 0 && this.alive) this.hp = Math.min(this.maxHp, this.hp + st.regen * dt);

    // animation
    const moving = Math.hypot(this.vx, this.vy) > 30;
    this.anim += dt * (moving ? 9 : 0);
    this.blinkT -= dt;
    if (this.blinkT < 0) this.blinkT = 2 + Math.random() * 2.5;
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);
  }

  hurtFx() {
    this.hurtFlash = 0.12;
  }

  sync(time: number) {
    const s = this.sprite;
    const moving = Math.hypot(this.vx, this.vy) > 30;
    const bob = moving ? Math.abs(Math.sin(this.anim * Math.PI)) * 2.2 : Math.sin(time * 3) * 0.6;
    s.setPosition(this.x, this.y + 6 - bob);
    s.setFrame(moving ? Math.floor(this.anim) % 2 : this.blinkT < 0.12 ? 1 : 0);
    if (this.aimX < -0.05) s.setFlipX(true);
    else if (this.aimX > 0.05) s.setFlipX(false);
    // ease squash back
    s.scaleX += (ART_SCALE - s.scaleX) * 0.25;
    s.scaleY += (ART_SCALE - s.scaleY) * 0.25;
    s.setDepth(10 + this.y * 0.001);
    if (this.hurtFlash > 0) s.setTintFill(0xffffff);
    else if (this.invuln > 0 && !this.dashing) {
      s.clearTint();
      s.setAlpha(Math.sin(time * 40) > 0 ? 1 : 0.35);
    } else {
      s.clearTint();
      s.setAlpha(1);
    }
    this.shadow.setPosition(this.x, this.y + 8);
    this.aura.setPosition(this.x, this.y);
    this.aura.setTint(this.ctx.overdrive ? PAL.magenta : PAL.cyan);
    this.aura.setAlpha(this.ctx.overdrive ? 0.7 + Math.sin(time * 12) * 0.15 : 0.28);
    this.aura.setScale(this.ctx.overdrive ? 2.4 : 1.5);
    this.reticle.setPosition(this.x + this.aimX * 58, this.y + this.aimY * 58);
    this.reticle.setVisible(this.alive);
  }

  setVisible(v: boolean) {
    this.sprite.setVisible(v);
    this.shadow.setVisible(v);
    this.aura.setVisible(v);
    this.reticle.setVisible(v);
  }
}
