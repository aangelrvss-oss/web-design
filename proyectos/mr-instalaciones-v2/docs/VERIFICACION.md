# MRI V2 · verificación (22/10/2026)

Todo se ha comprobado en un navegador real (Chromium 141 headless con Playwright) sobre el servidor local con la misma CSP que producción (`tools/dev/router.php`). Las capturas de este documento son de esas pasadas.

## Pruebas y resultados

| Prueba | Herramienta | Resultado |
|---|---|---|
| Suite funcional (16 páginas × 2 anchos: HTTP, consola y peticiones limpias, sin desbordamiento, un H1, jerarquía, title/description, canonical, JSON-LD, imágenes, `tel:`, objetivos táctiles; enlaces internos; formulario con JS: validación, foco, teléfono corto, envío real, confirmación, medición; error de servidor sin falso éxito; preselección en servicio; sin JS: POST, contenido visible, `/gracias/` y `/envio-no-completado/`; teclado: recorrido completo con cada foco visible y en pantalla; menús) + 4 pruebas nuevas de la secuencia | `qa/functional.mjs` | **279/279** |
| Secuencia: 12 posiciones del acto, salida y secciones, esperando a que el cabezal del clip llegue antes de cada captura | `qa/film.mjs` | Escena correcta en cada tramo (clima 0–3,9 s, aerotermia 3,9–7,5 s, ventilación/fontanería 7,5–12 s); **reversible** (6,66 s → 2,86 s al volver); consola limpia |
| Arnés oficial de Scroll-craft (escritorio, 390×844, movimiento reducido) | `tools/scroll-craft/scripts/shoot.mjs` | Sin scroll muerto; el clip se mueve siempre que está en pantalla; **todos los textos superan 4,5:1 en su peor fotograma** |
| Anchos y alturas | `qa/film.mjs` | 1440×900, 820×1180 (tableta vertical), 390×844, 360×640: consola limpia y composición revisada a ojo |
| Movimiento reducido (escritorio y móvil) | `--reduced` | Página estática desde el primer pintado, sin vídeo; misma información |
| Vídeo bloqueado | `--novideo` | Póster mientras tanto; a los 9 s, fotogramas fijos que se encadenan con el scroll (comprobado: clima → aerotermia → ventilación) |
| Sin JavaScript (escritorio y móvil) | `--nojs` | Versión estática completa; formulario por POST |
| Envío real del formulario | `contacto.php` con `sendmail` falso | 2 correos generados (con y sin JS) con destinatario y asunto correctos |

### Lighthouse (portada, mismo servidor, misma máquina)

| Versión | Modo | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | CLS | TBT | Peso |
|---|---|---|---|---|---|---|---|---|---|---|
| V1 | móvil | 95 | 100 | 100 | 100 | 1,7 s | 2,7 s | 0 | 0 ms | 315 KiB |
| V2 | móvil | 93 | 100 | 100 | 100 | 1,7 s | 3,2 s | 0 | 0 ms | 1878 KiB |
| V1 | escritorio | 100 | 100 | 100 | 100 | 0,4 s | 0,6 s | 0 | 0 ms | 315 KiB |
| V2 | escritorio | 87 | 100 | 100 | 100 | 0,4 s | 2,5 s | 0,011 | 0 ms | 2524 KiB |

El peso extra es el clip (la Chromium de pruebas no tiene H.264 y usa el VP9: 1,4 MB móvil, 2,0 MB escritorio; los MP4 pesan 1,3 y 2,5 MB). El póster pinta con el primer contenido; el LCP de escritorio pasa a ser el vídeo cuando sustituye al póster con su primer fotograma. Con el vídeo real las cifras dependerán de su duración y su grano; `prepare.mjs` informa del tamaño.

## Problemas encontrados y corregidos durante la verificación

| Problema | Cómo se vio | Corrección |
|---|---|---|
| La secuencia caía en modo estático con el motor presente | `qa/film.mjs`: `static: true` | film.js esperaba a DOMContentLoaded mal: los scripts diferidos se ejecutan en `interactive`. Ahora la fase 2 espera al evento. |
| El motor avisaba de que el escenario no sería sticky | Consola | El respaldo sin motor se condicionaba a `.sc-ready`, que aún no existe al montarse. Ahora depende de `.js`/`.film--static`. |
| CLS de 1,0 | Lighthouse | El motor fija la altura del acto al montarse y todo lo de debajo saltaba. La altura (`--film-span`) se reserva en CSS desde el primer pintado; el build comprueba que coincide con `FILM.span`. |
| Cabecera de tinta oscura sobre el vídeo ya abierto | Capturas a p = 0,10 | La barra pasa a clara cuando el borde de la ventana la alcanza (mismo cálculo que el CSS). |
| La ventana inicial enseñaba el suelo, no el equipo | Captura del primer viewport | El fotograma se centra en la ventana y vuelve a su sitio al abrirse. |
| Titular fantasma cruzando la ventana al abrirse | Capturas a p = 0,05 | Salida del titular más rápida. |
| Gris turbio en móvil durante la apertura | Capturas móvil a p = 0,10 | El grafito sube pegado a la ventana; el papel no se funde. |
| H1 alineado a la derecha en móvil | Captura móvil | `align-self: end` de la rejilla de escritorio en un flex en columna. |
| Equipos recortados en tableta vertical | Captura 820×1180 | La composición de móvil se aplica a toda pantalla con relación ≤ 4:5; punto focal por escena. |
| Kicker de la escena 2 a 4,47:1 sobre la tubería naranja | Arnés de Scroll-craft | Kicker en crema y velo local más denso detrás del texto. |
| Contraste de «Sectores» y de la barra según Lighthouse | Lighthouse | Falsos positivos (fichas fuera de pantalla en el carril; papel pintado por un pseudo-elemento), corregidos de todos modos dando a cada elemento su propio fondo. |

## Avisos que quedan y por qué

- Con **movimiento reducido** el motor escribe en consola que los actos «inicio» y «sectores» no se fijarán. Es lo buscado: ambos pasan a versión estática (el de «sectores» viene de la V1).
- Bloqueando el vídeo, la consola muestra las propias peticiones bloqueadas.

## Lo que no se ha podido verificar

- **El vídeo definitivo**: no estaba en el entorno. Todo lo anterior se ha verificado con la animática provisional. Al recibir el vídeo hay que: inspeccionarlo con `prepare.mjs --inspect` (fotogramas clave, cortes, artefactos, primer y último fotograma), ajustar `film.mjs` (tiempos, `side`, `focal`) y repetir `qa/film.mjs` y el arnés de contraste, porque el contraste depende de cada fotograma.
- **H.264 en el navegador de pruebas**: esta Chromium no lo decodifica; se verificó el scrub con la versión VP9, que comparte GOP y tiempos. Falta probar los MP4 en Chrome, Safari y Firefox reales.
- **Un teléfono real**: decodificador de iOS, Modo de bajo consumo y desplazamiento táctil real. Headless no los reproduce. Scroll-craft trae `references/device-diag.html` para diagnosticar en el dispositivo.
- **Apache real**: la CSP de `.htaccess` con `media-src blob:` y la caché de `.mp4` no se han probado en el alojamiento.
