import type { ScenarioDef } from '../types';

export default {
  id: 'gimnasio-ballenas',
  title: 'Spinning con ballenas',
  venue: 'Primera hora de la mañana en un gimnasio de barrio de Bilbao',
  incident:
    'Alguien ha bloqueado el hilo musical del gimnasio en cantos de ballena a todo volumen. La clase de spinning está empezando y el monitor no encuentra la contraseña por ninguna parte.',
  culpritAction: 'bloqueó el hilo musical del gimnasio en cantos de ballena',
  slots: ['07:00', '08:00', '09:00'],
  zones: [
    { id: 'pesas', name: 'La sala de pesas', trace: 'Restos de goma negra de los discos en las palmas.' },
    { id: 'sauna', name: 'La sauna', trace: 'Olor intenso a eucalipto en la piel.' },
    { id: 'spinning', name: 'La sala de spinning', trace: 'Una gota de bebida isotónica azul en la zapatilla.' },
    { id: 'recepcion', name: 'El mostrador', trace: 'Una pulsera magnética de taquilla olvidada en el bolsillo.' },
    { id: 'piscina', name: 'La piscina', trace: 'Pelo oliendo a cloro y marcas de gafas alrededor de los ojos.' },
  ],
  sceneZones: ['recepcion', 'spinning'],
  sceneNotes: {
    recepcion: 'El equipo de música del gimnasio está debajo del mostrador de la entrada.',
    spinning: 'El altavoz de la sala de spinning acepta cualquier móvil que se le acerque.',
  },
  tags: ['deporte', 'gimnasio', 'música'],
} satisfies ScenarioDef;
