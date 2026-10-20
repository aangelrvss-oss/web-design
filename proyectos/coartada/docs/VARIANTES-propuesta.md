# Variantes experimentales: análisis y propuesta (pendiente de aprobación)

Nada de este documento está implementado. El juego básico no cambia hasta que se apruebe una variante concreta.

> **Actualización (fase 6).** [`INFORMANTE-evaluacion.md`](INFORMANTE-evaluacion.md) revisa la recomendación sobre el Informante: con un modelo de farol más fiel, **no implementarlo tal como está propuesto**; la candidata a prueba humana pasa a ser «Testigo de una hora», solo desde 6 personas.

> **Actualización (fase 5).** La evaluación con datos está en [`EQUILIBRIO-y-variantes.md`](EQUILIBRIO-y-variantes.md) y sustituye a las recomendaciones de este documento donde no coincidan:
> - **Informante:** probar primero, pero **desde 6 personas**. Con 4 y 5 supera el umbral de +10 puntos fijado aquí.
> - **Chivatazo anónimo libre:** descartado. Es falso en la mitad de los casos y favorece al bando culpable desde 6 personas. La frase «[X] miente…» daría por cierto algo no comprobado.
> - **Chivatazo verificado:** en reserva.
>
> Correcciones de este documento:
> - los objetivos secretos no incluyen «votar a alguien», sino «que X reciba 2 votos» y «vota como X»;
> - la arquitectura recomendada usa una sola variante a la vez, copiada en la ronda.

## 1. Qué tiene ya el juego básico

Antes de añadir nada, conviene ver qué cubre ya cada mecanismo actual:

| Mecanismo actual | Qué aporta |
|---|---|
| **Recuerdos** del expediente | Información privada y verdadera («estuviste con X a tal hora») que cada cual decide si comparte |
| **Testimonios** | Afirmaciones públicas, firmadas y comparadas con las coartadas. El testimonio verdadero que desmonta una mentira da +1 (cazador) |
| **2 pruebas** | Hechos públicos e innegables sobre la persona culpable en las dos horas que no son la del incidente |
| **Cómplice** (desde 6) | Bando culpable que conoce a la persona culpable y puede mentir y cubrirla |
| **Objetivos secretos** (opcionales) | Misión personal de +1, a veces en tensión con el grupo: votar a alguien, contradecir a alguien, decir que estuviste en un sitio… |
| **Señalar + Última defensa** | Foco público sobre una persona antes de votar; se puede cambiar durante toda la investigación |
| **Votación secreta + desempate** | La decisión final |

## 2. Las ocho propuestas comparadas

Puntuación orientativa de 1 a 3: **D** = genera debate y decisiones; **E** = fácil de entender en la primera partida; **N** = novedad sin solapar lo que ya existe; **B** = riesgo bajo de desequilibrar bandos; **R** = fácil de probar y retirar.

| Propuesta | D | E | N | B | R | Veredicto |
|---|---|---|---|---|---|---|
| Rol **Informante** | 3 | 3 | 3 | 2 | 3 | **Recomendada** |
| Rol **Observador** | 2 | 2 | 2 | 2 | 3 | Reserva (solapa con el informante y con las pruebas) |
| Rol **Confidente** | 1 | 2 | 1 | 2 | 3 | Descartada |
| Rol **Doble agente** | 2 | 2 | 1 | 2 | 3 | Descartada |
| Evento **Prueba inesperada** | 1 | 3 | 1 | 1 | 3 | Descartada |
| Evento **Llamada anónima** (como «Chivatazo anónimo») | 3 | 3 | 3 | 3 | 2 | **Recomendada** |
| Evento **Coartada bajo revisión** | 2 | 2 | 1 | 2 | 3 | Descartada |
| Evento **Última oportunidad** | 1 | 3 | 0 | 3 | 3 | Descartada |

### Por qué se descartan

- **Confidente.** El cómplice ya es bando culpable con información limitada (sabe quién es la persona culpable). Darle otra información o quitarle esa solo crea un «cómplice con otro nombre» que hay que explicar sin que cambie la conversación.
- **Doble agente.** Los objetivos secretos ya son exactamente eso: un objetivo personal que puede chocar con el del grupo, a veces obligando a mentir. Sería una segunda forma de lo mismo.
- **Prueba inesperada.** Es más de lo mismo y siempre favorece a los inocentes. Tampoco puede ser cualquier dato: la hora del incidente no puede revelarse sin resolver el caso. Además rompe el ritmo de dos pruebas que hoy estructura la investigación.
- **Coartada bajo revisión.** Pone el foco en una persona y le da la palabra, que es justo lo que hace la Última defensa (con la diferencia de que esta la eligen los jugadores, lo que la hace más interesante).
- **Última oportunidad.** El señalamiento ya se puede cambiar o retirar durante toda la investigación, y la votación secreta es la decisión final. Añadir otra revisión justo antes de votar duplica un paso y alarga la ronda sin decisión nueva.

## 3. Variantes recomendadas

### 3.1 Rol «Informante»

**Idea:** una persona inocente recibe un dato privado y totalmente cierto: el nombre de alguien que **seguro que es inocente**. Ella decide si lo cuenta, cuándo y a quién. Como nadie sabe quién es el informante, la persona culpable y su cómplice también pueden decir que lo son. La gracia está en ese farol.

Reglas exactas:

1. **Activación.** Se elige en la sala de espera antes de empezar. Solo con 5 personas o más; con 4 la opción aparece desactivada y explica por qué.
2. **Reparto.** Después de repartir los papeles normales, la app elige al azar (con la semilla de la ronda) a una persona inocente como informante. Sigue siendo inocente a todos los efectos: gana y puntúa igual.
3. **Información.** En su expediente aparece: «Informante: sabes con certeza que **[X]** es inocente». X es otra persona inocente elegida al azar; nunca la persona culpable ni la cómplice.
4. **Lo que ven los demás.** Nadie sabe quién es el informante. Todos ven en el caso la etiqueta «Variante: Informante», así que saben que existe uno.
5. **Límites.** Un solo dato por ronda, fijo. La app no lo publica: si se comparte, es de palabra. No da puntos.
6. **Final.** En el veredicto se revela quién era el informante y a quién confirmó.

Riesgos y cómo medirlos:

- **Favorece a los inocentes.** Con 5 personas, confirmar a una deja 3 sospechosos.
  - Probar con 5–6 personas en la simulación y comparar el porcentaje de casos resueltos con y sin la variante.
  - Si sube más de 10 puntos, subir el mínimo a 6.
- **La persona confirmada puede convertirse en «la jueza»** de la mesa. Habrá que observarlo en partidas reales.
- **Un culpable que diga ser informante** y «confirme» a su cómplice genera exactamente el debate que se busca, pero puede frustrar a alguien en la primera partida. La guía tiene que explicarlo en una línea.

### 3.2 Evento «Chivatazo anónimo» (versión concreta de «Llamada anónima»)

**Idea:** a mitad de la investigación aparece un chivatazo anónimo que acusa a alguien de mentir a una hora. La fiabilidad no la decide la app al azar: lo **escribe una persona elegida al azar**, que puede ser inocente (y basarse en sus recuerdos) o la culpable (y querer desviar la atención). Nadie sabe quién lo ha escrito, así que el grupo tiene que decidir si se fía.

Reglas exactas:

1. **Activación.** Se elige en la sala de espera antes de empezar. Desde 4 personas.
2. **Momento.** Al salir la prueba 2, la app elige al azar (con la semilla de la ronda) a una persona participante y conectada, sea cual sea su papel.
3. **Lo que recibe el autor.** Un aviso privado: «Te toca dar un chivatazo anónimo». Elige a una persona (no a sí misma) y una hora, con un plazo de 30 s, y confirma.
4. **Lo que ven todos.** Un aviso público: «Chivatazo anónimo: **[X]** miente sobre dónde estuvo **a las [H]**». No dice quién lo ha escrito ni si es cierto.
5. **Límites.**
   - Uno por ronda, con un texto fijo de plantilla (no texto libre, para evitar insultos o pistas fuera del juego).
   - No da puntos ni cuenta como testimonio.
   - Si el autor no confirma a tiempo, no hay chivatazo y nadie se entera de quién era.
6. **Final.** En el veredicto se revela quién lo escribió y si era cierto, comparando con la coartada real de X a esa hora.

Riesgos:

- **Que el autor esté desconectado.** Se elige solo entre personas conectadas, y si no responde no pasa nada.
- **Filtrar quién es el autor.** El servidor solo envía el aviso privado a esa persona. Habría que añadir una prueba de privacidad de red como las que ya existen: nadie más recibe el identificador del autor antes del veredicto.
- **Equilibrio.** La probabilidad de que el autor sea del bando culpable es 1/N o 2/N. Es un mecanismo de debate, no de ventaja; aun así conviene medir en la simulación cuántas veces el chivatazo apunta a la persona culpable.

### 3.3 En reserva: rol «Observador»

Una persona inocente puede hacer **una consulta privada**: elige a alguien y una hora que no sea la del incidente, y la app le dice si su coartada a esa hora es cierta.

Da decisiones interesantes (qué consultar y cuándo) y es fácil de explicar. Pero solapa con el informante (información privada cierta) y con las pruebas (verdad sobre las otras horas), así que no lo activaría a la vez que el informante. Es una alternativa si el informante resulta demasiado fuerte.

## 4. Arquitectura mínima propuesta

Sin sistema de plugins: una configuración pequeña y explícita.

- **Ajustes.** `Settings.variants: { informante?: true; chivatazo?: true }`, vacío por defecto. El ajuste ya solo se puede cambiar en la sala de espera (`updateSettings` rechaza el cambio con una ronda en marcha). Así no puede cambiar a mitad de ronda.
- **Copia en la ronda.** `startRound` copia las variantes activas en `round.setup.variants`. La ronda usa esa copia aunque los ajustes cambien después, y el historial guarda con qué variantes se jugó cada ronda (para separar estadísticas).
- **Motor.**
  - *Informante:* un paso en `generateRound` después de repartir papeles (semilla de la ronda) que añade `setup.informant = { id, cleared }`.
  - *Chivatazo:* al revelar la prueba 2 se elige el autor y se guarda en `round.tip = { author, target, slot } | null`; una acción nueva `tip(room, id, target, slot)` solo es válida para ese autor y dentro de su plazo.
  - Ni la puntuación ni el resultado cambian.
- **Protocolo.**
  - `room:settings` admite `variants`.
  - Un solo mensaje nuevo, `game:tip { target, slot }`, solo para el chivatazo.
- **Vistas.**
  - `privateView` añade `informant` (solo al informante) y `tipTurn` (solo al autor).
  - `publicView` añade la etiqueta de variantes activas y el texto del chivatazo, sin autor.
  - El veredicto (`reveal`) añade quién era el informante y el autor del chivatazo.
- **Interfaz.**
  - Sección «Variantes experimentales» en la sala de espera: dos interruptores marcados como experimentales, solo para quien dirige.
  - Etiqueta visible para todos en la cabecera del caso.
  - El dato del informante en el expediente.
  - El aviso del chivatazo, que reutiliza el estilo del aviso de prueba nueva.
  - Una línea en la guía rápida solo si la variante está activa.
- **Pruebas.**
  - Unitarias del reparto (el informante nunca confirma a la persona culpable ni a la cómplice, y solo existe con la variante activa).
  - Unitarias de privacidad: nadie más ve el informante ni el autor del chivatazo antes del veredicto.
  - Servidor: plazo del chivatazo y rechazo de autores falsos.
  - E2E con la variante activa y sin ella.
  - Simulación con y sin variante.
  - Las pruebas actuales siguen pasando sin tocarlas, que es la garantía de que el juego básico no cambia.
- **Retirada.** Cada variante vive en un archivo propio del motor más sus campos en las vistas. Quitarla es borrar ese archivo, la clave de `variants` y sus campos. No hay datos persistidos (las salas están en memoria), así que no hacen falta migraciones.
