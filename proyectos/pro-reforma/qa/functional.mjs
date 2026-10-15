// Verificación funcional sobre el servidor local con CSP (php -S + router).
// Uso: node qa/functional.mjs http://127.0.0.1:4700 <outdir>
import { chromium } from '../../../qa/node_modules/playwright-core/index.mjs';
import { mkdirSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:4700';
const OUT = process.argv[3] || '/tmp/qa-pr';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const results = [];
const ok = (name, pass, info = '') => { results.push({ name, pass, info }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  · ' + info : ''}`); };

const sitemap = readFileSync(new URL('../site/sitemap.xml', import.meta.url), 'utf8');
const paths = [...sitemap.matchAll(/<loc>https:\/\/www\.proreforma\.es([^<]*)<\/loc>/g)].map((m) => m[1]);
paths.push('/gracias/', '/envio-no-completado/', '/404.html');
const OUTBOX = process.env.PR_OUTBOX || '/tmp/claude-0/-home-user-web-design/8e7ff4f5-3705-545b-8984-b2ec3735c701/scratchpad/mail/outbox.eml';

// 1. Cada página en escritorio y móvil
const linkSet = new Set();
for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 740 }]) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 800, hasTouch: vp.width < 800 });
  for (const p of paths) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/404.html')) errs.push(`${r.status()} ${r.url()}`); });
    const res = await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const info = await page.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]);
      let skip = false; for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) skip = true;
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && !el.closest('[hidden]') && getComputedStyle(el).visibility !== 'hidden'; };
      return {
        h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()), skip,
        title: document.title, desc: document.querySelector('meta[name=description]')?.content || '', robots: document.querySelector('meta[name=robots]')?.content || '',
        canonical: document.querySelector('link[rel=canonical]')?.href || '', lang: document.documentElement.lang,
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return true; } catch { return false; } }),
        noAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
        broken: [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).length,
        upscaled: [...document.querySelectorAll('img')].filter((i) => vis(i) && i.naturalWidth && i.getBoundingClientRect().width > i.naturalWidth * 1.15).map((i) => i.getAttribute('src').split('/').pop()),
        links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
        tels: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href')),
        was: [...document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]')].map((a) => a.getAttribute('href')),
        emptyBtns: [...document.querySelectorAll('.btn')].filter((b) => vis(b) && !b.innerText.trim()).length,
        overflow: document.documentElement.scrollWidth - innerWidth,
        small: [...document.querySelectorAll('a, button, input, textarea, summary')].filter((el) => {
          const r = el.getBoundingClientRect(); if (!r.width || !vis(el) || el.closest('.qf__hp') || el.closest('.opt') || el.closest('p, li > blockquote')) return false;
          return r.height < 24 || r.width < 24;
        }).map((el) => (el.textContent || el.name || '').trim().slice(0, 25)),
      };
    });
    info.links.forEach((l) => linkSet.add(l));
    const tag = `${vp.width}px ${p}`;
    ok(`${tag}: HTTP 200`, res.status() === 200, String(res.status()));
    ok(`${tag}: consola y peticiones limpias`, errs.length === 0, errs.join(' | '));
    ok(`${tag}: sin desbordamiento horizontal`, info.overflow <= 0, String(info.overflow));
    ok(`${tag}: botones con texto visible`, info.emptyBtns === 0);
    ok(`${tag}: ninguna foto ampliada por encima de su tamaño (>15 %)`, info.upscaled.length === 0, info.upscaled.join(', '));
    if (vp.width === 1440) {
      ok(`${p}: un único H1`, info.h1.length === 1, info.h1.join(' / '));
      ok(`${p}: encabezados sin saltos`, !info.skip);
      ok(`${p}: title ${info.title.length} car.`, info.title.length >= 20 && info.title.length <= 70, info.title);
      ok(`${p}: description ${info.desc.length} car.`, info.robots.startsWith('noindex') || (info.desc.length >= 50 && info.desc.length <= 160));
      ok(`${p}: canonical`, info.canonical.startsWith('https://www.proreforma.es/'));
      ok(`${p}: JSON-LD válido`, info.ld.every(Boolean), `${info.ld.length}`);
      ok(`${p}: imágenes con alt y cargadas`, info.noAlt === 0 && info.broken === 0);
      ok(`${p}: tel: correcto`, info.tels.length > 0 && info.tels.every((t) => t === 'tel:+34691312106'), [...new Set(info.tels)].join());
      ok(`${p}: WhatsApp correcto`, info.was.length > 0 && info.was.every((w) => w === 'https://wa.me/34691312106'), [...new Set(info.was)].join());
      ok(`${p}: lang=es`, info.lang === 'es');
    } else {
      ok(`${tag}: objetivos táctiles >= 24 px`, info.small.length === 0, info.small.join(', '));
    }
    await page.close();
  }
  await ctx.close();
}

// 2. Enlaces internos, anclas y externos esperados
{
  const internal = [...new Set([...linkSet].filter((l) => l.startsWith('/') && !l.startsWith('//')).map((l) => l.split('#')[0]).filter(Boolean))];
  const bad = [];
  for (const l of internal) { const r = await fetch(BASE + l, { redirect: 'manual' }); if (r.status >= 400) bad.push(`${r.status} ${l}`); }
  ok(`enlaces internos (${internal.length})`, bad.length === 0, bad.join(', '));
  const anchors = [...linkSet].filter((l) => /^\/?[^#]*#[\w-]+$/.test(l) && !l.startsWith('//'));
  const miss = [];
  for (const l of anchors) {
    const [path, id] = l.split('#');
    if (!path) continue; // anclas de la propia página: se comprueban en cada página abajo
    const html = await (await fetch(BASE + path)).text();
    if (!new RegExp(` id="${id}"`).test(html)) miss.push(l);
  }
  ok(`anclas a otras páginas con destino (${anchors.length})`, miss.length === 0, miss.join(', '));
  const local = [];
  for (const p of paths) {
    const html = await (await fetch(BASE + p)).text();
    for (const m of html.matchAll(/href="#([\w-]+)"/g)) if (!new RegExp(` id="${m[1]}"`).test(html)) local.push(`${p}#${m[1]}`);
  }
  ok('anclas internas de cada página con destino', local.length === 0, [...new Set(local)].join(', '));
  const ext = [...linkSet].filter((l) => /^https?:/.test(l));
  const allowed = [/^https:\/\/wa\.me\/34691312106$/, /^https:\/\/www\.google\.com\/maps\?cid=1539571755307103610$/, /^https:\/\/www\.instagram\.com\/daniel_proreforma\/$/, /^https:\/\/www\.facebook\.com\/profile\.php\?id=61572650646708$/, /^https:\/\/www\.aepd\.es$/];
  const strange = [...new Set(ext.filter((l) => !allowed.some((re) => re.test(l))))];
  ok('enlaces externos: solo los oficiales verificados', strange.length === 0, strange.join(', '));
}

// 3. Reseñas: modo editorial (sin API) y modo API simulado
{
  const r = await (await fetch(BASE + '/api/resenas.php')).json();
  ok('API de reseñas sin configurar responde available:false', r.available === false, JSON.stringify(r));
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelector('#opiniones').scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(600);
  const ed = await page.evaluate(() => ({
    rating: document.querySelector('[data-g-rating]').textContent, count: document.querySelector('[data-g-count]').textContent,
    when: document.querySelector('[data-g-when]').textContent, href: document.querySelector('[data-g-badge]').href,
    quotes: document.querySelectorAll('#opiniones blockquote').length, source: [...document.querySelectorAll('#opiniones .quote-card__src')].every((s) => s.textContent.includes('Google')),
  }));
  ok('reseñas (editorial): valoración y número con fecha de consulta', ed.rating === '5,0' && ed.count === '41' && /15 de octubre de 2026/.test(ed.when), JSON.stringify(ed));
  ok('reseñas (editorial): enlace a la ficha verificada', ed.href === 'https://www.google.com/maps?cid=1539571755307103610');
  ok('reseñas (editorial): cada cita atribuida a Google', ed.quotes >= 4 && ed.source);
  await page.screenshot({ path: `${OUT}/resenas-editorial.png` });
  // Modo API simulado: la web debe sustituir el bloque y atribuir a cada autor
  const p2 = await ctx.newPage();
  await p2.route('**/api/resenas.php', (rt) => rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ available: true, rating: 4.9, count: 52, mapsUri: 'https://maps.google.com/?cid=1539571755307103610', reviews: [{ text: 'Texto de prueba', rating: 5, when: 'hace 2 semanas', uri: 'https://maps.google.com/review', author: { name: 'Autor Prueba', uri: 'https://www.google.com/maps/contrib/1', photo: '' } }] }) }));
  await p2.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p2.evaluate(() => document.querySelector('#opiniones').scrollIntoView({ behavior: 'instant' }));
  await p2.waitForTimeout(800);
  const live = await p2.evaluate(() => ({ rating: document.querySelector('[data-g-rating]').textContent, count: document.querySelector('[data-g-count]').textContent, when: document.querySelector('[data-g-when]').textContent, author: document.querySelector('[data-g-list] .quote-card__who a')?.href, attr: document.querySelector('.reviews__attr')?.textContent, review: document.querySelector('[data-g-list] .quote-card__src a')?.href }));
  ok('reseñas (API): datos en vivo sustituyen a los fijos, sin fecha antigua', live.rating === '4,9' && live.count === '52' && !/octubre/.test(live.when), JSON.stringify(live));
  ok('reseñas (API): autor enlazado, reseña enlazada y fuente Google', live.author === 'https://www.google.com/maps/contrib/1' && live.review === 'https://maps.google.com/review' && /Google/.test(live.attr || ''));
  await ctx.close();
}

// 4. Formulario: validación, envío real, error sin perder datos, preselección
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const tracked = [];
  await page.exposeFunction('__track', (d) => tracked.push(d));
  await page.addInitScript(() => document.addEventListener('pr:track', (e) => window.__track(e.detail)));
  await page.goto(BASE + '/contacto/', { waitUntil: 'networkidle' });
  const pre = await page.evaluate(() => [...document.querySelectorAll('input[type=checkbox]:checked, input[type=radio]:checked')].length);
  ok('formulario: ninguna casilla ni opción premarcada', pre === 0, String(pre));
  await page.click('form[data-quote] button[type=submit]');
  await page.waitForTimeout(200);
  const v = await page.evaluate(() => ({ inv: document.querySelector('#q-nombre').getAttribute('aria-invalid'), focus: document.activeElement.id, e1: document.querySelector('#q-nombre-err').textContent, e2: document.querySelector('#q-contacto-err').textContent }));
  ok('validación: errores claros y foco en el primer campo', v.inv === 'true' && v.focus === 'q-nombre' && v.e1 && v.e2, JSON.stringify(v));
  await page.fill('#q-nombre', 'Prueba QA');
  await page.fill('#q-telefono', '123');
  await page.click('form[data-quote] button[type=submit]');
  ok('validación: teléfono corto', /9 cifras/.test(await page.textContent('#q-contacto-err')));
  await page.fill('#q-telefono', '600 000 000');
  await page.click('label.opt:has(input[value="parcial"])');
  await page.click('label.opt:has(input[value="whatsapp"])');
  await page.fill('#q-localidad', 'Rivas-Vaciamadrid');
  await page.fill('#q-mensaje', 'Prueba automática de QA. No responder.');
  await page.waitForTimeout(3200);
  const [resp] = await Promise.all([page.waitForResponse((r) => r.url().endsWith('/contacto.php')), page.click('form[data-quote] button[type=submit]')]);
  const body = await resp.json();
  await page.waitForTimeout(300);
  const st = await page.evaluate(() => { const s = document.querySelector('[data-status]'); return { hidden: s.hidden, cls: s.className }; });
  ok('envío real: el servidor confirma', resp.status() === 200 && body.ok === true, JSON.stringify(body));
  ok('envío real: confirmación solo tras la respuesta', !st.hidden && st.cls.includes('is-ok'));
  const mail = readFileSync(OUTBOX, 'utf8').split('Nueva solicitud de presupuesto desde proreforma.es').pop();
  ok('envío real: el correo lleva tipo, vía y localidad', /Trabajo:\s+Baño, cocina o una estancia/.test(mail) && /Contactar:\s+WhatsApp/.test(mail) && /Localidad:\s+Rivas-Vaciamadrid/.test(mail), (mail.match(/Trabajo:.*/) || [''])[0]);
  ok('medición: eventos pedidos', ['form_start', 'select_service', 'form_submit', 'form_success'].every((e) => tracked.some((t) => t.event === e)), [...new Set(tracked.map((t) => t.event))].join(','));
  ok('medición: form_submit solo con envío validado', tracked.filter((t) => t.event === 'form_submit').length === 1);
  // Error de servidor
  const p2 = await ctx.newPage();
  await p2.route('**/contacto.php', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ ok: false, message: 'No hemos podido enviar tu solicitud.' }) }));
  await p2.goto(BASE + '/servicios/pinturas/', { waitUntil: 'networkidle' });
  const t0 = await p2.evaluate(() => document.querySelector('input[name=tipo]:checked')?.value);
  ok('página de servicio preselecciona el tipo de trabajo', t0 === 'pintura', String(t0));
  await p2.fill('#q-nombre', 'Prueba QA');
  await p2.fill('#q-email', 'qa@example.com');
  await p2.fill('#q-mensaje', 'Texto que no debe perderse');
  await p2.waitForTimeout(3200);
  await p2.click('form[data-quote] button[type=submit]');
  await p2.waitForTimeout(500);
  const st2 = await p2.evaluate(() => { const s = document.querySelector('[data-status]'); return { cls: s.className, html: s.innerHTML, kept: [document.querySelector('#q-nombre').value, document.querySelector('#q-mensaje').value] }; });
  ok('error de servidor: sin falso éxito y con alternativas', st2.cls.includes('is-err') && st2.html.includes('tel:') && st2.html.includes('wa.me') && st2.html.includes('mailto:'));
  ok('error de servidor: no se pierde ningún dato', st2.kept[0] === 'Prueba QA' && st2.kept[1] === 'Texto que no debe perderse');
  await ctx.close();
}

// 5. Sin JavaScript
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-sc-cue], [data-sc-in], [data-sc-reveal]')].filter((e) => getComputedStyle(e).opacity !== '1' || (getComputedStyle(e).clipPath !== 'none' && getComputedStyle(e).clipPath !== '')).length);
  ok('sin JS: todo el contenido visible', hidden === 0, `${hidden} ocultos`);
  const pics = await page.evaluate(() => [...document.querySelectorAll('.phase__pic')].map((f) => getComputedStyle(f).position + ':' + getComputedStyle(f).clipPath).join(' '));
  ok('sin JS: las cuatro fases del proyecto se ven una tras otra', !/absolute/.test(pics), pics);
  await page.goto(BASE + '/contacto/', { waitUntil: 'load' });
  await page.fill('#q-nombre', 'Prueba sin JS');
  await page.fill('#q-email', 'qa-nojs@example.com');
  await Promise.all([page.waitForNavigation(), page.click('form[data-quote] button[type=submit]')]);
  ok('sin JS: envío real y redirección a /gracias/', page.url().endsWith('/gracias/'), page.url());
  await page.goto(BASE + '/contacto/', { waitUntil: 'load' });
  await Promise.all([page.waitForNavigation(), page.click('form[data-quote] button[type=submit]')]);
  ok('sin JS: datos inválidos a /envio-no-completado/', page.url().endsWith('/envio-no-completado/'), page.url());
  await ctx.close();
}

// 6. Teclado, menús y móvil
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const hidden = [];
  for (let i = 0; i < 220; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(220);
    const s = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return 'END';
      const r = el.getBoundingClientRect();
      let o = 1, n = el; while (n && n !== document.documentElement) { o *= +getComputedStyle(n).opacity; n = n.parentElement; }
      const isOpt = el.matches('.opt input');
      const target = isOpt ? el.nextElementSibling.getBoundingClientRect() : r;
      return { t: (el.textContent || el.name || el.id).trim().slice(0, 40), o: +o.toFixed(2), on: target.bottom > 0 && target.top < innerHeight && target.right > 0 && target.left < innerWidth, isOpt };
    });
    if (s === 'END') { ok('teclado: recorrido completo', i > 40, `${i} paradas`); break; }
    if (!s.isOpt && (s.o < 0.85 || !s.on)) hidden.push(`${s.t} (op ${s.o}, en pantalla ${s.on})`);
  }
  ok('teclado: cada foco visible y en pantalla', hidden.length === 0, hidden.slice(0, 5).join(' | '));
  await page.evaluate(() => scrollTo(0, 0));
  await page.click('[data-drop]');
  ok('menú Servicios se abre', await page.isVisible('#menu-servicios'));
  await page.keyboard.press('Escape');
  ok('menú Servicios se cierra con Escape', !(await page.isVisible('#menu-servicios')));
  await ctx.close();

  const m = await browser.newContext({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  await mp.goto(BASE + '/', { waitUntil: 'networkidle' });
  const acts = await mp.evaluate(() => [...document.querySelectorAll('[data-mobile-flow]')].map((a) => a.getAttribute('data-sc-act')).join());
  ok('móvil: el proyecto fase a fase va en flujo (sin pin)', acts === 'flow', acts);
  const fit = await mp.evaluate(() => Math.max(...[...document.querySelectorAll('.bar__in > *, .bar__act > *')].filter((e) => e.getBoundingClientRect().width).map((e) => e.getBoundingClientRect().right)) <= innerWidth);
  ok('móvil: la cabecera cabe', fit);
  await mp.click('[data-burger]');
  ok('menú móvil se abre', await mp.isVisible('#menu-movil'));
  await mp.keyboard.press('Escape');
  ok('menú móvil se cierra con Escape', !(await mp.isVisible('#menu-movil')));
  await mp.click('[data-burger]');
  await mp.click('#menu-movil a[href="/servicios/insonorizacion/"]');
  await mp.waitForURL('**/servicios/insonorizacion/');
  ok('menú móvil navega', mp.url().endsWith('/servicios/insonorizacion/'));
  await mp.goto(BASE + '/', { waitUntil: 'networkidle' });
  await mp.evaluate(() => document.querySelector('#presupuesto').scrollIntoView({ behavior: 'instant' }));
  await mp.waitForTimeout(500);
  ok('móvil: el WhatsApp flotante se oculta sobre el formulario', await mp.evaluate(() => document.querySelector('.wa-float').classList.contains('is-hidden')));
  const unseen = await mp.evaluate(async () => {
    const out = [];
    for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
      scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 140));
      document.querySelectorAll('[data-sc-cue], [data-sc-in]').forEach((e) => { const r = e.getBoundingClientRect(); if (r.top > 80 && r.bottom < innerHeight * 0.8 && r.height > 0 && +getComputedStyle(e).opacity < 0.5) out.push((e.textContent || '').trim().slice(0, 30)); });
    }
    return [...new Set(out)];
  });
  ok('móvil: ningún bloque queda invisible estando en pantalla', unseen.length === 0, unseen.join(' | '));
  await m.close();
}

const fails = results.filter((r) => !r.pass);
console.log(`\n${results.length - fails.length}/${results.length} comprobaciones superadas`);
if (fails.length) { console.log('FALLOS:'); fails.forEach((f) => console.log(' - ' + f.name + ' · ' + f.info)); }
await browser.close();
