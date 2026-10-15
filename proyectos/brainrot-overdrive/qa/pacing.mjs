// Simulates full runs with the QA autopilot (real game code, fixed 1/60 s steps) and
// prints a pacing report: level curve, kills, bosses, survival. Usage: node qa/pacing.mjs [url] [runs]
import { launch, open } from './browser.mjs';
const url = process.argv[2] ?? 'http://127.0.0.1:5173/';
const runs = Number(process.argv[3] ?? 3);
const b = await launch();
const results = [];
for (let r = 0; r < runs; r++) {
  const { page, errors, ctx } = await open(b, url + '?qa');
  await page.waitForSelector('[data-screen=menu]:not(.hidden)', { timeout: 20000 });
  await page.click('[data-a=play]');
  await page.waitForFunction(() => window.__bro);
  await page.evaluate(() => window.__bro.bot(true));
  const samples = [];
  for (let t = 0; t < 560; t += 20) {
    const res = await page.evaluate(() => window.__bro.advance(20, true));
    const s = await page.evaluate(() => window.__bro.state());
    samples.push({ t: Math.round(s.time), lvl: s.level, hp: Math.round(s.hp), kills: s.kills, en: s.enemies, boss: s.boss ? `${s.boss.id}:${Math.round((s.boss.hp / s.boss.max) * 100)}%` : '', alive: s.alive });
    if (res.ended || !s.alive) break;
  }
  await page.waitForTimeout(200);
  const final = await page.evaluate(() => window.__bro.state());
  results.push({ run: r, final: { t: Math.round(final.time), lvl: final.level, kills: final.kills, victory: final.victory, alive: final.alive, owned: final.owned }, errors: errors.slice(0, 5) });
  console.log(`\nRUN ${r}`);
  for (const s of samples) console.log(`  t=${String(s.t).padStart(3)} lvl=${String(s.lvl).padStart(2)} hp=${String(s.hp).padStart(3)} kills=${String(s.kills).padStart(5)} enemies=${String(s.en).padStart(3)} ${s.boss}`);
  console.log('  final', JSON.stringify(results.at(-1).final), 'errors', JSON.stringify(results.at(-1).errors));
  await ctx.close();
}
await b.close();
