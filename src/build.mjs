// Genera el sitio estático en site/. Sin dependencias: `node src/build.mjs`.
// Los archivos escritos a mano (CSS, JS, PHP, fuentes, motor) viven ya en
// site/ y este script no los toca.
import { mkdirSync, writeFileSync } from 'node:fs';
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
  ...SERVICES.map((s) => [`servicios/${s.slug}/index.html`, P.service(s), `/servicios/${s.slug}/`, '0.9']),
  ['empresas-y-obra-nueva/index.html', P.empresas(), '/empresas-y-obra-nueva/', '0.8'],
  ['certificaciones/index.html', P.certificaciones(), '/certificaciones/', '0.7'],
  ['trabaja-con-nosotros/index.html', P.trabaja(), '/trabaja-con-nosotros/', '0.4'],
  ['aviso-legal/index.html', P.avisoLegal(), '/aviso-legal/', '0.2'],
  ['politica-de-privacidad/index.html', P.privacidad(), '/politica-de-privacidad/', '0.2'],
  ['politica-de-cookies/index.html', P.cookies(), '/politica-de-cookies/', '0.2'],
  ['gracias/index.html', P.gracias(), null],
  ['envio-no-completado/index.html', P.envioError(), null],
  ['404.html', P.notFound(), null],
];

for (const [rel, html] of pages) out(rel, html);

const today = new Date().toISOString().slice(0, 10);
const urls = pages.filter((p) => p[2]).map(([, , path, prio]) => `  <url><loc>${SITE.origin}${path}</loc><lastmod>${today}</lastmod><priority>${prio}</priority></url>`);
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
out('robots.txt', `User-agent: *\nAllow: /\nDisallow: /contacto.php\nDisallow: /gracias/\nDisallow: /envio-no-completado/\n\nSitemap: ${SITE.origin}/sitemap.xml\n`);

console.log(`built ${pages.length} pages into site/`);
