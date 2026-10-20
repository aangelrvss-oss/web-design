# COARTADA: estado del proyecto

*Actualizado el 2026-10-15 (v1.1). Este archivo separa lo que existe y se ha comprobado de lo que no se ha hecho. Cada conclusión lleva una etiqueta: **Verificado**, **Parcialmente verificado**, **Pendiente** o **No implementado**.*

## Estado en una línea

Jugable de principio a fin en local: modo online con un móvil por persona (servidor autoritativo) y modo de un solo móvil, 25 casos validados, 3 papeles y, desde la v1.1, la «Última defensa». **No desplegado** en una URL pública. **No probado con personas reales ni en móviles físicos.** Por eso la v1.1 **no se declara completamente validada**.

## Qué cambia en la v1.1

| Cambio | Detalle |
|---|---|
| Última defensa (regla nueva) | Durante la investigación cada participante puede señalar en secreto a una persona (puede cambiarla o quitarla, nunca a sí misma). Al terminar la investigación, la persona más señalada tiene 25 s (15 en Rápido, 30 en Relajado; hasta la v1.1 eran 15, 12 y 20) para defenderse en voz alta. Empate: sorteo determinista con la semilla de la ronda entre las empatadas, anunciado como sorteo. Nadie señalado o defensor desconectado: se pasa directamente a la votación. La terminan antes quien se defiende o quien dirige. Los señalamientos nunca se muestran durante la ronda; llegan a los dispositivos con los datos del veredicto, pero la interfaz de la v1.1 no los enseña (el veredicto muestra el recuento de votos por persona, no quién votó a quién). |
| Tiempos por tamaño de grupo | Una sola función, `timingsFor(ritmo, personas)`: investigación ×0,85 con 4–5, ×1 con 6–7, ×1,2 con 8–10 (y +10 s de votación). Máximo por ronda en ritmo normal sin veredicto: 6,8 / 7,5 / 8,6 min con la defensa de 15 s de la v1.1; 7,0 / 7,7 / 8,8 min con la de 25 s actual. |
| Tres estados de testimonio | *Coincide*, *Contradice* y *Sin contraste* (si la coartada de la otra persona es automática). Una coartada automática ya no puede «contradecir» ni dar el punto por destapar una mentira. |
| Puntuación | **Valores sin cambios** (2 / 4 / 3 / 1 / 1 / 1). Solo se aclararon textos: el +1 de voto es de la primera votación; el +1 por destapar una mentira exige un testimonio verdadero que contradiga una coartada falsa (una vez por ronda); el objetivo secreto no cambia quién gana. |
| Corrección editorial | Glosario único en la app, la guía y la documentación: ronda, partida, coartada, recuerdo, prueba, testimonio, objetivo secreto (antes «encargo»), «la persona culpable». 551 textos inventariados con comprobación automática (`npm run texts`, `docs/TEXT_INVENTORY.md`). |
| Guía | Reescrita: la ronda de ejemplo se presenta como ejemplo y la genera el motor real (un test comprueba cada dato), con los modos separados, la privacidad, la coartada automática, los empates, los puntos, el reinicio entre rondas y los objetivos que obligan a mentir. |
| Sin añadir | Ni pruebas, ni papeles, ni horas nuevos (lo pedía el encargo). |

## Escenas por caso y auditoría de equilibrio (sin cambios de reglas)

- **Una escena propia por caso.** 25 SVG dibujados a mano en el estilo de los personajes. Reemplazan a las 6 escenas compartidas, que quedan como respaldo. Detalle en `docs/ESCENAS.md`.
  - **Verificado** por pruebas unitarias (`tests/ambience.test.ts`), por `npm run e2e:scenes` (escena correcta en rondas reales, móvil de 320 a 390 px, respaldo con el archivo bloqueado, axe) y por revisión visual de las 25.
  - **Pendiente:** móviles físicos.
- **Ilustraciones por caso con Higgsfield.**
  - Hechas con la escena del desván como referencia de estilo, en formato 16:9 y WebP de 1440 y 720 px.
  - Las 25 están integradas, con dos respaldos: primero la SVG del caso y después la escena genérica.
  - **Verificado:**
    - pruebas unitarias;
    - `npm run e2e:scenes`: escena correcta en rondas reales a 320–390 px y los dos respaldos;
    - partidas E2E de 4 y 6 jugadores, sin problemas graves de accesibilidad;
    - modo un solo móvil y demo.
  - **Pendiente:** móviles físicos.
  - Detalle en `docs/ESCENAS-higgsfield.md`.
- **Huellas del motor.** `tests/engine-golden.test.ts` fija con huellas el reparto, la noche, los recuerdos, las pruebas, los objetivos y la puntuación de los 25 casos. Se grabaron antes de tocar nada y siguen idénticas. **Verificado.**
- **Auditoría de equilibrio con intervalos.** `npm run balance` juega unas 430.000 rondas con bots y semillas fijas, y compara variantes simuladas fuera del motor. Conclusiones en `docs/EQUILIBRIO-y-variantes.md` y datos en `docs/EQUILIBRIO-datos.md`.
  - Ninguna variante implementada.
  - Recomendación: probar primero el Informante desde 6 personas; descartar el chivatazo libre.
  - **Pendiente:** partidas con personas.
- **Documentación corregida.** `RULES.md` daba duraciones de la defensa antigua (15 s). `docs/balance-sim*.txt` regenerados: los porcentajes no cambian y solo cambian las duraciones.

## Mantenimiento de la v1.1 (sin cambios de reglas)

- **Logo:** se recupera la franja roja que tacha «Coartada» (ver el punto 6 de la lista siguiente).
- **Barra de acciones a 320–360 px:** «Pedir prueba 2», «Pedir terminar», «Retirar petición» y, en el modo de un solo móvil, «Terminar investigación» se salían de la pantalla. «Retirar petición» se salía ya a 360 px, un ancho muy común en Android. El fallo se reprodujo con E2E y se corrigió: por debajo de 380 px la etiqueta puede ocupar dos líneas dentro del mismo botón de 52 px. Los E2E `match`, `local` y `crowd` lo comprueban ahora. **Verificado** (Chromium emulado).
- **Grupos de 9–10 personas:** `npm run e2e:crowd` ejecuta el peor caso: 10 personas, hasta 10 fichas en una celda, nombres largos y 27 testimonios. Recorre todas las pantallas de la ronda a 390, 360 y 320 px. Resultado: sin solapes, sin fichas fuera de su celda, sin textos cortados y sin desbordamiento. Las listas de votación y de testimonios piden desplazarse bastante, pero se leen. **Parcialmente verificado**: solo en navegador emulado, no en móviles físicos.
- **Documentación corregida:** decía que el veredicto muestra quién señaló a quién. La interfaz solo muestra el recuento de votos por persona.
- **Primera prueba con amigos:** guía práctica y plantilla en `docs/PLAYTEST-amigos.md` (auditoría previa: `docs/AUDITORIA-playtest.md`). Protocolo técnico detallado: `docs/playtest-v1.1.md`. Incluye el apartado E (multijugador con móviles físicos en la Wi-Fi) y E.10 (con una URL HTTPS de Render). **Pendiente** de realizar.
- **Reconexión tras un reinicio del servidor** (16-10-2026, solo cliente: `src/client/net/store.ts`).
  - **Problema:** al apagarse de forma ordenada (SIGTERM, que es lo que hace Render al reiniciar o desplegar), el servidor cierra él mismo los sockets. Socket.IO no reintenta tras un «io server disconnect», así que el móvil se quedaba indefinidamente en la ronda muerta con «Sin conexión. Reintentando…». Tras una caída brusca sí se reconectaba, pero la URL seguía apuntando a la sala muerta, y la portada se abría en modo «unirse» con ese código, sin ofrecer «Crear sala».
  - **Arreglo:** ante una desconexión iniciada por el servidor, el cliente vuelve a conectar él mismo (después, el *backoff* normal). Al reanudar, si la sala ya no existe, borra la sesión, la ronda y la sala de la URL y muestra «Esa sala ya no existe (se cerró o el servidor se reinició). Crea una sala nueva o únete a otra con su código.» No intenta recuperar salas ni puntos.
  - **Prueba nueva:** `npm run e2e:restart`. Con SIGTERM y con SIGKILL en plena declaración, 2 navegadores y 2 clientes de prueba deben volver a la portada con el aviso, sin rastro de la sala, y poder crear y unirse a una sala nueva. Comprueba también que un corte de red con el servidor activo sigue recuperando la misma ronda. Con el código anterior la prueba falla; con el arreglo pasa.
  - **Verificado** con servidor local y Chromium emulado. **No verificado** en Render ni en móviles físicos.
- **Inventario de textos:** `scripts/text-inventory.ts` ya no cuenta como texto visible las cadenas que solo se comparan en el código (`reason === 'io server disconnect'`). Las 551 entradas coinciden con las del commit anterior salvo el aviso nuevo.

## Errores encontrados y corregidos (v1.1)

1. **La cuenta atrás de la defensa mostraba 16 s en una fase de 15 s** (y los temporizadores podían ir ~1 s por detrás). Causa: el desfase de reloj se estimaba con media móvil y la latencia del primer mensaje lo sesgaba. Reproducido en el E2E (16 s en 3 de 12 lecturas) y corregido: se guarda la mayor muestra. Tras el arreglo hubo 0 lecturas por encima de 15 en 46 lecturas en 7 ejecuciones de 4 a 10 jugadores. **Verificado.**
2. **Coartadas automáticas tratadas como declaraciones**: podían «contradecir» un testimonio verdadero y dar puntos. Ahora salen como «sin contraste». **Verificado** (tests).
3. **Contraste insuficiente** de 6 colores de ficha (axe) y de las fichas atenuadas. Se oscurecieron los colores y las fichas atenuadas pasaron a anillo hueco. **Verificado** (axe: 0 violaciones).
4. **Accesibilidad**: `aria-label` en contenedores sin rol, tabla desplazable sin foco y `aria-pressed` en elementos que no eran botones. **Verificado** (axe).
5. **Errores editoriales**:
   - «Anoche» en casos de día; duración «6–9 min» incorrecta.
   - Guía con «2 min» frente a «3 minutos»; concordancias y términos con género («pillado», «espectador»).
   - Objetivos que no decían «primera votación»; «cuadre» en lugar de «coincida».
   - La guía afirmaba que la prueba 2 sale «a mitad».
   - No se decía que el modo de un solo móvil no tiene tiempo límite.
   - «Escena del crimen» en una etiqueta accesible.
   - Lobby online «Empezar ronda» frente a local «Empezar partida» (ahora «Empezar partida» en los dos).

   **Verificado** por inventario y revisión manual.
6. **Logotipo.** La franja roja que tacha «Coartada» es intencionada: es la seña de la marca y se recupera tal como estaba en la v1.0, aunque una revisión intermedia la había movido debajo del nombre. Ahora es una capa propia, por delante de las letras, medida en em: queda centrada en la altura media de las minúsculas y sobresale lo mismo por los dos lados. Antes acababa en un punto arbitrario porque el logo ocupaba todo el ancho de la columna. Medido en 320, 360, 390 y 1280 px, en la portada y en la guía: centro a ≤1,3 px de la mitad de las minúsculas, sobresale igual por ambos lados (±0,6 px) y sin desbordamiento horizontal. **Verificado** (Chromium emulado).
7. **El validador de contenido no comprobaba las horas**: ahora exige formato HH:MM, orden cronológico y como mucho un cruce de medianoche. **Verificado.**
8. **El E2E de 10 jugadores fallaba** porque el script solo tenía 8 nombres (fallo del script, no del juego). **Verificado.**
9. **La demo de un archivo no pasaba de la portada en el visor de artefactos** (un efecto devolvía el resultado de `scrollTo`). Corregido antes de la v1.1 y comprobado otra vez con la v1.1 en un iframe aislado que imita el visor. **Verificado** (en emulación, no en el visor real).

## Comandos ejecutados y resultados reales (2026-10-15, en este entorno)

| Comando | Resultado |
|---|---|
| `npm ci` | 0 vulnerabilidades |
| `npm run typecheck` | Sin errores |
| `npm test` | **94/94** en 6 archivos: motor 30, reglas v1.1 23, casos de auditoría 16, contenido y privacidad 9, ejemplo de la guía 3, servidor multicliente real 13. 0 fallidos. |
| `npm run validate` | 25 casos × 25 semillas × 7 tamaños: 0 violaciones (aviso informativo: «La cocina» aparece en 3 casos) |
| `npm run texts` | 551 textos, 0 problemas de terminología o tipografía detectables automáticamente |
| `npm run build` y `npm run build:demo` | Correctos; demo de un archivo de 863 KB |
| `node e2e/match.mjs … N` con N = 4, 5, 6, 7, 8 y 10 | Todo correcto (Chromium, sesiones independientes, todas menos una a 390×844 táctil). Cada ejecución cubre: unirse por código y por enlace, una ronda completa con señalamiento y defensa, la auditoría de privacidad de cada trama WebSocket, la revancha, la reconexión a mitad de ronda y la recuperación tras perder la red. axe: 0 violaciones en 7 pantallas. |
| `node e2e/local.mjs` (app servida) | Correcto: 4 personas en un móvil, ronda completa con defensa y segunda ronda; axe 0 |
| `DEMO=1 node e2e/local.mjs file://…/coartada-un-movil.html` | Correcto: guía (axe 0, sin desbordamiento) y ronda completa |
| Emulación del visor de artefactos (iframe aislado, `scrollTo` parcheado) | Los dos botones de la portada abren su pantalla; sin errores en consola |
| `npm run simulate` y `INDEPENDENT=1 npm run simulate` | 7.200 rondas cada uno; 0 rondas bloqueadas o inválidas (ver abajo) |

### Validación tras el arreglo de reconexión (16-10-2026, 12:29–12:32 UTC, en este entorno)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | Sin errores |
| `npm test` | **94/94** en 6 archivos |
| `npm run validate` | Los 25 casos son válidos |
| `npm run texts` | 551 textos, 0 problemas |
| `npm run build` y `npm run build:demo` | Correctos |
| `node e2e/match.mjs … 4`, `… 5`, `… 6` | Correctos, con la auditoría de privacidad de las tramas recibidas por cada navegador; axe: 0 violaciones en 7 pantallas en cada ejecución |
| `node e2e/local.mjs` (app servida) y `DEMO=1 … coartada-un-movil.html` | Correctos; axe: 0 violaciones |
| `npm run e2e:crowd` | Correcto (10 personas, 390/360/320 px) |
| `npm run e2e:restart` | Correcto. Con SIGTERM y con SIGKILL, el aviso aparece en 0,8 s y ambos móviles crean una sala nueva y se unen a ella; el corte de red recupera la misma ronda |

Todo con servidor local y Chromium emulado. Nada de esto se ha ejecutado en Render ni en móviles físicos.

## Simulación (bots, no personas)

En `docs/balance-sim.txt` (la mesa comparte criterio) y `docs/balance-sim-independiente.txt` (cada bot decide solo): 400 rondas por celda.

| Indicador | Mesa con consenso | Bots independientes |
|---|---|---|
| El grupo gana, media por estrategia (mínimo / esquiva / total) | 57,5 % / 44,9 % / 44,8 % | 44,1 % / 40,3 % / 39,5 % |
| Rango del grupo según tamaño | 70,8 % (4, mínimo) a 39,3 % (6, total) | 59,5 % (4) a 25,0 % (6, total) |
| Empates en la elección de defensor (sorteo) | 0 % | 0–36 % (máximo con 4 personas) |
| Nadie acusado | 0 % | hasta 19,5 % (4 personas) |
| Rondas bloqueadas o inválidas | 0 | 0 |

Interpretación: la estructura de información no es trivial ni imposible y ninguna estrategia de la persona culpable domina. Con bots independientes, los grupos de 6 o más favorecen claramente a la persona culpable (25–43 % de victorias del grupo); si eso se confirma con personas, es lo primero que hay que ajustar. **Los bots no leen caras ni cambian de opinión tras la defensa: el efecto de la defensa en el voto no se puede simular.** No se tocaron los valores de puntuación para «equilibrar» la simulación. **Parcialmente verificado** (equilibrio entre bots, no entre personas).

## Estado por área

| Área | Estado | Etiqueta |
|---|---|---|
| Motor de reglas (defensa, tiempos, estados, puntos, reinicio entre rondas) | Tests unitarios y los 16 casos de auditoría | **Verificado** |
| Privacidad online | Ningún señalamiento, papel, recuerdo, voto ni semilla llega a otro navegador antes del veredicto (tramas reales capturadas) | **Verificado** en Chromium y servidor local |
| Multijugador online | 4–10 sesiones independientes en un servidor local | **Parcialmente verificado**: no hubo móviles físicos, ni redes reales, ni Safari ni Firefox |
| Modo de un solo móvil | App servida y demo de un archivo, de 4 personas | **Verificado** en Chromium emulado; **Pendiente** en móviles físicos |
| Demo dentro del visor de artefactos | Emulado con iframe aislado | **Parcialmente verificado** |
| Los 25 casos | Validados para 4–10 personas, con horas cronológicas | **Verificado** (coherencia), **Pendiente** (si son divertidos) |
| Accesibilidad | axe-core 4.10.3: 0 violaciones en las pantallas auditadas; objetivos táctiles de 44 px o más; movimiento reducido | **Parcialmente verificado**: no se ha probado con lector de pantalla real |
| Despliegue | `Dockerfile`, `render.yaml` e instrucciones en el README | **No implementado** (sin desplegar: no había credenciales ni demonio de Docker) |
| Prueba con personas | Ninguna | **Pendiente** |
| Objetivos secretos | Correctos en tests; desactivados por defecto; equilibrio sin simular | **Parcialmente verificado** |

## Errores abiertos y riesgos para la prueba con personas

- **«Compartir enlace» no funciona por HTTP en la red local.** El navegador solo permite compartir y copiar en páginas seguras (HTTPS o localhost). El botón no hace nada ni muestra ningún aviso. Alternativa: el QR o el código. Defecto menor, confirmado el 16-10-2026 en Chromium accediendo por IP. Sin corregir (sería un cambio de interfaz).
- **Quien sale con «Salir de la sala» no puede recuperar su sitio.** Si vuelve, entra como persona nueva y con 0 puntos. Es coherente con las reglas, pero queda pendiente de decisión.

- **La defensa puede no cambiar nada.** Con 25 s y sin poder modificar ya declaraciones ni testimonios, puede quedarse en un trámite. Hay que observar si las mesas la usan o la saltan.
- **Señalar en secreto es un paso extra** durante la investigación, la fase más cargada. Hay que ver si se entiende sin explicación y si la gente olvida hacerlo (en ese caso no hay defensa, lo que es válido pero quita el momento).
- **En el modo de un solo móvil la defensa la elige el grupo en voz alta**, no por votos secretos (no hay forma de señalar en secreto con un solo teléfono sin otra ronda de relevos). Está documentado en RULES §12.
- **Grupos de 6 o más** podrían favorecer a la persona culpable (simulación independiente).
- **Con 9–10 personas el tablero está lleno** (hasta 10 fichas por celda); se puede usar, pero es denso.
- **Salas en memoria:** reiniciar el servidor cierra todas las salas y se pierden los puntos. Desde el arreglo del 16-10-2026, los móviles vuelven solos a la portada con un aviso y hay que crear otra sala. Hay que usar una sola instancia.
- **Render no se ha desplegado ni probado.** Riesgos conocidos del plan gratuito (según la documentación de Render):
  - se duerme tras 15 min sin tráfico y el arranque en frío tarda alrededor de 1 min;
  - Render puede reiniciarlo en cualquier momento;
  - un despliegue reinicia el servidor.

  El `render.yaml` no declara `plan`, y un *Blueprint* crearía entonces una instancia de pago. El README explica cómo crear el servicio gratuito a mano. Sin verificar: «Compartir enlace» por HTTPS, la latencia y si 0,1 CPU basta.
- **Sin probar en iOS Safari ni en Firefox:**
  - márgenes seguros y teclado sobre los campos;
  - lectura del QR;
  - reconexión desde pestañas en segundo plano;
  - desbloqueo del audio en iOS.
- **Solo castellano.**

## Archivos tocados en la v1.1

- **Motor y protocolo:**
  - `src/shared/types.ts`
  - `src/shared/engine/game.ts`, `encargos.ts`, `views.ts`
  - `src/shared/protocol.ts`
  - `src/shared/content/validate.ts`
  - `src/shared/content/example.ts` (nuevo)
  - `src/server/app.ts`
- **Cliente:**
  - `src/client/App.tsx`, `demo.tsx`
  - `net/store.ts`
  - `lib/text.ts`, `colors.ts`, `summary.ts`
  - `ui/game.tsx`, `kit.tsx`
  - `styles/app.css`
  - `screens/`: Declare, Investigate, Defense (nuevo), Vote, Result, Local, Lobby, Home, Rules, Guide
- **Pruebas:**
  - `tests/rules-v11.test.ts`, `audit-cases.test.ts`, `guide-example.test.ts` (nuevos)
  - `tests/content-privacy.test.ts`, `server.test.ts`
  - `e2e/match.mjs`, `local.mjs`, `a11y.mjs` (nuevo)
- **Scripts:**
  - `scripts/simulate.ts`
  - `scripts/text-inventory.ts` (nuevo)
  - `package.json`
- **Documentación:**
  - `docs/RULES.md` (reescrito), `GAME_DESIGN.md`, `ARCHITECTURE.md`, `CHECKPOINT.md`, `README.md`
  - `docs/balance-sim.txt`, `balance-sim-independiente.txt`, `TEXT_INVENTORY.md` (generados)

## Cómo ejecutarlo y probarlo en local

```bash
cd proyectos/coartada
npm ci
npm run typecheck && npm test && npm run validate && npm run texts
npm run build && PORT=4100 npm start            # juego en http://127.0.0.1:4100
# en otra terminal:
node e2e/match.mjs http://127.0.0.1:4100 6 qa-out
node e2e/local.mjs http://127.0.0.1:4100 qa-out
npm run build:demo && DEMO=1 node e2e/local.mjs "file://$PWD/dist/coartada-un-movil.html" qa-out
npm run simulate && INDEPENDENT=1 npm run simulate
npm run e2e:crowd                  # con el servidor de QA arrancado
npm run e2e:restart                # arranca su propio servidor desde dist/
```

Si Playwright no encuentra Chromium, añade `CHROMIUM_PATH=/ruta/a/chromium`. Para jugar en la misma Wi-Fi o desplegar, sigue el README.

## Siguientes pasos (por prioridad)

1. Hacer la prueba con personas siguiendo `docs/playtest-v1.1.md` (3–5 rondas con 5–7 personas en móviles reales). Observar:
   - si la defensa se usa;
   - si señalar se entiende;
   - cuánto duran las fases;
   - si la prueba 2 llega a buen momento.
2. Desplegar una instancia (Render: README, «Desplegar»; protocolo: `docs/playtest-v1.1.md`, E.10) y comprobar la URL pública desde dos redes móviles.
3. Probar a mano en iOS Safari y en Chrome para Android (lista de arriba).
4. Ajustar con datos de personas: tiempos, número de recuerdos, señuelos y umbral de cómplice (sobre todo con 6 o más).

---

## Historial v1.0 (resumen)

- **Mejoras de la QA crítica de la v1.0:**
  - Sin coartadas rellenadas de antemano: el orden de sellado delataba a la persona culpable.
  - Tablero arreglado a 390 y 320 px.
  - Sin desbordamiento horizontal en el veredicto.
  - Controles de investigación más simples.
  - Pantallas de relevo y de revelado en el modo de un solo móvil.
  - Declaración de 90 a 120 s en ritmo normal.
- **Decisión de equilibrio de la v1.0:** la persona culpable no sabe dónde estaba su cómplice a la hora del incidente (con ese dato, el grupo casi nunca ganaba con 6 o más).
- **Arte:** Higgsfield estaba conectado, pero su CDN de imágenes estaba bloqueado por el proxy del entorno. La identidad visual es solo CSS/SVG.
