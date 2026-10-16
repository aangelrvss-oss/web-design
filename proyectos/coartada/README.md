# Coartada

Juego de deducción social para jugar con amigos, cada uno con su móvil. Ha ocurrido algo absurdo y una persona del grupo es la culpable: declaráis en secreto dónde estuvisteis a tres horas, las coartadas se revelan a la vez en un tablero común, dais testimonios («estuve con Marta a las 23:00») y el tablero dice si coinciden o contradicen. Salen dos pruebas que nunca mienten, la persona más señalada tiene 15 segundos de última defensa y votáis en secreto.

- 4–10 personas (mejor 5–8), rondas de 7–9 minutos como máximo en ritmo normal (menos si todo el mundo termina antes), 25 casos.
- Sin cuentas, sin anuncios, sin IA durante la partida y sin datos personales.
- Modo principal: un móvil por persona (sala con código, enlace o QR). Alternativa: un solo móvil que se va pasando.

Documentación: [diseño](docs/GAME_DESIGN.md) · [reglas](docs/RULES.md) · [arquitectura](docs/ARCHITECTURE.md) · [investigación](docs/RESEARCH.md) · [estado](docs/CHECKPOINT.md) · [prueba con personas](docs/playtest-v1.1.md)

## Probarlo sin instalar nada

`npm run build:demo` genera `dist/coartada-un-movil.html`: un único archivo con el juego en modo «un solo móvil» y una guía rápida ilustrada. Se abre directamente en el navegador (también sin internet). La versión con un móvil por persona necesita el servidor (abajo).

## Requisitos

Node.js 20 o superior (probado con 22). Nada más: no hay base de datos ni claves.

## Comandos

```bash
cd proyectos/coartada
npm install

npm run dev          # servidor :3000 + cliente Vite :5173 (visible en la red local)
npm run build        # cliente → dist/client, servidor → dist/server.mjs
npm run build:demo   # demo de un solo archivo → dist/coartada-un-movil.html
npm start            # producción: sirve juego + WebSocket en $PORT (3000 por defecto)

npm test             # motor, privacidad, contenido e integración multicliente (vitest)
npm run typecheck
npm run validate     # comprueba los 25 casos para 4–10 jugadores
npm run simulate     # simulación de equilibrio con bots (no son personas) → docs/balance-sim.txt
INDEPENDENT=1 npm run simulate   # variante: cada bot decide por su cuenta
npm run texts        # inventario de textos + comprobación de terminología → docs/TEXT_INVENTORY.md

# E2E con navegadores reales (necesita un servidor arrancado, p. ej. en :4100)
PORT=4100 npm start &
node e2e/match.mjs http://127.0.0.1:4100 6 qa-out   # 4–10 sesiones independientes (+ auditoría axe)
node e2e/local.mjs http://127.0.0.1:4100 qa-out     # modo un solo móvil
npm run e2e:crowd                                   # 10 personas, peor caso de tablero lleno, a 390/360/320 px
npm run e2e:restart                                 # reinicio del servidor a mitad de ronda (arranca su propio servidor desde dist/, puerto 4190)
DEMO=1 node e2e/local.mjs "file://$PWD/dist/coartada-un-movil.html" qa-out   # demo de un archivo + guía
# Si Playwright no encuentra Chromium: CHROMIUM_PATH=/ruta/a/chromium
```

`dist/server.mjs` es autocontenido: para producción basta con copiar la carpeta `dist/` y ejecutar `node dist/server.mjs`.

## Jugar esta noche con amigos (misma Wi-Fi)

1. En un portátil conectado a la Wi-Fi de casa: `npm install && npm run build && npm start`.
2. Averigua la IP local del portátil (p. ej. `192.168.1.40`; en macOS `ipconfig getifaddr en0`, en Linux `hostname -I`, en Windows `ipconfig`).
3. En tu móvil abre `http://192.168.1.40:3000`, pulsa **Crear sala** y escribe tu nombre.
4. Tus amigos escanean el **QR** de la sala con la cámara, o entran en la misma dirección y escriben el código de 4 letras. (Por `http://` en la red local, el botón «Compartir enlace» no hace nada: el navegador solo permite compartir en páginas seguras.)
   Crea la sala desde una dirección con la IP, nunca desde `localhost`: el QR usa la dirección de quien crea la sala. Guía completa para una prueba con móviles: `docs/playtest-v1.1.md`, apartado E.
5. Con 4 o más personas en la sala, pulsa **Empezar partida**.

Para jugar a distancia (videollamada) hace falta una URL pública: ver «Desplegar».

## Desplegar (URL pública)

El juego es un único servicio Node con WebSocket. Las salas viven en memoria, así que **usa una sola instancia** (sin escalado horizontal). No hacen falta secretos.

**Render.com.** Es un único *Web Service*: la misma URL sirve la web y el WebSocket, y el cliente se conecta al origen desde el que se abre, así que no hay URLs que configurar. Render da HTTPS y WebSocket automáticamente.
1. *New → Web Service*. Elige el repositorio y la rama que contenga esta versión; *Root Directory*: `proyectos/coartada`; *Runtime*: Node.
2. Build: `npm ci && npm run build` · Start: `npm start` · *Health Check Path*: `/healthz` · *Instance Type*: **Free** (o uno de pago si no se aceptan reinicios) · *Region*: la más cercana a los jugadores.
3. Variables: `NODE_VERSION=22` y `TRUST_PROXY=1`.
   - No definas `NODE_ENV`: con `production`, `npm ci` no instala Vite ni esbuild y la build falla. Render ya lo pone por su cuenta al ejecutar.
   - Tampoco definas `PORT` ni `HOST`: Render da `PORT` y el servidor escucha en `0.0.0.0`.
4. Desactiva *Auto-Deploy* mientras se juega: cada despliegue reinicia el servidor y borra las salas.

> El `render.yaml` incluido no indica `plan`. En un *Blueprint*, Render crea entonces una instancia **de pago**. Para usar el plan gratuito, crea el servicio a mano como arriba (o añade `plan: free` al blueprint antes de usarlo).
>
> En el plan gratuito:
> - el servicio se duerme tras 15 min sin tráfico, y el primer acceso tarda alrededor de 1 min;
> - Render puede reiniciarlo en cualquier momento;
> - un reinicio borra todas las salas: cada móvil vuelve a la portada con el aviso «Esa sala ya no existe…» y hay que crear otra sala (los puntos no se recuperan).

**Docker** (Fly.io, Railway, un VPS…):
```bash
docker build -t coartada .
docker run -p 3000:3000 -e TRUST_PROXY=1 coartada
```
Detrás de nginx, reenvía las cabeceras de WebSocket (`Upgrade`/`Connection`) para la ruta `/socket.io/`.

Variables (todas opcionales, ver `.env.example`): `PORT`, `HOST`, `TRUST_PROXY`, `MAX_ROOMS`, `CORS_ORIGINS`, `CLIENT_DIR`.

> Estado: el proyecto está listo para desplegar pero **no se ha desplegado** desde este entorno (no había credenciales de ningún proveedor ni demonio de Docker). Ver `docs/CHECKPOINT.md`.

## Problemas frecuentes

| Síntoma | Causa probable y solución |
|---|---|
| El móvil no abre `http://192.168.x.x:3000` | Móvil y portátil en redes distintas (datos móviles, Wi-Fi de invitados) o el cortafuegos bloquea el puerto 3000. Conecta todo a la misma Wi-Fi y permite Node en el cortafuegos. |
| «Reconectando…» o «Sin conexión. Reintentando…» que no se va | El servidor no responde (está caído o arrancando: en el plan gratuito de Render, el arranque en frío tarda alrededor de 1 min) o la conexión del móvil es mala. El móvil sigue reintentando solo. |
| «Esa sala ya no existe (se cerró o el servidor se reinició)…» | El servidor se reinició (despliegue, reinicio del plan gratuito, caída) y las salas, que viven en memoria, se perdieron. Cread una sala nueva; los puntos no se recuperan. |
| «No existe ninguna sala con ese código» | Código mal escrito o sala cerrada por inactividad (15 min sin nadie, 6 h sin actividad). |
| La cámara no reconoce el QR | Sube el brillo de la pantalla que lo muestra o usa «Compartir enlace». |
| No suena nada | El sonido está desactivado por defecto: botón del altavoz arriba. En iPhone, quita el modo silencio. |
| Funciona en casa pero no a distancia | Una IP local no es accesible desde fuera: despliega el juego (Render/Docker) para tener una URL pública. |
| Alguien cerró la pestaña a mitad de ronda | Que vuelva a abrir el mismo enlace en el mismo móvil y navegador: recupera su sitio y su expediente. |

## Añadir un caso

Crea `src/shared/content/scenarios/<id>.ts` siguiendo `content/types.ts`, regístralo en `content/scenarios.ts` y ejecuta `npm run validate`. El validador rechaza casos incoherentes antes de que lleguen a una partida.
