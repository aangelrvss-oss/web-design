import type { ScenarioDef } from '../types';

export default {
  id: 'observatorio-ovni',
  title: 'El ovni del telescopio',
  venue: 'Noche de lluvia de estrellas en un observatorio de la sierra de Almería',
  incident:
    'Alguien ha pegado un ovni de cartulina en la lente del telescopio grande y la retransmisión en directo ya ha dicho «posible contacto». El director quiere explicaciones antes del amanecer.',
  culpritAction: 'pegó un ovni de cartulina en la lente del telescopio',
  slots: ['22:30', '00:00', '01:30'],
  zones: [
    { id: 'cupula', name: 'La cúpula', trace: 'Grasa del engranaje de giro en la manga.' },
    { id: 'tumbonas', name: 'Las tumbonas', trace: 'Rocío frío en la espalda de la chaqueta.' },
    { id: 'planetario', name: 'El planetario', trace: 'Una pegatina de estrella fosforescente en la suela.' },
    { id: 'cafeteria', name: 'La cafetería', trace: 'Una mancha de chocolate caliente en el puño.' },
    { id: 'aparcamiento', name: 'El aparcamiento', trace: 'Una piedrecita de grava dentro del zapato.' },
  ],
  sceneZones: ['cupula', 'planetario'],
  sceneNotes: {
    cupula: 'El telescopio grande vive bajo la cúpula, que solo se cierra con un pestillo.',
    planetario: 'El ovni salió del taller de recortables del planetario, y la lente estaba allí limpiándose.',
  },
  tags: ['ciencia', 'noche', 'cultura'],
} satisfies ScenarioDef;
