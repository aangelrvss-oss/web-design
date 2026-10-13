# Auditoría de la propuesta (v1) antes del rediseño comercial

Fecha: 13 de octubre de 2026. Estado auditado: commit `9376316`, etiqueta local `living-clean-v1-antes-rediseno` (copia recuperable).

Archivos revisados: `src/data.mjs`, `src/layout.mjs`, `src/pages.mjs`, `src/build.mjs`, `site/assets/css/site.css`, `site/assets/js/site.js`, `site/contacto.php`, `site/.htaccess`, `tools/preview/bundle.mjs` (genera `living-clean-portada-preview.html`), `tools/demo/build-netlify.mjs`, `qa/functional.mjs`, páginas legales y de servicio generadas.

## Problemas confirmados (probados)

| # | Problema | Dónde | Gravedad |
|---|---|---|---|
| 1 | En la vista previa de un solo archivo, **todos los enlaces a otras páginas llevan a `#servicios`**: aviso legal, privacidad (también la del formulario), cookies, las seis páginas de servicio y hasta el logotipo («inicio»). Son 40 enlaces que aparentan funcionar. | `tools/preview/bundle.mjs` | Crítica en la vista previa (en la web real los enlaces son correctos) |
| 2 | El formulario de la vista previa **no envía nada** (modo demostración). Lo dice al enviar, pero no antes. En la web real sí envía (`contacto.php` → `mail()`), probado con `sendmail` simulado. | vista previa / `contacto.php` | Media: hay que avisar antes de que el usuario rellene |
| 3 | **Frecuencias y trabajos presentados como condiciones universales**: «cada día», «cada mes», «fregado del garaje cada seis meses incluido», «abrillantado anual incluido». Salen de la web actual, pero dependen de cada contrato. | ronda, página de comunidades, FAQ | Alta (riesgo comercial y de expectativas) |
| 4 | **Sin camino para administradores de fincas**: el formulario solo distingue comunidad / empresa / vivienda; no permite indicar varias comunidades ni pedir una conversación comercial. | formulario, `contacto.php` | Alta |
| 5 | **El titular reparte el peso entre tres públicos** («comunidades, oficinas y viviendas»); el objetivo comercial es la comunidad. El CTA dice «Pedir presupuesto», no «visita». | hero | Alta |
| 6 | **No hay sección de «cómo se contrata»** ni lista de la información que conviene aportar para preparar una propuesta. | portada | Media |
| 7 | **En móvil, la ronda es un carril horizontal fijado de 5,6 pantallas** y el conserje es un acto fijado; con poca altura se ocultaban funciones del conserje (`nth-child(n+4) { display: none }`). Contenido que desaparece en móvil. | `site.css` | Alta |
| 8 | **Demasiadas tarjetas redondeadas con sombra** (paneles de público, paradas, cierre de la ronda, hoja de visita): estética de plantilla. | `site.css` | Media |
| 9 | La sección «¿Para quién es?» con pestañas repite lo que dicen la ronda y los servicios y no prioriza la comunidad. | portada | Media |
| 10 | Los nombres de eventos de medición no coinciden con los pedidos (`form_submit_success` en vez de `form_success`; falta `select_service` y `form_submit` como envío validado). | `site.js` | Baja |
| 11 | No hay estructura para testimonios reales (correcto no inventarlos, pero tampoco hay sitio preparado). | datos | Baja |
| 12 | Las 7 imágenes generadas siguen sin descargarse (red bloqueada): el hueco del portal y las paradas se ven grises. | entorno | Pendiente externo |

## Qué funciona y se conserva

- Generador estático sin dependencias, CSP estricta, sin cookies ni terceros.
- `contacto.php`: validación en servidor, señuelo antispam + tiempo mínimo, respuesta JSON o redirección sin JavaScript, nunca un falso éxito, alternativas `tel:`/`mailto:` si falla. Probado.
- Páginas legales reales con los datos de la empresa (`/aviso-legal.html`, `/politica-privacidad.html`, `/politica-cookies.html`), enlazadas desde pie y formulario **en la web real**.
- Entrada del logotipo (pedida por el usuario): se mantiene, con el pin más corto.
- Fotos reales del equipo y del vehículo; logotipo original.
- Motor de Scroll-craft sin modificar (hash verificado).

## Hipótesis que necesitan validación (no se publican como hechos)

- Que el personal siga dado de alta, con seguro de accidentes y RC de hasta 150.000 €, y que lleve móvil de empresa (todo sale de la web actual).
- Las frecuencias habituales y lo «incluido» en comunidades (portal diario, garaje semestral, abrillantado anual).
- Zona de trabajo real («Rivas-Vaciamadrid y zonas próximas»).
- Si la empresa atiende a administradores con varias comunidades a la vez y cómo organiza las visitas.
- Existencia de reseñas o referencias autorizadas para publicar.
- Ficha de Google Business Profile: no se ha podido comprobar desde este entorno.
