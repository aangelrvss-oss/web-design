import type { ScenarioDef } from '../types';

export default {
  id: 'karaoke-cancion',
  title: 'La canción infinita',
  venue: 'Cumpleaños de Iván en un bar de karaoke de Malasaña',
  incident:
    'La máquina de karaoke ya solo reproduce una canción: el «Cumpleaños feliz» en flauta dulce, versión de once minutos. Hay cola de gente con el micro en la mano y el encargado amenaza con cerrar.',
  culpritAction: 'dejó el karaoke tocando solo el «Cumpleaños feliz» en flauta',
  slots: ['23:30', '00:30', '01:30'],
  zones: [
    { id: 'escenario', name: 'El escenario', trace: 'Un hilo de espumillón dorado del telón en el cuello.' },
    { id: 'cabina', name: 'La cabina técnica', trace: 'Un adaptador de cable jack olvidado en el bolsillo.' },
    { id: 'barra', name: 'La barra', trace: 'Un posavasos de cartón doblado en el bolsillo trasero.' },
    { id: 'reservados', name: 'Los reservados', trace: 'Pelusa de terciopelo rojo en el pantalón.' },
    { id: 'bano', name: 'Los lavabos', trace: 'Olor a jabón de chicle de fresa en las manos.' },
  ],
  sceneZones: ['cabina', 'escenario', 'reservados'],
  sceneNotes: {
    cabina: 'En la cabina técnica está el ordenador que manda en la máquina.',
    escenario: 'El mando de la máquina se queda siempre en el atril del escenario.',
    reservados: 'Cada reservado tiene una tablet para pedir canciones, y una tenía el modo técnico abierto.',
  },
  tags: ['ocio', 'música', 'noche'],
} satisfies ScenarioDef;
