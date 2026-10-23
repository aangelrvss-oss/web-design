// Portada de MRI V2. Las páginas interiores se generan con las plantillas de la
// V1 (ver build.mjs); aquí solo vive lo que la V2 cambia.
import { SITE, CREDENTIALS, NEEDS, SECTORS, HOME_FAQS } from '../../mr-instalaciones/src/data.mjs';
import { head, header, footer, quoteForm, contactBlock, esc, businessJsonLd } from '../../mr-instalaciones/src/layout.mjs';
import { picto, icon } from '../../mr-instalaciones/src/pictos.mjs';
import { FILM } from './film.mjs';

export const ASSET_V = '20261023a';
const a = (p) => `${p}?v=${ASSET_V}`;

const r3 = (x) => Math.round(x * 1000) / 1000;

// ------------------------------------------------------------ secuencia --
// Convierte los tiempos del clip (segundos) en ventanas de progreso del acto.
// Con clipMap 'travel' el clip entero se reparte sobre el tramo fijado, así
// que progreso = t / duración. Con el reparto por defecto del motor (toda la
// vida visible del escenario, en un acto que empieza en lo alto del
// documento) el tramo fijado solo cubre (span - 1) / span del clip y
// progreso = (t / duración) * span / (span - 1).
function filmTimeline(meta) {
  const k = FILM.clipMap === 'travel' ? 1 : FILM.span / (FILM.span - 1);
  const p = (t) => (t / meta.duration) * k;
  const first = FILM.heroOut + 0.02;
  return FILM.scenes.map((s, i) => {
    const last = i === FILM.scenes.length - 1;
    const from = Math.max(p(s.t0), first);
    const to = last ? 1 : Math.min(p(s.t1), 1);
    // La última escena no se apaga: sale con el escenario, que se lleva el
    // plano final del clip.
    const cue = last ? `${r3(from)} 1 0.18 0` : `${r3(from)} ${r3(to)} 0.16 0.16`;
    return { ...s, from: r3(from), to: r3(to), cue, c0: r3(s.t0 / meta.duration), c1: r3(Math.min(s.t1 / meta.duration, 1)) };
  });
}

const arrow = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const down = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v15M6 13l6 6 6-6"/></svg>';

function film(meta) {
  const tl = filmTimeline(meta);
  const v = meta.v;
  const H = FILM.hero;
  const caps = tl.map((s) => `<div class="cap-veil cap-veil--${s.side}" data-veil="${s.key}" aria-hidden="true"></div>
      <article class="cap cap--${s.side}" id="escena-${s.key}" data-sc-cue="${s.cue}" data-scene="${s.key}" aria-labelledby="cap-${s.key}">
        <p class="cap__k">${esc(s.kicker)}</p>
        <h2 class="cap__h" id="cap-${s.key}">${esc(s.title)}</h2>
        <p class="cap__t">${esc(s.text)}</p>
        <p class="cap__links">${s.links.map(([href, label]) => `<a class="cap__a" href="${href}" data-track="click_scene" data-track-loc="${s.key}">${esc(label)} ${icon.arrow}</a>`).join('')}</p>
      </article>`).join('\n      ');
  const rail = tl.map((s) => `<li><a class="rail__i" href="#escena-${s.key}" data-goto="${s.key}"><span class="rail__l">${esc(s.rail)}</span><span class="rail__bar" aria-hidden="true"><i></i></span></a></li>`).join('');
  const dims = `width="${meta.width}" height="${meta.height}"`;
  const stills = tl.map((s) => `<img class="film__still" data-still="${s.key}" src="/assets/film/still-${s.key}.webp?v=${v.poster}" ${dims} alt="" loading="lazy" decoding="async">`).join('\n        ');
  // Lo que film.js necesita saber y el HTML no dice.
  const cfg = { heroOut: FILM.heroOut, heroFade: FILM.heroFade, travel: FILM.clipMap === 'travel', duration: meta.duration, scenes: tl.map(({ key, c0, c1, from, to, focal, side }) => ({ key, c0, c1, from, to, focal, side })) };

  // El vídeo es la portada desde el primer instante: póster (= primer
  // fotograma) y clip a sangre, y encima, sin franja ni marco, el hero. El
  // titular no es un cue del motor (el motor oculta los cues hasta montarse):
  // se ve desde el primer pintado y se retira con --sc-p.
  return `<section class="film" id="inicio" data-sc-act="scrub" data-sc-span="${FILM.span}"${FILM.clipMap === 'travel' ? ' data-sc-clip-map="travel"' : ''} aria-labelledby="hero-h" data-film="${esc(JSON.stringify(cfg))}">
    <div class="film__stage" data-sc-stage>
      <div class="film__media">
        <img class="sc-stage__poster film__poster" src="/assets/film/poster.webp?v=${v.poster}" ${dims} alt="" fetchpriority="high">
        <video data-sc-scrub data-sc-src="/assets/film/film.mp4?v=${v.mp4}" data-webm="/assets/film/film.webm?v=${v.webm}" muted playsinline preload="none" disablepictureinpicture aria-hidden="true" tabindex="-1"></video>
      </div>
      <div class="film__stills">
        ${stills}
      </div>
      <div class="film__shade" aria-hidden="true"></div>
      <div class="hero" data-film-hero>
        <div class="hero__veil" aria-hidden="true"></div>
        <div class="hero__copy">
          <p class="hero__k">${esc(H.kicker)}</p>
          <h1 id="hero-h" class="hero__h">El confort<br class="br-m"> empieza<br class="br-d"> <em>donde<br class="br-m"> no lo ves.</em></h1>
          <p class="hero__lede">${esc(H.lede)}</p>
          <div class="hero__cta">
            <a class="cta" href="#presupuesto" data-track="click_cta" data-track-loc="hero"><span>Pedir presupuesto</span><span class="cta__arr">${arrow}</span></a>
            <a class="cta-2" href="#escena-${tl[0].key}" data-film-start>${esc(H.discover)} ${down}</a>
          </div>
        </div>
        <div class="hero__scroll" aria-hidden="true"><span>Desliza</span><i></i></div>
      </div>
      <div class="film__caps">
      ${caps}
      </div>
      <nav class="film__rail" aria-label="Escenas de la secuencia"><ol>${rail}</ol></nav>
      <p class="vh">Secuencia de una vivienda: climatización del salón, sala técnica con aerotermia y fontanería, y ventilación en el falso techo. El texto de cada escena está en esta misma sección.</p>
    </div>
  </section>`;
}

// --------------------------------------------------------- resto de la home --
const faqList = (faqs) => `<div class="faq">${faqs.map(([q, ans]) => `<details class="faq__i"><summary><span>${esc(q)}</span><span class="faq__x" aria-hidden="true"></span></summary><p>${esc(ans)}</p></details>`).join('')}</div>`;

export function home(meta) {
  const needs = NEEDS.map((n) => {
    const href = n.href || `/servicios/${n.service}/`;
    return `<li><a class="needs__row" href="${href}" data-track="click_need" data-track-loc="${n.service || 'empresas'}"><span class="needs__q">${esc(n.need)}</span><span class="needs__a">${esc(n.label)} ${icon.arrow}</span></a></li>`;
  }).join('');

  const creds = CREDENTIALS.map((c) => `<div class="cred__row"><dt>${esc(c.short)}</dt><dd><span class="cred__d">${esc(c.detail)}</span><span class="cred__w">${esc(c.why)}</span></dd></div>`).join('');

  const sectorIds = { hogar: 'domestico', comercio: 'comercial', industria: 'industrial', obra: 'nuevaconstruccion' };
  const sectors = SECTORS.map((s) => `<article class="sect__item" id="${sectorIds[s.key]}" aria-labelledby="sect-${s.key}">
        <div class="sect__picto">${picto[s.picto]}</div>
        <h3 id="sect-${s.key}" class="sect__t">${esc(s.title)}</h3>
        <p class="sect__p">${esc(s.text)}</p>
        <ul class="sect__l">${s.list.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
      </article>`).join('\n      ');

  return `${head({
    title: 'Instaladores de fontanería y climatización en Rivas-Vaciamadrid | MRI',
    description: 'Fontanería, calefacción, aerotermia, gas, ventilación y domótica para hogares, empresas y obra nueva. Empresa instaladora habilitada en Rivas-Vaciamadrid.',
    path: '/',
    jsonld: [businessJsonLd(), { '@context': 'https://schema.org', '@type': 'WebSite', name: 'MRI · Martínez Rojas Instalaciones', url: `${SITE.origin}/`, inLanguage: 'es' }],
  }).replace('</head>', `<link rel="preload" href="/assets/film/poster.webp?v=${meta.v.poster}" as="image" fetchpriority="high">
</head>`)}
<body class="page-home">
<span data-sc-progress></span>
${header()}
<main id="contenido">

  ${film(meta)}

  <section id="servicios" class="needs" data-sc-act="flow" aria-labelledby="needs-h">
    <div class="sc-wrap needs__grid">
      <div class="needs__lead">
        <p class="eyebrow">${esc(FILM.outro.title)}</p>
        <h2 id="needs-h" class="d-lg">¿Qué necesitas resolver?</h2>
        <p class="needs__p">${esc(FILM.outro.text)} Elige tu caso y te llevamos al servicio.</p>
      </div>
      <ol class="needs__list" data-sc-in data-sc-stagger="40">${needs}</ol>
    </div>
  </section>

  <section id="habilitaciones" class="creds" data-sc-act="flow" aria-labelledby="creds-h">
    <div class="sc-wrap creds__grid">
      <div class="creds__text" data-sc-in data-sc-stagger="60">
        <h2 id="creds-h" class="d-md">Habilitados para hacerlo, y lo puedes comprobar</h2>
        <p class="creds__lede">Calefacción, climatización, agua caliente y gas son instalaciones reguladas: solo pueden ejecutarlas empresas inscritas.</p>
        <p class="creds__body">Cada documento lleva un código seguro de verificación que puedes consultar en la sede electrónica de la Comunidad de Madrid.</p>
        <a class="link-arrow" href="/certificaciones/">Ver documentos y códigos ${icon.arrow}</a>
      </div>
      <figure class="cred" data-sc-reveal="left" data-sc-reveal-at="0.08 0.36">
        <p class="cred__head"><span class="cred__k">Titular</span><strong>${esc(SITE.legalName)}</strong><span>NIF ${SITE.taxId} · Comunidad de Madrid</span></p>
        <dl class="cred__rows">${creds}</dl>
        <figcaption class="vh">Resumen de las inscripciones oficiales de ${esc(SITE.legalName)}</figcaption>
      </figure>
    </div>
  </section>

  <section id="sectores" class="sect" data-sc-act="pan" data-sc-span="3.2" aria-labelledby="sect-h">
    <div class="sect__stage" data-sc-stage>
      <div class="sect__rail" data-sc-pan="0.04">
      <div class="sect__lead">
        <h2 id="sect-h" class="d-lg">Para quién trabajamos</h2>
        <p class="sect__intro">Las mismas instalaciones, adaptadas a cada tipo de edificio.</p>
      </div>
      ${sectors}
      <div class="sect__note">
        <p class="sect__note-h">¿Eres promotora, constructora o empresa?</p>
        <p>Estamos inscritos en el Registro de Empresas Acreditadas del sector de la construcción.</p>
        <a class="link-arrow" href="/empresas-y-obra-nueva/">Empresas y obra nueva ${icon.arrow}</a>
      </div>
      </div>
    </div>
  </section>

  <section id="dudas" class="dudas" data-sc-act="flow" aria-labelledby="faq-h">
    <div class="sc-wrap dudas__grid">
      <h2 id="faq-h" class="d-lg">Dudas frecuentes</h2>
      ${faqList(HOME_FAQS)}
    </div>
  </section>

  <section id="presupuesto" class="close" data-sc-act="flow" aria-labelledby="close-h">
    <div class="sc-wrap close__grid">
      <div class="close__aside" id="contacto">
        <h2 id="close-h" class="d-xl">Pide tu presupuesto</h2>
        <p class="close__lede">Cuéntanos qué necesitas y dónde. Si lo prefieres, llámanos o escríbenos.</p>
        ${contactBlock()}
      </div>
      <div class="close__form">
        <p class="tb__title"><span>Tu proyecto</span><span>MRI · Rivas-Vaciamadrid</span></p>
        ${quoteForm({ origin: 'home' })}
      </div>
    </div>
  </section>
</main>
${footer()}
<script src="${a('/assets/js/film.js')}" defer></script>
<script src="${a('/assets/vendor/scrollcraft/scrollcraft.js')}" defer></script>
<script src="${a('/assets/js/site.js')}" defer></script>
</body>
</html>`;
}
