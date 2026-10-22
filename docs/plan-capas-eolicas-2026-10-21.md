# Plan — Actualización de capas eólicas por estado (2026-10-21)

Fuente: `Desktop\condores\actualización al 21102026` (16 KMZ, MINENERGIA, corte 30-06-2026).
Estado: **DECISIONES TOMADAS (ver «Respuestas de José») — esperando OK final para ejecutar.**

## 1. Qué llegó

Dos capas por cada uno de los 8 estados (`NN_AE_…` aerogeneradores y `NN_Buff_5x_D_Rot_…`
áreas buffer de 5 × diámetro de rotor). Exportación ArcGIS: los atributos vienen como tabla
HTML dentro de la `description` del popup (no hay `ExtendedData`), así que hay que extraerlos.

| # | Estado | Parques | Aerogeneradores | MW | Fuente |
|---|---|---:|---:|---:|---|
| 01 | En Calificación | 18 | 714 | 5.464 | SEIA |
| 02 | Aprobado | 76 | 2.783 | 11.506 | SEIA |
| 03 | En Construcción | 14 | 114 | 529 | CNE |
| 04 | En Pruebas | 2 | 73 | 471 | CNE |
| 05 | En Operación | 72 | 1.799 | 6.775 | CNE/SEIA |
| 06 | Caducado | 9 | 361 | 894 | SEIA |
| 07 | Rechazado | 5 | 171 | 364 | SEIA |
| 08 | Desistido | 17 | 701 | 3.240 | SEIA |
| | **Total** | **213** | **6.716** | **29.243** | |

**Campos de aerogeneradores:** `ID_Unico` (PE_xxx, llave del parque), `AG` (n.º de
aerogenerador), `E/N_WGS84_19` (UTM 19S), `Nombre_Cor`, `Est_JUN26`, `Cap_JUN26` (MW, coma
decimal), `Sistema`, `Fuente`, `Propiedad`, `Region`, `Diam_Rotor`, `Di_R_5x` (radio del
buffer, m), `Di_Pro_OPC`/`Di_Pro_5x` (128 / 640 m: diámetro promedio de los OPC, referencia).
**Campos de buffers:** mismos datos de parque + `Fech_Act` (30-06-2026). Geometría:
MultiPolygon por parque (unión de los círculos de cada aerogenerador).

**Consistencia (verificada):** cada `ID_Unico` está en una sola categoría; los AE y los
buffers de cada categoría tienen exactamente los mismos parques; sin campos vacíos.

**Observaciones a confirmar con quien envió los datos:**
- En Operación trae un campo extra `Mapear` (Sí 1.702 / No 97). Los «No» son 3 parques:
  Campo Lindo (Modificación), Eólica Lebu (Ampliación) y Malleco Sur (este último aparece
  2 veces: `PE_031` y `PE_031_1`). Parecen duplicados de modificaciones → propuesta: no
  dibujar los «No».
- 13 aerogeneradores en operación tienen `Diam_Rotor = 128` = el promedio OPC (rotor
  imputado, no real). Se indica en el popup.
- Frente a la capa actual: 169 de los 181 parques activos coinciden por nombre con los 180
  de `parques_eolicos.geojson` y **ninguno cambia de estado**; las diferencias son de
  nombres por etapas (p. ej. «Pampa Fidelia etapa 1/2» → «Pampa Fidelia»). Los
  aerogeneradores actuales (7.162, sin estado) pasan a 6.716 con estado.

## 2. Propuesta

### Fase A — Datos (script reproducible, sin dependencias)
- Copiar los 16 KMZ a `data/eolico_2026_06/` (carpeta de fuentes del repo).
- `src/build_eolico_estados.py` (stdlib, como `build_capas_derivadas.py`): lee los KMZ,
  extrae la tabla HTML, normaliza números (coma → punto) y escribe:
  - `layers/aerogeneradores_estado.geojson` — 6.716 puntos (sin los `Mapear = No`), con
    `id_parque, nombre, estado, grupo, mw, sistema, fuente, propiedad, region,
    diam_rotor, radio_buffer_m, rotor_imputado`.
  - `layers/buffers_5d_rotor.geojson` — 213 MultiPolygon, simplificados (~5 m, 5
    decimales; peso estimado 1–2 MB, a medir).
  - `layers/parques_eolicos_estado.geojson` — 1 punto por parque (centroide de sus
    aerogeneradores) con los mismos atributos: lo que necesitaría el motor (Fase C).
  - Actualiza `capas_conteo.json`.
- Agrupación de estados (propuesta, ajustable):
  - **OPC**: En Operación, En Pruebas
  - **En SEIA**: En Calificación
  - **Otros vigentes**: Aprobado, En Construcción
  - **No vigentes**: Caducado, Rechazado, Desistido (solo referencia histórica)

### Fase B — Visor (solo visual, el índice no cambia)
- Grupo «Infraestructura energética»: la capa **Aerogeneradores** pasa a ser por estado,
  con color por estado (8 colores; los no vigentes en gris/tenue) y filtro por estado en
  la leyenda o el panel. Por defecto se ven los vigentes; los no vigentes se encienden aparte.
- Capa nueva **Áreas buffer 5 × diámetro de rotor** (polígonos semitransparentes con el
  mismo color por estado), apagada por defecto. No confundir con el buffer de proximidad
  configurable que ya existe en el panel (`@turf/buffer`): este es el oficial de MINENERGIA.
- Popup con los datos del KMZ: parque, estado, MW, propiedad, sistema, fuente, región,
  diámetro de rotor y radio del buffer (y aviso si el rotor es el promedio imputado).
- Página «Capas Geoespaciales Disponibles»: filas nuevas con descarga del GeoJSON
  (y opcionalmente de los KMZ originales).
- Textos de ayuda/notas: quitar «capa nueva con estado en preparación» (pendiente
  cerrado en `TODO.md`).

### Fase C — Motor (opcional; cambia el índice publicado)
- El criterio «Cercanía a parques eólicos» y el ranking del Motor pasan a leer
  `parques_eolicos_estado.geojson` en vez del catastro de generación: 181 parques
  vigentes en el criterio (no se cuentan caducados/rechazados/desistidos) y 74 OPC en el
  ranking (hoy 75).
- Variante más precisa (a evaluar): medir la distancia al **borde del buffer 5×D** o al
  aerogenerador más cercano en vez del punto del parque.
- Comparación antes/después como en `docs/comparacion-indice-2026-09-29.md`, y
  `npm run precompute:potencial` (~20 min).

### QA
`npm run build` verde · prueba en navegador contra `vite preview :4173` · revisión
gráfica por subagente · comparación del índice si se hace la Fase C · commits por tema
(sin push hasta que José lo pida).

## 3. Decisiones pendientes de José
1. ¿Hacer solo A+B (visual) o también C (motor)? ¿Con qué geometría para la distancia?
2. ¿La capa nueva **reemplaza** a «Parques eólicos (OPC · En SEIA · Otros)» del catastro de
   generación y a los 7.162 aerogeneradores, o conviven?
3. ¿Se muestran los no vigentes (caducado, rechazado, desistido)? ¿Apagados por defecto?
4. ¿Se excluyen los `Mapear = No`?
5. ¿Se ofrecen para descarga los KMZ originales o solo el GeoJSON derivado?

### Respuestas de José (2026-10-21)
1. **A+B+C juntas** (el motor también pasa a las capas nuevas, con comparación).
2. **Reemplazan** a «Parques eólicos (OPC · En SEIA · Otros)» del catastro de generación y a
   los 7.162 aerogeneradores sin estado (archivos viejos quedan en disco como línea base).
3. **No vigentes:** apagados por defecto, pero se pueden encender y consultar (popup,
   descarga) igual que las demás capas: su información histórica es valiosa para el análisis.
   En el motor **no suman** (solo los 5 estados vigentes).
4. **Mapear = No: excluir** (confirmar con quien preparó los datos).
5. **Distancia del motor:** desde el **punto del parque** (centroide de sus aerogeneradores),
   igual que hoy, para que la comparación refleje solo el cambio de datos. Las variantes
   (aerogenerador más cercano, borde del buffer 5×D) quedan como mejora futura en `TODO.md`.
6. **Descarga: mismo formato que hoy.** La página «Capas Geoespaciales Disponibles»
   (`CapasPage.tsx`) arma una fila por capa del panel, en el mismo orden y grupos, y el
   botón descarga el mismo GeoJSON que usa el visor, con el conteo, el formato y el tamaño
   que salen de `capas_conteo.json`. Las capas nuevas entran igual: una fila
   «Aerogeneradores» (un archivo con los 8 estados) y otra «Áreas buffer 5 × diámetro de
   rotor», ambas en GeoJSON. Los KMZ originales no se publican.

## 3b. Contrato técnico (fijo para todos los agentes)

**Archivos nuevos** (los viejos `parques_eolicos.geojson` y `aerogeneradores.geojson` se
conservan en disco como línea base; `split_generacion()` sigue generándolos):
- `web/public/data/layers/parques_eolicos_estado.geojson` — 210 `Point` (centroide de los
  aerogeneradores del parque). Se excluyen por completo los 3 parques `Mapear = No`:
  PE_031 Malleco Sur (agregado de PE_031_1 + PE_031_2), PE_024 Eólica Lebu (Ampliación) y
  PE_079 Campo Lindo (Modificación) — estos dos, pendiente de confirmar con el proveedor.
- `web/public/data/layers/aerogeneradores_estado.geojson` — 6.619 `Point` (6.716 − 97).
  Vigentes: 179 parques (OPC 71 · En SEIA 18 · Otros 90); No vigente: 31.
- `web/public/data/layers/buffers_5d_rotor.geojson` — 210 `MultiPolygon`/`Polygon`.

**Ids de capa** (= claves de `capas_conteo.json` = ids de `usePortalStore`): `parques_eolicos`
(ahora apunta al archivo nuevo; el motor ya usa ese id), `turb` (aerogeneradores, archivo
nuevo), `buffers_5d` (nuevo).

**Propiedades** (las mismas en los tres archivos; las marcadas * solo en aerogeneradores,
las marcadas ** solo en parques y buffers):
| propiedad | tipo | origen |
|---|---|---|
| `id_parque` | string | `ID_Unico` |
| `nombre` | string | `Nombre_Cor` |
| `estado` | string | `Est_JUN26` (texto original: «En Calificación», «Aprobado», …) |
| `estado_key` | string | `calificacion · aprobado · construccion · pruebas · operacion · caducado · rechazado · desistido` |
| `categoria` | string | `OPC` (operacion, pruebas) · `En SEIA` (calificacion) · `Otros` (aprobado, construccion) · `No vigente` (caducado, rechazado, desistido) |
| `vigente` | boolean | false solo en No vigente |
| `potencia_mw` | number | `Cap_JUN26` (coma → punto) |
| `sistema`, `fuente`, `titular`, `region` | string | `Sistema`, `Fuente`, `Propiedad`, `Region` |
| `fecha_act` | string | `2026-06-30` |
| `ag` * | number | `AG` |
| `diam_rotor_m` | number | `Diam_Rotor` (parques/buffers: el valor más frecuente del parque) |
| `radio_buffer_m` | number | `Di_R_5x` (ídem) |
| `rotor_imputado` | boolean | `Diam_Rotor == Di_Pro_OPC` (128) en operación; en parques/buffers true si algún aerogenerador lo es |
| `n_aerogeneradores` ** | number | conteo de aerogeneradores del parque |

**Reparto de archivos (nadie toca los del otro):**
- Agente A (datos): `data/eolico_2026_06/`, `src/build_eolico_estados.py`,
  `src/build_capas_derivadas.py` (solo `registrar(...)`), los 3 GeoJSON nuevos,
  `capas_conteo.json`.
- Agente B (visor): `usePortalStore.ts`, `MapView.tsx`, `LegendPlate.tsx`, `data/portal.ts`,
  `CapasPage.tsx`, `data/ayuda.ts`, CSS, componentes del panel de capas.
- Agente C (motor): `riskConfig.ts`, `riskEngine.ts`, `useBatchStore.ts`, `BatchPanel.tsx`,
  `WindpotRiskPanel.tsx`, `web/scripts/*`, `riesgo/potencial_medidas.json`,
  `docs/comparacion-indice-2026-10-21.md`. `portal.ts` NO (es de B).

## 4. To-do
- [x] Aprobación del plan y respuestas a las decisiones
- [x] Fase A — datos (210 parques · 6.619 aerogeneradores · 210 áreas)
- [x] Fase B — visor (filtro por estado, popups, leyenda; corrige además popups que
      dejaban de abrirse tras una consulta de riesgo)
- [x] Fase C — motor (179 vigentes en el criterio, ranking 71 OPC; ver
      `docs/comparacion-indice-2026-10-21.md`)
- [x] QA + revisión gráfica (correcciones aplicadas; detalles anteriores al cambio en `TODO.md`)
- [ ] Commits por tema (con OK de José)
- [ ] Deploy a producción (cuando José lo pida)

## Corrección de la fuente (2026-10-22)

El encargado de los datos envió de nuevo `05_AE_2026_Junio_EnOperacion` y
`05_Buff_5x_D_Rot_2026_Junio_EnOperacion` sin los duplicados de PE_031 Malleco Sur (77 AE) y
PE_024 Eólica Lebu (Ampliación) (5 AE), con sus buffers; el resto es idéntico. Se reemplazaron
en `data/eolico_2026_06/` (originales en `_original_2026-10-21/`) y se ajustaron los conteos
esperados de `src/build_eolico_estados.py` (211 parques y 6.634 aerogeneradores leídos, 15
excluidos). Con eso las tres capas publicadas quedaron idénticas byte a byte.

Campo Lindo (Modificación, PE_079) sigue en `Mapear = No`, pero el encargado confirmó que
debe aparecer (la marca es un campo interno de su base de datos). El script lo publica vía
`MAPEAR_CONFIRMADOS`: 211 parques (180 vigentes: OPC 72 · En SEIA 18 · Otros 90; 31 no
vigentes), 6.634 aerogeneradores y 211 áreas. En operación pasa de 69 a 70 y el ranking del
Motor de 71 a 72 parques. Se actualizaron los textos de ayuda con esas cifras.

**Colores por estado** (definidos por el encargado, 22-10-2026): En calificación gris
`#8c8c8c`, Aprobado verde `#2e9e44`, En construcción amarillo `#f2c40f`, En pruebas naranja
`#f07f12`, En operación rojo `#d62828`, Caducado blanco `#ffffff` (con contorno gris
`#555555` para que se vea sobre el mapa), Rechazado morado `#7b3fa6`, Desistido negro
`#111111`. Se aplican a parques, aerogeneradores, áreas buffer, leyenda, filtro y popups.
«Otros proyectos de generación» mantiene su paleta anterior.
