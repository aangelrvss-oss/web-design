# Escenas cinematográficas con Higgsfield: dirección artística, prompts e importación

Objetivo: sustituir las 25 escenas SVG (`docs/ESCENAS.md`) por ilustraciones noir de acabado comparable al de los personajes. Las SVG se quedan solo como respaldo, sin más trabajo sobre ellas.

## 1. Disponibilidad real (19-10-2026)

| Comprobación | Resultado |
|---|---|
| Herramientas de Higgsfield en la sesión | **Sí.** Generación de imagen y vídeo, catálogo de modelos, subida de medios y saldo. |
| Generar una imagen | **Sí.** Se genera en los servidores de Higgsfield. |
| Subir una imagen de referencia (los personajes) desde este entorno | **No.** La política de red bloquea `upload.higgsfield.ai`. |
| Descargar el resultado a este entorno | **No.** La política de red bloquea `d8j0ntlcm91z4.cloudfront.net` (resultados), `d2ol7oe51mr4n9.cloudfront.net` (medios) y `higgsfield.ai`. |
| Ver el resultado desde aquí | **No.** La herramienta devuelve solo la URL. La imagen solo se ve en el widget de Higgsfield, en tu lado. |

Consecuencia: la generación funciona, pero ninguna imagen puede llegar al repositorio ni evaluarse dentro de la interfaz real desde este entorno. No hay ninguna imagen de Higgsfield integrada y ninguna escena se ha marcado como generada sin haberla visto.

### Precios comprobados (créditos por imagen, formato 21:9)

| Modelo | Calidad / resolución | Créditos |
|---|---|---|
| GPT Image 2.5 (`gpt_image_2_5`) | alta, 2k (2688 × 1152) | 2,75 |
| GPT Image 2.5 | media, 1k | 0,5 |
| Nano Banana 2.1 | 2k | 2 |
| FLUX 3 | 1,5k | 2 |

Elegido para los pilotos: **GPT Image 2.5, calidad alta, 2k, 21:9**. Es el modelo general por defecto de Higgsfield, admite referencias de imagen y controla bien el «sin texto».

Las 25 escenas costarían unos 69 créditos, más las repeticiones.

## 2. Referencia maestra de estilo

La referencia visual es la hoja de personajes aprobada: tinta, sombreado cruzado, papel crema, rojo como único acento y azul pizarra apagado. Para dársela al modelo como imagen hay dos caminos:

1. **Lo preparado.** `style-ref.png`: seis tarjetas de personaje, sin rótulos de la interfaz para que el modelo no copie texto. No se pudo subir por el bloqueo de red.
2. **Lo que funciona sin subir nada.** Usar el **piloto aprobado** como referencia de los demás. Higgsfield acepta el identificador de un trabajo anterior como imagen de referencia (`medias: [{ value: <job_id>, role: "image_references" }]`). Se recomienda este: fija luz, paleta y textura con una escena, no con retratos.

Bloque de estilo común (va al principio de cada prompt):

```
STYLE: Graphic-novel noir illustration for a detective party game. Hand-inked linework with confident brush strokes and crosshatched shadows, muted gouache and watercolor washes on warm cream paper, subtle paper grain. Stylized realism: believable materials (worn wood, rough stone, brass, glass, fabric) but clearly illustrated, never a photograph. Cinematic low-key lighting from one motivated source, deep inky black shadows with soft falloff. Restrained palette: ink black, charcoal greys, warm cream and sepia, muted slate blue, and a single controlled accent of deep crimson red on the key clue only. Wide establishing shot, eye level, clear depth with foreground, midground and background; the key clue sits in the central third, large and readable at small size, with calmer darker areas toward the left and right edges. Empty scene: no people, no figures, no faces. No text, no letters, no numbers, no signage, no logos, no watermark, no frame or border.
```

Qué fija cada parte:

| Aspecto | Cómo se fija |
|---|---|
| Realismo | «Stylized realism… clearly illustrated, never a photograph», con el mismo acabado de tinta y aguada que los retratos. |
| Luz y sombra | Una sola fuente motivada por escena (luna, foco, lámpara…), sombras de tinta profundas. |
| Paleta | Negro, grises, crema y sepia, azul pizarra; rojo carmesí solo en la pista. |
| Textura | Trazo de pincel, sombreado cruzado, aguada y grano de papel. |
| Composición | **16:9** (decidido tras ver el piloto 1 en la interfaz; ver sección 3); la pista en el centro, grande; bordes más oscuros y tranquilos. |
| Lo prohibido | Personas, caras, texto, números, rótulos, logos, marcos. |

Parámetros para todas: `model: gpt_image_2_5`, `aspect_ratio: 16:9` (el piloto 1 se generó a 21:9), `quality: high`, `resolution: 2k`, `count: 1`. Desde el segundo piloto: `medias: [{ value: "<job_id del piloto aprobado>", role: "image_references" }]`.

## 3. Pilotos

Tres casos muy distintos: interior rústico nocturno, gran sala institucional y plató con luz artificial dura.

| Piloto | Caso | Estado | Trabajo de Higgsfield |
|---|---|---|---|
| 1 | `casa-rural-fantasma` | v1 **revisada en la interfaz** (la enviaste tú); se pidió refinarla. Dos variantes del refinado **generadas, sin revisar** | v1 (2688 × 1152, 21:9), refinado A y refinado B (2688 × 1520, 16:9); identificadores en `art/scene-jobs.local.json` |
| 2 | `museo-jabali` | **Generado, sin revisar**, con la variante B como referencia | En `art/scene-jobs.local.json` (2688 × 1520) |
| 3 | `rodaje-trufa` | **Generado, sin revisar** (ídem) | En `art/scene-jobs.local.json` (2688 × 1520) |

### Piloto 1: revisión de la v1 dentro del juego

Importada desde la copia que enviaste y vista en la pantalla real de declaración a 320, 360, 390 y 1280 px. Después se retiró de los recursos, porque no está aprobada.

- **Calidad.** Muy por encima de las SVG. La escena es correcta y reconocible: desván, baúl, libro con cinta roja, pluma, sábana con agujeros, ventana redonda con luna, trampilla con farol. No hay texto legible ni personas.
- **Estilo.** Más cercana al *concept art* detallado que a los retratos, como señalaste: microdetalle en madera y piedra, sombras muy empastadas y haz de luna dominante.
- **Encuadre.** En la tira 8:3 de las SVG perdía la cabeza de la sábana y la base del baúl. **Decisión:** las ilustraciones se muestran en su propio marco **16:9**, sin recorte (199 px de alto a 390 px de ancho; el texto del incidente baja unos 64 px). Comprobado con la v1 recortada a 16:9: se ven enteros la sábana, el baúl, el libro, la ventana y la trampilla, sin desplazamiento horizontal en ningún ancho.
- **Peso real** de la v1 en WebP 16:9: **139,7 KB** (1440 × 810) y **40,2 KB** (720 × 405). Un móvil normal descarga la de 720 o la de 1440 según su densidad de pantalla.

### Piloto 1: refinado hacia el estilo de los personajes

Edición del piloto con su propio trabajo como imagen de entrada (no hace falta subir nada). Los retratos no se pudieron adjuntar como referencia directa (la subida está bloqueada), así que su acabado se describe en el prompt. Dos variantes (5,5 créditos):

```
Edit the reference image. This is a refinement, not a reinterpretation: keep the same attic, the same composition and camera angle, and every main element in the same place — the steep timber A-frame roof beams, the rough stone walls, the round window with its cross-shaped frame and the full moon, the large old wooden trunk in the centre, the open guest book on it with the long fold-out sheet hanging over the front, the crimson ribbon bookmark, the black fountain pen, the white bedsheet ghost costume with two eye holes hanging from the beam behind the trunk, the rocking chair on the left, the stacked boxes and baskets, and the open floor hatch on the right with warm lantern light rising from below. Recompose gently to a 16:9 frame by extending the scene a little above and below; do not add new objects.

Restyle it to match the character portraits of a noir detective party game: a stylized graphic-novel illustration with bold, confident ink contour lines around every major shape, deliberate graphic silhouettes, shading built from a few readable flat masses of tone with crosshatching only inside the deepest shadows, and visible but controlled painterly gouache texture on warm cream paper. Simplify the micro-detail: fewer wood grain lines, fewer individual stones, cleaner fabric folds, simpler cobwebs, so the image reads clearly at small size. Forms slightly stylized while keeping volume and believable materials. Strong but not extreme contrast between light and shadow, the lighting of a cinematic illustration rather than a photograph or a 3D render.

Limited palette: charcoal, blue-black, aged browns, warm cream, small warm amber accents from the lantern, and the crimson ribbon as the only discreet saturated accent. Make the moonbeam from the window softer and less dominant. Gently lift the central area and the heaviest shadows so the trunk, the open book and the ghost sheet read clearly on a dim phone screen, while keeping depth and darker edges and corners. Do not make the image darker overall.

Keep the handwriting on the pages as loose abstract ink strokes with no legible letters. No people, no faces, no characters, no text, no letters, no logos, no frame, no border, no interface, no magical effects, no exaggerated particles, no saturated colours, not cartoonish, not photographic.
```

Parámetros: `gpt_image_2_5`, `16:9`, calidad alta, 2k, `medias: [{ value: "<trabajo de la v1>", role: "image_references" }]`, `count: 2`.

**Aprobada: variante B** (su trabajo, en `art/scene-jobs.local.json` como `_estilo`), elegida por ti. Es la referencia de estilo de todas las demás escenas.

- **Integrada** en el caso `casa-rural-fantasma` (`src/client/assets/scenes/casa-rural-fantasma.webp` y `-720.webp`, WebP calidad 0,72).
- **Revisada en la pantalla real** a 320, 360, 390 y 1280 px:
  - sábana, libro con cinta roja, baúl, ventana y trampilla se ven enteros;
  - el centro es más claro que en la v1;
  - no hay texto legible ni personas;
  - no hay desplazamiento horizontal.
- **Peso:**

  | Calidad WebP | 1440 × 810 | 720 × 405 |
  |---|---|---|
  | 0,8 | 200,5 KB | 57,8 KB |
  | 0,72 | **154,6 KB** | **44,7 KB** |

  A 0,72 no hay diferencia visible ni ampliando 4×, así que es el valor por defecto del script de importación.

### Bloque de estilo para todas las demás escenas

Sustituye al bloque `STYLE` de la sección 2. Va con `medias: [{ value: "<trabajo de la variante B: _estilo en art/scene-jobs.local.json>", role: "image_references" }]`, `aspect_ratio: 16:9`, calidad alta y 2k, seguido del bloque `SCENE` de cada caso (sección 5):

```
STYLE REFERENCE ONLY: match the exact illustration style of the reference image — the same bold ink contour lines, shading in a few readable flat masses of tone with crosshatching only in the deepest shadows, controlled painterly gouache texture, limited palette of charcoal, blue-black, aged browns and warm cream with one discreet crimson accent, the same quality of cinematic low-key lighting, the same level of stylization and detail. Depict a completely different place: do not copy the attic, the trunk, the book, the ghost sheet or any object or layout from the reference.

Composition: 16:9 wide shot at eye level, clear depth, the key clue large and centred, darker calmer edges and corners, central area readable on a dim phone screen. No people, no faces, no figures, no text, no letters, no numbers, no signage, no logos, no frame, no border.
```

Pilotos 2 y 3: generados con este bloque. No se han podido revisar desde aquí y están pendientes de que los veas. Sin poder verlos ni probarlos en la interfaz serían créditos gastados a ciegas, y la referencia buena para ellos es el piloto 1 aprobado.

### Cómo evaluarlos

En `qa-out/scenes-pilots/` habrá una hoja comparativa con cada piloto en la cabecera real del caso, a 320, 360 y 390 px y en escritorio, junto a su SVG actual. Se aprueba si cumple los 9 criterios del encargo. En concreto:

- la pista se reconoce a 320 px;
- el marco 16:9 no corta la pista;
- no hay texto ni letras inventadas;
- no hay personas;
- la paleta es la de los personajes;
- el título y el incidente siguen legibles alrededor.

Ajustes previsibles, según lo que suele hacer este modelo (sin comprobar todavía):

| Si pasa esto… | …se ajusta así |
|---|---|
| Sale demasiado «foto» | Reforzar «ink linework, crosshatching, gouache». |
| Mete garabatos que parecen letras | Quitar el libro manuscrito o pedir «blank pages». |
| Satura el rojo | «Only one small red element». |
| Composición demasiado cargada | «Fewer props, more negative space». |

## 4. Matriz de los 25 casos

Cada prompt = bloque de estilo + bloque `SCENE` de su fila (los bloques completos están en la sección 5). Todas comparten estilo y ninguna comparte lugar, luz ni objeto principal.

| ID | Título | Escenario y contexto | Elementos distintivos | Luz y atmósfera | Composición | Acento | Archivo previsto | Estado |
|---|---|---|---|---|---|---|---|---|
| boda-tarta | La tarta de la boda | Masía del Empordà, boda de Lucía y Andrés, de noche | Tarta de cinco pisos con un mordisco enorme con marcas de dientes, arcos de piedra, guirnaldas de bombillas, copas abandonadas | Bombillas cálidas y luna fría al fondo | Tarta en el centro, arco de piedra a la izquierda, jardín oscuro a la derecha | Una cereza o flor roja junto al mordisco | `scenes/boda-tarta.webp` | **Integrado** |
| piso-gato | El gato rapado | Salón de un piso compartido de Lavapiés tras una fiesta de cumpleaños | Gato persa con una cresta rapada sobre el sofá, maquinilla eléctrica en el suelo, mechones de pelo, globos desinflados | Farola naranja por el balcón | Gato en el centro, balcón con barandilla al fondo | Cresta teñida de carmesí apagado | `scenes/piso-gato.webp` | **Integrado** |
| oficina-aspirador | El aspirador que dimitió | Despacho del jefe en una consultora de Valencia, viernes | Robot aspirador al final de un rastro de pasadas en la moqueta que forman un dibujo deliberado (sin letras), mesa del jefe, persianas | Sol de mediodía entre las lamas | Moqueta en perspectiva hacia la mesa; robot en el centro | Piloto rojo del robot | `scenes/oficina-aspirador.webp` | **Integrado** |
| abuela-viral | La abuela viral | Comedor de una casa de pueblo de Cuenca, 90 cumpleaños | Móvil apoyado en un frutero; en la pantalla, una silueta diminuta bailando con una fregona; la fregona real apoyada en la pared; tarta con muchas velas | Luz de las velas y del móvil | Móvil en el centro; reja de ventana y aparador al fondo | Corazones rojos saliendo de la pantalla | `scenes/abuela-viral.webp` | **Integrado** |
| navidad-amigo-invisible | El amigo invisible trucado | Salón del árbol de un chalé de Alcalá de Henares, comida de Navidad | Regalos con etiquetas en blanco cruzadas con cordel, un dinosaurio de juguete asomando, un kit de afeitado en una caja infantil | Luces del árbol, chimenea | Árbol a la izquierda, montón de regalos en el centro | Lazo rojo del regalo trucado | `scenes/navidad-amigo-invisible.webp` | **Integrado** |
| crucero-gorra | La gorra del capitán | Bufé de la noche de gala de un crucero por el Mediterráneo | Cisne de hielo con la gorra de capitán ladeada, mesa del bufé, ojos de buey con el mar nocturno | Lámparas de cristal y reflejos fríos del hielo | Cisne en el centro sobre la bandeja; ojos de buey detrás | Escudo rojo de la gorra | `scenes/crucero-gorra.webp` | **Integrado** |
| tren-vaho | Mensajes en el vaho | Pasillo de un tren nocturno Madrid–Vigo | Ventanilla empañada con trazos de dedo abstractos y gotas que escurren, paisaje nocturno borroso, puertas de literas | Luz verdosa de pasillo y luna fuera | Ventanilla en el centro, pasillo fugando a la derecha | Luz roja de emergencia | `scenes/tren-vaho.webp` | **Integrado** |
| casa-rural-fantasma | El fantasma del desván | Desván de una casa rural de Gredos | Libro de visitas desplegado con una hoja extra, sábana con agujeros colgada, vigas, ventana redonda | Haz de luna y farol desde la trampilla | Libro en el centro sobre un baúl, sábana detrás | Cinta roja del libro | `scenes/casa-rural-fantasma.webp` | **Integrado** (variante B, referencia) |
| camping-chanclas | Las chanclas del mástil | Camping de la Costa Brava, último fin de semana de agosto, al amanecer | Mástil con chanclas colgadas de mayor a menor, parcela con tienda, pinos, cala al fondo | Amanecer neblinoso, contraluz | Mástil vertical en el centro, cala a la derecha | Bandera roja descolorida | `scenes/camping-chanclas.webp` | **Integrado** |
| albergue-sello | El sello de la patata | Cocina común de un albergue de peregrinos | Credenciales abiertas con sellos de patata con gafas, la patata tallada y su tampón, navaja, concha de vieira | Bombilla desnuda colgante | Credenciales en abanico en el centro de la mesa de madera | Tinta roja de los sellos | `scenes/albergue-sello.webp` | **Integrado** |
| vecinos-audio | El audio del presidente | Portal de una comunidad de vecinos de Zaragoza antes de la junta | Móvil sobre los buzones con una nota de voz en pantalla (forma de onda, sin texto), sillas plegables en semicírculo, ascensor antiguo de reja | Fluorescente frío y parpadeante | Móvil en el centro, sillas vacías delante | Triángulo rojo de reproducir | `scenes/vecinos-audio.webp` | **Integrado** |
| verbena-gigante | El gigante en remojo | Plaza de un pueblo de Teruel la mañana del desfile | Gigante de fiestas de cartón piedra con gorro de piscina, gafas de buceo y manguitos de patito, guirnaldas de verbena caídas | Primera luz del día, restos de la noche | Gigante en el centro, plaza con frontón detrás | Gorro de piscina rojo | `scenes/verbena-gigante.webp` | **Integrado** |
| escape-candado | El candado imposible | Sala del faraón de un escape room de un polígono de Sevilla | Candado de combinación enorme con ruedas lisas en una puerta de sarcófago, jeroglíficos decorativos sin significado, linternas | Luz de antorchas falsas | Candado en el centro de la puerta | Cadena roja de emergencia | `scenes/escape-candado.webp` | **Integrado** |
| karaoke-cancion | La canción infinita | Escenario de un karaoke de Malasaña | Pantalla de karaoke con una flauta dulce y el signo de infinito, micrófonos sobre pies, bola de espejos | Focos de colores apagados, bola de espejos | Pantalla en el centro, micros delante | Cable rojo del micro | `scenes/karaoke-cancion.webp` | **Integrado** |
| gimnasio-ballenas | Spinning con ballenas | Sala de spinning de un gimnasio de barrio de Bilbao, primera hora | Bicis en fila, altavoces de techo de los que sale una ballena fantasmal hecha de ondas de luz azul | Luz azulada del amanecer y del equipo de sonido | Ballena de luz atravesando la sala sobre las bicis | Candado rojo en el panel de música | `scenes/gimnasio-ballenas.webp` | **Integrado** |
| padel-red | La red de los bebés | Pista central de un club de pádel de Murcia antes de la final | Red llena de fotos de bebés sujetas con pinzas, palas y pelotas, cristales de la pista | Focos nocturnos de la pista | Red en el centro en perspectiva frontal | Pinzas rojas | `scenes/padel-red.webp` | **Integrado** |
| festival-bocata | La pantalla del bocata | Escenario principal de un festival junto al mar en Castellón | Pantalla gigante vertical con un bocata de calamares a cámara lenta, torres de sonido, vasos abandonados, mar al fondo | Contraluz de la pantalla, noche | Pantalla en el centro, explanada vacía delante | Pimiento rojo en el bocata | `scenes/festival-bocata.webp` | **Integrado** |
| museo-jabali | El jabalí con estilo | Sala de fauna ibérica de un museo de ciencias naturales, Noche de los Museos | Jabalí disecado con gafas de sol y bufanda de rayas sobre peana, vitrinas, esqueleto de dinosaurio en la sala contigua | Foco cenital y luna por ventanales | Jabalí en el centro, cordón de terciopelo delante | Rayas rojas de la bufanda | `scenes/museo-jabali.webp` | **Integrado** |
| rodaje-trufa | La trufa de pega | Plató de la final de un concurso de cocina en Madrid | Cofre abierto con una piedra pintada de negro, rotulador destapado, gorro de chef, cámaras de televisión | Foco duro de plató | Cofre en el centro sobre encimera de acero | Piloto rojo de la cámara | `scenes/rodaje-trufa.webp` | **Integrado** |
| teatro-corona | La corona de colador | Escenario del salón de actos de un colegio, función de 4.º | Colador con luces de Navidad sobre un cojín de terciopelo en un trono de cartón, telón, butacas vacías | Cañón de luz, telón entreabierto | Cojín en el centro del escenario | Terciopelo rojo del cojín y del telón | `scenes/teatro-corona.webp` | **Integrado** |
| biblioteca-arcoiris | El arcoíris de la novela negra | Sección de novela negra de una biblioteca municipal de Valladolid | Estantería ordenada por colores en un degradado de arcoíris apagado, escalera, carrito de devoluciones | Tarde dorada por los ventanales | Estantería frontal ocupando el centro | Excepción: arcoíris desaturado (es el incidente) | `scenes/biblioteca-arcoiris.webp` | **Integrado** |
| excursion-jirafa | Teodoro en la tirolina | Parque multiaventura en una excursión de 2.º de la ESO | Jirafa de peluche con casco colgada en lo alto de la tirolina con un cartel en blanco, plataformas en los árboles, lago | Mediodía tormentoso, nubes | Cable en diagonal, jirafa en el centro | Casco rojo | `scenes/excursion-jirafa.webp` | **Integrado** |
| calabaza-selfie | El selfie de la calabaza | Zona de exhibición de una feria agrícola de Navarra | Calabaza gigante con una cara tallada que guiña con el pulgar delante, báscula antigua con la aguja al tope, escarapela | Atardecer bajo una carpa | Calabaza en el centro sobre un palé | Escarapela roja | `scenes/calabaza-selfie.webp` | **Integrado** |
| observatorio-ovni | El ovni del telescopio | Cúpula de un observatorio en la sierra de Almería, lluvia de estrellas | Telescopio grande con un ovni de cartulina pegado con cinta en la lente, estrellas fugaces por la rendija, tumbonas | Noche estrellada, luz roja de observación | Telescopio en diagonal hacia la rendija | Linterna roja de astrónomo | `scenes/observatorio-ovni.webp` | **Integrado** |
| despedida-video | El vídeo de la estantería | Salón con terraza en Cádiz, despedida de soltera | Proyector lanzando a la pared un despiece de una estantería (dibujo técnico sin texto), globos, velo de novia en una silla | Haz del proyector, mar nocturno tras el ventanal | Pared proyectada en el centro | Banda roja de la novia (sin letras) | `scenes/despedida-video.webp` | **Integrado** |

## 5. Prompts individuales (bloque `SCENE`)

Se usan siempre detrás del bloque `STYLE` de la sección 2.

**boda-tarta.** SCENE: The stone courtyard of an old Catalan farmhouse in the Empordà, late at night after a wedding banquet. Round stone arches on the left open onto a dark garden; strings of warm bulbs sag overhead. In the centre, on a linen-covered table, a five-tier white wedding cake with piped cream has one enormous bite taken out of its side, clearly showing tooth marks in the sponge. Half-empty champagne glasses and a dropped napkin around it, rose petals on the flagstones. A single crimson flower lies next to the bite. Cold moonlight from the right, warm bulb light from above.

**piso-gato.** SCENE: The living room of a small shared flat in Lavapiés, Madrid, the morning after a birthday party. Deflated balloons, paper cups and a half-eaten cake on a low table. In the centre, sitting upright on a worn sofa cushion, a fluffy Persian cat with its body fur intact but a neat shaved punk mohawk along the top of its head, staring at the viewer with offended dignity; tufts of shaved fur scattered on the cushion. An electric hair clipper lies on the floor with its cable trailing. Orange street-lamp light through the balcony door with its iron railing; the mohawk tinted a muted crimson.

**oficina-aspirador.** SCENE: The private office of a boss in a consultancy in central Valencia, on a Friday just before one o'clock. A large desk with a leather chair and an empty in-tray, venetian blinds slicing bright midday sun into stripes across a grey carpet. Across the carpet, deliberate light-and-dark vacuum stripes form a large bold geometric pattern, like a message without letters. At the end of the trail, in the centre of the floor, a round robot vacuum sits still, its small red light glowing, as if it has just finished its work and resigned. A potted plant and a framed picture with no content in shadow.

**abuela-viral.** SCENE: The dining room of an old village house in Cuenca on a grandmother's ninetieth birthday. A heavy wooden table with an embroidered tablecloth, a birthday cake crowded with lit candles, a wrought-iron window grille and a dark dresser with china behind. In the centre, a smartphone propped against a fruit bowl glows brightly; on its screen a tiny silhouette of an elderly woman in a bun dances a paso doble with a mop, and small crimson hearts float up from the screen. The actual mop leans against the wall nearby. Candlelight and the cold glow of the phone.

**navidad-amigo-invisible.** SCENE: The living room of a family chalet in Alcalá de Henares during Christmas lunch. A tall decorated tree on the left with warm lights, a fireplace glowing on the right. In the centre, a pile of wrapped presents whose blank gift tags have been cut off and re-tied to the wrong parcels with loose string; one parcel torn open reveals a green toy dinosaur with its mouth open in a roar, another small child-sized box holds a shaving brush and razor. A single crimson bow on the tampered parcel. Crumpled wrapping paper on the rug.

**crucero-gorra.** SCENE: The gala-night buffet hall of a Mediterranean cruise ship. Crystal chandeliers, a long buffet table with silver trays of fruit and seafood, round portholes showing the dark sea and moonlight. In the centre, on a silver platter, a large ice sculpture of a swan, carved and glistening, wears a white captain's cap with a gold-and-crimson badge, tipped at a jaunty angle on its head; melting droplets run down the ice. Cold reflections on the ice, warm chandelier light above, a ship's intercom speaker on a column in the background.

**tren-vaho.** SCENE: The corridor of a night sleeper train from Madrid to Vigo, in the small hours. A long narrow corridor with sleeper cabin doors on the right, a fold-down seat, dim greenish corridor lamps. In the centre, a large train window completely fogged with condensation; across the fog, long finger-traced streaks and smears run in uneven lines, deliberately abstract with no letters, and droplets trickle down from them. Through the cleared streaks, a blurred dark landscape and a pale moon slide past. A small red emergency light glows above the window.

**casa-rural-fantasma.** SCENE: The attic of an old stone country house in the Gredos mountains, at night, during a weekend among friends. Heavy dark chestnut roof beams form a steep A-frame; a small round window lets a pale shaft of moonlight cut through floating dust. In the centre, on an old wooden trunk, the house guest book lies open with an extra fold-out sheet spilling over the edge, every page crowded with long looping handwriting drawn as abstract wavy ink strokes with no readable letters; a crimson ribbon bookmark and a fountain pen rest beside it. Behind it, a white bedsheet with two cut-out eye holes hangs from a nail on a beam like an abandoned ghost costume, faintly glowing in the moonlight. Cobwebs in the rafters, a dusty rocking chair half lost in shadow, warm lantern light rising through the open attic hatch in the floor. *(Prompt exacto del piloto 1.)*

**camping-chanclas.** SCENE: A campsite on the Costa Brava at dawn on the last weekend of August. Umbrella pines, a small dome tent and a camping table on a sandy pitch, a cove with calm sea visible through the trees on the right, morning mist. In the centre, a tall metal flagpole with a faded crimson flag; hanging from its rope in a neat vertical line are many pairs of flip-flops ordered by size, from a large adult pair at the top to tiny child flip-flops at the bottom, swaying slightly. Backlit by the low sun, long soft shadows on the sand.

**albergue-sello.** SCENE: The communal kitchen of a pilgrims' hostel on the Camino de Santiago, late at night. Thick stone walls, a long scrubbed wooden table, a bare bulb hanging from a cord, backpacks and walking sticks against the wall, a scallop shell hanging on a nail. In the centre of the table, several pilgrim passports opened like accordions, their stamp boxes filled with the same homemade crimson stamp: a cartoon potato wearing round glasses. Beside them, the carved half potato used as a stamp, an ink pad and a folding pocket knife with potato peelings.

**vecinos-audio.** SCENE: The entrance hall of a 1970s apartment building in Zaragoza just before an emergency residents' meeting. Rows of metal mailboxes, an old cage lift with a folding grille, terrazzo floor, a flickering fluorescent tube. Folding chairs set out in a half circle, all empty. In the centre, a smartphone lying face up on the mailbox shelf, its screen glowing with a voice-message bubble shown only as a long sound waveform and a small crimson play triangle, no text. Cold fluorescent light, deep shadows in the stairwell.

**verbena-gigante.** SCENE: The square of a small village in Teruel at first light, the morning after the patron saint's fiesta. Strings of festival bulbs and paper bunting sag between balconies, a stone fronton wall and a bandstand in the background, confetti on the cobbles. In the centre, a towering traditional papier-mâché festival giant figure of a dignified old founder with painted face and robes, wearing a crimson rubber swimming cap, diving goggles over its eyes and inflatable duck-shaped armbands on its arms. Pale blue dawn light, long shadows, a puddle reflecting the giant.

**escape-candado.** SCENE: The pharaoh's chamber of an escape room in an industrial estate in Seville. Fake sandstone walls with decorative pseudo-hieroglyphs that are clearly ornamental shapes, not writing; plastic torches with flickering bulbs, a painted sarcophagus. In the centre, the final door, chained shut with an enormous brass combination padlock whose wheels have plain blank faces, glinting in torchlight. A crimson emergency chain hangs beside it; scattered clue cards with no writing on the floor, a dusty flashlight.

**karaoke-cancion.** SCENE: The small stage of a karaoke bar in Malasaña, Madrid, late at night. A slowly turning mirror ball scatters light, dim coloured spotlights, velvet curtain, two microphones on stands with tangled cables. In the centre, the karaoke screen glows with a single image: a recorder flute drawn in simple lines next to an endless infinity symbol, no words. Empty stools at the bar in shadow, a crimson microphone cable coiled on the stage floor.

**gimnasio-ballenas.** SCENE: The spinning studio of a neighbourhood gym in Bilbao at six in the morning. Rows of stationary bikes facing a mirror wall, towels on the handlebars, blue dawn light through high windows. From the ceiling speakers, translucent ripples of pale blue light spread through the air and form the ghostly shape of a large whale gliding above the bikes, as if the music were visible. On the wall, a small sound-system panel with a crimson padlock glowing on it.

**padel-red.** SCENE: The centre court of a padel club in Murcia just before the final, at night under floodlights. Glass walls and blue artificial turf, white lines, an empty umpire chair. In the centre, the net seen almost head-on is covered from post to post with small instant photographs of chubby babies held on by crimson clothespins, slightly fluttering. Two crossed padel rackets and a few yellow balls on the turf in front. Hard white floodlight from above, deep night beyond the glass.

**festival-bocata.** SCENE: The main stage of a music festival by the sea in Castellón, twenty minutes before the headliner. A huge stage truss with speaker towers, smoke drifting, the sea and a dark horizon behind. In the centre, the giant vertical stage screen shows an enormous close-up of a calamari sandwich, golden fried rings and a crimson pepper strip in crusty bread, in slow-motion detail. The field in front is empty, with abandoned plastic cups and a lost hat. Backlight from the screen, cool night blue around.

**museo-jabali.** SCENE: The Iberian fauna hall of a provincial natural history museum during Museum Night, after the visitors have left. Tall arched windows with blue moonlight, glass display cases with stuffed birds in the dim background, the silhouette of a dinosaur skeleton deep in the shadows of the next gallery. In the centre, on a dark wooden plinth behind a velvet rope barrier, a stuffed wild boar stands proudly wearing dark round sunglasses and a knitted wool scarf with crimson and cream stripes wrapped around its neck. A blank brass plaque on the plinth. A single spotlight from above makes the boar the clear focus; the polished floor reflects it.

**rodaje-trufa.** SCENE: A television cooking-contest studio in Madrid, minutes before the live final. A dark soundstage with studio cameras on tripods and softbox lights at the edges, cables snaking across the floor. In the centre, on a brushed steel kitchen counter under a hard spotlight, an ornate wooden treasure chest with brass fittings stands open; inside, on dark velvet, sits a rough grey stone crudely coloured black with marker, unmistakably not a truffle. An uncapped black marker pen lies next to the chest and a white chef's toque rests on the counter edge. The only red is the small tally light glowing on the nearest camera.

**teatro-corona.** SCENE: The stage of a primary school assembly hall during the end-of-year play, moments before the king's entrance. Heavy crimson velvet curtains half open, a painted cardboard castle backdrop, a wobbly cardboard throne. In the centre, on a crimson velvet cushion on the throne, a metal kitchen colander sits upside down like a crown, wrapped in a string of tiny glowing fairy lights. A single follow-spot pins it; rows of empty folding chairs in darkness below the stage edge.

**biblioteca-arcoiris.** SCENE: The crime-fiction section of a municipal library in Valladolid on a Thursday afternoon. Tall wooden shelves, a rolling ladder, a returns trolley, a reading table with a green-shaded lamp, golden late light through tall windows. In the centre, one long bookcase where every book has been reordered by spine colour into a perfect but muted, desaturated rainbow gradient, sweeping from crimson through ochre, olive, teal and slate blue to violet, in sharp contrast with the dark wood and the plain shelves around it. Spines have no lettering.

**excursion-jirafa.** SCENE: A high-ropes adventure park in a pine forest on a stormy end-of-school-year afternoon. Wooden platforms on tall trunks, rope bridges, a lake below reflecting grey clouds, a school coach parked far away. In the centre, high on a long zip-line cable running diagonally across the image, a plush toy giraffe hangs from the pulley wearing a small crimson climbing helmet, with a blank cardboard sign tied around its neck, swinging in the wind. Dramatic cloudy light, wet leaves.

**calabaza-selfie.** SCENE: The exhibition area of an agricultural fair in a Navarre village at dusk, under a striped canvas marquee. Wooden pallets, straw bales, a vintage cast-iron weighing scale with its needle pushed to the end of the dial. In the centre, on a pallet, a colossal orange pumpkin carved with a cheeky winking face and, in front of one side of it, a carved thumb raised as if taking a selfie. A crimson prize rosette with ribbons is pinned to the pallet. Warm golden low light from the side, long shadows across the straw.

**observatorio-ovni.** SCENE: Inside the dome of a mountain observatory in the Sierra de Almería during a meteor shower. The dome slit is open to a deep night sky full of streaking shooting stars; a large white telescope points up through it. Taped to the front of the telescope tube, covering the lens, is a homemade cardboard flying saucer with a little dome, held with strips of tape. Below, empty reclining deck chairs and a laptop with a dark screen; dim crimson observation lights along the floor.

**despedida-video.** SCENE: The living room of a holiday apartment with a terrace in Cádiz during a hen party, late at night. Balloons, a bridal veil draped over a chair, a crimson sash with no lettering on the sofa, glasses on a breakfast bar, the dark sea and harbour lights through the terrace glass doors. A small projector on the coffee table throws a bright beam onto the white wall, where it shows a technical exploded diagram of a flat-pack bookshelf with panels, dowels and an Allen key, drawn only in lines and arrows, no words or numbers. Dust floats in the projector beam.

## 5 bis. Las 25 escenas generadas

Las 22 restantes se generaron el 19-10-2026 con la variante B como referencia, el bloque de estilo aprobado y el bloque `SCENE` de cada caso: GPT Image 2.5, 16:9, calidad alta, 2k (2688 × 1520). Las 24 nuevas (22 más los pilotos del museo y del rodaje) han terminado bien.

- El servidor rechazó por límite de peticiones (429) 8 de las 12 primeras, sin cobrarlas. Se reenviaron en grupos de 4.
- El trabajo de cada caso está en `art/scene-jobs.local.json` (local, fuera del repositorio). El repositorio guarda solo su huella SHA-256 en `scripts/scene-jobs.json`, que basta para que `import-scene.mjs` reconozca los archivos `hf_…_<trabajo>.png`; una prueba comprueba que cubre los 25 casos sin repetir ninguno.

**Estado: las 25 integradas.** Las enviaste tú (desde este entorno no se pueden descargar) y las aprobaste para usarlas todas.

- **Importación.** Se importaron con `node scripts/import-scene.mjs --dir art/scenes-raw`.
- **Revisión.** Hoja de contactos de las 25 con su identificador. Cada imagen cae en su caso y todas comparten el estilo del desván. No se ve texto legible: solo símbolos dibujados, como el infinito del karaoke o el despiece de la estantería.
- **Peso de las 25 (WebP 0,72):**

  | Versión | Total | Por escena |
  |---|---|---|
  | 1440 × 810 | 3,46 MB | 66–223 KB |
  | 720 × 405 | 1,00 MB | 20–66 KB |
  | **Ambas** | **4,46 MB** | — |

  Cada ronda descarga solo la escena de su caso.
- **Repercusión en el código y la demo:**
  - el JS principal pasa de 479 KB a 484 KB: lleva las rutas de las imágenes, no las imágenes;
  - la demo de un solo archivo pasa de 1.237 KB a **2.608 KB**, porque lleva solo las versiones de 720 px;
  - las SVG quedan como respaldo.
- **Pendiente: revisión en móviles físicos.** En Chromium emulado se ven bien a 320–1280 px.

## 6. Procedimiento para importar las imágenes

Hace falta **una** de estas dos opciones.

**A. Recomendada: abrir la red de este entorno.**

1. En los ajustes del entorno (menú del entorno en la barra de título → *Edit* → *Network access*), añade en *Allowed domains* `d8j0ntlcm91z4.cloudfront.net` (descarga de resultados). Si quieres usar los personajes como referencia, añade también `upload.higgsfield.ai` y `d2ol7oe51mr4n9.cloudfront.net`. Deja marcada la casilla de gestores de paquetes. Pasos: https://code.claude.com/docs/en/cloud-environments#network-access
2. Con eso, en la siguiente sesión se puede:
   - descargar el piloto 1 ya generado;
   - verlo en la interfaz real y hacer la comparativa;
   - si lo apruebas, generar los pilotos 2 y 3 con él como referencia;
   - después, las 22 restantes.

**B. Manual, todas de una vez.** Descarga de tu biblioteca de Higgsfield las imágenes que apruebes, sin renombrarlas (el nombre lleva el identificador del trabajo, `hf_…_<trabajo>.png`), en `art/scenes-raw/`. Después:

```bash
node scripts/import-scene.mjs --dir art/scenes-raw
```

Cada archivo se asigna a su caso por el identificador del trabajo (`scripts/scene-jobs.json`) o por el nombre del caso. Los que no encajan se avisan y se saltan.

**B′. Manual, de una en una.** Descarga desde tu biblioteca de Higgsfield el PNG de cada escena aprobada (los trabajos de los pilotos están en `art/scene-jobs.local.json`). Cópialo en `art/scenes-raw/{id}.png` (carpeta ignorada por git; se crea al importar) y ejecuta:

```bash
node scripts/import-scene.mjs art/scenes-raw/casa-rural-fantasma.png casa-rural-fantasma
```

El script, que no añade dependencias (codifica con el Chromium de Playwright):

- recorta al centro a 16:9;
- genera `src/client/assets/scenes/{id}.webp` (1440 × 810) y `{id}-720.webp` (720 × 405);
- informa del peso de cada archivo.

La app usa la WebP de un caso en cuanto existe. Si no existe o no carga, usa la SVG, y si esta tampoco, la genérica.

## 7. Integración preparada y comprobada

Hecho y comprobado:

- **Orden de preferencia en la app** (`src/client/ui/ambience.tsx`): ilustración WebP del caso → SVG del caso → escena genérica. Cada paso cae al siguiente si su archivo no carga. Mientras no exista ninguna WebP, la app se comporta exactamente igual que antes.
- **Carga.** Cada ilustración es un archivo aparte en `/assets`: no va dentro del JavaScript y el navegador solo pide la del caso que se juega. `srcset` con 720 y 1440 px deja que el móvil elija tamaño según su densidad de pantalla.
- **Formato en pantalla.** Marco propio 16:9 (`aspect-ratio: 16/9; object-fit: cover`), más alto que la tira 8:3 de las SVG. Un archivo con otra proporción se recorta al centro. La imagen es decorativa (`alt=""`).
- **Prueba con una imagen marcada «PRUEBA DE IMPORTACIÓN»**, borrada después (no queda ninguna WebP en el repositorio):
  - el script rechaza ids que no existen;
  - genera 1440 × 617 y 720 × 309 en WebP real;
  - en la interfaz real (partida con bots y navegador), el caso mostró la ilustración a 320, 360, 390 y 1280 px sin desplazamiento horizontal, con el recorte esperado;
  - con la WebP bloqueada, mostró su SVG;
  - con WebP y SVG bloqueadas, la genérica (`e2e/scenes.mjs`).
- **Pruebas.** `tests/ambience.test.ts` comprueba:
  - preferencia por la ilustración;
  - que hagan falta los dos tamaños;
  - que ningún caso use la imagen de otro;
  - que toda WebP del directorio pertenezca a un caso, venga con su pareja y sea WebP de verdad.

Pendiente de decidir cuando haya imágenes reales:

- **Peso real.** Medido con el piloto 1 en 16:9: 139,7 KB (1440) + 40,2 KB (720) = 180 KB por caso. Para 25 casos, unos 4,5 MB en el repositorio (estimación a partir de un único piloto). Cada ronda descarga solo una imagen, de 40 a 140 KB.
- **Demo de un solo archivo: resuelto.** Solo incrusta la versión de 720 px (`VITE_SCENE_PHOTOS=small` en `vite.demo.config.ts`); la de 1440 no entra. Medido con la escena del desván: 1.237 KB → 1.297 KB. Con las 25 serían unos 2,4 MB (estimación). Antes: Con las 25 ilustraciones en los dos tamaños pasaría de 1,2 MB a unos 5,7 MB; solo con la de 720 px, a unos 2,2 MB (estimación con el peso del piloto 1). Opciones:
  - incrustar solo la versión de 720 px;
  - dejar las SVG en la demo.
  
  Se decidirá midiendo.
- **Tamaño del marco.** Resuelto: 16:9 (ver sección 3).

## 8. Vídeo: solo como experimento posterior

No se ha generado ningún vídeo. Se valorará solo después de aprobar las 25 imágenes, en uno o dos casos con movimiento ambiental natural (el vaho del tren, la lluvia de estrellas del observatorio). Condiciones:

- **Clip:** cámara fija, 4–6 s en bucle, sin sonido ni controles.
- **Carga:** solo para la escena visible, sin precarga.
- **Accesibilidad:** si `prefers-reduced-motion` está activo, se muestra la imagen estática.
- **Peso:** solo se integra si no supera unos 400 KB.
- **Respaldo:** la imagen estática se muestra al instante y el vídeo la sustituye solo cuando puede reproducirse.
