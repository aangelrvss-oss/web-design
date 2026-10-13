# Informe · Rediseño comercial de Living Clean (v2)

Encargo: «Master prompt — Living Clean · rediseño integral premium · CRO · SEO local». Estado previo recuperable: etiqueta local `living-clean-v1-antes-rediseno` (commit `9376316`). Detalle de la auditoría: `AUDITORIA-2.md`. Pruebas: `VERIFICACION.md`.

## Cambios realizados

- **Jerarquía comercial**: la portada se centra en comunidades (camino A) con caminos visibles para administradores de fincas (B) y empresas o servicios puntuales (C).
- **Hero**: «Tu comunidad, limpia y bien atendida», subtítulo con la visita previa, CTA «Solicitar visita y presupuesto» + «Llamar al 608 82 58 64», línea de confianza y los caminos B y C. Se mantiene la entrada del logotipo; el tramo fijado baja de 1,6 a 1,4 pantallas en escritorio y **desaparece en móvil**.
- **Nueva franja de confianza** con cuatro hechos publicados por la empresa.
- **Comunidades** como sección principal: zonas del edificio con frecuencias **orientativas** (ya no como condiciones universales), desmarcables, que llegan a la solicitud; acceso específico para administradores.
- **Nueva sección «Cómo se contrata»**: cuatro pasos (contacto, visita, propuesta, organización) con un hilo que se completa al pasar, y la información que conviene aportar.
- **Conserjería**: qué puede asumir, qué gana la comunidad (sin cifras de ahorro) y qué depende del alcance.
- **Otros servicios** agrupados con menos peso; **Equipo y medios** con maquinaria, formación y suplencias; **FAQ** nuevas sobre el proceso real.
- **Formulario** por tipo de cliente (comunidad, administrador, empresa, servicio puntual) con campos que aparecen según el tipo: portales, nº de comunidades y conversación comercial, tipo de instalación. Nombre y un teléfono o correo son lo único obligatorio.
- **Estética**: menos tarjetas redondeadas y sombras; filetes, columnas editoriales y fondos alternos; textos pequeños agrandados.
- **Móvil propio**: hero sin tramo fijado (texto y CTA primero, portal debajo), zonas como lista vertical compacta, conserjería en flujo sin ocultar funciones, cabecera compacta.
- **Vista previa** de un solo archivo con las 9 páginas secundarias dentro: todos los enlaces llevan a su destino.

## Problemas detectados y corregidos

| Problema | Corrección |
|---|---|
| 40 enlaces de la vista previa (legales, servicios, logotipo) llevaban a `#servicios` | Páginas incluidas como capas; el empaquetado falla si queda un enlace sin destino |
| Migas de pan de las páginas de servicio enlazaban a `/#servicios`, que ya no existe | Migas «Inicio / Servicio» y prueba automática de anclas |
| En móvil, el botón «Llamar» de las páginas de servicio salía vacío (regla del hero aplicada a toda la web) | Regla limitada al hero y prueba de «botones sin texto» |
| Frecuencias y «incluidos» presentados como universales | Marcados como orientativos/«habitualmente», fijados en la propuesta |
| En móvil, funciones del conserje ocultas con poca altura | Conserjería en flujo en móvil; nada se oculta |
| Hueco de la foto del hero con altura cero en móvil | Corregido el alineado del contenedor |
| Formulario de demo que solo avisaba al enviar | Aviso visible antes de rellenar (vista previa y Netlify) |
| «productos de primera calidad», «económica» (no verificados) | Eliminados |
| Texto legal desalineado respecto a su título | Corregido |

## Mejoras de conversión (hipótesis, sin datos posteriores al lanzamiento)

CTA de visita en vez de «presupuesto» genérico; camino propio para administradores; formulario corto y adaptado; zonas del edificio que llegan a la solicitud; proceso explicado; teléfono en cabecera, hero, menú, cierre y pie. Cómo medirlas: `MEDICION.md`.

## Mejoras SEO y técnicas

Un H1 por página; titles ≤ 70 y descriptions 50–160 caracteres; canónicas; JSON-LD `LocalBusiness`, `WebSite`, `Service`, `FAQPage`, `BreadcrumbList` sin datos inventados; sitemap y robots; imágenes con dimensiones y `alt`; sin terceros ni cookies; eventos de medición con los nombres pedidos (`click_cta`, `click_phone`, `click_email`, `form_start`, `form_submit`, `form_success`, `form_error`, `select_service`).

## Pruebas realizadas

Ver `VERIFICACION.md`: 256/256 comprobaciones funcionales, arnés de Scroll-craft en cuatro configuraciones, Lighthouse en tres páginas, vista previa navegada en escritorio y móvil.

## Datos que requieren validación de Living Clean

1. Vigencia de: personal dado de alta con seguro de accidentes, RC de hasta 150.000 €, uniforme y móvil de empresa.
2. Frecuencias habituales de comunidades y si el fregado semestral del garaje y el abrillantado anual siguen incluidos.
3. Zona de trabajo real (para portada y `areaServed`).
4. Si atienden a administradores con varias comunidades y cómo organizan las visitas.
5. Qué tareas del conserje quedan fuera de su alcance.
6. Testimonios o referencias que se puedan publicar, con permiso.
7. Permiso de uso de las fotos del equipo y originales en mejor resolución.
8. Datos registrales para el aviso legal y correo para derechos RGPD.
9. Perfil de Empresa de Google (no comprobado).

## Pendiente antes de publicar

1. Descargar las 7 imágenes generadas (permitir `d8j0ntlcm91z4.cloudfront.net` en la red del entorno) y repetir la revisión visual y Lighthouse.
2. Generar el zip de Netlify (el script se niega mientras falten imágenes).
3. Confirmar PHP `mail()` o SMTP en el alojamiento y hacer un envío real.
4. Revisión legal de aviso legal, privacidad y primera capa del formulario.
5. Probar en un iPhone y un Android reales.
6. Autorización para publicar.
