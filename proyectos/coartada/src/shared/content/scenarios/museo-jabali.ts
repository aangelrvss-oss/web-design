import type { ScenarioDef } from '../types';

export default {
  id: 'museo-jabali',
  title: 'El jabalí con estilo',
  venue: 'La Noche de los Museos en un museo de ciencias naturales de provincias',
  incident:
    'El jabalí disecado de la sala de fauna ibérica lleva gafas de sol y una bufanda de lana a rayas. Ya se ha hecho fotos con él medio público y la directora sale en la tele dentro de un rato.',
  culpritAction: 'le puso gafas de sol y bufanda al jabalí disecado',
  slots: ['19:30', '21:00', '22:30'],
  zones: [
    { id: 'fauna', name: 'La fauna ibérica', trace: 'Olor a naftalina de vitrina en la chaqueta.' },
    { id: 'dinosaurios', name: 'Los dinosaurios', trace: 'Polvo de yeso de réplica en la manga.' },
    { id: 'minerales', name: 'Los minerales', trace: 'Un grano de pirita brillante en la suela.' },
    { id: 'taller', name: 'El taller infantil', trace: 'Plastilina naranja incrustada bajo una uña.' },
    { id: 'tienda', name: 'La tienda', trace: 'Una pegatina de un trilobites en la espalda.' },
  ],
  sceneZones: ['fauna', 'taller'],
  sceneNotes: {
    fauna: 'El jabalí no se ha movido de su vitrina abierta en la sala de fauna ibérica.',
    taller: 'El jabalí pasó la tarde en el taller infantil para una actividad de dibujo.',
  },
  tags: ['cultura', 'museo', 'noche'],
} satisfies ScenarioDef;
