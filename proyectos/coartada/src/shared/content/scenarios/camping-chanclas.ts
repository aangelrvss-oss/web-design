import type { ScenarioDef } from '../types';

export default {
  id: 'camping-chanclas',
  title: 'Las chanclas del mástil',
  venue: 'Último fin de semana de agosto en un camping de la Costa Brava',
  incident:
    'Todas las chanclas de la parcela 14 cuelgan del mástil de la bandera, ordenadas por tallas. La familia entera va descalza a las duchas y exige un nombre antes de bajar a la playa.',
  culpritAction: 'colgó todas las chanclas de la parcela 14 del mástil',
  slots: ['06:00', '07:00', '08:00'],
  zones: [
    { id: 'duchas', name: 'Las duchas', trace: 'Olor a gel de manzana verde en el cuello.' },
    { id: 'parcela', name: 'La parcela 14', trace: 'Restos de carbón de barbacoa en los dedos.' },
    { id: 'pinar', name: 'El pinar', trace: 'Una gota de resina pegajosa en el pulgar.' },
    { id: 'recepcion', name: 'La recepción', trace: 'Un folleto arrugado de excursiones en kayak.' },
    { id: 'cala', name: 'La cala', trace: 'Arena fina metida dentro de los calcetines.' },
  ],
  sceneZones: ['parcela', 'recepcion', 'pinar'],
  sceneNotes: {
    parcela: 'Las chanclas dormían en fila en la puerta de la tienda de campaña.',
    recepcion: 'El mástil de la bandera está justo delante de la recepción.',
    pinar: 'Desde el pinar se llega al mástil sin pasar por delante de nadie.',
  },
  tags: ['viaje', 'camping', 'verano'],
} satisfies ScenarioDef;
