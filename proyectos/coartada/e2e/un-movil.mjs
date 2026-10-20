// End-to-end for a whole match on ONE phone (pass-and-play), in the app or in the offline demo file.
//   node e2e/un-movil.mjs [baseUrl] [outDir]        (DEMO=1 when baseUrl is the demo HTML file)
// 1. Normal rules, 5 people, the 5 rounds of a match plus a new match, alternating 320/360/390 px:
//    characters chosen in the setup (taken ones blocked, freed on change or removal, kept all match),
//    privacy at every hand-off and shared screen, each person's private notebook (behind «Soy X»,
//    kept between phases, never someone else's), the vote reminder, scores added up round by round.
// 2. «Prueba falsificable» (experimental), 6 people: the culprit forges, the accomplice learns it,
//    everyone marks in secret behind a hand-off; one round finds the fake, the other examines the
//    authentic one (that one ends the investigation by the clock, which also has to open the marks).
// 3. The same rules with a 25 % chance of an opportunity to forge: only the culprit learns the draw,
//    the verdict tells it.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { auditA11y } from './a11y.mjs';
const a11yReport = [];
const audited = new Set();
const auditOnce = async (label) => {
  if (audited.has(label)) return;
  audited.add(label);
  await auditA11y(page, label, errors, a11yReport);
};

const BASE = process.argv[2] ?? 'http://127.0.0.1:4100';
const OUT = process.argv[3] ?? 'qa-out';
mkdirSync(OUT, { recursive: true });
const errors = [];
const log = (s) => console.log('· ' + s);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
// The standalone file must work with no network at all: the browser is offline and any request
// that is not the file itself (or inline data) is an error.
if (process.env.DEMO) {
  await ctx.setOffline(true);
  page.on('request', (r) => {
    if (!/^(file|data|blob):/.test(r.url())) errors.push(`demo: network request ${r.url().slice(0, 80)}`);
  });
}
page.on('dialog', (d) => d.accept());
await page.clock.install();
// Count the buzzes this phone would make (navigator.vibrate exists on Android Chrome).
await page.addInitScript(() => {
  window.__vib = [];
  Navigator.prototype.vibrate = function (p) {
    window.__vib.push(p);
    return true;
  };
});
await page.goto(BASE);

// What only the phone holder may see. None of it may be on a hand-off or a shared screen.
const SECRET_RE = /Tu papel|Tu noche real|Tus recuerdos|Tu cómplice es|es quien lo hizo|Objetivo secreto|Falsificaste|No falsificaste|Tu pareja|De tus recuerdos|\b\d+ marcas?\b|Registrado: marcas|Elegido: la prueba|no puedes falsificar|no tuviste oportunidad|te da la oportunidad|Pistas y contradicciones/;
/** Notes written in someone's notebook: never on a shared screen. */
const NOTES = [];
async function noSecrets(where) {
  const text = await page.locator('body').innerText();
  const m = text.match(SECRET_RE);
  if (m) errors.push(`${where}: private text on a shared screen: «${m[0]}»`);
  const leaked = NOTES.find((n) => text.includes(n));
  if (leaked) errors.push(`${where}: a private note on a shared screen: «${leaked}»`);
  if (await page.locator('article[aria-label="Tu expediente confidencial"]').count()) errors.push(`${where}: an open private file on a shared screen`);
}
async function fits(where) {
  const r = await page.evaluate(() => ({
    over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    cut: [...document.querySelectorAll('.actionbar-inner > *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 0.5 || el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent.trim()),
    small: [...document.querySelectorAll('.actionbar-inner .btn, .point-option, .choice')].filter((el) => el.offsetParent && el.getBoundingClientRect().height < 44).map((el) => el.textContent.trim()).slice(0, 3),
    // A button or a tag sticking out of its paper card (e.g. «Ocultar» cut at 320 px).
    out: [...document.querySelectorAll('.paper .btn, .paper .tag')]
      .filter((el) => {
        const card = el.closest('.paper');
        if (!el.offsetParent || !card) return false;
        const a = el.getBoundingClientRect();
        const b = card.getBoundingClientRect();
        return a.width > 0 && (a.right > b.right + 1 || a.left < b.left - 1);
      })
      .map((el) => el.textContent.trim())
      .slice(0, 3),
  }));
  const w = page.viewportSize().width;
  if (r.over > 0) errors.push(`${where} @${w}px: page scrolls sideways by ${r.over}px`);
  if (r.cut.length) errors.push(`${where} @${w}px: action buttons cut: ${r.cut.join(', ')}`);
  if (r.small.length) errors.push(`${where} @${w}px: buttons under 44 px tall: ${r.small.join(', ')}`);
  if (r.out.length) errors.push(`${where} @${w}px: sticks out of its card: ${r.out.join(', ')}`);
}
// «Cómplice» on screen, 'complice' in the engine.
const roleOf = (text) => text.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const heading = async () => (await page.getByRole('heading', { level: 2 }).first().innerText()).trim();
const holder = async () => (await heading()).replace(/^Para /, '');

/** Portrait (image source) each person was given in the setup, to find it again in the game. */
const faces = {};
const avatarBtn = (name) => page.getByRole('button', { name: new RegExp(`^Personaje de ${name}: `) });
const charOf = async (name) => (await avatarBtn(name).getAttribute('aria-label')).replace(/^Personaje de [^:]+: /, '').replace(/\. Cambiar$/, '');

async function avatarChecks(names) {
  const sheet = page.getByRole('dialog', { name: 'Elegir personaje' });
  const chars = [];
  for (const n of names) chars.push(await charOf(n));
  if (new Set(chars).size !== names.length || chars.includes('sin elegir')) errors.push(`avatars: defaults not distinct: ${chars.join(', ')}`);
  // Person 2 changes: person 1's is blocked and says whose it is; a free one is taken.
  await avatarBtn(names[1]).click();
  if (!(await sheet.innerText()).includes(`Eligiendo personaje para\n${names[1]}`) && !(await sheet.getByRole('heading', { name: names[1] }).count())) errors.push('avatars: the sheet does not say whose character is being chosen');
  const blocked = sheet.getByRole('button', { name: `${chars[0]}: lo tiene ${names[0]}` });
  if (!(await blocked.isDisabled())) errors.push('avatars: a taken character can be picked');
  await fits('elegir personaje');
  await auditOnce('un móvil: elegir personaje');
  await page.screenshot({ path: `${OUT}/39-movil-personajes.png`, fullPage: true });
  const free = sheet.getByRole('button', { name: /: libre$/ }).first();
  const picked = (await free.getAttribute('aria-label')).replace(/: libre$/, '');
  await free.click();
  if ((await charOf(names[1])) !== picked) errors.push(`avatars: ${names[1]} did not get ${picked}`);
  // The old one is free again.
  await avatarBtn(names[2]).click();
  if (!(await sheet.getByRole('button', { name: `${chars[1]}: libre` }).isEnabled())) errors.push('avatars: a changed character was not freed');
  await sheet.getByRole('button', { name: 'Listo' }).click();
  // Up to the maximum (10): everyone still distinct; a removed person frees theirs.
  while ((await page.getByLabel(/^Nombre \d+$/).count()) < 10) await page.getByRole('button', { name: 'Añadir persona' }).click();
  if (await page.getByRole('button', { name: 'Añadir persona' }).count()) errors.push('avatars: more than 10 people allowed');
  const all = await page.locator('.setup-avatar').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label').replace(/^Personaje de [^:]+: /, '')));
  if (new Set(all).size !== 10) errors.push(`avatars: with 10 people some share a character: ${all.join(' | ')}`);
  const lastChar = all[9].replace(/\. Cambiar$/, '');
  for (let i = 10; i > names.length; i--) await page.getByRole('button', { name: `Quitar persona ${i}` }).click();
  await avatarBtn(names[0]).click();
  if (!(await sheet.getByRole('button', { name: `${lastChar}: libre` }).isEnabled())) errors.push('avatars: a removed person did not free their character');
  await sheet.getByRole('button', { name: 'Listo' }).click();
  // Renaming keeps the character.
  const before = await charOf(names[3]);
  await page.getByLabel('Nombre 4').fill(`${names[3]}x`);
  if ((await charOf(`${names[3]}x`)) !== before) errors.push('avatars: renaming changed the character');
  await page.getByLabel('Nombre 4').fill(names[3]);
  log(`avatars: distinct by default, taken ones blocked, ${picked} chosen, freed on change and on removal, 10 people distinct`);
}

async function setup(names, { variant = false, chance = null, avatars = false } = {}) {
  if (process.env.DEMO) await page.getByRole('button', { name: 'Jugar en este móvil' }).click();
  else await page.getByRole('button', { name: 'Jugar con un solo móvil' }).click();
  while ((await page.getByLabel(/^Nombre \d+$/).count()) < names.length) await page.getByRole('button', { name: 'Añadir persona' }).click();
  for (const [i, n] of names.entries()) await page.getByLabel(`Nombre ${i + 1}`).fill(n);
  if (avatars) await avatarChecks(names);
  for (const n of names) faces[n] = await avatarBtn(n).locator('img').getAttribute('src');
  const sw = page.getByRole('switch', { name: /Prueba falsificable/ });
  if ((await sw.getAttribute('aria-checked')) !== 'false') errors.push('setup: «Prueba falsificable» is not off by default');
  if (variant) {
    await sw.click();
    const seg = page.getByRole('group', { name: 'Oportunidad de falsificar' });
    if ((await seg.getByRole('button', { name: '100 %' }).getAttribute('aria-pressed')) !== 'true') errors.push('setup: the chance is not 100 % by default');
    if (chance) await seg.getByRole('button', { name: `${chance} %` }).click();
  }
  await fits('setup');
  await auditOnce('un móvil: preparación');
  await page.getByRole('button', { name: 'Empezar partida' }).click();
}

/** Every person declares behind a hand-off. Returns { roles, forged } (forged: hour the culprit forged). */
async function declareAll(names, { forge = false, shot = null, mayDeny = false } = {}) {
  const roles = {};
  let forged = null;
  let denied = false;
  for (let k = 0; k < names.length; k++) {
    await page.getByText('Pasa el móvil').first().waitFor();
    await noSecrets(`declaración ${k + 1}: pasa el móvil`);
    await fits('pasa el móvil');
    const name = await holder();
    if (faces[name] && (await page.locator('main .pin img').first().getAttribute('src')) !== faces[name]) errors.push(`avatars: ${name} is not drawn with the character chosen in the setup`);
    await page.getByRole('button', { name: `Soy ${name}` }).click();
    // One shared phone: «Soy X» already revealed it, so the file opens straight away.
    if (await page.getByRole('button', { name: 'Abrir tu expediente confidencial' }).count()) errors.push('declaración: the file asks to be opened again after «Soy X»');
    const role = roleOf(await page.locator('.stamp').first().innerText());
    roles[name] = role;
    const chooser = page.getByRole('radiogroup', { name: 'Qué prueba falsificas' });
    if (forge && role === 'culpable' && mayDeny && (await page.getByText('esta ronda no puedes falsificar', { exact: false }).count())) denied = true;
    if ((await chooser.count()) !== (forge && role === 'culpable' && !denied ? 1 : 0)) errors.push(`declaración: forgery chooser shown=${await chooser.count()} to ${role}`);
    if (role !== 'culpable' && (await page.getByText(/no puedes falsificar|te da la oportunidad/).count())) errors.push(`declaración: ${role} sees the culprit's draw`);
    const blocks = page.locator('.hour-block');
    for (let h = 0; h < 3; h++) {
      const block = blocks.nth(h);
      const crime = (await block.locator('.tag.red').count()) > 0;
      if (role === 'culpable' && crime) await block.locator('.choice:not(.scene)').first().click();
      else await block.locator('.choice', { hasText: 'Aquí estabas' }).click();
    }
    if (forge && role === 'culpable' && !denied) {
      const hourBtn = chooser.getByRole('radio').nth(1);
      forged = (await hourBtn.innerText()).replace('La de ', '').trim();
      await hourBtn.click();
      await page.getByRole('radiogroup', { name: /^Qué lugar dirá la prueba/ }).getByRole('radio').first().click();
      await page.getByText('Elegido: la prueba', { exact: false }).waitFor();
    }
    await fits(`expediente (${role})`);
    // With one shared phone, declaring has no clock: no «if time runs out» text.
    if (await page.getByText('Si se acaba el tiempo', { exact: false }).count()) errors.push('declaración: talks about a time limit that does not exist with one phone');
    if (shot && k === 0) await page.screenshot({ path: `${OUT}/${shot}`, fullPage: true });
    await page.getByRole('button', { name: 'Sellar declaración' }).click();
    const last = k === names.length - 1;
    await page.getByRole('button', { name: last ? 'Revelar coartadas' : 'Ocultar y pasar' }).waitFor();
    await noSecrets(`declaración ${k + 1}: hecho`);
    await page.getByRole('button', { name: last ? 'Revelar coartadas' : 'Ocultar y pasar' }).click();
  }
  await page.getByText('Prueba 1 de 2', { exact: false }).first().waitFor();
  return { roles, forged, denied };
}

/** One person opens their notebook and file in private during the investigation (optionally
 *  writing a note); returns the file text and the notebook text they saw. */
async function reread(name, { write = null } = {}) {
  await page.getByRole('button', { name: 'Cuaderno y expediente (en privado)' }).click();
  const sheet = page.getByRole('dialog', { name: 'Cuaderno privado' });
  await sheet.getByRole('button', { name, exact: true }).click();
  if (await sheet.locator('article[aria-label="Tu expediente confidencial"], .notes').count()) errors.push('re-read: the notebook or the file shows before «Soy X»');
  if (!(await sheet.innerText()).includes('Que nadie más mire')) errors.push('re-read: no warning that nobody else should look');
  await noSecrets('re-read: pasa el móvil');
  await sheet.getByRole('button', { name: `Soy ${name}` }).click();
  if ((await sheet.getByRole('tab', { name: 'Mi cuaderno' }).getAttribute('aria-selected')) !== 'true') errors.push('re-read: does not open on the notebook');
  const notebook = await sheet.locator('.notes').innerText();
  for (const n of NOTES) if (notebook.includes(n) && !n.startsWith(name + ':')) errors.push(`notebook: ${name} sees someone else's note «${n}»`);
  if (write) {
    const text = `${name}: ${write}`;
    await sheet.getByLabel('Nueva observación').fill(text);
    await sheet.getByRole('button', { name: 'Apuntar', exact: true }).click();
    await sheet.locator('.notes-clues', { hasText: text }).waitFor();
    // Correct it, then keep it.
    await sheet.getByRole('button', { name: `Corregir: ${text}` }).click();
    await sheet.getByLabel('Corregir la nota').fill(`${text}!`);
    await sheet.getByRole('button', { name: 'Guardar' }).click();
    await sheet.locator('.notes-clues', { hasText: `${text}!` }).waitFor();
    NOTES.push(`${text}!`);
    await fits('cuaderno');
    await auditOnce('un móvil: cuaderno privado');
  }
  await sheet.getByRole('tab', { name: 'Expediente' }).click();
  const file = sheet.locator('article[aria-label="Tu expediente confidencial"]');
  await file.waitFor();
  const text = await file.innerText();
  await fits('re-read');
  await auditOnce('un móvil: expediente privado');
  await sheet.getByRole('button', { name: 'Ocultar y devolver el móvil' }).click();
  await noSecrets('after the re-read');
  return { file: text, notebook };
}

async function testifyOnce() {
  await page.getByRole('button', { name: 'Testificar', exact: true }).click();
  await page.getByRole('dialog', { name: '¿Quién testifica?' }).locator('.chip-player').first().click();
  const sheet = page.getByRole('dialog', { name: 'Testificar' });
  await noSecrets('testimony sheet (shared)');
  const before = await page.locator('.testimony').count();
  await sheet.locator('.chip-player').first().click();
  await sheet.locator('.choice').first().click();
  await sheet.getByRole('button', { name: 'Publicar testimonio' }).click();
  await page.locator('.testimony').nth(before).waitFor();
}

async function voteAll(names, roles, culprit, { firstShot = null, onFirst = null } = {}) {
  for (let k = 0; k < names.length; k++) {
    await page.getByText('Pasa el móvil').first().waitFor();
    await noSecrets(`votación ${k + 1}: pasa el móvil`);
    const who = await holder();
    await page.getByRole('button', { name: `Soy ${who}` }).click();
    // Innocents vote the culprit; the culprit and the accomplice vote someone innocent.
    const target = roles[who] === 'inocente' ? culprit : names.find((n) => n !== who && roles[n] === 'inocente');
    if (!(await page.locator('.vote-reminder').innerText()).includes('vota a quien crees culpable')) errors.push('vote: no reminder of what to do');
    if ((await page.locator('main').innerText()).includes('a tiempo no cuenta')) errors.push('vote: talks about a time limit that does not exist with one phone');
    if (!(await page.locator('.actionbar .hint').innerText()).includes('Toca a una persona')) errors.push('vote: the bar does not say what is missing');
    // The notebook is there in the vote too: this person's notes, nobody else's.
    const mine = NOTES.filter((n) => n.startsWith(`${who}:`));
    if (mine.length) {
      await page.getByRole('button', { name: 'Mi cuaderno' }).click();
      const nb = await page.getByRole('dialog', { name: 'Mi cuaderno' }).innerText();
      for (const n of mine) if (!nb.includes(n)) errors.push(`notebook: ${who}'s note was lost between investigation and vote`);
      for (const n of NOTES) if (!n.startsWith(`${who}:`) && nb.includes(n)) errors.push(`notebook: ${who} sees someone else's note in the vote`);
      await page.keyboard.press('Escape');
    }
    await page.getByRole('radio', { name: new RegExp(`^${target}`) }).click();
    if (!(await page.locator('.actionbar .hint').innerText()).includes('Falta confirmar')) errors.push('vote: no reminder to confirm the choice');
    await fits('votación');
    if (onFirst && k === 0) await onFirst();
    if (firstShot && k === 0) await page.screenshot({ path: `${OUT}/${firstShot}`, fullPage: true });
    await page.getByRole('button', { name: `Acusar a ${target}` }).click();
    const last = k === names.length - 1;
    await page.getByRole('button', { name: last ? 'Ver el veredicto' : 'Ocultar y pasar' }).waitFor();
    await noSecrets(`votación ${k + 1}: hecho`);
    await page.getByRole('button', { name: last ? 'Ver el veredicto' : 'Ocultar y pasar' }).click();
  }
  await page.getByText('Veredicto').first().waitFor();
  await page.getByRole('button', { name: 'Ver todo' }).click();
}

/** Round points from the result, checked against the rules for how everyone voted. */
async function roundPoints(roles, culprit) {
  const rows = page.locator('section[aria-label="Puntos de la ronda"] li.player-row');
  const pts = {};
  for (let i = 0; i < (await rows.count()); i++) {
    const row = rows.nth(i);
    const name = (await row.locator('span[style*="font-weight"]').first().innerText()).replace('(tú)', '').trim();
    const lines = await row.locator('.score-line').allInnerTexts();
    const sum = lines.reduce((s, l) => s + Number(l.match(/\+(\d+)/)[1]), 0);
    const total = Number((await row.locator(':scope > .delta').innerText()).replace('+', ''));
    if (sum !== total) errors.push(`score: ${name} lines add up to ${sum} but shows ${total}`);
    const shownRole = roleOf(await row.locator('.tag').first().innerText());
    if (shownRole !== roles[name]) errors.push(`role: ${name} read «${roles[name]}» in private and the verdict says «${shownRole}»`);
    const has = (t) => lines.some((l) => l.includes(t));
    if (roles[name] === 'inocente') {
      if (!has('El grupo acusó a la persona culpable') || !has('Votó a la persona culpable')) errors.push(`score: innocent ${name} is missing +2/+1: ${lines.join(' | ')}`);
    } else if (has('El grupo acusó') || has('Se libró') || has('se libró')) errors.push(`score: ${roles[name]} ${name} got side points: ${lines.join(' | ')}`);
    pts[name] = total;
  }
  const stamp = (await page.locator('.stamp.big').first().innerText()).trim().toLowerCase();
  if (stamp !== 'culpable') errors.push(`verdict: expected the accused to be «culpable», got ${stamp}`);
  if (!Object.entries(roles).some(([n, r]) => r === 'culpable' && n === culprit)) errors.push('verdict: culprit mismatch');
  return pts;
}

// ─────────────── 1. normal rules: a whole match ───────────────
if (process.env.DEMO) {
  await page.screenshot({ path: `${OUT}/40-demo-home.png`, fullPage: true });
  await fits('demo: inicio');
}
const five = ['Lola', 'Mario', 'Nerea', 'Óscar', 'Pau'];
const widths = [320, 360, 390, 320, 360];
await page.setViewportSize({ width: widths[0], height: 640 });
await setup(five, { avatars: true });
const totals = Object.fromEntries(five.map((n) => [n, 0]));
for (let round = 1; round <= 5; round++) {
  const w = widths[round - 1];
  await page.setViewportSize({ width: w, height: w === 390 ? 844 : 640 });
  const { roles } = await declareAll(five, { shot: round === 1 ? '41-movil-expediente.png' : null });
  const culprit = Object.keys(roles).find((n) => roles[n] === 'culpable');
  if (Object.values(roles).filter((r) => r === 'culpable').length !== 1 || Object.values(roles).includes('complice')) errors.push(`round ${round}: roles for 5 people: ${JSON.stringify(roles)}`);
  await noSecrets(`round ${round}: investigación`);
  await fits('investigación');
  if (round === 1) {
    // The private re-read shows that person's own role and nothing on the board afterwards.
    const innocent = five.find((n) => roles[n] === 'inocente');
    const seenI = await reread(innocent, { write: 'Mario duda a las 08:00' });
    if (!/inocente/i.test(seenI.file)) errors.push('re-read: an innocent did not see «Inocente»');
    const seenC = await reread(culprit, { write: 'nadie sospecha' });
    if (!/culpable/i.test(seenC.file)) errors.push('re-read: the culprit did not see «Culpable»');
    // Back to the first person: their note is still there.
    const again = await reread(innocent);
    if (!again.notebook.includes(NOTES[0])) errors.push('notebook: a note was lost after handing the phone on');
    await testifyOnce();
    await page.screenshot({ path: `${OUT}/42-movil-investigacion.png`, fullPage: true });
  }
  if (round === 2) {
    // A new case: last round's notes are not carried over to it.
    const nb = (await reread(five[0])).notebook;
    if (NOTES.some((n) => nb.includes(n))) errors.push('notebook: notes of the previous case show in a new round');
    NOTES.length = 0;
  }
  await page.getByRole('button', { name: 'Sacar la prueba 2' }).click();
  await page.getByText('Prueba 2 de 2', { exact: false }).first().waitFor();
  await page.getByRole('button', { name: 'Terminar investigación' }).click();
  const pick = page.getByRole('dialog', { name: 'Señalar para la última defensa' });
  await fits('señalar');
  await pick.getByRole('button', { name: culprit, exact: true }).click();
  await page.getByText('Última defensa').first().waitFor();
  if ((await page.locator('.defense-name').innerText()).trim() !== culprit) errors.push(`round ${round}: wrong defender`);
  await noSecrets(`round ${round}: defensa`);
  await fits('defensa');
  if (round === 3) {
    // Vibration off in the menu: the end of this defense makes no buzz.
    await page.getByRole('button', { name: 'Menú' }).first().click();
    await page.getByRole('switch', { name: /Vibración/ }).click();
    await page.getByRole('button', { name: 'Seguir jugando' }).click();
  }
  const buzzesBefore = await page.evaluate(() => window.__vib.length);
  await page.getByRole('button', { name: 'Pasar a la votación' }).click();
  await page.getByText('Pasa el móvil').first().waitFor();
  const buzzes = (await page.evaluate(() => window.__vib.length)) - buzzesBefore;
  if (buzzes !== (round >= 3 ? 0 : 1)) errors.push(`vibration: round ${round}, ${buzzes} buzzes at the end of the defense (expected ${round >= 3 ? 0 : 1})`);
  await voteAll(five, roles, culprit, { firstShot: round === 1 ? '43-movil-voto.png' : null });
  await fits('veredicto');
  const pts = await roundPoints(roles, culprit);
  for (const n of five) totals[n] += pts[n] ?? 0;
  if (round === 1) await page.screenshot({ path: `${OUT}/44-movil-veredicto.png`, fullPage: true });
  log(`normal round ${round} @${w}px: culprit ${culprit}, points ${JSON.stringify(pts)}`);
  await page.getByRole('button', { name: round === 5 ? 'Ver clasificación final' : 'Siguiente ronda' }).click();
}
await page.getByText('Clasificación final').first().waitFor();
await fits('clasificación final');
await page.screenshot({ path: `${OUT}/45-movil-final.png`, fullPage: true });
for (const n of five) {
  const row = page.locator('section[data-tab="Clasificación"] li', { hasText: n }).first();
  const shown = Number((await row.locator('.delta', { hasText: 'pts' }).innerText()).replace(' pts', ''));
  if (shown !== totals[n]) errors.push(`final: ${n} has ${shown} pts, the 5 rounds add up to ${totals[n]}`);
}
log(`final standings match the 5 rounds: ${JSON.stringify(totals)}`);
// A new match on the same phone, without reloading: scores back to 0 and a new deal.
await page.getByRole('button', { name: 'Nueva partida' }).click();
await page.getByText('Pasa el móvil').first().waitFor();
log('new match dealt without reloading');

// Nothing private kept in the browser.
{
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  const m = stored.match(/culpable|complice|inocente|truth|forgery|coartada:notes:MOVIL|nadie sospecha|Mario duda/i);
  if (m) errors.push(`storage keeps «${m[0]}»: ${stored.slice(0, 200)}`);
}

// Leave from the menu, back to the home screen.
await page.getByRole('button', { name: 'Menú' }).first().click();
await page.getByRole('button', { name: 'Terminar la partida' }).click();
await page.setViewportSize({ width: 360, height: 740 });

// ─────────────── 2. «Prueba falsificable», 6 people ───────────────
const six = ['Ana', 'Bea', 'Ciro', 'Dani', 'Eva', 'Fede'];
await setup(six, { variant: true });
for (const outcome of ['falsa', 'autentica']) {
  const { roles, forged } = await declareAll(six, { forge: true, shot: outcome === 'falsa' ? '46-movil-falsificar.png' : null });
  const culprit = Object.keys(roles).find((n) => roles[n] === 'culpable');
  const accomplice = Object.keys(roles).find((n) => roles[n] === 'complice');
  if (!accomplice || !forged) errors.push(`variant: accomplice=${accomplice} forged=${forged}`);
  await noSecrets(`variant ${outcome}: investigación`);
  if (!(await page.locator('section[aria-label="Revisión de pruebas con un solo móvil"]').count()))
    errors.push('variant: no explanation of the end-of-investigation marks');
  if (await page.locator('#examine-panel').count()) errors.push('variant: the multiplayer marking panel (with live counts) is on the shared screen');
  // The accomplice learns the forgery in private; an innocent doesn't.
  const seenA = (await reread(accomplice)).file;
  if (!seenA.includes(`Tu pareja falsificó la prueba a las ${forged}`)) errors.push(`variant: accomplice file does not tell the forgery (${forged}): ${seenA.slice(-160)}`);
  const seenI = (await reread(six.find((n) => roles[n] === 'inocente'))).file;
  if (/falsific/i.test(seenI)) errors.push('variant: an innocent file mentions the forgery');
  await page.getByRole('button', { name: 'Sacar la prueba 2' }).click();
  await page.getByText('Prueba 2 de 2', { exact: false }).first().waitFor();

  if (outcome === 'falsa') {
    await page.getByRole('button', { name: 'Terminar investigación' }).click();
    await page.getByRole('dialog', { name: 'Señalar para la última defensa' }).getByRole('button', { name: culprit, exact: true }).click();
  } else {
    // Nobody ends it: the clock does, and that must open the secret marks too (not skip them).
    await page.clock.fastForward('10:00');
  }
  // The marks: one person at a time, nobody sees the count or the others' marks.
  let forgedIndex = null;
  for (let k = 0; k < six.length; k++) {
    await page.getByText('Pasa el móvil').first().waitFor();
    await noSecrets(`peritaje ${k + 1}: pasa el móvil`);
    const who = await holder();
    await page.getByRole('button', { name: `Soy ${who}` }).click();
    await page.getByRole('heading', { name: '¿Qué prueba queréis revisar?' }).waitFor();
    if (forgedIndex === null) {
      forgedIndex = (await page.locator('article[aria-label="Prueba 1"]').innerText()).includes(`a las ${forged}`) ? 0 : 1;
    }
    const body = await page.locator('body').innerText();
    if (/\b\d+ marcas?\b/.test(body)) errors.push('peritaje: a count of marks is visible');
    const note = /Falsificaste|Tu pareja falsificó/.test(body);
    if (note !== (roles[who] !== 'inocente')) errors.push(`peritaje: forgery note shown=${note} to ${roles[who]}`);
    if (k > 0 && (await page.locator('.point-option[aria-checked="true"]').count())) errors.push('peritaje: the previous mark is preselected');
    const target = outcome === 'falsa' ? forgedIndex : 1 - forgedIndex;
    await page.getByRole('radio', { name: `Prueba ${target + 1}` }).click();
    await fits('peritaje');
    await auditOnce('un móvil: marca de peritaje');
    if (k === 0) await page.screenshot({ path: `${OUT}/${outcome === 'falsa' ? '47' : '48'}-movil-peritaje.png`, fullPage: true });
    await page.getByRole('button', { name: 'Confirmar y ocultar' }).click();
  }
  await page.getByRole('heading', { name: 'Todas las marcas, selladas' }).waitFor();
  await noSecrets('peritaje: sellado');
  await auditOnce('un móvil: marcas selladas');
  await page.getByRole('button', { name: 'Ver la revisión' }).click();
  const exam = page.locator('section[aria-label="Revisión de la prueba"]').first();
  if (outcome === 'falsa') {
    await page.getByText('Última defensa').first().waitFor();
    if (!(await exam.innerText()).includes('era falsa')) errors.push(`variant: expected «era falsa», got ${await exam.innerText()}`);
    await page.screenshot({ path: `${OUT}/49-movil-peritaje-falsa.png`, fullPage: true });
    await page.getByRole('button', { name: 'Pasar a la votación' }).click();
    await voteAll(six, roles, culprit);
  } else {
    // No one was picked for the last defense (the clock ran out): straight to the vote, whose
    // screens show the examination to each voter.
    await voteAll(six, roles, culprit, {
      onFirst: async () => {
        const t = await page.locator('section[aria-label="Revisión de la prueba"]').first().innerText();
        if (!t.includes('era auténtica')) errors.push(`variant: expected «era auténtica», got ${t}`);
        await page.screenshot({ path: `${OUT}/50-movil-peritaje-autentica.png`, fullPage: true });
      },
    });
  }
  const reveal = await page.locator('section[aria-label="Qué se falsificó"]').innerText();
  const expect = outcome === 'falsa' ? 'La revisión la descubrió.' : 'Se revisó la otra prueba, que era auténtica.';
  if (!reveal.includes(`falsificó la prueba a las ${forged}`) || !reveal.includes(expect)) errors.push(`variant verdict: ${reveal}`);
  log(`variant (${outcome}): culprit ${culprit} forged ${forged}, accomplice ${accomplice}; examination and verdict as the engine says`);
  if (outcome === 'falsa') await page.getByRole('button', { name: 'Siguiente ronda' }).click();
}

// ─────────────── 3. 25 % chance of an opportunity ───────────────
await page.getByRole('button', { name: 'Menú' }).first().click();
await page.getByRole('button', { name: 'Terminar la partida' }).click();
await setup(six, { variant: true, chance: 25 });
{
  const { roles, forged, denied } = await declareAll(six, { forge: true, mayDeny: true });
  const culprit = Object.keys(roles).find((n) => roles[n] === 'culpable');
  await noSecrets('25 %: investigación');
  if (!(await page.getByText('(oportunidad 25 %)', { exact: false }).count())) errors.push('25 %: the round does not say its chance');
  await page.getByRole('button', { name: 'Sacar la prueba 2' }).click();
  await page.getByText('Prueba 2 de 2', { exact: false }).first().waitFor();
  await page.getByRole('button', { name: 'Terminar investigación' }).click();
  await page.getByRole('dialog', { name: 'Señalar para la última defensa' }).getByRole('button', { name: culprit, exact: true }).click();
  for (let k = 0; k < six.length; k++) {
    await page.getByText('Pasa el móvil').first().waitFor();
    await noSecrets(`25 %: marca ${k + 1}`);
    await page.getByRole('button', { name: `Soy ${await holder()}` }).click();
    await page.getByRole('radio', { name: 'Ninguna' }).click();
    await page.getByRole('button', { name: 'Confirmar y ocultar' }).click();
  }
  await page.getByRole('button', { name: 'Ver la revisión' }).click();
  const none = await page.locator('section[aria-label="Revisión de la prueba"]').first().innerText();
  if (!none.includes('No se ha seleccionado ninguna prueba para revisar')) errors.push(`25 %: no-examination text: ${none}`);
  await page.getByRole('button', { name: 'Pasar a la votación' }).click();
  await voteAll(six, roles, culprit);
  const reveal = await page.locator('section[aria-label="Qué se falsificó"]').innerText();
  const ok = denied ? reveal.includes('no tuvo oportunidad de falsificar (sorteo con 25 %)') : reveal.includes(`falsificó la prueba a las ${forged}`);
  if (!ok) errors.push(`25 %: verdict does not match the draw (denied=${denied}): ${reveal}`);
  log(`25 %: the draw ${denied ? 'did not give' : 'gave'} the culprit the opportunity; only they knew, the verdict says so`);
}

await browser.close();
if (errors.length) {
  console.error('✗ One-phone E2E problems:\n  ' + [...new Set(errors)].join('\n  '));
  process.exit(1);
}
console.log('✓ One-phone E2E: characters, private notebook, vote reminders, a 5-round match + new match (320/360/390 px), two «Prueba falsificable» rounds (fake found / authentic examined) and a 25 % round.');
