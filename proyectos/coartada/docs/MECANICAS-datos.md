# Mecánicas candidatas: datos del experimento aislado (fase 7)

Generado con `npx tsx scripts/experimentos/mecanicas/informe.ts 1500`: 1500 rondas por tamaño, semillas `f7-{jugadores}-{i}`, motor real, estrategia de declaración del culpable rotando (mínimo, esquiva, total). Cada ronda se resuelve con todas las combinaciones de estrategias de cada mecánica sobre copias del mismo estado: las comparaciones son emparejadas.

**Bots, no personas.** Las tasas miden qué permite deducir la información a una mesa disciplinada con estrategias fijas. No miden diversión, comprensión, faroles hablados ni ritmo. La interpretación está en `docs/MECANICAS-propuesta.md`.

Comprobaciones: rondas bloqueadas o inválidas: **0**. Veces que un bot inocente descartó por lógica al culpable verdadero en la ronda base (debe ser 0): **0**.

**Cómo leer el equilibrio.** Cada mecánica es un juego entre el grupo (filas) y el bando culpable (columnas) con la tasa de acierto del grupo como resultado. El equilibrio dice qué mezcla de estrategias le conviene a cada bando cuando el otro también juega lo mejor posible. Si un bando mezcla varias opciones, su decisión no tiene una respuesta fija: hay farol. «Peso de la decisión» es cuánto cambia el acierto entre la mejor y la peor opción de ese bando contra la mezcla del rival: cerca de 0 significa que la decisión no importa.

## 4 jugadores

Base: grupo acusa al culpable 57.5 % [54.9–59.9]; se acusa a un señuelo 37.8 %; sospechosos posibles al votar 1.44.

### F · Testigo de una hora (referencia, fase 6)

| Grupo \ bando culpable | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 75.5 % | 85.2 % | 85.2 % |
| solo si alguien finge | 57.5 % | 57.5 % | 85.2 % |
| nunca lo cuenta | 57.5 % | 57.5 % | 37.7 % |

- Equilibrio: el grupo acierta 75.5 % (cotas 75.5 %–75.5 %); frente a la base, +18.0 pp [+16.1, +19.9].
- Mezcla del grupo: lo cuenta 100 %. Mezcla del bando culpable: nunca finge 100 %.
- Peso de la decisión: grupo 18.0 pp, bando culpable 9.7 pp.
- En equilibrio: se acusa a un señuelo 22.7 %; puntos por ronda inocente 2.51, culpable 0.98; sospechosos posibles al votar 1.40.
### M1 · Prueba falsificable

| Grupo \ bando culpable | no falsifica | falsifica la 1 (al azar) | falsifica la 2 (al azar) | falsifica la 2 (lugar concurrido) |
| --- | --- | --- | --- | --- |
| peritaje prueba 1, mesa confiada | 57.5 % | 57.5 % | 48.9 % | 45.5 % |
| peritaje prueba 1, mesa prudente | 57.2 % | 57.5 % | 61.1 % | 57.7 % |
| peritaje prueba 1, mesa desconfiada | 57.4 % | 57.5 % | 57.4 % | 57.4 % |
| peritaje prueba 2, mesa confiada | 57.5 % | 50.8 % | 57.5 % | 57.5 % |
| peritaje prueba 2, mesa prudente | 57.2 % | 63.7 % | 57.5 % | 57.5 % |
| peritaje prueba 2, mesa desconfiada | 58.8 % | 58.8 % | 57.5 % | 57.5 % |
| peritaje a la que menos encaja, mesa confiada | 57.5 % | 57.1 % | 57.4 % | 57.8 % |
| peritaje a la que menos encaja, mesa prudente | 57.5 % | 59.2 % | 58.0 % | 58.9 % |
| peritaje a la que menos encaja, mesa desconfiada | 55.1 % | 57.9 % | 57.5 % | 57.3 % |

- Equilibrio: el grupo acierta 58.1 % (cotas 58.1 %–58.1 %); frente a la base, +0.6 pp [+0.2, +1.1].
- Mezcla del grupo: peritaje prueba 2, mesa desconfiada 49 %, peritaje a la que menos encaja, mesa prudente 40 %, peritaje prueba 1, mesa prudente 11 %. Mezcla del bando culpable: no falsifica 47 %, falsifica la 2 (lugar concurrido) 36 %, falsifica la 2 (al azar) 18 %.
- Peso de la decisión: grupo 6.4 pp, bando culpable 0.7 pp.
- En equilibrio: se acusa a un señuelo 35.7 %; puntos por ronda inocente 2.05, culpable 1.68; sospechosos posibles al votar 1.46.
- Cuando el culpable falsifica: el peritaje descubre la falsa en 62.7 % de los casos (88.2 % si la mesa perita «la que menos encaja»).

### M2 · Registro en la defensa

| Grupo \ bando culpable | culpable «caza» | culpable registra el lugar con menos gente |
| --- | --- | --- |
| inocente registra su lugar, mesa literal | 85.5 % | 85.5 % |
| inocente registra su lugar, mesa suspicaz | 85.5 % | 85.5 % |
| inocente registra el de su sospechoso, mesa literal | 85.5 % | 85.5 % |
| inocente registra el de su sospechoso, mesa suspicaz | 85.5 % | 85.5 % |

- Equilibrio: el grupo acierta 85.5 % (cotas 85.5 %–85.5 %); frente a la base, +28.1 pp [+25.8, +30.3].
- Mezcla del grupo: inocente registra su lugar, mesa literal 100 %. Mezcla del bando culpable: culpable «caza» 100 %.
- Peso de la decisión: grupo 0.0 pp, bando culpable 0.0 pp.
- En equilibrio: se acusa a un señuelo 12.7 %; puntos por ronda inocente 2.78, culpable 0.58; sospechosos posibles al votar 1.15.
- Hay defensa en 100.0 % de las rondas; defiende la persona culpable en 57.5 %; el registro descubre un desajuste en 28.3 %.
- Con «inocente registra su lugar», mesa literal: grupo acierta 100.0 % cuando defiende el culpable y 66.0 % cuando defiende un inocente (base en esas mismas rondas: 100.0 % y 0.0 %).

### M2b · Registro en la defensa, solo un lugar que no sea el propio

| Grupo \ bando culpable | culpable «caza» | culpable registra el lugar con menos gente |
| --- | --- | --- |
| inocente registra el lugar de su sospechoso | 85.5 % | 85.5 % |
| inocente registra el lugar ajeno más concurrido | 81.0 % | 81.0 % |

- Equilibrio: el grupo acierta 85.5 % (cotas 85.5 %–85.5 %); frente a la base, +28.1 pp [+25.8, +30.3].
- Mezcla del grupo: inocente registra el lugar de su sospechoso 100 %. Mezcla del bando culpable: culpable «caza» 100 %.
- Peso de la decisión: grupo 4.5 pp, bando culpable 0.0 pp.
- En equilibrio: se acusa a un señuelo 12.8 %; puntos por ronda inocente 2.78, culpable 0.58; sospechosos posibles al votar 1.15.

### M3 · Archivar el caso (cambia la puntuación de la variante: no es de suma cero)

| Grupo | Bando culpable | Acusan al culpable | Archivado | Acusan a un inocente | Puntos inocente | Puntos culpable | Votos de archivo del bando culpable |
| --- | --- | --- | --- | --- | --- | --- | --- |
| nunca archiva | nunca empuja a archivar | 57.5 % | 0.0 % | 42.5 % | 2.03 | 1.70 | — |
| nunca archiva | empuja a archivar si está en peligro | 57.5 % | 0.0 % | 42.5 % | 2.03 | 1.70 | 100.0 % |
| archiva si su ventaja < 0.5 | nunca empuja a archivar | 46.5 % | 22.9 % | 30.7 % | 1.97 | 1.68 | 0.0 % |
| archiva si su ventaja < 0.5 | empuja a archivar si está en peligro | 46.5 % | 22.9 % | 30.7 % | 1.97 | 1.68 | 55.3 % |
| archiva si su ventaja < 1 | nunca empuja a archivar | 40.1 % | 47.5 % | 12.4 % | 2.04 | 1.45 | 0.0 % |
| archiva si su ventaja < 1 | empuja a archivar si está en peligro | 40.1 % | 47.5 % | 12.4 % | 2.04 | 1.45 | 37.2 % |
| archiva si su ventaja < 1.5 | nunca empuja a archivar | 35.8 % | 64.2 % | 0.0 % | 2.09 | 1.28 | 0.0 % |
| archiva si su ventaja < 1.5 | empuja a archivar si está en peligro | 35.8 % | 64.2 % | 0.0 % | 2.09 | 1.28 | 30.5 % |

- Equilibrios con estrategias puras (cada bando maximiza sus propios puntos): archiva si su ventaja < 1.5 / nunca; archiva si su ventaja < 1.5 / si-peligro.
- Mejor umbral para los inocentes en el peor caso: archiva si su ventaja < 1.5.

## 5 jugadores

Base: grupo acusa al culpable 52.5 % [49.9–55.0]; se acusa a un señuelo 41.6 %; sospechosos posibles al votar 1.65.

### F · Testigo de una hora (referencia, fase 6)

| Grupo \ bando culpable | nunca finge | culpable replica | culpable se adelanta |
| --- | --- | --- | --- |
| lo cuenta | 66.3 % | 86.9 % | 86.9 % |
| solo si alguien finge | 52.5 % | 52.5 % | 86.9 % |
| nunca lo cuenta | 52.5 % | 52.5 % | 32.2 % |

- Equilibrio: el grupo acierta 66.3 % (cotas 66.3 %–66.3 %); frente a la base, +13.9 pp [+12.1, +15.6].
- Mezcla del grupo: lo cuenta 100 %. Mezcla del bando culpable: nunca finge 100 %.
- Peso de la decisión: grupo 13.9 pp, bando culpable 20.5 pp.
- En equilibrio: se acusa a un señuelo 30.4 %; puntos por ronda inocente 2.20, culpable 1.35; sospechosos posibles al votar 1.60.
### M1 · Prueba falsificable

| Grupo \ bando culpable | no falsifica | falsifica la 1 (al azar) | falsifica la 2 (al azar) | falsifica la 2 (lugar concurrido) |
| --- | --- | --- | --- | --- |
| peritaje prueba 1, mesa confiada | 52.5 % | 52.5 % | 45.6 % | 41.6 % |
| peritaje prueba 1, mesa prudente | 52.1 % | 52.5 % | 57.1 % | 53.4 % |
| peritaje prueba 1, mesa desconfiada | 52.5 % | 52.5 % | 52.5 % | 52.5 % |
| peritaje prueba 2, mesa confiada | 52.5 % | 40.5 % | 52.5 % | 52.5 % |
| peritaje prueba 2, mesa prudente | 52.1 % | 53.9 % | 52.5 % | 52.5 % |
| peritaje prueba 2, mesa desconfiada | 51.7 % | 51.7 % | 52.5 % | 52.5 % |
| peritaje a la que menos encaja, mesa confiada | 52.5 % | 52.9 % | 52.7 % | 52.3 % |
| peritaje a la que menos encaja, mesa prudente | 52.5 % | 53.8 % | 52.7 % | 53.5 % |
| peritaje a la que menos encaja, mesa desconfiada | 51.2 % | 52.1 % | 52.7 % | 52.8 % |

- Equilibrio: el grupo acierta 52.5 % (cotas 52.5 %–52.5 %); frente a la base, +0.1 pp [−1.6, +1.7].
- Mezcla del grupo: peritaje prueba 1, mesa desconfiada 95 %, peritaje a la que menos encaja, mesa prudente 5 %. Mezcla del bando culpable: no falsifica 95 %, falsifica la 1 (al azar) 5 %.
- Peso de la decisión: grupo 1.3 pp, bando culpable 0.1 pp.
- En equilibrio: se acusa a un señuelo 35.9 %; puntos por ronda inocente 1.81, culpable 1.90; sospechosos posibles al votar 1.72.
- Cuando el culpable falsifica: el peritaje descubre la falsa en 63.7 % de los casos (91.0 % si la mesa perita «la que menos encaja»).

### M2 · Registro en la defensa

| Grupo \ bando culpable | culpable «caza» | culpable registra el lugar con menos gente |
| --- | --- | --- |
| inocente registra su lugar, mesa literal | 81.8 % | 81.8 % |
| inocente registra su lugar, mesa suspicaz | 81.8 % | 81.8 % |
| inocente registra el de su sospechoso, mesa literal | 81.8 % | 81.8 % |
| inocente registra el de su sospechoso, mesa suspicaz | 81.8 % | 81.8 % |

- Equilibrio: el grupo acierta 81.8 % (cotas 81.8 %–81.8 %); frente a la base, +29.3 pp [+27.0, +31.6].
- Mezcla del grupo: inocente registra su lugar, mesa literal 100 %. Mezcla del bando culpable: culpable «caza» 100 %.
- Peso de la decisión: grupo 0.0 pp, bando culpable 0.0 pp.
- En equilibrio: se acusa a un señuelo 14.7 %; puntos por ronda inocente 2.63, culpable 0.73; sospechosos posibles al votar 1.26.
- Hay defensa en 100.0 % de las rondas; defiende la persona culpable en 52.5 %; el registro descubre un desajuste en 31.1 %.
- Con «inocente registra su lugar», mesa literal: grupo acierta 100.0 % cuando defiende el culpable y 61.7 % cuando defiende un inocente (base en esas mismas rondas: 100.0 % y 0.0 %).

### M2b · Registro en la defensa, solo un lugar que no sea el propio

| Grupo \ bando culpable | culpable «caza» | culpable registra el lugar con menos gente |
| --- | --- | --- |
| inocente registra el lugar de su sospechoso | 81.6 % | 81.6 % |
| inocente registra el lugar ajeno más concurrido | 75.6 % | 75.6 % |

- Equilibrio: el grupo acierta 81.6 % (cotas 81.6 %–81.6 %); frente a la base, +29.1 pp [+26.8, +31.4].
- Mezcla del grupo: inocente registra el lugar de su sospechoso 100 %. Mezcla del bando culpable: culpable «caza» 100 %.
- Peso de la decisión: grupo 6.0 pp, bando culpable 0.0 pp.
- En equilibrio: se acusa a un señuelo 15.2 %; puntos por ronda inocente 2.62, culpable 0.74; sospechosos posibles al votar 1.25.

### M3 · Archivar el caso (cambia la puntuación de la variante: no es de suma cero)

| Grupo | Bando culpable | Acusan al culpable | Archivado | Acusan a un inocente | Puntos inocente | Puntos culpable | Votos de archivo del bando culpable |
| --- | --- | --- | --- | --- | --- | --- | --- |
| nunca archiva | nunca empuja a archivar | 52.5 % | 0.0 % | 47.5 % | 1.81 | 1.90 | — |
| nunca archiva | empuja a archivar si está en peligro | 52.5 % | 0.0 % | 47.5 % | 1.81 | 1.90 | 100.0 % |
| archiva si su ventaja < 0.5 | nunca empuja a archivar | 39.4 % | 28.5 % | 32.1 % | 1.73 | 1.85 | 0.0 % |
| archiva si su ventaja < 0.5 | empuja a archivar si está en peligro | 39.4 % | 28.5 % | 32.1 % | 1.73 | 1.85 | 37.2 % |
| archiva si su ventaja < 1 | nunca empuja a archivar | 33.5 % | 53.8 % | 12.7 % | 1.80 | 1.59 | 0.0 % |
| archiva si su ventaja < 1 | empuja a archivar si está en peligro | 33.5 % | 53.8 % | 12.7 % | 1.80 | 1.59 | 23.0 % |
| archiva si su ventaja < 1.5 | nunca empuja a archivar | 31.4 % | 68.6 % | 0.0 % | 1.89 | 1.37 | 0.0 % |
| archiva si su ventaja < 1.5 | empuja a archivar si está en peligro | 31.4 % | 68.6 % | 0.0 % | 1.89 | 1.37 | 19.1 % |

- Equilibrios con estrategias puras (cada bando maximiza sus propios puntos): archiva si su ventaja < 1.5 / nunca; archiva si su ventaja < 1.5 / si-peligro.
- Mejor umbral para los inocentes en el peor caso: archiva si su ventaja < 1.5.

## 6 jugadores

Base: grupo acusa al culpable 44.9 % [42.4–47.5]; se acusa a un señuelo 42.8 %; sospechosos posibles al votar 2.65.

### F · Testigo de una hora (referencia, fase 6)

| Grupo \ bando culpable | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 56.9 % | 48.5 % | 48.5 % | 53.8 % |
| solo si alguien finge | 44.9 % | 44.9 % | 48.5 % | 53.8 % |
| nunca lo cuenta | 44.9 % | 44.9 % | 11.1 % | 21.7 % |

- Equilibrio: el grupo acierta 48.5 % (cotas 48.5 %–48.5 %); frente a la base, +3.6 pp [+2.7, +4.5].
- Mezcla del grupo: lo cuenta 100 %. Mezcla del bando culpable: culpable replica 100 %.
- Peso de la decisión: grupo 3.6 pp, bando culpable 8.3 pp.
- En equilibrio: se acusa a un señuelo 39.3 %; puntos por ronda inocente 1.75, culpable 2.06; sospechosos posibles al votar 2.23.
### M1 · Prueba falsificable

| Grupo \ bando culpable | no falsifica | falsifica la 1 (al azar) | falsifica la 2 (al azar) | falsifica la 2 (lugar concurrido) |
| --- | --- | --- | --- | --- |
| peritaje prueba 1, mesa confiada | 44.9 % | 44.9 % | 25.5 % | 23.7 % |
| peritaje prueba 1, mesa prudente | 44.5 % | 44.9 % | 38.9 % | 35.4 % |
| peritaje prueba 1, mesa desconfiada | 47.3 % | 44.9 % | 47.3 % | 47.3 % |
| peritaje prueba 2, mesa confiada | 44.9 % | 24.7 % | 44.9 % | 44.9 % |
| peritaje prueba 2, mesa prudente | 44.5 % | 36.8 % | 44.9 % | 44.9 % |
| peritaje prueba 2, mesa desconfiada | 47.9 % | 47.9 % | 44.9 % | 44.9 % |
| peritaje a la que menos encaja, mesa confiada | 44.9 % | 42.0 % | 44.5 % | 43.7 % |
| peritaje a la que menos encaja, mesa prudente | 44.7 % | 44.7 % | 45.5 % | 45.9 % |
| peritaje a la que menos encaja, mesa desconfiada | 48.8 % | 46.9 % | 45.7 % | 46.4 % |

- Equilibrio: el grupo acierta 46.2 % (cotas 46.2 %–46.2 %); frente a la base, +1.3 pp [+0.5, +2.1].
- Mezcla del grupo: peritaje prueba 1, mesa desconfiada 56 %, peritaje prueba 2, mesa desconfiada 44 %. Mezcla del bando culpable: falsifica la 2 (al azar) 56 %, falsifica la 1 (al azar) 44 %.
- Peso de la decisión: grupo 12.2 pp, bando culpable 1.3 pp.
- En equilibrio: se acusa a un señuelo 37.5 %; puntos por ronda inocente 1.67, culpable 2.15; sospechosos posibles al votar 2.80.
- Cuando el culpable falsifica: el peritaje descubre la falsa en 61.2 % de los casos (83.6 % si la mesa perita «la que menos encaja»).

### M2 · Registro en la defensa

| Grupo \ bando culpable | culpable «caza» | culpable registra el lugar con menos gente |
| --- | --- | --- |
| inocente registra su lugar, mesa literal | 67.8 % | 67.8 % |
| inocente registra su lugar, mesa suspicaz | 67.9 % | 67.9 % |
| inocente registra el de su sospechoso, mesa literal | 68.2 % | 68.2 % |
| inocente registra el de su sospechoso, mesa suspicaz | 50.1 % | 50.1 % |

- Equilibrio: el grupo acierta 68.2 % (cotas 68.2 %–68.2 %); frente a la base, +23.3 pp [+21.1, +25.4].
- Mezcla del grupo: inocente registra el de su sospechoso, mesa literal 100 %. Mezcla del bando culpable: culpable «caza» 100 %.
- Peso de la decisión: grupo 18.1 pp, bando culpable 0.0 pp.
- En equilibrio: se acusa a un señuelo 24.0 %; puntos por ronda inocente 2.29, culpable 1.27; sospechosos posibles al votar 2.31.
- Hay defensa en 100.0 % de las rondas; defiende la persona culpable en 45.0 %; el registro descubre un desajuste en 33.8 %.
- Con «inocente registra su lugar», mesa literal: grupo acierta 99.9 % cuando defiende el culpable y 42.1 % cuando defiende un inocente (base en esas mismas rondas: 99.9 % y 0.0 %).

### M2b · Registro en la defensa, solo un lugar que no sea el propio

| Grupo \ bando culpable | culpable «caza» | culpable registra el lugar con menos gente |
| --- | --- | --- |
| inocente registra el lugar de su sospechoso | 67.8 % | 67.8 % |
| inocente registra el lugar ajeno más concurrido | 58.7 % | 58.7 % |

- Equilibrio: el grupo acierta 67.8 % (cotas 67.8 %–67.8 %); frente a la base, +22.9 pp [+20.7, +25.0].
- Mezcla del grupo: inocente registra el lugar de su sospechoso 100 %. Mezcla del bando culpable: culpable «caza» 100 %.
- Peso de la decisión: grupo 9.1 pp, bando culpable 0.0 pp.
- En equilibrio: se acusa a un señuelo 24.3 %; puntos por ronda inocente 2.28, culpable 1.29; sospechosos posibles al votar 2.31.

### M3 · Archivar el caso (cambia la puntuación de la variante: no es de suma cero)

| Grupo | Bando culpable | Acusan al culpable | Archivado | Acusan a un inocente | Puntos inocente | Puntos culpable | Votos de archivo del bando culpable |
| --- | --- | --- | --- | --- | --- | --- | --- |
| nunca archiva | nunca empuja a archivar | 44.9 % | 0.0 % | 54.8 % | 1.65 | 2.20 | — |
| nunca archiva | empuja a archivar si está en peligro | 44.9 % | 0.0 % | 54.8 % | 1.65 | 2.20 | 100.0 % |
| archiva si su ventaja < 0.5 | nunca empuja a archivar | 33.7 % | 17.8 % | 39.5 % | 1.51 | 2.29 | 0.0 % |
| archiva si su ventaja < 0.5 | empuja a archivar si está en peligro | 33.7 % | 21.9 % | 39.5 % | 1.55 | 2.21 | 51.1 % |
| archiva si su ventaja < 1 | nunca empuja a archivar | 16.7 % | 52.6 % | 17.7 % | 1.35 | 2.28 | 0.0 % |
| archiva si su ventaja < 1 | empuja a archivar si está en peligro | 16.4 % | 61.0 % | 17.7 % | 1.43 | 2.12 | 29.3 % |
| archiva si su ventaja < 1.5 | nunca empuja a archivar | 5.8 % | 76.9 % | 5.8 % | 1.25 | 2.23 | 0.0 % |
| archiva si su ventaja < 1.5 | empuja a archivar si está en peligro | 5.4 % | 85.1 % | 5.8 % | 1.32 | 2.08 | 22.8 % |

- Equilibrios con estrategias puras (cada bando maximiza sus propios puntos): nunca archiva / nunca; nunca archiva / si-peligro.
- Mejor umbral para los inocentes en el peor caso: nunca archiva.

## 10 jugadores

Base: grupo acusa al culpable 42.4 % [39.9–44.9]; se acusa a un señuelo 47.2 %; sospechosos posibles al votar 5.04.

### F · Testigo de una hora (referencia, fase 6)

| Grupo \ bando culpable | nunca finge | culpable replica | culpable se adelanta | cómplice encubre |
| --- | --- | --- | --- | --- |
| lo cuenta | 45.7 % | 44.9 % | 44.9 % | 52.0 % |
| solo si alguien finge | 42.4 % | 42.4 % | 44.9 % | 52.0 % |
| nunca lo cuenta | 42.4 % | 42.4 % | 8.0 % | 7.3 % |

- Equilibrio: el grupo acierta 44.9 % (cotas 44.9 %–44.9 %); frente a la base, +2.5 pp [+1.7, +3.3].
- Mezcla del grupo: lo cuenta 100 %. Mezcla del bando culpable: culpable replica 100 %.
- Peso de la decisión: grupo 2.5 pp, bando culpable 7.1 pp.
- En equilibrio: se acusa a un señuelo 43.8 %; puntos por ronda inocente 1.48, culpable 2.21; sospechosos posibles al votar 3.78.
### M1 · Prueba falsificable

| Grupo \ bando culpable | no falsifica | falsifica la 1 (al azar) | falsifica la 2 (al azar) | falsifica la 2 (lugar concurrido) |
| --- | --- | --- | --- | --- |
| peritaje prueba 1, mesa confiada | 42.4 % | 42.4 % | 24.9 % | 21.9 % |
| peritaje prueba 1, mesa prudente | 42.1 % | 42.4 % | 33.3 % | 28.8 % |
| peritaje prueba 1, mesa desconfiada | 44.4 % | 42.4 % | 44.4 % | 44.4 % |
| peritaje prueba 2, mesa confiada | 42.4 % | 28.2 % | 42.4 % | 42.4 % |
| peritaje prueba 2, mesa prudente | 42.4 % | 35.7 % | 42.4 % | 42.4 % |
| peritaje prueba 2, mesa desconfiada | 45.1 % | 45.1 % | 42.4 % | 42.4 % |
| peritaje a la que menos encaja, mesa confiada | 42.4 % | 42.2 % | 42.2 % | 41.6 % |
| peritaje a la que menos encaja, mesa prudente | 42.3 % | 42.2 % | 42.2 % | 41.8 % |
| peritaje a la que menos encaja, mesa desconfiada | 45.6 % | 42.8 % | 42.4 % | 42.6 % |

- Equilibrio: el grupo acierta 43.6 % (cotas 43.6 %–43.6 %); frente a la base, +1.2 pp [+0.2, +2.1].
- Mezcla del grupo: peritaje prueba 1, mesa desconfiada 58 %, peritaje prueba 2, mesa desconfiada 42 %. Mezcla del bando culpable: falsifica la 2 (lugar concurrido) 58 %, falsifica la 1 (al azar) 42 %.
- Peso de la decisión: grupo 13.0 pp, bando culpable 1.2 pp.
- En equilibrio: se acusa a un señuelo 38.4 %; puntos por ronda inocente 1.44, culpable 2.26; sospechosos posibles al votar 5.29.
- Cuando el culpable falsifica: el peritaje descubre la falsa en 65.8 % de los casos (97.4 % si la mesa perita «la que menos encaja»).

### M2 · Registro en la defensa

| Grupo \ bando culpable | culpable «caza» | culpable registra el lugar con menos gente |
| --- | --- | --- |
| inocente registra su lugar, mesa literal | 62.3 % | 62.3 % |
| inocente registra su lugar, mesa suspicaz | 62.3 % | 62.3 % |
| inocente registra el de su sospechoso, mesa literal | 63.2 % | 63.2 % |
| inocente registra el de su sospechoso, mesa suspicaz | 47.3 % | 47.3 % |

- Equilibrio: el grupo acierta 63.2 % (cotas 63.2 %–63.2 %); frente a la base, +20.8 pp [+18.7, +22.9].
- Mezcla del grupo: inocente registra el de su sospechoso, mesa literal 100 %. Mezcla del bando culpable: culpable «caza» 100 %.
- Peso de la decisión: grupo 15.9 pp, bando culpable 0.0 pp.
- En equilibrio: se acusa a un señuelo 27.6 %; puntos por ronda inocente 2.02, culpable 1.47; sospechosos posibles al votar 4.33.
- Hay defensa en 100.0 % de las rondas; defiende la persona culpable en 42.4 %; el registro descubre un desajuste en 28.6 %.
- Con «inocente registra su lugar», mesa literal: grupo acierta 100.0 % cuando defiende el culpable y 35.2 % cuando defiende un inocente (base en esas mismas rondas: 100.0 % y 0.0 %).

### M2b · Registro en la defensa, solo un lugar que no sea el propio

| Grupo \ bando culpable | culpable «caza» | culpable registra el lugar con menos gente |
| --- | --- | --- |
| inocente registra el lugar de su sospechoso | 61.6 % | 61.6 % |
| inocente registra el lugar ajeno más concurrido | 51.3 % | 51.3 % |

- Equilibrio: el grupo acierta 61.6 % (cotas 61.6 %–61.6 %); frente a la base, +19.2 pp [+17.2, +21.2].
- Mezcla del grupo: inocente registra el lugar de su sospechoso 100 %. Mezcla del bando culpable: culpable «caza» 100 %.
- Peso de la decisión: grupo 10.3 pp, bando culpable 0.0 pp.
- En equilibrio: se acusa a un señuelo 29.3 %; puntos por ronda inocente 1.97, culpable 1.54; sospechosos posibles al votar 4.34.

### M3 · Archivar el caso (cambia la puntuación de la variante: no es de suma cero)

| Grupo | Bando culpable | Acusan al culpable | Archivado | Acusan a un inocente | Puntos inocente | Puntos culpable | Votos de archivo del bando culpable |
| --- | --- | --- | --- | --- | --- | --- | --- |
| nunca archiva | nunca empuja a archivar | 42.4 % | 0.0 % | 57.6 % | 1.41 | 2.30 | — |
| nunca archiva | empuja a archivar si está en peligro | 42.4 % | 0.0 % | 57.6 % | 1.41 | 2.30 | 100.0 % |
| archiva si su ventaja < 0.5 | nunca empuja a archivar | 28.5 % | 46.4 % | 25.1 % | 1.46 | 1.93 | 0.0 % |
| archiva si su ventaja < 0.5 | empuja a archivar si está en peligro | 28.5 % | 46.4 % | 25.1 % | 1.46 | 1.93 | 20.1 % |
| archiva si su ventaja < 1 | nunca empuja a archivar | 8.6 % | 82.9 % | 8.5 % | 1.23 | 2.00 | 0.0 % |
| archiva si su ventaja < 1 | empuja a archivar si está en peligro | 8.6 % | 82.9 % | 8.5 % | 1.23 | 2.00 | 12.0 % |
| archiva si su ventaja < 1.5 | nunca empuja a archivar | 1.7 % | 97.3 % | 1.0 % | 1.14 | 1.99 | 0.0 % |
| archiva si su ventaja < 1.5 | empuja a archivar si está en peligro | 1.7 % | 97.3 % | 1.0 % | 1.14 | 1.99 | 10.1 % |

- Equilibrios con estrategias puras (cada bando maximiza sus propios puntos): archiva si su ventaja < 0.5 / nunca; archiva si su ventaja < 0.5 / si-peligro.
- Mejor umbral para los inocentes en el peor caso: archiva si su ventaja < 0.5.

## Resumen

Valor de equilibrio (acierto del grupo) y diferencia emparejada con la base; «mezcla g/c» es cuántas estrategias usa cada bando con al menos un 5 %; «peso g/c» es el peso de la decisión de cada bando. En M3, el resultado con el mejor umbral de los inocentes y la peor respuesta del bando culpable.

| Mecánica | 4 jug. | 5 jug. | 6 jug. | 10 jug. |
| --- | --- | --- | --- | --- |
| Juego base | 57.5 % | 52.5 % | 44.9 % | 42.4 % |
| F · Testigo de una hora | 75.5 % (+18.0 pp) · mezcla 1/1 · peso 18/10 pp | 66.3 % (+13.9 pp) · mezcla 1/1 · peso 14/21 pp | 48.5 % (+3.6 pp) · mezcla 1/1 · peso 4/8 pp | 44.9 % (+2.5 pp) · mezcla 1/1 · peso 2/7 pp |
| M1 · Prueba falsificable | 58.1 % (+0.6 pp) · mezcla 3/3 · peso 6/1 pp | 52.5 % (+0.1 pp) · mezcla 2/1 · peso 1/0 pp | 46.2 % (+1.3 pp) · mezcla 2/2 · peso 12/1 pp | 43.6 % (+1.2 pp) · mezcla 2/2 · peso 13/1 pp |
| M2 · Registro en la defensa | 85.5 % (+28.1 pp) · mezcla 1/1 · peso 0/0 pp | 81.8 % (+29.3 pp) · mezcla 1/1 · peso 0/0 pp | 68.2 % (+23.3 pp) · mezcla 1/1 · peso 18/0 pp | 63.2 % (+20.8 pp) · mezcla 1/1 · peso 16/0 pp |
| M2b · Registro en la defensa, solo un lugar ajeno | 85.5 % (+28.1 pp) · mezcla 1/1 · peso 5/0 pp | 81.6 % (+29.1 pp) · mezcla 1/1 · peso 6/0 pp | 67.8 % (+22.9 pp) · mezcla 1/1 · peso 9/0 pp | 61.6 % (+19.2 pp) · mezcla 1/1 · peso 10/0 pp |
| M3 · Archivar el caso | 35.8 % acusan al culpable, 64.2 % archivado · umbral 1.5 | 31.4 % acusan al culpable, 68.6 % archivado · umbral 1.5 | 44.9 % acusan al culpable, 0.0 % archivado · umbral nunca | 28.5 % acusan al culpable, 46.4 % archivado · umbral 0.5 |

