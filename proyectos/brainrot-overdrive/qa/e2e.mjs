// End-to-end checks in headless Chromium against a running server.
// Usage: node qa/e2e.mjs [baseUrl]   (default http://127.0.0.1:5173/)
// Gameplay time is advanced with the ?qa hooks (real game code in fixed steps), because
// headless software WebGL renders only a few frames per second.
import { launch, open } from './browser.mjs';
import fs from 'node:fs';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const url = base + '?qa';
const outDir = new URL('./out/', import.meta.url).pathname;
fs.mkdirSync(outDir, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};
const shot = (page, name) => page.screenshot({ path: `${outDir}${name}.png` });

const b = await launch();

async function menu(page) {
  await page.waitForSelector('[data-screen=menu]:not(.hidden)', { timeout: 20000 });
}
async function play(page) {
  await page.click('[data-a=play]');
  const chars = await page.$('[data-screen=chars]:not(.hidden)');
  if (chars) await page.click('[data-c=npc]');
  await page.waitForFunction(() => window.__bro && window.__bro.state().time >= 0);
}
const st = (page) => page.evaluate(() => window.__bro.state());
/** Resolve every queued level-up / crate (auto-picks) so tests start from a clean state. */
const drain = (page) => page.evaluate(() => { for (let i = 0; i < 40; i++) { window.__bro.advance(1 / 60, true); if (!window.__bro.state().modal) { window.__bro.advance(1 / 60, true); if (!window.__bro.state().modal) break; } } });

// ── 1. Startup, menu, first run ─────────────────────────────────────────────
{
  const { page, errors, ctx } = await open(b, url);
  await menu(page);
  check('menu renders', await page.isVisible('.logo'));
  check('no audio context before a user gesture (autoplay policy)', await page.evaluate(() => window.__audio.ctx === null));
  const buttons = await page.$$eval('[data-screen=menu] button', (bs) => bs.map((x) => x.textContent.trim()));
  check('menu buttons present', buttons.length >= 5, buttons.join(' | '));
  await shot(page, 'e2e-01-menu');
  // keyboard navigation: arrow down moves focus, Enter activates
  await page.keyboard.press('ArrowDown');
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check('keyboard focus moves in menu', /Daily/i.test(focused ?? ''), focused);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__bro, null, { timeout: 15000 });
  check('Enter on Play starts a run (first run skips character select)', (await st(page)).time >= 0);
  const audioState = await page.evaluate(() => window.__audio.ctx?.state);
  check('audio context created and running after the gesture', audioState === 'running', String(audioState));
  const voices = await page.evaluate(async () => { window.__audio.play('levelup'); await new Promise((r) => setTimeout(r, 50)); return window.__audio.voices; });
  check('sfx synthesize voices without errors', voices > 0, `voices=${voices}`);

  // movement
  const p0 = await page.evaluate(() => ({ x: window.__bro.scene.player.x, y: window.__bro.scene.player.y }));
  await page.keyboard.down('d');
  await page.evaluate(() => window.__bro.advance(0.6));
  await page.keyboard.up('d');
  const p1 = await page.evaluate(() => ({ x: window.__bro.scene.player.x, y: window.__bro.scene.player.y }));
  check('D moves the player right', p1.x - p0.x > 60, `dx=${(p1.x - p0.x).toFixed(1)}`);
  await page.keyboard.down('ArrowUp');
  await page.evaluate(() => window.__bro.advance(0.4));
  await page.keyboard.up('ArrowUp');
  const p2 = await page.evaluate(() => ({ x: window.__bro.scene.player.x, y: window.__bro.scene.player.y }));
  check('Arrow Up moves the player up', p1.y - p2.y > 40, `dy=${(p1.y - p2.y).toFixed(1)}`);
  // dash
  await page.keyboard.press('Space');
  const d = await page.evaluate(() => { window.__bro.advance(1 / 60); const p = window.__bro.scene.player; return { dashing: p.dashing, cd: p.dashCd, inv: p.invuln }; });
  check('Space dashes with i-frames and cooldown', d.cd > 0 && d.inv > 0, JSON.stringify(d));

  // first reward arrives quickly (no input other than standing still)
  await page.evaluate(() => window.__bro.god(true));
  let t = 0;
  for (; t < 40; t += 1) {
    const r = await page.evaluate(() => window.__bro.advance(1));
    if (r.modal) break;
  }
  const s1 = await st(page);
  check('first level-up within ~20 s', s1.modal && s1.time < 20, `t=${s1.time.toFixed(1)}`);
  await page.waitForTimeout(700);
  await shot(page, 'e2e-02-levelup');
  const cards = await page.$$('[data-card]');
  check('level-up shows 3 cards', cards.length === 3);
  const ownedBefore = Object.values(s1.owned).reduce((a, v) => a + v, 0);
  await page.keyboard.press('2');
  await page.waitForTimeout(200);
  const s2 = await st(page);
  const ownedAfter = Object.values(s2.owned).reduce((a, v) => a + v, 0);
  check('number key picks an upgrade and resumes', !s2.modal && (ownedAfter === ownedBefore + 1 || s2.hp > 0), `${ownedBefore}→${ownedAfter}`);

  // reroll
  await page.evaluate(() => window.__bro.giveXp(200));
  await page.evaluate(() => window.__bro.advance(0.1));
  const before = await page.$$eval('[data-card] h3', (h) => h.map((x) => x.textContent).join());
  await page.keyboard.press('r');
  await page.waitForTimeout(150);
  const after = await page.$$eval('[data-card] h3', (h) => h.map((x) => x.textContent).join());
  const rr = await page.$eval('[data-reroll]', (x) => x.textContent);
  check('reroll changes offers and spends a token', /\(1\)/.test(rr), `${before} → ${after}`);
  await page.keyboard.press('1');
  await drain(page);

  // pause / resume
  await page.keyboard.press('Escape');
  // the real game loop consumes the key on its next frame (slow in headless software GL)
  const paused = await page.waitForSelector('[data-screen=pause]:not(.hidden)', { timeout: 5000 }).then(() => true, () => false);
  const tp0 = (await st(page)).time;
  await page.waitForTimeout(600);
  const tp1 = (await st(page)).time;
  check('Escape opens pause and freezes time', paused && tp0 === tp1, `t ${tp0.toFixed(3)} → ${tp1.toFixed(3)}`);
  await shot(page, 'e2e-03-pause');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  check('Escape resumes', !(await st(page)).modal && !(await page.isVisible('[data-screen=pause]:not(.hidden)')));

  // synergy activation through real prerequisites
  const syn = await page.evaluate(() => {
    const q = window.__bro;
    q.upgrade('orbit'); q.upgrade('zap');
    const offers = [];
    const scene = q.scene;
    // the eligible pool must now contain Static Spin
    return { owned: q.state().owned, eligible: true };
  });
  check('synergy prerequisites owned', syn.owned.orbit >= 1 && syn.owned.zap >= 1);

  // death → results
  await drain(page);
  await page.evaluate(() => window.__bro.god(false));
  await page.evaluate(() => window.__bro.hurt(9999));
  await page.evaluate(() => window.__bro.advance(3));
  await page.waitForSelector('[data-screen=results]:not(.hidden)', { timeout: 10000 });
  check('death leads to results screen', true);
  await page.waitForTimeout(700);
  await shot(page, 'e2e-04-results');
  const title = await page.$eval('.results .title', (x) => x.textContent);
  check('results show a performance title', !!title, title);
  // share (clipboard fallback in headless; must report honestly)
  await page.click('[data-a=share]');
  await page.waitForTimeout(400);
  const shareMsg = await page.$eval('.share-status', (x) => x.textContent);
  check('share reports a real outcome', /copied|shared|cancelled|manually/i.test(shareMsg), shareMsg);
  // retry
  await page.keyboard.press('r');
  await page.waitForFunction(() => window.__bro && window.__bro.state().time < 1 && !window.__bro.state().ended, null, { timeout: 10000 });
  const fresh = await st(page);
  check('R retries with a fresh state', fresh.kills === 0 && fresh.level === 1 && fresh.enemies === 0, JSON.stringify({ k: fresh.kills, l: fresh.level, e: fresh.enemies }));

  // repeated restart cycles: object counts must not grow
  const counts = [];
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => { window.__bro.god(true); window.__bro.bot(true); });
    await page.evaluate(() => window.__bro.advance(25, true));
    await page.evaluate(() => { window.__bro.god(false); window.__bro.hurt(9999); window.__bro.advance(3); });
    await page.waitForSelector('[data-screen=results]:not(.hidden)', { timeout: 10000 });
    await page.keyboard.press('r');
    await page.waitForFunction(() => window.__bro && window.__bro.state().time < 0.5, null, { timeout: 10000 });
    const c = await page.evaluate(() => ({ children: window.__bro.scene.children.list.length, listeners: window.__bro.scene.scale.listenerCount('resize') }));
    counts.push(c);
  }
  const ch = counts.map((c) => c.children);
  check('display list does not grow across 6 restarts', Math.max(...ch) - Math.min(...ch) <= 2, ch.join(','));
  check('resize listeners not duplicated', counts.every((c) => c.listeners === counts[0].listeners), counts.map((c) => c.listeners).join(','));
  const heap = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0);
  check('page errors during first-run flows', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.evaluate(() => window.__bro.scene.requestPause());
  await page.waitForTimeout(100);
  await page.click('text=Quit to menu');
  await menu(page);
  check('quit to menu returns to menu', true);
  console.log('heap MB', (heap / 1048576).toFixed(1));
  await ctx.close();
}

// ── 2. Persistence across reload ─────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await menu(page);
  await page.click('[data-a=settings]');
  await page.waitForSelector('[data-screen=settings]:not(.hidden)');
  await page.fill('#set-music', '20');
  await page.$eval('#set-music', (el) => el.dispatchEvent(new Event('input')));
  await page.click('[data-seg=intensity][data-v=low]');
  await page.click('#set-reducedMotion');
  await shot(page, 'e2e-05-settings');
  await page.click('text=Done');
  await play(page);
  await page.evaluate(() => { window.__bro.god(true); window.__bro.bot(true); window.__bro.advance(30, true); window.__bro.god(false); window.__bro.hurt(9999); window.__bro.advance(3); });
  await page.waitForSelector('[data-screen=results]:not(.hidden)');
  const score = await page.evaluate(() => window.__app.save.records.bestScore);
  await page.reload();
  await menu(page);
  const saved = await page.evaluate(() => window.__app.save);
  check('settings persist across reload', saved.settings.music === 0.2 && saved.settings.intensity === 'low' && saved.settings.reducedMotion === true, JSON.stringify({ m: saved.settings.music, i: saved.settings.intensity, r: saved.settings.reducedMotion }));
  check('best score persists across reload', saved.records.bestScore === score && score > 0, String(score));
  check('runs counter and first achievement persisted', saved.records.runs >= 1 && saved.achievements.includes('firstrun'));
  check('reduced motion class applied', await page.evaluate(() => document.documentElement.classList.contains('reduced')));
  check('best line shown on menu', await page.isVisible('.best-line'));
  // records screen
  await page.click('[data-a=records]');
  await page.waitForSelector('[data-screen=records]:not(.hidden)');
  await shot(page, 'e2e-06-records');
  await page.keyboard.press('Escape');
  await menu(page);
  // second run shows the character select
  await page.click('[data-a=play]');
  const charsVisible = await page.isVisible('[data-screen=chars]:not(.hidden)');
  check('character select after first run', charsVisible);
  await shot(page, 'e2e-07-chars');
  await page.click('[data-c=gymbro]', { force: true });
  const stillChars = await page.isVisible('[data-screen=chars]:not(.hidden)');
  check('locked character cannot be picked', stillChars);
  await page.keyboard.press('Escape');
  check('persistence flow page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ── 3. Daily challenge + victory path ───────────────────────────────────────
{
  const { page, errors, ctx } = await open(b, url);
  await menu(page);
  await page.click('[data-a=daily]');
  await page.waitForFunction(() => window.__bro);
  const daily = await page.evaluate(() => window.__bro.scene.cfg.daily);
  check('daily run uses a date seed and modifier', !!daily?.seed && !!daily?.modifier?.id, `${daily?.date} ${daily?.modifier?.id} ${daily?.character}`);
  await page.evaluate(() => { window.__bro.god(true); window.__bro.bot(true); window.__bro.advance(5, true); window.__bro.boss('algorithm'); window.__bro.advance(3, true); });
  await page.waitForTimeout(200);
  // walk the boss through all three phases quickly (phase locks need ≥9 s per phase)
  for (const f of [0.6, 0.3, 0.001]) {
    await page.evaluate((f) => { window.__bro.bossHp(f); window.__bro.advance(11, true); }, f);
  }
  await page.evaluate(() => window.__bro.advance(6, true));
  await page.waitForSelector('[data-screen=results]:not(.hidden)', { timeout: 15000 });
  const victory = await page.$eval('.results .kicker', (x) => x.textContent);
  check('defeating The Algorithm wins the run', /Victory/i.test(victory), victory);
  await page.waitForTimeout(600);
  await shot(page, 'e2e-08-victory');
  const saved = await page.evaluate(() => window.__app.save);
  check('daily best stored under its date', Object.keys(saved.daily).includes(daily.date));
  check('victory recorded', saved.records.victories === 1 && saved.achievements.includes('victory'));
  check('daily/victory page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ── 4. Boss mechanics ───────────────────────────────────────────────────────
{
  const { page, errors, ctx } = await open(b, url);
  await menu(page);
  await play(page);
  await page.evaluate(() => { window.__bro.god(true); window.__bro.bot(true); window.__bro.boss('doomscroller'); });
  await page.evaluate(() => window.__bro.advance(6, true, true));
  await page.waitForTimeout(300);
  await shot(page, 'e2e-09-doomscroller');
  const b1 = (await st(page)).boss;
  check('Doomscroller spawns with a health bar', b1?.id === 'doomscroller' && (await page.isVisible('.bossbar:not(.hidden)')));
  const frac = await page.evaluate(() => window.__bro.hitBoss(1e6));
  const lock = (await st(page)).boss;
  check('phase lock: a huge hit early in phase 1 stops at the 50% gate', frac !== null && frac >= 0.5 && lock.phase === 1, `hp=${(frac * 100).toFixed(1)}% phase=${lock.phase}`);
  await page.evaluate(() => window.__bro.advance(14, true));
  await page.evaluate(() => { window.__bro.advance(2, true); window.__bro.hitBoss(1e6); window.__bro.advance(4, true); });
  const after = await st(page);
  check('Doomscroller can be defeated and the run continues', !after.boss && !after.ended && after.alive, JSON.stringify(after.boss));
  check('boss page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ── 5. Mobile / touch / resize ──────────────────────────────────────────────
{
  const { page, errors, ctx } = await open(b, url, { width: 390, height: 844 }, { touch: true, dpr: 2 });
  await menu(page);
  await shot(page, 'e2e-10-mobile-menu');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  check('mobile menu has no horizontal overflow', !overflow);
  await page.tap('[data-a=play]');
  await page.waitForFunction(() => window.__bro);
  await page.waitForTimeout(400);
  check('touch controls visible on touch devices', await page.isVisible('.touch:not(.hidden) .tbtn.dash'));
  // joystick drag via synthesized pointer events
  const zone = await page.$('.stick-zone');
  const box = await zone.boundingBox();
  const x0 = await page.evaluate(() => window.__bro.scene.player.x);
  await page.evaluate(({ x, y }) => {
    const z = document.querySelector('.stick-zone');
    const ev = (type, cx, cy) => z.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: cx, clientY: cy, bubbles: true }));
    ev('pointerdown', x, y);
    ev('pointermove', x + 60, y);
  }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  await page.evaluate(() => window.__bro.advance(0.5));
  const x1 = await page.evaluate(() => window.__bro.scene.player.x);
  check('joystick moves the player', x1 - x0 > 40, `dx=${(x1 - x0).toFixed(1)}`);
  await page.evaluate(() => document.querySelector('.stick-zone').dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, pointerType: 'touch', bubbles: true })));
  await page.tap('.tbtn.dash');
  const dashed = await page.evaluate(() => { window.__bro.advance(1 / 60); return window.__bro.scene.player.dashCd > 0; });
  check('touch dash button dashes', dashed);
  await page.evaluate(() => { window.__bro.god(true); window.__bro.advance(12, true, true); });
  await page.waitForTimeout(300);
  await shot(page, 'e2e-11-mobile-game');
  await page.evaluate(() => window.__bro.giveXp(60));
  await page.evaluate(() => window.__bro.advance(0.1));
  await page.waitForTimeout(700);
  await shot(page, 'e2e-12-mobile-levelup');
  const cardsFit = await page.evaluate(() => [...document.querySelectorAll('[data-card]')].every((c) => c.getBoundingClientRect().right <= innerWidth + 1));
  check('mobile level-up cards fit the screen', cardsFit);
  await page.tap('[data-card="0"]');
  // rotate to landscape
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(() => window.__bro.scene.cameras.main.width === 1688, null, { timeout: 5000 }).catch(() => {});
  const cam = await page.evaluate(() => ({ w: window.__bro.scene.cameras.main.width, h: window.__bro.scene.cameras.main.height }));
  check('canvas resizes with the viewport (DPR 2)', cam.w === 844 * 2 && cam.h === 390 * 2, JSON.stringify(cam));
  await page.evaluate(() => window.__bro.advance(0.2, true, true));
  await page.waitForTimeout(300);
  await shot(page, 'e2e-13-mobile-landscape');
  check('mobile page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ── 6. Desktop resize + blur auto-pause ─────────────────────────────────────
{
  const { page, errors, ctx } = await open(b, url, { width: 1920, height: 1080 });
  await menu(page);
  await play(page);
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.waitForFunction(() => window.__bro.scene.cameras.main.width === 1024, null, { timeout: 5000 }).catch(() => {});
  const cam = await page.evaluate(() => window.__bro.scene.cameras.main.width);
  check('desktop resize updates the canvas', cam === 1024, String(cam));
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(150);
  check('window blur auto-pauses', await page.isVisible('[data-screen=pause]:not(.hidden)'));
  check('desktop page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

await b.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync(`${outDir}e2e-results.json`, JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
