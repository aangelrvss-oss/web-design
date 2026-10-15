import type { ScenarioDef } from '../types';

export default {
  id: 'festival-bocata',
  title: 'La pantalla del bocata',
  venue: 'Segunda noche de un festival de música junto al mar en Castellón',
  incident:
    'La pantalla gigante del escenario principal emite en bucle un vídeo vertical de alguien comiéndose un bocata de calamares a cámara lenta. El cabeza de cartel sale en veinte minutos.',
  culpritAction: 'puso en la pantalla gigante el vídeo del bocata de calamares',
  slots: ['21:00', '23:00', '01:00'],
  zones: [
    { id: 'torre', name: 'La torre de sonido', trace: 'Un trozo de cinta adhesiva negra pegado en la rodilla.' },
    { id: 'comida', name: 'La zona de comida', trace: 'Olor a churrería en toda la sudadera.' },
    { id: 'acampada', name: 'La acampada', trace: 'Barro seco hasta media pierna.' },
    { id: 'backstage', name: 'El backstage', trace: 'Una acreditación de «Staff» doblada en el bolsillo.' },
    { id: 'banos', name: 'Los baños químicos', trace: 'Olor a desinfectante azul en las zapatillas.' },
  ],
  sceneZones: ['torre', 'backstage', 'comida'],
  sceneNotes: {
    torre: 'Desde la torre de sonido se controla todo lo que sale en la pantalla.',
    backstage: 'En el backstage hay un portátil conectado a la pantalla sin contraseña.',
    comida: 'El vídeo se grabó en la zona de comida y se subió desde su wifi.',
  },
  tags: ['ocio', 'festival', 'música'],
} satisfies ScenarioDef;
