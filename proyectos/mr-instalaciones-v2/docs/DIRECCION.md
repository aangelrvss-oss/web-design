# MRI V2 · dirección artística

## 1. Auditoría del repositorio «proyectos-web»

Se extrajo el ZIP fuera del proyecto (carpeta temporal de trabajo, no versionada) y se renderizaron con Playwright los **66 `index.html`** que contiene, en escritorio y, para los candidatos, en móvil y con su interacción (hover, scroll).

**Valoración honesta**: es una colección de componentes de aprendizaje (R3LI4NT/proyectos-web: menús, logins, tarjetas, sliders, footers…). Ningún proyecto tiene calidad de estudio premium: tipografías de Google Fonts genéricas (Poppins, Roboto, Oswald, Bebas Neue), posicionamiento absoluto con valores mágicos, glassmorphism, gradientes y neones decorativos. No se ha tomado ningún proyecto como plantilla. Se han extraído **principios** concretos de tres, y uno más para el pie:

| Referencia | Archivo observado | Qué interesa | Cómo se adapta a MRI | Qué no se copia |
|---|---|---|---|---|
| **Efecto Parallax** (principal, hero) | `Efecto Parallax/index.html`, `style.css` (`.parallax { height: 100vh; background-attachment: fixed }`, `h2` en banda de lado a lado) | La imagen es un espacio que se mira **a través de una ventana**: la ventana se mueve, la imagen no. Y el texto es una **banda horizontal** que cruza la imagen en lugar de una caja que la tapa. | V2.0: el vídeo asomaba en una ventana enmarcada que se abría a sangre con el scroll. V2.1: la casa ocupa la pantalla desde el primer instante y es la cámara la que se mueve por ella; se conserva la idea de la banda: titular y textos de escena van en una franja baja con contraste local, dejando libre el centro del encuadre, donde están los equipos. | `background-attachment: fixed` (roto en iOS), la caja blanca con borde de 2 px, Poppins, «SECTION 1». |
| **Sliders/1-** (principal, navegación de la secuencia) | `Sliders/1-/style.css` (`.img-section { flex: 1 }` → `:hover { flex-grow: 10 }`) | Una tira de escenas en la que **la activa gana anchura y las demás ceden**. | El carril de escenas bajo la imagen: tres tramos (Climatización · Aerotermia y calefacción · Ventilación y fontanería); el activo crece (`flex-grow 1 → 2,6`) y su barra se llena con el avance del clip. Es navegación real: cada tramo salta a su escena. | El `skew(7deg)`, el `border-radius: 20px`, las fotos de animales, el hover como único disparador. |
| **Acordeon** (secundaria, tipografía y FAQ) | `Acordeon/index.html`, `style.css` (Bebas Neue condensada para el titular + Poppins 300 para el cuerpo; filas desplegables) | El contraste entre un **titular condensado** y un cuerpo ligero, y la lista de preguntas como filas que se despliegan. | V2.0: Archivo condensada para titulares; V2.1: el contraste se mantiene con otra voz, Instrument Serif para titulares frente a Geist para el texto (ver Tipografía). Preguntas frecuentes con `<details>` nativo, filas a línea fina y un «+» que gira. | Tarjetas oscuras con sombra, el truco del checkbox (inaccesible), texto justificado con guiones. |
| **Footer Designs/2-** (menor, pie) | `Footer Designs/2-/index.html`, `style.css` (`.logo` + `.line` corta de color + columnas) | La **regla corta de color** como firma bajo el logotipo, columnas por grupo. | Regla naranja de 44 × 3 px bajo el logotipo en el pie de grafito. | Posiciones absolutas, iconos sociales vacíos, el campo de newsletter. |

Descartados con motivo: menús (genéricos o con jQuery/Bootstrap), logins (no hay login), tarjetas (justo lo que el encargo pide evitar: tarjetas repetidas, 3D, RGB), galería y lightbox (no hay fotos reales), barras de skills (cifras inventadas), panel admin y sistema de ventas (otra categoría de producto).

## 2. Sistema

**Paleta.** Papel cálido `#EFECE6` y `#E5E1D9`, tinta `#141617`, grafito `#121516`, naranja de marca `#FF6500` solo donde actúa: acción principal, sistema activo en el carril, reglas cortas de marca, foco. Texto naranja sobre papel en `#A6420A` para cumplir contraste. Ni web oscura por defecto ni crema artesanal: el vídeo vive en grafito y el contenido comercial en papel, alternando (papel → papel tostado → grafito → papel → grafito).

**Tipografía (V2.1).**

| Rol | Fuente | Ajustes |
|---|---|---|
| Titular de portada | Instrument Serif 400, segunda línea en cursiva real | `clamp(2,9rem, min(6vw, 10,6svh), 7,75rem)`, interlineado 0,94, tracking −0,021 em; dos líneas en escritorio, tres en móvil, cortes elegidos a mano |
| Titulares de sección | Instrument Serif 400 | 2,1–6,8 rem (`.d-md` a `.d-xl`), interlineado 0,92–1 |
| Titulares de escena | Instrument Serif 400 | 2,2–3,9 rem, máx. 16 ch |
| Filas (necesidades, FAQ) y titulares de ficha | Instrument Serif 400 | 1,3–2,2 rem |
| Texto | Geist 400 | 1–1,16 rem, 1,45–1,6, medida 32–44 ch |
| Metadatos, etiquetas, teléfono | Geist Mono 500 | 0,64–0,76 rem, mayúsculas, tracking 0,09–0,22 em |

**Por qué Instrument Serif.** El encargo pide una tipografía premium para un titular grande sobre vídeo. La condensada de la V2.0 (Archivo al 68 %) funcionaba como rótulo técnico, pero sobre un interior cálido a pantalla completa leía como cartel. Instrument Serif es una serifa de display de contraste alto y proporciones estrechas: a 100–120 px tiene la presencia editorial de una revista de arquitectura, ocupa poco ancho (el titular cabe en dos líneas en el tercio izquierdo sin tapar el split) y su cursiva real da a «donde no lo ves» el giro de la frase sin recurrir a color ni peso. Contra Geist y Geist Mono (las de la V1, que se mantienen para texto y datos) hace el contraste justo: serifa humana para la emoción, sans y mono para la información. Licencia OFL, servida desde el propio sitio (`@fontsource/instrument-serif` 5.2.8, latín, 21 + 22 KB en WOFF2, regular y cursiva; licencia en `site/assets/fonts/`). Solo existe en peso 400: la jerarquía la dan cuerpo y espacio, y `font-synthesis: none` impide negritas o cursivas falsas. Se descartaron Fraunces (ya la usan las webs de Pro Reforma de este repositorio) y una grotesca de display (habría repetido el lenguaje de la V1).

La V2.0 usaba un recorte propio del Archivo variable (`archivo-cond.woff2`); se ha retirado del sitio y de `assets-src/`.

## 3. El vídeo: lectura del plano

Vídeo del cliente (generado con IA): 1280×720, 24 fps, 10,03 s, H.264 High a 2,9 Mb/s, plano continuo sin cortes (la detección de escenas de ffmpeg no encuentra ninguno), pista de audio y **un único fotograma clave**. Color: BT.709 (primarios), matriz SMPTE 170M, transferencia sRGB, rango limitado. Hoja de contactos en `assets-src/video/contactos-mri-original.jpg`.

| Tiempo | Qué se ve | Uso |
|---|---|---|
| 0–1,6 s | Salón luminoso; el split se enciende y su caudal de aire se hace visible | Primer fotograma = póster. Escena 1, **Climatización** |
| 1,6–3,3 s | La cámara cruza el salón hacia una puerta | Transición; el texto 1 se despide |
| 3,3–5,9 s | Sala técnica: bomba de calor exterior (izquierda), módulo hidráulico (derecha), grupos de bombeo y tuberías de cobre; acercamiento hasta un detalle de fontanería | Escena 2, **Aerotermia y fontanería**; texto a la derecha para dejar libre la bomba de calor |
| 5,9–7,5 s | Sale a un pasillo con difusores lineales en el techo | Escena 3 empieza: ya se ven las rejillas de ventilación |
| 7,5–8,1 s | El falso techo se vuelve transparente y aparecen los conductos | **Revelación**: el momento más fuerte del vídeo |
| 8,1–10 s | Plano casi fijo de los conductos | Se sostiene hasta el final del tramo fijado |

El orden real es clima → aerotermia y fontanería → ventilación (la fontanería está en la sala técnica, no al final). Defectos observados: desenfoque de movimiento en 5,9–6,3 s (transición, aceptable) y la transparencia del techo produce un fundido doble durante 0,6 s (es el efecto buscado). Primer y último fotograma funcionan como encuadres: salón con el split arriba en el centro y conductos con el techo abierto. Zonas que admiten texto: el tercio inferior (sofá, suelo, paredes bajas); los equipos están siempre en la mitad superior o en un lateral.

## 4. La portada (V2.1)

**Primer viewport.** El salón ocupa toda la pantalla (100svh) desde el primer pintado: el póster es el fotograma 0 del clip, precargado con prioridad alta, y el vídeo lo sustituye sin salto. No hay sección previa, ni tarjeta, ni márgenes. La cabecera flota encima sin ocupar espacio: logotipo claro, Servicios, Certificaciones, Contacto, teléfono en mono y «Pedir presupuesto»; un velo cálido solo en la franja superior (más denso detrás del logotipo, que es naranja de marca) le da contraste. En móvil: logotipo, teléfono (icono), «Pedir presupuesto» y menú.

**Hero.** En el tercio inferior izquierdo, alineado a la rejilla de la cabecera: etiqueta mono «Martínez Rojas Instalaciones · Madrid» con regla naranja, el titular «El confort empieza *donde no lo ves.*», una frase de apoyo real («Climatización, aerotermia, ventilación y fontanería, proyectadas e instaladas para funcionar juntas.»), el CTA principal y «Descubrir nuestros sistemas», que lleva a la primera escena. A la derecha, un indicador de scroll discreto (rótulo vertical y una línea con un trazo que baja; estático con movimiento reducido). El split (arriba en el centro), el sofá y la chimenea quedan libres.

El CTA principal dice «Pedir presupuesto» y no «Solicitar presupuesto» (la sugerencia del encargo): es el rótulo de la cabecera, de la V1 y de las páginas de servicio, y dos rótulos para la misma acción en la misma pantalla harían dudar de si son cosas distintas.

**Contraste local, no un velo general.** El vídeo es luminoso y cálido; oscurecerlo entero lo apagaría. El contraste lo da una sombra cálida que nace del propio bloque de texto (`.hero__copy::before`: un degradado horizontal recortado por otro vertical, que llega al borde izquierdo y al pie de la pantalla y se funde unos 200 px más allá del texto), así acompaña al texto en cualquier ancho y alto. Más una franja baja muy suave para el indicador de scroll. Medido sobre el fotograma real (`qa/hero-contrast.mjs`, el método del arnés de Scroll-craft: píxel más claro bajo cada línea): todo el texto pequeño ≥ 4,5:1 y el titular ≥ 3:1 (texto grande) en el peor punto, en 1024–2560 px de ancho, 390×844, 360×640, 844×390 y 820×1180; logotipo e icono del teléfono ≥ 3:1. En móvil la sombra es un degradado de abajo arriba a todo el ancho.

**Salida del hero.** Con el primer 10 % del tramo fijado el hero se funde y sube (5 % de rampa) mientras el aire empieza a salir del split; deja de recibir foco y clics cuando ya no se ve. Si el motor no llega, el hero sigue ahí: es contenido normal, no un cue.

**Escenas.** Tres bloques sincronizados con los tiempos del clip: kicker mono con regla naranja, titular serif a dos o tres líneas, una frase con información real y el enlace al servicio. Van en el tercio inferior, al lado contrario del equipo protagonista (`side`). Cada bloque tiene su propio velo de «tercio inferior», recortado hacia el centro y encendido por el progreso del acto con la ventana de su escena: llega un poco antes que el texto y se va un poco después. Fuera de esos momentos el vídeo, que es luminoso y cálido, se ve sin oscurecer. El carril de escenas cierra la composición.

**Móvil y tableta vertical.** Misma composición a pantalla completa: el 16:9 se recorta siguiendo el punto focal de cada escena (salón 46 %, sala técnica 36 % para conservar la bomba de calor, techo 50 %), interpolado en los cambios; el titular pasa a tres líneas, los CTA a ancho completo y todo el texto se apoya abajo sobre un degradado de abajo arriba. En el carril solo se rotula la escena activa. En pantallas bajas (móvil en horizontal, portátiles pequeños) se oculta la frase de apoyo y el indicador para que el titular y los CTA quepan.

**Final.** La revelación de los conductos cae dentro del tramo fijado y se sostiene; después el escenario sale llevándose el último fotograma (los conductos) y la página continúa con «¿Qué necesitas resolver?», que retoma la idea del recorrido («Una sola empresa para que todo encaje»).

## 5. Scroll y vídeo

- Motor: **Scroll-craft sin modificar** (hash idéntico al de la V1 y al del ZIP `scroll-craft-main`). Acto `scrub` de 4,2 alturas (4,8 en la V2.0: sin la apertura de la ventana sobra ese tramo): el motor fija el escenario, descarga el clip como Blob (búsqueda sin peticiones por rangos), lo recorre con cabezal suavizado (lerp, zona muerta y coalescencia de búsquedas) y mantiene el póster hasta que hay un fotograma pintado. No se añadió GSAP: duplicaría lo que el motor ya hace.
- El clip se reparte sobre el **tramo fijado** (`data-sc-clip-map="travel"`), no sobre toda la vida visible del escenario (el comportamiento por defecto). Con el reparto por defecto el último 21 % del clip, justo la revelación de los conductos, se reproducía ya con el escenario saliendo. Como los dos últimos segundos son un plano fijo, sostener el último fotograma durante la salida no se percibe como congelación. Los textos usan la misma correspondencia: `progreso = t / duración`.
- **Codificación para scrub**: el original tiene un único fotograma clave en 10 s, así que cada búsqueda tendría que decodificar desde el principio. Se recodifica con un fotograma clave cada 1/6 s (GOP 4), sin audio.
- **Calidad (V2.1).** Diagnóstico de la V2.0: el clip de móvil era de 540p y se servía a todo dispositivo táctil; a pantalla completa en un teléfono de 3× eso es ampliarlo ~4,7 veces, y era la causa principal de la blandura. Además el de escritorio se codificaba con CRF 20. Ahora hay **un único clip para todos los dispositivos, a la resolución completa del original** (1280×720; no hay versión de más resolución y ampliarlo no añade detalle, solo peso), H.264 High CRF 17 `preset veryslow` (5,1 MB, SSIM 0,9943 frente al original) y VP9 CRF 26 (3,8 MB, SSIM 0,9935), con las etiquetas de color del original y sin filtros (ni enfoque, ni saturación, ni escalado). El póster y los fotogramas fijos se sacan del original a resolución completa (WebP 90). Coste: la portada pesa ~4,2 MiB en vez de ~2 MiB; el clip se pide después del evento `load`, así que no retrasa el primer pintado ni el LCP.
- H.264 por defecto; VP9 para navegadores sin H.264 (film.js elige antes de que el motor pida el clip). El clip se pide cuando la página ha terminado de cargar, para que no compita con el póster ni con las fuentes; hasta entonces el póster, que es su primer fotograma, cubre el escenario.
- Degradación: con **movimiento reducido** o **sin motor/JS**, la secuencia es una página estática (titular y tres fotogramas fijos con su texto); si el **clip no llega** en 9 s, se encadenan los fotogramas fijos de cada escena con el mismo scroll; mientras carga, el póster.

## 6. Lo que se ha conservado y lo que no

Se conservan íntegros los contenidos comerciales de la V1: necesidades → servicios, habilitaciones con sus registros, sectores, preguntas frecuentes, contacto y formulario (mismo `contacto.php`, misma validación). No se ha inventado ninguna cifra, certificación, garantía ni reseña (la V1 no tenía reseñas publicadas y la V2 tampoco).

V2.0 y V2.1 retiraron de la portada el pico de la V1 (la casa que se dibuja por capas con la leyenda). La V2.2 lo recupera: ver la sección 7.

## 7. V2.2 · el plano técnico y el vídeo en móvil

### Qué había en la V1 y qué se había perdido

La referencia (`mri-portada-preview.html`) es la portada de la V1: comparada con el código de `proyectos/mr-instalaciones/`, el acto `#instalacion` es idéntico (solo cambian los enlaces que reescribe la vista previa). Es un acto `pin` de 5,2 alturas: una sección constructiva de una vivienda (`src/house.mjs`, SVG propio) en la que siete capas (agua, saneamiento, calefacción, aerotermia, ventilación, gas, domótica) se trazan una tras otra con `stroke-dashoffset` calculado desde `--sc-p`, cada una con su texto y el enlace a su servicio; al final la casa se enciende y aparece «Una sola empresa para que todo encaje» con el CTA. La leyenda aísla capas y marca los servicios en el formulario (`site.js`, que la V2 ya compartía sin cambios). La V2 lo había sustituido por las tres escenas del vídeo: se perdieron el dibujo, las siete capas, la leyenda y el traspaso al formulario.

Lo que la V2 hace mejor y se conserva: el hero a pantalla completa con el vídeo, la tipografía, la cabecera superpuesta, el contraste local y la degradación (estático, sin JS, sin vídeo).

### Cómo se conectan

Vídeo (sentir: la casa real) → «¿Qué necesitas resolver?» (elegir) → plano técnico (entender: todos los sistemas, capa a capa) → habilitaciones → sectores → dudas → presupuesto. Es el orden de la V1, con el vídeo delante. Entre los dos actos fijados hay una sección ligera de papel para que no se encadenen 9 pantallas de scroll fijado. El texto final del plano («Una sola empresa para que todo encaje») ya no se repite como antetítulo de las necesidades.

### Jerarquía del movimiento

- Hero: el vídeo (impacto).
- Plano técnico: la única animación de scroll protagonista después del hero.
- Necesidades, habilitaciones, sectores: entradas discretas (`data-sc-in`, el barrido de la placa). **Los sectores dejan de ser un recorrido horizontal fijado** (`pan` 3,2) y pasan a una rejilla: con el plano de vuelta, tres actos fijados eran demasiados.
- Dudas y formulario: quietos.

No se ha añadido ningún efecto nuevo ni otro motor: el plano usa las mismas reglas CSS de la V1 sobre el `--sc-p` de Scroll-craft.

### La composición del plano

- **Escritorio**: el dibujo ocupa toda la columna derecha a toda altura, sin la leyenda debajo (medido en 1440×900, la casa pasa de 499×375 px en la V1 a 548×412 px; el dibujo completo, con la acometida y el saneamiento hasta la calle, mide ~900 px de ancho). A la izquierda, el texto de la capa y, debajo, la leyenda como clave del plano en dos columnas (en la V1 era una fila que dejaba «Domótica» sola en una segunda línea).
- **La leyenda acompaña al dibujo**: las capas pendientes van atenuadas, la que se está dibujando se marca con su color (mismas ventanas que el trazado) y las ya dibujadas quedan plenas. Así la explicación y el dibujo van sincronizados también en la leyenda.
- **Cada texto dice qué capa es** («Capa 03 / 07» con la muestra de línea) y el nombre va en la serifa. En la V1 la muestra punteada de la domótica iba pegada al título y se leía como unos puntos suspensivos («···· Domótica»); ahora la muestra es discontinua y va en la línea de la capa, no junto al título.
- **Móvil en vertical**: el dibujo a sangre arriba, recortado a la casa y la bomba de calor (x 195–1135 del dibujo; en 390×844 la casa pasa de 276×207 px en la V1 a 304×228 px); la leyenda justo debajo, entera, en tres filas sin desplazamiento lateral (en la V1 era una tira que solo mostraba dos botones y medio, y la capa en curso solía quedar fuera); el texto de la capa inmediatamente después, siempre en el mismo sitio. Sin huecos verticales entre dibujo, leyenda y texto.
- **Tableta en vertical**: leyenda en cuatro columnas y textos más grandes. **Móvil en horizontal**: dos columnas compactas sin leyenda (es un atajo; el formulario tiene sus casillas). **Pantallas muy bajas** (320×568): versión compacta comprobada.
- **Movimiento reducido, sin JS o sin motor**: el plano completo, quieto, con las siete notas debajo; la leyenda sigue aislando capas (con JS).

### El vídeo en móvil

Diagnóstico: el original es 1280×720. A pantalla completa en un teléfono de 390×844 (DPR 3) solo se ve una franja de 333 px del ancho y cada píxel del original ocupa 3,5 píxeles de pantalla; en 360×640, 2,7. En escritorio 1440×900 es 1,25 (2,5 en pantallas Retina). La blandura del móvil es el límite de la fuente, no del CSS (no hay filtros ni escalados añadidos).

No se puede recuperar detalle que no existe, así que la variante vertical no lo intenta: es un **recorte de 480×720 del original a su resolución** (2:3, sin escalar) que contiene todo lo que el teléfono muestra. Lo que sí gana:

- **Encuadre dirigido**: el recorte sigue un recorrido de cámara leído fotograma a fotograma (el split y su caudal, la puerta de la sala técnica, la bomba de calor, un barrido hacia los grupos de bombeo y el cobre, los difusores del pasillo y los conductos), con transiciones suaves. Antes eran tres puntos focales fijos.
- **Peso**: 1,6 MB (VP9) / 2,0 MB (H.264) en vez de 3,8 / 5,1 MB; la portada en móvil pasa de ~4,2 MiB a ~2,0 MiB.
- **Búsquedas más rápidas** al recorrer el vídeo (un 37 % de los píxeles por fotograma), con el mismo GOP de 1/6 s.
- **Misma relación scroll–vídeo**: mismos fotogramas, misma duración, mismos tiempos de escena.

Se carga una sola versión: `film.js` decide antes de que el motor pida el clip (vertical si la ventana es más estrecha que 2:3, es decir, teléfonos en vertical incluso con las barras del navegador; completa en tableta, horizontal y escritorio) y el `<picture>` del póster usa la misma consulta, con su precarga condicionada. Si el teléfono gira después, no se descarga otro clip: la secuencia pasa a los fotogramas fijos a resolución completa mientras dure el giro.
