import type { ScenarioDef } from '../types';

export default {
  id: 'excursion-jirafa',
  title: 'Teodoro en la tirolina',
  venue: 'Excursión de fin de curso de 2.º de la ESO a un parque multiaventura',
  incident:
    'Teodoro, la jirafa de peluche mascota de la clase, cuelga en lo alto de la tirolina con casco y un cartel que dice «RESCATADME». El autobús de vuelta sale en una hora.',
  culpritAction: 'colgó a Teodoro en lo alto de la tirolina',
  slots: ['11:00', '13:00', '15:00'],
  zones: [
    { id: 'tirolina', name: 'La tirolina', trace: 'La marca de un arnés en la cintura del pantalón.' },
    { id: 'rocodromo', name: 'El rocódromo', trace: 'Polvo de tiza azul en las palmas.' },
    { id: 'merendero', name: 'El merendero', trace: 'Restos de bocata de tortilla en la sudadera.' },
    { id: 'autobus', name: 'El autobús', trace: 'Azúcar de gominola pegado en los dedos.' },
    { id: 'lago', name: 'El lago', trace: 'Las zapatillas empapadas y una brizna de alga en el cordón.' },
  ],
  sceneZones: ['tirolina', 'merendero'],
  sceneNotes: {
    tirolina: 'Teodoro solo pudo llegar ahí arriba bajando por el cable de la tirolina.',
    merendero: 'Teodoro se quedó solo en una mesa del merendero, y desde allí sale el cable.',
  },
  tags: ['colegio', 'excursión', 'aventura'],
} satisfies ScenarioDef;
