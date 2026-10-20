// npm run e2e:ux — the phase-2/3 cues, in a real game on "Rápido" with N browsers
// (needs a running server, like e2e/match.mjs). Real time, no clock tricks: ~6 minutes.
//  · New evidence: the notice appears on every phone together, with its cell highlighted; it
//    goes away by itself, with «Ver» or with ×; it does not come back after a reload or after
//    opening and closing the quick guide; the second piece of evidence gets its own, which a
//    locked phone keeps until it is unlocked and an offline phone gets when it reconnects.
//  · Testifying from a pin (320 px): two clearly labelled actions (secret / public), the sheet
//    opens with person and hour filled in, nothing is published until «Publicar testimonio».
//  · Pointing: a player who has never seen the game finds the action from the bottom bar,
//    taps a person and sees it registered (also after a reload); in the last seconds of the
//    investigation, someone who hasn't pointed gets a stronger call.
//  · Countdown: from 15 s it replaces the title in the top bar (the bar doesn't change height,
//    nothing overflows at 320 px) and from 5 s it is a red stamp, in the declaration, the
//    investigation, the vote and a forced runoff; the defense keeps its own big clock; one phone
//    runs with reduced motion.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { auditA11y } from './a11y.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4100';
const N = Number(process.argv[3] ?? 4);
const OUT = process.argv[4] ?? 'qa-out/ux';
mkdirSync(OUT, { recursive: true });
// LONG=1: the longest names a group is likely to use (the worst case for every row and button).
const NAMES = process.env.LONG
  ? ['Maximiliano', 'Fernando Javier', 'Inmaculada', 'Concepción', 'Bartolomé', 'Guadalupe', 'Esperanza', 'Leopoldo', 'Remedios', 'Maricarmen']
  : ['Ana', 'Bruno', 'Carla', 'Dani', 'Eva', 'Fede', 'Gala', 'Hugo', 'Inés', 'Jon'];
const errors = [];
const report = [];
const log = (...a) => console.log('·', ...a);
const check = (ok, msg) => (ok ? log(`✓ ${msg}`) : errors.push(msg));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const players = [];
for (let i = 0; i < N; i++) {
  // The last phone is a narrow one with reduced motion.
  const narrow = i === N - 1;
  const ctx = await browser.newContext({ viewport: { width: narrow ? 320 : 390, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: narrow ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${NAMES[i]} pageerror: ${e.message}`));
  players.push({ name: NAMES[i], ctx, page, narrow });
}
const [host] = players;
const shot = (p, name) => p.page.screenshot({ path: `${OUT}/${name}-${p.narrow ? 320 : 390}.png` });
const secsOf = async (p) => {
  const t = await p.page.locator('.timer-num, .countdown-num').first().innerText();
  return t.includes(':') ? Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]) : Number(t);
};
const waitSecs = async (p, max) => {
  for (;;) {
    const s = await secsOf(p).catch(() => 999);
    if (s <= max) return s;
    await p.page.waitForTimeout(250);
  }
};
const noOverflow = (p) => p.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// ── Room on "Rápido", everyone joins by link.
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
await host.page.getByRole('button', { name: 'Rápido' }).click();
await host.page.getByText(`${N}/10`).waitFor();
await host.page.getByRole('button', { name: 'Empezar partida' }).click();
for (const p of players) await p.page.getByRole('button', { name: 'Abrir tu expediente confidencial' }).waitFor();
// ── Declaration: the countdown takes over in its last 15 s on every phone, then the host ends the
//    phase (everyone gets an automatic alibi).
await waitSecs(host, 15);
{
  const tc = Date.now();
  const lag = await Promise.all(players.map((p) => p.page.locator('.countdown', { hasText: 'Declaración' }).waitFor({ timeout: 2000 }).then(() => Date.now() - tc, () => -1)));
  check(lag.every((l) => l >= 0), `declaración: cuenta atrás grande en los ${N} móviles (desfase máximo ${Math.max(...lag)} ms)`);
  check(await noOverflow(players[N - 1]), 'declaración a 320 px: sin desbordamiento con la cuenta atrás');
  await shot(players[N - 1], '00-declaracion-cuenta-atras');
}
await host.page.getByRole('button', { name: 'Menú' }).click();
await host.page.getByRole('button', { name: 'Terminar esta fase' }).click();
await host.page.getByRole('button', { name: 'Sí, terminar esta fase ya' }).click();

// ── Evidence 1: on every phone, together.
const t0 = Date.now();
const seenAt = await Promise.all(
  players.map(async (p) => {
    await p.page.locator('.evidence-notice').waitFor({ timeout: 15_000 });
    return Date.now() - t0;
  }),
);
check(Math.max(...seenAt) - Math.min(...seenAt) < 1500, `«Nueva prueba P1» en los ${N} móviles a la vez (${seenAt.join(', ')} ms)`);
for (const p of players) {
  const text = await p.page.locator('.evidence-notice').innerText();
  if (!/Nueva prueba/i.test(text) || !/P1/.test(text)) errors.push(`${p.name}: aviso sin «Nueva prueba P1»: ${text}`);
  if ((await p.page.locator('.board .cell.fresh-trace').count()) !== 1) errors.push(`${p.name}: la celda de la prueba 1 no está resaltada`);
}
await host.page.waitForTimeout(700); // let the slip settle
await shot(host, '01-nueva-prueba');
await shot(players[N - 1], '01-nueva-prueba');
await auditA11y(host.page, 'aviso de nueva prueba', errors, report);

// «Ver» on one phone: the banner goes, the cell stays highlighted a moment, then it's done.
const viewer = players[1];
await viewer.page.locator('.evidence-notice').getByRole('button', { name: 'Ver' }).click();
await viewer.page.locator('.evidence-notice').waitFor({ state: 'detached', timeout: 3000 });
check((await viewer.page.locator('.board .cell.fresh-trace').count()) === 1, '«Ver» quita el aviso y deja la celda resaltada un momento');
await viewer.page.locator('.board .cell.fresh-trace').waitFor({ state: 'detached', timeout: 6000 });
// × on another.
await players[2].page.getByRole('button', { name: 'Cerrar el aviso de la nueva prueba' }).click();
await players[2].page.locator('.evidence-notice').waitFor({ state: 'detached', timeout: 3000 });
// By itself on the host (≈9 s).
await host.page.locator('.evidence-notice').waitFor({ state: 'detached', timeout: 13_000 });
log('el aviso se va con «Ver», con × y solo (en unos 9 s)');
// Not again: reload, and open/close the quick guide.
await viewer.page.reload();
await viewer.page.locator('.board').waitFor();
await viewer.page.waitForTimeout(1500);
check((await viewer.page.locator('.evidence-notice').count()) === 0, 'tras recargar, la prueba ya vista no se anuncia otra vez');
await host.page.getByRole('button', { name: 'Guía rápida' }).first().click();
await host.page.getByRole('dialog', { name: 'Guía rápida' }).getByRole('button', { name: 'Volver a la partida' }).click();
await host.page.waitForTimeout(800);
check((await host.page.locator('.evidence-notice').count()) === 0, 'abrir y cerrar la guía no repite el aviso');

// ── Pointing, as a newcomer would find it: the bottom bar says it's pending and takes you there.
const pointer = players[2];
const hint = pointer.page.locator('.actionbar .hint-link');
check(await hint.isVisible(), `la barra inferior avisa: «${(await hint.innerText()).trim()}»`);
await hint.click();
const heading = pointer.page.getByRole('heading', { name: 'Señala a quien crees culpable' });
await pointer.page.waitForTimeout(900);
const box = await heading.boundingBox();
check(box && box.y >= 0 && box.y + box.height <= 780, 'el enlace lleva al panel «Señala a quien crees culpable»');
const target = players.find((p) => p !== pointer).name;
const option = pointer.page.locator('#point-panel').getByRole('button', { name: target, exact: true });
check((await pointer.page.locator('#point-panel .point-option').count()) === N - 1, `${N - 1} personas a las que señalar, como botones`);
await shot(pointer, '02-senalar-pendiente');
await option.click();
await pointer.page.getByText(`señalas a ${target}`).waitFor();
check((await option.getAttribute('aria-pressed')) === 'true', `seleccionado: ${target} queda marcado y «Registrado: señalas a ${target}»`);
check((await pointer.page.locator('.actionbar .hint-link').count()) === 0, 'la barra inferior deja de pedir que señales');
await shot(pointer, '03-senalar-registrado');
await pointer.page.locator('#point-panel').screenshot({ path: `${OUT}/03b-panel-senalar-${N}.png` });
await players[N - 1].page.locator('#point-panel').screenshot({ path: `${OUT}/03b-panel-senalar-${N}-320.png` });
await auditA11y(pointer.page, 'panel de señalar', errors, report);
await pointer.page.reload();
await pointer.page.getByText(`señalas a ${target}`).waitFor();
log('tras recargar sigue registrado (lo guarda el servidor)');
// Pointing from a pin on the board: tap a pin, then the button in the summary.
const other = players[3];
const pinTarget = players.find((p) => p !== other).name;
await other.page.locator('.board-players').getByRole('button', { name: pinTarget }).click();
await other.page.getByRole('button', { name: `Señalar a ${pinTarget} para la última defensa` }).click();
await other.page.getByText(`Ya señalas a ${pinTarget} para la última defensa.`).waitFor();
log(`desde el tablero: ${other.name} señala a ${pinTarget}`);

// ── Testifying from a pin (narrow phone): the pin only opens the summary; «Testificar» there
//    opens the usual sheet with that person and that pin's hour filled in; nothing is public
//    until «Publicar testimonio».
{
  const w = players[N - 1];
  const subject = players.find((p) => p !== w && p.name !== pinTarget).name; // someone w is not pointing at
  const testimonies = () => host.page.locator('.testimony').count();
  const before = await testimonies();
  await w.page.keyboard.press('Escape').catch(() => {});
  const cell = w.page.locator('.board-grid [role="cell"]', { has: w.page.getByRole('button', { name: subject, exact: true }) }).first();
  const hour = (await cell.getAttribute('aria-label')).match(/(a las? \d\d:\d\d)/)[1];
  await cell.getByRole('button', { name: subject, exact: true }).click();
  const secret = w.page.getByRole('button', { name: new RegExp(`^(?=.*Señalar a ${subject} para la última defensa)(?=.*Secreto)`) });
  const pub = w.page.getByRole('button', { name: new RegExp(`^(?=.*Testificar: «Estuve con ${subject} ${hour}»)(?=.*Público)`) });
  check((await secret.count()) === 1 && (await pub.count()) === 1, `tocar la ficha de ${subject} (${hour}) abre su resumen: «Señalar… Secreto» y «Testificar… Público»`);
  await w.page.waitForTimeout(800);
  check((await testimonies()) === before, 'tocar la ficha no publica nada');
  await pub.scrollIntoViewIfNeeded();
  await shot(w, '03c-resumen-ficha');
  await auditA11y(w.page, 'resumen de la ficha (320 px)', errors, report);
  // Touch targets on this screen at 320 px: none under 24×24 px (WCAG 2.2, 2.5.8).
  const small = await w.page.evaluate(() =>
    [...document.querySelectorAll('main button, main a')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ t: (el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30), r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.width < 24 || r.height < 24))
      .map(({ t, r }) => `${t} (${Math.round(r.width)}×${Math.round(r.height)})`),
  );
  check(small.length === 0, `zonas táctiles a 320 px: ninguna menor de 24 px${small.length ? ': ' + small.join(', ') : ''}`);
  await pub.click();
  const sheet = w.page.getByRole('dialog', { name: 'Testificar' });
  await sheet.waitFor();
  check((await sheet.getByRole('button', { name: subject, exact: true }).getAttribute('aria-pressed')) === 'true', `la hoja llega con ${subject} elegida`);
  const slotBtn = sheet.locator('.choice[aria-pressed="true"]');
  const slotText = (await slotBtn.innerText()).trim();
  check((await slotBtn.count()) === 1 && slotText.startsWith(hour.replace(/^a las? /, '')), `y con la hora de la ficha (${slotText.split('\n')[0]})`);
  const preview = (await sheet.locator('p.doc-text').innerText()).trim();
  check(preview.startsWith(`«Estuve con ${subject} en `) && preview.endsWith(`${hour}.»`), `borrador: ${preview}`);
  check(await noOverflow(w), 'hoja de testimonio sin desbordamiento a 320 px');
  await shot(w, '03d-hoja-testimonio');
  await auditA11y(w.page, 'hoja de testimonio (320 px)', errors, report);
  await w.page.waitForTimeout(1200);
  check((await testimonies()) === before, 'abrir la hoja no publica nada');
  await w.page.keyboard.press('Escape');
  await sheet.waitFor({ state: 'detached' });
  await w.page.waitForTimeout(800);
  check((await testimonies()) === before, 'cerrar sin pulsar «Publicar testimonio» no publica nada');
  // The regular button still works, and starts empty.
  await w.page.getByRole('button', { name: /^Testificar, te quedan/ }).click();
  await sheet.waitFor();
  check((await sheet.locator('[aria-pressed="true"]').count()) === 0, 'el botón «Testificar» de siempre sigue ahí y abre la hoja vacía');
  await w.page.keyboard.press('Escape');
  await sheet.waitFor({ state: 'detached' });
  // Publish for real, from the pin.
  await pub.click();
  await sheet.getByRole('button', { name: 'Publicar testimonio' }).click();
  await host.page.locator('.testimony', { hasText: `Estuve con ${subject} en ` }).waitFor();
  const posted = (await host.page.locator('.testimony q').first().innerText()).trim();
  check((await testimonies()) === before + 1 && posted.includes(hour), `publicado (y visto por todos): ${posted}`);
}

// ── Countdown of step 1: the top bar keeps its height; from 15 s, big; from 5 s, a stamp.
const headerH = async (p) => (await p.page.locator('header.topbar').boundingBox()).height;
const before = await Promise.all(players.map(headerH));
await waitSecs(host, 15);
await host.page.locator('.countdown').waitFor();
// Each phone counts with its own estimate of the server's clock: allow it a moment.
const tc = Date.now();
const lag = await Promise.all(players.map((p) => p.page.locator('.countdown').waitFor({ timeout: 2000 }).then(() => Date.now() - tc, () => -1)));
check(lag.every((l) => l >= 0), `cuenta atrás grande en los ${N} móviles (desfase máximo ${Math.max(...lag)} ms)`);
const urgent = await Promise.all(players.map(headerH));
for (const [i, p] of players.entries()) {
  if (Math.abs(urgent[i] - before[i]) > 0.5) errors.push(`${p.name}: la barra superior cambia de alto con la cuenta atrás (${before[i]} → ${urgent[i]})`);
  if (!(await noOverflow(p))) errors.push(`${p.name}: desbordamiento horizontal con la cuenta atrás`);
  if ((await p.page.locator('.timer-num').count()) !== 0) errors.push(`${p.name}: el reloj pequeño sigue junto a la cuenta atrás grande`);
}
const size = await host.page.locator('.countdown-num').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
check(size >= 36, `cuenta atrás grande (${size}px, antes 20px) sin mover la barra (${before[0]} px)`);
await shot(host, '04-cuenta-atras-15');
await shot(players[N - 1], '04-cuenta-atras-15');
await auditA11y(host.page, 'cuenta atrás', errors, report);
await waitSecs(host, 5);
await host.page.locator('.countdown.final').waitFor();
await players[N - 1].page.locator('.countdown.final').waitFor();
const anim = await players[N - 1].page.locator('.countdown-num').evaluate((e) => parseFloat(getComputedStyle(e).animationDuration));
check(anim <= 0.01, `movimiento reducido: el sello de los últimos segundos no se anima (${anim}s) pero se ve`);
await shot(host, '05-cuenta-atras-final');
await shot(players[N - 1], '05-cuenta-atras-final');

// Just before evidence 2: one phone is locked (page hidden), another loses its connection.
const locked = players[2];
const cut = players[1];
const setVisible = (p, v) =>
  p.page.evaluate((vis) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (vis ? 'visible' : 'hidden') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, v);
await setVisible(locked, false);
await cut.ctx.setOffline(true);
await cut.page.evaluate(() => window.dispatchEvent(new Event('offline')));

// ── Evidence 2 arrives when the step ends: everyone again, once.
const t1 = Date.now();
const seen2 = await Promise.all(
  players.filter((p) => p !== cut).map(async (p) => {
    await p.page.locator('.evidence-notice', { hasText: 'P2' }).waitFor({ timeout: 20_000 });
    return Date.now() - t1;
  }),
);
check(Math.max(...seen2) - Math.min(...seen2) < 1500, `«Nueva prueba P2» en todos a la vez (${seen2.join(', ')} ms)`);
await players[N - 1].page.waitForTimeout(700);
await shot(players[N - 1], '06-nueva-prueba-2');
const noticeH = (await players[N - 1].page.locator('.evidence-notice').boundingBox()).height;
check(noticeH <= 110, `a 320 px el aviso ocupa ${Math.round(noticeH)} px de alto`);
// The phone that was offline gets the notice it missed, once it's back.
await cut.ctx.setOffline(false);
await cut.page.evaluate(() => window.dispatchEvent(new Event('online')));
await cut.page.locator('.evidence-notice', { hasText: 'P2' }).waitFor({ timeout: 20_000 });
check((await cut.page.locator('.evidence-notice').count()) === 1, 'sin conexión cuando salió la prueba 2: al volver la conexión ve el aviso (una vez)');
// The locked phone keeps it while locked (well past the 9 s), and loses it ~9 s after unlocking.
await locked.page.waitForTimeout(11_000);
check((await locked.page.locator('.evidence-notice', { hasText: 'P2' }).count()) === 1, 'móvil bloqueado: el aviso sigue ahí al desbloquear, aunque hayan pasado más de 9 s');
await setVisible(locked, true);
await locked.page.waitForTimeout(1500);
check((await locked.page.locator('.evidence-notice').count()) === 1, 'tras desbloquear, el aviso sigue unos segundos');
await locked.page.locator('.evidence-notice').waitFor({ state: 'detached', timeout: 12_000 });
log('…y luego se va solo');

// ── Last seconds of the investigation: who hasn't pointed gets a stronger call.
const late = players[1];
await waitSecs(late, 14);
await late.page.locator('.point-panel.urgent').waitFor();
const call = (await late.page.locator('.actionbar .hint-link').innerText()).trim();
check(/^Quedan \d+ s: señala a quien crees culpable$/.test(call), `en los últimos segundos, sin señalar: «${call}»`);
await late.page.locator('.actionbar .hint-link').click();
await late.page.waitForTimeout(800);
await shot(late, '07-senalar-ultimos-segundos');
check((await pointer.page.locator('.point-panel.urgent').count()) === 0, 'quien ya ha señalado no recibe el aviso');

// ── Defense: its own big clock, no countdown in the bar; the last seconds are a stamp.
for (const p of players) await p.page.locator('.defense-clock').waitFor({ timeout: 30_000 });
check((await host.page.locator('.countdown').count()) === 0 && (await host.page.locator('.timer-num').count()) === 1, 'defensa: reloj grande propio, sin duplicarlo en la barra');
const defender = (await host.page.locator('.defense-name').innerText()).trim();
const defP = players.find((p) => p.name === defender);
if (defP) check(/te toca defenderte/i.test(await defP.page.locator('.defense-cue').innerText()), `${defender} ve «Te han señalado: te toca defenderte»`);
check((await host.page.locator('.defense-cue').innerText()).trim().length > 0, `el resto ve «${(await players.find((p) => p !== defP).page.locator('.defense-cue').innerText()).trim()}»`);
await shot(host, '08-defensa');
if (defP) await shot(defP, '08-defensa-quien-defiende');
await host.page.locator('.defense-clock.final').waitFor({ timeout: 20_000 });
await shot(host, '09-defensa-final');
await auditA11y(host.page, 'última defensa', errors, report);

// ── Vote: the same countdown from 15 s.
await host.page.getByRole('heading', { name: '¿Quién lo hizo?' }).waitFor({ timeout: 30_000 });
await waitSecs(host, 15);
await host.page.locator('.countdown', { hasText: 'Votación' }).waitFor();
await shot(players[N - 1], '10-votacion-cuenta-atras');
check(await noOverflow(players[N - 1]), 'votación a 320 px: sin desbordamiento con la cuenta atrás');
// A tie between the first two players (each of them votes for the other; the rest split) → runoff.
const [A, B] = players;
for (const [i, p] of players.entries()) {
  const target = i === 0 ? B : i === 1 ? A : i % 2 === 0 ? A : B;
  await p.page.getByRole('radio', { name: new RegExp(`^${target.name}`) }).click();
  await p.page.getByRole('button', { name: `Acusar a ${target.name}` }).click();
}
await host.page.getByRole('heading', { name: /^Empate entre/ }).waitFor({ timeout: 20_000 });
{
  const s0 = await secsOf(host);
  const big = await host.page.locator('.countdown').count();
  check(s0 > 15 ? big === 0 : big === 1, `desempate: empieza con ${s0} s y la cuenta atrás grande ${big ? 'ya está' : 'aún no está'}`);
}
await waitSecs(host, 15);
{
  const tc = Date.now();
  const lag = await Promise.all(players.map((p) => p.page.locator('.countdown', { hasText: 'Desempate' }).waitFor({ timeout: 2000 }).then(() => Date.now() - tc, () => -1)));
  check(lag.every((l) => l >= 0), `desempate: cuenta atrás grande en los ${N} móviles (desfase máximo ${Math.max(...lag)} ms)`);
}
check(await noOverflow(players[N - 1]), 'desempate a 320 px: sin desbordamiento con la cuenta atrás');
await shot(players[N - 1], '11-desempate-cuenta-atras');
await auditA11y(players[N - 1].page, 'desempate con cuenta atrás', errors, report);
await host.page.locator('.phase-name', { hasText: /^Veredicto$/ }).waitFor({ timeout: 40_000 });
check((await host.page.locator('.countdown').count()) === 0, 'veredicto: sin cuenta atrás');

await browser.close();
const a11y = report.filter((r) => r.violations.length);
for (const r of a11y) errors.push(`accesibilidad en ${r.screen}: ${r.violations.map((v) => v.id).join(', ')}`);
if (errors.length) {
  console.error('\n✗ Problemas:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log(`\n✓ ${N} jugadores: aviso de prueba, señalar, testificar desde la ficha y cuenta atrás correctos; ${report.length} pantallas sin infracciones de accesibilidad. Capturas en ${OUT}/`);
