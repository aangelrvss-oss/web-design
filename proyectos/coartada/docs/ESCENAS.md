# Escenas por caso

> **Estado (19-10-2026).** Estas 25 SVG son ahora solo el **respaldo**. Cada caso muestra su ilustración generada con Higgsfield (`docs/ESCENAS-higgsfield.md`). La app ya prefiere la ilustración de un caso en cuanto existe; si falta o no carga, muestra esta SVG y, si tampoco carga, la genérica.

Cada uno de los 25 casos tiene una escena propia: una tira de 320 × 120 en tinta sobre papel con un objeto rodeado en rojo. Ese círculo es el gesto de una foto de expediente y repite el contorno de las pruebas del tablero. Las escenas siguen la estética de los 12 personajes:

- negro tinta `#2b2721`, papel `#efe8d8` y `#e4d7b8`, y rojo `#a52a22` como único acento fuerte;
- azul `#2e5b88` y un amarillo apagado solo cuando el objeto lo pide: el agua, el autobús del cole, las manguitas;
- siluetas y líneas gruesas, sin degradados ni animación.

Las escenas son decorativas:

- no dan pistas;
- el motor no las lee: una prueba comprueba que nada de `src/shared` las importa;
- `tests/engine-golden.test.ts` fija con huellas el reparto, la noche generada, las pruebas, los objetivos y la puntuación;
- la imagen tiene `alt=""` y el lector de pantalla la ignora. El texto del caso (incidente, lugares, horas) sigue en pantalla igual que antes.

## Cómo se cargan

- **Archivos.** `src/client/assets/scenes/{id}.svg`, uno por caso.
- **Mapeo explícito.** `CASE_SCENE` en `src/client/ui/ambience.tsx` asocia cada caso con su archivo.
- **App.** Cada escena es un archivo aparte en `/assets` (`assetsInlineLimit: 0`) y el móvil solo descarga la del caso que se juega.
- **Demo de un archivo.** Va incrustada (lo exige el formato offline).
- **Respaldo.** Las 6 escenas genéricas de la fase 4 (fiesta, noche, viaje, trabajo, deporte, cultura) siguen dibujadas en línea. Se usan solo si el archivo no carga (`onError`) o si un caso nuevo aún no tiene escena. En uso normal ningún caso depende de ellas.
- **Pie de foto.** La frase de tono (por ejemplo «Una celebración que acabó en expediente.») sigue saliendo del tipo de lugar del caso.
- **Formato.** SVG, que la app ya usaba: es vectorial (nítido a cualquier densidad de pantalla), ocupa 2–3,3 KB por escena y no añade dependencias. WebP no aportaba nada a dibujos de líneas de este tamaño.

## Matriz

| id | Título | Lugar | Concepto visual | Elementos obligatorios | Qué la distingue | Archivo |
|---|---|---|---|---|---|---|
| boda-tarta | La tarta de la boda | Masía del Empordà | La tarta nupcial mordida junto a los novios | Tarta de cinco pisos con un mordisco dentado, arco de piedra de masía con luna, guirnalda de bombillas, siluetas de novio y novia con velo | Único con arco de piedra y tarta por pisos | `scenes/boda-tarta.svg` |
| piso-gato | El gato rapado | Piso compartido en Lavapiés | El gato del casero con una cresta y la maquinilla culpable | Gato con cresta roja, maquinilla con cable, mechones en el suelo, balcón con barandilla y tejados, banderines, gorro de fiesta | Único con animal doméstico y ventana de balcón | `scenes/piso-gato.svg` |
| oficina-aspirador | El aspirador que dimitió | Consultora en Valencia | La moqueta del jefe con «DIMITO» y el robot al final del rastro | Moqueta en perspectiva con «DIMITO» en pasadas claras, robot aspirador, mesa del jefe con placa, silla, persiana, reloj | Única con palabra escrita en el suelo | `scenes/oficina-aspirador.svg` |
| abuela-viral | La abuela viral | Casa de pueblo en Cuenca | El vídeo viral en un móvil gigante | Móvil con la abuela bailando con la fregona, barra de reproducción y corazones, tarta con velas «90», ventana con reja y macetas, aleros de teja | Única con pantalla vertical y velas de número | `scenes/abuela-viral.svg` |
| navidad-amigo-invisible | El amigo invisible trucado | Chalé en Alcalá de Henares | Las etiquetas de los regalos cambiadas de sitio | Árbol con estrella y bolas, dos regalos con etiquetas cruzadas por flechas rojas, dinosaurio que ruge, maquinilla de afeitar | Única con árbol de Navidad y flechas de intercambio | `scenes/navidad-amigo-invisible.svg` |
| crucero-gorra | La gorra del capitán | Crucero por el Mediterráneo | El cisne de hielo con la gorra ladeada | Cisne de hielo en bandeja del bufé, gorra de capitán, barandilla de cubierta, ojos de buey, mar y luna, altavoz de megafonía | Única con escultura de hielo y casco de barco | `scenes/crucero-gorra.svg` |
| tren-vaho | Mensajes en el vaho | Tren nocturno Madrid–Vigo | La ventanilla empañada con el mensaje | Ventanilla con vaho y «NO MIRES ATRÁS» escrito con el dedo, gotas, paisaje nocturno, literas con escalerilla, lámpara | Única con texto en cristal empañado | `scenes/tren-vaho.svg` |
| casa-rural-fantasma | El fantasma del desván | Casa rural en Gredos | El libro de visitas con la reseña «del fantasma» | Desván con vigas a dos aguas, ventana redonda con luna, fantasma de sábana, libro de visitas de tres páginas, firma roja, pluma, baúl | Único con tejado interior y libro desplegado | `scenes/casa-rural-fantasma.svg` |
| camping-chanclas | Las chanclas del mástil | Camping de la Costa Brava | Las chanclas colgadas del mástil por tallas | Mástil con bandera roja, chanclas de mayor a menor, tienda de campaña, cartel «14», pinos, cala y sol | Único con mástil y chanclas | `scenes/camping-chanclas.svg` |
| albergue-sello | El sello de la patata | Albergue del Camino de Santiago | El sello casero de patata con gafas | Credencial de peregrino desplegada con sellos rojos de patata con gafas, la patata tallada con su tinta, navaja, muro de piedra con flecha y concha | Única con credencial y concha del Camino | `scenes/albergue-sello.svg` |
| vecinos-audio | El audio del presidente | Comunidad de vecinos en Zaragoza | El audio de ronquidos en el grupo | Móvil con nota de voz, forma de onda, «6:00», doble check azul y «31», «Zzz», ascensor, buzones, sillas de la junta | Única con ascensor, buzones y burbuja de chat | `scenes/vecinos-audio.svg` |
| verbena-gigante | El gigante en remojo | Fiestas de un pueblo de Teruel | El gigante con gorro, gafas y manguitas | Gigante de fiestas con gorro de piscina rojo, gafas de buceo, manguitas, bombillas de verbena, fuegos artificiales, altavoces de orquesta | Única con figura gigante de frente y noche de fiesta | `scenes/verbena-gigante.svg` |
| escape-candado | El candado imposible | Escape room en Sevilla | El candado final con un código imposible | Candado de combinación con «????», cadenas cruzadas sobre la puerta, pared de jeroglíficos, máscara de faraón, matraz, marcador «15:00» | Única con jeroglíficos y candado | `scenes/escape-candado.svg` |
| karaoke-cancion | La canción infinita | Karaoke en Malasaña | La pantalla atascada en la flauta dulce | Pantalla con flauta dulce y símbolo de infinito, «11:00», bola de espejos, telón, cola de siluetas con micrófono | Única con flauta y bola de espejos | `scenes/karaoke-cancion.svg` |
| gimnasio-ballenas | Spinning con ballenas | Gimnasio de barrio en Bilbao | El hilo musical bloqueado en cantos de ballena | Altavoz con candado rojo, ondas, dos ballenas, fila de bicis de spinning con ciclista, mancuerna | Única con bicis y ballenas | `scenes/gimnasio-ballenas.svg` |
| padel-red | La red de los bebés | Club de pádel en Murcia | Las fotos de bebés pinzadas en la red | Red de pádel con fotos de bebés y pinzas rojas, pista azul con cristales, focos, pala perforada y pelota | Única con pista y red de pádel | `scenes/padel-red.svg` |
| festival-bocata | La pantalla del bocata | Festival junto al mar en Castellón | La pantalla gigante con el bocata | Pantalla vertical con bocata de calamares, estructura del escenario, torres de sonido, mar con luna, público con manos alzadas | Única con escenario de festival y público | `scenes/festival-bocata.svg` |
| museo-jabali | El jabalí con estilo | Museo de ciencias naturales | El jabalí disecado con gafas de sol y bufanda | Jabalí sobre peana con cartela, gafas de sol, bufanda a rayas, cordón de museo, esqueleto de dinosaurio, flashes | Única con animal disecado y dinosaurio | `scenes/museo-jabali.svg` |
| rodaje-trufa | La trufa de pega | Plató de un concurso de cocina | El cofre con la piedra pintada | Cofre abierto con piedra negra rayada, rotulador, gorro de chef, cámara de televisión con piloto, focos de plató | Única con cofre y cámara de rodaje | `scenes/rodaje-trufa.svg` |
| teatro-corona | La corona de colador | Salón de actos de un colegio | El colador con lucecitas sobre el cojín del rey | Colador con asas y luces de colores sobre cojín rojo, telón rojo, foco, butacas con abuelos grabando con el móvil | Única con telón de teatro y colador | `scenes/teatro-corona.svg` |
| biblioteca-arcoiris | El arcoíris de la novela negra | Biblioteca municipal de Valladolid | La estantería ordenada por colores | Estantería con lomos en arcoíris, cartel «NOVELA NEGRA», escalera, lupa | Única con muchos colores, a propósito: el incidente es el arcoíris | `scenes/biblioteca-arcoiris.svg` |
| excursion-jirafa | Teodoro en la tirolina | Parque multiaventura | La jirafa de peluche colgada de la tirolina | Cable de tirolina entre plataformas, jirafa con casco rojo y cartel, árboles, lago, autobús escolar | Única con tirolina y peluche | `scenes/excursion-jirafa.svg` |
| calabaza-selfie | El selfie de la calabaza | Feria agrícola de Navarra | La calabaza gigante con el guiño tallado | Calabaza con cara que guiña y pulgar, peana, báscula con «412kg», escarapela, carpa a rayas, banderines | Única con calabaza y báscula | `scenes/calabaza-selfie.svg` |
| observatorio-ovni | El ovni del telescopio | Observatorio en Almería | El ovni de cartulina pegado al telescopio | Cúpula abierta, telescopio, ovni de cartulina con cinta, estrellas fugaces, sierra, rótulo «EN VIVO», tumbonas | Única con cúpula y ovni | `scenes/observatorio-ovni.svg` |
| despedida-video | El vídeo de la estantería | Apartamento con terraza en Cádiz | La proyección del tutorial de la estantería | Proyector con haz de luz, pantalla con despiece de estantería, llave Allen, «1/40», globos, banda «NOVIA», puerta de terraza con mar | Única con proyector y despiece | `scenes/despedida-video.svg` |

## Revisión visual

Una prueba de bytes no demuestra que dos dibujos sean distintos a la vista, así que hubo revisión visual de verdad:

- **Hoja de contactos.** Las 25 escenas, renderizadas en Chromium a 340 px de ancho y densidad 2×, lado a lado, comprobando que cada una se reconoce por su objeto sin leer el título. Ninguna se distingue de otra solo por el color, el encuadre o el fondo: cada una tiene un objeto central y un lugar distintos.
- **Dentro de la app** a 320, 360 y 390 px (`npm run e2e:scenes`, capturas en `qa-out/scenes/`).

Correcciones tras la revisión:

- el remate de la tarta parecía una cruz y ahora es un corazón;
- la cresta del gato era pequeña y la he agrandado;
- la vela «9» parecía un «0» y la he redibujado;
- la bufanda del jabalí parecía una boca y la he puesto alrededor del cuello;
- la duración del audio se pisaba con la onda y la he separado;
- había gotas de vaho encima de las letras y las he movido;
- el despiece de la estantería parecía una caja y ahora tiene baldas y tornillos.

### Pendiente o mejorable

No bloquea, pero hay que mirarlo en móviles reales:

- **Textos dentro de las escenas.** «NO MIRES ATRÁS», «NOVELA NEGRA», «412kg», «EN VIVO», «6:00», «11:00», «15:00», «1/40», «NOVIA», «14» y «31» usan fuentes del sistema (Arial, Georgia y Courier, o sus equivalentes), porque un SVG cargado como imagen no puede usar las fuentes web de la app. La forma puede variar algo entre iPhone y Android. Son decorativos y el incidente siempre está escrito en la ficha.
- **Detalles pequeños a 320 px.** «412kg», el «31» de vistos y el cartel de la jirafa se leen justos. El objeto principal de cada escena se reconoce igual.
- **Lecturas dudosas.** Las manguitas del gigante se leen como bultos amarillos más que como patitos. El colador del teatro puede leerse como una campana con luces. Solo una prueba con personas dirá si hace falta redibujarlos.
- **Paleta.** Se mantiene en todas menos en la biblioteca. Allí el arcoíris es el propio incidente, con tonos apagados.

## Peso

| | Antes (fase 4) | Ahora |
|---|---|---|
| Escenas en el código | 6 genéricas en línea (~9 KB de JSX) | Esas 6 (respaldo) + 25 archivos SVG, 67,8 KB en total (2,0–3,3 KB cada uno) |
| App: lo que descarga un móvil por ronda | 0 KB extra | 1 SVG del caso, 2–3,3 KB, con caché del navegador |
| App: JS principal | 476,0 KB (149,1 KB gzip) | 479,2 KB (150,0 KB gzip): +3,2 KB por las 25 rutas, el mapeo y el respaldo |
| Demo de un archivo (`coartada-un-movil.html`) | 1.148 KB | 1.237 KB (+89 KB, escenas incrustadas como URI de datos) |

No se ha añadido ninguna dependencia.
