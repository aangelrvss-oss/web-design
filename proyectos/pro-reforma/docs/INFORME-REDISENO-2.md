# Informe de la revisión crítica · Pro Reforma v2

Fecha: 15 de octubre de 2026. Rama `ccr-55da8280-pmyc9n`. Versión anterior recuperable: etiqueta local `pro-reforma-v1-antes-revision` (commit `57c3867`). Nada publicado. Auditoría completa en `AUDITORIA-2.md`; resultados de pruebas en `VERIFICACION-2.md`; reseñas en `RESENAS.md`.

## 1. Problemas principales de la v1

1. **Primera impresión débil**: collage de tres fotos pequeñas y grises; en móvil, ninguna foto encima del pliegue y la insignia de Google tapada por el botón de WhatsApp.
2. **Titular abstracto** sin servicios ni localidad claros.
3. **Reseñas tratadas como una lista de citas**: fragmentos recortados sin indicarlo, paráfrasis en los pies, sin fecha y con la etiqueta «Opiniones verificadas», que es falsa (Google dice que no las verifica).
4. **La carga en vivo dependía de PHP**, incompatible con Duda (la web actual) y con Netlify (donde se entrega la demo), y no tenía control de gasto.
5. **Una sola animación con intención**; el resto era la misma aparición repetida y un parallax imperceptible. No había transiciones entre secciones ni un momento de prueba social.
6. **Fricción**: formulario con 7 bloques, el mismo «Pedir presupuesto» en todos los botones, horario sin publicar.
7. **Página larga sin ritmo**: 15,5 pantallas en móvil con secciones de relleno («Más trabajos», «Pro Reforma»).

## 2. Cambios realizados

### Diseño
- **Hero oscuro (azul tinta) con titular concreto**: «Reformas, pintura e insonorización en Rivas-Vaciamadrid», en tres líneas exactas de 320 a 2.560 px, con propuesta de valor verificable y dos acciones: «Solicitar presupuesto» y «Llamar · 691 312 106».
- **Foto protagonista real**: un operario con la camiseta de Pro Reforma pintando con pistola. Se consiguieron **bandas panorámicas nítidas de 1798×410 px** (antes el máximo eran 890 px) capturando la galería de su web a 7.680 px. Solo se recortan y se les aplica un enfoque suave (`tools/bandas.py`); no se ha generado ni alterado contenido.
- **Franja de confianza** bajo el hero, solo con datos verificados: 5,0 y 41 reseñas (con fecha), presupuesto sin compromiso, horario L–V 9:00–19:00, dirección.
- **Ritmo de fondos**: tinta → papel (reseñas) → blanco (servicios) → banda oscura → papel → yeso (obra) → blanco → papel → azul marino (cierre). Cada sección tiene un fondo y una composición propios.
- **Servicios** como filas grandes con foto 2:1 alterna y dos salidas: «Ver …» y «Pedir presupuesto de …».
- **«Por qué nos llaman»**: tres diferenciadores, cada uno con su prueba (una cita literal de una reseña o una frase destacada por Google).
- **Una sola foto por idea**: se quitó la galería horizontal que obligaba a repetir fotos; una banda panorámica con un salón terminado hace de pausa entre servicios y diferenciadores.
- **Microinteracciones**: zoom suave de las fotos de servicio al pasar el ratón, flechas que avanzan, sombra en el botón principal, subrayados.

### Scroll-craft (motor sin modificar; dispositivos usados con intención)

| Momento | Dispositivo | Propósito |
|---|---|---|
| Hero | Entrada al cargar: titular por líneas dentro de su máscara, banda que se abre como un plano de cine. Parallax suave (`data-sc-parallax`) | Primer impacto sin retrasar la lectura (≈1,4 s; texto y botones visibles desde el primer fotograma) |
| Franja de confianza | `data-sc-in` escalonado | Leer los datos en orden |
| **Reseñas: el momento** | Acto fijado (`pin`, 1,9 pantallas): el 5,0 crece, las estrellas se rellenan con el scroll y las tres frases que destaca Google se relevan con `data-sc-cue` (la primera ya está al llegar); al final, los temas que más se repiten | Que la prueba social sea un momento de la experiencia, no un bloque más |
| Muro de reseñas | `data-sc-in` escalonado | Lectura cómoda de las ocho reseñas |
| Servicios | Barridos `data-sc-reveal` izquierda/derecha ligados al scroll | Cada servicio se «descubre» |
| Pausa | Banda panorámica con parallax | Transición entre secciones, cambio de ritmo |
| Obra fase a fase | Acto fijado (`pin`, 2,4): la misma habitación se descubre por barridos y la fase se marca en la lista | Prueba de trabajo real |
| Proceso | Línea de progreso que avanza con `--sc-p` y enciende cada paso | Que el método se lea como un camino |
| Cierre | Titular `data-sc-kinetic` («Cuéntanos qué necesitas») sobre azul marino | Conclusión natural del recorrido |

- En móvil (≤760 px) los dos actos fijados pasan a flujo antes de montar el motor: sin secciones pegajosas.
- Con «reducir movimiento»: sin parallax ni entradas; las fases y las frases cambian por fundido.
- Sin JavaScript: todo el contenido visible y en orden.
- Las fases y las estrellas se dibujan con CSS: el marco publica su estado visual real (`data-sc-verify-state`) para que el arnés detecte cualquier tramo muerto.

### Reseñas
- **Etiqueta falsa retirada** y comprobación automática de que ninguna página dice «verificadas».
- **Textos literales y completos donde la fuente los da completos**; los recortados por Google o por el widget se reproducen hasta donde se leen, con «[…]» y «Seguir leyendo en Google». Cada una con autor tal como aparece, «Reseña de Google · hace N meses» y la nota de fuente y fecha.
- **Composición editorial**: una reseña destacada grande (fondo oscuro, fija mientras se leen las demás) y las otras en dos columnas, con texto de 17 px y espacio generoso. En móvil, cuatro a la vista y un botón real «Ver 4 opiniones más».
- **Identidad de Google** visible (marca «G», estrellas, «Leer las 41 en Google»).
- **Integración en vivo preparada para cualquier alojamiento**: `/api/resenas` en PHP (`site/api/resenas.php`, con tope diario de consultas) y en Netlify (`netlify/functions/resenas.mjs`). Misma respuesta y mismas pruebas.
- **Nunca vacío ni presentado como actual si es antiguo**: si la API falla o no está configurada, queda el bloque fechado; seis meses después de la consulta se añade «· puede haber cambiado».

### Conversión
- **Botones con texto según el momento**: «Solicitar presupuesto» (principal), «Llamar · 691 312 106», «Pedir presupuesto de pintura/reforma/insonorización» (marca el tipo de obra en el formulario), «Cuéntanos qué necesitas», «Empezar por el paso 1», «Llamar ahora».
- **Formulario mínimo**: tipo de obra (opcional, un toque), nombre, «Teléfono o correo» en un solo campo y descripción opcional. Validación útil, mensajes claros, estado «Enviando…» con indicador, confirmación solo con respuesta real, errores que conservan los datos y ofrecen teléfono, WhatsApp y un correo ya redactado. Honeypot y tiempo mínimo contra spam.
- **Barra de contacto en móvil** (Llamar · WhatsApp · Presupuesto): aparece al dejar atrás los botones del hero y se aparta sobre el formulario y el pie. Sustituye al botón flotante que tapaba contenido.
- **CTA tras cada bloque de información**: tras las reseñas, en cada servicio, tras el proceso, en las dudas («¿Prefieres hablarlo?») y en el cierre.
- **Cabecera** transparente sobre el hero y sólida al bajar, con teléfono y botón siempre visibles.
- **Horario** publicado (ficha de Google) en la franja de confianza, el formulario y el pie.
- Estas mejoras **deberían** reducir fricción y aumentar las solicitudes, pero **no hay datos que lo demuestren**: es una hipótesis hasta medirla (`MEDICION.md`).

### Páginas interiores
Banda panorámica en las de servicio, insignia de Google con fecha, franja de reseñas relevantes por servicio (literales), mismo formulario corto y barra móvil.

## 3. Archivos principales modificados o nuevos

| Archivo | Cambio |
|---|---|
| `src/data.mjs` | Reseñas literales con fuente y antigüedad, frases destacadas, temas, horario, textos breves de servicios |
| `src/pages.mjs` | Portada nueva, muro y franja de reseñas, servicios con banda, privacidad del formulario corto |
| `src/layout.mjs`, `src/icons.mjs` | Cabecera sobre el hero, formulario corto, barra móvil, horario, marca «G» |
| `site/assets/css/site.css`, `site/assets/js/site.js` | Diseño y comportamiento nuevos |
| `site/contacto.php` | Campo único «Teléfono o correo» (acepta también los campos separados) |
| `site/api/resenas.php`, `netlify/functions/resenas.mjs` | API de reseñas con tope diario (PHP) y versión Netlify |
| `site/.htaccess`, `tools/dev/router.php` | Ruta `/api/resenas` |
| `tools/bandas.py`, `assets-src/bandas/` | Bandas panorámicas a partir de la captura a 7.680 px |
| `tools/demo/build-netlify.mjs` | Copia para Netlify: demostración o Netlify Forms real |
| `tools/preview/bundle.mjs` | Vista previa de un solo archivo actualizada |
| `qa/functional.mjs`, `qa/animation.mjs`, `qa/backend.mjs`, `qa/netlify.mjs` | Pruebas |
| `docs/AUDITORIA-2.md`, `docs/RESENAS.md`, `docs/VERIFICACION-2.md`, `docs/capturas-v2/` | Documentación y capturas |

## 4. Estado de las reseñas
**Estática verificada y fechada (15/10/2026)**. La integración en vivo está implementada y probada con una API simulada (PHP y Netlify), pero **no está conectada**. Falta: `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` y autorización de facturación del propietario. Detalle en `RESENAS.md`.

## 5. Estado del formulario y de los contactos

| Canal | Estado |
|---|---|
| Formulario en alojamiento con PHP | **Funciona** (`contacto.php` con `mail()`). Probado con correo simulado; falta un envío real en el alojamiento definitivo y SPF/DKIM del remitente `web@proreforma.es` |
| Formulario en Netlify | `--forms`: **Netlify Forms** real (probado el envío con respuesta simulada; necesita activar la detección de formularios y la notificación por correo en el panel de Netlify). Por defecto: modo demostración, que lo dice antes y después |
| Teléfono | Todos los enlaces `tel:+34691312106` |
| WhatsApp | Todos los enlaces `https://wa.me/34691312106` (abre conversación con ese número) |
| Correo | `daniel@proreforma.es` |

## 6. Limitaciones y permisos pendientes
- **Reseñas en vivo**: clave, `place_id` y facturación (propietario). Permiso para mostrar los textos en modo estático.
- **Fotos originales**: las bandas son nítidas, pero los originales permitirían un hero aún mejor y más fotos. La ficha de Google tiene 117 fotos; el CDN de la web actual y Google Fotos están bloqueados en este entorno. Confirmar también el permiso para publicar las fotos (se ve a un operario).
- **Logotipo original**: sigue el provisional tipográfico.
- **Datos por validar**: zona («Comunidad de Madrid», tomado de su Instagram), «presupuesto sin compromiso» (lo dice su web actual), que Daniel atiende, pasos del método.
- **No probado** en Safari/iOS ni Android reales, ni en Apache real; Lighthouse sobre el servidor de desarrollo de PHP.
- Higgsfield no se ha usado: no hacía falta y no se presentan imágenes generadas como obra.

## 7. Cómo revisarlo
Ver `README.md` (servidor local, pruebas, vista previa y copias para Netlify). Vista previa sin servidor: `preview/pro-reforma-preview.html` (`node tools/preview/bundle.mjs`).
