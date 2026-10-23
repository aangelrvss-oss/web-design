# MRI V2 · verificación

## V2.1 · hero a pantalla completa (23/10/2026)

Chromium 141 headless con Playwright sobre el servidor local (`tools/dev/router.php`, misma CSP que producción; las mediciones de contraste, que inyectan estilos, en una instancia sin CSP). Todas las capturas se han revisado a ojo; las de `docs/capturas/` son de esta pasada.

### Pruebas y resultados

| Prueba | Herramienta | Resultado |
|---|---|---|
| Suite funcional (16 páginas × 2 anchos, enlaces, formulario con y sin JS, envío real, error de servidor, teclado completo, menús, secuencia) | `qa/functional.mjs` | **279/279** |
| Los 10 estados pedidos: primer fotograma, hero, primer scroll, climatización, paso a sala técnica, paso a ventilación, final, salida al contenido, hero móvil, sin vídeo | `qa/film.mjs` + capturas | Correctos (ver `v2-secuencia-escritorio.webp`, `v2-secuencia-movil.webp`, `v2-degradacion.webp`); escena correcta en cada tramo; **reversible** (7,01 s → 3,01 s); consola limpia en todos los anchos |
| Primer pintado con red lenta (1,6 Mb/s, 150 ms) | Playwright + CDP, capturas a 0,4 / 0,9 / 1,6 / 2,6 / 4 s | Hero completo (póster + titular en Instrument Serif) desde 0,4 s, sin pantalla negra ni salto al llegar el clip |
| Contraste del hero y la cabecera sobre el fotograma real (peor píxel bajo cada línea) | `qa/hero-contrast.mjs` | 1024×768, 1280×720, 1440×900, 1920×1080, 2560×1440, 390×844, 360×640, 844×390, 820×1180: texto pequeño **≥ 4,5:1**; titular ≥ 3:1 (texto grande; peor caso 3,3:1 en una línea a 2560 px, media 8:1); logotipo e icono del teléfono ≥ 3:1 |
| Arnés oficial de Scroll-craft (escritorio, 390×844, movimiento reducido) | `tools/scroll-craft/scripts/shoot.mjs` | Sin scroll muerto; **todos los textos de escena superan 4,5:1 en su peor fotograma** |
| Anchos y alturas | `qa/film.mjs` | 1440×900, 1920×1080, 2560×1440, 820×1180, 390×844, 360×640 y 844×390 (horizontal): consola limpia, composición revisada |
| Teclado | Playwright | Recorrido: saltar al contenido → barra → «Pedir presupuesto» del hero → «Descubrir nuestros sistemas»; con Enter lleva a la escena de climatización y el foco pasa a ella; Tab sigue por los enlaces de cada escena con la escena correcta en pantalla |
| Movimiento reducido, vídeo bloqueado, sin JavaScript | `--reduced`, `--novideo`, `--nojs` | Reducido y sin JS: hero a pantalla completa sobre el póster y la secuencia como página estática. Sin vídeo: póster mientras carga y, a los 9 s, fotogramas fijos encadenados con el scroll |
| Páginas interiores con la nueva serifa | Capturas (servicio, certificaciones, gracias; escritorio y móvil) | Correctas; jerarquía por cuerpo, sin negritas sintéticas |

#### Lighthouse (portada, mismo servidor y máquina)

| Versión | Modo | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | CLS | Peso |
|---|---|---|---|---|---|---|---|---|---|
| V1 | móvil | 95 | 100 | 100 | 100 | 1,8 s | 2,7 s | 0 | 315 KiB |
| V2.1 | móvil | 92 | 100 | 100 | 100 | 2,0 s | 3,2 s | 0,001 | 4275 KiB |
| V1 | escritorio | 100 | 100 | 100 | 100 | 0,4 s | 0,6 s | 0 | 315 KiB |
| V2.1 | escritorio | 100 | 100 | 100 | 100 | 0,4 s | 0,6 s | 0,001 | 4275 KiB |

Con estrangulamiento real (`--throttling-method=devtools`), móvil: **V1 96 (LCP 2,2 s) · V2.1 91 (LCP 2,4 s, igual que su FCP)**. El peso extra es el clip, que ahora es el mismo de máxima calidad para todos los dispositivos (la Chromium de pruebas no tiene H.264 y descarga el VP9 de 3,8 MB; el MP4 pesa 5,1 MB). Se pide después de `load`, así que no compite con el primer pintado.

### Problemas encontrados y corregidos en la V2.1

| Problema | Cómo se vio | Corrección |
|---|---|---|
| Vídeo blando, sobre todo en móvil | Inspección de los archivos: el clip de móvil era de 540p y se servía a todo dispositivo táctil (~4,7× de ampliación en un teléfono 3×); el de escritorio, CRF 20 | Un único clip a la resolución completa del original, CRF 17 `veryslow` (SSIM 0,994), etiquetas de color del original, sin filtros |
| La medida de SSIM del VP9 salía anómala | `prepare.mjs` | El WebM redondea los tiempos al milisegundo; ahora ambos se comparan con la misma base de tiempo (`settb`/`setpts`) |
| Primer velo: oscurecía demasiado el salón y el titular caía sobre el sofá | Captura 1440×900 | Velo más estrecho y titular más contenido |
| Contraste insuficiente en «empieza» y la etiqueta (1,7–2,8:1) sobre la pared clara; en 1920–2560 el velo, en porcentajes de pantalla, no seguía al texto | `qa/hero-contrast.mjs` | La sombra nace del propio bloque de texto (`.hero__copy::before`), así lo acompaña en cualquier tamaño; en móvil degradado de abajo arriba más alto |
| Logotipo naranja sobre el techo claro (1,6–2,4:1) | `qa/hero-contrast.mjs` (añadido el logotipo y el icono como gráficos, 3:1) | Velo de la cabecera algo más denso detrás del logotipo; el icono del teléfono pasa a tinta clara mientras la barra flota |
| Borde duro en el velo de la cabecera | Captura | El degradado radial no llega al borde de su caja |
| El indicador de scroll a 2,9:1 en 1280×720 | `qa/hero-contrast.mjs` | Tinta plena y una sombra suave en su esquina |
| Tras «Descubrir nuestros sistemas» el foco se quedaba en el hero ya oculto | Prueba de teclado | Al terminar el desplazamiento el foco pasa al texto de la primera escena |
| El arnés capturaba la prueba «sin vídeo» antes de que entraran los fotogramas fijos | `qa/film.mjs --novideo` | El arnés captura la carga y luego espera a `film--stills` |

### Avisos que quedan

Los mismos de la V2.0 (más abajo): el clip se sostiene en su último fotograma mientras el escenario sale (buscado con `clip-map="travel"`), los avisos del motor con movimiento reducido y las peticiones bloqueadas en la prueba sin vídeo.

### Lo que no se ha podido verificar

- **H.264 en el navegador de pruebas**: esta Chromium no lo decodifica; el scrub se ha verificado con el VP9, que comparte resolución, GOP y tiempos. Falta probar el MP4 en Chrome, Safari y Firefox reales.
- **Un teléfono real** (decodificador de iOS, Modo de bajo consumo, desplazamiento táctil real) y **Apache real** (CSP con `media-src blob:`, caché de `.mp4`/`.webm`).
- **La resolución de origen** es 720p: en pantallas grandes y en teléfonos de alta densidad se amplía y no puede tener más detalle del que trae. La mejora real es un original en 1080p o 4K del mismo plano; `prepare.mjs` lo aprovecharía sin cambiar nada más.

## V2.0 (22–23/10/2026, con el vídeo del cliente)

Todo se comprobó en un navegador real (Chromium 141 headless con Playwright) sobre el servidor local con la misma CSP que producción (`tools/dev/router.php`). Las capturas de entonces se han sustituido por las de la V2.1.

### Pruebas y resultados

| Prueba | Herramienta | Resultado |
|---|---|---|
| Suite funcional (16 páginas × 2 anchos: HTTP, consola y peticiones limpias, sin desbordamiento, un H1, jerarquía, title/description, canonical, JSON-LD, imágenes, `tel:`, objetivos táctiles; enlaces internos; formulario con JS: validación, foco, teléfono corto, envío real, confirmación, medición; error de servidor sin falso éxito; preselección en servicio; sin JS: POST, contenido visible, `/gracias/` y `/envio-no-completado/`; teclado: recorrido completo con cada foco visible y en pantalla; menús; secuencia: el carril salta a cada escena, el clip avanza y retrocede, cada escena enlaza a su servicio) | `qa/functional.mjs` | **279/279** |
| Secuencia: 12 posiciones del acto, salida y secciones, esperando a que el cabezal del clip llegue antes de cada captura | `qa/film.mjs` | Escena correcta en cada tramo (clima 0–3,3 s, sala técnica 3,3–6 s, ventilación 6–10 s); **reversible** (7,01 s → 3,01 s al volver); consola limpia |
| Arnés oficial de Scroll-craft (escritorio, 390×844, movimiento reducido) | `tools/scroll-craft/scripts/shoot.mjs` | Sin scroll muerto; **todos los textos superan 4,5:1 en su peor fotograma** en los tres modos |
| Anchos y alturas | `qa/film.mjs` | 1440×900, 820×1180 (tableta vertical), 390×844, 360×640: consola limpia y composición revisada a ojo |
| Movimiento reducido (escritorio y móvil) | `--reduced` | Página estática desde el primer pintado, sin vídeo: tríptico en escritorio, secuencia apilada en móvil |
| Vídeo bloqueado | `--novideo` | Póster mientras tanto; a los 9 s, fotogramas fijos que se encadenan con el scroll (clima → sala técnica → ventilación) |
| Sin JavaScript (escritorio y móvil) | `--nojs` | Versión estática completa; formulario por POST |
| Envío real del formulario | `contacto.php` con `sendmail` falso | Correos generados con destinatario y asunto correctos |

#### Lighthouse (portada, mismo servidor y máquina)

Estrangulamiento simulado (el modo por defecto):

| Versión | Modo | Rendimiento | Accesibilidad | Buenas prácticas | SEO | FCP | LCP | CLS | Peso |
|---|---|---|---|---|---|---|---|---|---|
| V1 | móvil | 95 | 100 | 100 | 100 | 1,7 s | 2,7 s | 0 | 315 KiB |
| V2 | móvil | 90 | 100 | 100 | 100 | 1,7 s | 3,5 s | 0 | 1976 KiB |
| V1 | escritorio | 100 | 100 | 100 | 100 | 0,4 s | 0,6 s | 0 | 315 KiB |
| V2 | escritorio | 100 | 100 | 100 | 100 | 0,4 s | 0,7 s | 0,011 | 2515 KiB |

Estrangulamiento aplicado de verdad (`--throttling-method=devtools`), móvil: **V1 96 (LCP 2,2 s) · V2 95 (LCP 2,4 s, igual que su FCP)**. El LCP de 3,5 s del modo simulado es una estimación del modelo (le atribuye 2,3 s de «retraso de renderizado» al póster, que en la carga real se pinta con el primer contenido). Se probó y descartó que se debiera a la recolocación de la ventana por film.js.

El peso extra es el clip. La Chromium de pruebas no tiene H.264 y usa el VP9 (1,5 MB móvil, 2,0 MB escritorio); los MP4 pesan 1,7 y 3,1 MB.

### Problemas encontrados y corregidos

Con el vídeo real:

| Problema | Cómo se vio | Corrección |
|---|---|---|
| El original tiene un solo fotograma clave en 10 s | `prepare.mjs --inspect` | Recodificado: uno cada 0,25 s (escritorio) y 0,17 s (móvil), sin ampliar 720p a 1080p y sin audio |
| La revelación de los conductos (7,5–8,1 s) caía al final del tramo fijado, sin tiempo para verla | `qa/film.mjs`: a p = 1 el clip iba por 7,9 s | Clip repartido sobre el tramo fijado (`clip-map="travel"`): la revelación cae en p ≈ 0,8 y se sostiene |
| El velo oscurecía todo el fotograma aunque no hubiera texto | Capturas | Velo por escena, de tercio inferior y recortado hacia el centro, solo mientras su texto está en pantalla |
| Contraste del texto sobre paredes claras (peor fotograma 1,3:1) | Arnés de Scroll-craft | El velo de cada escena se enciende por `--sc-p` un poco antes que el texto y cubre todo el bloque; titulares a dos líneas |
| En la versión estática de escritorio, los fotogramas fijos aparecían desplazados ~300 px, encima de los textos | Captura del arnés con movimiento reducido | La regla que centra el fotograma en la ventana inicial no se aplica en la versión estática |
| Con el teclado, un enlace de escena recibía el foco a media opacidad (0,53) | `qa/functional.mjs` | Chrome desplazaba por su cuenta después del manejador; la corrección va en el fotograma siguiente y apunta al 30 % de la ventana de la escena |
| Bomba de calor recortada en móvil | Captura 390×844 | Punto focal de la sala técnica al 36 % |

Durante la construcción, con una animática provisional (ya retirada) se corrigieron además: el arranque de film.js antes del motor, el CLS de 1,0 (altura del acto reservada en CSS, comprobada por el build), la cabecera oscura sobre la imagen, el titular fantasma al abrir la ventana, el gris turbio en móvil, el H1 alineado a la derecha en móvil y la composición de tableta vertical.

### Avisos que quedan y por qué

- El arnés de Scroll-craft informa de que el clip se sostiene en su último fotograma mientras el escenario sale (0,36–0,39 pantallas). Es la consecuencia buscada de `clip-map="travel"`; el último tramo del vídeo es un plano fijo de los conductos.
- Con **movimiento reducido** el motor escribe en consola que los actos «inicio» y «sectores» no se fijarán. Es lo buscado: ambos pasan a versión estática (el de «sectores» viene de la V1).
- Bloqueando el vídeo, la consola muestra las propias peticiones bloqueadas.

### Lo que no se ha podido verificar

- **H.264 en el navegador de pruebas**: esta Chromium no lo decodifica; el scrub se ha verificado con la versión VP9, que comparte resolución, GOP y tiempos. Falta probar los MP4 en Chrome, Safari y Firefox reales.
- **Un teléfono real**: decodificador de iOS, Modo de bajo consumo y desplazamiento táctil real. Headless no los reproduce. Scroll-craft trae `references/device-diag.html` para diagnosticar en el dispositivo.
- **Apache real**: la CSP de `.htaccess` con `media-src blob:` y la caché de `.mp4`/`.webm` no se han probado en el alojamiento.
- La **resolución del vídeo** es 720p: en pantallas grandes a sangre se nota algo blando. Si existe una versión 1080p del mismo plano, `prepare.mjs` la aprovecha sin cambiar nada más.
