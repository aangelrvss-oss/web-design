# Estrategia comercial · Living Clean Multiservicios

## Objetivo

Conseguir nuevas comunidades de vecinos y contratos recurrentes de limpieza y conserjería en Rivas-Vaciamadrid y las zonas que la empresa confirme que atiende. Los servicios puntuales siguen disponibles, con menos peso.

## Públicos y caminos de conversión

| Camino | Público | Dónde empieza | Qué recibe el formulario |
|---|---|---|---|
| **A · Comunidad** (principal) | Presidentes y juntas | CTA del hero «Solicitar visita y presupuesto», sección de comunidades, «Cómo se contrata» | Tipo «Comunidad», servicio «Limpieza de comunidad», nº de portales (opcional), zonas del edificio |
| **B · Administrador de fincas** | Gestores de varias comunidades | «¿Administras varias fincas? Hablemos» (hero) y «Cuéntanos cuántas» (comunidades) | Tipo «Administrador», nº de comunidades (opcional), casilla «Prefiero empezar con una conversación comercial» |
| **C · Empresa o puntual** | Oficinas, locales, viviendas, fin de obra, garajes, grafitis, moquetas | «¿Empresa o servicio puntual?» (hero), «Otros servicios», páginas de servicio | Tipo «Empresa» (tipo de instalación) o «Servicio puntual», servicio marcado |

El camino A tiene el titular, el CTA principal y la sección más grande. B y C están siempre a un clic sin competir con A.

## Hechos y posicionamiento

| Mensaje | Tipo | Fuente / validación |
|---|---|---|
| Personal propio, dado de alta, con seguro de accidentes | Hecho publicado | Web actual de la empresa · **validar vigencia** |
| Uniformado y con móvil de empresa | Hecho publicado | Web actual · validar |
| Responsabilidad civil de hasta 150.000 € | Hecho publicado | Web actual · **validar póliza vigente** |
| Visita al inmueble antes de presupuestar | Hecho publicado | Web actual |
| Conserjería, limpieza y mantenimiento en un solo puesto | Hecho publicado (servicio) | Web actual |
| Frecuencias habituales (portal diario, cristales mensual, garaje semestral, abrillantado anual) | **Orientativo** | Web actual; se presentan como «habitualmente» y «se fijan en la propuesta» |
| «Tu comunidad, limpia y bien atendida» | Posicionamiento | Titular, no es una promesa medible |
| «Un solo proveedor y un solo interlocutor» | Consecuencia del servicio de conserje multifunción | Sin cifras de ahorro |
| «Organizamos las visitas contigo» (administradores) | Propuesta comercial | **Validar** con la empresa |

No se usa: antigüedad, número de clientes o comunidades, reseñas, zonas de trabajo, precios, plazos de respuesta o de inicio, «sin compromiso», ahorro económico ni sistemas de inspección o informes.

## Arquitectura de la portada

1. **Hero**: qué hace (limpieza y conserjería), para quién (comunidades), por qué confiar (personal propio y asegurado, visita previa) y qué hacer (CTA + teléfono). Caminos B y C debajo.
2. **Confianza**: cuatro hechos verificables en una línea.
3. **Comunidades** (sección principal): zonas del edificio con qué se hace y frecuencia orientativa; el visitante desmarca lo que su edificio no tiene y eso llega a la solicitud.
4. **Cómo se contrata**: contacto → visita → propuesta → organización; y qué información conviene aportar.
5. **Conserjería multifunción**: qué puede asumir, qué gana la comunidad y qué depende del alcance.
6. **Otros servicios** (camino C), con menos peso visual.
7. **Equipo y medios**: fotos reales, maquinaria, formación y suplencias.
8. **Opiniones**: sección preparada en `data.mjs` (`TESTIMONIALS`); no se muestra mientras no haya testimonios reales y autorizados.
9. **Preguntas frecuentes**: las objeciones reales del proceso.
10. **Formulario** y contacto directo.
11. **Pie** con contacto, servicios y enlaces legales reales.

## SEO local

| URL | Intención |
|---|---|
| `/` | limpieza de comunidades Rivas-Vaciamadrid, empresa de limpieza para comunidades |
| `/limpieza-de-comunidades/` | limpieza de comunidades de vecinos, portales, garajes |
| `/conserje-multifuncion/` | servicio de conserjería para comunidades |
| `/limpieza-de-oficinas-y-locales/` | limpieza de oficinas y locales |
| `/limpieza-fin-de-obra/`, `/limpiezas-especializadas/`, `/limpieza-de-viviendas/` | secundarias: fin de obra, garajes, grafitis, moquetas, viviendas |

JSON-LD `LocalBusiness` sin dirección postal completa (la web actual solo muestra «Rivas-Vaciamadrid») y sin `areaServed` hasta que la empresa confirme la zona. `WebSite` en la portada, `Service`, `FAQPage` y `BreadcrumbList` en las páginas de servicio.

**Perfil de Empresa de Google**: no se ha podido comprobar desde este entorno. Recomendaciones: que el nombre, el teléfono (608 82 58 64) y la web coincidan con los de la web; categoría principal «Servicio de limpieza» y secundaria de conserjería si existe; zona de servicio en lugar de dirección si no atienden público; pedir reseñas a comunidades clientes y enlazarlas desde la web cuando haya permiso.

## Imágenes

- **Reales**: equipo, maquinaria y furgoneta, de la web actual. Resolución limitada: conviene pedir originales y confirmar el permiso de uso de las personas que aparecen.
- **Generadas con Higgsfield** (7, ya pagadas; ningún gasto nuevo): espacios vacíos de un edificio, sin personas ni rótulos. Siempre con «Imagen ilustrativa» y explicadas en el pie. Pendientes de descarga por la red del entorno.
