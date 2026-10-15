# Coartada

Juego de deducción social para jugar con amigos, cada uno con su móvil. Anoche pasó algo absurdo y uno de vosotros fue: declaráis en secreto dónde estuvisteis a tres horas, las coartadas se destapan a la vez en un tablero común, testificáis («estuve con Marta a las 23:00») y el tablero dice si cuadra. Luego salen dos pruebas que nunca mienten y votáis en secreto.

- 4–10 personas (mejor 5–8), rondas de 6–9 minutos, 25 casos.
- Sin cuentas, sin anuncios, sin IA durante la partida y sin datos personales.
- Modo principal: un móvil por persona (sala con código, enlace o QR). Alternativa: un solo móvil que se va pasando.

Documentación: [diseño](docs/GAME_DESIGN.md) · [reglas](docs/RULES.md) · [arquitectura](docs/ARCHITECTURE.md) · [investigación](docs/RESEARCH.md) · [estado](docs/CHECKPOINT.md)

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
npm run simulate     # simulación de equilibrio con bots (no son personas)

# E2E con navegadores reales (necesita un servidor arrancado, p. ej. en :4100)
PORT=4100 npm start &
node e2e/match.mjs http://127.0.0.1:4100 5 qa-out   # 5 sesiones independientes
node e2e/local.mjs http://127.0.0.1:4100 qa-out     # modo un solo móvil
```

`dist/server.mjs` es autocontenido: para producción basta con copiar la carpeta `dist/` y ejecutar `node dist/server.mjs`.

## Jugar esta noche con amigos (misma Wi-Fi)

1. En un portátil conectado a la Wi-Fi de casa: `npm install && npm run build && npm start`.
2. Averigua la IP local del portátil (p. ej. `192.168.1.40`; en macOS `ipconfig getifaddr en0`, en Linux `hostname -I`, en Windows `ipconfig`).
3. En tu móvil abre `http://192.168.1.40:3000`, pulsa **Crear sala** y escribe tu nombre.
4. Tus amigos escanean el **QR** de la sala con la cámara (o abren el enlace que compartes, o entran en la misma dirección y escriben el código de 4 letras).
5. Con 4 o más personas en la sala, pulsa **Empezar ronda**.

Para jugar a distancia (videollamada) hace falta una URL pública: ver «Desplegar».

## Desplegar (URL pública)

El juego es un único servicio Node con WebSocket. Las salas viven en memoria, así que **usa una sola instancia** (sin escalado horizontal). No hacen falta secretos.

**Render.com** (hay `render.yaml` en esta carpeta):
1. Sube el repositorio a GitHub y en Render elige *New → Blueprint* apuntando al repo (o *New → Web Service* con *Root directory* `proyectos/coartada`).
2. Build: `npm ci && npm run build` · Start: `node dist/server.mjs` · Health check: `/healthz`.
3. Variable `TRUST_PROXY=1`. Render da HTTPS y WebSocket automáticamente.

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
| «Reconectando…» que no se va | El servidor se ha reiniciado (las salas se pierden) o la conexión es mala. Si persiste, vuelve al inicio y crea otra sala. |
| «No existe ninguna sala con ese código» | Código mal escrito o sala cerrada por inactividad (15 min sin nadie, 6 h sin actividad). |
| La cámara no reconoce el QR | Sube el brillo de la pantalla que lo muestra o usa «Compartir enlace». |
| No suena nada | El sonido está desactivado por defecto: botón del altavoz arriba. En iPhone, quita el modo silencio. |
| Funciona en casa pero no a distancia | Una IP local no es accesible desde fuera: despliega el juego (Render/Docker) para tener una URL pública. |
| Alguien cerró la pestaña a mitad de ronda | Que vuelva a abrir el mismo enlace en el mismo móvil y navegador: recupera su sitio y su expediente. |

## Añadir un caso

Crea `src/shared/content/scenarios/<id>.ts` siguiendo `content/types.ts`, regístralo en `content/scenarios.ts` y ejecuta `npm run validate`. El validador rechaza casos incoherentes antes de que lleguen a una partida.
