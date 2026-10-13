# Estrategia · Living Clean Multiservicios

## Públicos y qué necesitan

| Público | Qué busca | Qué le damos |
|---|---|---|
| Presidente, junta o administrador de fincas de una **comunidad** (principal) | Que el portal, la escalera y el garaje estén limpios sin tener que vigilarlo; saber qué incluye el servicio y cada cuánto; a quién llamar | «La ronda por tu edificio» (qué se hace en cada sitio y con qué frecuencia), lo incluido (garaje semestral, abrillantado anual), personal localizable, visita previa |
| Comunidad que valora un **conserje** | Unificar conserjería, limpieza y mantenimiento | Acto propio del conserje multifunción y página dedicada |
| **Empresa, oficina, local o edificio público** | Limpieza planificada según su horario; fin de obra | Pestaña «Empresa u oficina», páginas de oficinas y fin de obra |
| **Particular** | Limpieza habitual o puntual con alguien de confianza | Pestaña «Vivienda», personal asegurado, limpiezas a fondo y por cambio de inquilino |

## Propuesta de valor (solo lo comprobable)

Personal propio, uniformado y asegurado (RC de hasta 150.000 €), con móvil de empresa; procesos estandarizados para las suplencias; presupuesto **después de visitar** el inmueble; en comunidades, fregado del garaje cada seis meses y abrillantado anual del portal incluidos. Todo sale de la web actual de la empresa (ver `AUDITORIA.md`).

No se usa: antigüedad, número de clientes, reseñas, zonas de trabajo, precios, plazos, «sin compromiso» ni ninguna cifra que la empresa no publique.

## Recorrido y conversión

1. **Hero**: titular con los tres públicos, teléfono `tel:` y «Pedir presupuesto» visibles desde el primer fotograma (en móvil, fijos en la parte baja del primer pantallazo).
2. **¿Para quién es?**: tres pestañas; cada una lleva a sus servicios y a un CTA que deja el formulario precargado (tipo y servicio).
3. **La ronda** (pico): seis paradas con frecuencia real; el visitante quita lo que su edificio no tiene y el plan viaja al formulario y al correo que recibe la empresa («Plan ronda: …»).
4. **Conserje multifunción**: tres oficios que se funden en un puesto; enlace a su página y CTA.
5. **Equipo**: fotos reales y el «parte» de garantías verificables.
6. **Servicios**, **Dudas** y **Hoja de visita** (formulario corto: nombre + teléfono o correo obligatorios; lo demás opcional).

Canal principal: **teléfono** (es un móvil y el negocio se mueve por llamada). Está en cabecera, hero, menú, cierre y pie, y en todas las respuestas del formulario.

## Arquitectura de URLs

| URL | Intención de búsqueda |
|---|---|
| `/` | limpieza de comunidades Rivas-Vaciamadrid, empresa de limpieza |
| `/limpieza-de-comunidades/` | limpieza de comunidades de vecinos, portales, garajes |
| `/conserje-multifuncion/` | conserje para comunidad, conserjería y mantenimiento |
| `/limpieza-de-oficinas-y-locales/` | limpieza de oficinas, locales, colegios |
| `/limpieza-de-viviendas/` | limpieza de pisos y casas, limpieza a fondo |
| `/limpieza-fin-de-obra/` | limpieza fin de obra, primera ocupación |
| `/limpiezas-especializadas/` | quitar grafitis, limpieza de moquetas, fregado de garajes |
| `/aviso-legal.html`, `/politica-privacidad.html`, `/politica-cookies.html` | Se conservan las URLs actuales |

La web actual es una sola página, así que no hay URLs de servicio que redirigir.

## Imágenes

- **Reales** (de la web actual de la empresa): equipo trabajando, maquinaria y furgoneta rotulada. Se muestran como «Foto de Living Clean». Resolución limitada: conviene pedir los originales.
- **Generadas con Higgsfield** (7 imágenes, ~13 créditos): espacios vacíos de un edificio (portal, escalera, garaje, jardín, pasillo, fachada), sin personas, sin rótulos ni logotipos. Cada una lleva «Imagen ilustrativa» y el pie de página lo explica. No se presentan como trabajos de la empresa.
