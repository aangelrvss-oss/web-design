import { SITE, AUDIENCES, STOPS, CONCIERGE, TEAM, SERVICES, HOME_FAQS } from './data.mjs';
import { head, header, footer, scripts, visitForm, contactBlock, esc, businessJsonLd, breadcrumbLd, picture } from './layout.mjs';
import { icon } from './icons.mjs';

const svcBySlug = Object.fromEntries(SERVICES.map((s) => [s.slug, s]));
const pad = (n) => String(n).padStart(2, '0');

// Qué servicio del formulario corresponde a cada página.
const FORM_OF = {
  'limpieza-de-comunidades': 'comunidades', 'conserje-multifuncion': 'conserje', 'limpieza-de-oficinas-y-locales': 'oficinas',
  'limpieza-de-viviendas': 'viviendas', 'limpieza-fin-de-obra': 'fin-de-obra', 'limpiezas-especializadas': 'especializadas',
};

const ctaPair = (loc, { short = false } = {}) => `<div class="cta-pair">
  <a class="btn btn--accent btn--lg" href="#visita" data-track="click_cta" data-track-loc="${loc}">Pedir presupuesto</a>
  <a class="btn btn--line btn--lg" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="${loc}" aria-label="Llamar al ${SITE.phone}">${icon.phone}<span class="cta-pair__long">Llamar al ${SITE.phone}</span>${short ? '<span class="cta-pair__short" aria-hidden="true">Llamar</span>' : ''}</a>
</div>`;

const faqList = (faqs) => `<div class="faq">${faqs.map(([q, a]) => `<details class="faq__i"><summary><span>${esc(q)}</span>${icon.chevron}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;

const realPhoto = (name, alt, { w = 360, h = 300, cls = '' } = {}) => `<img${cls ? ` class="${cls}"` : ''} src="/assets/img/${name}.webp" width="${w}" height="${h}" alt="${esc(alt)}" loading="lazy" decoding="async">`;

// ------------------------------------------------- acto 8: hoja de visita --
const visitSection = ({ preset = [], type = '', origin, heading = 'Pide una visita y te preparamos el presupuesto', lede, plan = false }) => `<section id="visita" class="visit ground-red" data-sc-act="flow" aria-labelledby="visit-h">
  <div class="sc-wrap visit__grid">
    <div class="visit__aside" id="contacto">
      <h2 id="visit-h" class="sc-display sc-display--lg" data-sc-cue="0.02" data-sc-kinetic="lines">${esc(heading)}</h2>
      <p class="sc-lede visit__lede">${esc(lede || 'Cada inmueble es distinto, así que primero lo vemos. Déjanos tus datos o llámanos y quedamos para la visita.')}</p>
      ${contactBlock('visita')}
    </div>
    <div class="visit__sheet">
      <p class="hv__title"><span>Hoja de visita</span><span>Living Clean</span></p>
      ${visitForm({ preset, type, origin, plan })}
    </div>
  </div>
</section>`;

// ------------------------------------------------------------------ home --
export function home() {
  // Acto 1 · la pasada. El cristal empañado se limpia en tres bandas en «S».
  const glassImg = (fog) => `<picture>
          <source media="(max-width: 760px)" type="image/webp" srcset="/assets/img/hero-portal-movil${fog ? '-niebla' : ''}-760.webp 760w, /assets/img/hero-portal-movil${fog ? '-niebla' : ''}-1200.webp 1200w" sizes="100vw">
          <img src="/assets/img/hero-portal${fog ? '-niebla' : ''}-1800.webp" srcset="/assets/img/hero-portal${fog ? '-niebla' : ''}-1200.webp 1200w, /assets/img/hero-portal${fog ? '-niebla' : ''}-1800.webp 1800w, /assets/img/hero-portal${fog ? '-niebla' : ''}-2688.webp 2688w" sizes="(max-width: 760px) 100vw, 60vw" width="2688" height="1520" alt=""${fog ? '' : ' fetchpriority="high"'} decoding="async">
        </picture>`;

  const tabs = AUDIENCES.map((a, i) => `<button class="who__tab" type="button" role="tab" id="tab-${a.key}" aria-controls="para-${a.key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab>${esc(a.label)}</button>`).join('');
  const whoPhoto = { comunidad: ['real-portal', 'Limpieza del portal de una comunidad'], empresa: ['real-abrillantado', 'Tratamiento de suelo con máquina rotativa'], particular: ['real-cristales', 'Limpieza de cristales'] };
  const ctaFor = { comunidad: 'Pedir presupuesto para mi comunidad', empresa: 'Pedir presupuesto para mi empresa', particular: 'Pedir presupuesto para mi casa' };
  const panels = AUDIENCES.map((a, i) => `<div class="who__panel" role="tabpanel" id="para-${a.key}" aria-labelledby="tab-${a.key}" tabindex="0"${i === 0 ? '' : ' data-off'}>
        <div class="who__body">
          <h3 class="who__h">${esc(a.label)}</h3>
          <p class="who__for">${esc(a.who)}</p>
          <p class="who__text">${esc(a.text)}</p>
          <ul class="who__links">${a.links.map(([t, h]) => `<li><a class="link-arrow" href="${h}">${esc(t)} ${icon.arrow}</a></li>`).join('')}</ul>
          <a class="btn btn--accent" href="#visita" data-set-type="${a.key}" data-track="click_cta" data-track-loc="para-${a.key}">${esc(ctaFor[a.key])}</a>
        </div>
        <figure class="who__fig">${realPhoto(whoPhoto[a.key][0], whoPhoto[a.key][1])}<figcaption>Foto de Living Clean</figcaption></figure>
      </div>`).join('\n      ');

  const stops = STOPS.map((s, i) => `<article class="stop" id="parada-${s.key}" data-stop="${s.key}" aria-labelledby="stop-${s.key}">
        <figure class="stop__fig">${picture(s.img, { alt: s.alt, sizes: '(max-width: 760px) 84vw, 34rem' })}<figcaption>Imagen ilustrativa</figcaption></figure>
        <div class="stop__body">
          <p class="stop__n"><span>Parada ${pad(i + 1)}</span></p>
          <h3 class="stop__h" id="stop-${s.key}">${esc(s.name)}</h3>
          <p class="stop__what">${esc(s.what)}</p>
          <dl class="stop__when">${s.when.map(([f, d]) => `<div><dt>${esc(f)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
          <button class="stop__tog" type="button" aria-pressed="true" data-stop-toggle="${s.key}">${icon.check}<span>Incluir en mi plan</span></button>
        </div>
      </article>`).join('\n      ');

  const track = STOPS.map((s, i) => `<li><a href="#parada-${s.key}" data-goto="${s.key}"><span class="track__dot" aria-hidden="true"></span><span class="track__n" aria-hidden="true">${pad(i + 1)}</span><span class="track__l">${esc(s.name)}</span></a></li>`).join('');

  const roles = CONCIERGE.roles.map((r, i) => `${i ? '<span class="cons__plus" aria-hidden="true">+</span>' : ''}<span class="cons__role" data-sc-cue="${(0.04 + i * 0.09).toFixed(2)}">${esc(r)}</span>`).join('');

  const facts = TEAM.facts.map(([t, d]) => `<div class="parte__row"><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('');

  const svcs = SERVICES.map((s, i) => `<li class="svcs__i">
        <a class="svcs__a" href="/${s.slug}/" data-track="click_service" data-track-loc="home-${s.slug}">
          <span class="svcs__n" aria-hidden="true">${pad(i + 1)}</span>
          <span class="svcs__t">${esc(s.nav)}</span>
          <span class="svcs__d">${esc(s.description)}</span>
          ${icon.arrow}
        </a>
      </li>`).join('\n      ');

  return `${head({
    title: 'Limpieza de comunidades y conserje en Rivas-Vaciamadrid | Living Clean',
    description: 'Limpieza de comunidades, conserje, oficinas, viviendas y fin de obra en Rivas-Vaciamadrid. Personal propio y asegurado. Visitamos antes de presupuestar.',
    path: '/',
    jsonld: [businessJsonLd(), { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.brandLong, url: `${SITE.origin}/`, inLanguage: 'es' }],
    preload: '<link rel="preload" as="image" type="image/webp" href="/assets/img/hero-portal-1800.webp" imagesrcset="/assets/img/hero-portal-1200.webp 1200w, /assets/img/hero-portal-1800.webp 1800w, /assets/img/hero-portal-2688.webp 2688w" imagesizes="60vw" media="(min-width: 761px)">\n<link rel="preload" as="image" type="image/webp" href="/assets/img/hero-portal-movil-760.webp" imagesrcset="/assets/img/hero-portal-movil-760.webp 760w, /assets/img/hero-portal-movil-1200.webp 1200w" imagesizes="100vw" media="(max-width: 760px)">\n',
  })}
<body class="page-home">
<span data-sc-progress></span>
${header()}
<main id="contenido">

  <section id="inicio" class="hero" data-sc-act="pin" data-sc-span="2" aria-labelledby="hero-h">
    <div class="hero__stage" data-sc-stage>
      <div class="hero__copy">
        <p class="hero__eyebrow">${esc(SITE.city)} · ${esc(SITE.region)}</p>
        <h1 id="hero-h" class="hero__h"><span class="ln">Limpieza y conserjería</span> <span class="ln">para comunidades,</span> <span class="ln">oficinas y viviendas</span></h1>
        <p class="hero__lede">Personal propio, uniformado y asegurado. Antes de darte precio, visitamos el inmueble.</p>
        ${ctaPair('hero', { short: true })}
      </div>
      <figure class="glass" data-glass>
        <div class="glass__clean">${glassImg(false)}</div>
        <div class="glass__fog glass__fog--1" aria-hidden="true">${glassImg(true)}</div>
        <div class="glass__fog glass__fog--2" aria-hidden="true">${glassImg(true)}</div>
        <div class="glass__fog glass__fog--3" aria-hidden="true">${glassImg(true)}</div>
        <span class="blade blade--1" aria-hidden="true"></span>
        <span class="blade blade--2" aria-hidden="true"></span>
        <span class="blade blade--3" aria-hidden="true"></span>
        <p class="glass__hint" aria-hidden="true">Desliza y pasa la rasqueta</p>
        <figcaption class="glass__tag">Imagen ilustrativa de un portal</figcaption>
      </figure>
    </div>
  </section>

  <section id="para-quien" class="who" data-sc-act="flow" aria-labelledby="who-h">
    <div class="sc-wrap">
      <div class="who__head">
        <h2 id="who-h" class="sc-display sc-display--md">¿Para quién es?</h2>
        <p class="sc-lede">Elige tu caso: te contamos qué hacemos y te llevamos al servicio que encaja.</p>
      </div>
      <div class="who__tabs" role="tablist" aria-label="Tipo de cliente" data-tabs hidden>${tabs}</div>
      <div class="who__panels" data-sc-in>
      ${panels}
      </div>
    </div>
  </section>

  <section id="ronda" class="ronda" data-sc-act="pan" data-sc-span="5.6" aria-labelledby="ronda-h">
    <div class="ronda__stage" data-sc-stage>
      <div class="ronda__rail" data-sc-pan="0">
      <div class="ronda__lead">
        <p class="eyebrow">Comunidades de vecinos</p>
        <h2 id="ronda-h" class="sc-display sc-display--md">La ronda por tu edificio</h2>
        <p class="sc-lede">Recorre el edificio parada a parada: qué se limpia y cada cuánto.</p>
        <p class="ronda__how" data-js-only hidden>Quita las paradas que tu comunidad no tiene. Tu plan irá con la solicitud de presupuesto.</p>
      </div>
      ${stops}
      <div class="ronda__end" aria-labelledby="plan-h" role="group">
        <h3 id="plan-h" class="sc-display ronda__end-h">El plan de tu comunidad</h3>
        <ul class="plan" data-plan-list>${STOPS.map((s) => `<li data-plan-item="${s.key}">${icon.check}<span>${esc(s.name)}</span></li>`).join('')}</ul>
        <p class="ronda__note">Las frecuencias se cierran con la comunidad después de la visita.</p>
        <a class="btn btn--accent btn--lg" href="#visita" data-plan-go data-track="click_cta" data-track-loc="ronda">Pedir visita con este plan</a>
      </div>
      </div>
      <nav class="track" aria-label="Paradas de la ronda">
        <ol>${track}</ol>
        <span class="track__fill" aria-hidden="true"></span>
      </nav>
    </div>
  </section>

  <section id="conserje" class="cons ground-dark" data-sc-act="pin" data-sc-span="2.4" aria-labelledby="cons-h">
    <div class="cons__stage" data-sc-stage>
      <div class="sc-wrap cons__in">
        <p class="eyebrow cons__k" data-sc-cue="0">Conserje multifunción</p>
        <h2 id="cons-h" class="cons__h">
          <span class="cons__roles">${roles}</span>
          <span class="cons__one" data-sc-cue="0.42" data-sc-kinetic="lines">en un solo puesto de trabajo</span>
        </h2>
        <div class="cons__more" data-sc-cue="0.6">
          <ul class="cons__list">${CONCIERGE.functions.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
          <p class="cons__why">Un proveedor, un horario y una factura en lugar de tres.</p>
          <div class="cta-pair">
            <a class="btn btn--accent" href="/conserje-multifuncion/" data-track="click_service" data-track-loc="conserje">Cómo funciona ${icon.arrow}</a>
            <a class="btn btn--line" href="#visita" data-set-service="conserje" data-track="click_cta" data-track-loc="conserje">Pedir presupuesto</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="equipo" class="team" data-sc-act="flow" aria-labelledby="team-h">
    <div class="sc-wrap team__grid">
      <div class="team__text">
        <h2 id="team-h" class="sc-display sc-display--md">Quién entra en tu edificio</h2>
        <p class="sc-lede">Personal de Living Clean, no subcontratado. Con nombre, uniforme y un teléfono al que llamar.</p>
        <dl class="parte" data-sc-in data-sc-stagger="60">${facts}</dl>
      </div>
      <div class="team__photos">
        <figure class="team__main" data-sc-reveal="up" data-sc-reveal-at="0.12 0.42">${realPhoto('real-cristales-grande', TEAM.photos[0][1], { w: 720, h: 810 })}</figure>
        ${TEAM.photos.slice(1).map(([n, alt]) => `<figure class="team__small">${realPhoto(n, alt)}</figure>`).join('\n        ')}
        <p class="team__cap">Equipo, maquinaria y vehículo de Living Clean.</p>
      </div>
    </div>
  </section>

  <section id="servicios" class="svcs-sec" data-sc-act="flow" aria-labelledby="svcs-h">
    <div class="sc-wrap">
      <div class="svcs__head">
        <h2 id="svcs-h" class="sc-display sc-display--md">Todos los servicios</h2>
        <p class="sc-lede">Además de comunidades: oficinas, viviendas, fin de obra y limpiezas que necesitan maquinaria.</p>
      </div>
      <ul class="svcs" data-sc-in data-sc-stagger="45">
      ${svcs}
      </ul>
    </div>
  </section>

  <section id="dudas" class="dudas" data-sc-act="flow" aria-labelledby="faq-h">
    <div class="sc-wrap dudas__grid">
      <h2 id="faq-h" class="sc-display sc-display--md">Dudas frecuentes</h2>
      ${faqList(HOME_FAQS)}
    </div>
  </section>

  ${visitSection({ origin: 'home', plan: true })}
</main>
${footer()}
${scripts()}`;
}

// --------------------------------------------------------------- service --
export function service(s) {
  const path = `/${s.slug}/`;
  const related = s.related.map((r) => svcBySlug[r]);
  const ld = [
    businessJsonLd(),
    breadcrumbLd([['Inicio', '/'], ['Servicios', '/#servicios'], [s.nav, path]]),
    { '@context': 'https://schema.org', '@type': 'Service', name: s.h1, serviceType: s.nav, description: s.description, url: `${SITE.origin}${path}`, provider: { '@id': `${SITE.origin}/#empresa` } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  return `${head({ title: s.title, description: s.description, path, jsonld: ld })}
<body class="page-svc">
${header({ current: s.slug })}
<main id="contenido">
  <section class="svc-hero" data-sc-act="flow" aria-labelledby="svc-h">
    <div class="sc-wrap svc-hero__grid">
      <div class="svc-hero__copy">
        <nav class="crumbs" aria-label="Ruta de navegación"><ol><li><a href="/">Inicio</a></li><li><a href="/#servicios">Servicios</a></li><li aria-current="page">${esc(s.nav)}</li></ol></nav>
        <h1 id="svc-h" class="sc-display sc-display--lg">${esc(s.h1)}</h1>
        <p class="sc-lede">${esc(s.intro)}</p>
        ${ctaPair('svc-hero')}
      </div>
      <figure class="svc-hero__fig glass glass--still">
        ${picture(s.img, { alt: '', sizes: '(max-width: 860px) 100vw, 46vw', lazy: false })}
        <figcaption class="glass__tag">Imagen ilustrativa</figcaption>
      </figure>
    </div>
  </section>

  <section class="svc-does sc-section" aria-labelledby="does-h">
    <div class="sc-wrap">
      <h2 id="does-h" class="sc-display sc-display--md">Qué incluye</h2>
      <ul class="does" data-sc-in data-sc-stagger="40">${s.does.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ul>
    </div>
  </section>

  <section class="svc-know sc-section ground-warm" aria-labelledby="know-h">
    <div class="sc-wrap know__grid">
      <h2 id="know-h" class="sc-display sc-display--md">Lo que conviene saber</h2>
      <div class="know__list">${s.know.map(([t, d]) => `<article class="know"><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}</div>
    </div>
  </section>

  <section class="svc-faq sc-section" aria-labelledby="sfaq-h">
    <div class="sc-wrap dudas__grid">
      <h2 id="sfaq-h" class="sc-display sc-display--md">Preguntas frecuentes</h2>
      ${faqList(s.faqs)}
    </div>
  </section>

  <nav class="related sc-wrap" aria-label="Servicios relacionados">
    <p class="related__h">También te puede interesar</p>
    <ul>${related.map((r) => `<li><a href="/${r.slug}/">${esc(r.nav)} ${icon.arrow}</a></li>`).join('')}</ul>
  </nav>

  ${visitSection({ preset: [FORM_OF[s.slug]], type: s.audience, origin: s.slug, lede: `Cuéntanos qué necesitas y dónde está el inmueble. Lo visitamos y te preparamos el presupuesto.` })}
</main>
${footer()}
${scripts()}`;
}

// --------------------------------------------------------- simple pages --
function simplePage({ path, title, description, h1, body, noindex = false, cls = 'page-doc' }) {
  return `${head({ title, description, path, noindex, jsonld: noindex ? [] : [breadcrumbLd([['Inicio', '/'], [h1, path]])] })}
<body class="${cls}">
${header({ form: false })}
<main id="contenido">
  <section class="svc-hero svc-hero--plain" aria-labelledby="pg-h">
    <div class="sc-wrap">
      <h1 id="pg-h" class="sc-display sc-display--lg">${esc(h1)}</h1>
    </div>
  </section>
  <section class="sc-section prose-sec"><div class="sc-wrap prose">${body}</div></section>
</main>
${footer()}
${scripts({ engine: false })}`;
}

export function avisoLegal() {
  return simplePage({
    path: '/aviso-legal.html',
    title: 'Aviso legal | Living Clean Multiservicios',
    description: 'Aviso legal de livingclean.es: datos del titular, condiciones de uso, propiedad intelectual y legislación aplicable.',
    h1: 'Aviso legal',
    body: `<h2>Titular de la web</h2>
<p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:</p>
<ul>
<li>Titular: ${esc(SITE.legalName)}</li>
<li>Nombre comercial: ${esc(SITE.brandLong)}</li>
<li>NIF: ${SITE.taxId}</li>
<li>Domicilio social: ${esc(SITE.legalAddress)}</li>
<li>Teléfono: <a href="${SITE.phoneHref}">${SITE.phone}</a></li>
<li>Correo electrónico: <a href="mailto:${SITE.email}">${SITE.email}</a></li>
<li>Actividad: servicios integrales a edificios e instalaciones (limpieza, conserjería y mantenimiento)</li>
<li>Sociedad inscrita en el Registro Mercantil de Madrid</li>
</ul>
<h2>Condiciones de uso</h2>
<p>El acceso a esta web no supone el inicio de una relación comercial con ${esc(SITE.legalName)} Quien la utiliza se compromete a hacerlo conforme a la ley, la buena fe y el orden público, y a no realizar ninguna acción que pueda dañar, inutilizar o sobrecargar la web o impedir su normal utilización.</p>
<h2>Propiedad intelectual</h2>
<p>Los contenidos de esta web (textos, fotografías del equipo, diseño y logotipo) pertenecen a ${esc(SITE.legalName)} o se usan con autorización. No se permite su reproducción, distribución o modificación sin autorización previa.</p>
<p>Las fotografías de espacios sin personas (portales, escaleras, garajes, jardines, pasillos y fachadas) son imágenes ilustrativas creadas para esta web: no muestran edificios ni trabajos concretos de ${esc(SITE.legalName)}</p>
<h2>Enlaces externos</h2>
<p>Esta web contiene enlaces a sitios de terceros, como Instagram. ${esc(SITE.legalName)} no se responsabiliza de sus contenidos ni de sus políticas.</p>
<h2>Responsabilidad</h2>
<p>${esc(SITE.legalName)} no se hace responsable de los daños derivados de la falta de disponibilidad de la web, de la presencia de programas maliciosos ajenos a su control o del uso indebido de la web por parte de terceros.</p>
<h2>Protección de datos</h2>
<p>El tratamiento de los datos personales se explica en la <a href="/politica-privacidad.html">política de privacidad</a>.</p>
<h2>Legislación y jurisdicción</h2>
<p>Las relaciones entre ${esc(SITE.legalName)} y los usuarios de esta web se rigen por la legislación española y se someten a los juzgados y tribunales de Madrid, salvo que la normativa de consumidores establezca otro fuero.</p>`,
  });
}

export function privacidad() {
  return simplePage({
    path: '/politica-privacidad.html',
    title: 'Política de privacidad | Living Clean Multiservicios',
    description: 'Cómo trata Living Clean S.L. los datos personales que recibe a través de esta web: finalidad, base jurídica, conservación y derechos.',
    h1: 'Política de privacidad',
    body: `<p>Esta política explica qué datos personales tratamos cuando nos contactas a través de esta web, para qué y cuáles son tus derechos, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).</p>
<h2>Responsable del tratamiento</h2>
<ul>
<li>${esc(SITE.legalName)} · NIF ${SITE.taxId}</li>
<li>${esc(SITE.legalAddress)}</li>
<li>Correo electrónico: <a href="mailto:${SITE.email}">${SITE.email}</a></li>
</ul>
<h2>Solicitud de visita y presupuesto</h2>
<ul>
<li><strong>Datos:</strong> nombre, teléfono y/o correo electrónico, localidad del inmueble, tipo de cliente, servicios que te interesan, las paradas que marques en «La ronda por tu edificio» y lo que escribas. Los campos opcionales están marcados.</li>
<li><strong>Finalidad:</strong> responder a tu solicitud, concertar la visita al inmueble y preparar el presupuesto.</li>
<li><strong>Base jurídica:</strong> la aplicación de medidas precontractuales a petición tuya (artículo 6.1.b del RGPD).</li>
<li><strong>Conservación:</strong> mientras se gestiona tu solicitud y, si no llega a contratarse ningún servicio, un máximo de un año. Si se contrata, durante la relación comercial y los plazos legales posteriores.</li>
<li><strong>Comunicaciones comerciales:</strong> no usamos los datos del formulario para enviarte publicidad.</li>
</ul>
<h2>Correo electrónico y teléfono</h2>
<p>Si nos escribes o llamas, trataremos los datos que nos facilites para atender tu consulta, con la misma base jurídica y los mismos plazos.</p>
<h2>Destinatarios</h2>
<p>No cedemos tus datos a terceros salvo obligación legal. Los proveedores que alojan esta web y nuestro correo electrónico acceden a ellos únicamente como encargados del tratamiento, con contrato y por cuenta de ${esc(SITE.legalName)}</p>
<h2>Tus derechos</h2>
<p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a <a href="mailto:${SITE.email}">${SITE.email}</a> o por correo postal al domicilio indicado, identificándote adecuadamente. Si consideras que no hemos atendido correctamente tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">www.aepd.es</a>).</p>
<h2>Seguridad</h2>
<p>La web se sirve cifrada (HTTPS) y aplicamos medidas técnicas y organizativas para proteger tus datos frente a pérdida, alteración o acceso no autorizado.</p>`,
  });
}

export function cookies() {
  return simplePage({
    path: '/politica-cookies.html',
    title: 'Política de cookies | Living Clean Multiservicios',
    description: 'Esta web no instala cookies de análisis, publicidad ni de terceros.',
    h1: 'Política de cookies',
    body: `<p class="sc-lede">Esta web no instala cookies ni tecnologías similares de análisis, publicidad o redes sociales, y no carga recursos de terceros al visitarla.</p>
<p>Las fuentes tipográficas, las imágenes y el resto de recursos se sirven desde nuestro propio dominio. Por eso no te mostramos un aviso de cookies.</p>
<p>Los enlaces a sitios externos (por ejemplo, Instagram) te llevan a servicios con sus propias políticas de cookies, que se aplican solo cuando los abres.</p>
<p>Si en el futuro incorporamos alguna herramienta que utilice cookies no necesarias, actualizaremos esta política y te pediremos el consentimiento antes de instalarlas.</p>`,
  });
}

export function gracias() {
  return simplePage({
    path: '/gracias/',
    title: 'Solicitud recibida | Living Clean Multiservicios',
    description: 'Hemos recibido tu solicitud de visita y presupuesto.',
    h1: 'Solicitud recibida',
    noindex: true,
    cls: 'page-doc page-thanks',
    body: `<p class="sc-lede">Gracias. Hemos recibido tu solicitud y te contactaremos para concertar la visita.</p>
<p>Si lo prefieres, llámanos al <a href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="gracias">${SITE.phone}</a>.</p>
<p><a class="link-arrow" href="/">Volver al inicio ${icon.arrow}</a></p>`,
  });
}

export function envioError() {
  return simplePage({
    path: '/envio-no-completado/',
    title: 'No se ha podido enviar | Living Clean Multiservicios',
    description: 'No se ha podido enviar la solicitud. Revisa los datos o llámanos.',
    h1: 'No se ha podido enviar la solicitud',
    noindex: true,
    body: `<p class="sc-lede">Revisa que hayas indicado tu nombre y al menos un teléfono o un correo electrónico, y vuelve a intentarlo.</p>
<p>También puedes llamarnos al <a href="${SITE.phoneHref}">${SITE.phone}</a> o escribir a <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
<p><a class="link-arrow" href="/#visita">Volver al formulario ${icon.arrow}</a></p>`,
  });
}

export function notFound() {
  return simplePage({
    path: '/404.html',
    title: 'Página no encontrada | Living Clean Multiservicios',
    description: 'La página que buscas no existe. Consulta nuestros servicios o pide presupuesto.',
    h1: 'Esta página no existe',
    noindex: true,
    body: `<p class="sc-lede">Puede que la dirección haya cambiado con la nueva web.</p>
<ul>${SERVICES.map((s) => `<li><a href="/${s.slug}/">${esc(s.nav)}</a></li>`).join('')}</ul>
<p><a class="btn btn--accent" href="/#visita">Pedir presupuesto</a> <a class="btn btn--line" href="${SITE.phoneHref}">${icon.phone}<span>${SITE.phone}</span></a></p>`,
  });
}
