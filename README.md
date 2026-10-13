# MRI · Martínez Rojas Instalaciones — nueva web

Rediseño completo de [mrinstalaciones.com](https://www.mrinstalaciones.com/): sitio estático, rápido y sin dependencias en producción, con una experiencia de scroll construida con [Scroll-craft](https://github.com/nateherkai/scroll-craft) y un formulario de presupuesto con envío real.

**Nada se ha publicado en producción.** La web actual (WordPress) sigue intacta.

## Qué hay en el repositorio

```
site/                  Sitio listo para subir (raíz pública del dominio)
  index.html           Portada (generada)
  servicios/…          6 páginas de servicio (generadas)
  empresas-y-obra-nueva/, certificaciones/, trabaja-con-nosotros/, legales, gracias/, 404.html
  contacto.php         Recepción del formulario (PHP mail())
  .htaccess            Redirecciones, caché, compresión y cabeceras de seguridad (Apache)
  assets/css/site.css  Estilos propios (a mano)
  assets/js/           boot.js y site.js (a mano)
  assets/vendor/scrollcraft/   Motor de Scroll-craft SIN MODIFICAR
  assets/fonts/        Archivo (recortada a los pesos usados), Geist y Geist Mono, autoalojadas
  assets/brand/        Logotipo, iconos y banda Kit Digital
src/                   Generador: contenido (data.mjs), dibujo SVG (house.mjs), plantillas y build
tools/scroll-craft/    La skill completa de Scroll-craft (MIT) tal como está en el repositorio oficial
tools/dev/router.php   Router para probar en local con las mismas cabeceras que producción
tools/og/render.mjs    Genera la imagen Open Graph a partir del dibujo
scrollcraft/           Espacio de trabajo de Scroll-craft: BRIEF.md y registro de huellas
qa/                    Pruebas con Playwright (snap.mjs, functional.mjs, intro.mjs para la entrada del hero)
docs/                  Auditoría, estrategia, medición, verificación y capturas
```

## Comandos

```bash
node src/build.mjs                                   # regenera las páginas HTML en site/
php -S 127.0.0.1:4500 tools/dev/router.php           # servidor local con CSP
# formulario en local sin enviar correos de verdad:
php -d sendmail_path="tee -a /tmp/outbox.eml" -S 127.0.0.1:4500 tools/dev/router.php

cd qa && npm install                                 # playwright-core y lighthouse (solo para pruebas)
node qa/functional.mjs http://127.0.0.1:4500 /tmp/qa # suite funcional
# arnés de Scroll-craft (necesita una instancia sin CSP, porque inyecta estilos):
MRI_NO_CSP=1 php -S 127.0.0.1:4501 tools/dev/router.php
SCROLLCRAFT_CHROME=/ruta/a/chrome node tools/scroll-craft/scripts/shoot.mjs --url http://127.0.0.1:4501 --out lab/desk
node tools/scroll-craft/scripts/doctor.mjs           # diagnóstico de Scroll-craft
```

El contenido se edita en `src/data.mjs` (servicios, preguntas, certificaciones) y `src/pages.mjs`. Después, `node src/build.mjs`. Las páginas de `site/` están versionadas, así que el sitio se puede subir sin ejecutar nada.

Si se cambia CSS o JS, subir `ASSET_V` en `src/layout.mjs` y regenerar (la caché es de un año). Si se cambia una fuente o una imagen, darle un nombre nuevo.

## Puesta en producción (pendiente de autorización)

1. **Copia de seguridad** completa de la web actual (archivos y base de datos de WordPress).
2. Subir el contenido de `site/` a la raíz pública, sustituyendo WordPress. **Conservar `wp-content/uploads/2020/11/`**: ahí están los cinco PDF de certificaciones que enlaza `/certificaciones/` (no se han podido descargar desde este entorno).
3. Comprobar que el alojamiento tiene PHP con `mail()` operativo. Si no, adaptar `contacto.php` a SMTP o a la solución de correo del proveedor. Configurar SPF/DKIM para `web@mrinstalaciones.com` (o cambiar el remitente en `contacto.php`). Destinatario: `info@mrinstalaciones.com` (variables `MRI_FORM_TO` y `MRI_FORM_FROM`).
4. Hacer un envío de prueba real desde el formulario y confirmar que llega.
5. Revisar en el navegador la CSP de `.htaccess` (no se ha probado en Apache real) y que HTTPS redirige correctamente.
6. En Google Search Console: enviar `sitemap.xml` e inspeccionar la portada y una página de servicio.
7. Revisar en Google Business Profile que nombre, dirección, teléfono y horario coinciden con la web.

## Pendiente de la empresa

| Tema | Por qué |
|---|---|
| **Logotipo original** en alta resolución (SVG o PNG grande) | El actual se ha recortado de una captura de pantalla. Sustituir `site/assets/brand/logo-mri*.webp/png` y regenerar iconos y la imagen OG. |
| **Banda Kit Digital original** | También recortada de una captura. Mantenerla es una obligación de los beneficiarios del programa. |
| Vigencia del **REA** (2019; se renueva cada 3 años), del certificado de **gases fluorados** (emitido bajo el RD 795/2010, hoy RD 115/2017) y del **ISO 9001** | La web solo muestra lo comprobable. El ISO 9001 no se muestra porque no hay certificado ni fecha publicados. |
| Antigüedad ("más de 15 años") | No verificable (la sociedad opera desde 2014). No se usa. |
| Fotografías reales de trabajos | La web usa dibujos técnicos propios, señalados como esquemas ilustrativos. Fotos propias de obras reforzarían la confianza. |
| Opiniones de clientes | No se ha publicado ninguna. Si se quieren mostrar, que sean verificables (por ejemplo, enlazando a Google). |
| Zona de trabajo | No se ha indicado cobertura. Si la empresa la define, añadirla a la portada y al JSON-LD (`areaServed`). |
| WhatsApp | No se ha añadido: no consta un número autorizado. |
| Revisión legal | La política de privacidad y la primera capa del formulario se han reescrito para el tratamiento real (sin casilla de consentimiento, base 6.1.b). Debe validarlas su asesor. |

## Decisiones técnicas

- **Sitio estático + PHP para el formulario**: el proyecto local estaba vacío y la web actual corre sobre PHP, así que un HTML estático con un único script PHP es compatible con el alojamiento actual y elimina WordPress, Elementor y sus scripts.
- **Sin dependencias en producción** ni recursos de terceros: fuentes autoalojadas, ninguna cookie, ninguna analítica. Ver `docs/MEDICION.md`.
- **Scroll-craft**: el motor se usa sin tocar (hash idéntico al del repositorio oficial, commit `75d81f7`). Todo lo propio va en `site.js` y `site.css`. No se instaló como plugin: la skill está completa en `tools/scroll-craft/`.
- **Higgsfield no se ha usado**: el encargo prohíbe gastar en generación sin autorización explícita, y el mundo elegido (dibujo técnico en SVG) no necesita imágenes generadas. Coste de generación: 0.

## Documentación

- `docs/AUDITORIA.md` — auditoría de la web actual y datos verificados
- `docs/ESTRATEGIA.md` — públicos, propuesta de valor, formulario y URLs
- `scrollcraft/builds/mr-instalaciones/BRIEF.md` — brief, gramática, curva, pico, partitura y comprobación de sensaciones
- `docs/MEDICION.md` — eventos y plan de medición
- `docs/VERIFICACION.md` — qué se ha probado, resultados y límites
- `docs/HERO-2.md` — secuencia de entrada y transición del hero, con su verificación
