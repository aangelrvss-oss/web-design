import type { ScenarioDef } from '../types';

export default {
  id: 'padel-red',
  title: 'La red de los bebés',
  venue: 'Torneo de pádel entre amigos en un club de Murcia',
  incident:
    'Alguien ha llenado la red de la pista central con fotos de los finalistas de bebés, sujetas con pinzas. La final empieza en nada y nadie consigue quitarlas sin pararse a mirar.',
  culpritAction: 'colgó fotos de bebé de los finalistas en la red',
  slots: ['10:00', '11:00', '12:00'],
  zones: [
    { id: 'central', name: 'La pista central', trace: 'Granos de arena de silicona dentro de los calcetines.' },
    { id: 'cafeteria', name: 'La cafetería', trace: 'Migas de tostada con tomate en la camiseta.' },
    { id: 'tienda', name: 'La tienda del club', trace: 'Una etiqueta de precio pegada en el codo.' },
    { id: 'grada', name: 'La grada', trace: 'Una quemadura de sol nueva en la nuca.' },
    { id: 'parking', name: 'El aparcamiento', trace: 'Polvo blanco de camino de tierra en los zapatos.' },
  ],
  sceneZones: ['central', 'cafeteria'],
  sceneNotes: {
    central: 'La red de la pista central estuvo sin vigilar durante el calentamiento.',
    cafeteria: 'Las fotos se imprimieron en la cafetería y se colgaron desde la puerta de atrás.',
  },
  tags: ['deporte', 'amigos', 'torneo'],
} satisfies ScenarioDef;
