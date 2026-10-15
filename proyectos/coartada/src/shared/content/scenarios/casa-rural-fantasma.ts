import type { ScenarioDef } from '../types';

export default {
  id: 'casa-rural-fantasma',
  title: 'El fantasma del desván',
  venue: 'Fin de semana entre amigos en una casa rural de la sierra de Gredos',
  incident:
    'El libro de visitas tiene una reseña de tres páginas firmada por «El fantasma del desván», quejándose del ruido. La dueña viene a traer el desayuno a las nueve y siempre lo lee.',
  culpritAction: 'firmó una reseña de tres páginas como el fantasma del desván',
  slots: ['22:00', '00:00', '02:00'],
  zones: [
    { id: 'chimenea', name: 'La chimenea', trace: 'Olor a humo de leña de encina en la ropa.' },
    { id: 'desvan', name: 'El desván', trace: 'Telarañas finas pegadas al pelo.' },
    { id: 'despensa', name: 'La despensa', trace: 'Una gota de miel de romero en el pulgar.' },
    { id: 'jacuzzi', name: 'El jacuzzi', trace: 'Las puntas del pelo húmedas y oliendo a bromo.' },
    { id: 'porche', name: 'El porche', trace: 'Una picadura de mosquito recién estrenada en el tobillo.' },
  ],
  sceneZones: ['chimenea', 'desvan', 'porche'],
  sceneNotes: {
    chimenea: 'El libro de visitas vive en la repisa de la chimenea.',
    desvan: 'Alguien subió el libro al desván para escribir con ambiente.',
    porche: 'El porche era el único sitio con luz y sin nadie cantando.',
  },
  tags: ['viaje', 'casa rural', 'amigos'],
} satisfies ScenarioDef;
