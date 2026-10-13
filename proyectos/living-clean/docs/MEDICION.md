# Medición de conversión

## Situación

- La web actual no carga ninguna herramienta de analítica (aunque su aviso de cookies dice usar cookies de terceros).
- La nueva web **no instala herramientas de terceros ni cookies**, así que no necesita aviso de cookies.
- Cada interacción relevante emite un evento en el navegador (`lc:track`) y, si en el futuro existe `window.dataLayer`, le pasa el mismo objeto. Sin una herramienta conectada, no se envían a ningún sitio.

## Eventos

| Evento | Cuándo | Datos | Qué mide (y qué no) |
|---|---|---|---|
| `click_phone` | Clic en un enlace `tel:` | `location` (header, hero, menu, visita, footer, form…) | Intención de llamar. No mide llamadas hechas ni atendidas. |
| `click_email` | Clic en `mailto:` | `location` | Intención de escribir. |
| `click_cta` | Clic en «Pedir presupuesto» y CTA de pestañas/ronda/conserje | `location` | Interés en el formulario. |
| `audience_select` | Cambio de pestaña en «¿Para quién es?» | `audience` | Qué público llega más. |
| `ronda_track_click` | Clic en una parada del raíl | `stop` | Interés por cada zona del edificio. |
| `ronda_stop_toggle` | Quitar o volver a incluir una parada | `stop`, `included` | Qué tienen (o no) los edificios de quien pide. |
| `ronda_plan_to_form` | «Pedir visita con este plan» | `stops` | Uso del pico como paso hacia la conversión. |
| `click_service` | Clic en un servicio (lista o conserje) | `location` | Servicios que atraen. |
| `form_start` / `form_invalid` | Primera escritura / envío con errores | `origin` | Inicio y fricción. |
| `form_submit_success` | El servidor confirma la recepción | `origin`, `services`, `plan` | **Envío correcto**. No es una solicitud cualificada ni un cliente. |
| `form_submit_error` | Falla el servidor o la red | `origin`, `status` | Problemas técnicos. |

Sin JavaScript el formulario funciona y redirige a `/gracias/` (`noindex`), que una herramienta puede contar como envío.

## Distinciones que hay que mantener

- **Clic en teléfono ≠ llamada ≠ cliente.** Para contar llamadas desde la web haría falta un número de seguimiento o preguntar «¿cómo nos conoció?».
- **Formulario enviado ≠ solicitud cualificada ≠ visita hecha ≠ contrato.** Propuesta sencilla: una hoja con fecha, `Página:` y `Plan ronda:` del correo, tipo de cliente, localidad, y columnas «cualificada», «visita hecha», «presupuesto enviado», «contratado». Sin más datos personales.

## Si se quiere analítica

Recomendado: herramienta sin cookies alojada en la UE (Plausible, o Matomo sin cookies). Añadir su script en `src/layout.mjs`, su dominio en la CSP de `.htaccess`, escuchar `lc:track` y actualizar las políticas. Con Google Analytics o Tag Manager haría falta además un banner de consentimiento previo. **No se ha instalado ninguna herramienta.**

## Indicadores (revisión mensual)

1. Envíos correctos por página de origen y por tipo de cliente.
2. Envíos con plan de ronda / envíos desde la portada.
3. Visitas concertadas y contratos (hoja interna) / envíos.
4. Clics en teléfono por ubicación.
5. Errores del formulario / intentos.
