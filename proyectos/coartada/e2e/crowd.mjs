// npm run e2e:crowd — worst-case crowding for large groups (needs a running server):
// 1 real browser (host) + 9 socket bots with long names. All bots declare the same place at
// every hour (one board cell holds 9 pins), publish 27 testimonies, point at the host and vote.
// Each screen is captured at 390/360/320 px and checked for overlapping or escaping pins,
// clipped text, action buttons past the screen edge and horizontal overflow.
import { chromium } from 'playwright-core';
import { io } from 'socket.io-client';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4100';
const OUT = process.argv[3] ?? 'qa-out/crowd';
mkdirSync(OUT, { recursive: true });
const NAMES = ['Bartolomé', 'Concepción', 'Maximiliano', 'Guadalupe', 'Inmaculada', 'Fernando Javier', 'Esperanza', 'Leopoldo', 'Remedios'];
const problems = [];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => problems.push('pageerror ' + e.message));
await page.goto(BASE);
await page.getByRole('button', { name: 'Crear sala' }).click();
await page.getByLabel('Tu nombre').fill('Ana');
await page.getByRole('button', { name: 'Crear sala' }).click();
await page.waitForURL(/sala=/);
const code = new URL(page.url()).searchParams.get('sala');
const bots = [];
for (const name of NAMES) {
  const s = io(BASE, { transports: ['websocket'], forceNew: true, reconnection: false });
  const bot = { s, last: null, name };
  s.on('state', (m) => (bot.last = m));
  await new Promise((r) => s.on('connect', r));
  const a = await s.emitWithAck('room:join', { code, name });
  if (!a.ok) throw new Error(a.error);
  bot.id = a.playerId;
  bots.push(bot);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (f, ms = 8000) => {
  const t = Date.now();
  while (!f()) {
    if (Date.now() - t > ms) throw new Error('timeout');
    await wait(50);
  }
};
await page.getByText('10/10').waitFor();

const shots = async (name) => {
  for (const w of [390, 360, 320]) {
    await page.setViewportSize({ width: w, height: 844 });
    await wait(700);
    await page.screenshot({ path: `${OUT}/${name}-${w}.png`, fullPage: true });
    const r = await page.evaluate(() => {
      const out = [];
      const ov = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      if (ov > 0) out.push(`horizontal overflow ${ov}px`);
      // Pins inside board cells: big enough, inside their cell, not overlapping.
      document.querySelectorAll('.board-grid .cell').forEach((cell, ci) => {
        const c = cell.getBoundingClientRect();
        const pins = [...cell.querySelectorAll('.pin')].map((p) => p.getBoundingClientRect());
        pins.forEach((a, i) => {
          if (a.width < 24) out.push(`cell ${ci}: pin ${i} only ${a.width.toFixed(0)}px`);
          if (a.left < c.left - 0.5 || a.right > c.right + 0.5 || a.top < c.top - 0.5 || a.bottom > c.bottom + 0.5) out.push(`cell ${ci}: pin ${i} escapes its cell`);
          pins.slice(i + 1).forEach((b, j) => {
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) out.push(`cell ${ci}: pins ${i}/${i + j + 1} overlap`);
          });
        });
      });
      // Text cut by its own box; deliberate horizontal scrollers and screen-reader-only text excluded.
      document.querySelectorAll('main *').forEach((el) => {
        if (el.closest('.board-players') || el.classList.contains('sr-only')) return;
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
        const cs = getComputedStyle(el);
        if ((cs.overflow !== 'visible' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1) out.push(`clipped text: «${el.textContent.trim().slice(0, 40)}»`);
        // Pin initials are 10.9 px by design; anything else this small is reported.
        if (parseFloat(cs.fontSize) < 10.5 && el.getBoundingClientRect().width > 0 && !el.closest('.pin')) out.push(`small text ${cs.fontSize}: «${el.textContent.trim().slice(0, 30)}»`);
      });
      // The fixed action bar never reaches past the screen edge, and no button label is cut.
      document.querySelectorAll('.actionbar-inner > *').forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.right > innerWidth + 0.5 || b.left < -0.5) out.push(`action button «${el.textContent.trim()}» off screen (${b.left.toFixed(0)}–${b.right.toFixed(0)})`);
        if (el.scrollWidth > el.clientWidth + 1) out.push(`action button «${el.textContent.trim()}» clipped`);
      });
      const max = Math.max(0, ...[...document.querySelectorAll('.board-grid .cell')].map((c) => c.querySelectorAll('.pin').length));
      return { out: [...new Set(out)], max };
    });
    console.log(`· ${name} @${w}px: ${r.max ? `hasta ${r.max} fichas en una celda; ` : ''}${r.out.length ? r.out.join(' | ') : 'sin problemas'}`);
    problems.push(...r.out.map((o) => `${name}@${w}: ${o}`));
  }
  await page.setViewportSize({ width: 390, height: 844 });
};
const endPhase = async () => {
  await page.getByRole('button', { name: 'Menú' }).click();
  await page.getByRole('button', { name: 'Terminar esta fase' }).click();
  await page.getByRole('button', { name: 'Sí, terminar esta fase ya' }).click();
  await wait(600);
};

await page.getByRole('button', { name: 'Empezar partida' }).click();
await until(() => bots.every((b) => b.last?.pub.phase === 'declare' && b.last.priv?.role));
const round = bots[0].last.pub.round;
const zone = round.scenario.zones.find((z) => z.id !== round.scene.zone).id;
for (const b of bots) await b.s.emitWithAck('game:declare', { zones: [zone, zone, zone], lock: true });
await shots('01-declaracion');
await endPhase(); // the host gets an automatic declaration
await until(() => bots[0].last.pub.phase === 'investigate');
await wait(1500);
// 27 testimonies: every bot testifies about three other bots, one per hour.
for (const [i, b] of bots.entries())
  for (let k = 0; k < 3; k++) {
    const a = await b.s.emitWithAck('game:testify', { subject: bots[(i + k + 1) % bots.length].id, slot: k });
    if (!a.ok) problems.push(`testify ${a.error}`);
  }
const host = bots[0].last.pub.players.find((p) => !bots.some((b) => b.id === p.id)).id;
for (const b of bots) await b.s.emitWithAck('game:point', { target: host });
await wait(800);
await shots('02-investigacion');
await page.getByRole('button', { name: /^Pedir prueba 2$/ }).click();
await wait(300);
await shots('02b-retirar-peticion');
await page.getByRole('button', { name: 'Retirar petición' }).click();
await endPhase();
await wait(1500);
await shots('03-prueba2');
await endPhase();
await until(() => bots[0].last.pub.phase === 'defense');
await shots('04-defensa');
await page.getByRole('button', { name: 'He terminado mi defensa' }).click();
await until(() => bots[0].last.pub.phase === 'vote');
await shots('05-votacion');
for (const [i, b] of bots.entries()) await b.s.emitWithAck('game:vote', { target: i % 2 ? host : bots[(i + 1) % 9].id });
await page.getByRole('radio').nth(3).click();
await page.getByRole('button', { name: /^Acusar a/ }).click();
await until(() => ['result', 'runoff'].includes(bots[0].last.pub.phase));
await wait(4500);
await shots('06-veredicto');

bots.forEach((b) => b.s.disconnect());
await browser.close();
if (problems.length) {
  console.error(`\n✗ ${problems.length} problema(s):\n  ` + [...new Set(problems)].join('\n  '));
  process.exit(1);
}
console.log(`\n✓ 10 personas, peor caso de amontonamiento: sin solapes, recortes ni desbordamientos. Capturas en ${OUT}/`);
