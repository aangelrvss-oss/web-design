# MRI V2 · dirección artística

## 1. Auditoría del repositorio «proyectos-web»

Se extrajo el ZIP fuera del proyecto (carpeta temporal de trabajo, no versionada) y se renderizaron con Playwright los **66 `index.html`** que contiene, en escritorio y, para los candidatos, en móvil y con su interacción (hover, scroll).

**Valoración honesta**: es una colección de componentes de aprendizaje (R3LI4NT/proyectos-web: menús, logins, tarjetas, sliders, footers…). Ningún proyecto tiene calidad de estudio premium: tipografías de Google Fonts genéricas (Poppins, Roboto, Oswald, Bebas Neue), posicionamiento absoluto con valores mágicos, glassmorphism, gradientes y neones decorativos. No se ha tomado ningún proyecto como plantilla. Se han extraído **principios** concretos de tres, y uno más para el pie:

| Referencia | Archivo observado | Qué interesa | Cómo se adapta a MRI | Qué no se copia |
|---|---|---|---|---|
| **Efecto Parallax** (principal, hero) | `Efecto Parallax/index.html`, `style.css` (`.parallax { height: 100vh; background-attachment: fixed }`, `h2` en banda de lado a lado) | La imagen es un espacio que se mira **a través de una ventana**: la ventana se mueve, la imagen no. Y el texto es una **banda horizontal** que cruza la imagen en lugar de una caja que la tapa. | El vídeo asoma en una ventana enmarcada bajo el titular y la ventana se abre a sangre con el scroll (`clip-path` desde `--sc-p`). Los textos de escena forman una banda baja con un velo local, dejando libre el centro del encuadre, donde están los equipos. | `background-attachment: fixed` (roto en iOS), la caja blanca con borde de 2 px, Poppins, «SECTION 1». |
| **Sliders/1-** (principal, navegación de la secuencia) | `Sliders/1-/style.css` (`.img-section { flex: 1 }` → `:hover { flex-grow: 10 }`) | Una tira de escenas en la que **la activa gana anchura y las demás ceden**. | El carril de escenas bajo la imagen: tres tramos (Climatización · Aerotermia y calefacción · Ventilación y fontanería); el activo crece (`flex-grow 1 → 2,6`) y su barra se llena con el avance del clip. Es navegación real: cada tramo salta a su escena. | El `skew(7deg)`, el `border-radius: 20px`, las fotos de animales, el hover como único disparador. |
| **Acordeon** (secundaria, tipografía y FAQ) | `Acordeon/index.html`, `style.css` (Bebas Neue condensada para el titular + Poppins 300 para el cuerpo; filas desplegables) | El contraste entre un **titular condensado** y un cuerpo ligero, y la lista de preguntas como filas que se despliegan. | Archivo condensada (eje `wdth` 68–84 %) para titulares, Geist para el texto. Preguntas frecuentes con `<details>` nativo, filas a línea fina y un «+» que gira. | Tarjetas oscuras con sombra, el truco del checkbox (inaccesible), texto justificado con guiones. |
| **Footer Designs/2-** (menor, pie) | `Footer Designs/2-/index.html`, `style.css` (`.logo` + `.line` corta de color + columnas) | La **regla corta de color** como firma bajo el logotipo, columnas por grupo. | Regla naranja de 44 × 3 px bajo el logotipo en el pie de grafito. | Posiciones absolutas, iconos sociales vacíos, el campo de newsletter. |

Descartados con motivo: menús (genéricos o con jQuery/Bootstrap), logins (no hay login), tarjetas (justo lo que el encargo pide evitar: tarjetas repetidas, 3D, RGB), galería y lightbox (no hay fotos reales), barras de skills (cifras inventadas), panel admin y sistema de ventas (otra categoría de producto).

## 2. Sistema

**Paleta.** Papel cálido `#EFECE6` y `#E5E1D9`, tinta `#141617`, grafito `#121516`, naranja de marca `#FF6500` solo donde actúa: acción principal, sistema activo en el carril, reglas cortas de marca, foco. Texto naranja sobre papel en `#A6420A` para cumplir contraste. Ni web oscura por defecto ni crema artesanal: el vídeo vive en grafito y el contenido comercial en papel, alternando (papel → papel tostado → grafito → papel → grafito).

**Tipografía.**

| Rol | Fuente | Ajustes |
|---|---|---|
| Titular de portada | Archivo, `wdth` 68 %, 600 | `min(7,1vw, 11,5svh)`, interlineado 0,86, tracking −0,022 em, `text-wrap: balance`, dos líneas en 8 de 12 columnas |
| Titulares de sección | Archivo, `wdth` 72 %, 600 | 2,4–4,8 rem, interlineado 0,94, medida 8–13 ch |
| Titulares de escena | Archivo, `wdth` 70 %, 600 | 1,9–3,15 rem, máx. 17 ch (2–3 líneas) |
| Filas (necesidades, FAQ) | Archivo, `wdth` 84–86 %, 500 | 1,15–1,95 rem: más ancha para leerse como frase |
| Texto | Geist 400 | 1,0625 rem, 1,45–1,6, medida 34–44 ch |
| Metadatos, etiquetas, teléfono | Geist Mono 500 | 0,66–0,76 rem, mayúsculas, tracking 0,08–0,1 em |

La V1 traía Archivo solo en anchuras expandidas (102–110 %). La V2 usa un recorte propio del Archivo variable (`archivo-cond.woff2`, 46 KB: latín con español, `wght` 400–700, `wdth` 62–100) generado con fontTools a partir de @fontsource-variable/archivo (OFL).

## 3. La portada

**Primer viewport (escritorio).** Rejilla de 12 columnas. Arriba la barra (logotipo, menú, teléfono en mono, «Pedir presupuesto»). El titular ocupa ocho columnas en dos líneas, con una etiqueta mono de servicios encima y una regla naranja. A la derecha, alineados a la base del titular, la frase de valor real y los dos CTA (presupuesto y llamada). Debajo, a partir del borde medido del bloque de texto (`--wt`, film.js), la ventana con el vídeo enmarcada por el margen. El fotograma se desplaza dentro de la ventana para que se vea su centro (el equipo), no el suelo.

**Apertura.** Con el primer 13 % del tramo fijado la ventana se abre a sangre (smoothstep), el titular se aparta antes de que la ventana llegue a él y el fondo pasa de papel a grafito. La barra cambia a tinta clara con un velo propio en cuanto el borde de la ventana la alcanza.

**Escenas.** Tres bloques sincronizados con los tiempos del clip (no con el scroll): kicker mono con regla naranja, titular condensado, una frase con información real y el enlace al servicio. Van abajo, al lado contrario del equipo (`side`), sobre un velo local; el centro del encuadre queda libre. El carril de escenas cierra la composición.

**Móvil y tableta vertical.** No se encoge la composición de escritorio: el vídeo ocupa el 56 % superior del escenario y el texto vive debajo, sobre grafito, sin superponerse a la imagen. La ventana entra desde abajo y sube a su sitio; el 16:9 se recorta siguiendo el punto focal de cada escena, interpolado en los cambios. En el carril solo se rotula la escena activa.

**Final.** La última escena no se apaga: sale con el escenario mientras el clip termina, y la página continúa con «¿Qué necesitas resolver?», que retoma la idea del recorrido («Una sola empresa para que todo encaje»).

## 4. Scroll y vídeo

- Motor: **Scroll-craft sin modificar** (hash idéntico al de la V1 y al del ZIP `scroll-craft-main`). Acto `scrub` de 4,8 alturas: el motor fija el escenario, descarga el clip como Blob (búsqueda sin peticiones por rangos), lo recorre con cabezal suavizado (lerp, zona muerta y coalescencia de búsquedas) y mantiene el póster hasta que hay un fotograma pintado. No se añadió GSAP: duplicaría lo que el motor ya hace.
- El clip se reparte por toda la vida visible del escenario (comportamiento por defecto del motor): no se congela al entrar ni al salir. Los textos se calculan con esa misma correspondencia: `progreso = (t / duración) · span / (span − 1)`.
- Codificación para scrub (GOP 8 en 1080p, GOP 4 en 720p). El original de la animática tenía un fotograma clave cada 3,8 s; codificado, cada 0,32 s.
- H.264 por defecto; VP9 para navegadores sin H.264 (film.js elige antes de que el motor pida el clip).
- Degradación: con **movimiento reducido** o **sin motor/JS**, la secuencia es una página estática (titular y tres fotogramas fijos con su texto); si el **clip no llega** en 9 s, se encadenan los fotogramas fijos de cada escena con el mismo scroll; mientras carga, el póster.

## 5. Lo que se ha conservado y lo que no

Se conservan íntegros los contenidos comerciales de la V1: necesidades → servicios, habilitaciones con sus registros, sectores, preguntas frecuentes, contacto y formulario (mismo `contacto.php`, misma validación). No se ha inventado ninguna cifra, certificación, garantía ni reseña (la V1 no tenía reseñas publicadas y la V2 tampoco).

Se retira de la portada el pico de la V1 (la casa que se dibuja por capas con la leyenda): dos picos competirían, y el encargo pone el vídeo como protagonista. Su función de conversión se mantiene de otra forma: cada escena enlaza a su servicio y cada servicio preselecciona su casilla en el formulario. El dibujo de la V1 sigue en las páginas de servicio.
