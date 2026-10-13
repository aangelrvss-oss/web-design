# Verificación

Fecha: 13 de octubre de 2026. Todas las pruebas se ejecutaron sobre los archivos finales de `site/`, servidos con `php -S` y `tools/dev/router.php` (mismas cabeceras CSP que `.htaccess`), con el Chromium 1194 de Playwright en modo headless.

## Qué se ha comprobado y con qué

### Arnés oficial de Scroll-craft (`tools/scroll-craft/scripts/shoot.mjs`)

El arnés inyecta estilos para medir, y la CSP de la web lo bloquea, así que se ejecutó contra una segunda instancia sin CSP (`MRI_NO_CSP=1`, puerto 4501). La CSP se probó por separado en la suite funcional.

| Pasada | Muestras/acto | Scroll muerto | Cues sin opacidad plena | Contraste sobre el render |
|---|---|---|---|---|
| Escritorio 1440×900 | 24 | Ninguno | Ninguna | Todas ≥ 4,5:1 |
| Móvil 390×844 | 12 | Ninguno | Ninguna | Todas ≥ 4,5:1 |
| Móvil compacto 360×640 | 12 | Ninguno | Ninguna | Todas ≥ 4,5:1 |
| Movimiento reducido 1440×900 | 24 | Ninguno | Ninguna | Todas ≥ 4,5:1 |
| Movimiento reducido 390×844 | 24 | Ninguno | Ninguna | Todas ≥ 4,5:1 |

Resultados que se corrigieron y su repetición:

- Primera pasada móvil (12 muestras): "Agua fría y caliente" y "Ventilación" no alcanzaban opacidad plena en ninguna muestra. Causa: rampas del 22 % en ventanas cortas. Se acortaron al 14 % y la repetición salió limpia.
- Con 6 muestras por acto, "Saneamiento" sigue apareciendo en el informe porque las 6 posiciones caen en sus rampas. Con 24 muestras alcanza opacidad plena. Es un efecto del muestreo, no de la página.
- Longitud: 14,0 vh (escritorio), 15,9 vh (390), 18,4 vh (360×640), 12,1 vh (reducido).
- El carril horizontal de sectores tiene desbordamiento real (no queda "pan" muerto): se comprobó visualmente que avanza en escritorio y móvil.

### Suite funcional (`qa/functional.mjs`): 278/278

- Las 16 páginas, a 1440 y 375 px: respuesta 200, consola y red sin errores ni avisos **con la CSP activa**, sin desbordamiento horizontal.
- SEO por página: un solo H1, encabezados sin saltos, title y description en longitud, canonical absoluto, JSON-LD válido, `lang="es"`, imágenes con `alt` y cargadas, enlaces `tel:+34911662476`.
- Objetivos táctiles de al menos 24 px en móvil (enlaces dentro de párrafos excluidos, como permite WCAG 2.5.8).
- Enlaces internos: todos responden. Los cinco PDF de `/wp-content/uploads/2020/11/` no están en el paquete (ver README).
- Leyenda del pico: aísla capas, marca los servicios en el formulario y los desmarca.
- Formulario con JavaScript: validación con mensajes y foco en el primer error, teléfono corto rechazado, **envío real** a `contacto.php` y confirmación; el correo generado por PHP `mail()` se capturó en un `sendmail` local (cabeceras, asunto con servicios, `Reply-To`, página de origen).
- Error de servidor simulado (502): mensaje de error y alternativas (teléfono y correo con los datos), sin falso éxito.
- Página de servicio: el formulario llega con su servicio marcado.
- Sin JavaScript: el formulario usa POST, todo el contenido animado es visible, un envío válido redirige a `/gracias/` y uno inválido a `/envio-no-completado/`.
- Teclado: recorrido completo (69 paradas) sin ningún foco invisible o fuera de pantalla. Se añadieron dos manejadores propios para conseguirlo: listas con entrada animada y carril horizontal.
- Menú de servicios (apertura, Escape) y menú móvil (apertura y navegación).
- Medición: se emiten `form_start` y `form_submit_success`.

### Lighthouse 12 (perfil móvil simulado, servidor local sin compresión ni caché)

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 96 | 100 | 100 | 100 | 2,7 s | 0 | 0 ms |
| `/servicios/aerotermia/` | 97 | 100 | 100 | 100 | 2,5 s | 0 | 10 ms |

Peso total: 306 KB en portada y 291 KB en la página de aerotermia, sin compresión. Las mejoras pendientes que señala Lighthouse (compresión de texto y caché larga) las resuelve `.htaccess` en Apache; `php -S` no las aplica. No se han medido Core Web Vitals de campo: requieren tráfico real.

### Revisión visual

Hojas de contacto y capturas a tamaño completo de cada acto en escritorio, 390×844, 360×640 y movimiento reducido. Hallazgos corregidos tras la primera revisión:

1. Las cotas del dibujo quedaban bajo el titular del hero: ocultas en el hero y casa desplazada.
2. La leyenda del pico ocupaba dos filas: botones más compactos.
3. El titular "Pide tu presupuesto" desbordaba su columna: tamaño propio.
4. El `legend` del fieldset se dibujaba sobre el borde del cajetín y quedaba una celda vacía: corregido.
5. Contraste insuficiente en las fichas de sectores mientras se asentaban (opacidad 0,55): asentamiento por desplazamiento.
6. Tras un envío correcto seguían visibles los campos: corregido (`display` anulaba `hidden`).
7. Doble punto tras "S.L." en textos legales.

Capturas de referencia en `docs/capturas/`.

## Lo que no se ha podido verificar

- **Un teléfono real.** El navegador sin interfaz no reproduce el desplazamiento táctil ni el comportamiento de Safari en iOS. La página no usa vídeo, que es lo más frágil en iOS, pero conviene una prueba manual en iPhone y Android.
- **Envío de correo en el alojamiento real.** `mail()` funciona en local con un `sendmail` simulado. En producción depende de que el servidor tenga correo configurado (y SPF/DKIM para `web@mrinstalaciones.com`).
- **`.htaccess` en Apache.** Las reglas no se han ejecutado en un Apache real; el router de desarrollo replica la CSP y el 404.
- **La web original**: sin Core Web Vitals, cabeceras ni consola (acceso bloqueado por la red de este entorno; ver `docs/AUDITORIA.md`).
- **Navegadores distintos de Chromium** (Firefox, Safari).

## Hero 2.0 (13/10/2026)

Verificación específica de la nueva entrada y de la transición de scroll en `docs/HERO-2.md` (sección «Resultado y verificación»). Tras el cambio se repitieron el arnés de Scroll-craft (5 pasadas limpias), la suite funcional (278/278) y Lighthouse (móvil 95/100/100/100, escritorio 100).
