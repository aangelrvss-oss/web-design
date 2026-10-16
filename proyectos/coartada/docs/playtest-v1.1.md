# Coartada v1.1: protocolo de prueba con personas

Este documento sirve para responder, con observación y no con opiniones sueltas, a una pregunta: **¿Coartada es divertido, comprensible y equilibrado cuando lo juega gente real?** Los bots de `docs/balance-sim*.txt` sirven de referencia, pero no la sustituyen.

**Vocabulario.** En la app, una *ronda* es un caso completo, de la declaración al veredicto, y una *partida* es una serie de rondas con puntos acumulados. Aquí se cuentan **rondas**, porque cada una tiene su propio ganador, su duración y su defensa.

**Durante la sesión no se cambia nada del juego.** Se juega la v1.1 tal cual. Los cambios se deciden después, con los criterios del apartado D.

---

## A. Protocolo

### Formato

| Bloque | Personas | Rondas | Ajustes en la sala | Para qué |
|---|---|---|---|---|
| 1 (obligatorio) | 5–7 | 3 seguidas, en una sola partida de 3 rondas | Ritmo normal, objetivos secretos **desactivados** | Comprensión sin ayuda, ritmo, equilibrio en el tamaño principal |
| 2 (si hay tiempo y ganas) | las mismas | 1–2 más, en una partida nueva | Igual, o con objetivos secretos activados si el grupo lo pide | Ver si la segunda vez cambia la forma de jugar |
| 3 (opcional) | 4 | 1 | Ritmo normal | Tamaño mínimo: ¿hay información suficiente y tensión? |
| 4 (opcional) | 8 | 1 | Ritmo normal | Tamaño grande: tablero lleno, tiempos, cómplice |

- **Duración de la sesión:** 75–100 min (unos 10 min de preparación, 8–10 por ronda y 15 de preguntas finales).
- **Lo ideal:** que algunas personas no conozcan el juego. Anota quién lo ha visto antes.
- **Primera ronda:** cuenta como aprendizaje. Sus datos se registran, pero el equilibrio se juzga sobre todo con las siguientes.

### Papeles

- **Facilitador o facilitadora:** prepara la sala y lee el guion. Lo mejor es que **no juegue**; si juega, anótalo en la hoja, porque conoce el juego e influye en la mesa.
- **Observador u observadora** (si es posible, otra persona): cronometra, rellena la hoja y apunta frases textuales. No juega ni opina.

### Preparación (antes de que llegue la gente)

- [ ] Servidor arrancado en un portátil de la misma Wi-Fi (README, «Jugar esta noche con amigos»). Comprueba que dos móviles distintos entran en la sala.
- [ ] Alternativa sin red: el archivo `coartada-un-movil.html` en un móvil (modo de un solo móvil). Si se usa, anótalo: cambia la defensa, que se elige en voz alta, y no hay tiempo límite para declarar ni para votar.
- [ ] Móviles con batería y sonido de la app desactivado (viene así por defecto).
- [ ] Hoja de resultados impresa o abierta (apartado C) y un cronómetro.
- [ ] Si se graba audio o vídeo: pide permiso antes y explica para qué sirve. Si alguien no quiere, solo notas.

### Guion de la persona facilitadora (leer tal cual)

> «Vamos a probar un juego de móvil. Queremos ver cómo funciona, no cómo jugáis vosotros: si algo no se entiende, es culpa del juego. Entrad con el QR o el enlace y poned vuestro nombre. A partir de ahí, haced lo que os pida la pantalla. Yo casi no voy a ayudar; si os atascáis, preguntad en voz alta y lo apunto.»

**No** expliques las reglas, los papeles ni la defensa, y **no** leas la guía en voz alta. Quien quiera puede abrir «Cómo se juega» en el menú; anota cuándo y quién lo hace.

### Reglas de intervención

| Situación | Qué hacer |
|---|---|
| Pregunta sobre **controles** («¿dónde toco para…?») | Si nadie de la mesa responde en unos 20 s, señala la zona de la pantalla sin explicar la regla. Anótalo como ayuda. |
| Pregunta sobre **reglas** («¿puedo mentir en…?», «¿qué pasa si empatamos?») | Responde: «Mira lo que dice la pantalla o el menú "Cómo se juega"». Anota la duda textual. |
| Pregunta **estratégica** («¿a quién votarías?») | No respondas. |
| **Bloqueo** (nadie sabe cómo seguir durante más de 60 s) o fallo técnico | Ayuda lo justo para seguir y anótalo como bloqueo, con la hora y la pantalla. Si es técnico, haz una captura. |
| Alguien desvela su papel o su expediente | No intervengas: es parte del juego social. Anótalo. |

---

## B. Qué observar

Para cada punto, anota **hechos observables** (lo que se dice y se hace, y cuándo) y no tu interpretación. Las frases textuales valen más que los resúmenes.

| # | Área | Señales a registrar |
|---|---|---|
| 1 | **Comprensión** | Dudas por fase (declaración, investigación, defensa, votación, veredicto). Quién abre «Cómo se juega» y cuándo. Personas que miran el móvil de otra para saber qué hacer. Si en el veredicto se entiende por qué se ganó o se perdió. |
| 2 | **Coartadas y pruebas** | Si alguien menciona una prueba al acusar («la prueba dice que estuvo en…»). Si se usan los testimonios para descartar a alguien. Si hay acusaciones basadas solo en «me da mala espina». Cuántos testimonios se publican (el contador está en la app). |
| 3 | **Interacción social** | Si hablan todos o solo 2–3 personas. Contradicciones públicas («¡yo estuve allí y no te vi!»). Alianzas, negociaciones y acusaciones directas. Silencios largos. Si la persona culpable miente activamente o se queda callada. |
| 4 | **Última defensa** | Si señalan sin ayuda (el panel «Última defensa» de la investigación). Cuántas personas señalan (la app muestra «X de Y ya han señalado»). Si quien defiende habla de verdad los 15 s, lo despacha en 2 o pulsa «He terminado mi defensa» de inmediato. Reacciones durante la defensa. Comentarios del tipo «ahora no lo tengo claro» o «ahora sí». En el veredicto, la app muestra cuántos votos recibió cada persona, pero **no** quién señaló ni quién votó a quién. Para saber si la defensa cambió algo, anota a quién acusaba cada persona en voz alta justo antes de la defensa y compáralo con el recuento de votos y con la pregunta final 4. |
| 5 | **Equilibrio** | Ganador de cada ronda. Si la persona culpable ganó por engañar o porque el grupo no tenía información. Si el grupo ganó por deducción o por casualidad (empates o votos muy repartidos). Qué hizo el cómplice, con 6 o más personas: ¿ayudó, se notó? |
| 6 | **Ritmo** | Duración de cada fase y de la ronda. Momentos en que alguien espera sin hacer nada (mirando al techo, con otra app). Si el tiempo se acaba con la gente aún hablando, o si piden terminar antes por aburrimiento. |
| 7 | **Revancha** | Lo que pasa al terminar: ¿alguien dice «otra»? ¿Se levantan? ¿Comentan la ronda entre ellos sin que se les pregunte? |

---

## C. Hoja de resultados

### Por ronda

| Campo | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| Nº de personas (¿alguna nueva?) | | | | | |
| Modo (un móvil por persona / un solo móvil) | | | | | |
| Duración total (de «Empezar» al veredicto) | | | | | |
| Duración de la declaración / la investigación / la votación | | | | | |
| Equipo ganador (inocentes / culpable y cómplice) | | | | | |
| ¿Hubo desempate? ¿Nadie fue acusado? | | | | | |
| ¿Hubo última defensa? (sí / no: nadie señaló / no: desconexión) ¿Por sorteo? | | | | | |
| ¿Quién defendió? ¿Era la persona culpable? | | | | | |
| Votos que recibió quien defendió (recuento del veredicto) frente a lo que se oía antes de la defensa | | | | | |
| ¿La defensa cambió alguna opinión o voto? (lo observado y las frases que lo indican) | | | | | |
| Dudas sobre las reglas (textuales, con la fase) | | | | | |
| Momentos confusos | | | | | |
| Momentos injustos (para quién) | | | | | |
| Momentos especialmente divertidos | | | | | |
| Comentarios espontáneos (textuales) | | | | | |
| Ayudas o bloqueos (hora, pantalla y qué pasó) | | | | | |

### Registro de incidencias (durante la sesión)

| Hora | Ronda | Fase o pantalla | Persona (inicial) | Tipo (técnico / reglas / interfaz / equilibrio / preferencia) | Qué pasó, tal cual |
|---|---|---|---|---|---|
| | | | | | |

### Preguntas para el final de la sesión

Se hacen en grupo, después de la última ronda, en este orden. No se reformulan con ejemplos ni se sugieren respuestas. Primero se deja hablar y después se pregunta a quien no haya dicho nada.

1. Contad con vuestras palabras qué pasó en la última ronda.
2. ¿Hubo algún momento en que no supierais qué hacer? ¿Cuál?
3. Cuando votasteis, ¿en qué os basasteis?
4. ¿La última defensa cambió algo para vosotros? (Vale «no» y «no sé».)
5. ¿Algo os pareció injusto? ¿Para quién?
6. ¿Hubo alguna parte que se os hiciera larga? ¿Y corta?
7. A quien le tocó ser culpable o cómplice: ¿cómo decidiste qué declarar?
8. ¿Qué momento recordáis de la sesión?
9. ¿Jugaríais otra ronda ahora? ¿Lo propondríais otro día? ¿Por qué?
10. Opcional, por escrito y anónimo, del 1 al 5: «Me lo he pasado bien» y «Sabía qué hacer en cada momento».

---

## D. Criterios para decidir cambios

### Cómo clasificar cada hallazgo

| Tipo | Cómo reconocerlo | Qué se necesita para actuar | Qué se hace |
|---|---|---|---|
| **Error técnico reproducible** | La app hace algo distinto de lo que dicen las reglas o la pantalla: se cuelga, no avanza, muestra datos que no tocan, pierde la conexión y no la recupera. | Pasos para reproducirlo, con dispositivo, navegador, número de personas, fase y captura. Una sola vez basta si se puede reproducir. | Se arregla primero, con una prueba automática que lo cubra. |
| **Problema de comprensión de las reglas** | La pantalla dice lo correcto, pero la gente entiende otra cosa: dudas repetidas, decisiones que contradicen la regla, sorpresa en el veredicto. | La misma duda en **2 o más personas** o en **2 o más rondas**. | Antes de tocar la regla, se cambia el texto, la guía o el orden en que se presenta. |
| **Problema de interfaz o legibilidad** | Se entiende la regla, pero no se encuentra el botón, se pulsa el equivocado o no se lee algo (tamaño, contraste, tablero lleno). | Observado en **2 o más personas**, o en un móvil físico concreto y reproducible. | Arreglo localizado en esa pantalla, comprobado en móvil. |
| **Posible cuestión de equilibrio** | Un bando gana casi siempre por razones del juego, no de las personas: falta información, la defensa siempre hunde o salva, o el cómplice decide la ronda. | Un patrón en **varias sesiones** (orientativamente 12 o más rondas sin contar las de aprendizaje), con explicaciones de los jugadores que lo apoyen, contrastado con la simulación. **Nunca** con una sola ronda ni solo con la simulación. | Se cambia **una sola variable** cada vez (por ejemplo, el umbral del cómplice, los recuerdos o el tiempo) y se vuelve a probar. Los puntos no se tocan para maquillar resultados. |
| **Preferencia subjetiva** | «Me gustaría que…» o «yo lo haría…» sin un problema observado detrás. | Que la repita la mayoría de la mesa en sesiones distintas. | Se anota. Solo se actúa si se repite y encaja con el diseño. |

### Reglas prácticas

- **Un caso aislado no es un patrón.** Una ronda en la que la persona culpable gana con facilidad puede deberse a una mesa tímida.
- **Primero el texto, después la regla.** Casi todos los problemas de una primera sesión son de comprensión o de interfaz.
- **La simulación orienta, no decide.** Con bots, el grupo gana entre el 25 % y el 71 % de las rondas según el tamaño y la estrategia. Un resultado humano muy lejos de ese rango merece mirarse, pero no se cambia nada para «acercarse a los bots».
- **Separar a quien conoce el juego.** Sus datos no cuentan para la comprensión.
- **Gravedad:** lo que bloquea la ronda va antes que lo que la hace confusa, y esto antes que lo que la hace menos divertida.

---

## Qué comprobar en móviles físicos durante la sesión

Nunca se ha probado con dispositivos reales (ver `CHECKPOINT.md`). Aprovecha la sesión para anotar, con el modelo de móvil y el navegador:

- [ ] iPhone con Safari y Android con Chrome: unirse por QR, por enlace y por código.
- [ ] El teclado no tapa el campo del nombre ni el botón «Entrar».
- [ ] Márgenes en móviles con muesca o barra de gestos: no se tapa ningún botón.
- [ ] Si alguien bloquea el móvil o cambia de app a mitad de ronda: ¿vuelve solo a su sitio y a su expediente?
- [ ] Un móvil estrecho (de 320–360 px de ancho, como un iPhone SE o un Android pequeño): los tres botones de la investigación caben, y la etiqueta puede ocupar dos líneas.
- [ ] Con 8 o más personas: ¿se distinguen las fichas del tablero? ¿Alguien se queja de tener que desplazarse mucho por la votación o los testimonios?
- [ ] Sonido (si alguien lo activa): ¿suena en iPhone con el modo silencio quitado?
