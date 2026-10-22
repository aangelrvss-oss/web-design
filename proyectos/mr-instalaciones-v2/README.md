# MRI V2 · rediseño cinematográfico

Segunda versión de la web de MRI (Martínez Rojas Instalaciones). La portada abre con una **secuencia de vídeo controlada por el scroll**: el titular ocupa el papel, el vídeo asoma por una ventana enmarcada y, al bajar, la ventana se abre a sangre mientras tres bloques de texto real acompañan a cada sistema (climatización, aerotermia y calefacción, ventilación y fontanería).

**La V1 no se ha tocado.** Vive en `proyectos/mr-instalaciones/` y sigue funcionando igual. La V2 lee de ella el contenido, las plantillas de las páginas interiores y los archivos estáticos; lo propio de la V2 está en esta carpeta.

> **Vídeo pendiente.** El vídeo cinematográfico no estaba en el entorno de trabajo. La secuencia usa una **animática provisional** (un recorrido de cámara por el dibujo técnico de la V1 con las mismas cuatro estaciones) para poder verificar el scrub, la sincronización y el móvil. Se identifica en pantalla con la etiqueta «Animática provisional». Sustituirla es un solo comando: ver [Cambiar el vídeo](#cambiar-el-vídeo).

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
2. **Codificación para scrub**: H.264 1080p (GOP 8) y 720p (GOP 4) con el `encode.sh` de Scroll-craft, más VP9 equivalentes para navegadores sin H.264. Sin audio, `faststart`.
3. **Póster** (primer fotograma) y un **fotograma fijo por escena** en WebP.
4. `site/assets/film/film.json` con la duración real.

Después, editar **`src/film.mjs`**: tiempos de cada escena en segundos del clip (`t0`, `t1`), punto focal para móvil (`focal`), lado del texto en escritorio (`side`) y `provisional: false`. Ejecutar `npm run build:mri2`. Los tiempos se convierten solos en ventanas de scroll: una escena nunca aparece fuera de su tramo de vídeo.

Si se cambia `span` en `film.mjs`, cambiar también `--film-span` en `site/assets/css/site.css` (el build avisa si no coinciden).

## Qué hay aquí

```
src/film.mjs              La secuencia: escenas, textos, tiempos, encuadres. Lo único que se toca al cambiar de clip
src/pages.mjs             Portada de la V2
src/build.mjs             Genera site/: portada V2 + páginas interiores con las plantillas de la V1
site/assets/css/site.css  Sistema visual de la V2 (también estiliza las páginas interiores)
site/assets/js/film.js    Carril de escenas, cabecera, encuadre móvil, teclado, degradación
site/assets/film/         Clip codificado (mp4 + webm, escritorio y móvil), póster y fotogramas fijos
tools/video/prepare.mjs   Inspección y codificación del vídeo
tools/video/animatica.mjs Genera la animática provisional
qa/film.mjs               Capturas de la secuencia y del resto de la home + informe
qa/functional.mjs         Suite funcional (la de la V1 adaptada a la secuencia)
docs/DIRECCION.md         Dirección artística, referencias del ZIP y decisiones
docs/VERIFICACION.md      Pruebas ejecutadas, resultados y límites
docs/capturas/            Capturas reales de V1 y V2
```

Los archivos copiados de la V1 al construir (fuentes Geist, marca, motor de Scroll-craft sin modificar, `site.js`, `contacto.php`) no se editan aquí: se editan en la V1 y se vuelve a construir.

## QA

```bash
npm run qa:mri2                    # suite funcional (279 comprobaciones)
npm run qa:mri2:film               # capturas de la secuencia (añadir --w 390 --h 844 --mobile, --reduced, --novideo, --nojs)
```

El envío real del formulario en local necesita un `sendmail` falso que acepte argumentos, por ejemplo un script que haga `cat >> /tmp/outbox.eml`, y `php -d sendmail_path=/ruta/al/script -S ...`.
