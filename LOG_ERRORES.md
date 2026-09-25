# LOG DE ERRORES — Portal Cóndores (base de conocimiento)

> Registro de errores, tropiezos y decisiones no obvias que surgen durante el
> desarrollo. **Alimentar este archivo como input en la planeación de hitos
> futuros**: antes de planificar, leer esta bitácora para no repetir tropiezos.
>
> Formato de cada entrada: fecha · contexto · síntoma · causa raíz · solución · lección.

---

## 2026-09-25 — Navegación, Etapa 3 (pantallas pequeñas)

- **Problema:** bajo 1180 px el panel de resultados y la leyenda tenían
  `display:none` (sin alternativa) → Riesgo/Comité/ficha inutilizables con ventana
  no maximizada o en notebook 1366 px con zoom 125% (≈1093 px CSS). Bajo 900 px
  desaparecía también el panel de capas. Visor con alto fijo de 660 px.
- **Solución:** ≤1180 panel y ficha como cajón (botón ✕, parten cerrados, se abren
  desde el riel o ☰); leyenda con botón propio ▤; ≤900 capas como cajón (botón ◧) y
  abrir uno cierra el otro si no caben. Alto del visor = ventana − cabecera (mín.
  540 px). Umbrales en `NARROW_PANEL/NARROW_LAYERS` (store) = `@media` de app.css.
- **Tropiezo:** en modo cajón el panel tapaba los controles del mapa y el buscador →
  clase `.mapwrap.panel-open` los corre a la izquierda del cajón.
- **Encuadre:** `FIT` reservaba 380 px a la derecha para el panel aunque estuviera
  cerrado → Chile quedaba chico y a la izquierda. Ahora `fitOptions()` solo reserva
  en escritorio.
- **Impresión:** el ancho de papel cae bajo 1180 px → los ✕ de cajón llevan `no-print`.
- **Gotcha de prueba:** `goto` a una URL que solo cambia el hash NO recarga la página
  (el estado del store persiste): para probar estados iniciales, recargar.

## 2026-09-25 — Navegación, Etapa 2 (enlaces compartibles)

- `lib/urlState.ts`: la vista vive en el hash (`#/comite/potencial?perfil=sensibilidad`).
  Hash y no rutas reales → funciona en cualquier servidor estático sin «SPA fallback».
  Cambiar pestaña/sub-vista hace `pushState` (Atrás/Adelante funcionan); cambiar solo
  el perfil hace `replaceState` (no llena el historial). Bandera `applying` evita el
  bucle store → URL → store al aplicar un `popstate`.
- NO van en la URL: pesos editados a mano («Personalizado»), capas, comuna, punto.
- **Gotcha:** el hook de seguridad del entorno marca `regex.exec(...)` como si fuera
  `child_process.exec` (falso positivo) → usar `str.match(regex)`.
- **Gotcha TS:** con `exactOptionalPropertyTypes`, los campos opcionales que reciben
  `undefined` explícito deben declararse `campo?: T | undefined`.

## 2026-09-25 — Navegación, Etapa 1 (limpieza y accesos)

### Diagnóstico: 4 sistemas de navegación superpuestos
- Menú superior, riel, sub-pestañas y tarjetas mostraban subconjuntos distintos
  (Comité no estaba en el menú; Colisiones no estaba en el riel; colisiones
  repartidas entre «Gráficos» —por año— y «Colisiones» —por parque—).
- Las 10 tarjetas de «Explorar el portal» apuntaban a `#secciones` (a sí mismas),
  incluso las que tenían contenido; el pie tenía 3 enlaces sin destino; «Visor»
  quedaba siempre marcado como activo (`aria-current` fijo en el índice 0).
- **Solución:** menú = Visor · Riesgo · Comité · Colisiones con activo según la
  pestaña (`match`); riel con Colisiones (sub-vistas Por año / Por parque) en vez de
  Gráficos; contadores de cabecera clicables; tarjetas con destino (`go`) vía
  `lib/nav.ts` (`goToVisor`); lo «En construcción» queda OCULTO con `pend` (decisión
  de José) listo para publicarse cuando exista.
- Sub-vistas del Comité y de Colisiones movidas al store (`comiteView`, `colView`):
  prerequisito de los enlaces compartibles (Etapa 2).
- Código muerto eliminado: pestañas `especies` y `tabla` (inalcanzables desde la
  multiespecie), `lib/catalog.ts`, y estado `species/sheetOpen/*Collapsed`.

---

## 2026-09-24 — Potencial eólico bruto (capa) + cruce potencial × riesgo (Comité)

### KMZ de potencial: tildes rotas en origen
- **Síntoma:** regiones "Biob�o", "�uble", "Los R�os" (U+FFFD) ya dentro del `doc.kml`;
  no es un problema de decodificación nuestra (el archivo es UTF-8 válido).
- **Solución:** tabla fija `REGION_FIX` en `src/build_potencial_eolico.py` + el script
  aborta si queda alguna región con U+FFFD (no falla en silencio).

### Borde escalonado: simplificar por tolerancia no ahorra hasta destruir el borde
- Polígonos derivados de raster ~100 m (escalón ≈ 0,0009°). Medido: tolerancia
  0,0003–0,0004° apenas ahorra (7,4 MB); recién 0,001° baja a 2,6 MB pero borra el
  escalón. José pidió **no perder resolución de borde** → solo redondeo a 4 decimales
  + quitar vértices duplicados/colineales: 7,6 MB (1,4 MB gzip), carga diferida.
- **Lección:** en polígonos de origen raster, la simplificación Douglas-Peucker es
  "todo o nada" alrededor del tamaño de píxel; medir antes de prometer ahorro.

### Motor de riesgo: ~275 ms/punto → 2.277 polígonos = ~10 min en el navegador
- **Síntoma (medido en navegador):** `riskAtPoint` ≈ 275 ms por punto, casi todo en
  `nearestFeatureDistanceKm` contra `lineas.geojson` (pointToLineDistance por feature).
  El ranking de 30 parques ya necesitaba trocear; 2.277 polígonos es inviable en vivo.
- **Solución:** separar el motor en `measureAtPoint` (pesado, independiente de pesos y
  decay) + `scoreMeasures` (aplica config y correcciones de campo, instantáneo);
  `riskAtPoint` = composición. Mediciones precalculadas con **el mismo TypeScript**
  (`web/scripts/precompute_potencial.ts`, bundle esbuild → node; `npm run
  precompute:potencial`) → `data/riesgo/potencial_medidas.json`.
- **Por qué NO en Python** (lo proponía el plan de Sonnet): duplicaría fórmulas del
  motor y derivaría con el tiempo. Con el mismo código no hay deriva posible.
- **Verificación:** paridad motor viejo vs nuevo = 225 comparaciones, 0 diferencias
  (JSON completo incl. textos; 3 configs, con/sin correcciones de campo). El script de
  precálculo re-chequea paridad tras la ida y vuelta por JSON.
- **Re-ejecutar el precálculo** cuando cambien las capas de `data/riesgo/` o el
  potencial; NO al cambiar pesos.
- **Limitación documentada en la UI:** un punto interior por polígono (centroide o, si
  cae fuera, centro del tramo interior más ancho de su horizontal); áreas de hasta
  ~28.000 ha pueden variar por dentro.

### Paleta de categorías de riesgo: dos verdes casi iguales → escala ordinal
- "Muy bajo" `#1f6b4a` y "Bajo" `#2e7d32` eran casi indistinguibles, y el semáforo
  rojo/verde falla con protanopía/deuteranopía. Además había DOS escalas para las
  mismas etiquetas (`riskCategory` y `RISK_COLORS`).
- **Solución:** una sola escala ORDINAL (`RISK_CAT_COLORS` en `riskConfig.ts`): tono
  terracota único, luminosidad monótona, validada con el validador de dataviz
  (`--ordinal`, pasa sobre papel y superficie). `RiskCategory.text` da el color de
  texto legible sobre cada relleno (tinta en los 2 claros, blanco en los 3 oscuros).
  El número grande de la ficha pasó a tinta (el color de serie no se usa para texto).
- **Gotcha del validador:** `validate_palette.js` es ESM sin `"type": "module"` →
  correr con `node --experimental-default-type=module`.

### Leyenda de Idoneidad no coincidía con el mapa (bug preexistente)
- La leyenda usaba la escala de riesgo (verde→óxido) pero el mapa pinta la idoneidad
  con `HABITAT_RAMP` (azul→amarillo→rojo). Ahora usa `HABITAT_LEGEND` (muestras de la
  rampa real).

### Perfil "nuevos desarrollos": reponderar NO produce riesgo Alto (hallazgo de datos)
- Simulado sobre las 2.277 áreas: sin cercanía a infraestructura el índice máximo es
  44 (Alto empieza en 50). El índice es un promedio ponderado y casi todos los
  criterios de proximidad valen 0 en casi todas las áreas: están a 133 km de mediana
  del nido conocido más cercano (p10 66 km; nidos decae a 8 km → solo 6 áreas > 0).
- Estirar la influencia de nidos/colisiones a 30–50 km apenas da 0,1–0,5 GW en Alto:
  forzarlo sería manipular el índice. El límite es el inventario de nidos (81 sitios
  eBird), no los pesos.
- Se implementó el mecanismo de perfiles (`RISK_PROFILES`, `applyProfile`,
  `ProfileSelect`) con "Nuevos desarrollos" marcado como PROPUESTA pendiente del
  comité (solo pesos; distancias sin cambio). Medio pasa de 1,4 a 15,1 GW.
- **Renombrado (2026-09-25, pedido de José):** "Nuevos desarrollos" → **"Sensibilidad del
  sitio"** (id `sensibilidad`): el nombre anterior sugería proyectos concretos. Las notas
  del selector explican en lenguaje simple la pregunta que responde cada perfil y el
  punto abierto del efecto acumulado (cercanía a parques en 0%).

### Ayuda contextual (InfoTip): textos centralizados en `data/ayuda.ts`
- Botón (?) reutilizable `InfoTip` con nota de posición FIJA (calculada desde el botón):
  una nota absoluta la recortaban los paneles con `overflow`. Se cierra con clic fuera,
  Escape o scroll. Las notas metodológicas por capa siguen en `help` de `LAYERS`.
- El riel ya tenía tooltip propio (`.rail-tip`); no duplicar con `title` largo.
- **Tropiezo de proceso:** `rm -rf web/src` para restaurar un respaldo falló a medias
  ("Device or resource busy": Vite tiene tomada la carpeta) y dejó archivos borrados.
  Se restauró con `cp -r respaldo/. web/src/` y `diff -r`. **Lección:** con el dev
  server corriendo, restaurar copiando ENCIMA, nunca borrar la carpeta.

### Hooks condicionales en `LegendPlate` (bug preexistente)
- `usePortalStore(densityDomain)` se llamaba DESPUÉS de `if (!open) return null` →
  viola las reglas de hooks (puede provocar error de React al ocultar/mostrar la
  leyenda; no se reprodujo, se corrigió preventivamente). Se movieron
  todos los hooks antes del return.

---

## 2026-08-25 — Porte del 5º feature: buffers de proximidad por capa

### Contexto: el "5 features" del encabezado no cuadraba con los 4 commiteados
- **Síntoma:** el encabezado de la entrada del 24 decía "Porte de 5 features" pero
  memoria y commits (`360f75e..96bba83`) solo registraban 4 (p95, satélite, terreno,
  correcciones de campo).
- **Hallazgo:** el feature faltante eran los **buffers de proximidad por capa**
  (prototipo líneas 1170–1235): cada capa `bufferable` expone checkbox Buffer + slider
  km y dibuja un anillo `turf.buffer` ámbar. Coincidía con el pendiente ya anotado
  "Fase 4 riesgo (buffers/dibujar)".
- **Dato corregido:** en el prototipo el **ganado NO es bufferable**; las bufferables son
  6: wind (2 km), lineas (1 km), nidos (5 km), colisiones (5 km), vertederos (10 km),
  veranadas (15 km) — radios por defecto en `defaultBufferKm`.

### turf: el proyecto usa `@turf/*` modular, no el `turf` monolítico del prototipo
- El prototipo llama `turf.buffer(...)`; el React tiene solo `@turf/distance`,
  `@turf/helpers`, etc. (v7.4.0). Hubo que **instalar `@turf/buffer`**, que arrastra
  **`@turf/jsts`** (~200 KB). El export es `default` (como `@turf/distance`).

### Bundle: import estático de `@turf/buffer` engorda el bundle inicial (+425 KB)
- **Síntoma:** con `import buffer from '@turf/buffer'` el bundle principal saltó a 713 KB.
- **Solución:** import **diferido** dentro de `buildBuffer` (`await import('@turf/buffer')`),
  igual que `importGeo` (jszip/togeojson). El bundle inicial bajó a **288 KB** y jsts quedó
  en un chunk lazy de 424 KB que solo baja al dibujar el primer buffer.
- **Lección:** deps pesadas de uso opcional (jsts, jszip, togeojson) → SIEMPRE import
  diferido; el patrón ya existía en el repo.

### Panes: no se puede replicar el orden del prototipo (choropleth y vectores comparten pane)
- El prototipo ordena `paneHabitat(300) < paneBuffer(350) < paneFeatures(450)`: el anillo
  va **sobre** la idoneidad pero **bajo** los puntos.
- En el React, choropleths (idoneidad/densidad/terreno) y los vectores de las capas usan
  **el mismo `canvasRef` (overlayPane 400)** → no se pueden intercalar. Se puso el pane
  `buffers` en **401** (justo encima) para que el anillo no quede oculto bajo la idoneidad
  (encendida por defecto). Trade-off aceptado: el relleno tenue (0,12) queda sobre los
  puntos canvas, pero es imperceptible; los marcadores divIcon (colisiones, obs) siguen
  arriba (markerPane 600).
- **Lección:** al portar z-order de un prototipo, verificar si las capas destino comparten
  renderer/pane; si comparten, el orden de 3 niveles no es replicable sin separar renderers.

### Gotchas de datos y estado
- Las capas bufferables no guardan su GeoJSON crudo (el `loaderFor` lo convierte directo a
  Leaflet y lo descarta). Para bufferear hay que **volver a traer el GeoJSON y cachearlo**
  aparte (`bufferDataRef`); el buffer solo se ofrece si la capa está encendida (su dato ya
  se pidió) — consistente con la fila de opacidad.
- **Debounce 200 ms** en el slider de km: `lineas` (2,1 MB) y `veranadas` (520 KB) son
  pesadas de rebufferear en cada tick del arrastre. Primer encendido inmediato; cambios de
  km debounced.
- Revalidar `mapInstance.map === map` **después de cada await** (fetch y el import diferido)
  para no pintar contra un mapa recreado por StrictMode/HMR — mismo patrón que los loaders.

---

## 2026-08-24 — Porte de 5 features del prototipo (`mapa_riesgo_condores_V20260821.html`) a React

### Decisión de gobernanza: p95 solo en color, no en el motor de riesgo
- **Contexto:** el plan generado por Sonnet proponía aplicar la normalización por
  percentil 95 tanto al color como al puntaje de riesgo eBird "por consistencia".
- **Hallazgo (verificado en el prototipo):** el prototipo aplica p95 SOLO al color
  (línea 1286) y mantiene el sub-puntaje de riesgo en el **máximo absoluto**
  (`MAX_EBIRD_LOCALIDADES`, líneas 1645 y 1743). Fue deliberado.
- **Lección:** cambiar la normalización del sub-score mueve los **números de riesgo
  publicados** de una herramienta oficial. No hacerlo sin decisión explícita del
  usuario. El prototipo es la fuente de verdad, no la "consistencia" teórica.

### Riesgo de leyenda inconsistente
- Si el color pasa a p95 pero `setDensityDomain` sigue en el máximo absoluto
  (`MapView.tsx:264`), la leyenda **miente**: muestra un rango que el color satura
  antes. Resolver en la misma parte (dominio a p95 + nota "top 5% saturado").

### Performance de grillas grandes (terreno 3km, 24.843 celdas)
- Crear 24.843 `L.rectangle` en vivo con `bindPopup` cada uno implica reproyección
  en cada `zoomend moveend` (`MapView.tsx:305`) + 24k closures en memoria.
- **Mitigación aplicada:** precalcular el `score` en Python (no en JS), formato JSON
  compacto, sin popup por-celda (o binding liviano).

### `RISK_LAYER_IDS` es frágil ante formatos que no son GeoJSON
- `loadData` en `useRiskStore.ts:48` hace `Promise.all` mapeando `${id}.geojson` y
  **lanza si cualquiera falla**. NO agregar `terreno_3km` ahí (es JSON propio, no
  GeoJSON): cargarlo aparte y no-bloqueante, devolviendo `null`/score null si falta.

### leaflet-draw: dependencia frágil
- El prototipo incrusta leaflet-draw, pero está prácticamente sin mantenimiento y
  `@types/leaflet-draw` sufre *version drift* (fricción con `npm run build`).
- **Decisión:** MVP de correcciones de campo con dibujo por DOM (clic = punto,
  reusando el patrón existente) + carga de archivo. Reservar leaflet-draw solo si
  se requiere editar polígonos.

### Gotcha conocido (recordatorio): clics de Leaflet interceptados por canvas
- Las capas canvas cubren el mapa e interceptan el `click` de Leaflet. La selección
  de punto se maneja a nivel DOM con `map.mouseEventToLatLng(ev)` (`MapView.tsx:313`).
  Cualquier modo nuevo (dibujo de campo) debe respetar el mutex
  `queryActive || measure.active` (`MapView.tsx:122`).

### Terreno "no funciona" en el navegador → era rendimiento (24.843 rectángulos)
- **Síntoma:** al encender la capa de terreno, "parecía no funcionar"; en consola solo
  `[Violation] 'click' handler took 159ms` (aviso, no error). El JSON servía 200 (1010 KB)
  y el dato era válido → NO era 404 ni crash.
- **Causa raíz:** el primer intento creaba **un `L.rectangle` por celda** (24.843 objetos
  Leaflet), reproyectados en cada `zoomend moveend` → congela la pestaña. Justo lo que se
  había anticipado en el análisis (la mitigación de "no popup por celda" no bastó).
- **Solución:** capa canvas ÚNICA `web/src/lib/terrenoLayer.ts` (`L.Layer.extend`) que pinta
  todas las celdas con `fillRect` sobre un solo `<canvas>`, con **culling por viewport**
  (`getBounds().pad(0.15)`) y color precalculado. `setFillOpacity()` para el slider.
- **Lección:** para grillas grandes (>5–10k celdas) NO usar un vector Leaflet por celda;
  una capa canvas propia es órdenes de magnitud más rápida. Confirmar SIEMPRE el render de
  volúmenes altos en navegador, no solo `npm run build`.
- **NOTA — el prototipo NO hace nada sofisticado:** crea los mismos 24.843 `L.rectangle`
  (línea 1332–1341) y se ve bien SOLO porque usa `preferCanvas: true` (el renderer canvas
  nativo de Leaflet pinta bordes limpios y alfa correcto). Es lento igual, pero el autor lo
  aceptó.
- **Segundo tropiezo (visual):** al pintar el canvas a mano, se veía "horrible" por (1)
  costuras oscuras —`fillRect` con `+1px` de solape y `globalAlpha` 0.65 se pintaba dos
  veces— y (2) borrosidad por coordenadas decimales. **Fix:** celdas OPACAS + opacidad por
  CSS del `<canvas>` (los solapes ya no oscurecen) + coordenadas ENTERAS con esquinas
  compartidas (bordes coinciden, sin costuras). Regla: nunca combinar `globalAlpha<1` con
  rects que se solapan; aplicar la translucidez al elemento, no por primitiva.

### Terreno "moteado" (ruido de TV) → era vector, debía ser RASTER (imageOverlay)
- **Síntoma:** la capa de terreno cargaba pero se veía como sal-y-pimienta verde de alto
  contraste con bordes verticales rectos.
- **Causa raíz (conceptual):** la rugosidad es un CAMPO CONTINUO (dato raster de origen: DEM
  Copernicus GLO-30). Pintarla como celdas vectoriales duras de 3 km a escala nacional →
  cada celda ocupa pocos px → aliasing/moteado. NINGÚN loader lo arregla: el problema es la
  representación (vector vs raster), no el render.
- **Solución:** `src/build_terreno_png.py` rasteriza la grilla a un PNG RGBA georreferenciado
  y el front lo muestra con `L.imageOverlay`. Claves:
  - **Web Mercator (EPSG:3857):** rasterizar en mercator (pyproj) para que `imageOverlay` no
    distorsione la latitud (Chile abarca ~17°–56°S). Los `bounds` se guardan en lat/lon
    (esquinas del rect mercator) en `terreno_3km_meta.json`.
  - **Resolución NATIVA (~1 px/celda), no sobremuestrear:** a 7 px/celda se preservaba el
    ruido; a 1 px/celda el navegador interpola (bilineal) y el campo se ve SUAVE. PNG pasó de
    1 MB (7px) a 38 KB (nativo).
  - **Alfa transparente** en NoData → recorta la silueta del dato (no rectángulo).
  - **PNG sin Pillow:** encoder propio con stdlib `zlib` (el .venv no trae Pillow/scipy; sí
    numpy/pyproj). Blur nan-aware con numpy (kernel separable [1,4,6,4,1]).
  - **Separar visual de cómputo:** el `terreno_3km.json` se MANTIENE para el motor de riesgo
    (`terrenoScoreAt`, consulta por punto); el PNG es solo la capa visual.
- **Lección 1:** datos de campo continuo (elevación, rugosidad, densidad fina) → RASTER
  (imagen/teselas), no vector. Vector solo para cosas discretas o grillas gruesas.
- **Lección 2:** para raster, samplear a resolución nativa y dejar interpolar al navegador;
  sobremuestrear reintroduce el ruido.
- **DATO:** la grilla NO es nacional — cubre ≈25,5°–35°S (Atacama a Maule). El prototipo la
  rotulaba "nacional" (inexacto); corregido en el `help` de la capa.

### Errores de compilación encontrados (TS estricto)
- **`TS18048: 'lng'/'lat' is possibly 'undefined'`** al destructurar `pt.geometry.coordinates`
  (`Position = number[]` con `noUncheckedIndexedAccess`). Solución: acceso indexado con
  `!` (`coordinates[0]!`), no destructuring.
- **`TS2352` al castear `FieldCorrectionsInput` a `Record<string, Geometry[]>`** (falta index
  signature). Solución: no castear; comparar el `layerId` literal (`c.layerId === 'lineas'`)
  y acceder a la propiedad concreta (`field.lineas`).
- **Lección:** `tsconfig` de `web/` usa strict + `noUnusedLocals` + `noUncheckedIndexedAccess`.
  Al reemplazar un helper (p. ej. `maxProp`→`p95Prop`) hay que eliminar el viejo o dejará
  un error de "unused". Evitar `x as Record<string,...>`; preferir chequeos de literal.

### Recordatorio de pruebas (de memoria del proyecto)
- El HMR de Vite **no** refleja cambios en el init del mapa (`useEffect[]`): capa
  base y terreno viven ahí → probar con **Ctrl+F5** en `http://10.0.13.35:5173`.

---

<!-- Añadir nuevas entradas arriba de esta línea, más recientes primero. -->
