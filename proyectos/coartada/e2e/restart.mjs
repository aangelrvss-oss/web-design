// npm run e2e:restart — the server restarts in the middle of a round (needs `npm run build`).
// Starts its own server from dist/server.mjs. For a graceful shutdown (SIGTERM, what Render
// sends on a restart or deploy) and for a crash (SIGKILL), two real browsers and two socket
// bots are in the declaration phase when the server goes down and comes back empty. Each
// browser must reconnect by itself, find that its room no longer exists, drop the dead round,
// show a clear notice and be able to create or join a new room. A plain network cut with the
// server still up must keep resuming the same room (regression check).
import { chromium } from 'playwright-core';
import { io } from 'socket.io-client';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { auditA11y } from './a11y.mjs';

const PORT = Number(process.env.PORT ?? 4190);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = process.argv[2] ?? 'qa-out/restart';
const RECOVER_MS = 20_000; // after the server is back
mkdirSync(OUT, { recursive: true });
const errors = [];
const log = (...a) => console.log('·', ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let server = null;
async function startServer() {
  server = spawn(process.execPath, ['dist/server.mjs'], { env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stderr.resume();
  await new Promise((ok, fail) => {
    const t = setTimeout(() => fail(new Error('server did not start')), 10_000);
    server.stdout.on('data', (d) => String(d).includes('"listening"') && (clearTimeout(t), ok()));
  });
}
async function stopServer(signal) {
  const p = server;
  if (!p || p.exitCode !== null || p.signalCode !== null) return;
  const exited = new Promise((r) => p.once('exit', r));
  p.kill(signal);
  await exited;
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
async function phone(name) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name} pageerror: ${e.message}`));
  return { name, ctx, page };
}
const session = (p) => p.page.evaluate(() => localStorage.getItem('coartada:session'));
const roomInUrl = (p) => new URL(p.page.url()).searchParams.get('sala');

/** Host creates a room in the browser, a second browser joins by link, two bots fill it, the round starts. */
async function startRound() {
  const a = await phone('Ana');
  const b = await phone('Bea');
  await a.page.goto(BASE);
  await a.page.getByRole('button', { name: 'Crear sala' }).click();
  await a.page.getByLabel('Tu nombre').fill('Ana');
  await a.page.getByRole('button', { name: 'Crear sala' }).click();
  await a.page.waitForURL(/sala=/);
  const code = roomInUrl(a);
  await b.page.goto(`${BASE}/?sala=${code}`);
  await b.page.getByLabel('Tu nombre').fill('Bea');
  await b.page.getByRole('button', { name: 'Entrar' }).click();
  await b.page.getByText('En la sala').waitFor();
  const bots = [];
  for (const name of ['Ciro', 'Dora']) {
    const s = io(BASE, { transports: ['websocket'], forceNew: true, reconnection: false });
    await new Promise((r) => s.on('connect', r));
    await s.emitWithAck('room:join', { code, name });
    bots.push(s);
  }
  await a.page.getByRole('button', { name: 'Empezar partida' }).click();
  for (const p of [a, b]) await p.page.getByRole('button', { name: 'Abrir tu expediente confidencial' }).waitFor();
  return { a, b, bots, code };
}

// Never leave a server behind, whatever happens: failures, timeouts and Ctrl+C all end in 'exit'.
process.on('exit', () => server && server.exitCode === null && server.kill('SIGKILL'));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(130));

/** The dead round must be gone: home screen, clear notice, no room in the URL, no stored session. */
async function expectRecovered(p, label) {
  const t0 = Date.now();
  try {
    await p.page.getByRole('status').filter({ hasText: 'ya no existe' }).waitFor({ timeout: RECOVER_MS });
  } catch {
    const shown = (await p.page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 120);
    errors.push(`${label} ${p.name}: no recovery notice after ${RECOVER_MS / 1000} s; screen shows «${shown}»`);
    return false;
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (await p.page.getByRole('button', { name: 'Abrir tu expediente confidencial' }).count()) errors.push(`${label} ${p.name}: the dead round is still on screen`);
  if (!(await p.page.getByRole('button', { name: 'Crear sala' }).count())) errors.push(`${label} ${p.name}: home actions not offered`);
  if (roomInUrl(p)) errors.push(`${label} ${p.name}: the URL still points at the dead room (${roomInUrl(p)})`);
  if (await session(p)) errors.push(`${label} ${p.name}: the dead session is still stored`);
  log(`${label}: ${p.name} back on the home screen with the notice after ${secs} s`);
  return true;
}

/** The server goes down mid-round with `signal`, stays down a while and comes back empty. */
async function restartScenario(signal) {
  const label = signal === 'SIGTERM' ? 'graceful restart (SIGTERM)' : 'crash (SIGKILL)';
  const { a, b, bots } = await startRound();
  try {
    await stopServer(signal);
    for (const p of [a, b]) {
      try {
        await p.page.locator('.conn-banner').waitFor({ timeout: 5_000 });
      } catch {
        errors.push(`${label} ${p.name}: no connection banner while the server is down`);
      }
    }
    await wait(Number(process.env.DOWN_MS ?? 1_500)); // how long the server stays down
    await startServer();
    let recovered = true;
    for (const p of [a, b]) recovered = (await expectRecovered(p, label)) && recovered;
    await a.page.screenshot({ path: `${OUT}/${signal}-recovered.png`, fullPage: true });
    if (!recovered) return;
    await auditA11y(a.page, `inicio tras ${label}`, errors, []);

    // After the notice, a new room works: Ana creates one and Bea joins it by code.
    await a.page.getByRole('button', { name: 'Crear sala' }).click();
    await a.page.getByLabel('Tu nombre').fill('Ana');
    await a.page.getByRole('button', { name: 'Crear sala' }).click();
    await a.page.waitForURL(/sala=/);
    const fresh = roomInUrl(a);
    await b.page.getByRole('button', { name: 'Unirme con un código' }).click();
    await b.page.getByLabel('Código de la sala').fill(fresh);
    await b.page.getByLabel('Tu nombre').fill('Bea');
    await b.page.getByRole('button', { name: 'Entrar' }).click();
    await b.page.getByText('En la sala').waitFor();
    await a.page.getByText('2/10').waitFor();
    log(`${label}: a new room (${fresh}) works for both phones`);
  } catch (e) {
    errors.push(`${label}: ${e.message.split('\n')[0]}`);
  } finally {
    bots.forEach((s) => s.disconnect());
    await a.ctx.close();
    await b.ctx.close();
  }
}

await startServer();
await restartScenario('SIGTERM');
await restartScenario('SIGKILL');

// Regression: a network cut while the server stays up keeps resuming the same room.
{
  const { a, b, bots, code } = await startRound();
  await b.ctx.setOffline(true);
  await b.page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await b.page.locator('.conn-banner').waitFor();
  await wait(2_000);
  await b.ctx.setOffline(false);
  await b.page.evaluate(() => window.dispatchEvent(new Event('online')));
  await b.page.locator('.conn-banner').waitFor({ state: 'detached', timeout: 20_000 });
  if (!(await b.page.getByRole('button', { name: 'Abrir tu expediente confidencial' }).count())) errors.push('network cut: Bea lost her round');
  if (roomInUrl(b) !== code) errors.push('network cut: Bea is no longer in the same room');
  if (!(await session(b))) errors.push('network cut: Bea lost her session');
  log('network cut with the server up: Bea resumed the same round');
  bots.forEach((s) => s.disconnect());
  await a.ctx.close();
  await b.ctx.close();
}

await browser.close();
await stopServer('SIGTERM');
if (errors.length) {
  console.error('\n✗ Restart E2E problems:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log('\n✓ Restart E2E: after a graceful restart and after a crash, every phone drops the dead round, shows the notice and can start again.');
