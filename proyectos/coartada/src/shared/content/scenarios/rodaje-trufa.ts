import type { ScenarioDef } from '../types';

export default {
  id: 'rodaje-trufa',
  title: 'La trufa de pega',
  venue: 'Grabación de la final de un concurso de cocina de la tele en Madrid',
  incident:
    'La trufa del ingrediente sorpresa de la final es una piedra pintada con rotulador negro. El cofre se abre ante las cámaras en veinte minutos y la trufa de verdad no aparece.',
  culpritAction: 'cambió la trufa de la final por una piedra pintada',
  slots: ['09:00', '11:00', '13:00'],
  zones: [
    { id: 'plato', name: 'El plató', trace: 'Un trozo de cinta fosforito de marcar posiciones en la suela.' },
    { id: 'camerinos', name: 'Los camerinos', trace: 'Polvos de maquillaje naranja en el cuello de la camisa.' },
    { id: 'despensa', name: 'La despensa', trace: 'Olor a cebolleta fresca en los dedos.' },
    { id: 'control', name: 'El control', trace: 'El pelo aplastado por unos auriculares de diadema.' },
    { id: 'catering', name: 'El catering', trace: 'Una gota de gazpacho en la pechera.' },
  ],
  sceneZones: ['despensa', 'plato'],
  sceneNotes: {
    despensa: 'La trufa esperaba en la cámara de la despensa, envuelta en papel de cocina.',
    plato: 'El cofre ya estaba en el plató, cerrado pero sin candado.',
  },
  tags: ['trabajo', 'tele', 'cocina'],
} satisfies ScenarioDef;
