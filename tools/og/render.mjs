// Genera site/assets/og/og-mri.png (1200x630) a partir del propio dibujo de la web.
// Requiere el servidor local: php -S 127.0.0.1:4501 tools/dev/router.php (con MRI_NO_CSP=1)
import { chromium } from '../../qa/node_modules/playwright-core/index.mjs';
const b = await chromium.launch({ executablePath: process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await (await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
await p.goto('http://127.0.0.1:4501/', { waitUntil: 'networkidle' });
await p.evaluate(() => {
  const svg = document.querySelector('.house--peak').cloneNode(true);
  document.documentElement.classList.remove('sc-ready');
  document.body.innerHTML = '';
  document.body.className = 'ground-dark';
  document.body.style.cssText = 'margin:0;width:1200px;height:630px;overflow:hidden;background:#1B2024;';
  const wrap = document.createElement('div');
  wrap.className = 'ground-dark';
  wrap.style.cssText = 'position:relative;width:1200px;height:630px;display:grid;grid-template-columns:430px 1fr;align-items:center;padding:0 40px 0 64px;box-sizing:border-box;';
  wrap.innerHTML = '<div><img src="/assets/brand/logo-mri-claro.webp" style="width:150px;height:auto;margin-bottom:34px"><p class="sc-display" style="font-size:54px;line-height:1;margin:0 0 22px;color:#EEF0EE">Instaladores de fontanería y climatización</p><p style="font:500 20px/1.4 Geist,sans-serif;color:#A9B2B8;margin:0">Rivas-Vaciamadrid · 911 66 24 76</p></div>';
  svg.style.cssText = 'width:100%;height:auto';
  svg.querySelectorAll('.st-dim,.st-text').forEach((n) => n.remove());
  const d = document.createElement('div'); d.appendChild(svg); wrap.appendChild(d);
  document.body.appendChild(wrap);
});
await p.waitForTimeout(500);
await p.screenshot({ path: 'site/assets/og/og-mri.png' });
await b.close();
console.log('og ok');
