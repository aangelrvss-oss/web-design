import { SITE, SERVICES, FORM_TYPES } from './data.mjs';
import { icon } from './icons.mjs';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const ASSET_V = '20261015v2e';
const a = (p) => `${p}?v=${ASSET_V}`;
export const svcUrl = (slug) => `/servicios/${slug}/`;

// ------------------------------------------------------------- imágenes --
// Fotos reales de obra. Recortes publicados (ancha 826×406, cuadrada 392×406)
// y, de la galería a mayor resolución, banda panorámica (1798×410) y 2:1
// (820×410). Se muestran a su tamaño o menos: no se amplían más de un 15 %.
const DIMS = { ancha: [826, 406], cuadrada: [392, 406], banda: [1798, 410], '2x1': [820, 410] };
export function photo(name, alt, { shape = 'ancha', cls = '', lazy = true, sizes = '' } = {}) {
  const dims = DIMS[shape];
  return `<img${cls ? ` class="${cls}"` : ''} src="/assets/img/${name}-${shape}.webp" width="${dims[0]}" height="${dims[1]}" alt="${esc(alt)}"${sizes ? ` sizes="${sizes}"` : ''}${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}>`;
}

// ------------------------------------------------------------- logotipo --
// Reproducción tipográfica PROVISIONAL de la versión horizontal del logotipo
// (casa sobre «PRO» en rojo, «REFORMA» en azul marino). Sustituir por el
// archivo original de la empresa en cuanto esté disponible.
export function wordmark(cls = '') {
  return `<span class="wm${cls ? ` ${cls}` : ''}" aria-hidden="true"><span class="wm__pro"><svg class="wm__roof" viewBox="0 0 40 12" focusable="false"><path d="M2 11 20 2l18 9"/></svg>PRO</span><span class="wm__ref">REFORMA</span></span>`;
}

// ---------------------------------------------------------- datos ricos --
export function businessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    '@id': `${SITE.origin}/#empresa`,
    name: SITE.name,
    url: `${SITE.origin}/`,
    image: `${SITE.origin}/assets/og/og-pro-reforma.png`,
    telephone: SITE.phoneIntl,
    email: SITE.email,
    address: { '@type': 'PostalAddress', streetAddress: SITE.street, postalCode: SITE.postalCode, addressLocality: SITE.city, addressRegion: SITE.region, addressCountry: 'ES' },
    sameAs: [SITE.instagram, SITE.facebook, SITE.mapsUrl],
    knowsAbout: ['Reformas integrales', 'Pintura', 'Insonorización', 'Albañilería', 'Fontanería', 'Electricidad', 'Carpintería', 'Cerrajería'],
  };
}
export function breadcrumbLd(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE.origin}${path}` })) };
}

// ----------------------------------------------------------------- head --
export function head({ title, description, path, noindex = false, jsonld = [], preload = '' }) {
  const url = `${SITE.origin}${path}`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#F4F1EB">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="Pro Reforma">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.origin}/assets/og/og-pro-reforma.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Pro Reforma, reformas en Rivas-Vaciamadrid">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>
${preload}<link rel="stylesheet" href="${a('/assets/vendor/scrollcraft/scrollcraft.css')}">
<link rel="stylesheet" href="${a('/assets/css/site.css')}">
<script src="${a('/assets/js/boot.js')}"></script>
${jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head>`;
}

// --------------------------------------------------------------- header --
export function header({ current = '', over = false } = {}) {
  const main = SERVICES.filter((s) => s.main);
  const trade = SERVICES.filter((s) => !s.main);
  const link = (href, label, key) => `<a href="${href}"${current === key ? ' aria-current="page"' : ''}>${esc(label)}</a>`;
  const svcMenu = `<li class="bar__menu-h">Principales</li>${main.map((s) => `<li>${link(svcUrl(s.slug), s.nav, s.slug)}</li>`).join('')}<li class="bar__menu-h">Oficios</li>${trade.map((s) => `<li>${link(svcUrl(s.slug), s.nav, s.slug)}</li>`).join('')}<li class="bar__menu-all">${link('/servicios/', 'Todos los servicios', 'servicios')}</li>`;
  return `<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="bar${over ? ' bar--over' : ''}" data-bar>
  <div class="bar__in">
    <a class="bar__logo" href="/" aria-label="ProReforma, inicio">${wordmark()}</a>
    <nav class="bar__nav" aria-label="Principal">
      <ul class="bar__links">
        <li class="bar__drop">
          <button class="bar__dropbtn" type="button" aria-expanded="false" aria-controls="menu-servicios" data-drop>Servicios ${icon.chevron}</button>
          <ul class="bar__menu" id="menu-servicios" hidden>${svcMenu}</ul>
        </li>
        <li>${link('/proyectos/', 'Proyectos', 'proyectos')}</li>
        <li>${link('/como-trabajamos/', 'Cómo trabajamos', 'metodo')}</li>
        <li>${link('/conocer-proreforma/', 'Pro Reforma', 'sobre')}</li>
      </ul>
    </nav>
    <div class="bar__act">
      <a class="bar__icon" href="${SITE.whatsapp}" rel="noopener" target="_blank" data-track="click_whatsapp" data-track-loc="header" aria-label="Escribir por WhatsApp al ${SITE.phone} (se abre en otra pestaña)">${icon.whatsapp}</a>
      <a class="bar__tel" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="header" aria-label="Llamar al ${SITE.phone}">${icon.phone}<span>${SITE.phone}</span></a>
      <a class="btn btn--accent btn--sm" href="${over ? '#presupuesto' : '/contacto/#presupuesto'}" data-track="click_cta" data-track-loc="header"><span class="bar__cta-l">Solicitar presupuesto</span><span class="bar__cta-s" aria-hidden="true">Presupuesto</span></a>
      <button class="bar__burger" type="button" aria-expanded="false" aria-controls="menu-movil" data-burger><span class="vh">Menú</span>${icon.menu}</button>
    </div>
  </div>
  <div class="sheet" id="menu-movil" hidden>
    <nav aria-label="Menú móvil">
      <p class="sheet__h">Servicios</p>
      <ul class="sheet__main">${main.map((s) => `<li>${link(svcUrl(s.slug), s.nav, s.slug)}</li>`).join('')}</ul>
      <ul class="sheet__trade">${trade.map((s) => `<li>${link(svcUrl(s.slug), s.nav, s.slug)}</li>`).join('')}</ul>
      <ul class="sheet__more">
        <li>${link('/proyectos/', 'Proyectos', 'proyectos')}</li>
        <li>${link('/como-trabajamos/', 'Cómo trabajamos', 'metodo')}</li>
        <li>${link('/conocer-proreforma/', 'Conocer Pro Reforma', 'sobre')}</li>
        <li>${link('/contacto/', 'Contacto', 'contacto')}</li>
      </ul>
      <a class="btn btn--accent" href="${over ? '#presupuesto' : '/contacto/#presupuesto'}" data-track="click_cta" data-track-loc="menu">Solicitar presupuesto</a>
      <p class="sheet__hours">${esc(SITE.hours)}</p>
      <div class="sheet__direct">
        <a href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="menu">${icon.phone} ${SITE.phone}</a>
        <a href="${SITE.whatsapp}" rel="noopener" target="_blank" data-track="click_whatsapp" data-track-loc="menu">${icon.whatsapp} WhatsApp<span class="vh"> (se abre en otra pestaña)</span></a>
      </div>
    </nav>
  </div>
</header>`;
}

// ---------------------------------------------------- formulario real --
// Lo mínimo para empezar a hablar: qué necesitas, nombre, un teléfono o un
// correo y, si quieres, unas líneas. POST a /contacto.php (PHP) o a Netlify
// Forms (tools/demo/build-netlify.mjs --forms). Sin JavaScript redirige a
// /gracias/ o /envio-no-completado/; con JavaScript, fetch con la respuesta real.
export function quoteForm({ type = '', origin = 'contacto', idp = 'q' } = {}) {
  const types = FORM_TYPES.map((t) => `<label class="opt"><input type="radio" name="tipo" value="${t.value}"${type === t.value ? ' checked' : ''}><span>${esc(t.label)}</span></label>`).join('');
  return `<form class="qf" name="presupuesto" action="/contacto.php" method="post" novalidate data-quote data-origin="${esc(origin)}">
  <fieldset class="qf__row">
    <legend class="qf__label">¿Qué necesitas? <span class="qf__opt">opcional</span></legend>
    <div class="qf__opts">${types}</div>
  </fieldset>
  <div class="qf__grid">
    <div class="qf__field">
      <label class="qf__label" for="${idp}-nombre">Nombre</label>
      <input id="${idp}-nombre" name="nombre" type="text" autocomplete="name" required maxlength="120" aria-describedby="${idp}-nombre-err">
      <p class="qf__err" id="${idp}-nombre-err" hidden></p>
    </div>
    <div class="qf__field">
      <label class="qf__label" for="${idp}-contacto">Teléfono o correo</label>
      <input id="${idp}-contacto" name="contacto" type="text" autocomplete="tel" inputmode="email" required maxlength="160" aria-describedby="${idp}-contacto-help ${idp}-contacto-err">
      <p class="qf__help" id="${idp}-contacto-help">Te contestamos por donde nos digas.</p>
      <p class="qf__err" id="${idp}-contacto-err" hidden></p>
    </div>
    <div class="qf__field qf__wide">
      <label class="qf__label" for="${idp}-mensaje">Cuéntanos la obra <span class="qf__opt">opcional</span></label>
      <textarea id="${idp}-mensaje" name="mensaje" rows="3" maxlength="3000" placeholder="Por ejemplo: reformar el baño en Rivas y pintar el pasillo."></textarea>
    </div>
  </div>
  <div class="qf__hp" aria-hidden="true"><label for="${idp}-web">No rellenar</label><input id="${idp}-web" name="web" type="text" tabindex="-1" autocomplete="off"></div>
  <input type="hidden" name="origen" value="${esc(origin)}">
  <input type="hidden" name="t" value="" data-t>
  <div class="qf__foot">
    <button class="btn btn--accent btn--lg qf__send" type="submit" data-track="form_submit_click"><span class="qf__send-t">Enviar solicitud</span><span class="qf__spin" aria-hidden="true"></span></button>
    <p class="qf__legal">Responsable: ${esc(SITE.owner)} (Pro Reforma). Finalidad: responder a tu solicitud y preparar el presupuesto. Base jurídica: medidas precontractuales que nos pides. No cedemos tus datos salvo obligación legal. Puedes acceder, rectificar o suprimirlos escribiendo a ${SITE.email}. Más información en la <a href="/politica-de-privacidad/">política de privacidad</a>.</p>
  </div>
  <div class="qf__status" role="status" aria-live="polite" tabindex="-1" data-status hidden></div>
</form>`;
}

export function contactList(loc) {
  return `<ul class="direct">
  <li><a class="direct__tel" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="${loc}">${icon.phone}<span>${SITE.phone}</span></a></li>
  <li><a href="${SITE.whatsapp}" rel="noopener" target="_blank" data-track="click_whatsapp" data-track-loc="${loc}">${icon.whatsapp}<span>WhatsApp</span><span class="vh"> (se abre en otra pestaña)</span></a></li>
  <li><a href="mailto:${SITE.email}" data-track="click_email" data-track-loc="${loc}">${icon.mail}<span>${SITE.email}</span></a></li>
  <li><a href="${SITE.mapsUrl}" rel="noopener" target="_blank" data-track="click_map" data-track-loc="${loc}">${icon.pin}<span>${SITE.street}, ${SITE.postalCode} ${SITE.city}</span><span class="vh"> (Google Maps, se abre en otra pestaña)</span></a></li>
  <li class="direct__hours">${icon.clock}<span>${esc(SITE.hours)}</span></li>
</ul>`;
}

// --------------------------------------------------------------- footer --
export function footer({ quoteHere = true } = {}) {
  const year = new Date().getFullYear();
  return `<footer class="foot">
  <div class="foot__in sc-wrap">
    <div class="foot__brand">
      <a class="foot__logo" href="/" aria-label="ProReforma, inicio">${wordmark('wm--light')}</a>
      <p>Reformas integrales, pintura e insonorización en ${SITE.city}.</p>
      ${contactList('footer')}
    </div>
    <nav class="foot__nav" aria-label="Servicios">
      <p class="foot__h">Servicios</p>
      <ul>${SERVICES.map((s) => `<li><a href="${svcUrl(s.slug)}">${esc(s.nav)}</a></li>`).join('')}</ul>
    </nav>
    <nav class="foot__nav" aria-label="Empresa">
      <p class="foot__h">Pro Reforma</p>
      <ul>
        <li><a href="/proyectos/">Proyectos</a></li>
        <li><a href="/como-trabajamos/">Cómo trabajamos</a></li>
        <li><a href="/conocer-proreforma/">Conocer Pro Reforma</a></li>
        <li><a href="/contacto/">Contacto</a></li>
        <li><a href="${SITE.mapsUrl}" rel="noopener" target="_blank">Opiniones en Google<span class="vh"> (se abre en otra pestaña)</span></a></li>
        <li><a href="${SITE.instagram}" rel="noopener" target="_blank">Instagram<span class="vh"> (se abre en otra pestaña)</span></a></li>
      </ul>
    </nav>
    <nav class="foot__legal" aria-label="Legal">
      <a href="/aviso-legal/">Aviso legal</a>
      <a href="/politica-de-privacidad/">Política de privacidad</a>
      <a href="/politica-de-cookies/">Política de cookies</a>
      <a href="/declaracion-de-accesibilidad/">Accesibilidad</a>
    </nav>
    <p class="foot__copy">© ${year} ${esc(SITE.owner)} · Pro Reforma · NIF ${SITE.taxId}</p>
  </div>
</footer>
<nav class="dock" aria-label="Contacto rápido" data-dock>
  <a class="dock__a" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="dock">${icon.phone}<span>Llamar</span></a>
  <a class="dock__a" href="${SITE.whatsapp}" rel="noopener" target="_blank" data-track="click_whatsapp" data-track-loc="dock">${icon.whatsapp}<span>WhatsApp</span><span class="vh"> (se abre en otra pestaña)</span></a>
  <a class="dock__a dock__a--cta" href="${quoteHere ? '#presupuesto' : '/contacto/#presupuesto'}" data-track="click_cta" data-track-loc="dock" data-dock-cta>Presupuesto</a>
</nav>`;
}

export function scripts({ engine = true } = {}) {
  return `${engine ? `<script src="${a('/assets/vendor/scrollcraft/scrollcraft.js')}" defer></script>` : ''}
<script src="${a('/assets/js/site.js')}" defer></script>
</body>
</html>`;
}
