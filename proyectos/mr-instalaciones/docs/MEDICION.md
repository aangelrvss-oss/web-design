# Medición de conversión

## Situación actual

- La web actual no muestra ninguna herramienta de analítica en el HTML descargado (ni Google Analytics, ni Tag Manager, ni píxeles). No se ha podido comprobar el panel de WordPress.
- La nueva web **no instala ninguna herramienta de terceros ni cookies**. Por eso no necesita aviso de cookies.
- Lo que sí deja preparado: cada interacción relevante emite un evento en el navegador (`mri:track`) y, si en el futuro existe `window.dataLayer`, le pasa el mismo objeto. Sin una herramienta conectada, esos eventos no se envían a ningún sitio.

## Eventos disponibles

| Evento | Cuándo se emite | Datos | Qué mide (y qué no) |
|---|---|---|---|
| `click_phone` | Clic en cualquier enlace `tel:` | `location` (header, hero, menu, contacto, peak, svc-hero…), `href` | Intención de llamar. No mide si la llamada se hizo ni si se atendió. |
| `click_email` | Clic en `mailto:` | `location` | Intención de escribir. No mide envíos. |
| `click_cta` | Clic en "Pedir presupuesto" | `location` | Interés en el formulario. |
| `click_need` | Clic en una situación del acto "¿Qué necesitas resolver?" | `location` = servicio | Qué necesidades atraen más. |
| `peak_system_select` | Marcar un sistema en la leyenda del dibujo | `system` | Interés por sistema antes del formulario. |
| `form_start` | Primera escritura en el formulario | `origin` (home o slug del servicio) | Inicio del formulario. |
| `form_invalid` | Intento de envío con errores | `origin` | Fricción en el formulario. |
| `form_submit_success` | El servidor confirma la recepción | `origin`, `services` | **Envío correcto**. No es una solicitud cualificada ni un cliente. |
| `form_submit_error` | El servidor o la red fallan | `origin`, `status` | Problemas técnicos que hay que revisar. |
| `click_cert_pdf`, `click_map` | Documentos y mapa | – | Consulta de pruebas de confianza y ubicación. |

Sin JavaScript el formulario sigue funcionando y redirige a `/gracias/` (página `noindex`): una herramienta de analítica puede contar esas visitas como envíos correctos.

## Distinciones que hay que mantener

- **Clic en teléfono ≠ llamada ≠ cliente.** Para saber cuántas llamadas llegan desde la web haría falta un número de seguimiento o preguntar al cliente cómo nos conoció.
- **Formulario enviado ≠ solicitud cualificada.** La cualificación solo puede hacerla la empresa al revisar cada correo. Propuesta sencilla y legítima: una hoja con fecha, origen (`Página:` del correo), servicio, localidad y una columna "cualificada sí/no" y "presupuesto enviado sí/no". Sin datos personales adicionales.
- **Conversión por página de servicio**: el correo de cada solicitud incluye la página de origen (`home`, `aerotermia`, `instalaciones-de-gas`…). Basta contarlas por origen.

## Si se quiere añadir analítica

Opción recomendada, de menor impacto en privacidad: una herramienta sin cookies y alojada en la UE (por ejemplo Plausible o Matomo con la configuración sin cookies). Pasos:

1. Decidir la herramienta y firmar el contrato de encargo de tratamiento.
2. Añadir su script en `src/layout.mjs` (`head`) y el dominio en la CSP de `.htaccess` (`script-src` y `connect-src`).
3. Escuchar `mri:track` y enviar cada evento como evento personalizado.
4. Actualizar la política de cookies y la de privacidad.

Si se elige Google Analytics o Tag Manager, hace falta además un banner de consentimiento previo que bloquee la carga hasta que el visitante acepte. **No se ha instalado ninguna herramienta.**

## Indicadores propuestos (revisión mensual)

1. Envíos correctos del formulario por página de origen.
2. Solicitudes cualificadas (de la hoja interna) / envíos correctos.
3. Clics en teléfono por ubicación (cabecera, hero, cierre).
4. Tasa de error del formulario (`form_submit_error` / intentos).
5. Inicio → envío del formulario (abandono).
