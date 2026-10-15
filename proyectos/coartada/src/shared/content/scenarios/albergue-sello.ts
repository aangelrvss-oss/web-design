import type { ScenarioDef } from '../types';

export default {
  id: 'albergue-sello',
  title: 'El sello de la patata',
  venue: 'Noche en un albergue de peregrinos del Camino de Santiago',
  incident:
    'Alguien ha estampado en todas las credenciales un sello casero: una patata con gafas tallada a navaja. Mañana hay que enseñarlas en Santiago y nadie quiere dar explicaciones.',
  culpritAction: 'selló todas las credenciales con una patata con gafas',
  slots: ['19:00', '20:30', '22:00'],
  zones: [
    { id: 'dormitorio', name: 'El dormitorio', trace: 'Olor a crema para ampollas en las manos.' },
    { id: 'cocina', name: 'La cocina común', trace: 'Piel de cebolla pegada en la manga.' },
    { id: 'tendedero', name: 'El tendedero', trace: 'Una pinza de madera enganchada al bajo de la camiseta.' },
    { id: 'recepcion', name: 'La recepción', trace: 'Tinta morada de tampón en el canto de la mano.' },
    { id: 'fuente', name: 'La fuente del patio', trace: 'Agua fría salpicada en los bajos del pantalón.' },
  ],
  sceneZones: ['recepcion', 'cocina', 'dormitorio'],
  sceneNotes: {
    recepcion: 'Las credenciales se dejan en recepción para sellarlas por la mañana.',
    cocina: 'En la cocina había patatas y una navaja de pelar.',
    dormitorio: 'Cada credencial dormía en la mochila de su peregrino.',
  },
  tags: ['viaje', 'camino', 'albergue'],
} satisfies ScenarioDef;
