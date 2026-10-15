import Phaser from 'phaser';
import { PAL } from '../art/palette';
import { ART_SCALE } from '../art/textures';
import { TAU } from '../core/math';

/** Living backdrop for the menus: the arena floor with the cast wandering around. */
export class MenuScene extends Phaser.Scene {
  private crowd: Array<{ img: Phaser.GameObjects.Image; vx: number; vy: number; t: number }> = [];
  private bg!: Phaser.GameObjects.TileSprite;
  private floor!: Phaser.GameObjects.TileSprite;
  private t = 0;

  constructor() {
    super('Menu');
  }

  create() {
    this.crowd = [];
    this.t = 0;
    const cam = this.cameras.main;
    cam.setBackgroundColor(PAL.void);
    this.bg = this.add.tileSprite(0, 0, cam.width, cam.height, 'void').setOrigin(0).setScrollFactor(0);
    this.floor = this.add.tileSprite(0, 0, cam.width, cam.height, 'floor').setOrigin(0).setScrollFactor(0).setAlpha(0.85);
    for (let i = 0; i < 7; i++) {
      this.add.image(Math.random() * cam.width, Math.random() * cam.height, 'glow')
        .setTint([PAL.magenta, PAL.cyan, PAL.violet][i % 3]).setBlendMode(Phaser.BlendModes.ADD).setScale(6 + Math.random() * 5).setAlpha(0.13).setScrollFactor(0);
    }
    const cast = ['e_smoothbrain', 'e_smoothbrain', 'e_speedrunner', 'e_hottake', 'e_ratio', 'e_unit', 'e_copypasta', 'e_smoothbrain', 'e_ratiolet', 'e_hottake', 'e_speedrunner', 'e_smoothbrain'];
    const dpr = (this.registry.get('dpr') as number) || 1;
    for (const key of cast) {
      const a = Math.random() * TAU;
      const sp = 20 + Math.random() * 30;
      const img = this.add.image(Math.random() * cam.width, Math.random() * cam.height, key, 0).setScale(ART_SCALE * dpr * 1.1).setAlpha(0.55).setScrollFactor(0);
      this.crowd.push({ img, vx: Math.cos(a) * sp * dpr, vy: Math.sin(a) * sp * dpr, t: Math.random() * 5 });
    }
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.onResize, this));
  }

  private onResize() {
    const cam = this.cameras.main;
    this.bg.setSize(cam.width, cam.height);
    this.floor.setSize(cam.width, cam.height);
  }

  update(_t: number, delta: number) {
    const dt = Math.min(0.05, delta / 1000);
    this.t += dt;
    const reduced = document.documentElement.classList.contains('reduced');
    const speed = reduced ? 0.15 : 1;
    this.bg.tilePositionX += 6 * dt * speed;
    this.bg.tilePositionY += 3 * dt * speed;
    this.floor.tilePositionX += 18 * dt * speed;
    this.floor.tilePositionY += 9 * dt * speed;
    const cam = this.cameras.main;
    for (const c of this.crowd) {
      c.t += dt;
      c.img.x += c.vx * dt * speed;
      c.img.y += c.vy * dt * speed;
      if (c.img.x < -60) c.img.x = cam.width + 50;
      if (c.img.x > cam.width + 60) c.img.x = -50;
      if (c.img.y < -60) c.img.y = cam.height + 50;
      if (c.img.y > cam.height + 60) c.img.y = -50;
      c.img.setFrame(Math.floor(c.t * 5) % 2).setFlipX(c.vx < 0);
    }
  }
}
