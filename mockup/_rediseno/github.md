repo: Karbadel/ebird
branch: main
path: web/

## Last sync
date: 2026-08-19T16:52:00Z

### Updated in this project
- Recreación fiel del visor actual (header, sidebar de capas, plates flotantes, riel de pestañas, panel de resultados, secciones y footer).
- Tres propuestas de navegación con paleta cálida clara y paneles colapsables.

## Screen map
| Pantalla del proyecto | Archivos del repo |
|---|---|
| Visor Actual.dc.html | web/src/App.tsx, web/src/styles/app.css, web/src/styles/industry.css, web/src/components/PortalHeader.tsx, PortalSidebar.tsx, TitlePlate.tsx, StatPlate.tsx, ChipBar.tsx, MapControls.tsx, TabRail.tsx, ResultsPanel.tsx, SpeciesSheet.tsx, Sections.tsx, Footer.tsx, Icon.tsx, web/src/data/portal.ts, web/src/store/usePortalStore.ts, web/src/store/useFilterStore.ts, web/src/types.ts |
| Propuestas Navegacion.dc.html | web/src/store/usePortalStore.ts (capas), web/src/data/portal.ts (escala de riesgo), web/tailwind.config.js (paleta cálida original), web/src/components/TabRail.tsx, PortalSidebar.tsx |
