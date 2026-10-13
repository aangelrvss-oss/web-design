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

export const AUDIENCES = [
  {
    key: 'comunidad', label: 'Comunidad de vecinos',
    who: 'Presidentes, juntas y administradores de fincas',
    text: 'Limpieza diaria del portal, escaleras y ascensor, garaje, zonas comunes y jardín. Y, si lo necesitáis, un conserje multifunción que además vigila accesos y hace el mantenimiento.',
    links: [['Limpieza de comunidades', '/limpieza-de-comunidades/'], ['Conserje multifunción', '/conserje-multifuncion/']],
  },
  {
    key: 'empresa', label: 'Empresa u oficina',
    who: 'Oficinas, despachos, locales, naves y edificios públicos',
    text: 'Limpieza diaria o semanal planificada según vuestro horario, limpiezas puntuales de garaje con maquinaria y limpiezas de fin de obra en locales y naves.',
    links: [['Limpieza de oficinas y locales', '/limpieza-de-oficinas-y-locales/'], ['Limpieza de fin de obra', '/limpieza-fin-de-obra/']],
  },
  {
    key: 'particular', label: 'Vivienda',
    who: 'Pisos y casas',
    text: 'Limpieza semanal o diaria con personal asegurado, limpiezas a fondo cuando las necesites y limpiezas puntuales por cambio de inquilino, temporada o tras un siniestro.',
    links: [['Limpieza de viviendas', '/limpieza-de-viviendas/'], ['Limpiezas especializadas', '/limpiezas-especializadas/']],
  },
];

// Las paradas de la ronda (acto 3). Frecuencias tal como las describe la empresa.
export const STOPS = [
  {
    key: 'portal', name: 'Portal', img: 'hero-portal', alt: 'Portal de un edificio de viviendas con suelo de piedra brillante, buzones y ascensor',
    what: 'Fregado del portal, limpieza de la puerta y del ascensor. Espejos y cristales revisados.',
    when: [['Cada día', 'portal, puerta, ascensor, espejos y cristales'], ['Cada mes', 'espejos y cristales a fondo'], ['Cada año', 'abrillantado del portal']],
  },
  {
    key: 'escaleras', name: 'Escaleras y ascensor', img: 'ronda-escalera', alt: 'Rellano con escalera de piedra, pasamanos, espejo y puertas de ascensor',
    what: 'Escaleras, rellanos, pasamanos y cabina del ascensor dentro del plan de limpieza de la comunidad.',
    when: [['Según el plan', 'se fija con la comunidad tras la visita']],
  },
  {
    key: 'garaje', name: 'Garaje', img: 'ronda-garaje', alt: 'Garaje comunitario con el suelo recién fregado y las plazas pintadas',
    what: 'Fregado con máquina fregadora. También limpiezas puntuales de garaje con maquinaria.',
    when: [['Cada seis meses', 'fregado del garaje incluido en la limpieza de comunidades']],
  },
  {
    key: 'jardin', name: 'Zonas comunes y jardín', img: 'ronda-jardin', alt: 'Patio interior de una comunidad con césped cortado, setos y camino limpio',
    what: 'Limpieza de zonas comunes y retirada de papeleras. Si hay jardín, cuidado del césped, los arbustos y los árboles.',
    when: [['Con conserje multifunción', 'dentro de sus tareas diarias']],
  },
  {
    key: 'mantenimiento', name: 'Mantenimiento', img: 'ronda-mantenimiento', alt: 'Pasillo de zonas comunes con iluminación LED y puertas',
    what: 'Puertas y alumbrado (bombillas, fluorescentes, LED) y pequeños trabajos de albañilería, fontanería y electricidad.',
    when: [['Cuando la comunidad lo necesite', 'Living Clean suministra LED y materiales']],
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
};

export const TEAM = {
  facts: [
    ['Personal propio', 'Contratado y dado de alta en la Seguridad Social, con seguro de accidentes.'],
    ['Formado', 'En los procesos de cada servicio y en prevención de riesgos laborales, con sus equipos de protección.'],
    ['Identificable', 'Uniformado y con un teléfono móvil de la empresa para que cualquier propietario pueda localizarlo.'],
    ['Asegurado', `Póliza de responsabilidad civil de hasta ${SITE.insurance} para cualquier daño durante el servicio.`],
    ['Sin huecos', 'Los procesos están estandarizados: si un operario falta, el suplente trabaja igual.'],
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
    description: 'Limpieza diaria de portales, escaleras y ascensores, garajes y zonas comunes. Fregado de garaje semestral y abrillantado anual del portal incluidos.',
    h1: 'Limpieza de comunidades de vecinos',
    intro: 'La especialidad de Living Clean: portales, escaleras, ascensores, garajes y zonas comunes, con un plan que se fija con la comunidad después de visitar el edificio.',
    does: [
      ['Portal a diario', 'Limpieza y fregado del portal, de la puerta y del ascensor.'],
      ['Espejos y cristales', 'Revisados todos los días y limpiados a fondo cada mes.'],
      ['Garaje', 'Fregado con máquina cada seis meses, incluido en el servicio.'],
      ['Abrillantado', 'Abrillantado del portal una vez al año, también incluido.'],
      ['Zonas comunes', 'Escaleras, rellanos y zonas comunes según el plan de la comunidad.'],
      ['Frecuencias a medida', 'Los intervalos se ajustan a las necesidades de cada edificio.'],
    ],
    know: [
      ['El presupuesto se hace después de visitar', 'Cada edificio es distinto: número de portales, plantas, garaje, jardín. Por eso se visita y se estudia antes de presupuestar.'],
      ['Lo incluido cuenta', 'El fregado semestral del garaje y el abrillantado anual del portal están incluidos. Al comparar ofertas, conviene comprobar qué entra en cada una.'],
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
    intro: 'Conserjería, limpieza y mantenimiento de la comunidad en un solo puesto de trabajo. Una forma más sencilla y económica de gestionar el edificio.',
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
    intro: 'Limpieza del hogar adaptada a lo que necesitas, con personal asegurado y productos de primera calidad.',
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
  ['¿Cómo hacéis el presupuesto?', 'Visitamos el inmueble y estudiamos sus características antes de presupuestar. Así el precio responde a lo que de verdad hay que hacer.'],
  ['¿Dónde trabajáis?', `Estamos en ${SITE.city} (Madrid). Indícanos la localidad del inmueble y te confirmamos si podemos atenderlo.`],
  ['¿El personal está asegurado?', `Sí. Es personal propio, dado de alta en la Seguridad Social, y la empresa tiene una póliza de responsabilidad civil de hasta ${SITE.insurance}.`],
  ['¿Qué pasa si el trabajador habitual falta?', 'Los procesos de cada servicio están estandarizados para que un suplente trabaje igual.'],
  ['¿Incluís productos y maquinaria?', 'Sí: el personal trabaja con la maquinaria, herramientas y productos específicos de cada limpieza, y en las limpiezas intensivas el servicio los incluye.'],
  ['¿Cómo os localizo durante el servicio?', `El personal va uniformado y lleva un móvil de la empresa. Y siempre puedes llamar al ${SITE.phone}.`],
];

export const FORM_TYPES = [
  { value: 'comunidad', label: 'Comunidad de vecinos' },
  { value: 'empresa', label: 'Empresa, oficina o local' },
  { value: 'particular', label: 'Vivienda' },
];

export const FORM_SERVICES = [
  { value: 'comunidades', label: 'Limpieza de comunidad' },
  { value: 'conserje', label: 'Conserje multifunción' },
  { value: 'oficinas', label: 'Oficinas o locales' },
  { value: 'viviendas', label: 'Vivienda' },
  { value: 'fin-de-obra', label: 'Fin de obra' },
  { value: 'especializadas', label: 'Grafitis, moquetas o garaje' },
];
