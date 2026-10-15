import type { ScenarioDef } from '../types';

export default {
  id: 'vecinos-audio',
  title: 'El audio del presidente',
  venue: 'Junta extraordinaria de una comunidad de vecinos de Zaragoza',
  incident:
    'Desde el móvil del presidente se ha enviado al grupo de la comunidad un audio de seis minutos de ronquidos. Ya tiene 31 vistos y la junta está a punto de empezar en el portal.',
  culpritAction: 'mandó un audio de ronquidos desde el móvil del presidente',
  slots: ['18:00', '19:00', '20:00'],
  zones: [
    { id: 'portal', name: 'El portal', trace: 'Un folleto de pizzería doblado en el bolsillo.' },
    { id: 'ascensor', name: 'El ascensor', trace: 'Olor a ambientador de lavanda en la chaqueta.' },
    { id: 'trasteros', name: 'Los trasteros', trace: 'Polvo de yeso blanco en las rodillas.' },
    { id: 'bicis', name: 'El cuarto de bicis', trace: 'Una mancha de grasa de cadena en el tobillo.' },
    { id: 'garita', name: 'La garita', trace: 'Cáscaras de pipas en el dobladillo del pantalón.' },
  ],
  sceneZones: ['garita', 'ascensor', 'portal'],
  sceneNotes: {
    garita: 'El presidente deja el móvil cargando en la garita del conserje.',
    ascensor: 'El presidente se olvidó el móvil en el ascensor, como cada semana.',
    portal: 'El móvil se quedó encima de los buzones mientras el presidente colgaba avisos.',
  },
  tags: ['vecinos', 'barrio', 'grupos'],
} satisfies ScenarioDef;
