# Auditoría antes de la primera prueba real

Revisión crítica del estado de trabajo actual (sin commit desde `e8fb52d`), hecha recorriendo el código del servidor, el motor y las pantallas, con sondas contra el servidor real y navegadores emulando móviles. Objetivo: encontrar lo que podría arruinar una partida real, no añadir funciones.

**Límites de esta auditoría.** Todo se ha probado con Chromium emulando móviles (320, 360 y 390 px) y con clientes Socket.IO reales; **no** en un Android ni un iPhone físicos. La vibración solo se ha comprobado simulando `navigator.vibrate`. No se ha cambiado ninguna regla, puntuación, condición de victoria, reparto de papeles ni la mecánica de votación.

---

## 1. Problemas encontrados, por gravedad

No se ha encontrado ningún defecto **crítico** ni **alto**: nada que bloquee una partida, filtre información secreta o permita a un cliente decidir un resultado.

| # | Gravedad | Problema | Cómo se reproducía | Impacto en una partida real | Estado |
|---|---|---|---|---|---|
| 1 | Media | Se podía jugar una ronda de más al acabar la partida («Ronda 4 de 3») | Partida de N rondas; tras la última, quien dirige pulsa «Ir a la sala» y luego «Empezar partida». El motor empieza la ronda N+1 con los puntos acumulados y la clasificación final se retrasa | Confusión al final de la partida: el grupo cree que sigue, los puntos ya no corresponden a «N rondas» | **Corregido** en la interfaz: en el veredicto de la última ronda solo se ofrece «Ver clasificación final» (desde ahí, «Nueva partida» vuelve a la sala a cero). **Cerrado también en el motor** (apartado 5) |
| 2 | Media | El botón «Ocultar» del expediente se salía de su tarjeta | Abrir el expediente con un móvil de 320 o 360 px de ancho (multijugador y un solo móvil) | El botón quedaba cortado («Ocu…») justo en la pantalla más privada; parece roto y cuesta taparlo deprisa | **Corregido**: la cabecera del expediente pasa a dos líneas si no cabe |
| 3 | Baja | Textos de tiempo límite en el modo de un solo móvil, donde declarar y votar no tienen reloj | Un solo móvil: la declaración decía «Si se acaba el tiempo sin sellar…» y la votación «Quien no vote a tiempo no cuenta» | Instrucciones falsas: meten prisa sin motivo y contradicen la guía | **Corregido**: esos textos solo aparecen cuando la fase tiene reloj |
| 4 | Baja | El recordatorio de la votación usaba «señala», que en el juego es la palabra de elegir quién hace la última defensa | Pantalla de votación (introducido en la iteración anterior) | Una persona nueva puede confundir señalar (defensa) con votar (acusar) | **Corregido**: «Tu turno: vota a quien crees culpable: toca su nombre y confirma con «Acusar»». También se quitó una frase repetida sobre el secreto del voto |
| 5 | Baja | En la votación a 320 px, la etiqueta «1 contradicción» estrechaba la coartada hasta una palabra por línea | Votación en un móvil de 320 px con alguna contradicción publicada | Difícil de leer justo al decidir | **Corregido**: las etiquetas van debajo de la coartada |
| 6 | Baja | Un solo móvil: después de «Soy X» había que tocar además «Abrir tu expediente confidencial» | Cada declaración en el modo de un solo móvil | Dos confirmaciones seguidas de lo mismo, un toque de más por persona y ronda | **Corregido**: en ese modo el expediente se abre directamente tras «Soy X» (el multijugador no cambia) |
| 7 | Baja | El resultado «auténtica» de la revisión no decía qué implica para la otra prueba | Variante, revisar una prueba auténtica | Alguien podía tomar la otra prueba por segura | **Corregido**: «La otra sigue sin revisar: puede ser falsa.» |

## 2. Privacidad y juego limpio

Comprobado sobre los **datos que recibe cada cliente** y las validaciones del servidor, no solo sobre lo que se ve:

- **Ningún mensaje lleva la vista privada de otra persona**, y la vista pública nunca contiene, antes del veredicto, papeles, noches reales, recuerdos, objetivos, votos, señalamientos, borradores, semilla, tokens, falsificación, si hubo oportunidad de falsificar (`forgeryAllowed`/`canForge`) ni marcas de revisión individuales. Se comprueba en **cada** mensaje recibido por cada socket en varias partidas (`tests/auditoria-servidor.test.ts`), además de las pruebas de privacidad que ya existían.
- **El cliente no decide resultados**: votos, falsificación y revisión los resuelve el servidor. El protocolo rechaza campos de más (esquemas estrictos), y el servidor rechaza falsificar sin oportunidad, votar dos veces o fuera de fase, y cambiar ajustes sin dirigir.
- **Peticiones duplicadas y reintentos simultáneos** (empezar, sellar, testificar, votar, siguiente ronda, la misma persona en dos pestañas): cuentan una sola vez.
- **Ajustes a mitad de ronda**: cualquier cambio (ritmo, rondas, objetivos, variante, probabilidad) se rechaza con la ronda en marcha; la ronda conserva su propia copia.
- **Desconexiones**: un móvil expulsado que sigue conectado deja de recibir estado, no puede actuar ni volver con su token. Si quien dirige se va en plena votación, otra persona dirige al momento y la ronda termina. Volver a mitad de ronda con la variante no enseña nada de más.
- **Variante apagada**: las huellas de referencia del motor (`tests/engine-golden.test.ts`) y la simulación de 300 partidas (md5 `ddd860f1…`) siguen idénticas.
- **Test de privacidad modificado en la iteración anterior**: la excepción para `forgeryChance` es exacta (solo esa clave). Ahora además exige que aparezca **exactamente dos veces y como número**, para que nada pueda esconderse bajo ese nombre. Mutaciones comprobadas en el cierre (filtración introducida a propósito; se ejecutan 6 archivos de tests de privacidad, servidor y variante, 53 tests; se restaura el código, verificado idéntico por md5, y la batería completa vuelve a dar 187/187). Registro: `qa-out/f12-final/mutaciones.log`.

| Filtración introducida | Tests que fallan (de 53) |
|---|---|
| `forgeryAllowed` en la vista pública de la ronda | 4 |
| `canForge` en la vista privada de todo el mundo | 3 |
| La falsificación en la vista privada de todo el mundo | 3 |
| Las marcas de revisión individuales en la vista pública | 1 (`auditoria-servidor`) |
| Los papeles en la vista pública antes del veredicto | 6 |
| El servidor envía a cada socket la vista privada de quien dirige | 8 |

## 3. La variante «Prueba falsificable»

Verificado con pruebas deterministas y con el servidor real: 100/50/25 % funcionan como dice `PRUEBA-FALSA.md` (R14–R17). La oportunidad se sortea una vez por ronda; la culpable puede no usarla; nadie más recibe si la hubo hasta el veredicto; las pruebas verdaderas no se modifican; los puntos son los mismos que sin la variante; las rondas normales no cambian. No se ha cambiado ninguna probabilidad ni regla.

Para que se entienda qué revela una revisión, el texto del resultado auténtico ahora dice que la otra prueba puede seguir siendo falsa (problema 7).

## 4. El modo de un solo móvil

Sirve como respaldo y para probar el juego en un dispositivo; no debe condicionar el multijugador. Se puede jugar una partida completa sin bloqueos: el E2E juega 5 rondas, una partida nueva, la variante y un 25 %, a 320/360/390 px, también **sin conexión** con el archivo autónomo.

**Toques por ronda** (sin contar elegir sitios en la declaración, que son 3 por persona en ambos modos):

| | Antes | Ahora |
|---|---|---|
| Por persona (declarar + votar) | 4 + 4 = 8 | 3 + 4 = 7 |
| Compartidos (pruebas, defensa, veredicto) | 6 | 6 |
| Ronda con 5 personas, incluidos los sitios | 61 | 56 |
| Variante: por persona / extra | +3 / +1 | +3 / +1 |

**Recomendaciones que requieren una decisión de producto (no aplicadas):**

1. **Unir «Hecho → Ocultar y pasar» con el traspaso siguiente.** La pantalla «Hecho» ya no muestra nada secreto, igual que la de «Pasa el móvil a X». Ir directamente a la siguiente ahorraría 2 toques por persona y ronda (unos 10 con 5 personas). La duda es de producto: la pausa da un momento para pasar el móvil sin prisa.
2. **Cuaderno digital con un solo móvil.** Aporta poco: para consultarlo hay que pedir el móvil y pasar por «Soy X» mientras el tiempo corre, y en la votación solo lo ve quien vota en ese turno. Recomendación: en este modo, sugerir papel y boli y mantener el cuaderno digital para el multijugador. No se ha quitado nada.
3. **Evaluar la variante en multijugador.** Con un solo móvil, la ronda de marcas añade 3 toques por persona y no se comporta igual (sin recuento en vivo, marcas al final). Para decidir si la variante mejora el juego, conviene usar datos del multijugador; el modo de un móvil queda como respaldo.
4. Mantener la **elección de personajes** en la preparación: es opcional (cada persona ya tiene uno distinto por defecto) y no añade pasos obligatorios.

## 5. Pendiente

- **Cerrado: el motor ya no acepta una ronda de más.** Antes, tras la ronda 3 de 3, `game:lobby` y `game:start` enviados a mano daban «Ronda 4 de 3»; también se llegaba ahí desde la sala a mitad de partida bajando las rondas a las ya jugadas. Ahora el motor (`src/shared/engine/game.ts`), sea cual sea el cliente: no empieza ninguna ronda si la partida ya ha jugado todas las suyas; desde el veredicto de la última ronda no vuelve a la sala (el camino es la clasificación final, y «Nueva partida» desde ella vuelve a cero como antes); y en la sala a mitad de partida no deja fijar menos rondas que las ya jugadas. No cambian la puntuación, los papeles, la votación ni las condiciones de victoria. Pruebas: `tests/fin-de-partida.test.ts` (7, con peticiones directas al servidor real: se rechazan, no se crea ronda y nadie ve cambios de fase ni de puntos). Queda un detalle de interfaz: en la sala a mitad de partida los botones de rondas no se desactivan, y elegir un número menor que las rondas jugadas muestra «Esa acción no es válida ahora mismo.».
- **Volver con el código en otro navegador o tras cerrar el incógnito** da una plaza nueva que solo mira hasta la ronda siguiente. Es el comportamiento diseñado (la sesión se guarda en el navegador); el protocolo de prueba lo advierte.
- **«Compartir enlace» no funciona por HTTP** en la red de casa (limitación del navegador, ya documentada en `playtest-v1.1.md` E.5): usar el QR o el código.
- **Móviles físicos**: pendiente de la propia prueba; vibración, rendimiento y teclados reales solo se verán allí.

## 6. Pruebas ejecutadas (cierre de la auditoría, 20/10/2026)

Ejecución completa desde cero sobre el código final, con un registro por batería en `qa-out/f12-final/` (carpeta ignorada por git). Una ejecución anterior idéntica (`qa-out/f11-final/`) dio los mismos resultados.

| Batería | Resultado real |
|---|---|
| Comprobación de tipos | Sin errores |
| Unitarias y de servidor (`npm test`) | **187/187** en 22 archivos (antes de la auditoría, 178). Por archivo, entre otros: `engine` 32, `rules-v11` 24, `server` 15, `prueba-falsa` 12, `content-privacy` 9, `prueba-falsa-probabilidad` 8, `auditoria-servidor` 6 (nuevo), `pantallas-auditoria` 3 (nuevo), `prueba-falsa-servidor` 3, `engine-golden` 3 |
| Huellas de referencia del motor (`engine-golden`) | 3/3; el archivo de referencias no ha cambiado |
| `validate` | Todos los casos válidos |
| `simulate 300` | md5 `ddd860f185feb4be75bf00eff4339322`, idéntico al de antes |
| E2E un solo móvil (`un-movil.mjs`), contra el servidor | Pasa |
| E2E un solo móvil, archivo autónomo **sin conexión** | Pasa con el navegador offline; 0 peticiones de red. Además, el HTML no contiene ninguna carga externa: sus únicas URL son espacios de nombres XML/SVG y enlaces de documentación dentro de los mensajes de error de React |
| E2E un solo móvil (`local.mjs`) | Pasa (servidor y archivo) |
| E2E multijugador (`match.mjs`), con reconexión y revancha | Pasa con 4, 5, 6 y 10 navegadores |
| E2E variante (`prueba-falsa.mjs`), con recarga y corte de red | Pasa |
| E2E reinicio y caída del servidor (`restart`) | Pasa |
| E2E `scenes`, `crowd`, `rounds`, `evidence`, `ux` | Pasan |
| Accesibilidad (axe, dentro de las E2E) | Sin infracciones en las pantallas auditadas (una infracción haría fallar la suite) |
| Desbordamientos a 320/360/390 px | Sin desplazamiento lateral, botones cortados, áreas táctiles de menos de 44 px ni elementos fuera de su tarjeta (`un-movil`, `prueba-falsa`, `crowd`, `evidence`) |

**Contraprueba de las correcciones** (`qa-out/verify-f11.mjs`, navegador real contra el servidor construido; registro: `qa-out/f12-final/contraprueba.log`). Las correcciones se deshicieron temporalmente en el código fuente, se construyó y se ejecutó el script; después se restauraron los archivos (md5 idénticos) y se volvió a construir y ejecutar:

| Comprobación | Sin las correcciones | Con ellas |
|---|---|---|
| Un móvil: tras «Soy X» el expediente ya está abierto | Falla | Pasa |
| Un móvil, 320 px: «Ocultar» dentro de la tarjeta del expediente | Falla | Pasa |
| Un móvil: la declaración no habla de tiempo límite | Falla | Pasa |
| Un móvil: la votación no habla de tiempo límite | Falla | Pasa |
| Votación: el recordatorio dice «vota», no «señala» | Falla | Pasa |
| Multijugador, partida de 3 rondas: «Ir a la sala» tras las rondas 1 y 2 | Pasa | Pasa |
| Multijugador: tras la ronda 3, solo «Ver clasificación final» | Falla | Pasa |

**Cierre del riesgo del motor** (ronda de más; registros en `qa-out/f13/`). Tras el cambio del motor se repitió todo sobre el código final: comprobación de tipos sin errores; **194/194** pruebas en 23 archivos (las 187 anteriores más las 7 de `fin-de-partida`); `engine-golden` 3/3 con el archivo de referencias sin cambios; `validate` correcto; `simulate 300` con el mismo md5 `ddd860f185feb4be75bf00eff4339322`; y las 15 ejecuciones E2E de la tabla (`match` con 4, 5, 6 y 10, `un-movil` y `local` contra el servidor y con el archivo autónomo sin conexión, `rounds`, `crowd`, `evidence`, `ux`, `prueba-falsa`, `scenes`, `restart`) más `qa-out/verify-f11.mjs`, todas pasan. Con el motor anterior, 6 de las 7 pruebas nuevas fallan, precisamente porque el servidor aceptaba la orden.

**Corrección posterior (preparación de Render, 20/10/2026).** Ese «194/194» incluía un aprobado falso: Vitest 5 guarda en `node_modules/.vitest-cache` los módulos ya transformados, y conservaba una versión de las escenas de antes de importar las ilustraciones WebP. Sin esa caché (`npx vitest run --no-fsModuleCache`, o en una instalación limpia), fallaba una prueba de `ambience.test.ts`. La prueba esperaba el dibujo SVG de «boda-tarta», que desde la importación de las ilustraciones muestra su ilustración, como está previsto (lo comprueban la E2E `scenes` y la prueba «prefers a case's illustration»). No era un fallo del juego: se ha ajustado esa aserción con el mismo criterio que la E2E (la ilustración si está importada; si no, el dibujo). Con eso, 194/194 sin caché en el árbol de trabajo y en una copia limpia.

**No ejecutado:** prueba en Android o iPhone físicos (todo con Chromium emulando móviles) y vibración real (solo simulada con `navigator.vibrate`).

## 7. Recomendación

**El juego está listo para una primera prueba real en multijugador**, siguiendo `docs/PLAYTEST-amigos.md`: juego normal primero y la variante, al 100 %, solo cuando el juego normal se haya entendido. No hay bloqueos conocidos. Al empezar, comprobad que dos móviles reales entran en la sala; el modo de un solo móvil queda como respaldo.
