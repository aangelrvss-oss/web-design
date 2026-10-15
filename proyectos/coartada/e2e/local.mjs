// End-to-end for the single-phone (pass-and-play) mode: one browser, no server game state.
//   node e2e/local.mjs [baseUrl] [outDir]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4100';
const OUT = process.argv[3] ?? 'qa-out';
mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());

await page.goto(BASE);
// Works against the full app (server) or the standalone demo file (DEMO=1).
if (process.env.DEMO) {
  await page.screenshot({ path: `${OUT}/30-demo-home.png`, fullPage: true });
  await page.getByRole('button', { name: /Guía rápida/ }).click();
  await page.getByRole('heading', { name: 'Una ronda, paso a paso' }).waitFor();
  await page.screenshot({ path: `${OUT}/31-demo-guide.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) errors.push(`guide overflows by ${overflow}px`);
  await page.getByRole('button', { name: 'Jugar ahora' }).click();
} else {
  await page.getByRole('button', { name: 'Jugar con un solo móvil' }).click();
}
const names = ['Lola', 'Mario', 'Nerea', 'Óscar'];
for (const [i, n] of names.entries()) await page.getByLabel(`Nombre ${i + 1}`).fill(n);
await page.screenshot({ path: `${OUT}/20-local-setup.png`, fullPage: true });
await page.getByRole('button', { name: 'Empezar' }).click();

let culprit = null;
for (let k = 0; k < names.length; k++) {
  const who = await page.getByRole('heading', { level: 2 }).innerText(); // "Para X"
  const name = who.replace('Para ', '').trim();
  await page.getByRole('button', { name: `Soy ${name}` }).click();
  await page.getByRole('button', { name: 'Abrir tu expediente confidencial' }).click();
  const role = (await page.locator('.stamp').first().innerText()).trim().toLowerCase();
  if (role === 'culpable') culprit = name;
  const blocks = page.locator('.hour-block');
  for (let h = 0; h < 3; h++) {
    const block = blocks.nth(h);
    const crime = (await block.locator('.tag.red').count()) > 0;
    if (role === 'culpable' && crime) await block.locator('.choice:not(.scene)').first().click();
    else await block.locator('.choice', { hasText: 'Aquí estabas' }).click();
  }
  if (k === 0) await page.screenshot({ path: `${OUT}/21-local-declare.png`, fullPage: true });
  await page.getByRole('button', { name: 'Sellar coartada' }).click();
  await page.getByRole('button', { name: k === names.length - 1 ? 'Destapar coartadas' : 'Ocultar y pasar' }).click();
}
if (!culprit) errors.push('no culprit seen');
await page.getByText('Investigación').first().waitFor();

// A testimony "as" someone, chosen on the shared screen.
await page.getByRole('button', { name: 'Testificar' }).click();
await page.getByRole('dialog', { name: '¿Quién testifica?' }).locator('.chip-player').first().click();
const sheet = page.getByRole('dialog', { name: 'Testificar' });
await sheet.locator('.chip-player').first().click();
await sheet.locator('.choice').first().click();
await sheet.getByRole('button', { name: 'Publicar testimonio' }).click();
await page.locator('.testimony').first().waitFor();
await page.screenshot({ path: `${OUT}/22-local-investigate.png`, fullPage: true });

await page.getByRole('button', { name: 'Siguiente prueba' }).click();
await page.getByRole('button', { name: 'A votar' }).click();
for (let k = 0; k < names.length; k++) {
  const who = (await page.getByRole('heading', { level: 2 }).innerText()).replace('Para ', '').trim();
  await page.getByRole('button', { name: `Soy ${who}` }).click();
  const target = who === culprit ? names.find((n) => n !== who) : culprit;
  await page.getByRole('radio', { name: new RegExp(`^${target}`) }).click();
  await page.getByRole('button', { name: `Acusar a ${target}` }).click();
  await page.getByRole('button', { name: k === names.length - 1 ? 'Ver el veredicto' : 'Ocultar y pasar' }).click();
}
await page.getByText('Veredicto').first().waitFor();
await page.getByRole('button', { name: 'Ver todo' }).click();
await page.screenshot({ path: `${OUT}/23-local-result.png`, fullPage: true });
const stamp = (await page.locator('.stamp.big').first().innerText()).trim().toLowerCase();
if (stamp !== 'culpable') errors.push(`expected culpable, got ${stamp}`);
await page.getByRole('button', { name: 'Siguiente ronda' }).click();
await page.getByText('Pasa el móvil').first().waitFor();

await browser.close();
if (errors.length) {
  console.error('✗ Local E2E problems:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log(`✓ Local E2E: 4 people on one phone played a full round (culprit ${culprit}) and started round 2.`);
