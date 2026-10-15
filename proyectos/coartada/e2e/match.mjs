// End-to-end: N independent browser contexts (separate storage, separate sockets)
// play a full round through the real UI against a running server, then a rematch.
//
//   node e2e/match.mjs [baseUrl] [players] [outDir]
//   e.g. node e2e/match.mjs http://127.0.0.1:4100 5 qa-out
//
// Mobile contexts use a 390×844 touch viewport; the last player uses a desktop viewport.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4100';
const N = Number(process.argv[3] ?? 5);
const OUT = process.argv[4] ?? 'qa-out';
mkdirSync(OUT, { recursive: true });

const NAMES = ['Ana', 'Bruno', 'Carla', 'Dani', 'Eva', 'Fede', 'Gala', 'Hugo'];
const log = (...a) => console.log('·', ...a);
const errors = [];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const players = [];
for (let i = 0; i < N; i++) {
  const desktop = i === N - 1;
  const ctx = await browser.newContext(
    desktop
      ? { viewport: { width: 1280, height: 860 } }
      : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  );
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${NAMES[i]} pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${NAMES[i]} console: ${m.text()}`));
  players.push({ name: NAMES[i], page, ctx, desktop });
}
const [host] = players;
const shot = async (p, name, full = true) => p.page.screenshot({ path: `${OUT}/${name}-${p.desktop ? 'desktop' : 'mobile'}.png`, fullPage: full });

// ── Create room
await host.page.goto(BASE);
await shot(host, '01-home');
await host.page.getByRole('button', { name: 'Crear sala' }).click();
await host.page.getByLabel('Tu nombre').fill(host.name);
await host.page.getByRole('button', { name: 'Crear sala' }).click();
await host.page.waitForURL(/sala=/);
const code = new URL(host.page.url()).searchParams.get('sala');
log('room', code);

// ── Join: one by code on the home screen, the rest through the invite link
for (const [i, p] of players.slice(1).entries()) {
  if (i === 0) {
    await p.page.goto(BASE);
    await p.page.getByRole('button', { name: 'Unirme con un código' }).click();
    await p.page.getByLabel('Código de la sala').fill(code.toLowerCase());
  } else {
    await p.page.goto(`${BASE}/?sala=${code}`);
  }
  await p.page.getByLabel('Tu nombre').fill(p.name);
  await p.page.getByRole('button', { name: 'Entrar' }).click();
  await p.page.getByText('En la sala').waitFor();
}
await host.page.getByText(`${N}/10`).waitFor();
await shot(host, '02-lobby');
await shot(players[N - 1], '02-lobby');

// ── Reload resilience: a guest refreshes in the lobby and keeps their seat
await players[1].page.reload();
await players[1].page.getByText('En la sala').waitFor();
log('reload in lobby ok');

// ── Start
await host.page.getByRole('button', { name: 'Empezar ronda' }).click();
for (const p of players) await p.page.getByRole('heading', { level: 1 }).waitFor();
await shot(host, '03-declare-closed', false);

// Each player opens the file, reads the role from their own screen only, declares.
for (const p of players) {
  await p.page.getByRole('button', { name: 'Abrir tu expediente confidencial' }).click();
  const file = p.page.getByRole('article', { name: 'Tu expediente confidencial' });
  await file.waitFor();
  p.role = (await file.locator('.stamp').first().innerText()).trim().toLowerCase();
}
const roles = players.map((p) => `${p.name}:${p.role}`);
log('roles (each read from its own screen):', roles.join(' '));
if (players.filter((p) => p.role === 'culpable').length !== 1) errors.push('expected exactly one culprit');
await shot(host, '04-declare-open');
const culprit = players.find((p) => p.role === 'culpable');
await shot(culprit, '04-declare-culprit');

for (const p of players) {
  if (p.role === 'culpable') {
    // Pick any non-scene place at the crime hour (the only unset hour).
    const group = p.page.locator('.hour-block').filter({ has: p.page.locator('.tag.red') });
    await group.locator('.choice:not(.scene)').first().click();
  }
  await p.page.getByRole('button', { name: 'Sellar coartada' }).click();
}
for (const p of players) await p.page.getByText('Investigación').first().waitFor();
await shot(host, '05-investigate');
await shot(players[N - 1], '05-investigate');

// ── Testimony through the UI
const witness = players.find((p) => p.role !== 'culpable');
await witness.page.getByRole('button', { name: /Testificar/ }).click();
const sheet = witness.page.getByRole('dialog', { name: 'Testificar' });
await sheet.locator('.chip-player').nth(0).click();
const enabledMemory = sheet.locator('.chip-player:not([disabled])').first();
await enabledMemory.click();
await shot(witness, '06-testify');
await sheet.getByRole('button', { name: 'Publicar testimonio' }).click();
await host.page.locator('.testimony').first().waitFor();
log('testimony visible on host');

// ── Ready ×2 → vote
for (const p of players) await p.page.getByRole('button', { name: 'Siguiente prueba' }).click();
await host.page.getByText('Prueba 2', { exact: false }).first().waitFor();
await shot(host, '07-second-trace');
for (const p of players) await p.page.getByRole('button', { name: 'A votar' }).click();
for (const p of players) await p.page.getByRole('heading', { name: '¿Quién lo hizo?' }).waitFor();
await shot(host, '08-vote');

// Everyone except the culprit accuses the culprit; the culprit accuses someone else.
for (const p of players) {
  const target = p === culprit ? players.find((q) => q !== p).name : culprit.name;
  await p.page.getByRole('radio', { name: new RegExp(`^${target}`) }).click();
  await p.page.getByRole('button', { name: `Acusar a ${target}` }).click();
}
for (const p of players) await p.page.getByText('Veredicto').first().waitFor();
await host.page.getByRole('button', { name: 'Ver todo' }).click().catch(() => {});
await host.page.locator('[data-tab="Lo que pasó de verdad"]').waitFor();
await shot(host, '09-result');
await players[N - 1].page.getByRole('button', { name: 'Ver todo' }).click().catch(() => {});
await shot(players[N - 1], '09-result');
const stamp = (await host.page.locator('.stamp.big').first().innerText()).trim().toLowerCase();
if (stamp !== 'culpable') errors.push(`expected verdict stamp "culpable", got "${stamp}"`);
log('verdict:', stamp);

// ── Rematch
await host.page.getByRole('button', { name: 'Siguiente ronda' }).click();
for (const p of players) await p.page.getByText('Ronda 2', { exact: false }).first().waitFor();
log('round 2 started for everyone');

// ── Disconnect + rejoin mid-round: close a guest tab, reopen with the same storage.
const guest = players[2];
const storage = await guest.ctx.storageState();
await guest.ctx.close();
await host.page.getByText('Faltan', { exact: false }).first().waitFor();
const ctx2 = await browser.newContext({ storageState: storage, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page2 = await ctx2.newPage();
await page2.goto(`${BASE}/?sala=${code}`);
await page2.getByRole('button', { name: 'Abrir tu expediente confidencial' }).waitFor();
log('rejoined mid-round with own file');

// ── Overflow check at 320px
const tiny = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, storageState: await players[1].ctx.storageState() });
const tp = await tiny.newPage();
await tp.goto(`${BASE}/?sala=${code}`);
await tp.getByRole('button', { name: 'Abrir tu expediente confidencial' }).waitFor();
const overflow = await tp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
if (overflow > 0) errors.push(`horizontal overflow at 320px: ${overflow}px`);
await tp.screenshot({ path: `${OUT}/10-declare-320.png`, fullPage: true });

await browser.close();
if (errors.length) {
  console.error('\n✗ E2E problems:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log(`\n✓ E2E: ${N} independent browser sessions completed a round, a rematch and a reconnection. Screenshots in ${OUT}/`);
