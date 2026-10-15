import type { ScenarioDef } from '../types';

export default {
  id: 'boda-tarta',
  title: 'La tarta de la boda',
  venue: 'Boda de Lucía y Andrés en una masía del Empordà',
  incident:
    'A la tarta nupcial de cinco pisos le falta un mordisco enorme. Con dentadura. Los novios quieren un nombre antes del vals.',
  culpritAction: 'le pegó un mordisco a la tarta nupcial',
  slots: ['22:00', '23:00', '00:00'],
  zones: [
    { id: 'cocina', name: 'La cocina', trace: 'Una mancha de nata montada en la manga de una chaqueta.' },
    { id: 'pista', name: 'La pista de baile', trace: 'Confeti dorado pegado a la suela de un zapato.' },
    { id: 'jardin', name: 'El jardín', trace: 'Pétalos de buganvilla enredados en el pelo.' },
    { id: 'barra', name: 'La barra libre', trace: 'Una pulsera de la barra libre olvidada en un bolsillo.' },
    { id: 'capilla', name: 'La capilla', trace: 'Gotas de cera de vela en un puño de camisa.' },
  ],
  sceneZones: ['cocina', 'jardin', 'capilla'],
  sceneNotes: {
    cocina: 'La tarta esperaba en la cocina, lejos de miradas indiscretas.',
    jardin: 'La tarta estaba expuesta en el jardín para las fotos.',
    capilla: 'Por algún motivo, alguien había guardado la tarta en la capilla.',
  },
  tags: ['boda', 'comida'],
} satisfies ScenarioDef;
