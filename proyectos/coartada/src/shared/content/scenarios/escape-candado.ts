import type { ScenarioDef } from '../types';

export default {
  id: 'escape-candado',
  title: 'El candado imposible',
  venue: 'Cumpleaños de Sara en un escape room de un polígono de Sevilla',
  incident:
    'Alguien ha cambiado el código del candado final por uno que no aparece en ninguna pista. El grupo de las 20:00 lleva quince minutos pidiendo ayuda y al dueño le sudan las manos.',
  culpritAction: 'le cambió el código al candado final',
  slots: ['17:30', '18:30', '19:30'],
  zones: [
    { id: 'faraon', name: 'La sala del faraón', trace: 'Arena dorada dentro de las zapatillas.' },
    { id: 'laboratorio', name: 'El laboratorio', trace: 'Un pegote de slime verde bajo la uña.' },
    { id: 'bunker', name: 'El búnker', trace: 'Polvo de sacos terreros en las rodillas.' },
    { id: 'control', name: 'La sala de control', trace: 'Una tira de cinta americana pegada a la espalda.' },
    { id: 'vestibulo', name: 'El vestíbulo', trace: 'El envoltorio de un caramelo de menta en el bolsillo.' },
  ],
  sceneZones: ['control', 'faraon', 'bunker'],
  sceneNotes: {
    control: 'Desde la sala de control se pueden reprogramar todos los candados.',
    faraon: 'El candado final cierra el sarcófago de la sala del faraón.',
    bunker: 'Hoy el candado final estaba montado en la puerta blindada del búnker.',
  },
  tags: ['ocio', 'juegos', 'cumpleaños'],
} satisfies ScenarioDef;
