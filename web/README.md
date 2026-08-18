# eBird Chile Explorer — handoff a Claude Code

Dashboard para explorar observaciones de aves de Chile sobre un mapa. Este bundle contiene
un **esqueleto real y ejecutable** (React 18 + TypeScript estricto + Vite + Tailwind) más el
**mockup HTML de referencia**, que es la fuente de verdad visual y de comportamiento.

## Cómo arrancar

```bash
npm install
npm run dev
```

## Qué hay en el bundle

```
index.html                     entry de Vite (fuentes Google + #root)
package.json                   react, react-dom, react-leaflet, leaflet,
                               leaflet.markercluster, zustand
tsconfig.json                  strict: true (+ noUncheckedIndexedAccess,
                               exactOptionalPropertyTypes)
tailwind.config.js             paleta y fuentes del mockup en theme.extend
postcss.config.js  vite.config.ts
src/main.tsx                   monta App; importa leaflet.css + MarkerCluster.css
src/index.css                   @tailwind + CSS suelto (grano de papel, tinte del mapa,
                               .pin, cluster, popups)
src/types.ts                   Observation, Group, Category, GROUPS (color/label por grupo)
src/data/mockObservations.ts   23 observaciones de ejemplo, tipadas
src/leaflet-markercluster.d.ts tipos mínimos (el paquete no trae los suyos; strict lo exige)
src/App.tsx                    layout grid Header / Sidebar / MapView / DetailPanel
src/components/MapView.tsx     FUNCIONAL
src/components/Header.tsx      parcial (falta buscador + toggle idioma)
src/components/Sidebar.tsx     STUB — // TODO
src/components/DetailPanel.tsx STUB — // TODO
reference/mockup.html          mockup original completo (referencia definitiva)
reference/preview.html         visor sin build del esqueleto actual (no es parte de la app)
```

Los archivos de `reference/` son **referencias de diseño**, no código para copiar: el
comportamiento final debe implementarse en el proyecto React/TS de este bundle.

## Estado actual

Hecho:
- Configs, tipos y datos.
- Layout: grid `340px 1fr` × `auto 1fr`, header a ancho completo.
- `MapView`: `react-leaflet` (`MapContainer` + `TileLayer` CARTO light) con
  `leaflet.markercluster`. Pins circulares de 20px vía `L.divIcon`, color por grupo
  (`GROUPS[grp].color`), anillo ámbar en `notable`, popup con nombre ES / EN / científico
  en itálica / fecha, conteo y localidad. Clusters redondos verde bosque, `maxClusterRadius: 48`.
  `onSelect` sube la observación a `App` (`selected`).

Pendiente (siguientes iteraciones, en este orden):
1. **Store Zustand** (`src/store/useFilters.ts`): filtros combinables — especie, taxonomía
   (orden/familia), ubicación (región/localidad), rango de fechas, estado (validado,
   revisado, exótica, notable), cantidad mínima. Selector derivado `filteredObservations`.
2. **Toggle idioma ES/EN**: afecta nombre común mostrado (`es` / `en`) y etiquetas de UI.
   El nombre científico siempre en itálica, sin traducir.
3. **Buscador con chips** en el header: texto libre sobre `es`/`en`/`sci`, resultados como
   chips removibles.
4. **DetailPanel**: panel derecho de 372px — plate con gradiente por grupo, taxonomía
   (orden → familia), grid de datos de observación, badges de estado, link a checklist (`sub`).
5. **fitBounds** sobre las observaciones filtradas al cambiar filtros.
6. **Responsive**: sidebar colapsable y DetailPanel a hoja inferior en móvil.

## Modelo de datos

```ts
type Group = 'acuatica' | 'marina' | 'rapaz' | 'passer' | 'loro' | 'otra';
type Category = 'especie' | 'exótica';

interface Observation {
  es: string;      // nombre común español
  en: string;      // nombre común inglés
  sci: string;     // nombre científico (render en itálica)
  grp: Group;      // grupo visual → color del pin
  order: string;   // orden taxonómico
  family: string;  // familia
  cat: Category;
  lat: number; lng: number;
  region: string;  // región administrativa
  loc: string;     // nombre de la localidad
  date: string;    // ISO YYYY-MM-DD
  count: number;   // individuos
  obs: string;     // observador
  valid: boolean;  // validado
  rev: boolean;    // revisado por revisor regional
  exo: boolean;    // exótica / introducida
  sub: string;     // id de checklist eBird (SNNNNNNNNN)
  notable: boolean;// registro notable → anillo ámbar
}
```

Los datos reales vendrían de la API de eBird (ventana de ≤30 días); `mockObservations.ts`
respeta la misma forma, así que puede sustituirse por un fetch sin tocar los componentes.

## Design tokens (ya en `tailwind.config.js`)

Color:
- `paper` `#f3ecdd` · `paper-2` `#ece2cd` · `paper-3` `#e4d8bf` · `card` `#fbf7ee`
- `ink` `#21281f` · `ink-soft` `#4c5347`
- `forest` `#1b4436` · `teal` `#2c6a5b` · `moss` `#6f7a45`
- `ochre` `#c07a2b` · `amber` `#de9426` · `rust` `#a4441e` · `sky` `#35617a`
- `line` `rgba(33,40,31,0.14)` · `line-strong` `rgba(33,40,31,0.28)`

Color por grupo (pins y acentos): acuatica `#2c6a5b`, marina `#35617a`, rapaz `#a4441e`,
passer `#6f7a45`, loro `#c07a2b`, otra `#4c5347`.

Tipografía:
- `font-display` Fraunces — títulos y nombres de aves (600); itálica 500 para científicos
- `font-ui` Archivo — toda la UI (400/500/600)
- `font-mono` Spline Sans Mono — cifras, fechas, IDs de checklist
- Micro-etiquetas: 10.5–11px, `uppercase`, `letter-spacing` 0.14–0.28em

Otros: sombra `shadow-field` = `0 18px 50px -18px rgba(27,38,30,0.45)`; radios 8–12px;
borde inferior del header 3px ámbar.

## Convenciones a mantener

- Estética de guía de campo naturalista: papel crema cálido, verdes bosque/teal, acentos
  ámbar/ocre. Sin gradientes agresivos ni emoji fuera de los glifos de grupo ya definidos.
- Tailwind para todo lo que sea layout y color; **CSS suelto en `src/index.css`** solo para
  lo que Tailwind no cubre: grano de papel (`body::before`), tinte cálido del mapa
  (`filter` sobre `.leaflet-tile-pane`), estilos de `.pin`, clusters y popups de Leaflet
  (viven fuera del árbol de React).
- TypeScript estricto: sin `any`, sin `!` salvo en el guard de `#root`.
- Nombres científicos siempre en itálica y nunca traducidos.

## Assets

Ninguno binario. Fuentes desde Google Fonts; tiles desde CARTO
(`light_all`, atribución OpenStreetMap · CARTO) — el tinte cálido es puro CSS.
