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

---

## E. Prueba multijugador con móviles físicos (4–6 personas)

Objetivo: validar el **funcionamiento multijugador, la privacidad y la experiencia** con un móvil por persona, antes de cambiar nada. Se juega la v1.1 tal cual.

> **Importante:** el archivo `coartada-un-movil.html` (y el artefacto publicado) es **solo el modo de un solo móvil**: no tiene servidor ni conexión, así que no sirve para esta prueba. Hace falta el servidor del proyecto.

### E.1 Cómo funciona la conexión

- Un **portátil u ordenador** ejecuta el servidor (`dist/server.mjs`). El servidor entrega la web del juego y la conexión en tiempo real (WebSocket) por el **mismo puerto**, el 3000 por defecto. No hay base de datos, ni cuentas, ni claves.
- Los móviles abren la web **desde el portátil** por la Wi-Fi: `http://IP-DEL-PORTÁTIL:3000`. El cliente se conecta al mismo origen del que se cargó; no hay ninguna URL que configurar.
- El servidor escucha en `0.0.0.0` (todas las interfaces de red). En una Wi-Fi doméstica, el router no deja entrar conexiones desde Internet si no abres puertos, así que **no hace falta ni conviene abrir puertos en el router**. Para limitarlo además a la Wi-Fi, arranca con `HOST=IP-DEL-PORTÁTIL`.
- **No uses una Wi-Fi pública** (cafetería, coworking), porque otras personas de esa red podrían abrir la web, y tampoco una red de invitados: suele aislar unos dispositivos de otros y los móviles no llegarán al portátil.
- Las salas viven **en la memoria del servidor**. Si se cierra o se reinicia, las salas desaparecen.
- La conexión es **HTTP sin cifrar**. Para una prueba en casa no supone un problema (solo viajan datos de la partida), pero tiene un efecto: el botón **«Compartir enlace» no funciona por HTTP**, porque el navegador solo permite compartir y copiar en páginas seguras. Usad el **QR** o el **código de 4 letras**. Este defecto está confirmado y se describe en E.5.

### E.2 Puesta en marcha (en el portátil)

Requisito: Node.js 20 o superior (`node -v`).

```bash
cd proyectos/coartada
npm ci                 # instala exactamente las dependencias del lockfile (solo la primera vez)
npm run build          # genera dist/client y dist/server.mjs
npm start              # = node dist/server.mjs  → escucha en 0.0.0.0:3000
```

Si todo va bien, la terminal muestra una línea parecida a esta:

`{"t":"…","msg":"listening","host":"0.0.0.0","port":3000}`

Variantes opcionales:

```bash
PORT=8080 npm start                    # otro puerto
HOST=192.168.1.40 npm start            # solo en la interfaz de la Wi-Fi (sustituye por tu IP)
# Windows (PowerShell):  $env:PORT=8080; npm start
```

**IP del portátil en la Wi-Fi:**
- macOS: `ipconfig getifaddr en0`
- Linux: `hostname -I` (la primera, del tipo `192.168.x.x` o `10.x.x.x`)
- Windows: `ipconfig` (campo «Dirección IPv4» del adaptador Wi-Fi)

**Comprobación desde el propio portátil:** abre `http://IP:3000/healthz` en el navegador. Debe responder `{"ok":true,"rooms":0}`.

**Cortafuegos:**
- macOS: si pregunta si «node» acepta conexiones entrantes, responde *Permitir*.
- Windows: marca solo *Redes privadas* (no públicas) y comprueba que la Wi-Fi esté configurada como red privada.

No uses `npm run dev` para la prueba: es el modo de desarrollo (puerto 5173, recarga en caliente) y no es lo que se va a usar de verdad.

### E.3 Conectar los móviles y crear la sala

1. **Todos los móviles en la misma Wi-Fi que el portátil.** Desactivad los datos móviles si el móvil tiende a cambiarse de red.
2. Desde **un móvil**, abrid `http://IP:3000`. Si carga la portada, la red funciona.
3. **Quien dirige crea la sala desde su móvil** (o desde el portátil, pero entrando por `http://IP:3000`, **nunca por `localhost`**). El QR y el enlace se construyen con la dirección que tiene abierta quien crea la sala: si es `localhost`, el QR no funcionará en los demás móviles. Para comprobarlo, la sala muestra «entrad en IP:3000 con el código».
4. El resto se une de una de estas dos formas:
   - **Escaneando el QR** con la cámara. Si el móvil ofrece abrirlo en el navegador, aceptad; mejor en Safari o Chrome que dentro de otra app.
   - **Escribiendo la dirección** `http://IP:3000` → «Unirme con un código» → el código de 4 letras (da igual en mayúsculas o minúsculas).
5. **Comprobar que todos están en la misma sala:**
   - todos ven el **mismo código** de sala;
   - la lista de personas coincide en todos los móviles;
   - el contador `N/10` de quien dirige cuadra con la gente que hay;
   - nadie aparece con la etiqueta «Sin conexión».
6. Quien dirige elige **Rondas: 3**, ritmo **Normal** y objetivos secretos **desactivados**, y pulsa **Empezar partida** (hacen falta al menos 4 personas conectadas).

**Cada persona debe usar siempre el mismo navegador del mismo móvil.** La sesión se guarda en ese navegador. Si alguien abre el enlace en otro navegador o en el visor de una app (WhatsApp, Telegram…), entrará como persona nueva.

### E.4 Cerrar la sesión de pruebas

1. Al terminar, en el portátil: **Ctrl+C** en la terminal del servidor. Se registra `shutting down` y todas las salas desaparecen; no queda nada guardado en el portátil.
2. En los móviles basta con cerrar la pestaña. Queda un identificador de sesión en el navegador, sin ningún dato personal, que no sirve para nada una vez cerrada la sala.
3. Si diste permiso en el cortafuegos solo para esta prueba, puedes retirarlo: en macOS, en Ajustes del sistema → Red → Cortafuegos → Opciones; en Windows, en Firewall de Windows Defender → Permitir una aplicación.

### E.5 Plan progresivo

Las pruebas son progresivas: **no hace falta hacer las tres seguidas**. Con el grupo que se pueda reunir, jugad **al menos 2 rondas completas**. La primera es de aprendizaje; los datos de juego se juzgan sobre todo desde la segunda.

| Prueba | Personas | Rondas | Objetivo principal | Pruebas de fallo programadas (solo con el móvil de quien facilita) |
|---|---|---|---|---|
| 1 | 4 | 2–3 | Flujo completo (E.6, recorrido C1–C11) y casos básicos | Recargar en la declaración; bloquear la pantalla 30 s en la investigación |
| 2 | 5 | 2–3 | ¿La interacción y la deducción funcionan con una persona más? | Modo avión 20 s en la investigación; todos pulsan «Pedir prueba 2» a la vez, a la cuenta de tres |
| 3 | 6 | 2–3 | Grupo previsto; aparece el **cómplice** | Una 7.ª persona entra con la ronda empezada; alguien sale con «Salir de la sala» en la última ronda (solo si ya se ha jugado lo necesario) |

- Las pruebas de fallo las hace **la persona facilitadora con su propio móvil**, para no estropear la ronda a nadie. En la prueba 1 puede jugar; en las demás, mejor que observe.
- **No uséis «Terminar esta fase»** del menú salvo bloqueo: cambia el ritmo natural. Si se usa, anotadlo.
- Para comprobar qué pasa cuando alguien tarda demasiado, basta con que el móvil de quien facilita **no haga nada** en una fase.

### E.6 Comprobaciones obligatorias

Marcad ✓ (como se espera), ✗ (no) o — (no se ha probado). Lo esperado sale de las reglas y de las pruebas automáticas del 16-10-2026 (E.9).

**A. Entrada y sincronización**

| # | Comprobación | Esperado |
|---|---|---|
| A1 | Cada persona entra desde su móvil (QR o código) | Aparece en la lista de todos en 1–2 s |
| A2 | Todos ven la misma sala, las mismas personas y la misma fase | El mismo código, la misma lista y el mismo título de fase |
| A3 | Los cambios de fase llegan a todos | Todos cambian de pantalla a la vez (±1 s) y los temporizadores coinciden (±1 s) |
| A4 | Alguien entra con la ronda empezada | Ve la ronda sin jugar («Estás viendo esta ronda sin jugar») y entra en la siguiente con su papel |
| A5 | Recargar la página (en cualquier fase) | Vuelve a su sitio con su expediente; conserva el borrador de la declaración, y su voto si ya votó |
| A6 | Perder la conexión 20–60 s y volver | Aviso «Reconectando…» y recuperación automática; la mesa no se bloquea mientras tanto |

**B. Privacidad**

| # | Comprobación | Esperado |
|---|---|---|
| B1 | Cada persona solo ve su papel, su noche real y sus recuerdos | El expediente privado solo existe en el móvil de su dueño |
| B2 | Nada en el tablero, los testimonios, la defensa ni la votación revela el papel de otra persona | Las coartadas y los testimonios pueden ser mentira, pero ninguna pantalla dice quién es culpable antes del veredicto |
| B3 | Señalamientos secretos | Durante la investigación solo se ve **cuántas** personas han señalado; en la defensa, a quién le toca, con cuántos señalamientos y si hubo sorteo. Nunca quién señaló a quién (la v1.1 tampoco lo muestra en el veredicto) |
| B4 | Votos | Durante la votación solo se ve **quién** ha votado, no a quién. El veredicto muestra el recuento por persona |
| B5 | Cómplice (con 6) | La persona culpable y la cómplice saben quién es la otra; nadie más lo sabe |
| B6 | Veredicto | Revela lo previsto: papeles, dónde estuvo cada cual, coartadas frente a la verdad, si los testimonios eran ciertos, los puntos y la semilla |
| B7 | Pregunta discreta a cada persona tras la ronda: «¿Has visto en tu pantalla algo privado de otra persona?» | No |

La auditoría de red automática ya comprobó, en navegadores emulados contra este mismo servidor, que ningún móvil **recibe** papeles, noches, recuerdos, votos, señalamientos ni la semilla de otra persona antes del veredicto. En la prueba física se comprueba lo que **se ve**, y que nadie puede mirar el móvil del vecino sin que se note (expediente plegado, botón para abrirlo).

**C. Recorrido completo** (en la primera ronda de la prueba 1)

| # | Paso | Esperado |
|---|---|---|
| C1 | Crear la sala y unirse | Ver E.3 |
| C2 | Repartir papeles | Cada cual abre su expediente confidencial en privado |
| C3 | Declarar y sellar | Tres horas, un sitio por hora; «Sellar declaración»; se ve quién ha sellado, no qué |
| C4 | Revelar el tablero | Todas las coartadas aparecen a la vez cuando sellan todos o se acaba el tiempo |
| C5 | Publicar testimonios | Hasta 3 por persona; cada uno sale como *Coincide*, *Contradice* o *Sin contraste* |
| C6 | Pruebas | La prueba 1 sale al empezar la investigación; la 2, cuando todos la piden o acaba la primera parte |
| C7 | Señalar en secreto | Panel «Última defensa» → «Señalar a alguien»; se puede cambiar o quitar |
| C8 | Última defensa | Le toca a la persona más señalada (empate: sorteo; nadie señalado: no hay defensa); 15 s; puede terminarla ella o quien dirige |
| C9 | Votar y desempatar | Voto secreto; si hay empate, desempate solo entre las empatadas; si se repite, nadie es acusado |
| C10 | Resultado y puntos | Puntos según RULES §6; comprobar a mano una línea de puntos de alguien |
| C11 | Nueva ronda | Caso, papeles y recuerdos nuevos; solo se conservan los puntos |

**D. Casos de fallo**

| # | Situación | Esperado (verificado en pruebas automáticas) | Clasificación |
|---|---|---|---|
| D1 | Recargar la página | Vuelve a su sitio, con su expediente, su borrador y su voto; no puede votar dos veces | Comportamiento esperado |
| D2 | Perder la conexión y volver | Recupera su sitio; mientras falta, la fase avanza sin esperarle; si no selló a tiempo, su coartada es **automática**; si no vota, no cuenta | Comportamiento esperado |
| D3 | Quien dirige pierde la conexión | Pasados 20 s, otra persona pasa a dirigir y la partida sigue | Comportamiento esperado |
| D4 | Alguien pulsa «Salir de la sala» a mitad de ronda | Sigue en la ronda como desconectado (coartada automática, sin voto) y se le quita al acabarla. **No puede recuperar su sitio**: si vuelve a entrar, lo hace como persona nueva, mira la ronda y empieza la siguiente con 0 puntos | Esperado según las reglas; **pendiente de decisión** si se quiere que pueda volver con sus puntos |
| D5 | Dos acciones casi a la vez (todos sellan o piden la prueba 2 a la vez; quien dirige termina la fase mientras alguien actúa; doble pulsación al votar o en «Siguiente ronda») | Una sola transición de fase; la acción repetida se rechaza con «Eso ya está hecho.» o «Esa acción ya no está disponible en esta fase.» | Comportamiento esperado |
| D6 | Alguien tarda demasiado | Al acabar el tiempo: coartada automática marcada, la fase avanza, el voto no emitido no cuenta y, si nadie vota, nadie es acusado. La defensa termina sola a los 15 s | Comportamiento esperado |
| D7 | Termina la última ronda e intentan seguir | En el último veredicto, quien dirige ve «Ver clasificación final». En la clasificación, votar o empezar se rechaza y solo queda «Nueva partida», que vuelve a la sala con los puntos a cero. (A mitad de partida, «Ir a la sala» vuelve a la sala **conservando** los puntos.) | Comportamiento esperado |
| D8 | «Compartir enlace» o «Invitar a más gente» por HTTP en la red local | **No hace nada y no muestra ningún aviso** (el navegador bloquea compartir y copiar en páginas no seguras). Alternativa: el QR o el código | **Defecto confirmado**, menor. No se corrige en esta fase (sería un cambio de interfaz) |
| D9 | El servidor se reinicia a mitad de ronda (despliegue, reinicio del plan gratuito de Render, caída) | Mientras está caído: aviso «Sin conexión. Reintentando…» y el móvil reintenta solo. Cuando vuelve: cada móvil regresa a la portada con «Esa sala ya no existe (se cerró o el servidor se reinició). Crea una sala nueva o únete a otra con su código.» La sala, la ronda y los puntos se pierden (viven en memoria); quien dirige crea otra sala y el resto se une | Comportamiento esperado (arreglado el 16-10-2026: antes el móvil se quedaba en la ronda muerta tras un reinicio ordenado). Si ocurre, anotadlo con la hora |

### E.7 Plantilla de registro

**Dispositivos**

| Persona (inicial) | Modelo de móvil | Sistema y versión | Navegador | ¿Cómo entró? (QR / código) | Observaciones |
|---|---|---|---|---|---|
| | | | | | |

**Resultados por comprobación o incidencia**

| Prueba (4/5/6) | Ronda | Duración de la ronda | Fase | Comprobación (A1…D9) o «nuevo» | Resultado esperado | Resultado observado | ¿Reproducible? (sí / no / sin probar) | Captura o descripción (**sin secretos**: tapa papeles y expedientes) | Severidad |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

Severidad:
- **Bloqueante:** impide seguir la ronda o expone un secreto.
- **Importante:** obliga a ayudar o confunde a la mayoría.
- **Menor:** molesta, pero se juega.

Las incidencias de juego (comprensión, equilibrio, diversión) van en la hoja del apartado C.

### E.8 Preguntas al terminar (multijugador)

Se hacen tal cual, sin explicar qué se espera:

1. ¿Entendiste qué tenías que hacer en cada fase?
2. ¿Tuviste algún problema con el móvil?
3. ¿Te pareció que tus decisiones importaban?
4. ¿La Última defensa te ayudó a decidir el voto?
5. ¿Qué parte te resultó más confusa?
6. ¿Jugarías otra ronda?

### E.9 Qué se ha verificado ya y qué no

Verificado el 16-10-2026, en este entorno, con el servidor de producción (`node dist/server.mjs` en `0.0.0.0:3000`) y accediendo **por la IP de la máquina, no por localhost**, es decir, en una página no segura como en una Wi-Fi doméstica:

- Ronda completa con revancha, reconexión y vuelta tras perder la red, con 4, 5 y 6 navegadores Chromium independientes con pantalla de móvil emulada. Incluye la auditoría de privacidad de cada trama recibida.
- Casos de fallo D1–D7 con clientes de prueba conectados a ese mismo servidor.
- Una ronda en la que **nadie hace nada** (4 personas, ritmo rápido), con los temporizadores reales del servidor:
  - declaración de 75 s, con 4 coartadas automáticas;
  - investigación de 65 s + 90 s;
  - sin defensa, porque nadie señaló;
  - votación de 30 s;
  - veredicto «nadie acusado» a los 260 s, sin bloqueos.
- El QR y el texto de la sala usan la IP. «Compartir enlace» no funciona por HTTP (D8).

Verificado también el 16-10-2026 con `npm run e2e:restart` (servidor local, Chromium con pantalla de móvil emulada):
- reinicio ordenado (SIGTERM, lo que hace Render) y caída brusca (SIGKILL) en plena declaración: los dos móviles vuelven solos a la portada con el aviso, sin la ronda muerta, sin la sala en la URL ni la sesión guardada, y pueden crear una sala nueva y unirse a ella (D9);
- con el servidor caído 15 s, el aviso llega unos 4 s después de que vuelva;
- un corte de red con el servidor activo sigue recuperando la misma ronda.

**No** se ha probado nada de esto:
- en Render, ni con una URL HTTPS pública;
- en móviles físicos;
- en Safari de iOS ni en Firefox;
- en una Wi-Fi real con varios dispositivos;
- con pantallas que se bloquean de verdad o apps en segundo plano;
- leyendo el QR con una cámara real.

### E.10 Variante: jugar con una URL HTTPS de Render

Sirve para jugar desde redes distintas o sin portátil. **El servicio no se ha desplegado ni probado en Render**: estos pasos se apoyan en la arquitectura actual (un solo servicio que sirve la web y el WebSocket desde el mismo origen) y en la documentación de Render. Hay que comprobarlos en la prueba previa.

**Antes del día de la sesión**
1. Crear el servicio siguiendo el README, apartado «Desplegar» (plan *Free*, *Auto-Deploy* desactivado).
2. Abrir `https://<servicio>.onrender.com/healthz`; debe responder `{"ok":true,"rooms":0}`.
3. Prueba previa con dos móviles, uno con datos móviles y otro con Wi-Fi:
   - crear sala;
   - unirse por QR;
   - comprobar que «Compartir enlace» funciona (por HTTPS debería; D8 solo afecta a HTTP);
   - jugar una ronda corta.

**El día de la sesión**
1. **Despertar el servicio 2–3 min antes:** en el plan gratuito se duerme tras 15 min sin tráfico y tarda alrededor de 1 min en arrancar.
2. Quien dirige crea la sala desde `https://<servicio>.onrender.com`. El QR y el enlace usan esa dirección.
3. El resto entra por QR, por enlace o por código. Da igual la red: cada móvil puede usar sus datos.
4. **No hagáis push ni despliegues durante la sesión:** reinician el servidor (D9).
5. En las pausas largas (más de 10 min), dejad al menos un móvil con la sala abierta. Si todos se bloquean más de 15 min, el servicio puede dormirse y la sala se pierde.
6. Si el servidor se reinicia (D9):
   - todos vuelven a la portada con el aviso;
   - quien dirige crea otra sala y el resto se une;
   - los puntos de la partida se pierden;
   - anotad la hora y en qué fase estabais.

**Al terminar:** suspender o borrar el servicio en el panel de Render.
