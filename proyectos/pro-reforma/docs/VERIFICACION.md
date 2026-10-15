# Verificación · Pro Reforma

Fecha: 15 de octubre de 2026. Servidor local `php -S` con el router compartido (`tools/dev/router.php`, misma CSP que `.htaccess`) y `sendmail` simulado (el correo se escribe en un archivo). Navegador: Chromium sin interfaz (Playwright). Todos los resultados son de ejecuciones reales en este entorno; lo que no se ha podido probar está en «Límites».

## Resultados

| Prueba | Resultado |
|---|---|
| Suite funcional `qa/functional.mjs`: las 23 páginas a 1440 y 375 px (HTTP, consola, desbordamiento, botones con texto, fotos no ampliadas, H1 y jerarquía, título ≤ 70, descripción 50–160, canonical, JSON-LD, `alt`, todos los `tel:` y WhatsApp correctos, áreas táctiles), enlaces internos y anclas, enlaces externos, reseñas en modo editorial y con API simulada, formulario (sin casillas premarcadas, validación, envío real, contenido del correo, eventos, `form_submit` una vez, error de servidor sin pérdida de datos, servicio preseleccionado), sin JavaScript (contenido visible, fases apiladas, POST con redirección), teclado completo, menús, móvil (flujo sin pin, cabecera que cabe, menú, WhatsApp flotante oculto sobre el formulario, ningún bloque invisible) | **519/519** |
| Arnés de Scroll-craft `shoot.mjs` a 1920×1080, 1366×768, 820×1180, 390×844, 360×640 y movimiento reducido | **Sin scroll muerto** en las seis; contraste de textos sobre imagen ≥ 4,5:1 en su peor fotograma; sin errores de consola |
| `qa/animation.mjs` (1440×900, normal y reducido) | **10/10**: el scroll inverso deshace cada fase; las fases avanzan al bajar (8 estados distintos en normal, 7 en reducido); recargar a mitad del acto fijado conserva el estado; saltar del final al principio deja la portada visible; sin errores de JS |
| Lighthouse 12 · `/` | Móvil 96 / 100 / 100 / 100 · Escritorio 100 / 100 / 100 / 100 (rendimiento / accesibilidad / buenas prácticas / SEO) |
| Lighthouse · `/servicios/insonorizacion/` | Móvil 97 / 100 / 100 / 100 · Escritorio 100 / 100 / 100 / 100 |
| Lighthouse · `/proyectos/insonorizacion-de-una-habitacion/` | Móvil 97 / 100 / 100 / 100 · Escritorio 100 / 100 / 100 / 100 |
| Lighthouse · `/politica-de-privacidad/` | Móvil 99 / 100 / 100 / 100 · Escritorio 100 / 100 / 100 / 100 |
| Métricas | LCP móvil 1,9–2,6 s (simulado, 4G lenta), escritorio 0,4–0,6 s; CLS 0 en todas; TBT ≤ 20 ms |
| Vista previa `preview/pro-reforma-preview.html` (1440 y 390 px) | 19 capas + portada, todas abren con su H1 y sus imágenes; ningún enlace interno sin destino (el empaquetador falla si lo hay); «Pedir presupuesto» desde Pinturas llega al formulario con «Pintura» marcado; el envío de demostración lo dice y no envía nada; sin errores ni peticiones fallidas |
| Frontend | Sin claves, tokens ni scripts de terceros; `api/resenas.php` sin credenciales responde `{"available":false}` y la página mantiene el bloque fechado |

### Nota sobre el arnés y el acto fijado

Las fases de la obra se dibujan solo con CSS (`clip-path` y escala calculados desde `--sc-p`), que el arnés no mide. El marco publica su estado visual real, leído con `getComputedStyle`, en `data-sc-verify-state` (mecanismo previsto por el arnés para escenarios propios). Con movimiento reducido, las pausas entre un fundido y el siguiente se declaran con `data-sc-verify-hold` solo mientras ninguna foto está a medio fundido. Antes de este cambio el arnés informaba de scroll muerto en el acto porque no veía el barrido.

## Lista del encargo

| Comprobación | Estado |
|---|---|
| CTA principal visible y funciona | Probado (lleva al formulario; con el servicio marcado desde cada página de servicio) |
| Teléfono y WhatsApp | Todos los `tel:` son `tel:+34691312106` y todos los WhatsApp `https://wa.me/34691312106` (probado el enlace, no una llamada real) |
| Formulario envía de verdad o lo dice | Web: envío real con `contacto.php` (correo simulado). Vista previa: aviso visible antes de rellenar y al enviar |
| No se pierden datos si hay error | Probado con error de servidor simulado |
| Consentimiento | Ninguna casilla premarcada; capa informativa con enlace real a la política |
| Reseñas | Valor, número y fecha de consulta visibles; enlace a la ficha verificada (`cid=1539571755307103610`); atribución a Google. Modo API probado con respuesta simulada (no con Google real: no hay credenciales) |
| Animaciones | Sin scroll muerto, inverso correcto, recarga correcta, reducido correcto, móvil sin tramos fijados |
| Sin desbordamiento horizontal | Probado en las 23 páginas a 375 px; cabecera comprobada de 320 a 1440 px |
| Accesibilidad | Teclado completo con foco visible y en pantalla; Lighthouse 100; sin JavaScript todo el contenido es visible |

## Límites

- No probado en Safari/iOS ni en Android reales, ni en Apache real (`.htaccess`: CSP, 301 y caché).
- El correo solo se ha probado con `sendmail` simulado: hace falta un envío real en el alojamiento.
- La API de Google no se ha llamado (sin credenciales ni autorización de gasto); el modo API se ha probado con una respuesta simulada con la misma forma.
- Lighthouse se ha ejecutado contra el servidor de desarrollo de PHP, sin la compresión de `.htaccess`; en el servidor real el resultado puede variar.
- Al girar el móvil después de cargar, la página mantiene la composición con la que se cargó (en flujo o con tramo fijado).
