# Reseñas de Google · fuentes, estado y mantenimiento

## Estado actual: **estática verificada y fechada** (no en vivo)

La web muestra datos copiados y fechados el **15 de octubre de 2026**. La integración en vivo está preparada y probada con una API simulada, pero **no está conectada**: faltan la clave de Google, el identificador del lugar y la autorización de facturación del propietario. No se ha activado nada de pago.

## Ficha verificada

| Campo | Valor (consulta 15/10/2026) |
|---|---|
| Nombre | Pro Reforma |
| Dirección | C. España, 63, 28521 Rivas-Vaciamadrid, Madrid |
| Teléfono | 691 31 21 06 |
| Web | proreforma.es |
| Categoría | Reformas |
| Horario | Lunes a viernes 9:00–19:00; sábado y domingo cerrado |
| Valoración | 5,0 |
| Nº de reseñas | 41 |
| Aviso de Google | «Google no verifica las reseñas, pero comprueba si hay contenido falso y lo retira» |
| Enlace | https://www.google.com/maps?cid=1539571755307103610 (CID `0x155da85abd4df57a`) |

Identidad confirmada por nombre, dirección, teléfono y dominio.

## Qué se muestra y de dónde sale

Todo es **literal**: ortografía original incluida («para quede», «contare»). Cuando la fuente muestra el texto recortado, se reproduce hasta donde se lee y se marca con «[…]» y un enlace «Seguir leyendo en Google». No se ha combinado, resumido ni reescrito ninguna reseña.

| Autor (como aparece) | Texto | Antigüedad según Google | Fuente consultada |
|---|---|---|---|
| Jorge García | Completo | hace 8 meses | Widget de reseñas de Google en proreforma.es |
| Alberto López | Completo | hace 8 meses | Widget en proreforma.es |
| Alicia P. | Completo (dos párrafos) | hace 8 meses | Widget en proreforma.es |
| Ana Maria Coarda | Recortado por el widget | hace 8 meses | Widget en proreforma.es |
| Biviana | Recortado por el widget | hace 8 meses | Widget en proreforma.es |
| Adrian | Recortado por Google («Más») | hace 6 meses | Ficha de Google Maps |
| Nicki1309 S | Recortado por Google | hace 6 meses | Ficha de Google Maps |
| sweetie001 sweetie001 | Recortado por Google | hace 6 meses | Ficha de Google Maps |

Además:
- **Frases destacadas por Google** en el resumen de la ficha (sin autor visible): «Rápidos, buenos y muy limpios trabajando, muy profesionales.», «Muy buenos acabados y al terminar te dejan la casa impecable.», «Además, han sido puntuales, educados y han explicado todo lo que iban haciendo.»
- **Temas que Google detecta** y cuántas reseñas los mencionan: confianza (10), equipo (8), materiales (5), perfeccionista (3).

**No se muestra** la puntuación de cada reseña en modo estático: no se ha podido leer. Con una media de 5,0 redondeada, no se puede afirmar que todas sean de 5 estrellas (41 reseñas con una de 4 darían 4,98 → «5,0»). En modo en vivo sí se muestra, porque la da Google.

Comprobación automática (`qa/functional.mjs`): cada texto de la web se compara con `src/data.mjs`; las recortadas tienen que llevar «[…]» y el enlace; ninguna página puede decir «verificadas».

## Opciones evaluadas

| Opción | Fiabilidad | Coste | Mantenimiento | Decisión |
|---|---|---|---|---|
| API oficial de Places (New) desde el servidor | Alta: datos actuales, atribución completa | 1.000 consultas gratis al mes; después 25 $ por 1.000 (SKU *Place Details Enterprise + Atmosphere*) | Ninguno una vez configurada | **Preparada**: activar cuando el propietario dé clave, `place_id` y facturación |
| Datos estáticos verificados y fechados | Media: se quedan antiguos | 0 | Revisar cada pocos meses | **Activa** como modo por defecto y como respaldo si la API falla |
| Widget de terceros (Common Ninja, Elfsight…) | Media; carga scripts y cookies de terceros | Gratis con marca o de pago | Bajo | Descartada: la web actual lo usa y muestra 29 de 41 reseñas, con la marca del widget |
| Solo enlace a la ficha | Alta pero sin prueba social en la página | 0 | 0 | Siempre presente como enlace |

### Cómo funciona el modo en vivo

1. El navegador pide `/api/resenas` (mismo dominio; la clave nunca llega al navegador).
2. En un alojamiento con PHP, `.htaccess` lo reescribe a `site/api/resenas.php`. En Netlify, `netlify.toml` lo envía a `netlify/functions/resenas.mjs`. Ambos dan la misma respuesta.
3. Si hay datos, la web sustituye valoración, número y reseñas por las de Google (máximo 5, elegidas por Google), con puntuación, autor enlazado, foto, antigüedad, enlace a cada reseña y «Fuente: Google Maps». La frase «consulta del 15/10/2026» desaparece.
4. Si no hay configuración, si Google falla o si se alcanza el tope diario, responde `{"available": false}` y la web **mantiene el bloque fechado**: nunca queda vacío.
5. Seis meses después de la fecha de consulta, la web añade automáticamente «· puede haber cambiado» junto a la fecha.

### Límites de coste

- PHP: tope diario `GOOGLE_PLACES_DAILY_CAP` (por defecto 30 ≈ 900 al mes, dentro de las 1.000 gratuitas). Se guarda solo un contador por día, no el contenido.
- Netlify: sin tope propio. Limitar la cuota en Google Cloud (*Places API (New) → Cuotas*) a 30 al día.
- En cualquier caso, la consulta solo se hace cuando el visitante se acerca a la sección de reseñas.

### Condiciones de Google que se respetan

Atribución de cada autor (nombre, foto y enlace), enlace a la reseña y a la ficha, «Fuente: Google Maps», sin caché del contenido (solo `place_id`), sin modificar ni filtrar reseñas (se muestran las que Google devuelve).

## Activar la integración en vivo

1. Google Cloud: crear un proyecto, activar **Places API (New)** y la facturación (requiere autorización del propietario).
2. Crear una clave restringida a *Places API (New)* y, si el alojamiento lo permite, a la IP del servidor.
3. Obtener el `place_id` (formato `ChIJ…`) con el *Place ID Finder* de Google buscando «Pro Reforma, C. España 63, Rivas-Vaciamadrid».
4. Definir en el servidor (nunca en Git): `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` y, opcionalmente, `GOOGLE_PLACES_DAILY_CAP`.
5. Comprobar: `curl https://www.proreforma.es/api/resenas` debe devolver `"available": true`. Solo entonces puede decirse que la integración está en vivo.

## Permiso para el modo estático

Reproducir textos de reseñas en la propia web depende de las condiciones de Google y de los autores. Los textos están tomados de la ficha pública y del widget que **la propia empresa publica en su web**. Antes de publicar, Pro Reforma debe confirmar que quiere mostrarlos así o activar la API.

## Actualizar el modo estático

Editar `src/data.mjs` → `REVIEWS` (`rating`, `count`, `checked`, `checkedLabel`, `checkedShort`, `highlights`, `topics`, `items`) y ejecutar `node src/build.mjs`. Copiar los textos tal cual, con su antigüedad del día de la consulta, y cambiar la fecha. La suite funcional falla si algún texto de la web no coincide con estos datos.
