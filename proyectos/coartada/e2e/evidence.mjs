// npm run e2e:evidence — the evidence ring on the board must enclose every pin of its cell
// (needs a running server, like e2e/match.mjs).
// The players are socket bots so each cell's occupants are known exactly: the evidence marks
// where the culprit really was at the two non-crime hours, and the culprit's own private file
// says where that is. Bots fill the two evidence cells with a chosen number of people; a real
// browser watches the board (as a late spectator, or as the 10th player when the room would be
// full). For every evidence cell, at 320–390 px and on a wide screen: it shows exactly the people
// whose declaration matches that hour and place; every point on the edge of each of their pins
// falls inside the drawn loop (SVG hit test); no pin from another cell does; the loop is the
// group's block plus its margin, not the whole cell; and a bigger group never gets a smaller loop.
import { chromium } from 'playwright-core';
import { io } from 'socket.io-client';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4100';
const OUT = process.argv[3] ?? 'qa-out/evidence';
mkdirSync(OUT, { recursive: true });
const errors = [];
const WIDTHS = [390, 360, 340, 320, 800];
const RING_PAD = 5; // src/client/lib/ring.ts
const log = (...a) => console.log('·', ...a);
const NAMES = ['Ana', 'Bruno', 'Carla', 'Dani', 'Eva', 'Fede', 'Gala', 'Hugo', 'Inés', 'Jon'];

// Each case: how many players, and how many of them to put in evidence cells 1 and 2.
const CASES = [
  { n: 4, cells: [2, 1] },
  { n: 5, cells: [0, 2] },
  { n: 5, cells: [2, 3] },
  { n: 6, cells: [4, 2] },
  { n: 7, cells: [5, 1] },
  { n: 8, cells: [3, 5] },
  { n: 10, cells: [6, 3] },
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

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

for (const { n, cells } of CASES) {
  // With 10 players the room is full, so the phone is the 10th player instead of a spectator
  // (and the room is redone if the phone happens to be the culprit: the plan needs the
  // culprit's real night, which only the culprit's own device receives).
  const browserPlays = n === 10;
  let host, bots, ctx, page, culprit;
  for (let attempt = 0; ; attempt++) {
    host = await bot(NAMES[0]);
    bots = [host];
    for (let i = 1; i < (browserPlays ? n - 1 : n); i++) bots.push(await bot(NAMES[i], host.code));
    ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    if (browserPlays) {
      await page.goto(`${BASE}/?sala=${host.code}`);
      await page.getByLabel('Tu nombre').fill('Mira');
      await page.getByRole('button', { name: 'Entrar' }).click();
      await page.getByText('En la sala').waitFor();
    }
    await host.s.emitWithAck('game:start', {});
    await until(() => bots.every((b) => b.last?.pub.phase === 'declare' && b.last.priv?.role));
    culprit = bots.find((b) => b.last.priv.role === 'culpable');
    if (culprit || attempt > 5) break;
    bots.forEach((b) => b.s.disconnect());
    await ctx.close();
  }
  const round = host.last.pub.round;
  const zones = round.scenario.zones.map((z) => z.id);
  const truth = culprit.last.priv.truth;
  const evidenceSlots = [0, 1, 2].filter((s) => s !== round.scene.slot);
  // Bots 0..k1-1 go to evidence cell 1, the next k2 to evidence cell 2, the rest elsewhere.
  const plan = new Map();
  let next = 0;
  evidenceSlots.forEach((slot, i) => {
    for (let k = 0; k < cells[i]; k++) plan.set(bots[next++].id, { slot, zone: truth[slot] });
  });
  for (const b of bots) {
    const p = plan.get(b.id);
    const decl = [0, 1, 2].map((slot) => {
      if (p && p.slot === slot) return p.zone;
      // Anywhere except an evidence cell or the scene.
      return zones.find((z) => !(evidenceSlots.includes(slot) && z === truth[slot]) && !(slot === round.scene.slot && z === round.scene.zone));
    });
    const a = await b.s.emitWithAck('game:declare', { zones: decl, lock: true });
    if (!a.ok) throw new Error(`declare ${a.error}`);
  }
  if (browserPlays) await host.s.emitWithAck('game:advance', {}); // the phone gets an automatic alibi
  await until(() => host.last.pub.phase === 'investigate');
  await host.s.emitWithAck('game:advance', {}); // second piece of evidence
  await until(() => host.last.pub.round.traces.length === 2);

  // Who really is in each evidence cell, from the public declarations.
  const pr = host.last.pub.round;
  const expected = pr.traces.map((t) => pr.participants.filter((id) => pr.declarations[id].zones[t.slot] === t.zone).length);
  if (!browserPlays) {
    await page.goto(`${BASE}/?sala=${host.code}`);
    await page.getByLabel('Tu nombre').fill('Mira');
    await page.getByRole('button', { name: 'Entrar' }).click();
  }
  await page.locator('.board-grid').waitFor();
  await page.waitForTimeout(1200); // pins flip in
  // Both pieces of evidence came out within a second (or before this phone arrived): one notice
  // announces both, and both cells are lit.
  {
    const notice = page.locator('.evidence-notice');
    const text = (await notice.innerText().catch(() => '')).replace(/\s+/g, ' ');
    if (!/Nuevas pruebas/i.test(text) || !text.includes('P1') || !text.includes('P2')) errors.push(`${n} jugadores: aviso de dos pruebas seguidas: «${text}»`);
    if ((await page.locator('.board .cell.fresh-trace').count()) !== 2) errors.push(`${n} jugadores: las dos celdas nuevas no están resaltadas`);
    else log(`${n} jugadores: un solo aviso para las dos pruebas («${text.slice(0, 60)}…»)`);
    await page.getByRole('button', { name: 'Cerrar el aviso de las nuevas pruebas' }).click().catch(() => {});
  }

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(400);
    const res = await page.evaluate((pad) => {
      const allPins = [...document.querySelectorAll('.board-grid .cell .pin')];
      const out = [];
      for (const cell of document.querySelectorAll('.board-grid .cell')) {
        const ring = cell.querySelector('.trace-ring path');
        if (!ring) continue;
        const inv = ring.getScreenCTM().inverse();
        const inside = (x, y) => ring.isPointInFill(new DOMPoint(x, y).matrixTransform(inv));
        const pins = [...cell.querySelectorAll('.pin')];
        let outside = 0;
        for (const pin of pins) {
          // 16 points on the edge of the (round) pin.
          const r = pin.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width / 2;
          const edge = Array.from({ length: 16 }, (_, i) => [cx + rad * Math.cos((i * Math.PI) / 8), cy + rad * Math.sin((i * Math.PI) / 8)]);
          if (!edge.every(([x, y]) => inside(x, y))) outside++;
        }
        // The names under the portraits are inside too (corners of each label).
        let labelsOut = 0;
        for (const l of cell.querySelectorAll('.token-name')) {
          const r = l.getBoundingClientRect();
          const pts = [[r.left + 1, r.top + 1], [r.right - 1, r.top + 1], [r.left + 1, r.bottom - 1], [r.right - 1, r.bottom - 1]];
          if (!pts.every(([x, y]) => inside(x, y))) labelsOut++;
        }
        // Nobody from another cell inside the loop (centre of every other pin on the board).
        const foreign = allPins.filter((p) => !pins.includes(p)).filter((p) => {
          const r = p.getBoundingClientRect();
          return inside(r.left + r.width / 2, r.top + r.height / 2);
        }).length;
        // Snug: the loop is the people's block (portrait + name) plus its margin (clipped by the
        // cell), not the whole cell.
        const rr = cell.querySelector('.trace-ring').getBoundingClientRect();
        const cr = cell.getBoundingClientRect();
        let slack = 0;
        if (pins.length) {
          const b = [...cell.querySelectorAll('.token')].map((p) => p.getBoundingClientRect());
          const l = Math.min(...b.map((x) => x.left)), t = Math.min(...b.map((x) => x.top));
          const r = Math.max(...b.map((x) => x.right)), bt = Math.max(...b.map((x) => x.bottom));
          slack = Math.max(l - rr.left, t - rr.top, rr.right - r, rr.bottom - bt) - pad;
        }
        out.push({ label: cell.getAttribute('aria-label'), pins: pins.length, outside, labelsOut, foreign, slack, area: rr.width * rr.height, ringW: rr.width, cellW: cr.width });
      }
      return out;
    }, RING_PAD);
    for (const c of res) {
      const status = c.outside ? `✗ ${c.outside} fuera` : '✓ todas dentro';
      log(`${n} jugadores @${width}px · ${c.label.replace(/:.*\(prueba/, ' (prueba')} · ${c.pins} fichas · ${status} · aro ${Math.round(c.ringW)}/${Math.round(c.cellW)} px de ancho`);
      if (c.outside) errors.push(`${n} jugadores @${width}px: ${c.outside} de ${c.pins} fichas fuera del aro en «${c.label}»`);
      if (c.labelsOut) errors.push(`${n} jugadores @${width}px: ${c.labelsOut} nombres fuera del aro en «${c.label}»`);
      if (c.foreign) errors.push(`${n} jugadores @${width}px: ${c.foreign} fichas de otras celdas dentro del aro de «${c.label}»`);
      if (c.slack > 1.5) errors.push(`${n} jugadores @${width}px: el aro de «${c.label}» deja ${c.slack.toFixed(1)} px de más alrededor de sus ${c.pins} fichas`);
    }
    // Same column width, more people → a loop at least as big.
    const bySize = [...res].sort((a, b) => a.pins - b.pins);
    for (let i = 1; i < bySize.length; i++)
      if (bySize[i].pins > bySize[i - 1].pins && bySize[i].area + 1 < bySize[i - 1].area)
        errors.push(`${n} jugadores @${width}px: el aro de ${bySize[i].pins} fichas es más pequeño que el de ${bySize[i - 1].pins}`);
    const got = res.map((c) => c.pins).sort().join(',');
    if (got !== [...expected].sort().join(',')) errors.push(`${n} jugadores @${width}px: fichas por celda con prueba ${got}, esperado ${[...expected].sort().join(',')}`);
    await page.locator('.board').screenshot({ path: `${OUT}/${n}-jugadores-${cells.join('-')}-${width}.png` });
  }
  await ctx.close();
  bots.forEach((b) => b.s.disconnect());
}

await browser.close();
if (errors.length) {
  console.error('\n✗ Aros de prueba:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log(`\n✓ Cada aro de prueba rodea a todas y solo las fichas de su celda, ajustado al grupo (0–6 por celda), a ${WIDTHS.join(', ')} px.`);
