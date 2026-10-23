# BRIEF · MRI V2

**Self-authored under explicit creative delegation.** El encargo («MRI V2 — rediseño cinematográfico premium con Scrollcraft») delega la dirección y fija el material: un vídeo cinematográfico como protagonista y referencias del repositorio «proyectos-web». Detalle de decisiones en `proyectos/mr-instalaciones-v2/docs/DIRECCION.md`. Hechos de empresa: los de la V1 (`proyectos/mr-instalaciones/docs/AUDITORIA.md`), sin añadir ninguno.

## Los ocho temas

1. **Vibe**: arquitectura contemporánea, tecnología doméstica, precisión, confort. Referencias: la ventana como encuadre (una casa vista desde dentro), una ficha técnica bien compuesta.
2. **Recorrido**: entiendo quién es y puedo llamar; veo la casa por dentro sistema a sistema; encuentro mi caso; compruebo las habilitaciones; veo que trabajan para mi tipo de edificio; resuelvo dudas; pido presupuesto.
3. **Energía**: calma informativa al entrar, la máxima en la secuencia, descenso ordenado hacia el formulario.
4. **Sentimiento y momento**: «bajé y la ventana se abrió y entré en la casa: primero el salón con el aire, luego la sala de máquinas, y al final el techo se volvió transparente y se vieron los conductos». El pico es la apertura de la ventana y el recorrido; el momento recordado, la revelación del techo.
5. **Lo que ninguna web de instaladores hace**: que el visitante recorra con su propia mano una casa instalada, y cada parada le lleve al servicio real.
6. **Distancia del premium-minimal**: editorial técnico. Papel cálido y grafito, naranja solo donde actúa.
7. **Mundo continuo o escenas**: un plano continuo (el vídeo), con capítulos marcados por un carril.
8. **Activos**: el vídeo del cliente (10 s, 720p, plano continuo: salón con split → sala técnica con aerotermia y fontanería → revelación de los conductos de ventilación en el falso techo), logotipo y datos reales. Coste de generación por nuestra parte: 0.

## Gramática: «Ventana a la casa» (nueva)

- **Sección**: la portada es una ventana; el resto son hojas de papel o grafito que se alternan.
- **Chrome**: barra que forma parte de la escena (papel sobre papel, clara con velo sobre la imagen), teléfono en mono y un único CTA; dentro de la secuencia, un carril de escenas que también navega.
- **Hero**: `scrub` a sangre desde el primer pintado, titular serif superpuesto con contraste local (V2.1; la V2.0 abría una ventana enmarcada sobre papel con clip-path desde `--sc-p`).
- **Cierre**: formulario sobre grafito con teléfono grande (heredado de la V1, comparte este eje).
- **Prohíbe**: texto sobre el centro del encuadre, scrims a pantalla completa, contadores, tarjetas repetidas, un segundo pico.

## Curva de sentimiento

| # | Emoción | Causa |
|---|---|---|
| 1 | Orientación e inmersión | El salón a pantalla completa con el titular y los CTA encima |
| 2 | Recorrido (pico) | El hero se retira y la casa avanza bajo la mano, sistema a sistema |
| 3 | Reconocimiento | «¿Qué necesitas resolver?» en filas tipográficas |
| 4 | Seguridad | La placa de inscripciones aparece con un barrido |
| 5 | Amplitud | Sectores en horizontal sobre grafito |
| 6 | Alivio | Dudas en filas que se despliegan |
| 7 | Decisión | Formulario real |

**Frase**: «Es la web donde abres una ventana y recorres una casa instalada con tu propio scroll, y cada parada te lleva al servicio».

## Partitura

| Acto | Dispositivo | Span |
|---|---|---|
| 1 Casa (hero + pico) | `scrub` (`clip-map="travel"`) a sangre + hero que se retira por `--sc-p` + carril propio | 4,2 (V2.0: 4,8) |
| 2 Necesidades | `flow` + `in` | natural |
| 3 Plano técnico (V2.2, de la V1) | `pin`: capas SVG trazadas desde `--sc-p`, leyenda sincronizada | 4,8 |
| 4 Habilitaciones | `flow` + `reveal` | natural |
| 5 Sectores | `flow` + `in` (V2.1: `pan` 3,2) | natural |
| 6 Dudas | `flow` | natural |
| 7 Presupuesto | `flow` | natural |

Siete actos, ~15,1 alturas en escritorio (medido en la V2.2; V2.1: 12,0; V2.0: 12,6; V1: 14,0). Dos actos fijados: el vídeo (impacto) y el plano (explicación); el resto, flujo con entradas discretas: fuera de la banda 6-7 actos / 13,6-13,8.

## Gate de huellas

Contra **mr-instalaciones (V1)**: gramática distinta, navegación distinta (barra que cambia con la escena + carril), hero distinto (scrub con ventana frente a parallax sin pin), secuencia distinta, firma distinta; comparte el cierre. 5/6.
Contra **living-clean**: 6/6 salvo cierre parecido (formulario en bloque de color): 5/6.
Contra **pro-reforma** y **pro-reforma v2**: gramática, hero (ningún scrub), secuencia, firma y navegación distintas: 5/6 cada una.
