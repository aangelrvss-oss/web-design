# Verificación · Pro Reforma v2

Fecha: 15 de octubre de 2026. Servidor local `php -S` con `tools/dev/router.php` (misma CSP que `.htaccess`) y `sendmail` simulado. Chromium sin interfaz (Playwright). Todos los resultados son de ejecuciones reales; lo no probado está en «Límites». Resultados de la v1 en `VERIFICACION.md`.

## Resultados

| Prueba | Resultado |
|---|---|
| `qa/functional.mjs`: 23 páginas a 1440 y 375 px (HTTP, consola, desbordamiento, botones con texto, fotos no ampliadas >15 %, H1 y jerarquía, title, description, canonical, JSON-LD, `alt`, `tel:` y WhatsApp correctos, áreas táctiles), enlaces internos y anclas, externos solo oficiales; reseñas: ninguna página dice «verificadas», 5,0/41 con fecha en todas las insignias, todos los enlaces a la ficha verificada, **los 8 textos idénticos a la fuente**, recortadas con «[…]» y enlace, antigüedad en cada una, frases destacadas literales, nota de fuente; fallo de la API mantiene el bloque; aviso de datos antiguos a los 6 meses; API simulada sustituye todo con puntuación, autor y reseña enlazados; formulario: sin premarcados, solo 3 campos + tipo, validación (nombre, teléfono corto, correo incompleto), estado «Enviando…», envío real con teléfono y con correo (Reply-To), correo con tipo y mensaje, eventos, error 502 sin perder datos, servicio preseleccionado, «Pedir presupuesto de pintura» marca el tipo; sin JavaScript; teclado completo con foco visible; cabecera transparente → sólida; menús; móvil: actos en flujo, barra de contacto (aparece, enlaces correctos, se aparta sobre el formulario), «Ver más opiniones», ningún bloque invisible | **535/535** |
| `qa/animation.mjs` (1440×900 normal y reducido + móvil táctil): en los dos actos fijados el scroll inverso deshace cada estado, avanzan al bajar (8 estados normal; 6–8 reducido), recargar a mitad conserva el estado; las frases destacadas nunca se solapan; rueda rápida recorre la página sin bloqueos; volver arriba deja la portada visible; al cambiar el tamaño el escenario fijado sigue ocupando la pantalla; **deslizar con el dedo** (eventos táctiles reales del navegador) recorre la página entera y vuelve; sin errores | **25/25** |
| `qa/backend.mjs`: función de Netlify y PHP contra una API de Places simulada (datos normalizados con atribución, clave solo en cabecera y nunca en la respuesta, fallo de Google → 502 y `available:false`, tope diario del PHP: 2 consultas y luego `cap`, sin configuración → `available:false`) | **7/7** |
| `qa/netlify.mjs`: copia de demostración (noindex, aviso antes y después, ninguna petición) y Netlify Forms (POST a «/» con `form-name` y campos, confirmación solo con 200, error con datos intactos) | **6/6** |
| Arnés de Scroll-craft `shoot.mjs` a 1920×1080, 1366×768, 820×1180, 390×844, 360×640 y movimiento reducido | **Sin scroll muerto** en las seis; contraste de textos animados ≥ 4,5:1 en su peor fotograma; sin errores de consola |
| Titular del hero | 3 líneas exactas y sin desbordamiento en 14 anchos de 320 a 2.560 px |
| Lighthouse 12 · `/` | Móvil **93–94** / 100 / 100 / 100 (dos ejecuciones) · Escritorio 100 / 100 / 100 / 100 |
| Lighthouse · `/servicios/insonorizacion/` | Móvil 97 / 100 / 100 / 100 · Escritorio 100 / 100 / 100 / 100 |
| Lighthouse · `/contacto/` | Móvil 97 / 100 / 100 / 100 · Escritorio 100 / 100 / 100 / 100 |
| Lighthouse · `/politica-de-privacidad/` | Móvil 98 / 100 / 100 / 100 · Escritorio 100 / 100 / 100 / 100 |
| Métricas | LCP móvil 2,2–2,9 s (simulado, 4G lenta), escritorio 0,5–0,6 s; CLS 0; TBT ≤ 40 ms |
| Vista previa `preview/pro-reforma-preview.html` (1440 y 390 px) | 19 capas + portada con H1 e imágenes; «Pedir presupuesto» desde Pinturas marca «Pintura»; el formulario dice que no envía; sin errores ni peticiones fallidas |

Orden de las cifras de Lighthouse: rendimiento / accesibilidad / buenas prácticas / SEO.

## Revisión visual
Capturas en `docs/capturas-v2/` (portada: hero, reseñas fijadas, muro, servicios, diferenciadores, proceso, formulario; escritorio y móvil; página de pintura en móvil). Corregido durante la revisión: titular partido en 5 líneas (guion de «Rivas-Vaciamadrid»), escenario de reseñas vacío al entrar, botón «Ver más» visible en escritorio, puntos del proceso encima del texto en móvil, franja de reseñas descompensada, estilos en línea bloqueados por la CSP, foto del hero ampliada en exceso, franja de confianza partida en móvil.

## Límites
- No probado en Safari/iOS ni en Android reales (se ha emulado el táctil en Chromium), ni en Apache real.
- Correo del formulario probado con `sendmail` simulado; Netlify Forms y la función de reseñas, con respuestas simuladas (no hay cuenta de Netlify ni despliegue).
- La API de Google no se ha llamado: no hay credenciales ni autorización de gasto.
- Lighthouse sobre el servidor de desarrollo, sin la compresión de `.htaccess`.
- Al girar el móvil después de cargar, la página conserva la composición con la que cargó.
