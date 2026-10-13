# Hero 2.0 · «De la precisión técnica a una instalación que funciona»

## Auditoría del hero 1.0 (antes de tocar nada)

| Elemento | Cómo funciona | Animación existente |
|---|---|---|
| Sección `.hero` | Acto `flow` del motor (`data-sc-act="flow"`), 100svh, sin pin | El motor publica `--sc-p` (0,5 al cargar → 1 al salir) |
| Retícula | `div` con gradientes CSS en `.plane--grid` | Parallax del motor (`data-sc-parallax="1.8"`) + puntero |
| Aire cálido/frío | Dos manchas difuminadas | Parallax 1.2 + puntero |
| Vivienda | SVG `house({ structureOnly: true })`: solo estructura, estática | Parallax 0.6 + puntero |
| Tubería y llave | SVG `heroPipe`: tres trazos (contorno, alma, brillo), uniones y llave | Parallax -2.4 + puntero |
| Puntero | `site.js`: un rAF con interpolación que escribe `--px/--py`; solo ratón y sin movimiento reducido; se pausa fuera de pantalla | Activa |
| Texto y CTA | HTML semántico, sin animación | Ninguna |
| Logotipo | Solo en la cabecera (WebP recortado de una captura; no existe vector) | Ninguna |

Conclusiones: no hay secuencia de entrada; la vivienda nunca se "dibuja"; la tubería no conecta con nada; el scroll solo desplaza planos en vertical; el paso a la sección siguiente es un corte limpio pero plano. El motor ya ofrece lo necesario (`--sc-p` del acto y `data-sc-parallax`): no hace falta otro sistema de scroll.

## Secuencia de entrada (1,82 s, solo CSS, sin bloquear nada)

El texto y los botones no esperan a la ilustración: corren en paralelo desde el primer fotograma.

| t (ms) | Fase | Qué ocurre | Por qué |
|---|---|---|---|
| 0 | — | CTA «Pedir presupuesto», teléfono y horario ya visibles y pulsables | Conversión: nada se retrasa |
| 0–640 | D (texto) | El titular es legible desde el primer fotograma: cada línea se asienta en su máscara desde un 20 % más abajo (3 líneas escalonadas 70 ms); la descripción sube 8 px y aparece (100–500) | Lectura inmediata; el movimiento acompaña, no tapa |
| 0–600 | A | La retícula se descubre de izquierda a derecha, como un plano que sale del trazador | Primer gesto: precisión |
| 100–750 | A | La estructura de la vivienda se traza (muros, forjados, cubierta, terreno); los macizos y el rayado aparecen después | Del plano en blanco a un edificio |
| 600–1100 | B | La tubería se dibuja desde el borde izquierdo hacia la casa; las uniones aparecen cuando el trazo pasa por ellas | Se ve cómo se conecta la instalación |
| 1000–1450 | B | Aparece el cuerpo de la llave y la palanca naranja gira 90°: de cerrada (perpendicular) a abierta (paralela al tubo) | Punto focal y gesto con sentido: se abre la llave |
| 1380–1820 | B | Con la llave abierta, el suelo radiante y su alimentación se trazan en naranja dentro de la casa y llega el calor (halo cálido) | «Una instalación que funciona» |
| 1250–1600 | C | Un cajetín de plano con el logotipo real se descubre en la esquina de la lámina, junto a la leyenda «Esquema ilustrativo» | Firma de marca integrada, sin intro aparte; además declara que el dibujo es ilustrativo |

Duraciones con `cubic-bezier(0.23, 1, 0.32, 1)` (ease-out). Nada rebota ni gira salvo la palanca, que es el gesto real de una llave de bola.

## Al hacer scroll (sin pin)

Se reutiliza el `--sc-p` que el motor publica en el acto `flow` del hero. Progreso de salida `q = clamp(0, (p − 0,5) × 2, 1)`.

| Plano | Al salir el hero | Velocidad relativa |
|---|---|---|
| Retícula | escala 1 → 1,06, opacidad 1 → 0,5 | más lenta (parallax 1.8) |
| Vivienda | escala 1 → 0,9 desde su apoyo en el terreno | lenta (0.6) |
| Tubería | escala 1 → 1,1, se acerca y sale antes | más rápida (−2.4) |
| Texto | 1× (no se mueve respecto a la página) | — |

Las capas se separan en profundidad (lo cercano crece, lo lejano se reduce). Un degradado al color del papel en el último tramo de la sección disuelve los planos en la siguiente lámina («¿Qué necesitas resolver?»), que comparte fondo: no hay corte ni pantalla bloqueada.

## Móvil

Texto y botones arriba (como hasta ahora); la escena debajo, recompuesta: vivienda centrada y la tubería desplazada para que la llave naranja quede entera dentro del encuadre. Misma secuencia, sin puntero. El cajetín se oculta en móvil: tapaba el tejado y el logotipo ya está en la cabecera. Sin degradado inferior (la escena es el final del hero). La altura de la escena no crece.

## Movimiento reducido, sin JavaScript y fallo del motor

- `prefers-reduced-motion: reduce`: ninguna animación de entrada ni de escala; se muestra el estado final completo (casa trazada, llave abierta, calor, cajetín).
- La entrada es CSS puro con estado final visible: sin JavaScript o si el motor no arranca, la portada termina igual de completa. Sin motor solo se pierde la profundidad al hacer scroll.

## Recursos

Solo los SVG existentes y el logotipo real. **Sin Higgsfield ni vídeo**: la ilustración vectorial permite controlar cada trazo, pesa menos de 10 KB y mantiene la estética técnica; un vídeo no aportaría nada que justifique su peso.

## Resultado y verificación (13/10/2026)

Archivos tocados: `src/pages.mjs` (marcado del hero), `src/house.mjs` y `src/pictos.mjs` (longitudes normalizadas para el trazado, palanca como grupo), `site/assets/css/site.css` (secuencia, profundidad por scroll, cajetín, móvil). El motor y `site.js` no cambian.

| Comprobación | Resultado |
|---|---|
| Titular y CTA desde el primer momento | Opacidad 1 en el primer pintado en 1440, 390 y 360 px; titular legible en t = 0 (captura congelada con la Web Animations API) |
| Pantalla en blanco o parpadeos | No: 10 instantes capturados entre 0 y 1800 ms en escritorio, 390 y 360 px |
| Logotipo | Proporción renderizada = proporción del archivo (1,578); densidad 1,6× en pantallas 2× |
| Solapes texto/ilustración | Ninguno en 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768, 390×844 y 360×640 |
| Scroll | No se bloquea; sin pin; capas a escalas distintas al salir; el arnés no detecta scroll muerto |
| Longitud móvil | Igual que antes (15,9 vh en 390×844; 18,4 vh en 360×640) |
| Sin motor / sin JS | Todo visible (0 elementos con opacidad < 1), sin errores |
| Movimiento reducido | 0 animaciones; estado final completo en escritorio y móvil |
| Consola | Sin errores ni avisos con la CSP activa |
| Arnés Scroll-craft | 5 pasadas limpias (escritorio 24/acto, 390, 360, reducido escritorio y móvil) |
| Suite funcional | 278/278 (formulario, enlaces, eventos, teclado, SEO) |
| Lighthouse móvil / escritorio | 95/100/100/100, LCP 2,7 s, CLS 0, TBT 0 ms / rendimiento 100, LCP 0,6 s |
| Puntero | Los 4 planos siguen respondiendo |

Corregido durante la verificación: el titular empezaba totalmente oculto en t = 0 (ahora visible y solo se asienta); en móvil el cajetín tapaba el tejado y la llave quedaba cortada.

Sin verificar: dispositivos físicos (iOS/Android), Firefox y Safari. Las capturas están en `docs/capturas/hero2-*.webp` y el script de fotogramas en `qa/intro.mjs`.
