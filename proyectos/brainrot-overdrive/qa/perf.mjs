// CPU-side cost of one frame (simulation step + sprite sync) under a heavy late-game load.
// GPU cost can't be measured in this headless environment (software WebGL); see docs/CHECKPOINT.md.
import { launch, open } from './browser.mjs';
const url = process.argv[2] ?? 'http://127.0.0.1:5173/';
const b = await launch();
const { page, errors } = await open(b, url + '?qa');
await page.waitForSelector('[data-screen=menu]:not(.hidden)', { timeout: 20000 });
await page.click('[data-a=play]');
await page.waitForFunction(() => window.__bro);
const res = await page.evaluate(() => {
  const q = window.__bro;
  q.god(true);
  q.setTime(420);
  for (const u of ['cannon','cannon','cannon','cannon','orbit','orbit','orbit','orbit','zap','zap','zap','homing','homing','homing','split','split','unfiltered','lucky','lucky','meltdown','domino','static','ricochet','bigbrain','bigbrain']) q.upgrade(u);
  for (const id of ['smoothbrain','speedrunner','hottake','ratio','unit']) q.spawn(id, 40);
  const s = q.scene;
  const times = [];
  for (let i = 0; i < 600; i++) {
    const t0 = performance.now();
    s.step(1 / 60);
    s.render(1 / 60);
    times.push(performance.now() - t0);
    if (s.isModal) s.closeModal();
  }
  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return { avgMs: +avg.toFixed(2), p50: +times[300].toFixed(2), p95: +times[570].toFixed(2), max: +times[599].toFixed(2), state: q.state() };
});
console.log(JSON.stringify(res, null, 1));
console.log('errors', errors.slice(0, 5));
await b.close();
