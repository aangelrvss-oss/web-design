// Capturas en posiciones concretas + errores de consola, peticiones fallidas
// y desbordamiento horizontal. Uso:
//   node qa/snap.mjs <url> <outdir> <width> <height> [reduced] [y1,y2,...|acts]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [url, out, w = '1440', h = '900', mode = '', ys = 'acts'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference', hasTouch: +w < 800, isMobile: +w < 800 });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => logs.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
page.on('response', (r) => { if (r.status() >= 400) logs.push(`http ${r.status()}: ${r.url()}`); });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

let positions;
if (ys === 'acts') {
  positions = await page.evaluate(() => {
    const vh = innerHeight; const out = [0];
    document.querySelectorAll('main > section, main > nav').forEach((s) => {
      const top = s.getBoundingClientRect().top + scrollY; const hgt = s.offsetHeight;
      const pinned = s.classList.contains('sc-act--pinned');
      const n = pinned ? Math.max(3, Math.round(hgt / vh * 1.6)) : Math.max(1, Math.ceil(hgt / vh));
      for (let i = 0; i <= n; i++) out.push(Math.round(top + (pinned ? (hgt - vh) * i / n : Math.min(hgt - vh * .3, hgt * i / n) - vh * .1)));
    });
    return [...new Set(out.map((y) => Math.max(0, y)))].sort((a, b) => a - b);
  });
} else positions = ys.split(',').map(Number);

const docH = await page.evaluate(() => document.documentElement.scrollHeight);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
let i = 0;
for (const y of positions) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
  await page.waitForTimeout(260);
  await page.screenshot({ path: `${out}/${String(i).padStart(2, '0')}-${y}.png` });
  i++;
}
console.log(JSON.stringify({ url, w, h, mode, docH, vh: +h, overflowX: overflow, shots: positions.length, logs }, null, 1));
await browser.close();
