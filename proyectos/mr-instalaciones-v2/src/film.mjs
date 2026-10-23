// La secuencia de la portada. Es el único sitio donde se decide qué dice la
// web en cada momento del vídeo, así que al cambiar de clip solo se toca esto.
//
// Los tiempos (t0, t1) están en segundos del clip, NO en progreso de scroll:
// build.mjs los convierte a ventanas de cue con la duración real del archivo
// (site/assets/film/film.json, que escribe tools/video/prepare.mjs) y el span
// del acto. Así una escena de ventilación nunca aparece mientras se ve el
// salón, aunque cambie el largo del tramo fijado.
//
// focal: punto horizontal (0-100 %) que conserva el encuadre estrecho del
//        móvil, donde el 16:9 se recorta. Se interpola entre escenas.
// side:  lado de escritorio donde va el texto, el contrario al equipo que
//        protagoniza la escena.

export const FILM = {
  // Recorrido del acto en alturas de pantalla. El tramo fijado es span - 1:
  // 3,2 pantallas para 10 s de vídeo, sin alargar el pin más de lo necesario.
  span: 4.2,
  // El clip entero se reparte sobre el tramo fijado. Los dos últimos segundos
  // son un plano fijo de los conductos, así que la revelación del falso techo
  // (7,5-8,1 s) cae dentro del tramo y se sostiene; al salir, el escenario
  // se lleva ese plano final. Sin esto, el último 21 % del clip (justo la
  // revelación) se reproduciría ya con el escenario saliendo.
  clipMap: 'travel',
  // El hero (titular, texto y CTA) está compuesto sobre el vídeo desde el
  // primer instante y se retira entre heroOut - heroFade y heroOut del tramo
  // fijado, mientras el aire empieza a salir del split. Después entran las
  // escenas.
  heroOut: 0.1,
  heroFade: 0.05,
  // Versión para móvil en vertical: un recorte de 480×720 (2:3) del original,
  // a su resolución, sin escalar. En un teléfono el 16:9 a pantalla completa
  // solo deja ver ~1/4 del ancho; este recorte contiene todo lo que se ve,
  // pesa ~1/3 y decodifica más rápido al buscar. El encuadre sigue un
  // recorrido de cámara (centro del recorte en píxeles del original, por
  // segundo del clip), leído fotograma a fotograma con una regla
  // (assets-src/video/recorte-movil.jpg), con transiciones suaves:
  // el split, la puerta de la sala técnica, la bomba de calor, un barrido
  // hacia los grupos de bombeo y el cobre, los difusores y los conductos.
  // La duración, los fotogramas y el GOP son los del clip completo: el
  // scroll avanza el vídeo igual en los dos.
  portrait: {
    w: 480,
    // Se usa cuando la ventana es más estrecha que 2:3; si no (tableta,
    // horizontal), el clip completo.
    media: '(max-aspect-ratio: 2/3)',
    path: [
      [0.0, 650], [1.0, 650], [1.8, 440], [2.4, 700], [3.2, 660], [3.6, 560],
      [4.0, 500], [4.4, 430], [4.9, 600], [5.3, 780], [5.7, 880], [6.0, 820],
      [6.4, 660], [7.2, 600], [8.0, 640], [10.1, 640],
    ],
  },
  hero: {
    kicker: 'Martínez Rojas Instalaciones · Madrid',
    lede: 'Climatización, aerotermia, ventilación y fontanería, proyectadas e instaladas para funcionar juntas.',
    discover: 'Descubrir nuestros sistemas',
  },
  scenes: [
    // Tiempos leídos en la hoja de contactos del vídeo (assets-src/video/):
    // 0-1,6 s salón con el split en marcha; 1,6-3,3 s la cámara cruza el
    // salón hacia la sala técnica; 3,3-5,9 s bomba de calor, módulo hidráulico
    // y grupos de bombeo, con acercamiento a las tuberías de cobre; 5,9-7,5 s
    // pasillo con difusores lineales; 7,5-8,1 s el falso techo se vuelve
    // transparente y aparecen los conductos, que se mantienen hasta el final.
    // still: fotograma fijo de la escena (movimiento reducido, sin vídeo).
    {
      key: 'clima',
      t0: 0.0, t1: 3.3, still: 0.95, focal: 46, side: 'left',
      kicker: 'Salón · Climatización',
      title: 'Frío y calor, estancia por estancia',
      text: 'Aire acondicionado con equipos individuales o por conductos en falso techo. Montaje y mantenimiento con habilitación en gases fluorados.',
      links: [['/servicios/calefaccion-climatizacion/', 'Calefacción y climatización']],
      service: 'calefaccion-climatizacion',
      rail: 'Climatización',
    },
    {
      key: 'termica',
      t0: 3.3, t1: 6.0, still: 4.45, focal: 36, side: 'right',
      kicker: 'Sala técnica · Aerotermia y fontanería',
      title: 'Aerotermia y fontanería, en una sola red',
      text: 'Aerotermia conectada a suelo radiante o radiadores, y la fontanería que la lleva a cada punto. Instalamos y mantenemos la instalación térmica como empresa RITE.',
      links: [['/servicios/aerotermia/', 'Aerotermia'], ['/servicios/fontaneria-saneamiento/', 'Fontanería']],
      service: 'aerotermia',
      rail: 'Aerotermia y fontanería',
    },
    {
      key: 'ventilacion',
      t0: 6.0, t1: 10.03, still: 9.2, focal: 50, side: 'left',
      kicker: 'Falso techo · Ventilación',
      title: 'Aire renovado en cada estancia',
      text: 'Ventilación autorregulable, higrorregulable o con recuperación de energía, con los conductos ocultos en el falso techo.',
      links: [['/servicios/ventilacion/', 'Ventilación']],
      service: 'ventilacion',
      rail: 'Ventilación',
    },
  ],
  // Cierre del tramo: aparece sobre la última escena y se va con el escenario.
  outro: {
    title: 'Una sola empresa para que todo encaje',
    text: 'Proyectadas y ejecutadas juntas, las instalaciones comparten recorridos, espacio y control.',
  },
};
