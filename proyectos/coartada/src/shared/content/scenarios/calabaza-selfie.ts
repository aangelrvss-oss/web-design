import type { ScenarioDef } from '../types';

export default {
  id: 'calabaza-selfie',
  title: 'El selfie de la calabaza',
  venue: 'Concurso de calabazas gigantes en la feria agrícola de un pueblo de Navarra',
  incident:
    'La calabaza favorita, de 412 kilos, tiene tallado un selfie perfecto: alguien de este grupo guiñando un ojo, con media cara tapada por el pulgar. El jurado pasa a las nueve.',
  culpritAction: 'talló su propio selfie en la calabaza favorita',
  slots: ['05:30', '07:00', '08:30'],
  zones: [
    { id: 'exhibicion', name: 'La zona de exhibición', trace: 'Tierra negra y húmeda bajo las uñas.' },
    { id: 'bascula', name: 'La báscula', trace: 'Una marca de tiza amarilla en el pantalón.' },
    { id: 'jurado', name: 'La carpa del jurado', trace: 'Café de termo derramado en la manga.' },
    { id: 'churros', name: 'El puesto de churros', trace: 'Azúcar con canela en la barbilla.' },
    { id: 'remolques', name: 'Los remolques', trace: 'Paja enganchada en el jersey de lana.' },
  ],
  sceneZones: ['exhibicion', 'remolques', 'bascula'],
  sceneNotes: {
    exhibicion: 'La calabaza lleva expuesta desde ayer, sin más vigilancia que un cordón.',
    remolques: 'La calabaza pasó la noche en su remolque, tapada con una lona.',
    bascula: 'La calabaza se quedó un buen rato en la báscula esperando el pesaje oficial.',
  },
  tags: ['pueblo', 'concurso', 'campo'],
} satisfies ScenarioDef;
