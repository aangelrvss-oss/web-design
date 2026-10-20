# Equilibrio actual y evaluación de variantes

Fase 5. En esta entrega no se implementa ninguna variante de juego. Este documento:

- audita las reglas reales del código;
- mide el equilibrio con simulaciones reproducibles;
- evalúa Informante, Chivatazo anónimo y Observador con datos;
- deja la arquitectura preparada sobre el papel.

Los datos completos están en [`EQUILIBRIO-datos.md`](EQUILIBRIO-datos.md) y salen de `npm run balance -- 2000`: unas 430.000 rondas con semillas fijas. Cualquiera puede regenerarlos y obtendrá los mismos números.

**Ejecutado, no ejecutado y pendiente**

- **Ejecutado:**
  - la auditoría del código;
  - `npm run simulate` (salida idéntica byte a byte antes y después de la refactorización del simulador);
  - `npm run balance -- 2000` (0 rondas bloqueadas o inválidas);
  - las pruebas unitarias del simulador (`tests/sim-core.test.ts`).
- **No ejecutado:** ninguna partida con personas. Nada de lo que depende de la conversación, los faroles o la comprensión de las reglas está medido.
- **Pendiente:** el protocolo de partidas de prueba de la sección 6.4, que es lo que decide si una variante se acepta.

## 1. Reglas verificadas en el código

| Regla | Lo que hace el código | Dónde |
|---|---|---|
| Tamaño de mesa | De 4 a 10. Para empezar hacen falta 4 personas conectadas. | `game.ts:269-270`, `types.ts` |
| Papeles | Una persona culpable siempre; una cómplice desde 6 personas (`rolesFor`). El resto, inocentes. Reparto con la semilla de la ronda. | `generate.ts:38`, `generate.ts:61-69` |
| Lugares | 4 lugares hasta 6 personas y 5 desde 7. El del incidente nunca se descarta. | `generate.ts:34`, `generate.ts:51-57` |
| La noche | Solo la persona culpable está en el lugar del incidente a la hora del incidente. Hay 1 señuelo (2 desde 8 personas): un inocente que coincide con la persona culpable en las dos horas de las pruebas. | `generate.ts:129` |
| Recuerdos | 2 por persona, siempre ciertos («estuviste con X en Z a tal hora»). Nunca sitúan a nadie en el lugar del incidente a esa hora. Recuerdos del bando honesto sobre la persona culpable: 1 con ≤5 personas, 1–2 con más. Entre el 25 % y el 75 % de los no culpables quedan respaldados a la hora del incidente. | `generate.ts:178-240` |
| Pruebas | 2, ciertas, sobre dónde estuvo la persona culpable en las dos horas que no son la del incidente. Se revelan una al empezar la investigación y otra en la segunda parte. | `generate.ts:82`, `game.ts:503-520` |
| Coartadas | 3 horas, se sellan en la declaración. Quien no sella recibe una automática: la verdad, salvo la persona culpable, que evita el lugar del incidente. | `game.ts:320`, `game.ts:584` |
| Testimonios | Hasta 3 por persona; no sobre una misma ni repetidos (misma persona y hora). Dicen «estuve con X» en el lugar que yo declaré. La app los compara solo con la coartada sellada de X: *coincide*, *contradice* o *sin contraste* (nunca con la verdad). | `game.ts:340-357`, `encargos.ts:50` |
| Señalar y Última defensa | Señalamiento secreto, cambiable durante toda la investigación. Defiende la persona más señalada; un empate se decide con un sorteo sembrado. Si nadie señala o la elegida está desconectada, se pasa a votar. | `game.ts:376`, `game.ts:555-581` |
| Votación | Secreta. Si hay empate en cabeza con votos, desempate entre las empatadas. Si el desempate vuelve a empatar o no hay votos, nadie es acusado. | `game.ts:527-548` |
| Puntos | Grupo gana +2 (inocentes, si se acusa a la persona culpable). Culpable escapa +4. Cómplice +3 si la persona culpable escapa. Voto certero +1 (inocente que votó a la persona culpable en la primera votación). Cazador +1 (testimonio cierto que destapó una mentira real, máximo uno por ronda). Objetivo +1. | `types.ts:141`, `game.ts:607-652` |
| Objetivos secretos | Opcionales. 6 tipos: `votes_on`, `no_votes`, `same_vote`, `corroborated`, `contradict` y `claim_zone`, este último obliga a mentir. El servidor los evalúa con datos objetivos. No cambian quién gana. | `encargos.ts` |
| Ajustes | Solo los cambia quien dirige y nunca con una ronda en marcha. Los objetivos se copian en la ronda al empezar (`setup.encargos`). | `game.ts:237`, `game.ts:275` |

### Discrepancias entre documentación y código

Ninguna se ha resuelto en silencio:

1. **`docs/RULES.md`** decía que la ronda dura como máximo 6,8, 7,5 y 8,6 minutos, y que en el ejemplo «Ana defiende 15 s». Eran cifras anteriores a la defensa de 25 s de la fase 3; el código da 7,0, 7,7 y 8,8 minutos. **Corregido en el documento.** El código no se ha tocado.
2. **`docs/VARIANTES-propuesta.md`** resumía los objetivos secretos como «votar a alguien». En el código no existe tal objetivo: `votes_on` pide que otra persona reciba al menos 2 votos y `same_vote` pide votar lo mismo que alguien. Es un resumen impreciso; está anotado en ese documento.
3. **`docs/VARIANTES-propuesta.md`** daba como texto público del chivatazo «[X] miente sobre dónde estuvo a las [H]». Esa frase presenta como hecho una afirmación que nadie ha comprobado, y eso va contra la regla de esta entrega. La evaluación de la sección 6.2 la descarta y pide otra forma.
4. **`publicView`** envía los ajustes actuales de la sala (`settings`), no los de la ronda en juego. Hoy no causa ningún fallo: los objetivos se leen de la ronda (`setup.encargos` y `outcome.encargoDone`). Una variante, en cambio, **debe** leerse de la copia de la ronda, no de `settings`. Lo recoge la sección 7.
5. **`docs/GAME_DESIGN.md`** decía que el efecto de los objetivos secretos «no se ha simulado». Ahora hay una medición parcial (sección 4 de los datos). Actualizado.

## 2. Qué se puede simular con rigor y qué no

El simulador (`scripts/sim/core.ts`) juega rondas completas con el **motor real**: generación, declaraciones, testimonios, señalamientos, defensa, votación, desempate y puntuación. Los bots siguen reglas fijas:

- dicen la verdad salvo la persona culpable;
- publican los recuerdos ciertos que no les perjudican;
- puntúan cada hipótesis por cuántas mentiras necesita;
- votan al favorito, con un desempate común de mesa (o individual, con `independent`).

| Se puede medir con rigor | No se puede medir con bots (hacen falta personas) |
|---|---|
| Si la información de una ronda permite deducir, y cuánto aporta cada fuente | Si la gente entiende las reglas y las variantes |
| Que ninguna ronda se bloquee ni acabe en un estado inválido | Faroles, presión social, quién se cree a quién, el carisma |
| Puntos por papel con un comportamiento fijo | Si alguien persigue su objetivo secreto a propósito |
| El efecto de una información extra, ronda a ronda, con la misma noche | Cuánto se tarda de verdad (los bots no hablan) |
| La frecuencia y la veracidad de un chivatazo según quién lo escribe | Si el informante revela su dato, cuándo y con qué efecto real |

Diseño de las mediciones:

- **Semillas fijas.** `{bloque}-{jugadores}-{estrategia}-{i}`: la misma orden produce siempre los mismos números (`tests/sim-core.test.ts` lo comprueba).
- **Comparaciones emparejadas.** Una ronda con variante es la misma ronda base (misma noche, papeles y declaraciones, como comprueba el test) más la información de la variante. La diferencia se mide ronda a ronda, y así el azar de la noche no se confunde con el efecto de la variante.
- **Intervalos del 95 %.** Wilson para porcentajes; normal para medias y diferencias emparejadas. Con 2.000 rondas por celda, un porcentaje lleva ±2,2 pp.
- **Variantes aisladas.** Las variantes solo existen en el simulador y sacan su azar de un flujo propio. El motor no se toca: `tests/engine-golden.test.ts` lo vigila.

## 3. Resultados del juego base

Todo con bots, en porcentaje de rondas en que el grupo acusa a la persona culpable (IC 95 % en los datos).

| Jugadores | Mezcla de estrategias | Rango según la estrategia de la persona culpable |
|---|---|---|
| 4 | 57,4 % | 47,2 % (esquiva) – 72,9 % (mínimo) |
| 5 | 52,2 % | 42,0 % (esquiva) – 62,1 % (mínimo) |
| 6 | 46,4 % | 39,8 % (total) – 53,6 % (mínimo) |
| 10 | 44,2 % | 42,8 % (total) – 46,4 % (mínimo) |

Lo que **sí** muestran los datos:

- **Ningún bando gana de forma aplastante en ningún tamaño.** La media queda entre el 44 % y el 57 %, muy por encima del azar (votar a otra persona al azar acierta el 33 % con 4 y el 11 % con 10).
- **Con más personas, el grupo acierta algo menos**: unos 13 pp menos de 4 a 10 personas. Por eso la persona culpable gana más puntos por ronda en mesas grandes: 1,71 con 4 frente a 2,23 con 10, y los inocentes 2,03 frente a 1,45.
  - Como los papeles se reparten al azar cada ronda, cada persona espera lo mismo a lo largo de una partida (1,95 puntos por ronda con 4 y 1,55 con 10). No es un desequilibrio entre personas, sino entre papeles.
- **Los testimonios son la fuente principal de información.** Quitarlos baja el acierto entre 7 y 45 pp. Las pruebas valen entre 24 y 30 pp cuando la persona culpable no miente a esas horas.
- **Con criterio de mesa compartido nunca se queda nadie sin acusar.** Si cada uno decide por su cuenta, hay desempates en el 5–28 % de las rondas y nadie acusado en el 0–14 %. Ponerse de acuerdo hablando importa mucho, y eso solo se ve con personas.
- **La persona cómplice casi nunca acaba acusada** (1–4 %).
- **Duración máxima** con ritmo normal: 7,0, 7,7 y 8,8 minutos. **0 rondas bloqueadas** en toda la auditoría.

Lo que **no** demuestran, aunque lo parezca:

- **«Mentir a la hora de una prueba es la mejor estrategia.»** Con bots, «esquiva» o «total» rebajan el acierto del grupo frente a «mínimo»: 26 pp con 4 personas y solo 3,6 pp con 10. Pero es un efecto de la fórmula de los bots:
  - la fórmula cobra cada desajuste con una prueba igual que cualquier otra mentira, y se va al señuelo que sí encaja (de ahí que quitar las pruebas «mejore» a los bots en esa estrategia);
  - una persona sospecharía precisamente de quien no encaja con una prueba.
  
  Es la primera hipótesis a vigilar en partidas reales: ¿escapa más la persona culpable cuando su coartada choca con una prueba?
- **Los objetivos secretos están muy desiguales.** Sin buscarlos, los bots cumplen:
  - «que alguien corrobore tu coartada»: 89 %;
  - «que nadie te vote»: 77 %;
  - «vota como X»: 68 %;
  - «que X reciba 2 votos»: 21 %;
  - «contradice a X»: 2,6 %;
  - «di que estuviste en Z»: 0 % (exige mentir).
  
  Probablemente es un desajuste real de dificultad: unos dan +1 casi gratis y otros casi nunca. Pero los bots publican todos sus recuerdos, y las personas publican menos, así que «corroborado» sería más difícil en una mesa real. No se cambia nada: se recomienda medirlo en partidas reales (sección 6.4) antes de tocar los objetivos.

### Pruebas que faltaban para evaluar el equilibrio

Añadidas en esta entrega:

- **`tests/engine-golden.test.ts`.** Huellas del motor:
  - el reparto, la noche, los recuerdos, las pruebas y los objetivos de los 25 casos con 4–10 personas;
  - la resolución y la puntuación de 36 rondas guionizadas;
  - la tabla de puntos.
  
  Cualquier cambio de reglas, intencionado o no, lo hace fallar.
- **`tests/sim-core.test.ts`.** Comprueba cuatro cosas:
  - el simulador es reproducible;
  - no se bloquea con ningún tamaño ni estrategia;
  - una ronda con variante es la misma ronda base;
  - el chivatazo verificado solo pasa si es cierto.
- **`npm run balance`.** Informe con intervalos, ablaciones de información, objetivos, puntos por papel y variantes emparejadas.

Siguen faltando, y no se pueden hacer con bots:

- datos de partidas reales (sección 6.4);
- un bot que persiga los objetivos secretos. Se podría escribir, pero sería inventar cómo juega una persona.

## 4. Límites de estas cifras

- Los bots no hablan, no mienten fuera de su coartada, no cambian de idea tras la defensa y publican todo lo que les conviene. Los porcentajes miden **la estructura de información**, no el resultado de una mesa real.
- La mesa con criterio compartido es una aproximación al «nos ponemos de acuerdo hablando». La versión independiente es el extremo opuesto. Una mesa real estará en algún punto intermedio.
- Las diferencias pequeñas, de menos de 3 pp, quedan dentro del ruido de cualquier partida de 5 rondas. No justifican cambiar reglas.

## 5. Variantes: resumen comparativo

| | Informante | Chivatazo libre | Chivatazo verificado |
|---|---|---|---|
| Qué añade | Un dato cierto y privado: «X es inocente» | Una acusación anónima sin comprobar | Una mentira comprobada, con autoría anónima |
| Efecto con bots (Δ de acierto del grupo, pp, IC 95 %) | Si se revela y se cree: +13,5 [12,6–14,4] con 4, +11,1 con 5, +9,8 [9,1–10,6] con 6, +3,0 con 10. Si se guarda o hay farol: +3,3 con 4 y 0 desde 5 | +1,3 con 4, +1,9 con 5, **−2,1 con 6, −2,9 con 10** (peso 0,5); crece con el crédito que le da la mesa | +4,3, +3,9, +4,2, +2,7 (peso 1) |
| Veracidad | Siempre cierto | **Solo el 40–54 % es cierto**; el 20–34 % lo escribe el bando culpable y siempre es falso | Siempre cierto |
| Frecuencia | Una vez por ronda | Una vez por ronda | Solo en el 7–13 % de las rondas hay un chivatazo posible |
| Riesgo principal | Con 4–5 personas resuelve demasiado; la revelación inmediata y el farol de la persona culpable | La app difunde con su voz afirmaciones falsas; sesgo hacia el bando culpable desde 6 personas | Casi no añade información (la misma persona podía testificar); la autoría se deduce |
| Complejidad | Baja-media | Media-alta | Media-alta |
| **Recomendación** | **Probar primero, desde 6 personas** | **Descartar** | **En reserva** |

## 6. Evaluación detallada

### 6.1 Informante

> **Revisado en la fase 6** ([`INFORMANTE-evaluacion.md`](INFORMANTE-evaluacion.md)): con bots que solo usan las vistas, una mesa que razona sobre los faroles y la cómplice que encubre, la recomendación pasa a ser **no implementar el Informante libre**. Lo que sigue se conserva como registro de la fase 5.

**Objetivo.** Dar a una persona inocente algo que contar o callarse, y crear un farol posible: «yo soy el informante». Todo sin tocar papeles, pruebas ni puntos.

**Reglas en lenguaje llano.**

- Si la variante está activada y hay suficientes personas, la app elige en secreto a una persona inocente como informante.
- Su expediente dice: «Sabes con certeza que [X] es inocente». X es otra persona inocente, nunca la culpable ni la cómplice.
- Todo el mundo sabe que en la ronda hay un informante, pero no quién es.
- El informante decide si lo cuenta y cuándo. La app no lo publica nunca.
- Al final se revela quién era y a quién confirmó.

**Qué sabe cada papel.**

| Papel | Qué sabe |
|---|---|
| Informante | Que X es inocente. |
| X | Nada nuevo. |
| Resto de inocentes | Que existe un informante. |
| Culpable y cómplice | Que existe un informante; pueden decir que lo son. |

**Información y momento.** El dato existe desde la declaración. Si se cuenta pronto, quita una sospechosa de N−1 desde el principio. En la simulación:

- los favoritos empatados del bot bajan poco (1,14 → 1,10 con 4 personas, 1,25 → 1,20 con 6);
- el acierto del grupo sube mucho si la mesa lo cree.

El problema no es cuántos sospechosos quita, sino que confirma a una persona que la mesa quizá iba a culpar (por ejemplo, el señuelo).

**¿Revelar enseguida es una estrategia dominante?** Para el informante, sí: callarlo vale casi 0 pp desde 5 personas, y contarlo y ser creído vale entre +10 y +13 pp con 4–6. La respuesta natural del bando culpable es reclamar también el papel. Si la mesa no puede decidir a quién creer, la variante queda en «dos afirmaciones que se anulan», igual que si se callara. Es un equilibrio sano, porque genera exactamente la conversación buscada, pero hay que comprobar que no se vuelve automático en todas las rondas.

**Suplantación.** Una persona culpable que dice ser informante y «confirma» a alguien no gana nada directamente: confirmar a cualquier no culpable ayuda al grupo. Su valor está en desacreditar al informante real.

- **Riesgo:** frustración de quien sí era informante y no fue creído.
- **Mitigación:** la regla tiene que explicarse en una línea («cualquiera puede decir que es el informante»), y en el veredicto se revela quién lo era.

**Efecto por tamaño (si se revela y se cree).**

| | 4 | 5 | 6 | 10 |
|---|---|---|---|---|
| Acierto del grupo, base → con variante | 57,4 → 70,9 % | 52,2 → 63,3 % | 46,4 → 56,3 % | 44,2 → 47,2 % |
| Diferencia | +13,5 pp | +11,1 pp | +9,8 pp | +3,0 pp |

Con 4 y 5 personas supera el umbral de +10 pp que el propio documento de la fase 4 había fijado antes de medir. Con 6 queda justo debajo, en el límite de su intervalo. Con 10 apenas se nota.

**Alternativas comparadas.**

| Alternativa | Ventaja | Inconveniente | Veredicto |
|---|---|---|---|
| Mínimo de 6 personas | Respeta el umbral de +10 pp que se fijó antes de medir; el cómplice existe y el farol tiene más sentido | Con 4–5 no hay variante | **Elegida para probar** |
| Mínimo de 5 personas | Más mesas pueden usarla | +11,1 pp, por encima del umbral | Rechazada por los datos |
| Que el informante solo confirme a alguien que no sea un señuelo | Evita resolver el caso de golpe | Es una regla oculta difícil de explicar, y revela algo de la estructura de la noche | Rechazada: filtra información del generador |
| El dato llega al salir la prueba 1 | No hay revelación inmediata en la declaración | Más estados y más texto; los bots no pueden medir el momento | Probar solo si las partidas reales muestran revelación inmediata en más del 80 % de las rondas |
| El informante confirma a cualquier no culpable (también a la cómplice) | Más farol: la cómplice puede quedar «limpia» | Ayuda al bando culpable de forma poco transparente | Rechazada |

**Cambios necesarios (no hechos).**

| Parte | Cambio |
|---|---|
| Motor | Un paso aislado después de `generateRound`, con su propio flujo de azar: `setup.informant = { id, cleared }`. La puntuación no cambia. |
| Protocolo | `room:settings` admite `variant: 'informante' \| null`. No hay mensajes nuevos. |
| Vistas | `privateView.informant`, solo para esa persona. `publicView`: la etiqueta de la variante, leída de la ronda. `reveal`: informante y persona confirmada. |
| Interfaz | Interruptor «Experimental» en la sala de espera (solo quien dirige, desactivado con menos de 6 personas), etiqueta en la cabecera del caso, una línea en el expediente, una línea en el veredicto, una línea en la guía rápida solo si está activa. |

**Pruebas.** Unitarias del reparto:

- el informante es inocente;
- la persona confirmada es inocente y distinta del informante;
- con la variante desactivada no existe;
- con menos de 6 personas no existe.

Además:

- **Privacidad.** Nadie más recibe `informant` antes del veredicto. Hay que comprobarlo sobre las tramas reales, como en `e2e/match.mjs`.
- **Huellas de oro.** Las actuales siguen idénticas con la variante desactivada, y con ella activa la noche base no cambia (flujo de azar propio).
- **Puntos.** Mismas votaciones, mismos puntos con o sin variante.
- **E2E** con la variante activada y sin ella.
- **Simulación** emparejada.

**Métricas de equilibrio.** Diferencia emparejada del acierto del grupo por tamaño, más los datos de partidas reales de la sección 6.4.

**Criterios de aceptación.** Se acepta si se cumplen todos:

- en la simulación, aumento ≤ +10 pp en todos los tamaños habilitados (cumple desde 6);
- en partidas reales, con al menos 30 rondas con variante en al menos 3 grupos:
  - acierto del grupo entre el 35 % y el 65 %;
  - al menos el 80 % de las personas explica la regla bien tras una ronda;
  - el informante se revela antes de la prueba 1 en menos del 80 % de las rondas;
  - la persona culpable reclama el papel en menos del 80 % de las rondas.

**Criterios de rechazo.** Se rechaza si se da cualquiera:

- acierto del grupo superior al 70 % con la variante;
- el dato del informante decide la votación en más de la mitad de las rondas;
- quejas de frustración repetidas («no sirve de nada ser informante»).

**Complejidad y riesgo.** Unas 40 líneas en el motor, 3 campos de vista y 5 puntos de interfaz. Riesgo bajo: no toca puntuación ni fases, y se apaga con un ajuste.

**Recomendación: probar primero**, desde 6 personas, desactivada por defecto.

### 6.2 Chivatazo anónimo

**Objetivo.** Introducir una sospecha anónima que el grupo tenga que valorar.

**¿Quién puede emitirlo y qué sabe de verdad?** Cualquiera puede ser el autor, pero nadie sabe con certeza si otra persona mintió:

- una persona inocente solo sabe sus 2 recuerdos;
- la persona culpable conoce la verdad de la ronda, pero tiene interés en mentir.

Por eso la versión libre (escoger persona y hora) produce mayoritariamente afirmaciones sin base o falsas:

- solo el **40–54 %** de los chivatazos libres es cierto;
- el **20–34 %** lo escribe el bando culpable, y siempre es falso;
- otro 22–26 % son inocentes que señalan a su sospechoso y se equivocan.

**Sesgo hacia un bando.**

| Personas | Efecto de la versión libre |
|---|---|
| 4–5 | Ayuda un poco al grupo (de 0 a +6 pp según el crédito que se le dé). |
| 6 y 10 | **Ayuda al bando culpable** (−1 a −4,5 pp), porque hay dos autores posibles del bando culpable. Cuanto más crédito le da la mesa, peor. |

**Contradicción con lo ya revelado y presentación como hecho.** Un chivatazo libre puede acusar de mentir a una persona cuya coartada ya respaldan una prueba y varios testimonios. Si la app lo muestra con su propia voz («X miente…»), presenta como hecho una afirmación no verificada. **Eso no se puede implementar** (regla de esta entrega). Reformularlo como «alguien dice que…» lo deja en un testimonio anónimo sin firma ni coste: elimina la responsabilidad que hace interesantes los testimonios.

**Versión condicionada a un hecho verificable («chivatazo verificado»).**

- **Regla.** Solo se puede enviar si uno de los recuerdos del autor contradice la coartada sellada de X («a las H estuve con X en Z y X declaró otro sitio»). En ese caso el servidor lo publica como «Consta que X no estuvo a las H donde declaró», que es un hecho comprobado.
- **Lo que mide la simulación:**
  - siempre es cierto;
  - nunca lo puede usar el bando culpable contra sí mismo;
  - solo está disponible en el **7–13 %** de las rondas;
  - con bots siempre señala a la persona culpable;
  - aumenta el acierto del grupo entre +2,7 y +4,3 pp.
- **Pero no añade información nueva.** El autor podía publicar ese mismo testimonio con su nombre, y el testimonio ya se marca como *contradice*. Lo único que aporta es:
  - **anonimato**: que solo se puede valorar con personas;
  - **certeza de cuál de los dos miente**: hoy *contradice* significa «al menos uno de los dos miente», y el chivatazo verificado lo resuelve. Eso hace más fácil destapar a quien miente por un objetivo secreto (`claim_zone`), lo que choca con ese diseño.
- **Filtración de autoría y estado.** El hecho publicado delata la hora y, si se muestra, el lugar. La autoría queda entre quienes declararon ese lugar a esa hora, a veces una sola persona. Para no filtrarla habría que ocultar el lugar, y el hecho sería menos útil. El servidor también revelaría que existe un recuerdo que contradice esa coartada, un dato del generador que hoy nunca sale.

**Cambios que exigiría (no hechos).**

| Parte | Cambio |
|---|---|
| Motor | Turno con plazo dentro de la investigación. |
| Protocolo | Un mensaje nuevo (`game:tip`) y su validación contra los recuerdos. |
| Vistas | Aviso público, aviso privado al autor y revelación en el veredicto. |
| Interfaz | Hoja para escoger el recuerdo y aviso para todos. |
| Pruebas | Privacidad de red del autor, plazo, autores falsos y recuerdos que no contradicen. |

**Métricas y criterios.** Si algún día se prueba la versión verificada:

- se acepta si en partidas reales aparece en ≥ 15 % de las rondas y la mesa no adivina al autor en más de la mitad de los casos;
- se rechaza si la autoría se deduce casi siempre o si desanima los objetivos que obligan a mentir.

**Complejidad y riesgo.** Media-alta: un estado nuevo dentro de una fase con temporizador y un mensaje nuevo. Riesgo medio: privacidad, y fases que hoy ya están probadas.

**Recomendación.**

- Versión libre: **descartar**. Es falsa en la mitad de los casos, favorece al bando culpable desde 6 personas y no se puede presentar sin dar por cierto lo que no lo es.
- Versión verificada: **en reserva**. Es poco frecuente, casi redundante con los testimonios, y tiene una autoría frágil.

### 6.3 Otras propuestas

- **Observador** (reserva de la fase 4). Una persona inocente pregunta en privado a la app si la coartada de alguien a una hora sin incidente es cierta. Aporta algo distinto: una decisión (a quién y cuándo preguntar). Pero solapa con el informante y con las pruebas. No se ha simulado, porque exigiría modelar a quién pregunta un humano. Solo tendría sentido si el informante resulta débil en partidas reales, y nunca a la vez que él.
- **Confidente, Doble agente, Prueba inesperada, Coartada bajo revisión y Última oportunidad** siguen descartadas por los motivos de `VARIANTES-propuesta.md`: repiten mecanismos que ya existen. Los datos de esta auditoría no cambian ese juicio.
  - La «Prueba inesperada» sería, en la tabla de ablaciones, una tercera prueba. Las pruebas ya valen entre 24 y 30 pp, así que una tercera inclinaría claramente el juego hacia el grupo.

### 6.4 Qué medir en partidas reales (protocolo mínimo)

Por ronda, en una hoja (se puede apoyar en `docs/playtest-v1.1.md`), se anota:

- número de personas;
- caso;
- variante;
- quién era la persona culpable;
- si su coartada chocaba con alguna prueba;
- si se la acusó;
- si hubo desempate;
- cuánto duró la ronda;
- con informante: si el informante se reveló y cuándo (declaración, prueba 1, prueba 2 o nunca), si la persona culpable reclamó el papel y si el dato decidió el voto (pregunta abierta al final);
- con objetivos activados: qué objetivo tenía cada persona y si lo persiguió a propósito.

Al final se pregunta a cada persona si sabría explicar la variante en una frase.

## 7. Arquitectura para incorporar variantes (propuesta, sin implementar)

Corrige y concreta la sección 4 de `VARIANTES-propuesta.md`:

1. **Desactivadas por defecto y de una en una.** `Settings.variant: 'informante' | null`, `null` por defecto. Un solo valor en vez de un objeto de interruptores, así no hay combinaciones incompatibles que validar.
2. **Configuración explícita, copiada al empezar la ronda.** `startRound` copia la variante en `round.setup.variant` solo si se cumple su condición (por ejemplo, 6 o más personas). Si no se cumple, copia `null`: la ronda registra que se jugó sin variante y la interfaz lo dice. Vistas, interfaz y veredicto leen **siempre** `setup.variant`, nunca `settings` (discrepancia 4). Así ningún cliente puede ver una configuración distinta a la que se está jugando, aunque quien dirige cambie el ajuste entre rondas.
3. **Validación en el servidor.** `room:settings` acepta solo valores conocidos (esquema zod estricto, como hoy) y `updateSettings` sigue rechazando cambios con una ronda en marcha. Ningún mensaje del cliente puede crear, cambiar ni leer el dato de una variante.
4. **Responsabilidades aisladas.** Un archivo por variante (`src/shared/engine/variants/informante.ts`) con una función pura que recibe la ronda y la semilla y devuelve su dato. Usa un flujo de azar propio (`${seed}|informante`), para que la noche, los papeles y las pruebas sean idénticos con y sin variante. Ni `computeOutcome` ni la puntuación saben que existe.
5. **Protocolo.** Solo se amplía el esquema de ajustes. El informante no necesita mensajes nuevos.
6. **Sin saltarse validaciones.** La variante no puede cambiar papeles, pruebas, testimonios, votos ni puntos; solo añade un campo de vista privado. Una prueba compara la puntuación de las mismas votaciones con y sin variante.
7. **Apagar no rompe nada.** Con `variant = null` el motor no ejecuta ninguna línea de la variante. `tests/engine-golden.test.ts` debe seguir pasando sin cambiar ni una huella; si una huella cambia, la variante se ha colado en el juego base.
8. **Sin migraciones ni abstracciones generales.** Las salas viven en memoria; no hay sistema de plugins ni registro de variantes. Retirar una variante es borrar su archivo, el valor del tipo y sus campos de vista.

## 8. Orden recomendado

1. **Ahora:** nada nuevo en el juego. Jugar 3–5 partidas reales con el juego base midiendo lo de la sección 6.4. Es la forma de saber si «mentir a la hora de una prueba» y los objetivos fáciles son problemas reales o efectos de los bots.
2. **Después:** implementar el Informante desde 6 personas, siguiendo la sección 7, y probarlo en partidas reales con los criterios de la sección 6.1.
3. **Solo si el informante resulta débil o la mesa pide más:** valorar el Observador o el chivatazo verificado, con su propio protocolo.
