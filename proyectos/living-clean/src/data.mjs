// Contenido de la web de Living Clean. Todo sale de su web actual y de datos
// registrales públicos (docs/AUDITORIA.md). Sin cifras, plazos, reseñas ni
// zonas de trabajo inventadas.

export const SITE = {
  origin: 'https://livingclean.es',
  name: 'Living Clean',
  brandLong: 'Living Clean Multiservicios',
  legalName: 'Living Clean S.L.',
  taxId: 'B87994307',
  phone: '608 82 58 64',
  phoneHref: 'tel:+34608825864',
  phoneIntl: '+34608825864',
  email: 'info@livingclean.es',
  city: 'Rivas-Vaciamadrid',
  region: 'Madrid',
  legalAddress: 'C/ del Sol nº 1, bajo A, 28540 Perales de Tajuña (Madrid)',
  insurance: '150.000 €',
  instagram: 'https://www.instagram.com/_living_clean/',
};

// Tres caminos de conversión. El A (comunidad) es el principal.
export const PATHS = {
  comunidad: { label: 'Comunidad de vecinos', cta: 'Solicitar visita y presupuesto' },
  administrador: { label: 'Administrador de fincas', cta: 'Hablar de mis comunidades' },
  empresa: { label: 'Empresa o servicio puntual', cta: 'Pedir presupuesto' },
};

// Señales de confianza: solo lo que publica la empresa (validar antes de publicar).
export const TRUST = [
  ['Personal propio', 'Dado de alta en la Seguridad Social y con seguro de accidentes.'],
  ['Uniformado y localizable', 'Con un teléfono móvil de la empresa durante el servicio.'],
  ['Responsabilidad civil', `Póliza de hasta 150.000 € para daños durante el servicio.`],
  ['Visita previa', 'Estudiamos el edificio antes de preparar el presupuesto.'],
];

// Cómo se contrata (operativa descrita por la empresa: visita antes de presupuestar).
export const PROCESS = [
  ['Nos cuentas qué necesitas', 'Por teléfono o con el formulario: tipo de edificio, localidad y qué te preocupa.'],
  ['Visitamos el edificio', 'Vemos portales, plantas, garaje, jardín y zonas comunes, y hablamos con quien gestiona la comunidad.'],
  ['Te enviamos la propuesta', 'Con las tareas y las frecuencias que necesita ese edificio, para que la junta pueda decidir.'],
  ['Organizamos el servicio', 'Si se acepta, asignamos el personal y te damos un contacto para el día a día.'],
];
export const PROPOSAL_INFO = [
  'Número de portales y de plantas',
  'Si hay garaje, jardín, piscina o ascensores',
  'Qué se hace ahora y qué no funciona',
  'Horario o días que prefiere la comunidad',
  'Si interesa también la conserjería',
];

// Estructura preparada para testimonios reales y autorizados. Vacía: no se
// muestra ninguna sección mientras no haya pruebas verificables.
// Formato: { quote, name, role, source, url } — solo con permiso por escrito.
export const TESTIMONIALS = [];

// Las zonas del edificio (acto principal). Frecuencias ORIENTATIVAS tal como las
// describe la web actual de la empresa: cada contrato fija las suyas tras la visita.
export const STOPS = [
  {
    key: 'portal', name: 'Portal', img: 'hero-portal', alt: 'Portal de un edificio de viviendas con suelo de piedra brillante, buzones y ascensor',
    what: 'Fregado del portal, limpieza de la puerta y del ascensor. Espejos y cristales revisados.',
    when: [['Habitual', 'a diario: portal, puerta, ascensor, espejos y cristales'], ['Periódico', 'cristales a fondo cada mes y abrillantado del portal una vez al año']],
  },
  {
    key: 'escaleras', name: 'Escaleras y ascensor', img: 'ronda-escalera', alt: 'Rellano con escalera de piedra, pasamanos, espejo y puertas de ascensor',
    what: 'Escaleras, rellanos, pasamanos y cabina del ascensor dentro del plan de limpieza de la comunidad.',
    when: [['Según el edificio', 'se fija con la comunidad tras la visita']],
  },
  {
    key: 'garaje', name: 'Garaje', img: 'ronda-garaje', alt: 'Garaje comunitario con el suelo recién fregado y las plazas pintadas',
    what: 'Fregado con máquina fregadora, dentro del plan de la comunidad o como limpieza puntual.',
    when: [['Periódico', 'habitualmente cada seis meses']],
  },
  {
    key: 'jardin', name: 'Zonas comunes y jardín', img: 'ronda-jardin', alt: 'Patio interior de una comunidad con césped cortado, setos y camino limpio',
    what: 'Limpieza de zonas comunes y retirada de papeleras. Si hay jardín, cuidado del césped, los arbustos y los árboles.',
    when: [['Según el alcance', 'en la limpieza o con conserje multifunción']],
  },
  {
    key: 'mantenimiento', name: 'Mantenimiento', img: 'ronda-mantenimiento', alt: 'Pasillo de zonas comunes con iluminación LED y puertas',
    what: 'Puertas y alumbrado (bombillas, fluorescentes, LED) y pequeños trabajos de albañilería, fontanería y electricidad.',
    when: [['Según el alcance', 'con conserje multifunción o bajo petición']],
  },
  {
    key: 'fachada', name: 'Fachada', img: 'ronda-fachada', alt: 'Fachada de ladrillo claro y piedra de un edificio, limpia y sin pintadas',
    what: 'Eliminación de grafitis y limpieza de zonas exteriores con hidrolimpiadora: piedra, mármol, metal, lacados, PVC y vinilos en cristal.',
    when: [['Bajo demanda', 'según la superficie y la pintada']],
  },
];

export const CONCIERGE = {
  roles: ['Conserjería', 'Limpieza', 'Mantenimiento'],
  functions: [
    'Control de accesos de personas y vehículos',
    'Correspondencia, depósito y custodia de llaves de zonas comunes',
    'Limpieza de zonas comunes y garaje, retirada de papeleras',
    'Puertas, alumbrado y pequeños trabajos de albañilería, fontanería y electricidad',
    'Jardinería: césped, arbustos y árboles',
  ],
  benefits: [
    'Un solo proveedor y un solo interlocutor para el día a día del edificio.',
    'Tareas coordinadas en un mismo puesto, con un horario conocido.',
    'Pequeñas incidencias resueltas sin buscar a otro profesional, dentro del alcance acordado.',
  ],
  scope: 'Qué tareas asume el conserje, en qué horario y cuáles quedan fuera (por ejemplo, obras o reparaciones que requieren un profesional habilitado) se define en la propuesta de cada comunidad.',
};

export const TEAM = {
  facts: [
    ['Personal propio', 'Contratado y dado de alta en la Seguridad Social, con seguro de accidentes.'],
    ['Formado', 'En los procesos de cada servicio y en prevención de riesgos laborales, con sus equipos de protección.'],
    ['Identificable', 'Uniformado y con un teléfono móvil de la empresa para que cualquier propietario pueda localizarlo.'],
    ['Asegurado', `Póliza de responsabilidad civil de hasta ${SITE.insurance} para cualquier daño durante el servicio.`],
    ['Sin huecos', 'Los procesos están estandarizados: si un operario falta, el suplente trabaja igual.'],
  ],
  means: [
    ['Maquinaria propia', 'Fregadora, hidrolimpiadora y máquina rotativa, manejadas por personal formado.'],
    ['Formación y seguridad', 'Formación en los procesos de cada servicio y en prevención de riesgos laborales, con equipos de protección.'],
    ['Suplencias', 'Procesos estandarizados para que, si un operario falta, el suplente trabaje igual.'],
  ],
  photos: [
    ['real-cristales', 'Limpieza de cristales'],
    ['real-abrillantado', 'Tratamiento de suelos con máquina rotativa'],
    ['real-fregado-garaje', 'Fregado con máquina'],
    ['real-furgoneta', 'Vehículo de la empresa'],
  ],
};

export const SERVICES = [
  {
    slug: 'limpieza-de-comunidades', nav: 'Limpieza de comunidades', audience: 'comunidad', img: 'hero-portal',
    title: 'Limpieza de comunidades de vecinos en Rivas-Vaciamadrid | Living Clean',
    description: 'Limpieza de portales, escaleras, ascensores, garajes y zonas comunes en Rivas-Vaciamadrid, con un plan que se fija tras visitar el edificio.',
    h1: 'Limpieza de comunidades de vecinos',
    intro: 'La especialidad de Living Clean: portales, escaleras, ascensores, garajes y zonas comunes, con un plan que se fija con la comunidad después de visitar el edificio.',
    does: [
      ['Portal', 'Limpieza y fregado del portal, de la puerta y del ascensor; habitualmente a diario.'],
      ['Espejos y cristales', 'Revisados en cada pasada y limpiados a fondo de forma periódica.'],
      ['Escaleras y zonas comunes', 'Escaleras, rellanos, pasamanos y zonas comunes según el plan de la comunidad.'],
      ['Garaje', 'Fregado con máquina fregadora, habitualmente cada seis meses.'],
      ['Abrillantado', 'Abrillantado del portal con máquina rotativa, habitualmente una vez al año.'],
      ['Frecuencias a medida', 'Tareas e intervalos se fijan en la propuesta de cada edificio.'],
    ],
    know: [
      ['El presupuesto se hace después de visitar', 'Cada edificio es distinto: número de portales, plantas, garaje, jardín. Por eso se visita y se estudia antes de presupuestar.'],
      ['Compara lo que incluye cada oferta', 'Garaje, abrillantado, cristales a fondo: al comparar presupuestos, conviene comprobar qué tareas y con qué frecuencia entra en cada uno. En nuestra propuesta van detalladas.'],
      ['Un responsable localizable', 'El personal va uniformado y lleva un móvil de la empresa: cualquier propietario puede localizarlo.'],
    ],
    faqs: [
      ['¿Trabajáis con administradores de fincas?', 'Sí. Podemos visitar el edificio con la junta o con el administrador y preparar el presupuesto para la comunidad.'],
      ['¿Qué pasa si la persona habitual falta?', 'Los procesos están estandarizados para que un suplente trabaje igual, sin que baje el nivel del servicio.'],
      ['¿Podéis encargaros también de la conserjería?', 'Sí, con el servicio de conserje multifunción, que une conserjería, limpieza y mantenimiento en un solo puesto.'],
    ],
    related: ['conserje-multifuncion', 'limpiezas-especializadas', 'limpieza-de-oficinas-y-locales'],
  },
  {
    slug: 'conserje-multifuncion', nav: 'Conserje multifunción', audience: 'comunidad', img: 'ronda-jardin',
    title: 'Conserje multifunción para comunidades | Living Clean',
    description: 'Conserjería, limpieza y mantenimiento de la comunidad en un solo puesto: accesos, correspondencia, llaves, limpieza, alumbrado, pequeños arreglos y jardín.',
    h1: 'Conserje multifunción',
    intro: 'Conserjería, limpieza y mantenimiento de la comunidad en un solo puesto de trabajo. Una forma más sencilla de gestionar el edificio.',
    does: [
      ['Conserjería', 'Control de accesos de personas y vehículos, correspondencia, depósito y custodia de llaves de zonas comunes.'],
      ['Limpieza', 'Zonas comunes y garaje limpios y retirada de papeleras.'],
      ['Mantenimiento', 'Puertas y alumbrado (bombillas, fluorescentes, LED) y pequeños trabajos de albañilería, fontanería y electricidad.'],
      ['Jardinería', 'Si la comunidad tiene jardín: césped, arbustos y árboles.'],
      ['Personal de limpieza aparte', 'Si preferís personal exclusivo de limpieza, también lo ofrecemos.'],
    ],
    know: [
      ['Por qué un solo puesto', 'Tres servicios separados significan tres proveedores, tres horarios y tres facturas. Unificar tareas en una persona formada simplifica la gestión de la comunidad.'],
      ['Material incluido cuando hace falta', 'Living Clean es proveedor de LED y de diversos materiales para el mantenimiento.'],
    ],
    faqs: [
      ['¿El conserje está contratado por la comunidad?', 'No: es personal de Living Clean, dado de alta y asegurado por la empresa. La comunidad contrata el servicio.'],
      ['¿Podemos empezar solo con la limpieza?', 'Sí. El conserje multifunción es una opción; la limpieza de comunidades se puede contratar por separado.'],
    ],
    related: ['limpieza-de-comunidades', 'limpiezas-especializadas', 'limpieza-de-oficinas-y-locales'],
  },
  {
    slug: 'limpieza-de-oficinas-y-locales', nav: 'Oficinas, locales y edificios públicos', audience: 'empresa', img: 'ronda-mantenimiento',
    title: 'Limpieza de oficinas, locales y edificios públicos | Living Clean',
    description: 'Limpieza diaria o semanal de oficinas, despachos, negocios y edificios públicos como colegios e institutos, planificada según vuestro horario.',
    h1: 'Limpieza de oficinas, locales y edificios públicos',
    intro: 'Limpieza diaria o semanal de oficinas, despachos y negocios, y de edificios públicos como colegios e institutos, planificada según vuestra actividad.',
    does: [
      ['Puestos de trabajo', 'Desempolvado de mesas y sillas, vaciado de papeleras, mobiliario y archivos.'],
      ['Suelos', 'Acondicionamiento de suelos y, cuando hace falta, tratamiento con máquina.'],
      ['Puertas, cuadros y cristales', 'Limpieza de puertas, cuadros y cristales.'],
      ['Baños y zonas comunes', 'Incluidos en el servicio.'],
      ['Garajes', 'Limpieza puntual de garajes con maquinaria adecuada.'],
    ],
    know: [
      ['Un plan para cada negocio', 'El trabajo se organiza según vuestro horario y actividad, para que la limpieza no interrumpa y el resultado sea constante.'],
      ['Personal especializado', 'Limpiadores con experiencia en oficinas, uniformados y asegurados.'],
    ],
    faqs: [
      ['¿Podéis limpiar fuera del horario de oficina?', 'El plan se ajusta a vuestras necesidades. Indícanos el horario en la solicitud.'],
      ['¿Trabajáis para edificios públicos?', 'Sí, también prestamos servicio en edificios públicos como colegios e institutos.'],
    ],
    related: ['limpieza-fin-de-obra', 'limpiezas-especializadas', 'limpieza-de-comunidades'],
  },
  {
    slug: 'limpieza-de-viviendas', nav: 'Limpieza de viviendas', audience: 'particular', img: 'ronda-escalera',
    title: 'Limpieza de viviendas y limpiezas a fondo | Living Clean',
    description: 'Limpieza semanal o diaria de pisos y casas con personal asegurado, limpiezas a fondo y limpiezas puntuales por cambio de inquilino, temporada o siniestro.',
    h1: 'Limpieza de viviendas',
    intro: 'Limpieza del hogar adaptada a lo que necesitas, con personal propio y asegurado.',
    does: [
      ['Limpieza habitual', 'Limpieza de las estancias que elijas, de forma semanal o diaria.'],
      ['Limpieza a fondo', 'Cuando la pidas, además de la limpieza habitual.'],
      ['Cambio de inquilino', 'Limpieza completa entre un inquilino y el siguiente.'],
      ['De temporada', 'Limpiezas generales una vez al año o al abrir una segunda vivienda.'],
      ['Tras un siniestro', 'Limpieza de viviendas después de un incendio o una inundación.'],
    ],
    know: [
      ['Personal asegurado', 'La persona que entra en tu casa es personal de Living Clean, dado de alta y cubierto por el seguro de responsabilidad civil de la empresa.'],
      ['Productos incluidos en las limpiezas intensivas', 'En las limpiezas puntuales, el servicio incluye los productos y materiales necesarios.'],
    ],
    faqs: [
      ['¿Puedo contratar solo una limpieza a fondo?', 'Sí: las limpiezas puntuales (a fondo, de temporada, por cambio de inquilino) se contratan por separado.'],
      ['¿Cuánto tarda una limpieza intensiva?', 'Depende de la vivienda: la empresa indica que estas limpiezas dejan el inmueble limpio en uno o varios días.'],
    ],
    related: ['limpiezas-especializadas', 'limpieza-fin-de-obra', 'limpieza-de-comunidades'],
  },
  {
    slug: 'limpieza-fin-de-obra', nav: 'Limpieza de fin de obra', audience: 'empresa', img: 'ronda-fachada',
    title: 'Limpieza de fin de obra y primera ocupación | Living Clean',
    description: 'Limpieza de fin de obra en locales, naves, oficinas y viviendas, y limpiezas de primera ocupación. Equipo especializado, productos y maquinaria incluidos.',
    h1: 'Limpieza de fin de obra',
    intro: 'Limpiezas intensivas y puntuales para entregar locales, naves, oficinas, edificios y viviendas listos para usar, con productos, materiales y equipo incluidos.',
    does: [
      ['Fin de obra', 'Para constructoras y empresas, sea cual sea la obra.'],
      ['Primera ocupación', 'Limpieza completa antes de entrar a vivir o a trabajar.'],
      ['Locales y naves', 'Locales comerciales, naves industriales, oficinas y edificios.'],
      ['Generales anuales', 'Limpiezas generales una vez al año.'],
    ],
    know: [
      ['Todo incluido', 'El servicio incluye los productos, los materiales y la maquinaria necesarios, con un equipo especializado.'],
      ['En uno o varios días', 'Según el tamaño del inmueble, la limpieza se completa en uno o varios días.'],
    ],
    faqs: [
      ['¿Trabajáis para constructoras?', 'Sí, trabajamos para empresas de construcción y empresas en general.'],
      ['¿Qué necesitáis saber para el presupuesto?', 'El tipo de inmueble, los metros aproximados, la localidad y la fecha en la que debe estar listo.'],
    ],
    related: ['limpieza-de-oficinas-y-locales', 'limpiezas-especializadas', 'limpieza-de-viviendas'],
  },
  {
    slug: 'limpiezas-especializadas', nav: 'Grafitis, moquetas y garajes', audience: 'comunidad', img: 'ronda-garaje',
    title: 'Limpieza de grafitis, moquetas y garajes | Living Clean',
    description: 'Eliminación de grafitis con hidrolimpiadora, limpieza técnica de moquetas y alfombras y fregado de garajes con maquinaria.',
    h1: 'Grafitis, moquetas y garajes',
    intro: 'Limpiezas que necesitan maquinaria y técnica: grafitis en fachadas, moquetas y alfombras, y garajes.',
    does: [
      ['Grafitis', 'Con hidrolimpiadora, en fachadas, mobiliario urbano, piedra lisa o porosa, mármol, metal, lacados y PVC; también pegatinas de vinilo en cristal, rótulos, monumentos y fuentes.'],
      ['Moquetas y alfombras', 'Limpieza técnica con productos y equipos que alargan el tiempo que permanecen limpias y eliminan ácaros y gérmenes.'],
      ['Garajes', 'Fregado con máquina fregadora, puntual o periódico.'],
      ['Suelos', 'Abrillantado y tratamiento con máquina rotativa.'],
    ],
    know: [
      ['Cada superficie, su técnica', 'Una piedra porosa y un panel lacado no se limpian igual. La técnica se elige según la superficie para no dañarla.'],
      ['Moquetas limpias más tiempo', 'Las técnicas actuales reducen la frecuencia con la que hay que volver a limpiarlas.'],
    ],
    faqs: [
      ['¿Quitáis grafitis de fachadas de comunidades?', 'Sí, en fachadas y zonas exteriores del edificio, con hidrolimpiadora.'],
      ['¿Hacéis solo el garaje, sin contrato de limpieza?', 'Sí, la limpieza de garajes también se hace de forma puntual.'],
    ],
    related: ['limpieza-de-comunidades', 'limpieza-de-oficinas-y-locales', 'limpieza-fin-de-obra'],
  },
];

export const HOME_FAQS = [
  ['¿Cómo se solicita presupuesto?', `Llamando al ${SITE.phone}, escribiendo a ${SITE.email} o con el formulario de esta página. Te llamamos para concertar la visita.`],
  ['¿Es necesario visitar el edificio?', 'Sí. Preparamos el presupuesto después de ver el inmueble, porque cada edificio tiene portales, plantas, garaje y zonas comunes distintos.'],
  ['¿Se puede adaptar la frecuencia de limpieza?', 'Sí. Las tareas y la frecuencia de cada zona se fijan con la comunidad en la propuesta, según lo que necesita el edificio.'],
  ['¿Qué tareas puede asumir el conserje?', 'Control de accesos, correspondencia y llaves, limpieza de zonas comunes y garaje, puertas y alumbrado, pequeños trabajos de mantenimiento y jardinería. El alcance exacto se acuerda en la propuesta.'],
  ['¿Cómo se solicitan otros servicios?', 'Igual: indica en el formulario que es para una empresa o un servicio puntual (oficinas, viviendas, fin de obra, garajes, grafitis o moquetas) y cuéntanos qué necesitas.'],
  ['¿Qué información conviene aportar?', 'Número de portales y plantas, si hay garaje, jardín o ascensores, qué se hace ahora y el horario que prefiere la comunidad. Si no lo tienes todo, lo vemos en la visita.'],
  ['¿Dónde trabajáis?', `Estamos en ${SITE.city} (Madrid). Indícanos la localidad del inmueble y te confirmamos si podemos atenderlo.`],
];

export const FORM_TYPES = [
  { value: 'comunidad', label: 'Comunidad de vecinos' },
  { value: 'administrador', label: 'Administrador de fincas' },
  { value: 'empresa', label: 'Empresa u oficina' },
  { value: 'puntual', label: 'Servicio puntual' },
];

export const FORM_SERVICES = [
  { value: 'comunidades', label: 'Limpieza de comunidad' },
  { value: 'conserje', label: 'Conserje multifunción' },
  { value: 'oficinas', label: 'Oficinas o locales' },
  { value: 'viviendas', label: 'Vivienda' },
  { value: 'fin-de-obra', label: 'Fin de obra' },
  { value: 'especializadas', label: 'Grafitis, moquetas o garaje' },
];
