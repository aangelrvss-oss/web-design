# BRIEF · Living Clean Multiservicios

**Self-authored under explicit creative delegation** (mismo encargo que MRI, adaptado a este negocio). Hechos en `proyectos/living-clean/docs/AUDITORIA.md`.

## Los ocho temas

1. **Vibe**: limpio, cercano, ordenado, de confianza diaria. Referencias: el parte de trabajo de un conserje; una puerta de cristal recién pasada con rasqueta; la luz de un portal a primera hora.
2. **Recorrido**: entiendo qué hacen y para quién (y puedo llamar) → me identifico (comunidad, empresa o particular) → veo qué se hace en cada rincón de un edificio y con qué frecuencia → descubro el conserje multifunción → confío en el equipo real → resuelvo dudas → pido una visita y presupuesto.
3. **Energía**: alivio inmediato, calma, subida en la ronda, claridad en el conserje, calidez en el equipo, cierre decidido.
4. **Momento recordado**: recorrer el edificio parada a parada y terminar con el plan de mi comunidad hecho.
5. **Algo que nadie hace**: que el visitante construya su plan de limpieza recorriendo su propio edificio, y que ese plan llegue al presupuesto.
6. **Familia estética**: editorial luminosa y cercana. Blanco cálido, tinta casi negra, rojo de marca como único acento.
7. **Mundo**: escenas, no vuelo continuo.
8. **Activos**: logotipo original (facilitado por el usuario), 8 fotos reales del equipo (resolución limitada), 7 fotografías de espacios generadas con Higgsfield (sin personas; ilustrativas).

## Gramática: «La ronda» (nueva)

- **Qué es una sección**: una parada de la ronda del personal por un edificio.
- **Chrome**: barra blanca con logotipo, servicios, teléfono `tel:` y un único CTA «Pedir presupuesto». En el pico, un **raíl de ronda** con las paradas, que se marcan al pasar y se pueden quitar.
- **Hero**: acto fijado corto. La foto del portal tras un cristal empañado; el scroll pasa una rasqueta en «S» (tres bandas) que deja el cristal limpio. Texto y CTA legibles desde el primer fotograma.
- **Cierre**: «hoja de visita» sobre fondo rojo de marca: el plan construido en la ronda + formulario para pedir visita y presupuesto.
- **Prohíbe**: vídeo `scrub`, iconos genéricos, carruseles, contadores, tarjetas idénticas en rejilla de tres, degradados, cifras no verificadas, fotos de stock de personas.

Por qué no las ocho existentes: *filmic* exige vídeo continuo y una sola entrada; *chaptered editorial* quita la barra con teléfono; *live surface* es para software; *continuous world* exige vuelo de vídeo; *typographic poster* desperdicia las fotos reales del equipo; *gallery* empieza por un objeto sin propuesta de valor; *split stage* (antes/después) obligaría a fabricar «antes» que no existen; *cutlist* es para marcas de energía.

## Movimiento firma

**La ronda que se convierte en tu plan.** En el pico, el edificio se recorre en horizontal parada a parada (portal, escaleras y ascensor, garaje, zonas comunes y jardín, mantenimiento, fachada, control). Un raíl fijo marca cada parada al pasar. Cada parada se puede quitar («mi comunidad no tiene garaje») y el resumen se lleva al formulario como «Plan de mi comunidad».

> Es la web en la que recorres tu edificio con el personal de limpieza y al final tienes tu plan hecho para pedir presupuesto.

## Curva de sentimiento

| # | Emoción | Causa |
|---|---|---|
| 1 | Alivio | El cristal empañado se limpia con una pasada de rasqueta |
| 2 | Reconocimiento | «Soy presidente de comunidad / tengo una oficina / es mi casa» |
| 3 | Control (pico) | Recorrer el edificio y ver qué se hace en cada sitio y cada cuánto |
| 4 | Claridad | Tres oficios que se funden en un solo puesto: el conserje multifunción |
| 5 | Confianza | Las caras y uniformes reales del equipo, el seguro, el alta |
| 6 | Tranquilidad | Dudas resueltas en corto |
| 7 | Decisión | La hoja de visita con el plan ya hecho |

## Partitura

| Acto | Dispositivo | Span |
|---|---|---|
| 1 Hero «la pasada» | `pin` + máscara por bandas desde `--sc-p` | 1.7 |
| 2 ¿Para quién? | `flow` + `in` + pestañas | natural |
| 3 La ronda (pico) | `pan` + raíl propio | 5.6 |
| 4 Conserje multifunción | `pin` + `kinetic` | 2.4 |
| 5 Equipo | `flow` + `reveal` | natural |
| 6 Más servicios | `flow` | natural |
| 7 Dudas | `flow` | natural |
| 8 Hoja de visita | `flow` | natural |

Familias: pin, flow, pan, reveal, kinetic. Nunca dos iguales seguidos salvo `flow` en los tramos administrativos (6-8), separados por fondos distintos.

## Gate de huellas (contra la fila de MRI)

| Dimensión | MRI | Living Clean | ¿Distinta? |
|---|---|---|---|
| Gramática | Lámina de instalaciones | La ronda | Sí |
| Nav | Barra con desplegable | Barra + raíl de ronda en el pico | Sí |
| Hero | Flow con 4 planos SVG en parallax | Pin corto, foto tras cristal, rasqueta por bandas | Sí |
| Forma de actos | 7 actos, pico pin 5.2, pan secundario | 8 actos, pico pan 5.6, pin hero | Sí |
| Cierre | Cajetín sobre grafito | Hoja de visita sobre rojo con el plan | Sí |
| Firma | Capas SVG por `--sc-p` | Ronda con paradas que forman el plan | Sí |

6 de 6 distintas: pasa.
