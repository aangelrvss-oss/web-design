# Medición de conversión

## Situación

- La web actual no carga ninguna herramienta de analítica (aunque su aviso de cookies dice usar cookies de terceros).
- La nueva web **no instala herramientas de terceros ni cookies**, así que no necesita aviso de cookies.
- Cada interacción relevante emite un evento en el navegador (`lc:track`) y, si en el futuro existe `window.dataLayer`, le pasa el mismo objeto. Sin una herramienta conectada, no se envían a ningún sitio.

## Eventos

| Evento | Cuándo | Datos | Qué mide (y qué no) |
|---|---|---|---|
| `click_cta` | Clic en cualquier CTA de solicitud (hero, comunidades, cómo se contrata, conserjería, otros servicios, cabecera, menú) | `location` | Interés en solicitar. No es una solicitud. |
| `click_phone` | Clic en un enlace `tel:` | `location` (header, hero, menu, visita, footer, form…) | Intención de llamar. No mide llamadas hechas ni atendidas. |
| `click_email` | Clic en `mailto:` | `location` | Intención de escribir. |
| `select_service` | Se elige un tipo de cliente o un servicio (en el formulario o desde un CTA contextual) | `type` o `service`, `location` | Qué caminos (A comunidad, B administrador, C empresa/puntual) y servicios se eligen. |
| `zone_toggle` / `zone_track_click` / `zones_to_form` | Zonas del edificio: quitar o añadir una zona, ir a una zona, llevar las zonas al formulario | `zone`, `included`, `zones` | Uso de la sección principal como paso hacia la solicitud. |
| `click_service` | Clic en una página de servicio | `location` | Servicios secundarios que interesan. |
| `form_start` | Primera escritura en el formulario | `origin` | Inicio. |
| `form_invalid` | Intento con errores de validación | `origin` | Fricción. |
| `form_submit` | Envío **validado** que sale hacia el servidor | `origin`, `type` | Intento real de envío. No es un envío correcto. |
| `form_success` | El servidor **confirma** la recepción | `origin`, `type`, `services`, `zones` | **Solicitud enviada correctamente.** No es una solicitud cualificada ni un cliente. |
| `form_error` | Falla el servidor o la red | `origin`, `status` | Problemas técnicos (los datos del formulario se conservan). |

Sin JavaScript el formulario funciona y redirige a `/gracias/` (`noindex`), que una herramienta puede contar como envío.

## Distinciones que hay que mantener

- **Clic en teléfono ≠ llamada ≠ cliente.** Para contar llamadas desde la web haría falta un número de seguimiento o preguntar «¿cómo nos conoció?».
- **Formulario enviado ≠ solicitud cualificada ≠ visita concertada ≠ contrato recurrente.** Propuesta sencilla: una hoja con fecha, `Página:`, `Cliente:` y `Zonas:` del correo, localidad, y columnas «cualificada», «visita concertada», «propuesta enviada», «contrato recurrente». Sin más datos personales.

## Si se quiere analítica

Recomendado: herramienta sin cookies alojada en la UE (Plausible, o Matomo sin cookies). Añadir su script en `src/layout.mjs`, su dominio en la CSP de `.htaccess`, escuchar `lc:track` y actualizar las políticas. Con Google Analytics o Tag Manager haría falta además un banner de consentimiento previo. **No se ha instalado ninguna herramienta.**

## Métricas comerciales (revisión mensual)

1. Visitas a la página (cuando haya una herramienta sin cookies instalada).
2. Clics en teléfono por ubicación.
3. Formularios enviados correctamente (`form_success`), por tipo de cliente y página de origen.
4. Solicitudes cualificadas (hoja interna) / envíos correctos.
5. Visitas comerciales concertadas.
6. Contratos recurrentes conseguidos, cuando se puedan registrar de forma fiable.

## Hipótesis de mejora (por medir; no hay datos posteriores al lanzamiento)

| Hipótesis | Cómo medirla |
|---|---|
| Un hero centrado en la comunidad y un CTA de «visita» aumentan las solicitudes de comunidades | `form_success` con `type=comunidad` / visitas a la portada, antes y después |
| El camino propio para administradores atrae solicitudes de varias comunidades | `select_service type=administrador` y `form_success type=administrador`; campo «Comunidades» del correo |
| Las zonas del edificio ayudan a cualificar | Porcentaje de solicitudes con `Zonas:` / solicitudes de comunidad; tasa de cualificación de unas y otras |
| Pedir pocos datos mantiene el abandono bajo | `form_start` → `form_success` |
