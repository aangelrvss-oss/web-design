// node e2e/prueba-falsa.mjs [baseUrl] [outDir] — «Prueba falsificable» (experimental) on real phones
// (needs a running server, like e2e/match.mjs).
//  A. The switch: off by default; only the host can turn it on; every phone sees the same state.
//  B. Rounds with the rules on (two phones, 390 and 320 px, plus socket bots), until a phone has been
//     the culprit and both examination outcomes have been seen:
//     - the round says it uses experimental rules; only the culprit's file offers the forgery, and an
//       innocent's file and screen never mention one;
//     - evidence is labelled «sin revisar» and never «hecho comprobado» while it may be false;
//     - the examination mark is clear, reversible, survives a reload and an offline spell;
//     - both phones get the same examination result, and the verdict says what was forged;
//     - nothing overflows at 320 px and axe finds no serious problem.
import { chromium } from 'playwright-core';
import { io } from 'socket.io-client';
import { mkdirSync } from 'node:fs';
import { auditA11y } from './a11y.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4100';
const OUT = process.argv[3] ?? 'qa-out/prueba-falsa';
mkdirSync(OUT, { recursive: true });
const errors = [];
const log = (...a) => console.log('·', ...a);
const check = (ok, msg) => (ok ? log(`✓ ${msg}`) : errors.push(msg));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
async function phone(name, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name} pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !/ERR_INTERNET_DISCONNECTED|WebSocket/.test(m.text()) && errors.push(`${name} console: ${m.text()}`));
  return { name, ctx, page };
}
// No sideways scroll, and no button or tag sticking out of its paper card (the file's «Ocultar»
// went past the card's edge at 320 and 360 px).
const noOverflow = (page) =>
  page.evaluate(
    () =>
      document.scrollingElement.scrollWidth <= innerWidth &&
      ![...document.querySelectorAll('.paper .btn, .paper .tag')].some((el) => {
        const card = el.closest('.paper');
        if (!el.offsetParent || !card) return false;
        const a = el.getBoundingClientRect();
        const b = card.getBoundingClientRect();
        return a.width > 0 && (a.right > b.right + 1 || a.left < b.left - 1);
      }),
  );

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
/** The server rate-limits bursts: retry a few times. */
async function send(b, ev, payload = {}) {
  for (let i = 0; i < 12; i++) {
    const a = await b.s.emitWithAck(ev, payload);
    if (a.ok || a.error !== 'rate_limited') return a;
    await sleep(400);
  }
  return { ok: false, error: 'rate_limited' };
}
const until = async (f, ms = 10000) => {
  const t = Date.now();
  while (!f()) {
    if (Date.now() - t > ms) throw new Error('timeout');
    await sleep(40);
  }
};

// ── A. The switch in the lobby.
{
  const host = await phone('Ana', 390);
  const guest = await phone('Bea', 320);
  await host.page.goto(BASE);
  await host.page.getByRole('button', { name: 'Crear sala' }).click();
  await host.page.getByLabel('Tu nombre').fill('Ana');
  await host.page.getByRole('button', { name: 'Crear sala' }).click();
  await host.page.waitForURL(/sala=/);
  const code = new URL(host.page.url()).searchParams.get('sala');
  await guest.page.goto(`${BASE}/?sala=${code}`);
  await guest.page.getByLabel('Tu nombre').fill('Bea');
  await guest.page.getByRole('button', { name: 'Entrar' }).click();
  await guest.page.getByText('En la sala').waitFor();
  const sw = (p) => p.page.getByRole('switch', { name: /Prueba falsificable/ });
  check((await sw(host).getAttribute('aria-checked')) === 'false', 'el interruptor «Prueba falsificable» viene apagado');
  check(await sw(guest).isDisabled(), 'solo quien dirige puede tocarlo');
  await sw(host).click();
  await guest.page.waitForFunction(() => document.querySelector('[role="switch"][aria-checked="true"]')?.textContent?.includes('Prueba falsificable'));
  check(true, 'al activarlo, el otro móvil lo ve activado');
  // The chance of an opportunity: in the same place, 100 % by default, only the host changes it.
  const chance = (p) => p.page.getByRole('group', { name: 'Oportunidad de falsificar' });
  check((await chance(host).getByRole('button', { name: '100 %' }).getAttribute('aria-pressed')) === 'true', 'oportunidad de falsificar: 100 % por defecto');
  check(await chance(guest).getByRole('button', { name: '50 %' }).isDisabled(), 'solo quien dirige cambia la probabilidad');
  await chance(host).getByRole('button', { name: '50 %' }).click();
  await guest.page.waitForFunction(() => document.querySelector('[aria-label="Oportunidad de falsificar"] [aria-pressed="true"]')?.textContent === '50 %');
  check(true, 'al elegir 50 %, el otro móvil lo ve');
  await chance(host).getByRole('button', { name: '100 %' }).click();
  check(await noOverflow(guest.page), 'sala de espera a 320 px sin desbordamiento');
  await guest.page.screenshot({ path: `${OUT}/a-sala-320.png`, fullPage: true });
  await auditA11y(host.page, 'sala con la variante', errors);
  await host.ctx.close();
  await guest.ctx.close();
}

// ── B. Rounds with the rules on.
const hostBot = await bot('Hugo');
const code = hostBot.code;
await send(hostBot, 'room:settings', { variant: 'prueba_falsa', rounds: 0 });
const bots = [hostBot, await bot('Iris', code), await bot('Jon', code)];
const phones = [await phone('Ana', 390), await phone('Bea', 320)];
for (const p of phones) {
  await p.page.goto(`${BASE}/?sala=${code}`);
  await p.page.getByLabel('Tu nombre').fill(p.name);
  await p.page.getByRole('button', { name: 'Entrar' }).click();
  await p.page.getByText('En la sala').waitFor();
}
await until(() => hostBot.last?.pub.players.filter((p) => p.connected).length === 5);

const seen = { phoneForged: false, falsa: false, autentica: false };
let audited = false;
for (let round = 1; round <= 12 && !(seen.phoneForged && seen.falsa && seen.autentica); round++) {
  await send(hostBot, round === 1 ? 'game:start' : 'game:next');
  await until(() => bots.every((b) => b.last?.pub.phase === 'declare' && b.last.pub.round?.number === round && b.last.priv?.role));
  const pub = hostBot.last.pub.round;
  const T = pub.scene.slot;
  const traceSlots = [0, 1, 2].filter((s) => s !== T);
  for (const p of phones) await p.page.getByRole('heading', { level: 1 }).waitFor();

  // Who is who, each phone reading only its own screen.
  for (const p of phones) {
    check(await p.page.getByText('Reglas experimentales: prueba falsificable').isVisible(), `ronda ${round}: ${p.name} ve que se juega con reglas experimentales`);
    await p.page.getByRole('button', { name: 'Abrir tu expediente confidencial' }).click();
    const file = p.page.getByRole('article', { name: 'Tu expediente confidencial' });
    p.role = (await file.locator('.stamp').first().innerText()).trim().toLowerCase();
    const offers = (await file.getByRole('radiogroup', { name: 'Qué prueba falsificas' }).count()) > 0;
    check(offers === (p.role === 'culpable'), `ronda ${round}: ${p.name} (${p.role}) ${p.role === 'culpable' ? 'puede' : 'no puede'} falsificar`);
    if (p.role === 'inocente') check(!/falsific/i.test(await file.innerText()), `ronda ${round}: el expediente de ${p.name} (inocente) no habla de ninguna falsificación`);
  }

  // The culprit forges: through the UI if it is a phone, through the socket if it is a bot.
  let forgedSlot = null;
  const culpritPhone = phones.find((p) => p.role === 'culpable');
  const culpritBot = bots.find((b) => b.last.priv.role === 'culpable');
  if (culpritPhone) {
    const file = culpritPhone.page.getByRole('article', { name: 'Tu expediente confidencial' });
    await file.getByRole('radio', { name: /^La de / }).last().click();
    const places = file.getByRole('radiogroup', { name: /Qué lugar dirá la prueba/ });
    await places.getByRole('radio').first().click();
    await file.getByText(/Elegido: la prueba .* dirá /).waitFor();
    // Reversible: «No falsifico» clears it, and choosing again sets it again.
    await file.getByRole('radio', { name: 'No falsifico' }).click();
    await file.getByText('Ahora mismo no falsificas ninguna prueba.').waitFor();
    await file.getByRole('radio', { name: /^La de / }).last().click();
    await file.getByRole('radiogroup', { name: /Qué lugar dirá la prueba/ }).getByRole('radio').first().click();
    await file.getByText(/Elegido: la prueba .* dirá /).waitFor();
    forgedSlot = traceSlots[1];
    seen.phoneForged = true;
    check(await noOverflow(culpritPhone.page), `ronda ${round}: la elección de la falsificación cabe en ${culpritPhone.name}`);
    await culpritPhone.page.screenshot({ path: `${OUT}/b${round}-falsificar-${culpritPhone.name}.png`, fullPage: true });
    if (!audited) await auditA11y(culpritPhone.page, 'declaración de la persona culpable con la variante', errors);
  } else if (culpritBot && round % 2 === 1) {
    const truth = culpritBot.last.priv.truth;
    forgedSlot = traceSlots[0];
    const zone = pub.scenario.zones.find((z) => z.id !== truth[forgedSlot]).id;
    check((await send(culpritBot, 'game:forge', { forgery: { slot: forgedSlot, zone } })).ok, `ronda ${round}: un bot culpable falsifica`);
  }
  // Nobody else can forge.
  for (const b of bots.filter((x) => x.last.priv.role !== 'culpable')) {
    check((await send(b, 'game:forge', { forgery: null })).error === 'invalid', `ronda ${round}: ${b.name} (${b.last.priv.role}) no puede falsificar`);
  }

  // Declarations: the truth, the culprit avoids the scene at the crime hour.
  for (const p of phones) {
    const blocks = p.page.locator('.hour-block');
    for (let h = 0; h < 3; h++) {
      const block = blocks.nth(h);
      const crime = (await block.locator('.tag.red').count()) > 0;
      if (p.role === 'culpable' && crime) await block.locator('.choice:not(.scene)').first().click();
      else await block.locator('.choice', { hasText: 'Aquí estabas' }).click();
    }
    await p.page.getByRole('button', { name: 'Sellar declaración' }).click();
  }
  for (const b of bots) {
    const zones = b.last.priv.truth.slice();
    if (b.last.priv.role === 'culpable') zones[T] = pub.scenario.zones.find((z) => z.id !== pub.scene.zone).id;
    await send(b, 'game:declare', { zones, lock: true });
  }
  await until(() => hostBot.last.pub.phase === 'investigate');
  for (const p of phones) await p.page.getByRole('heading', { name: '¿Qué prueba queréis revisar?' }).waitFor();

  // Evidence never reads as proven while it may be false.
  for (const p of phones) {
    const card = p.page.getByRole('article', { name: 'Prueba 1' });
    check((await card.getByText('Sin revisar: puede ser falsa').count()) > 0, `ronda ${round}: ${p.name} ve la prueba 1 «sin revisar»`);
    check(!(await card.innerText()).includes('Hecho comprobado'), `ronda ${round}: la prueba 1 no se presenta como hecho comprobado`);
  }
  // Mark, reload, offline: the mark is the server's.
  const [a, b] = phones;
  await a.page.getByRole('button', { name: /^Prueba 1:/ }).click();
  await a.page.getByText('Registrado: marcas la prueba 1.').waitFor();
  await a.page.reload();
  await a.page.getByRole('heading', { name: '¿Qué prueba queréis revisar?' }).waitFor();
  check((await a.page.getByRole('button', { name: /^Prueba 1:/ }).getAttribute('aria-pressed')) === 'true', `ronda ${round}: la marca sigue tras recargar`);
  await b.ctx.setOffline(true);
  await sleep(1500);
  await b.ctx.setOffline(false);
  await b.page.getByRole('heading', { name: '¿Qué prueba queréis revisar?' }).waitFor({ timeout: 15000 });
  check(true, `ronda ${round}: ${b.name} vuelve tras perder la conexión y sigue viendo la revisión`);
  if (!audited) await auditA11y(b.page, 'investigación con la variante (320 px)', errors);

  // Second part: evidence 2 comes out; marks for the examination.
  await send(hostBot, 'game:advance');
  await until(() => hostBot.last.pub.round.traces.length === 2);
  for (const p of phones) await p.page.getByRole('article', { name: 'Prueba 2' }).waitFor();
  const target = round % 2; // alternate which one gets examined
  for (const bt of bots) await send(bt, 'game:examine', { index: target });
  for (const p of phones) {
    const btn = p.page.getByRole('button', { name: new RegExp(`^Prueba ${target + 1}:`) });
    if ((await btn.getAttribute('aria-pressed')) !== 'true') await btn.click();
    await p.page.getByText(`Registrado: marcas la prueba ${target + 1}.`).waitFor();
  }
  check(await noOverflow(b.page), `ronda ${round}: investigación con la revisión a 320 px sin desbordamiento`);
  await b.page.screenshot({ path: `${OUT}/b${round}-revision-320.png`, fullPage: true });

  // End of the investigation: the server examines; every phone gets the same result.
  await send(hostBot, 'game:advance');
  await until(() => ['defense', 'vote'].includes(hostBot.last.pub.phase));
  const done = hostBot.last.pub.round.examination.done;
  const forgedIndex = hostBot.last.pub.round.traces.findIndex((t) => t.slot === forgedSlot);
  const expected = forgedSlot !== null && done.index === forgedIndex ? 'falsa' : 'autentica';
  check(done.index === target && done.result === expected, `ronda ${round}: revisión de la prueba ${target + 1} → ${done.result} (esperado ${expected})`);
  seen[done.result] = true;
  const texts = [];
  for (const p of phones) {
    const card = p.page.locator('section[role="status"][aria-label="Revisión de la prueba"]').first();
    await card.waitFor();
    texts.push((await card.innerText()).replace(/\s+/g, ' '));
  }
  check(texts[0] === texts[1], `ronda ${round}: los dos móviles muestran el mismo resultado de la revisión`);
  check(texts[0].toLowerCase().includes(done.result === 'falsa' ? 'era falsa' : 'era auténtica'), `ronda ${round}: el resultado se entiende («${texts[0].slice(0, 60)}…»)`);
  await b.page.screenshot({ path: `${OUT}/b${round}-resultado-revision-320.png`, fullPage: true });
  if (hostBot.last.pub.phase === 'defense') await send(hostBot, 'game:advance');
  await until(() => hostBot.last.pub.phase === 'vote');

  // Vote: everyone accuses someone (the bots the first phone, the phones the first bot).
  for (const bt of bots) await send(bt, 'game:vote', { target: phones[0].page && hostBot.last.pub.players.find((x) => x.name === 'Ana').id });
  for (const p of phones) {
    const target = p.name === 'Ana' ? 'Hugo' : 'Ana';
    await p.page.getByRole('radio', { name: new RegExp(`^${target}`) }).click();
    await p.page.getByRole('button', { name: `Acusar a ${target}` }).click();
  }
  await until(() => ['result', 'runoff'].includes(hostBot.last.pub.phase));
  if (hostBot.last.pub.phase === 'runoff') {
    for (const bt of bots) await send(bt, 'game:vote', { target: hostBot.last.pub.round.runoff.candidates.find((c) => c !== bt.id) });
    await send(hostBot, 'game:advance');
  }
  await until(() => hostBot.last.pub.phase === 'result');
  for (const p of phones) {
    const reveal = p.page.getByRole('region', { name: 'Qué se falsificó' });
    await reveal.waitFor({ timeout: 15000 }).catch(async () => {
      // The verdict unfolds in steps; skip to the full file.
      await p.page.getByRole('button', { name: /Ver el expediente|Continuar|Ver todo/ }).first().click().catch(() => {});
      await reveal.waitFor();
    });
    const text = await reveal.innerText();
    check(forgedSlot !== null ? /falsificó la prueba/.test(text) : /no falsificó ninguna prueba/.test(text), `ronda ${round}: el veredicto de ${p.name} dice qué se falsificó («${text.slice(0, 70)}…»)`);
  }
  if (!audited) {
    await auditA11y(a.page, 'veredicto con la variante', errors);
    audited = true;
  }
  await a.page.screenshot({ path: `${OUT}/b${round}-veredicto.png`, fullPage: true });
}
check(seen.phoneForged, 'algún móvil fue culpable y falsificó desde la interfaz');
check(seen.falsa && seen.autentica, 'se vieron los dos resultados de la revisión (falsa y auténtica)');

bots.forEach((b) => b.s.disconnect());
await browser.close();
if (errors.length) {
  console.error(`\n✗ ${errors.length} problemas:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log('\n✓ Prueba falsificable: interruptor, falsificación solo de la culpable, revisión clara y común, veredicto, recarga y reconexión, 320 px y accesibilidad');
process.exit(0);
