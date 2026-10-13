// Empaqueta la portada en un único HTML autónomo para revisarla sin servidor:
// CSS, JS, fuentes e imágenes en línea; formulario en modo demostración.
// Solo para revisión interna, no se publica.
// Uso: node tools/preview/bundle.mjs  ->  preview/living-clean-portada-preview.html
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const site = join(root, 'site');
const read = (p) => readFileSync(join(site, p), 'utf8');
const mime = { woff2: 'font/woff2', webp: 'image/webp', png: 'image/png' };
const dataUri = (p) => `data:${mime[p.split('.').pop()]};base64,${readFileSync(join(site, p)).toString('base64')}`;
const has = (p) => existsSync(join(site, p));
const missing = new Set();

let html = read('index.html');
const css = read('assets/css/site.css').replace(/url\("\.\.\/fonts\/([^"]+)"\)/g, (_, f) => `url("${dataUri('assets/fonts/' + f)}")`);

html = html
  .replace(/<link rel="preload"[^>]*>\n?/g, '')
  .replace(/<link rel="(icon|apple-touch-icon)"[^>]*>\n?/g, '')
  .replace(/<link rel="stylesheet" href="\/assets\/vendor\/scrollcraft\/scrollcraft\.css[^"]*">/, () => `<style>${read('assets/vendor/scrollcraft/scrollcraft.css')}</style>`)
  .replace(/<link rel="stylesheet" href="\/assets\/css\/site\.css[^"]*">/, () => `<style>${css}</style>`)
  .replace(/<script src="\/assets\/js\/boot\.js[^"]*"><\/script>/, () => `<script>${read('assets/js/boot.js')}</script>`)
  .replace(/<script src="\/assets\/vendor\/scrollcraft\/scrollcraft\.js[^"]*" defer><\/script>/, () => `<script>${read('assets/vendor/scrollcraft/scrollcraft.js')}</script>`)
  .replace(/<script src="\/assets\/js\/site\.js[^"]*" defer><\/script>/, () => `<script>${read('assets/js/site.js')}</script>`)
  // Una sola resolución por imagen para no multiplicar el peso del archivo.
  .replace(/<source [^>]*>\n?\s*/g, (s) => { const m = s.match(/srcset="\/(assets\/[^ "]+)/); return m && has(m[1]) ? s.replace(/srcset="[^"]*"/, `srcset="${dataUri(m[1])}"`).replace(/ sizes="[^"]*"/, '') : ''; })
  .replace(/ srcset="[^"]*"/g, '').replace(/ sizes="[^"]*"/g, '')
  .replace(/<img([^>]*?) src="\/(assets\/[^"]+\.(?:webp|png))"([^>]*)>/g, (all, a, p, b) => {
    if (has(p)) return `<img${a} src="${dataUri(p)}"${b}>`;
    missing.add(p.split('/').pop());
    return ''; // imagen generada aún sin descargar: queda el hueco
  })
  .replace(/<image href="\/(assets\/[^"]+\.webp)"/g, (_, p) => `<image href="${dataUri(p)}"`)
  .replace(/<form class="hv" /g, '<form class="hv" data-demo ')
  .replace(/href="\/#/g, 'href="#')
  .replace(/href="\/(?!\/)[^"]*"/g, 'href="#servicios"');

mkdirSync(join(root, 'preview'), { recursive: true });
const out = join(root, 'preview', 'living-clean-portada-preview.html');
writeFileSync(out, html);
console.log(out, Math.round(html.length / 1024) + ' KB', missing.size ? `· ${missing.size} imágenes generadas pendientes (huecos vacíos)` : '');
