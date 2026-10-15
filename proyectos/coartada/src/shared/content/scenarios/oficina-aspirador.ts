import type { ScenarioDef } from '../types';

export default {
  id: 'oficina-aspirador',
  title: 'El aspirador que dimitió',
  venue: 'Viernes de oficina en una consultora del centro de Valencia',
  incident:
    'El robot aspirador ha dejado escrito «DIMITO» en la moqueta del despacho del jefe, a base de pasadas. El jefe vuelve de una reunión a las 13:00 y no tiene sentido del humor.',
  culpritAction: 'programó al robot aspirador para escribir «DIMITO»',
  slots: ['09:30', '11:00', '12:30'],
  zones: [
    { id: 'reuniones', name: 'La sala de reuniones', trace: 'Tinta de rotulador de pizarra azul en el canto de la mano.' },
    { id: 'office', name: 'El office', trace: 'Una mancha de café con leche en el puño de la camisa.' },
    { id: 'reprografia', name: 'La reprografía', trace: 'Polvo de tóner negro bajo una uña.' },
    { id: 'despacho', name: 'El despacho del jefe', trace: 'Un caramelo de menta del cuenco de cristal en el bolsillo.' },
    { id: 'terraza', name: 'La terraza', trace: 'Una hoja seca de olivo enganchada en el cordón de la tarjeta.' },
  ],
  sceneZones: ['despacho', 'office', 'reuniones'],
  sceneNotes: {
    despacho: 'Bastaba con encerrar al robot en el despacho y guiarlo a mano.',
    office: 'La base de carga del robot está en el office, junto al microondas.',
    reuniones: 'La tablet que controla el robot se queda siempre en la sala de reuniones.',
  },
  tags: ['trabajo', 'oficina', 'tecnología'],
} satisfies ScenarioDef;
