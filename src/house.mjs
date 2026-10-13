// Sección constructiva de una vivienda de dos plantas con sus instalaciones.
// Dibujo esquemático propio (no es un proyecto real de MRI). Cada sistema es
// una capa <g data-sys="..."> con trazos de pathLength=1, para que el CSS pueda
// dibujarlos a partir de --sc-p sin JavaScript.
//
// Coordenadas: viewBox 0 0 1200 800. Terreno en y=640.

const P = (d, cls = '') => `<path class="ln ${cls}" pathLength="1" d="${d}"/>`;

// Fila de tubos de suelo radiante vistos en sección: pequeños círculos.
function underfloor(x0, x1, y, step = 17, r = 4.2) {
  let d = '';
  for (let x = x0; x <= x1; x += step) {
    d += `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  }
  return d;
}

// Línea de puntos como subtrazos cortos: se puede "dibujar" con dashoffset
// porque los huecos son movetos y no cuentan en la longitud.
function dotted(points, dash = 3, gap = 7) {
  let d = '';
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    const ux = (bx - ax) / len, uy = (by - ay) / len;
    for (let s = 0; s < len; s += dash + gap) {
      const e = Math.min(s + dash, len);
      d += `M${(ax + ux * s).toFixed(1)} ${(ay + uy * s).toFixed(1)}L${(ax + ux * e).toFixed(1)} ${(ay + uy * e).toFixed(1)}`;
    }
  }
  return d;
}

const structure = `
<g class="st" aria-hidden="true">
  <defs>
    <pattern id="earth{id}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="14" class="st-hatch"/>
    </pattern>
    <pattern id="wall{id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="7" class="st-hatch st-hatch--wall"/>
    </pattern>
  </defs>
  <rect x="0" y="640" width="1200" height="160" fill="url(#earth{id})" class="st-earth"/>
  <line x1="0" y1="640" x2="1200" y2="640" class="st-ground"/>
  <!-- forjados -->
  <rect x="232" y="620" width="716" height="20" class="st-solid"/>
  <rect x="250" y="420" width="680" height="20" class="st-solid"/>
  <rect x="250" y="236" width="680" height="18" class="st-solid"/>
  <!-- muros exteriores con huecos de ventana -->
  <path class="st-wall" d="M250 254V300M250 380V460M250 540V620M268 254V300M268 380V460M268 540V620"/>
  <rect x="250" y="254" width="18" height="46" fill="url(#wall{id})"/>
  <rect x="250" y="380" width="18" height="80" fill="url(#wall{id})"/>
  <rect x="250" y="540" width="18" height="80" fill="url(#wall{id})"/>
  <rect x="912" y="254" width="18" height="366" fill="url(#wall{id})"/>
  <path class="st-wall" d="M912 254V620M930 254V620"/>
  <!-- ventanas -->
  <path class="st-thin" d="M250 300H268M250 380H268M259 300V380M250 460H268M250 540H268M259 460V540"/>
  <!-- tabiques -->
  <path class="st-wall" d="M590 440V522M602 440V522M640 254V340M652 254V340"/>
  <!-- cubierta -->
  <path class="st-roof" d="M224 246L590 90L956 246"/>
  <path class="st-thin" d="M250 236L590 108L930 236"/>
  <!-- mobiliario y aparatos -->
  <path class="st-thin" d="M284 558H446V620M284 558V620M330 558q22 18 44 0M400 553h40M284 470H446V510H284Z"/>
  <path class="st-thin" d="M664 620V572M650 566h40l-6 10h-28zM736 520h24v30h-24z"/>
  <path class="st-thin" d="M664 420V392q0-8 8-8h124q8 0 8 8v28M840 360h40l-4 12h-32zM860 372V420"/>
  <path class="st-thin" d="M300 420V396h170V420M300 396v-14h40v14"/>
  <!-- cotas y niveles -->
  <g class="st-dim">
    <path d="M30 640H50M30 420H50M30 236H50M40 640V236"/>
    <path d="M250 700V726M930 700V726M250 718H930"/>
  </g>
  <g class="st-text">
    <text x="56" y="634">±0,00</text>
    <text x="56" y="414">+3,00</text>
    <text x="56" y="230">+5,80</text>
  </g>
</g>`;

const layers = {
  agua: `
  <g class="sys" data-sys="agua">
    ${P('M60 668H140M140 660h30v16h-30zM170 668H262V606H356V572M356 606H678V570M678 606H826V600M678 606H898V404H868V372M898 404H736V398')}
    ${P('M842 500V454H364V572M842 454H884V412H862V378M884 412H744V400', 'ln--hot')}
  </g>`,
  saneamiento: `
  <g class="sys" data-sys="saneamiento">
    ${P('M760 420V434H904M868 420V434M904 434V694L1010 716H1060M356 620V676H904M664 620V676M1060 716L1168 750', 'ln--thick')}
    <g class="nd"><rect x="1036" y="700" width="40" height="30"/><circle cx="1172" cy="752" r="16"/></g>
  </g>`,
  calefaccion: `
  <g class="sys" data-sys="calefaccion">
    ${P(underfloor(288, 580, 610) + underfloor(616, 900, 610), 'ln--thin')}
    ${P('M820 560H600M820 576H600M584 540V412H352V404M572 540V418H340V404')}
    <g class="nd"><rect x="566" y="536" width="34" height="68" rx="2"/><path d="M308 404V364h88v40M322 364v40M336 364v40M350 364v40M364 364v40M378 364v40"/></g>
  </g>`,
  aerotermia: `
  <g class="sys" data-sys="aerotermia">
    ${P('M990 596H930M912 596H880M990 612H930M912 612H880')}
    <g class="nd">
      <rect x="990" y="548" width="122" height="92" rx="4"/>
      <circle cx="1034" cy="594" r="30"/><circle cx="1034" cy="594" r="5"/>
      <path d="M1076 562v64M1086 562v64M1096 562v64"/>
      <rect x="820" y="498" width="60" height="122" rx="18"/>
    </g>
  </g>`,
  ventilacion: `
  <g class="sys" data-sys="ventilacion">
    ${P('M520 282H330V256M660 282H770V256M560 262V112M620 262V112', 'ln--duct')}
    <g class="nd"><rect x="516" y="262" width="148" height="40" rx="3"/><path d="M548 104h24M608 104h24"/></g>
  </g>`,
  gas: `
  <g class="sys" data-sys="gas">
    ${P('M246 590H420V560')}
    <g class="nd"><rect x="198" y="560" width="48" height="56" rx="2"/><path d="M210 576h24M210 588h24"/></g>
  </g>`,
  domotica: `
  <g class="sys" data-sys="domotica">
    ${P(dotted([[486, 512], [486, 452], [1050, 452], [1050, 548]]) + dotted([[520, 452], [520, 302]]) + dotted([[486, 452], [360, 452], [360, 410]]) + dotted([[486, 536], [566, 536]]), 'ln--dot')}
    <g class="nd"><rect x="470" y="512" width="32" height="44" rx="3"/><circle cx="486" cy="528" r="7"/></g>
  </g>`,
};

/**
 * @param {object} o
 * @param {string} o.id  sufijo único para ids de patrones
 * @param {string[]} [o.only] capas a incluir (por defecto todas)
 * @param {string} [o.className]
 * @param {string} [o.label] texto alternativo
 */
export function house({ id = 'a', only, className = '', label = '', structureOnly = false } = {}) {
  const keys = structureOnly ? [] : only || Object.keys(layers);
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="house ${className}" viewBox="0 0 1200 800" ${aria} focusable="false">
${structure.replaceAll('{id}', id)}
${keys.map((k) => layers[k]).join('\n')}
</svg>`;
}

export const LAYER_KEYS = Object.keys(layers);
