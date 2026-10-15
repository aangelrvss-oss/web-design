// Copia de site/ para Netlify, que no ejecuta PHP.
//  - Por defecto, DEMOSTRACIÓN: noindex, aviso en el pie y formulario que
//    valida pero no envía (lo dice antes y después de enviar).
//  - --forms: formulario real con Netlify Forms (llega al panel de Netlify y
//    por correo si se configura la notificación). Sigue con noindex salvo --index.
//  - Reseñas: función netlify/functions/resenas.mjs en /api/resenas; sin
//    GOOGLE_PLACES_API_KEY y GOOGLE_PLACE_ID responde {available:false} y la
//    web muestra el bloque fechado. Las funciones requieren desplegar con Git o
//    con la CLI de Netlify: arrastrando el zip solo se publica lo estático.
// Uso: node tools/demo/build-netlify.mjs [--forms] [--index] [--url https://x.netlify.app]
// Resultado: dist/netlify/ y entregables/pro-reforma-propuesta-netlify.zip
import { cpSync, rmSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (f) => process.argv.includes(f);
const iu = process.argv.indexOf('--url');
const URL = (iu > -1 ? process.argv[iu + 1] : 'https://pro-reforma-propuesta.netlify.app').replace(/\/$/, '');
const FORMS = arg('--forms');
const INDEX = arg('--index');
const out = join(root, 'dist', 'netlify');

rmSync(out, { recursive: true, force: true });
cpSync(join(root, 'site'), out, { recursive: true, filter: (src) => !/(\.php|\.htaccess|sitemap\.xml)$/.test(src) });
rmSync(join(out, 'api'), { recursive: true, force: true });
mkdirSync(join(out, 'netlify', 'functions'), { recursive: true });
cpSync(join(root, 'netlify', 'functions', 'resenas.mjs'), join(out, 'netlify', 'functions', 'resenas.mjs'));

const NOTE = FORMS
  ? '<p class="foot__demo">Propuesta de diseño para Pro Reforma. No es la web oficial.</p>'
  : '<p class="foot__demo">Propuesta de diseño para Pro Reforma. Versión de demostración: no es la web oficial y el formulario no envía datos.</p>';
const DEMO = '<p class="qf__demo">Copia de demostración: el formulario comprueba los datos, pero <strong>no envía nada</strong>. Para contactar: 691 312 106.</p>';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
let pages = 0;
for (const f of walk(out).filter((p) => p.endsWith('.html'))) {
  let h = readFileSync(f, 'utf8');
  if (!INDEX) h = h.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
  h = h.replace(/(<link rel="canonical" href=")https:\/\/www\.proreforma\.es/, `$1${URL}`)
    .replace(/(<meta property="og:(?:url|image)" content=")https:\/\/www\.proreforma\.es/g, `$1${URL}`)
    .replace('<p class="foot__copy">', `${NOTE}\n    <p class="foot__copy">`);
  if (FORMS) {
    h = h.replace(/<form class="qf" name="presupuesto" action="\/contacto\.php" method="post" novalidate data-quote/g,
      '<form class="qf" name="presupuesto" action="/gracias/" method="post" novalidate data-netlify="true" netlify-honeypot="web" data-netlify-form data-quote')
      .replace(/<input type="hidden" name="origen"/g, '<input type="hidden" name="form-name" value="presupuesto">\n  <input type="hidden" name="origen"');
  } else {
    h = h.replace(/<form class="qf" name="presupuesto" action="\/contacto\.php"/g, '<form class="qf" name="presupuesto" action="/formulario-demo/" data-demo')
      .replace(/(<form class="qf"[^>]*>)/g, `$1\n  ${DEMO}`);
  }
  writeFileSync(f, h);
  pages++;
}
if (!FORMS) {
  const err = readFileSync(join(out, 'envio-no-completado', 'index.html'), 'utf8')
    .replace(/<title>[^<]*<\/title>/, '<title>Versión de demostración | Pro Reforma</title>')
    .replace(/<h1 id="pg-h"([^>]*)>[^<]*<\/h1>/, '<h1 id="pg-h"$1>Versión de demostración</h1>')
    .replace(/<p class="lede">[^<]*<\/p>/, '<p class="lede">Esta copia de la web es una propuesta y no envía formularios. En la web publicada, la solicitud llega directamente a Pro Reforma.</p>');
  mkdirSync(join(out, 'formulario-demo'), { recursive: true });
  writeFileSync(join(out, 'formulario-demo', 'index.html'), err);
}
writeFileSync(join(out, 'robots.txt'), INDEX ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n');
const CSP = "default-src 'self'; img-src 'self' data: https://lh3.googleusercontent.com; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'";
writeFileSync(join(out, 'netlify.toml'), `# Generado por tools/demo/build-netlify.mjs
[build]
  publish = "."
  functions = "netlify/functions"

[[redirects]]
  from = "/api/resenas"
  to = "/.netlify/functions/resenas"
  status = 200

[[redirects]]
  from = "/contacto.php"
  to = "${FORMS ? '/gracias/' : '/formulario-demo/'}"
  status = 303

[[headers]]
  for = "/*"
  [headers.values]
${INDEX ? '' : '    X-Robots-Tag = "noindex, nofollow"\n'}    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    X-Frame-Options = "SAMEORIGIN"
    Content-Security-Policy = "${CSP}"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
`);
mkdirSync(join(root, 'entregables'), { recursive: true });
const zip = join(root, 'entregables', `pro-reforma-propuesta-netlify${FORMS ? '-formularios' : ''}.zip`);
rmSync(zip, { force: true });
execFileSync('zip', ['-qr9X', zip, '.'], { cwd: out });
console.log(`${pages} páginas · ${FORMS ? 'Netlify Forms' : 'demostración'} · ${INDEX ? 'indexable' : 'noindex'} · ${URL} · ${zip}`);
