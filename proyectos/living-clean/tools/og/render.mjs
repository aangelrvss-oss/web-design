// Genera site/assets/og/og-living-clean.png (1200x630): logotipo real, titular y teléfono.
// Ejecutar desde proyectos/living-clean con el servidor local sin CSP en 4601:
// SITE_ROOT=proyectos/living-clean/site MRI_NO_CSP=1 php -S 127.0.0.1:4601 tools/dev/router.php
import { chromium } from '../../../../qa/node_modules/playwright-core/index.mjs';
const b = await chromium.launch({ executablePath: process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await (await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
await p.goto('http://127.0.0.1:4601/', { waitUntil: 'networkidle' });
await p.evaluate(() => {
  document.documentElement.classList.remove('sc-ready');
  document.body.innerHTML = `<div style="position:relative;width:1200px;height:630px;display:grid;grid-template-columns:1fr 330px;background:#FFFFFF;box-sizing:border-box;overflow:hidden">
    <div style="padding:64px 56px 56px 72px;display:flex;flex-direction:column;justify-content:space-between">
      <img src="/assets/brand/logo-living-clean.webp" style="width:220px;height:auto">
      <div>
        <p style="margin:0 0 18px;font:600 18px/1.2 'Instrument Sans',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#C8001A">Rivas-Vaciamadrid · Madrid</p>
        <p style="margin:0;font:600 60px/1.02 Outfit,sans-serif;letter-spacing:-.035em;color:#1B1B1E">Limpieza y conserjería para comunidades, oficinas y viviendas</p>
      </div>
    </div>
    <div style="background:#C8001A;color:#fff;padding:64px 40px;display:flex;flex-direction:column;justify-content:flex-end;gap:14px">
      <p style="margin:0;font:500 22px/1.35 'Instrument Sans',sans-serif">Personal propio y asegurado. Visitamos el inmueble antes de presupuestar.</p>
      <p style="margin:0;font:600 40px/1 Outfit,sans-serif;letter-spacing:-.02em">608 82 58 64</p>
    </div>
  </div>`;
  document.body.style.cssText = 'margin:0;width:1200px;height:630px;overflow:hidden';
});
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
await p.screenshot({ path: 'site/assets/og/og-living-clean.png' });
await b.close();
console.log('og ok');
