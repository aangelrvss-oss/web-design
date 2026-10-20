# Informante: auditoría de equilibrio y evaluación experimental (fase 6)

Datos completos y reproducibles: [`INFORMANTE-datos.md`](INFORMANTE-datos.md), generados con
`npx tsx scripts/experimentos/informante/informe.ts 1500`. Son 1.500 rondas por tamaño de mesa (4, 5, 6 y 10). Cada ronda se juega con el motor real y se resuelve en 112 (4–5 jug.) o 142 (6 y 10 jug.) combinaciones de condición, variante y estrategias, unas 760.000 resoluciones en total. Las semillas son fijas, así que la misma orden da los mismos números.

**Ejecutado, no ejecutado y pendiente**

- **Ejecutado:**
  - auditoría del motor y del simulador;
  - bots nuevos (v2) que solo ven lo que la app enseña a cada persona;
  - comparación v1/v2 con las mismas semillas;
  - métricas del juego base;
  - experimento aislado de 6 variantes del Informante con 3 estrategias de informante, 4 del bando culpable y 4 actitudes de mesa;
  - pruebas unitarias del experimento y regresión completa (sección 8).
- **No ejecutado:** ninguna partida con personas. Nada de lo que depende de hablar, convencer, dudar o entender las reglas está medido.
- **Pendiente:** la prueba humana de la sección 7.4, que es la única que puede aceptar una variante.
- **No implementado (por decisión, no por falta de tiempo):** el Informante no existe en la app. No se han tocado el motor, el protocolo, las reglas, la puntuación, los tiempos ni las ilustraciones.

---

## 0. Recomendación en una página

1. **El juego base está razonablemente equilibrado.** Con bots, el grupo acusa a la persona culpable el 58 %, 52 %, 47 % y 42 % de las veces con 4, 5, 6 y 10 personas. Si se deja que el culpable elija cómo mentir y la mesa elija cómo leer las pruebas, ninguna estrategia pura domina. El resultado queda en una franja intermedia en todos los tamaños (sección 2.5).
2. **No implementar el Informante tal como está propuesto (alternativa A).** Hay tres motivos:
   - **Con 4 y 5 personas resuelve demasiado:** +25 y +21 pp de acierto del grupo, incluso cuando el bando culpable responde lo mejor que puede.
   - **En ninguna variante el informante tiene una decisión real.** Contar el dato en cuanto lo recibe es igual o mejor que cualquier alternativa en las 6 variantes, los 4 tamaños y contra cualquier respuesta del bando culpable. Revelarlo no le cuesta nada: nadie le elimina, no pierde puntos y el dato no caduca. Ni revelarlo tarde ni limitarlo a una sola vez cambia esto (sección 4.2).
   - **El resultado depende sobre todo de lo crédula que sea la mesa.** Desde 6 personas, si la cómplice dice ser el informante y «confirma» al culpable, una mesa que cree la primera afirmación cae al 16 % (6 jug.) y al 6 % (10 jug.). Una mesa que razona con las reglas se queda en el 54 % y el 51 % (sección 5.3).
3. **Si aun así se quiere probar algo con personas, la mejor candidata es F, «Testigo de una hora», solo desde 6 personas, desactivada por defecto.**
   - El informante sabe dónde estuvo de verdad una persona (cualquiera, también la culpable) a una hora que no es la del incidente.
   - Se mide con la mejor respuesta del bando culpable: +4,7 pp con 6 personas y +1,9 pp con 10.
   - Al empezar la investigación casi no descarta a nadie, porque el dato solo sirve cruzado con las pruebas y las coartadas.
   - Se explica en el idioma que el juego ya usa («estuvo en Z a las H»).
   - **Su informante tampoco tiene una decisión interesante.** F es la opción más segura, no una que resuelva el problema de profundidad.
4. **La única forma encontrada de dar al informante una decisión de verdad es G, «Informante en la sombra».** Si se acusa a la persona culpable, esta puede intentar adivinar quién era el informante. Así, revelarse tiene un coste.
   - Exige cambiar el resultado de la ronda dentro de la variante, y eso necesita autorización expresa.
   - **No se puede simular:** su valor depende de dar pistas sin delatarse, algo que solo hacen las personas.
   - Queda como segunda prueba, si F resulta plana.
5. **Antes de cualquier variante:** jugar 3–5 partidas reales del juego base con el protocolo de `docs/playtest-v1.1.md`. Es la referencia sin la que ninguna cifra de variante significa nada en una mesa real.

---

## 1. Estado del repositorio y alcance

- Rama `ccr-6e9ffa75-bhi6c5`, último commit `e8fb52d`. El trabajo anterior sigue sin confirmar en el working tree (73 entradas en `git status` al empezar) y **se conserva entero**. Copia de seguridad previa: `tracked.patch` y `untracked.tgz` en el scratchpad de la sesión (`fase6-backup`).
- Archivos nuevos de esta fase (ningún archivo existente modificado, salvo dos notas de enlace):
  - `scripts/experimentos/informante/modelo.ts`: conocimiento leído de las vistas, deducción y lógica de las afirmaciones;
  - `scripts/experimentos/informante/ronda.ts`: ronda con el motor real y celdas de variante;
  - `scripts/experimentos/informante/informe.ts`: informe reproducible;
  - `tests/informante-experimento.test.ts`: aislamiento, reproducibilidad, corrección de la deducción y que la puntuación no cambie;
  - `docs/INFORMANTE-datos.md` y este documento.
- Notas de enlace añadidas a `docs/EQUILIBRIO-y-variantes.md` y `docs/VARIANTES-propuesta.md`, porque su recomendación sobre el Informante queda revisada aquí.
- El experimento **no está conectado** a la app:
  - nada de `src/` lo importa, y la palabra «informante» no aparece en `src/` (lo comprueba un test);
  - el motor no tiene ningún campo de variante;
  - las huellas de `tests/engine-golden.test.ts` no cambian.

---

## 2. Fase 1: el equilibrio actual

### 2.1 Reglas verificadas en el código (fuente de verdad)

Sin cambios respecto a la auditoría de la fase 5 (`EQUILIBRIO-y-variantes.md`, sección 1). Se han vuelto a leer `game.ts`, `generate.ts`, `encargos.ts` y `views.ts`, y coinciden.

| Elemento | Lo que hace el código |
|---|---|
| Papeles | 1 persona culpable; 1 cómplice desde 6 (`rolesFor`); el resto, inocentes. Se reparten al azar en cada ronda. |
| Qué sabe cada papel | Inocente: su noche real y 2 recuerdos ciertos. Culpable y cómplice: lo mismo, más quién es su pareja (`privateView.partner`), pero no la noche de la pareja. Nadie conoce el papel de otra persona. |
| Lugares y noche | 4 lugares hasta 6 personas, 5 desde 7. Solo la persona culpable está en el lugar del incidente a esa hora. Hay 1 señuelo (2 desde 8) que coincide con ella a las dos horas de las pruebas. |
| Pruebas | 2, ciertas, sobre dónde estuvo la persona culpable a las dos horas sin incidente. Una sale al empezar la investigación y otra en la segunda parte. |
| Coartadas | 3 horas, selladas. Quien no sella recibe una automática: la verdad, salvo la persona culpable, que evita el lugar del incidente. |
| Testimonios | Hasta 3 por persona, siempre en el lugar que la propia persona declaró. Se comparan solo con la coartada sellada del otro: *coincide*, *contradice* o *sin contraste*. |
| Señalar y defensa | Secreto y cambiable. Defiende la persona más señalada; un empate se decide con un sorteo sembrado. |
| Votación | Secreta. Empate en cabeza: desempate entre las empatadas. Si vuelve a empatar o no hay votos, no se acusa a nadie. |
| Victoria | El grupo gana si se acusa a la persona culpable; en cualquier otro caso gana el bando culpable. |
| Puntos | Grupo gana +2 (cada inocente). Culpable escapa +4. Cómplice +3 si la persona culpable escapa. Voto certero +1. Cazador +1 (testimonio cierto que destapa una mentira real). Objetivo +1. |
| Objetivos secretos | Opcionales. 6 tipos evaluados por el servidor. No cambian quién gana, solo suman puntos. |

### 2.2 Auditoría del simulador de la fase 5 (`scripts/sim/core.ts`)

Revisado línea a línea con estas preguntas:

| Pregunta | Respuesta |
|---|---|
| ¿Usan los bots información que una persona no tendría? | **No en la práctica, pero nada lo garantizaba.** v1 lee el estado interno (`setup.roles`, `setup.memories`), aunque su fórmula solo usa datos permitidos: el papel propio, los recuerdos propios, las pruebas, las declaraciones y los testimonios. Los bots v2 se construyen **solo** con `publicView` y `privateView` (`knowledgeFrom`), así que una fuga es imposible por construcción. En 6.000 rondas emparejadas, v1 y v2 llegan exactamente al mismo resultado (`INFORMANTE-datos.md`, sección 1). La conclusión es que v1 no aprovechaba información oculta. |
| ¿Deciden con sentido según su papel? | Los inocentes sí: cuentan cuántas mentiras necesita cada hipótesis. El bando culpable vota a la persona inocente que la mesa ve más sospechosa, algo razonable pero básico. |
| ¿Se basan en pruebas, coartadas y testimonios? | Sí. La deducción usa las tres fuentes y los recuerdos propios. El azar solo interviene para romper empates dentro de 0,5 puntos de sospecha (el «criterio de mesa» compartido). En 6.000 rondas, ningún bot inocente descartó por lógica a la persona culpable verdadera. |
| ¿Favorecen a un bando? | **Sí, en varias direcciones, y queda documentado sin corregirlo:** ver la tabla siguiente. |
| ¿Pueden sesgar la evaluación de variantes? | **Sí:** ver la sección 2.6. |

Sesgos del modelo de conducta:

| Sesgo | A quién favorece | Por qué |
|---|---|---|
| La mesa comparte el desempate («nos ponemos de acuerdo hablando») | Al grupo | Los votos casi nunca se reparten. Con 5 y 10 personas ningún voto individual llega a ser decisivo (sección 2.6). En la fase 5, la versión independiente bajaba el acierto hasta 14 pp con 6 y 10 personas. |
| Los inocentes publican todos sus recuerdos | Al grupo | Las personas publican menos. |
| El bando culpable no inventa testimonios para incriminar a nadie | Al grupo | La cómplice solo «corrobora» a la persona culpable si por casualidad declaró el mismo sitio. Esto **es fiel** a las reglas, porque no hay canal privado para ponerse de acuerdo antes de sellar. Lo que falta es la difamación, que las reglas sí permiten. |
| La mesa lee las pruebas de forma fija (peso 0,5) | Al culpable que miente a la hora de una prueba | Es el artefacto de «esquiva». La sección 2.5 lo mide con mesas que leen las pruebas de otra manera. |
| Nadie cambia de idea tras la defensa | Neutro, pero deja la defensa sin medir | En los bots, la defensa nunca cambia un voto. |
| El culpable miente en un lugar al azar | Incierto | No elige el lugar que menos testigos tiene. |

**Diferencias entre v1 y v2** (v1 se conserva intacto; `npm run simulate` da la misma salida que en la fase 5):

- v2 enumera la pareja culpable-cómplice de forma conjunta (la misma cómplice tiene que explicar todas las contradicciones);
- v2 vota el desempate por deducción, no al azar;
- v2 solo lee las vistas.

Con las semillas de esta auditoría, ninguna de las tres diferencias cambió un resultado. Con la mesa compartida casi no hay desempates (0–0,3 %), y la enumeración conjunta no movió ningún favorito.

### 2.3 Métricas del juego base (bots v2, 1.500 rondas por tamaño)

Victoria de la partida, puntuación individual y objetivos se miden por separado. «Gana el grupo» y «escapa el culpable» suman siempre 100 %: son la misma métrica vista desde cada bando.

| | 4 jug. | 5 jug. | 6 jug. | 10 jug. |
|---|---|---|---|---|
| Gana el grupo | 57,6 % [55,1–60,1] | 52,1 % [49,6–54,7] | 46,9 % [44,4–49,5] | 41,7 % [39,2–44,2] |
| Escapa el culpable | 42,4 % | 47,9 % | 53,1 % | 58,3 % |
| Se acusa a un inocente (y es un señuelo) | 42,4 % (37,9 %) | 47,9 % (41,1 %) | 50,7 % (41,9 %) | 55,7 % (47,1 %) |
| Se acusa a la cómplice | — | — | 2,1 % | 2,7 % |
| Grupo acusa, si el culpable solo miente a la hora del incidente | 73,6 % | 62,6 % | 58,0 % | 43,2 % |
| Puntos por ronda: inocente / culpable / cómplice | 2,04 / 1,70 / — | 1,80 / 1,91 / — | 1,70 / 2,12 / 1,59 | 1,39 / 2,33 / 1,75 |
| Puntos de una persona cualquiera en una partida de 5 rondas | 9,8 | 9,1 | 8,8 | 7,6 |
| Inocentes que votan a la persona culpable | 71,6 % | 63,3 % | 59,6 % | 46,9 % |

Lectura:

- **Cuando el grupo falla, casi siempre acusa al señuelo.** Es el diseño funcionando: la persona inocente que coincide con las pruebas carga con la sospecha.
- **Los papeles no puntúan igual** (el culpable gana más con mesas grandes), pero los papeles rotan. Por eso una persona cualquiera espera lo mismo que las demás a lo largo de una partida: es un desequilibrio entre papeles, no entre personas.
- **Objetivos secretos.** No cambian quién gana (0,0 pp por construcción, porque los bots no los persiguen). Sí suman puntos de forma desigual: +0,43–0,44 por inocente, +0,23–0,32 a la persona culpable y +0,40–0,44 a la cómplice. Esto confirma la desigualdad de dificultad de la fase 5:
  - «que nadie te vote» se cumple el 77 % de las veces como inocente y el 10 % como culpable;
  - «di que estuviste en Z» se cumple el 46 % como culpable (miente igualmente) y el 0 % como inocente.

### 2.4 Cuánto pesan las pruebas y los testimonios en la decisión

Misma ronda, quitando una fuente. «Cambia el acusado» mide cuántas decisiones dependen de esa fuente.

| | 4 jug. | 5 jug. | 6 jug. | 10 jug. |
|---|---|---|---|---|
| Sin testimonios: cambia el acusado | 24,5 % | 47,1 % | 51,2 % | 70,9 % |
| Sin pruebas: cambia el acusado | 27,5 % | 31,2 % | 37,9 % | 42,5 % |
| Con estrategia «mínimo»: valor de las pruebas | +23,8 pp | +24,8 pp | +27,8 pp | +26,0 pp |
| Con estrategia «mínimo»: valor de los testimonios | +13,8 pp | +16,2 pp | +13,4 pp | +20,8 pp |

Las dos fuentes deciden una parte grande de las votaciones, y los testimonios pesan más cuanto mayor es la mesa. Con las tres estrategias mezcladas, quitar las pruebas «mejora» un poco a los bots (+2 a +5 pp). Es el mismo artefacto de lectura fija de la sección 2.5, y no significa que las pruebas sobren.

### 2.5 ¿Hay una estrategia dominante? (diagnóstico principal)

La fase 5 concluía con cautela que «mentir a la hora de una prueba» parecía la mejor estrategia del culpable. Ahora se mide como un juego de dos bandos: el culpable elige cómo declarar y la mesa elige cuánto le importa que alguien no encaje con una prueba.

| | La mesa rebaja la sospecha (0,5) | Neutra (0) | La mesa sospecha (−0,5) |
|---|---|---|---|
| 4 jug.: mínimo / esquiva / total | 73,6 / 47,2 / 52,0 % | 60,8 / 67,8 / 76,4 % | 44,8 / 86,0 / 100 % |
| 6 jug.: mínimo / esquiva / total | 58,0 / 44,8 / 38,0 % | 39,6 / 57,8 / 69,8 % | 12,8 / 61,2 / 90,6 % |
| 10 jug.: mínimo / esquiva / total | 43,2 / 39,6 / 42,2 % | 23,6 / 49,4 / 80,2 % | 2,4 / 54,8 / 94,2 % |

- **No hay estrategia pura dominante para ningún bando.** Contra una mesa que desconfía de quien no encaja, mentir a la hora de una prueba es un suicidio. Contra una mesa que lo perdona, es la mejor jugada.
- Lo que cada bando puede garantizarse con estrategias puras deja el acierto del grupo entre:
  - 61–74 % con 4 personas;
  - 48–63 % con 5;
  - 40–58 % con 6;
  - 40–43 % con 10.
- **«Esquiva» era un artefacto de la mesa fija de la fase 5, no un defecto del juego.** Una mesa real se adaptará. La pregunta para las partidas reales cambia de «¿mentir a la hora de una prueba es demasiado fuerte?» a «¿la mesa aprende a sospechar de quien no encaja?».

### 2.6 Casos extremos y decisiones con poco peso

- **Lógica que resuelve sola.** El único favorito de un inocente es la persona culpable en el 64 % (4 jug.), 53 % (5), 49 % (6) y 35 % (10) de los casos.
- **Espacio de deducción.** Al empezar la investigación siguen siendo posibles 1,9 de 3 sospechosos (4 jug.), 2,8 de 4, 4,0 de 5 y 8,1 de 9. Al votar quedan 1,5 / 1,7 / 2,7 / 5,0. Hay deducción hasta el final en todos los tamaños.
- **Votos decisivos.**
  - El voto de la persona culpable cambia el resultado en menos del 1 % de las rondas, y el de la cómplice en el 8,7 % con 6 personas.
  - Con 5 y 10 personas, ningún voto individual llega a ser decisivo, porque la mesa compartida vota casi en bloque.
  - Es sobre todo un efecto del modelo de consenso; en una mesa real los votos se reparten más.
- **Decisiones sin consecuencia en los bots:** señalar para la defensa (siempre coincide con el voto) y la defensa misma (nadie cambia de idea). No es un defecto demostrado; es lo que los bots no pueden medir.

### 2.7 Qué no se puede inferir de los bots

- **Si se entiende el juego.** Ni el juego base ni ninguna variante.
- **Si hay faroles, presión o carisma.** Tampoco qué hace una mesa que duda.
- **Cuándo revela una persona su información.** Los bots no tienen ritmo: todo ocurre «a la vez» dentro de cada fase.
- **Si se persiguen los objetivos secretos.**
- **El valor real de la defensa.**
- **Cuánto crédito da una mesa real a una afirmación.** Para el Informante es lo más importante. Por eso se simulan tres actitudes extremas (lógica, crédula y escéptica) y una mezcla, que acotan el rango sin decir dónde caerá una mesa concreta.

---

## 3. Fase 2: alternativas del Informante

Común a todas, salvo que se diga otra cosa:

- la variante se activa en la sala y se copia en la ronda al empezar;
- el informante es una persona inocente elegida al azar con un flujo de azar propio, así que la noche, los papeles y las pruebas son idénticos con y sin variante;
- todo el mundo sabe que la variante está activa;
- en el veredicto se revela quién era el informante y cuál era su dato;
- **la puntuación no cambia** (salvo en G, que lo dice expresamente).

### A · Informante libre (la propuesta actual)

| # | Especificación |
|---|---|
| 1 | Una persona inocente al azar. |
| 2 | «Sabes con certeza que X es inocente», con X otra persona inocente. Lo sabe desde la declaración. |
| 3 | Cuando quiera y como quiera, de palabra. La app no lo publica. |
| 4 | Sí. |
| 5 | Que hay exactamente un informante, sin saber quién es. |
| 6 | Lo mismo que el resto: que existe, pero no quién es. |
| 7 | Como solo hay uno, si dos lo afirman uno miente, y quien miente es del bando culpable (un inocente no gana nada fingiendo). Con 4–5 personas (sin cómplice), quien finge **es** la persona culpable: el informante real lo sabe con certeza y la mesa queda con 2 sospechosos. |
| 8 | Descarta a una persona y da a quien revela credibilidad de inocente. Los testimonios y la votación no cambian de mecánica. |
| 9 | 4–5: demasiado fuerte (+25 / +21 pp con la mejor respuesta del culpable), y fingir es suicida. 6: +7 pp con la mejor respuesta (la cómplice «encubre»); el resultado depende muchísimo de la credulidad de la mesa. 10: +4 pp, apenas se nota. |
| 10 | Motor: un paso aislado tras `generateRound` (`setup.informant`). Protocolo: el ajuste de la variante. Vistas: un campo privado y la revelación. Interfaz: interruptor, una línea en el expediente, una en el veredicto y otra en la guía. |

### B · Informante tardío (el dato llega con la prueba 2)

| # | Especificación |
|---|---|
| 1–2 | Como A, pero el dato aparece al salir la prueba 2, no en la declaración. |
| 3–7 | Como A, solo después de la prueba 2. |
| 8 | Nada puede descartarse durante la primera parte de la investigación. |
| 9 | **Con estos bots, el resultado final es idéntico al de A**, porque no tienen ritmo y su información de la primera parte no cambia sus testimonios. Al empezar la investigación conserva el espacio de deducción de la base (1,86 sospechosos con 4 jug., frente a 1,65 en A). **No resuelve la estrategia dominante:** revelar en cuanto llega el dato sigue sin coste; solo lo retrasa. |
| 10 | Como A, más un evento ligado a la prueba 2 (otro momento de privacidad que probar). |

### C · Informante incierto (existe con probabilidad 1/2)

| # | Especificación |
|---|---|
| 1 | En la mitad de las rondas, una persona inocente al azar; en la otra mitad, nadie. |
| 2 | Como A. |
| 3–4 | Como A. |
| 5 | Que **puede** haber un informante. |
| 6 | Igual que el resto: no saben si existe. |
| 7 | Una afirmación sola puede ser falsa sin que nadie pueda desmentirla, porque quizá no hay informante real. Fingir deja de ser suicida. |
| 8 | Las afirmaciones se convierten en una decisión de credibilidad, no en una deducción. |
| 9 | 4–5: +4 / +8 pp (moderado). **6–10: favorece al bando culpable** (−11 / −15 pp con su mejor respuesta), porque «adelantarse» o «encubrir» funcionan en las rondas sin informante real. Crea más farol, pero inclina la balanza. |
| 10 | Como A, más el sorteo de existencia. |

### D · «X no es la persona culpable» (X puede ser la cómplice)

| # | Especificación |
|---|---|
| 1 | Como A. |
| 2 | «X no es la persona culpable». X puede ser la cómplice. |
| 3–7 | Como A. |
| 8 | Igual que A con 4–5 personas. Desde 6, quien queda limpio puede ser la cómplice. |
| 9 | Casi idéntico a A (diferencias de 0–2 pp). Añade una frase difícil de explicar sin aportar nada medible. **Descartada.** |
| 10 | Como A. |

### E · Informante con aval (la persona nombrada sabe quién es el informante)

| # | Especificación |
|---|---|
| 1–2 | Como A, y además X recibe: «el informante es P; sabe que eres inocente». |
| 3 | Como A; X puede confirmar o negar. |
| 4 | Sí. |
| 5–6 | Como A. |
| 7 | Un falso informante que nombra a una persona inocente queda desmentido al instante. Solo puede fingir nombrando a su pareja, que le «confirma». Eso solo es posible desde 6 personas, y deja a la pareja malvada al descubierto si el informante real habla. |
| 8 | La afirmación queda casi verificada. |
| 9 | La más fuerte: +28 / +23 / +18 / +7 pp con la mejor respuesta del culpable. Con 4 personas deja 1,21 sospechosos al empezar (base 1,86). **Descartada:** colapsa la deducción. |
| 10 | Como A, más un segundo dato privado. |

### F · Testigo de una hora («X estuvo en Z a las H»)

| # | Especificación |
|---|---|
| 1 | Una persona inocente al azar. |
| 2 | «Sabes con certeza que X estuvo en Z a las H». X es **cualquier** otra persona, también la culpable, y H es una de las dos horas sin incidente. Lo sabe desde la declaración. |
| 3 | Cuando quiera, de palabra. |
| 4 | Sí. |
| 5 | Que hay exactamente un informante con un dato de este tipo. |
| 6 | Como A. |
| 7 | Como en A, dos afirmaciones implican que una es falsa. Pero el dato falso típico no es «limpiar» a alguien sino **incriminarle**: «X estuvo donde dice la prueba». Si X había declarado otra cosa, la mesa debe decidir quién miente. |
| 8 | No descarta a nadie por sí solo. Hay que cruzarlo con las pruebas: si Z no es el lugar de la prueba de esa hora, X no puede ser la persona culpable. También con la coartada de X: si X declaró otro sitio, X miente. Se comporta como un testimonio con certificado, en el lenguaje que el juego ya usa. |
| 9 | 4–5: +18 / +15 pp (demasiado para el umbral). 6: +4,7 pp; 10: +1,9 pp, ambos con la mejor respuesta del bando culpable. Al empezar la investigación casi no estrecha nada (3,99 frente a 4,03 sospechosos con 6). Riesgo: una mesa crédula sigue siendo vulnerable a la cómplice (18 % frente a 55 % con 6). |
| 10 | Como A, con un dato de tres campos (persona, hora y lugar) en vez de uno. |

### G · Informante en la sombra (no simulable)

| # | Especificación |
|---|---|
| 1–2 | Como A o F. |
| 3–4 | Como A. Revelarse tiene un coste, ver la fila 8. |
| 5–6 | Como A. |
| 7 | Como A. |
| 8 | **Cambia el resultado de la ronda dentro de la variante.** Si el grupo acusa a la persona culpable, esta (con la cómplice) nombra a quien cree que es el informante. Si acierta, la ronda se puntúa como «escapa». Es el mecanismo de Merlín en *The Resistance: Avalon*. |
| 9 | Es la única alternativa en la que contar el dato abiertamente deja de ser lo mejor: hay que ayudar sin delatarse. Con bots solo se pueden calcular los extremos. Si revela abiertamente, el culpable acierta casi siempre y la variante perjudica al grupo. Si calla, el informante no aporta nada y el culpable aún puede acertar por azar (1 entre 2–8). Todo el valor está en las pistas sutiles, que solo dan las personas. Con 4–5 personas, adivinar es demasiado fácil. |
| 10 | Además de lo de A: una fase corta «¿quién era el informante?» tras el veredicto, con su temporizador y su mensaje, y una regla de resultado nueva. **Toca la resolución y la puntuación de la variante**, así que necesita autorización expresa. Complejidad media-alta. |

---

## 4. Fase 3: el experimento

### 4.1 Diseño

- **Aislado.** Vive en `scripts/experimentos/informante/`. Usa el motor real para jugar y puntuar, pero el informante, su dato y las afirmaciones solo existen en el experimento. Nada de `src/` lo importa, la app no tiene la variante y el protocolo no cambia.
- **Emparejado.** Cada ronda se juega una vez (misma semilla que el simulador de la fase 5) y se resuelve en todas sus combinaciones sobre copias del estado. El informante es la misma persona en todas las variantes de una ronda.
- **Estrategias:**

| Bando | Estrategias |
|---|---|
| Informante | *Lo cuenta*: al empezar. *Solo si alguien finge*: reacciona ante un impostor. *Nunca lo cuenta*: lo usa solo para su voto. |
| Bando culpable | *Nunca finge*. *Culpable replica*: en cuanto el informante habla, el culpable dice serlo y «confirma» a la misma persona. *Culpable se adelanta*: lo dice antes que nadie y «confirma» a quien la mesa ya descarta, o incrimina a la persona más sospechosa en F. *Cómplice encubre*: la cómplice lo dice y «confirma» al culpable, o lo sitúa lejos de la prueba en F; solo desde 6. |
| Mesa | *Lógica*: aplica las reglas de la variante y sabe que los inocentes no fingen. *Crédula*: cree la primera afirmación. *Escéptica*: ignora todas. *Mixta*: cada inocente es de un tipo al azar. |

- **Lo que no se modela:**
  - el momento de la revelación;
  - las pistas sutiles (G);
  - que una persona inocente finja ser el informante como cebo;
  - que el bando culpable elija su estrategia según la mesa que tiene delante;
  - el coste emocional de no ser creído.

### 4.2 Resultados

**Valor garantizado.** Es el acierto del grupo cuando cada bando juega su mejor estrategia contra la mejor del otro, con mesa lógica:

| | 4 jug. | 5 jug. | 6 jug. | 10 jug. |
|---|---|---|---|---|
| Juego base | 57,6 % | 52,1 % | 46,9 % | 41,7 % |
| A · Libre | 82,7 % (+25,1) | 73,0 % (+20,9) | 54,1 % (+7,1) | 45,4 % (+3,7) |
| B · Tardío | = A (sin ritmo, los bots no lo distinguen) | = A | = A | = A |
| C · Incierto | 61,9 % (+4,3) | 60,1 % (+8,0) | 36,1 % (**−10,9**) | 27,1 % (**−14,6**) |
| D · No culpable | 82,3 % (+24,7) | 71,2 % (+19,1) | 52,5 % (+5,5) | 44,3 % (+2,7) |
| E · Con aval | 85,4 % (+27,8) | 74,7 % (+22,5) | 65,2 % (+18,3) | 49,0 % (+7,3) |
| F · Testigo de una hora | 75,1 % (+17,5) | 67,3 % (+15,1) | 51,7 % (+4,7) | 43,6 % (+1,9) |

Las diferencias, en pp, son emparejadas con la misma ronda base. Sus intervalos (± 1–2,5 pp) están en los datos.

**Hallazgos que no dependen de una sola estrategia:**

1. **«Lo cuenta» es la mejor estrategia del informante, o empata dentro del intervalo, en las 6 variantes, los 4 tamaños y contra las 4 respuestas del bando culpable.** Es una estrategia dominante, y era el riesgo que pedía vigilar el encargo. No la crea ningún detalle de la simulación: revelar no tiene coste en las reglas. Revelar tarde (B) o una sola vez no cambia la comparación, porque callar tampoco gana nada después. Solo un coste explícito (G) o la incertidumbre (C) la rompen, y C lo hace a costa de inclinar el juego.
2. **Callar ante un impostor es catastrófico.** Si el culpable se adelanta y el informante real no responde, el acierto cae al 38 / 32 / 16 / 11 %. Por tanto, la regla tiene que dejar claro que el informante puede desmentir.
3. **Fingir con 4–5 personas es casi siempre perder.** Se acusa a quien finge en el 74 % de las rondas, porque sin cómplice el impostor es necesariamente la persona culpable. Desde 6, quien finge solo es acusado en el 22–28 % (A), porque puede ser la cómplice. Ahí está el único espacio real de farol.
4. **La mejor respuesta del bando culpable desde 6 personas es la cómplice encubriendo** (A, 6 jug.: 54,1 % frente a 64,9 % si nadie finge). Es el comportamiento que más conversación generaría, y también el que más castiga a una mesa crédula.
5. **La credulidad de la mesa decide más que la variante.** Con A, 6 personas y la cómplice encubriendo, el grupo acierta un 54 % si la mesa razona, un 16 % si cree a la primera, un 51 % si lo ignora todo y un 33 % si mezcla actitudes. Una mesa escéptica deja la variante en la base más el voto del propio informante.
6. **La información barata desplaza puntos.** Con A, 4 personas y nadie fingiendo, la persona culpable pasa de 1,70 a 0,69 puntos por ronda y los inocentes de 2,04 a 2,71.

### 4.3 Lo que no se puede simular y cómo probarlo con personas

| Pregunta | Por qué no la responden los bots | Cómo medirla |
|---|---|---|
| ¿Cuándo se revela el informante? | Los bots no tienen ritmo. | Anotar el momento: declaración, prueba 1, prueba 2 o nunca. |
| ¿La mesa razona «dos informantes ⇒ uno es del bando culpable» o cree al primero? | Es actitud, no lógica. | Preguntar al final de la ronda «¿a quién creíste y por qué?». |
| ¿El farol de la cómplice es divertido o frustrante? | Frustración y diversión no se simulan. | Valoración 1–5 por papel y frases textuales. |
| ¿Se entiende el dato «X estuvo en Z a las H» y se cruza con las pruebas? | Los bots lo cruzan perfectamente. | Pedir que lo expliquen tras la ronda y anotar si alguien lo usó para descartar a alguien. |
| ¿Pistas sin delatarse (G)? | Es comunicación humana. | Solo en una segunda prueba, si F resulta plana. |

---

## 5. Fase 4: recomendación de diseño

### 5.1 Diagnóstico del equilibrio actual

- Ningún bando gana de forma aplastante. El acierto del grupo baja con el tamaño de la mesa: del 58 % con 4 personas al 42 % con 10.
- No hay una estrategia pura dominante de declaración: depende de cómo lea la mesa las pruebas.
- Pruebas y testimonios deciden una parte grande de las votaciones.
- Los dos problemas abiertos siguen sin poder confirmarse con bots, y solo los resuelven partidas reales:
  - la dificultad desigual de los objetivos secretos;
  - el valor real de la defensa.

### 5.2 Comparación de alternativas

| Alternativa | Efecto garantizado 6 / 10 jug. | Colapso al empezar | Decisión real del informante | Riesgo principal | Veredicto |
|---|---|---|---|---|---|
| A · Libre | +7,1 / +3,7 pp | Bajo desde 6; alto con 4–5 | No (revelar domina) | Mesa crédula frente a la cómplice | **No implementar así** |
| B · Tardío | = A | Ninguno en la primera parte | No | Igual que A, más complejo | Descartada |
| C · Incierto | −10,9 / −14,6 pp | Bajo | No (revelar sigue dominando) | Favorece al bando culpable | Descartada |
| D · No culpable | +5,5 / +2,7 pp | Como A | No | Frase confusa sin ganancia | Descartada |
| E · Con aval | +18,3 / +7,3 pp | Alto | No | Resuelve la ronda | Descartada |
| F · Testigo de una hora | +4,7 / +1,9 pp | Casi nulo | No | Mesa crédula; posible irrelevancia | **Candidata a prueba humana desde 6** |
| G · En la sombra | No simulable | Como A o F | **Sí** | Cambia el resultado de la ronda; difícil de explicar; inviable con 4–5 | Segunda prueba, con autorización |

### 5.3 Mejor candidata: F desde 6 personas, y con qué expectativas

**Por qué F y no A:**

- F tiene menos efecto en todos los tamaños.
- Casi no reduce el espacio de deducción al empezar.
- Obliga a cruzar el dato con las pruebas y las coartadas, así que añade deducción en vez de sustituirla.
- Su farol natural es incriminar con un hecho comprobable, que encaja mejor con el juego que «limpiar» a alguien.

**Por qué desde 6:** con 4–5 personas sigue superando el umbral de +10 pp (+17,5 / +15,1).

**Qué no resuelve:** el informante sigue sin una decisión interesante. Si la prueba humana confirma que se revela siempre al instante y que la mesa no discute, F no aporta profundidad y hay que descartarla o pasar a G.

### 5.4 Riesgos que los datos no pueden resolver

- Lo crédula que es una mesa real. Las cifras van del 16 % al 54 % con la misma situación.
- Si «uno de los dos miente y es del bando culpable» se entiende sin explicaciones largas.
- La frustración de un informante real al que nadie cree, o que es acusado (8–16 % de las rondas con un impostor).
- Si la cómplice se atreve a fingir. Es la mejor jugada del bando culpable desde 6, pero también la más arriesgada socialmente.
- Que F resulte irrelevante para la mesa: un dato más que nadie cruza con las pruebas.

### 5.5 Criterios objetivos

Se juzgan con al menos **30 rondas con variante, en al menos 3 grupos de 6–8 personas**, alternando con rondas base de los mismos grupos.

**Aceptar** si se cumplen todos:

1. El acierto del grupo con variante está entre el 35 % y el 65 %, y a no más de **+10 pp** de las rondas base de los mismos grupos.
2. El **80 %** o más de las personas explica la regla correctamente en una frase tras su primera ronda con variante.
3. Hay al menos una afirmación disputada (dos «informantes», o un dato que alguien desmiente) en el **20 %** o más de las rondas. Es la prueba de que hay juego, no solo una pista.
4. Cuando alguien finge, se le acusa entre el **15 %** y el **85 %** de las veces: el farol no es ni gratis ni suicida.
5. El informante valora su papel con una media de 3 o más sobre 5.

**Modificar** (pasar a G o cambiar la frase del dato) si:

- se cumplen 1, 2 y 4, pero el informante se revela antes de la prueba 1 en más del 80 % de las rondas y apenas hay disputas (menos del 20 %);
- o el dato de F casi nunca se usa para descartar a nadie.

**Descartar** si se da cualquiera de estas condiciones:

- el acierto del grupo supera el 70 % o queda por debajo del 30 % en las rondas con impostor;
- más del 20 % de las personas no entiende la regla;
- hay quejas repetidas de frustración del informante o de quien fue acusado por un impostor;
- el dato decide la votación en más de la mitad de las rondas (pregunta abierta al final).

### 5.6 Complejidad y riesgos técnicos (si se autoriza F)

| Parte | Cambio | Estimación |
|---|---|---|
| Motor | Función pura `src/shared/engine/variants/informante.ts` con su propio flujo de azar (`{semilla}\|informante`), llamada tras `generateRound` solo si `setup.variant === 'informante'` y hay 6 o más personas. Ni `computeOutcome` ni la puntuación cambian. | ~60 líneas |
| Ajustes | `Settings.variant: 'informante' \| null`, copiado en la ronda al empezar. La interfaz lee **siempre** la copia de la ronda, nunca `settings` (discrepancia 4 de la fase 5). | Pequeño |
| Protocolo | Solo se amplía el esquema de `room:settings`. No hay mensajes nuevos: el dato no se publica nunca por la app. | Pequeño |
| Vistas | `privateView.informant` solo para esa persona; etiqueta pública de variante; el dato en `reveal`. | Pequeño |
| Interfaz | Interruptor en la sala (solo quien dirige, desactivado con menos de 6), una línea en el expediente, una en el veredicto y otra en la guía rápida. | Medio |
| Pruebas | Privacidad en las tramas reales (nadie más recibe el dato antes del veredicto). Huellas de oro idénticas con la variante desactivada. Misma puntuación con las mismas votaciones. E2E con y sin la variante. | Medio |

- **Riesgo técnico bajo:** no toca fases ni temporizadores ni puntuación, y se apaga con un ajuste.
- **Riesgo principal:** una fuga del dato privado en `publicView`. Se cubre con la prueba de privacidad sobre las tramas.
- **Estimación total:** 1–1,5 días con pruebas.
- G añadiría una fase y una regla de resultado: unos 2–3 días, y requiere autorizar el cambio de resolución.

### 5.7 Protocolo de prueba con grupos de amigos

Se apoya en `docs/playtest-v1.1.md` (guion, reglas de intervención y hoja). Añade:

**1. Sesión** (90–110 min, 6–8 personas, ritmo normal, objetivos secretos desactivados):

| Bloque | Rondas | Para qué |
|---|---|---|
| Base | 2 | Aprendizaje y referencia del mismo grupo |
| Variante | 3 | Medir F |
| Base | 1 | Comprobar que el grupo no ha cambiado de nivel |

**2. Explicación de la variante.** Se lee tal cual, y nada más:

> «En esta ronda una persona inocente sabe con certeza dónde estuvo alguien a una hora. Puede contarlo o no. Cualquiera puede decir que es esa persona, pero solo hay una.»

**3. Hoja por ronda** (además de la de v1.1):
- quién era el informante;
- su dato;
- cuándo lo contó: declaración, prueba 1, prueba 2 o nunca;
- quién más dijo ser el informante, cuándo y qué dijo;
- si alguien desmintió un dato;
- a quién se acusó;
- si el dato decidió el voto: se pregunta «¿cambió tu voto lo que dijo el informante?», a mano alzada.

**4. Al final:**
- cada persona explica la variante en una frase;
- valoración 1–5 del papel de informante y del juego con y sin variante;
- «¿a quién creíste cuando hubo dos informantes y por qué?».

**5. Decisión** con los criterios de la sección 5.5, tras al menos 3 grupos. Hasta entonces, la variante solo existiría desactivada por defecto.

---

## 6. Qué cambia respecto a la fase 5

- **Informante libre.** La fase 5 recomendaba «probar primero, desde 6». Con un modelo de farol más fiel la recomendación pasa a **no implementarlo así**. Los motivos:
  - la mesa de la fase 5 no creía a nadie ante un farol, y una mesa lógica sí aprende de él;
  - la cómplice que encubre no estaba modelada;
  - el análisis de estrategias muestra que revelar domina siempre.
- **«Mentir a la hora de una prueba».** Deja de ser una sospecha de desequilibrio: con una mesa que se adapta, ninguna estrategia de declaración domina.
- **Simulador.** v1 no tenía fugas de información, pero no había ninguna garantía. Los bots v2 la dan por construcción y llegan a los mismos resultados.

---

## 7. Cómo reproducir

```bash
npx tsx scripts/experimentos/informante/informe.ts 1500 > docs/INFORMANTE-datos.md   # unos 4 min
npx vitest run tests/informante-experimento.test.ts
npm run simulate        # simulador de la fase 5, salida idéntica a la de la fase 5
```

---

## 8. Regresión de esta fase

Ver el informe final de la sesión. Resumen de lo ejecutado:
- typecheck;
- todas las pruebas unitarias, incluidas las huellas del motor y las nuevas del experimento;
- validación de contenido;
- `npm run simulate 300` con la misma huella que antes;
- `git status`, para comprobar que el working tree previo se conserva.
