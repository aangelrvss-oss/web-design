// Verificación funcional sobre el servidor local con CSP (php -S + router).
// Uso: node qa/functional.mjs http://127.0.0.1:4600 <outdir>
import { chromium } from '../../../qa/node_modules/playwright-core/index.mjs';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:4600';
const OUT = process.argv[3] || '/tmp/qa';
mkdirSync(OUT, { recursive: true });
const exe = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe });
const results = [];
const ok = (name, pass, info = '') => { results.push({ name, pass, info }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  · ' + info : ''}`); };

const sitemap = readFileSync(new URL('../site/sitemap.xml', import.meta.url), 'utf8');
const paths = [...sitemap.matchAll(/<loc>https:\/\/livingclean\.es([^<]*)<\/loc>/g)].map((m) => m[1]);
paths.push('/gracias/', '/envio-no-completado/', '/404.html');

// 1. Cada página: consola, peticiones, SEO básico, enlaces internos, desbordamiento
const linkSet = new Set();
// Imágenes generadas aún sin descargar: se cuentan aparte para no ocultar otros errores.
const PENDING = /\/assets\/img\/(hero-portal|ronda-)[\w-]*\.webp$/;
const pending = new Set();
for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 740 }]) {
  const ctx = await browser.newContext({ viewport: vp });
  for (const p of paths) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !(m.text().includes('404') && pending.size)) errs.push(m.text()); });
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/404.html')) { if (PENDING.test(r.url())) pending.add(r.url().split('/').pop()); else errs.push(`${r.status()} ${r.url()}`); } });
    const res = await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const info = await page.evaluate(() => {
      const h1 = [...document.querySelectorAll('h1')].map((h) => h.textContent.trim());
      const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]);
      let skip = false; for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) skip = true;
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return true; } catch { return false; } });
      const imgsNoAlt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length;
      const imgsBroken = [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && !/\/(hero-portal|ronda-)/.test(i.currentSrc || i.src)).length;
      const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
      const tels = [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href'));
      const smallTargets = [...document.querySelectorAll('a, button, input, select, textarea, summary')].filter((el) => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        if (!r.width || cs.visibility === 'hidden' || el.closest('[hidden]') || el.closest('.hv__hp') || el.closest('.prose p, .hv__legal, .sc-lede, .foot__note') || el.closest('.opt')) return false;
        return r.height < 24 || r.width < 24;
      }).map((el) => (el.textContent || el.name || el.tagName).trim().slice(0, 30));
      const emptyBtns = [...document.querySelectorAll('.btn')].filter((b) => b.getBoundingClientRect().width && !b.closest('[hidden]') && !b.innerText.trim()).map((b) => b.getAttribute('aria-label') || b.outerHTML.slice(0, 40));
      return {
        emptyBtns,
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
      ok(`${p}: canonical`, info.canonical.startsWith('https://livingclean.es/'));
      ok(`${p}: JSON-LD válido`, info.ld.every(Boolean), `${info.ld.length} bloques`);
      ok(`${p}: imágenes con alt y cargadas`, info.imgsNoAlt === 0 && info.imgsBroken === 0);
      ok(`${p}: tel: correcto`, info.tels.length > 0 && info.tels.every((t) => t === 'tel:+34608825864'));
      ok(`${p}: lang=es`, info.lang === 'es');
    } else {
      ok(`${tag}: ningún botón sin texto visible`, info.emptyBtns.length === 0, info.emptyBtns.join(', '));
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
  ok(`enlaces internos (${uniq.length})`, bad.length === 0, bad.join(', '));
  // Anclas: cada enlace /ruta#id o #id tiene que tener su id en la página destino.
  const missingAnchors = [];
  const anchored = [...linkSet].filter((l) => /^\/?[^#]*#[\w-]+$/.test(l) && !l.startsWith('//'));
  for (const l of anchored) {
    const [path, id] = l.split('#');
    const page = path || '/';
    const html = await (await fetch(BASE + page)).text();
    if (!new RegExp(` id="${id}"`).test(html)) missingAnchors.push(l);
  }
  ok(`anclas internas con destino (${anchored.length})`, missingAnchors.length === 0, missingAnchors.join(', '));
  ok(`imágenes generadas pendientes de descargar`, true, `${pending.size} archivos: ${[...pending].slice(0, 4).join(', ')}${pending.size > 4 ? '…' : ''}`);
}

// 3. Caminos A/B/C, zonas -> formulario, campos según el tipo, validación y envío real
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const tracked = [];
  await page.exposeFunction('__track', (d) => tracked.push(d));
  await page.addInitScript(() => document.addEventListener('lc:track', (e) => window.__track(e.detail)));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  const formState = () => page.evaluate(() => ({
    tipo: document.querySelector('input[name=tipo]:checked')?.value || '',
    servicios: [...document.querySelectorAll('input[name="servicio[]"]:checked')].map((c) => c.value).join(),
    visibles: [...document.querySelectorAll('[data-visit] [data-for]')].filter((e) => !e.hidden && !e.hasAttribute('data-plan-box')).map((e) => e.querySelector('input')?.name).join(),
  }));
  const s0 = await formState();
  ok('formulario: ningún tipo premarcado y sin campos condicionales visibles', s0.tipo === '' && s0.visibles === '', JSON.stringify(s0));

  // Camino A: CTA principal del hero
  await page.click('.hero .cta-pair .btn--accent');
  await page.waitForTimeout(400);
  const sA = await formState();
  ok('camino A: el CTA del hero marca «Comunidad» y «Limpieza de comunidad»', sA.tipo === 'comunidad' && sA.servicios === 'comunidades' && sA.visibles === 'portales', JSON.stringify(sA));
  // Camino B: administrador
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.click('.hero__paths a[data-set-type="administrador"]');
  await page.waitForTimeout(400);
  const sB = await formState();
  ok('camino B: «Administras varias fincas» marca administrador y enseña sus campos', sB.tipo === 'administrador' && sB.visibles === 'comunidades,llamada', JSON.stringify(sB));
  // Camino C: servicio puntual desde «Otros servicios»
  await page.evaluate(() => document.querySelector('#otros-servicios').scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(400);
  await page.click('#otros-servicios .link-arrow');
  await page.waitForTimeout(400);
  const sC = await formState();
  ok('camino C: «Otros servicios» marca servicio puntual', sC.tipo === 'puntual' && sC.visibles === '', JSON.stringify(sC));
  await page.click('label.opt:has(input[value="empresa"])');
  const sE = await formState();
  ok('tipo empresa enseña «Tipo de instalación»', sE.visibles === 'instalacion', JSON.stringify(sE));
  await page.evaluate(() => document.querySelectorAll('input[name="servicio[]"], input[name=tipo]').forEach((c) => { c.checked = false; }));

  // Zonas del edificio: quitar garaje y fachada -> formulario
  await page.evaluate(() => document.querySelector('#comunidades').scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.click('[data-goto="garaje"]');
  await page.waitForTimeout(1600);
  const cur = await page.evaluate(() => document.querySelector('[aria-current="step"]')?.getAttribute('data-goto'));
  ok('raíl: ir a una zona la centra y la marca', cur === 'garaje', String(cur));
  await page.click('[data-stop-toggle="garaje"]');
  await page.screenshot({ path: `${OUT}/zonas-garaje-off.png` });
  await page.click('[data-goto="fachada"]');
  await page.waitForTimeout(1600);
  await page.click('[data-stop-toggle="fachada"]');
  const plan = await page.evaluate(() => ({
    list: [...document.querySelectorAll('[data-plan-item]')].filter((l) => !l.hidden).map((l) => l.getAttribute('data-plan-item')).join(),
    input: document.querySelector('[data-plan-input]').value, disabled: document.querySelector('[data-plan-input]').disabled,
    box: !document.querySelector('[data-plan-box]').hidden, text: document.querySelector('[data-plan-text]').textContent,
    off: [...document.querySelectorAll('.track a.is-off')].map((a) => a.getAttribute('data-goto')).join(),
    tipo: document.querySelector('input[name=tipo]:checked')?.value,
  }));
  ok('zonas: el resumen refleja las zonas quitadas', plan.list === 'portal,escaleras,jardin,mantenimiento' && plan.off === 'garaje,fachada', JSON.stringify(plan));
  ok('zonas: llegan al formulario y marcan «Comunidad»', !plan.disabled && plan.input === 'portal,escaleras,jardin,mantenimiento' && plan.box && plan.tipo === 'comunidad', plan.text);
  await page.fill('#v-portales', '2');

  // Validación
  await page.evaluate(() => document.querySelector('#visita').scrollIntoView({ behavior: 'instant' }));
  await page.click('form[data-visit] button[type=submit]');
  await page.waitForTimeout(200);
  const v = await page.evaluate(() => ({
    nombre: document.querySelector('#v-nombre').getAttribute('aria-invalid'),
    focus: document.activeElement.id,
    err1: document.querySelector('#v-nombre-err').textContent,
    err2: document.querySelector('#v-contacto-err').textContent,
  }));
  ok('validación: errores visibles y foco en el primer campo', v.nombre === 'true' && v.focus === 'v-nombre' && v.err1 && v.err2, JSON.stringify(v));
  await page.screenshot({ path: `${OUT}/form-errors.png` });
  await page.fill('#v-nombre', 'Prueba QA');
  await page.fill('#v-telefono', '123');
  await page.click('form[data-visit] button[type=submit]');
  const telErr = await page.textContent('#v-contacto-err');
  ok('validación: teléfono corto', /9 cifras/.test(telErr), telErr);
  await page.fill('#v-telefono', '600 000 000');
  await page.fill('#v-localidad', 'Rivas-Vaciamadrid');
  await page.fill('#v-mensaje', 'Mensaje de prueba automática de QA. No responder.');
  await page.waitForTimeout(3200); // tiempo mínimo antispam
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/contacto.php')),
    page.click('form[data-visit] button[type=submit]'),
  ]);
  const body = await resp.json();
  await page.waitForTimeout(300);
  const st = await page.evaluate(() => { const s = document.querySelector('[data-status]'); return { hidden: s.hidden, cls: s.className, text: s.textContent }; });
  ok('envío real: servidor responde ok', resp.status() === 200 && body.ok === true, JSON.stringify(body));
  ok('envío real: confirmación mostrada', !st.hidden && st.cls.includes('is-ok'), st.text.slice(0, 60));
  const mail = readFileSync(process.env.LC_OUTBOX || '/tmp/claude-0/-home-user-web-design/8e7ff4f5-3705-545b-8984-b2ec3735c701/scratchpad/mail/outbox.eml', 'utf8').split('Nueva solicitud').pop();
  ok('envío real: el correo incluye tipo, portales y zonas', /Zonas:\s+Portal, Escaleras y ascensor, Zonas comunes y jardín, Mantenimiento/.test(mail) && /Cliente:\s+Comunidad de vecinos/.test(mail) && /Portales:\s+2/.test(mail), (mail.match(/Zonas:.*/) || [''])[0]);
  ok('medición: eventos pedidos emitidos', ['click_cta', 'select_service', 'zone_toggle', 'zone_track_click', 'form_start', 'form_submit', 'form_success'].every((e) => tracked.some((t) => t.event === e)), [...new Set(tracked.map((t) => t.event))].join(','));
  ok('medición: form_submit no se emite con errores de validación', tracked.filter((t) => t.event === 'form_submit').length === 1, String(tracked.filter((t) => t.event === 'form_submit').length));
  await page.screenshot({ path: `${OUT}/form-ok.png` });

  // Error de servidor simulado: no debe mostrar falso éxito
  const p2 = await ctx.newPage();
  await p2.route('**/contacto.php', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ ok: false, message: 'No hemos podido enviar tu solicitud.' }) }));
  await p2.goto(BASE + '/conserje-multifuncion/', { waitUntil: 'networkidle' });
  const pre = await p2.evaluate(() => [[...document.querySelectorAll('input[name="servicio[]"]:checked')].map((c) => c.value).join(), document.querySelector('input[name=tipo]:checked')?.value]);
  ok('página de servicio preselecciona servicio y tipo', pre[0] === 'conserje' && pre[1] === 'comunidad', pre.join(' / '));
  await p2.fill('#v-mensaje', 'Texto que no debe perderse');
  await p2.fill('#v-nombre', 'Prueba QA');
  await p2.fill('#v-email', 'qa@example.com');
  await p2.waitForTimeout(3200);
  await p2.click('form[data-visit] button[type=submit]');
  await p2.waitForTimeout(500);
  const st2 = await p2.evaluate(() => { const s = document.querySelector('[data-status]'); return { cls: s.className, html: s.innerHTML }; });
  ok('error de servidor: mensaje de error y alternativas (tel/mailto)', st2.cls.includes('is-err') && st2.html.includes('tel:') && st2.html.includes('mailto:'));
  const kept = await p2.evaluate(() => [document.querySelector('#v-nombre').value, document.querySelector('#v-email').value, document.querySelector('#v-mensaje').value, !document.querySelector('#v-nombre').closest('[hidden]')]);
  ok('error de servidor: no se pierde ningún dato', kept[0] === 'Prueba QA' && kept[1] === 'qa@example.com' && kept[2] === 'Texto que no debe perderse' && kept[3], JSON.stringify(kept));
  await p2.evaluate(() => document.querySelector('[data-status]').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p2.screenshot({ path: `${OUT}/form-error-server.png` });
  await ctx.close();
}

// 4. Formulario sin JavaScript: POST real y redirección
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  const method = await page.getAttribute('form[data-visit]', 'method');
  ok('sin JS: el formulario usa POST', method === 'post');
  const visible = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-sc-cue], [data-sc-in]')];
    return els.filter((e) => getComputedStyle(e).opacity !== '1').length;
  });
  ok('sin JS: todo el contenido animado es visible', visible === 0, `${visible} ocultos`);
  await page.screenshot({ path: `${OUT}/nojs-top.png`, fullPage: false });
  await page.fill('#v-nombre', 'Prueba sin JS');
  await page.fill('#v-email', 'qa-nojs@example.com');
  await Promise.all([page.waitForNavigation(), page.click('form[data-visit] button[type=submit]')]);
  ok('sin JS: redirige a /gracias/', page.url().endsWith('/gracias/'), page.url());
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await Promise.all([page.waitForNavigation(), page.click('form[data-visit] button[type=submit]')]);
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
      const isChk = el.matches('.opt input') && +getComputedStyle(el.nextElementSibling).opacity > 0.85 && getComputedStyle(el.nextElementSibling).outlineStyle !== 'none';
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
  await mp.click('#menu-movil a[href="/limpieza-de-viviendas/"]');
  await mp.waitForURL('**/limpieza-de-viviendas/');
  ok('menú móvil navega', mp.url().endsWith('/limpieza-de-viviendas/'));
  // Móvil: sin tramos fijados ni carril; todo el contenido visible al pasar
  await mp.goto(BASE + '/', { waitUntil: 'networkidle' });
  const acts = await mp.evaluate(() => [...document.querySelectorAll('[data-mobile-flow]')].map((a) => a.getAttribute('data-sc-act')).join());
  ok('móvil: hero, zonas y conserjería en flujo (sin pin ni carril)', acts === 'flow,flow,flow', acts);
  const unseen = await mp.evaluate(async () => {
    const out = [];
    for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
      scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 140));
      document.querySelectorAll('[data-sc-cue], [data-sc-in]').forEach((e) => {
        const r = e.getBoundingClientRect();
        if (r.top > 80 && r.bottom < innerHeight * 0.8 && r.height > 0 && +getComputedStyle(e).opacity < 0.5) out.push((e.textContent || '').trim().slice(0, 30));
      });
    }
    return [...new Set(out)];
  });
  ok('móvil: ningún bloque queda invisible estando en pantalla', unseen.length === 0, unseen.join(' | '));
  const ham = await mp.evaluate(() => { const r = document.querySelector('[data-burger]').getBoundingClientRect(); return r.right <= innerWidth; });
  ok('móvil: la cabecera cabe (botón de menú dentro de la pantalla)', ham);
  await mp.click('[data-burger]');
  await mp.keyboard.press('Escape');
  ok('menú móvil se cierra con Escape', !(await mp.isVisible('#menu-movil')));
  await m.close();
}

const fails = results.filter((r) => !r.pass);
console.log(`\n${results.length - fails.length}/${results.length} comprobaciones superadas`);
if (fails.length) { console.log('FALLOS:'); fails.forEach((f) => console.log(' - ' + f.name + ' · ' + f.info)); }
await browser.close();
