# Coartada en Render: despliegue y primera prueba con amigos

Guía corta para tener Coartada en una URL pública de Render y jugar una partida privada con 5 o más personas, cada una desde su propio móvil.

**Estado (20/10/2026): no está desplegado.** No existe ninguna URL de Render comprobada. Todo lo marcado como ✅ se ha comprobado aquí con el build de producción, un proxy HTTPS local que imita a Render y Chromium emulando móviles. Lo marcado como ☐ necesita una acción manual en Render, o una comprobación con la URL real y móviles físicos.

Complementa a `README.md` («Desplegar»), a `docs/playtest-v1.1.md` (apartado E.10) y a `docs/PLAYTEST-amigos.md` (cómo llevar la sesión).

## 1. Qué servicio hace falta y por qué

Hace falta un **Web Service** de Render con runtime **Node** y **una sola instancia**. **No vale un *Static Site***:

- El multijugador necesita el servidor del juego. Ese servidor reparte las cartas, guarda las salas y hace de árbitro.
- La misma URL sirve la web y la conexión en tiempo real (Socket.IO sobre WebSocket).
- El móvil se conecta siempre al mismo origen desde el que abrió la página, así que no hay que configurar ninguna dirección.

Las salas viven en la memoria del servidor; no hay base de datos. Por eso:

- hay que usar **una sola instancia**, sin escalado;
- **cualquier reinicio borra las salas** (apartado 9).

El plan **Free** basta para la prueba. No hace falta ningún servicio de pago.

## 2. Configuración de compilación y arranque

El repositorio ya trae `proyectos/coartada/render.yaml`, con `plan: free` para que un *Blueprint* no cree una instancia de pago. Si se crea el servicio a mano (*New → Web Service*), estos son los valores:

| Campo | Valor |
|---|---|
| Repository / Branch | `aangelrvss-oss/web-design`, la rama que contenga esta versión (ver 2.1) |
| Root Directory | `proyectos/coartada` |
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` (equivale a `node dist/server.mjs`) |
| Health Check Path | `/healthz` |
| Instance Type | **Free** |
| Region | La más cercana a los jugadores (para España: *Frankfurt*) |
| Auto-Deploy | **Desactivado** mientras se juega: cada despliegue reinicia el servidor y borra las salas |

✅ Comprobado en una copia limpia que contiene solo lo que entraría en un commit (265 archivos):
- `npm ci && npm run build` termina bien con Node 22;
- el servidor arranca con `PORT=10000`, `NODE_ENV=production`, `TRUST_PROXY=1` y sin `HOST`, y escucha en `0.0.0.0:10000`.

### 2.1 Antes de desplegar: el código tiene que estar en GitHub

Render construye desde una rama de GitHub, no desde un ordenador. Antes de crear el servicio, comprueba en GitHub que la rama elegida contiene esta versión: por ejemplo, que en ella existe este mismo documento y `render.yaml` lleva `plan: free`.

La rama por defecto del repositorio no es necesariamente la de esta versión: elige la rama a mano al crear el servicio.

## 3. Variables de entorno

No hace falta ningún secreto, token ni clave.

| Variable | Valor | Para qué |
|---|---|---|
| `NODE_VERSION` | `22` | Versión de Node en el build y al ejecutar |
| `TRUST_PROXY` | `1` | Render está delante como proxy. Así el límite de creación de salas por IP usa la IP real |

Las demás son opcionales (`.env.example`):

- **No definas** `PORT` ni `HOST`. Render pone `PORT` y el servidor escucha en `0.0.0.0` por defecto.
- **No definas** `NODE_ENV`. Render la pone en `production` solo al ejecutar. Si se definiera en el panel también afectaría al build: `npm ci` no instalaría Vite ni esbuild, y el build fallaría.
- `CORS_ORIGINS` no hace falta, porque la web y el WebSocket comparten origen.
- `MAX_ROOMS` puede quedarse sin definir (por defecto, 1000).

Ejemplo ficticio de lo que debe verse en el panel: `NODE_VERSION=22`, `TRUST_PROXY=1`. Nada más.

## 4. La URL pública

- Render da una dirección del tipo `https://<nombre-del-servicio>.onrender.com`, con HTTPS automático. No hay que configurar nada más.
- El enlace de invitación y el QR se construyen con la dirección desde la que quien dirige abre el juego. Por eso **la sala debe crearse siempre desde la URL de Render**.
- No hace falta dominio propio.

✅ Comprobado detrás del proxy HTTPS local:
- el texto de la sala muestra la dirección pública, no una local;
- el enlace de invitación funciona;
- todas las conexiones en tiempo real van por `wss://` al mismo origen;
- no hay ninguna petición a otro dominio ni a direcciones locales;
- el cliente de producción no contiene `localhost` ni puertos locales; las dos apariciones de «localhost» son valores internos de Socket.IO que solo se usan fuera de un navegador.

## 5. Comprobar que el servidor está operativo

1. ☐ Abrir `https://<servicio>.onrender.com/healthz`. Debe responder `{"ok":true,"rooms":0}`. El número indica cuántas salas hay abiertas.
2. ☐ Abrir `https://<servicio>.onrender.com/` y ver la portada de Coartada con su logotipo.
3. Si el servicio estaba dormido, la primera visita tarda **alrededor de 1 minuto**, y mientras tanto Render muestra su propia página de espera. Es normal.

✅ En local, el build de producción sirve:
- `/healthz`, la portada y los enlaces `/?sala=XXXX`;
- el manifiesto, el icono, `robots.txt` (que pide no indexar el sitio) y los archivos con caché larga;
- las cabeceras de seguridad (CSP, `X-Frame-Options`, `nosniff`).

Además devuelve 403 a los intentos de salir de la carpeta pública, y el mapa de código del servidor no es accesible.

## 6. Prueba de conexión con dos móviles (el día antes)

Para hacerla con dos móviles y una persona:

1. ☐ **Móvil A, con datos móviles (sin Wi-Fi):** abrir la URL → «Crear sala» → escribir un nombre.
2. ☐ **Móvil B, con Wi-Fi:** escanear el QR que muestra A (o abrir el enlace, o «Unirme con un código»). Debe aparecer en la sala de A.
3. ☐ En A, probar «Compartir enlace». Por HTTPS debería abrir el menú de compartir del sistema.
4. ☐ Con 2 personas no se puede empezar (el mínimo son 4). Para jugar una ronda de prueba, abrir dos pestañas más en otros dispositivos o navegadores.
5. ☐ Bloquear el móvil B 30 segundos y desbloquearlo: debe volver a su plaza solo.
6. ☐ Apuntar el tiempo de la primera carga y si algo falló.

✅ Ya comprobado con 5 móviles emulados por HTTPS/WSS:
- uno entra con el código y tres con el enlace de invitación;
- la partida empieza y todos ven la ronda 1;
- un corte de red de 4 segundos se recupera solo;
- una recarga a mitad de ronda conserva la plaza;
- no hay errores en la consola ni contenido mixto.

## 7. Crear la sala y compartir el código o el QR

1. Quien dirige abre `https://<servicio>.onrender.com` → **Crear sala** → su nombre.
2. La sala muestra un **QR**, el **código de 4 letras** y «Compartir enlace».
3. El resto escanea el QR con la cámara, toca el enlace recibido, o abre la URL y entra con «Unirme con un código».
4. En la sala, cada persona puede elegir su personaje. Quien dirige elige el ritmo y las rondas. La variante «Prueba falsificable» viene **desactivada** (ver `docs/PRUEBA-FALSA.md`).
5. Con 4 o más personas, **Empezar partida**.

## 8. Organizar la primera sesión

Se sigue `docs/PLAYTEST-amigos.md` (guion, qué observar y plantilla). Lo propio de Render:

- **5 minutos antes**, quien dirige abre la URL para **despertar el servicio**. Así la espera de alrededor de 1 minuto no coincide con la llegada de la gente.
- Cada persona usa **su propio móvil**, siempre en el **mismo navegador** y mejor no en incógnito: el navegador recuerda su plaza para volver tras una recarga o un corte.
- Datos móviles o Wi-Fi, da igual: cada móvil puede usar su red.
- **Nadie hace push ni despliega durante la sesión**. Con *Auto-Deploy* desactivado no hay riesgo.
- Primer bloque: juego normal, 3 rondas, ritmo normal, variante apagada.

## 9. Si el servidor se duerme, se reinicia o se pierde una conexión

| Qué pasa | Qué ve la gente | Qué hacer |
|---|---|---|
| Un móvil pierde la red o se bloquea un momento | «Reconectando…» / «Sin conexión. Reintentando…» | Nada: vuelve solo a su plaza y su expediente. Si tarda, recargar la página en el mismo navegador |
| Alguien cierra la pestaña | — | Volver a abrir el mismo enlace en el mismo móvil y navegador: recupera su sitio |
| Quien dirige se desconecta más de 20 s | Otra persona pasa a dirigir | Nada |
| **El servidor se reinicia** (despliegue, mantenimiento de Render, reinicio del plan gratuito, caída) | Primero «Sin conexión. Reintentando…»; cuando vuelve, la portada con «Esa sala ya no existe (se cerró o el servidor se reinició). Crea una sala nueva o únete a otra con su código.» | Quien dirige crea **otra sala** y el resto se une con el nuevo código. **Los puntos de esa partida se pierden.** Apuntad la hora y la fase |
| **El servicio se ha dormido** (15 min sin tráfico) | La primera visita tarda alrededor de 1 min (página de espera de Render) | Esperar. Si había una sala, se ha perdido: crear otra |
| Aparece en la sala alguien que nadie conoce | Un nombre de más en la lista | Quien dirige crea **otra sala** y comparte el nuevo código solo con el grupo (ver 10) |

✅ Comprobado con el build de producción tras el proxy HTTPS:
- al parar el servidor de forma ordenada (lo que hace Render al reiniciar), los 5 móviles muestran el aviso de conexión;
- al volver, los 5 vuelven a la portada con «Esa sala ya no existe…»;
- se puede crear una sala nueva enseguida.

La E2E `restart` comprueba también una caída brusca.

## 10. Limitaciones conocidas

**Del plan gratuito de Render** (según su documentación; no se ha podido observar aquí):

- **Suspensión:** el servicio se duerme tras **15 minutos sin tráfico entrante**. Según Render, cuentan las peticiones HTTP y los mensajes que llegan por WebSocket. Despertarlo tarda alrededor de 1 minuto. Al dormirse se pierden las salas.
  - El juego envía un latido cada 10 s mientras haya un móvil con la página abierta. Si ese latido cuenta como tráfico no está comprobado.
  - Regla práctica: si todos los móviles se bloquean o se cierran más de 15 minutos, hay que crear una sala nueva.
- **Reinicios:** Render puede reiniciar un servicio gratuito en cualquier momento, y cada despliegue también lo reinicia. En ambos casos se pierden las salas.
- **Horas:** 750 horas gratuitas al mes por cuenta; un servicio dormido no las consume. Para una tarde de prueba sobran.
- **Recursos:** instancia pequeña (alrededor de 512 MB y 0,1 CPU, según Render). Para una o dos salas de 5 a 10 personas es suficiente, pero no se ha medido en Render.
- No se ha añadido nada para mantenerlo despierto ni ningún servicio de pago.

**De la prueba privada:**

- **Códigos de sala.** Son 4 letras de un alfabeto de 20 (160 000 combinaciones), generados con un generador criptográfico. Cada conexión está limitada a unas 6 peticiones por segundo, y se expulsa a quien insiste.
  - Para adivinar el código de una sala concreta harían falta decenas de miles de intentos y conocer la URL. Para una prueba de una tarde entre amigos, el riesgo es bajo.
  - Si aun así entra un desconocido conectado, la sala solo deja «Quitar» a personas desconectadas, así que la solución es crear otra sala.
  - No se ha añadido autenticación: sería desproporcionado para esta prueba.
- **Lo que comprueba el servidor (pruebas automáticas en verde):**
  - Los papeles, las memorias, los objetivos secretos, los votos y la semilla de la ronda no salen del servidor hasta el veredicto.
  - Cada móvil solo recibe su propio expediente.
  - El cuaderno es privado: nunca se envía al servidor.
  - En la variante, solo la culpable sabe si puede falsificar.
  - Las acciones se validan en el servidor (fase, permisos y quién dirige); los mensajes malformados o demasiado grandes se rechazan.
  - Los errores que ve el móvil son códigos genéricos («Esa acción no es válida ahora mismo»), sin detalles internos.
  - No hay rutas de administración ni de depuración; `/healthz` solo dice cuántas salas hay.
  - El cliente no contiene claves ni variables de entorno: la única variable de compilación (`VITE_SCENE_PHOTOS`) solo elige el tamaño de las ilustraciones.
- **Con `TRUST_PROXY=1`, el límite de 30 salas por IP cada 10 minutos usa la primera IP de `X-Forwarded-For`.** Alguien que falsifique esa cabecera podría saltárselo y crear más salas. El tope global de 1000 salas sigue en pie. No afecta a la privacidad ni a las partidas.
- **Sin comprobar todavía:**
  - Render real: cabeceras del proxy, tiempos de arranque, si los latidos evitan la suspensión;
  - móviles físicos: iPhone y Android, cámaras leyendo el QR, vibración, bloqueo de pantalla, menú de compartir.

## 11. Si Render no está disponible: volver al modo de un solo móvil

El archivo `dist/coartada-un-movil.html` (se genera con `npm run build:demo`) funciona **sin conexión y sin servidor**:

1. Copiarlo antes de la sesión a un móvil, por ejemplo por cable, correo o AirDrop.
2. Abrirlo con Chrome o Safari.
3. Pulsar «Jugar en este móvil» y pasar el móvil por turnos.

✅ La E2E `un-movil` en modo `DEMO=1` lo comprueba con el navegador sin red: 0 peticiones.

Alternativa con red local: un portátil en la Wi-Fi de casa con `npm start` (README, «Jugar esta noche con amigos»).

Si se usa cualquiera de las dos, anotadlo en la hoja: no es la misma experiencia que el multijugador.

## 12. Al terminar

- ☐ Suspender el servicio en el panel de Render (*Settings → Suspend Web Service*) o borrarlo si no se va a repetir la prueba.
- ☐ Pasar las notas a limpio el mismo día (`docs/PLAYTEST-amigos.md`, apartado 9).
