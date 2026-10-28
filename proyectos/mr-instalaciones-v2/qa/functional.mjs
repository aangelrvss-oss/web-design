// Verificación funcional de MRI V2 sobre el servidor local con CSP (php -S + router).
// Es la suite de la V1 con la leyenda del pico sustituida por la secuencia.
// Uso: node proyectos/mr-instalaciones-v2/qa/functional.mjs http://127.0.0.1:4511 <outdir>
import { chromium } from '../../../qa/node_modules/playwright-core/index.mjs';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:4510';
const OUT = process.argv[3] || '/tmp/qa';
mkdirSync(OUT, { recursive: true });
const exe = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe });
const results = [];
const ok = (name, pass, info = '') => { results.push({ name, pass, info }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  · ' + info : ''}`); };

const sitemap = readFileSync(new URL('../site/sitemap.xml', import.meta.url), 'utf8');
const paths = [...sitemap.matchAll(/<loc>https:\/\/www\.mrinstalaciones\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
paths.push('/gracias/', '/envio-no-completado/', '/404.html');

// 1. Cada página: consola, peticiones, SEO básico, enlaces internos, desbordamiento
const linkSet = new Set();
for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 740 }]) {
  const ctx = await browser.newContext({ viewport: vp });
  for (const p of paths) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/404.html')) errs.push(`${r.status()} ${r.url()}`); });
    const res = await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const info = await page.evaluate(() => {
      const h1 = [...document.querySelectorAll('h1')].map((h) => h.textContent.trim());
      const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]);
      let skip = false; for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) skip = true;
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return true; } catch { return false; } });
      const imgsNoAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length;
      const imgsBroken = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).length;
      const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
      const tels = [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href'));
      const smallTargets = [...document.querySelectorAll('a, button, input, select, textarea, summary')].filter((el) => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        if (!r.width || cs.visibility === 'hidden' || el.closest('[hidden]') || el.closest('.tb__hp') || el.closest('.prose p, .tb__legal, .certs__note, .sc-lede, .cap__t, .film__lede, .foot p') || el.type === 'checkbox') return false;
        return r.height < 24 || r.width < 24;
      }).map((el) => (el.textContent || el.name || el.tagName).trim().slice(0, 30));
      return {
        title: document.title, desc: document.querySelector('meta[name=description]')?.content || '',
        canonical: document.querySelector('link[rel=canonical]')?.href || '', robots: document.querySelector('meta[name=robots]')?.content || '',
        h1, skip, ld, imgsNoAlt, imgsBroken, links, tels, overflow: document.documentElement.scrollWidth - innerWidth, smallTargets, lang: document.documentElement.lang,
      };
    });
    info.links.forEach((l) => linkSet.add(l));
    const tag = `${vp.width}px ${p}`;
    ok(`${tag}: HTTP ${res.status()}`, res.status() === (p === '/404.html' ? 200 : 200));
    ok(`${tag}: consola/peticiones limpias`, errs.length === 0, errs.join(' | '));
    ok(`${tag}: sin desbordamiento horizontal`, info.overflow <= 0, String(info.overflow));
    if (vp.width === 1440) {
      ok(`${p}: un único H1`, info.h1.length === 1, info.h1.join(' / '));
      ok(`${p}: jerarquía de encabezados sin saltos`, !info.skip);
      ok(`${p}: title ${info.title.length} car.`, info.title.length >= 20 && info.title.length <= 70, info.title);
      ok(`${p}: description ${info.desc.length} car.`, info.robots.startsWith('noindex') || (info.desc.length >= 50 && info.desc.length <= 160));
      ok(`${p}: canonical`, info.canonical.startsWith('https://www.mrinstalaciones.com/'));
      ok(`${p}: JSON-LD válido`, info.ld.every(Boolean), `${info.ld.length} bloques`);
      ok(`${p}: imágenes con alt y cargadas`, info.imgsNoAlt === 0 && info.imgsBroken === 0);
      ok(`${p}: tel: correcto`, info.tels.length > 0 && info.tels.every((t) => t === 'tel:+34911662476'));
      ok(`${p}: lang=es`, info.lang === 'es');
    } else {
      ok(`${tag}: objetivos táctiles >= 24px`, info.smallTargets.length === 0, info.smallTargets.join(', '));
    }
    await page.close();
  }
  await ctx.close();
}

// 2. Enlaces internos
{
  const internal = [...linkSet].filter((l) => l.startsWith('/') && !l.startsWith('//')).map((l) => l.split('#')[0]).filter(Boolean);
  const uniq = [...new Set(internal)];
  const bad = [];
  for (const l of uniq) {
    const r = await fetch(BASE + l, { redirect: 'manual' });
    if (r.status >= 400) bad.push(`${r.status} ${l}`);
  }
  const pdfs = bad.filter((b) => b.includes('/wp-content/uploads/'));
  const other = bad.filter((b) => !b.includes('/wp-content/uploads/'));
  ok(`enlaces internos (${uniq.length})`, other.length === 0, other.join(', '));
  ok(`PDF de certificaciones fuera del paquete (se sirven desde el servidor actual)`, true, `${pdfs.length} rutas /wp-content/uploads/ no incluidas localmente`);
}

// 3. Formulario con JS: validación, traspaso desde la leyenda, envío real
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const tracked = [];
  await page.exposeFunction('__track', (d) => tracked.push(d));
  await page.addInitScript(() => document.addEventListener('mri:track', (e) => window.__track(e.detail)));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  // Plano técnico (recuperado de la V1): cada capa se dibuja en su ventana,
  // la leyenda marca la capa en curso, aísla capas y las pasa al formulario.
  const peakAt = async (p) => {
    await page.evaluate((p) => { const s = document.getElementById('instalacion'); scrollTo({ top: s.offsetTop + p * (s.offsetHeight - innerHeight), behavior: 'instant' }); }, p);
    await page.waitForTimeout(250);
    return page.evaluate(() => {
      const g = (k) => document.querySelector(`.house--peak .sys[data-sys="${k}"] .ln`);
      // pathLength = 1: el desplazamiento llega como «calc(0.44px)», «1px» o «0%».
      const dash = (k) => { const v = getComputedStyle(g(k)).strokeDashoffset.replace(/^calc\((.*)\)$/, '$1'); return v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v); };
      const onCue = [...document.querySelectorAll('#instalacion .pc')].filter((c) => +getComputedStyle(c).opacity > 0.9).map((c) => c.dataset.pc || 'intro/end');
      return { agua: dash('agua'), calefaccion: dash('calefaccion'), domotica: dash('domotica'), onCue };
    });
  };
  const pk0 = await peakAt(0.02), pk1 = await peakAt(0.37), pk2 = await peakAt(0.98);
  ok('plano: al entrar no hay capas dibujadas y se lee la presentación', pk0.agua > 0.95 && pk0.onCue.join() === "intro/end", JSON.stringify(pk0));
  ok('plano: a mitad, agua dibujada, calefacción en curso y su texto en pantalla', pk1.agua < 0.01 && pk1.calefaccion > 0 && pk1.calefaccion < 1 && pk1.onCue.join() === "calefaccion", JSON.stringify(pk1));
  ok('plano: al final, todas las capas dibujadas', pk2.agua < 0.01 && pk2.domotica < 0.01, JSON.stringify(pk2));
  await peakAt(0.37);
  // La capa en curso tiñe el fondo de su botón (color-mix con --now).
  const nowLg = await page.evaluate(() => [...document.querySelectorAll('.lg')].map((b) => [b.dataset.sysBtn, getComputedStyle(b).backgroundColor]));
  const nowOn = nowLg.filter(([, c]) => { const m = c.match(/\/\s*([\d.]+)\)/); return m && +m[1] > 0.08; }).map(([k]) => k);
  ok('leyenda: marca la capa que se está dibujando', nowOn.join() === 'calefaccion', JSON.stringify(nowLg));
  await page.click('[data-sys-btn="aerotermia"]');
  await page.click('[data-sys-btn="gas"]');
  const iso = await page.evaluate(() => document.querySelector('.house--peak').classList.contains('is-iso'));
  const checked = await page.evaluate(() => [...document.querySelectorAll('input[name="servicio[]"]:checked')].map((c) => c.value));
  ok('leyenda aísla capas en el dibujo', iso);
  ok('leyenda marca servicios en el formulario', checked.includes('aerotermia') && checked.includes('instalaciones-de-gas'), checked.join(','));
  await page.click('[data-sys-btn="gas"]');
  const checked2 = await page.evaluate(() => [...document.querySelectorAll('input[name="servicio[]"]:checked')].map((c) => c.value));
  ok('desmarcar en la leyenda desmarca el servicio', !checked2.includes('instalaciones-de-gas') && checked2.includes('aerotermia'));
  await page.screenshot({ path: `${OUT}/legend.png` });
  await page.click('[data-sys-btn="aerotermia"]');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);

  // Secuencia: el carril salta a cada escena y la deja activa; el clip avanza.
  const readFilm = () => page.evaluate(() => ({
    y: Math.round(scrollY),
    scene: document.querySelector('.film__rail li.is-on a')?.getAttribute('data-goto'),
    capOn: [...document.querySelectorAll('.cap.is-on')].map((c) => c.id),
    t: +document.querySelector('[data-film] video').currentTime.toFixed(2),
  }));
  await page.evaluate(() => scrollTo(0, innerHeight * 0.8));
  await page.waitForTimeout(900);
  await page.click('[data-goto="termica"]');
  await page.waitForTimeout(1800);
  const f1 = await readFilm();
  ok('secuencia: el carril lleva a la escena de aerotermia', f1.scene === 'termica' && f1.capOn.includes('escena-termica'), JSON.stringify(f1));
  await page.click('[data-goto="ventilacion"]');
  await page.waitForTimeout(1800);
  const f2 = await readFilm();
  ok('secuencia: el clip avanza con la escena (ida)', f2.scene === 'ventilacion' && f2.t > f1.t, `${f1.t}s -> ${f2.t}s`);
  await page.click('[data-goto="clima"]');
  await page.waitForTimeout(1800);
  const f3 = await readFilm();
  ok('secuencia: el clip retrocede con el scroll (vuelta)', f3.scene === 'clima' && f3.t < f2.t, `${f2.t}s -> ${f3.t}s`);
  const href = await page.getAttribute('#escena-clima .cap__a', 'href');
  ok('secuencia: cada escena enlaza a su servicio real', href === '/servicios/calefaccion-climatizacion/', href);
  await page.screenshot({ path: `${OUT}/film-rail.png` });

  // Validación
  await page.evaluate(() => document.querySelector('#presupuesto').scrollIntoView({ behavior: 'instant' }));
  await page.click('form[data-quote] button[type=submit]');
  await page.waitForTimeout(200);
  const v = await page.evaluate(() => ({
    nombre: document.querySelector('#q-nombre').getAttribute('aria-invalid'),
    focus: document.activeElement.id,
    err1: document.querySelector('#q-nombre-err').textContent,
    err2: document.querySelector('#q-contacto-err').textContent,
  }));
  ok('validación: errores visibles y foco en el primer campo', v.nombre === 'true' && v.focus === 'q-nombre' && v.err1 && v.err2, JSON.stringify(v));
  await page.screenshot({ path: `${OUT}/form-errors.png` });
  await page.fill('#q-nombre', 'Prueba QA');
  await page.fill('#q-telefono', '123');
  await page.click('form[data-quote] button[type=submit]');
  const telErr = await page.textContent('#q-contacto-err');
  ok('validación: teléfono corto', /9 cifras/.test(telErr), telErr);
  await page.fill('#q-telefono', '600 000 000');
  await page.fill('#q-localidad', 'Rivas-Vaciamadrid');
  await page.fill('#q-mensaje', 'Mensaje de prueba automática de QA. No responder.');
  await page.waitForTimeout(3200); // tiempo mínimo antispam
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/contacto.php')),
    page.click('form[data-quote] button[type=submit]'),
  ]);
  const body = await resp.json();
  await page.waitForTimeout(300);
  const st = await page.evaluate(() => { const s = document.querySelector('[data-status]'); return { hidden: s.hidden, cls: s.className, text: s.textContent }; });
  ok('envío real: servidor responde ok', resp.status() === 200 && body.ok === true, JSON.stringify(body));
  ok('envío real: confirmación mostrada', !st.hidden && st.cls.includes('is-ok'), st.text.slice(0, 60));
  ok('medición: form_start y form_submit_success emitidos', tracked.some((t) => t.event === 'form_start') && tracked.some((t) => t.event === 'form_submit_success'), tracked.map((t) => t.event).join(','));
  await page.screenshot({ path: `${OUT}/form-ok.png` });

  // Error de servidor simulado: no debe mostrar falso éxito
  const p2 = await ctx.newPage();
  await p2.route('**/contacto.php', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ ok: false, message: 'No hemos podido enviar tu solicitud.' }) }));
  await p2.goto(BASE + '/servicios/aerotermia/', { waitUntil: 'networkidle' });
  const pre = await p2.evaluate(() => [...document.querySelectorAll('input[name="servicio[]"]:checked')].map((c) => c.value));
  ok('página de servicio preselecciona su servicio', pre.join() === 'aerotermia', pre.join());
  await p2.fill('#q-nombre', 'Prueba QA');
  await p2.fill('#q-email', 'qa@example.com');
  await p2.waitForTimeout(3200);
  await p2.click('form[data-quote] button[type=submit]');
  await p2.waitForTimeout(500);
  const st2 = await p2.evaluate(() => { const s = document.querySelector('[data-status]'); return { cls: s.className, html: s.innerHTML }; });
  ok('error de servidor: mensaje de error y alternativas (tel/mailto)', st2.cls.includes('is-err') && st2.html.includes('tel:') && st2.html.includes('mailto:'));
  await p2.evaluate(() => document.querySelector('[data-status]').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p2.screenshot({ path: `${OUT}/form-error-server.png` });
  await ctx.close();
}

// 4. Formulario sin JavaScript: POST real y redirección
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  const method = await page.getAttribute('form[data-quote]', 'method');
  ok('sin JS: el formulario usa POST', method === 'post');
  const visible = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-sc-cue], [data-sc-in]')];
    return els.filter((e) => getComputedStyle(e).opacity !== '1').length;
  });
  ok('sin JS: todo el contenido animado es visible', visible === 0, `${visible} ocultos`);
  await page.screenshot({ path: `${OUT}/nojs-top.png`, fullPage: false });
  await page.fill('#q-nombre', 'Prueba sin JS');
  await page.fill('#q-email', 'qa-nojs@example.com');
  await Promise.all([page.waitForNavigation(), page.click('form[data-quote] button[type=submit]')]);
  ok('sin JS: redirige a /gracias/', page.url().endsWith('/gracias/'), page.url());
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await Promise.all([page.waitForNavigation(), page.click('form[data-quote] button[type=submit]')]);
  ok('sin JS: datos inválidos redirigen a /envio-no-completado/', page.url().endsWith('/envio-no-completado/'), page.url());
  await ctx.close();
}

// 5. Teclado y menú móvil
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  let hidden = [];
  for (let i = 0; i < 200; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(450);
    const s = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return 'END';
      const r = el.getBoundingClientRect();
      let o = 1, n = el; while (n && n !== document.documentElement) { o *= +getComputedStyle(n).opacity; n = n.parentElement; }
      const onScreen = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      const isChk = el.matches('.chk input') && +getComputedStyle(el.nextElementSibling).opacity > 0.85 && getComputedStyle(el.nextElementSibling).outlineStyle !== 'none';
      return { t: (el.textContent || el.name || el.id).trim().slice(0, 40), o: +o.toFixed(2), onScreen, isChk };
    });
    if (s === 'END') { ok('teclado: recorrido completo hasta el final de la página', i > 40, `${i} paradas de foco`); break; }
    if (s && !s.isChk && (s.o < 0.85 || !s.onScreen)) hidden.push(`${s.t} (op ${s.o}, en pantalla ${s.onScreen})`);
  }
  ok('teclado: cada foco visible y en pantalla (ciclo completo)', hidden.length === 0, hidden.slice(0, 6).join(' | '));
  await page.keyboard.press('Shift+Tab');
  await page.screenshot({ path: `${OUT}/keyboard.png` });
  // desplegable de servicios
  await page.evaluate(() => scrollTo(0, 0));
  await page.click('[data-drop]');
  ok('menú Servicios se abre', await page.isVisible('#menu-servicios'));
  await page.keyboard.press('Escape');
  ok('menú Servicios se cierra con Escape', !(await page.isVisible('#menu-servicios')));
  await ctx.close();

  const m = await browser.newContext({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  await mp.goto(BASE + '/', { waitUntil: 'networkidle' });
  await mp.click('[data-burger]');
  ok('menú móvil se abre', await mp.isVisible('#menu-movil'));
  await mp.screenshot({ path: `${OUT}/mobile-menu.png` });
  await mp.click('#menu-movil a[href="/servicios/aerotermia/"]');
  await mp.waitForURL('**/servicios/aerotermia/');
  ok('menú móvil navega', mp.url().endsWith('/servicios/aerotermia/'));
  await m.close();
}

// WhatsApp flotante: en todas las páginas, al número correcto, con el mensaje
// escrito (el del servicio en su página); se aparta sobre el formulario, en el
// pie del Kit Digital y con el menú abierto.
{
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const wp = await m.newPage();
  const bad = [];
  for (const p of paths) {
    await wp.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    const a = await wp.evaluate(() => { const el = document.querySelector('a.wa[data-wa]'); return el && { href: el.href, label: el.getAttribute('aria-label'), blank: el.target === '_blank' }; });
    if (!a || !a.href.startsWith('https://wa.me/34667369838?text=') || !a.blank || !/\+34 667 36 98 38/.test(a.label || '')) bad.push(p);
  }
  ok(`WhatsApp: botón en las ${paths.length} páginas, al +34 667 36 98 38 y en pestaña nueva`, bad.length === 0, bad.join(', '));
  await wp.goto(BASE + '/servicios/aerotermia/', { waitUntil: 'load' });
  const text = await wp.evaluate(() => new URL(document.querySelector('[data-wa]').href).searchParams.get('text'));
  ok('WhatsApp: mensaje escrito con el servicio de la página', text === 'Hola, os escribo desde la web de MRI. Quería pedir información sobre aerotermia.', text);
  await wp.goto(BASE + '/', { waitUntil: 'load' });
  const vis = () => wp.evaluate(() => getComputedStyle(document.querySelector('[data-wa]')).visibility);
  const top = await vis();
  const box = await wp.evaluate(() => { const r = document.querySelector('[data-wa]').getBoundingClientRect(); return [r.width, r.height, innerWidth - r.right, innerHeight - r.bottom].map(Math.round); });
  await wp.evaluate(() => document.querySelector('[data-quote]').scrollIntoView({ block: 'center', behavior: 'instant' })); await wp.waitForTimeout(500);
  const atForm = await vis();
  await wp.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await wp.waitForTimeout(500);
  const atKit = await vis();
  await wp.evaluate(() => scrollTo(0, 2500)); await wp.waitForTimeout(500);
  await wp.click('[data-burger]'); await wp.waitForTimeout(400);
  const atMenu = await vis();
  ok('WhatsApp: visible abajo a la derecha (56 px, 16 px del borde)', top === 'visible' && box[0] >= 48 && box[2] <= 20 && box[3] <= 20 + 34, JSON.stringify(box));
  ok('WhatsApp: se aparta sobre el formulario, en la franja del Kit Digital y con el menú abierto', atForm === 'hidden' && atKit === 'hidden' && atMenu === 'hidden', [atForm, atKit, atMenu].join('/'));
  await m.close();
}

const fails = results.filter((r) => !r.pass);
console.log(`\n${results.length - fails.length}/${results.length} comprobaciones superadas`);
if (fails.length) { console.log('FALLOS:'); fails.forEach((f) => console.log(' - ' + f.name + ' · ' + f.info)); }
await browser.close();
