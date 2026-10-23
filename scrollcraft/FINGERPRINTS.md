# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| mr-instalaciones (2026-10-13) | Lámina de instalaciones (nueva: juego de planos de una vivienda; fondos en corte seco papel/grafito; sin scrub) | Barra fija clara: logotipo, índice de servicios desplegable que salta, teléfono `tel:` y un único CTA "Pedir presupuesto" | Flow natural con 4 planos en parallax (cuadrícula, sección de vivienda vacía, tubería con llave en primer plano, aire cálido/frío) + profundidad por puntero; sin cues | flow(parallax) > flow > pin 5.2 > flow+reveal > flow > pan 3.4 > flow · 7 actos · ~14 vh escritorio | Formulario como cajetín de plano sobre grafito, flow (sin pin), teléfono grande al lado, CTA "Enviar solicitud"; selección del pico precargada | La casa que se instala sola: siete capas SVG dibujadas desde `--sc-p`; la leyenda aísla capas y marca los servicios en el formulario | Technical drawing (SVG propio, sin generación) | 4500 |
| living-clean (2026-10-13) | La ronda (nueva: cada sección es una parada de la ronda del personal por un edificio; blanco cálido, tinta, rojo de marca) | Barra blanca con logotipo, servicios, `tel:` y un único CTA; raíl de ronda con paradas dentro del pico | Pin corto 1.6: logotipo real descubierto por máscara en zigzag al cargar; con el scroll vuela a la cabecera y en su hueco se abre el portal; copy al lado | pin 1.4 > flow(confianza) > pan 4.6 (zonas) > flow(hilo de pasos) > pin 2.0(kinetic) > flow > flow+reveal > flow > flow · 9 actos; móvil: todo flow | Solicitud de visita blanca sobre rojo de marca, flow; formulario por tipo de cliente con las zonas del edificio | Las zonas del edificio que se desmarcan y viajan a la solicitud | Fotografía generada (Higgsfield, ilustrativa) + fotos reales del equipo | 4600 |
| pro-reforma (2026-10-15) | Parte de obra (nueva: cada sección es una entrada del parte de una obra; marfil de yeso, tinta, rojo y azul marino de marca; Fraunces) | Barra clara: wordmark, Servicios desplegable, WhatsApp, `tel:` y un único CTA; en móvil WhatsApp flotante que se aparta sobre el formulario | Flow: titular + CTA + sello de Google fechado; collage de 3 fotos reales con parallax y barridos de entrada | flow(parallax) > flow(reseñas) > flow > pin 2.6 > flow > flow+reveal > flow > flow > flow · 9 actos; móvil: todo flow | Hoja blanca de presupuesto sobre azul marino, flow, teléfono grande al lado; tipo de obra marcado desde cada servicio | La obra fase a fase: la misma habitación real descubierta por barridos desde `--sc-p` mientras se marca la fase | Fotografía real de obra (sin generación) | 4700 |
| pro-reforma v2 (2026-10-15) | Parte de obra, revisado: hero oscuro de tinta, papel, yeso y azul marino; Fraunces | Barra transparente sobre el hero que se vuelve sólida; en móvil barra inferior Llamar · WhatsApp · Presupuesto que se aparta sobre el formulario | Flow oscuro: titular en tres líneas que sube por máscara + banda panorámica real que se abre como plano de cine, franja de confianza fechada | flow(parallax) > pin 1.9 (reseñas) > flow(in) > flow(reveal) > flow(parallax) > flow(in) > pin 2.4 (fases) > flow(progreso) > flow > flow(kinetic) · 10 actos; móvil: todo flow | Formulario corto (3 campos) sobre azul marino con titular kinetic, teléfono grande y horario | Dos picos: el 5,0 de Google que crece y releva las frases destacadas; la obra real fase a fase | Fotografía real de obra (bandas panorámicas de la galería de la empresa) | 4700 |
| mr-instalaciones v2 (2026-10-22; V2.1 y V2.2 2026-10-23) | Ventana a la casa (la portada es el interior de la casa a sangre, un plano continuo de vídeo; papel cálido y grafito alternos; V2.1: Instrument Serif para titulares, antes Archivo condensada) | Barra superpuesta a la imagen (tinta clara, logotipo claro, velo solo en la franja superior) que pasa a franja de papel al salir; teléfono en mono y un único CTA; carril de escenas dentro de la secuencia que también navega | `scrub` 4,2 a sangre desde el primer pintado con titular serif superpuesto y contraste local que nace del bloque de texto; vídeo del cliente repartido sobre el tramo fijado (V2.0: ventana enmarcada que se abría por clip-path) | scrub 4.2 > flow(in) > pin 4.8 (plano técnico de la V1) > flow(reveal) > flow(in) > flow > flow · 7 actos · ~15,1 vh escritorio | Formulario sobre grafito, flow, teléfono grande al lado (comparte con la V1) | El carril de escenas sincronizado con el tiempo del clip (la escena activa gana anchura y salta); «Descubrir nuestros sistemas» lleva a la primera escena; V2.2 recupera el dibujo por capas de la V1 (comparte firma con ella) con una leyenda que marca la capa en curso | Vídeo del cliente (render fotorrealista de interiores, IA) | 4510 |

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

- Gramática "Lámina de instalaciones" (sección de edificio que se completa por capas).
- Cierre en forma de cajetín de plano.
- Movimiento firma: dibujo técnico por capas con `stroke-dashoffset` desde `--sc-p` + leyenda que alimenta el formulario.
- Banda de 7 actos / ~14 vh con pico `pin` 5.2 seguido de `reveal` y `pan`.
- Gramática «Ventana a la casa»: hero `scrub` de vídeo a sangre con titular serif superpuesto y contraste local anclado al bloque de texto (V2.0: apertura de una ventana enmarcada).
- Carril de escenas que crece con la escena activa y salta a ella.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
