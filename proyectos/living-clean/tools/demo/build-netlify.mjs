// Genera una copia de DEMOSTRACIÓN de site/ para Netlify (o cualquier hosting estático):
//  - sin indexación (noindex + robots.txt + cabecera X-Robots-Tag)
//  - aviso visible de que es una propuesta y no la web oficial
//  - formulario en modo demo (valida, no envía datos): Netlify no ejecuta PHP
//  - se niega a empaquetar si faltan imágenes (p. ej. las generadas sin descargar)
//  - _headers y _redirects con el formato de Netlify
// Uso: node tools/demo/build-netlify.mjs [--url https://mi-sitio.netlify.app]
// Resultado: dist/netlify/ y entregables/living-clean-propuesta-netlify.zip
import { cpSync, rmSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const argUrl = process.argv.indexOf('--url');
const URL = (argUrl > -1 ? process.argv[argUrl + 1] : 'https://living-clean-propuesta.netlify.app').replace(/\/$/, '');
const out = join(root, 'dist', 'netlify');

// Todas las imágenes que citan las páginas tienen que existir.
const walkSrc = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walkSrc(p) : [p]; });
const missing = new Set();
for (const f of walkSrc(join(root, 'site')).filter((p) => p.endsWith('.html'))) {
  for (const m of readFileSync(f, 'utf8').matchAll(/\/assets\/img\/([\w-]+\.webp)/g)) {
    try { statSync(join(root, 'site', 'assets', 'img', m[1])); } catch { missing.add(m[1]); }
  }
}
if (missing.size && !process.argv.includes('--allow-missing')) {
  console.error(`Faltan ${missing.size} imágenes (${[...missing].slice(0, 3).join(', ')}…). Ejecuta tools/fetch-higgsfield.sh antes de empaquetar.`);
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
cpSync(join(root, 'site'), out, { recursive: true, filter: (src) => !/(contacto\.php|\.htaccess|sitemap\.xml)$/.test(src) });

const NOTE = '<p class="foot__demo">Propuesta de diseño para Living Clean S.L. Versión de demostración: no es la web oficial y el formulario no envía datos.</p>';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
let pages = 0;
for (const f of walk(out).filter((p) => p.endsWith('.html'))) {
  let h = readFileSync(f, 'utf8');
  h = h
    .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">')
    .replace(/(<link rel="canonical" href=")https:\/\/livingclean\.es/, `$1${URL}`)
    .replace(/(<meta property="og:url" content=")https:\/\/livingclean\.es/, `$1${URL}`)
    .replace(/(<meta property="og:image" content=")https:\/\/livingclean\.es/, `$1${URL}`)
    .replace(/<form class="hv" /g, '<form class="hv" data-demo ')
    .replace('<p class="foot__copy">', `${NOTE}\n    <p class="foot__copy">`);
  writeFileSync(f, h);
  pages++;
}

// Página para envíos sin JavaScript (Netlify no ejecuta contacto.php).
const err = readFileSync(join(out, 'envio-no-completado', 'index.html'), 'utf8')
  .replace(/<title>[^<]*<\/title>/, '<title>Versión de demostración | Living Clean Multiservicios</title>')
  .replace(/<h1 id="pg-h"[^>]*>[^<]*<\/h1>/, '<h1 id="pg-h" class="sc-display sc-display--lg">Versión de demostración</h1>')
  .replace(/<p class="sc-lede">[^<]*<\/p>/, '<p class="sc-lede">Esta copia de la web es una propuesta y no envía formularios. En la web publicada, la solicitud llegará directamente a Living Clean.</p>');
mkdirSync(join(out, 'formulario-demo'), { recursive: true });
writeFileSync(join(out, 'formulario-demo', 'index.html'), err);

writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
writeFileSync(join(out, '_headers'), `/*
  X-Robots-Tag: noindex, nofollow
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: SAMEORIGIN
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'

/assets/css/*
  Cache-Control: public, max-age=31536000, immutable
/assets/js/*
  Cache-Control: public, max-age=31536000, immutable
/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
`);
writeFileSync(join(out, '_redirects'), `/contacto.php        /formulario-demo/        303
`);

mkdirSync(join(root, 'entregables'), { recursive: true });
const zip = join(root, 'entregables', 'living-clean-propuesta-netlify.zip');
rmSync(zip, { force: true });
execFileSync('zip', ['-qr9X', zip, '.'], { cwd: out });
console.log(`${pages} páginas · ${URL} · ${zip}`);
