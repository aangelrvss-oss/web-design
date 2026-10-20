# Prototipo experimental: «Prueba falsificable» (M1)

Estado: **prototipo opcional para partidas de prueba.** No está aprobado para el juego normal. Viene **desactivado** y solo se activa a mano: en la sala de una partida multijugador o en la preparación del modo de un solo móvil. Con la variante desactivada, el juego es exactamente el de siempre: lo vigilan las huellas de `tests/engine-golden.test.ts` y las pruebas de `tests/prueba-falsa.test.ts`.

**Vocabulario.** En pantalla se dice **«revisar»** una prueba (antes, «peritar»). En el código siguen los nombres internos de siempre (`examine`, `examineMarks`, `examination`, el estado `sin_peritar` y la semilla `peritaje|`) para no cambiar contratos ni sorteos; los documentos de diseño anteriores (`MECANICAS-*.md`) conservan «peritaje».

Origen: recomendación de [`MECANICAS-propuesta.md`](MECANICAS-propuesta.md). Esas cifras son de bots y no dicen nada sobre si la mecánica divierte. Por eso este documento no la llama «equilibrada».

---

## 1. Antes de la variante: qué significan hoy los testimonios

La fase 7 señaló que `testify` no comprueba los recuerdos. Revisado contra el código, las reglas y la interfaz:

1. **Qué introduce el jugador.** Solo *de quién* habla y *a qué hora* (`game:testify {subject, slot}`). El lugar no lo elige: es el que la propia persona declaró a esa hora (`game.ts`, `testify`). Un testimonio siempre dice «Estuve con X en [mi lugar declarado] a las H».
2. **Qué comprueba el motor:**
   - que la fase es la investigación;
   - que quien testifica participa en la ronda;
   - que X es otra persona de la ronda;
   - que la hora existe;
   - que no supera 3 testimonios;
   - que no repite persona y hora.
   
   **No comprueba que sea cierto ni que salga de un recuerdo.**
3. **Qué significa «coincide».**
   - En la lógica (`encargos.ts`, `testimonyStatus`): X selló una coartada que dice el mismo lugar a esa hora. No compara con la verdad.
   - En la interfaz:
     - cada testimonio dice «Coincide con la coartada de X»;
     - la lista avisa de que «coincide» significa que las dos versiones encajan, no que sean verdad;
     - la guía rápida dice que la app compara con lo que declaró X, no si es verdad;
     - la guía larga pone de ejemplo un testimonio falso que coincide.
4. **Cuatro cosas distintas:**
   - **Afirmación de un jugador:** el testimonio. Puede ser verdadera o falsa.
   - **Coincidencia comprobada por el motor:** el estado *coincide*. Es un hecho sobre dos afirmaciones, no sobre la noche.
   - **Contradicción demostrada:** el estado *contradice*. Prueba que **al menos una** de las dos afirmaciones es falsa, pero no cuál.
   - **Mentira demostrada:** solo existe al final. El motor compara con la verdad y da «destapó una mentira» (+1) a quien contradijo una coartada falsa con un testimonio verdadero; el veredicto marca cada testimonio como «Cierto» o «Falso».
   - **Declaración que no puede verificarse:** *sin contraste*, cuando la coartada de X es automática y no hay nada suyo con qué comparar.
5. **¿Es deliberado?** **Sí.**
   - `docs/RULES.md` define el testimonio como «Can be true or false».
   - La guía dice «mentir no está prohibido», y la puntuación premia destapar mentiras con testimonios verdaderos, lo que solo tiene sentido si se puede mentir.
   - El ejemplo de la guía larga usa un testimonio falso que coincide.
   
   **No hay discrepancia entre reglas e implementación**, y la interfaz no presenta una coincidencia como verdad comprobada: «cierto» y «falso» solo aparecen en el veredicto. Lo que sí faltaba es que los **simuladores** de las fases 5–7 modelaran ese engaño; la fase 7 ya lo anotó como limitación. No se cambia nada del juego.

Las pruebas `tests/testimonios-semantica.test.ts` fijan estas cuatro categorías para que ningún cambio futuro las mezcle.

---

## 2. Reglas exactas del prototipo

**En una frase (la que se lee en la sala):**

> «En esta ronda la persona culpable puede falsificar una de las dos pruebas. Cada persona puede marcar qué prueba quiere revisar; al acabar la investigación se revisa la más marcada.»

| # | Regla |
|---|---|
| R1 · Activación | Quien dirige la sala la activa en «Ajustes» (interruptor «Prueba falsificable · experimental»). Solo se puede cambiar en la sala de espera o entre rondas, nunca con una ronda en marcha. Al empezar, la ronda **copia** el ajuste (`round.variant`), y todo lo que se muestra durante la ronda sale de esa copia. En el modo de un solo móvil (y en la demo de un archivo) se activa en la pantalla de preparación, con el mismo interruptor, apagado por defecto; las diferencias de ese modo están en la sección 4b. |
| R2 · Tamaños | De 4 a 10 personas, igual que el juego. |
| R3 · Qué es falsificar | Las dos pruebas dicen dónde estuvo la persona culpable a las dos horas que no son la del incidente. Falsificar una es **cambiar el lugar que dirá esa prueba** por otro lugar de la ronda, a la misma hora. No se puede cambiar la hora ni poner el lugar verdadero. Como máximo una falsificación por ronda. |
| R4 · Cuándo y cómo | Solo la persona culpable, solo durante la declaración, dentro de su expediente confidencial. Elige «No falsifico» (lo que hay por defecto) o una de las dos horas y un lugar. **Puede cambiarlo hasta que termine la declaración**, al sellar la última persona o al acabarse el tiempo. Lo que tenga elegido en ese momento es definitivo. Elegir no obliga a sellar ni depende de haber sellado. |
| R5 · Quién sabe qué | **Culpable:** su elección, en todo momento. **Cómplice** (desde 6): la elección definitiva, al empezar la investigación. **Inocentes:** solo que la variante está activa; nadie más sabe si hubo falsificación. |
| R6 · Antes de la revisión | Las pruebas salen como siempre (la 1 al empezar la investigación y la 2 en la segunda parte). Cada una muestra lo que *dice*, falso o no, con la etiqueta **«Sin revisar: puede ser falsa»** y sin la frase «hecho comprobado». El tablero rodea, como siempre, a quienes encajan con lo que dice. |
| R7 · Elegir qué se revisa | Durante toda la investigación, cada participante puede marcar en secreto **una** de las pruebas ya publicadas, cambiarla o quitarla. Todo el mundo ve **cuántas** marcas tiene cada prueba, nunca de quién. Al terminar la investigación se revisa la más marcada. Si hay empate con marcas, la app sortea entre las empatadas (sorteo sembrado con la semilla de la ronda, como la defensa). Si nadie marca, no hay revisión. |
| R8 · Si se revisa la falsa | Mensaje: «Revisión: la prueba de las H era **falsa**. La verdadera dice: Z». La prueba pasa a mostrar el lugar verdadero, con la etiqueta «Falsa: decía Y». La otra queda «Auténtica», porque solo puede haber una falsa. |
| R9 · Si se revisa una auténtica | «Revisión: la prueba de las H es **auténtica**». La otra sigue «Sin revisar». Esto no dice si hubo falsificación. |
| R10 · Cómo se comunica | El resultado lo calcula el servidor y llega igual a todo el mundo en la vista pública. Se muestra en la defensa, en la votación (en una tarjeta propia) y en las pruebas. |
| R11 · Revelación final | En el veredicto, junto a la verdad: «La persona culpable falsificó la prueba de las H: puso Y; la verdadera era Z» o «La persona culpable no falsificó ninguna prueba». |
| R12 · Puntos y victoria | **Sin cambios.** `computeOutcome` no usa las pruebas, y la ronda se gana y se puntúa como siempre. |
| R14 · Probabilidad de oportunidad | Ajuste experimental **«Oportunidad de falsificar»**: 100 %, 50 % o 25 % (100 % por defecto, que es la regla tal como se prototipó). Solo existe con la variante activada; lo cambia quien dirige en la sala, o quien prepara la partida en un solo móvil. Es una condición de prueba para comparar con grupos reales: ninguna opción es «mejor» de antemano. |
| R15 · Un sorteo por ronda | Al empezar la ronda, la ronda copia la probabilidad (`round.forgeryChance`) y el motor sortea **una vez** si la persona culpable tiene la oportunidad (`round.forgeryAllowed`), con un flujo aleatorio propio derivado de la semilla de la ronda (`falsificar|semilla`): nada más de lo generado con la semilla cambia, y con 100 % no se sortea. Ni recargar, ni volver a entrar, ni repetir una acción, ni cambiar el ajuste después lo vuelve a sortear. En multijugador sortea el servidor (su semilla es aleatoria y secreta); en un solo móvil, el mismo motor en el navegador. |
| R16 · Oportunidad, no obligación | Con oportunidad, la culpable decide como siempre (falsificar una o no falsificar). Sin ella, el servidor rechaza cualquier falsificación (`invalid`) y la culpable solo puede «no falsificar». Nunca se falsifica nada automáticamente. |
| R17 · Quién sabe si hubo oportunidad | Solo la culpable, en su expediente (`canForge`). La cómplice no: al empezar la investigación lee «Tu pareja no falsificó ninguna prueba», igual que si la tuvo y no la usó. El resto, nada. La vista pública solo dice la probabilidad de la ronda (configuración, igual para todos); el resultado del sorteo aparece en el veredicto (`reveal.forgeryAllowed`): «Esta ronda la persona culpable no tuvo oportunidad de falsificar (sorteo con 25 %)». Puntos y victoria, sin cambios (R12). |
| R13 · Desconexiones | Las marcas de revisión cuentan aunque su autor se haya desconectado, igual que los señalamientos para la defensa. Al reconectar, cada persona vuelve a ver su marca y la falsificación que le corresponda conocer. |

**Decisiones tomadas para el prototipo** (simplificaciones de la propuesta, documentadas aquí):

- La falsificación se decide solo durante la declaración, sin ver las coartadas de nadie. La propuesta contemplaba también falsificar la prueba 2 después: queda fuera para no añadir otro momento secreto.
- La persona culpable elige por **hora**, no por «prueba 1 o 2». El orden en que salen las pruebas no se revela, igual que hoy.
- La culpable y la cómplice también pueden marcar revisión, un voto cada una, como cualquiera.

### 2.1 Hechos internos frente a presentación pública

| Dato | Dónde vive | Quién lo ve |
|---|---|---|
| Las pruebas verdaderas | `round.setup.traces`. **Nunca se modifican.** | Nadie, hasta que salen. La que no se falsificó sale como siempre. |
| La falsificación (hora y lugar) | `round.forgery` | La persona culpable (en la declaración). La cómplice, desde la investigación. Todo el mundo, en el veredicto. |
| Lo que muestra cada prueba | Calculado en `publicView` | Todo el mundo. Una prueba falsa sin revisar tiene **exactamente los mismos campos** que una auténtica sin revisar. |
| Las marcas de revisión | `round.examineMarks` | Cada persona solo ve la suya; el público, el recuento por prueba. |
| El resultado de la revisión | `round.examination` | Todo el mundo, en cuanto acaba la investigación. |

Ningún cliente decide el resultado: el cliente solo manda su marca. El servidor cuenta, sortea si hace falta y compara con la falsificación guardada.

---

## 3. Qué se ha implementado

| Pieza | Cambio |
|---|---|
| Ajustes | `Settings.variant: 'prueba_falsa' \| null`, `null` por defecto (`types.ts`). Solo quien dirige lo cambia, nunca con una ronda en marcha (regla de siempre de `updateSettings`). |
| Ronda | Al empezar copia el ajuste en `round.variant`. Solo si está activo añade `forgery`, `examineMarks` y `examination`; una ronda normal no tiene esos campos. |
| Motor | `src/shared/engine/prueba-falsa.ts` (funciones puras: validar, contar marcas, resolver la revisión y calcular lo que muestra cada prueba). `game.ts`: las acciones `forge` y `examine`, y una línea en `beginDefense`, que resuelve la revisión al acabar la investigación. **No se modifican** `generateRound`, `computeOutcome`, la puntuación, los tiempos ni los testimonios. |
| Protocolo | `room:settings` admite `variant`. Hay dos mensajes nuevos con esquema estricto: `game:forge {forgery: {slot, zone} \| null}` y `game:examine {index: 0 \| 1 \| null}`. En una ronda normal el motor los rechaza. |
| Vistas | En la vista pública, `round.variant`, `round.examination` (recuento y resultado), el estado de cada prueba y, en el veredicto, `reveal.forgery`. En la privada, `forgery`, solo para la culpable (y para la cómplice desde la investigación), y `examineMark` (la marca propia). |
| Interfaz | `src/client/ui/pruebaFalsa.tsx`:<br>• el interruptor de la sala;<br>• la etiqueta «Reglas experimentales» en la cabecera del caso;<br>• la elección dentro del expediente de la culpable;<br>• la nota de la cómplice;<br>• la etiqueta de cada prueba y el panel «¿Qué prueba hay que revisar?»;<br>• el resultado en la defensa y la votación;<br>• la revelación en el veredicto;<br>• dos pasos en la guía rápida, que solo aparecen si la variante está activa. |

**Para retirarla:**
- borrar `prueba-falsa.ts` y `pruebaFalsa.tsx`;
- quitar las dos acciones de `game.ts` y su línea en `beginDefense`;
- quitar el valor `variant` y los campos marcados «Prueba falsificable» en `types.ts`, `views.ts`, `protocol.ts` y `app.ts`;
- quitar las líneas que montan los componentes y las reglas CSS del final de `app.css`.

No hay sistema de complementos ni más variantes.

---

## 4. Cómo activarla y jugarla en el móvil

**Requisitos:** el mismo montaje que una partida normal con amigos (README, «Jugar esta noche con amigos»). Un portátil en la Wi-Fi de casa con `npm install && npm run build && npm start`, y cada persona con su móvil en `http://<IP-del-portátil>:3000`.

1. Quien dirige pulsa **Crear sala** en su móvil.
2. En la sala, en **Ajustes**, activa **«Prueba falsificable · experimental»** y, debajo, elige la **oportunidad de falsificar** (100 %, 50 % o 25 %). Todos los móviles lo ven activado; solo quien dirige puede cambiarlo.
3. Con 4–10 personas, **Empezar partida**. Debajo del título del caso aparece «Reglas experimentales: prueba falsificable».
4. **Declaración.** Cada persona abre su expediente. La persona culpable verá dentro «Reglas experimentales: puedes falsificar una prueba»: elige «No falsifico» o una hora y un lugar, y puede cambiarlo hasta que termine la declaración.
5. **Investigación.** Las pruebas salen con la etiqueta «Sin revisar: puede ser falsa». En el panel **«¿Qué prueba hay que revisar?»** cada persona marca una y puede cambiarla o quitarla. Se ve cuántas marcas tiene cada prueba.
6. **Al acabar la investigación** sale el resultado de la revisión: «Falsa» (con la verdadera) o «Auténtica». Si nadie marcó, no hay revisión.
7. **Veredicto.** Se dice qué falsificó la persona culpable, o que no falsificó nada.
8. **Para volver al juego normal**, quien dirige apaga el interruptor entre rondas.

### 4b. Con un solo móvil (también en la demo de un archivo)

Mismo motor, mismas reglas R1–R13 y mismo resultado; cambia solo **cuándo y cómo** se recogen las decisiones secretas, porque en una pantalla compartida el panel de marcas con recuento en vivo diría quién marcó qué.

1. **Preparación.** Interruptor «Prueba falsificable · experimental», apagado por defecto.
2. **Declaración.** Igual que con un móvil por persona: la culpable, en su turno y tras «Soy X», ve dentro de su expediente la elección «No falsifico» / hora / lugar. Nadie más la ve. Después, «Hecho → Ocultar y pasar».
3. **Investigación.** Pantalla compartida. Las pruebas salen como «Sin revisar: puede ser falsa». No hay panel de marcas: una nota dice que se marcará al final. El botón **«Ver un expediente en privado»** (elegir persona → «Soy X» → expediente → «Ocultar y devolver el móvil») sirve para releer el propio expediente; así se entera la persona cómplice de lo que se falsificó (R6), igual que en su móvil. El reloj sigue corriendo.
4. **Fin de la investigación** («Terminar investigación» o el reloj a cero). Si se pulsó el botón, el grupo elige antes en voz alta a quién oír en la última defensa, como en el juego normal. Entonces **el reloj se para** y el móvil pasa por cada persona: «Soy X» → las dos pruebas → «Prueba 1 / Prueba 2 / Ninguna» → «Confirmar y ocultar». No se ve el recuento ni la marca de nadie; la siguiente persona empieza sin nada marcado. La culpable y la cómplice ven además su nota privada.
5. **«Todas las marcas, selladas» → «Ver la revisión».** El motor resuelve exactamente como en R9–R11 (la más marcada; empate por sorteo con la semilla; sin marcas, ninguna) y la defensa, la votación y el veredicto muestran el mismo resultado que en multijugador.

**Diferencias con el multijugador y su efecto**

| | Multijugador | Un solo móvil | Efecto probable |
|---|---|---|---|
| Recuento de marcas | Público y en vivo | Nunca se ve | Sin «efecto rebaño»: cada marca es independiente. La culpable no puede reaccionar al recuento ni orientar la charla con él. Probablemente se revisa más a menudo la prueba que la mesa cree sospechosa y menos por inercia. |
| Cuándo se marca | En cualquier momento de la investigación, cambiable | Una vez, al final, con todo lo hablado | Marcas más informadas. No hay marca «provisional» que dé pistas. |
| Cómplice | Lo ve en su expediente al empezar la investigación | Igual, pero tiene que pedir el móvil («Cuaderno y expediente (en privado») o lo lee en su turno de marcar | Pedir el móvil es visible para la mesa; cualquiera puede hacerlo, así que no delata por sí solo. |
| Reloj | Sigue mientras se marca | Se para durante la ronda de marcas | Ninguno en el resultado: la investigación ya había terminado. |

El recuento público del multijugador no cambia.

---

## 5. Pruebas

| Archivo | Qué comprueba |
|---|---|
| `tests/testimonios-semantica.test.ts` (5) | Las cuatro categorías de la sección 1: una afirmación inventada que el motor acepta y que coincide siendo falsa; una contradicción que no dice quién miente; la mentira destapada solo con un testimonio verdadero; el «sin contraste»; y que antes del veredicto nada dice si un testimonio es cierto. |
| `tests/prueba-falsa-probabilidad.test.ts` (8) | R14–R17 de forma determinista (semillas fijas): 100 % por defecto y protocolo que solo admite 100/50/25; 100 % igual que el prototipo (y la misma ronda que con la variante apagada); frecuencia del 50 % y del 25 % en 2 000 semillas; un único sorteo pese a vistas, acciones repetidas, fases y cambios de ajuste; sin oportunidad, la culpable no puede falsificar pero sí elegir no hacerlo, nadie más lo sabe y el veredicto lo cuenta; con oportunidad, puede no usarla, y las dos revisiones (falsa y auténtica) resuelven igual; las pruebas verdaderas no cambian; mismos puntos que sin la variante; nada de esto en una ronda normal. |
| `tests/prueba-falsa.test.ts` (12) | Desactivada por defecto y sin datos en una ronda normal. Con la variante activa pero sin usar, mismo resultado y mismos puntos. Solo la culpable falsifica, solo durante la declaración y como máximo una vez. No se aceptan falsificaciones imposibles. El protocolo no deja enviar resultados ni campos de más. El ajuste es de quien dirige y la ronda usa su copia. Revisión de la falsa y de una auténtica, empate con sorteo reproducible, sin marcas y marcas que se quitan. Las pruebas verdaderas internas no cambian. La falsa tiene los mismos campos que una auténtica y nada se filtra antes de tiempo. Los puntos son idénticos aunque se descubra la falsa. Funciona con 4, 5, 6 y 10 jugadores, también si quien marcó se desconecta. |
| `tests/prueba-falsa-servidor.test.ts` (3) | Con el servidor Socket.IO real y clientes independientes: una sala normal no envía nada de la variante. Solo quien dirige la activa y solo la culpable falsifica. Todos los clientes reciben el mismo revisión. Ningún socket inocente transporta la falsificación antes del veredicto. Además: con el servidor real, la probabilidad la cambia solo quien dirige y no en plena ronda; el servidor sortea una vez y la respuesta a la culpable no cambia al repetir; ningún otro socket recibe si hubo oportunidad. |
| `e2e/un-movil.mjs` | Un solo móvil, en la app y en el archivo de la demo: partida normal completa de 5 rondas con 5 personas a 320/360/390 px (privacidad en cada traspaso y pantalla compartida, relectura privada, papeles y puntos sumados ronda a ronda contra la clasificación final, nueva partida sin recargar, nada secreto en el almacenamiento del navegador); y con la variante y 6 personas, la falsificación, la nota de la cómplice, la ronda de marcas sin recuento, una revisión que descubre la falsa y otro que revisa la auténtica (este, al acabarse el reloj); accesibilidad con axe. |
| `e2e/prueba-falsa.mjs` | Con navegadores reales (390 y 320 px) y bots: el interruptor; la etiqueta experimental; la elección de la culpable, reversible, desde la interfaz; un expediente inocente sin rastro de falsificación; pruebas «sin revisar», nunca «hecho comprobado»; la marca de revisión, también tras recargar y tras cortar la red; el mismo resultado en los dos móviles; el veredicto; sin desbordamiento a 320 px; accesibilidad con axe. |

---

## 6. Limitaciones conocidas

- **No está equilibrada ni aprobada.** Las cifras de la fase 7 son de bots, y los bots ni inventan testimonios ni hablan. Solo partidas con personas dirán si la variante divierte, si se entiende y si es justa.
- La culpable decide **a ciegas**, durante la declaración, sin ver las coartadas de los demás. Es una simplificación deliberada (sección 2).
- Las marcas de revisión muestran el **recuento** por prueba. Puede orientar la conversación («ya hay 3 en la prueba 2»), y la culpable también lo ve. Es parte del juego, pero hay que observarlo.
- La prueba falsa la anuncia el aviso de «nueva prueba» como cualquier otra, con «Dice que…» y «Sin revisar: puede ser falsa». Si la mesa no lee la etiqueta, puede tomarla por cierta, y ese es justo el riesgo que hay que medir.
- Con un solo móvil, las marcas se recogen al final y sin recuento (sección 4b): no es exactamente la misma dinámica que con un móvil por persona, y conviene no mezclar datos de los dos modos al evaluar la variante. Además, en la ronda de marcas y en la declaración, la culpable y la cómplice ven un texto más que el resto; si tardan más con el móvil, la mesa podría notarlo.
- La probabilidad de oportunidad (R14–R17) es una condición de prueba. Con 50 % o 25 %, un grupo pequeño de rondas puede dar rachas («tres rondas sin oportunidad»): para comparar condiciones hacen falta varias rondas por condición, y conviene anotar en la hoja de cada ronda la probabilidad y lo que dijo el veredicto.
- Que la culpable lea «esta ronda no puedes falsificar» le quita la decisión, y puede declarar algo más rápido. Con un solo móvil, la mesa podría notarlo; con un móvil por persona no se ve.
- No hay simulación de la variante con el motor real: el experimento de la fase 7 sigue aislado en `scripts/experimentos/`.
- La prueba en **móviles físicos** no se ha hecho: todo se ha comprobado con Chromium emulando móviles.

---

## 7. Protocolo de prueba humana (60–90 minutos)

**Objetivo:** decidir con observaciones, no con opiniones sueltas, si la «Prueba falsificable» merece quedarse. Usa el guion, las reglas de intervención y la hoja de `docs/playtest-v1.1.md`.

### 7.1 Formato

| Bloque | Rondas | Ajustes | Para qué |
|---|---|---|---|
| 1 · Base | 2 | Ritmo normal, objetivos y variante **apagados** | Aprender el juego y tener la referencia de ese grupo |
| 2 · Variante | 3 | Variante **activada** | Medir la mecánica |
| 3 · Base | 1 | Variante apagada | Ver si el grupo ha cambiado de nivel o prefiere volver |

- 5–8 personas; con 4 también vale, anotándolo.
- Duración: 10 min de preparación, unos 8 min por ronda y 15 min de preguntas, entre 60 y 90 en total.
- Una persona facilita (mejor si no juega) y otra observa con la hoja y un cronómetro.

### 7.2 Al empezar el bloque 2

Leer tal cual, sin añadir estrategia:

> «En estas rondas la persona culpable puede falsificar una de las dos pruebas. Cada persona puede marcar qué prueba quiere revisar; al acabar la investigación se revisa la más marcada. Si quedan dudas, el botón “?” lo explica.»

### 7.3 Hoja por ronda con variante

| Campo | Cómo se mide |
|---|---|
| Comprensión | Segundos hasta la primera pregunta sobre la variante y su texto exacto. Quién abrió la guía. |
| Falsificación | Lo dice el veredicto: hora, lugar y si se descubrió. |
| Revisión | Qué prueba se revisó, el resultado y cuántas propuestas distintas se oyeron en voz alta. |
| ¿Importa elegir? | Al final de la ronda, a mano alzada: «¿cambió tu voto la revisión?». |
| Estrategia dominante | Si alguien dice una regla fija («siempre la segunda», «nunca falsifiques») y si el grupo la sigue. |
| Suspenso o frustración | Frases textuales al salir el resultado de la revisión y en el veredicto. |
| Resolución final | «¿Has entendido qué se falsificó?» (sí/no) tras el veredicto. |
| Duración | De la declaración al veredicto, con cronómetro. |

### 7.4 Preguntas finales (5 min, cada persona)

1. Explica la variante en una frase.
2. Del 1 al 5: ¿fueron las rondas con variante más interesantes que las normales?
3. Del 1 al 5: ¿te pareció justa?
4. ¿Hubo algún momento en que elegir qué revisar te pareció importante? ¿Cuál?
5. A quien fue culpable: ¿por qué falsificaste, o por qué no?
6. ¿Jugarías la próxima vez con ella activada? (sí / no / me da igual)

### 7.5 Criterios para decidir

Se deciden tras **al menos 3 grupos** y **24 rondas con variante**.

**Conservarla** (seguir probando, desactivada por defecto) si se cumplen todos:
1. Al menos el 80 % explica la regla bien en una frase.
2. La persona culpable falsifica entre el 25 % y el 75 % de las rondas.
3. Cuando hay falsa, la revisión la descubre entre el 30 % y el 85 % de las veces.
4. En al menos la mitad de las rondas con variante se oyen dos o más propuestas de revisión.
5. «Más interesante» tiene una media de 3,5 o más y «justa» una media de 3 o más.
6. El acierto del grupo queda a no más de ±15 pp de sus rondas base (con tan pocas rondas, solo para detectar un desequilibrio grosero).

**Modificar** si se cumplen 1 y 6 pero falla 2, 3 o 4. Ajustes posibles, de uno en uno y documentados:
- permitir falsificar la prueba 2 viendo las coartadas, si nadie falsifica;
- ocultar el recuento de marcas, si siempre se revisa la misma;
- añadir una frase en la guía, si no se entiende el resultado.

**Descartar** si se da cualquiera de estas condiciones:
- menos del 60 % la entiende;
- «justa» tiene una media inferior a 2,5 o hay quejas repetidas de «la app nos engañó»;
- aparece una estrategia fija que todos siguen y vacía la decisión;
- el grupo prefiere de forma clara volver al juego normal (pregunta 6).
