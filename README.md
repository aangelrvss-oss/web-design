# Webs de propuesta

Repositorio de propuestas de rediseño web para negocios locales. Cada web vive en su propia carpeta y se puede construir, probar y empaquetar por separado.

| Proyecto | Carpeta | Estado |
|---|---|---|
| MRI · Martínez Rojas Instalaciones | `proyectos/mr-instalaciones/` | Terminada · zip de demostración para Netlify |
| MRI V2 · rediseño cinematográfico | `proyectos/mr-instalaciones-v2/` | V2.2: vídeo del cliente a pantalla completa (versión vertical para móvil) + plano técnico de la V1 recuperado · verificada · la V1 queda intacta |
| Living Clean Multiservicios | `proyectos/living-clean/` | Construida y verificada · faltan por descargar las 7 imágenes generadas (red bloqueada) |
| Pro Reforma | `proyectos/pro-reforma/` | Construida y verificada · vista previa en un archivo · reseñas por API pendientes de credenciales |

## Estructura

```
proyectos/<nombre>/     Una web: site/ (lo que se publica), src/ (generador), docs/, qa/, tools/
tools/scroll-craft/     Skill de Scroll-craft (MIT), compartida; el motor nunca se edita
tools/dev/router.php    Servidor local con CSP para cualquier proyecto (variable SITE_ROOT)
qa/                     Playwright, Lighthouse y scripts de captura compartidos
scrollcraft/            Espacio de trabajo de Scroll-craft: BRIEF.md por web y registro de huellas
```

## Comandos

```bash
node proyectos/<nombre>/src/build.mjs
SITE_ROOT=proyectos/<nombre>/site php -S 127.0.0.1:4500 tools/dev/router.php
cd qa && npm install          # una vez: playwright-core y lighthouse
```

Cada proyecto tiene su propio README con el detalle.
