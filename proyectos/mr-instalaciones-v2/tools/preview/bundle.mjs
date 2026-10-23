// Empaqueta la portada de la V2 en un único HTML autónomo para revisarla sin
// servidor: CSS, JS, fuentes, imágenes y los clips de vídeo en línea. Solo para
// revisión interna, no se publica. El formulario queda en modo demostración
// (valida, pero no envía datos).
// Uso: node tools/preview/bundle.mjs  ->  preview/mri-v2-portada-preview.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const site = join(root, 'site');
const read = (p) => readFileSync(join(site, p), 'utf8');
const mime = { woff2: 'font/woff2', webp: 'image/webp', png: 'image/png', mp4: 'video/mp4', webm: 'video/webm' };
const cache = new Map();
const dataUri = (p) => {
  if (!cache.has(p)) cache.set(p, `data:${mime[p.split('.').pop()]};base64,${readFileSync(join(site, p)).toString('base64')}`);
  return cache.get(p);
};
// Cualquier ruta absoluta a un recurso binario, con o sin ?v=, en HTML o JS.
const inlineAssets = (s) => s.replace(/\/(assets\/[\w/.-]+\.(?:webp|png|mp4|webm))(?:\?v=\w+)?/g, (_, p) => dataUri(p));

// El WebM de móvil solo lo usarían navegadores sin H.264 en pantallas
// estrechas: se reutiliza el de escritorio para no duplicar peso.
let html = read('index.html').replace(/data-webm-mobile="[^"]*"/, (m) => m.replace(/film-m\.webm/, 'film.webm'));

const css = read('assets/css/site.css').replace(/url\("\.\.\/fonts\/([^"]+)"\)/g, (_, f) => `url("${dataUri('assets/fonts/' + f)}")`);
const engineCss = read('assets/vendor/scrollcraft/scrollcraft.css');
const script = (p) => `<script>${inlineAssets(read(p)).replace(/<\/script/gi, '<\\/script')}</script>`;

html = html
  .replace(/<link rel="preload"[^>]*>\n?/g, '')
  .replace(/<link rel="(icon|apple-touch-icon)"[^>]*>\n?/g, '')
  .replace(/<link rel="stylesheet" href="\/assets\/vendor\/scrollcraft\/scrollcraft\.css[^"]*">/, () => `<style>${engineCss}</style>`)
  .replace(/<link rel="stylesheet" href="\/assets\/css\/site\.css[^"]*">/, () => `<style>${css}</style>`)
  .replace(/<script src="\/assets\/js\/boot\.js[^"]*"><\/script>/, () => script('assets/js/boot.js'))
  // Mismo orden que en la web: film.js (antes del motor), motor, site.js.
  .replace(/<script src="\/assets\/js\/film\.js[^"]*" defer><\/script>/, () => script('assets/js/film.js'))
  .replace(/<script src="\/assets\/vendor\/scrollcraft\/scrollcraft\.js[^"]*" defer><\/script>/, () => script('assets/vendor/scrollcraft/scrollcraft.js'))
  .replace(/<script src="\/assets\/js\/site\.js[^"]*" defer><\/script>/, () => script('assets/js/site.js'))
  .replace(/<form class="tb"/, '<form class="tb" data-demo');

// Recursos binarios del marcado (src, srcset, data-sc-src, data-webm...).
html = inlineAssets(html)
  // Las demás páginas no van en la vista previa: sus enlaces se quedan en la portada.
  .replace(/href="\/#/g, 'href="#')
  .replace(/href="\/(?!\/)[^"]*"/g, 'href="#servicios"')
  .replace(/action="\/contacto\.php"/, 'action="#presupuesto"');

for (const [k, v] of [['/assets/', 'rutas de recursos sin incrustar'], ['data-demo', 'formulario en demostración']]) {
  if (k === '/assets/' ? html.includes('"/assets/') : !html.includes(k)) throw new Error('Vista previa incompleta: ' + v);
}

mkdirSync(join(root, 'preview'), { recursive: true });
const out = join(root, 'preview', 'mri-v2-portada-preview.html');
writeFileSync(out, html);
console.log(out, (Buffer.byteLength(html) / 1048576).toFixed(1) + ' MB');
