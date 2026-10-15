# Auditoría crítica de la versión 1 · Pro Reforma

Fecha: 15 de octubre de 2026. Versión revisada: commit `57c3867` (etiqueta local `pro-reforma-v1-antes-revision`). Revisión **renderizada** con Chromium (Playwright): recorrido de la portada a 1440×900 y 390×844 con capturas cada 0,9 pantallas, arnés de Scroll-craft y contraste de datos con la ficha de Google y la web actual de la empresa (Firecrawl).

## Veredicto

La v1 es correcta técnicamente (QA 519/519, Lighthouse alto) pero **no convence como web comercial**: se lee como un documento largo y ordenado, no como una experiencia que lleve a pedir presupuesto. Los tres puntos que el cliente más necesita (qué hacen y dónde, por qué fiarse, cómo pedir presupuesto) están, pero con poca fuerza visual y demasiado texto.

## Problemas detectados

### Primera impresión y hero
1. **Sin imagen protagonista.** Collage de tres fotos pequeñas (392 px) con pies de foto encima: parece un álbum. Las fotos son grisáceas y de baja resolución, y a ese tamaño no transmiten oficio.
2. **En móvil no hay ninguna foto encima del pliegue**: titular de 6 líneas, párrafo largo, dos botones y la insignia de Google tapada por el botón flotante de WhatsApp.
3. **Titular abstracto**: «Reformas bien hechas, con la casa protegida y los acabados cuidados» no dice qué servicios ni dónde; la localidad queda en una etiqueta pequeña que en móvil se parte en dos líneas.
4. **CTA secundario débil**: «Ver proyectos» compite con el presupuesto y no es lo que más ayuda (llamar sí).

### Reseñas (la prueba social más importante)
5. **Etiqueta falsa**: «Opiniones verificadas». Google indica en la propia ficha: «Google no verifica las reseñas». Hay que retirarla.
6. **No se habían cotejado con la ficha** (lo decía `RESENAS.md`): eran fragmentos del widget de su web.
7. **Fragmentos recortados** sin indicarlo (por ejemplo, la reseña de Alberto López empieza en «Le pedimos…» cuando el original empieza en «¡Lo recomiendo sin duda!»), cursiva pequeña y pies con paráfrasis del trabajo («Trabajo en la zona de la caldera…») que no son texto del cliente.
8. **Sin fecha ni antigüedad**, sin indicar de dónde sale cada reseña y con temas («Acabados», «Protección y limpieza») redactados por nosotros que parecen datos.
9. **Visualmente es una lista de párrafos**: no hay un momento de prueba social; en móvil son seis pantallas de texto.
10. **Carga en vivo**: en la web real `loadLive()` sí llama a `/api/resenas.php`; el `return` inmediato que aparece en la **vista previa** lo añade a propósito el empaquetador (`tools/preview/bundle.mjs`), porque un archivo suelto no tiene servidor. Sin credenciales, la API responde `{"available":false}` y se queda el bloque fechado. **Pero** la solución depende de PHP: la web actual está en Duda (no ejecuta código propio) y la demo se entrega para Netlify, que tampoco ejecuta PHP. En esos alojamientos ni el formulario ni las reseñas en vivo funcionarían.
11. **Sin control de coste**: cada visita a la sección consultaría la API de pago sin ningún límite.
12. **Datos que caducan**: la valoración y el número están fechados, pero nada avisa cuando esa fecha queda lejos.

### Orden y ritmo de la portada
13. **13.180 px de alto en móvil (unas 15,5 pantallas) y 10.423 en escritorio**, con 9 secciones de peso parecido: reseñas, servicios, fases, método (6 pasos), más proyectos, empresa, 6 preguntas y formulario. Mucho texto seguido.
14. **No hay diferenciadores** expresados como tales ni una franja de confianza bajo el hero.
15. **Servicios** como filas de texto con miniaturas de 9 rem: poco reconocibles.
16. **«Más trabajos» y «Pro Reforma»** son secciones de relleno: repiten lo dicho.

### Scroll-craft
17. **Una sola animación con intención** (la obra fase a fase). El resto: aparición escalonada (`in`) repetida, un parallax de 12–35 px imperceptible y barridos en cuatro fotos pequeñas. No hay transiciones entre secciones ni preparación del momento de las reseñas, y el cierre no se siente como conclusión.
18. Los fondos alternan crema y blanco casi iguales: la página no cambia de ritmo.

### Conversión y contacto
19. **Mismo texto en todos los botones** («Pedir presupuesto» en cabecera, hero, reseñas, servicios…).
20. **Formulario con 7 bloques** (tipo, nombre, localidad, teléfono, correo, mensaje, vía de contacto): más fricción de la necesaria.
21. **WhatsApp flotante** tapa contenido en móvil (insignia del hero, textos) y no ofrece llamar.
22. Horario de atención no publicado, aunque está en la ficha (L–V 9:00–19:00).

### Lo que estaba bien y se conserva
- Datos verificados, URLs de la web actual, formulario real con PHP, sin cookies ni terceros, accesibilidad de base (teclado, foco, sin JS), el acto de las fases como prueba real de trabajo, la arquitectura de generador estático.

## Material nuevo verificado (15/10/2026)

| Dato | Fuente |
|---|---|
| 5,0 · 41 reseñas; «Google no verifica las reseñas» | Ficha de Google Maps |
| Horario: lunes a viernes 9:00–19:00; sábado y domingo cerrado | Ficha de Google Maps |
| Temas que Google detecta en las reseñas: confianza (10), equipo (8), materiales (5), perfeccionista (3), expectativas (3), insonorización (2), humedades (2)… | Ficha de Google Maps |
| Tres frases que Google destaca en el resumen («Rápidos, buenos y muy limpios trabajando, muy profesionales.», «Muy buenos acabados y al terminar te dejan la casa impecable.», «Además, han sido puntuales, educados y han explicado todo lo que iban haciendo.») | Ficha de Google Maps |
| Tres reseñas recientes (Adrian, Nicki1309 S, sweetie001, «hace 6 meses»), recortadas por Google con «Más» | Ficha de Google Maps |
| Texto **completo** de las reseñas de Alberto López, Alicia P. y Jorge García; Ana Maria Coarda y Biviana recortadas («Read more»); todas «8 months ago» | Widget de reseñas de Google en proreforma.es |
| Pro Reforma responde a las reseñas («Respuesta del propietario») | Ficha de Google Maps |
| 8 bandas panorámicas nítidas de 1798×410 px de las fotos de obra | Captura de proreforma.es/proyectos a 7680 px (el CDN sigue bloqueado; las fotos completas no superan 890 px) |

No se ha podido leer la puntuación individual de cada reseña (el texto de la ficha no la expone sin JavaScript de Google). Con una media de 5,0 redondeada, **no se puede afirmar** que todas sean de 5 estrellas: la v1 lo daba a entender en `RESENAS.md` y se corrige.

## Dirección elegida

Ver `INFORME-REDISENO-2.md`.
