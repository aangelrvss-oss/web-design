# Informante: datos del experimento aislado (fase 6)

Generado con `npx tsx scripts/experimentos/informante/informe.ts 1500`: 1500 rondas por tamaño de mesa, semillas fijas `f6-{jugadores}-{i}`, motor real. La estrategia de declaración del culpable rota con la semilla (mínimo, esquiva, total), así que cada estrategia tiene 500 rondas por tamaño.

Intervalos del 95 %: Wilson para porcentajes, normal para medias y diferencias emparejadas. «Emparejado» significa misma ronda (misma noche, papeles, declaraciones, testimonios, pruebas y desempate de mesa) con y sin la condición que se compara.

**Bots, no personas.** Deciden solo con lo que la app enseña a cada uno (vistas pública y privada), las personas inocentes nunca mienten, nadie cambia de idea tras la defensa y las estrategias son fijas. Las cifras dicen qué permite deducir la información de la ronda a una mesa disciplinada, no cómo jugará una mesa real. La interpretación está en `docs/INFORMANTE-evaluacion.md`.

Comprobaciones de la ejecución: rondas bloqueadas o inválidas: **0**. Veces que un bot inocente descartó por lógica a la persona culpable verdadera (debe ser 0): **0**. Discrepancias entre el recuento propio de votos y el del motor (debe ser 0): **0**.

## 1. Simulador: v1 (fase 5) frente a v2 (fase 6)

Misma semilla ⇒ misma noche, mismas declaraciones, mismos testimonios y mismo desempate de mesa en los dos simuladores. Cambia solo cómo deducen y votan los bots: v2 lee únicamente las vistas, enumera la pareja culpable-cómplice de forma conjunta y vota el desempate por deducción en vez de al azar.

| Jugadores | Estrategia | v1: grupo acusa al culpable | v2: grupo acusa al culpable | Diferencia v2 − v1 |
| --- | --- | --- | --- | --- |
| 4 | minimo | 73.6 % [69.6–77.3] | 73.6 % [69.6–77.3] | +0.0 pp [+0.0, +0.0] |
| 4 | esquiva | 47.2 % [42.9–51.6] | 47.2 % [42.9–51.6] | +0.0 pp [+0.0, +0.0] |
| 4 | total | 52.0 % [47.6–56.3] | 52.0 % [47.6–56.3] | +0.0 pp [+0.0, +0.0] |
| 5 | minimo | 62.6 % [58.3–66.7] | 62.6 % [58.3–66.7] | +0.0 pp [+0.0, +0.0] |
| 5 | esquiva | 42.0 % [37.8–46.4] | 42.0 % [37.8–46.4] | +0.0 pp [+0.0, +0.0] |
| 5 | total | 51.8 % [47.4–56.1] | 51.8 % [47.4–56.1] | +0.0 pp [+0.0, +0.0] |
| 6 | minimo | 58.0 % [53.6–62.2] | 58.0 % [53.6–62.2] | +0.0 pp [+0.0, +0.0] |
| 6 | esquiva | 44.8 % [40.5–49.2] | 44.8 % [40.5–49.2] | +0.0 pp [+0.0, +0.0] |
| 6 | total | 38.0 % [33.9–42.3] | 38.0 % [33.9–42.3] | +0.0 pp [+0.0, +0.0] |
| 10 | minimo | 43.2 % [38.9–47.6] | 43.2 % [38.9–47.6] | +0.0 pp [+0.0, +0.0] |
| 10 | esquiva | 39.6 % [35.4–44.0] | 39.6 % [35.4–44.0] | +0.0 pp [+0.0, +0.0] |
| 10 | total | 42.2 % [37.9–46.6] | 42.2 % [37.9–46.6] | +0.0 pp [+0.0, +0.0] |

Rondas en que v1 y v2 llegan a un resultado distinto (acusan o no a la persona culpable): 4 jug. 0.0 % · 5 jug. 0.0 % · 6 jug. 0.0 % · 10 jug. 0.0 %.

## 2. Juego base con bots v2

### 2.1 Quién gana

La partida la gana un bando: el grupo (todas las personas inocentes) si se acusa a la persona culpable; el bando culpable (culpable y cómplice) en cualquier otro caso. Por eso «gana el grupo» y «escapa la persona culpable» suman 100 %: no son dos métricas independientes.

| Jugadores | Gana el grupo | Escapa el culpable | Acusan a un inocente | …de ellos, un señuelo | Acusan a la cómplice | Nadie acusado | Desempate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | 57.6 % [55.1–60.1] | 42.4 % [39.9–44.9] | 42.4 % [39.9–44.9] | 37.9 % [35.4–40.3] | n/a | 0.0 % [0.0–0.3] | 0.0 % [0.0–0.3] |
| 5 | 52.1 % [49.6–54.7] | 47.9 % [45.3–50.4] | 47.9 % [45.3–50.4] | 41.1 % [38.6–43.6] | n/a | 0.0 % [0.0–0.3] | 0.0 % [0.0–0.3] |
| 6 | 46.9 % [44.4–49.5] | 53.1 % [50.5–55.6] | 50.7 % [48.1–53.2] | 41.9 % [39.4–44.4] | 2.1 % [1.5–3.0] | 0.3 % [0.1–0.7] | 0.3 % [0.1–0.7] |
| 10 | 41.7 % [39.2–44.2] | 58.3 % [55.8–60.8] | 55.7 % [53.1–58.2] | 47.1 % [44.6–49.7] | 2.7 % [2.0–3.6] | 0.0 % [0.0–0.3] | 0.0 % [0.0–0.3] |

Por estrategia de declaración del culpable (grupo acusa al culpable):

| Jugadores | minimo | esquiva | total |
| --- | --- | --- | --- |
| 4 | 73.6 % [69.6–77.3] | 47.2 % [42.9–51.6] | 52.0 % [47.6–56.3] |
| 5 | 62.6 % [58.3–66.7] | 42.0 % [37.8–46.4] | 51.8 % [47.4–56.1] |
| 6 | 58.0 % [53.6–62.2] | 44.8 % [40.5–49.2] | 38.0 % [33.9–42.3] |
| 10 | 43.2 % [38.9–47.6] | 39.6 % [35.4–44.0] | 42.2 % [37.9–46.6] |

### 2.2 Puntos

Puntuación individual, separada de la victoria del bando: media de puntos por persona y ronda según su papel, y lo que espera una persona cualquiera a lo largo de una partida de 5 rondas (los papeles se sortean cada ronda: culpable con probabilidad 1/N, cómplice 1/N desde 6 personas).

| Jugadores | Inocente | Culpable | Cómplice | Inocentes que votan al culpable | Persona cualquiera, partida de 5 rondas |
| --- | --- | --- | --- | --- | --- |
| 4 | 2.04 ±0.07 | 1.70 ±0.10 | n/a | 71.6 % | 9.76 |
| 5 | 1.80 ±0.07 | 1.91 ±0.10 | n/a | 63.3 % | 9.12 |
| 6 | 1.70 ±0.07 | 2.12 ±0.10 | 1.59 ±0.08 | 59.6 % | 8.77 |
| 10 | 1.39 ±0.07 | 2.33 ±0.10 | 1.75 ±0.07 | 46.9 % | 7.62 |

### 2.3 Objetivos secretos

La misma ronda con y sin objetivos. Los bots no los persiguen: solo se mide lo que se cumple de paso y cuánto cambian los puntos. Que alguien los persiga a propósito (y mienta para ello) solo se puede medir con personas.

| Jugadores | Grupo acusa: con − sin objetivos | Inocente: puntos con / sin | Culpable: con / sin | Cómplice: con / sin |
| --- | --- | --- | --- | --- |
| 4 | +0.0 pp [+0.0, +0.0] | 2.47 / 2.04 | 1.93 / 1.70 | n/a |
| 5 | +0.0 pp [+0.0, +0.0] | 2.24 / 1.80 | 2.16 / 1.91 | n/a |
| 6 | +0.0 pp [+0.0, +0.0] | 2.13 / 1.70 | 2.43 / 2.12 | 2.03 / 1.59 |
| 10 | +0.0 pp [+0.0, +0.0] | 1.83 / 1.39 | 2.65 / 2.33 | 2.15 / 1.75 |

| Objetivo | Papel | Cumplido sin buscarlo (todos los tamaños) |
| --- | --- | --- |
| claim_zone | complice | 0.0 % [0.0–0.8] (n=496) |
| claim_zone | culpable | 46.4 % [43.3–49.6] (n=959) |
| claim_zone | inocente | 0.0 % [0.0–0.1] (n=4510) |
| contradict | complice | 0.0 % [0.0–0.8] (n=474) |
| contradict | culpable | 0.0 % [0.0–0.4] (n=1043) |
| contradict | inocente | 3.2 % [2.7–3.8] (n=4730) |
| corroborated | complice | 87.5 % [84.3–90.1] (n=488) |
| corroborated | culpable | 59.9 % [56.8–62.9] (n=984) |
| corroborated | inocente | 88.7 % [87.7–89.5] (n=4767) |
| no_votes | complice | 96.0 % [94.0–97.4] (n=506) |
| no_votes | culpable | 10.2 % [8.5–12.2] (n=1030) |
| no_votes | inocente | 77.1 % [75.9–78.3] (n=5045) |
| same_vote | complice | 53.2 % [48.8–57.5] (n=502) |
| same_vote | culpable | 40.4 % [37.4–43.5] (n=1005) |
| same_vote | inocente | 66.5 % [65.2–67.9] (n=4731) |
| votes_on | complice | 15.4 % [12.5–18.7] (n=534) |
| votes_on | culpable | 10.0 % [8.3–12.0] (n=979) |
| votes_on | inocente | 21.0 % [19.9–22.2] (n=4717) |

### 2.4 Cuánto cambian una decisión las pruebas y los testimonios

Misma ronda; los bots ignoran una fuente. «Cambia el acusado» cuenta las rondas en que la persona acusada (o que no se acuse a nadie) es distinta: mide cuántas decisiones dependen de esa fuente, no solo si mejora el acierto.

| Jugadores | Sin pruebas: Δ acierto | Sin pruebas: cambia el acusado | Sin testimonios: Δ acierto | Sin testimonios: cambia el acusado | Sin ninguna: Δ acierto | Sin ninguna: cambia el acusado |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | +5.1 pp [+2.6, +7.7] | 27.5 % | −23.0 pp [−25.1, −20.9] | 24.5 % | −16.1 pp [−19.3, −12.9] | 52.9 % |
| 5 | +3.9 pp [+1.3, +6.4] | 31.2 % | −34.3 pp [−36.7, −31.9] | 47.1 % | −23.6 pp [−26.8, −20.4] | 68.3 % |
| 6 | +1.7 pp [−0.9, +4.3] | 37.9 % | −31.7 pp [−34.4, −29.1] | 51.2 % | −26.5 pp [−29.6, −23.5] | 75.5 % |
| 10 | +4.1 pp [+1.6, +6.6] | 42.5 % | −34.2 pp [−36.8, −31.6] | 70.9 % | −32.2 pp [−35.0, −29.4] | 83.7 % |

Solo con la estrategia «mínimo» (el culpable dice la verdad a las horas de las pruebas):

| Jugadores | Con todo | Sin pruebas: Δ acierto | Sin testimonios: Δ acierto | Sin ninguna: Δ acierto |
| --- | --- | --- | --- | --- |
| 4 | 73.6 % | −23.8 pp [−27.5, −20.1] | −13.8 pp [−16.8, −10.8] | −38.2 pp [−42.5, −33.9] |
| 5 | 62.6 % | −24.8 pp [−28.6, −21.0] | −16.2 pp [−19.4, −13.0] | −37.4 pp [−41.6, −33.2] |
| 6 | 58.0 % | −27.8 pp [−31.7, −23.9] | −13.4 pp [−18.1, −8.7] | −39.0 pp [−43.8, −34.2] |
| 10 | 43.2 % | −26.0 pp [−29.8, −22.2] | −20.8 pp [−25.4, −16.2] | −33.4 pp [−38.0, −28.8] |

### 2.5 ¿Hay una estrategia dominante para el culpable? Depende de cómo lea la mesa las pruebas

Filas: estrategia de declaración del culpable. Columnas: cuánto rebaja la sospecha que alguien NO encaje con una prueba (0,5 = la mesa cree que el culpable no suele mentir a esas horas, como en la fase 5; 0 = no cuenta; −0,5 = la mesa sospecha de quien no encaja). Celda: grupo acusa al culpable.

| 4 jug. | peso 0.5 | peso 0 | peso -0.5 | Peor caso para el grupo |
| --- | --- | --- | --- | --- |
| minimo | 73.6 % [69.6–77.3] | 60.8 % [56.5–65.0] | 44.8 % [40.5–49.2] | 73.6 % |
| esquiva | 47.2 % [42.9–51.6] | 67.8 % [63.6–71.7] | 86.0 % [82.7–88.8] | 86.0 % |
| total | 52.0 % [47.6–56.3] | 76.4 % [72.5–79.9] | 100.0 % [99.2–100.0] | 100.0 % |

- 4 jug.: lo mejor que puede garantizarse el grupo es 60.8 % (lectura de pruebas con peso 0); lo mejor que puede garantizarse el culpable es dejar al grupo en 73.6 % (estrategia minimo). No coinciden: no hay una estrategia pura dominante; el mejor plan de cada bando depende del otro.

| 5 jug. | peso 0.5 | peso 0 | peso -0.5 | Peor caso para el grupo |
| --- | --- | --- | --- | --- |
| minimo | 62.6 % [58.3–66.7] | 48.0 % [43.7–52.4] | 30.0 % [26.1–34.2] | 62.6 % |
| esquiva | 42.0 % [37.8–46.4] | 62.2 % [57.9–66.3] | 80.2 % [76.5–83.5] | 80.2 % |
| total | 51.8 % [47.4–56.1] | 74.8 % [70.8–78.4] | 100.0 % [99.2–100.0] | 100.0 % |

- 5 jug.: lo mejor que puede garantizarse el grupo es 48.0 % (lectura de pruebas con peso 0); lo mejor que puede garantizarse el culpable es dejar al grupo en 62.6 % (estrategia minimo). No coinciden: no hay una estrategia pura dominante; el mejor plan de cada bando depende del otro.

| 6 jug. | peso 0.5 | peso 0 | peso -0.5 | Peor caso para el grupo |
| --- | --- | --- | --- | --- |
| minimo | 58.0 % [53.6–62.2] | 39.6 % [35.4–44.0] | 12.8 % [10.2–16.0] | 58.0 % |
| esquiva | 44.8 % [40.5–49.2] | 57.8 % [53.4–62.1] | 61.2 % [56.9–65.4] | 61.2 % |
| total | 38.0 % [33.9–42.3] | 69.8 % [65.6–73.7] | 90.6 % [87.7–92.9] | 90.6 % |

- 6 jug.: lo mejor que puede garantizarse el grupo es 39.6 % (lectura de pruebas con peso 0); lo mejor que puede garantizarse el culpable es dejar al grupo en 58.0 % (estrategia minimo). No coinciden: no hay una estrategia pura dominante; el mejor plan de cada bando depende del otro.

| 10 jug. | peso 0.5 | peso 0 | peso -0.5 | Peor caso para el grupo |
| --- | --- | --- | --- | --- |
| minimo | 43.2 % [38.9–47.6] | 23.6 % [20.1–27.5] | 2.4 % [1.4–4.1] | 43.2 % |
| esquiva | 39.6 % [35.4–44.0] | 49.4 % [45.0–53.8] | 54.8 % [50.4–59.1] | 54.8 % |
| total | 42.2 % [37.9–46.6] | 80.2 % [76.5–83.5] | 94.2 % [91.8–95.9] | 94.2 % |

- 10 jug.: lo mejor que puede garantizarse el grupo es 39.6 % (lectura de pruebas con peso 0.5); lo mejor que puede garantizarse el culpable es dejar al grupo en 43.2 % (estrategia minimo). No coinciden: no hay una estrategia pura dominante; el mejor plan de cada bando depende del otro.

### 2.6 Casos extremos y decisiones con poco peso

| Jugadores | Inocentes con un único favorito | …y es el culpable | Sospechosos posibles al empezar (de N−1) | Sospechosos posibles al votar | Voto decisivo: inocente | Voto decisivo: culpable | Voto decisivo: cómplice |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | 78.2 % | 64.3 % | 1.86 | 1.45 | 66.5 % | 0.4 % | n/a |
| 5 | 68.9 % | 53.2 % | 2.83 | 1.65 | 0.0 % | 0.0 % | n/a |
| 6 | 61.5 % | 48.6 % | 4.03 | 2.68 | 41.4 % | 0.8 % | 8.7 % |
| 10 | 43.7 % | 35.3 % | 8.13 | 5.01 | 0.0 % | 0.0 % | 0.0 % |

«Voto decisivo»: proporción de votos que, cambiados a otra persona, cambiarían el resultado de la primera votación (acusado, desempate o nadie). «Sospechosos posibles»: personas que la lógica de un inocente aún no ha descartado, de media; al empezar la investigación solo hay declaraciones y la prueba 1.

## 3. Variantes del Informante

Definiciones completas en `docs/INFORMANTE-evaluacion.md`. En todas, el motor reparte la ronda igual y la puntuación no cambia; el informante y su dato se sortean con un flujo de azar propio, el mismo para todas las variantes (el informante es la misma persona en todas las celdas de una ronda).

Estrategias simuladas:

- **Informante**: lo cuenta al empezar (*lo cuenta*); solo lo cuenta si alguien finge serlo (*solo si alguien finge*); no lo cuenta nunca y solo lo usa para su voto (*nunca lo cuenta*).
- **Bando culpable**: nunca finge; el culpable replica en cuanto el informante habla, «confirmando» a la misma persona (*culpable replica*); el culpable se adelanta y dice ser el informante antes que nadie (*culpable se adelanta*); la cómplice dice ser el informante y «confirma» al culpable (*cómplice encubre*, solo desde 6).
- **Mesa**: lógica (usa las afirmaciones con las reglas de la variante y sabe que los inocentes no fingen); crédula (cree la primera afirmación); escéptica (ignora todas); mixta (cada inocente es de un tipo, al azar).

### A · Informante libre

| 4 jug. (base 57.6 %) | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 82.7 % (+25.1 pp [+22.9, +27.3]) | 86.0 % (+28.4 pp [+26.1, +30.7]) | 86.0 % (+28.4 pp [+26.1, +30.7]) |
| solo si alguien finge | 57.6 % (+0.0 pp [+0.0, +0.0]) | 57.6 % (+0.0 pp [+0.0, +0.0]) | 86.0 % (+28.4 pp [+26.1, +30.7]) |
| nunca lo cuenta | 57.6 % (+0.0 pp [+0.0, +0.0]) | 57.6 % (+0.0 pp [+0.0, +0.0]) | 38.3 % (−19.3 pp [−21.3, −17.3]) |

- Valor garantizado: informante «lo cuenta» asegura 82.7 %; el bando culpable con «nunca finge» lo deja como mucho en 82.7 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 25.2 % de las rondas; sospechosos posibles al empezar 1.65 (base 1.86); inocentes cuyo único favorito es el culpable 86.2 % (base 64.3 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 74.1 % de esas rondas; se acusa al informante real en 15.8 %.

| 5 jug. (base 52.1 %) | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 73.0 % (+20.9 pp [+18.8, +22.9]) | 87.8 % (+35.7 pp [+33.2, +38.1]) | 87.8 % (+35.7 pp [+33.2, +38.1]) |
| solo si alguien finge | 52.1 % (+0.0 pp [+0.0, +0.0]) | 52.1 % (+0.0 pp [+0.0, +0.0]) | 87.8 % (+35.7 pp [+33.2, +38.1]) |
| nunca lo cuenta | 52.1 % (+0.0 pp [+0.0, +0.0]) | 52.1 % (+0.0 pp [+0.0, +0.0]) | 32.1 % (−20.0 pp [−22.0, −18.0]) |

- Valor garantizado: informante «lo cuenta» asegura 73.0 %; el bando culpable con «nunca finge» lo deja como mucho en 73.0 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 22.2 % de las rondas; sospechosos posibles al empezar 2.42 (base 2.83); inocentes cuyo único favorito es el culpable 74.4 % (base 53.2 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 73.9 % de esas rondas; se acusa al informante real en 13.3 %.

| 6 jug. (base 46.9 %) | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 64.9 % (+17.9 pp [+16.0, +19.9]) | 61.2 % (+14.3 pp [+12.5, +16.0]) | 56.1 % (+9.1 pp [+7.7, +10.6]) | 54.1 % (+7.1 pp [+5.8, +8.4]) |
| solo si alguien finge | 47.0 % (+0.1 pp [−0.1, +0.2]) | 47.0 % (+0.1 pp [−0.1, +0.2]) | 56.1 % (+9.1 pp [+7.7, +10.6]) | 54.1 % (+7.1 pp [+5.8, +8.4]) |
| nunca lo cuenta | 47.0 % (+0.1 pp [−0.1, +0.2]) | 47.0 % (+0.1 pp [−0.1, +0.2]) | 16.0 % (−30.9 pp [−33.4, −28.5]) | 15.0 % (−31.9 pp [−34.3, −29.6]) |

- Valor garantizado: informante «lo cuenta» asegura 54.1 %; el bando culpable con «cómplice encubre» lo deja como mucho en 54.1 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 21.9 % de las rondas; sospechosos posibles al empezar 3.92 (base 4.03); inocentes cuyo único favorito es el culpable 65.9 % (base 48.6 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 27.8 % de esas rondas; se acusa al informante real en 13.7 %.

| 10 jug. (base 41.7 %) | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 49.0 % (+7.3 pp [+6.0, +8.7]) | 46.9 % (+5.3 pp [+4.1, +6.4]) | 45.4 % (+3.7 pp [+2.8, +4.7]) | 51.3 % (+9.7 pp [+8.2, +11.2]) |
| solo si alguien finge | 41.7 % (+0.0 pp [+0.0, +0.0]) | 41.7 % (+0.0 pp [+0.0, +0.0]) | 45.4 % (+3.7 pp [+2.8, +4.7]) | 51.3 % (+9.7 pp [+8.2, +11.2]) |
| nunca lo cuenta | 41.7 % (+0.0 pp [+0.0, +0.0]) | 41.7 % (+0.0 pp [+0.0, +0.0]) | 11.0 % (−30.7 pp [−33.0, −28.3]) | 9.5 % (−32.1 pp [−34.6, −29.7]) |

- Valor garantizado: informante «lo cuenta» asegura 45.4 %; el bando culpable con «culpable se adelanta» lo deja como mucho en 45.4 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 13.9 % de las rondas; sospechosos posibles al empezar 8.06 (base 8.13); inocentes cuyo único favorito es el culpable 43.3 % (base 35.3 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 22.3 % de esas rondas; se acusa al informante real en 8.6 %.

**Actitud de la mesa** (libre): grupo acusa al culpable, diferencia con la mesa lógica en la misma ronda.

| Jugadores | Informante / bando culpable | Lógica | Crédula | Escéptica | Mixta |
| --- | --- | --- | --- | --- | --- |
| 4 | lo cuenta / nunca finge | 82.7 % | 85.4 % (+2.7 pp [+1.9, +3.5]) | 66.7 % (−16.0 pp [−17.9, −14.1]) | 74.9 % (−7.8 pp [−9.3, −6.3]) |
| 4 | lo cuenta / culpable replica | 86.0 % | 95.1 % (+9.1 pp [+6.9, +11.2]) | 76.0 % (−10.0 pp [−11.5, −8.5]) | 82.6 % (−3.4 pp [−4.7, −2.1]) |
| 4 | solo si alguien finge / culpable se adelanta | 86.0 % | 63.5 % (−22.5 pp [−24.6, −20.4]) | 76.0 % (−10.0 pp [−11.5, −8.5]) | 74.1 % (−11.9 pp [−13.5, −10.2]) |
| 4 | nunca lo cuenta / culpable se adelanta | 38.3 % | 34.7 % (−3.5 pp [−4.5, −2.6]) | 57.6 % (+19.3 pp [+17.3, +21.3]) | 40.9 % (+2.6 pp [+1.3, +3.9]) |
| 5 | lo cuenta / nunca finge | 73.0 % | 74.7 % (+1.7 pp [+1.0, +2.3]) | 52.1 % (−20.9 pp [−22.9, −18.8]) | 69.2 % (−3.8 pp [−4.9, −2.7]) |
| 5 | lo cuenta / culpable replica | 87.8 % | 74.7 % (−13.1 pp [−16.1, −10.2]) | 52.1 % (−35.7 pp [−38.1, −33.2]) | 77.2 % (−10.6 pp [−12.5, −8.7]) |
| 5 | solo si alguien finge / culpable se adelanta | 87.8 % | 31.3 % (−56.5 pp [−59.0, −54.0]) | 52.1 % (−35.7 pp [−38.1, −33.2]) | 67.3 % (−20.5 pp [−22.5, −18.4]) |
| 5 | nunca lo cuenta / culpable se adelanta | 32.1 % | 31.3 % (−0.8 pp [−1.3, −0.3]) | 52.1 % (+20.0 pp [+18.0, +22.0]) | 42.4 % (+10.3 pp [+8.7, +11.8]) |
| 6 | lo cuenta / nunca finge | 64.9 % | 70.0 % (+5.1 pp [+4.0, +6.3]) | 49.1 % (−15.8 pp [−17.6, −14.0]) | 56.3 % (−8.6 pp [−10.1, −7.1]) |
| 6 | lo cuenta / culpable replica | 61.2 % | 71.5 % (+10.3 pp [+8.5, +12.0]) | 50.7 % (−10.5 pp [−12.0, −8.9]) | 59.5 % (−1.7 pp [−2.6, −0.9]) |
| 6 | solo si alguien finge / culpable se adelanta | 56.1 % | 13.4 % (−42.7 pp [−45.2, −40.2]) | 50.4 % (−5.7 pp [−6.8, −4.5]) | 34.9 % (−21.2 pp [−23.3, −19.1]) |
| 6 | nunca lo cuenta / culpable se adelanta | 16.0 % | 8.9 % (−7.1 pp [−8.4, −5.8]) | 47.6 % (+31.6 pp [+29.2, +34.0]) | 17.5 % (+1.5 pp [+0.1, +3.0]) |
| 6 | lo cuenta / cómplice encubre | 54.1 % | 16.2 % (−37.9 pp [−40.3, −35.4]) | 50.8 % (−3.3 pp [−4.2, −2.4]) | 33.4 % (−20.7 pp [−22.7, −18.6]) |
| 10 | lo cuenta / nunca finge | 49.0 % | 49.3 % (+0.3 pp [+0.0, +0.6]) | 41.7 % (−7.3 pp [−8.7, −6.0]) | 47.7 % (−1.3 pp [−1.9, −0.8]) |
| 10 | lo cuenta / culpable replica | 46.9 % | 49.3 % (+2.4 pp [+1.2, +3.6]) | 41.7 % (−5.3 pp [−6.4, −4.1]) | 46.1 % (−0.8 pp [−1.5, −0.1]) |
| 10 | solo si alguien finge / culpable se adelanta | 45.4 % | 8.5 % (−36.9 pp [−39.3, −34.4]) | 41.7 % (−3.7 pp [−4.7, −2.8]) | 35.6 % (−9.8 pp [−11.3, −8.3]) |
| 10 | nunca lo cuenta / culpable se adelanta | 11.0 % | 8.5 % (−2.5 pp [−3.3, −1.7]) | 41.7 % (+30.7 pp [+28.3, +33.0]) | 14.3 % (+3.3 pp [+2.2, +4.5]) |
| 10 | lo cuenta / cómplice encubre | 51.3 % | 6.1 % (−45.2 pp [−47.7, −42.7]) | 41.7 % (−9.7 pp [−11.2, −8.2]) | 39.1 % (−12.3 pp [−13.9, −10.6]) |

### C · Informante incierto (existe con probabilidad 1/2)

| 4 jug. (base 57.6 %) | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 69.8 % (+12.2 pp [+10.5, +13.9]) | 71.8 % (+14.2 pp [+12.4, +16.0]) | 61.9 % (+4.3 pp [+1.9, +6.8]) |
| solo si alguien finge | 57.6 % (+0.0 pp [+0.0, +0.0]) | 57.6 % (+0.0 pp [+0.0, +0.0]) | 61.9 % (+4.3 pp [+1.9, +6.8]) |
| nunca lo cuenta | 57.6 % (+0.0 pp [+0.0, +0.0]) | 57.6 % (+0.0 pp [+0.0, +0.0]) | 38.3 % (−19.3 pp [−21.3, −17.3]) |

- Valor garantizado: informante «lo cuenta» asegura 61.9 %; el bando culpable con «culpable se adelanta» lo deja como mucho en 61.9 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 12.2 % de las rondas; sospechosos posibles al empezar 1.75 (base 1.86); inocentes cuyo único favorito es el culpable 74.6 % (base 64.3 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 58.8 % de esas rondas; se acusa al informante real en 8.5 %.
- Rondas con informante: 50.4 %.

| 5 jug. (base 52.1 %) | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 62.3 % (+10.1 pp [+8.6, +11.7]) | 69.7 % (+17.5 pp [+15.6, +19.5]) | 60.1 % (+8.0 pp [+5.4, +10.6]) |
| solo si alguien finge | 52.1 % (+0.0 pp [+0.0, +0.0]) | 52.1 % (+0.0 pp [+0.0, +0.0]) | 60.1 % (+8.0 pp [+5.4, +10.6]) |
| nunca lo cuenta | 52.1 % (+0.0 pp [+0.0, +0.0]) | 52.1 % (+0.0 pp [+0.0, +0.0]) | 32.1 % (−20.0 pp [−22.0, −18.0]) |

- Valor garantizado: informante «lo cuenta» asegura 60.1 %; el bando culpable con «culpable se adelanta» lo deja como mucho en 60.1 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 10.9 % de las rondas; sospechosos posibles al empezar 2.62 (base 2.83); inocentes cuyo único favorito es el culpable 63.8 % (base 53.2 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 56.1 % de esas rondas; se acusa al informante real en 8.1 %.
- Rondas con informante: 51.5 %.

| 6 jug. (base 46.9 %) | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 55.4 % (+8.5 pp [+7.1, +9.9]) | 53.7 % (+6.8 pp [+5.5, +8.1]) | 37.1 % (−9.9 pp [−12.1, −7.7]) | 36.1 % (−10.9 pp [−13.0, −8.8]) |
| solo si alguien finge | 47.0 % (+0.1 pp [−0.1, +0.2]) | 47.0 % (+0.1 pp [−0.1, +0.2]) | 37.1 % (−9.9 pp [−12.1, −7.7]) | 36.1 % (−10.9 pp [−13.0, −8.8]) |
| nunca lo cuenta | 47.0 % (+0.1 pp [−0.1, +0.2]) | 47.0 % (+0.1 pp [−0.1, +0.2]) | 16.0 % (−30.9 pp [−33.4, −28.5]) | 15.0 % (−31.9 pp [−34.3, −29.6]) |

- Valor garantizado: informante «lo cuenta» asegura 36.1 %; el bando culpable con «cómplice encubre» lo deja como mucho en 36.1 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: «culpable se adelanta», «cómplice encubre».
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 10.5 % de las rondas; sospechosos posibles al empezar 3.97 (base 4.03); inocentes cuyo único favorito es el culpable 57.1 % (base 48.6 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 19.2 % de esas rondas; se acusa al informante real en 7.4 %.
- Rondas con informante: 51.7 %.

| 10 jug. (base 41.7 %) | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 45.4 % (+3.7 pp [+2.8, +4.7]) | 44.6 % (+2.9 pp [+2.1, +3.8]) | 27.1 % (−14.6 pp [−16.7, −12.5]) | 29.3 % (−12.3 pp [−14.7, −10.0]) |
| solo si alguien finge | 41.7 % (+0.0 pp [+0.0, +0.0]) | 41.7 % (+0.0 pp [+0.0, +0.0]) | 27.1 % (−14.6 pp [−16.7, −12.5]) | 29.3 % (−12.3 pp [−14.7, −10.0]) |
| nunca lo cuenta | 41.7 % (+0.0 pp [+0.0, +0.0]) | 41.7 % (+0.0 pp [+0.0, +0.0]) | 11.0 % (−30.7 pp [−33.0, −28.3]) | 9.5 % (−32.1 pp [−34.6, −29.7]) |

- Valor garantizado: informante «lo cuenta» asegura 27.1 %; el bando culpable con «culpable se adelanta» lo deja como mucho en 27.1 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 6.7 % de las rondas; sospechosos posibles al empezar 8.10 (base 8.13); inocentes cuyo único favorito es el culpable 39.0 % (base 35.3 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 14.1 % de esas rondas; se acusa al informante real en 3.8 %.
- Rondas con informante: 47.2 %.

**Actitud de la mesa** (incierto): grupo acusa al culpable, diferencia con la mesa lógica en la misma ronda.

| Jugadores | Informante / bando culpable | Lógica | Crédula | Escéptica | Mixta |
| --- | --- | --- | --- | --- | --- |
| 4 | lo cuenta / nunca finge | 69.8 % | 71.1 % (+1.3 pp [+0.7, +1.8]) | 62.3 % (−7.5 pp [−8.8, −6.1]) | 66.3 % (−3.5 pp [−4.5, −2.4]) |
| 4 | lo cuenta / culpable replica | 71.8 % | 75.9 % (+4.1 pp [+2.6, +5.6]) | 66.9 % (−4.9 pp [−6.0, −3.8]) | 70.1 % (−1.7 pp [−2.6, −0.8]) |
| 4 | solo si alguien finge / culpable se adelanta | 61.9 % | 50.1 % (−11.9 pp [−13.5, −10.2]) | 66.9 % (+5.0 pp [+3.1, +6.9]) | 56.4 % (−5.5 pp [−6.9, −4.2]) |
| 4 | nunca lo cuenta / culpable se adelanta | 38.3 % | 34.7 % (−3.5 pp [−4.5, −2.6]) | 57.6 % (+19.3 pp [+17.3, +21.3]) | 39.3 % (+1.1 pp [−0.1, +2.3]) |
| 5 | lo cuenta / nunca finge | 62.3 % | 63.1 % (+0.8 pp [+0.3, +1.3]) | 52.1 % (−10.1 pp [−11.7, −8.6]) | 60.6 % (−1.7 pp [−2.4, −0.9]) |
| 5 | lo cuenta / culpable replica | 69.7 % | 63.1 % (−6.6 pp [−8.7, −4.5]) | 52.1 % (−17.5 pp [−19.5, −15.6]) | 64.1 % (−5.6 pp [−7.0, −4.2]) |
| 5 | solo si alguien finge / culpable se adelanta | 60.1 % | 31.3 % (−28.8 pp [−31.1, −26.5]) | 52.1 % (−8.0 pp [−10.6, −5.4]) | 51.8 % (−8.3 pp [−10.1, −6.6]) |
| 5 | nunca lo cuenta / culpable se adelanta | 32.1 % | 31.3 % (−0.8 pp [−1.3, −0.3]) | 52.1 % (+20.0 pp [+18.0, +22.0]) | 39.5 % (+7.4 pp [+6.0, +8.8]) |
| 6 | lo cuenta / nunca finge | 55.4 % | 57.7 % (+2.3 pp [+1.6, +3.1]) | 47.9 % (−7.5 pp [−8.8, −6.1]) | 51.5 % (−3.9 pp [−5.0, −2.9]) |
| 6 | lo cuenta / culpable replica | 53.7 % | 58.5 % (+4.8 pp [+3.5, +6.1]) | 48.6 % (−5.1 pp [−6.3, −4.0]) | 52.9 % (−0.8 pp [−1.4, −0.2]) |
| 6 | solo si alguien finge / culpable se adelanta | 37.1 % | 11.0 % (−26.1 pp [−28.3, −23.8]) | 48.5 % (+11.4 pp [+9.3, +13.5]) | 25.2 % (−11.9 pp [−13.7, −10.1]) |
| 6 | nunca lo cuenta / culpable se adelanta | 16.0 % | 8.7 % (−7.3 pp [−8.7, −6.0]) | 47.2 % (+31.2 pp [+28.8, +33.6]) | 15.7 % (−0.3 pp [−1.7, +1.0]) |
| 6 | lo cuenta / cómplice encubre | 36.1 % | 11.3 % (−24.7 pp [−26.9, −22.5]) | 49.0 % (+12.9 pp [+11.0, +14.9]) | 24.1 % (−11.9 pp [−13.7, −10.1]) |
| 10 | lo cuenta / nunca finge | 45.4 % | 45.5 % (+0.1 pp [−0.1, +0.3]) | 41.7 % (−3.7 pp [−4.7, −2.8]) | 44.8 % (−0.6 pp [−1.0, −0.2]) |
| 10 | lo cuenta / culpable replica | 44.6 % | 45.5 % (+0.9 pp [+0.1, +1.8]) | 41.7 % (−2.9 pp [−3.8, −2.1]) | 44.4 % (−0.2 pp [−0.7, +0.3]) |
| 10 | solo si alguien finge / culpable se adelanta | 27.1 % | 8.5 % (−18.5 pp [−20.5, −16.6]) | 41.7 % (+14.6 pp [+12.5, +16.7]) | 22.3 % (−4.7 pp [−6.0, −3.4]) |
| 10 | nunca lo cuenta / culpable se adelanta | 11.0 % | 8.5 % (−2.5 pp [−3.3, −1.7]) | 41.7 % (+30.7 pp [+28.3, +33.0]) | 13.3 % (+2.3 pp [+1.3, +3.4]) |
| 10 | lo cuenta / cómplice encubre | 29.3 % | 6.1 % (−23.2 pp [−25.3, −21.1]) | 41.7 % (+12.3 pp [+10.0, +14.7]) | 23.1 % (−6.3 pp [−7.7, −4.8]) |

### D · «X no es la persona culpable» (puede ser la cómplice)

| 4 jug. (base 57.6 %) | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 82.3 % (+24.7 pp [+22.5, +26.9]) | 86.0 % (+28.4 pp [+26.1, +30.7]) | 86.0 % (+28.4 pp [+26.1, +30.7]) |
| solo si alguien finge | 57.6 % (+0.0 pp [+0.0, +0.0]) | 57.6 % (+0.0 pp [+0.0, +0.0]) | 86.0 % (+28.4 pp [+26.1, +30.7]) |
| nunca lo cuenta | 57.6 % (+0.0 pp [+0.0, +0.0]) | 57.6 % (+0.0 pp [+0.0, +0.0]) | 38.3 % (−19.3 pp [−21.3, −17.3]) |

- Valor garantizado: informante «lo cuenta» asegura 82.3 %; el bando culpable con «nunca finge» lo deja como mucho en 82.3 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 24.9 % de las rondas; sospechosos posibles al empezar 1.64 (base 1.86); inocentes cuyo único favorito es el culpable 86.1 % (base 64.3 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 74.1 % de esas rondas; se acusa al informante real en 15.8 %.

| 5 jug. (base 52.1 %) | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 71.2 % (+19.1 pp [+17.1, +21.1]) | 87.8 % (+35.7 pp [+33.2, +38.1]) | 87.8 % (+35.7 pp [+33.2, +38.1]) |
| solo si alguien finge | 52.1 % (+0.0 pp [+0.0, +0.0]) | 52.1 % (+0.0 pp [+0.0, +0.0]) | 87.8 % (+35.7 pp [+33.2, +38.1]) |
| nunca lo cuenta | 52.1 % (+0.0 pp [+0.0, +0.0]) | 52.1 % (+0.0 pp [+0.0, +0.0]) | 32.1 % (−20.0 pp [−22.0, −18.0]) |

- Valor garantizado: informante «lo cuenta» asegura 71.2 %; el bando culpable con «nunca finge» lo deja como mucho en 71.2 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 21.1 % de las rondas; sospechosos posibles al empezar 2.43 (base 2.83); inocentes cuyo único favorito es el culpable 73.5 % (base 53.2 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 73.9 % de esas rondas; se acusa al informante real en 13.3 %.

| 6 jug. (base 46.9 %) | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 60.2 % (+13.3 pp [+11.5, +15.0]) | 58.1 % (+11.1 pp [+9.5, +12.7]) | 52.5 % (+5.5 pp [+4.4, +6.7]) | 54.3 % (+7.3 pp [+6.0, +8.7]) |
| solo si alguien finge | 47.0 % (+0.1 pp [−0.1, +0.2]) | 47.0 % (+0.1 pp [−0.1, +0.2]) | 52.5 % (+5.5 pp [+4.4, +6.7]) | 54.3 % (+7.3 pp [+6.0, +8.7]) |
| nunca lo cuenta | 47.0 % (+0.1 pp [−0.1, +0.2]) | 47.0 % (+0.1 pp [−0.1, +0.2]) | 10.3 % (−36.6 pp [−39.0, −34.2]) | 14.2 % (−32.7 pp [−35.1, −30.4]) |

- Valor garantizado: informante «lo cuenta» asegura 52.5 %; el bando culpable con «culpable se adelanta» lo deja como mucho en 52.5 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 17.5 % de las rondas; sospechosos posibles al empezar 3.91 (base 4.03); inocentes cuyo único favorito es el culpable 64.5 % (base 48.6 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 25.4 % de esas rondas; se acusa al informante real en 14.1 %.

| 10 jug. (base 41.7 %) | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 48.5 % (+6.8 pp [+5.5, +8.1]) | 46.4 % (+4.7 pp [+3.7, +5.8]) | 44.3 % (+2.7 pp [+1.9, +3.5]) | 51.0 % (+9.3 pp [+7.9, +10.8]) |
| solo si alguien finge | 41.7 % (+0.0 pp [+0.0, +0.0]) | 41.7 % (+0.0 pp [+0.0, +0.0]) | 44.3 % (+2.7 pp [+1.9, +3.5]) | 51.0 % (+9.3 pp [+7.9, +10.8]) |
| nunca lo cuenta | 41.7 % (+0.0 pp [+0.0, +0.0]) | 41.7 % (+0.0 pp [+0.0, +0.0]) | 8.3 % (−33.3 pp [−35.7, −30.9]) | 5.1 % (−36.6 pp [−39.0, −34.2]) |

- Valor garantizado: informante «lo cuenta» asegura 44.3 %; el bando culpable con «culpable se adelanta» lo deja como mucho en 44.3 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 13.3 % de las rondas; sospechosos posibles al empezar 8.06 (base 8.13); inocentes cuyo único favorito es el culpable 42.0 % (base 35.3 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 21.3 % de esas rondas; se acusa al informante real en 9.3 %.

**Actitud de la mesa** (nocupable): grupo acusa al culpable, diferencia con la mesa lógica en la misma ronda.

| Jugadores | Informante / bando culpable | Lógica | Crédula | Escéptica | Mixta |
| --- | --- | --- | --- | --- | --- |
| 4 | lo cuenta / nunca finge | 82.3 % | 85.0 % (+2.7 pp [+1.9, +3.5]) | 66.5 % (−15.8 pp [−17.6, −14.0]) | 74.7 % (−7.6 pp [−9.0, −6.2]) |
| 4 | lo cuenta / culpable replica | 86.0 % | 94.9 % (+8.9 pp [+6.7, +11.0]) | 76.0 % (−10.0 pp [−11.5, −8.5]) | 82.9 % (−3.1 pp [−4.4, −1.8]) |
| 4 | solo si alguien finge / culpable se adelanta | 86.0 % | 63.5 % (−22.5 pp [−24.6, −20.4]) | 76.0 % (−10.0 pp [−11.5, −8.5]) | 74.1 % (−11.9 pp [−13.5, −10.2]) |
| 4 | nunca lo cuenta / culpable se adelanta | 38.3 % | 34.7 % (−3.5 pp [−4.5, −2.6]) | 57.6 % (+19.3 pp [+17.3, +21.3]) | 40.9 % (+2.6 pp [+1.3, +3.9]) |
| 5 | lo cuenta / nunca finge | 71.2 % | 72.9 % (+1.7 pp [+1.0, +2.3]) | 52.1 % (−19.1 pp [−21.1, −17.1]) | 67.4 % (−3.8 pp [−4.9, −2.7]) |
| 5 | lo cuenta / culpable replica | 87.8 % | 72.9 % (−14.9 pp [−17.9, −12.0]) | 52.1 % (−35.7 pp [−38.1, −33.2]) | 77.1 % (−10.7 pp [−12.7, −8.8]) |
| 5 | solo si alguien finge / culpable se adelanta | 87.8 % | 31.3 % (−56.5 pp [−59.0, −54.0]) | 52.1 % (−35.7 pp [−38.1, −33.2]) | 67.3 % (−20.5 pp [−22.5, −18.4]) |
| 5 | nunca lo cuenta / culpable se adelanta | 32.1 % | 31.3 % (−0.8 pp [−1.3, −0.3]) | 52.1 % (+20.0 pp [+18.0, +22.0]) | 42.4 % (+10.3 pp [+8.7, +11.8]) |
| 6 | lo cuenta / nunca finge | 60.2 % | 65.0 % (+4.8 pp [+3.7, +5.9]) | 47.9 % (−12.3 pp [−13.9, −10.6]) | 53.3 % (−6.9 pp [−8.3, −5.6]) |
| 6 | lo cuenta / culpable replica | 58.1 % | 68.1 % (+10.0 pp [+8.2, +11.8]) | 50.2 % (−7.9 pp [−9.2, −6.5]) | 56.9 % (−1.2 pp [−2.0, −0.4]) |
| 6 | solo si alguien finge / culpable se adelanta | 52.5 % | 8.7 % (−43.7 pp [−46.2, −41.2]) | 49.9 % (−2.6 pp [−3.4, −1.8]) | 31.1 % (−21.4 pp [−23.5, −19.3]) |
| 6 | nunca lo cuenta / culpable se adelanta | 10.3 % | 5.0 % (−5.3 pp [−6.5, −4.2]) | 47.0 % (+36.7 pp [+34.2, +39.1]) | 13.2 % (+2.9 pp [+1.4, +4.3]) |
| 6 | lo cuenta / cómplice encubre | 54.3 % | 11.1 % (−43.1 pp [−45.6, −40.6]) | 50.7 % (−3.5 pp [−4.5, −2.6]) | 31.3 % (−22.9 pp [−25.1, −20.8]) |
| 10 | lo cuenta / nunca finge | 48.5 % | 48.9 % (+0.4 pp [+0.1, +0.7]) | 41.7 % (−6.8 pp [−8.1, −5.5]) | 47.8 % (−0.7 pp [−1.1, −0.2]) |
| 10 | lo cuenta / culpable replica | 46.4 % | 48.9 % (+2.5 pp [+1.3, +3.7]) | 41.7 % (−4.7 pp [−5.8, −3.7]) | 45.8 % (−0.6 pp [−1.3, +0.1]) |
| 10 | solo si alguien finge / culpable se adelanta | 44.3 % | 6.0 % (−38.3 pp [−40.8, −35.9]) | 41.7 % (−2.7 pp [−3.5, −1.9]) | 34.5 % (−9.8 pp [−11.3, −8.3]) |
| 10 | nunca lo cuenta / culpable se adelanta | 8.3 % | 6.0 % (−2.3 pp [−3.1, −1.6]) | 41.7 % (+33.3 pp [+30.9, +35.7]) | 12.2 % (+3.9 pp [+2.7, +5.0]) |
| 10 | lo cuenta / cómplice encubre | 51.0 % | 0.8 % (−50.2 pp [−52.7, −47.7]) | 41.7 % (−9.3 pp [−10.8, −7.9]) | 36.7 % (−14.3 pp [−16.0, −12.5]) |

### E · Informante con aval (la persona nombrada sabe quién es)

| 4 jug. (base 57.6 %) | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 85.4 % (+27.8 pp [+25.5, +30.1]) | 100.0 % (+42.4 pp [+39.9, +44.9]) | 100.0 % (+42.4 pp [+39.9, +44.9]) |
| solo si alguien finge | 57.6 % (+0.0 pp [+0.0, +0.0]) | 57.6 % (+0.0 pp [+0.0, +0.0]) | 100.0 % (+42.4 pp [+39.9, +44.9]) |
| nunca lo cuenta | 57.6 % (+0.0 pp [+0.0, +0.0]) | 57.6 % (+0.0 pp [+0.0, +0.0]) | 100.0 % (+42.4 pp [+39.9, +44.9]) |

- Valor garantizado: informante «lo cuenta» asegura 85.4 %; el bando culpable con «nunca finge» lo deja como mucho en 85.4 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: «nunca finge».
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 27.9 % de las rondas; sospechosos posibles al empezar 1.21 (base 1.86); inocentes cuyo único favorito es el culpable 91.1 % (base 64.3 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 100.0 % de esas rondas; se acusa al informante real en 0.0 %.

| 5 jug. (base 52.1 %) | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 74.7 % (+22.5 pp [+20.4, +24.6]) | 100.0 % (+47.9 pp [+45.3, +50.4]) | 100.0 % (+47.9 pp [+45.3, +50.4]) |
| solo si alguien finge | 52.1 % (+0.0 pp [+0.0, +0.0]) | 52.1 % (+0.0 pp [+0.0, +0.0]) | 100.0 % (+47.9 pp [+45.3, +50.4]) |
| nunca lo cuenta | 52.1 % (+0.0 pp [+0.0, +0.0]) | 52.1 % (+0.0 pp [+0.0, +0.0]) | 100.0 % (+47.9 pp [+45.3, +50.4]) |

- Valor garantizado: informante «lo cuenta» asegura 74.7 %; el bando culpable con «nunca finge» lo deja como mucho en 74.7 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: «nunca finge».
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 23.9 % de las rondas; sospechosos posibles al empezar 1.82 (base 2.83); inocentes cuyo único favorito es el culpable 77.4 % (base 53.2 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 100.0 % de esas rondas; se acusa al informante real en 0.0 %.

| 6 jug. (base 46.9 %) | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 65.2 % (+18.3 pp [+16.3, +20.2]) | 73.4 % (+26.5 pp [+24.2, +28.7]) | 75.5 % (+28.5 pp [+26.2, +30.8]) | 75.5 % (+28.5 pp [+26.2, +30.8]) |
| solo si alguien finge | 47.0 % (+0.1 pp [−0.1, +0.2]) | 47.0 % (+0.1 pp [−0.1, +0.2]) | 75.5 % (+28.5 pp [+26.2, +30.8]) | 75.5 % (+28.5 pp [+26.2, +30.8]) |
| nunca lo cuenta | 47.0 % (+0.1 pp [−0.1, +0.2]) | 47.0 % (+0.1 pp [−0.1, +0.2]) | 21.7 % (−25.3 pp [−27.9, −22.6]) | 21.7 % (−25.3 pp [−27.9, −22.6]) |

- Valor garantizado: informante «lo cuenta» asegura 65.2 %; el bando culpable con «nunca finge» lo deja como mucho en 65.2 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 22.3 % de las rondas; sospechosos posibles al empezar 3.56 (base 4.03); inocentes cuyo único favorito es el culpable 67.4 % (base 48.6 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 36.3 % de esas rondas; se acusa al informante real en 9.7 %.

| 10 jug. (base 41.7 %) | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 49.0 % (+7.3 pp [+6.0, +8.7]) | 51.9 % (+10.2 pp [+8.7, +11.7]) | 78.1 % (+36.4 pp [+34.0, +38.8]) | 78.1 % (+36.4 pp [+34.0, +38.8]) |
| solo si alguien finge | 41.7 % (+0.0 pp [+0.0, +0.0]) | 41.7 % (+0.0 pp [+0.0, +0.0]) | 78.1 % (+36.4 pp [+34.0, +38.8]) | 78.1 % (+36.4 pp [+34.0, +38.8]) |
| nunca lo cuenta | 41.7 % (+0.0 pp [+0.0, +0.0]) | 41.7 % (+0.0 pp [+0.0, +0.0]) | 9.6 % (−32.1 pp [−34.5, −29.6]) | 9.6 % (−32.1 pp [−34.5, −29.6]) |

- Valor garantizado: informante «lo cuenta» asegura 49.0 %; el bando culpable con «nunca finge» lo deja como mucho en 49.0 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 13.9 % de las rondas; sospechosos posibles al empezar 7.86 (base 8.13); inocentes cuyo único favorito es el culpable 43.3 % (base 35.3 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 32.8 % de esas rondas; se acusa al informante real en 8.1 %.

**Actitud de la mesa** (mutuo): grupo acusa al culpable, diferencia con la mesa lógica en la misma ronda.

| Jugadores | Informante / bando culpable | Lógica | Crédula | Escéptica | Mixta |
| --- | --- | --- | --- | --- | --- |
| 4 | lo cuenta / nunca finge | 85.4 % | 85.4 % (+0.0 pp [+0.0, +0.0]) | 75.5 % (−9.9 pp [−11.4, −8.4]) | 81.5 % (−3.9 pp [−4.9, −2.9]) |
| 4 | lo cuenta / culpable replica | 100.0 % | 100.0 % (+0.0 pp [+0.0, +0.0]) | 89.7 % (−10.3 pp [−11.8, −8.7]) | 95.9 % (−4.1 pp [−5.1, −3.1]) |
| 4 | solo si alguien finge / culpable se adelanta | 100.0 % | 85.7 % (−14.3 pp [−16.0, −12.5]) | 89.7 % (−10.3 pp [−11.8, −8.7]) | 92.1 % (−7.9 pp [−9.3, −6.6]) |
| 4 | nunca lo cuenta / culpable se adelanta | 100.0 % | 85.7 % (−14.3 pp [−16.0, −12.5]) | 89.7 % (−10.3 pp [−11.8, −8.7]) | 92.1 % (−7.9 pp [−9.3, −6.6]) |
| 5 | lo cuenta / nunca finge | 74.7 % | 74.7 % (+0.0 pp [+0.0, +0.0]) | 52.1 % (−22.5 pp [−24.6, −20.4]) | 71.9 % (−2.7 pp [−3.6, −1.9]) |
| 5 | lo cuenta / culpable replica | 100.0 % | 100.0 % (+0.0 pp [+0.0, +0.0]) | 75.9 % (−24.1 pp [−26.3, −22.0]) | 97.3 % (−2.7 pp [−3.6, −1.9]) |
| 5 | solo si alguien finge / culpable se adelanta | 100.0 % | 65.2 % (−34.8 pp [−37.2, −32.4]) | 75.9 % (−24.1 pp [−26.3, −22.0]) | 88.6 % (−11.4 pp [−13.0, −9.8]) |
| 5 | nunca lo cuenta / culpable se adelanta | 100.0 % | 65.2 % (−34.8 pp [−37.2, −32.4]) | 75.9 % (−24.1 pp [−26.3, −22.0]) | 88.6 % (−11.4 pp [−13.0, −9.8]) |
| 6 | lo cuenta / nunca finge | 65.2 % | 70.0 % (+4.8 pp [+3.7, +5.9]) | 51.0 % (−14.2 pp [−16.0, −12.4]) | 59.1 % (−6.1 pp [−7.5, −4.8]) |
| 6 | lo cuenta / culpable replica | 73.4 % | 72.9 % (−0.5 pp [−0.8, −0.1]) | 55.4 % (−18.0 pp [−19.9, −16.1]) | 68.9 % (−4.5 pp [−5.5, −3.4]) |
| 6 | solo si alguien finge / culpable se adelanta | 75.5 % | 37.9 % (−37.5 pp [−40.0, −35.1]) | 67.2 % (−8.3 pp [−9.7, −6.9]) | 58.7 % (−16.8 pp [−18.7, −14.9]) |
| 6 | nunca lo cuenta / culpable se adelanta | 21.7 % | 13.3 % (−8.4 pp [−9.8, −7.0]) | 50.5 % (+28.8 pp [+26.4, +31.2]) | 25.2 % (+3.5 pp [+2.0, +5.1]) |
| 6 | lo cuenta / cómplice encubre | 75.5 % | 37.9 % (−37.5 pp [−40.0, −35.1]) | 67.2 % (−8.3 pp [−9.7, −6.9]) | 58.7 % (−16.8 pp [−18.7, −14.9]) |
| 10 | lo cuenta / nunca finge | 49.0 % | 49.3 % (+0.3 pp [+0.0, +0.6]) | 41.7 % (−7.3 pp [−8.7, −6.0]) | 48.2 % (−0.8 pp [−1.3, −0.3]) |
| 10 | lo cuenta / culpable replica | 51.9 % | 49.3 % (−2.5 pp [−3.3, −1.7]) | 41.7 % (−10.2 pp [−11.7, −8.7]) | 51.0 % (−0.9 pp [−1.3, −0.4]) |
| 10 | solo si alguien finge / culpable se adelanta | 78.1 % | 6.3 % (−71.8 pp [−74.1, −69.5]) | 41.8 % (−36.3 pp [−38.7, −33.8]) | 59.0 % (−19.1 pp [−21.1, −17.1]) |
| 10 | nunca lo cuenta / culpable se adelanta | 9.6 % | 6.3 % (−3.3 pp [−4.2, −2.4]) | 41.8 % (+32.2 pp [+29.7, +34.7]) | 16.7 % (+7.1 pp [+5.6, +8.5]) |
| 10 | lo cuenta / cómplice encubre | 78.1 % | 6.3 % (−71.8 pp [−74.1, −69.5]) | 41.8 % (−36.3 pp [−38.7, −33.8]) | 59.0 % (−19.1 pp [−21.1, −17.1]) |

### F · Testigo de una hora («X estuvo en Z a las H»)

| 4 jug. (base 57.6 %) | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 75.1 % (+17.5 pp [+15.5, +19.4]) | 86.0 % (+28.4 pp [+26.1, +30.7]) | 86.0 % (+28.4 pp [+26.1, +30.7]) |
| solo si alguien finge | 57.6 % (+0.0 pp [+0.0, +0.0]) | 57.6 % (+0.0 pp [+0.0, +0.0]) | 86.0 % (+28.4 pp [+26.1, +30.7]) |
| nunca lo cuenta | 57.6 % (+0.0 pp [+0.0, +0.0]) | 57.6 % (+0.0 pp [+0.0, +0.0]) | 38.3 % (−19.3 pp [−21.3, −17.3]) |

- Valor garantizado: informante «lo cuenta» asegura 75.1 %; el bando culpable con «nunca finge» lo deja como mucho en 75.1 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 17.5 % de las rondas; sospechosos posibles al empezar 1.77 (base 1.86); inocentes cuyo único favorito es el culpable 80.8 % (base 64.3 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 74.1 % de esas rondas; se acusa al informante real en 15.8 %.

| 5 jug. (base 52.1 %) | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 67.3 % (+15.1 pp [+13.3, +16.9]) | 87.9 % (+35.7 pp [+33.3, +38.2]) | 87.9 % (+35.7 pp [+33.3, +38.2]) |
| solo si alguien finge | 52.1 % (+0.0 pp [+0.0, +0.0]) | 52.1 % (+0.0 pp [+0.0, +0.0]) | 87.9 % (+35.7 pp [+33.3, +38.2]) |
| nunca lo cuenta | 52.1 % (+0.0 pp [+0.0, +0.0]) | 52.1 % (+0.0 pp [+0.0, +0.0]) | 32.1 % (−20.0 pp [−22.0, −18.0]) |

- Valor garantizado: informante «lo cuenta» asegura 67.3 %; el bando culpable con «nunca finge» lo deja como mucho en 67.3 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 15.8 % de las rondas; sospechosos posibles al empezar 2.63 (base 2.83); inocentes cuyo único favorito es el culpable 68.8 % (base 53.2 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 73.9 % de esas rondas; se acusa al informante real en 13.2 %.

| 6 jug. (base 46.9 %) | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 56.1 % (+9.2 pp [+7.7, +10.7]) | 51.7 % (+4.7 pp [+3.7, +5.8]) | 51.7 % (+4.7 pp [+3.7, +5.8]) | 55.3 % (+8.4 pp [+7.0, +9.8]) |
| solo si alguien finge | 46.9 % (+0.0 pp [+0.0, +0.0]) | 46.9 % (+0.0 pp [+0.0, +0.0]) | 51.7 % (+4.7 pp [+3.7, +5.8]) | 55.3 % (+8.4 pp [+7.0, +9.8]) |
| nunca lo cuenta | 46.9 % (+0.0 pp [+0.0, +0.0]) | 46.9 % (+0.0 pp [+0.0, +0.0]) | 10.9 % (−36.1 pp [−38.5, −33.6]) | 19.9 % (−27.0 pp [−29.4, −24.6]) |

- Valor garantizado: informante «lo cuenta» asegura 51.7 %; el bando culpable con «culpable replica» lo deja como mucho en 51.7 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 11.9 % de las rondas; sospechosos posibles al empezar 3.99 (base 4.03); inocentes cuyo único favorito es el culpable 60.3 % (base 48.6 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 24.5 % de esas rondas; se acusa al informante real en 13.6 %.

| 10 jug. (base 41.7 %) | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 45.9 % (+4.3 pp [+3.2, +5.3]) | 43.6 % (+1.9 pp [+1.2, +2.6]) | 43.6 % (+1.9 pp [+1.2, +2.6]) | 51.5 % (+9.8 pp [+8.3, +11.3]) |
| solo si alguien finge | 41.7 % (+0.0 pp [+0.0, +0.0]) | 41.7 % (+0.0 pp [+0.0, +0.0]) | 43.6 % (+1.9 pp [+1.2, +2.6]) | 51.5 % (+9.8 pp [+8.3, +11.3]) |
| nunca lo cuenta | 41.7 % (+0.0 pp [+0.0, +0.0]) | 41.7 % (+0.0 pp [+0.0, +0.0]) | 8.4 % (−33.3 pp [−35.7, −30.9]) | 7.2 % (−34.5 pp [−36.9, −32.0]) |

- Valor garantizado: informante «lo cuenta» asegura 43.6 %; el bando culpable con «culpable replica» lo deja como mucho en 43.6 % (equilibrio con estrategias puras). Estrategia del informante que nunca es peor que otra (dentro del IC): «lo cuenta». Del bando culpable: ninguna.
- Con «lo cuenta» y «nunca finge»: el acusado cambia respecto a la ronda base en 8.6 % de las rondas; sospechosos posibles al empezar 8.12 (base 8.13); inocentes cuyo único favorito es el culpable 40.2 % (base 35.3 %).
- Cuando alguien finge ser el informante: se acusa a quien finge en 21.0 % de esas rondas; se acusa al informante real en 9.2 %.

**Actitud de la mesa** (hora): grupo acusa al culpable, diferencia con la mesa lógica en la misma ronda.

| Jugadores | Informante / bando culpable | Lógica | Crédula | Escéptica | Mixta |
| --- | --- | --- | --- | --- | --- |
| 4 | lo cuenta / nunca finge | 75.1 % | 77.7 % (+2.7 pp [+1.9, +3.5]) | 62.0 % (−13.1 pp [−14.8, −11.4]) | 68.3 % (−6.8 pp [−8.2, −5.4]) |
| 4 | lo cuenta / culpable replica | 86.0 % | 91.9 % (+5.9 pp [+3.6, +8.3]) | 76.0 % (−10.0 pp [−11.5, −8.5]) | 81.9 % (−4.1 pp [−5.4, −2.7]) |
| 4 | solo si alguien finge / culpable se adelanta | 86.0 % | 63.8 % (−22.2 pp [−24.3, −20.1]) | 76.0 % (−10.0 pp [−11.5, −8.5]) | 74.1 % (−11.9 pp [−13.5, −10.2]) |
| 4 | nunca lo cuenta / culpable se adelanta | 38.3 % | 34.7 % (−3.5 pp [−4.5, −2.6]) | 57.7 % (+19.4 pp [+17.4, +21.4]) | 40.9 % (+2.7 pp [+1.4, +4.0]) |
| 5 | lo cuenta / nunca finge | 67.3 % | 68.9 % (+1.7 pp [+1.0, +2.3]) | 52.1 % (−15.1 pp [−16.9, −13.3]) | 64.1 % (−3.2 pp [−4.2, −2.2]) |
| 5 | lo cuenta / culpable replica | 87.9 % | 68.9 % (−18.9 pp [−22.0, −15.8]) | 52.1 % (−35.7 pp [−38.2, −33.3]) | 75.4 % (−12.5 pp [−14.5, −10.5]) |
| 5 | solo si alguien finge / culpable se adelanta | 87.9 % | 31.3 % (−56.5 pp [−59.0, −54.0]) | 52.1 % (−35.7 pp [−38.2, −33.3]) | 67.5 % (−20.4 pp [−22.4, −18.4]) |
| 5 | nunca lo cuenta / culpable se adelanta | 32.1 % | 31.3 % (−0.8 pp [−1.3, −0.3]) | 52.1 % (+20.0 pp [+18.0, +22.0]) | 42.4 % (+10.3 pp [+8.7, +11.8]) |
| 6 | lo cuenta / nunca finge | 56.1 % | 58.7 % (+2.6 pp [+1.8, +3.4]) | 47.5 % (−8.6 pp [−10.0, −7.2]) | 51.1 % (−5.0 pp [−6.1, −3.9]) |
| 6 | lo cuenta / culpable replica | 51.7 % | 61.5 % (+9.9 pp [+8.1, +11.7]) | 49.2 % (−2.5 pp [−3.3, −1.7]) | 51.7 % (+0.0 pp [−0.6, +0.6]) |
| 6 | solo si alguien finge / culpable se adelanta | 51.7 % | 9.0 % (−42.7 pp [−45.2, −40.2]) | 49.2 % (−2.5 pp [−3.3, −1.7]) | 30.0 % (−21.7 pp [−23.8, −19.6]) |
| 6 | nunca lo cuenta / culpable se adelanta | 10.9 % | 5.1 % (−5.7 pp [−6.9, −4.6]) | 46.9 % (+36.1 pp [+33.6, +38.5]) | 13.5 % (+2.6 pp [+1.1, +4.1]) |
| 6 | lo cuenta / cómplice encubre | 55.3 % | 18.3 % (−37.1 pp [−39.5, −34.6]) | 50.7 % (−4.6 pp [−5.7, −3.5]) | 35.5 % (−19.9 pp [−21.9, −17.8]) |
| 10 | lo cuenta / nunca finge | 45.9 % | 46.2 % (+0.3 pp [+0.0, +0.5]) | 41.7 % (−4.3 pp [−5.3, −3.2]) | 45.2 % (−0.7 pp [−1.2, −0.3]) |
| 10 | lo cuenta / culpable replica | 43.6 % | 46.2 % (+2.6 pp [+1.4, +3.8]) | 41.7 % (−1.9 pp [−2.6, −1.2]) | 43.2 % (−0.4 pp [−1.0, +0.2]) |
| 10 | solo si alguien finge / culpable se adelanta | 43.6 % | 6.1 % (−37.5 pp [−40.0, −35.1]) | 41.7 % (−1.9 pp [−2.6, −1.2]) | 34.3 % (−9.3 pp [−10.8, −7.9]) |
| 10 | nunca lo cuenta / culpable se adelanta | 8.4 % | 6.1 % (−2.3 pp [−3.1, −1.6]) | 41.7 % (+33.3 pp [+30.9, +35.7]) | 12.4 % (+4.0 pp [+2.8, +5.2]) |
| 10 | lo cuenta / cómplice encubre | 51.5 % | 2.5 % (−49.0 pp [−51.5, −46.5]) | 41.7 % (−9.8 pp [−11.3, −8.3]) | 37.2 % (−14.3 pp [−16.0, −12.5]) |

## 4. Resumen: valor garantizado de cada variante

Para cada variante y tamaño, el porcentaje que el grupo se asegura con su mejor estrategia del informante cuando el bando culpable responde con la suya (mesa lógica), frente al juego base. Es la cifra que no depende de suponer que el bando culpable juega mal.

| Variante | 4 jug. | 5 jug. | 6 jug. | 10 jug. |
| --- | --- | --- | --- | --- |
| Juego base | 57.6 % | 52.1 % | 46.9 % | 41.7 % |
| A · Informante libre | 82.7 % (+25.1 pp) | 73.0 % (+20.9 pp) | 54.1 % (+7.1 pp) | 45.4 % (+3.7 pp) |
| C · Informante incierto (existe con probabilidad 1/2) | 61.9 % (+4.3 pp) | 60.1 % (+8.0 pp) | 36.1 % (−10.9 pp) | 27.1 % (−14.6 pp) |
| D · «X no es la persona culpable» (puede ser la cómplice) | 82.3 % (+24.7 pp) | 71.2 % (+19.1 pp) | 52.5 % (+5.5 pp) | 44.3 % (+2.7 pp) |
| E · Informante con aval (la persona nombrada sabe quién es) | 85.4 % (+27.8 pp) | 74.7 % (+22.5 pp) | 65.2 % (+18.3 pp) | 49.0 % (+7.3 pp) |
| F · Testigo de una hora («X estuvo en Z a las H») | 75.1 % (+17.5 pp) | 67.3 % (+15.1 pp) | 51.7 % (+4.7 pp) | 43.6 % (+1.9 pp) |

Puntos por persona y ronda con la variante libre («lo cuenta», «nunca finge») frente a la base:

| Jugadores | Inocente base → variante | Culpable base → variante | Cómplice base → variante |
| --- | --- | --- | --- |
| 4 | 2.04 → 2.71 | 1.70 → 0.69 | n/a |
| 5 | 1.80 → 2.38 | 1.91 → 1.08 | n/a |
| 6 | 1.70 → 2.21 | 2.12 → 1.41 | 1.59 → 1.05 |
| 10 | 1.39 → 1.61 | 2.33 → 2.04 | 1.75 → 1.53 |

