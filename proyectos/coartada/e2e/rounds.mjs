// npm run e2e:rounds — round 1 → round 2 with phones that drop during the verdict
// (needs a running server, like e2e/match.mjs).
// Real playtest (6 people): after round 1, two players never got into round 2. With N real
// browsers, two non-host phones go offline while the verdict is on screen (a locked phone or
// a backgrounded app) long enough for the server to see them disconnected; the host sees them
// listed as offline and starts round 2 (with 4 players, only 2 are here: the start is refused
// until they're back); the two come back. Every phone must end up in the same round 2 with its
// own file, nobody watching from the sidelines, and nobody pushed to round 3 by a double tap.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4100';
const N = Number(process.argv[3] ?? 6);
const OUT = process.argv[4] ?? `qa-out/rounds-${N}`;
mkdirSync(OUT, { recursive: true });
const NAMES = ['Ana', 'Bruno', 'Carla', 'Dani', 'Eva', 'Fede', 'Gala', 'Hugo'];
const errors = [];
const log = (...a) => console.log('·', ...a);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const players = [];
for (let i = 0; i < N; i++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${NAMES[i]} pageerror: ${e.message}`));
  players.push({ name: NAMES[i], ctx, page });
}
const [host] = players;
const dropped = players.slice(N - 2);

// Room, join by link, start.
await host.page.goto(BASE);
await host.page.getByRole('button', { name: 'Crear sala' }).click();
await host.page.getByLabel('Tu nombre').fill(host.name);
await host.page.getByRole('button', { name: 'Crear sala' }).click();
await host.page.waitForURL(/sala=/);
const code = new URL(host.page.url()).searchParams.get('sala');
for (const p of players.slice(1)) {
  await p.page.goto(`${BASE}/?sala=${code}`);
  await p.page.getByLabel('Tu nombre').fill(p.name);
  await p.page.getByRole('button', { name: 'Entrar' }).click();
  await p.page.getByText('En la sala').waitFor();
}
await host.page.getByText(`${N}/10`).waitFor();
await host.page.getByRole('button', { name: 'Empezar partida' }).click();
for (const p of players) await p.page.getByRole('button', { name: 'Abrir tu expediente confidencial' }).waitFor();

// Round 1, fast: the host ends each phase from the menu until the verdict.
for (let i = 0; i < 6; i++) {
  if (await host.page.getByText('Veredicto').first().isVisible().catch(() => false)) break;
  await host.page.getByRole('button', { name: 'Menú' }).click();
  await host.page.getByRole('button', { name: 'Terminar esta fase' }).click();
  await host.page.getByRole('button', { name: 'Sí, terminar esta fase ya' }).click();
  await host.page.waitForTimeout(700);
}
for (const p of players) await p.page.getByText('Veredicto').first().waitFor();
log(`${N} jugadores en el veredicto de la ronda 1`);

// Two phones drop while the verdict is on screen, long enough for the server to notice
// (ping interval 10 s + timeout 8 s).
for (const p of dropped) {
  await p.ctx.setOffline(true);
  await p.page.evaluate(() => window.dispatchEvent(new Event('offline')));
}
await host.page.waitForTimeout(21_000);
log(`${dropped.map((p) => p.name).join(' y ')} sin conexión durante el veredicto`);

// The host sees who is offline, with the option to remove them.
await host.page.getByRole('button', { name: 'Ver todo' }).click().catch(() => {});
const offlinePanel = host.page.getByRole('region', { name: 'Personas sin conexión' });
await offlinePanel.waitFor();
for (const p of dropped) if (!(await offlinePanel.getByText(p.name).count())) errors.push(`el anfitrión no ve a ${p.name} como sin conexión`);
log(`el anfitrión ve sin conexión a ${dropped.map((p) => p.name).join(' y ')}, con «Quitar»`);
await offlinePanel.scrollIntoViewIfNeeded();
await host.page.screenshot({ path: `${OUT}/anfitrion-sin-conexion.png` });
const back = async () => {
  for (const p of dropped) {
    await p.ctx.setOffline(false);
    await p.page.evaluate(() => window.dispatchEvent(new Event('online')));
  }
};
const next = host.page.getByRole('button', { name: 'Siguiente ronda' });
if (N - 2 < 4) {
  // Fewer than 4 here: not a game yet. The host is told why; the round starts once they're back.
  await next.click();
  await host.page.getByText('Hacen falta al menos 4 personas conectadas.').waitFor();
  log(`con ${N - 2} conectados no empieza: «Hacen falta al menos 4 personas conectadas.»`);
  await back();
  await offlinePanel.waitFor({ state: 'detached', timeout: 30_000 });
}
// The host starts round 2 (a double tap must not skip a round).
await next.dblclick();
for (const p of players.slice(0, N - 2)) await p.page.getByText(/^Ronda 2/).first().waitFor({ timeout: 15_000 });
log('los conectados están en la ronda 2');

// They come back (if they weren't already).
if (N - 2 >= 4) await back();
for (const p of players) {
  try {
    await p.page.getByRole('button', { name: 'Abrir tu expediente confidencial' }).waitFor({ timeout: 30_000 });
  } catch {
    const shown = (await p.page.locator('main').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 140);
    errors.push(`${p.name}: no tiene su expediente en la ronda 2; pantalla: «${shown}»`);
    continue;
  }
  const text = await p.page.locator('main').innerText();
  if (/Estás viendo esta ronda/.test(text)) errors.push(`${p.name}: está de espectador en la ronda 2`);
  if (!/Ronda 2 de/.test(text)) errors.push(`${p.name}: no muestra «Ronda 2» (¿se saltó una ronda?)`);
}
await dropped[0].page.screenshot({ path: `${OUT}/vuelve-ronda2.png` });
log('los que volvieron tienen su expediente en la ronda 2');

// Same round for everyone: every phone shows the same case header.
const headers = new Set();
for (const p of players) headers.add(((await p.page.locator('main').innerText()).match(/Ronda 2 de[^\n]*/) ?? ['?'])[0]);
if (headers.size !== 1) errors.push(`no todos ven el mismo caso: ${[...headers].join(' | ')}`);
else log(`todos ven el mismo caso: «${[...headers][0]}»`);
await browser.close();
if (errors.length) {
  console.error('\n✗ Problemas en el paso de ronda:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log(
  N - 2 < 4
    ? `\n✓ ${N} jugadores: con 2 sin conexión no empieza (lo dice); al volver, los ${N} juegan la misma ronda 2.`
    : `\n✓ ${N} jugadores: los ${N - 2} conectados y los 2 que volvieron juegan la misma ronda 2.`,
);
