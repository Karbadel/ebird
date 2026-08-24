# LOG DE ERRORES — Portal Cóndores (base de conocimiento)

> Registro de errores, tropiezos y decisiones no obvias que surgen durante el
> desarrollo. **Alimentar este archivo como input en la planeación de hitos
> futuros**: antes de planificar, leer esta bitácora para no repetir tropiezos.
>
> Formato de cada entrada: fecha · contexto · síntoma · causa raíz · solución · lección.

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
