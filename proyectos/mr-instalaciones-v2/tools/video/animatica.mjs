// Animática provisional de la secuencia de la portada.
//
// El vídeo cinematográfico definitivo no estaba en el entorno cuando se
// construyó la V2. Para poder montar y verificar de verdad el scrub, la
// sincronización del texto, el póster y el móvil, este script renderiza un
// recorrido de cámara de 12 s por el dibujo de sección de la V1 con las mismas
// cuatro estaciones que el vídeo: salón con aire acondicionado, zona técnica
// con aerotermia y calefacción, ventilación y fontanería. Sin texto en la imagen.
//
//   node tools/video/animatica.mjs     -> assets-src/video/animatica-provisional.mp4
//   node tools/video/prepare.mjs assets-src/video/animatica-provisional.mp4
//
// Cuando llegue el vídeo real se sustituye con prepare.mjs y esto queda como
// referencia de tiempos.
import { chromium } from '../../../../qa/node_modules/playwright-core/index.mjs';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { house } from '../../../mr-instalaciones/src/house.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const proj = resolve(here, '../..');
const outFile = join(proj, 'assets-src/video/animatica-provisional.mp4');
const frames = join(process.env.ANIMATICA_TMP || tmpdir(), 'mri-animatica');
const FPS = 25, DUR = 12, W = 1920, H = 1080;

rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });

// Equipo interior de aire acondicionado y su caudal, que el dibujo de la V1 no tiene.
// Encendido desde el primer fotograma: ese fotograma es el póster de la portada.
const split = `<g class="sys" data-sys="clima">
  <g class="nd"><rect x="472" y="449" width="104" height="25" rx="5"/><path d="M482 468h84"/></g>
  <path class="flow" d="M490 478c-8 26-34 40-70 46M520 478c-6 30-30 52-74 62M552 478c-4 34-22 60-62 76"/>
</g>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#101315;width:${W}px;height:${H}px;overflow:hidden}
.wrap{position:absolute;inset:0}
.wrap::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(120% 90% at 50% 45%, transparent 55%, rgb(0 0 0 / .55));}
svg{width:100%;height:100%;display:block}
.st-solid{fill:#2B3338}.st-wall,.st-roof,.st-thin,.st-ground{fill:none;stroke:#7C8890;stroke-linecap:round;stroke-linejoin:round}
.st-wall{stroke-width:1.6}.st-roof{stroke-width:3}.st-thin{stroke-width:1.3}.st-ground{stroke-width:2.2}
.st-hatch{stroke:rgb(150 162 170 / .22);stroke-width:1}.st-earth{opacity:.55}
.st-dim,.st-text{display:none}
.sys[data-sys=agua]{--c:#62AEDB}.sys[data-sys=saneamiento]{--c:#B5A28F}.sys[data-sys=calefaccion]{--c:#FF6500}
.sys[data-sys=aerotermia]{--c:#45C7A0}.sys[data-sys=ventilacion]{--c:#A9BDCB}.sys[data-sys=gas]{--c:#EDC03A}
.sys[data-sys=domotica]{--c:#EEF0EE}.sys[data-sys=clima]{--c:#9FD3F0}
.ln{fill:none;stroke:var(--c);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 1;stroke-dashoffset:calc(1 - var(--d,0))}
.ln--hot{stroke:#F08A7A;stroke-width:2.8}.ln--thick{stroke-width:6}.ln--thin{stroke-width:2.2}.ln--duct{stroke-width:12;stroke-linecap:butt}.ln--dot{stroke-width:3.2}
.nd *{fill:color-mix(in oklab,var(--c) 18%,transparent);stroke:var(--c);stroke-width:2.6;stroke-linejoin:round}
.nd path{fill:none}.nd{opacity:var(--n,0)}
.flow{fill:none;stroke:#9FD3F0;stroke-width:2.4;stroke-linecap:round;stroke-dasharray:7 11;opacity:var(--f,0)}
.glow{opacity:var(--g,0)}
</style></head><body><div class="wrap">
${house({ id: 'a', className: 'h' }).replace('</svg>', `${split}
<defs><radialGradient id="heat"><stop offset="0" stop-color="#FF6500" stop-opacity=".34"/><stop offset="1" stop-color="#FF6500" stop-opacity="0"/></radialGradient>
<radialGradient id="cool"><stop offset="0" stop-color="#62AEDB" stop-opacity=".30"/><stop offset="1" stop-color="#62AEDB" stop-opacity="0"/></radialGradient></defs>
<ellipse class="glow" data-glow="cool" cx="470" cy="530" rx="220" ry="110" fill="url(#cool)"/>
<ellipse class="glow" data-glow="heat" cx="600" cy="600" rx="380" ry="90" fill="url(#heat)"/>
</svg>`)}
</div><script>
const svg = document.querySelector('svg');
svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
// Cámara en unidades del dibujo: centro (x, y) y anchura visible.
const K = [
  [0.0, 450, 505, 660], [3.1, 470, 512, 420],
  [4.5, 930, 560, 560], [7.0, 955, 572, 430],
  [8.3, 590, 214, 600], [9.4, 600, 330, 760],
  [10.6, 620, 560, 820], [12.0, 640, 470, 1240],
];
const ease = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const ramp = (t, a, b) => Math.min(Math.max((t - a) / (b - a), 0), 1);
function cam(t) {
  let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const [ta, xa, ya, wa] = K[i], [tb, xb, yb, wb] = K[i + 1];
  const e = ease(ramp(t, ta, tb));
  return [xa + (xb - xa) * e, ya + (yb - ya) * e, wa + (wb - wa) * e];
}
const layer = (k) => svg.querySelector('[data-sys="' + k + '"]');
const draw = { clima: [-1, 0], aerotermia: [4.3, 5.4], calefaccion: [4.9, 6.6], ventilacion: [7.9, 9.1], agua: [9.5, 10.9], saneamiento: [10.0, 11.3], gas: [10.9, 11.6], domotica: [11.0, 11.8] };
window.frame = (t) => {
  const [x, y, w] = cam(t), h = w * ${H / W};
  svg.setAttribute('viewBox', (x - w / 2).toFixed(2) + ' ' + (y - h / 2).toFixed(2) + ' ' + w.toFixed(2) + ' ' + h.toFixed(2));
  for (const k in draw) {
    const g = layer(k); if (!g) continue;
    const d = ramp(t, draw[k][0], draw[k][1]);
    g.style.setProperty('--d', d.toFixed(4));
    g.style.setProperty('--n', ramp(t, draw[k][0] - .2, draw[k][0] + .3).toFixed(3));
  }
  const f = svg.querySelector('.flow');
  f.style.setProperty('--f', '1');
  f.style.strokeDashoffset = (-t * 26).toFixed(2);
  svg.querySelector('[data-glow="cool"]').style.setProperty('--g', ((.55 + .45 * ramp(t, 0, 2.2)) * (1 - ramp(t, 4.0, 4.6) * .6)).toFixed(3));
  svg.querySelector('[data-glow="heat"]').style.setProperty('--g', ramp(t, 5.4, 7.0).toFixed(3));
};
</script></body></html>`;

const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await b.newPage({ viewport: { width: W, height: H } });
await page.setContent(html);
const n = FPS * DUR;
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => window.frame(t), i / FPS);
  await page.screenshot({ path: join(frames, `f${String(i).padStart(4, '0')}.png`) });
}
await b.close();

mkdirSync(dirname(outFile), { recursive: true });
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(frames, 'f%04d.png'),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile]);
rmSync(frames, { recursive: true, force: true });
writeFileSync(join(proj, 'assets-src/video/animatica-provisional.txt'),
  `Animática provisional generada por tools/video/animatica.mjs (${n} fotogramas, ${FPS} fps, ${W}x${H}).\nNo es el vídeo definitivo: sustituir con tools/video/prepare.mjs <vídeo real>.\n`);
console.log('animática:', outFile);
