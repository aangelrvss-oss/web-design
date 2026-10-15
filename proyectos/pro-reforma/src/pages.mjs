import { SITE, REVIEWS, PHOTOS, PROJECTS, SERVICES, METHOD, FAQS } from './data.mjs';
import { head, header, footer, scripts, quoteForm, contactList, esc, businessJsonLd, breadcrumbLd, photo, svcUrl } from './layout.mjs';
import { icon } from './icons.mjs';

const svcBySlug = Object.fromEntries(SERVICES.map((s) => [s.slug, s]));
const pad = (n) => String(n).padStart(2, '0');
const stars = (n) => `<span class="stars" role="img" aria-label="${String(n).replace('.', ',')} de 5 estrellas">${icon.star.repeat(5)}</span>`;
const ratingTxt = REVIEWS.rating.toFixed(1).replace('.', ',');

const faqList = (faqs, idp = 'f') => `<div class="faq">${faqs.map(([q, a]) => `<details class="faq__i"><summary><span>${esc(q)}</span>${icon.chevron}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
const crumbs = (items) => `<nav class="crumbs" aria-label="Ruta de navegación"><ol>${items.map(([n, h], i) => i === items.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${h}">${esc(n)}</a></li>`).join('')}</ol></nav>`;

// Insignia de Google: valoración con fecha de consulta y enlace a la ficha.
// site.js la actualiza si la API de Places está configurada en el servidor.
const googleBadge = (loc) => `<a class="gbadge" href="${SITE.mapsUrl}" rel="noopener" target="_blank" data-track="click_google_reviews" data-track-loc="${loc}" data-g-badge>
  <span class="gbadge__score" data-g-rating>${ratingTxt}</span>${stars(REVIEWS.rating)}
  <span class="gbadge__txt"><strong><span data-g-count>${REVIEWS.count}</span> reseñas en Google</strong><span data-g-when>consultado el ${REVIEWS.checkedLabel}</span></span>
  <span class="vh"> (abre la ficha de Google Maps en otra pestaña)</span>
</a>`;

// Cierre con formulario (todas las páginas comerciales).
const quoteSection = ({ origin, type = '', heading = 'Pide tu presupuesto', lede = 'Cuéntanos qué quieres hacer. Te llamamos para concertar la visita y te enviamos un presupuesto detallado y sin compromiso.' }) => `<section id="presupuesto" class="quote ground-navy" data-sc-act="flow" aria-labelledby="quote-h">
  <div class="sc-wrap quote__grid">
    <div class="quote__aside">
      <p class="label">Presupuesto</p>
      <h2 id="quote-h" class="display display--lg" data-sc-cue="0.02" data-sc-kinetic="lines">${esc(heading)}</h2>
      <p class="lede">${esc(lede)}</p>
      ${contactList(`quote-${origin}`)}
    </div>
    <div class="quote__sheet">${quoteForm({ origin, type })}</div>
  </div>
</section>`;

// Reseñas (bloque editorial; en modo API se sustituye en el navegador).
function reviewsBlock({ heading = 'Lo que cuentan los clientes en Google', compact = false } = {}) {
  const [lead, ...rest] = REVIEWS.quotes;
  const card = (q, cls = '') => `<figure class="quote-card${cls}">
        <p class="quote-card__theme">${esc(q.theme)}</p>
        <blockquote><p>«${esc(q.text)}»</p></blockquote>
        <figcaption><span class="quote-card__who">${esc(q.author)}</span><span class="quote-card__src">Reseña en Google${q.work ? ` · ${esc(q.work)}` : ''}</span></figcaption>
      </figure>`;
  return `<section id="opiniones" class="reviews" data-sc-act="flow" aria-labelledby="rev-h" data-reviews>
    <div class="sc-wrap reviews__grid">
      <div class="reviews__aside">
        <p class="label">Opiniones verificadas</p>
        <h2 id="rev-h" class="display display--md">${esc(heading)}</h2>
        ${googleBadge('opiniones')}
        <p class="reviews__note" data-g-mode>Fragmentos literales de reseñas publicadas en la ficha de Google de Pro Reforma. Valoración y número de reseñas consultados el ${REVIEWS.checkedLabel}.</p>
        <div class="reviews__acts">
          <a class="btn btn--line" href="${SITE.mapsUrl}" rel="noopener" target="_blank" data-track="click_google_reviews" data-track-loc="opiniones-boton">Leer todas en Google ${icon.out}<span class="vh"> (se abre en otra pestaña)</span></a>
          <a class="btn btn--accent" href="#presupuesto" data-track="click_cta" data-track-loc="opiniones">Pedir presupuesto</a>
        </div>
      </div>
      <div class="reviews__list" data-g-list>
        ${card(lead, ' quote-card--lead')}
        <div class="reviews__rest" data-sc-in data-sc-stagger="80">${(compact ? rest.slice(0, 2) : rest).map((q) => card(q)).join('\n        ')}</div>
      </div>
    </div>
    ${compact ? '' : `<div class="sc-wrap themes">
      <p class="label">Lo que más se repite</p>
      <ul class="themes__list">${REVIEWS.themes.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ul>
    </div>`}
  </section>`;
}

// ------------------------------------------------------------------ home --
export function home() {
  const main = SERVICES.filter((s) => s.main);
  const trade = SERVICES.filter((s) => !s.main);
  const proj = PROJECTS[0];
  const other = PROJECTS[1];
  return `${head({
    title: 'Reformas integrales en Rivas-Vaciamadrid | Pro Reforma',
    description: 'Reformas integrales y parciales, pintura e insonorización en Rivas-Vaciamadrid. Visita, presupuesto detallado y la casa protegida durante la obra.',
    path: '/',
    jsonld: [businessJsonLd(), { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Pro Reforma', url: `${SITE.origin}/`, inLanguage: 'es' }],
    preload: '<link rel="preload" as="image" type="image/webp" href="/assets/img/salon-led-cuadrada.webp">\n',
  })}
<body class="page-home">
<span data-sc-progress></span>
${header()}
<main id="contenido">

  <section class="hero" data-sc-act="flow" aria-labelledby="hero-h">
    <div class="sc-wrap hero__grid">
      <div class="hero__copy">
        <p class="label hero__label">Reformas integrales · ${esc(SITE.city)}</p>
        <h1 id="hero-h" class="display display--xl hero__h"><span class="ln"><span>Reformas bien hechas,</span></span> <span class="ln"><span>con la casa protegida</span></span> <span class="ln"><span><em>y los acabados cuidados</em></span></span></h1>
        <p class="lede hero__lede">Reformas integrales y parciales, pintura e insonorización. Visitamos la vivienda, te damos un presupuesto detallado y trabajamos con todo protegido para dejarlo limpio al terminar.</p>
        <div class="cta-pair">
          <a class="btn btn--accent btn--lg" href="#presupuesto" data-track="click_cta" data-track-loc="hero">Pedir presupuesto</a>
          <a class="btn btn--line btn--lg" href="/proyectos/" data-track="click_projects" data-track-loc="hero">Ver proyectos</a>
        </div>
        ${googleBadge('hero')}
      </div>
      <div class="hero__pics" aria-label="Fotos de obras de Pro Reforma" role="group">
        <figure class="hero__pic hero__pic--a" data-sc-parallax="-0.25">${photo('salon-led', PHOTOS['salon-led'], { shape: 'cuadrada', lazy: false })}<figcaption>Salón terminado · foseado con LED</figcaption></figure>
        <figure class="hero__pic hero__pic--b" data-sc-parallax="0.35">${photo('insono-pintura', PHOTOS['insono-pintura'], { shape: 'cuadrada' })}<figcaption>Pintura con pistola</figcaption></figure>
        <figure class="hero__pic hero__pic--c" data-sc-parallax="0.12">${photo('insono-placas', PHOTOS['insono-placas'], { shape: 'cuadrada' })}<figcaption>Placas de insonorización</figcaption></figure>
        <p class="hero__pics-note">Fotos de obras reales publicadas por Pro Reforma</p>
      </div>
    </div>
  </section>

  ${reviewsBlock()}

  <section id="servicios" class="svcs" data-sc-act="flow" aria-labelledby="svcs-h">
    <div class="sc-wrap">
      <div class="sec-head">
        <p class="label">Servicios</p>
        <h2 id="svcs-h" class="display display--md">Qué hacemos</h2>
      </div>
      <ol class="svcs__main">
        ${main.map((s, i) => `<li class="svc-row" data-sc-reveal="up" data-sc-reveal-at="${(0.06 + i * 0.05).toFixed(2)} ${(0.3 + i * 0.05).toFixed(2)}">
          <a class="svc-row__a" href="${svcUrl(s.slug)}" data-track="click_service" data-track-loc="home-${s.slug}">
            <span class="svc-row__n">${pad(i + 1)}</span>
            <span class="svc-row__body"><span class="svc-row__t">${esc(s.nav)}</span><span class="svc-row__d">${esc(s.lede)}</span></span>
            <span class="svc-row__pic">${photo(s.photo, PHOTOS[s.photo], { shape: 'cuadrada' })}</span>
            <span class="svc-row__go">${icon.arrow}</span>
          </a>
        </li>`).join('\n        ')}
      </ol>
      <div class="svcs__trade">
        <p class="svcs__trade-h">Y trabajos de oficio, también sueltos:</p>
        <ul>${trade.map((s) => `<li><a href="${svcUrl(s.slug)}" data-track="click_service" data-track-loc="home-${s.slug}">${esc(s.nav)}</a></li>`).join('')}</ul>
      </div>
    </div>
  </section>

  <section id="obra" class="phase ground-plaster" data-sc-act="pin" data-sc-span="2.6" data-mobile-flow aria-labelledby="phase-h">
    <div class="phase__stage" data-sc-stage>
      <div class="sc-wrap phase__grid">
        <div class="phase__copy">
          <p class="label">Un proyecto real</p>
          <h2 id="phase-h" class="display display--md">${esc(proj.title)}, fase a fase</h2>
          <p class="phase__intro">${esc(proj.summary)}</p>
          <ol class="phase__steps">
            ${proj.steps.map(([img, t, d], i) => `<li class="phase__step"><span class="phase__n">${pad(i + 1)}</span><span><strong>${esc(t)}</strong> ${esc(d)}</span></li>`).join('\n            ')}
          </ol>
          <a class="link-arrow" href="/proyectos/${proj.slug}/" data-track="click_projects" data-track-loc="fases">Ver la ficha del proyecto ${icon.arrow}</a>
        </div>
        <div class="phase__frame">
          ${proj.steps.map(([img, t], i) => `<figure class="phase__pic phase__pic--${i}">${photo(img, PHOTOS[img], { shape: 'ancha' })}<figcaption><span>${pad(i + 1)}</span> ${esc(t)}</figcaption></figure>`).join('\n          ')}
        </div>
      </div>
    </div>
  </section>

  <section id="metodo" class="method" data-sc-act="flow" aria-labelledby="method-h">
    <div class="sc-wrap">
      <div class="sec-head sec-head--split">
        <div><p class="label">Cómo trabajamos</p><h2 id="method-h" class="display display--md">Del primer contacto a la entrega</h2></div>
        <p class="lede">Sabes en cada momento qué toca. Y la casa sigue siendo tu casa mientras dura la obra.</p>
      </div>
      <ol class="method__list" data-sc-in data-sc-stagger="70">${METHOD.map(([t, d], i) => `<li><span class="method__n">${pad(i + 1)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ol>
      <a class="link-arrow" href="/como-trabajamos/">Ver el método completo ${icon.arrow}</a>
    </div>
  </section>

  <section id="mas-proyectos" class="more" data-sc-act="flow" aria-labelledby="more-h">
    <div class="sc-wrap more__grid">
      <div class="more__text">
        <p class="label">Más trabajos</p>
        <h2 id="more-h" class="display display--md">${esc(other.title)}</h2>
        <p>${esc(other.summary)}</p>
        <a class="link-arrow" href="/proyectos/" data-track="click_projects" data-track-loc="mas-proyectos">Ver todos los proyectos ${icon.arrow}</a>
      </div>
      <div class="more__pics">
        ${other.steps.map(([img, t]) => `<figure data-sc-reveal="left" data-sc-reveal-at="0.1 0.42">${photo(img, PHOTOS[img], { shape: 'cuadrada' })}<figcaption>${esc(t)}</figcaption></figure>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section id="pro-reforma" class="about ground-plaster" data-sc-act="flow" aria-labelledby="about-h">
    <div class="sc-wrap about__grid">
      <figure class="about__quote" data-sc-reveal="up" data-sc-reveal-at="0.08 0.4"><blockquote><p>«${esc(REVIEWS.quotes[4].text)}»</p></blockquote><figcaption><strong>${esc(REVIEWS.quotes[4].author)}</strong> · Reseña en Google</figcaption></figure>
      <div class="about__text">
        <p class="label">Pro Reforma</p>
        <h2 id="about-h" class="display display--md">Una empresa de reformas de Rivas, con nombre propio</h2>
        <p class="lede">Detrás de Pro Reforma está Daniel, a quien los clientes nombran en sus reseñas por el trato y por cómo explica el trabajo.</p>
        <p>Hacemos reformas integrales y parciales, pintura, insonorización y trabajos de albañilería, fontanería, electricidad, carpintería y cerrajería en ${esc(SITE.city)} y la Comunidad de Madrid.</p>
        <a class="link-arrow" href="/conocer-proreforma/">Conocer Pro Reforma ${icon.arrow}</a>
      </div>
    </div>
  </section>

  <section id="dudas" class="dudas" data-sc-act="flow" aria-labelledby="faq-h">
    <div class="sc-wrap dudas__grid">
      <div><p class="label">Dudas</p><h2 id="faq-h" class="display display--md">Preguntas frecuentes</h2></div>
      ${faqList(FAQS)}
    </div>
  </section>

  ${quoteSection({ origin: 'home' })}
</main>
${footer()}
${scripts()}`;
}

// ------------------------------------------------------ servicios: índice --
export function servicesIndex() {
  const path = '/servicios/';
  const main = SERVICES.filter((s) => s.main);
  const trade = SERVICES.filter((s) => !s.main);
  return `${head({ title: 'Servicios de reformas en Rivas-Vaciamadrid | Pro Reforma', description: 'Reformas integrales, pintura e insonorización, y trabajos de albañilería, fontanería, electricidad, carpintería y cerrajería en Rivas-Vaciamadrid.', path, jsonld: [businessJsonLd(), breadcrumbLd([['Inicio', '/'], ['Servicios', path]])] })}
<body class="page-inner">
${header({ current: 'servicios' })}
<main id="contenido">
  <section class="page-hero" data-sc-act="flow" aria-labelledby="pg-h">
    <div class="sc-wrap">
      ${crumbs([['Inicio', '/'], ['Servicios', path]])}
      <h1 id="pg-h" class="display display--lg">Servicios</h1>
      <p class="lede">Tres servicios principales y los oficios que los completan. Cada uno con su visita y su presupuesto detallado.</p>
    </div>
  </section>
  <section class="svcs svcs--index" aria-label="Servicios principales">
    <div class="sc-wrap">
      <ol class="svcs__main">${main.map((s, i) => `<li class="svc-row"><a class="svc-row__a" href="${svcUrl(s.slug)}"><span class="svc-row__n">${pad(i + 1)}</span><span class="svc-row__body"><span class="svc-row__t">${esc(s.nav)}</span><span class="svc-row__d">${esc(s.lede)}</span></span><span class="svc-row__pic">${photo(s.photo, PHOTOS[s.photo], { shape: 'cuadrada' })}</span><span class="svc-row__go">${icon.arrow}</span></a></li>`).join('')}</ol>
      <h2 class="display display--sm svcs__trade-title">Oficios</h2>
      <ul class="trade-grid">${trade.map((s) => `<li><a href="${svcUrl(s.slug)}"><strong>${esc(s.nav)}</strong><span>${esc(s.lede)}</span>${icon.arrow}</a></li>`).join('')}</ul>
    </div>
  </section>
  ${quoteSection({ origin: 'servicios' })}
</main>
${footer()}
${scripts()}`;
}

// ---------------------------------------------------- página de servicio --
const TYPE_OF = { 'reformas-integrales': 'integral', pinturas: 'pintura', insonorizacion: 'insonorizacion' };
export function service(s) {
  const path = svcUrl(s.slug);
  const related = PROJECTS.filter((p) => p.service === s.slug || (s.slug === 'pinturas' && p.slug === 'insonorizacion-de-una-habitacion'));
  const quotes = REVIEWS.quotes.filter((q) => (s.slug === 'insonorizacion' && /insonoriz/i.test(q.text)) || (s.slug === 'pinturas' && /pint|proteg/i.test(q.text)) || (s.slug === 'reformas-integrales' && /reforma|acabados/i.test(q.work + q.text)));
  const ld = [businessJsonLd(), breadcrumbLd([['Inicio', '/'], ['Servicios', '/servicios/'], [s.nav, path]]),
    { '@context': 'https://schema.org', '@type': 'Service', name: s.h1, serviceType: s.nav, description: s.description, url: `${SITE.origin}${path}`, provider: { '@id': `${SITE.origin}/#empresa` } }];
  if (s.faqs) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  const others = SERVICES.filter((x) => x.slug !== s.slug && (s.main ? x.main : true)).slice(0, 4);
  return `${head({ title: s.title, description: s.description, path, jsonld: ld })}
<body class="page-inner">
${header({ current: s.slug })}
<main id="contenido">
  <section class="page-hero${s.photo ? ' page-hero--pic' : ''}" data-sc-act="flow" aria-labelledby="pg-h">
    <div class="sc-wrap page-hero__grid">
      <div>
        ${crumbs([['Inicio', '/'], ['Servicios', '/servicios/'], [s.nav, path]])}
        <h1 id="pg-h" class="display display--lg">${esc(s.h1)}</h1>
        <p class="lede">${esc(s.lede)}</p>
        <div class="cta-pair">
          <a class="btn btn--accent btn--lg" href="#presupuesto" data-track="click_cta" data-track-loc="svc-${s.slug}">Pedir presupuesto</a>
          <a class="btn btn--line btn--lg" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="svc-${s.slug}">${icon.phone}<span>${SITE.phone}</span></a>
        </div>
      </div>
      ${s.photo ? `<figure class="page-hero__pic">${photo(s.photo, PHOTOS[s.photo], { shape: 'cuadrada', lazy: false })}<figcaption>Foto de obra de Pro Reforma</figcaption></figure>` : ''}
    </div>
  </section>

  ${s.problem ? `<section class="svc-why" aria-labelledby="why-h">
    <div class="sc-wrap svc-why__grid">
      <div><p class="label">El problema</p><h2 id="why-h" class="display display--sm">Para qué sirve</h2></div>
      <div class="svc-why__text"><p class="lede">${esc(s.problem)}</p><p><strong>Para quién:</strong> ${esc(s.who)}</p></div>
    </div>
  </section>` : ''}

  <section class="svc-inc" data-sc-act="flow" aria-labelledby="inc-h">
    <div class="sc-wrap">
      <h2 id="inc-h" class="display display--sm">Qué incluye</h2>
      <ul class="inc" data-sc-in data-sc-stagger="50">${s.includes.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ul>
    </div>
  </section>

  ${s.process ? `<section class="svc-proc ground-plaster" aria-labelledby="proc-h">
    <div class="sc-wrap svc-proc__grid">
      <div>
        <h2 id="proc-h" class="display display--sm">Cómo se hace</h2>
        <ol class="proc">${s.process.map((p, i) => `<li><span>${pad(i + 1)}</span>${esc(p)}</li>`).join('')}</ol>
      </div>
      <div>
        <h2 class="display display--sm">Qué conviene tener a mano</h2>
        <ul class="bring">${s.bring.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        <p class="bring__note">Si no lo tienes todo, lo vemos en la visita.</p>
      </div>
    </div>
  </section>` : ''}

  ${related.length ? `<section class="svc-proj" aria-labelledby="sp-h">
    <div class="sc-wrap">
      <h2 id="sp-h" class="display display--sm">En obra</h2>
      ${related.map((p) => `<a class="proj-strip" href="/proyectos/${p.slug}/"><span class="proj-strip__pics">${p.steps.map(([img]) => photo(img, PHOTOS[img], { shape: 'cuadrada' })).join('')}</span><span class="proj-strip__t">${esc(p.title)} ${icon.arrow}</span></a>`).join('')}
    </div>
  </section>` : ''}

  ${quotes.length ? `<section class="svc-quotes" aria-labelledby="sq-h">
    <div class="sc-wrap">
      <h2 id="sq-h" class="display display--sm">Lo que cuentan en Google</h2>
      <div class="svc-quotes__list">${quotes.map((q) => `<figure class="quote-card"><blockquote><p>«${esc(q.text)}»</p></blockquote><figcaption><span class="quote-card__who">${esc(q.author)}</span><span class="quote-card__src">Reseña en Google</span></figcaption></figure>`).join('')}</div>
      ${googleBadge(`svc-${s.slug}`)}
    </div>
  </section>` : ''}

  ${s.faqs ? `<section class="dudas" aria-labelledby="sf-h"><div class="sc-wrap dudas__grid"><h2 id="sf-h" class="display display--sm">Preguntas frecuentes</h2>${faqList(s.faqs)}</div></section>` : ''}

  <nav class="related sc-wrap" aria-label="Otros servicios">
    <p class="related__h">Otros servicios</p>
    <ul>${others.map((o) => `<li><a href="${svcUrl(o.slug)}">${esc(o.nav)} ${icon.arrow}</a></li>`).join('')}</ul>
  </nav>

  ${quoteSection({ origin: s.slug, type: TYPE_OF[s.slug] || 'otro', lede: `Cuéntanos qué necesitas de ${s.nav.toLowerCase()}. Te llamamos para concertar la visita y te enviamos un presupuesto detallado y sin compromiso.` })}
</main>
${footer()}
${scripts()}`;
}

// ----------------------------------------------------------- proyectos --
export function projectsIndex() {
  const path = '/proyectos/';
  const fromReviews = REVIEWS.quotes.filter((q) => q.work);
  return `${head({ title: 'Proyectos de reformas en Rivas-Vaciamadrid | Pro Reforma', description: 'Fotos reales de obras de Pro Reforma: una insonorización fase a fase, techos de placas e iluminación, y trabajos que describen los clientes en Google.', path, jsonld: [businessJsonLd(), breadcrumbLd([['Inicio', '/'], ['Proyectos', path]])] })}
<body class="page-inner">
${header({ current: 'proyectos' })}
<main id="contenido">
  <section class="page-hero" data-sc-act="flow" aria-labelledby="pg-h">
    <div class="sc-wrap">
      ${crumbs([['Inicio', '/'], ['Proyectos', path]])}
      <h1 id="pg-h" class="display display--lg">Proyectos</h1>
      <p class="lede">Solo fotos de obras reales publicadas por Pro Reforma, y los trabajos que describen los propios clientes en sus reseñas.</p>
    </div>
  </section>
  <section class="projects" aria-label="Proyectos con fotos">
    <div class="sc-wrap">
      ${PROJECTS.map((p, i) => `<article class="proj-card" aria-labelledby="p-${i}">
        <a class="proj-card__a" href="/proyectos/${p.slug}/">
          <span class="proj-card__cover" data-sc-reveal="up" data-sc-reveal-at="0.05 0.35">${photo(p.cover, PHOTOS[p.cover], { shape: 'ancha' })}</span>
          <span class="proj-card__body"><span class="label">${esc(p.kind)}</span><h2 id="p-${i}" class="display display--sm">${esc(p.title)}</h2><span class="proj-card__d">${esc(p.summary)}</span><span class="link-arrow">Ver la ficha ${icon.arrow}</span></span>
        </a>
      </article>`).join('\n      ')}
    </div>
  </section>
  <section class="from-reviews ground-plaster" aria-labelledby="fr-h">
    <div class="sc-wrap">
      <h2 id="fr-h" class="display display--sm">Trabajos que cuentan los clientes</h2>
      <p class="from-reviews__lede">Obras descritas en reseñas de Google. No hay fotos publicadas de ellas.</p>
      <ul class="from-reviews__list">${fromReviews.map((q) => `<li><h3>${esc(q.work)}</h3><blockquote><p>«${esc(q.text)}»</p></blockquote><p class="quote-card__src">${esc(q.author)} · Reseña en Google</p></li>`).join('')}</ul>
      ${googleBadge('proyectos')}
    </div>
  </section>
  ${quoteSection({ origin: 'proyectos', heading: '¿Un proyecto parecido?' })}
</main>
${footer()}
${scripts()}`;
}

export function project(p) {
  const path = `/proyectos/${p.slug}/`;
  const svc = svcBySlug[p.service];
  return `${head({ title: `${p.title} | Proyectos de Pro Reforma`, description: `${p.summary}`.slice(0, 158), path, jsonld: [businessJsonLd(), breadcrumbLd([['Inicio', '/'], ['Proyectos', '/proyectos/'], [p.title, path]])] })}
<body class="page-inner">
${header({ current: 'proyectos' })}
<main id="contenido">
  <section class="page-hero" data-sc-act="flow" aria-labelledby="pg-h">
    <div class="sc-wrap">
      ${crumbs([['Inicio', '/'], ['Proyectos', '/proyectos/'], [p.title, path]])}
      <p class="label">${esc(p.kind)}</p>
      <h1 id="pg-h" class="display display--lg">${esc(p.title)}</h1>
      <p class="lede">${esc(p.summary)}</p>
    </div>
  </section>
  <section class="sheet-steps" aria-label="Fotos del proyecto">
    <div class="sc-wrap">
      <ol class="steps-grid">${p.steps.map(([img, t, d], i) => `<li data-sc-reveal="up" data-sc-reveal-at="0.04 0.3"><figure>${photo(img, PHOTOS[img], { shape: 'ancha' })}<figcaption><span class="steps-grid__n">${pad(i + 1)}</span><strong>${esc(t)}</strong> ${esc(d)}</figcaption></figure></li>`).join('')}</ol>
      <p class="sheet-note">${esc(p.note)}</p>
      <dl class="sheet-data">
        <div><dt>Tipo de trabajo</dt><dd>${esc(p.kind)}</dd></div>
        <div><dt>Servicio</dt><dd><a href="${svcUrl(svc.slug)}">${esc(svc.nav)}</a></dd></div>
        <div><dt>Fotos</dt><dd>Publicadas por Pro Reforma en su web</dd></div>
      </dl>
    </div>
  </section>
  ${quoteSection({ origin: `proyecto-${p.slug}`, type: TYPE_OF[p.service] || 'otro', heading: '¿Quieres algo parecido?' })}
</main>
${footer()}
${scripts()}`;
}

// ------------------------------------------------------------- método --
export function method() {
  const path = '/como-trabajamos/';
  return `${head({ title: 'Cómo trabajamos: de la visita a la entrega | Pro Reforma', description: 'Primer contacto, visita con medidas y fotos, presupuesto detallado, planificación, obra con la casa protegida y limpieza final. Así trabaja Pro Reforma.', path, jsonld: [businessJsonLd(), breadcrumbLd([['Inicio', '/'], ['Cómo trabajamos', path]])] })}
<body class="page-inner">
${header({ current: 'metodo' })}
<main id="contenido">
  <section class="page-hero" data-sc-act="flow" aria-labelledby="pg-h">
    <div class="sc-wrap">
      ${crumbs([['Inicio', '/'], ['Cómo trabajamos', path]])}
      <h1 id="pg-h" class="display display--lg">Cómo trabajamos</h1>
      <p class="lede">Seis pasos, del primer mensaje a la entrega. Lo que más cuidamos: que sepas qué toca en cada momento y que la casa quede limpia.</p>
    </div>
  </section>
  <section class="method method--page" data-sc-act="flow" aria-label="Pasos">
    <div class="sc-wrap">
      <ol class="method__list method__list--long">${METHOD.map(([t, d], i) => `<li data-sc-reveal="up" data-sc-reveal-at="0.04 0.3"><span class="method__n">${pad(i + 1)}</span><h2 class="display display--sm">${esc(t)}</h2><p>${esc(d)}</p></li>`).join('')}</ol>
    </div>
  </section>
  <section class="svc-proc ground-plaster" aria-labelledby="prot-h">
    <div class="sc-wrap svc-proc__grid">
      <div>
        <h2 id="prot-h" class="display display--sm">Cómo protegemos la casa</h2>
        <ul class="bring">${svcBySlug.pinturas.includes.slice(0, 2).map(([t, d]) => `<li><strong>${esc(t)}.</strong> ${esc(d)}</li>`).join('')}</ul>
        <p class="bring__note">Así lo describe la empresa en su servicio de pintura; en cada obra se adapta a las estancias que se tocan.</p>
      </div>
      <figure class="svc-proc__pic">${photo('insono-pintura', PHOTOS['insono-pintura'], { shape: 'cuadrada' })}<figcaption>Pintura con pistola, con la zona protegida</figcaption></figure>
    </div>
  </section>
  ${quoteSection({ origin: 'como-trabajamos' })}
</main>
${footer()}
${scripts()}`;
}

// ---------------------------------------------------------- la empresa --
export function about() {
  const path = '/conocer-proreforma/';
  return `${head({ title: 'Conocer Pro Reforma: reformas en Rivas-Vaciamadrid', description: 'Pro Reforma es una empresa de reformas de Rivas-Vaciamadrid. Reformas integrales, pintura e insonorización, con trato directo con Daniel y fotos reales de obra.', path, jsonld: [businessJsonLd(), breadcrumbLd([['Inicio', '/'], ['Conocer Pro Reforma', path]])] })}
<body class="page-inner">
${header({ current: 'sobre' })}
<main id="contenido">
  <section class="page-hero page-hero--pic" data-sc-act="flow" aria-labelledby="pg-h">
    <div class="sc-wrap page-hero__grid">
      <div>
        ${crumbs([['Inicio', '/'], ['Conocer Pro Reforma', path]])}
        <h1 id="pg-h" class="display display--lg">Conocer Pro Reforma</h1>
        <p class="lede">Una empresa de reformas de ${esc(SITE.city)}, en la calle España. Reformas integrales y parciales, pintura, insonorización y oficios.</p>
      </div>
      <figure class="page-hero__pic">${photo('techo-elevador', PHOTOS['techo-elevador'], { shape: 'cuadrada', lazy: false })}<figcaption>En obra</figcaption></figure>
    </div>
  </section>
  <section class="about-page" aria-label="Sobre la empresa">
    <div class="sc-wrap about-page__grid">
      <div class="prose">
        <h2>Trato directo</h2>
        <p>Los clientes nombran a Daniel en sus reseñas por el trato, por lo formal que es y por cómo explica el trabajo. Es quien atiende el teléfono y el correo de la empresa.</p>
        <h2>Cómo cuidamos la obra</h2>
        <p>Antes de presupuestar visitamos la vivienda. Durante la obra protegemos suelos, puertas, ventanas y muebles, y al terminar retiramos las protecciones y limpiamos. Lo contamos con detalle en <a href="/como-trabajamos/">cómo trabajamos</a>.</p>
        <h2>Con qué trabajamos</h2>
        <p>Maquinaria profesional de pintura y lijado (Festool, Wagner o Graco) y, en pintura plástica, Montó o Valentine.</p>
        <h2>Datos</h2>
        <ul>
          <li>${esc(SITE.owner)} · NIF ${SITE.taxId}</li>
          <li>${esc(SITE.street)}, ${SITE.postalCode} ${esc(SITE.city)} (${esc(SITE.region)})</li>
          <li><a href="${SITE.phoneHref}">${SITE.phone}</a> · <a href="mailto:${SITE.email}">${SITE.email}</a></li>
        </ul>
      </div>
      <aside class="about-page__aside">${googleBadge('sobre')}</aside>
    </div>
  </section>
  ${reviewsBlock({ heading: 'Opiniones en Google', compact: true })}
  ${quoteSection({ origin: 'sobre' })}
</main>
${footer()}
${scripts()}`;
}

// ------------------------------------------------------------ contacto --
export function contact() {
  const path = '/contacto/';
  return `${head({ title: 'Contacto y presupuesto | Pro Reforma, Rivas-Vaciamadrid', description: 'Pide presupuesto a Pro Reforma: teléfono y WhatsApp 691 312 106, daniel@proreforma.es o formulario. Calle España, 63, Rivas-Vaciamadrid.', path, jsonld: [businessJsonLd(), breadcrumbLd([['Inicio', '/'], ['Contacto', path]])] })}
<body class="page-inner page-contact">
${header({ current: 'contacto' })}
<main id="contenido">
  <section class="page-hero" data-sc-act="flow" aria-labelledby="pg-h">
    <div class="sc-wrap">
      ${crumbs([['Inicio', '/'], ['Contacto', path]])}
      <h1 id="pg-h" class="display display--lg">Contacto y presupuesto</h1>
      <p class="lede">La forma más rápida: llamar o escribir por WhatsApp. Si prefieres, déjanos tus datos y te llamamos.</p>
      ${googleBadge('contacto')}
    </div>
  </section>
  ${quoteSection({ origin: 'contacto', heading: 'Solicitud de presupuesto' })}
</main>
${footer()}
${scripts()}`;
}

// --------------------------------------------------------- páginas simples --
function simplePage({ path, title, description, h1, body, noindex = false }) {
  return `${head({ title, description, path, noindex, jsonld: noindex ? [] : [breadcrumbLd([['Inicio', '/'], [h1, path]])] })}
<body class="page-inner page-doc">
${header()}
<main id="contenido">
  <section class="page-hero" aria-labelledby="pg-h"><div class="sc-wrap"><h1 id="pg-h" class="display display--lg">${esc(h1)}</h1></div></section>
  <section class="doc"><div class="sc-wrap prose">${body}</div></section>
</main>
${footer()}
${scripts({ engine: false })}`;
}

export function avisoLegal() {
  return simplePage({
    path: '/aviso-legal/', title: 'Aviso legal | Pro Reforma', description: 'Aviso legal de proreforma.es: datos del titular, condiciones de uso, propiedad intelectual y legislación aplicable.', h1: 'Aviso legal',
    body: `<p class="doc__note">Texto preparado para revisión jurídica.</p>
<h2>Titular</h2>
<ul><li>Titular: ${esc(SITE.owner)}</li><li>Nombre comercial: Pro Reforma</li><li>NIF: ${SITE.taxId}</li><li>Domicilio: ${esc(SITE.street)}, ${SITE.postalCode} ${esc(SITE.city)} (${esc(SITE.region)})</li><li>Teléfono: <a href="${SITE.phoneHref}">${SITE.phone}</a></li><li>Correo electrónico: <a href="mailto:${SITE.email}">${SITE.email}</a></li></ul>
<h2>Condiciones de uso</h2><p>El acceso a esta web es gratuito y no supone el inicio de una relación comercial. Quien la usa se compromete a hacerlo conforme a la ley y a no dañar ni sobrecargar la web.</p>
<h2>Propiedad intelectual</h2><p>Los textos, fotografías de obra y diseño de esta web pertenecen a ${esc(SITE.owner)} o se usan con autorización. Las reseñas citadas pertenecen a sus autores y se reproducen con indicación de su fuente (Google).</p>
<h2>Enlaces externos</h2><p>La web enlaza a Google Maps, WhatsApp, Instagram y Facebook, que tienen sus propias condiciones.</p>
<h2>Legislación</h2><p>Se aplica la legislación española. Para cualquier controversia serán competentes los juzgados que correspondan según la normativa de consumidores.</p>`,
  });
}
export function privacidad() {
  return simplePage({
    path: '/politica-de-privacidad/', title: 'Política de privacidad | Pro Reforma', description: 'Cómo trata Pro Reforma los datos personales del formulario de presupuesto, el correo y WhatsApp: finalidad, base jurídica, conservación y derechos.', h1: 'Política de privacidad',
    body: `<p class="doc__note">Texto preparado para revisión jurídica.</p>
<h2>Responsable</h2><ul><li>${esc(SITE.owner)} (Pro Reforma) · NIF ${SITE.taxId}</li><li>${esc(SITE.street)}, ${SITE.postalCode} ${esc(SITE.city)}</li><li><a href="mailto:${SITE.email}">${SITE.email}</a></li></ul>
<h2>Solicitud de presupuesto</h2><ul><li><strong>Datos:</strong> nombre, teléfono y/o correo, localidad de la obra, tipo de trabajo, preferencia de contacto y lo que escribas.</li><li><strong>Finalidad:</strong> responderte, concertar la visita y preparar el presupuesto.</li><li><strong>Base jurídica:</strong> medidas precontractuales a petición tuya (art. 6.1.b RGPD).</li><li><strong>Conservación:</strong> mientras se gestiona la solicitud y, si no se contrata, un máximo de un año.</li><li>No usamos estos datos para enviarte publicidad.</li></ul>
<h2>WhatsApp, teléfono y correo</h2><p>Si nos escribes o llamas, trataremos los datos que nos facilites para atenderte. WhatsApp es un servicio de Meta con su propia política de privacidad.</p>
<h2>Destinatarios</h2><p>No cedemos datos salvo obligación legal. El alojamiento web y el correo actúan como encargados del tratamiento.</p>
<h2>Derechos</h2><p>Acceso, rectificación, supresión, oposición, limitación y portabilidad en <a href="mailto:${SITE.email}">${SITE.email}</a>. Puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">aepd.es</a>).</p>`,
  });
}
export function cookies() {
  return simplePage({
    path: '/politica-de-cookies/', title: 'Política de cookies | Pro Reforma', description: 'Esta web no instala cookies de análisis, publicidad ni de terceros.', h1: 'Política de cookies',
    body: `<p class="lede">Esta web no instala cookies de análisis, publicidad ni redes sociales, y no carga recursos de terceros al visitarla.</p><p>Fuentes, imágenes y scripts se sirven desde el propio dominio. Los enlaces a Google Maps, WhatsApp o redes sociales llevan a servicios con sus propias políticas, que se aplican solo cuando los abres.</p><p>Si la empresa activa la sincronización de reseñas con Google, la consulta se hace desde nuestro servidor; las fotos de perfil de los autores se cargan desde Google.</p>`,
  });
}
export function accesibilidad() {
  return simplePage({
    path: '/declaracion-de-accesibilidad/', title: 'Declaración de accesibilidad | Pro Reforma', description: 'Compromiso de accesibilidad de proreforma.es: criterios aplicados, limitaciones conocidas y cómo comunicarnos un problema.', h1: 'Declaración de accesibilidad',
    body: `<p>Esta web se ha diseñado siguiendo las pautas WCAG 2.2 de nivel AA: contraste suficiente, navegación completa con teclado, foco visible, textos alternativos, formularios etiquetados con mensajes de error claros y respeto a la preferencia de movimiento reducido.</p><h2>Limitaciones conocidas</h2><p>Las fotografías de obra se muestran a la resolución publicada por la empresa.</p><h2>Comunicar un problema</h2><p>Escríbenos a <a href="mailto:${SITE.email}">${SITE.email}</a> o llama al <a href="${SITE.phoneHref}">${SITE.phone}</a>.</p>`,
  });
}
export function gracias() {
  return simplePage({ path: '/gracias/', title: 'Solicitud recibida | Pro Reforma', description: 'Hemos recibido tu solicitud de presupuesto.', h1: 'Solicitud recibida', noindex: true, body: `<p class="lede">Gracias. Hemos recibido tu solicitud y te contactaremos para concertar la visita.</p><p>Si es urgente, llama o escribe por WhatsApp al <a href="${SITE.phoneHref}">${SITE.phone}</a>.</p><p><a class="link-arrow" href="/">Volver al inicio ${icon.arrow}</a></p>` });
}
export function envioError() {
  return simplePage({ path: '/envio-no-completado/', title: 'No se ha podido enviar | Pro Reforma', description: 'No se ha podido enviar la solicitud.', h1: 'No se ha podido enviar', noindex: true, body: `<p class="lede">Revisa que hayas indicado tu nombre y un teléfono o un correo, y vuelve a intentarlo.</p><p>También puedes llamar o escribir por WhatsApp al <a href="${SITE.phoneHref}">${SITE.phone}</a>, o escribir a <a href="mailto:${SITE.email}">${SITE.email}</a>.</p><p><a class="link-arrow" href="/contacto/">Volver al formulario ${icon.arrow}</a></p>` });
}
export function notFound() {
  return simplePage({ path: '/404.html', title: 'Página no encontrada | Pro Reforma', description: 'La página que buscas no existe.', h1: 'Esta página no existe', noindex: true, body: `<p class="lede">Puede que la dirección haya cambiado con la nueva web.</p><ul>${SERVICES.map((s) => `<li><a href="${svcUrl(s.slug)}">${esc(s.nav)}</a></li>`).join('')}<li><a href="/proyectos/">Proyectos</a></li></ul><p><a class="btn btn--accent" href="/contacto/#presupuesto">Pedir presupuesto</a></p>` });
}
