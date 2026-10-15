import type { ScenarioDef } from '../types';

export default {
  id: 'biblioteca-arcoiris',
  title: 'El arcoíris de la novela negra',
  venue: 'Tarde de jueves en la biblioteca municipal de un barrio de Valladolid',
  incident:
    'Alguien ha reordenado por colores toda la sección de novela negra: desde la calle se ve un arcoíris perfecto y no hay quien encuentre nada. El club de lectura llega a las siete.',
  culpritAction: 'reordenó la novela negra por colores formando un arcoíris',
  slots: ['16:00', '17:00', '18:00'],
  zones: [
    { id: 'novela', name: 'La novela negra', trace: 'Un marcapáginas de cartulina con borla en el bolsillo.' },
    { id: 'infantil', name: 'La sala infantil', trace: 'Una pegatina de estrella dorada en la rodilla.' },
    { id: 'hemeroteca', name: 'La hemeroteca', trace: 'Tinta de periódico en las yemas de los dedos.' },
    { id: 'estudio', name: 'La sala de estudio', trace: 'El tapón de un subrayador amarillo en el bolsillo.' },
    { id: 'deposito', name: 'El depósito', trace: 'Polvo gris de libros viejos en las mangas.' },
  ],
  sceneZones: ['novela', 'deposito'],
  sceneNotes: {
    novela: 'Para reordenar una sección entera hay que pasar un buen rato delante de ella.',
    deposito: 'Los libros se ordenaron en el carrito del depósito y luego se colocaron de golpe.',
  },
  tags: ['cultura', 'biblioteca', 'barrio'],
} satisfies ScenarioDef;
