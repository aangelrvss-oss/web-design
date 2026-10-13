# Living Clean Multiservicios — nueva web (propuesta)

Rediseño de [livingclean.es](https://livingclean.es/): sitio estático, sin dependencias en producción, con una experiencia de scroll construida con [Scroll-craft](https://github.com/nateherkai/scroll-craft) y una «hoja de visita» con envío real.

**Nada se ha publicado en producción.**

## La idea

**La ronda por tu edificio.** El visitante recorre un edificio parada a parada (portal, escaleras, garaje, jardín, mantenimiento, fachada), ve qué se hace y cada cuánto, quita lo que su comunidad no tiene y el plan resultante llega con la solicitud de presupuesto. La portada abre con el logotipo real «pintado» por un trazo en zigzag (el gesto del garabato amarillo de la marca); al hacer scroll vuela a su sitio en la cabecera y en su hueco se abre la foto del portal.

## Estructura

```
site/                  Lo que se sube (raíz pública del dominio)
  index.html           Portada (8 actos)
  <servicio>/          6 páginas de servicio
  aviso-legal.html, politica-privacidad.html, politica-cookies.html   (mismas URLs que la web actual)
  contacto.php         Recepción del formulario (PHP mail()); incluye el plan de la ronda
  .htaccess            Caché, compresión y cabeceras de seguridad (Apache)
  assets/css/site.css, assets/js/{boot,site}.js     A mano
  assets/vendor/scrollcraft/   Motor de Scroll-craft SIN MODIFICAR
  assets/fonts/        Outfit e Instrument Sans, autoalojadas
  assets/img/          Fotos reales (real-*) y generadas (hero-portal*, ronda-*)
src/                   Generador: data.mjs (contenido), layout.mjs, pages.mjs, build.mjs
assets-src/            Logotipo original, manifiesto de Higgsfield y originales generados
tools/images.py        WebP a varios anchos, versión «empañada» del hero, iconos
tools/fetch-higgsfield.sh   Descarga las imágenes generadas y regenera todo
tools/og/render.mjs    Imagen Open Graph
tools/demo/build-netlify.mjs   Copia de demostración para Netlify + zip
qa/functional.mjs      Suite funcional (Playwright)
docs/                  Auditoría, estrategia, medición y verificación
```

## Comandos

```bash
# desde proyectos/living-clean
node src/build.mjs                       # regenera los HTML
sh tools/fetch-higgsfield.sh             # descarga imágenes generadas + images.py + build
node tools/demo/build-netlify.mjs        # dist/netlify/ y entregables/living-clean-propuesta-netlify.zip

# desde la raíz del repositorio
SITE_ROOT=proyectos/living-clean/site php -S 127.0.0.1:4600 tools/dev/router.php
SITE_ROOT=proyectos/living-clean/site MRI_NO_CSP=1 php -S 127.0.0.1:4601 tools/dev/router.php   # para el arnés
node proyectos/living-clean/qa/functional.mjs http://127.0.0.1:4600 qa/out/living
```

Si se cambia CSS o JS, subir `ASSET_V` en `src/layout.mjs` y regenerar.

## Puesta en producción (pendiente de autorización)

1. Copia de seguridad de la web actual.
2. Subir `site/` a la raíz pública.
3. Comprobar PHP `mail()` o adaptar `contacto.php` a SMTP; SPF/DKIM para `web@livingclean.es` (variables `LC_FORM_TO` y `LC_FORM_FROM`). Envío de prueba real.
4. Revisar CSP y HTTPS en el servidor real.
5. Search Console: enviar `sitemap.xml`.

## Pendiente de la empresa

| Tema | Por qué |
|---|---|
| Fotos originales del equipo | Las actuales se han recortado de una captura (resolución baja). |
| Datos registrales (tomo, folio, hoja) | El aviso legal actual tiene el marcador «[INCLUIR DATOS REGISTRALES]». La nueva página dice «inscrita en el Registro Mercantil de Madrid» sin inventar datos. |
| Correo para derechos RGPD | La política actual remite a una cuenta de Gmail; la nueva usa `info@livingclean.es`. Confirmar. |
| Zona de trabajo | No publicada. Si se define, añadirla a la portada y al JSON-LD (`areaServed`). |
| Opiniones de clientes, antigüedad, nº de comunidades | No se muestran: no hay datos verificables. |
| WhatsApp | No se añade sin un número confirmado para ello. |
| Revisión legal | Aviso legal y privacidad reescritos con los datos reales; debe validarlos su asesor. |

## Decisiones

- **Higgsfield** (autorizado por el usuario): 7 fotografías de espacios vacíos, ~13 créditos. Ilustrativas y señaladas como tales; nunca se presentan como trabajos de la empresa.
- **Scroll-craft**: motor sin tocar (commit `75d81f7`). Gramática nueva «La ronda»; ver `scrollcraft/builds/living-clean/BRIEF.md`.
- **Sin cookies ni terceros**: ver `docs/MEDICION.md`.
