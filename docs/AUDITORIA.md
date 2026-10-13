# Auditoría de mrinstalaciones.com

Fecha: 13 de octubre de 2026.

## Cómo se ha hecho y qué limitaciones tiene

- El acceso directo a `www.mrinstalaciones.com` desde este entorno está **bloqueado por la política de red** (el proxy responde 403 al CONNECT). No se ha intentado esquivar el bloqueo.
- La web se ha examinado con **Firecrawl** (herramienta autorizada en la sesión): HTML completo y markdown de la portada, `/certificaciones/`, `/aviso-legal/` y `/politica-de-privacidad/`, lectura de los cinco PDF de certificaciones y **capturas reales** a página completa en escritorio (1440 px) y móvil (360 px).
- **No se han podido medir** Core Web Vitals, cabeceras HTTP, tiempos de respuesta del servidor ni errores de consola de la web original: Firecrawl no expone esos datos. Las observaciones de rendimiento se basan en el HTML descargado (130 KB, WordPress 6.7.10 + Elementor 3.33.2) y en lo visible en las capturas.
- **No se han podido descargar los ficheros originales** (logotipo, fotografías, PDF). El logotipo usado en la nueva web se ha recortado de la captura de escritorio; hay que sustituirlo por el original en alta resolución (ver `README.md`).
- No se ha consultado Google Business Profile ni ninguna plataforma de reseñas con acceso a datos. **No se han encontrado opiniones verificables** que puedan publicarse, y la nueva web no muestra ninguna.

## Datos de empresa verificados

| Dato | Valor | Fuente |
|---|---|---|
| Razón social | Martínez Rojas Instalaciones, S.L. | Aviso legal; actas de la Comunidad de Madrid |
| Nombre comercial / marca | MRI · Martínez Rojas Instalaciones (web: MRINSTALACIONES) | Logotipo y cabecera |
| NIF | B87145165 | Aviso legal; actas |
| Dirección | C/ Fundición 4 Bis, Nave 50, 28522 Rivas-Vaciamadrid, Madrid | Portada; actas |
| Teléfono | 911 66 24 76 | Cabecera y contacto |
| Correo | info@mrinstalaciones.com (contacto) · amartinez@mrinstalaciones.com (responsable de datos) | Portada; aviso legal |
| Horario | Lunes a viernes, 9:00 a 18:30 | Cabecera |
| Inicio de operaciones | 18/11/2014 | Datos registrales públicos (DatosCif, BORME) |
| CNAE | 4322 Fontanería, instalaciones de calefacción y aire acondicionado | Certificado REA |

Hay un móvil en los documentos oficiales. **No se ha publicado** ni se ha usado para WhatsApp: no consta autorización para ello.

### Habilitaciones (leídas en los PDF publicados por la empresa)

| Documento | Datos clave | Verificable |
|---|---|---|
| Empresa instaladora de instalaciones térmicas en edificios (RITE) | Registro industrial 201986 · actividad 13-B-D20 · 26/03/2015 · caducidad indefinida | CSV 1259369201268240433916 en madrid.org/csv |
| Empresa mantenedora de instalaciones térmicas en edificios (RITE) | Registro industrial 201986 · actividad 13-B-E20 · 26/03/2015 · caducidad indefinida | CSV 120387978840896759155 |
| Empresa instaladora de gas, categoría A (ITC-ICG 09, RD 919/2006) | Registro industrial 201986 · actividad 13-B-D30 · 26/03/2015 · caducidad indefinida | CSV 1295251072747407950625 |
| Empresa de gases fluorados (carga < 3 kg) | Registro GF/00001505 · 26/03/2015 (emitido bajo el RD 795/2010) | CSV 1221179527450138526313 |
| Registro de Empresas Acreditadas (REA, construcción) | Nº 12-28-0112372 · inscrita desde 11/07/2019 | CSV 1240775816428571469409 |
| ISO 9001 (NQA, UKAS) | Solo se publica la marca; no hay certificado ni fecha de validez | **No verificable** desde la web |

Pendiente de confirmar por la empresa antes de publicar: vigencia de la inscripción REA (se renueva cada tres años), adaptación del certificado de gases fluorados al RD 115/2017 y vigencia del certificado ISO 9001.

La antigüedad "más de 15 años de experiencia" que usa la web actual no se puede comprobar (la sociedad opera desde 2014). La nueva web **no la repite**; si se refiere a la trayectoria profesional del fundador, la empresa puede añadirla indicándolo así.

## Arquitectura actual

```
/                      Portada de una sola página (anclas #servicios, #domestico, #comercial,
                       #industrial, #nuevaconstruccion, #contacto, #trabajaconnosotros)
/certificaciones/      Lista de cinco PDF y la marca ISO
/aviso-legal           Legal
/politica-de-privacidad/
/politica-de-cookies/
```

No hay páginas por servicio. Los servicios solo existen como pestañas dentro de la portada.

## Servicios reales (texto original)

Fontanería y saneamiento · Sistemas de climatización (radiadores, suelo radiante y refrescante, conductos, equipos individuales; aerotermia, gas, gasóleo, biomasa, geotermia) · Ventilación mecánica (caudal variable, higrorregulable, autorregulable, recuperación de energía) · Gas (instalaciones receptoras comunes e individuales, gas canalizado, GLP en botellas y depósitos) · Biomasa (calefacción y ACS con pellets, hueso de aceituna, cáscara de almendra) · Aerotermia (calefacción, climatización y ACS) · Domótica (control de climatización, iluminación y equipos de producción).

Sectores: doméstico, comercial, industrial y nueva construcción (este último sin biomasa ni aerotermia en su lista).

## Diagnóstico priorizado

### 1. Conversión (impacto más alto)

1. **No existe un formulario para pedir presupuesto.** El único formulario es "Trabaja con nosotros" (nombre, correo, asunto, mensaje, CV). Quien quiere un presupuesto solo tiene un botón `mailto:` y el teléfono.
2. **El teléfono no es un enlace `tel:`** en la cabecera ni en el bloque de contacto. En móvil no se puede llamar con un toque.
3. **El hero no tiene llamada a la acción.** Muestra titular y subtítulo, sin botón ni teléfono.
4. **En móvil el contacto queda lejos**: el titular ocupa cinco líneas a 360 px y el contacto aparece tras más de 9.000 px de desplazamiento (captura de 12.301 px de alto).
5. **No se distinguen necesidades.** Doméstico, comercial e industrial repiten exactamente el mismo texto y la misma lista; el visitante no encuentra su caso (avería concreta, reforma, cambio a aerotermia, empresa u obra nueva).
6. **El formulario existente pide un "Asunto" libre** y no pregunta servicio ni localidad, que es lo que permite cualificar una solicitud.

### 2. Confianza y credibilidad

1. Las habilitaciones reales (RITE instaladora y mantenedora, gas categoría A, gases fluorados, REA) son una ventaja clara frente a instaladores no habilitados, pero están escondidas en una página secundaria como enlaces "Ver PDF" sin explicar qué significan.
2. Iconografía de clipart (casas, engranaje, destornillador) e imágenes de banco (Pixabay: `underfloor-heating-3814621`, `bathtub-2174699`, `heating-3212503`…) que no muestran trabajo propio.
3. Errores de texto: "la neva construcción", "ámplios", "contrucción", "biomas (pellets, hueso de aceituna, cascara de almendra, )", "Instalaciones receptora".
4. La política de privacidad menciona "Efectoneo.com", otra empresa: texto copiado de una plantilla.
5. La política de privacidad dice que el formulario sirve también para enviar comunicaciones comerciales "si marca la casilla", pero esa casilla no existe.

### 3. SEO local y técnico

1. **El H1 de la portada es "INICIO"**. El titular real es un H2. Hay dos H1 más en la sección de contacto ("SI NECESITAS PRESUPUESTOS…" y "RIVAS VACIAMADRID").
2. Una sola URL para todos los servicios: no hay ninguna página que pueda posicionar por "aerotermia Rivas-Vaciamadrid", "instalador de gas" o "suelo radiante".
3. Contenido duplicado: cuatro bloques de servicios casi idénticos en la misma página.
4. Sin datos estructurados de negocio local (`LocalBusiness`/`HVACBusiness`/`Plumber`) con dirección, teléfono y horario.
5. Imagen Open Graph = clipart de una casa (`house-309113_1280.png`).
6. `alt` pobres o vacíos ("domestico", "comercial", imágenes de contacto sin `alt`).
7. Datos de dirección incoherentes entre páginas: "c/ Fundición 4 Bis, Nave 50" en portada y "Calle de la fundicion, 4" en los textos legales.

### 4. Visual

1. Diseño de plantilla Elementor de 2020: titulares en mayúsculas con espaciado amplio, bloques grises, barra naranja decorativa, fotografías sin dirección artística común (blanco y negro, color, estudio).
2. El naranja de marca (#FF6500) se usa en filetes decorativos y en el botón con texto blanco: **blanco sobre #FF6500 tiene un contraste de 2,9:1**, insuficiente.
3. Pestañas grises de servicios con poca jerarquía; la misma maqueta se repite cuatro veces.

### 5. Técnico

1. WordPress 6.7.10 + Elementor 3.33.2 con fuentes de Google cargadas desde los servidores de Google (transferencia de IP a terceros) y `font_display-auto`.
2. Imágenes JPEG/PNG de 1.280 a 1.920 px sin formatos modernos aparentes.
3. Iconos sociales/plantilla sin uso, scripts de Elementor para un sitio esencialmente estático.
4. El crédito "Powered by enteproject" en el pie.

### Obligaciones que hay que conservar

- **Kit Digital**: la web muestra la banda de financiación (UE NextGenerationEU, Gobierno de España, Plan de Recuperación, red.es, Kit Digital). Los beneficiarios deben mantener esa publicidad durante el periodo exigido. La nueva web la conserva en el pie.
- Aviso legal y política de privacidad (actualizados en la nueva web al tratamiento real del formulario).

## Qué se conserva y qué cambia

| Se conserva | Cambia |
|---|---|
| Naranja de marca #FF6500 y logotipo MRI | Texto oscuro sobre naranja (contraste 6:1) en lugar de blanco |
| Datos de contacto, horario y dirección (unificados) | Teléfono como enlace `tel:` en cabecera, hero, barra móvil y cierre |
| Lista de servicios y sectores reales | Una página por intención de búsqueda, con contenido propio |
| URL `/certificaciones/`, `/aviso-legal/`, `/politica-de-privacidad/`, `/politica-de-cookies/` | Certificaciones explicadas, con número de registro y código CSV comprobable |
| Anclas `#servicios`, `#contacto`, `#trabajaconnosotros` | `#trabajaconnosotros` lleva a una página propia |
| Banda Kit Digital | Imágenes de banco y clipart sustituidas por dibujos técnicos propios |
