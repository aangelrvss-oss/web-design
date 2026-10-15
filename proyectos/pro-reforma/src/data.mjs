// Contenido de la web de Pro Reforma. Todo sale de su web actual, su dossier,
// su ficha de Google y las reseñas publicadas (docs/AUDITORIA.md, docs/RESENAS.md).
// Sin años de experiencia, número de obras, garantías ni plazos: la empresa
// publica cifras contradictorias y ninguna está confirmada.

export const SITE = {
  origin: 'https://www.proreforma.es',
  name: 'Pro Reforma',
  owner: 'Costel Daniel Iftimi',
  taxId: 'X6701697A',
  contactName: 'Daniel',
  phone: '691 312 106',
  phoneHref: 'tel:+34691312106',
  phoneIntl: '+34691312106',
  whatsapp: 'https://wa.me/34691312106',
  email: 'daniel@proreforma.es',
  street: 'Calle España, 63',
  postalCode: '28521',
  city: 'Rivas-Vaciamadrid',
  region: 'Madrid',
  area: 'Rivas-Vaciamadrid y la Comunidad de Madrid',
  instagram: 'https://www.instagram.com/daniel_proreforma/',
  facebook: 'https://www.facebook.com/profile.php?id=61572650646708',
  mapsUrl: 'https://www.google.com/maps?cid=1539571755307103610',
  // Horario publicado en la ficha de Google (consulta 15/10/2026).
  hours: 'Lunes a viernes, de 9:00 a 19:00',
  hoursShort: 'L–V · 9:00–19:00',
};

// Reseñas de Google · modo editorial (docs/RESENAS.md).
// Todo es literal y está fechado. Nada se reescribe: los textos conservan su
// ortografía original y, cuando Google o el widget de la empresa los muestran
// recortados, se reproducen hasta donde se leen y se marca con «[…]».
// `when` es la antigüedad que mostraba Google el día de la consulta.
// `via`: 'ficha' (Google Maps) o 'widget' (widget de reseñas de Google en
// proreforma.es). No hay puntuación individual: no se ha podido leer.
// Si el servidor tiene la API de Places configurada, la web lo sustituye
// por los datos en vivo (site/api/resenas.php o netlify/functions/resenas.mjs).
export const REVIEWS = {
  rating: 5.0,
  count: 41,
  checked: '2026-10-15',
  checkedLabel: '15 de octubre de 2026',
  checkedShort: '15/10/2026',
  // Frases que Google destaca en el resumen de la ficha (autor no visible).
  highlights: [
    'Rápidos, buenos y muy limpios trabajando, muy profesionales.',
    'Muy buenos acabados y al terminar te dejan la casa impecable.',
    'Además, han sido puntuales, educados y han explicado todo lo que iban haciendo.',
  ],
  // Temas que Google detecta en las reseñas y cuántas los mencionan.
  topics: [['confianza', 10], ['equipo', 8], ['materiales', 5], ['perfeccionista', 3]],
  items: [
    { author: 'Jorge García', when: 'hace 8 meses', via: 'widget', full: true,
      text: ['Me han insonorizado el techo del dormitorio. Un trabajo excelente. Muy buenos acabados y al terminar te dejan la casa impecable. Personas de confianza muy recomendables.'] },
    { author: 'Alberto López', when: 'hace 8 meses', via: 'widget', full: true,
      text: ['Lo recomiendo sin duda! Le pedimos que arreglara las ventanas de la buhardilla por las humedades y pintara, y lo ha hecho muy bien. Es muy profesional y perfeccionista. Le volveremos a llamar si necesitamos hacer algo en casa. Muchas gracias, Daniel.'] },
    { author: 'Alicia P.', when: 'hace 8 meses', via: 'widget', full: true,
      text: ['Encantada por el trabajo realizado por Daniel. Un profesional como la copa de un pino, un trato excepcional y sabe perfectamente la forma de trabajar para quede lo mejor posible.', 'Muy formal. No tengo duda de que contare con Daniel en futuras obras'] },
    { author: 'Ana Maria Coarda', when: 'hace 8 meses', via: 'widget', full: false,
      text: ['Hoy han venido a casa los técnicos de PRO Reforma para hacer un trabajo en la zona de la caldera y la salida de humos y hemos quedado muy contentos con el resultado. Han protegido toda la cocina con plásticos, han trabajado limpio y con mucho cuidado, y al terminar lo han dejado todo recogido.'] },
    { author: 'Biviana', when: 'hace 8 meses', via: 'widget', full: false,
      text: ['Contratamos a PRO REFORMA para una reforma integral de la segunda planta (habitación, baño y vestidor) y no podemos estar más satisfechos...Desde el primer contacto con Daniel, el trato fue impecable y profesional.', 'Lo que más destacaríamos es su meticulosidad: Los acabados son espectaculares'] },
    { author: 'Adrian', when: 'hace 6 meses', via: 'ficha', full: false,
      text: ['Contactamos con Pro Reforma por un problema de ruido con los vecinos y para que nos realizaran un estudio acústico y una solución de insonorización en la habitación. El equipo vino a nuestra casa, analizó la situación con detalle'] },
    { author: 'Nicki1309 S', when: 'hace 6 meses', via: 'ficha', full: false,
      text: ['Encantados con el trabajo realizado por ProReforma y Daniel en nuestra casa. Han demostrado una gran limpieza, puntualidad y un trato excelente en todo momento. Daniel nos explicó con detalle cada parte del proceso y los materiales'] },
    { author: 'sweetie001 sweetie001', when: 'hace 6 meses', via: 'ficha', full: false,
      text: ['Después de varias malas experiencias con otras empresas, encontramos en internet a Proreforma y ha sido todo un acierto. Daniel y su equipo han demostrado ser grandes profesionales: trabajan con muy buenas máquinas, son muy perfeccionistas'] },
  ],
};
// Atajo para citas cortas dentro de otras secciones: texto literal de una
// reseña de `items` (se comprueba al generar que exista tal cual).
export const quoteFrom = (author, fragment) => {
  const r = REVIEWS.items.find((x) => x.author === author);
  if (!r || !r.text.join(' ').includes(fragment)) throw new Error(`Cita no literal: ${author}: ${fragment}`);
  return { author, text: fragment };
};

// Fotos reales de obra publicadas por Pro Reforma (recortes de su web).
export const PHOTOS = {
  'insono-preparacion': 'Operario preparando la pared bajo la ventana, con el ladrillo a la vista',
  'insono-placas': 'Paredes cubiertas con placas de color azul y juntas sin terminar',
  'insono-pintura': 'Operario con camiseta de Pro Reforma pintando con pistola sobre las placas',
  'insono-estancia': 'La misma habitación terminada, con paredes y techo lisos en blanco',
  'techo-elevador': 'Instalación de un techo con elevador de placas y perfilería metálica',
  'techo-escalera': 'Operario trabajando en el techo desde una escalera, con un foco de obra',
  'pasillo-techo': 'Pasillo con el techo de placas y las juntas preparadas',
  'salon-led': 'Salón terminado con techo de foseado e iluminación LED',
};

// Bandas panorámicas (1798×410) y recortes 2:1 (820×410) de las mismas fotos,
// obtenidos de la galería de proreforma.es a mayor resolución.
export const BANDS = Object.keys(PHOTOS);

export const PROJECTS = [
  {
    slug: 'insonorizacion-de-una-habitacion',
    title: 'Insonorización de una habitación',
    kind: 'Insonorización y pintura',
    summary: 'Cuatro fotos de la misma habitación, publicadas por Pro Reforma: de la pared con el ladrillo a la vista a la estancia terminada.',
    cover: 'insono-estancia',
    steps: [
      ['insono-preparacion', 'Preparación', 'La pared bajo la ventana, abierta y con el ladrillo a la vista, antes de cerrar.'],
      ['insono-placas', 'Placas', 'Las paredes, cubiertas con placas y con las juntas aún sin terminar.'],
      ['insono-pintura', 'Pintura', 'Pintura con pistola sobre las placas y las juntas ya tratadas.'],
      ['insono-estancia', 'Terminada', 'La misma habitación, con paredes y techo lisos.'],
    ],
    note: 'La empresa no ha publicado la localización, la superficie, los materiales exactos ni el plazo de esta obra. El orden de las fases es el que muestran las fotos.',
    service: 'insonorizacion',
  },
  {
    slug: 'techos-y-acabados',
    title: 'Techos de placas e iluminación',
    kind: 'Techos, pintura e iluminación',
    summary: 'Trabajos de techo publicados por Pro Reforma: montaje de placas con elevador, juntas en un pasillo y un salón terminado con foseado LED.',
    cover: 'salon-led',
    steps: [
      ['techo-elevador', 'Montaje', 'Perfilería metálica y elevador de placas para subir las planchas al techo.'],
      ['techo-escalera', 'Juntas y repasos', 'Trabajo en el techo desde la escalera, con foco de obra.'],
      ['pasillo-techo', 'Pasillo', 'Techo de placas con las juntas preparadas para pintar.'],
      ['salon-led', 'Salón terminado', 'Techo con foseado e iluminación LED.'],
    ],
    note: 'Fotos de distintas obras de techos publicadas en la web de la empresa; no se presentan como un único proyecto.',
    service: 'reformas-integrales',
  },
];

// Servicios. Los tres primeros son los principales (más evidencia y más peso
// comercial). Los demás conservan sus URL actuales.
export const SERVICES = [
  {
    slug: 'reformas-integrales', main: true, nav: 'Reformas integrales', photo: 'salon-led', band: 'techo-elevador', quoteLabel: 'reforma',
    short: 'La vivienda entera o por estancias: baño, cocina, habitaciones. Albañilería, fontanería, electricidad, carpintería y pintura coordinadas por una sola empresa.',
    title: 'Reformas integrales en Rivas-Vaciamadrid | Pro Reforma',
    description: 'Reformas integrales y parciales de viviendas y locales en Rivas-Vaciamadrid: albañilería, fontanería, electricidad, carpintería y pintura coordinadas.',
    h1: 'Reformas integrales',
    lede: 'Reformas completas o por estancias de viviendas y locales, desde la demolición hasta la entrega, con albañilería, fontanería, electricidad, carpintería y pintura coordinadas.',
    problem: 'Una reforma junta muchos oficios y muchas decisiones. Lo que más preocupa es que se alargue, que la casa sufra durante la obra y que el resultado no quede como se esperaba.',
    who: 'Propietarios de pisos, casas y locales que quieren renovar una vivienda entera o varias estancias (baño, cocina, habitaciones) con una sola empresa.',
    includes: [
      ['Redistribución', 'Derribo y levantamiento de tabiques para reorganizar los espacios.'],
      ['Revestimientos', 'Suelos nuevos y alicatado de paredes en cualquier estancia.'],
      ['Baños', 'Sustitución de bañera por plato de ducha y renovación de saneamientos.'],
      ['Instalaciones', 'Renovación de fontanería y de la instalación eléctrica cuando la reforma lo requiere.'],
      ['Techos', 'Techos de placas, foseados e iluminación.'],
      ['Carpintería y pintura', 'Puertas, armarios a medida y pintura de toda la vivienda.'],
    ],
    process: ['Visita para ver el estado de la vivienda y tomar medidas', 'Presupuesto detallado por partidas', 'Fechas de inicio acordadas', 'Obra con protección de las zonas que no se tocan', 'Limpieza y repaso final'],
    bring: ['Qué estancias quieres reformar y qué te gustaría cambiar', 'Fotos o un plano, si los tienes', 'Desde cuándo podrías empezar'],
    faqs: [
      ['¿Hacéis también reformas parciales?', 'Sí: además de reformas integrales hacemos reformas de baños, cocinas o habitaciones concretas.'],
      ['¿Vivo en la casa durante la obra?', 'Depende del alcance. Lo vemos en la visita y planificamos qué zonas se protegen y en qué orden se trabaja.'],
    ],
  },
  {
    slug: 'pinturas', main: true, nav: 'Pintura', photo: 'insono-pintura', band: 'pasillo-techo', quoteLabel: 'pintura',
    short: 'Suelos y muebles protegidos, paredes reparadas e imprimadas, y dos manos con máquina. Lisa, decorativa, esmaltes y lacados.',
    title: 'Pintura de pisos y casas en Rivas-Vaciamadrid | Pro Reforma',
    description: 'Pintura de viviendas con suelos y muebles protegidos, paredes preparadas, imprimación y dos manos con máquina. Lisa, decorativa, esmaltes y lacados.',
    h1: 'Pintura de viviendas',
    lede: 'Pintura lisa, decorativa y rústica, esmaltes, barnices, lacados, papel, veladuras y temples, con un proceso de protección y preparación pensado para que la casa quede limpia.',
    problem: 'Pintar con la casa habitada preocupa por los muebles, el suelo y el polvo, y porque una pared mal preparada se nota en cuanto da la luz.',
    who: 'Viviendas y locales que necesitan pintar una estancia o la casa entera, también al terminar una reforma.',
    includes: [
      ['Protección', 'Suelo tapado con papel o cartón y plástico en puertas, ventanas, armarios, muebles, rodapiés, cercos, jambas y radiadores.'],
      ['Mobiliario', 'Movemos los muebles al centro de la estancia y los protegemos.'],
      ['Preparación de soportes', 'Descascarillados, golpes, agujeros de tacos y humedades se reparan antes de pintar.'],
      ['Lijado e imprimación', 'Lijado con máquina e imprimación acrílica para que la pintura agarre en soportes poco consistentes.'],
      ['Enlucido', 'Paredes y techos enlucidos con masilla hasta 3 m de altura cuando hace falta.'],
      ['Dos manos con máquina', 'Pintura plástica Montó o Valentine, acabado mate liso: la primera mano diluida y la segunda sin diluir.'],
    ],
    process: ['Visita: datos, medidas y fotos del estado actual', 'Presupuesto detallado', 'Protección de suelos y muebles', 'Preparación y pintura', 'Retirada de protecciones y limpieza'],
    bring: ['Qué estancias y techos quieres pintar', 'Si hay humedades, grietas o gotelé', 'Colores o acabados que te gustan'],
    faqs: [
      ['¿Qué pintura utilizáis?', 'En pintura plástica, Montó o Valentine con acabado mate y textura lisa, salvo que el trabajo necesite otra cosa. Lo concretamos en el presupuesto.'],
      ['¿Con qué maquinaria trabajáis?', 'Con lijadoras y equipos de pintura profesionales de marcas como Festool, Wagner o Graco.'],
    ],
  },
  {
    slug: 'insonorizacion', main: true, nav: 'Insonorización', photo: 'insono-placas', band: 'insono-placas', quoteLabel: 'insonorización',
    short: 'Ruido de vecinos, de la calle o de otra planta. Cerramos paredes o techos con placas, tratamos juntas y dejamos la estancia pintada.',
    title: 'Insonorización de paredes y techos en Rivas-Vaciamadrid | Pro Reforma',
    description: 'Insonorización de techos y paredes en viviendas: preparación, placas, juntas y pintura. Fotos reales de obra y opiniones de clientes en Google.',
    h1: 'Insonorización de paredes y techos',
    lede: 'Insonorizamos techos y paredes de viviendas cerrando con placas, tratando las juntas y dejando la estancia pintada y lista para usar.',
    problem: 'El ruido de vecinos, de la calle o de otra planta se cuela por techos y paredes y afecta al descanso.',
    who: 'Dormitorios, salones y estancias que dan a una vivienda vecina, a la calle o a zonas comunes.',
    includes: [
      ['Visita y valoración', 'Vemos de dónde llega el ruido y qué paramentos conviene tratar.'],
      ['Preparación', 'Se abre y prepara el paramento cuando hace falta, como en la pared bajo la ventana de nuestras fotos.'],
      ['Placas', 'Cerramiento con placas y aislamiento en paredes o techo.'],
      ['Juntas y pintura', 'Tratamiento de juntas y pintura para dejar la estancia terminada.'],
    ],
    process: ['Visita para valorar paredes y techos', 'Presupuesto detallado', 'Protección de la estancia', 'Preparación, placas, juntas y pintura', 'Limpieza final'],
    bring: ['Qué estancia es y de dónde llega el ruido', 'Si el problema es el techo, una pared o ambos', 'Horarios en los que molesta más'],
    faqs: [
      ['¿Cuánto se reduce el ruido?', 'Depende del tipo de ruido, del edificio y de la solución. No damos cifras antes de visitar: lo valoramos en la vivienda.'],
      ['¿Se pierde mucho espacio?', 'Las placas restan algunos centímetros a la estancia. En la visita te decimos cuánto según la solución.'],
    ],
  },
  {
    slug: 'albanileria', nav: 'Albañilería', photo: 'insono-preparacion', band: 'insono-preparacion',
    title: 'Albañilería en Rivas-Vaciamadrid | Pro Reforma',
    description: 'Albañilería en reformas: tabiques, redistribución de espacios, suelos y alicatados, cambio de bañera por plato de ducha, aislamiento, puertas y ventanas.',
    h1: 'Albañilería',
    lede: 'Tabiques, redistribución de espacios, suelos, alicatados y cambio de bañera por plato de ducha.',
    includes: [
      ['Muros y espacios', 'Derribamos o levantamos tabiques para redistribuir la vivienda.'],
      ['Revestimientos', 'Colocamos suelos nuevos y alicatamos paredes.'],
      ['Saneamientos', 'Sustitución de bañeras por platos de ducha.'],
      ['Aislamiento', 'Aislamiento acústico y térmico.'],
      ['Puertas y ventanas', 'Sustitución de puertas y ventanas acorde a la estancia.'],
    ],
  },
  {
    slug: 'fontaneria', nav: 'Fontanería', photo: null,
    title: 'Fontanería en reformas en Rivas-Vaciamadrid | Pro Reforma',
    description: 'Renovación y reubicación de la instalación de fontanería y saneamiento en reformas, y reparación de fugas, en Rivas-Vaciamadrid.',
    h1: 'Fontanería',
    lede: 'Renovación de la instalación de fontanería y saneamiento en reformas, reubicación de tomas y reparación de fugas.',
    includes: [
      ['Renovación', 'Sustitución de tuberías antiguas por materiales actuales en una reforma.'],
      ['Reubicación', 'Cambio de posición de tomas y desagües para la nueva distribución.'],
      ['Reparación', 'Fugas, averías y obstrucciones.'],
    ],
  },
  {
    slug: 'electricidad', nav: 'Electricidad', photo: null,
    title: 'Electricidad en reformas en Rivas-Vaciamadrid | Pro Reforma',
    description: 'Renovación de la instalación eléctrica en reformas integrales de viviendas y locales en Rivas-Vaciamadrid.',
    h1: 'Electricidad',
    lede: 'Renovación de la red eléctrica cuando una reforma integral parte de una instalación antigua.',
    includes: [
      ['Renovación de la instalación', 'Nuevo cableado, mecanismos y puntos de luz en la reforma.'],
      ['Iluminación', 'Puntos de luz en techos de placas y foseados, como el salón de nuestras fotos.'],
    ],
  },
  {
    slug: 'carpinteria', nav: 'Carpintería', photo: null,
    title: 'Carpintería a medida en Rivas-Vaciamadrid | Pro Reforma',
    description: 'Carpintería a medida en reformas: puertas, armarios, estanterías y suelos, además de cancelas, vallas y rejas.',
    h1: 'Carpintería',
    lede: 'Puertas, armarios, estanterías y suelos a medida, y cancelas, vallas o rejas para viviendas y negocios.',
    includes: [
      ['A medida', 'Puertas, armarios y estanterías hechos para el espacio.'],
      ['Suelos', 'Suelos de madera y similares dentro de la reforma.'],
      ['Seguridad', 'Cancelas, vallas y rejas.'],
    ],
  },
  {
    slug: 'cerrajeria', nav: 'Cerrajería', photo: null,
    title: 'Cerrajería y trabajos en metal en Rivas-Vaciamadrid | Pro Reforma',
    description: 'Cerraduras de puertas, garajes, verjas y ventanas, y trabajos en metal para barandillas, escaleras, terrazas y balcones.',
    h1: 'Cerrajería',
    lede: 'Cerraduras de puertas de entrada, garajes, verjas y ventanas, y trabajos en metal para barandillas, escaleras, terrazas y balcones.',
    includes: [
      ['Cerraduras', 'Puertas de entrada, garajes, verjas y ventanas.'],
      ['Metal', 'Barandillas, escaleras, terrazas y balcones.'],
    ],
  },
];

// Método: lo que describe la empresa en su web (Pintura) y en su dossier.
export const METHOD = [
  ['Primer contacto', 'Por teléfono, WhatsApp o el formulario. Cuéntanos qué quieres hacer y dónde está la vivienda.'],
  ['Visita', 'Vamos a la vivienda, tomamos datos, medidas y fotos del estado actual.'],
  ['Presupuesto detallado', 'Por partidas y sin compromiso, para que sepas qué incluye cada trabajo.'],
  ['Planificación', 'Acordamos la fecha de inicio y el orden de los trabajos.'],
  ['Obra con la casa protegida', 'Suelos, puertas, ventanas y muebles protegidos; seguimiento del trabajo durante la obra.'],
  ['Limpieza y entrega', 'Retiramos las protecciones y dejamos la casa limpia y recogida.'],
];

export const FAQS = [
  ['¿El presupuesto es sin compromiso?', 'Sí. Visitamos la vivienda y te enviamos un presupuesto detallado sin compromiso.'],
  ['¿Visitáis la vivienda antes de presupuestar?', 'Sí: tomamos datos, medidas y fotos del estado actual para ajustar el presupuesto a lo que hay que hacer.'],
  ['¿Dónde trabajáis?', 'Estamos en Rivas-Vaciamadrid y trabajamos en la Comunidad de Madrid. Indícanos la localidad y te confirmamos.'],
  ['¿Cómo protegéis la casa durante la obra?', 'Tapamos el suelo con papel o cartón y cubrimos con plástico puertas, ventanas, armarios y muebles. Al terminar retiramos todo y limpiamos.'],
  ['¿Hacéis reformas pequeñas?', 'Sí: además de reformas integrales hacemos reformas parciales, pintura, insonorización y trabajos de oficio.'],
  ['¿Cuál es la forma más rápida de contactar?', `Llamar o escribir por WhatsApp al ${SITE.phone}. También puedes usar el formulario o escribir a ${SITE.email}.`],
];

export const FORM_TYPES = [
  { value: 'integral', label: 'Reforma integral' },
  { value: 'parcial', label: 'Baño, cocina o una estancia' },
  { value: 'pintura', label: 'Pintura' },
  { value: 'insonorizacion', label: 'Insonorización' },
  { value: 'otro', label: 'Otro trabajo' },
];
