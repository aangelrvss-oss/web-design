// Contenido de la web. Todo dato de empresa sale de docs/AUDITORIA.md
// (web actual + documentos oficiales publicados por la propia empresa).
// No añadir cifras, plazos, precios, garantías ni opiniones sin verificar.

export const SITE = {
  origin: 'https://www.mrinstalaciones.com',
  name: 'MR Instalaciones',
  brand: 'MRI',
  legalName: 'Martínez Rojas Instalaciones, S.L.',
  taxId: 'B87145165',
  phone: '911 66 24 76',
  phoneHref: 'tel:+34911662476',
  phoneIntl: '+34 911 66 24 76',
  email: 'info@mrinstalaciones.com',
  privacyEmail: 'amartinez@mrinstalaciones.com',
  street: 'C/ Fundición 4 Bis, Nave 50',
  postalCode: '28522',
  city: 'Rivas-Vaciamadrid',
  region: 'Madrid',
  hours: 'Lunes a viernes, de 9:00 a 18:30',
  hoursShort: 'L-V 9:00-18:30',
  mapsHref: 'https://www.google.com/maps/search/?api=1&query=Calle+Fundici%C3%B3n+4+Bis+Nave+50%2C+28522+Rivas-Vaciamadrid',
  registroIndustrial: '201986',
};

// Las capas del dibujo de sección. Mismo orden que el pico de la portada.
export const SYSTEMS = [
  { key: 'agua', label: 'Agua fría y caliente', service: 'fontaneria-saneamiento' },
  { key: 'saneamiento', label: 'Saneamiento', service: 'fontaneria-saneamiento' },
  { key: 'calefaccion', label: 'Calefacción', service: 'calefaccion-climatizacion' },
  { key: 'aerotermia', label: 'Aerotermia', service: 'aerotermia' },
  { key: 'ventilacion', label: 'Ventilación', service: 'ventilacion' },
  { key: 'gas', label: 'Gas', service: 'instalaciones-de-gas' },
  { key: 'domotica', label: 'Domótica', service: 'domotica' },
];

// Valores del campo "servicio" del formulario (llegan al correo tal cual).
export const FORM_SERVICES = [
  { value: 'fontaneria-saneamiento', label: 'Fontanería y saneamiento' },
  { value: 'calefaccion-climatizacion', label: 'Calefacción y climatización' },
  { value: 'aerotermia', label: 'Aerotermia' },
  { value: 'instalaciones-de-gas', label: 'Gas' },
  { value: 'ventilacion', label: 'Ventilación' },
  { value: 'domotica', label: 'Domótica' },
  { value: 'otro', label: 'Otro o aún no lo sé' },
];

export const CLIENT_TYPES = [
  { value: '', label: 'Sin indicar' },
  { value: 'vivienda', label: 'Vivienda' },
  { value: 'comercio', label: 'Local o comercio' },
  { value: 'industria', label: 'Nave o industria' },
  { value: 'obra-nueva', label: 'Obra nueva o promoción' },
];

export const CREDENTIALS = [
  {
    name: 'Empresa instaladora de instalaciones térmicas en edificios (RITE)',
    short: 'Instaladora RITE',
    detail: 'Registro industrial 201986 · actividad 13-B-D20 · caducidad indefinida',
    csv: '1259369201268240433916',
    file: '/wp-content/uploads/2020/11/Instaladora-RITE.pdf',
    why: 'Calefacción, climatización y agua caliente sanitaria en edificios.',
  },
  {
    name: 'Empresa mantenedora de instalaciones térmicas en edificios (RITE)',
    short: 'Mantenedora RITE',
    detail: 'Registro industrial 201986 · actividad 13-B-E20 · caducidad indefinida',
    csv: '120387978840896759155',
    file: '/wp-content/uploads/2020/11/Mantenedora-RITE.pdf',
    why: 'Mantenimiento de esas mismas instalaciones térmicas.',
  },
  {
    name: 'Empresa instaladora de gas, categoría A (ITC-ICG 09)',
    short: 'Gas categoría A',
    detail: 'Registro industrial 201986 · actividad 13-B-D30 · caducidad indefinida',
    csv: '1295251072747407950625',
    file: '/wp-content/uploads/2020/11/Registro-Gas.pdf',
    why: 'Instalaciones receptoras de gas canalizado y GLP.',
  },
  {
    name: 'Empresa habilitada para gases fluorados (carga inferior a 3 kg)',
    short: 'Gases fluorados',
    detail: 'Registro GF/00001505',
    csv: '1221179527450138526313',
    file: '/wp-content/uploads/2020/11/Certificado-Fluorados-Orig.pdf',
    why: 'Montaje y mantenimiento de equipos de aire acondicionado y bombas de calor.',
  },
  {
    name: 'Registro de Empresas Acreditadas del sector de la construcción (REA)',
    short: 'REA',
    detail: 'Inscripción 12-28-0112372 · inscrita desde el 11/07/2019',
    csv: '1240775816428571469409',
    file: '/wp-content/uploads/2020/11/REA.pdf',
    why: 'Trabajar como contratista o subcontratista en obras de construcción.',
  },
];

// Situaciones de partida del visitante (acto 2 de la portada).
export const NEEDS = [
  { need: 'Estoy reformando el baño, la cocina o toda la casa', service: 'fontaneria-saneamiento', label: 'Fontanería y saneamiento' },
  { need: 'Quiero cambiar la calefacción o poner aire acondicionado', service: 'calefaccion-climatizacion', label: 'Calefacción y climatización' },
  { need: 'Estoy estudiando pasarme a la aerotermia', service: 'aerotermia', label: 'Aerotermia' },
  { need: 'Necesito instalar, cambiar o adecuar una instalación de gas', service: 'instalaciones-de-gas', label: 'Gas' },
  { need: 'Hay humedad o el aire no se renueva bien', service: 'ventilacion', label: 'Ventilación' },
  { need: 'Quiero controlar la climatización y la casa desde un solo sistema', service: 'domotica', label: 'Domótica' },
  { need: 'Tengo un local, una nave o una obra nueva', href: '/empresas-y-obra-nueva/', label: 'Empresas y obra nueva' },
];

export const SERVICES = [
  {
    slug: 'fontaneria-saneamiento',
    layer: ['agua', 'saneamiento'],
    nav: 'Fontanería y saneamiento',
    title: 'Fontanería y saneamiento en Rivas-Vaciamadrid | MR Instalaciones',
    description: 'Instalaciones nuevas, reformas y renovación de redes de agua, agua caliente y desagües en viviendas, locales y obra nueva. Sede en Rivas-Vaciamadrid.',
    h1: 'Fontanería y saneamiento',
    intro: 'Redes de agua fría y caliente, desagües y aparatos sanitarios para instalaciones nuevas, reformas y renovaciones en viviendas, locales, naves y obra nueva.',
    does: [
      ['Agua fría y caliente sanitaria', 'Acometida interior, distribución y conexión de cada punto de consumo.'],
      ['Renovación de aparatos sanitarios', 'Sustitución de lavabos, inodoros, bañeras, platos de ducha y griferías.'],
      ['Producción de agua caliente', 'Con caldera, aerotermia o biomasa, integrada con la calefacción cuando conviene.'],
      ['Saneamiento', 'Desagües, bajantes, arquetas y conexión con la red general.'],
      ['Reformas de baño y cocina', 'Nuevos recorridos de agua y desagüe adaptados a la distribución que quieres.'],
      ['Obra nueva', 'Fontanería y saneamiento completos para viviendas y edificios.'],
    ],
    know: [
      ['En una reforma, la fontanería se decide antes que los acabados', 'Los desagües necesitan pendiente y espacio. Su recorrido condiciona dónde pueden ir el plato de ducha, el inodoro o el fregadero, así que conviene definirlo antes de elegir azulejos y muebles.'],
      ['Si cambias la producción de agua caliente, revisa también la red', 'Pasar de una caldera a aerotermia, o mover el punto de producción, es el momento de comprobar diámetros, aislamiento de tuberías y distancias a los puntos de consumo.'],
      ['Un presupuesto comparable detalla materiales y recorridos', 'Pide que indique el tipo de tubería, los aparatos incluidos y qué partes de la red se sustituyen. Es la única forma de comparar ofertas de forma justa.'],
    ],
    faqs: [
      ['¿Hacéis solo una parte de la instalación, por ejemplo cambiar sanitarios?', 'Sí. La renovación de aparatos sanitarios es uno de los trabajos habituales. Cuéntanos qué quieres cambiar y te indicamos si conviene revisar algo más de la instalación.'],
      ['¿Trabajáis en reformas integrales?', 'Sí, nos encargamos de la fontanería y el saneamiento dentro de la reforma. Si la reforma incluye calefacción, ventilación o gas, podemos coordinarlo todo como una sola instalación.'],
      ['¿Qué información os envío para pedir presupuesto?', 'El tipo de trabajo, la localidad y, si puedes, unas medidas aproximadas o el plano de la zona. Con eso te contactamos para concretar.'],
    ],
    credentials: ['REA'],
    related: ['calefaccion-climatizacion', 'aerotermia', 'ventilacion'],
  },
  {
    slug: 'calefaccion-climatizacion',
    layer: ['calefaccion'],
    nav: 'Calefacción y climatización',
    title: 'Calefacción, suelo radiante y aire acondicionado | MR Instalaciones',
    description: 'Radiadores, suelo radiante, climatización por conductos y equipos individuales, biomasa y mantenimiento. Empresa instaladora y mantenedora RITE.',
    h1: 'Calefacción y climatización',
    intro: 'Calefacción, refrigeración y agua caliente para viviendas, comercios e industria: el emisor que mejor encaja con cada espacio y la fuente de energía que lo alimenta.',
    does: [
      ['Radiadores', 'Instalación nueva o sustitución de radiadores y su red de distribución.'],
      ['Suelo radiante y refrescante', 'Calefacción por suelo y, con el equipo adecuado, también refrigeración.'],
      ['Climatización por conductos', 'Calor y frío distribuidos por falso techo con una sola red.'],
      ['Equipos individuales', 'Montaje de equipos de aire acondicionado por estancias.'],
      ['Fuentes de energía', 'Aerotermia, gas, gasóleo, biomasa y geotermia.'],
      ['Biomasa', 'Calderas y estufas de pellets, hueso de aceituna o cáscara de almendra para calefacción y agua caliente.'],
      ['Mantenimiento', 'Mantenimiento de instalaciones térmicas como empresa mantenedora RITE.'],
    ],
    know: [
      ['El emisor importa tanto como la máquina', 'El suelo radiante trabaja a baja temperatura y reparte el calor de forma uniforme, por eso encaja tan bien con la aerotermia. Los radiadores permiten actuar sobre una instalación existente con menos obra. Los conductos dan calor y frío con una sola red, pero necesitan falso techo.'],
      ['Las instalaciones térmicas tienen su propio reglamento', 'La calefacción, la climatización y el agua caliente de los edificios se rigen por el Reglamento de Instalaciones Térmicas en los Edificios (RITE) y deben ejecutarlas empresas habilitadas. MRI está inscrita como empresa instaladora y como empresa mantenedora RITE.'],
      ['El aire acondicionado requiere manipular refrigerantes', 'Montar o mantener equipos con gases fluorados exige una empresa certificada para su manipulación. MRI tiene ese certificado (registro GF/00001505).'],
    ],
    faqs: [
      ['¿Suelo radiante o radiadores?', 'Depende de la obra que estés dispuesto a hacer y de la fuente de calor. En una reforma integral o con aerotermia, el suelo radiante suele tener más sentido. Si solo quieres cambiar la caldera, mantener los radiadores reduce mucho la obra.'],
      ['¿Hacéis mantenimiento de instalaciones que no habéis montado?', 'Somos empresa mantenedora de instalaciones térmicas. Cuéntanos qué instalación tienes y te decimos si podemos hacernos cargo.'],
      ['¿Trabajáis con biomasa?', 'Sí: calderas y estufas de biomasa para calefacción y agua caliente, con pellets, hueso de aceituna o cáscara de almendra.'],
    ],
    credentials: ['Instaladora RITE', 'Mantenedora RITE', 'Gases fluorados'],
    related: ['aerotermia', 'domotica', 'instalaciones-de-gas'],
  },
  {
    slug: 'aerotermia',
    layer: ['aerotermia'],
    nav: 'Aerotermia',
    title: 'Instalación de aerotermia en Rivas-Vaciamadrid | MR Instalaciones',
    description: 'Aerotermia para calefacción, refrigeración y agua caliente, integrada con suelo radiante, radiadores o conductos. Empresa instaladora RITE en Rivas-Vaciamadrid.',
    h1: 'Instalación de aerotermia',
    intro: 'Calefacción, refrigeración y agua caliente sanitaria con una bomba de calor aire-agua, integrada con los emisores de tu vivienda o local.',
    does: [
      ['Equipos de aerotermia', 'Para calefacción, climatización y agua caliente sanitaria.'],
      ['Sustitución de calderas', 'Paso de gas o gasóleo a aerotermia, aprovechando lo que se pueda de la instalación existente.'],
      ['Integración con emisores', 'Suelo radiante, radiadores o conductos, según la vivienda.'],
      ['Control', 'Regulación por zonas y programación, con domótica si la quieres.'],
    ],
    know: [
      ['Cómo funciona', 'Una bomba de calor toma energía del aire exterior y la usa para calentar o enfriar agua. Con una sola máquina se puede tener calefacción, refrigeración y agua caliente.'],
      ['Rinde mejor a baja temperatura', 'Cuanto más baja es la temperatura a la que trabaja la instalación, mejor funciona. Por eso combina tan bien con el suelo radiante. Con radiadores existentes hay que comprobar si su tamaño es suficiente para trabajar a menor temperatura.'],
      ['Necesita sitio fuera y, a menudo, dentro', 'La unidad exterior va en fachada, patio, terraza o cubierta. La mayoría de instalaciones llevan también un depósito de agua caliente en el interior.'],
      ['Antes de decidir', 'Conviene revisar el aislamiento de la vivienda, la potencia necesaria y los emisores. Es lo que determina si la aerotermia es la mejor opción en tu caso.'],
    ],
    faqs: [
      ['¿Puedo poner aerotermia con mis radiadores actuales?', 'A veces sí. Depende del tamaño de los radiadores y del aislamiento. Lo comprobamos antes de proponerte nada.'],
      ['¿La aerotermia también enfría?', 'Los equipos reversibles sí. Para refrigerar hacen falta emisores que lo permitan, como el suelo refrescante o los conductos. Los radiadores convencionales no sirven para enfriar.'],
      ['¿Qué espacio necesito?', 'Un lugar exterior ventilado para la unidad exterior y, normalmente, espacio interior para el depósito de agua caliente y el módulo hidráulico.'],
    ],
    credentials: ['Instaladora RITE', 'Gases fluorados'],
    related: ['calefaccion-climatizacion', 'fontaneria-saneamiento', 'domotica'],
  },
  {
    slug: 'instalaciones-de-gas',
    layer: ['gas'],
    nav: 'Gas',
    title: 'Instalaciones de gas, empresa categoría A | MR Instalaciones',
    description: 'Instalaciones receptoras de gas comunes e individuales, gas canalizado, botellas de GLP y depósitos. Empresa instaladora de gas categoría A.',
    h1: 'Instalaciones de gas',
    intro: 'Instalaciones receptoras de gas comunes e individuales, con gas canalizado, botellas de GLP o depósitos de almacenamiento.',
    does: [
      ['Instalaciones individuales', 'Viviendas y locales: desde el contador o el depósito hasta cada aparato.'],
      ['Instalaciones comunes', 'Redes de gas de edificios.'],
      ['Gas canalizado', 'Instalaciones nuevas y modificaciones.'],
      ['GLP', 'Instalaciones con botellas y con depósitos de almacenamiento.'],
      ['Calderas y cocinas', 'Conexión de los aparatos a la instalación.'],
    ],
    know: [
      ['Solo una empresa habilitada puede hacerlo', 'Las instalaciones receptoras de gas deben ejecutarlas empresas instaladoras de gas habilitadas, según el Reglamento técnico de distribución y utilización de combustibles gaseosos (Real Decreto 919/2006). MRI está inscrita como empresa instaladora de gas de categoría A, la más amplia de las que establece la ITC-ICG 09.'],
      ['Cada instalación queda documentada', 'Una instalación nueva o modificada se documenta con su certificado de instalación, que emite la empresa instaladora.'],
      ['Con GLP, la ubicación manda', 'En una instalación con depósito hay que estudiar el emplazamiento y sus distancias de seguridad antes de cualquier otra cosa.'],
    ],
    faqs: [
      ['¿Qué significa categoría A?', 'Es la categoría de empresa instaladora de gas más amplia de la Instrucción Técnica ITC-ICG 09. La inscripción de MRI tiene caducidad indefinida y se puede comprobar con el código seguro de verificación publicado en Certificaciones.'],
      ['¿Trabajáis con botellas y depósitos de GLP?', 'Sí, además de gas canalizado.'],
      ['¿Hacéis instalaciones comunes de edificio?', 'Sí, instalaciones receptoras comunes e individuales.'],
    ],
    credentials: ['Gas categoría A'],
    related: ['calefaccion-climatizacion', 'fontaneria-saneamiento', 'aerotermia'],
  },
  {
    slug: 'ventilacion',
    layer: ['ventilacion'],
    nav: 'Ventilación',
    title: 'Ventilación mecánica y recuperación de calor | MR Instalaciones',
    description: 'Ventilación mecánica autorregulable, higrorregulable y con recuperación de energía para viviendas y locales. Renovación de aire continua y controlada.',
    h1: 'Ventilación mecánica y recuperación de calor',
    intro: 'Sistemas que renuevan el aire de forma continua y controlada en viviendas y locales, sin depender de abrir ventanas.',
    does: [
      ['Autorregulable de caudal variable', 'Extracción mecánica con caudales ajustados a cada estancia.'],
      ['Higrorregulable', 'El caudal se adapta a la humedad del ambiente.'],
      ['Recuperación de energía', 'Sistemas de doble flujo que aprovechan el calor del aire que sale para templar el que entra.'],
    ],
    know: [
      ['La ventilación es una exigencia del edificio', 'El Código Técnico de la Edificación (documento DB HS 3) exige que las viviendas dispongan de un sistema de ventilación que renueve el aire de forma continua.'],
      ['Tres sistemas, tres comportamientos', 'Un sistema autorregulable mantiene los caudales previstos. Uno higrorregulable sube o baja la extracción según la humedad. Un recuperador de calor impulsa y extrae a la vez y pasa la energía del aire de salida al de entrada.'],
      ['El recuperador necesita sitio', 'Hace falta espacio para la máquina y para los conductos de impulsión y extracción, normalmente en falso techo. Es más sencillo decidirlo en una reforma o en obra nueva.'],
    ],
    faqs: [
      ['¿Sirve para la humedad y la condensación?', 'Una ventilación correcta reduce la humedad interior, que es una de las causas habituales de condensaciones. Si hay manchas o moho, conviene revisar también el origen.'],
      ['¿Se puede instalar en una vivienda existente?', 'Sí, aunque un sistema de doble flujo es más sencillo de instalar cuando hay reforma. Lo valoramos según el espacio disponible.'],
      ['¿Hace ruido?', 'Un sistema bien dimensionado y con los conductos adecuados funciona de forma silenciosa. El dimensionado es parte del trabajo.'],
    ],
    credentials: ['Instaladora RITE', 'Mantenedora RITE'],
    related: ['calefaccion-climatizacion', 'aerotermia', 'domotica'],
  },
  {
    slug: 'domotica',
    layer: ['domotica'],
    nav: 'Domótica',
    title: 'Domótica y control de climatización | MR Instalaciones',
    description: 'Sistemas de control domótico para climatización, iluminación y equipos de producción de calor y agua caliente. Integrados con la instalación desde el principio.',
    h1: 'Domótica y control de instalaciones',
    intro: 'Sistemas de control para la climatización, la iluminación y los equipos de producción, pensados junto con la instalación que controlan.',
    does: [
      ['Control de climatización', 'Zonas, horarios y temperaturas por estancia.'],
      ['Iluminación', 'Control de la iluminación integrado en el mismo sistema.'],
      ['Equipos de producción', 'Control de calderas, aerotermia y otros equipos de producción.'],
    ],
    know: [
      ['El control une las instalaciones', 'Programar horarios, zonificar la calefacción o ajustar la producción a la demanda es lo que hace que varias instalaciones funcionen como una sola.'],
      ['Mejor decidirlo con la instalación', 'Cableado, sondas y compatibilidad de los equipos se resuelven mucho mejor cuando el control se proyecta al mismo tiempo que la calefacción o la aerotermia.'],
    ],
    faqs: [
      ['¿Se puede añadir domótica a una instalación existente?', 'Depende de los equipos que tengas y de su compatibilidad. Cuéntanos qué instalación tienes y lo revisamos.'],
      ['¿Qué se puede controlar?', 'La climatización, la iluminación y los equipos de producción de calor y agua caliente.'],
    ],
    credentials: ['Instaladora RITE'],
    related: ['calefaccion-climatizacion', 'aerotermia', 'ventilacion'],
  },
];

export const SECTORS = [
  {
    key: 'hogar', title: 'Hogares', picto: 'house',
    text: 'Instalación nueva, reforma o renovación en tu vivienda.',
    list: ['Fontanería y saneamiento', 'Calefacción y climatización', 'Aerotermia', 'Ventilación', 'Gas', 'Biomasa', 'Domótica'],
  },
  {
    key: 'comercio', title: 'Comercios', picto: 'shop',
    text: 'Instalaciones para abrir, reformar o renovar un local.',
    list: ['Fontanería y saneamiento', 'Climatización', 'Ventilación', 'Gas', 'Biomasa', 'Aerotermia', 'Domótica'],
  },
  {
    key: 'industria', title: 'Industria', picto: 'plant',
    text: 'Naves y espacios de trabajo con necesidades propias.',
    list: ['Fontanería y saneamiento', 'Climatización', 'Ventilación', 'Gas', 'Biomasa', 'Aerotermia', 'Domótica'],
  },
  {
    key: 'obra', title: 'Obra nueva', picto: 'build',
    text: 'Instalaciones completas para promotoras y constructoras.',
    list: ['Fontanería y saneamiento', 'Climatización', 'Ventilación', 'Gas', 'Domótica'],
  },
];

export const HOME_FAQS = [
  ['¿Dónde estáis y dónde trabajáis?', 'Nuestra sede está en la C/ Fundición 4 Bis, Nave 50, en Rivas-Vaciamadrid (Madrid). Indícanos la localidad de la obra en el formulario y te confirmamos si podemos atenderla.'],
  ['¿Cómo pido un presupuesto?', 'Con el formulario de esta página, llamando al 911 66 24 76 o escribiendo a info@mrinstalaciones.com. Cuanto más concretes el trabajo y la localidad, antes podremos concretar contigo los siguientes pasos.'],
  ['¿Qué significa que estéis habilitados?', 'Que estamos inscritos en el registro industrial de la Comunidad de Madrid como empresa instaladora y mantenedora de instalaciones térmicas (RITE) y como empresa instaladora de gas de categoría A, además de estar certificados para gases fluorados e inscritos en el REA. Puedes comprobar cada documento con su código.'],
  ['¿Os ocupáis de varias instalaciones a la vez?', 'Sí. Fontanería, calefacción, aerotermia, ventilación, gas y domótica pueden proyectarse y ejecutarse juntas, que es cuando mejor encajan entre sí.'],
  ['¿Hacéis mantenimiento?', 'Sí, de instalaciones térmicas: estamos inscritos como empresa mantenedora RITE.'],
  ['¿Cuál es vuestro horario?', 'Lunes a viernes, de 9:00 a 18:30. El formulario puedes enviarlo en cualquier momento.'],
];
