# Auditoría de equilibrio: datos de simulación

Generado con `npm run balance -- 2000`: 2000 rondas por celda, semillas fijas `{bloque}-{jugadores}-{estrategia}-{i}`, motor real.
Los intervalos son del 95 % (Wilson para porcentajes; normal para medias y diferencias emparejadas).
Bots, no personas: publican solo recuerdos ciertos que no les perjudican, deducen con una fórmula fija y no cambian de idea tras la defensa.

## 1. Juego base: quién gana

Estrategias del culpable: **mínimo** (solo miente a la hora del incidente), **esquiva** (miente además a una de las horas de las pruebas), **total** (miente a las tres horas).

| Jugadores | Estrategia | Grupo acusa al culpable | Nadie acusado | Acusan al cómplice | Desempate | Favoritos empatados del bot inocente | El bot tiene un único favorito |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | minimo | 72.9% [70.9–74.8] | 0.0% [0.0–0.2] | n/a | 0.0% [0.0–0.2] | 1.34 ±0.02 | 65.7% [63.6–67.7] |
| 4 | esquiva | 47.2% [45.0–49.4] | 0.0% [0.0–0.2] | n/a | 0.0% [0.0–0.2] | 1.09 ±0.01 | 91.5% [90.1–92.6] |
| 4 | total | 52.0% [49.8–54.2] | 0.0% [0.0–0.2] | n/a | 0.0% [0.0–0.2] | 1.00 ±0.00 | 100.0% [99.8–100.0] |
| 5 | minimo | 62.1% [59.9–64.2] | 0.0% [0.0–0.2] | n/a | 0.0% [0.0–0.2] | 1.59 ±0.02 | 43.7% [41.5–45.9] |
| 5 | esquiva | 42.0% [39.9–44.2] | 0.0% [0.0–0.2] | n/a | 0.0% [0.0–0.2] | 1.16 ±0.02 | 85.5% [83.9–87.0] |
| 5 | total | 52.5% [50.3–54.7] | 0.0% [0.0–0.2] | n/a | 0.0% [0.0–0.2] | 1.00 ±0.00 | 100.0% [99.8–100.0] |
| 6 | minimo | 53.6% [51.5–55.8] | 0.0% [0.0–0.2] | 3.3% [2.6–4.1] | 0.0% [0.0–0.2] | 1.34 ±0.02 | 68.3% [66.2–70.3] |
| 6 | esquiva | 45.9% [43.7–48.0] | 0.0% [0.0–0.2] | 2.5% [1.9–3.2] | 0.1% [0.0–0.3] | 1.17 ±0.02 | 84.6% [83.0–86.1] |
| 6 | total | 39.8% [37.6–41.9] | 0.0% [0.0–0.2] | 1.9% [1.4–2.6] | 0.0% [0.0–0.2] | 1.24 ±0.02 | 77.1% [75.3–78.9] |
| 7 | minimo | 58.0% [55.8–60.1] | 0.0% [0.0–0.2] | 3.5% [2.8–4.5] | 0.0% [0.0–0.2] | 1.44 ±0.03 | 60.2% [58.0–62.3] |
| 7 | esquiva | 46.6% [44.4–48.7] | 0.0% [0.0–0.2] | 2.2% [1.6–2.9] | 0.0% [0.0–0.2] | 1.20 ±0.02 | 82.7% [81.0–84.3] |
| 7 | total | 46.4% [44.2–48.6] | 0.0% [0.0–0.2] | 1.9% [1.4–2.6] | 0.0% [0.0–0.2] | 1.30 ±0.02 | 72.2% [70.1–74.1] |
| 8 | minimo | 49.6% [47.4–51.8] | 0.0% [0.0–0.2] | 3.6% [2.9–4.6] | 0.0% [0.0–0.2] | 1.72 ±0.04 | 47.2% [45.0–49.4] |
| 8 | esquiva | 43.9% [41.7–46.1] | 0.0% [0.0–0.2] | 1.8% [1.3–2.5] | 0.0% [0.0–0.2] | 1.30 ±0.03 | 75.3% [73.4–77.2] |
| 8 | total | 43.8% [41.6–46.0] | 0.0% [0.0–0.2] | 1.1% [0.7–1.6] | 0.0% [0.0–0.2] | 1.43 ±0.03 | 64.8% [62.7–66.9] |
| 10 | minimo | 46.4% [44.2–48.5] | 0.0% [0.0–0.2] | 3.5% [2.7–4.3] | 0.0% [0.0–0.2] | 1.99 ±0.04 | 40.1% [38.0–42.3] |
| 10 | esquiva | 43.4% [41.2–45.6] | 0.0% [0.0–0.2] | 2.6% [2.0–3.4] | 0.0% [0.0–0.2] | 1.45 ±0.03 | 68.4% [66.3–70.4] |
| 10 | total | 42.8% [40.6–44.9] | 0.0% [0.0–0.2] | 1.0% [0.6–1.5] | 0.0% [0.0–0.2] | 1.60 ±0.04 | 58.5% [56.3–60.6] |

Mejor estrategia del culpable (la que más baja el porcentaje del grupo) por tamaño:

- 4 jugadores: **esquiva** (47.2 %); la siguiente, total, da al grupo +4.8 pp [+1.7, +7.9] más (misma noche, semillas emparejadas).
- 5 jugadores: **esquiva** (42.0 %); la siguiente, total, da al grupo +10.4 pp [+7.3, +13.6] más (misma noche, semillas emparejadas).
- 6 jugadores: **total** (39.8 %); la siguiente, esquiva, da al grupo +6.1 pp [+3.1, +9.1] más (misma noche, semillas emparejadas).
- 7 jugadores: **total** (46.4 %); la siguiente, esquiva, da al grupo +0.1 pp [-2.9, +3.2] más (misma noche, semillas emparejadas).
- 8 jugadores: **total** (43.8 %); la siguiente, esquiva, da al grupo +0.1 pp [-3.0, +3.2] más (misma noche, semillas emparejadas).
- 10 jugadores: **total** (42.8 %); la siguiente, esquiva, da al grupo +0.7 pp [-2.4, +3.7] más (misma noche, semillas emparejadas).

## 2. Mesa con criterio compartido frente a cada uno por su cuenta

| Jugadores | Grupo acusa (compartido) | Grupo acusa (independiente) | Nadie acusado (indep.) | Desempate (indep.) |
| --- | --- | --- | --- | --- |
| 4 | 47.2% [45.0–49.4] | 51.0% [48.9–53.2] | 14.1% [12.6–15.7] | 28.1% [26.2–30.2] |
| 5 | 42.0% [39.9–44.2] | 50.4% [48.3–52.6] | 0.0% [0.0–0.2] | 4.8% [3.9–5.8] |
| 6 | 45.9% [43.7–48.0] | 31.7% [29.7–33.8] | 7.2% [6.1–8.4] | 21.0% [19.3–22.8] |
| 10 | 43.4% [41.2–45.6] | 35.6% [33.5–37.7] | 3.3% [2.6–4.2] | 13.1% [11.7–14.6] |

Estrategia del culpable: esquiva. La diferencia mide cuánto pesa ponerse de acuerdo hablando, algo que los bots no hacen y las personas sí.

## 3. Puntos por papel y ronda

Media de puntos por persona y ronda, con las tres estrategias del culpable mezcladas a partes iguales.

| Jugadores | Inocente | Culpable | Cómplice | Inocente: «votó al culpable» (+1) | Testimonios que destapan una mentira (+1) |
| --- | --- | --- | --- | --- | --- |
| 4 | 2.03 ±0.03 | 1.71 ±0.05 | n/a | 71.5 % de los votos | 0.50 ±0.01 |
| 5 | 1.80 ±0.04 | 1.91 ±0.05 | n/a | 63.3 % de los votos | 0.50 ±0.01 |
| 6 | 1.67 ±0.04 | 2.14 ±0.05 | 1.61 ±0.04 | 57.5 % de los votos | 0.69 ±0.02 |
| 7 | 1.72 ±0.04 | 1.99 ±0.05 | 1.49 ±0.04 | 57.7 % de los votos | 0.70 ±0.02 |
| 8 | 1.54 ±0.04 | 2.17 ±0.05 | 1.63 ±0.04 | 50.9 % de los votos | 0.72 ±0.02 |
| 10 | 1.45 ±0.04 | 2.23 ±0.05 | 1.68 ±0.04 | 47.4 % de los votos | 0.71 ±0.02 |

Con los mismos papeles repartidos al azar cada ronda, lo que importa en una partida es la media por persona a lo largo de las rondas: cada persona es culpable con probabilidad 1/N.

| Jugadores | Puntos esperados por ronda de una persona cualquiera | De ellos, como culpable | Como cómplice | Como inocente |
| --- | --- | --- | --- | --- |
| 4 | 1.95 | 0.43 | 0.00 | 1.52 |
| 5 | 1.82 | 0.38 | 0.00 | 1.44 |
| 6 | 1.74 | 0.36 | 0.27 | 1.12 |
| 7 | 1.73 | 0.28 | 0.21 | 1.23 |
| 8 | 1.63 | 0.27 | 0.20 | 1.16 |
| 10 | 1.55 | 0.22 | 0.17 | 1.16 |

## 4. Objetivos secretos

Los bots no persiguen los objetivos: solo se mide cuántos se cumplen «de paso» y si cambian quién gana. Que una persona los persiga a propósito (mentir para cumplir «di que estuviste en…», votar con alguien) solo se puede medir con partidas reales.

- Grupo acusa al culpable con objetivos: 50.0% [49.4–50.7]; sin ellos: 50.0% [49.4–50.7]. Diferencia emparejada: +0.0 pp [+0.0, +0.0] (los objetivos no cambian la noche ni las declaraciones de los bots).

| Objetivo | Papel | Cumplido sin buscarlo |
|---|---|---|
| claim_zone | complice | 0.0% [0.0–0.2] (n=1885) |
| claim_zone | culpable | 49.6% [48.0–51.1] (n=3989) |
| claim_zone | inocente | 0.0% [0.0–0.0] (n=18086) |
| contradict | complice | 0.0% [0.0–0.2] (n=1927) |
| contradict | culpable | 0.0% [0.0–0.1] (n=4040) |
| contradict | inocente | 2.6% [2.3–2.8] (n=19015) |
| corroborated | complice | 87.6% [86.1–88.9] (n=2063) |
| corroborated | culpable | 58.6% [57.1–60.2] (n=3985) |
| corroborated | inocente | 89.2% [88.7–89.6] (n=18964) |
| no_votes | complice | 95.2% [94.2–96.0] (n=2110) |
| no_votes | culpable | 13.0% [12.0–14.0] (n=4078) |
| no_votes | inocente | 76.5% [75.9–77.1] (n=20037) |
| same_vote | complice | 50.9% [48.7–53.1] (n=1995) |
| same_vote | culpable | 42.0% [40.5–43.6] (n=3979) |
| same_vote | inocente | 68.3% [67.7–69.0] (n=18928) |
| votes_on | complice | 16.6% [15.1–18.3] (n=2020) |
| votes_on | culpable | 10.5% [9.6–11.5] (n=3929) |
| votes_on | inocente | 21.0% [20.4–21.6] (n=18970) |

## 5. Valor de cada fuente de información

Misma noche, mismas declaraciones; se le quita a los bots una fuente. Diferencia en el porcentaje de rondas en que el grupo acusa al culpable.

| Jugadores | Estrategia | Con todo | Sin testimonios | Sin pruebas | Sin testimonios ni pruebas | Valor de los testimonios | Valor de las pruebas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | minimo | 72.9% | 61.0% | 46.1% | 34.5% | +11.9 pp [+10.5, +13.4] | +26.8 pp [+24.9, +28.7] |
| 5 | minimo | 62.0% | 47.0% | 38.2% | 25.0% | +15.0 pp [+13.4, +16.6] | +23.8 pp [+22.0, +25.7] |
| 6 | minimo | 53.6% | 46.8% | 24.5% | 16.9% | +6.9 pp [+4.4, +9.4] | +29.1 pp [+27.2, +31.1] |
| 10 | minimo | 46.4% | 25.6% | 16.9% | 10.7% | +20.7 pp [+18.4, +23.0] | +29.5 pp [+27.5, +31.5] |
| 4 | esquiva | 47.2% | 20.2% | 59.8% | 35.6% | +27.0 pp [+25.1, +28.9] | -12.6 pp [-14.9, -10.2] |
| 5 | esquiva | 42.0% | 2.9% | 57.1% | 24.8% | +39.2 pp [+37.1, +41.3] | -15.1 pp [-17.2, -13.0] |
| 6 | esquiva | 45.9% | 0.5% | 49.2% | 15.8% | +45.4 pp [+43.2, +47.5] | -3.4 pp [-5.3, -1.4] |
| 10 | esquiva | 43.4% | 0.0% | 48.0% | 9.4% | +43.4 pp [+41.2, +45.6] | -4.6 pp [-6.3, -2.9] |

Con «esquiva» el culpable miente justo a la hora de una prueba: su declaración no encaja y la fórmula de los bots (que cobra cada desajuste como una mentira) se va al señuelo, el inocente que sí encaja. Es una limitación de los bots, no un defecto demostrado: una persona sospecharía precisamente de quien no encaja con una prueba.

Referencia: votar al azar a otra persona acusaría al culpable alrededor de 1/(N−1) de las veces: 4 jug. ≈ 33 %, 5 jug. ≈ 25 %, 6 jug. ≈ 20 %, 10 jug. ≈ 11 %.

## 6. Variantes experimentales (solo en la simulación)

Cada ronda con variante es la misma ronda base (misma semilla, misma noche, mismas declaraciones) más la información de la variante. Diferencia en puntos porcentuales del porcentaje de rondas en que el grupo acusa al culpable, mezclando las tres estrategias del culpable.

| Variante | 4 jugadores | 5 jugadores | 6 jugadores | 10 jugadores |
| --- | --- | --- | --- | --- |
| Informante (lo guarda para sí) | 60.7% (+3.3 pp [+2.9, +3.8]) | 52.2% (+0.0 pp [+0.0, +0.0]) | 46.5% (+0.0 pp [-0.0, +0.1]) | 44.2% (+0.0 pp [+0.0, +0.0]) |
| Informante (lo dice y la mesa le cree) | 70.9% (+13.5 pp [+12.6, +14.4]) | 63.3% (+11.1 pp [+10.3, +11.9]) | 56.3% (+9.8 pp [+9.1, +10.6]) | 47.2% (+3.0 pp [+2.6, +3.4]) |
| Informante + farol del culpable (la mesa no cree a ninguno) | 60.7% (+3.3 pp [+2.9, +3.8]) | 52.2% (+0.0 pp [+0.0, +0.0]) | 46.5% (+0.0 pp [-0.0, +0.1]) | 44.2% (+0.0 pp [+0.0, +0.0]) |
| Chivatazo libre (peso 0,5) | 58.7% (+1.3 pp [+0.4, +2.2]) | 54.1% (+1.9 pp [+0.9, +3.0]) | 44.3% (-2.1 pp [-3.2, -1.1]) | 41.3% (-2.9 pp [-3.9, -1.8]) |
| Chivatazo verificado (peso 1) | 61.7% (+4.3 pp [+3.8, +4.8]) | 56.1% (+3.9 pp [+3.4, +4.4]) | 50.6% (+4.2 pp [+3.7, +4.7]) | 46.9% (+2.7 pp [+2.3, +3.1]) |

Porcentaje base (sin variante), mismas semillas: 4 jug. 57.4 % · 5 jug. 52.2 % · 6 jug. 46.4 % · 10 jug. 44.2 %.

### Sensibilidad del chivatazo al crédito que le da la mesa

| Peso del chivatazo | 4 jugadores | 5 jugadores | 6 jugadores | 10 jugadores |
| --- | --- | --- | --- | --- |
| chivatazo-libre ×0.25 | -0.0 pp [-0.8, +0.7] | +0.6 pp [-0.2, +1.4] | -1.1 pp [-1.9, -0.3] | -1.3 pp [-2.1, -0.4] |
| chivatazo-verificado ×0.25 (×2 por verificado) | +1.5 pp [+1.1, +1.8] | +1.3 pp [+1.0, +1.6] | +2.2 pp [+1.9, +2.6] | +1.7 pp [+1.3, +2.0] |
| chivatazo-libre ×0.5 | +1.3 pp [+0.4, +2.2] | +1.9 pp [+0.9, +3.0] | -2.1 pp [-3.2, -1.1] | -2.9 pp [-3.9, -1.8] |
| chivatazo-verificado ×0.5 (×2 por verificado) | +4.3 pp [+3.8, +4.8] | +3.9 pp [+3.4, +4.4] | +4.2 pp [+3.7, +4.7] | +2.7 pp [+2.3, +3.1] |
| chivatazo-libre ×1 | +3.6 pp [+2.5, +4.8] | +4.7 pp [+3.6, +5.9] | -3.7 pp [-4.9, -2.4] | -4.4 pp [-5.6, -3.2] |
| chivatazo-verificado ×1 (×2 por verificado) | +5.8 pp [+5.2, +6.4] | +5.1 pp [+4.6, +5.7] | +5.5 pp [+4.9, +6.1] | +3.4 pp [+2.9, +3.8] |
| chivatazo-libre ×2 | +4.5 pp [+3.3, +5.6] | +5.8 pp [+4.6, +6.9] | -4.4 pp [-5.8, -3.1] | -4.5 pp [-5.7, -3.2] |
| chivatazo-verificado ×2 (×2 por verificado) | +5.8 pp [+5.2, +6.4] | +5.1 pp [+4.6, +5.7] | +5.6 pp [+5.0, +6.2] | +3.4 pp [+3.0, +3.9] |

### Qué dicen los chivatazos

| Jugadores | Libre: hay chivatazo | Libre: es cierto | Libre: señala al culpable | Libre: autor del bando culpable | Libre: falso y del bando culpable | Verificado: hay chivatazo | Verificado: señala al culpable |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | 100.0% [99.9–100.0] | 53.9% [52.6–55.1] | 53.9% [52.6–55.1] | 24.0% [23.0–25.1] | 24.0% [23.0–25.1] | 13.1% [12.3–14.0] | 100.0% [99.5–100.0] |
| 5 | 100.0% [99.9–100.0] | 51.6% [50.3–52.8] | 51.6% [50.3–52.8] | 19.9% [18.9–20.9] | 19.9% [18.9–20.9] | 10.3% [9.6–11.1] | 100.0% [99.4–100.0] |
| 6 | 100.0% [99.9–100.0] | 40.5% [39.3–41.7] | 40.5% [39.3–41.7] | 33.8% [32.6–35.0] | 33.8% [32.6–35.0] | 11.2% [10.4–12.0] | 100.0% [99.4–100.0] |
| 10 | 100.0% [99.9–100.0] | 39.6% [38.4–40.8] | 39.6% [38.4–40.8] | 20.5% [19.5–21.6] | 20.5% [19.5–21.6] | 7.2% [6.6–7.9] | 100.0% [99.1–100.0] |

### Cuánto estrecha el informante

| Jugadores | Favoritos empatados (base) | Con informante público | Rondas con un único favorito (base → público) |
| --- | --- | --- | --- |
| 4 | 1.14 ±0.01 | 1.10 ±0.01 | 85.7 % → 90.2 % |
| 5 | 1.25 ±0.01 | 1.19 ±0.01 | 76.4 % → 81.8 % |
| 6 | 1.25 ±0.01 | 1.20 ±0.01 | 76.7 % → 80.8 % |
| 10 | 1.68 ±0.02 | 1.61 ±0.02 | 55.6 % → 58.4 % |

## 7. Duración máxima y bloqueos

Duración con todos los temporizadores agotados (sin veredicto ni desempate). Es un techo: una mesa que termina antes avanza sola. La duración real necesita partidas con personas.

| Ritmo | 4 jug. | 5 jug. | 6 jug. | 7 jug. | 8 jug. | 10 jug. |
| --- | --- | --- | --- | --- | --- | --- |
| relajado | 9.3 min | 9.3 min | 10.0 min | 10.0 min | 11.3 min | 11.3 min |
| normal | 7.0 min | 7.0 min | 7.7 min | 7.7 min | 8.8 min | 8.8 min |
| rapido | 4.6 min | 4.6 min | 5.0 min | 5.0 min | 5.8 min | 5.8 min |

Rondas que se bloquearon o acabaron en un estado inválido en toda la auditoría: **0**.
