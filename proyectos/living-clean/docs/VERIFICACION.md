# Verificación (v2, rediseño comercial)

Fecha: 13 de octubre de 2026. Servidor local `php -S` con el router compartido (`tools/dev/router.php`), la misma CSP que `.htaccess` y `sendmail` simulado (el correo se escribe en un archivo). Navegador: Chromium sin interfaz (Playwright). Estado previo recuperable: etiqueta local `living-clean-v1-antes-rediseno` (commit `9376316`).

## Imágenes pendientes

Las 7 imágenes generadas con Higgsfield (ya pagadas) siguen sin poder descargarse: la red de este entorno bloquea `d8j0ntlcm91z4.cloudfront.net`. Sus huecos se ven grises y **todas las pruebas se han hecho sin ellas**; esos 404 se cuentan aparte. Al descargarlas (`sh tools/fetch-higgsfield.sh`) hay que repetir la revisión visual del hero, de las zonas y Lighthouse.

## Resultados

| Prueba | Resultado |
|---|---|
| Suite funcional `qa/functional.mjs` (13 páginas a 1440 y 375 px; enlaces y **anclas**; botones sin texto; caminos A/B/C; campos por tipo; zonas → formulario → correo; validación; envío real; error de servidor sin pérdida de datos; sin JavaScript; teclado; menús; móvil sin pin y sin bloques invisibles) | **256/256** |
| Arnés de Scroll-craft `shoot.mjs`: 1440×900, 1366×768, 360×640 y movimiento reducido | Sin errores de consola (salvo los 404 pendientes), sin scroll muerto, contraste de textos animados ≥ 4,5:1 en su peor fotograma |
| Lighthouse 12 · portada | Móvil 95 / 100 / 96 / 100 · Escritorio 100 / 100 / 96 / 100 (rendimiento / accesibilidad / buenas prácticas / SEO). Buenas prácticas baja solo por los 404 de las imágenes pendientes |
| Lighthouse · `/limpieza-de-comunidades/` | Móvil 97 / 100 / 96 / 100 · Escritorio 100 / 100 / 96 / 100 |
| Lighthouse · `/aviso-legal.html` (sin imágenes generadas) | Móvil 99 / 100 / 100 / 100 · Escritorio 100 / 100 / 100 / 100 |
| CLS | 0 en todas las mediciones |
| Vista previa de un solo archivo | 9 páginas incluidas como capas; **ninguna ancla sin destino**, ningún id duplicado, ninguna ruta relativa; legales, privacidad desde el formulario, servicio → formulario con tipo y servicio: probados a 1440 y 390 px sin errores |
| Menú móvil | Se abre, se cierra con Escape y al navegar a una sección (la sección queda bajo la cabecera) |
| Cabecera fija | No tapa campos del formulario al recorrerlos (1440 y 390 px); cabe entera de 320 a 414 px |
| Frontend | Sin claves, tokens ni scripts de seguimiento |

## Lista del encargo (fase 11)

| # | Comprobación | Estado |
|---|---|---|
| 1 | CTA principal visible y funciona | Probado (marca comunidad y servicio) |
| 2 | Teléfono abre la llamada | Todos los `tel:` son `tel:+34608825864` (probado el enlace; no se ha llamado desde un móvil real) |
| 3 | Enlaces internos al destino correcto | Probado, incluidas las anclas |
| 4 | Sin enlaces legales ficticios | Probado en la web y en la vista previa |
| 5 | Formulario envía de verdad o lo dice | Web: envío real con `contacto.php` (correo simulado). Vista previa y Netlify: aviso visible antes de rellenar y al enviar |
| 6 | No se pierden datos si hay error | Probado con error 502 simulado |
| 7 | Scroll sin bloqueos | Arnés: sin scroll muerto |
| 8 | Sin texto oculto por animaciones no ejecutadas | Probado sin JavaScript y en móvil |
| 9 | Se entiende con movimiento reducido | Arnés con `reduce`: carril como scroll horizontal nativo, logotipo quieto |
| 10 | Sin desbordamiento horizontal en móvil | Probado en 13 páginas |
| 11 | Sin errores de consola nuevos | Ninguno (solo los 404 de imágenes pendientes) |
| 12 | Proporciones de imágenes | Todas con `width`/`height`; CLS 0 |
| 13 | Menú móvil con teclado | Probado (abrir, Escape, navegar) |
| 14 | SEO básico y metadatos | Probado en 13 páginas |

## Límites

- No probado en Safari/iOS ni en Android reales, ni en Apache real (CSP y cabeceras de `.htaccess`).
- El correo solo se ha probado con `sendmail` simulado: hace falta un envío real en el alojamiento.
- Revisión visual con las fotos generadas pendiente de su descarga.
- Al girar el móvil después de cargar, la página mantiene la composición con la que se cargó (en flujo o con tramos fijados).
