// Genera MRI V2 en site/. Sin dependencias: `node src/build.mjs`.
//
// La V2 no copia la V1: lee su contenido (data.mjs), sus plantillas de páginas
// interiores y su maquetación común (cabecera, pie, formulario) directamente de
// proyectos/mr-instalaciones/src, y sus archivos estáticos (fuentes, marca,
// motor, site.js, contacto.php) de proyectos/mr-instalaciones/site. La V1 no se
// modifica. Lo propio de la V2 es la portada (pages.mjs), la secuencia
// (film.mjs), la hoja de estilos y film.js.
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, SERVICES } from '../../mr-instalaciones/src/data.mjs';
import * as V1 from '../../mr-instalaciones/src/pages.mjs';
import { ASSET_V as V1_ASSET_V } from '../../mr-instalaciones/src/layout.mjs';
import { home, ASSET_V } from './pages.mjs';
import { FILM } from './film.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', 'site');
const v1site = join(here, '..', '..', 'mr-instalaciones', 'site');

// ---------------------------------------------------- estáticos de la V1 --
const shared = [
  'assets/fonts/geist.woff2', 'assets/fonts/geist-mono.woff2',
  'assets/fonts/LICENSE-geist.txt',
  'assets/brand', 'assets/og', 'assets/vendor',
  'assets/js/boot.js', 'assets/js/site.js',
  'contacto.php', 'favicon.ico',
];
for (const rel of shared) cpSync(join(v1site, rel), join(root, rel), { recursive: true });

// Misma configuración de Apache que la V1, con dos añadidos que el vídeo exige:
// la CSP admite media blob: (el motor carga el clip como Blob para poder buscar
// sin peticiones por rangos) y los .mp4/.webm se cachean como el resto de
// recursos versionados.
const must = (s, find, repl) => {
  if (!s.includes(find)) throw new Error(`La plantilla de la V1 ha cambiado: no se encuentra «${find}»`);
  return s.replace(find, repl);
};
let ht = readFileSync(join(v1site, '.htaccess'), 'utf8');
ht = must(ht, "connect-src 'self';", "connect-src 'self'; media-src 'self' blob:;");
ht = must(ht, '<FilesMatch "\\.(woff2|webp|png|svg|ico)$">', '<FilesMatch "\\.(woff2|webp|png|svg|ico|mp4|webm)$">');
ht = must(ht, '<IfModule mod_deflate.c>', 'AddType video/mp4 .mp4\nAddType video/webm .webm\n\n<IfModule mod_deflate.c>');
writeFileSync(join(root, '.htaccess'), ht.replace('# MRI · configuración', '# MRI V2 · configuración'));

// ------------------------------------------------------------ las páginas --
// Las páginas interiores salen de las plantillas de la V1; solo cambian la
// fuente de titulares que se precarga (Instrument Serif), el color de la
// barra del navegador y la versión de los recursos.
// Botón flotante de WhatsApp en todas las páginas, con un mensaje ya escrito.
// En las páginas de servicio el mensaje nombra el servicio.
const WA = { number: '34667369838', display: '+34 667 36 98 38' };
const WA_TOPIC = {
  'fontaneria-saneamiento': 'fontanería y saneamiento', 'calefaccion-climatizacion': 'calefacción y climatización',
  aerotermia: 'aerotermia', 'instalaciones-de-gas': 'una instalación de gas', ventilacion: 'ventilación', domotica: 'domótica',
};
const waButton = (rel) => {
  const topic = WA_TOPIC[(rel.match(/^servicios\/([^/]+)\//) || [])[1]];
  const text = `Hola, os escribo desde la web de MRI. Quería pedir información${topic ? ` sobre ${topic}` : ''}.`;
  return `<a class="wa" href="https://wa.me/${WA.number}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener" data-wa data-track="click_whatsapp" data-track-loc="flotante" aria-label="Escribir por WhatsApp al ${WA.display} (se abre en otra pestaña)">`
    + '<svg class="wa__ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="wa__b" d="M12 3.2a8.7 8.7 0 0 0-7.5 13.2L3.3 20.8l4.5-1.2A8.7 8.7 0 1 0 12 3.2z"/><path class="wa__h" d="M9 8.2c.3-.6.6-.6.9-.6h.6c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .5-.1.6l-.6.7c-.1.1-.2.3 0 .5.4.7 1.6 2 3 2.6.2.1.4 0 .5-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.2.1.3.3.3.5 0 .6-.3 1.6-1.6 1.9-1 .2-2.7-.2-4.6-1.8-1.6-1.4-2.6-3.1-2.8-3.9-.3-1.1.2-2.1.6-2.7z"/></svg></a>\n'
    + `<script src="/assets/js/wa.js?v=${ASSET_V}" defer></script>\n`;
};

const v2ify = (html, rel) => {
  let h = must(html, '/assets/fonts/archivo-wdth.woff2', '/assets/fonts/instrument-serif.woff2');
  h = must(h, '<meta name="theme-color" content="#EDEEEB">', '<meta name="theme-color" content="#EFECE6">');
  // Logotipo claro para la barra sobre la imagen, en el marcado (no en JS):
  // así funciona también sin JavaScript. Solo en la portada, la única página
  // con la barra sobre una imagen.
  if (h.includes('class="page-home')) h = must(h, '<img src="/assets/brand/logo-mri.webp" width="284" height="180" alt="MRI · Martínez Rojas Instalaciones">',
    '<img src="/assets/brand/logo-mri.webp" width="284" height="180" alt="MRI · Martínez Rojas Instalaciones"><img class="bar__logo-alt" src="/assets/brand/logo-mri-claro.webp" width="284" height="180" alt="" aria-hidden="true">');
  h = must(h, '</body>', waButton(rel) + '</body>');
  return h.replaceAll(`?v=${V1_ASSET_V}`, `?v=${ASSET_V}`);
};

const out = (rel, html) => {
  const f = join(root, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, v2ify(html, rel).replace(/\n{3,}/g, '\n\n'));
};

// El clip se versiona por su contenido: el nombre no cambia y la caché es de un año.
const filmFile = join(root, 'assets/film/film.json');
if (!existsSync(filmFile)) throw new Error('Falta site/assets/film/film.json: ejecuta tools/video/prepare.mjs con el clip.');
const filmMeta = JSON.parse(readFileSync(filmFile, 'utf8'));
const hash = (f) => createHash('sha1').update(readFileSync(join(root, 'assets/film', f))).digest('hex').slice(0, 8);
if (!filmMeta.portrait) throw new Error('Falta la versión vertical en film.json: ejecuta tools/video/prepare.mjs <clip> --portrait.');
filmMeta.v = { mp4: hash('film.mp4'), webm: hash('film.webm'), poster: hash('poster.webp'), mp4V: hash('film-v.mp4'), webmV: hash('film-v.webm'), posterV: hash('poster-v.webp') };
const size = (f) => statSync(join(root, 'assets/film', f)).size;
filmMeta.bytes = { mp4: size('film.mp4'), webm: size('film.webm'), mp4V: size('film-v.mp4'), webmV: size('film-v.webm') };

const pages = [
  ['index.html', home(filmMeta), '/', '1.0'],
  ...SERVICES.map((s) => [`servicios/${s.slug}/index.html`, V1.service(s), `/servicios/${s.slug}/`, '0.9']),
  ['empresas-y-obra-nueva/index.html', V1.empresas(), '/empresas-y-obra-nueva/', '0.8'],
  ['certificaciones/index.html', V1.certificaciones(), '/certificaciones/', '0.7'],
  ['trabaja-con-nosotros/index.html', V1.trabaja(), '/trabaja-con-nosotros/', '0.4'],
  ['aviso-legal/index.html', V1.avisoLegal(), '/aviso-legal/', '0.2'],
  ['politica-de-privacidad/index.html', V1.privacidad(), '/politica-de-privacidad/', '0.2'],
  ['politica-de-cookies/index.html', V1.cookies(), '/politica-de-cookies/', '0.2'],
  ['gracias/index.html', V1.gracias(), null],
  ['envio-no-completado/index.html', V1.envioError(), null],
  ['404.html', V1.notFound(), null],
];
for (const [rel, html] of pages) out(rel, html);

// La reserva de altura del acto en CSS (contra el CLS) debe coincidir con el span.
{
  const css = readFileSync(join(root, 'assets/css/site.css'), 'utf8');
  const m = css.match(/--film-span:\s*([\d.]+)/);
  if (!m || +m[1] !== FILM.span) throw new Error(`site.css --film-span (${m && m[1]}) no coincide con FILM.span (${FILM.span})`);
}

const today = new Date().toISOString().slice(0, 10);
const urls = pages.filter((p) => p[2]).map(([, , path, prio]) => `  <url><loc>${SITE.origin}${path}</loc><lastmod>${today}</lastmod><priority>${prio}</priority></url>`);
writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
writeFileSync(join(root, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /contacto.php\nDisallow: /gracias/\nDisallow: /envio-no-completado/\n\nSitemap: ${SITE.origin}/sitemap.xml\n`);

console.log(`V2: ${pages.length} páginas en site/ · clip ${filmMeta.width}x${filmMeta.height}, ${filmMeta.duration}s (MP4 ${(filmMeta.bytes.mp4 / 1048576).toFixed(2)} MB, WebM ${(filmMeta.bytes.webm / 1048576).toFixed(2)} MB) · vertical ${filmMeta.portrait.w}x${filmMeta.portrait.h} (MP4 ${(filmMeta.bytes.mp4V / 1048576).toFixed(2)} MB, WebM ${(filmMeta.bytes.webmV / 1048576).toFixed(2)} MB)`);
