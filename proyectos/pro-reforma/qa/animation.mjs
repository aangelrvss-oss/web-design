// Pruebas de animación: scroll inverso, recarga a mitad del acto fijado y salto arriba.
// Uso: node qa/animation.mjs http://127.0.0.1:4700/
import { chromium } from '../../../qa/node_modules/playwright-core/index.mjs';
const URL = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const res = [];
const ok = (name, pass, info = '') => { res.push(pass); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  · ' + info : ''}`); };
const state = (page) => page.evaluate(() => {
  const f = document.querySelector('.phase__frame');
  const act = document.querySelector('#obra');
  return { s: f?.getAttribute('data-sc-verify-state') || '', p: act ? (+getComputedStyle(act).getPropertyValue('--sc-p') || +act.style.getPropertyValue('--sc-p') || 0) : null, top: act.getBoundingClientRect().top + scrollY, h: act.offsetHeight };
});
// Mismo estado visual: los números coinciden con un margen de 1 punto (porcentajes)
// o 0,005 (escala); el motor suaviza el avance y puede quedar a décimas del destino.
const same = (a, b) => { const na = a.match(/[\d.]+/g) || [], nb = b.match(/[\d.]+/g) || []; return na.length === nb.length && na.every((x, i) => Math.abs(x - nb[i]) <= (x.includes('.') && +x < 2 ? 0.005 : 1)); };
const step = async (page, y) => { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(450); return state(page); };
for (const [w, h, reduced] of [[1440, 900, false], [1440, 900, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  const tag = reduced ? 'reducido' : 'normal';
  const st0 = await state(page);
  const travel = st0.h - h;
  const ys = [0, .2, .3, .4, .55, .7, .85, 1].map((f) => Math.round(st0.top + travel * f));
  const down = []; for (const y of ys) down.push(await step(page, y));
  const up = []; for (const y of [...ys].reverse()) up.push(await step(page, y));
  up.reverse();
  ok(`${tag}: scroll inverso deshace cada fase`, down.every((d, i) => same(d.s, up[i].s)), down.map((d, i) => same(d.s, up[i].s) ? '=' : 'x').join(''));
  ok(`${tag}: las fases avanzan al bajar`, new Set(down.map((d) => d.s)).size >= (reduced ? 4 : 6), `${new Set(down.map((d) => d.s)).size} estados`);
  // reload at mid-act
  const mid = ys[4];
  await step(page, mid); const before = await state(page);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(400);
  const after = await state(page);
  const sy = await page.evaluate(() => scrollY);
  ok(`${tag}: recarga a mitad del acto conserva el estado`, same(before.s, after.s), `scrollY ${sy} vs ${mid}` + (same(before.s, after.s) ? '' : ` | ${before.s} | ${after.s}`));
  // jump from bottom to top
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(400);
  const hero = await page.evaluate(() => { const r = document.querySelector('h1').getBoundingClientRect(); return { top: r.top, op: getComputedStyle(document.querySelector('h1')).opacity }; });
  ok(`${tag}: volver arriba de golpe deja la portada visible`, hero.top >= 0 && hero.top < h && +hero.op > 0.95, JSON.stringify(hero));
  ok(`${tag}: sin errores de JS`, errs.length === 0, errs.join('; '));
  await ctx.close();
}
await browser.close();
console.log(`\n${res.filter(Boolean).length}/${res.length}`);
