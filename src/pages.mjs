import { SITE, SERVICES, SYSTEMS, CREDENTIALS, NEEDS, SECTORS, HOME_FAQS } from './data.mjs';
import { head, header, footer, scripts, quoteForm, contactBlock, esc, businessJsonLd, breadcrumbLd } from './layout.mjs';
import { house } from './house.mjs';
import { heroPipe, picto, icon } from './pictos.mjs';

const svcBySlug = Object.fromEntries(SERVICES.map((s) => [s.slug, s]));

const ctaPair = (loc) => `<div class="cta-pair">
  <a class="btn btn--accent btn--lg" href="#presupuesto" data-track="click_cta" data-track-loc="${loc}">Pedir presupuesto</a>
  <a class="btn btn--line btn--lg" href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="${loc}">${icon.phone}<span>Llamar al ${SITE.phone}</span></a>
</div>`;

const faqList = (faqs) => `<div class="faq">${faqs.map(([q, a]) => `<details class="faq__i"><summary><span>${esc(q)}</span>${icon.chevron}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;

const plate = (items, { head: h = true } = {}) => `<div class="plate__in">
  ${h ? `<p class="plate__head"><span class="plate__k">Titular</span><strong>${esc(SITE.legalName)}</strong><span>NIF ${SITE.taxId} · Comunidad de Madrid</span></p>` : ''}
  <dl class="plate__rows">${items.map((c) => `<div class="plate__row"><dt>${esc(c.short)}</dt><dd>${esc(c.detail)}</dd></div>`).join('')}</dl>
</div>`;

const closeSection = ({ preset = [], origin, heading = 'Pide tu presupuesto', lede }) => `<section id="presupuesto" class="close ground-dark" data-sc-act="flow" aria-labelledby="close-h">
  <div class="sc-wrap close__grid">
    <div class="close__aside" id="contacto">
      <h2 id="close-h" class="sc-display sc-display--lg" data-sc-cue="0.02" data-sc-kinetic="lines">${esc(heading)}</h2>
      <p class="sc-lede close__lede">${esc(lede || 'Cuéntanos qué necesitas y dónde. Si lo prefieres, llámanos o escríbenos.')}</p>
      ${contactBlock()}
    </div>
    <div class="close__form">
      <p class="tb__title"><span>Tu proyecto</span><span>MRI · Rivas-Vaciamadrid</span></p>
      ${quoteForm({ preset, origin })}
    </div>
  </div>
</section>`;

// ------------------------------------------------------------------ home --
export function home() {
  const peakCopy = {
    agua: ['Agua fría y caliente', 'Desde la acometida hasta cada grifo, y la producción de agua caliente sanitaria. Instalación nueva, reforma o renovación de aparatos sanitarios.', 'fontaneria-saneamiento', 'Fontanería y saneamiento'],
    saneamiento: ['Saneamiento', 'Desagües, bajantes y arquetas hasta la red general. La parte que no se ve y que más problemas da cuando se ejecuta mal.', 'fontaneria-saneamiento', 'Fontanería y saneamiento'],
    calefaccion: ['Calefacción', 'Suelo radiante o refrescante, radiadores, conductos o equipos individuales, alimentados por aerotermia, gas, gasóleo, biomasa o geotermia.', 'calefaccion-climatizacion', 'Calefacción y climatización'],
    aerotermia: ['Aerotermia', 'Una máquina exterior que da calefacción, refrigeración y agua caliente, conectada a los emisores de la casa.', 'aerotermia', 'Aerotermia'],
    ventilacion: ['Ventilación', 'Renovación continua del aire: autorregulable, higrorregulable o con recuperación de energía.', 'ventilacion', 'Ventilación'],
    gas: ['Gas', 'Instalaciones receptoras comunes e individuales de gas canalizado, botellas de GLP y depósitos. Empresa instaladora de gas de categoría A.', 'instalaciones-de-gas', 'Gas'],
    domotica: ['Domótica', 'Un solo sistema para controlar la climatización, la iluminación y los equipos de producción.', 'domotica', 'Domótica'],
  };
  const windows = [[0.095, 0.205], [0.205, 0.315], [0.315, 0.425], [0.425, 0.535], [0.535, 0.645], [0.645, 0.755], [0.755, 0.86]];
  const cues = SYSTEMS.map((s, i) => {
    const [k, t, slug, lab] = peakCopy[s.key];
    return `<div class="pc" data-sc-cue="${windows[i][0]} ${windows[i][1]} 0.14 0.14" data-pc="${s.key}">
        <p class="pc__k"><i class="sw sw--${s.key}" aria-hidden="true"></i>${esc(k)}</p>
        <p class="pc__t">${esc(t)}</p>
        <a class="pc__a" href="/servicios/${slug}/">${esc(lab)} ${icon.arrow}</a>
      </div>`;
  }).join('\n      ');

  const legend = SYSTEMS.map((s) => `<button type="button" class="lg" data-sys-btn="${s.key}" aria-pressed="false"><i class="sw sw--${s.key}" aria-hidden="true"></i>${esc(s.label)}</button>`).join('');

  const needs = NEEDS.map((n) => {
    const href = n.href || `/servicios/${n.service}/`;
    return `<li><a class="needs__row" href="${href}" data-track="click_need" data-track-loc="${n.service || 'empresas'}"><span class="needs__q">${esc(n.need)}</span><span class="needs__a">${esc(n.label)} ${icon.arrow}</span></a></li>`;
  }).join('');

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
    jsonld: [businessJsonLd(), { '@context': 'https://schema.org', '@type': 'WebSite', name: 'MRI · Martínez Rojas Instalaciones', url: `${SITE.origin}/`, inLanguage: 'es' }].filter(Boolean),
  })}
<body class="page-home">
<span data-sc-progress></span>
${header()}
<main id="contenido">

  <section class="hero" data-sc-act="flow" aria-labelledby="hero-h">
    <div class="hero__scene" aria-hidden="true" data-hero>
      <div class="plane plane--grid" data-sc-parallax="1.8"><div class="plane__pt" data-depth="0.15"></div></div>
      <div class="plane plane--air" data-sc-parallax="1.2"><div class="plane__pt" data-depth="0.3"><span class="air air--warm"></span><span class="air air--cool"></span></div></div>
      <div class="plane plane--house" data-sc-parallax="0.6"><div class="plane__pt" data-depth="0.55">${house({ id: 'h', structureOnly: true })}</div></div>
      <div class="plane plane--pipe" data-sc-parallax="-2.4"><div class="plane__pt" data-depth="1">${heroPipe}</div></div>
    </div>
    <div class="hero__copy sc-wrap">
      <h1 id="hero-h" class="sc-display hero__h">Instaladores de fontanería y climatización</h1>
      <p class="hero__lede">Empresa instaladora habilitada, con sede en Rivas-Vaciamadrid, para hogares, comercios, industria y obra nueva.</p>
      ${ctaPair('hero')}
      <p class="hero__hours">${icon.clock}<span>${SITE.hours}</span></p>
    </div>
  </section>

  <section id="servicios" class="needs" data-sc-act="flow" aria-labelledby="needs-h">
    <div class="sc-wrap">
      <h2 id="needs-h" class="sc-display sc-display--md needs__h">¿Qué necesitas resolver?</h2>
      <ol class="needs__list" data-sc-in data-sc-stagger="45">${needs}</ol>
    </div>
  </section>

  <section id="instalacion" class="peak ground-dark" data-sc-act="pin" data-sc-span="5.2" aria-labelledby="peak-h">
    <div class="peak__stage" data-sc-stage data-peak>
      <div class="peak__draw">${house({ id: 'p', className: 'house--peak', label: 'Sección esquemática de una vivienda de dos plantas con sus instalaciones: agua fría y caliente, saneamiento, calefacción por suelo radiante y radiadores, aerotermia, ventilación con recuperador, gas y domótica.' })}</div>
      <div class="peak__legend">
        <p class="peak__legend-h" id="legend-h">Aísla un sistema</p>
        <div class="lgs" role="group" aria-labelledby="legend-h">${legend}</div>
        <p class="peak__pick" data-pick aria-live="polite"></p>
      </div>
      <div class="peak__copy">
      <div class="pc pc--intro" data-sc-cue="0 0.1 0 0.14">
        <h2 id="peak-h" class="sc-display sc-display--md">Todas las instalaciones de una casa, en un mismo plano</h2>
        <p class="pc__t">Cada sistema se dibuja en su sitio. Marca en la leyenda los que te interesan: llegarán marcados a tu solicitud de presupuesto.</p>
      </div>
      ${cues}
      <div class="pc pc--end" data-sc-cue="0.86 1.08 0.12 0.01">
        <p class="sc-display sc-display--md pc__end-h">Una sola empresa para que todo encaje</p>
        <p class="pc__t">Proyectadas y ejecutadas juntas, las instalaciones comparten recorridos, espacio y control.</p>
        <a class="btn btn--accent" href="#presupuesto" data-track="click_cta" data-track-loc="peak">Pedir presupuesto</a>
      </div>
      </div>
    </div>
  </section>

  <section id="habilitaciones" class="creds" data-sc-act="flow" aria-labelledby="creds-h">
    <div class="sc-wrap creds__grid">
      <div class="creds__text" data-sc-in data-sc-stagger="60">
        <h2 id="creds-h" class="sc-display sc-display--md">Habilitados para hacerlo, y lo puedes comprobar</h2>
        <p class="sc-lede">Calefacción, climatización, agua caliente y gas son instalaciones reguladas: solo pueden ejecutarlas empresas inscritas.</p>
        <p class="sc-body">Estas son nuestras inscripciones. Cada documento lleva un código seguro de verificación que puedes consultar en la sede electrónica de la Comunidad de Madrid.</p>
        <a class="link-arrow" href="/certificaciones/">Ver documentos y códigos ${icon.arrow}</a>
      </div>
      <figure class="plate" data-sc-reveal="left" data-sc-reveal-at="0.1 0.4">
        ${plate(CREDENTIALS)}
        <figcaption class="vh">Resumen de las inscripciones oficiales de ${esc(SITE.legalName)}</figcaption>
      </figure>
    </div>
  </section>

  <section id="dudas" class="dudas" data-sc-act="flow" aria-labelledby="faq-h">
    <div class="sc-wrap dudas__grid">
      <h2 id="faq-h" class="sc-display sc-display--md">Dudas frecuentes</h2>
      ${faqList(HOME_FAQS)}
    </div>
  </section>

  <section id="sectores" class="sect" data-sc-act="pan" data-sc-span="3.4" aria-labelledby="sect-h">
    <div class="sect__stage" data-sc-stage>
      <div class="sect__rail" data-sc-pan="0.04">
      <div class="sect__lead">
        <h2 id="sect-h" class="sc-display sc-display--md">Para quién trabajamos</h2>
        <p class="sc-lede">Las mismas instalaciones, adaptadas a cada tipo de edificio.</p>
      </div>
      ${sectors}
      <div class="sect__note">
        <p class="sc-lede">¿Eres promotora, constructora o empresa?</p>
        <p class="sc-body">Estamos inscritos en el Registro de Empresas Acreditadas del sector de la construcción.</p>
        <a class="link-arrow" href="/empresas-y-obra-nueva/">Empresas y obra nueva ${icon.arrow}</a>
      </div>
      </div>
    </div>
  </section>

  ${closeSection({ origin: 'home' })}
</main>
${footer()}
${scripts()}`;
}

// --------------------------------------------------------------- service --
export function service(s) {
  const path = `/servicios/${s.slug}/`;
  const creds = CREDENTIALS.filter((c) => s.credentials.includes(c.short));
  const related = s.related.map((r) => svcBySlug[r]);
  const ld = [
    businessJsonLd(),
    breadcrumbLd([['Inicio', '/'], ['Servicios', '/#servicios'], [s.nav, path]]),
    {
      '@context': 'https://schema.org', '@type': 'Service', name: s.h1, serviceType: s.nav,
      description: s.description, url: `${SITE.origin}${path}`,
      provider: { '@id': `${SITE.origin}/#empresa` },
    },
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
      <figure class="svc-hero__draw" data-sc-in>
        ${house({ id: s.slug.slice(0, 4), className: 'house--focus', label: `Esquema de una vivienda con la instalación de ${s.nav.toLowerCase()} resaltada` }).replace(/data-sys="(\w+)"/g, (m, k) => `${m}${s.layer.includes(k) ? ' data-focus' : ''}`)}
        <figcaption>Esquema ilustrativo. ${s.layer.map((k) => SYSTEMS.find((x) => x.key === k).label).join(' y ')} resaltado.</figcaption>
      </figure>
    </div>
  </section>

  <section class="svc-does sc-section" aria-labelledby="does-h">
    <div class="sc-wrap">
      <h2 id="does-h" class="sc-display sc-display--md">Qué hacemos</h2>
      <ul class="does" data-sc-in data-sc-stagger="40">${s.does.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ul>
    </div>
  </section>

  <section class="svc-know sc-section ground-steel" aria-labelledby="know-h">
    <div class="sc-wrap know__grid">
      <div class="know__text">
        <h2 id="know-h" class="sc-display sc-display--md">Lo que conviene saber</h2>
        ${s.know.map(([t, d]) => `<article class="know"><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}
      </div>
      ${creds.length ? `<aside class="plate plate--aside" aria-label="Habilitaciones relacionadas">${plate(creds)}<a class="link-arrow" href="/certificaciones/">Comprobar documentos ${icon.arrow}</a></aside>` : ''}
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
    <ul>${related.map((r) => `<li><a href="/servicios/${r.slug}/">${esc(r.nav)} ${icon.arrow}</a></li>`).join('')}</ul>
  </nav>

  ${closeSection({ preset: [s.slug], origin: s.slug, heading: 'Pide tu presupuesto', lede: `Cuéntanos tu caso de ${s.nav.toLowerCase()} y dónde está la obra. Si lo prefieres, llámanos o escríbenos.` })}
</main>
${footer()}
${scripts()}`;
}

// -------------------------------------------------------------- empresas --
export function empresas() {
  const path = '/empresas-y-obra-nueva/';
  const rea = CREDENTIALS.filter((c) => ['REA', 'Instaladora RITE', 'Mantenedora RITE', 'Gas categoría A'].includes(c.short));
  const blocks = SECTORS.filter((s) => s.key !== 'hogar').map((s) => `<article class="emp" aria-labelledby="emp-${s.key}">
      <div class="emp__picto">${picto[s.picto]}</div>
      <div><h3 id="emp-${s.key}">${esc(s.title)}</h3><p>${esc(s.text)}</p><ul class="sect__l">${s.list.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>
    </article>`).join('');
  return `${head({
    title: 'Instalaciones para empresas, comercios y obra nueva | MRI',
    description: 'Fontanería, climatización, ventilación, gas y domótica para locales, naves, promotoras y constructoras. Inscritos en el REA y como empresa RITE.',
    path, jsonld: [businessJsonLd(), breadcrumbLd([['Inicio', '/'], ['Empresas y obra nueva', path]])],
  })}
<body class="page-svc">
${header({ current: 'empresas' })}
<main id="contenido">
  <section class="svc-hero svc-hero--plain" data-sc-act="flow" aria-labelledby="emp-h">
    <div class="sc-wrap">
      <nav class="crumbs" aria-label="Ruta de navegación"><ol><li><a href="/">Inicio</a></li><li aria-current="page">Empresas y obra nueva</li></ol></nav>
      <h1 id="emp-h" class="sc-display sc-display--lg">Instalaciones para empresas, comercios y obra nueva</h1>
      <p class="sc-lede">Fontanería y saneamiento, climatización, ventilación, gas y domótica para locales, naves y promociones, con la documentación que exige una obra.</p>
      ${ctaPair('emp-hero')}
    </div>
  </section>
  <section class="sc-section" aria-labelledby="emp-s">
    <div class="sc-wrap">
      <h2 id="emp-s" class="sc-display sc-display--md">Tres tipos de cliente, tres formas de trabajar</h2>
      <div class="emps" data-sc-in data-sc-stagger="60">${blocks}</div>
    </div>
  </section>
  <section class="svc-know sc-section ground-steel" aria-labelledby="emp-doc">
    <div class="sc-wrap know__grid">
      <div class="know__text">
        <h2 id="emp-doc" class="sc-display sc-display--md">Documentación en regla</h2>
        <article class="know"><h3>Subcontratación en construcción</h3><p>Para intervenir como contratista o subcontratista en una obra de construcción, la Ley 32/2006 exige estar inscrito en el Registro de Empresas Acreditadas (REA). MRI figura inscrita con el número 12-28-0112372.</p></article>
        <article class="know"><h3>Instalaciones térmicas y de gas</h3><p>Estamos inscritos como empresa instaladora y mantenedora de instalaciones térmicas en edificios (RITE) y como empresa instaladora de gas de categoría A, con el registro industrial 201986 de la Comunidad de Madrid.</p></article>
        <article class="know"><h3>Mantenimiento</h3><p>Como empresa mantenedora RITE podemos hacernos cargo del mantenimiento de las instalaciones térmicas de locales y edificios.</p></article>
      </div>
      <aside class="plate plate--aside" aria-label="Inscripciones">${plate(rea)}<a class="link-arrow" href="/certificaciones/">Comprobar documentos ${icon.arrow}</a></aside>
    </div>
  </section>
  ${closeSection({ origin: 'empresas', lede: 'Cuéntanos el proyecto, el tipo de edificio y la localidad. Si lo prefieres, llámanos o escríbenos.' })}
</main>
${footer()}
${scripts()}`;
}

// -------------------------------------------------------- certificaciones --
export function certificaciones() {
  const path = '/certificaciones/';
  const rows = CREDENTIALS.map((c) => `<li class="cert">
      <div class="cert__main"><h2 class="cert__n">${esc(c.name)}</h2><p class="cert__d">${esc(c.detail)}</p><p class="cert__w">${esc(c.why)}</p></div>
      <dl class="cert__meta"><div><dt>Código seguro de verificación</dt><dd class="mono">${c.csv}</dd></div></dl>
      <a class="cert__pdf" href="${c.file}" data-track="click_cert_pdf">${icon.doc}<span>Ver documento (PDF)</span></a>
    </li>`).join('');
  return `${head({
    title: 'Certificaciones y habilitaciones | MRI · Martínez Rojas Instalaciones',
    description: 'Instaladora y mantenedora RITE, gas categoría A, gases fluorados y REA. Registro industrial 201986 de la Comunidad de Madrid, con códigos de verificación.',
    path, jsonld: [businessJsonLd(), breadcrumbLd([['Inicio', '/'], ['Certificaciones', path]])],
  })}
<body class="page-doc">
${header({ current: 'certificaciones', form: false })}
<main id="contenido">
  <section class="svc-hero svc-hero--plain" aria-labelledby="cert-h">
    <div class="sc-wrap">
      <nav class="crumbs" aria-label="Ruta de navegación"><ol><li><a href="/">Inicio</a></li><li aria-current="page">Certificaciones</li></ol></nav>
      <h1 id="cert-h" class="sc-display sc-display--lg">Certificaciones y habilitaciones</h1>
      <p class="sc-lede">Inscripciones oficiales de ${esc(SITE.legalName)} Cada documento se puede verificar en <a href="https://www.madrid.org/csv" rel="noopener">www.madrid.org/csv</a> con su código seguro de verificación.</p>
    </div>
  </section>
  <section class="sc-section certs-sec">
    <div class="sc-wrap"><ul class="certs">${rows}</ul>
    <p class="sc-body certs__note">Las actas de empresa instaladora y mantenedora RITE y de empresa instaladora de gas indican caducidad indefinida. Si necesitas un certificado actualizado para una obra, pídenoslo.</p></div>
  </section>
</main>
${footer()}
${scripts()}`;
}

// --------------------------------------------------------- simple pages --
function simplePage({ path, title, description, h1, body, noindex = false, cls = 'page-doc', current = '' }) {
  return `${head({ title, description, path, noindex, jsonld: noindex ? [] : [breadcrumbLd([['Inicio', '/'], [h1, path]])] })}
<body class="${cls}">
${header({ current, form: false })}
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

export function trabaja() {
  return simplePage({
    path: '/trabaja-con-nosotros/',
    title: 'Trabaja con nosotros | MRI · Martínez Rojas Instalaciones',
    description: 'Si eres profesional de la fontanería, la calefacción, la climatización o el gas, envíanos tu currículum.',
    h1: 'Trabaja con nosotros',
    body: `<p class="sc-lede">Si eres profesional de la fontanería, la calefacción, la climatización, la ventilación o el gas y quieres trabajar con nosotros, envíanos tu currículum.</p>
<p><a class="btn btn--accent" href="mailto:${SITE.email}?subject=Candidatura" data-track="click_email" data-track-loc="empleo">Enviar currículum a ${SITE.email}</a></p>
<p>Indica en el correo tu especialidad, tus carnés o habilitaciones profesionales y la zona en la que vives.</p>
<h2>Tus datos</h2>
<p>Usaremos tu currículum únicamente para procesos de selección de ${esc(SITE.legalName)} Lo conservaremos un máximo de un año, salvo que nos pidas antes su supresión escribiendo a ${SITE.privacyEmail}. Más información en la <a href="/politica-de-privacidad/">política de privacidad</a>.</p>`,
  });
}

export function avisoLegal() {
  return simplePage({
    path: '/aviso-legal/',
    title: 'Aviso legal | MRI · Martínez Rojas Instalaciones',
    description: 'Aviso legal de mrinstalaciones.com: datos del titular, condiciones de uso y legislación aplicable.',
    h1: 'Aviso legal',
    body: `<h2>Titular de la web</h2>
<p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de los datos del titular de este sitio web:</p>
<ul>
<li>Titular: ${esc(SITE.legalName)}</li>
<li>Nombre comercial: Martínez Rojas Instalaciones (MRI)</li>
<li>NIF: ${SITE.taxId}</li>
<li>Domicilio: ${SITE.street}, ${SITE.postalCode} ${SITE.city} (${SITE.region})</li>
<li>Teléfono: <a href="${SITE.phoneHref}">${SITE.phone}</a></li>
<li>Correo electrónico: <a href="mailto:${SITE.email}">${SITE.email}</a></li>
<li>Actividad: instalaciones de fontanería, calefacción y climatización (CNAE 4322)</li>
<li>Empresa instaladora y mantenedora de instalaciones térmicas en edificios y empresa instaladora de gas categoría A: registro industrial ${SITE.registroIndustrial} de la Comunidad de Madrid</li>
</ul>
<h2>Condiciones de uso</h2>
<p>El acceso a esta web no supone el inicio de una relación comercial con ${esc(SITE.legalName)} Quien la utiliza se compromete a hacerlo conforme a la ley, la buena fe y el orden público, y a no realizar ninguna acción que pueda dañar, inutilizar o sobrecargar la web o impedir su normal utilización.</p>
<h2>Propiedad intelectual</h2>
<p>Los contenidos de esta web (textos, dibujos, diseño y logotipos) pertenecen a ${esc(SITE.legalName)} o se usan con autorización. No se permite su reproducción, distribución o modificación sin autorización previa. Los dibujos de instalaciones son esquemas ilustrativos y no corresponden a un proyecto concreto.</p>
<h2>Enlaces externos</h2>
<p>Esta web contiene enlaces a sitios de terceros (por ejemplo, la sede electrónica de la Comunidad de Madrid o Google Maps). ${esc(SITE.legalName)} no se responsabiliza de sus contenidos ni de sus políticas.</p>
<h2>Responsabilidad</h2>
<p>${esc(SITE.legalName)} no se hace responsable de los daños derivados de la falta de disponibilidad de la web, de la presencia de programas maliciosos ajenos a su control o del uso indebido de la web por parte de terceros.</p>
<h2>Protección de datos</h2>
<p>El tratamiento de los datos personales se explica en la <a href="/politica-de-privacidad/">política de privacidad</a>.</p>
<h2>Legislación y jurisdicción</h2>
<p>Las relaciones entre ${esc(SITE.legalName)} y los usuarios de esta web se rigen por la legislación española y se someten a los juzgados y tribunales de Madrid, salvo que la normativa de consumidores establezca otro fuero.</p>`,
  });
}

export function privacidad() {
  return simplePage({
    path: '/politica-de-privacidad/',
    title: 'Política de privacidad | MRI · Martínez Rojas Instalaciones',
    description: 'Cómo trata Martínez Rojas Instalaciones, S.L. los datos personales que recibe a través de esta web: finalidad, base jurídica, conservación y derechos.',
    h1: 'Política de privacidad',
    body: `<p>Esta política explica qué datos personales tratamos cuando nos contactas a través de esta web, para qué y cuáles son tus derechos, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).</p>
<h2>Responsable del tratamiento</h2>
<ul>
<li>${esc(SITE.legalName)} · NIF ${SITE.taxId}</li>
<li>${SITE.street}, ${SITE.postalCode} ${SITE.city} (${SITE.region})</li>
<li>Correo para asuntos de protección de datos: <a href="mailto:${SITE.privacyEmail}">${SITE.privacyEmail}</a></li>
</ul>
<h2>Formulario de solicitud de presupuesto</h2>
<ul>
<li><strong>Datos:</strong> nombre, teléfono y/o correo electrónico, localidad, tipo de inmueble, servicios que te interesan y la descripción que escribas. Te pedimos solo lo necesario para responderte; los campos opcionales están marcados.</li>
<li><strong>Finalidad:</strong> responder a tu solicitud, contactarte para concretarla y preparar el presupuesto.</li>
<li><strong>Base jurídica:</strong> la aplicación de medidas precontractuales a petición tuya (artículo 6.1.b del RGPD).</li>
<li><strong>Conservación:</strong> mientras se gestiona tu solicitud y, si no llega a contratarse ningún trabajo, un máximo de un año. Si se contrata, durante la relación comercial y los plazos legales posteriores.</li>
<li><strong>Comunicaciones comerciales:</strong> no usamos los datos del formulario para enviarte publicidad.</li>
</ul>
<h2>Correo electrónico y teléfono</h2>
<p>Si nos escribes o llamas, trataremos los datos que nos facilites para atender tu consulta, con la misma base jurídica y los mismos plazos.</p>
<h2>Candidaturas</h2>
<p>Los currículos recibidos se usan solo para procesos de selección y se conservan un máximo de un año.</p>
<h2>Destinatarios</h2>
<p>No cedemos tus datos a terceros salvo obligación legal. Los proveedores que alojan esta web y nuestro correo electrónico acceden a ellos únicamente como encargados del tratamiento, con contrato y por cuenta de ${esc(SITE.legalName)}</p>
<h2>Tus derechos</h2>
<p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a <a href="mailto:${SITE.privacyEmail}">${SITE.privacyEmail}</a> o por correo postal a la dirección indicada, identificándote adecuadamente. Si consideras que no hemos atendido correctamente tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">www.aepd.es</a>).</p>
<h2>Seguridad</h2>
<p>La web se sirve cifrada (HTTPS) y aplicamos medidas técnicas y organizativas para proteger tus datos frente a pérdida, alteración o acceso no autorizado.</p>`,
  });
}

export function cookies() {
  return simplePage({
    path: '/politica-de-cookies/',
    title: 'Política de cookies | MRI · Martínez Rojas Instalaciones',
    description: 'Esta web no instala cookies de análisis, publicidad ni de terceros.',
    h1: 'Política de cookies',
    body: `<p class="sc-lede">Esta web no instala cookies ni tecnologías similares de análisis, publicidad o redes sociales, y no carga recursos de terceros al visitarla.</p>
<p>Las fuentes tipográficas y el resto de recursos se sirven desde nuestro propio dominio. Por eso no te mostramos un aviso de cookies.</p>
<p>Los enlaces a sitios externos (por ejemplo, Google Maps o la sede electrónica de la Comunidad de Madrid) te llevan a servicios con sus propias políticas de cookies, que se aplican solo cuando los abres.</p>
<p>Si en el futuro incorporamos alguna herramienta que utilice cookies no necesarias, actualizaremos esta política y te pediremos el consentimiento antes de instalarlas.</p>`,
  });
}

export function gracias() {
  return simplePage({
    path: '/gracias/',
    title: 'Solicitud recibida | MRI · Martínez Rojas Instalaciones',
    description: 'Hemos recibido tu solicitud de presupuesto. Te contactaremos en horario laboral.',
    h1: 'Solicitud recibida',
    noindex: true,
    cls: 'page-doc page-thanks',
    body: `<p class="sc-lede">Gracias. Hemos recibido tu solicitud y te contactaremos en horario laboral (${SITE.hours.toLowerCase()}).</p>
<p>Si es urgente, llámanos al <a href="${SITE.phoneHref}" data-track="click_phone" data-track-loc="gracias">${SITE.phone}</a>.</p>
<p><a class="link-arrow" href="/">Volver al inicio ${icon.arrow}</a></p>`,
  });
}

export function envioError() {
  return simplePage({
    path: '/envio-no-completado/',
    title: 'No se ha podido enviar | MRI · Martínez Rojas Instalaciones',
    description: 'No se ha podido enviar la solicitud de presupuesto. Revisa los datos o llámanos.',
    h1: 'No se ha podido enviar la solicitud',
    noindex: true,
    body: `<p class="sc-lede">Revisa que hayas indicado tu nombre y al menos un teléfono o un correo electrónico, y vuelve a intentarlo.</p>
<p>También puedes llamarnos al <a href="${SITE.phoneHref}">${SITE.phone}</a> o escribir a <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
<p><a class="link-arrow" href="/#presupuesto">Volver al formulario ${icon.arrow}</a></p>`,
  });
}

export function notFound() {
  return simplePage({
    path: '/404.html',
    title: 'Página no encontrada | MRI · Martínez Rojas Instalaciones',
    description: 'La página que buscas no existe. Consulta nuestros servicios o pide presupuesto.',
    h1: 'Esta página no existe',
    noindex: true,
    body: `<p class="sc-lede">Puede que la dirección haya cambiado con la nueva web.</p>
<ul>${SERVICES.map((s) => `<li><a href="/servicios/${s.slug}/">${esc(s.nav)}</a></li>`).join('')}<li><a href="/certificaciones/">Certificaciones</a></li></ul>
<p><a class="btn btn--accent" href="/#presupuesto">Pedir presupuesto</a> <a class="btn btn--line" href="${SITE.phoneHref}">${icon.phone}<span>${SITE.phone}</span></a></p>`,
  });
}
