// Empaqueta la portada en un único HTML autónomo para revisarla sin servidor:
// CSS, JS, fuentes e imágenes en línea. Solo para revisión interna, no se publica.
// Uso: node tools/preview/bundle.mjs  ->  preview/mri-portada-preview.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const site = join(root, 'site');
const read = (p) => readFileSync(join(site, p), 'utf8');
const b64 = (p) => readFileSync(join(site, p)).toString('base64');
const mime = { woff2: 'font/woff2', webp: 'image/webp', png: 'image/png' };
const dataUri = (p) => `data:${mime[p.split('.').pop()]};base64,${b64(p)}`;

let html = read('index.html');
const css = read('assets/css/site.css').replace(/url\("\.\.\/fonts\/([^"]+)"\)/g, (_, f) => `url("${dataUri('assets/fonts/' + f)}")`);
const engineCss = read('assets/vendor/scrollcraft/scrollcraft.css');

html = html
  .replace(/<link rel="preload"[^>]*>\n?/g, '')
  .replace(/<link rel="(icon|apple-touch-icon)"[^>]*>\n?/g, '')
  .replace(/<link rel="stylesheet" href="\/assets\/vendor\/scrollcraft\/scrollcraft\.css[^"]*">/, () => `<style>${engineCss}</style>`)
  .replace(/<link rel="stylesheet" href="\/assets\/css\/site\.css[^"]*">/, () => `<style>${css}</style>`)
  .replace(/<script src="\/assets\/js\/boot\.js[^"]*"><\/script>/, () => `<script>${read('assets/js/boot.js')}</script>`)
  .replace(/<script src="\/assets\/vendor\/scrollcraft\/scrollcraft\.js[^"]*" defer><\/script>/, () => `<script>${read('assets/vendor/scrollcraft/scrollcraft.js')}</script>`)
  .replace(/<script src="\/assets\/js\/site\.js[^"]*" defer><\/script>/, () => `<script>${read('assets/js/site.js')}</script>`)
  .replace(/src="\/(assets\/[^"]+\.(?:webp|png))"/g, (_, p) => `src="${dataUri(p)}"`)
  // Las demás páginas no van en la vista previa: sus enlaces se quedan en la portada.
  .replace(/href="\/#/g, 'href="#')
  .replace(/href="\/(?!\/)[^"]*"/g, 'href="#servicios"');

mkdirSync(join(root, 'preview'), { recursive: true });
const out = join(root, 'preview', 'mri-portada-preview.html');
writeFileSync(out, html);
console.log(out, Math.round(html.length / 1024) + ' KB');
