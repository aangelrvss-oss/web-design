import '@fontsource-variable/unbounded';
import '@fontsource-variable/space-grotesk';
import './ui/style.css';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { input } from './core/input';
import { App } from './app';

/** Device pixel ratio, capped: 2× is plenty for crisp art and keeps fill-rate sane. */
const dprNow = () => Math.min(2, window.devicePixelRatio || 1);

async function boot() {
  // textures bake text glyphs, so wait (briefly) for the bundled fonts
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('800 22px "Unbounded Variable"'),
        document.fonts.load('600 16px "Space Grotesk Variable"'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* fonts are optional; fall back to system faces */
  }

  const parent = document.getElementById('game')!;
  input.bind(parent);
  let dpr = dprNow();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#07040f',
    scale: { mode: Phaser.Scale.NONE, width: Math.round(innerWidth * dpr), height: Math.round(innerHeight * dpr), zoom: 1 / dpr },
    render: { antialias: true, powerPreference: 'high-performance', roundPixels: false },
    input: { keyboard: false, gamepad: false },
    audio: { noAudio: true },
    fps: { target: 60, smoothStep: true },
    disableContextMenu: true,
    banner: false,
    scene: [BootScene, MenuScene, GameScene],
  });
  game.registry.set('dpr', dpr);

  const resize = () => {
    dpr = dprNow();
    game.registry.set('dpr', dpr);
    game.scale.resize(Math.round(innerWidth * dpr), Math.round(innerHeight * dpr));
    game.scale.setZoom(1 / dpr);
  };
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);

  game.events.once('textures-ready', () => {
    const app = new App(game);
    (window as unknown as { __app: App }).__app = app;
    // menu backdrop scene starts right after boot; show the DOM menu on top
    requestAnimationFrame(() => app.showMenu());
    document.getElementById('loading')?.remove();
  });
}

void boot();
