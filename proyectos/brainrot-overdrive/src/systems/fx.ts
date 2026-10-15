import Phaser from 'phaser';
import { DMG_FONT, ART_SCALE } from '../art/textures';
import { PAL } from '../art/palette';
import type { Settings } from '../core/save';

interface Num {
  t: BitmapTextLike;
  life: number;
  max: number;
  vy: number;
  active: boolean;
}
type BitmapTextLike = Phaser.GameObjects.BitmapText;

interface Ring {
  img: Phaser.GameObjects.Image;
  life: number;
  max: number;
  r0: number;
  r1: number;
  active: boolean;
}

interface Bolt {
  pts: number[];
  life: number;
  max: number;
  color: number;
  width: number;
}

/**
 * Visual feedback, all pooled and bounded:
 *  - particle emitters (one per look, additive) with hard max counts
 *  - floating damage numbers (BitmapText pool)
 *  - expanding rings, lightning polylines, afterimages
 *  - restrained, settings-aware camera shake / flash
 */
export class Fx {
  private sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private shards: Phaser.GameObjects.Particles.ParticleEmitter;
  private glows: Phaser.GameObjects.Particles.ParticleEmitter;
  private trail: Phaser.GameObjects.Particles.ParticleEmitter;
  private nums: Num[] = [];
  private rings: Ring[] = [];
  private bolts: Bolt[] = [];
  private lightning: Phaser.GameObjects.Graphics;
  private intensity = 1;
  private shakeAmt = 0;
  /** Camera shake offset for this frame; the scene adds it to the camera base position. */
  offX = 0;
  offY = 0;

  constructor(private readonly scene: Phaser.Scene, private settings: Settings) {
    const add = (tex: string, cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig, depth: number) => {
      const e = scene.add.particles(0, 0, tex, { emitting: false, blendMode: 'ADD', ...cfg });
      e.setDepth(depth);
      return e;
    };
    this.sparks = add('spark', {
      speed: { min: 120, max: 420 }, lifespan: { min: 180, max: 420 }, scale: { start: 0.55, end: 0 },
      alpha: { start: 1, end: 0 }, maxParticles: 700,
      // sparks point along their velocity
      rotate: { onEmit: alongVelocity, onUpdate: alongVelocity },
    }, 40);
    this.shards = scene.add.particles(0, 0, 'shard', {
      emitting: false, speed: { min: 80, max: 260 }, lifespan: { min: 260, max: 520 }, scale: { start: 0.45, end: 0.05 },
      alpha: { start: 1, end: 0 }, rotate: { start: 0, end: 540 }, maxParticles: 400,
    });
    this.shards.setDepth(39);
    this.glows = add('glow', {
      speed: { min: 10, max: 50 }, lifespan: { min: 180, max: 360 }, scale: { start: 0.34, end: 0 },
      alpha: { start: 0.5, end: 0 }, maxParticles: 160,
    }, 38);
    this.trail = add('glow', {
      speed: 0, lifespan: 220, scale: { start: 0.16, end: 0 }, alpha: { start: 0.4, end: 0 }, maxParticles: 400,
    }, 29);
    this.lightning = scene.add.graphics().setDepth(41).setBlendMode(Phaser.BlendModes.ADD);
    this.applySettings(settings);
  }

  applySettings(s: Settings) {
    this.settings = s;
    this.intensity = s.intensity === 'high' ? 1 : s.intensity === 'medium' ? 0.6 : 0.3;
  }

  private n(count: number) {
    return Math.max(1, Math.round(count * this.intensity));
  }

  burst(x: number, y: number, color: number, count = 10) {
    this.sparks.setParticleTint(color);
    this.sparks.explode(this.n(count), x, y);
  }

  shatter(x: number, y: number, color: number, count = 8) {
    this.shards.setParticleTint(color);
    this.shards.explode(this.n(count), x, y);
  }

  glow(x: number, y: number, color: number, count = 3) {
    this.glows.setParticleTint(color);
    this.glows.explode(this.n(count), x, y);
  }

  trailAt(x: number, y: number, color: number) {
    if (this.intensity < 0.5 && Math.random() < 0.5) return;
    this.trail.setParticleTint(color);
    this.trail.emitParticleAt(x, y, 1);
  }

  ring(x: number, y: number, r0: number, r1: number, color: number, life = 0.35, alpha = 0.9) {
    let ring = this.rings.find((r) => !r.active);
    if (!ring) {
      if (this.rings.length >= 48) return;
      const img = this.scene.add.image(0, 0, 'ring').setBlendMode(Phaser.BlendModes.ADD).setDepth(37);
      ring = { img, life: 0, max: 0, r0: 0, r1: 0, active: false };
      this.rings.push(ring);
    }
    ring.active = true;
    ring.life = ring.max = life;
    ring.r0 = r0;
    ring.r1 = r1;
    ring.img.setPosition(x, y).setTint(color).setAlpha(alpha).setVisible(true);
    ring.img.setData('a0', alpha);
    this.scaleRing(ring, r0);
  }

  private scaleRing(r: Ring, radius: number) {
    r.img.setScale(radius / 116); // ring stroke radius is 58 logical px = 116 texture px at RES 2
  }

  lightningBolt(x0: number, y0: number, x1: number, y1: number, color: number = PAL.cyan, width = 3, life = 0.16) {
    const pts = [x0, y0];
    const segs = 6;
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const off = (Math.random() - 0.5) * Math.min(28, len * 0.25);
      pts.push(x0 + dx * t + nx * off, y0 + dy * t + ny * off);
    }
    pts.push(x1, y1);
    if (this.bolts.length > 60) this.bolts.shift();
    this.bolts.push({ pts, life, max: life, color, width });
  }

  number(x: number, y: number, value: number, crit: boolean, color?: number) {
    if (!this.settings.damageNumbers) return;
    // restraint: regular numbers are capped so crits and big hits stay readable
    if (color === undefined) {
      let live = 0;
      const crits = crit;
      for (const q of this.nums) if (q.active && (q.max > 0.6) === crits) live++;
      if (live >= (crits ? 12 : this.intensity >= 1 ? 14 : 6)) return;
    }
    let n = this.nums.find((q) => !q.active);
    if (!n) {
      if (this.nums.length >= 70) {
        // recycle the oldest
        n = this.nums.reduce((a, b) => (a.life < b.life ? a : b));
      } else {
        const t = this.scene.add.bitmapText(0, 0, DMG_FONT.key, '', 30).setOrigin(0.5).setDepth(50);
        n = { t, life: 0, max: 0, vy: 0, active: false };
        this.nums.push(n);
      }
    }
    n.active = true;
    n.max = n.life = crit ? 0.75 : 0.5;
    n.vy = crit ? -70 : -55;
    const txt = value >= 10000 ? `${Math.round(value / 1000)}K` : String(Math.max(1, Math.round(value)));
    n.t.setText(crit ? `${txt}!` : txt)
      .setPosition(x + (Math.random() - 0.5) * 14, y - 12)
      .setScale(crit ? 0.62 : 0.42)
      .setTint(color ?? (crit ? PAL.gold : 0xffffff))
      .setAlpha(1)
      .setVisible(true);
  }

  /** Text-free afterimage of a sprite (dash). */
  afterimage(src: Phaser.GameObjects.Image, color: number) {
    const img = this.scene.add.image(src.x, src.y, src.texture.key, src.frame.name)
      .setScale(src.scaleX, src.scaleY).setFlipX(src.flipX).setTintFill(color).setAlpha(0.45).setDepth(src.depth - 0.01)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: img, alpha: 0, duration: 220, onComplete: () => img.destroy() });
  }

  shake(amount: number) {
    if (this.settings.reducedMotion) return;
    this.shakeAmt = Math.min(18, Math.max(this.shakeAmt, amount * this.settings.shake));
  }

  flash(color: number, alpha = 0.25, ms = 120) {
    if (this.settings.reducedMotion) alpha *= 0.3;
    const c = Phaser.Display.Color.IntegerToColor(color);
    const cam = this.scene.cameras.main;
    cam.flashEffect.alpha = alpha; // read by start()
    cam.flash(ms, c.red, c.green, c.blue, true);
  }

  /** Per-frame update (real dt, but caller skips while paused). */
  update(dt: number) {
    if (this.shakeAmt > 0.05) {
      const a = this.shakeAmt;
      this.offX = (Math.random() - 0.5) * a;
      this.offY = (Math.random() - 0.5) * a;
      this.shakeAmt *= Math.exp(-dt * 16);
    } else {
      this.shakeAmt = 0;
      this.offX = this.offY = 0;
    }

    for (const n of this.nums) {
      if (!n.active) continue;
      n.life -= dt;
      n.t.y += n.vy * dt;
      n.vy *= Math.exp(-dt * 4);
      const k = n.life / n.max;
      n.t.setAlpha(Math.min(1, k * 2.5));
      if (n.life <= 0) {
        n.active = false;
        n.t.setVisible(false);
      }
    }
    for (const r of this.rings) {
      if (!r.active) continue;
      r.life -= dt;
      const k = 1 - Math.max(0, r.life) / r.max;
      const e = 1 - Math.pow(1 - k, 3);
      this.scaleRing(r, r.r0 + (r.r1 - r.r0) * e);
      r.img.setAlpha((r.img.getData('a0') as number) * (1 - k));
      if (r.life <= 0) {
        r.active = false;
        r.img.setVisible(false);
      }
    }
    const g = this.lightning;
    g.clear();
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.bolts.splice(i, 1);
        continue;
      }
      const a = b.life / b.max;
      g.lineStyle(b.width * 3.2, b.color, 0.25 * a);
      g.strokePoints(toPoints(b.pts), false);
      g.lineStyle(b.width, 0xffffff, 0.95 * a);
      g.strokePoints(toPoints(b.pts), false);
    }
  }

  destroy() {
    this.nums.length = 0;
    this.rings.length = 0;
    this.bolts.length = 0;
  }
}

function alongVelocity(p?: Phaser.GameObjects.Particles.Particle): number {
  return p ? Phaser.Math.RadToDeg(Math.atan2(p.velocityY, p.velocityX)) : 0;
}

const tmpPts: Phaser.Types.Math.Vector2Like[] = [];
function toPoints(flat: number[]): Phaser.Types.Math.Vector2Like[] {
  tmpPts.length = 0;
  for (let i = 0; i < flat.length; i += 2) tmpPts.push({ x: flat[i], y: flat[i + 1] });
  return tmpPts;
}

export { ART_SCALE };
