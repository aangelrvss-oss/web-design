# BRIEF · MRI V2

**Self-authored under explicit creative delegation.** El encargo («MRI V2 — rediseño cinematográfico premium con Scrollcraft») delega la dirección y fija el material: un vídeo cinematográfico como protagonista y referencias del repositorio «proyectos-web». Detalle de decisiones en `proyectos/mr-instalaciones-v2/docs/DIRECCION.md`. Hechos de empresa: los de la V1 (`proyectos/mr-instalaciones/docs/AUDITORIA.md`), sin añadir ninguno.

## Los ocho temas

1. **Vibe**: arquitectura contemporánea, tecnología doméstica, precisión, confort. Referencias: la ventana como encuadre (una casa vista desde dentro), una ficha técnica bien compuesta.
2. **Recorrido**: entiendo quién es y puedo llamar; veo la casa por dentro sistema a sistema; encuentro mi caso; compruebo las habilitaciones; veo que trabajan para mi tipo de edificio; resuelvo dudas; pido presupuesto.
3. **Energía**: calma informativa al entrar, la máxima en la secuencia, descenso ordenado hacia el formulario.
4. **Sentimiento y momento**: «bajé y la ventana se abrió y entré en la casa: primero el salón con el aire, luego la máquina, luego el aire y el agua». El pico es la apertura de la ventana y el recorrido.
5. **Lo que ninguna web de instaladores hace**: que el visitante recorra con su propia mano una casa instalada, y cada parada le lleve al servicio real.
6. **Distancia del premium-minimal**: editorial técnico. Papel cálido y grafito, naranja solo donde actúa.
7. **Mundo continuo o escenas**: un plano continuo (el vídeo), con capítulos marcados por un carril.
8. **Activos**: el vídeo del cliente (pendiente: se usa una animática provisional generada sin coste a partir del dibujo de la V1), logotipo y datos reales. Coste de generación: 0.

## Gramática: «Ventana a la casa» (nueva)

- **Sección**: la portada es una ventana; el resto son hojas de papel o grafito que se alternan.
- **Chrome**: barra que forma parte de la escena (papel sobre papel, clara con velo sobre la imagen), teléfono en mono y un único CTA; dentro de la secuencia, un carril de escenas que también navega.
- **Hero**: `scrub` con apertura de ventana (clip-path desde `--sc-p`), titular real sobre papel.
- **Cierre**: formulario sobre grafito con teléfono grande (heredado de la V1, comparte este eje).
- **Prohíbe**: texto sobre el centro del encuadre, scrims a pantalla completa, contadores, tarjetas repetidas, un segundo pico.

## Curva de sentimiento

| # | Emoción | Causa |
|---|---|---|
| 1 | Orientación | Titular, CTA y una ventana que ya deja ver la casa |
| 2 | Inmersión (pico) | La ventana se abre a sangre y el recorrido avanza bajo la mano |
| 3 | Reconocimiento | «¿Qué necesitas resolver?» en filas tipográficas |
| 4 | Seguridad | La placa de inscripciones aparece con un barrido |
| 5 | Amplitud | Sectores en horizontal sobre grafito |
| 6 | Alivio | Dudas en filas que se despliegan |
| 7 | Decisión | Formulario real |

**Frase**: «Es la web donde abres una ventana y recorres una casa instalada con tu propio scroll, y cada parada te lleva al servicio».

## Partitura

| Acto | Dispositivo | Span |
|---|---|---|
| 1 Ventana (hero + pico) | `scrub` + apertura por `--sc-p` + carril propio | 4,8 |
| 2 Necesidades | `flow` + `in` | natural |
| 3 Habilitaciones | `flow` + `reveal` | natural |
| 4 Sectores | `pan` | 3,2 |
| 5 Dudas | `flow` | natural |
| 6 Presupuesto | `flow` | natural |

Seis actos, ~12,6 alturas en escritorio (medido; V1: 14,0): fuera de la banda 6-7 actos / 13,6-13,8.

## Gate de huellas

Contra **mr-instalaciones (V1)**: gramática distinta, navegación distinta (barra que cambia con la escena + carril), hero distinto (scrub con ventana frente a parallax sin pin), secuencia distinta, firma distinta; comparte el cierre. 5/6.
Contra **living-clean**: 6/6 salvo cierre parecido (formulario en bloque de color): 5/6.
Contra **pro-reforma** y **pro-reforma v2**: gramática, hero (ningún scrub), secuencia, firma y navegación distintas: 5/6 cada una.
