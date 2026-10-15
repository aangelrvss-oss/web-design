import { SITE, REVIEWS, PHOTOS, PROJECTS, SERVICES, METHOD, FAQS, quoteFrom } from './data.mjs';
import { head, header, footer, scripts, quoteForm, contactList, esc, businessJsonLd, breadcrumbLd, photo, svcUrl } from './layout.mjs';
import { icon, googleG } from './icons.mjs';

const svcBySlug = Object.fromEntries(SERVICES.map((s) => [s.slug, s]));
const pad = (n) => String(n).padStart(2, '0');
const stars = (n, cls = '') => `<span class="stars${cls ? ` ${cls}` : ''}" role="img" aria-label="${String(n.toFixed ? n.toFixed(1) : n).replace('.', ',')} de 5 estrellas">${icon.star.repeat(5)}</span>`;
const ratingTxt = REVIEWS.rating.toFixed(1).replace('.', ',');
const OUT = '<span class="vh"> (se abre en otra pestaña)</span>';
const TYPE_OF = { 'reformas-integrales': 'integral', pinturas: 'pintura', insonorizacion: 'insonorizacion' };

const faqList = (faqs) => `<div class="faq">${faqs.map(([q, a]) => `<details class="faq__i"><summary><span>${esc(q)}</span>${icon.chevron}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
const crumbs = (items) => `<nav class="crumbs" aria-label="Ruta de navegación"><ol>${items.map(([n, h], i) => i === items.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${h}">${esc(n)}</a></li>`).join('')}</ol></nav>`;

// --------------------------------------------------------------- reseñas --
// Insignia: valoración y número CON su fecha de consulta; enlace a la ficha.
// site.js la actualiza si la API de Places responde en el servidor.
const googleBadge = (loc, cls = '') => `<a class="gbadge${cls ? ` ${cls}` : ''}" href="${SITE.mapsUrl}" rel="noopener" target="_blank" data-track="click_google_reviews" data-track-loc="${loc}" data-g-badge>
  ${googleG}<span class="gbadge__score" data-g-rating>${ratingTxt}</span>${stars(REVIEWS.rating)}
  <span class="gbadge__txt"><strong><span data-g-count>${REVIEWS.count}</span> reseñas en Google</strong><span data-g-when data-g-checked="${REVIEWS.checked}">consulta del ${REVIEWS.checkedShort}</span></span>${OUT}
</a>`;

const initials = (name) => name.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
// Una reseña literal. Si el original es más largo, se dice y se enlaza.
function reviewCard(r, { lead = false, extra = false } = {}) {
  const paras = r.text.map((t, i) => `<p>${i === 0 ? '«' : ''}${esc(t)}${i === r.text.length - 1 ? (r.full ? '»' : ' […]»') : ''}</p>`).join('');
  return `<figure class="rcard${lead ? ' rcard--lead' : ''}"${extra ? ' data-more-item' : ''}>
        <blockquote>${paras}</blockquote>
        ${r.full ? '' : `<a class="rcard__more" href="${SITE.mapsUrl}" rel="noopener" target="_blank" data-track="click_google_reviews" data-track-loc="resena-completa">Seguir leyendo en Google${OUT}</a>`}
        <figcaption><span class="rcard__av" aria-hidden="true">${esc(initials(r.author))}</span><span class="rcard__who"><strong>${esc(r.author)}</strong><span>Reseña de Google · ${esc(r.when)}</span></span></figcaption>
      </figure>`;
}
const reviewsNote = () => `Reseñas copiadas tal cual de Google (ficha de Pro Reforma y widget de su web). La antigüedad es la que mostraba Google el ${REVIEWS.checkedLabel}. Google no verifica las reseñas.`;

// Muro de reseñas (portada): una destacada y el resto en columnas; en móvil
// se ven cuatro y un botón real muestra las demás.
function reviewsWall() {
  const [lead, ...rest] = REVIEWS.items;
  return `<section class="rwall" data-sc-act="flow" aria-labelledby="rw-h">
    <div class="sc-wrap">
      <div class="rwall__head">
        <h2 id="rw-h" class="display display--md">Lo que cuentan quienes ya han hecho obra con nosotros</h2>
        <a class="btn btn--line" href="${SITE.mapsUrl}" rel="noopener" target="_blank" data-track="click_google_reviews" data-track-loc="muro">${googleG} Leer las ${REVIEWS.count} en Google${OUT}</a>
      </div>
      <div class="rwall__grid" id="rw-list" data-g-list>
        ${reviewCard(lead, { lead: true })}
        <div class="rwall__cols" data-sc-in data-sc-stagger="60">${rest.map((r, i) => reviewCard(r, { extra: i >= 3 })).join('\n        ')}</div>
      </div>
      <button class="rwall__toggle btn btn--line" type="button" aria-expanded="false" aria-controls="rw-list" data-more hidden>Ver más opiniones</button>
      <p class="rwall__note" data-g-mode>${esc(reviewsNote())}</p>
      <div class="cta-pair rwall__cta">
        <a class="btn btn--accent btn--lg" href="#presupuesto" data-track="click_cta" data-track-loc="resenas">Solicitar presupuesto</a>
        <a class="btn btn--line btn--lg" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="resenas">${icon.phone}<span>Llamar ahora</span></a>
      </div>
    </div>
  </section>`;
}

// Franja compacta de reseñas para páginas interiores.
function reviewsBand(authors, { title = 'Opiniones en Google', loc = 'interior' } = {}) {
  const list = authors.map((a) => REVIEWS.items.find((r) => r.author === a));
  return `<section class="rband" aria-labelledby="rb-h-${loc}">
    <div class="sc-wrap rband__grid">
      <div class="rband__aside">
        <h2 id="rb-h-${loc}" class="display display--sm">${esc(title)}</h2>
        ${googleBadge(loc)}
        <p class="rband__note">${esc(reviewsNote())}</p>
      </div>
      <div class="rband__list" data-sc-in data-sc-stagger="70">${list.map((r) => reviewCard(r)).join('')}</div>
    </div>
  </section>`;
}

// Cierre con formulario (todas las páginas comerciales).
const quoteSection = ({ origin, type = '', heading = 'Cuéntanos qué necesitas', lede = 'Te llamamos para concertar la visita y te enviamos un presupuesto detallado y sin compromiso.' }) => `<section id="presupuesto" class="quote ground-navy" data-sc-act="flow" aria-labelledby="quote-h">
  <div class="sc-wrap quote__grid">
    <div class="quote__aside">
      <p class="label">Presupuesto sin compromiso</p>
      <h2 id="quote-h" class="display display--lg" data-sc-cue="0.02" data-sc-kinetic="lines">${esc(heading)}</h2>
      <p class="lede">${esc(lede)}</p>
      ${contactList(`quote-${origin}`)}
      <p class="quote__who">Te atiende Daniel, de Pro Reforma.</p>
    </div>
    <div class="quote__sheet">${quoteForm({ origin, type })}</div>
  </div>
</section>`;

// ------------------------------------------------------------------ home --
export function home() {
  const main = SERVICES.filter((s) => s.main);
  const trade = SERVICES.filter((s) => !s.main);
  const proj = PROJECTS[0];
  const why = [
    ['La casa, protegida', 'Tapamos suelos y cubrimos puertas, ventanas y muebles antes de empezar. Al terminar retiramos todo y limpiamos.', quoteFrom('Ana Maria Coarda', 'Han protegido toda la cocina con plásticos, han trabajado limpio y con mucho cuidado')],
    ['Acabados de oficio', 'Reparamos y preparamos paredes y techos antes de cerrar o pintar. Es lo que se ve cada día después.', { author: 'Frase destacada por Google', text: REVIEWS.highlights[1] }],
    ['Sabes qué se hace', 'Daniel te atiende y te explica qué se hace en cada paso y con qué materiales.', quoteFrom('Nicki1309 S', 'Daniel nos explicó con detalle cada parte del proceso y los materiales')],
  ];
  return `${head({
    title: 'Reformas, pintura e insonorización en Rivas-Vaciamadrid | Pro Reforma',
    description: 'Reformas integrales, pintura e insonorización en Rivas-Vaciamadrid. 5,0 en Google con 41 reseñas. Visita, presupuesto detallado y la casa protegida.',
    path: '/',
    jsonld: [businessJsonLd(), { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Pro Reforma', url: `${SITE.origin}/`, inLanguage: 'es' }],
    preload: '<link rel="preload" as="image" type="image/webp" href="/assets/img/insono-pintura-banda.webp" media="(min-width: 761px)">\n<link rel="preload" as="image" type="image/webp" href="/assets/img/insono-pintura-2x1.webp" media="(max-width: 760px)">\n',
  })}
<body class="page-home">
<span data-sc-progress></span>
${header({ over: true })}
<main id="contenido">

  <section class="hero ground-ink" data-sc-act="flow" aria-labelledby="hero-h" data-hero>
    <div class="sc-wrap hero__copy">
      <p class="label hero__label">${esc(SITE.city)} · Comunidad de Madrid</p>
      <h1 id="hero-h" class="display display--xl hero__h"><span class="ln"><span>Reformas, pintura</span></span> <span class="ln"><span>e insonorización</span></span> <span class="ln"><span><em>en Rivas‑Vaciamadrid</em></span></span></h1>
      <div class="hero__side">
        <p class="lede hero__lede">Visitamos tu casa, te damos un presupuesto detallado por partidas y trabajamos con todo protegido. Al terminar, la dejamos limpia.</p>
        <div class="cta-pair hero__cta" data-hero-cta>
          <a class="btn btn--accent btn--lg" href="#presupuesto" data-track="click_cta" data-track-loc="hero">Solicitar presupuesto</a>
          <a class="btn btn--ghost btn--lg" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="hero">${icon.phone}<span>Llamar · ${SITE.phone}</span></a>
        </div>
      </div>
    </div>
    <figure class="hero__band">
      <div class="hero__frame"><picture data-sc-parallax="0.3"><source media="(max-width: 760px)" srcset="/assets/img/insono-pintura-2x1.webp" width="820" height="410">${photo('insono-pintura', 'Operario de Pro Reforma, con la camiseta de la empresa, pintando con pistola las paredes de placas de una habitación', { shape: 'banda', lazy: false })}</picture></div>
      <figcaption>En obra: pintura con pistola sobre placas de insonorización</figcaption>
    </figure>
    <ul class="sc-wrap trust" aria-label="Datos de Pro Reforma" data-sc-in data-sc-stagger="70">
      <li><a href="#opiniones" class="trust__g">${googleG}<strong data-g-rating>${ratingTxt}</strong>${stars(REVIEWS.rating)}<span><span data-g-count>${REVIEWS.count}</span> reseñas en Google · <span data-g-when data-g-checked="${REVIEWS.checked}">consulta del ${REVIEWS.checkedShort}</span></span></a></li>
      <li>${icon.check}<span><strong>Presupuesto sin compromiso</strong> tras visitar la vivienda</span></li>
      <li>${icon.clock}<span><strong>${esc(SITE.hoursShort)}</strong> por teléfono y WhatsApp</span></li>
      <li>${icon.pin}<span><strong>Calle España, 63</strong> Rivas-Vaciamadrid</span></li>
    </ul>
  </section>

  <section id="opiniones" class="rstage" data-sc-act="pin" data-sc-span="1.9" data-mobile-flow aria-labelledby="rev-h" data-reviews>
    <div class="rstage__stage" data-sc-stage>
      <div class="sc-wrap rstage__grid">
        <div class="rstage__score">
          <h2 id="rev-h" class="label rstage__h">Opiniones en Google</h2>
          <p class="rstage__num" aria-hidden="true"><span data-g-rating>${ratingTxt}</span></p>
          <div class="rstage__stars">${stars(REVIEWS.rating, 'stars--xl')}<span class="stars stars--xl stars--fill" aria-hidden="true">${icon.star.repeat(5)}</span></div>
          <p class="rstage__count"><span class="vh">Valoración ${ratingTxt} de 5 · </span><strong><span data-g-count>${REVIEWS.count}</span> reseñas</strong> en la ficha de Google<span class="rstage__when" data-g-when data-g-checked="${REVIEWS.checked}">consulta del ${REVIEWS.checkedShort}</span></p>
          <a class="link-arrow rstage__link" href="${SITE.mapsUrl}" rel="noopener" target="_blank" data-track="click_google_reviews" data-track-loc="opiniones">${googleG}Ver la ficha en Google${OUT}</a>
        </div>
        <div class="rstage__quotes">
          <p class="rstage__qh">Lo que Google destaca de las reseñas</p>
          ${REVIEWS.highlights.map((h, i) => `<blockquote class="rstage__q" data-sc-cue="${['0 0.38 0 0.3', '0.34 0.68', '0.64 1 0.3 0.25'][i]}"><p>«${esc(h)}»</p></blockquote>`).join('\n          ')}
          <ul class="rstage__topics" aria-label="Temas que más se repiten en las reseñas, según Google" data-sc-cue="0.5 1 0.3 0.15">${REVIEWS.topics.map(([t, n]) => `<li><strong>${esc(t)}</strong> ${n} reseñas</li>`).join('')}</ul>
        </div>
      </div>
    </div>
  </section>

  ${reviewsWall()}

  <section id="servicios" class="svc3" data-sc-act="flow" aria-labelledby="svcs-h">
    <div class="sc-wrap">
      <div class="sec-head sec-head--split">
        <div><p class="label">Servicios</p><h2 id="svcs-h" class="display display--md">¿Qué quieres hacer en casa?</h2></div>
        <p class="lede">Tres servicios principales, con visita y presupuesto detallado. Y los oficios que los completan.</p>
      </div>
      <div class="svc3__list">
        ${main.map((s, i) => `<article class="svc3__item" aria-labelledby="svc-${s.slug}">
          <a class="svc3__pic" href="${svcUrl(s.slug)}" tabindex="-1" aria-hidden="true" data-sc-reveal="${i % 2 ? 'right' : 'left'}" data-sc-reveal-at="${(0.06 + i * 0.09).toFixed(2)} ${(0.26 + i * 0.09).toFixed(2)}">${photo(s.band, PHOTOS[s.band], { shape: '2x1', sizes: '(max-width: 760px) 100vw, 45vw' })}</a>
          <div class="svc3__body">
            <p class="svc3__n">${pad(i + 1)}</p>
            <h3 id="svc-${s.slug}" class="display display--sm"><a href="${svcUrl(s.slug)}">${esc(s.nav)}</a></h3>
            <p>${esc(s.short)}</p>
            <div class="svc3__acts">
              <a class="link-arrow" href="${svcUrl(s.slug)}" data-track="click_service" data-track-loc="home-${s.slug}">Ver ${esc(s.nav.toLowerCase())} ${icon.arrow}</a>
              <a class="link-quote" href="#presupuesto" data-set-type="${TYPE_OF[s.slug]}" data-track="click_cta" data-track-loc="svc-${s.slug}">Pedir presupuesto de ${esc(s.quoteLabel)}</a>
            </div>
          </div>
        </article>`).join('\n        ')}
      </div>
      <div class="svcs__trade">
        <p class="svcs__trade-h">También trabajos de oficio, sueltos o dentro de una reforma:</p>
        <ul>${trade.map((s) => `<li><a href="${svcUrl(s.slug)}" data-track="click_service" data-track-loc="home-${s.slug}">${esc(s.nav)}</a></li>`).join('')}</ul>
      </div>
    </div>
  </section>

  <section class="pause ground-ink" data-sc-act="flow" aria-label="Un trabajo terminado">
    <figure class="pause__band">
      <div class="pause__frame"><picture data-sc-parallax="0.9"><source media="(max-width: 760px)" srcset="/assets/img/salon-led-2x1.webp" width="820" height="410">${photo('salon-led', PHOTOS['salon-led'], { shape: 'banda' })}</picture></div>
      <figcaption class="sc-wrap"><span class="label">Terminado</span> Salón con techo de placas, foseado e iluminación LED. <a class="link-arrow" href="/proyectos/techos-y-acabados/">Ver más techos ${icon.arrow}</a></figcaption>
    </figure>
  </section>

  <section id="por-que" class="why ground-paper" data-sc-act="flow" aria-labelledby="why-h">
    <div class="sc-wrap">
      <div class="sec-head"><p class="label">Por qué nos llaman</p><h2 id="why-h" class="display display--md">Lo que cuidamos en cada obra, y quién lo dice</h2></div>
      <ol class="why__list" data-sc-in data-sc-stagger="90">${why.map(([t, d, q], i) => `<li>
        <span class="why__n">${pad(i + 1)}</span>
        <h3>${esc(t)}</h3>
        <p>${esc(d)}</p>
        <blockquote class="why__q"><p>«${esc(q.text)}${q.text.endsWith('.') ? '' : '…'}»</p><footer>${esc(q.author)}${q.author.startsWith('Frase') ? '' : ' · reseña de Google'}</footer></blockquote>
      </li>`).join('')}</ol>
    </div>
  </section>

  <section id="obra" class="phase ground-plaster" data-sc-act="pin" data-sc-span="2.4" data-mobile-flow aria-labelledby="phase-h">
    <div class="phase__stage" data-sc-stage>
      <div class="sc-wrap phase__grid">
        <div class="phase__copy">
          <p class="label">Una obra real, fase a fase</p>
          <h2 id="phase-h" class="display display--md">${esc(proj.title)}</h2>
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

  <section id="metodo" class="steps" data-sc-act="flow" aria-labelledby="method-h">
    <div class="sc-wrap">
      <div class="sec-head sec-head--split">
        <div><p class="label">Cómo trabajamos</p><h2 id="method-h" class="display display--md">Del primer mensaje a la entrega</h2></div>
        <p class="lede">Seis pasos. En cada uno sabes qué toca y con quién hablar.</p>
      </div>
      <ol class="steps__list">${METHOD.map(([t, d], i) => `<li><span class="steps__dot" aria-hidden="true"></span><span class="steps__n">${pad(i + 1)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ol>
      <div class="cta-pair steps__cta">
        <a class="btn btn--accent btn--lg" href="#presupuesto" data-track="click_cta" data-track-loc="metodo">Empezar por el paso 1</a>
        <a class="link-arrow" href="/como-trabajamos/">Ver el método completo ${icon.arrow}</a>
      </div>
    </div>
  </section>

  <section id="dudas" class="dudas ground-paper" data-sc-act="flow" aria-labelledby="faq-h">
    <div class="sc-wrap dudas__grid">
      <div class="dudas__aside">
        <p class="label">Dudas</p>
        <h2 id="faq-h" class="display display--md">Antes de pedir presupuesto</h2>
        <p class="dudas__call">¿Prefieres hablarlo? <a href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="dudas">${SITE.phone}</a><br><span>${esc(SITE.hours)}</span></p>
      </div>
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
const SVC_REVIEWS = { 'reformas-integrales': ['Biviana', 'Nicki1309 S', 'sweetie001 sweetie001'], pinturas: ['Alberto López', 'Ana Maria Coarda', 'Nicki1309 S'], insonorizacion: ['Jorge García', 'Adrian', 'Alicia P.'] };
export function service(s) {
  const path = svcUrl(s.slug);
  const related = PROJECTS.filter((p) => p.service === s.slug || (s.slug === 'pinturas' && p.slug === 'insonorizacion-de-una-habitacion'));
  const ld = [businessJsonLd(), breadcrumbLd([['Inicio', '/'], ['Servicios', '/servicios/'], [s.nav, path]]),
    { '@context': 'https://schema.org', '@type': 'Service', name: s.h1, serviceType: s.nav, description: s.description, url: `${SITE.origin}${path}`, provider: { '@id': `${SITE.origin}/#empresa` } }];
  if (s.faqs) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  const others = SERVICES.filter((x) => x.slug !== s.slug && (s.main ? x.main : true)).slice(0, 4);
  return `${head({ title: s.title, description: s.description, path, jsonld: ld })}
<body class="page-inner">
${header({ current: s.slug })}
<main id="contenido">
  <section class="page-hero" data-sc-act="flow" aria-labelledby="pg-h">
    <div class="sc-wrap">
      ${crumbs([['Inicio', '/'], ['Servicios', '/servicios/'], [s.nav, path]])}
      <h1 id="pg-h" class="display display--lg">${esc(s.h1)}</h1>
      <p class="lede">${esc(s.lede)}</p>
      <div class="cta-pair">
        <a class="btn btn--accent btn--lg" href="#presupuesto" data-track="click_cta" data-track-loc="svc-${s.slug}">Solicitar presupuesto</a>
        <a class="btn btn--line btn--lg" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="svc-${s.slug}">${icon.phone}<span>Llamar · ${SITE.phone}</span></a>
      </div>
      ${googleBadge(`svc-${s.slug}`, 'gbadge--inline')}
    </div>
    ${s.band ? `<figure class="page-band" data-sc-reveal="iris" data-sc-reveal-at="0 0.22">${photo(s.band, PHOTOS[s.band], { shape: 'banda', lazy: false })}<figcaption>Foto de obra de Pro Reforma</figcaption></figure>` : ''}
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

  ${reviewsBand(SVC_REVIEWS[s.slug] || ['Alicia P.', 'Alberto López'], { title: s.main ? `Opiniones sobre ${s.nav.toLowerCase()}` : 'Opiniones en Google', loc: `svc-${s.slug}` })}

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
  return `${head({ title: 'Proyectos de reformas en Rivas-Vaciamadrid | Pro Reforma', description: 'Fotos reales de obras de Pro Reforma: una insonorización fase a fase, techos de placas e iluminación, y reseñas de clientes en Google.', path, jsonld: [businessJsonLd(), breadcrumbLd([['Inicio', '/'], ['Proyectos', path]])] })}
<body class="page-inner">
${header({ current: 'proyectos' })}
<main id="contenido">
  <section class="page-hero" data-sc-act="flow" aria-labelledby="pg-h">
    <div class="sc-wrap">
      ${crumbs([['Inicio', '/'], ['Proyectos', path]])}
      <h1 id="pg-h" class="display display--lg">Proyectos</h1>
      <p class="lede">Solo fotos de obras reales publicadas por Pro Reforma, y lo que cuentan los clientes en sus reseñas de Google.</p>
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
  ${reviewsBand(['Biviana', 'Jorge García', 'Alberto López'], { title: 'Trabajos que cuentan los clientes', loc: 'proyectos' })}
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
  ${reviewsBand(['Alicia P.', 'Nicki1309 S', 'Alberto López'], { title: 'Lo que dicen de Daniel y su equipo', loc: 'sobre' })}
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
${footer({ quoteHere: false })}
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
<h2>Solicitud de presupuesto</h2><ul><li><strong>Datos:</strong> nombre, teléfono o correo, tipo de trabajo y lo que escribas sobre la obra.</li><li><strong>Finalidad:</strong> responderte, concertar la visita y preparar el presupuesto.</li><li><strong>Base jurídica:</strong> medidas precontractuales a petición tuya (art. 6.1.b RGPD).</li><li><strong>Conservación:</strong> mientras se gestiona la solicitud y, si no se contrata, un máximo de un año.</li><li>No usamos estos datos para enviarte publicidad.</li></ul>
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
  return simplePage({ path: '/envio-no-completado/', title: 'No se ha podido enviar | Pro Reforma', description: 'No se ha podido enviar la solicitud.', h1: 'No se ha podido enviar', noindex: true, body: `<p class="lede">Revisa que hayas indicado tu nombre y un teléfono o un correo válidos, y vuelve a intentarlo.</p><p>También puedes llamar o escribir por WhatsApp al <a href="${SITE.phoneHref}">${SITE.phone}</a>, o escribir a <a href="mailto:${SITE.email}">${SITE.email}</a>.</p><p><a class="link-arrow" href="/contacto/">Volver al formulario ${icon.arrow}</a></p>` });
}
export function notFound() {
  return simplePage({ path: '/404.html', title: 'Página no encontrada | Pro Reforma', description: 'La página que buscas no existe.', h1: 'Esta página no existe', noindex: true, body: `<p class="lede">Puede que la dirección haya cambiado con la nueva web.</p><ul>${SERVICES.map((s) => `<li><a href="${svcUrl(s.slug)}">${esc(s.nav)}</a></li>`).join('')}<li><a href="/proyectos/">Proyectos</a></li></ul><p><a class="btn btn--accent" href="/contacto/#presupuesto">Solicitar presupuesto</a></p>` });
}
