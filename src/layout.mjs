import { SITE, SERVICES, FORM_SERVICES, CLIENT_TYPES } from './data.mjs';
import { icon } from './pictos.mjs';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const ASSET_V = '20261013';
const a = (p) => `${p}?v=${ASSET_V}`;

const BUSINESS_ID = `${SITE.origin}/#empresa`;

export function businessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['HVACBusiness', 'Plumber'],
    '@id': BUSINESS_ID,
    name: 'MRI · Martínez Rojas Instalaciones',
    alternateName: 'MR Instalaciones',
    legalName: SITE.legalName,
    taxID: SITE.taxId,
    url: `${SITE.origin}/`,
    logo: `${SITE.origin}/assets/brand/logo-mri.png`,
    image: `${SITE.origin}/assets/og/og-mri.png`,
    telephone: SITE.phoneIntl.replace(/\s/g, ''),
    email: SITE.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Calle Fundición 4 Bis, Nave 50',
      postalCode: SITE.postalCode,
      addressLocality: SITE.city,
      addressRegion: SITE.region,
      addressCountry: 'ES',
    },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00', closes: '18:30',
    }],
    knowsAbout: ['Fontanería', 'Saneamiento', 'Calefacción', 'Climatización', 'Aerotermia', 'Instalaciones de gas', 'Ventilación mecánica', 'Biomasa', 'Domótica'],
  };
}

export function head({ title, description, path, noindex = false, jsonld = [], preloadHouse = false }) {
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
<meta name="theme-color" content="#EDEEEB">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="MRI · Martínez Rojas Instalaciones">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.origin}/assets/og/og-mri.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Sección dibujada de una vivienda con sus instalaciones y el logotipo de MRI">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/assets/brand/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/archivo-wdth.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/geist.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${a('/assets/vendor/scrollcraft/scrollcraft.css')}">
<link rel="stylesheet" href="${a('/assets/css/site.css')}">
<script src="${a('/assets/js/boot.js')}"></script>
${ld}
</head>`;
}

export function header({ current = '', form = true } = {}) {
  const q = form ? '#presupuesto' : '/#presupuesto';
  const svc = SERVICES.map((s) => `<li><a href="/servicios/${s.slug}/"${current === s.slug ? ' aria-current="page"' : ''}>${esc(s.nav)}</a></li>`).join('');
  return `<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="bar" data-bar>
  <div class="bar__in">
    <a class="bar__logo" href="/" aria-label="MRI · Martínez Rojas Instalaciones, inicio">
      <img src="/assets/brand/logo-mri.png" width="284" height="180" alt="MRI · Martínez Rojas Instalaciones">
    </a>
    <nav class="bar__nav" aria-label="Principal">
      <ul class="bar__links">
        <li class="bar__drop">
          <button class="bar__dropbtn" type="button" aria-expanded="false" aria-controls="menu-servicios" data-drop>Servicios ${icon.chevron}</button>
          <ul class="bar__menu" id="menu-servicios" hidden>
            ${svc}
            <li class="bar__menu-sep"><a href="/empresas-y-obra-nueva/"${current === 'empresas' ? ' aria-current="page"' : ''}>Empresas y obra nueva</a></li>
          </ul>
        </li>
        <li><a href="/certificaciones/"${current === 'certificaciones' ? ' aria-current="page"' : ''}>Certificaciones</a></li>
        <li><a href="/#contacto">Contacto</a></li>
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
      <ul>${svc}<li><a href="/empresas-y-obra-nueva/">Empresas y obra nueva</a></li></ul>
      <ul class="sheet__more">
        <li><a href="/certificaciones/">Certificaciones</a></li>
        <li><a href="/#contacto">Contacto</a></li>
        <li><a href="/trabaja-con-nosotros/">Trabaja con nosotros</a></li>
      </ul>
      <a class="btn btn--accent" href="${q}" data-track="click_cta" data-track-loc="menu">Pedir presupuesto</a>
      <a class="sheet__tel" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="menu">${icon.phone} ${SITE.phone}</a>
    </nav>
  </div>
</header>`;
}

// Formulario de presupuesto, maquetado como el cajetín de un plano.
// Funciona sin JavaScript (POST a /contacto.php). Con JavaScript se envía por
// fetch y muestra el resultado real devuelto por el servidor.
export function quoteForm({ preset = [], origin = 'home', idp = 'q' } = {}) {
  const checks = FORM_SERVICES.map((s) => `<label class="chk"><input type="checkbox" name="servicio[]" value="${s.value}"${preset.includes(s.value) ? ' checked' : ''}><span>${esc(s.label)}</span></label>`).join('');
  const types = CLIENT_TYPES.map((t) => `<option value="${t.value}">${esc(t.label)}</option>`).join('');
  return `<form class="tb" action="/contacto.php" method="post" novalidate data-quote data-origin="${esc(origin)}">
  <fieldset class="tb__cell tb__cell--wide">
    <legend class="tb__label">Qué necesitas <span class="tb__opt">puedes marcar varias</span></legend>
    <div class="tb__checks">${checks}</div>
  </fieldset>
  <div class="tb__cell">
    <label class="tb__label" for="${idp}-nombre">Nombre</label>
    <input id="${idp}-nombre" name="nombre" type="text" autocomplete="name" required maxlength="120" aria-describedby="${idp}-nombre-err">
    <p class="tb__err" id="${idp}-nombre-err" hidden></p>
  </div>
  <div class="tb__cell">
    <label class="tb__label" for="${idp}-localidad">Localidad de la obra <span class="tb__opt">opcional</span></label>
    <input id="${idp}-localidad" name="localidad" type="text" autocomplete="address-level2" maxlength="120">
  </div>
  <div class="tb__cell">
    <label class="tb__label" for="${idp}-telefono">Teléfono</label>
    <input id="${idp}-telefono" name="telefono" type="tel" autocomplete="tel" inputmode="tel" maxlength="40" aria-describedby="${idp}-contacto-help ${idp}-contacto-err">
  </div>
  <div class="tb__cell">
    <label class="tb__label" for="${idp}-email">Correo electrónico</label>
    <input id="${idp}-email" name="email" type="email" autocomplete="email" maxlength="160" aria-describedby="${idp}-contacto-help ${idp}-contacto-err">
  </div>
  <p class="tb__help tb__cell--wide" id="${idp}-contacto-help">Indica al menos un teléfono o un correo para poder responderte.</p>
  <p class="tb__err tb__cell--wide" id="${idp}-contacto-err" hidden></p>
  <div class="tb__cell tb__cell--wide">
    <label class="tb__label" for="${idp}-tipo">Tipo de inmueble <span class="tb__opt">opcional</span></label>
    <select id="${idp}-tipo" name="tipo">${types}</select>
  </div>
  <div class="tb__cell tb__cell--wide">
    <label class="tb__label" for="${idp}-mensaje">Cuéntanos el trabajo <span class="tb__opt">opcional</span></label>
    <textarea id="${idp}-mensaje" name="mensaje" rows="4" maxlength="3000" placeholder="Por ejemplo: cambiar la caldera de gas por aerotermia en un adosado con radiadores."></textarea>
  </div>
  <div class="tb__hp" aria-hidden="true"><label for="${idp}-web">No rellenar</label><input id="${idp}-web" name="web" type="text" tabindex="-1" autocomplete="off"></div>
  <input type="hidden" name="origen" value="${esc(origin)}">
  <input type="hidden" name="t" value="" data-t>
  <div class="tb__foot tb__cell--wide">
    <button class="btn btn--accent btn--lg" type="submit" data-track="form_submit_click">Enviar solicitud</button>
    <p class="tb__legal">Responsable: ${esc(SITE.legalName)}. Finalidad: responder a tu solicitud y preparar el presupuesto. Base jurídica: medidas precontractuales que nos pides. No cedemos tus datos salvo obligación legal. Puedes acceder, rectificar o suprimirlos escribiendo a ${SITE.privacyEmail}. Más información en la <a href="/politica-de-privacidad/">política de privacidad</a>.</p>
  </div>
  <div class="tb__status tb__cell--wide" role="status" aria-live="polite" tabindex="-1" data-status hidden></div>
</form>`;
}

export function contactBlock() {
  return `<ul class="contact">
  <li><a class="contact__tel" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="contacto">${icon.phone}<span>${SITE.phone}</span></a></li>
  <li><a href="mailto:${SITE.email}" data-track="click_email" data-track-loc="contacto">${icon.mail}<span>${SITE.email}</span></a></li>
  <li><a href="${SITE.mapsHref}" rel="noopener" target="_blank" data-track="click_map">${icon.pin}<span>${SITE.street}<br>${SITE.postalCode} ${SITE.city}, ${SITE.region}</span><span class="vh"> (se abre en Google Maps en otra pestaña)</span></a></li>
  <li>${icon.clock}<span>${SITE.hours}</span></li>
</ul>`;
}

export function footer() {
  const year = new Date().getFullYear();
  return `<footer class="foot">
  <div class="foot__in sc-wrap">
    <div class="foot__brand">
      <img src="/assets/brand/logo-mri-claro.png" width="284" height="180" alt="MRI · Martínez Rojas Instalaciones" loading="lazy">
      <p>${esc(SITE.legalName)} · NIF ${SITE.taxId}<br>${SITE.street}, ${SITE.postalCode} ${SITE.city}</p>
    </div>
    <nav class="foot__nav" aria-label="Servicios">
      <p class="foot__h">Servicios</p>
      <ul>${SERVICES.map((s) => `<li><a href="/servicios/${s.slug}/">${esc(s.nav)}</a></li>`).join('')}<li><a href="/empresas-y-obra-nueva/">Empresas y obra nueva</a></li></ul>
    </nav>
    <nav class="foot__nav" aria-label="Empresa">
      <p class="foot__h">Empresa</p>
      <ul>
        <li><a href="/certificaciones/">Certificaciones</a></li>
        <li><a href="/trabaja-con-nosotros/">Trabaja con nosotros</a></li>
        <li><a href="/aviso-legal/">Aviso legal</a></li>
        <li><a href="/politica-de-privacidad/">Política de privacidad</a></li>
        <li><a href="/politica-de-cookies/">Política de cookies</a></li>
      </ul>
    </nav>
    <p class="foot__copy">© ${year} ${esc(SITE.legalName)}</p>
  </div>
  <div class="kit">
    <p>Programa Kit Digital financiado por los fondos Next Generation (EU) del Mecanismo de Recuperación y Resiliencia</p>
    <img src="/assets/brand/kit-digital-logos.webp" width="1136" height="72" alt="Financiado por la Unión Europea NextGenerationEU · Gobierno de España, Ministerio para la Transformación Digital y de la Función Pública · red.es · Plan de Recuperación, Transformación y Resiliencia · Kit Digital" loading="lazy">
  </div>
</footer>`;
}

export function scripts({ engine = true } = {}) {
  return `${engine ? `<script src="${a('/assets/vendor/scrollcraft/scrollcraft.js')}" defer></script>` : ''}
<script src="${a('/assets/js/site.js')}" defer></script>
</body>
</html>`;
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE.origin}${path}` })),
  };
}
