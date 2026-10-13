import { SITE, SERVICES, FORM_SERVICES, FORM_TYPES, STOPS } from './data.mjs';
import { icon } from './icons.mjs';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const ASSET_V = '20261013a';
const a = (p) => `${p}?v=${ASSET_V}`;

const BUSINESS_ID = `${SITE.origin}/#empresa`;

// ----------------------------------------------------------- imágenes --
// Fotografías generadas (ilustrativas) y fotos reales del equipo. Cada imagen
// se sirve en WebP a varios anchos; las medidas evitan saltos de maquetación.
const IMG = {
  'hero-portal': { w: 2688, h: 1520, widths: [1200, 1800, 2688] },
  'hero-portal-movil': { w: 1520, h: 2688, widths: [760, 1200] },
  'ronda-escalera': { w: 1024, h: 688, widths: [640, 1024] },
  'ronda-garaje': { w: 1024, h: 688, widths: [640, 1024] },
  'ronda-jardin': { w: 1024, h: 688, widths: [640, 1024] },
  'ronda-mantenimiento': { w: 1024, h: 688, widths: [640, 1024] },
  'ronda-fachada': { w: 1024, h: 688, widths: [640, 1024] },
};
export const GENERATED = new Set(Object.keys(IMG));
// Para las tarjetas y cabeceras se usa la versión 3:2 del portal.
const CARD = { 'hero-portal': 'ronda-portal' };
IMG['ronda-portal'] = { w: 1024, h: 688, widths: [640, 1024] };

export function picture(name, { alt = '', sizes = '100vw', cls = '', lazy = true, priority = false } = {}) {
  const key = CARD[name] && !priority ? CARD[name] : name;
  const m = IMG[key];
  if (!m) throw new Error(`imagen desconocida: ${key}`);
  const srcset = m.widths.map((w) => `/assets/img/${key}-${w}.webp ${w}w`).join(', ');
  const fallback = `/assets/img/${key}-${m.widths[Math.min(1, m.widths.length - 1)]}.webp`;
  return `<img${cls ? ` class="${cls}"` : ''} src="${fallback}" srcset="${srcset}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${esc(alt)}"${lazy ? ' loading="lazy" decoding="async"' : ''}${priority ? ' fetchpriority="high"' : ''}>`;
}

// -------------------------------------------------------- datos ricos --
export function businessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': BUSINESS_ID,
    name: SITE.brandLong,
    alternateName: SITE.name,
    legalName: SITE.legalName,
    taxID: SITE.taxId,
    url: `${SITE.origin}/`,
    logo: `${SITE.origin}/assets/brand/logo-living-clean.png`,
    image: `${SITE.origin}/assets/og/og-living-clean.png`,
    telephone: SITE.phoneIntl,
    email: SITE.email,
    address: { '@type': 'PostalAddress', addressLocality: SITE.city, addressRegion: SITE.region, addressCountry: 'ES' },
    sameAs: [SITE.instagram],
    knowsAbout: ['Limpieza de comunidades de vecinos', 'Conserjería', 'Mantenimiento de edificios', 'Limpieza de oficinas', 'Limpieza de viviendas', 'Limpieza de fin de obra', 'Eliminación de grafitis', 'Limpieza de moquetas', 'Limpieza de garajes'],
  };
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE.origin}${path}` })),
  };
}

// --------------------------------------------------------------- head --
export function head({ title, description, path, noindex = false, jsonld = [], preload = '' }) {
  const url = `${SITE.origin}${path}`;
  const ld = jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#FFFFFF">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="${esc(SITE.brandLong)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.origin}/assets/og/og-living-clean.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Logotipo de Living Clean Multiservicios y sus servicios de limpieza y conserjería">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/assets/brand/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/outfit.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>
${preload}<link rel="stylesheet" href="${a('/assets/vendor/scrollcraft/scrollcraft.css')}">
<link rel="stylesheet" href="${a('/assets/css/site.css')}">
<script src="${a('/assets/js/boot.js')}"></script>
${ld}
</head>`;
}

// ------------------------------------------------------------- header --
export function header({ current = '', form = true } = {}) {
  const q = form ? '#visita' : '/#visita';
  const svc = SERVICES.map((s) => `<li><a href="/${s.slug}/"${current === s.slug ? ' aria-current="page"' : ''}>${esc(s.nav)}</a></li>`).join('');
  return `<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="bar" data-bar>
  <div class="bar__in">
    <a class="bar__logo" href="/" aria-label="Living Clean Multiservicios, inicio">
      <img src="/assets/brand/logo-living-clean-320.webp" srcset="/assets/brand/logo-living-clean-320.webp 320w, /assets/brand/logo-living-clean.webp 640w" sizes="120px" width="640" height="333" alt="Living Clean Multiservicios">
    </a>
    <nav class="bar__nav" aria-label="Principal">
      <ul class="bar__links">
        <li class="bar__drop">
          <button class="bar__dropbtn" type="button" aria-expanded="false" aria-controls="menu-servicios" data-drop>Servicios ${icon.chevron}</button>
          <ul class="bar__menu" id="menu-servicios" hidden>${svc}</ul>
        </li>
        <li><a href="/#ronda">Comunidades</a></li>
        <li><a href="/#equipo">Equipo</a></li>
        <li><a href="/#dudas">Dudas</a></li>
      </ul>
    </nav>
    <div class="bar__act">
      <a class="bar__tel" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="header" aria-label="Llamar al ${SITE.phone}">${icon.phone}<span>${SITE.phone}</span></a>
      <a class="btn btn--accent btn--sm" href="${q}" data-track="click_cta" data-track-loc="header">Pedir presupuesto</a>
      <button class="bar__burger" type="button" aria-expanded="false" aria-controls="menu-movil" data-burger><span class="vh">Menú</span>${icon.menu}</button>
    </div>
  </div>
  <div class="sheet" id="menu-movil" hidden>
    <nav aria-label="Menú móvil">
      <p class="sheet__h">Servicios</p>
      <ul>${svc}</ul>
      <ul class="sheet__more">
        <li><a href="/#ronda">La ronda por tu comunidad</a></li>
        <li><a href="/#equipo">Equipo</a></li>
        <li><a href="/#dudas">Dudas frecuentes</a></li>
      </ul>
      <a class="btn btn--accent" href="${q}" data-track="click_cta" data-track-loc="menu">Pedir presupuesto</a>
      <a class="sheet__tel" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="menu">${icon.phone} ${SITE.phone}</a>
    </nav>
  </div>
</header>`;
}

// -------------------------------------------------------- hoja de visita --
// Funciona sin JavaScript (POST a /contacto.php). Con JavaScript se envía por
// fetch y muestra la respuesta real del servidor. El plan de la ronda se añade
// como campo oculto solo cuando el visitante lo ha tocado.
export function visitForm({ preset = [], type = '', origin = 'home', idp = 'v', plan = false } = {}) {
  const types = FORM_TYPES.map((t) => `<label class="opt"><input type="radio" name="tipo" value="${t.value}"${type === t.value ? ' checked' : ''}><span>${esc(t.label)}</span></label>`).join('');
  const checks = FORM_SERVICES.map((s) => `<label class="opt"><input type="checkbox" name="servicio[]" value="${s.value}"${preset.includes(s.value) ? ' checked' : ''}><span>${esc(s.label)}</span></label>`).join('');
  const planBox = plan ? `<div class="hv__plan" data-plan-box hidden>
    <p class="hv__label">Plan de tu comunidad</p>
    <p class="hv__plan-t" data-plan-text></p>
    <a class="hv__plan-edit" href="#ronda">Cambiar las paradas</a>
    <input type="hidden" name="plan" value="" data-plan-input disabled>
  </div>` : '';
  return `<form class="hv" action="/contacto.php" method="post" novalidate data-visit data-origin="${esc(origin)}">
  <fieldset class="hv__row">
    <legend class="hv__label">Es para <span class="hv__opt">opcional</span></legend>
    <div class="hv__opts">${types}</div>
  </fieldset>
  <fieldset class="hv__row">
    <legend class="hv__label">Qué necesitas <span class="hv__opt">puedes marcar varias</span></legend>
    <div class="hv__opts">${checks}</div>
  </fieldset>
  ${planBox}
  <div class="hv__grid">
    <div class="hv__field">
      <label class="hv__label" for="${idp}-nombre">Nombre</label>
      <input id="${idp}-nombre" name="nombre" type="text" autocomplete="name" required maxlength="120" aria-describedby="${idp}-nombre-err">
      <p class="hv__err" id="${idp}-nombre-err" hidden></p>
    </div>
    <div class="hv__field">
      <label class="hv__label" for="${idp}-localidad">Localidad del inmueble <span class="hv__opt">opcional</span></label>
      <input id="${idp}-localidad" name="localidad" type="text" autocomplete="address-level2" maxlength="120">
    </div>
    <div class="hv__field">
      <label class="hv__label" for="${idp}-telefono">Teléfono</label>
      <input id="${idp}-telefono" name="telefono" type="tel" autocomplete="tel" inputmode="tel" maxlength="40" aria-describedby="${idp}-contacto-help ${idp}-contacto-err">
    </div>
    <div class="hv__field">
      <label class="hv__label" for="${idp}-email">Correo electrónico</label>
      <input id="${idp}-email" name="email" type="email" autocomplete="email" maxlength="160" aria-describedby="${idp}-contacto-help ${idp}-contacto-err">
    </div>
    <p class="hv__help hv__wide" id="${idp}-contacto-help">Indica al menos un teléfono o un correo para poder responderte.</p>
    <p class="hv__err hv__wide" id="${idp}-contacto-err" hidden></p>
    <div class="hv__field hv__wide">
      <label class="hv__label" for="${idp}-mensaje">Cuéntanos <span class="hv__opt">opcional</span></label>
      <textarea id="${idp}-mensaje" name="mensaje" rows="4" maxlength="3000" placeholder="Por ejemplo: comunidad de 2 portales y 24 viviendas con garaje y jardín."></textarea>
    </div>
  </div>
  <div class="hv__hp" aria-hidden="true"><label for="${idp}-web">No rellenar</label><input id="${idp}-web" name="web" type="text" tabindex="-1" autocomplete="off"></div>
  <input type="hidden" name="origen" value="${esc(origin)}">
  <input type="hidden" name="t" value="" data-t>
  <div class="hv__foot">
    <button class="btn btn--accent btn--lg" type="submit" data-track="form_submit_click">Pedir visita y presupuesto</button>
    <p class="hv__legal">Responsable: ${esc(SITE.legalName)} Finalidad: responder a tu solicitud y preparar la visita y el presupuesto. Base jurídica: medidas precontractuales que nos pides. No cedemos tus datos salvo obligación legal. Puedes acceder, rectificar o suprimirlos escribiendo a ${SITE.email}. Más información en la <a href="/politica-privacidad.html">política de privacidad</a>.</p>
  </div>
  <div class="hv__status" role="status" aria-live="polite" tabindex="-1" data-status hidden></div>
</form>`;
}

export function contactBlock(loc = 'contacto') {
  return `<ul class="contact">
  <li><a class="contact__tel" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="${loc}">${icon.phone}<span>${SITE.phone}</span></a></li>
  <li><a href="mailto:${SITE.email}" data-track="click_email" data-track-loc="${loc}">${icon.mail}<span>${SITE.email}</span></a></li>
  <li>${icon.pin}<span>${SITE.city} (${SITE.region})</span></li>
</ul>`;
}

// ------------------------------------------------------------- footer --
export function footer() {
  const year = new Date().getFullYear();
  return `<footer class="foot">
  <div class="foot__in sc-wrap">
    <div class="foot__brand">
      <span class="foot__logo"><img src="/assets/brand/logo-living-clean-320.webp" width="320" height="167" alt="Living Clean Multiservicios" loading="lazy"></span>
      <p>${esc(SITE.legalName)} · NIF ${SITE.taxId}<br>${esc(SITE.city)} (${esc(SITE.region)})</p>
      <p><a class="foot__tel" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="footer">${SITE.phone}</a> · <a href="mailto:${SITE.email}" data-track="click_email" data-track-loc="footer">${SITE.email}</a></p>
    </div>
    <nav class="foot__nav" aria-label="Servicios">
      <p class="foot__h">Servicios</p>
      <ul>${SERVICES.map((s) => `<li><a href="/${s.slug}/">${esc(s.nav)}</a></li>`).join('')}</ul>
    </nav>
    <nav class="foot__nav" aria-label="Información">
      <p class="foot__h">Información</p>
      <ul>
        <li><a href="${SITE.instagram}" rel="noopener" target="_blank">Instagram<span class="vh"> (se abre en otra pestaña)</span></a></li>
        <li><a href="/aviso-legal.html">Aviso legal</a></li>
        <li><a href="/politica-privacidad.html">Política de privacidad</a></li>
        <li><a href="/politica-cookies.html">Política de cookies</a></li>
      </ul>
    </nav>
    <p class="foot__note">Las fotografías de espacios sin personas son imágenes ilustrativas creadas para esta web, no trabajos realizados. Las fotografías del equipo y del vehículo son de Living Clean.</p>
    <p class="foot__copy">© ${year} ${esc(SITE.legalName)}</p>
  </div>
</footer>`;
}

export function scripts({ engine = true } = {}) {
  return `${engine ? `<script src="${a('/assets/vendor/scrollcraft/scrollcraft.js')}" defer></script>` : ''}
<script src="${a('/assets/js/site.js')}" defer></script>
</body>
</html>`;
}

export const stopLabel = Object.fromEntries(STOPS.map((s) => [s.key, s.name]));
