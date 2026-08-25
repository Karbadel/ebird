# Plan de implementación — "eBird Chile Explorer"

## Visión
App web (React + Leaflet) que muestra observaciones de aves en un mapa de Chile
con pins de ubicación y un panel de filtros para individualizar una o varias
aves por: especie (ES/EN/científico), taxonomía, ubicación, fecha, estado y
cantidad.

## Decisiones confirmadas
- **Alcance de datos:** Todo Chile, observaciones recientes de la API (≤30 días).
- **Primer paso:** Generar el mockup (diseño) antes de codear.
- **Stack:** Vite + React + TypeScript + Tailwind + react-leaflet + Zustand +
  leaflet.markercluster.

## Arquitectura (sin backend)
Python fetcher (API eBird, ES+EN) → JSON estáticos → React + Leaflet (navegador).
La API key queda solo en el script Python (no se expone en el navegador).
Limitación: la API solo da observaciones ≤30 días. Fase futura: alimentar los
mismos JSON desde el EBD histórico.

## Datasets (Python → JSON)
| Archivo | Contenido | Campos clave |
|---|---|---|
| especies.json | Catálogo | speciesCode, nombreEs, nombreEn, sciName, orden, familia, taxonOrder, category |
| observaciones.json | Obs. recientes (detail=full) | speciesCode, lat, lng, fecha, cantidad, locId, locNombre, region, comuna, observador, validado, revisado, exotica, subId, tieneMedia |
| hotspots.json | Hotspots | locId, nombre, lat, lng, region, numEspecies |
| regiones.json | Regiones de Chile | code, nombre |

Nombres en español vía taxonomía con `locale=es` + `locale=en`, unidos por speciesCode.

## Componentes
App → Sidebar (SpeciesSearch, TaxonomyFilter, LocationFilter, DateRangeFilter,
StatusFilter, ResultsSummary) + MapView (MarkerCluster, ObsMarker, MapLegend) +
DetailPanel.

## Filtros (combinables)
Especie (multiselección, busca ES/EN/sci), Taxonomía (orden→familia cascada),
Ubicación (región→hotspot), Fecha (rango), Estado (validado/revisado/exótica),
Cantidad (slider).

## Estructura de carpetas
```
ebird/
├── data-pipeline/   # Python: ebird_api.py, build_dataset.py, .env
├── web/             # React: src/{components,store,types,data}
└── mockup/          # Mockup HTML (diseño)
```

## Fases
0. Mockup (diseño)  ← EN CURSO
1. Datos: build_dataset.py genera los 4 JSON (ES/EN)
2. Esqueleto web: Vite + React + Tailwind + mapa básico con pins
3. Filtros: sidebar completo
4. Detalle + pulido: DetailPanel, leyenda, popups, clustering, responsive
5. (Futuro) EBD histórico
