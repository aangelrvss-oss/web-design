// Prueba de las copias para Netlify: demostración (no envía y lo dice) y
// Netlify Forms (POST codificado a "/" con form-name; éxito solo con 200).
// Uso: node qa/netlify.mjs <dir-demo> <dir-forms>   (sirve cada carpeta con php -S)
import { chromium } from '../../../qa/node_modules/playwright-core/index.mjs';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const router = join(dirname(fileURLToPath(import.meta.url)), '../../../tools/dev/router.php');
const [demoDir, formsDir] = process.argv.slice(2);
const res = [];
const ok = (n, p, i = '') => { res.push(p); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${i ? '  · ' + i : ''}`); };
const serve = (dir, port) => spawn('php', ['-S', `127.0.0.1:${port}`, router], { env: { ...process.env, SITE_ROOT: dir }, stdio: 'ignore' });
const s1 = serve(demoDir, 4793), s2 = serve(formsDir, 4794);
await new Promise((r) => setTimeout(r, 800));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const fill = async (p) => { await p.fill('#q-nombre', 'Prueba Netlify'); await p.fill('#q-contacto', '600000000'); await p.click('label.opt:has(input[value="pintura"])'); };
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://127.0.0.1:4793/contacto/', { waitUntil: 'networkidle' });
  const robots = await p.getAttribute('meta[name=robots]', 'content');
  const note = await p.isVisible('.qf__demo');
  let posted = false; p.on('request', (r) => { if (r.method() === 'POST') posted = true; });
  await fill(p); await p.click('form[data-quote] button[type=submit]'); await p.waitForTimeout(400);
  const msg = await p.textContent('[data-status]');
  ok('demo: noindex y aviso visible antes de rellenar', robots.startsWith('noindex') && note);
  ok('demo: al enviar dice que no envía y no hace ninguna petición', /no envía nada/.test(msg) && !posted, msg.slice(0, 60));
  ok('demo: sin errores de JS', errs.length === 0, errs.join('; '));
}
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  let body = '';
  await p.route('http://127.0.0.1:4794/', (rt) => { if (rt.request().method() === 'POST') { body = rt.request().postData() || ''; return rt.fulfill({ status: 200, body: 'ok' }); } return rt.continue(); });
  await p.goto('http://127.0.0.1:4794/contacto/', { waitUntil: 'networkidle' });
  await fill(p); await p.waitForTimeout(300); await p.click('form[data-quote] button[type=submit]'); await p.waitForTimeout(600);
  const msg = await p.textContent('[data-status]');
  const q = new URLSearchParams(body);
  ok('Netlify Forms: POST a "/" con form-name y los campos', q.get('form-name') === 'presupuesto' && q.get('nombre') === 'Prueba Netlify' && q.get('contacto') === '600000000' && q.get('tipo') === 'pintura', body.slice(0, 120));
  ok('Netlify Forms: confirmación solo con respuesta 200', /Solicitud enviada/.test(msg));
  const p2 = await (await b.newContext()).newPage();
  await p2.route('http://127.0.0.1:4794/', (rt) => rt.request().method() === 'POST' ? rt.fulfill({ status: 500, body: 'x' }) : rt.continue());
  await p2.goto('http://127.0.0.1:4794/contacto/', { waitUntil: 'networkidle' });
  await fill(p2); await p2.click('form[data-quote] button[type=submit]'); await p2.waitForTimeout(600);
  ok('Netlify Forms: si falla, error con alternativas y datos intactos', /No se ha enviado/.test(await p2.textContent('[data-status]')) && (await p2.inputValue('#q-nombre')) === 'Prueba Netlify');
}
await b.close(); s1.kill(); s2.kill();
console.log(`\n${res.filter(Boolean).length}/${res.length}`);
