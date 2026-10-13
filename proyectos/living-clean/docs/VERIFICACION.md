# Verificación

Fecha: 13 de octubre de 2026. Servidor local `php -S` con el router compartido (`tools/dev/router.php`), CSP igual a la de `.htaccess`, y `sendmail` simulado (el correo se escribe en un archivo).

## Estado de las imágenes

Las 7 imágenes generadas con Higgsfield están creadas (ver `assets-src/higgsfield.json`), pero **todavía no se han podido descargar**: la política de red de este entorno bloquea su servidor (`d8j0ntlcm91z4.cloudfront.net`). Mientras tanto, sus huecos se ven vacíos y todas las pruebas de abajo se han hecho **sin esas imágenes**. Las pruebas cuentan esos 404 aparte para no esconder otros errores. Cuando se descarguen (`sh tools/fetch-higgsfield.sh`) hay que repetir la revisión visual del hero, la ronda y Lighthouse.

## Resultados

| Prueba | Resultado |
|---|---|
| Suite funcional `qa/functional.mjs` (13 páginas × 1440 y 375 px; enlaces; pestañas; ronda → plan → formulario → correo; validación; envío real; error de servidor simulado; sin JavaScript; teclado; menús) | **234/234** |
| Arnés de Scroll-craft `shoot.mjs`: 1440×900, 390×844, 360×640 y movimiento reducido | Sin errores de consola (salvo los 404 de las imágenes pendientes), sin scroll muerto, contraste de los textos animados ≥ 4,5:1 en su peor fotograma |
| Lighthouse 12 (sin las imágenes generadas), portada con la entrada del logotipo | Móvil 95 / 100 / 96 / 100 · Escritorio 100 / 100 / 96 / 100 (rendimiento / accesibilidad / buenas prácticas / SEO). Buenas prácticas baja solo por los 404 de las imágenes |
| Lighthouse, `/limpieza-de-comunidades/` | Móvil 97 / 100 / 96 / 100 · Escritorio 100 / 100 / 96 / 100 |
| CLS | 0 en todas las mediciones |

Compresión y caché no se miden bien con `php -S`: en producción las aplica `.htaccess`.

## Portada: entrada del logotipo

- Fotogramas congelados de la entrada (0–1,5 s, `qa/intro.mjs`): el titular y los CTA son legibles desde el primer pintado; el logotipo queda completo a ~1,3 s.
- Vuelo con scroll (1440×900 y 390×844): el logotipo llega exactamente a su sitio en la cabecera y el portal se abre en su hueco. Con movimiento reducido o sin motor, el logotipo queda quieto en la portada y la cabecera lleva el suyo.
- Cabecera comprobada a 320, 360, 375, 390 y 414 px: nada se sale ni se solapa.

## Qué se comprueba en concreto

- Un único H1 por página, jerarquía sin saltos, `title` ≤ 70 y `description` 50–160 caracteres, canónica a `https://livingclean.es/`, `lang="es"`, JSON-LD válido.
- Todos los `tel:` son `tel:+34608825864`.
- Objetivos táctiles ≥ 24 px a 375 px; sin desbordamiento horizontal.
- La ronda: el raíl centra la parada, marca la actual y las pasadas; quitar «Garaje» y «Fachada» las tacha en tarjeta y raíl; el plan aparece en el formulario, marca «Comunidad» y «Limpieza de comunidad», y el correo recibido incluye `Plan ronda: Portal, Escaleras y ascensor, Zonas comunes y jardín, Mantenimiento`.
- Sin JavaScript: todo el contenido es visible, el formulario hace POST y redirige a `/gracias/` o `/envio-no-completado/`.
- Teclado: recorrido completo; cada foco visible y en pantalla, también dentro del carril horizontal y del acto fijado del conserje.
- Error de servidor: nunca se muestra un falso éxito; se ofrece llamar o enviar por correo.

## Límites

- No probado en Safari/iOS real ni en Apache real (CSP y redirecciones de `.htaccess`).
- El envío de correo solo se ha probado con `sendmail` simulado.
- La revisión visual del portal que se abre en la portada y de las tarjetas de la ronda con las fotos reales está pendiente de descargar las imágenes.
