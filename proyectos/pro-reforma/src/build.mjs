// Genera el sitio estático en site/. Sin dependencias: `node src/build.mjs`.
// CSS, JS, PHP, fuentes, imágenes y el motor viven ya en site/ y no se tocan.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, SERVICES, PROJECTS } from './data.mjs';
import * as P from './pages.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const out = (rel, html) => {
  const f = join(root, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, html.replace(/\n{3,}/g, '\n\n'));
};

const pages = [
  ['index.html', P.home(), '/', '1.0'],
  ['servicios/index.html', P.servicesIndex(), '/servicios/', '0.8'],
  ...SERVICES.map((s) => [`servicios/${s.slug}/index.html`, P.service(s), `/servicios/${s.slug}/`, s.main ? '0.9' : '0.6']),
  ['proyectos/index.html', P.projectsIndex(), '/proyectos/', '0.8'],
  ...PROJECTS.map((p) => [`proyectos/${p.slug}/index.html`, P.project(p), `/proyectos/${p.slug}/`, '0.6']),
  ['como-trabajamos/index.html', P.method(), '/como-trabajamos/', '0.7'],
  ['conocer-proreforma/index.html', P.about(), '/conocer-proreforma/', '0.6'],
  ['contacto/index.html', P.contact(), '/contacto/', '0.8'],
  ['aviso-legal/index.html', P.avisoLegal(), '/aviso-legal/', '0.2'],
  ['politica-de-privacidad/index.html', P.privacidad(), '/politica-de-privacidad/', '0.2'],
  ['politica-de-cookies/index.html', P.cookies(), '/politica-de-cookies/', '0.2'],
  ['declaracion-de-accesibilidad/index.html', P.accesibilidad(), '/declaracion-de-accesibilidad/', '0.2'],
  ['gracias/index.html', P.gracias(), null],
  ['envio-no-completado/index.html', P.envioError(), null],
  ['404.html', P.notFound(), null],
];
for (const [rel, html] of pages) out(rel, html);

const today = new Date().toISOString().slice(0, 10);
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter((p) => p[2]).map(([, , path, prio]) => `  <url><loc>${SITE.origin}${path}</loc><lastmod>${today}</lastmod><priority>${prio}</priority></url>`).join('\n')}\n</urlset>\n`);
out('robots.txt', `User-agent: *\nAllow: /\nDisallow: /contacto.php\nDisallow: /api/\nDisallow: /gracias/\nDisallow: /envio-no-completado/\n\nSitemap: ${SITE.origin}/sitemap.xml\n`);

const missing = new Set();
for (const [, html] of pages) for (const m of html.matchAll(/\/assets\/img\/([\w-]+\.webp)/g)) if (!existsSync(join(root, 'assets/img', m[1]))) missing.add(m[1]);
if (missing.size) console.warn(`AVISO: faltan imágenes: ${[...missing].join(', ')}`);
console.log(`built ${pages.length} pages into site/`);
