// Recorre la secuencia de la portada y el resto de la home y deja capturas
// reales, una por posición, más un informe JSON. Espera a que el cabezal del
// clip llegue a su destino antes de cada captura: un fotograma a medio lerp es
// un fotograma que la página nunca sostiene.
//
//   node proyectos/mr-instalaciones-v2/qa/film.mjs http://127.0.0.1:4510 qa/out/v2/desk
//   ... --w 390 --h 844 --mobile        móvil (táctil, DPR 2)
//   ... --reduced                       prefers-reduced-motion
//   ... --novideo                       el clip no llega (red bloqueada)
//   ... --nojs                          sin JavaScript
import { chromium } from '../../../qa/node_modules/playwright-core/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [base = 'http://127.0.0.1:4510', out = 'qa/out/v2'] = process.argv.slice(2).filter((a) => !a.startsWith('--') && !/^\d+$/.test(a));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes(k);
const W = +arg('--w', 1440), H = +arg('--h', 900);
mkdirSync(out, { recursive: true });

const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: flag('--mobile') ? 2 : 1,
  isMobile: flag('--mobile'), hasTouch: flag('--mobile'),
  reducedMotion: flag('--reduced') ? 'reduce' : 'no-preference',
  javaScriptEnabled: !flag('--nojs'),
});
if (flag('--novideo')) await ctx.route(/\/assets\/film\/.*\.(mp4|webm)/, (r) => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => { if (!flag('--novideo')) errors.push('requestfailed: ' + r.url() + ' ' + r.failure()?.errorText); });

const t0 = Date.now();
await page.goto(base + '/', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const firstPaint = await page.evaluate(() => performance.getEntriesByType('paint').map((p) => [p.name, Math.round(p.startTime)]));

const settle = async () => {
  await page.waitForTimeout(120);
  if (flag('--nojs')) return;
  await page.waitForFunction(() => {
    const sc = window.ScrollCraft && window.ScrollCraft.instances[0];
    const c = sc && sc.clips && sc.clips[0];
    if (!c || !c.ready) return true;
    return Math.abs(c.cur - c.target) < 0.002 && !c.el.seeking;
  }, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(160);
};

const state = () => page.evaluate(() => {
  const f = document.querySelector('[data-film]');
  const sc = window.ScrollCraft && window.ScrollCraft.instances[0];
  const c = sc && sc.clips && sc.clips[0];
  const v = f && f.querySelector('video');
  const caps = [...document.querySelectorAll('.cap')].map((el) => `${el.id.replace('escena-', '')}:${(+getComputedStyle(el).opacity).toFixed(2)}${el.classList.contains('is-on') ? '*' : ''}`);
  return {
    y: Math.round(scrollY),
    p: f ? f.style.getPropertyValue('--sc-p') : null,
    t: v && v.currentSrc ? +v.currentTime.toFixed(2) : null,
    painted: f ? f.classList.contains('sc-has-clip') : null,
    stills: f ? f.classList.contains('film--stills') : null,
    static: f ? f.classList.contains('film--static') : null,
    src: v ? (v.currentSrc ? (v.getAttribute('data-sc-src') || '').split('/').pop() : 'none') : null,
    scene: (document.querySelector('.film__rail li.is-on a') || {}).textContent || null,
    bar: document.querySelector('[data-bar]').className,
    caps,
  };
});

const filmBox = await page.evaluate(() => { const f = document.querySelector('[data-film]'); return { top: f.offsetTop, h: f.offsetHeight }; });
const travel = Math.max(filmBox.h - H, 1);
const stops = [];
const ps = flag('--reduced') || flag('--nojs') ? [0] : [0, 0.05, 0.1, 0.14, 0.22, 0.32, 0.45, 0.58, 0.7, 0.82, 0.92, 1];
for (const p of ps) stops.push([`film-p${String(Math.round(p * 100)).padStart(3, '0')}`, filmBox.top + p * travel]);
if (!flag('--reduced') && !flag('--nojs')) stops.push(['film-exit-50', filmBox.top + travel + H * 0.5]);
else stops.push(['film-static-1', H * 0.9], ['film-static-2', H * 1.8], ['film-static-3', H * 2.7]);
for (const id of ['servicios', 'habilitaciones', 'sectores', 'dudas', 'presupuesto']) {
  stops.push([`sec-${id}`, await page.evaluate((i) => { const el = document.getElementById(i); return el.getBoundingClientRect().top + scrollY; }, id)]);
}
const pan = await page.evaluate(() => { const el = document.getElementById('sectores'); return [el.getBoundingClientRect().top + scrollY, el.offsetHeight]; });
stops.push(['sec-sectores-mid', pan[0] + (pan[1] - H) * 0.6]);

const report = [];
for (const [name, y] of stops) {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), Math.round(y));
  await settle();
  const s = await state();
  await page.screenshot({ path: join(out, name + '.png') });
  report.push({ name, ...s });
  console.log(name.padEnd(18), JSON.stringify(s));
}

// Ida y vuelta: el clip debe volver atrás con el scroll.
let back = null;
if (!flag('--reduced') && !flag('--nojs') && !flag('--novideo')) {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), Math.round(filmBox.top + travel * 0.7));
  await settle();
  const fwd = await state();
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), Math.round(filmBox.top + travel * 0.3));
  await settle();
  const rev = await state();
  back = { forwardT: fwd.t, backT: rev.t, reversible: rev.t < fwd.t };
  console.log('reversible', JSON.stringify(back));
}

writeFileSync(join(out, 'report.json'), JSON.stringify({ base, W, H, flags: process.argv.slice(2).filter((a) => a.startsWith('--')), loadMs: Date.now() - t0, firstPaint, filmBox, back, errors, report }, null, 2));
console.log('errores de consola:', errors.length ? errors : 'ninguno');
await b.close();
