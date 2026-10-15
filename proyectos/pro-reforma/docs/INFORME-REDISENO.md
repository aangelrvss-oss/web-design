# Informe del rediseño · Pro Reforma

Fecha: 15 de octubre de 2026. Rama de trabajo `ccr-55da8280-pmyc9n`, carpeta `proyectos/pro-reforma/`. Nada publicado.

## 1. Decisiones de diseño

| Decisión | Por qué |
|---|---|
| **Mensaje**: «Reformas bien hechas, con la casa protegida y los acabados cuidados» | Es lo que repiten las reseñas (acabados, protección y limpieza, trato y explicaciones) y lo que la propia empresa describe en su página de Pintura. Sustituye a «Transformamos tu hogar con calidad y profesionalidad», que no diferencia. |
| **Solo fotos reales de obra** | La portada actual usa una foto de iStock. Las ocho fotos reales estaban escondidas en un carrusel. No se usan imágenes generadas ni de stock como si fueran trabajos de Pro Reforma; Higgsfield no se ha usado (la red bloquea la descarga de resultados y no hacía falta). |
| **Fotos a su tamaño** | Las originales solo se han podido obtener como recortes de captura (826×406 y 392×406 px). Se muestran sin ampliarlas más de un 15 % (comprobado en la suite). Por eso el hero es un collage de piezas pequeñas y no una foto a sangre. |
| **Tipografía**: Fraunces (titulares) + Instrument Sans (texto) | Serif editorial con carácter artesano frente a la sans genérica de la plantilla. Autoalojadas (OFL), sin Google Fonts. |
| **Color**: marfil `#F4F1EB`, tinta `#16191E`, rojo `#C8101A` (marca, ajustado para contraste AA), azul marino `#0E2A44` | Los colores de la marca (rojo y azul marino) sobre un fondo cálido de yeso. El rojo se reserva para la acción principal. |
| **Pico de la portada: la obra fase a fase** (acto fijado, 2,6 pantallas) | Cuatro fotos de la misma habitación (preparación, placas, pintura, terminada) se descubren con un barrido al hacer scroll mientras se marca la fase en la lista. Es la prueba más clara del trabajo real. En móvil y sin JavaScript se ve como lista con las cuatro fotos (sin tramo fijado). |
| **Animación contenida** | Entrada del hero (líneas y barridos cortos), parallax suave del collage, aparición escalonada de listas, barridos en «Más trabajos». Nada bloquea la lectura: textos y CTA son legibles desde el primer fotograma. Con «reducir movimiento» las fases cambian por fundido y no hay parallax. |
| **Logotipo** | Wordmark tipográfico provisional (casa roja sobre «PRO» rojo + «REFORMA» azul marino) que imita la versión horizontal. El archivo original no se ha podido descargar. |
| **URL** | Se conservan las de la web actual; las antiguas sin barra final redirigen con 301 (`DirectorySlash On`). |

## 2. Mejoras de conversión y experiencia (CRO/UX)

1. **Formulario de presupuesto en la propia página** (portada, cada servicio y contacto), con envío real. Antes el botón principal solo abría WhatsApp y el formulario estaba en otra página.
2. **Formulario corto**: tipo de obra (5 opciones con un toque), nombre, localidad, teléfono **o** correo, descripción opcional y cómo prefiere que le contacten. Sin casilla de privacidad obligatoria: se informa con capa básica y enlace a la política (la base es la solicitud del propio usuario).
3. **El servicio ya viene marcado**: desde una página de servicio el formulario llega con el tipo de obra seleccionado.
4. **Tres vías directas siempre a mano**: teléfono `tel:+34691312106` en la cabecera, WhatsApp (botón flotante en móvil que se oculta sobre el formulario) y correo.
5. **Reseñas arriba**: valoración y número de Google junto al hero, enlace a la ficha y cinco reseñas con el trabajo concreto al que se refieren.
6. **Errores que no pierden datos**: si el envío falla, el formulario conserva lo escrito y ofrece teléfono, WhatsApp y un correo ya redactado. No hay mensajes de éxito sin respuesta real del servidor.
7. **Servicios reales con contenido propio**: insonorización y reformas integrales tienen página por primera vez; cada servicio principal explica problema, para quién, qué incluye, proceso, qué preparar y dudas.
8. **SEO local**: un H1 por página con servicio y localidad, títulos y descripciones propios, datos estructurados `GeneralContractor` con dirección completa (sin valoraciones agregadas), `sitemap.xml`, `robots.txt`, enlaces `tel:` normalizados y corregido el enlace roto de Facebook.
9. **Rendimiento**: sin plataforma ni widgets de terceros; Lighthouse móvil 96–99 y escritorio 100, CLS 0 (ver `VERIFICACION.md`).
10. **Medición sin cookies**: eventos propios para cada contacto y para el embudo del formulario (ver `MEDICION.md`). No se afirma que la web mejore la conversión: no hay datos aún.

## 3. Entregables del encargo

| # | Entregable | Dónde / estado |
|---|---|---|
| 1 | Web funcionando en local | `php -S` con `tools/dev/router.php` (README) |
| 2 | Páginas | 23 generadas (README, tabla de páginas) |
| 3 | Integración de reseñas | `site/api/resenas.php` + carga en `site.js`; modo editorial fechado mientras no haya credenciales (`docs/RESENAS.md`) |
| 4 | Animaciones | Scroll-craft sin modificar; arnés sin scroll muerto en 6 configuraciones; pruebas de scroll inverso y recarga |
| 5 | Medios optimizados | 8 fotos WebP con `width`/`height`, 3 fuentes WOFF2 autoalojadas (~110 KB), OG 1200×630 |
| 6 | Vista previa navegable | `preview/pro-reforma-preview.html` (un archivo, 20 páginas, formulario en modo demostración) |
| 7 | Informe de diseño | Este documento, apartado 1 |
| 8 | Lista de mejoras CRO/UX | Apartado 2 |
| 9 | Resultados reales de las pruebas | `VERIFICACION.md` |
| 10 | Credenciales y permisos que faltan | Apartado 4 |
| 11 | Instrucciones de ejecución | `README.md` |
| 12 | Cambios y archivos principales | Apartado 5 |
| 13 | Fuentes de las reseñas y cómo actualizarlas | `RESENAS.md` |
| 14 | Auditoría inicial | `AUDITORIA.md` |

## 4. Qué falta (credenciales, permisos y datos por validar)

| Tema | Qué se necesita |
|---|---|
| Reseñas por API | `GOOGLE_PLACES_API_KEY` y `GOOGLE_PLACE_ID` en el servidor y **autorización de facturación** en Google Cloud (Place Details con reseñas: 1.000 consultas gratis al mes, después de pago). No se ha activado nada. |
| Reseñas en modo editorial | Los fragmentos están tomados del widget que la propia empresa publica en su web. Confirmar que Pro Reforma acepta reproducirlos así, o activar la API. |
| Logotipo original | En vector o PNG grande. La red bloquea el CDN de la web actual. |
| Fotos originales | Las actuales son recortes de captura; con los originales se podría usar un hero a sangre. Confirmar también el permiso para publicarlas (se ven operarios). |
| Zona de trabajo | Se usa «Rivas-Vaciamadrid y la Comunidad de Madrid», tomado de su Instagram. Validar. |
| Quién atiende | Los textos dicen que Daniel atiende teléfono y correo (lo dicen las reseñas). Validar. |
| Proceso | Pasos del método (primer contacto, visita con medidas y fotos, presupuesto detallado por partidas, planificación, obra con la casa protegida y seguimiento, limpieza y entrega) redactados a partir de la web y las reseñas. Validar cada uno, igual que «sin compromiso». |
| Cifras | No se usan «más de 20 años», «+500 proyectos» ni «100 % de satisfacción» (son contradictorias entre web y dossier). Si se confirman con datos, se pueden añadir. |
| Correo del formulario | Comprobar `mail()` del alojamiento o pasar a SMTP; SPF/DKIM para `web@proreforma.es`. |
| Textos legales | Preparados con los datos reales del aviso legal actual; deben revisarlos su asesor. |
| Hosts bloqueados durante el trabajo | `www.proreforma.es`, `le-de.cdn-website.com`, `de.cdn-website.com`, `lh3.googleusercontent.com`, `d8j0ntlcm91z4.cloudfront.net`: por eso se trabajó con Firecrawl y capturas. |

## 5. Archivos principales

- `src/data.mjs`: todo el contenido (datos de empresa, reseñas con fecha, fotos y textos alternativos, proyectos, servicios, método, dudas, tipos de obra).
- `src/layout.mjs`, `src/pages.mjs`, `src/build.mjs`: plantillas y generación de 23 páginas, `sitemap.xml` y `robots.txt`.
- `site/assets/css/site.css`, `site/assets/js/site.js`: diseño y comportamiento (montaje del motor, móvil en flujo, menús, reseñas en vivo, formulario, medición, estado verificable de las fases).
- `site/contacto.php`, `site/api/resenas.php`, `site/.htaccess`.
- `qa/functional.mjs`, `qa/animation.mjs`, `tools/preview/bundle.mjs`, `tools/og/render.mjs`.
- Compartidos: `tools/dev/router.php` (ahora sirve cualquier `.php` del proyecto y permite avatares de Google en la CSP).
