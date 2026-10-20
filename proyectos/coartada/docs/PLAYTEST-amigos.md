# Coartada: primera prueba con amigos

Guía práctica para una tarde de prueba: primero el juego normal y, solo después, la variante experimental «Prueba falsificable». No es una prueba técnica: se juega de verdad y se anota poco, pero bien.

- El montaje técnico detallado (portátil, Wi-Fi, IP, cortafuegos) está en [`playtest-v1.1.md`](playtest-v1.1.md), apartado E. Las reglas de la variante, en [`PRUEBA-FALSA.md`](PRUEBA-FALSA.md).
- Este documento **no contiene resultados**: sirve para recogerlos. No inventes datos ni rellenes huecos de memoria al día siguiente.
- **Lo que aún no está comprobado:** todo se ha probado con Chromium emulando móviles, no en un Android ni un iPhone físicos. La vibración solo se ha comprobado de forma simulada. Esta sesión es también la primera prueba en móviles reales.

---

## 1. Antes de reunir al grupo (20 min, el día antes o una hora antes)

- [ ] **Multijugador (lo principal):** en un portátil conectado a la Wi-Fi de casa, `npm install && npm run build && npm start` (los pasos, en el README, «Jugar esta noche con amigos»). Crea la sala **desde el móvil**, abriendo `http://IP-DEL-PORTÁTIL:3000` (nunca `localhost`: el QR usa esa dirección). Comprueba que **dos móviles distintos** entran en la misma sala con el QR o el código de 4 letras. El botón «Compartir enlace» no funciona por HTTP: usad el QR o el código.
- [ ] **Respaldo sin red:** el archivo `dist/coartada-un-movil.html` (se genera con `npm run build:demo`) copiado a un móvil; se abre con Chrome, sin internet. Úsalo solo si falla la red o alguien no tiene móvil. Si se usa, anótalo en la hoja: no es la misma experiencia.
- [ ] Que cada persona juegue **siempre en el mismo navegador** y mejor no en incógnito: el navegador recuerda la sesión para volver a la misma plaza tras recargar o perder la conexión. Si alguien cierra la ventana de incógnito o abre el enlace en otro navegador, al volver con el código tendrá una plaza nueva que solo mira hasta la ronda siguiente.
- [ ] Móviles con batería (más del 50 %) y brillo alto. El sonido de la app viene apagado; la vibración, encendida (se apaga en el menú).
- [ ] Decide quién **facilita**: crea la sala y lee el guion. Mejor si no juega; si juega, anótalo, porque conoce el juego.
- [ ] Si hay una segunda persona, que **observe**: no juega, no opina, rellena la hoja.
- [ ] Abre la plantilla del apartado 8 en las notas de tu móvil (copiar y pegar). No hace falta nada más.
- [ ] Nada de grabar audio ni vídeo salvo que todo el mundo acepte antes y sepa para qué.

## 2. Cómo explicar el juego sin condicionar las deducciones

Lee esto tal cual (menos de un minuto):

> «Es un juego de deducción para móvil. Alguien de la mesa ha hecho algo absurdo y miente sobre dónde estaba; el resto tiene que descubrirlo hablando. El móvil os dirá en secreto quién sois y qué recordáis. Seguid lo que pida la pantalla; si algo no se entiende, es culpa del juego, no vuestra. El botón “?” abre una guía rápida. Yo casi no voy a ayudar, y si pregunto algo al final es para mejorar el juego.»

**No digas:**
- qué papeles hay ni cuántos culpables;
- cómo se gana, cómo funcionan los testimonios, la defensa o las pruebas;
- ninguna estrategia («fijaos en…», «lo mejor es…»).

Si alguien pregunta una regla: «¿Qué dice la pantalla, o el “?”». Si alguien no sabe **dónde tocar** y la mesa no le ayuda en unos 20 segundos, señala la zona sin explicar la regla, y anótalo como ayuda.

## 3. Configuración y secuencia

| Bloque | Qué | Ajustes en la sala | Rondas | Para qué |
|---|---|---|---|---|
| 1 | Juego normal | Ritmo **normal**, **3 rondas**, objetivos secretos **apagados**, Prueba falsificable **apagada** | 3 | ¿Se entiende sin ayuda? ¿Hay bloqueos? ¿Se sabe por qué se gana o se pierde? |
| Pausa | 5 min | — | — | Preguntas del apartado 5 |
| 2 (si hay ganas) | Juego normal otra vez | Igual; objetivos secretos solo si el grupo lo pide | 2–3 | ¿Cambia la forma de jugar al conocerlo? |
| 3 (otro día o con energía) | Variante | Prueba falsificable **encendida**, oportunidad **100 %** | 3 | ¿Se entiende «revisar una prueba»? ¿Aporta tensión o solo confusión? |
| 4 (sesiones futuras) | Comparar 50 % y 25 % | Una condición por bloque, anotada en cada ronda | ≥3 por condición y sesión | Solo para acumular datos (ver aviso) |

- **5–7 personas** es el tamaño principal. Con 6 o más aparece la persona cómplice.
- La **primera ronda** es de aprendizaje: anótala, pero no saques conclusiones de equilibrio de ella.
- **No mezcles** en el mismo bloque juego normal y variante, ni dos probabilidades distintas.
- **Antes de pasar al bloque 3**, el juego normal tiene que haberse entendido. Si el bloque 1 tuvo bloqueos (apartado 7), arregla eso primero: probar la variante sobre un juego que no se entiende no dice nada.

**Aviso sobre comparar probabilidades (100/50/25 %).** Unas pocas rondas no bastan. Con 10 rondas por condición, un porcentaje como «la culpable se libra el 50 % de las veces» tiene un margen de error de unos ±30 puntos; con 30 rondas, de unos ±18. En una tarde da para impresiones («con 25 % nadie se acordaba de la variante»), no para cifras. Anota la condición en cada ronda y junta datos de varias sesiones antes de decidir.

## 4. Qué observar sin interrumpir

Anota **hechos** (lo que se dice y se hace, y en qué pantalla), no interpretaciones. Las frases textuales valen oro.

- **Atascos:** alguien mira la pantalla sin saber qué hacer, o pregunta «¿y ahora qué?». Anota la pantalla.
- **Tiempos muertos:** gente esperando sin nada que hacer más de un minuto (¿quién falta por sellar o votar?).
- **Confusiones de regla:** lo que alguien cree que puede o no puede hacer, cuando no coincide con el juego.
- **Desacuerdos sobre justicia:** «eso no es justo», «¿por qué he perdido?», «no tenía forma de saberlo».
- **Momentos buenos:** risas, acusaciones, giros. También son datos.
- **Uso de herramientas:** ¿abre alguien el «?», el cuaderno («Cuaderno» o «Mi cuaderno»)? ¿Quién testifica?
- **Con la variante:** ¿se discute qué prueba revisar? ¿Se entiende el resultado («era falsa / era auténtica»)? ¿Alguien deduce algo de él?
- **Privacidad:** si alguien ve sin querer el papel de otra persona en la pantalla, anótalo como **incidencia grave**. Si alguien enseña su móvil a propósito, es parte del juego social: no lo es.

## 5. Preguntas después de cada partida (5 min, en voz alta)

1. ¿Hubo algún momento en que no sabíais qué hacer? ¿En qué pantalla?
2. ¿Sabéis por qué ganó quien ganó? (Que lo explique alguien que perdió.)
3. ¿Hubo algo que os pareciera injusto o imposible de deducir?
4. ¿Qué parte os gustó más y cuál sobró o se hizo larga?
5. Solo con la variante: ¿qué os dijo el resultado de la revisión? ¿Os cambió el voto?

Pide respuestas concretas («en la votación, cuando…»), no notas del 1 al 10.

## 6. Cómo registrar lo que pasa

Cada incidencia en una línea, con una de estas etiquetas:

| Etiqueta | Qué es | Ejemplo |
|---|---|---|
| **T** técnico | Algo falla: se cuelga, no conecta, no responde, se ve mal | «T · Bea · votación · el botón no respondía, recargó» |
| **I** interfaz | Se sabe qué hacer pero no cómo, o se entiende mal un texto | «I · Ciro · investigación · no encontraba cómo testificar» |
| **R** regla o diseño | Se entiende y funciona, pero el juego no funciona bien así | «R · todos · veredicto · “es imposible saber quién fue con 4”» |
| **E** espera | Tiempo muerto de más de un minuto | «E · declaración · 2 min esperando a una persona» |
| **P** privacidad | Información secreta vista por quien no debía | «P · un móvil · se vio el expediente de Dani al pasarlo» |

**¿Interfaz o diseño?** Pregúntate:
- ¿La persona **sabía lo que quería hacer** pero no encontró cómo, o leyó mal la pantalla? → **I** (se arregla con textos, botones, orden).
- ¿Hizo lo que quería y **el resultado no le pareció justo o divertido**? → **R** (se arregla cambiando reglas, y eso se decide con más datos).
- ¿Entendió una regla **distinta** de la real después de leer la pantalla? → **I**, aunque se queje de la regla.
- ¿La misma queja de diseño en **una sola** persona? Anótala, pero no decidas nada todavía.

## 7. Cuándo parar y corregir antes de seguir probando

Para el bloque (o no pases al siguiente) si ocurre cualquiera de estas cosas:

- Un **bloqueo**: la mesa no puede seguir sin ayuda en una fase durante más de un minuto, en cualquier ronda.
- Una incidencia **P** (privacidad) en el multijugador, o dos en el modo de un solo móvil.
- Un **veredicto o unos puntos que no coinciden** con lo que se votó. Haz una captura y anota la semilla de la ronda (en el veredicto, tras «Ver todo», debajo de la tabla «Coartadas contra la verdad»).
- La **misma confusión** (I) en dos o más personas o en dos rondas seguidas.
- Una ronda de más de **15 minutos** con ritmo normal.
- Con la variante: la mayoría **no entiende qué ha revelado la revisión**, o alguien cree que una prueba «sin revisar» es segura.

Las quejas de diseño (R) **no** paran la sesión: se recogen y se deciden después.

## 8. Plantilla de resultados (copiar en las notas del móvil)

Sin nombres: usad letras por asiento (A, B, C…) y anotad aparte, si queréis, quién conocía ya el juego. No hacen falta edades, contactos ni nada personal. También está en [`plantilla-playtest.txt`](plantilla-playtest.txt).

```text
COARTADA · PRUEBA · fecha: ____
Modo: multijugador [ ]  un móvil [ ]
Personas: __  (conocían el juego: __)
Facilita: juega [ ] no juega [ ]

— RONDA __ —
Bloque: 1 normal [ ] 2 normal [ ] 3 variante 100 [ ] 4 variante __ %
Ritmo: ____  Duración (min): __
Culpable (asiento): __  Cómplice: __
Defensa: __  Acusado: __  ¿Acertaron?: sí [ ] no [ ]
Testimonios publicados: __  Cuaderno usado: sí [ ] no [ ]
Variante · revisada: P1 [ ] P2 [ ] ninguna [ ]
           resultado: falsa [ ] auténtica [ ]
           (veredicto) oportunidad: sí [ ] no [ ]  falsificó: sí [ ] no [ ]
Incidencias (T/I/R/E/P · quién · pantalla · qué):
-
-
Frase textual:
-

— AL TERMINAR LA PARTIDA —
¿Atascos? (pantalla):
¿Saben por qué ganó quien ganó?: sí [ ] a medias [ ] no [ ]
Injusto / imposible de deducir:
Lo mejor:
Lo que sobra o se hace largo:
Variante: ¿cambió algún voto la revisión?:
¿Parar y corregir antes de seguir? (apartado 7): sí [ ] no [ ]  motivo:
```

## 9. Después de la sesión

- Pasa las notas a limpio **el mismo día**, sin completar de memoria lo que no se anotó.
- Separa las incidencias por etiqueta. Las **T** y **P** se corrigen primero; las **I** que se repiten, después; las **R** se acumulan hasta tener varias sesiones.
- Para la variante, junta las rondas por condición (100/50/25 %) en una tabla. No compares condiciones con menos de 10 rondas cada una.
- Si algo se corrige entre sesiones, anota en la siguiente hoja qué versión se juega.
