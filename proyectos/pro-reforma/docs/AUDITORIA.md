# Auditoría · Pro Reforma (proreforma.es)

Fecha: 15 de octubre de 2026. El acceso directo a `proreforma.es` y a su CDN de imágenes (`*.cdn-website.com`) está bloqueado por la red de este entorno: la web se ha examinado con **Firecrawl** (HTML, textos, enlaces, metadatos, capturas a 1920 y 3840 px) y el dossier PDF enlazado desde «Conocer ProReforma».

## Repositorio

- Repositorio `web-design`, rama `ccr-55da8280-pmyc9n`. No existía código de Pro Reforma: se crea `proyectos/pro-reforma/` con el mismo sistema que el resto de webs del repositorio (generador estático en Node sin dependencias, CSS y JS propios, motor de Scroll-craft sin modificar, PHP para el formulario). No hay Astro ni React que conservar, y el alojamiento previsto es PHP: no se justifica introducirlos.
- No hay staging: la vista previa es local (`php -S`) y un HTML autónomo navegable.

## Web actual

- **Plataforma**: Duda (producida por BeeDIGITAL). Service worker, widgets de terceros (Common Ninja para reseñas, botón de Twitter).
- **Páginas**: inicio, `/servicios` y seis servicios (`/servicios/albanileria`, `carpinteria`, `fontaneria`, `cerrajeria`, `electricidad`, `pinturas`), `/proyectos`, `/contacto`, `/conocer-proreforma` (solo un enlace al dossier PDF), `/aviso-legal`, `/politica-de-privacidad`, `/politica-de-cookies`, `/declaracion-de-accesibilidad`.

### Datos verificados

| Dato | Valor | Fuente |
|---|---|---|
| Nombre comercial | Pro Reforma / ProReforma | Web, ficha de Google |
| Titular | Costel Daniel Iftimi · NIF X6701697A | Aviso legal de la web |
| Dirección | Calle España, 63, 28521 Rivas-Vaciamadrid (Madrid) | Web, ficha de Google, directorios |
| Teléfono y WhatsApp | 691 312 106 (`+34 691 31 21 06`) | Web, ficha de Google |
| Correo | daniel@proreforma.es | Web |
| Redes | Instagram `daniel_proreforma`, Facebook, X `proreforma_es` | Web |
| Google | **5,0 · 41 reseñas** (consulta del 15/10/2026) · categoría «Reformas» · web proreforma.es | Google Maps |
| Zona | «Rivas-Vaciamadrid y Comunidad de Madrid» | Publicaciones de Instagram de la empresa (validar) |

### Problemas detectados

1. **Conversión**: el botón principal «Pide presupuesto» solo abre WhatsApp; el formulario está en otra página y exige marcar una casilla de privacidad; no hay un recorrido de presupuesto.
2. **Mensaje genérico**: «Transformamos tu hogar con calidad y profesionalidad». Ninguna diferencia concreta en la portada.
3. **Imagen de portada de stock** (iStock) y una ilustración genérica de construcción; las fotos reales están escondidas en un carrusel de `/proyectos`.
4. **Reseñas**: un widget gratuito de Common Ninja que muestra **29 reseñas** cuando la ficha tiene **41** (desactualizado), con su marca «Free Google Reviews Widget».
5. **Cifras contradictorias**: la web dice «más de 20 años»; el dossier dice «más de 20 años», «+10 años», «+500 proyectos» y «100 % de satisfacción garantizada». No se usa ninguna sin confirmar.
6. **Servicios**: textos genéricos («llevar el arte de la albañilería al nivel de la excelencia») salvo **Pintura**, que describe un proceso real y concreto (protección, mobiliario, preparación de soportes, imprimación, enlucido, dos manos con máquina, marcas Montó/Valentine, maquinaria Festool/Wagner/Graco). **Insonorización** solo aparece en Proyectos y en reseñas, sin página propia. **Reformas integrales** es el posicionamiento principal y no tiene página.
7. **«Conocer ProReforma»** no tiene contenido propio, solo un PDF.
8. **SEO**: H1 «PRO REFORMA» repetido en cada página; títulos «Albañilería en Madrid» sin localidad; enlace roto en Contacto (`facebook.com/https://www.facebook.com/proreforma.es`); `tel:691 312 106` con espacios; el aviso legal está en `noindex`.
9. **Rendimiento**: plataforma Duda con scripts de widgets y un vídeo de YouTube incrustado.

### Material real disponible

- 8 fotos de obra en `/proyectos` (capturas recortadas, 826×406 y 392×406): cuatro de **la misma habitación** en distintas fases de una insonorización (pared preparada, placas, pintura con pistola, estancia terminada) y cuatro de techos (elevador de placas, trabajo en escalera, pasillo con placas, salón con foseado LED).
- Logotipo: casa sobre «PRO» y «REFORMA» subrayado; versión horizontal con «PRO» en rojo y «REFORMA» en azul marino. **El archivo original no es accesible** (CDN bloqueado).
- Colores de marca: rojo `#DD0000` y azul marino `#09283F`.

## Reseñas de Google

Ver `RESENAS.md`.

## Decisiones

- **Concepto**: «Reformas bien hechas, con la casa cuidada». Lo sostienen hechos verificables: el proceso de protección y limpieza que la propia empresa describe en Pintura, y lo que repiten las reseñas (acabados, limpieza, trato y explicaciones).
- **Arquitectura**: tres servicios principales (reformas integrales, pintura, insonorización), cinco de oficio con páginas breves, proyectos con fichas reales, método, sobre la empresa, contacto con formulario real. Se conservan las URL actuales (con 301 a la versión con barra final).
- **Fotografía**: solo fotos reales de obra, a su tamaño (sin ampliarlas). Higgsfield no se usa: la red de este entorno bloquea la descarga de sus resultados y no hay huecos que justifiquen imágenes conceptuales.
- **Logotipo**: wordmark tipográfico provisional que reproduce la versión horizontal (rojo + azul marino); se sustituirá por el archivo original.
