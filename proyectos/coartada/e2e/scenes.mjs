// npm run e2e:scenes — each case shows its own scene (needs a running server, like e2e/match.mjs).
//  1. The build serves one scene file per case: 25 distinct SVGs, each one byte-identical to its
//     source in src/client/assets/scenes and sent as image/svg+xml.
//  2. In real rounds (a phone plus socket bots, several cases in a row), the declaration screen
//     shows the scene of the case being played, loaded (not a broken image) and silent for screen
//     readers; at 320, 360 and 390 px it fits the screen without horizontal scroll; axe finds no
//     serious problem.
//     A case with an imported illustration (WebP) shows it instead of its drawing.
//  3. If the scene files can't be loaded, the generic scene of its kind of place is drawn instead,
//     with no broken image, and the rest of the screen is unchanged.
import { chromium } from 'playwright-core';
import { io } from 'socket.io-client';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { auditA11y } from './a11y.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4100';
const OUT = process.argv[3] ?? 'qa-out/scenes';
const ROUNDS = Number(process.env.ROUNDS ?? 6);
mkdirSync(OUT, { recursive: true });
const errors = [];
const log = (...a) => console.log('·', ...a);
const check = (ok, msg) => {
  if (!ok) errors.push(msg);
};
const NAMES = ['Ana', 'Bruno', 'Carla', 'Dani', 'Eva'];

// ── 1. Every scene file is served, once per case.
const SRC = new URL('../src/client/assets/scenes/', import.meta.url);
const sources = readdirSync(SRC).filter((f) => f.endsWith('.svg'));
const illustrated = new Set(readdirSync(SRC).filter((f) => /^[a-z-]+(?<!-720)\.webp$/.test(f)).map((f) => f.replace(/\.webp$/, '')));
const built = readdirSync(new URL('../dist/client/assets/', import.meta.url)).filter((f) => f.endsWith('.svg'));
check(sources.length === 25, `esperaba 25 escenas en el código, hay ${sources.length}`);
for (const f of sources) {
  const stem = f.replace(/\.svg$/, '');
  const hits = built.filter((b) => b.replace(/-[\w-]{8}\.svg$/, '') === stem);
  if (hits.length !== 1) {
    errors.push(`${stem}: ${hits.length} archivos en el build`);
    continue;
  }
  const res = await fetch(`${BASE}/assets/${hits[0]}`);
  check(res.status === 200, `${stem}: HTTP ${res.status}`);
  check((res.headers.get('content-type') ?? '').startsWith('image/svg+xml'), `${stem}: tipo ${res.headers.get('content-type')}`);
  check((await res.text()) === readFileSync(new URL(f, SRC), 'utf8'), `${stem}: el archivo servido no coincide con el original`);
}
log(`${sources.length} escenas servidas por el build`);

// ── Helpers
async function bot(name, code) {
  const s = io(BASE, { transports: ['websocket'], forceNew: true, reconnection: false });
  const b = { s, name, last: null };
  s.on('state', (m) => (b.last = m));
  await new Promise((r) => s.on('connect', r));
  const a = code ? await s.emitWithAck('room:join', { code, name }) : await s.emitWithAck('room:create', { name });
  if (!a.ok) throw new Error(a.error);
  Object.assign(b, { id: a.playerId, code: a.code });
  return b;
}
const until = async (f, ms = 8000) => {
  const t = Date.now();
  while (!f()) {
    if (Date.now() - t > ms) throw new Error('timeout');
    await new Promise((r) => setTimeout(r, 30));
  }
};

/** A room with three bots and the phone as the fourth player, waiting in the lobby. */
async function table(browser, { blockScenes = false } = {}) {
  const host = await bot(NAMES[0]);
  const bots = [host, await bot(NAMES[1], host.code), await bot(NAMES[2], host.code)];
  await host.s.emitWithAck('room:settings', { rounds: 0 });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  // 'webp': only the illustrations fail; true: every scene file fails.
  if (blockScenes) await page.route(blockScenes === 'webp' ? /\/assets\/[\w-]+\.webp$/ : /\/assets\/[\w-]+\.(svg|webp)$/, (r) => r.abort());
  await page.goto(`${BASE}/?sala=${host.code}`);
  await page.getByLabel('Tu nombre').fill('Mira');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByText('En la sala').waitFor();
  return { host, bots, ctx, page };
}

/** What the declaration screen shows: the scene figure and whether its image really loaded. */
const sceneState = (page) =>
  page.locator('figure.case-scene').evaluate((fig) => {
    const img = fig.querySelector('img');
    const r = fig.getBoundingClientRect();
    const art = (img ?? fig.querySelector('svg'))?.getBoundingClientRect();
    return {
      scene: fig.dataset.scene,
      img: img ? { complete: img.complete, natural: img.naturalWidth, alt: img.getAttribute('alt'), src: img.getAttribute('src') } : null,
      svg: !!fig.querySelector('svg[aria-hidden="true"]'),
      left: r.left,
      right: r.right,
      width: art?.width ?? 0,
      height: art?.height ?? 1,
      vw: innerWidth,
      scroll: document.scrollingElement.scrollWidth,
    };
  });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

// ── 2. Real rounds: the scene of each case.
{
  const { host, bots, ctx, page } = await table(browser);
  const seen = new Set();
  for (let round = 1; round <= ROUNDS; round++) {
    // The host bot has just sent a burst of skips: wait out the server's rate limit if it hits it.
    for (let tries = 0; ; tries++) {
      const a = await host.s.emitWithAck(round === 1 ? 'game:start' : 'game:next', {});
      if (a.ok || a.error !== 'rate_limited' || tries === 10) {
        check(a.ok, `ronda ${round}: no empieza (${a.error})`);
        if (tries) log(`ronda ${round}: límite de mensajes del servidor, empieza tras ${tries} reintento(s)`);
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    await until(() => bots.every((b) => b.last?.pub.phase === 'declare' && b.last.pub.round?.number === round));
    const id = host.last.pub.round.scenario.id;
    await page.locator('figure.case-scene').waitFor();
    await page.waitForFunction(() => {
      const img = document.querySelector('figure.case-scene img');
      return !img || img.complete;
    });
    for (const width of [390, 360, 320]) {
      await page.setViewportSize({ width, height: 800 });
      const s = await sceneState(page);
      const want = illustrated.has(id) ? `${id}-ilustracion` : id; // its illustration once imported, else its drawing
      check(s.scene === want, `ronda ${round} (${width} px): muestra la escena «${s.scene}» en el caso «${id}» (esperada «${want}»)`);
      check(!!s.img && s.img.complete && s.img.natural > 0, `ronda ${round} ${id}: la imagen no ha cargado`);
      check(s.img?.alt === '', `ronda ${round} ${id}: la imagen debe ser decorativa (alt vacío)`);
      check(s.left >= 0 && s.right <= s.vw + 0.5, `ronda ${round} ${id} (${width} px): la escena se sale de la pantalla`);
      check(s.scroll <= s.vw, `ronda ${round} ${id} (${width} px): scroll horizontal (${s.scroll} > ${s.vw})`);
      const ratio = s.scene.endsWith('-ilustracion') ? 16 / 9 : 320 / 120; // illustration frame or drawing strip
      check(Math.abs(s.width / s.height - ratio) < 0.1, `ronda ${round} ${id} (${width} px): proporción ${(s.width / s.height).toFixed(2)}`);
      if (width === 320) await page.locator('figure.case-scene').screenshot({ path: `${OUT}/r${round}-${id}-320.png` });
    }
    seen.add(id);
    if (round === 1) await auditA11y(page, `declaración con escena (${id})`, errors);
    // End the round quickly: the host skips each timed step.
    for (let i = 0; i < 12 && host.last.pub.phase !== 'result'; i++) {
      await host.s.emitWithAck('game:advance', {});
      await new Promise((r) => setTimeout(r, 60));
    }
    await until(() => host.last.pub.phase === 'result');
    await page.setViewportSize({ width: 390, height: 844 });
  }
  log(`${seen.size} casos distintos vistos en ${ROUNDS} rondas: ${[...seen].join(', ')}`);
  check(seen.size === ROUNDS, `se repitió un caso en ${ROUNDS} rondas seguidas`);
  bots.forEach((b) => b.s.disconnect());
  await ctx.close();
}

// ── 3a. Fallback: the illustration fails, the case's own drawing is shown.
{
  const { host, bots, ctx, page } = await table(browser, { blockScenes: 'webp' });
  await host.s.emitWithAck('game:start', {});
  await until(() => bots.every((b) => b.last?.pub.phase === 'declare'));
  const id = host.last.pub.round.scenario.id;
  await page.locator('figure.case-scene img').waitFor();
  await page.waitForFunction(() => document.querySelector('figure.case-scene')?.dataset.scene?.indexOf('-ilustracion') === -1);
  await page.waitForFunction(() => document.querySelector('figure.case-scene img')?.complete);
  const s = await sceneState(page);
  check(s.scene === id, `respaldo 1: muestra «${s.scene}» en vez del dibujo de «${id}»`);
  check(!!s.img && s.img.natural > 0, 'respaldo 1: el dibujo no ha cargado');
  log(`ilustración bloqueada en «${id}»: ${s.scene}`);
  bots.forEach((b) => b.s.disconnect());
  await ctx.close();
}

// ── 3b. Fallback: every scene file fails, the generic scene is drawn.
{
  const { host, bots, ctx, page } = await table(browser, { blockScenes: true });
  await host.s.emitWithAck('game:start', {});
  await until(() => bots.every((b) => b.last?.pub.phase === 'declare'));
  const id = host.last.pub.round.scenario.id;
  await page.locator('figure.case-scene svg').waitFor();
  const s = await sceneState(page);
  check(s.scene.startsWith('generic-'), `respaldo: muestra «${s.scene}» en vez de la escena genérica`);
  check(s.img === null, 'respaldo: queda una imagen rota en la ficha');
  check(s.svg, 'respaldo: la escena genérica no es decorativa');
  check(s.scroll <= s.vw, 'respaldo: scroll horizontal');
  await page.getByRole('heading', { name: host.last.pub.round.scenario.title }).waitFor();
  await page.locator('figure.case-scene').screenshot({ path: `${OUT}/fallback-${id}.png` });
  log(`respaldo con el archivo bloqueado en «${id}»: ${s.scene}`);
  bots.forEach((b) => b.s.disconnect());
  await ctx.close();
}

await browser.close();
if (errors.length) {
  console.error(`\n✗ ${errors.length} problemas:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log('\n✓ escenas por caso: archivos servidos, escena correcta en cada ronda, móvil 320–390 px, respaldo y accesibilidad');
process.exit(0);
