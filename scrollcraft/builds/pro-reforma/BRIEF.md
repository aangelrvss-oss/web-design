# BRIEF · Pro Reforma

**Encargo explícito** («PROMPT MAESTRO — Rediseño web de Pro Reforma con Claude Code + Scrollcraft»): animaciones contenidas al servicio de la captación. Hechos en `proyectos/pro-reforma/docs/AUDITORIA.md`; reseñas en `docs/RESENAS.md`.

## Los ocho temas

1. **Vibe**: oficio cuidado, casa protegida, trato directo. Referencias: el plástico que cubre los muebles antes de empezar; una pared recién lijada a la luz de la ventana; el presupuesto por partidas escrito a mano.
2. **Recorrido**: entiendo qué hacen y dónde (y puedo llamar) → veo que otros clientes lo confirman en Google → encuentro mi tipo de obra → veo una obra real de principio a fin → entiendo el método → conozco a quién tengo delante → resuelvo dudas → pido presupuesto.
3. **Energía**: calma segura en el hero, confirmación en las reseñas, claridad en servicios, subida en la obra fase a fase, orden en el método, cercanía en la empresa, cierre decidido.
4. **Momento recordado**: la misma habitación pasando de pared desnuda a estancia terminada mientras bajo.
5. **Algo que nadie hace**: en vez de un «antes/después» con fotos de stock, una sola obra real contada en sus cuatro fases con las fotos de la empresa.
6. **Familia estética**: editorial artesana. Marfil de yeso, tinta, rojo y azul marino de la marca; serif con carácter (Fraunces).
7. **Mundo**: escenas, no vuelo continuo.
8. **Activos**: 8 fotos reales de obra (recortes de captura, resolución limitada), colores de marca. Sin logotipo original (wordmark provisional). Sin imágenes generadas.

## Gramática: «Parte de obra» (nueva)

- **Qué es una sección**: una entrada del parte de una obra (lo que dicen los clientes, qué hacemos, la obra fase a fase, cómo trabajamos, quién somos, dudas, presupuesto).
- **Chrome**: barra clara con wordmark, menú Servicios desplegable, WhatsApp, `tel:` y un único CTA «Pedir presupuesto». En móvil: CTA corto y **WhatsApp flotante** que se aparta sobre el formulario.
- **Hero**: `flow`. Titular en tres líneas + CTA + sello de Google (5,0 · 41 reseñas, fechado). A la derecha, collage de tres fotos reales a su tamaño con parallax suave y barridos de entrada al cargar.
- **Cierre**: hoja blanca de presupuesto sobre azul marino, con teléfono grande y vías directas al lado. El tipo de obra llega marcado desde cada servicio.
- **Prohíbe**: vídeo `scrub`, fotos de stock o generadas presentadas como obra, contadores, cifras sin verificar, carruseles, valoraciones estructuradas, tramos fijados en móvil.

## Movimiento firma

**La obra fase a fase.** Acto fijado (span 2.6): la lista de cuatro fases a la izquierda y un marco a la derecha donde cada foto de la misma habitación se descubre con un barrido horizontal sobre la anterior, a la vez que se rellena su número en la lista; la foto se asienta con una escala continua (1,06 → 1). Reducido: fundidos. Móvil y sin JS: lista con las cuatro fotos.

> Es la web en la que ves una habitación real de Pro Reforma insonorizarse mientras bajas, y al final pides tu presupuesto con tu tipo de obra ya marcado.

## Partitura

| Acto | Escritorio | Móvil | Span |
|---|---|---|---|
| 1 Hero + sello de Google | `flow` + `parallax` + entrada CSS | igual (sin parallax en reducido) | natural |
| 2 Lo que cuentan los clientes en Google | `flow` + `in` escalonado | igual | natural |
| 3 Qué hacemos | `flow` | igual | natural |
| 4 La obra fase a fase (pico) | `pin` + barridos desde `--sc-p` | `flow` (data-mobile-flow) | 2.6 |
| 5 Del primer contacto a la entrega | `flow` + `in` | igual | natural |
| 6 Más trabajos | `flow` + `reveal` | igual | natural |
| 7 La empresa (cita de cliente) | `flow` | igual | natural |
| 8 Dudas | `flow` | igual | natural |
| 9 Presupuesto (azul marino) | `flow` + `kinetic` en el titular | igual | natural |

## Gate de huellas

| Dimensión | vs MRI | vs Living Clean |
|---|---|---|
| Gramática | Sí (lámina de instalaciones ≠ parte de obra) | Sí (la ronda ≠ parte de obra) |
| Nav | **No**: misma barra clara con desplegable, `tel:` y un CTA (añade WhatsApp y flotante) | Sí (LC lleva raíl de ronda en el pico; aquí WhatsApp flotante y sin raíl) |
| Hero | Sí (planos SVG técnicos con profundidad por puntero ≠ collage fotográfico con sello de valoración) | Sí (pin con logotipo que vuela ≠ flow con collage) |
| Forma de actos | Sí (pin 5.2 + pan 3.4 ≠ un único pin 2.6 en el centro, 9 actos) | Sí (pan 4.6 + dos pin ≠ un único pin) |
| Cierre | **No**: formulario sobre fondo oscuro con teléfono grande al lado | **No**: hoja blanca sobre color de marca |
| Firma | Sí (capas SVG ≠ fotos reales por fases) | Sí (zonas que se desmarcan ≠ obra por fases) |

**4 de 6 contra MRI, 5 de 6 contra Living Clean: pasa.** Nav y cierre se repiten a propósito: el encargo pide teléfono y presupuesto siempre a mano, y es lo que mejor funciona para un negocio local de reformas.
