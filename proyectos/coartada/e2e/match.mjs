// End-to-end: N independent browser contexts (separate storage, separate sockets)
// play a full round through the real UI against a running server, then a rematch.
//
//   node e2e/match.mjs [baseUrl] [players] [outDir]
//   e.g. node e2e/match.mjs http://127.0.0.1:4100 5 qa-out
//
// Mobile contexts use a 390×844 touch viewport; the last player uses a desktop viewport.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { auditA11y } from './a11y.mjs';
const a11yReport = [];

const BASE = process.argv[2] ?? 'http://127.0.0.1:4100';
const N = Number(process.argv[3] ?? 5);
const OUT = process.argv[4] ?? 'qa-out';
mkdirSync(OUT, { recursive: true });

const NAMES = ['Ana', 'Bruno', 'Carla', 'Dani', 'Eva', 'Fede', 'Gala', 'Hugo', 'Inés', 'Jon'];
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
  // Connection errors while we deliberately cut the network are expected.
  page.on('console', (m) => m.type() === 'error' && !/ERR_INTERNET_DISCONNECTED/.test(m.text()) && errors.push(`${NAMES[i]} console: ${m.text()}`));
  const frames = [];
  // Record every WebSocket frame this browser receives (what DevTools would show).
  page.on('websocket', (ws) => ws.on('framereceived', (f) => frames.push(String(f.payload))));
  players.push({ name: NAMES[i], page, ctx, desktop, frames });
}
const [host] = players;
const shot = async (p, name, full = true) => p.page.screenshot({ path: `${OUT}/${name}-${p.desktop ? 'desktop' : 'mobile'}.png`, fullPage: full });

// ── Create room
await host.page.goto(BASE);
await shot(host, '01-home');
await auditA11y(host.page, 'inicio', errors, a11yReport);
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
await auditA11y(host.page, 'sala de espera', errors, a11yReport);
await shot(players[N - 1], '02-lobby');

// ── Reload resilience: a guest refreshes in the lobby and keeps their seat
await players[1].page.reload();
await players[1].page.getByText('En la sala').waitFor();
log('reload in lobby ok');

// ── Start
await host.page.getByRole('button', { name: 'Empezar partida' }).click();
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
await auditA11y(host.page, 'declaración', errors, a11yReport);
const culprit = players.find((p) => p.role === 'culpable');
await shot(culprit, '04-declare-culprit');

for (const p of players) {
  // Tell the truth hour by hour; the culprit picks a non-scene place at the crime hour.
  const blocks = p.page.locator('.hour-block');
  for (let h = 0; h < 3; h++) {
    const block = blocks.nth(h);
    const crime = (await block.locator('.tag.red').count()) > 0;
    if (p.role === 'culpable' && crime) await block.locator('.choice:not(.scene)').first().click();
    else await block.locator('.choice', { hasText: 'Aquí estabas' }).click();
  }
  await p.page.getByRole('button', { name: 'Sellar declaración' }).click();
}
for (const p of players) await p.page.getByText('Investigación').first().waitFor();
await auditA11y(host.page, 'investigación', errors, a11yReport);
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
// ── Secret pointers for the last defense: everyone points at the culprit, who points elsewhere.
for (const p of players) {
  const target = p === culprit ? players.find((q) => q !== p).name : culprit.name;
  await p.page.getByRole('button', { name: /Señalar a alguien|Cambiar a quién señalo/ }).click();
  await p.page.getByRole('dialog', { name: 'Señalar para la última defensa' }).getByRole('button', { name: target, exact: true }).click();
  await p.page.getByText(`Señalas a ${target}`).first().waitFor();
}
for (const p of players) await p.page.getByRole('button', { name: 'Pedir prueba 2' }).click();
await host.page.getByText('Prueba 2 de 2', { exact: false }).first().waitFor();
await shot(host, '07-second-trace');
for (const p of players) await p.page.getByRole('button', { name: 'Pedir terminar' }).click();
// ── Última defensa: the culprit was the most pointed; the defense screen shows for all.
// The countdown must never show more than the phase lasts (15 s on Normal pace): read it
// on every phone as soon as the screen appears.
const firstShown = await Promise.all(
  players.map(async (p) => {
    await p.page.locator('.defense-clock').waitFor();
    return Number((await p.page.locator('.defense-clock').innerText()).trim());
  }),
);
log('defense countdown on arrival', firstShown.join(' '));
for (const [i, shown] of firstShown.entries()) if (!(shown <= 15)) errors.push(`${players[i].name} defense countdown shows ${shown} s (> 15)`);
for (const p of players) await p.page.getByText('Última defensa').first().waitFor();
await shot(host, '07b-defense');
await shot(culprit, '07b-defense-defender');
await auditA11y(host.page, 'última defensa', errors, a11yReport);
const defenderName = (await host.page.locator('.defense-name').innerText()).trim();
if (defenderName !== culprit.name) errors.push(`expected ${culprit.name} to defend, got ${defenderName}`);
await culprit.page.getByRole('button', { name: 'He terminado mi defensa' }).click();
for (const p of players) await p.page.getByRole('heading', { name: '¿Quién lo hizo?' }).waitFor();
await shot(host, '08-vote');
await auditA11y(host.page, 'votación', errors, a11yReport);

// Everyone except the culprit accuses the culprit; the culprit accuses someone else.
for (const p of players) {
  const target = p === culprit ? players.find((q) => q !== p).name : culprit.name;
  await p.page.getByRole('radio', { name: new RegExp(`^${target}`) }).click();
  await p.page.getByRole('button', { name: `Acusar a ${target}` }).click();
}
for (const p of players) await p.page.getByText('Veredicto').first().waitFor();

// ── Network privacy audit on what each browser actually received
const resultIdx = (frames) => frames.findIndex((f) => f.includes('"phase":"result"'));
for (const p of players) {
  const before = p.frames.slice(0, Math.max(0, resultIdx(p.frames)));
  if (before.length < 5) errors.push(`${p.name}: too few frames captured (${before.length})`);
  const blob = before.join('\n');
  if (p.role !== 'culpable' && p.role !== 'cómplice' && blob.includes('culpable')) errors.push(`${p.name}: saw "culpable" on the wire before the verdict`);
  for (const key of ['"truth":{', '"roles":', '"memories":{', '"votes":{', '"seed":']) {
    // Own private card uses arrays ("truth":[...]) — other people's data would be keyed objects.
    if (blob.includes(key)) errors.push(`${p.name}: received ${key} before the verdict`);
  }
  const ownIds = new Set();
  for (const f of before) {
    const m = f.match(/"priv":\{"playerId":"([^"]+)"/);
    if (m) ownIds.add(m[1]);
  }
  if (ownIds.size !== 1) errors.push(`${p.name}: private payloads for ${ownIds.size} different players`);
}
// Nobody ever receives another person's session token (their own arrives once, in the join ack).
for (const p of players) {
  p.token = await p.page.evaluate(() => JSON.parse(localStorage.getItem('coartada:session') || '{}').token);
  if (!p.token) errors.push(`${p.name}: no session token stored`);
}
for (const p of players) {
  const all = p.frames.join('\n');
  for (const q of players) if (q !== p && q.token && all.includes(q.token)) errors.push(`${p.name} received ${q.name}'s token`);
}
log('network audit:', players.map((p) => `${p.name}=${p.frames.length} frames`).join(' '));
await host.page.getByRole('button', { name: 'Ver todo' }).click().catch(() => {});
await host.page.locator('[data-tab="Lo que pasó de verdad"]').waitFor();
await shot(host, '09-result');
await auditA11y(host.page, 'veredicto', errors, a11yReport);
await players[N - 1].page.getByRole('button', { name: 'Ver todo' }).click().catch(() => {});
await shot(players[N - 1], '09-result');
const stamp = (await host.page.locator('.stamp.big').first().innerText()).trim().toLowerCase();
if (stamp !== 'culpable') errors.push(`expected verdict stamp "culpable", got "${stamp}"`);
log('verdict:', stamp);

// ── Rematch
await host.page.getByRole('button', { name: 'Siguiente ronda' }).click();
for (const p of players) await p.page.getByText(/^Ronda 2/).first().waitFor();
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

// ── Flaky network: a phone goes offline for a few seconds, then recovers its state.
const flaky = players[3];
await flaky.ctx.setOffline(true);
await flaky.page.waitForTimeout(500);
await flaky.page.evaluate(() => window.dispatchEvent(new Event('offline')));
await host.page.waitForTimeout(12_000); // > ping timeout: the server notices the drop
const hostSeesOff = await host.page.evaluate(() => document.body.innerText.includes('Faltan'));
await flaky.ctx.setOffline(false);
await flaky.page.evaluate(() => window.dispatchEvent(new Event('online')));
await flaky.page.getByRole('button', { name: /Abrir tu expediente|Ocultar expediente/ }).first().waitFor({ timeout: 20_000 });
await flaky.page.waitForFunction(() => !document.querySelector('.conn-banner'), null, { timeout: 20_000 });
log('offline → online recovery ok', hostSeesOff ? '' : '(host view unchanged)');

// ── Overflow check at 320px
const tiny = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, storageState: await players[1].ctx.storageState() });
const tp = await tiny.newPage();
await tp.goto(`${BASE}/?sala=${code}`);
await tp.getByRole('button', { name: 'Abrir tu expediente confidencial' }).waitFor();
const overflow = await tp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
if (overflow > 0) errors.push(`horizontal overflow at 320px: ${overflow}px`);
// The fixed action bar does not count towards scrollWidth: check its buttons directly.
const offBar = await tp.evaluate(() => [...document.querySelectorAll('.actionbar-inner > *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 0.5 || el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.trim()));
if (offBar.length) errors.push(`action buttons cut at 320px: ${offBar.join(', ')}`);
await tp.screenshot({ path: `${OUT}/10-declare-320.png`, fullPage: true });

await browser.close();
writeFileSync(`${OUT}/a11y-multi.json`, JSON.stringify(a11yReport, null, 2));
if (errors.length) {
  console.error('\n✗ E2E problems:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log(`\n✓ E2E: ${N} independent browser sessions completed a round, a rematch and a reconnection. Screenshots in ${OUT}/`);
