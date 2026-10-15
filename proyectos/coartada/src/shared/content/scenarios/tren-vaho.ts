import type { ScenarioDef } from '../types';

export default {
  id: 'tren-vaho',
  title: 'Mensajes en el vaho',
  venue: 'Tren nocturno de Madrid a Vigo, con literas y vagón bar',
  incident:
    'Alguien ha escrito «NO MIRES ATRÁS» en el vaho de todas las ventanillas y medio tren no ha pegado ojo. A las seis pasa el revisor y viene con muchas preguntas.',
  culpritAction: 'escribió «NO MIRES ATRÁS» en el vaho de las ventanillas',
  slots: ['23:00', '01:00', '03:00'],
  zones: [
    { id: 'bar', name: 'El vagón bar', trace: 'Sal de cacahuetes tostados en las yemas de los dedos.' },
    { id: 'literas', name: 'Las literas', trace: 'Pelusa de una manta de cuadros escoceses en el jersey.' },
    { id: 'pasillo', name: 'El pasillo', trace: 'El billete de otro pasajero pegado a la suela.' },
    { id: 'aseo', name: 'El aseo', trace: 'Olor a jabón rosa de dispensador en las manos.' },
    { id: 'plataforma', name: 'La plataforma', trace: 'Una mancha de grasa negra de los enganches en la manga.' },
  ],
  sceneZones: ['pasillo', 'literas', 'bar'],
  sceneNotes: {
    pasillo: 'El pasillo tiene ventanillas de punta a punta y de noche no lo vigila nadie.',
    literas: 'Con tanta gente durmiendo, las ventanillas de los compartimentos se empañan solas.',
    bar: 'En el vagón bar las ventanillas estaban empañadas por la cafetera.',
  },
  tags: ['viaje', 'tren', 'noche'],
} satisfies ScenarioDef;
