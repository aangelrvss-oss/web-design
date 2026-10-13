// Congela la secuencia de entrada del hero en instantes concretos y captura.
// Uso: node qa/intro.mjs <url> <outdir> <width> <height> [reduced]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const [url, out, w, h, mode] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference', isMobile: +w < 800, hasTouch: +w < 800 });
const p = await ctx.newPage();
const logs = [];
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.text()); });
p.on('pageerror', (e) => logs.push(e.message));
// Primer pintado real, sin congelar nada
await p.goto(url, { waitUntil: 'domcontentloaded' });
await p.screenshot({ path: `${out}/first-paint.png` });
const early = await p.evaluate(() => {
  const r = (s) => { const el = document.querySelector(s); const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), op: getComputedStyle(el).opacity }; };
  return { cta: r('.hero .btn--accent'), tel: r('.hero .btn--line'), h1: r('#hero-h') };
});
await p.waitForLoadState('networkidle');
await p.evaluate(() => document.fonts.ready);
// Reinicia y congela
await p.evaluate(() => document.getAnimations().forEach((a) => { a.cancel(); a.play(); a.pause(); }));
const n = await p.evaluate(() => document.getAnimations().length);
const times = [0, 120, 300, 550, 800, 1000, 1150, 1300, 1500, 1800];
for (const t of times) {
  await p.evaluate((t) => document.getAnimations().forEach((a) => { a.currentTime = t; }), t);
  await p.waitForTimeout(60);
  await p.screenshot({ path: `${out}/t${String(t).padStart(4, '0')}.png` });
}
const end = await p.evaluate(() => Math.max(0, ...document.getAnimations().map((a) => { const t = a.effect.getComputedTiming(); return t.endTime; })));
console.log(JSON.stringify({ w, h, mode: mode || 'motion', animations: n, endMs: Math.round(end), early, logs }));
await b.close();
