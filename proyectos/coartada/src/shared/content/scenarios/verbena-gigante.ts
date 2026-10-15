import type { ScenarioDef } from '../types';

export default {
  id: 'verbena-gigante',
  title: 'El gigante en remojo',
  venue: 'Verbena de las fiestas patronales de un pueblo de Teruel',
  incident:
    'El gigante del fundador del pueblo ha amanecido con gorro de piscina, gafas de bucear y manguitos de patito. El desfile sale a mediodía y la comisión de fiestas quiere un nombre ya.',
  culpritAction: 'le puso gorro, gafas y manguitos al gigante del pueblo',
  slots: ['00:30', '02:00', '03:30'],
  zones: [
    { id: 'pena', name: 'La barra de la peña', trace: 'Una mancha pegajosa de refresco de naranja en la camiseta.' },
    { id: 'orquesta', name: 'La orquesta', trace: 'Serpentinas de colores enredadas en el pelo.' },
    { id: 'almacen', name: 'El almacén municipal', trace: 'Serrín y olor a cartón piedra en las manos.' },
    { id: 'fronton', name: 'El frontón', trace: 'Marcas de cal blanca de pared en la espalda.' },
    { id: 'choques', name: 'Los coches de choque', trace: 'Olor a goma caliente y una ficha dorada en el bolsillo.' },
  ],
  sceneZones: ['almacen', 'fronton', 'orquesta'],
  sceneNotes: {
    almacen: 'Los gigantes pasan la noche guardados en el almacén municipal.',
    fronton: 'El gigante quedó expuesto en el frontón para las fotos de la verbena.',
    orquesta: 'El gigante bailó junto a la orquesta y lo dejaron aparcado detrás del escenario.',
  },
  tags: ['pueblo', 'fiestas', 'verbena'],
} satisfies ScenarioDef;
