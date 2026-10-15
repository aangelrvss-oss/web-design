# Medición · Pro Reforma

La web **no carga ninguna herramienta de analítica ni pone cookies**. Cada acción emite un evento propio del navegador (`pr:track`) y, solo si algún día existe `window.dataLayer` (Google Tag Manager instalado **con banner de consentimiento**), se le pasa el mismo objeto. Sin eso, los eventos no salen del navegador.

Cada evento lleva `event`, `page` (ruta) y, según el caso, `location` (dónde está el enlace), `href`, `service` u `origin`.

## Eventos

| Evento | Cuándo | Datos |
|---|---|---|
| `click_phone` | Clic en cualquier `tel:` | `location` (cabecera, hero, reseñas, dudas, `dock` = barra móvil, formulario, pie…) |
| `click_whatsapp` | Clic en WhatsApp (cabecera, barra móvil, contacto…) | `location` |
| `click_email` | Clic en el correo (también el correo de rescate tras un error) | `location` |
| `click_map` | Clic en la dirección (Google Maps) | `location` |
| `click_google_reviews` | Clic en la valoración, «Leer las 41 en Google», «Ver la ficha» o «Seguir leyendo en Google» | `location` (opiniones, muro, resena-completa, svc-*…) |
| `click_cta` | Clic en «Solicitar presupuesto», «Cuéntanos qué necesitas», «Pedir presupuesto de …» | `location` (hero, resenas, svc-*, metodo, dock…) |
| `click_service` | Clic en un servicio desde la portada | `location` |
| `click_projects` | Clic hacia proyectos | `location` |
| `select_service` | Cambio del tipo de obra en el formulario, o enlace «Pedir presupuesto de …» que lo marca | `service`, `location` |
| `form_start` | Primer campo tocado | `origin` (`home`, el servicio, `contacto`…) |
| `form_invalid` | Envío con errores de validación | `origin` |
| `form_submit` | Envío validado (una sola vez por intento) | `origin`, `service` |
| `form_success` | El servidor confirma la recepción | `origin`, `service` |
| `form_error` | El servidor o la red fallan | `origin`, `status` (código HTTP o 0) |
| `reviews_live` | Las reseñas se han cargado desde la API de Google | `count` |
| `reviews_more` | «Ver más opiniones» en móvil | `open` |

## Embudo recomendado

`click_cta` → `form_start` → `form_submit` → `form_success`, segmentado por `origin` y `service`. Los contactos directos (`click_phone`, `click_whatsapp`, `click_email`) se cuentan aparte: no pasan por el formulario y conviene medirlos por separado.

## Si se instala analítica

1. Banner de consentimiento antes de cargar nada, y actualizar la política de cookies (hoy dice, con verdad, que no se instalan cookies de análisis).
2. GTM o GA4 leyendo `dataLayer`; los nombres de evento ya son válidos para GA4.
3. Marcar `form_success`, `click_phone` y `click_whatsapp` como conversiones.
4. No comparar con la web anterior hasta tener al menos unas semanas de datos con el mismo criterio.
