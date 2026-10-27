// Genera el PDF de la propuesta comercial a partir de propuesta-mri.html.
// Uso: node build.mjs  ->  ../entregables/Propuesta_AVS_Media_-_Web_MRI.pdf
import { chromium } from '../../../qa/node_modules/playwright-core/index.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'entregables', 'Propuesta_AVS_Media_-_Web_MRI.pdf');
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage();
await p.goto('file://' + join(here, 'propuesta-mri.html'), { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
await b.close();
console.log(out);
