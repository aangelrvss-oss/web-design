// Contraste del hero sobre el fotograma real. El arnés de Scroll-craft solo
// mide los cues; el hero no lo es (se ve sin motor), así que se mide aquí con
// el mismo método: se ocultan los textos, se fotografía el fondo compuesto
// (vídeo + velos) y se toma el píxel más luminoso bajo cada texto.
//   node proyectos/mr-instalaciones-v2/qa/hero-contrast.mjs http://127.0.0.1:4512 [--w 390 --h 844 --mobile]
// Necesita un servidor sin CSP (MRI_NO_CSP=1), porque inyecta estilos.
import { chromium } from '../../../qa/node_modules/playwright-core/index.mjs';
const base = process.argv[2] || 'http://127.0.0.1:4510';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? +process.argv[i + 1] : d; };
const mobile = process.argv.includes('--mobile');
const W = arg('--w', 1440), H = arg('--h', 900);
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile })).newPage();
await page.goto(base + '/', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2500); // clip pintado y entradas terminadas
const sel = ['.hero__k', '.hero__h', '.hero__lede', '.cta-2', '.hero__scroll span', '.bar__links', '.bar__tel'];
// Un rectángulo por línea de texto (Range.getClientRects), no el del bloque:
// un titular de bloque ocupa todo el ancho de su columna aunque el texto
// acabe antes, y lo que hay a su derecha no está detrás de ninguna letra.
const rects = (await page.evaluate((sel) => sel.flatMap((s) => {
  const el = document.querySelector(s); if (!el) return [];
  const cs = getComputedStyle(el);
  if (cs.visibility === 'hidden' || cs.display === 'none' || !el.getBoundingClientRect().width) return [];
  const c = cs.color.match(/[\d.]+/g).map(Number);
  // Solo texto que se ve: fuera los nodos dentro de un recorte de «solo
  // lectores de pantalla» (clip-path), como el número del teléfono en móvil.
  const out = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode());) {
    if (!n.data.trim() || getComputedStyle(n.parentElement).clipPath !== 'none') continue;
    const range = document.createRange(); range.selectNodeContents(n);
    out.push(...[...range.getClientRects()].filter((r) => r.width > 4 && r.height > 4));
  }
  return out.map((r, i) => ({ s: s + ' #' + (i + 1), r: [r.left, r.top, r.width, r.height], c, vis: true }));
}), sel)).concat(await page.evaluate(() => [
  // Gráficos (WCAG 1.4.11, 3:1): el logotipo naranja y el icono del teléfono.
  ['.bar__logo-alt', [255, 101, 0]], ['.bar__tel .ic', null],
].flatMap(([s, c]) => {
  const el = document.querySelector(s); if (!el) return [];
  c = c || getComputedStyle(el).color.match(/[\d.]+/g).map(Number);
  const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).opacity === '0') return [];
  return [{ s: s + ' (gráfico)', r: [r.left, r.top, r.width, r.height], c, vis: true, g: true }];
})));
await page.addStyleTag({ content: '.hero__copy *, .hero__scroll, .bar__in { color: transparent !important; text-shadow: none !important; } .hero__copy svg, .bar__in svg, .bar__in img, .cta { visibility: hidden !important; }' });
await page.waitForTimeout(150);
const png = await page.screenshot();
await b.close();
// Decodificación sin dependencias: se delega en Python/PIL si no hay pngjs.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const tmp = '/tmp/hero-contrast-' + process.pid + '.png';
writeFileSync(tmp, png);
const py = `
import json,sys
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB'); rects=json.loads(sys.argv[2])
def lin(v):
  v/=255; return v/12.92 if v<=0.03928 else ((v+0.055)/1.055)**2.4
def L(p): return 0.2126*lin(p[0])+0.7152*lin(p[1])+0.0722*lin(p[2])
seen=set()
for r in rects:
  if not r or not r['vis']: continue
  key=tuple(int(v) for v in r['r'])
  if key in seen: continue
  seen.add(key)
  x,y,w,h=[int(round(v)) for v in r['r']]
  x=max(0,x); y=max(0,y); w=min(w,im.width-x); h=min(h,im.height-y)
  if w<2 or h<2: continue
  crop=im.crop((x,y,x+w,y+h)).resize((48,24))
  px=crop.get_flattened_data() if hasattr(crop,'get_flattened_data') else crop.getdata()
  ls=[L(p) for p in px]; mx=max(ls); mean=sum(ls)/len(ls)
  fg=L(r['c'][:3]); worst=(max(fg,mx)+0.05)/(min(fg,mx)+0.05); avg=(max(fg,mean)+0.05)/(min(fg,mean)+0.05)
  ok='OK' if worst>=(3 if r.get('g') else 4.5) else ('grande>=3' if worst>=3 else 'FALLA')
  print(f"{r['s']:<26} peor {worst:5.2f}:1   media {avg:5.2f}:1   {ok}")
`;
console.log(execFileSync('python3', ['-I', '-c', py, tmp, JSON.stringify(rects)], { encoding: 'utf8' }));
