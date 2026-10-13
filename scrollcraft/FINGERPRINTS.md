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
| living-clean (2026-10-13) | La ronda (nueva: cada sección es una parada de la ronda del personal por un edificio; blanco cálido, tinta, rojo de marca) | Barra blanca con logotipo, servicios, `tel:` y un único CTA; raíl de ronda con paradas dentro del pico | Pin corto 1.6: logotipo real descubierto por máscara en zigzag al cargar; con el scroll vuela a la cabecera y en su hueco se abre el portal; copy al lado | pin 1.6 > flow(pestañas) > pan 5.6 > pin 2.4(kinetic) > flow+reveal > flow > flow > flow · 8 actos | Hoja de visita blanca sobre rojo de marca, flow; plan de la ronda dentro del formulario | La ronda que se convierte en tu plan: paradas que se quitan y viajan al presupuesto | Fotografía generada (Higgsfield, ilustrativa) + fotos reales del equipo | 4600 |

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
