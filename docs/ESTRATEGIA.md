# Estrategia de conversión y arquitectura

## Objetivo

1. Principal: solicitudes de presupuesto por formulario.
2. Secundario: contacto inmediato por teléfono (y correo).

La llamada a la acción es una sola en toda la web: **"Pedir presupuesto"**. El teléfono aparece como enlace `tel:` en la cabecera (icono en móvil), en el hero, en el cierre y en el menú móvil. El formulario envía con **"Enviar solicitud"**.

No se ha añadido WhatsApp: el único móvil localizado aparece en documentos oficiales y no consta autorización para publicarlo.

## Públicos y necesidades (a partir de los servicios reales)

| Situación del visitante | Dónde la encuentra | Página |
|---|---|---|
| Reforma de baño, cocina o vivienda | Acto 2 de la portada | Fontanería y saneamiento |
| Cambiar la calefacción o poner aire acondicionado | Acto 2 | Calefacción y climatización |
| Estudiando la aerotermia | Acto 2 | Aerotermia |
| Instalar, cambiar o adecuar el gas | Acto 2 | Gas |
| Humedad o aire viciado | Acto 2 | Ventilación |
| Control de la climatización y la casa | Acto 2 | Domótica |
| Local, nave, promotora o constructora | Acto 2 y acto 6 | Empresas y obra nueva |

Las averías urgentes no se anuncian: la web actual no las ofrece y no se ha podido confirmar ese servicio.

## Propuesta de valor

> **Instaladores de fontanería y climatización.** Empresa instaladora habilitada, con sede en Rivas-Vaciamadrid, para hogares, comercios, industria y obra nueva.

En la primera pantalla: qué hacen (titular), dónde (Rivas-Vaciamadrid), para quién (hogares, comercios, industria y obra nueva) y qué hacer (botón y teléfono, con horario).

"Habilitada" está respaldado por las inscripciones RITE y de gas con código de verificación. No se usan antigüedad, cifras, reseñas ni plazos.

## Confianza sin inventar

- Inscripciones oficiales con número y código seguro de verificación (madrid.org/csv).
- Explicación de por qué importan (instalaciones reguladas).
- Contenido técnico útil por servicio ("Lo que conviene saber").
- Datos de empresa completos en el pie y en el aviso legal.
- Sin testimonios, estrellas, logos de clientes ni contadores.

## Formulario

Campos: servicios (casillas, opcional), nombre, localidad (opcional), teléfono **o** correo (al menos uno), tipo de inmueble (opcional) y descripción (opcional). Sin casillas de marketing. Información básica de protección de datos (primera capa) bajo el botón, con enlace a la política. Base jurídica: medidas precontractuales (art. 6.1.b RGPD), por eso no se pide marcar una casilla de aceptación. **Esta decisión debe validarla el asesor legal de la empresa.**

Envío real por `contacto.php` (PHP `mail()`), validación también en servidor, señuelo antispam, mensaje de error con alternativas (teléfono y correo precargado) y funcionamiento sin JavaScript.

## Arquitectura de URLs

| URL | Estado |
|---|---|
| `/` | Se mantiene |
| `/certificaciones/` | Se mantiene |
| `/aviso-legal/`, `/politica-de-privacidad/`, `/politica-de-cookies/` | Se mantienen (las variantes sin barra redirigen 301) |
| `/servicios/fontaneria-saneamiento/`, `/servicios/calefaccion-climatizacion/`, `/servicios/aerotermia/`, `/servicios/instalaciones-de-gas/`, `/servicios/ventilacion/`, `/servicios/domotica/` | Nuevas |
| `/empresas-y-obra-nueva/` | Nueva |
| `/trabaja-con-nosotros/` | Nueva (antes era el ancla `#trabajaconnosotros`, que ahora redirige por JavaScript) |
| `#servicios`, `#contacto` | Se conservan como anclas en la portada |
| `#domestico`, `#comercial`, `#industrial`, `#nuevaconstruccion` | Se conservan como ids en el carril de sectores |
| `/wp-content/uploads/2020/11/*.pdf` | Enlazados desde Certificaciones: **hay que conservar esos archivos en el servidor** |

Biomasa no tiene página propia: su contenido es breve y se integra en Calefacción y climatización para no crear una página vacía. No se han creado páginas por municipio.
