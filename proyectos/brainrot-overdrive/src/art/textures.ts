import Phaser from 'phaser';
import { PAL, css } from './palette';

/**
 * All art is generated at boot with Canvas 2D: no external image assets, no licensing
 * questions, crisp at any DPR. Style rules: thick ink outline drawn as a union (stroke all
 * shapes, then fill all shapes), a top-left light gradient, and small expressive faces.
 * Textures are drawn at RES× and displayed at 1/RES scale.
 */
export const RES = 2;
export const ART_SCALE = 1 / RES;

type Ctx = CanvasRenderingContext2D;
const INK = css(PAL.ink);

function sheet(scene: Phaser.Scene, key: string, w: number, h: number, frames: number, draw: (g: Ctx, f: number) => void) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, Math.ceil(w * RES * frames), Math.ceil(h * RES))!;
  const g = tex.context;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  for (let f = 0; f < frames; f++) {
    g.save();
    g.translate(f * w * RES, 0);
    g.scale(RES, RES);
    draw(g, f);
    g.restore();
    tex.add(f, 0, f * w * RES, 0, w * RES, h * RES);
  }
  tex.refresh();
}

const circle = (x: number, y: number, r: number) => {
  const p = new Path2D();
  p.arc(x, y, r, 0, Math.PI * 2);
  return p;
};
const ellipse = (x: number, y: number, rx: number, ry: number, rot = 0) => {
  const p = new Path2D();
  p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  return p;
};
const rrect = (x: number, y: number, w: number, h: number, r: number) => {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
};

/** Gradient from a light top-left to a dark bottom-right across a box. */
function shade(g: Ctx, x: number, y: number, w: number, h: number, light: string, mid: string, dark: string) {
  const gr = g.createLinearGradient(x, y, x + w * 0.6, y + h);
  gr.addColorStop(0, light);
  gr.addColorStop(0.45, mid);
  gr.addColorStop(1, dark);
  return gr;
}

/** Union sticker: ink-stroke every shape, then fill every shape on top. */
function blob(g: Ctx, shapes: Path2D[], fill: string | CanvasGradient, lw = 3.2) {
  g.strokeStyle = INK;
  g.lineWidth = lw;
  for (const p of shapes) g.stroke(p);
  g.fillStyle = fill;
  for (const p of shapes) g.fill(p);
}

function line(g: Ctx, pts: number[], color: string, lw: number) {
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.stroke();
}

/** A limb drawn as an ink line with a coloured core. */
function limb(g: Ctx, pts: number[], color: string, lw = 3.4) {
  line(g, pts, INK, lw + 2.4);
  line(g, pts, color, lw);
}

function eye(g: Ctx, x: number, y: number, r: number, px: number, py: number, pr = r * 0.45) {
  g.fillStyle = INK;
  g.beginPath();
  g.arc(x, y, r + 1.1, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = INK;
  g.beginPath();
  g.arc(x + px, y + py, pr, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.9)';
  g.beginPath();
  g.arc(x + px - pr * 0.35, y + py - pr * 0.35, pr * 0.3, 0, Math.PI * 2);
  g.fill();
}

function highlight(g: Ctx, x: number, y: number, rx: number, ry: number, rot = -0.6, a = 0.45) {
  g.fillStyle = `rgba(255,255,255,${a})`;
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  g.fill();
}

function radial(g: Ctx, x: number, y: number, r: number, stops: Array<[number, string]>) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

// ── Enemies ────────────────────────────────────────────────────────────────────

function smoothbrain(g: Ctx, f: number) {
  const s = f === 0 ? 0 : 1;
  limb(g, [15, 29, 13 + s * 3, 36], '#e0408f', 2.6);
  limb(g, [25, 29, 27 - s * 3, 36], '#e0408f', 2.6);
  const shapes = [circle(12, 18, 8.5), circle(20, 13, 9.5), circle(28, 18, 8.5), ellipse(20, 22, 14.5, 9.5)];
  blob(g, shapes, shade(g, 6, 4, 30, 28, '#ffc2e0', '#ff7fbf', '#d63384'));
  // the one (1) fold
  g.strokeStyle = 'rgba(150,20,80,.55)';
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(20, 6);
  g.bezierCurveTo(17, 11, 23, 14, 20, 19);
  g.stroke();
  highlight(g, 13, 12, 5, 2.6);
  eye(g, 14, 21, 4.4, f === 0 ? -1.4 : 1, 1.2);
  eye(g, 25.5, 20, 5.4, f === 0 ? 1.6 : -1.2, -1.4);
  // drool
  g.fillStyle = '#9ff3ff';
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(19, 28.5 + s * 0.8, 1.6, 2.4, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
}

function speedrunner(g: Ctx, f: number) {
  const lime = '#b9ff3a';
  // legs mid stride
  if (f === 0) {
    limb(g, [18, 26, 11, 31, 8, 36], '#79c21a');
    limb(g, [20, 26, 26, 32, 31, 33], '#79c21a');
  } else {
    limb(g, [18, 26, 15, 33, 18, 37], '#79c21a');
    limb(g, [20, 26, 22, 30, 15, 31], '#79c21a');
  }
  // arms streaming back
  limb(g, [24, 17, 13, 19, 4, 21], lime, 2.8);
  limb(g, [23, 19, 12, 24, 5, 27], '#79c21a', 2.6);
  const body = new Path2D();
  body.ellipse(21, 21, 6.5, 9.5, 0.9, 0, Math.PI * 2);
  blob(g, [body, circle(29, 12, 7)], shade(g, 14, 4, 22, 26, '#efffb5', lime, '#5d9e10'));
  // headband + tails
  line(g, [22.5, 10.5, 35.5, 9.5], INK, 4.2);
  line(g, [22.5, 10.5, 35.5, 9.5], css(PAL.magenta), 2.4);
  limb(g, [23, 10.5, 15, 6 + f * 2, 10, 8 + f], css(PAL.magenta), 1.8);
  eye(g, 31.5, 13, 2.8, 1.2, 0.2, 1.4);
  line(g, [28, 17.5, 33, 17], INK, 1.3);
  highlight(g, 25, 8.5, 3, 1.6);
}

function flamePath(f: number) {
  const w = [0, 1.8, -1.6][f % 3];
  const p = new Path2D();
  p.moveTo(20, 41);
  p.bezierCurveTo(7, 41, 4, 30, 7, 22);
  p.bezierCurveTo(8, 17, 10 + w, 13, 9 + w, 6);
  p.bezierCurveTo(14, 10, 15, 13, 16, 14);
  p.bezierCurveTo(16, 8, 19 - w, 4, 21 - w, 1);
  p.bezierCurveTo(23, 7, 24, 10, 25, 13);
  p.bezierCurveTo(27, 10, 30 + w, 8, 32 + w, 5);
  p.bezierCurveTo(33, 12, 36, 18, 34, 26);
  p.bezierCurveTo(35, 34, 30, 41, 20, 41);
  p.closePath();
  return p;
}

function hottake(g: Ctx, f: number) {
  const charging = f === 2;
  const gr = g.createLinearGradient(20, 41, 20, 2);
  gr.addColorStop(0, '#ffe066');
  gr.addColorStop(0.45, '#ff8a2a');
  gr.addColorStop(1, '#e8283a');
  blob(g, [flamePath(f)], gr, 3.2);
  // mouth
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(20, 29, 8.5, charging ? 7.5 : 5.5, 0, 0, Math.PI * 2);
  g.fill();
  if (charging) radial(g, 20, 29.5, 7, [[0, '#ffffff'], [0.4, '#fff3a0'], [1, 'rgba(255,120,40,0)']]);
  g.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.moveTo(14 + i * 3.6, 25 - (charging ? 1.5 : 0));
    g.lineTo(15.8 + i * 3.6, 28 - (charging ? 1.5 : 0));
    g.lineTo(17.4 + i * 3.6, 25 - (charging ? 1.5 : 0));
    g.fill();
  }
  eye(g, 14, 19, 3.4, 1, 0.8, 1.7);
  eye(g, 26, 19, 3.4, -1, 0.8, 1.7);
  line(g, [10, 14.5, 17, 17], INK, 2);
  line(g, [30, 14.5, 23, 17], INK, 2);
}

function unit(g: Ctx, f: number) {
  const purple = '#9a6bff';
  const up = f === 1;
  limb(g, [30, 70, 28, 77], '#4b2499', 6);
  limb(g, [50, 70, 52, 77], '#4b2499', 6);
  // arms
  if (up) {
    limb(g, [16, 40, 8, 26, 12, 14], purple, 7);
    limb(g, [64, 40, 72, 26, 68, 14], purple, 7);
  } else {
    limb(g, [16, 40, 9, 52, 12, 62], purple, 7);
    limb(g, [64, 40, 71, 52, 68, 62], purple, 7);
  }
  const body = rrect(13, 24, 54, 50, 16);
  blob(g, [body, circle(40, 20, 9.5)], shade(g, 13, 10, 54, 64, '#d6c2ff', purple, '#4a1fb0'), 3.6);
  // belly
  g.fillStyle = 'rgba(255,255,255,.16)';
  g.beginPath();
  g.ellipse(40, 54, 17, 13, 0, 0, Math.PI * 2);
  g.fill();
  highlight(g, 22, 33, 6, 3.4);
  // tiny furious face
  eye(g, 36.5, 20, 2.3, 0.6, 0.6, 1.3);
  eye(g, 43.5, 20, 2.3, -0.6, 0.6, 1.3);
  line(g, [33, 16, 39, 18], INK, 1.8);
  line(g, [47, 16, 41, 18], INK, 1.8);
  line(g, [37, 25, 43, 25], INK, 1.4);
  // chest scar mark
  line(g, [30, 40, 36, 46], 'rgba(30,8,60,.5)', 1.6);
  line(g, [36, 40, 30, 46], 'rgba(30,8,60,.5)', 1.6);
  if (up) radial(g, 40, 60, 10, [[0, 'rgba(255,200,120,.55)'], [1, 'rgba(255,120,60,0)']]);
}

function bubble(g: Ctx, f: number, s: number) {
  g.save();
  g.scale(s, s);
  const st = f === 0 ? 0 : 1;
  limb(g, [17, 32, 15 - st * 2, 39], '#129cc0', 2.4);
  limb(g, [27, 32, 29 + st * 2, 39], '#129cc0', 2.4);
  const b = rrect(5, 6, 34, 26, 11);
  const tail = new Path2D();
  tail.moveTo(10, 28);
  tail.lineTo(5, 38);
  tail.lineTo(18, 30);
  tail.closePath();
  blob(g, [b, tail], shade(g, 5, 6, 34, 30, '#d4fbff', '#5ae9ff', '#0f9fc2'));
  highlight(g, 13, 11, 5, 2.2);
  // smug half-lidded eyes
  for (const x of [16, 28]) {
    g.fillStyle = '#fff';
    g.beginPath();
    g.ellipse(x, 18, 4, 3.4, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = INK;
    g.beginPath();
    g.arc(x + 1, 19, 1.7, 0, Math.PI * 2);
    g.fill();
    line(g, [x - 4.5, 16.5, x + 4.5, 16.5], INK, 2);
  }
  // smirk
  g.strokeStyle = INK;
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(17, 25);
  g.quadraticCurveTo(23, 28, 27, 23.5);
  g.stroke();
  g.restore();
}

function copypasta(g: Ctx, f: number) {
  const w = f === 0 ? 0 : 2.5;
  const p = new Path2D();
  p.moveTo(9, 30);
  p.bezierCurveTo(9, 10, 43, 10, 43, 30);
  p.lineTo(43, 46);
  p.quadraticCurveTo(39, 51 - w, 35, 46);
  p.quadraticCurveTo(31, 41 + w, 26, 47);
  p.quadraticCurveTo(21, 52 - w, 17, 46);
  p.quadraticCurveTo(13, 41 + w, 9, 47);
  p.closePath();
  blob(g, [p], shade(g, 9, 12, 34, 40, '#fffaf0', '#ffe2a8', '#d9a85a'));
  // noodle squiggles
  g.strokeStyle = 'rgba(190,130,50,.6)';
  g.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.moveTo(14 + i * 9, 34);
    g.bezierCurveTo(16 + i * 9, 30, 18 + i * 9, 40, 20 + i * 9, 35);
    g.stroke();
  }
  highlight(g, 18, 20, 5, 2.6);
  // [ o ] [ o ] eyes
  for (const x of [20, 32]) {
    line(g, [x - 4, 21, x - 5.5, 21, x - 5.5, 29, x - 4, 29], INK, 1.8);
    line(g, [x + 4, 21, x + 5.5, 21, x + 5.5, 29, x + 4, 29], INK, 1.8);
    g.fillStyle = INK;
    g.beginPath();
    g.arc(x, 25, 1.9, 0, Math.PI * 2);
    g.fill();
  }
  // selection box with marching ants
  g.setLineDash([3, 3]);
  g.lineDashOffset = f * 3;
  g.strokeStyle = css(PAL.cyan);
  g.lineWidth = 1.3;
  g.strokeRect(3, 7, 46, 47);
  g.setLineDash([]);
  g.fillStyle = css(PAL.cyan);
  for (const [x, y] of [[3, 7], [49, 7], [3, 54], [49, 54]]) g.fillRect(x - 1.8, y - 1.8, 3.6, 3.6);
}

function crown(g: Ctx) {
  const p = new Path2D();
  p.moveTo(3, 18);
  p.lineTo(3, 7);
  p.lineTo(9, 12);
  p.lineTo(14, 3);
  p.lineTo(19, 12);
  p.lineTo(25, 7);
  p.lineTo(25, 18);
  p.closePath();
  blob(g, [p], shade(g, 3, 3, 22, 15, '#fff4c2', '#ffc84a', '#d48a12'), 2.6);
  for (const x of [8, 14, 20]) {
    g.fillStyle = css(PAL.magenta);
    g.beginPath();
    g.arc(x, 14.5, 1.7, 0, Math.PI * 2);
    g.fill();
  }
}

// ── Players ────────────────────────────────────────────────────────────────────

interface Look {
  skin: string;
  top: [string, string, string];
  legs: string;
  face: (g: Ctx, f: number) => void;
  hair?: (g: Ctx) => void;
  extra?: (g: Ctx, f: number) => void;
  broad?: boolean;
}

function person(g: Ctx, f: number, look: Look) {
  const st = f === 0 ? 0 : 1;
  limb(g, [18, 40, 17 - st * 2, 48], look.legs, 3.6);
  limb(g, [26, 40, 27 + st * 2, 48], look.legs, 3.6);
  const tw = look.broad ? 24 : 18;
  const torso = rrect(22 - tw / 2, 27, tw, 16, 6);
  const head = circle(22, 18, 11.5);
  blob(g, [torso, head], look.top[1], 3.2);
  // re-fill torso and head with proper gradients (keeping the union outline)
  g.fillStyle = shade(g, 22 - tw / 2, 27, tw, 16, look.top[0], look.top[1], look.top[2]);
  g.fill(torso);
  g.fillStyle = shade(g, 10, 6, 24, 24, '#ffffff', look.skin, look.skin);
  g.fill(head);
  look.hair?.(g);
  look.face(g, f);
  highlight(g, 16, 12, 4, 2.2, -0.6, 0.35);
  look.extra?.(g, f);
}

const LOOKS: Record<string, Look> = {
  p_npc: {
    skin: '#c9d0e6', top: ['#b5f6ff', '#2fc7e8', '#14708f'], legs: '#2a3550',
    face: (g, f) => {
      g.fillStyle = css(PAL.cyan);
      g.shadowColor = css(PAL.cyan);
      g.shadowBlur = 4;
      const h = f === 1 ? 1.2 : 4.4; // blink frame
      g.fillRect(15.5, 17 - h / 2, 4, h);
      g.fillRect(24.5, 17 - h / 2, 4, h);
      g.shadowBlur = 0;
      line(g, [18.5, 24, 25.5, 24], INK, 1.4);
    },
    extra: (g) => {
      g.fillStyle = 'rgba(10,30,50,.65)';
      g.font = '800 5px "Unbounded Variable", sans-serif';
      g.textAlign = 'center';
      g.fillText('404', 22, 37.5);
    },
  },
  p_gymbro: {
    skin: '#f0b48a', top: ['#ffc0e0', '#ff4fa3', '#a3135c'], legs: '#3a1d40', broad: true,
    face: (g) => {
      eye(g, 18, 18, 2.4, 0.6, 0.3, 1.3);
      eye(g, 26, 18, 2.4, 0.6, 0.3, 1.3);
      line(g, [15.5, 14, 20, 15], INK, 1.6);
      line(g, [28.5, 14, 24, 15], INK, 1.6);
      g.strokeStyle = INK;
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(18.5, 23.5);
      g.quadraticCurveTo(23, 26, 26.5, 22.5);
      g.stroke();
    },
    hair: (g) => {
      line(g, [11, 13, 33, 13], INK, 4);
      line(g, [11, 13, 33, 13], css(PAL.cyan), 2.4);
    },
    extra: (g) => {
      // biceps
      for (const x of [9, 35]) {
        g.fillStyle = INK;
        g.beginPath();
        g.arc(x, 31, 5.4, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#f0b48a';
        g.beginPath();
        g.arc(x, 31, 4, 0, Math.PI * 2);
        g.fill();
      }
    },
  },
  p_gremlin: {
    skin: '#2a1648', top: ['#d7b8ff', '#8a4dff', '#3d1690'], legs: '#1d0f33',
    hair: (g) => {
      // hood with ears
      const hood = new Path2D();
      hood.moveTo(9, 22);
      hood.lineTo(7, 3);
      hood.lineTo(15, 9);
      hood.quadraticCurveTo(22, 5, 29, 9);
      hood.lineTo(37, 3);
      hood.lineTo(35, 22);
      hood.quadraticCurveTo(22, 12, 9, 22);
      hood.closePath();
      g.strokeStyle = INK;
      g.lineWidth = 2.6;
      g.stroke(hood);
      g.fillStyle = shade(g, 7, 3, 30, 20, '#d7b8ff', '#8a4dff', '#3d1690');
      g.fill(hood);
    },
    face: (g, f) => {
      for (const x of [17, 27]) {
        g.fillStyle = '#ffe14a';
        g.shadowColor = '#ffe14a';
        g.shadowBlur = 3;
        g.beginPath();
        g.ellipse(x, 19, 3.6, f === 1 ? 0.8 : 3.2, 0, 0, Math.PI * 2);
        g.fill();
        g.shadowBlur = 0;
        g.fillStyle = INK;
        g.fillRect(x - 0.6, 17, 1.2, 4);
      }
      // grin
      g.fillStyle = '#fff';
      g.beginPath();
      g.moveTo(16, 24);
      for (let i = 0; i <= 6; i++) g.lineTo(16 + i * 2, 24 + (i % 2 ? 2.4 : 0));
      g.lineTo(28, 24);
      g.fill();
    },
  },
  p_spillqueen: {
    skin: '#f3c19b', top: ['#ffd9f0', '#c04dff', '#5d158f'], legs: '#2e1240',
    hair: (g) => {
      g.strokeStyle = INK;
      g.lineWidth = 2.6;
      const h = new Path2D();
      h.arc(22, 16, 12.5, Math.PI * 1.02, Math.PI * 1.98);
      h.lineTo(34, 20);
      h.quadraticCurveTo(28, 12, 22, 12);
      h.quadraticCurveTo(15, 12, 10, 20);
      h.closePath();
      const bun = circle(22, 3.5, 5);
      g.stroke(h);
      g.stroke(bun);
      g.fillStyle = shade(g, 9, 0, 26, 20, '#ffe3a3', '#ffb547', '#c06a12');
      g.fill(h);
      g.fill(bun);
    },
    face: (g, f) => {
      if (f === 1) {
        line(g, [16, 19, 20, 19], INK, 1.4);
        line(g, [24, 19, 28, 19], INK, 1.4);
      } else {
        eye(g, 18, 19, 2.6, 1, 0, 1.4);
        eye(g, 26, 19, 2.6, 1, 0, 1.4);
      }
      g.fillStyle = '#d6336c';
      g.beginPath();
      g.ellipse(22, 24.5, 2.2, 1.3, 0, 0, Math.PI * 2);
      g.fill();
    },
    extra: (g) => {
      // teacup
      const cup = rrect(31, 30, 9, 7, 2.5);
      blob(g, [cup], '#ffffff', 2.2);
      g.fillStyle = '#b5651d';
      g.fillRect(32, 31, 7, 2.2);
      line(g, [33, 28, 34, 25], 'rgba(255,255,255,.7)', 1);
      line(g, [37, 28, 38, 24.5], 'rgba(255,255,255,.7)', 1);
    },
  },
};

// ── Bosses ─────────────────────────────────────────────────────────────────────

function doomHead(g: Ctx, f: number) {
  // drawn facing up; rotated in-game to the movement direction
  radial(g, 48, 48, 46, [[0, 'rgba(255,45,85,.35)'], [1, 'rgba(255,45,85,0)']]);
  const body = rrect(20, 8, 56, 82, 13);
  blob(g, [body], shade(g, 20, 8, 56, 82, '#4a2a6a', '#1b0f2e', '#0c0618'), 4);
  const gr = g.createLinearGradient(25, 18, 70, 82);
  gr.addColorStop(0, '#ff6680');
  gr.addColorStop(1, '#7a0a3a');
  g.fillStyle = gr;
  g.beginPath();
  g.roundRect(25, 18, 46, 64, 6);
  g.fill();
  g.fillStyle = INK;
  g.beginPath();
  g.roundRect(40, 10, 16, 4, 2);
  g.fill();
  // angry face (looking "forward" = up)
  const look = f === 1 ? 2 : 0;
  for (const [x, dir] of [[38, 1], [58, -1]] as const) {
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(x - 7 * dir, 36);
    g.lineTo(x + 6 * dir, 40);
    g.lineTo(x - 6 * dir, 46);
    g.closePath();
    g.fill();
    g.fillStyle = INK;
    g.beginPath();
    g.arc(x - dir * 1.5, 41 - look, 2.4, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = INK;
  g.beginPath();
  g.moveTo(32, 58);
  for (let i = 0; i <= 8; i++) g.lineTo(32 + i * 4, 58 + (i % 2 ? 9 : 2) + (f === 1 ? 2 : 0));
  g.lineTo(64, 58);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.25)';
  g.fillRect(28, 21, 3, 26);
}

function doomSegment(g: Ctx, f: number) {
  const body = rrect(16, 6, 40, 60, 9);
  blob(g, [body], shade(g, 16, 6, 40, 60, '#4a2a6a', '#1f1236', '#0c0618'), 3.4);
  g.fillStyle = f === 0 ? '#2b1452' : '#3a1240';
  g.beginPath();
  g.roundRect(20, 12, 32, 48, 4);
  g.fill();
  // feed: thumbnail + text lines
  g.fillStyle = f === 0 ? css(PAL.magenta) : css(PAL.violet);
  g.fillRect(23, 15, 26, 14);
  g.fillStyle = 'rgba(255,255,255,.55)';
  for (let i = 0; i < 4; i++) g.fillRect(23, 33 + i * 6, i === 3 ? 14 : 26, 2.6);
  g.fillStyle = css(PAL.cyan);
  g.beginPath();
  g.arc(27, 22, 3, 0, Math.PI * 2);
  g.fill();
}

function algorithm(g: Ctx) {
  radial(g, 100, 82, 96, [[0, 'rgba(255,63,164,.32)'], [0.6, 'rgba(123,61,255,.14)'], [1, 'rgba(123,61,255,0)']]);
  const tri = new Path2D();
  tri.moveTo(100, 180);
  tri.quadraticCurveTo(96, 178, 94, 174);
  tri.lineTo(14, 30);
  tri.quadraticCurveTo(10, 20, 22, 20);
  tri.lineTo(178, 20);
  tri.quadraticCurveTo(190, 20, 186, 30);
  tri.lineTo(106, 174);
  tri.quadraticCurveTo(104, 178, 100, 180);
  tri.closePath();
  g.strokeStyle = INK;
  g.lineWidth = 7;
  g.stroke(tri);
  g.fillStyle = shade(g, 14, 20, 172, 160, '#3a1a6a', '#170b2c', '#08040f');
  g.fill(tri);
  g.save();
  g.clip(tri);
  g.fillStyle = 'rgba(255,255,255,.04)';
  for (let y = 22; y < 180; y += 4) g.fillRect(0, y, 200, 1.4);
  g.restore();
  g.strokeStyle = css(PAL.magenta);
  g.lineWidth = 2.5;
  g.shadowColor = css(PAL.magenta);
  g.shadowBlur = 8;
  g.stroke(tri);
  g.shadowBlur = 0;
  // sclera
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(100, 76, 56, 36, 0, 0, Math.PI * 2);
  g.fill();
  const sg = g.createRadialGradient(100, 76, 10, 100, 76, 54);
  sg.addColorStop(0, '#ffffff');
  sg.addColorStop(0.8, '#ffd6ec');
  sg.addColorStop(1, '#ff7cc0');
  g.fillStyle = sg;
  g.beginPath();
  g.ellipse(100, 76, 52, 32, 0, 0, Math.PI * 2);
  g.fill();
  // veins
  g.strokeStyle = 'rgba(220,30,90,.55)';
  g.lineWidth = 1.2;
  for (const [x, y, dx, dy] of [[52, 72, 14, 4], [148, 80, -14, -3], [62, 96, 12, -8], [140, 58, -10, 8]]) {
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + dx * 0.6, y + dy * 1.6, x + dx, y + dy);
    g.stroke();
  }
  // signal bars on the forehead
  g.fillStyle = css(PAL.cyan);
  for (let i = 0; i < 4; i++) g.fillRect(84 + i * 9, 34 - i * 3, 6, 6 + i * 3);
}

function algorithmIris(g: Ctx, f: number) {
  const hot = f === 1;
  const gr = g.createRadialGradient(24, 24, 2, 24, 24, 22);
  gr.addColorStop(0, hot ? '#ffef66' : '#d8ffff');
  gr.addColorStop(0.45, hot ? '#ff5a2e' : css(PAL.cyan));
  gr.addColorStop(1, hot ? '#7a0a1a' : '#3a1a9a');
  g.fillStyle = INK;
  g.beginPath();
  g.arc(24, 24, 23, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = gr;
  g.beginPath();
  g.arc(24, 24, 21, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(24, 24, hot ? 3.5 : 7, 11, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.85)';
  g.beginPath();
  g.arc(17, 16, 4, 0, Math.PI * 2);
  g.fill();
}

// ── Projectiles, pickups, FX ───────────────────────────────────────────────────

function glowCapsule(g: Ctx, w: number, h: number, core: string, glow: string) {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, glow);
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.save();
  g.scale(1, h / w);
  g.fillStyle = gr;
  g.beginPath();
  g.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.fillStyle = core;
  g.beginPath();
  g.roundRect(w * 0.18, h * 0.32, w * 0.64, h * 0.36, h * 0.18);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.roundRect(w * 0.4, h * 0.4, w * 0.42, h * 0.2, h * 0.1);
  g.fill();
}

function spinner(g: Ctx) {
  const shapes: Path2D[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    shapes.push(circle(20 + Math.cos(a) * 11, 20 + Math.sin(a) * 11, 6.5));
  }
  const hub = new Path2D();
  hub.moveTo(20 + Math.cos(-Math.PI / 2) * 11, 20 + Math.sin(-Math.PI / 2) * 11);
  for (let i = 1; i <= 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    hub.lineTo(20 + Math.cos(a) * 11, 20 + Math.sin(a) * 11);
  }
  hub.closePath();
  shapes.push(hub);
  blob(g, shapes, shade(g, 6, 6, 28, 28, '#e8fdff', css(PAL.cyan), '#1a7fa6'), 3);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    g.fillStyle = '#123';
    g.beginPath();
    g.arc(20 + Math.cos(a) * 11, 20 + Math.sin(a) * 11, 2.6, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(20, 20, 4.2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = css(PAL.magenta);
  g.beginPath();
  g.arc(20, 20, 2.2, 0, Math.PI * 2);
  g.fill();
}

function enemyBullet(g: Ctx) {
  radial(g, 13, 13, 13, [[0, 'rgba(255,210,120,.9)'], [0.55, 'rgba(255,90,46,.55)'], [1, 'rgba(255,45,85,0)']]);
  g.fillStyle = INK;
  g.beginPath();
  g.arc(13, 13, 6.8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ff5a2e';
  g.beginPath();
  g.arc(13, 13, 5.4, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff2b0';
  g.beginPath();
  g.arc(12, 12, 2.8, 0, Math.PI * 2);
  g.fill();
}

function gem(g: Ctx, f: number) {
  const cols: Array<[string, string, string]> = [
    ['#d9fbff', css(PAL.cyan), '#127a9a'],
    ['#ffd2ec', css(PAL.magenta), '#8f0f55'],
    ['#fffbe8', '#ffe27a', '#d4890f'],
  ];
  const [l, m, d] = cols[f];
  radial(g, 10, 12, 10, [[0, m + '88'], [1, m + '00']]);
  const p = new Path2D();
  p.moveTo(10, 2);
  p.lineTo(17, 11);
  p.lineTo(10, 22);
  p.lineTo(3, 11);
  p.closePath();
  blob(g, [p], shade(g, 3, 2, 14, 20, l, m, d), 2);
  g.fillStyle = 'rgba(255,255,255,.75)';
  g.beginPath();
  g.moveTo(10, 4);
  g.lineTo(13, 10);
  g.lineTo(10, 11);
  g.closePath();
  g.fill();
}

function grassTuft(g: Ctx) {
  radial(g, 15, 18, 15, [[0, 'rgba(93,255,138,.45)'], [1, 'rgba(93,255,138,0)']]);
  const blades: Array<[number, number, number]> = [[8, 6, -3], [12, 3, -1], [15, 1, 0], [18, 3, 1], [22, 6, 3], [10, 9, -4], [20, 8, 4]];
  for (const [x, y, lean] of blades) {
    const p = new Path2D();
    p.moveTo(x - 2.5, 24);
    p.quadraticCurveTo(x + lean * 0.4, y + 8, x + lean, y);
    p.quadraticCurveTo(x + lean * 0.2 + 1.5, y + 9, x + 2.5, 24);
    p.closePath();
    blob(g, [p], shade(g, x - 3, y, 6, 24 - y, '#d8ffe0', '#5dff8a', '#1d9a48'), 1.6);
  }
  const base = ellipse(15, 24, 10, 3);
  blob(g, [base], '#3a2a1a', 1.6);
}

function router(g: Ctx) {
  radial(g, 15, 16, 15, [[0, 'rgba(123,61,255,.5)'], [1, 'rgba(123,61,255,0)']]);
  limb(g, [9, 14, 6, 4], '#c9b6ff', 1.6);
  limb(g, [21, 14, 24, 4], '#c9b6ff', 1.6);
  blob(g, [rrect(4, 13, 22, 11, 4)], shade(g, 4, 13, 22, 11, '#e2d6ff', '#7b3dff', '#3a1a78'), 2.2);
  for (let i = 0; i < 3; i++) {
    g.fillStyle = i === 0 ? css(PAL.cyan) : '#5dff8a';
    g.beginPath();
    g.arc(10 + i * 5, 18.5, 1.4, 0, Math.PI * 2);
    g.fill();
  }
}

function crate(g: Ctx, f: number) {
  radial(g, 20, 20, 20, [[0, 'rgba(255,200,74,.45)'], [1, 'rgba(255,200,74,0)']]);
  const lid = f === 1 ? -2 : 0;
  blob(g, [rrect(6, 14, 28, 18, 3), rrect(4, 9 + lid, 32, 7, 2.5)], '#6a2fd6', 2.8);
  g.fillStyle = shade(g, 6, 14, 28, 18, '#b48cff', '#6a2fd6', '#30107a');
  g.fill(rrect(6, 14, 28, 18, 3));
  g.fillStyle = '#ffc84a';
  g.fillRect(17, 9 + lid, 6, 23 - lid);
  g.fillStyle = INK;
  g.font = '900 9px "Unbounded Variable", sans-serif';
  g.textAlign = 'center';
  g.fillText('?', 20, 29);
}

function floorTile(g: Ctx) {
  const s = 256;
  g.fillStyle = css(PAL.floor);
  g.fillRect(0, 0, s, s);
  // subtle noise blotches
  for (let i = 0; i < 60; i++) {
    const x = (i * 97) % s, y = (i * 53 + i * i * 7) % s;
    g.fillStyle = `rgba(${i % 2 ? '123,61,255' : '62,230,255'},${0.012 + (i % 5) * 0.004})`;
    g.beginPath();
    g.arc(x, y, 8 + (i % 7) * 4, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(123,61,255,.20)';
  g.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    g.beginPath();
    g.moveTo(i * 64 + 0.5, 0);
    g.lineTo(i * 64 + 0.5, s);
    g.moveTo(0, i * 64 + 0.5);
    g.lineTo(s, i * 64 + 0.5);
    g.stroke();
  }
  g.strokeStyle = 'rgba(62,230,255,.10)';
  for (let i = 0; i < 16; i++) {
    g.beginPath();
    g.moveTo(i * 16 + 0.5, 0);
    g.lineTo(i * 16 + 0.5, s);
    g.moveTo(0, i * 16 + 0.5);
    g.lineTo(s, i * 16 + 0.5);
    g.stroke();
  }
  // intersections
  g.fillStyle = 'rgba(62,230,255,.35)';
  for (let x = 0; x <= 4; x++) for (let y = 0; y <= 4; y++) g.fillRect(x * 64 - 1, y * 64 - 1, 3, 3);
}

function voidTile(g: Ctx) {
  const s = 512;
  g.fillStyle = css(PAL.void);
  g.fillRect(0, 0, s, s);
  // distant floating shards (the rest of the dead feed, far below)
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) {
    const x = rnd() * s, y = rnd() * s, r = 6 + rnd() * 26;
    g.fillStyle = `rgba(${rnd() > 0.5 ? '58,26,120' : '30,14,60'},${0.5 + rnd() * 0.4})`;
    g.beginPath();
    g.moveTo(x, y - r);
    g.lineTo(x + r * 0.8, y);
    g.lineTo(x, y + r * 0.5);
    g.lineTo(x - r * 0.9, y + r * 0.1);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(123,61,255,.35)';
    g.lineWidth = 1;
    g.stroke();
  }
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(200,180,255,${0.15 + rnd() * 0.4})`;
    g.fillRect(rnd() * s, rnd() * s, 1.4, 1.4);
  }
}

function decal(g: Ctx, f: number) {
  g.strokeStyle = f % 2 ? 'rgba(62,230,255,.22)' : 'rgba(255,63,164,.2)';
  g.fillStyle = g.strokeStyle;
  g.lineWidth = 2.4;
  const c = 32;
  switch (f) {
    case 0: // heart-ish like
      g.beginPath();
      g.moveTo(c, 46);
      g.bezierCurveTo(10, 30, 18, 12, c, 24);
      g.bezierCurveTo(46, 12, 54, 30, c, 46);
      g.stroke();
      break;
    case 1: // play
      g.beginPath();
      g.moveTo(22, 16);
      g.lineTo(46, 32);
      g.lineTo(22, 48);
      g.closePath();
      g.stroke();
      break;
    case 2: // hashtag
      for (const o of [-7, 7]) {
        line(g, [c + o + 3, 14, c + o - 3, 50], g.strokeStyle as string, 2.4);
        line(g, [14, c + o, 50, c + o], g.strokeStyle as string, 2.4);
      }
      break;
    case 3: // cracks
      line(g, [8, 30, 22, 26, 30, 36, 44, 30, 58, 38], g.strokeStyle as string, 1.6);
      line(g, [30, 36, 28, 50], g.strokeStyle as string, 1.4);
      break;
    case 4: // +1
      g.font = '800 26px "Unbounded Variable", sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('+1', c, c + 2);
      break;
    default: // signal bars
      for (let i = 0; i < 4; i++) g.strokeRect(14 + i * 10, 44 - i * 8, 6, 8 + i * 8);
  }
}

function grassPatch(g: Ctx) {
  const c = 80;
  radial(g, c, c, 80, [[0, 'rgba(93,255,138,.5)'], [0.7, 'rgba(93,255,138,.22)'], [1, 'rgba(93,255,138,0)']]);
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 58;
    const x = c + Math.cos(a) * d, y = c + Math.sin(a) * d;
    const h = 7 + rnd() * 9;
    g.strokeStyle = rnd() > 0.5 ? '#5dff8a' : '#b6ffc8';
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(x, y + h / 2);
    g.quadraticCurveTo(x + 1, y, x + (rnd() - 0.5) * 6, y - h / 2);
    g.stroke();
  }
  g.strokeStyle = 'rgba(200,255,215,.85)';
  g.lineWidth = 2;
  g.setLineDash([6, 5]);
  g.beginPath();
  g.arc(c, c, 66, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
}

/** Bitmap font for damage numbers (Phaser BitmapText is far cheaper than Text objects). */
export const DMG_FONT = { key: 'dmgfont', chars: '0123456789!+-xK.', w: 24, h: 30 };

function dmgFont(scene: Phaser.Scene) {
  const { key, chars, w, h } = DMG_FONT;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w * chars.length, h)!;
  const g = tex.context;
  g.font = '800 22px "Unbounded Variable", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  for (let i = 0; i < chars.length; i++) {
    g.strokeStyle = INK;
    g.lineWidth = 5;
    g.strokeText(chars[i], i * w + w / 2, h / 2 + 1);
    g.fillStyle = '#fff';
    g.fillText(chars[i], i * w + w / 2, h / 2 + 1);
  }
  tex.refresh();
  const data = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: key, width: w, height: h, chars, charsPerRow: chars.length,
    'spacing.x': 0, 'spacing.y': 0, 'offset.x': 0, 'offset.y': 0, lineSpacing: 0,
  });
  scene.cache.bitmapFont.add(key, data);
}

export function generateTextures(scene: Phaser.Scene): void {
  sheet(scene, 'e_smoothbrain', 40, 40, 2, smoothbrain);
  sheet(scene, 'e_speedrunner', 40, 40, 2, speedrunner);
  sheet(scene, 'e_hottake', 40, 44, 3, hottake);
  sheet(scene, 'e_unit', 80, 80, 2, unit);
  sheet(scene, 'e_ratio', 44, 44, 2, (g, f) => bubble(g, f, 1));
  sheet(scene, 'e_ratiolet', 28, 28, 2, (g, f) => bubble(g, f, 0.64));
  sheet(scene, 'e_copypasta', 52, 58, 2, copypasta);
  sheet(scene, 'crown', 28, 21, 1, crown);
  for (const key of Object.keys(LOOKS)) sheet(scene, key, 44, 52, 2, (g, f) => person(g, f, LOOKS[key]));
  sheet(scene, 'b_doomhead', 96, 96, 2, doomHead);
  sheet(scene, 'b_doomseg', 72, 72, 2, doomSegment);
  sheet(scene, 'b_algo', 200, 190, 1, algorithm);
  sheet(scene, 'b_algo_iris', 48, 48, 2, algorithmIris);

  sheet(scene, 'bolt', 36, 14, 1, (g) => glowCapsule(g, 36, 14, css(PAL.cyan), 'rgba(62,230,255,.55)'));
  sheet(scene, 'bolt_gold', 36, 14, 1, (g) => glowCapsule(g, 36, 14, '#ffd75a', 'rgba(255,200,74,.6)'));
  sheet(scene, 'missile', 26, 14, 1, (g) => glowCapsule(g, 26, 14, css(PAL.magenta), 'rgba(255,63,164,.6)'));
  sheet(scene, 'blade', 40, 40, 1, spinner);
  sheet(scene, 'ebullet', 26, 26, 1, enemyBullet);
  sheet(scene, 'glow', 64, 64, 1, (g) => radial(g, 32, 32, 32, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]));
  sheet(scene, 'ring', 128, 128, 1, (g) => {
    g.strokeStyle = 'rgba(255,255,255,.35)';
    g.lineWidth = 9;
    g.beginPath();
    g.arc(64, 64, 58, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = '#fff';
    g.lineWidth = 3;
    g.stroke();
  });
  sheet(scene, 'spark', 18, 6, 1, (g) => glowCapsule(g, 18, 6, '#fff', 'rgba(255,255,255,.6)'));
  sheet(scene, 'shard', 12, 12, 1, (g) => {
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(6, 0);
    g.lineTo(12, 10);
    g.lineTo(1, 12);
    g.closePath();
    g.fill();
  });
  sheet(scene, 'dot', 8, 8, 1, (g) => radial(g, 4, 4, 4, [[0, '#fff'], [0.6, 'rgba(255,255,255,.9)'], [1, 'rgba(255,255,255,0)']]));
  sheet(scene, 'puddle', 128, 128, 1, (g) => {
    radial(g, 64, 64, 64, [[0, 'rgba(255,190,90,.55)'], [0.65, 'rgba(200,110,30,.5)'], [0.85, 'rgba(255,170,60,.65)'], [1, 'rgba(255,170,60,0)']]);
    g.fillStyle = 'rgba(255,240,200,.6)';
    for (const [x, y, r] of [[44, 50, 5], [80, 72, 4], [62, 88, 3], [86, 44, 3.4], [50, 78, 2.6]]) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  });
  sheet(scene, 'gem', 20, 24, 3, gem);
  sheet(scene, 'grass', 30, 28, 1, grassTuft);
  sheet(scene, 'router', 30, 28, 1, router);
  sheet(scene, 'crate', 40, 36, 2, crate);
  sheet(scene, 'shadow', 48, 18, 1, (g) => {
    g.save();
    g.scale(1, 18 / 48);
    radial(g, 24, 24, 24, [[0, 'rgba(0,0,0,.55)'], [0.7, 'rgba(0,0,0,.3)'], [1, 'rgba(0,0,0,0)']]);
    g.restore();
  });
  sheet(scene, 'grasspatch', 160, 160, 1, grassPatch);
  sheet(scene, 'decal', 64, 64, 6, decal);
  // full-res tiles (no RES scaling needed — drawn once at 1x into larger canvases)
  for (const [key, size, fn] of [['floor', 256, floorTile], ['void', 512, voidTile]] as const) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const t = scene.textures.createCanvas(key, size, size)!;
    fn(t.context);
    t.refresh();
  }
  dmgFont(scene);
}
