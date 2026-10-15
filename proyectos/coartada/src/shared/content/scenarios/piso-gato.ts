import type { ScenarioDef } from '../types';

export default {
  id: 'piso-gato',
  title: 'El gato rapado',
  venue: 'Fiesta de cumpleaños en un piso compartido de Lavapiés',
  incident:
    'Michi, el gato persa del casero, ha aparecido con un rapado tipo mohicano. El casero viene mañana a por la fianza.',
  culpritAction: 'le hizo un mohicano a Michi',
  slots: ['23:00', '00:00', '01:00'],
  zones: [
    { id: 'salon', name: 'El salón', trace: 'Restos de purpurina de la decoración en las rodillas.' },
    { id: 'bano', name: 'El baño', trace: 'Olor intenso a la colonia de coco del baño.' },
    { id: 'balcon', name: 'El balcón', trace: 'Ceniza de las macetas-cenicero en un zapato.' },
    { id: 'cocina', name: 'La cocina', trace: 'Una mancha de salmorejo en la camiseta.' },
    { id: 'cuarto', name: 'El cuarto de Leire', trace: 'Pelos de la alfombra de pelo largo en los calcetines.' },
  ],
  sceneZones: ['bano', 'cuarto', 'balcon'],
  sceneNotes: {
    bano: 'La maquinilla de cortar el pelo vive en el baño.',
    cuarto: 'Michi duerme siempre encima de la cama de Leire.',
    balcon: 'Michi estaba tomando el fresco en el balcón.',
  },
  tags: ['piso', 'animales', 'fiesta'],
} satisfies ScenarioDef;
