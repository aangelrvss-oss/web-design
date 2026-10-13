// Genera el sitio estático en site/. Sin dependencias: `node src/build.mjs`.
// Los archivos escritos a mano (CSS, JS, PHP, fuentes, imágenes, motor) viven
// ya en site/ y este script no los toca.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, SERVICES } from './data.mjs';
import * as P from './pages.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const out = (rel, html) => {
  const f = join(root, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, html.replace(/\n{3,}/g, '\n\n'));
  return rel;
};

const pages = [
  ['index.html', P.home(), '/', '1.0'],
  ...SERVICES.map((s) => [`${s.slug}/index.html`, P.service(s), `/${s.slug}/`, '0.9']),
  ['aviso-legal.html', P.avisoLegal(), '/aviso-legal.html', '0.2'],
  ['politica-privacidad.html', P.privacidad(), '/politica-privacidad.html', '0.2'],
  ['politica-cookies.html', P.cookies(), '/politica-cookies.html', '0.2'],
  ['gracias/index.html', P.gracias(), null],
  ['envio-no-completado/index.html', P.envioError(), null],
  ['404.html', P.notFound(), null],
];

for (const [rel, html] of pages) out(rel, html);

const today = new Date().toISOString().slice(0, 10);
const urls = pages.filter((p) => p[2]).map(([, , path, prio]) => `  <url><loc>${SITE.origin}${path}</loc><lastmod>${today}</lastmod><priority>${prio}</priority></url>`);
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
out('robots.txt', `User-agent: *\nAllow: /\nDisallow: /contacto.php\nDisallow: /gracias/\nDisallow: /envio-no-completado/\n\nSitemap: ${SITE.origin}/sitemap.xml\n`);

// Aviso si faltan imágenes referenciadas (p. ej. las generadas aún sin descargar).
const missing = new Set();
for (const [, html] of pages) {
  for (const m of html.matchAll(/\/assets\/img\/([\w-]+\.webp)/g)) if (!existsSync(join(root, 'assets/img', m[1]))) missing.add(m[1]);
}
if (missing.size) console.warn(`AVISO: faltan ${missing.size} imágenes: ${[...missing].sort().join(', ')}`);
console.log(`built ${pages.length} pages into site/`);
