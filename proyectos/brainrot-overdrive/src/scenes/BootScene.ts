import Phaser from 'phaser';
import { generateTextures } from '../art/textures';

/** Generates every texture procedurally, then hands over to the menu. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    generateTextures(this);
    this.game.events.emit('textures-ready');
    this.scene.start('Menu');
  }
}
