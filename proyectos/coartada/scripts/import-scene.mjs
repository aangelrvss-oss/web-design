// Imports approved case illustrations (PNG or JPEG exported from Higgsfield) into the app: each one
// is cropped to 16:9 around the centre (the frame the case screen shows) and written as two WebP
// sizes next to the case's ink drawing,
//   src/client/assets/scenes/{id}.webp      1440 × 810 (dense screens, desktop)
//   src/client/assets/scenes/{id}-720.webp  720 × 405 (phones)
// The app then shows it for that case instead of the drawing (src/client/ui/ambience.tsx).
//
//   node scripts/import-scene.mjs art/scenes-raw/casa-rural-fantasma.png casa-rural-fantasma
//   node scripts/import-scene.mjs --dir art/scenes-raw
//
// With --dir, every image in the folder is matched to its case by its file name: either the case
// id (casa-rural-fantasma.png) or the Higgsfield job id that the downloaded file carries
// (hf_20261019_175610_<job id>.png), whose SHA-256 is looked up in scripts/scene-jobs.json (the
// repository keeps only the hashes, not the ids). Files that match no
// case are listed and skipped. SCENE_QUALITY overrides the WebP quality (0.72).
//
// No extra dependency: the WebP encoding is done by the Chromium that Playwright already uses
// (CHROMIUM_PATH if it is not on Playwright's default path).
import { chromium } from 'playwright-core';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const args = process.argv.slice(2);
const QUALITY = Number(process.env.SCENE_QUALITY ?? 0.72);
const RATIO = 16 / 9;
const SIZES = [
  { width: 1440, suffix: '' },
  { width: 720, suffix: '-720' },
];
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const cases = readdirSync(new URL('../src/shared/content/scenarios/', import.meta.url)).map((f) => f.replace(/\.ts$/, ''));
const jobs = JSON.parse(readFileSync(new URL('./scene-jobs.json', import.meta.url), 'utf8'));
const caseOfJob = Object.fromEntries(
  Object.entries(jobs)
    .filter(([k]) => k !== '_')
    .map(([id, hash]) => [hash, id]),
);
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const sha256 = (s) => createHash('sha256').update(s.toLowerCase()).digest('hex');

/** [source file, case id] pairs to import. */
let work = [];
if (args[0] === '--dir') {
  const dir = args[1];
  if (!dir) fail('Uso: node scripts/import-scene.mjs --dir <carpeta>');
  for (const name of readdirSync(dir).sort()) {
    if (!MIME[extname(name).toLowerCase()]) continue;
    const stem = name.slice(0, -extname(name).length);
    const job = (name.match(UUID) ?? []).map(sha256).find((h) => caseOfJob[h]);
    const id = cases.includes(stem) ? stem : job && caseOfJob[job];
    if (id) work.push([join(dir, name), id]);
    else console.warn(`Sin caso: ${name} (ni id de caso ni trabajo de scripts/scene-jobs.json)`);
  }
  const dup = work.map(([, id]) => id).filter((id, i, all) => all.indexOf(id) !== i);
  if (dup.length) fail(`Más de una imagen para: ${[...new Set(dup)].join(', ')}`);
} else {
  const [source, id] = args;
  if (!source || !id) fail('Uso: node scripts/import-scene.mjs <imagen.png|jpg> <id-del-caso>   ·   --dir <carpeta>');
  if (!cases.includes(id)) fail(`«${id}» no es un caso del catálogo. Casos: ${cases.join(', ')}`);
  if (!MIME[extname(source).toLowerCase()]) fail('La imagen debe ser PNG, JPEG o WebP.');
  work = [[source, id]];
}
if (work.length === 0) fail('No hay imágenes que importar.');

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
let total = 0;
for (const [source, id] of work) {
  const dataUrl = `data:${MIME[extname(source).toLowerCase()]};base64,${readFileSync(source).toString('base64')}`;
  const out = await page.evaluate(
    async ({ dataUrl, sizes, ratio, quality }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      // Centre crop to the target ratio.
      let sw = img.naturalWidth;
      let sh = Math.round(sw / ratio);
      if (sh > img.naturalHeight) {
        sh = img.naturalHeight;
        sw = Math.round(sh * ratio);
      }
      const sx = Math.round((img.naturalWidth - sw) / 2);
      const sy = Math.round((img.naturalHeight - sh) / 2);
      return {
        natural: [img.naturalWidth, img.naturalHeight],
        files: sizes.map(({ width, suffix }) => {
          const c = document.createElement('canvas');
          c.width = width;
          c.height = Math.round(width / ratio);
          const ctx = c.getContext('2d');
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
          return { suffix, width: c.width, height: c.height, url: c.toDataURL('image/webp', quality) };
        }),
      };
    },
    { dataUrl, sizes: SIZES, ratio: RATIO, quality: QUALITY },
  );
  if (out.natural[0] < 1440) console.warn(`Aviso: ${source} mide ${out.natural[0]} px de ancho; la versión de 1440 px se ampliará.`);
  const sizes = [];
  for (const f of out.files) {
    if (!f.url.startsWith('data:image/webp')) throw new Error('Este Chromium no codifica WebP');
    const path = new URL(`../src/client/assets/scenes/${id}${f.suffix}.webp`, import.meta.url);
    writeFileSync(path, Buffer.from(f.url.split(',')[1], 'base64'));
    const kb = statSync(path).size / 1024;
    total += kb;
    sizes.push(`${f.width}×${f.height} ${kb.toFixed(1)} KB`);
  }
  console.log(`${id.padEnd(24)} ${sizes.join('  ·  ')}   (original ${out.natural.join('×')})`);
}
await browser.close();
console.log(`${work.length} escena(s) importada(s), ${(total / 1024).toFixed(2)} MB en total, recorte central 16:9, calidad ${QUALITY}.`);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
