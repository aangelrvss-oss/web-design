# Reseñas de Google · fuentes y mantenimiento

## Ficha verificada

| Campo | Valor (consulta 15/10/2026) |
|---|---|
| Nombre | Pro Reforma |
| Dirección | C. España, 63, 28521 Rivas-Vaciamadrid, Madrid |
| Teléfono | +34 691 31 21 06 |
| Web | proreforma.es |
| Categoría | Reformas |
| Valoración | 5,0 |
| Nº de reseñas | 41 |
| Enlace | https://www.google.com/maps?cid=1539571755307103610 (CID `0x155da85abd4df57a`) |

Identidad confirmada por nombre, dirección, teléfono y dominio.

## Reseñas seleccionadas (modo editorial)

Fuente: reseñas de Google que la propia web de Pro Reforma muestra con el widget de Common Ninja (fotos de perfil alojadas en `lh3.googleusercontent.com`), consultadas el 15/10/2026. Los textos de la ficha no se cargan sin ejecutar Google Maps, por lo que **no se han cotejado uno a uno en la ficha**: hacerlo antes de publicar.

Se reproducen **fragmentos literales**, sin reescribir, con el nombre público tal como aparece. Sin fechas: el widget solo da fechas relativas («hace 8 meses») sin referencia absoluta.

| Autor | Fragmento usado | Tema |
|---|---|---|
| Jorge García | «Me han insonorizado el techo del dormitorio. Un trabajo excelente. Muy buenos acabados y al terminar te dejan la casa impecable.» | Acabados, limpieza |
| Ana Maria Coarda | «Han protegido toda la cocina con plásticos, han trabajado limpio y con mucho cuidado, y al terminar lo han dejado todo recogido.» | Protección y limpieza |
| Biviana | «Lo que más destacaríamos es su meticulosidad: Los acabados son espectaculares» | Acabados |
| Alberto López | «Le pedimos que arreglara las ventanas de la buhardilla por las humedades y pintara, y lo ha hecho muy bien. Es muy profesional y perfeccionista.» | Profesionalidad |
| Alicia P. | «Un profesional como la copa de un pino, un trato excepcional y sabe perfectamente la forma de trabajar para quede lo mejor posible.» | Trato |

Todas las reseñas de la ficha suman una media de 5,0: no hay reseñas negativas que se estén ocultando con la selección.

## ¿Se pueden reproducir?

- Con la **API de Places (New)** sí, con condiciones: atribuir a cada autor (foto, nombre y enlace a su perfil), dar acceso a la reseña en Google Maps (`googleMapsUri`), **no guardar en caché** el contenido (solo el `place_id`) y mostrar la atribución de Google. Devuelve **como máximo 5 reseñas**, elegidas por Google.
- En modo editorial (texto fijo en la web), la reproducción depende de las condiciones de Google y de los autores. **Antes de publicar**, la empresa debe confirmarlo (Google ofrece a los propietarios su «kit de marketing» para compartir reseñas) o activar la API. Mientras tanto, la web muestra la valoración y el número **con su fecha de consulta** y enlaza siempre a la ficha.

## Activar la sincronización automática (modo API)

1. En Google Cloud: crear un proyecto, activar **Places API (New)** y la facturación. Coste: el SKU *Place Details Enterprise + Atmosphere* (necesario para `reviews`) tiene **1.000 consultas gratis al mes** y después **25 $ por cada 1.000** (precios publicados por Google, octubre de 2026). **No se ha activado: requiere autorización del propietario.**
2. Crear una clave de API restringida a *Places API (New)* y, si el hosting lo permite, por IP del servidor.
3. Obtener el `place_id` (formato `ChIJ…`) con el *Place ID Finder* de Google buscando «Pro Reforma, C. España 63, Rivas-Vaciamadrid».
4. En el servidor, definir las variables de entorno `GOOGLE_PLACES_API_KEY` y `GOOGLE_PLACE_ID` (nunca en el código ni en Git).
5. `site/api/resenas.php` consulta la API en cada visita a la sección (sin caché, por las condiciones de Google) y la web sustituye el bloque editorial por los datos en vivo con su atribución.

## Actualizar el modo editorial

Editar `src/data.mjs` → `REVIEWS` (`rating`, `count`, `checked`, `quotes`) y ejecutar `node src/build.mjs`. Revisar la valoración y el número en la ficha y cambiar la fecha de consulta.
