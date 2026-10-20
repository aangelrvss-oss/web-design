# Mecánicas estratégicas: tres propuestas y una recomendación (fase 7)

Datos reproducibles: [`MECANICAS-datos.md`](MECANICAS-datos.md), generados con
`npx tsx scripts/experimentos/mecanicas/informe.ts 1500`: 1.500 rondas por tamaño (4, 5, 6 y 10 jugadores), motor real y semillas fijas. Cada ronda se resuelve con las 66 combinaciones de estrategias de las cuatro opciones (69 desde 6 jugadores) sobre copias del mismo estado.

**Ejecutado, no ejecutado y pendiente**

- **Ejecutado:**
  - lectura y contraste de los cuatro informes anteriores con el código;
  - diseño de tres mecánicas;
  - experimento aislado con varias estrategias por bando y análisis de equilibrio;
  - pruebas unitarias del experimento;
  - regresión (sección 9).
- **No ejecutado:** ninguna partida con personas. Nada de este documento dice si una mecánica es divertida, se entiende o genera conversación; eso solo lo dirán las partidas de la sección 8.
- **No implementado:** ninguna mecánica existe en la app. No se han tocado el motor, el protocolo, las reglas, la puntuación, los papeles, los tiempos ni las ilustraciones.

---

## 0. Resumen

| | Testigo de una hora (referencia) | **M1 · Prueba falsificable** | M2 · Registro en la defensa | M3 · Archivar el caso |
|---|---|---|---|---|
| Idea | Un inocente sabe dónde estuvo alguien a una hora | El culpable puede falsificar una prueba; la mesa tiene un peritaje | Quien defiende puede registrar un lugar a la hora del incidente | Se puede votar «archivar»: nadie es acusado y todos cobran poco |
| ¿Cambia quién gana? (equilibrio frente a la base, pp) | +18 / +14 / +4 / +2,5 | **+0,6 / +0,1 / +1,3 / +1,2** | +28 / +29 / +23 / +21 | Archiva el 0–69 % de las rondas, según el tamaño |
| ¿Hay farol? (los dos bandos mezclan estrategias) | No: «lo cuenta» domina | **Sí, con 4, 6 y 10** | No | No |
| ¿Pesa la decisión del grupo? (pp entre su mejor y su peor opción) | 18 / 14 / 4 / 2 | **6 / 1 / 12 / 13** | 0–18 | Casi nada (±0,1 puntos por ronda) |
| ¿Cambia la puntuación? | No | **No** | No | **Sí** (y añade un empate) |
| Veredicto | Referencia; demasiado fuerte con 4–5 | **Recomendada para el siguiente prototipo** | Descartada como está: resuelve demasiado | Descartada: o no se usa o apaga el final |

**Recomendación: prototipar M1, «Prueba falsificable».** Es la única de las cuatro que:

- añade una decisión con ventajas y costes a **los dos** bandos (el culpable: falsificar o no, y qué prueba; la mesa: qué peritar y cuánto fiarse);
- en equilibrio, obliga a los dos a mezclar sus estrategias, que es la huella del farol;
- deja la tasa de acierto prácticamente igual que la base, porque cambia cómo se gana y no quién gana;
- trabaja sobre las pruebas, la fuente de información más importante del juego, sin tocar papeles, puntos ni victoria.

Su riesgo principal es social: una mesa que se fía de todo pierde mucho (cae al 22–28 % con 6 y 10 jugadores si perita la prueba equivocada). Además, la app no puede presentar como hecho una prueba que puede ser falsa; eso se resuelve con la presentación (sección 7.3).

---

## 1. Contraste de los informes anteriores con el código y los datos

| Afirmación (informe) | Comprobación | Resultado |
|---|---|---|
| El Informante no existe en la app (`INFORMANTE-evaluacion.md`) | Búsqueda en `src/` y test de aislamiento | **Correcto.** Tampoco existe ninguna mecánica de esta fase (test nuevo). |
| Revelar es la estrategia dominante del informante (`INFORMANTE-evaluacion.md`, 4.2) | Repetido con semillas nuevas (`f7-`) para el Testigo de una hora | **Confirmado.** «Lo cuenta» es la estrategia pura de equilibrio en los cuatro tamaños. |
| Testigo de una hora: +4,7 / +1,9 pp con 6 / 10 jugadores (`INFORMANTE-datos.md`) | Mismo cálculo, otras semillas | **Coherente:** +3,6 [2,7–4,5] y +2,5 [1,7–3,3] pp, dentro del ruido. Con 4–5 jugadores, +18 y +14 pp. |
| Una tercera prueba inclinaría el juego hacia el grupo (`EQUILIBRIO-y-variantes.md`, 6.3) | M2 es, en la práctica, información extra fiable | **Confirmado:** de +19 a +29 pp. |
| Los bots solo publican recuerdos ciertos (`EQUILIBRIO-y-variantes.md`, 2) | `src/shared/engine/game.ts`, `testify` | **Hallazgo nuevo.** El motor **no comprueba** que un testimonio salga de un recuerdo. Cualquiera, también el culpable, puede inventar «estuve con X a las H». Si X declaró ese sitio, la app lo marca como *coincide*. El juego base ya permite este engaño y **ningún simulador lo modela.** Todas las cifras, de esta fase y de las anteriores, subestiman el engaño del culpable mediante testimonios. *(Fase 8: revisado en `PRUEBA-FALSA.md`, sección 1. Es una regla deliberada y documentada —«Can be true or false»—, no una discrepancia: la interfaz ya avisa de que «coincide» no significa «verdad». La limitación es de los simuladores.)* |
| «Mentir a la hora de una prueba» no domina si la mesa se adapta (`INFORMANTE-evaluacion.md`, 2.5) | Sin cambios de código | Sigue vigente; M1 lo aprovecha (sección 3). |
| `VARIANTES-propuesta.md` y `EQUILIBRIO-y-variantes.md` recomendaban el Informante desde 6 | Ya anotado en la fase 6 | Sin cambios. |

---

## 2. Qué se puede simular, antes de mirar resultados

| Mecánica | Se modela fielmente | Se modela de forma aproximada | No se puede modelar |
|---|---|---|---|
| Testigo de una hora | El dato, las afirmaciones, el «uno de los dos miente» | Elección del dato falso del culpable | Cuándo se revela; credulidad real de la mesa |
| M1 · Prueba falsificable | La falsificación, el peritaje, qué permite deducir una prueba en duda (con una deducción probada que nunca descarta al culpable verdadero) | Elección del lugar falso (al azar o el más concurrido); la mesa como un único criterio (sin discusión) | Si la mesa sospecha de quien insiste en peritar; el enfado al descubrir una prueba falsa |
| M2 · Registro en la defensa | El número del registro y lo que implica (probado: nunca descarta al culpable verdadero) | Por qué registra cada defensor y qué deduce la mesa de ello | La defensa hablada; que el culpable evite que le señalen |
| M3 · Archivar el caso | Recuento y puntos | Cuándo «duda» la mesa (un umbral fijo sobre la ventaja de su favorito) | Persuasión para archivar; la puntuación relativa en una partida larga |

Limitaciones comunes a todas:

- los bots no inventan testimonios (sección 1);
- la mesa comparte un criterio, así que vota casi en bloque;
- nadie cambia de idea tras la defensa;
- la estrategia de declaración del culpable rota entre tres fijas.

**Por eso las tasas de victoria no bastan para decir que una variante está equilibrada.** Se miden además:

- si en equilibrio algún bando tiene una estrategia dominante, o si los dos tienen que mezclar;
- cuánto pesa cada decisión;
- cuánto estrecha la información (sospechosos posibles al votar);
- cuántas veces se acusa a un señuelo.

---

## 3. M1 · Prueba falsificable

**Regla, en lenguaje sencillo.**

> Con esta variante, una de las dos pruebas puede ser falsa. Al declarar, la persona culpable puede falsificar una prueba: elige cuál y qué lugar dirá. En vez de falsificarla al declarar, puede falsificar la prueba 2 durante la primera parte de la investigación. Durante la investigación, cada persona marca en secreto qué prueba quiere peritar. Al terminar, se perita la más marcada: la app dice a todos si es auténtica y, si era falsa, cuál era la verdadera. Solo hay un peritaje por ronda.

- **Decisión interesante.**
  - **Culpable:** falsificar o no.
    - Falsificar le aleja de una prueba que le encaja.
    - Si la descubren, la mesa recupera la verdadera y sabe que hubo trampa.
    - Si no falsifica, el peritaje se gasta en balde, pero la mesa puede desconfiar igualmente.
    - Si falsifica, decide cuál: la 1 se decide a ciegas; la 2 puede esperar a ver las coartadas.
    - Y decide qué lugar pone: uno concurrido es más creíble y señala a más gente.
  - **Mesa:** qué prueba peritar (la que menos encaja con las coartadas no siempre es la falsa) y cuánto fiarse de la que no se perita.
  - **Cada inocente:** defender su marca de peritaje en la conversación.
- **Qué sabe cada papel.**
  - Culpable: dónde estuvo de verdad, así que sabe qué dicen las pruebas auténticas, y si ha falsificado.
  - Cómplice (desde 6): se le avisa de qué prueba ha falsificado su pareja; se conocen, como hoy.
  - Inocentes: que la variante está activa y que una prueba puede ser falsa; nada más.
  - Nadie recibe información que hoy no le corresponda.
- **Qué gana y qué arriesga cada bando.**
  - Culpable: gana desligarse de una prueba sin mentir en su coartada, o incriminar a quien declaró el lugar falso. Si le descubren, todos saben que la otra prueba es auténtica y conocen la verdadera.
  - Grupo: con un buen peritaje recupera toda la información. Si perita mal y se fía, pierde mucho; si desconfía siempre, pierde un poco de deducción en cada ronda.
- **Respuesta del bando contrario.**
  - El grupo responde con el peritaje y con la duda razonada: buscar qué prueba no encaja con ningún señuelo posible.
  - El culpable responde eligiendo qué falsificar y cómo. Puede no falsificar para que el grupo desconfíe en balde. Y puede marcar para peritaje la prueba auténtica para gastar el peritaje (con un solo voto, poco eficaz salvo en empates).
- **Por tamaño** (equilibrio frente a la base):
  - 4 jug.: +0,6 pp. Los dos bandos mezclan 3 estrategias.
  - 5 jug.: +0,1 pp. Casi no se falsifica en equilibrio: la mecánica queda latente.
  - 6 jug.: +1,3 pp. Mezclan 2 y 2.
  - 10 jug.: +1,2 pp. Mezclan 2 y 2.
  - Con 6 y 10, elegir mal el peritaje y fiarse cuesta 15–20 pp (22–28 % frente al 42–45 % base).
- **Casos extremos.**
  1. Si el culpable falsifica la prueba de la hora en que mintió, para que le encaje, encaja con las dos y se delata como si fuera un señuelo. Es un error del culpable, no de la regla.
  2. Si la falsa coincide con la coartada de un único inocente, ese inocente queda muy señalado. Es el engaño buscado, y el peritaje es su respuesta.
  3. Si nadie marca peritaje, no hay peritaje.
  4. Con 4 jugadores, «la que menos encaja» descubre la falsa el 88 % de las veces. Una mesa atenta neutraliza el farol, aunque no gratis.
  5. Al revelar el veredicto se muestra la prueba falsa y quién la puso, para que nadie sienta que la app le mintió.
- **Puntuación y victoria:** sin cambios.
- **Complejidad técnica.** Media.
  - Motor:
    - una acción privada del culpable, que elige prueba y lugar en la declaración (o la prueba 2 en la primera parte);
    - la ronda guarda la prueba mostrada y la auténtica;
    - la marca de peritaje funciona como «señalar»: secreta, cambiable y contada al final de la investigación.
  - Protocolo: dos mensajes nuevos (falsificar, marcar peritaje).
  - Vistas: `traces` muestra la versión visible y su estado (sin peritar, auténtica o falsa).
  - Interfaz:
    - un paso en la declaración del culpable;
    - el botón de marcar en cada prueba;
    - el aviso del resultado;
    - una línea en la guía y otra en el veredicto.
  - Riesgos técnicos:
    - que la prueba auténtica no se filtre en `publicView` antes del peritaje (una prueba de privacidad sobre las tramas, como en `e2e/match.mjs`);
    - que con la variante desactivada no cambie ninguna huella de `tests/engine-golden.test.ts`.
- **Qué comprueba la simulación y qué no.**
  - Sí: el equilibrio, el peso de las decisiones, la tasa de falsas descubiertas y lo que pierde una mesa crédula.
  - No: si la mesa disfruta discutiendo qué peritar, si el culpable se atreve, si el descubrimiento de una falsa se vive como un buen momento o como trampa, ni el efecto de los testimonios inventados.

## 4. M2 · Registro en la defensa

**Regla.**

> Durante su Última defensa, quien defiende puede pedir un registro: elige un lugar y la app dice a todos cuántas personas estaban de verdad allí a la hora del incidente (solo el número).

- **Decisión interesante (en teoría).**
  - Inocente que defiende: registrar su propio lugar para limpiarse (el número cuadrará) o el de su sospechoso para cazar.
  - Culpable que defiende: no puede registrar su lugar sin delatarse (faltaría una persona), así que finge cazar.
- **Qué sabe cada papel.** Lo de hoy; el número es nuevo y público.
- **Gana y arriesga.**
  - Inocente: limpiarse frente a ayudar a cazar.
  - Culpable: su farol es parecer altruista.
  - Cómplice: puede haber mentido a la hora del incidente para enturbiar el número.
- **Respuesta del contrario.** Desconfiar de quien no registra su lugar. El culpable intenta que no le señalen.
- **Por tamaño:** +28, +29, +23 y +21 pp. Con la versión «solo un lugar ajeno», +28, +29, +23 y +19 pp.
  - Ningún bando mezcla: la estrategia pura del grupo es siempre la misma, y la del culpable no importa.
  - El efecto viene casi todo de que el inocente que defiende (a menudo el señuelo) se limpia o caza al culpable. Esas rondas pasan del 0 % al 35–66 % de acierto.
- **Casos extremos.**
  - La mentira del culpable a la hora del incidente **siempre** deja un hueco de una persona en el lugar que declaró, así que un registro es un detector directo.
  - Con 4–5 jugadores casi resuelve la ronda.
- **Puntuación y victoria:** sin cambios.
- **Complejidad:** media-baja (una acción en la defensa y un número público).
- **Simulación:** el número y su deducción son exactos. Por qué registra cada cual y cómo lo lee la mesa son aproximados.
- **Veredicto: descartada como está.** Convierte la defensa en una prueba casi definitiva y no crea farol. Para tenerla en cuenta tendría que registrar una hora sin incidente, donde solo atrapa a quien miente fuera de esa hora. Esa versión no se ha simulado: sería otra propuesta.

## 5. M3 · Archivar el caso

**Regla.**

> En la votación hay una opción más: «Archivar el caso». Si es la más votada, no se acusa a nadie: la persona culpable gana 2 (en vez de 4), la cómplice 1 (en vez de 3) y cada inocente 1.

- **Decisión interesante (en teoría).**
  - La mesa tiene que decidir cuánta seguridad necesita para acusar.
  - El culpable decide si empuja hacia una acusación equivocada (+4) o, cuando está en peligro, hacia el archivo (+2 en vez de 0). Eso puede delatarle.
- **Qué sabe cada papel.** Lo de hoy.
- **Gana y arriesga.**
  - Archivar protege de acusar a un inocente, pero renuncia a los +2 del grupo.
  - Para el culpable, el archivo es un seguro.
- **Respuesta del contrario.** Fijarse en quién empuja a archivar: entre el 10 % y el 55 % de esos votos son del bando culpable cuando está en peligro.
- **Por tamaño.** Con el mejor umbral para los inocentes:
  - con 4–5 se archiva el 64–69 % de las rondas;
  - con 6 lo mejor es no archivar nunca;
  - con 10 se archiva el 46 %.
  - Las diferencias de puntos entre umbrales son de ±0,1 por ronda: **los inocentes casi no ganan nada archivando**, solo cambian finales de acusación por finales en blanco.
- **Casos extremos.** Con 10 jugadores y una mesa prudente se archiva el 97 % de las rondas: la partida pierde su clímax.
- **Puntuación y victoria: sí cambian**, y se añade un empate. Necesitaría autorización expresa.
- **Complejidad:** baja-media (una opción de voto y una regla de puntos).
- **Simulación:** el recuento y los puntos son exactos; la «duda» es un umbral fijo. La persuasión y la puntuación relativa en una partida larga necesitan personas.
- **Veredicto: descartada.** Cuando se usa, apaga el final; cuando no, no aporta nada. Y toca la puntuación.

## 6. Referencia: Testigo de una hora

Regla y análisis completos en `INFORMANTE-evaluacion.md` (alternativa F).

Con las semillas nuevas, el equilibrio es +18 / +14 / +3,6 / +2,5 pp, con «lo cuenta» como estrategia dominante del informante en todos los tamaños. Desde 6 jugadores su efecto es pequeño, pero sigue sin crear una decisión real para quien lo recibe. El farol solo lo tiene el bando culpable (fingir ser el informante), y con 4–5 jugadores le sale caro.

## 7. Decisión

### 7.1 Tabla comparativa

| Criterio | Testigo de una hora | **M1 · Prueba falsificable** | M2 · Registro en la defensa | M3 · Archivar el caso |
|---|---|---|---|---|
| 1. Decisiones con ventajas y costes | Solo el bando culpable (fingir); el informante siempre revela | **Los dos bandos**, con riesgo real en cada opción | En teoría sí; en la práctica una opción domina | La mesa sí, pero apenas cambia sus puntos |
| 2. Contrajuego para ambos | Parcial | **Sí** (falsificar frente a peritar; desconfiar frente a no falsificar) | No (el culpable no tiene respuesta útil) | Parcial (el voto de archivo delata) |
| 3. Usa lo existente | Coartadas y pruebas | **Pruebas, coartadas y señalar** (la marca de peritaje funciona como «señalar») | Defensa y coartadas | Votación |
| 4. No revela al culpable | Con 4–5 casi (+14 a +18 pp) | **Sí** (+0,1 a +1,3 pp) | **No** (+19 a +29 pp) | Sí |
| 5. Nadie queda fuera | Sí | Sí | Sí | Sí |
| 6. Pocas reglas nuevas | 2 frases | 4 frases | 1 frase | 1 frase y una regla de puntos |
| 7. Opcional y aislable | Sí | Sí | Sí | Sí, pero cambia la puntuación |
| 8. Sin información indebida | Sí | Sí | Sí | Sí |
| 9. Distinta de objetivos y testimonios | Sí | **Sí** (la primera que hace dudar de la app, no de una persona) | Sí | Sí |
| Equilibrio frente a la base | +18 / +14 / +4 / +2,5 pp | **+0,6 / +0,1 / +1,3 / +1,2 pp** | +28 / +29 / +23 / +21 pp | 0–69 % de rondas archivadas |
| Farol en equilibrio | No | **Sí** (con 4, 6 y 10 jugadores) | No | No |
| Riesgo principal | Revelar domina; demasiado fuerte con 4–5 | Mesa crédula castigada; la app «muestra» algo falso | Resuelve la defensa | Final sin clímax |
| Complejidad | Media | Media | Media-baja | Baja-media |

### 7.2 Por qué M1 aporta más valor

1. **Es la única que cambia cómo se juega sin cambiar quién gana.** Su equilibrio queda a 0–1,3 pp de la base, y la decisión de la mesa vale entre 6 y 13 pp con 4, 6 y 10 jugadores. Hay mucho en juego sin desequilibrar.
2. **Tiene farol de verdad.** En equilibrio, el culpable falsifica unas veces sí y otras no, y la mesa reparte el peritaje y su confianza. Ninguna respuesta fija gana siempre. Ni el Testigo de una hora ni M2 lo consiguen: los dos tienen una estrategia dominante.
3. **Aprovecha la pieza más fuerte del juego, las pruebas, y la vuelve discutible.** El análisis de la fase 6 mostró que leer las pruebas es la decisión clave de la mesa. M1 la convierte en una conversación explícita: «¿qué prueba peritamos?».
4. **No toca puntos, papeles ni victoria, y se apaga con un ajuste.**

**Lo que M1 no garantiza:** que la mesa disfrute dudando de la app, que el culpable se atreva a falsificar, ni que el descubrimiento de una prueba falsa sea un buen momento y no una decepción. Por eso es candidata a prototipo, no mecánica aprobada.

### 7.3 Riesgos y mitigaciones

| Riesgo | Mitigación propuesta | Se comprueba en |
|---|---|---|
| La app presentaría como hecho algo que puede ser falso (el principio que hizo descartar el chivatazo libre en la fase 5) | En la variante, las pruebas se llaman «indicios» y llevan el estado «sin peritar», «auténtico» o «falso». La regla lo dice de entrada, y el veredicto muestra la falsa y quién la puso. | Revisión de textos y prueba con personas |
| Una mesa crédula pierde mucho (22–28 % con 6–10 si perita mal y se fía) | Una línea en la guía: «Si una prueba no encaja con ninguna coartada, piensa en peritarla». La simulación indica que esa pista descubre la falsa el 84–97 % de las veces. | Partidas reales |
| El culpable no se atreve nunca y la mecánica queda dormida (con 5 jugadores ya lo hace en equilibrio) | Medir la frecuencia de falsificación. Si es menor del 20 %, revisar. | Partidas reales |
| Frustración del grupo («la app nos engañó») | Que el engaño se atribuya siempre al culpable y se muestre al final | Encuesta tras la ronda |
| Fuga de la prueba auténtica antes del peritaje | Prueba de privacidad sobre las tramas | E2E |
| Testimonios inventados (permitidos hoy y no simulados) combinados con una prueba falsa | Observarlo en partidas; no hay cifra fiable | Partidas reales |

### 7.4 Criterios objetivos para el prototipo

Se juzgan con **al menos 24 rondas con variante en al menos 3 grupos de 5–8 personas**, alternando con rondas base de los mismos grupos.

**Aceptar** si se cumplen todos:

1. El acierto del grupo con variante queda entre el 30 % y el 70 %, y a no más de ±10 pp de las rondas base de los mismos grupos.
2. El culpable falsifica entre el **25 %** y el **75 %** de las rondas. Ni nunca, porque la mecánica estaría muerta, ni siempre, porque sería automático.
3. El peritaje descubre la falsa entre el **30 %** y el **85 %** de las veces que la hay: ni imposible ni seguro.
4. En al menos la mitad de las rondas con variante, la mesa **discute** qué peritar: hay más de una propuesta en voz alta.
5. Al menos el 80 % de las personas explica la regla en una frase tras su primera ronda.
6. La valoración media de «¿la ronda fue más interesante que una normal?» es de 3,5 o más sobre 5.

**Modificar** si se cumple el 1 pero falla el 2 o el 3. Ajustes posibles:
- falsificar solo la prueba 2, si el culpable nunca se atreve;
- hacer el peritaje por mayoría, si el culpable lo gasta con facilidad.

**Descartar** si se da cualquiera de estas condiciones:
- el acierto del grupo baja del 25 % en las rondas con prueba falsa no descubierta y la mesa lo vive como injusto (quejas repetidas);
- más del 20 % no entiende la regla;
- la valoración media es menor que 3.

### 7.5 Estimación de complejidad (si se autoriza el prototipo)

| Parte | Trabajo |
|---|---|
| Motor | `src/shared/engine/variants/prueba-falsa.ts`: función pura que aplica la falsificación sobre una copia de las pruebas; la marca de peritaje con el mismo patrón que `point`; resolución al terminar la investigación. Sin tocar `computeOutcome`. |
| Ajustes | `Settings.variant: 'prueba-falsa' \| null`, copiado en la ronda al empezar; la interfaz lee la copia de la ronda. |
| Protocolo | `game:forge` (solo el culpable, con validación de hora y lugar) y `game:examine` (marca de peritaje). |
| Interfaz | Paso privado en la declaración del culpable, marca en cada indicio, aviso del resultado, guía y veredicto. |
| Pruebas | Huellas de oro intactas con la variante desactivada; privacidad de la prueba auténtica; puntuación idéntica con las mismas votaciones; E2E con y sin variante. |
| Total | 2–3 días con pruebas. Riesgo técnico medio: dos mensajes nuevos y un estado oculto que no debe filtrarse. |

## 8. Protocolo breve para probar M1 con amigos

Se apoya en `docs/playtest-v1.1.md` para el guion, las reglas de intervención y la hoja de resultados.

**1. Sesión:** 90 min, 5–8 personas, ritmo normal, objetivos secretos desactivados.

| Bloque | Rondas | Para qué |
|---|---|---|
| Base | 2 | Aprender y tener la referencia de ese grupo |
| Variante | 3 | Medir M1 |
| Base | 1 | Ver si el grupo ha cambiado de nivel |

**2. Explicación de la variante.** Se lee tal cual y no se añade nada:

> «En estas rondas una de las dos pruebas puede ser falsa: la puede haber puesto la persona culpable. Cada uno marca qué prueba quiere peritar; al final de la investigación se perita la más marcada.»

**3. Hoja por ronda** (además de la de v1.1):
- si hubo falsificación, cuál y qué lugar;
- qué prueba se peritó y el resultado;
- cuántas propuestas distintas de peritaje se oyeron;
- si alguien sospechó de quien insistía en una prueba;
- a quién se acusó y si era el culpable.

**4. Al final de cada ronda con variante**, a mano alzada:
- «¿os habéis fiado de la prueba que no se peritó?»;
- al culpable, en privado: «¿por qué falsificaste o no?».

**5. Al terminar:**
- cada persona explica la variante en una frase;
- valoración 1–5 de «¿la ronda fue más interesante que una normal?» y «¿te pareció justa?»;
- frases textuales sobre el momento del peritaje.

**6. Decisión** con los criterios de la sección 7.4 tras al menos 3 grupos.

---

## 9. Archivos y comprobaciones

**Archivos nuevos** (ninguno modifica la app ni el motor):

- `scripts/experimentos/mecanicas/mecanicas.ts`: M1, M2 y M3 sobre la ronda base de la fase 6;
- `scripts/experimentos/mecanicas/equilibrio.ts`: equilibrio de suma cero por juego ficticio y peso de las decisiones;
- `scripts/experimentos/mecanicas/informe.ts`: informe reproducible;
- `tests/mecanicas-experimento.test.ts` (7 pruebas):
  - aislamiento de la app;
  - el resolutor con juegos conocidos;
  - M1 sin falsificación es la ronda base;
  - M1 con la prueba en duda nunca descarta al culpable verdadero;
  - el número de M2 nunca descarta al culpable verdadero;
  - M3 sin archivo es la ronda base;
  - los puntos del archivo;
- `docs/MECANICAS-datos.md` y este documento.

**Comprobaciones:** ver el informe final de la sesión (typecheck, todas las pruebas unitarias con las huellas del motor, validación de contenido, huella de `npm run simulate`, reproducibilidad del informe y `git status` frente a la copia de seguridad).

**Ideas descartadas antes de simular**, por no cumplir los criterios:

- **Pacto de coartada** (dos personas firman «estábamos juntas»): lógicamente vacío. Un inocente no sabe si el otro estaba allí, así que el pacto solo sirve contra mesas crédulas.
- **Recuerdos certificados por la app:** como los recuerdos siempre son ciertos, certificar uno a la hora del incidente limpia a un inocente al instante y resuelve la ronda.
- **Desafío de una coartada** (la app verifica una hora de alguien): a la hora del incidente es un detector directo del culpable.
