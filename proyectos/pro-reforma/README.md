# Pro Reforma — nueva web (propuesta)

Rediseño de [proreforma.es](https://www.proreforma.es/) (reformas en Rivas-Vaciamadrid): sitio estático sin dependencias en producción, animaciones con [Scroll-craft](https://github.com/nateherkai/scroll-craft) (motor sin modificar), formulario de presupuesto con envío real en PHP y reseñas de Google con dos modos (API oficial o bloque editorial fechado).

**Nada se ha publicado en producción** ni se ha tocado el dominio, el DNS, la ficha de Google ni ninguna cuenta de la empresa.

## La idea

«Reformas bien hechas, con la casa cuidada». La portada abre con fotos reales de obra y la valoración de Google; el centro de la página es **una habitación real insonorizada fase a fase** (preparación → placas → pintura → terminada) que se va descubriendo con el scroll. Todo lo que se afirma sale de la web actual, de la ficha de Google o de las reseñas: ver `docs/AUDITORIA.md`.

## Páginas (23)

| Ruta | Contenido |
|---|---|
| `/` | Portada: hero, reseñas, servicios, obra fase a fase, método, más proyectos, la empresa, dudas, formulario |
| `/servicios/` + `reformas-integrales/`, `pinturas/`, `insonorizacion/` | Servicios principales con problema, para quién, qué incluye, proceso, qué preparar, dudas y formulario con el tipo ya marcado |
| `/servicios/albanileria/`, `fontaneria/`, `electricidad/`, `carpinteria/`, `cerrajeria/` | Oficios (mismas URL que la web actual) |
| `/proyectos/` + 2 fichas | Solo trabajos con fotos reales; sin metros, plazos ni precios inventados |
| `/como-trabajamos/`, `/conocer-proreforma/`, `/contacto/` | Método, empresa, contacto con formulario |
| Legales | `/aviso-legal/`, `/politica-de-privacidad/`, `/politica-de-cookies/`, `/declaracion-de-accesibilidad/` (marcadas como texto preparado para revisión jurídica) |
| `/gracias/`, `/envio-no-completado/`, `404.html` | Resultados del envío sin JavaScript y página no encontrada |

## Estructura

```
site/                     Lo que se sube (raíz pública del dominio)
  contacto.php            Recepción del formulario (mail()); JSON para JS, 303 sin JS
  api/resenas.php         Reseñas de Google por la API oficial (Places API New), solo con credenciales
  .htaccess               301 a URL con barra, CSP, caché y compresión (Apache)
  assets/css/site.css, assets/js/{boot,site}.js     A mano
  assets/vendor/scrollcraft/                        Motor SIN MODIFICAR
  assets/fonts/           Fraunces e Instrument Sans autoalojadas (OFL)
  assets/img/             8 fotos reales de obra (WebP, a su tamaño)
src/                      Generador: data.mjs (todo el contenido), layout.mjs, pages.mjs, build.mjs
assets-src/               Capturas de la web actual y recortes originales
tools/og/render.mjs       Imagen Open Graph e icono
tools/preview/bundle.mjs  Vista previa en un único HTML (preview/pro-reforma-preview.html)
qa/functional.mjs         Suite funcional (Playwright, 519 comprobaciones)
qa/animation.mjs          Scroll inverso, recarga a mitad de acto, salto arriba (normal y reducido)
docs/                     AUDITORIA, RESENAS, INFORME-REDISENO, MEDICION, VERIFICACION
```

## Cómo ejecutarla

```bash
# una vez, desde la raíz del repositorio
cd qa && npm install && cd ..

# generar
node proyectos/pro-reforma/src/build.mjs

# servir (desde la raíz). 4700 con la CSP real; 4701 sin CSP para el arnés de Scroll-craft
SITE_ROOT=proyectos/pro-reforma/site php -S 127.0.0.1:4700 tools/dev/router.php
SITE_ROOT=proyectos/pro-reforma/site MRI_NO_CSP=1 php -S 127.0.0.1:4701 tools/dev/router.php

# pruebas
node proyectos/pro-reforma/qa/functional.mjs http://127.0.0.1:4700 qa/out/pro-reforma
node proyectos/pro-reforma/qa/animation.mjs http://127.0.0.1:4700/
NODE_PATH=qa/node_modules SCROLLCRAFT_CHROME=<ruta a chrome> node tools/scroll-craft/scripts/shoot.mjs --url http://127.0.0.1:4701 --out qa/out/pr-shoot

# vista previa de un solo archivo
node proyectos/pro-reforma/tools/preview/bundle.mjs
```

Para probar el envío sin un servidor de correo, arrancar PHP con `-d sendmail_path=<script que escriba stdin en un archivo>`.

Si se cambia CSS o JS, subir `ASSET_V` en `src/layout.mjs` y regenerar.

## Reseñas de Google

- **Sin credenciales** (estado actual): se muestra un bloque editorial con 5 fragmentos literales, valoración 5,0 y 41 reseñas **con la fecha de consulta** (15/10/2026) y enlace a la ficha. Hay que actualizarlo a mano (`REVIEWS` en `src/data.mjs`) o activar la API.
- **Con credenciales**: definir en el servidor `GOOGLE_PLACES_API_KEY` y `GOOGLE_PLACE_ID`. `api/resenas.php` consulta Google en cada visita (sin guardar copias, como exigen sus condiciones) y la página sustituye valoración, número y reseñas, con autor, enlace y «Fuente: Google Maps». La clave nunca llega al navegador ni está en Git.
- Coste y pasos: `docs/RESENAS.md`. **No se ha activado nada de pago.**

## Puesta en producción (pendiente de autorización)

1. Copia de seguridad de la web actual (Duda/BeeDIGITAL) y de sus URL.
2. Subir `site/` a la raíz pública de un alojamiento con PHP.
3. Configurar `PR_FORM_TO` / `PR_FORM_FROM` si no son `daniel@proreforma.es` / `web@proreforma.es`; SPF/DKIM del remitente; envío de prueba real.
4. Revisar CSP y HTTPS en el servidor real; comprobar los 301 de las URL antiguas sin barra.
5. Sustituir el wordmark provisional por el logotipo original.
6. Search Console: enviar `sitemap.xml`.

## Pendiente de la empresa

Ver la lista completa en `docs/INFORME-REDISENO.md` («Qué falta»): logotipo original, permiso para reproducir reseñas o credenciales de la API, fotos en resolución original, zona de trabajo, revisión jurídica de los textos legales.
