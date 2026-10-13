# BRIEF · MR Instalaciones

**Self-authored under explicit creative delegation.** El encargo ("Master prompt") pide actuar como equipo creativo completo y decidir dirección, estructura y movimiento. No hay entrevista: las respuestas siguientes son decisiones propias, separadas de los hechos verificados en `docs/AUDITORIA.md`. No se inventan citas del cliente.

## Hechos de partida (verificados)

- Martínez Rojas Instalaciones, S.L. (MRI). Sede: C/ Fundición 4 Bis, Nave 50, Rivas-Vaciamadrid. Tel. 911 66 24 76. L-V 9:00-18:30.
- Servicios reales: fontanería y saneamiento, calefacción y climatización, aerotermia, gas, ventilación, biomasa, domótica. Sectores: doméstico, comercial, industrial, nueva construcción.
- Habilitaciones con registro y CSV: instaladora y mantenedora RITE, gas categoría A, gases fluorados, REA.
- Activos de marca: logotipo MRI con naranja #FF6500. Sin fotografía propia utilizable en calidad suficiente. Sin reseñas verificables.

## Los ocho temas

1. **Vibe en palabras**: preciso, limpio, técnico y cercano. Referencias (no webs): una lámina de proyecto de instalaciones bien delineada; el despiece de un manual de caldera; el cajetín de un plano.
2. **Recorrido** (decisión propia): primero entiendo qué hacen y dónde (y puedo llamar), después encuentro mi caso, después veo cómo encajan todos los sistemas de una casa, después compruebo que están habilitados, resuelvo dudas, veo que trabajan también para empresas y pido presupuesto.
3. **Curva de energía**: calma clara al principio (información inmediata), un tramo tranquilo antes del pico, intensidad máxima en el montaje de sistemas, y descenso ordenado hacia el formulario.
4. **Sentimiento por tramo y momento recordado**: ver cómo una casa vacía se llena de instalaciones, sistema a sistema, hasta funcionar como un conjunto. Ese es el pico.
5. **Algo que ninguna web de instaladores hace**: dejar que el visitante vea su casa como la ve un instalador, y que lo que marque en ese dibujo llegue ya rellenado al presupuesto.
6. **Distancia del premium-minimal**: familia *editorial técnica*. Papel de plano frío, tinta grafito, naranja de marca como único acento. Ni oscuro de lujo ni crema artesano.
7. **Mundo continuo o escenas**: escenas. Un mismo dibujo técnico une la portada (estructura vacía) con el pico (instalación completa), pero cada acto se comporta distinto.
8. **Activos**: logotipo y datos reales. Sin fotos propias de calidad. Decisión: mundo **Technical drawing** (worlds.md §8), dibujado en SVG a mano, sin generación de imagen. Coste de generación: 0.

## Gramática

**Nueva gramática: "Lámina de instalaciones".** La página es un juego de planos de una vivienda.

- **Qué es una sección**: una lámina sobre papel de plano; cada una añade información al mismo edificio dibujado.
- **Chrome**: barra fija con logotipo, índice de servicios que salta, teléfono `tel:` y una sola acción: *Pedir presupuesto*. En el pico aparece una leyenda de capas que también es control.
- **Hero**: alzado-sección de la casa en planos superpuestos (cuadrícula, estructura, tuberías en primer plano, aire caliente/frío) con el titular legible desde el primer fotograma.
- **Cierre**: el formulario es el **cajetín** del plano del visitante (proyecto, localidad, sistema, contacto). La selección hecha en el pico llega marcada.
- **Prohíbe**: vídeo `scrub`, fotografía a sangre con texto encima, scrims, CTA magnético, `kinetic` por caracteres, degradado de `drift` continuo (los fondos cambian en seco: papel y grafito), contadores (no hay cifras verificadas que contar), tarjetas idénticas en rejilla.
- **Se apoya en**: `parallax` en el hero, `pin` con `--sc-p` para el dibujo, `reveal` para los documentos, `pan` para sectores, `flow + in` para lo administrativo.

Por qué no las otras siete: *filmic one-shot* exige vídeo continuo y prohíbe varias entradas (aquí el índice de servicios es imprescindible para SEO y conversión); *chaptered editorial* quita la barra fija y convierte el CTA en una línea de texto, malo para un negocio que vive del teléfono; *live surface* exige un producto software; *continuous world* exige vuelo de vídeo caro y frágil; *typographic poster* desperdicia el valor explicativo de un dibujo técnico; *gallery* obliga a empezar por el objeto sin propuesta de valor; *split stage* necesita una comparación de dos lados que este negocio no tiene; *rhythmic cutlist* es para marcas de energía, lo contrario de la calma que pide un instalador de gas.

## Movimiento firma

**La casa que se instala sola.** En una lámina fijada, el desplazamiento dibuja (con `stroke-dashoffset` derivado de `--sc-p`) cada sistema dentro de la misma sección de vivienda: agua fría y caliente, saneamiento, suelo radiante y radiadores, aerotermia, ventilación con recuperador, gas y domótica. Al final, todos se encienden juntos. La leyenda es un control: el visitante puede aislar sistemas, y los que deja marcados aparecen seleccionados en el formulario de presupuesto. Código propio en `site/assets/js/site.js`; el motor no se toca.

## Frase para contárselo a alguien

> Es la web donde ves cómo se van montando todas las instalaciones de una casa mientras bajas, y lo que marcas en el dibujo te aparece ya puesto en el presupuesto.

## Curva de sentimiento (antes de los actos)

| # | Emoción | Qué la provoca |
|---|---|---|
| 1 | Orientación | Titular claro, teléfono y botón visibles; la casa dibujada en planos que se separan con el cursor y el scroll |
| 2 | Reconocimiento | Una lista tipográfica de situaciones reales ("estoy reformando", "quiero aerotermia") donde el visitante se encuentra |
| 3 | Asombro tranquilo (pico) | La casa vacía se llena de sistemas, uno a uno, hasta encenderse entera |
| 4 | Seguridad | Los documentos oficiales aparecen con un barrido; números de registro que se pueden comprobar |
| 5 | Alivio | Las dudas típicas resueltas con respuestas cortas |
| 6 | Amplitud | Hogares, comercios, industria y obra nueva desfilando en horizontal |
| 7 | Decisión | El cajetín del plano listo para rellenar, con lo marcado ya puesto |

Ninguna pareja adyacente comparte emoción. El acto 2 es deliberadamente silencioso (solo tipografía sobre papel) para que el pico tenga algo de lo que destacar.

## El pico

> "Bajé y la casa se fue llenando de tuberías, conductos y cables, cada cosa en su sitio, y al final se encendió todo a la vez."

Vive en el acto 3. Recibe: el único activo trabajado a fondo (el dibujo de sección con siete capas), el silencio previo del acto 2 y el mayor recorrido de la página (span 5.2 frente a 3.4 del siguiente más largo).

## Partitura

| Acto | Beat | Dispositivo | Span | Por qué |
|---|---|---|---|---|
| 1 Hero | Orientación | `parallax` (+ puntero fino) en `flow` | natural | Profundidad por planos sin retrasar la lectura ni fijar la pantalla |
| 2 Situaciones | Reconocimiento | `flow + in` | natural | Leer y elegir; nada debe moverse más que la entrada |
| 3 La casa | Pico | `pin` + dibujo por `--sc-p` | 5.2 | Argumento que avanza mientras el marco se queda quieto |
| 4 Habilitaciones | Seguridad | `reveal` (barrido izquierda) | natural | Un barrido es un cambio de estado: de promesa a documento |
| 5 Dudas | Alivio | `flow + in` con `<details>` | natural | Administrativo: corto y comprimido |
| 6 Sectores | Amplitud | `pan` | 3.4 | Lo lateral se lee como gama de clientes, no como jerarquía |
| 7 Presupuesto | Decisión | `flow` (formulario real, sin pin) | natural | Un formulario no se fija; debe poder rellenarse en un móvil |

Familias: parallax, flow, pin, reveal, pan (cinco). Ningún dispositivo repetido en actos consecutivos. Ninguna `scrub`. Longitud aproximada: 13 alturas de pantalla en escritorio, fuera de la banda 13,6-13,8 con 6-7 actos solo por el número de actos (7) y el reparto; se medirá.

## Silencio autorizado

- Final del acto 3: la casa queda encendida y quieta durante el último 12 % del recorrido (resolución del pico, `data-sc-verify-hold`).

## Gate de huellas

`scrollcraft/FINGERPRINTS.md` está vacío: es la primera construcción de este espacio de trabajo. No hay filas contra las que comparar. Se añade la fila al terminar.

---

## Resultado de la construcción (13/10/2026)

### Partitura real

| Acto | Dispositivo | Span |
|---|---|---|
| 1 Hero | `flow` + `data-sc-parallax` en 4 planos (1.8, 1.2, 0.6, -2.4) + puntero fino | natural (100svh) |
| 2 Situaciones | `flow` + `data-sc-in` con escalonado de 45 ms | natural |
| 3 La casa | `pin` + 9 cues + capas dibujadas por `--sc-p` en CSS | 5.2 |
| 4 Habilitaciones | `flow` + `data-sc-reveal="left"` sobre la placa de inscripciones | natural |
| 5 Dudas | `flow` con `<details>` | natural |
| 6 Sectores | `pan` con asentamiento escalonado por `--sc-p` (desplazamiento, opacidad mínima 0,9) | 3.4 |
| 7 Presupuesto | `flow` + titular `kinetic` por líneas en cue de sujeción | natural |

Longitud medida por el arnés: 14,0 vh en escritorio (1440×900), 15,9 vh en 390×844, 18,4 vh en 360×640, 12,1 vh con movimiento reducido.

### Comprobación de sensaciones (pasada en frío sobre las hojas de contacto)

| Acto | Previsto | Sentido | Diferencia y cambio |
|---|---|---|---|
| 1 | Orientación | Orientación | El titular tapaba las cotas del dibujo: se ocultaron en el hero y se desplazó la casa. |
| 2 | Reconocimiento | Reconocimiento | Sin cambios. |
| 3 | Asombro tranquilo | Curiosidad que se convierte en satisfacción | Las fichas de cada sistema se veían a medio fundido en móvil: rampas acortadas del 22 % al 14 % de su ventana. El pico sigue siendo el mayor cambio visual y el tramo más largo. |
| 4 | Seguridad | Seguridad | Sin cambios. |
| 5 | Alivio | Neutro, administrativo | Aceptado: es información comprimida a propósito (feel.md §5). |
| 6 | Amplitud | Amplitud | Las fichas atenuadas al 55 % fallaban contraste: ahora se asientan por desplazamiento. |
| 7 | Decisión | Decisión | El hueco vacío del cajetín se eliminó; el titular desbordaba su columna y se redujo. |

El final se sostiene: el formulario es lo último con contenido antes del pie y no se desvanece.

### Gate de huellas

Primera fila del registro: nada contra lo que comparar. Fila añadida en `scrollcraft/FINGERPRINTS.md`.

### Activos

Ninguno generado. Coste de generación: 0. Dibujos SVG propios; logotipo y banda Kit Digital recortados de una captura de la web actual (pendiente de sustituir por los originales).

## Hero 2.0 (13/10/2026)

El acto 1 añade una entrada de 1,82 s en CSS (plano que se traza, tubería que conecta, llave que se abre, calor en el suelo radiante, cajetín con el logotipo) y profundidad por scroll a partir del `--sc-p` del propio acto `flow` (retícula 1→1,06, vivienda 1→0,9, tubería 1→1,1). Sin pin, sin vídeo, sin cambios en el motor. Detalle en `docs/HERO-2.md`.

Comprobación de sensaciones del acto 1 tras el cambio: antes «orientación», ahora «orientación + precisión que se pone en marcha». Era el objetivo: la emoción del pico (acto 3) sigue siendo mayor, porque la entrada solo enciende un sistema y el pico monta los siete.
