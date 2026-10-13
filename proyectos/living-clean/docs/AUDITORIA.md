# Auditoría de livingclean.es

Fecha: 13 de octubre de 2026.

## Método y límites

- El acceso directo a `livingclean.es` está bloqueado por la red de este entorno. La web se examinó con **Firecrawl**: HTML completo, textos de portada, aviso legal y privacidad, y capturas reales a página completa en escritorio (1440 px) y móvil (360 px).
- No se han medido Core Web Vitals ni cabeceras del servidor.
- Las fotografías reales de la empresa se han recortado de la captura de escritorio (resolución limitada). El logotipo original lo ha facilitado el usuario (2148 × 1232 px).
- No se han encontrado reseñas verificables publicables.

## Datos verificados

| Dato | Valor | Fuente |
|---|---|---|
| Razón social | Living Clean S.L. | Aviso legal |
| Marca | Living Clean Multiservicios | Web, logotipo |
| NIF | B87994307 | Aviso legal; registros mercantiles públicos |
| Domicilio social | C/ del Sol nº 1, bajo A, 28540 Perales de Tajuña (Madrid) | Aviso legal |
| Localidad que muestra la web | Rivas-Vaciamadrid | Pie de la web; directorios locales |
| Teléfono | 608 82 58 64 | Web; rotulación de la furgoneta |
| Correo | info@livingclean.es | Web |
| Constitución | Enero de 2018 | BORME (vía DatosCif / Librebor) |
| Actividad registral | Servicios integrales a edificios e instalaciones | Empresite |
| Seguro | Póliza de responsabilidad civil de hasta 150.000 € | Web («Quiénes somos») |
| Redes | Instagram @_living_clean, Facebook «Trucos de limpieza Living Clean», Twitter @livingclean1 | Web |

No se ha usado: la dirección de la calle Electrodo que aparece en un directorio (no confirmada por la empresa), ni ninguna zona de trabajo concreta.

## Servicios reales (texto de la web)

- **Limpieza de comunidades**: portal a diario (fregado, puerta, ascensor), espejos y cristales revisados a diario y a fondo cada mes; fregado del garaje cada seis meses y abrillantado del portal una vez al año incluidos «como muestra de confianza».
- **Conserje multifunción**: conserjería, limpieza y mantenimiento en un solo puesto. Control de accesos de personas y vehículos, correspondencia, custodia de llaves de zonas comunes, limpieza de zonas comunes y garaje, retirada de papeleras; mantenimiento de puertas y alumbrado (proveedor de LED), pequeños trabajos de albañilería, fontanería y electricidad; jardinería (césped, arbustos, árboles).
- **Control de trabajos**: rondas o circuitos diseñados para asegurar la presencia en lugares u horarios críticos. Personal uniformado con teléfono móvil de la empresa, localizable por los propietarios.
- **Oficinas, negocios y edificios públicos** (colegios, institutos): limpieza diaria o semanal.
- **Viviendas**: limpieza por estancias y a fondo bajo demanda, con personal asegurado.
- **Fin de obra y limpiezas intensivas**: locales, naves, primera ocupación, cambio de inquilino, de temporada, tras siniestro (incendio, inundación). Productos y maquinaria incluidos.
- **Moquetas y alfombras**, **grafitis** (hidrolimpiadora; fachadas, mobiliario urbano, piedra, mármol, metal, PVC, vinilos), **garajes** con maquinaria.
- Los presupuestos se hacen **después de visitar** el inmueble.
- Plantilla: conserjes, limpiadores, mantenimiento y manejo de maquinaria (fregadora, hidrolimpiadora, rotativa). Alta en la Seguridad Social, formación en prevención de riesgos laborales y EPI. Procesos estandarizados para sustituir a un operario sin bajar el rendimiento.

## Diagnóstico priorizado

### 1. Conversión
1. **En móvil la portada se ve en blanco**: tras la pantalla «Por favor espere, cargando…», el carrusel no aparece y lo primero visible son iconos genéricos.
2. **No hay ningún enlace `tel:` ni `mailto:`**. El teléfono solo aparece como texto en el pie («608.82.58.64»), aunque es un móvil y el canal natural del negocio.
3. **El formulario está escondido** tras un botón «Formulario» al final de la página y pide campos que no encajan con el servicio (empresa, «presupuesto» en texto libre).
4. **No se distingue a quién se dirige**: comunidades, empresas y particulares reciben el mismo mensaje; no hay ruta para presidentes de comunidad o administradores de fincas.
5. **El servicio diferencial (conserje multifunción) se explica en un carrusel de pestañas** con un fondo de stock de una tablet.

### 2. Confianza
1. **Restos de plantilla visibles para Google**: el HTML contiene «features», «Multi-porpuse», «Ultra responsive», «Free updates», «photobomb» y «try our high-tech aplication».
2. **Aviso legal con marcadores sin rellenar**: «[INCLUIR DATOS REGISTRALES]» y «[SI NO HAY E-COMMERCE ESTA FRASE DEBE QUITARSE]».
3. **Política de privacidad genérica**: menciona comercio electrónico, webinars, foros y fotos de menores, con un hueco en blanco («mediante el ______»), y remite los derechos a una cuenta de Gmail.
4. **El aviso de cookies dice usar cookies de terceros publicitarias y analíticas**, pero el HTML no carga ninguna herramienta de ese tipo.
5. Las fortalezas reales (personal propio asegurado, RC de 150.000 €, uniforme, visita previa) están enterradas en un bloque de texto al final.
6. Mezcla de fotos reales del equipo (valiosas) con imágenes de stock genéricas.

### 3. SEO local y técnico
1. **No hay ningún H1**. Los titulares son H2/H3 de un carrusel.
2. **Title genérico** («Living Clean Multiservicios») y description de 47 caracteres sin localidad.
3. **Sin atributo `lang`**, sin datos estructurados, sin páginas por servicio.
4. **Una sola URL** para todos los servicios; los textos largos viven en pestañas y carruseles.

### 4. Técnico y visual
1. Bootstrap 3 y 20 librerías jQuery (carruseles, contadores, YouTube player, IE shims) para una página informativa; pantalla de carga que retrasa el contenido.
2. Rojo saturado a pantalla completa con texto blanco en cursiva, iconos genéricos y composiciones en diagonal heredadas de la plantilla.

## Qué se conserva y qué cambia

| Se conserva | Cambia |
|---|---|
| Logotipo original y rojo de marca | Rojo oscurecido a `#C8001A` para que el texto blanco encima sea legible (6:1) |
| Teléfono, correo, localidad, datos legales | Teléfono como enlace `tel:` en cabecera, portada, menú y cierre |
| Servicios y su detalle real (frecuencias, funciones, maquinaria) | Organizados por tipo de cliente y por intención de búsqueda |
| Fotos reales del equipo | Protagonistas de la sección de confianza, sin stock |
| URLs legales `aviso-legal.html`, `politica-privacidad.html`, `politica-cookies.html` | Textos reescritos con los datos reales y sin restos de plantilla |
