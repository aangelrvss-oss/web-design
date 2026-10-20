// End-to-end for the single-phone (pass-and-play) mode: one browser, no server game state.
//   node e2e/local.mjs [baseUrl] [outDir]
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { auditA11y } from './a11y.mjs';
const a11yReport = [];

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
  await auditA11y(page, 'guía', errors, a11yReport);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) errors.push(`guide overflows by ${overflow}px`);
  await page.getByRole('button', { name: 'Jugar en este móvil' }).click();
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
  // One shared phone: «Soy X» already revealed it, so the file opens straight away.
  if (await page.getByRole('button', { name: 'Abrir tu expediente confidencial' }).count()) errors.push('declare: the file asks to be opened again after «Soy X»');
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
  await page.getByRole('button', { name: 'Sellar declaración' }).click();
  await page.getByRole('button', { name: k === names.length - 1 ? 'Revelar coartadas' : 'Ocultar y pasar' }).click();
}
if (!culprit) errors.push('no culprit seen');
await page.getByText('Investigación').first().waitFor();

// A testimony "as" someone, chosen on the shared screen.
await page.getByRole('button', { name: 'Testificar', exact: true }).click();
await page.getByRole('dialog', { name: '¿Quién testifica?' }).locator('.chip-player').first().click();
const sheet = page.getByRole('dialog', { name: 'Testificar' });
await sheet.locator('.chip-player').first().click();
await sheet.locator('.choice').first().click();
await sheet.getByRole('button', { name: 'Publicar testimonio' }).click();
await page.locator('.testimony').first().waitFor();

// From a pin on the board (last hour, so it can't repeat the testimony above): the shared phone
// still asks who testifies (never the person it is about), then opens the sheet with that person
// and hour filled in; it is published only with «Publicar testimonio».
{
  const lastHour = (await page.locator('.board-grid .hcell').last().innerText()).trim();
  const idx = await page.evaluate((h) => [...document.querySelectorAll('.board-grid [role="cell"]')].findIndex((c) => c.getAttribute('aria-label').includes(h) && c.querySelector('button')), lastHour);
  const cell = page.locator('.board-grid [role="cell"]').nth(idx);
  const pin = cell.locator('button').first();
  const subject = await pin.getAttribute('aria-label');
  const hour = (await cell.getAttribute('aria-label')).match(/(a las? \d\d:\d\d)/)[1];
  const before = await page.locator('.testimony').count();
  await pin.click();
  await page.getByRole('button', { name: new RegExp(`^(?=.*Testificar: «Estuve con ${subject} ${hour}»)(?=.*Público)`) }).click();
  const who = page.getByRole('dialog', { name: '¿Quién testifica?' });
  await who.getByText(`Sobre ${subject} ${hour}.`, { exact: false }).waitFor();
  if (await who.getByRole('button', { name: subject, exact: true }).count()) errors.push(`local: ${subject} could testify about themselves`);
  await who.locator('.chip-player').first().click();
  const s2 = page.getByRole('dialog', { name: 'Testificar' });
  await s2.waitFor();
  if ((await s2.getByRole('button', { name: subject, exact: true }).getAttribute('aria-pressed')) !== 'true') errors.push('local: the pin did not preselect the person');
  if (!(await s2.locator('.choice[aria-pressed="true"]').innerText()).startsWith(hour.replace(/^a las? /, ''))) errors.push('local: the pin did not preselect the hour');
  if ((await page.locator('.testimony').count()) !== before) errors.push('local: something was published before «Publicar testimonio»');
  await s2.getByRole('button', { name: 'Publicar testimonio' }).click();
  await page.locator('.testimony', { hasText: `Estuve con ${subject} en ` }).first().waitFor();
  if ((await page.locator('.testimony').count()) !== before + 1) errors.push('local: the pin testimony was not published once');
  console.log(`· local: testimony about ${subject} ${hour} from a pin, after choosing who testifies`);
}
await page.screenshot({ path: `${OUT}/22-local-investigate.png`, fullPage: true });

// On a 320 px phone the action buttons must stay on screen and uncut.
const barAt320 = async (step) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(300);
  const cut = await page.evaluate(() => [...document.querySelectorAll('.actionbar-inner > *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 0.5 || el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.trim()));
  if (cut.length) errors.push(`${step}: action buttons cut at 320px: ${cut.join(', ')}`);
  await page.setViewportSize({ width: 390, height: 844 });
};
await barAt320('investigación 1');
await page.getByRole('button', { name: 'Sacar la prueba 2' }).click();
await page.getByText('Prueba 2 de 2', { exact: false }).first().waitFor();
await barAt320('investigación 2');
await page.getByRole('button', { name: 'Terminar investigación' }).click();
await page.getByRole('dialog', { name: 'Señalar para la última defensa' }).getByRole('button', { name: culprit, exact: true }).click();
await page.getByText('Última defensa').first().waitFor();
const defender = (await page.locator('.defense-name').innerText()).trim();
if (defender !== culprit) errors.push(`local defense: expected ${culprit}, got ${defender}`);
await page.screenshot({ path: `${OUT}/22b-local-defense.png`, fullPage: true });
await auditA11y(page, 'local: defensa', errors, a11yReport);
await page.getByRole('button', { name: 'Pasar a la votación' }).click();
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
writeFileSync(`${OUT}/a11y-local.json`, JSON.stringify(a11yReport, null, 2));
if (errors.length) {
  console.error('✗ Local E2E problems:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log(`✓ Local E2E: 4 people on one phone played a full round (culprit ${culprit}) and started round 2.`);
