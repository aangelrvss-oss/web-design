import type { ScenarioDef } from '../types';

export default {
  id: 'navidad-amigo-invisible',
  title: 'El amigo invisible trucado',
  venue: 'Comida de Navidad de la familia Ortega en un chalé de Alcalá de Henares',
  incident:
    'Alguien ha cambiado todas las etiquetas del amigo invisible: al primo de seis años le toca un kit de afeitado y a la tía Rosi, un dinosaurio que ruge. Los regalos se abren en diez minutos.',
  culpritAction: 'cambió todas las etiquetas del amigo invisible',
  slots: ['13:30', '15:00', '16:30'],
  zones: [
    { id: 'arbol', name: 'El salón del árbol', trace: 'Espumillón plateado enganchado en el cinturón.' },
    { id: 'cocina', name: 'La cocina', trace: 'Olor a cordero asado con romero en el pelo.' },
    { id: 'abrigos', name: 'El cuarto de abrigos', trace: 'Pelusas de lana gris por todo el jersey.' },
    { id: 'jardin', name: 'El jardín', trace: 'Hierba húmeda y escarcha en los bajos del pantalón.' },
    { id: 'garaje', name: 'El garaje', trace: 'Una mancha de aceite de motor en la rodilla.' },
  ],
  sceneZones: ['arbol', 'abrigos', 'garaje'],
  sceneNotes: {
    arbol: 'Los regalos esperaban bajo el árbol, a la vista de todo el mundo.',
    abrigos: 'Antes de comer, alguien escondió los regalos entre los abrigos.',
    garaje: 'Los regalos se envolvieron en el garaje y allí se quedó el rollo de etiquetas.',
  },
  tags: ['familia', 'navidad', 'regalos'],
} satisfies ScenarioDef;
