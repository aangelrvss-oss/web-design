// Empaqueta la web en un único HTML autónomo para revisarla sin servidor:
// CSS, JS, fuentes e imágenes en línea. Las páginas de servicio y las legales
// van dentro del mismo archivo como capas que se abren por ancla (#pv-…), así
// que ningún enlace apunta a un destino falso. El formulario está en modo
// demostración y lo dice antes de rellenarlo. Solo para revisión interna.
// Uso: node tools/preview/bundle.mjs  ->  preview/living-clean-portada-preview.html
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVICES } from '../../src/data.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const site = join(root, 'site');
const read = (p) => readFileSync(join(site, p), 'utf8');
const mime = { woff2: 'font/woff2', webp: 'image/webp', png: 'image/png' };
const cache = new Map();
const dataUri = (p) => {
  if (!cache.has(p)) cache.set(p, `data:${mime[p.split('.').pop()]};base64,${readFileSync(join(site, p)).toString('base64')}`);
  return cache.get(p);
};
const has = (p) => existsSync(join(site, p));
const missing = new Set();

// Páginas incluidas como capas: ruta real -> ancla.
const PAGES = [
  ...SERVICES.map((s) => [`/${s.slug}/`, `${s.slug}/index.html`, `pv-${s.slug}`]),
  ['/aviso-legal.html', 'aviso-legal.html', 'pv-aviso-legal'],
  ['/politica-privacidad.html', 'politica-privacidad.html', 'pv-politica-privacidad'],
  ['/politica-cookies.html', 'politica-cookies.html', 'pv-politica-cookies'],
];
const anchorOf = Object.fromEntries(PAGES.map(([path, , id]) => [path, `#${id}`]));

// Enlaces internos -> anclas del propio archivo. Un enlace a una ruta que no
// esté incluida rompe el empaquetado en vez de quedar apuntando a otro sitio.
const relink = (html) => html.replace(/href="(\/[^"]*)"/g, (all, href) => {
  if (href.startsWith('//')) return all;
  if (href === '/') return 'href="#inicio"';
  if (href.startsWith('/#')) return `href="${href.slice(1)}"`;
  if (href.startsWith('/assets/')) return all;
  const target = anchorOf[href.split('#')[0]];
  if (!target) throw new Error(`Enlace interno sin destino en la vista previa: ${href}`);
  return `href="${target}"`;
});

const inlineImages = (html) => html
  .replace(/<source [^>]*>\n?\s*/g, (s) => { const m = s.match(/srcset="\/(assets\/[^ "]+)/); return m && has(m[1]) ? s.replace(/srcset="[^"]*"/, `srcset="${dataUri(m[1])}"`).replace(/ sizes="[^"]*"/, '') : ''; })
  .replace(/ srcset="[^"]*"/g, '').replace(/ sizes="[^"]*"/g, '')
  .replace(/<image href="\/(assets\/[^"]+\.webp)"/g, (_, p) => `<image href="${dataUri(p)}"`)
  .replace(/<img([^>]*?) src="\/(assets\/[^"]+\.(?:webp|png))"([^>]*)>/g, (all, a, p, b) => {
    if (has(p)) return `<img${a} src="${dataUri(p)}"${b}>`;
    missing.add(p.split('/').pop());
    return ''; // imagen generada aún sin descargar: queda el hueco
  });

// Una página secundaria: solo su <main>, sin coreografía, con ids prefijados y
// el formulario sustituido por un enlace al de la portada.
function layer([path, file, id]) {
  const html = read(file);
  const title = html.match(/<title>([^<]*)<\/title>/)[1].split(' | ')[0];
  let main = html.match(/<main id="contenido">([\s\S]*?)<\/main>/)[1];
  const typeAttr = (main.match(/<input type="radio" name="tipo" value="(\w+)" checked>/) || [])[1];
  const svcAttr = (main.match(/<input type="checkbox" name="servicio\[\]" value="([\w-]+)" checked>/) || [])[1];
  main = main.replace(/<section id="visita"[\s\S]*?<\/section>/, `<section class="pv-cta"><div class="sc-wrap">
      <p class="sc-display sc-display--md">¿Hablamos de tu caso?</p>
      <div class="cta-pair"><a class="btn btn--accent btn--lg" href="#visita"${typeAttr ? ` data-set-type="${typeAttr}"` : ''}${svcAttr ? ` data-set-service="${svcAttr}"` : ''}>Solicitar visita y presupuesto</a>
      <a class="btn btn--line btn--lg" href="tel:+34608825864">Llamar al 608 82 58 64</a></div></div></section>`);
  main = main
    .replace(/ data-sc-[\w-]+(="[^"]*")?/g, '')
    .replace(/ (id|for|aria-labelledby|aria-describedby|aria-controls)="([^"]+)"/g, (_, k, v) => ` ${k}="${v.split(' ').map((x) => `${id}-${x}`).join(' ')}"`)
    .replace(/href="#([\w-]+)"/g, (all, x) => (x === 'visita' ? all : `href="#${id}-${x}"`));
  return `<div class="pv-page" id="${id}" role="region" aria-label="${title}">
  <div class="pv-bar"><a href="#inicio">← Volver a la portada</a><span>Vista previa · ${title}</span><a href="#visita">Solicitar visita</a></div>
  ${main}
</div>`;
}

let html = read('index.html');
const css = read('assets/css/site.css').replace(/url\("\.\.\/fonts\/([^"]+)"\)/g, (_, f) => `url("${dataUri('assets/fonts/' + f)}")`);
const pvCss = `
.pv-page { display: none; position: fixed; inset: 0; z-index: 90; overflow: auto; background: var(--sc-canvas); }
.pv-page:target { display: block; }
.pv-page .svc-hero { padding-top: clamp(2rem, 5vw, 4rem); }
.pv-bar { position: sticky; top: 0; z-index: 2; display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; align-items: center; justify-content: space-between; padding: .7rem var(--sc-gutter); background: #1B1B1E; color: #fff; font-weight: 600; }
.pv-bar a { color: #fff; min-height: 40px; display: inline-flex; align-items: center; }
.pv-bar span { font-weight: 400; color: #D6CFCC; font-size: .9rem; }
.pv-cta { padding: var(--sc-section) 0; background: var(--warm); }
.pv-cta .cta-pair { margin-top: 1.5rem; }`;

html = html
  .replace(/<link rel="preload"[^>]*>\n?/g, '')
  .replace(/<link rel="(icon|apple-touch-icon)"[^>]*>\n?/g, '')
  .replace(/<link rel="stylesheet" href="\/assets\/vendor\/scrollcraft\/scrollcraft\.css[^"]*">/, () => `<style>${read('assets/vendor/scrollcraft/scrollcraft.css')}</style>`)
  .replace(/<link rel="stylesheet" href="\/assets\/css\/site\.css[^"]*">/, () => `<style>${css}${pvCss}</style>`)
  .replace(/<script src="\/assets\/js\/boot\.js[^"]*"><\/script>/, () => `<script>${read('assets/js/boot.js')}</script>`)
  .replace(/<script src="\/assets\/vendor\/scrollcraft\/scrollcraft\.js[^"]*" defer><\/script>/, () => `<script>${read('assets/vendor/scrollcraft/scrollcraft.js')}</script>`)
  .replace(/<script src="\/assets\/js\/site\.js[^"]*" defer><\/script>/, () => `<script>${read('assets/js/site.js')}</script>`)
  .replace(/<form class="hv" /g, '<form class="hv" data-demo ')
  .replace('<p class="hv__title"><span>Solicitud de visita</span><span>Living Clean</span></p>', (m) => `${m}\n      <p class="hv__demo">Vista previa: el formulario comprueba los datos, pero <strong>no envía nada</strong>. En la web publicada llegará a info@livingclean.es.</p>`)
  .replace('</footer>', () => `</footer>\n${PAGES.map(layer).join('\n')}`);

html = inlineImages(relink(html));

mkdirSync(join(root, 'preview'), { recursive: true });
const out = join(root, 'preview', 'living-clean-portada-preview.html');
writeFileSync(out, html);
console.log(out, Math.round(html.length / 1024) + ' KB', `· ${PAGES.length} páginas incluidas`, missing.size ? `· ${missing.size} imágenes generadas pendientes (huecos vacíos)` : '');
