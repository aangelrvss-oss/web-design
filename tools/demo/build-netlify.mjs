// Genera una copia de DEMOSTRACIÓN de site/ para Netlify (o cualquier hosting estático):
//  - sin indexación (noindex + robots.txt + cabecera X-Robots-Tag)
//  - aviso visible de que es una propuesta y no la web oficial
//  - formulario en modo demo (valida, no envía datos): Netlify no ejecuta PHP
//  - enlaces a los PDF de certificaciones apuntando a la web actual
//  - _headers y _redirects con el formato de Netlify
// Uso: node tools/demo/build-netlify.mjs [--url https://mi-sitio.netlify.app]
// Resultado: dist/netlify/ y entregables/mri-propuesta-netlify.zip
import { cpSync, rmSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const argUrl = process.argv.indexOf('--url');
const URL = (argUrl > -1 ? process.argv[argUrl + 1] : 'https://mri-propuesta.netlify.app').replace(/\/$/, '');
const LIVE = 'https://www.mrinstalaciones.com';
const out = join(root, 'dist', 'netlify');

rmSync(out, { recursive: true, force: true });
cpSync(join(root, 'site'), out, { recursive: true, filter: (src) => !/(contacto\.php|\.htaccess|sitemap\.xml)$/.test(src) });

const NOTE = '<p class="foot__demo">Propuesta de diseño para Martínez Rojas Instalaciones, S.L. Versión de demostración: no es la web oficial y el formulario no envía datos.</p>';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
let pages = 0;
for (const f of walk(out).filter((p) => p.endsWith('.html'))) {
  let h = readFileSync(f, 'utf8');
  h = h
    .replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">')
    .replace(/(<link rel="canonical" href=")https:\/\/www\.mrinstalaciones\.com/, `$1${URL}`)
    .replace(/(<meta property="og:url" content=")https:\/\/www\.mrinstalaciones\.com/, `$1${URL}`)
    .replace(/(<meta property="og:image" content=")https:\/\/www\.mrinstalaciones\.com/, `$1${URL}`)
    .replace(/href="\/wp-content\//g, `href="${LIVE}/wp-content/`)
    .replace(/<form class="tb" /g, '<form class="tb" data-demo ')
    .replace('<p class="foot__copy">', `${NOTE}\n    <p class="foot__copy">`);
  writeFileSync(f, h);
  pages++;
}

// Página para envíos sin JavaScript (Netlify no ejecuta contacto.php).
const err = readFileSync(join(out, 'envio-no-completado', 'index.html'), 'utf8')
  .replace(/<title>[^<]*<\/title>/, '<title>Versión de demostración | MRI · Martínez Rojas Instalaciones</title>')
  .replace(/<h1 id="pg-h"[^>]*>[^<]*<\/h1>/, '<h1 id="pg-h" class="sc-display sc-display--lg">Versión de demostración</h1>')
  .replace(/<p class="sc-lede">[^<]*<\/p>/, '<p class="sc-lede">Esta copia de la web es una propuesta y no envía formularios. En la web publicada, la solicitud llegará directamente a MRI.</p>');
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

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`);
writeFileSync(join(out, '_redirects'), `/contacto.php        /formulario-demo/        303
/aviso-legal         /aviso-legal/            301
/certificaciones     /certificaciones/        301
`);

mkdirSync(join(root, 'entregables'), { recursive: true });
const zip = join(root, 'entregables', 'mri-propuesta-netlify.zip');
rmSync(zip, { force: true });
execFileSync('zip', ['-qr9X', zip, '.'], { cwd: out });
console.log(`${pages} páginas · ${URL} · ${zip}`);
