// Genera site/assets/og/og-pro-reforma.png (1200x630) y el icono táctil
// (180x180) con la tipografía y las fotos reales de la web.
// Requiere el servidor local sin CSP en 4701:
// SITE_ROOT=proyectos/pro-reforma/site MRI_NO_CSP=1 php -S 127.0.0.1:4701 tools/dev/router.php
import { chromium } from '../../../../qa/node_modules/playwright-core/index.mjs';
const b = await chromium.launch({ executablePath: process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await (await b.newContext({ viewport: { width: 1200, height: 630 } })).newPage();
await p.goto('http://127.0.0.1:4701/', { waitUntil: 'networkidle' });
await p.evaluate(() => {
  const wm = document.querySelector('.bar__logo .wm').outerHTML;
  document.documentElement.classList.remove('sc-ready');
  document.body.innerHTML = `<div style="width:1200px;height:630px;display:grid;grid-template-columns:1fr 430px;background:#F4F1EB;box-sizing:border-box;overflow:hidden">
    <div style="padding:56px 40px 48px 72px;box-sizing:border-box;height:630px;display:flex;flex-direction:column;justify-content:space-between">
      <div style="transform:scale(1.5);transform-origin:0 0">${wm}</div>
      <div>
        <p style="margin:0 0 18px;font:600 17px/1 'Instrument Sans';letter-spacing:.14em;text-transform:uppercase;color:#C8101A">Reformas integrales · Rivas-Vaciamadrid</p>
        <p style="margin:0;font:420 52px/1.06 Fraunces;letter-spacing:-.02em;color:#16191E">Reformas bien hechas, con la casa protegida <em style="color:#0E2A44">y los acabados cuidados</em></p>
      </div>
      <p style="margin:0;font:600 22px/1 'Instrument Sans';color:#16191E">691 312 106 · proreforma.es</p>
    </div>
    <div style="padding:24px 24px 24px 0;box-sizing:border-box;height:630px"><img src="/assets/img/salon-led-cuadrada.webp" style="width:100%;height:100%;object-fit:cover;display:block"></div>
  </div>`;
  document.body.style.cssText = 'margin:0;width:1200px;height:630px;overflow:hidden';
});
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
await p.screenshot({ path: 'site/assets/og/og-pro-reforma.png' });
const ic = await (await b.newContext({ viewport: { width: 180, height: 180 } })).newPage();
await ic.goto('http://127.0.0.1:4701/404.html');
await ic.setContent(`<body style="margin:0"><img src="http://127.0.0.1:4701/favicon.svg" style="width:180px;height:180px;display:block"></body>`);
await ic.waitForTimeout(300);
await ic.screenshot({ path: 'site/assets/brand/apple-touch-icon.png' });
await b.close();
console.log('og + icono ok');
