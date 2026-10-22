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
  // true mientras el clip es la animática provisional: muestra la etiqueta
  // «Animática provisional» sobre el escenario. Con el vídeo real, false.
  provisional: true,
  // Recorrido del acto en alturas de pantalla (incluye apertura y cierre).
  span: 4.8,
  // Fracción del recorrido fijado que tarda la ventana en abrirse a sangre.
  open: 0.13,
  scenes: [
    {
      key: 'clima',
      t0: 0.0, t1: 3.9, focal: 66, side: 'left',
      kicker: 'Salón · Climatización',
      title: 'Frío y calor, estancia por estancia',
      text: 'Aire acondicionado con equipos individuales o por conductos en falso techo. Montaje y mantenimiento con habilitación en gases fluorados.',
      links: [['/servicios/calefaccion-climatizacion/', 'Calefacción y climatización']],
      service: 'calefaccion-climatizacion',
      rail: 'Climatización',
    },
    {
      key: 'termica',
      t0: 3.9, t1: 7.5, focal: 64, side: 'left',
      kicker: 'Zona técnica · Aerotermia y calefacción',
      title: 'Calefacción y agua caliente desde una sola máquina',
      text: 'Aerotermia conectada a suelo radiante o radiadores. Instalamos y mantenemos la instalación térmica completa como empresa RITE.',
      links: [['/servicios/aerotermia/', 'Aerotermia']],
      service: 'aerotermia',
      rail: 'Aerotermia y calefacción',
    },
    {
      key: 'aire-agua',
      t0: 7.5, t1: 12.0, focal: 52, side: 'right',
      kicker: 'Ventilación · Fontanería',
      title: 'Aire renovado y agua bien conducida',
      text: 'Ventilación autorregulable, higrorregulable o con recuperación de energía, y fontanería desde la acometida hasta cada grifo.',
      links: [['/servicios/ventilacion/', 'Ventilación'], ['/servicios/fontaneria-saneamiento/', 'Fontanería']],
      service: 'ventilacion',
      rail: 'Ventilación y fontanería',
    },
  ],
  // Cierre del tramo: aparece sobre la última escena y se va con el escenario.
  outro: {
    title: 'Una sola empresa para que todo encaje',
    text: 'Proyectadas y ejecutadas juntas, las instalaciones comparten recorridos, espacio y control.',
  },
};
