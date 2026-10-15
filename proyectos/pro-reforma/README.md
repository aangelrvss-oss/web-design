# Pro Reforma — nueva web (propuesta)

Rediseño de [proreforma.es](https://www.proreforma.es/) (reformas en Rivas-Vaciamadrid): sitio estático sin dependencias en producción, animaciones con [Scroll-craft](https://github.com/nateherkai/scroll-craft) (motor sin modificar), formulario de presupuesto con envío real en PHP y reseñas de Google con dos modos (API oficial o bloque editorial fechado).

**Nada se ha publicado en producción** ni se ha tocado el dominio, el DNS, la ficha de Google ni ninguna cuenta de la empresa.

## La idea (v2, tras la revisión crítica)

Qué hace, dónde y por qué fiarse, en el primer pantallazo: «Reformas, pintura e insonorización en Rivas-Vaciamadrid» sobre una foto real de obra, con «Solicitar presupuesto», «Llamar» y una franja de datos verificados. Después, **las reseñas de Google como momento central** (el 5,0 que crece, las frases que destaca Google y ocho reseñas literales), los servicios, los diferenciadores con su prueba, una obra real fase a fase, el proceso y el formulario corto. Todo lo que se afirma sale de la web actual, de la ficha de Google o de las reseñas.

Documentos de la v2: `docs/AUDITORIA-2.md` (qué fallaba), `docs/INFORME-REDISENO-2.md` (qué se ha cambiado y por qué, estado de reseñas y formulario, pendientes), `docs/VERIFICACION-2.md` (pruebas), `docs/RESENAS.md`, `docs/MEDICION.md`, `docs/capturas-v2/`. La v1 sigue en la etiqueta local `pro-reforma-v1-antes-revision` y en `docs/INFORME-REDISENO.md` y `docs/VERIFICACION.md`.

## Páginas (23)

| Ruta | Contenido |
|---|---|
| `/` | Portada: hero con franja de confianza, reseñas (acto fijado + muro), servicios, pausa, por qué nos llaman, obra fase a fase, proceso, dudas, formulario |
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
  api/resenas.php         /api/resenas: reseñas por la API oficial (Places API New), con tope diario; solo con credenciales
  .htaccess               301 a URL con barra, ruta /api/resenas, CSP, caché y compresión (Apache)
  assets/css/site.css, assets/js/{boot,site}.js     A mano
  assets/vendor/scrollcraft/                        Motor SIN MODIFICAR
  assets/fonts/           Fraunces e Instrument Sans autoalojadas (OFL)
  assets/img/             Fotos reales de obra: recortes (ancha, cuadrada), bandas 1798×410 y 2:1 (WebP)
netlify/functions/resenas.mjs   /api/resenas en Netlify (misma respuesta que el PHP)
src/                      Generador: data.mjs (todo el contenido), layout.mjs, pages.mjs, build.mjs
assets-src/               Capturas de la web actual, recortes y bandas panorámicas originales
tools/bandas.py           Bandas panorámicas y recortes 2:1 a partir de assets-src/bandas/
tools/demo/build-netlify.mjs   Copia para Netlify (demostración o Netlify Forms) + zip
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
node proyectos/pro-reforma/qa/backend.mjs
NODE_PATH=qa/node_modules SCROLLCRAFT_CHROME=<ruta a chrome> node tools/scroll-craft/scripts/shoot.mjs --url http://127.0.0.1:4701 --out qa/out/pr-shoot

# vista previa de un solo archivo
node proyectos/pro-reforma/tools/preview/bundle.mjs

# copia para Netlify (dist/netlify y entregables/*.zip); --forms = formulario real con Netlify Forms
node proyectos/pro-reforma/tools/demo/build-netlify.mjs [--forms] [--index] [--url https://x.netlify.app]
```

Para probar el envío sin un servidor de correo, arrancar PHP con `-d sendmail_path=<script que escriba stdin en un archivo>`.

Si se cambia CSS o JS, subir `ASSET_V` en `src/layout.mjs` y regenerar.

## Reseñas de Google

**Estado: estática verificada y fechada (15/10/2026).** La integración en vivo (`/api/resenas`, PHP o Netlify) está hecha y probada con una API simulada, pero no conectada: faltan `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID` y la autorización de facturación del propietario. Sin ellas, o si Google falla, la web muestra el bloque fechado. Todo en `docs/RESENAS.md`.

## Puesta en producción (pendiente de autorización)

La web actual está en Duda, que no ejecuta código propio: hace falta otro alojamiento. Recomendado: **cualquier alojamiento con PHP** (formulario y reseñas funcionan tal cual). Alternativa: **Netlify** con `build-netlify.mjs --forms --index`, desplegado con Git o con la CLI (arrastrando el zip no se publican las funciones), activando la detección de formularios y su notificación por correo.

1. Copia de seguridad de la web actual (Duda/BeeDIGITAL) y de sus URL.
2. Subir `site/` a la raíz pública de un alojamiento con PHP.
3. Configurar `PR_FORM_TO` / `PR_FORM_FROM` si no son `daniel@proreforma.es` / `web@proreforma.es`; SPF/DKIM del remitente; envío de prueba real.
4. Revisar CSP y HTTPS en el servidor real; comprobar los 301 de las URL antiguas sin barra.
5. Sustituir el wordmark provisional por el logotipo original.
6. Search Console: enviar `sitemap.xml`.

## Pendiente de la empresa

Ver la lista completa en `docs/INFORME-REDISENO.md` («Qué falta»): logotipo original, permiso para reproducir reseñas o credenciales de la API, fotos en resolución original, zona de trabajo, revisión jurídica de los textos legales.
