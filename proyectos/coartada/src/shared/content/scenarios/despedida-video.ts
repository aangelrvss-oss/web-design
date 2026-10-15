import type { ScenarioDef } from '../types';

export default {
  id: 'despedida-video',
  title: 'El vídeo de la estantería',
  venue: 'Despedida de soltera de Nerea en un apartamento con terraza en Cádiz',
  incident:
    'Alguien ha cambiado el vídeo sorpresa para la novia por un tutorial de cuarenta minutos sobre cómo montar una estantería. Se ha proyectado entero y Nerea exige saber quién ha sido.',
  culpritAction: 'cambió el vídeo sorpresa por un tutorial de estanterías',
  slots: ['22:00', '23:30', '01:00'],
  zones: [
    { id: 'terraza', name: 'La terraza', trace: 'Olor a dama de noche de las macetas en el pelo.' },
    { id: 'salon', name: 'El salón', trace: 'Un trozo de globo rosa reventado en el bolsillo.' },
    { id: 'cocina', name: 'La barra americana', trace: 'Restos de guacamole en la manga.' },
    { id: 'bano', name: 'El baño', trace: 'Una pestaña postiza pegada en la mejilla.' },
    { id: 'dormitorio', name: 'El dormitorio', trace: 'Una pluma rosa de diadema enganchada en el pelo.' },
  ],
  sceneZones: ['salon', 'dormitorio', 'terraza'],
  sceneNotes: {
    salon: 'El portátil con el vídeo estaba conectado al proyector del salón.',
    dormitorio: 'El pendrive con el vídeo sorpresa estaba escondido en una maleta del dormitorio.',
    terraza: 'El vídeo se montó en la terraza, con el portátil a la sombra de las macetas.',
  },
  tags: ['fiesta', 'amigos', 'despedida'],
} satisfies ScenarioDef;
