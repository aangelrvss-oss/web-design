import type { ScenarioDef } from '../types';

export default {
  id: 'abuela-viral',
  title: 'La abuela viral',
  venue: '90 cumpleaños de la abuela Encarna en su casa de pueblo de Cuenca',
  incident:
    'Alguien ha subido al estado de la abuela un vídeo suyo bailando un pasodoble con la fregona. Ya lo ha visto medio pueblo y la abuela quiere un nombre antes de soplar las velas.',
  culpritAction: 'subió al estado de la abuela su pasodoble con la fregona',
  slots: ['14:00', '16:00', '18:00'],
  zones: [
    { id: 'comedor', name: 'El comedor', trace: 'Migas de rosquilla de anís pegadas al jersey.' },
    { id: 'cocina', name: 'La cocina de leña', trace: 'Olor a sofrito de ajo en las manos.' },
    { id: 'patio', name: 'El patio', trace: 'Una hoja de parra enganchada en el pelo.' },
    { id: 'costura', name: 'El cuarto de costura', trace: 'Un hilo rojo de hilvanar colgando del pantalón.' },
    { id: 'salita', name: 'La salita de la tele', trace: 'Pelusa de un tapete de ganchillo pegada a la manga.' },
  ],
  sceneZones: ['cocina', 'salita', 'patio'],
  sceneNotes: {
    cocina: 'La abuela dejó el móvil en la cocina, al lado de la fregona protagonista.',
    salita: 'El móvil de la abuela se carga siempre encima de la tele.',
    patio: 'El patio es el único rincón de la casa con cobertura decente.',
  },
  tags: ['familia', 'cumpleaños', 'redes'],
} satisfies ScenarioDef;
