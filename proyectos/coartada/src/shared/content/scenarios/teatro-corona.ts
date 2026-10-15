import type { ScenarioDef } from '../types';

export default {
  id: 'teatro-corona',
  title: 'La corona de colador',
  venue: 'Función de fin de curso de 4.º de Primaria en el salón de actos del cole',
  incident:
    'La corona del rey de la obra ha sido sustituida por un colador con lucecitas de Navidad. El rey sale a escena en cinco minutos y el patio de butacas está lleno de abuelos grabando.',
  culpritAction: 'cambió la corona del rey por un colador con lucecitas',
  slots: ['17:00', '17:45', '18:30'],
  zones: [
    { id: 'bambalinas', name: 'Las bambalinas', trace: 'Serrín de decorado pegado al jersey.' },
    { id: 'vestuario', name: 'El vestuario', trace: 'Un cascabel de disfraz de bufón en el bolsillo.' },
    { id: 'butacas', name: 'El patio de butacas', trace: 'Un programa de mano doblado en cuatro en el bolsillo.' },
    { id: 'luces', name: 'La cabina de luces', trace: 'Una gelatina de foco roja pegada al pulgar.' },
    { id: 'comedor', name: 'El comedor', trace: 'Olor a croquetas recién fritas en la ropa.' },
  ],
  sceneZones: ['vestuario', 'bambalinas', 'comedor'],
  sceneNotes: {
    vestuario: 'La corona colgaba de una percha en el vestuario, con el nombre del rey.',
    bambalinas: 'El rey dejó la corona en una silla entre bambalinas para ir al baño.',
    comedor: 'El colador salió de la cocina del comedor, que estaba abierta.',
  },
  tags: ['colegio', 'teatro', 'familia'],
} satisfies ScenarioDef;
