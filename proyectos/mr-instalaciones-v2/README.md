# MRI V2 · rediseño cinematográfico

Segunda versión de la web de MRI (Martínez Rojas Instalaciones). La portada abre con una **secuencia de vídeo controlada por el scroll**: el vídeo ocupa toda la pantalla desde el primer instante, con el titular superpuesto («El confort empieza donde no lo ves.»), y al bajar el hero se retira mientras tres bloques de texto real acompañan a cada sistema: climatización en el salón, aerotermia y fontanería en la sala técnica y ventilación en el falso techo.

**V2.1 (23/10/2026)**: hero a pantalla completa (sin la ventana enmarcada sobre papel de la V2.0), titular en Instrument Serif, cabecera superpuesta a la imagen, un único clip de máxima calidad para todos los dispositivos y contraste local medido. La V2.0 queda recuperable en el commit `68baba7` (`git show 68baba7:<ruta>` o `git checkout 68baba7 -- proyectos/mr-instalaciones-v2`).

**V2.2 (23/10/2026)**: vuelve a la portada el **plano técnico** de la V1 (la casa en sección que se dibuja capa a capa con el scroll, con su leyenda que aísla sistemas y los marca en el formulario), recuperado de su código y recompuesto para escritorio, tableta y móvil; el vídeo tiene una **versión vertical para móvil** (recorte del original que sigue un recorrido de cámara) y los sectores pasan a una rejilla sin fijar. La V2.1 queda en `a56f39d`.

**La V1 no se ha tocado.** Vive en `proyectos/mr-instalaciones/` y sigue funcionando igual. La V2 lee de ella el contenido, las plantillas de las páginas interiores y los archivos estáticos; lo propio de la V2 está en esta carpeta.

> **El vídeo.** `assets-src/video/mri-original.mp4` es el vídeo del cliente, sin modificar (1280×720, 24 fps, 10 s, un único fotograma clave y pista de audio). Lo que se publica es su versión codificada para scrub en `site/assets/film/`. Tiempos y lectura del plano en `src/film.mjs` y `docs/DIRECCION.md`.

## Ejecutar y comparar con la V1

Desde la raíz del repositorio:

```bash
npm run build:mri2                 # genera site/ (también: node proyectos/mr-instalaciones-v2/src/build.mjs)
npm run serve:mri                  # V1 en http://127.0.0.1:4500
npm run serve:mri2                 # V2 en http://127.0.0.1:4510
```

Las dos se sirven con el mismo router y la misma CSP. Las capturas comparativas están en `docs/capturas/` (`comparativa-v1-v2-escritorio.webp`, `comparativa-v1-v2-movil.webp`).

**Revertir**: la V2 es una carpeta independiente. Borrarla (o no publicarla) deja la V1 exactamente como estaba. El único archivo compartido modificado es `tools/dev/router.php` (servidor local), con dos añadidos que no cambian el comportamiento de la V1: tipos MIME de `.mp4`, `.webm` y `.json` y `media-src 'self' blob:` en la CSP local.

## Cambiar el vídeo

```bash
node proyectos/mr-instalaciones-v2/tools/video/prepare.mjs /ruta/al/video.mp4 --inspect   # solo inspección
node proyectos/mr-instalaciones-v2/tools/video/prepare.mjs /ruta/al/video.mp4             # inspección + codificación
```

1. **Inspección** (no modifica el original): formato, duración, resolución, fps, tamaño, intervalo real entre fotogramas clave, cortes de escena detectados y una hoja de contactos con tiempos en `assets-src/video/`. Con ella se deciden tiempos, encuadres y lado del texto.
2. **Codificación para scrub**, un único archivo para todos los dispositivos, a la resolución de origen (nunca ampliada; si llega un original de 1080p se usa tal cual): H.264 High CRF 17 `veryslow` con un fotograma clave cada 1/6 s, más VP9 CRF 26 equivalente para navegadores sin H.264. Mismas etiquetas de color que el original, sin filtros, sin audio, `faststart`. Mide la fidelidad (SSIM fotograma a fotograma) frente al original.
3. **Póster** (primer fotograma) y un **fotograma fijo por escena** (`still` en `film.mjs`) en WebP calidad 90 a resolución completa, sacados del original.
4. `site/assets/film/film.json` con la duración real, los datos del original y el SSIM de cada versión.
5. **Versión vertical para móvil** (`film-v.mp4`, `film-v.webm`, `poster-v.webp`): recorte de 480×720 del original, sin escalar, cuyo centro sigue `FILM.portrait.path` en `src/film.mjs` (segundos del clip → píxel del original). Hoja de contactos del recorrido en `assets-src/video/recorte-movil.jpg`. Solo esta parte: `prepare.mjs <clip> --portrait`. `film.js` elige una sola versión antes de que el motor descargue nada (vertical si la ventana es más estrecha que 2:3, completa si no); el `<picture>` del póster usa la misma consulta.

Después, editar **`src/film.mjs`**: tiempos de cada escena en segundos del clip (`t0`, `t1`), punto focal para móvil (`focal`), lado del texto en escritorio (`side`) y fotograma fijo (`still`). Ejecutar `npm run build:mri2`. Los tiempos se convierten solos en ventanas de scroll: una escena nunca aparece fuera de su tramo de vídeo.

Si se cambia `span` en `film.mjs`, cambiar también `--film-span` en `site/assets/css/site.css` (el build avisa si no coinciden).

## Qué hay aquí

```
src/film.mjs              La secuencia: escenas, textos, tiempos, encuadres. Lo único que se toca al cambiar de clip
src/pages.mjs             Portada de la V2 (secuencia de vídeo, plano técnico recuperado de la V1, resto de secciones)
src/build.mjs             Genera site/: portada V2 + páginas interiores con las plantillas de la V1
site/assets/css/site.css  Sistema visual de la V2 (también estiliza las páginas interiores)
site/assets/js/film.js    Carril de escenas, cabecera, encuadre móvil, teclado, degradación
site/assets/film/         Clip codificado (mp4 + webm), versión vertical para móvil, pósters y fotogramas fijos
tools/video/prepare.mjs   Inspección y codificación del vídeo
assets-src/video/         Vídeo original del cliente, hoja de contactos e informe de inspección
qa/film.mjs               Capturas de la secuencia y del resto de la home + informe
qa/functional.mjs         Suite funcional (la de la V1 adaptada a la secuencia)
qa/hero-contrast.mjs      Contraste del hero y la cabecera sobre el fotograma real (texto 4,5:1; gráficos 3:1)
docs/DIRECCION.md         Dirección artística, referencias del ZIP y decisiones
docs/VERIFICACION.md      Pruebas ejecutadas, resultados y límites
docs/capturas/            Capturas reales de V1 y V2
```

Instrument Serif (OFL, `@fontsource/instrument-serif`) es propia de la V2 (`site/assets/fonts/`, con su licencia). Los archivos copiados de la V1 al construir (fuentes Geist, marca, motor de Scroll-craft sin modificar, `site.js`, `contacto.php`) no se editan aquí: se editan en la V1 y se vuelve a construir.

## Vista previa en un solo archivo

```bash
npm run preview:mri2    # -> proyectos/mr-instalaciones-v2/preview/mri-v2-portada-preview.html (~13 MB)
```

La portada completa en un HTML autónomo (CSS, JS, fuentes, imágenes y clips dentro) que se abre con doble clic, sin servidor. El formulario está en modo demostración: valida, pero no envía. Los enlaces a otras páginas se quedan en la portada. Es para revisión interna: no se versiona (`preview/` está en `.gitignore`).

## QA

```bash
npm run qa:mri2                    # suite funcional (286 comprobaciones)
npm run qa:mri2:film               # capturas de la secuencia (añadir --w 390 --h 844 --mobile, --reduced, --novideo, --nojs)
node proyectos/mr-instalaciones-v2/qa/hero-contrast.mjs http://127.0.0.1:4512 [--w 390 --h 844 --mobile]
                                   # contraste del hero; necesita un servidor sin CSP: MRI_NO_CSP=1 php -S 127.0.0.1:4512 tools/dev/router.php
```

El envío real del formulario en local necesita un `sendmail` falso que acepte argumentos, por ejemplo un script que haga `cat >> /tmp/outbox.eml`, y `php -d sendmail_path=/ruta/al/script -S ...`.
