// Pruebas de animación de la portada: los dos actos fijados (reseñas y obra
// fase a fase), en movimiento normal y reducido. Scroll inverso, recarga a
// mitad del acto, salto arriba, rueda del ratón rápida, cambio de tamaño y
// que nunca se solapen dos frases destacadas.
// Uso: node qa/animation.mjs http://127.0.0.1:4700/
import { chromium } from '../../../qa/node_modules/playwright-core/index.mjs';
const URL = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const res = [];
const ok = (name, pass, info = '') => { res.push(pass); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  · ' + info : ''}`); };

// Estado visual de cada acto, leído del navegador.
const state = (page, sel) => page.evaluate((sel) => {
  const act = document.querySelector(sel);
  const r = act.getBoundingClientRect();
  let s = '';
  if (sel === '#obra') s = act.querySelector('.phase__frame').getAttribute('data-sc-verify-state') || '';
  else {
    const q = [...act.querySelectorAll('.rstage__q, .rstage__topics')].map((e) => Math.round(+getComputedStyle(e).opacity * 100));
    s = q.join('/') + ' ' + getComputedStyle(act.querySelector('.stars--fill')).clipPath + ' ' + new DOMMatrixReadOnly(getComputedStyle(act.querySelector('.rstage__num')).transform).a.toFixed(3);
  }
  return { s, top: r.top + scrollY, h: act.offsetHeight };
}, sel);
// Mismo estado visual con 1 punto de margen (el motor suaviza el avance).
const same = (a, b) => { const na = a.match(/[\d.]+/g) || [], nb = b.match(/[\d.]+/g) || []; return na.length === nb.length && na.every((x, i) => Math.abs(x - nb[i]) <= (x.includes('.') && +x < 2 ? 0.005 : 1)); };
const go = async (page, y) => { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(450); };

for (const reduced of [false, true]) {
  const tag = reduced ? 'reducido' : 'normal';
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(URL, { waitUntil: 'networkidle' });
  for (const [sel, label, minStates] of [['#opiniones', 'reseñas', reduced ? 3 : 5], ['#obra', 'fases', reduced ? 4 : 6]]) {
    const st0 = await state(page, sel);
    const travel = st0.h - 900;
    const ys = [0, .1, .25, .4, .55, .7, .85, 1].map((f) => Math.round(st0.top + travel * f));
    const down = []; for (const y of ys) { await go(page, y); down.push(await state(page, sel)); }
    const up = []; for (const y of [...ys].reverse()) { await go(page, y); up.push(await state(page, sel)); }
    up.reverse();
    ok(`${tag} · ${label}: el scroll inverso deshace cada estado`, down.every((d, i) => same(d.s, up[i].s)), down.map((d, i) => same(d.s, up[i].s) ? '=' : 'x').join(''));
    ok(`${tag} · ${label}: avanza al bajar`, new Set(down.map((d) => d.s)).size >= minStates, `${new Set(down.map((d) => d.s)).size} estados`);
    const mid = ys[4];
    await go(page, mid); const before = await state(page, sel);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(500);
    const after = await state(page, sel);
    ok(`${tag} · ${label}: recargar a mitad conserva el estado`, same(before.s, after.s), same(before.s, after.s) ? '' : `${before.s} | ${after.s}`);
  }
  // Nunca dos frases destacadas a plena opacidad a la vez.
  const st = await state(page, '#opiniones');
  let overlap = 0;
  for (let f = 0; f <= 1; f += 0.05) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round(st.top + (st.h - 900) * f)); await page.waitForTimeout(120);
    const vis = await page.evaluate(() => [...document.querySelectorAll('.rstage__q')].filter((q) => +getComputedStyle(q).opacity > 0.6).length);
    if (vis > 1) overlap++;
  }
  ok(`${tag}: las frases destacadas no se solapan`, overlap === 0, `${overlap} muestras con dos frases`);
  // Rueda del ratón rápida de arriba abajo: el scroll nunca se bloquea.
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.mouse.move(700, 450);
  let last = -1, stuck = 0;
  for (let i = 0; i < 160; i++) {
    await page.mouse.wheel(0, 240); await page.waitForTimeout(16);
    if (i % 10 === 9) { const y = await page.evaluate(() => ({ y: scrollY, max: document.documentElement.scrollHeight - innerHeight })); if (y.y === last && y.y < y.max - 2) stuck++; last = y.y; }
  }
  const end = await page.evaluate(() => ({ y: scrollY, max: document.documentElement.scrollHeight - innerHeight }));
  ok(`${tag}: rueda rápida recorre la página sin bloqueos`, stuck === 0 && end.y >= end.max - 2, `${end.y}/${end.max}, paradas ${stuck}`);
  // Volver arriba de golpe.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(500);
  const hero = await page.evaluate(() => { const h = document.querySelector('h1'); const r = h.getBoundingClientRect(); return { top: Math.round(r.top), op: getComputedStyle(h).opacity, solid: document.querySelector('[data-bar]').classList.contains('is-solid') }; });
  ok(`${tag}: volver arriba de golpe deja la portada visible`, hero.top >= 0 && hero.top < 900 && +hero.op > 0.95 && !hero.solid, JSON.stringify(hero));
  // Cambio de tamaño a mitad de un acto fijado: el escenario sigue en su sitio.
  const o = await state(page, '#obra');
  await go(page, o.top + (o.h - 900) * 0.5);
  await page.setViewportSize({ width: 1024, height: 760 }); await page.waitForTimeout(700);
  const o2 = await state(page, '#obra');
  await go(page, o2.top + (o2.h - 760) * 0.5);
  const rs = await page.evaluate(() => { const st = document.querySelector('#obra [data-sc-stage]').getBoundingClientRect(); return { top: Math.round(st.top), h: Math.round(st.height), ov: document.documentElement.scrollWidth - innerWidth }; });
  ok(`${tag}: al cambiar el tamaño, el escenario fijado sigue ocupando la pantalla`, Math.abs(rs.top) <= 2 && rs.h >= 740 && rs.ov <= 0, JSON.stringify(rs));
  await page.setViewportSize({ width: 1440, height: 900 });
  ok(`${tag}: sin errores de JS`, errs.length === 0, errs.join('; '));
  await ctx.close();
}
// Pantalla táctil (móvil): gestos de deslizar reales del navegador.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  const cdp = await ctx.newCDPSession(page);
  // Toques reales del navegador (touchStart / touchMove / touchEnd).
  const swipe = async (dy) => {
    const y0 = dy < 0 ? 700 : 150;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: y0 }] });
    for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: y0 + (dy / 10) * i }] }); await page.waitForTimeout(12); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(120);
  };
  const ys = [];
  for (let i = 0; i < 80; i++) {
    await swipe(-560);
    ys.push(await page.evaluate(() => scrollY));
    if (await page.evaluate(() => scrollY >= document.documentElement.scrollHeight - innerHeight - 2)) break;
  }
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const mono = ys.every((y, i) => i === 0 || y >= ys[i - 1]);
  ok('táctil: deslizar con el dedo recorre toda la página', mono && ys[ys.length - 1] >= max - 2, `${ys.length} gestos, ${ys[ys.length - 1]}/${max}`);
  for (let i = 0; i < 3; i++) await swipe(560);
  ok('táctil: también hacia arriba', (await page.evaluate(() => scrollY)) < max - 1000);
  ok('táctil: sin errores de JS', errs.length === 0, errs.join('; '));
  await ctx.close();
}
await browser.close();
console.log(`\n${res.filter(Boolean).length}/${res.length}`);
