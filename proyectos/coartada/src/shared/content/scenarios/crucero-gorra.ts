import type { ScenarioDef } from '../types';

export default {
  id: 'crucero-gorra',
  title: 'La gorra del capitán',
  venue: 'Noche de gala en un crucero por el Mediterráneo',
  incident:
    'El cisne de hielo del bufé lleva puesta la gorra del capitán, ladeada con mucho estilo. El capitán la necesita para la foto oficial y ya la ha reclamado dos veces por megafonía.',
  culpritAction: 'le puso la gorra del capitán al cisne de hielo',
  slots: ['20:00', '21:30', '23:00'],
  zones: [
    { id: 'cubierta', name: 'La cubierta', trace: 'Restos de crema solar blanca detrás de las orejas.' },
    { id: 'casino', name: 'El casino', trace: 'Una ficha de póquer de diez en el bolsillo de la chaqueta.' },
    { id: 'auditorio', name: 'El auditorio', trace: 'Lentejuelas azules de un traje de bailarina en el hombro.' },
    { id: 'bufe', name: 'El bufé', trace: 'Una mancha de salsa rosa en la pechera.' },
    { id: 'camarotes', name: 'Los camarotes', trace: 'Pelusa de moqueta azul marino en los calcetines.' },
  ],
  sceneZones: ['bufe', 'cubierta', 'auditorio'],
  sceneNotes: {
    bufe: 'El cisne de hielo preside el bufé desde la hora de la cena.',
    cubierta: 'El cisne se sacó un rato a cubierta para las fotos con la puesta de sol.',
    auditorio: 'El capitán se dejó la gorra en el auditorio tras presentar el espectáculo.',
  },
  tags: ['viaje', 'barco', 'gala'],
} satisfies ScenarioDef;
