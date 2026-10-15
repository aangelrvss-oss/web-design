// Empaqueta la web en un único HTML autónomo para revisarla sin servidor:
// CSS, JS, fuentes e imágenes en línea. El resto de páginas van dentro del
// mismo archivo como capas que se abren por ancla (#pv-…), así que ningún
// enlace interno apunta a un destino falso: si una ruta no está incluida, el
// empaquetado falla. El formulario queda en modo demostración y lo dice antes
// de rellenarlo. Solo para revisión interna; no es la web publicada.
// Uso: node tools/preview/bundle.mjs  ->  preview/pro-reforma-preview.html
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const site = join(root, 'site');
const read = (p) => readFileSync(join(site, p), 'utf8');
const mime = { woff2: 'font/woff2', webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml' };
const cache = new Map();
const dataUri = (p) => {
  if (!cache.has(p)) cache.set(p, `data:${mime[p.split('.').pop()]};base64,${readFileSync(join(site, p)).toString('base64')}`);
  return cache.get(p);
};

// Páginas incluidas como capas: ruta real -> archivo -> ancla.
const ROUTES = [
  'servicios/', 'servicios/reformas-integrales/', 'servicios/pinturas/', 'servicios/insonorizacion/',
  'servicios/albanileria/', 'servicios/fontaneria/', 'servicios/electricidad/', 'servicios/carpinteria/', 'servicios/cerrajeria/',
  'proyectos/', 'proyectos/insonorizacion-de-una-habitacion/', 'proyectos/techos-y-acabados/',
  'como-trabajamos/', 'conocer-proreforma/', 'contacto/',
  'aviso-legal/', 'politica-de-privacidad/', 'politica-de-cookies/', 'declaracion-de-accesibilidad/',
];
const PAGES = ROUTES.map((r) => [`/${r}`, `${r}index.html`, `pv-${r.replace(/\/$/, '').replace(/\//g, '-')}`]);
const anchorOf = Object.fromEntries(PAGES.map(([path, , id]) => [path, `#${id}`]));

const relink = (html) => html.replace(/href="(\/[^"]*)"/g, (all, href) => {
  if (href.startsWith('//') || href.startsWith('/assets/')) return all;
  if (href === '/') return 'href="#inicio"';
  if (href.startsWith('/#')) return `href="${href.slice(1)}"`;
  const [pathq, hash] = href.split('#');
  const [path, query] = pathq.split('?');
  if (path === '/contacto/' && (hash === 'presupuesto' || query)) {
    const tipo = query && new URLSearchParams(query).get('tipo');
    return `href="#presupuesto"${tipo ? ` data-set-type="${tipo}"` : ''}`;
  }
  const target = anchorOf[path];
  if (!target) throw new Error(`Enlace interno sin destino en la vista previa: ${href}`);
  return `href="${target}"`;
});

const inlineImages = (html) => html
  .replace(/ srcset="[^"]*"/g, '').replace(/ sizes="[^"]*"/g, '')
  .replace(/<img([^>]*?) src="\/(assets\/[^"]+\.(?:webp|png|svg))"/g, (all, a, p) => {
    if (!existsSync(join(site, p))) throw new Error(`Imagen inexistente: ${p}`);
    return `<img${a} src="${dataUri(p)}"`;
  });

// Una página secundaria: solo su <main>, sin coreografía, con ids prefijados y
// el formulario sustituido por un enlace al de la portada (mismo tipo de obra).
function layer([, file, id]) {
  const html = read(file);
  const title = html.match(/<title>([^<]*)<\/title>/)[1].split(' | ')[0].split(' · ')[0];
  let main = html.match(/<main id="contenido">([\s\S]*?)<\/main>/)[1];
  const tipo = (main.match(/name="tipo" value="(\w+)" checked/) || [])[1];
  main = main.replace(/<section id="presupuesto"[\s\S]*?<\/form>[\s\S]*?<\/section>/, `<section class="pv-cta ground-navy"><div class="sc-wrap">
      <p class="display display--md">¿Hablamos de tu obra?</p>
      <div class="pv-cta__row"><a class="btn btn--accent" href="#presupuesto"${tipo ? ` data-set-type="${tipo}"` : ''}>Solicitar presupuesto</a>
      <a class="btn btn--ghost" href="tel:+34691312106">Llamar al 691 312 106</a></div></div></section>`);
  main = main
    .replace(/ data-sc-[\w-]+(="[^"]*")?/g, '')
    .replace(/ data-mobile-flow/g, '')
    .replace(/ loading="lazy"/g, '')
    .replace(/ (id|for|aria-labelledby|aria-describedby|aria-controls)="([^"]+)"/g, (_, k, v) => ` ${k}="${v.split(' ').map((x) => `${id}-${x}`).join(' ')}"`)
    .replace(/href="#([\w-]+)"/g, (all, x) => (x === 'presupuesto' || x === 'inicio' ? all : `href="#${id}-${x}"`));
  return `<div class="pv-page" id="${id}" role="region" aria-label="${title}">
  <div class="pv-bar"><a href="#inicio">← Portada</a><span>Vista previa · ${title}</span><a href="#presupuesto"${tipo ? ` data-set-type="${tipo}"` : ''}>Solicitar presupuesto</a></div>
  ${main}
</div>`;
}

const css = read('assets/css/site.css').replace(/url\("\.\.\/fonts\/([^"]+)"\)/g, (_, f) => `url("${dataUri('assets/fonts/' + f)}")`);
const pvCss = `
.pv-page .page-band { animation: none; }
.pv-page { display: none; position: fixed; inset: 0; z-index: 90; overflow: auto; background: var(--sc-canvas); }
.pv-page:target { display: block; }
.pv-bar { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; align-items: center; justify-content: space-between; padding: .6rem var(--sc-gutter); background: #0E2A44; color: #fff; font-weight: 600; }
.pv-bar a { color: #fff; min-height: 44px; display: inline-flex; align-items: center; }
.pv-bar span { font-weight: 400; color: #C9D3DD; font-size: .9rem; }
.pv-page .bar ~ * { padding-top: 0; }
.pv-cta { padding: var(--sc-section) 0; color: #fff; }
.pv-cta__row { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 1.4rem; }
.pv-cta .btn--line-light { border: 1.5px solid #fff; color: #fff; }
.qf__demo { margin: 0 0 1rem; padding: .7rem .9rem; border-left: 3px solid var(--sc-accent); background: #FBF3E8; font-size: .9rem; color: #16191E; }`;

let html = read('index.html')
  .replace(/<link rel="preload"[^>]*>\n?/g, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>\n?/g, '')
  .replace(/<link rel="icon" href="\/favicon\.svg"/, () => `<link rel="icon" href="${dataUri('favicon.svg')}"`)
  .replace(/<link rel="stylesheet" href="\/assets\/vendor\/scrollcraft\/scrollcraft\.css[^"]*">/, () => `<style>${read('assets/vendor/scrollcraft/scrollcraft.css')}</style>`)
  .replace(/<link rel="stylesheet" href="\/assets\/css\/site\.css[^"]*">/, () => `<style>${css}${pvCss}</style>`)
  .replace(/<script src="\/assets\/js\/boot\.js[^"]*"><\/script>/, () => `<script>${read('assets/js/boot.js')}</script>`)
  .replace(/<script src="\/assets\/vendor\/scrollcraft\/scrollcraft\.js[^"]*" defer><\/script>/, () => `<script>${read('assets/vendor/scrollcraft/scrollcraft.js')}</script>`)
  .replace(/<script src="\/assets\/js\/site\.js[^"]*" defer><\/script>/, () => `<script>${read('assets/js/site.js').replace('if (!window.fetch) return;', 'return; /* vista previa: sin servidor de reseñas */')}</script>`)
  .replace('<main id="contenido">', '<main id="contenido"><span id="inicio"></span>')
  .replace(/(<form class="qf"[^>]*?) novalidate data-quote/, '$1 novalidate data-demo data-quote')
  .replace(/(<form class="qf"[^>]*data-origin="home">)/, `$1\n      <p class="qf__demo">Vista previa: el formulario comprueba los datos, pero <strong>no envía nada</strong>. En la web publicada la solicitud llegará a daniel@proreforma.es.</p>`)
  .replace(/(<footer[\s\S]*?<\/footer>)/, (f) => `${f}\n${PAGES.map(layer).join('\n')}`);

if (!html.includes('data-demo')) throw new Error('No se pudo poner el formulario en modo demostración');
html = inlineImages(relink(html));
if (/(?:src|href)="\/(?!\/)(?!assets\/fonts)[^"]*"/.test(html.replace(/<link rel="canonical"[^>]*>/, ''))) {
  const left = html.match(/(?:src|href)="\/(?!\/)[^"]*"/g);
  throw new Error(`Rutas absolutas sin resolver: ${[...new Set(left)].slice(0, 8).join(' ')}`);
}

mkdirSync(join(root, 'preview'), { recursive: true });
const out = join(root, 'preview', 'pro-reforma-preview.html');
writeFileSync(out, html);
console.log(out, Math.round(html.length / 1024) + ' KB', `· portada + ${PAGES.length} páginas como capas`);
