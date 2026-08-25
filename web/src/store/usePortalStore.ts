import { create } from 'zustand';
import type { FeatureCollection } from 'geojson';
import type { Observation } from '../types';
import { GEN_SWATCH } from '../data/portal';
import { useRiskStore } from './useRiskStore';
import { useFieldStore } from './useFieldStore';

export type Tab = 'lista' | 'especies' | 'tabla' | 'sitios' | 'riesgo' | 'tiempo' | 'comite' | 'colisiones' | 'ficha';

export type LayerGroupId = 'condor' | 'carrona' | 'otras' | 'eolico' | 'contexto';

export interface PortalLayer {
  id: string;
  group: LayerGroupId;
  n: string;
  src: string;
  sw: string;
  on: boolean;
  pend?: boolean;
  /** Si está definido, la capa expone un control de opacidad (0–1). */
  opacity?: number;
  /** Si está definido, la capa expone un control de buffer de proximidad
   *  (anillo visual alrededor de cada elemento). `km` es el radio; `on` su
   *  visibilidad. Es puramente visual: NO altera el índice de riesgo. */
  buffer?: { on: boolean; km: number };
  /** Nota metodológica: muestra un botón (?) con este texto explicativo. */
  help?: string;
}

/** Capa cargada por el usuario desde un archivo KML/KMZ. */
export interface UserLayer {
  id: string;
  name: string;
  geojson: FeatureCollection;
  on: boolean;
}

/** Comuna del buscador (navegar + resaltar). `cut` cruza con comunas.geojson. */
export interface Comuna {
  cut: number;
  nombre: string;
  lat: number;
  lon: number;
  region?: string;
}

/** Títulos y orden de los grupos de capas del sidebar (acotado a cóndor). */
export const LAYER_GROUPS: { id: LayerGroupId; title: string }[] = [
  { id: 'condor', title: 'Cóndor' },
  { id: 'carrona', title: 'Atrayentes de carroña' },
  { id: 'otras', title: 'Otras especies' },
  { id: 'eolico', title: 'Infraestructura energética' },
  { id: 'contexto', title: 'Contexto territorial' },
];

const LAYERS: PortalLayer[] = [
  // Cóndor
  { id: 'habitat', group: 'condor', n: 'Idoneidad del hábitat', src: 'Estrada Pacheco et al. 2025', sw: 'linear-gradient(90deg,#1c8eb0,#f5f3b6,#da3726)', on: true, opacity: 0.6, help: 'Grilla de 30×30 km digitalizada de forma provisional a partir de la figura publicada (Estrada Pacheco et al. 2025); reemplazar por el raster oficial en cuanto esté disponible. No usar para diferenciar riesgo entre aerogeneradores de un mismo parque.' },
  { id: 'obs', group: 'condor', n: 'Registros (eBird)', src: 'API eBird 2.0 · ≤ 30 días', sw: '#2c6a5b', on: true },
  { id: 'nidos', group: 'condor', n: 'Nidos y dormideros (eBird)', src: 'eBird C3/C4 · 81 sitios', sw: '#ff00a5', on: false, buffer: { on: false, km: 5 } },
  { id: 'terreno_3km', group: 'condor', n: 'Pendiente / rugosidad del terreno (3km)', src: 'DEM Copernicus GLO-30 (Google Earth Engine)', sw: 'linear-gradient(90deg,#f7fcf5,#41ab5d,#00441b)', on: false, opacity: 0.65, help: 'Grilla de 3×3 km (24.843 celdas) calculada desde el DEM Copernicus GLO-30 en Google Earth Engine. Cobertura regional: ≈ Atacama a Maule (25,5°–35°S), no todo el país. Score = 65% pendiente media (normalizada 0–35°) + 35% rugosidad, medida como desviación estándar de la altitud dentro de la celda (normalizada 0–350 m). Proxy de complejidad topográfica (turbulencia / riesgo para aves planeadoras); complementa —no reemplaza— la idoneidad de hábitat (30 km). NO incorpora parámetros de vuelo del cóndor.' },
  { id: 'colisiones', group: 'condor', n: 'Colisiones confirmadas', src: 'Parques eólicos 2019–2025 · 29 registros', sw: '#a4441e', on: false, buffer: { on: false, km: 5 } },
  // Atrayentes de carroña
  { id: 'vertederos', group: 'carrona', n: 'Vertederos (formales e ilegales)', src: 'MMA', sw: '#8a4b12', on: false, buffer: { on: false, km: 10 } },
  { id: 'veranadas', group: 'carrona', n: 'Veranadas', src: 'Ganadería (trashumancia)', sw: '#6f7a45', on: false, buffer: { on: false, km: 15 } },
  { id: 'ganado_bovino', group: 'carrona', n: 'Ganado bovino', src: 'Ganadería · cabezas por distrito', sw: '#b5651d', on: false },
  { id: 'ganado_ovino', group: 'carrona', n: 'Ganado ovino', src: 'Ganadería · cabezas por distrito', sw: '#caa472', on: false },
  { id: 'ganado_caprino', group: 'carrona', n: 'Ganado caprino', src: 'Ganadería · cabezas por distrito', sw: '#9c7a3c', on: false },
  // Otras especies
  { id: 'ebird_densidad', group: 'otras', n: 'Densidad de avistamientos', src: 'eBird · 75.111 registros', sw: 'linear-gradient(90deg,#fff7ec,#fc8d59,#990000)', on: false, opacity: 0.55, help: '75.111 registros de eBird (Chile+Argentina, filtrado a 36.012 en Chile) agregados por celda como número de localidades distintas con registro — mide esfuerzo/densidad de observación, no necesariamente abundancia real de cóndores (fuerte sesgo hacia sitios con más observadores, ej. Santiago y Torres del Paine). Cita sugerida: eBird. 2026. eBird Basic Dataset. Cornell Lab of Ornithology, Ithaca, New York.' },
  // Infraestructura energética
  { id: 'wind', group: 'eolico', n: 'Parques Eólicos (OPC)', src: 'MINENERGIA', sw: '#c0392b', on: false, buffer: { on: false, km: 2 } },
  { id: 'turb', group: 'eolico', n: 'Aerogeneradores', src: 'MINENERGIA · jun 2026', sw: '#8f8168', on: false },
  { id: 'lineas', group: 'eolico', n: 'Líneas de Transmisión', src: 'Coordinador · SIC', sw: '#35617a', on: false, buffer: { on: false, km: 1 } },
  { id: 'projects', group: 'eolico', n: 'Instalaciones y proyectos de generación', src: 'MINENERGIA · jun 2026 · 2.123 · por estado', sw: GEN_SWATCH, on: false, help: 'Catastro nacional de instalaciones y proyectos de generación eléctrica de todas las tecnologías, coloreado por estado del proyecto (de en calificación a en operación). Fuente: MINENERGIA, junio 2026. Composición: Solar FV 1.400, Termoeléctrico 242, Hidro 248, Eólico 180, Bioenergía 46, Solar CSP 5, Geotermia 2. Capa de contexto energético nacional; para el análisis de riesgo del cóndor la infraestructura directamente relevante es la eólica (ver capas de Parques Eólicos y Aerogeneradores).' },
  { id: 'windpot', group: 'eolico', n: 'Potencial Eólico', src: '*.kmz MINENERGIA', sw: '#de9426', on: false, pend: true },
  // Contexto territorial
  { id: 'protected', group: 'contexto', n: 'Áreas Protegidas', src: 'MMA 2024', sw: '#2c6a5b', on: false },
  { id: 'airports', group: 'contexto', n: 'Aeropuertos y conos de aproximación', src: 'DGAC', sw: '#98989b', on: false },
];

interface PortalState {
  layers: PortalLayer[];
  /** Capas cargadas por el usuario (KML/KMZ). */
  userLayers: UserLayer[];
  legendOpen: boolean;
  tab: Tab;
  activeSite: string | null;
  panelHidden: boolean;
  flyTarget: [number, number] | null;
  /** Comuna seleccionada en el buscador (para volar y resaltar su límite). */
  activeComuna: Comuna | null;
  /** Rango [min, max] de localidades/celda de la capa de densidad, para la
   *  leyenda; null hasta que la capa se carga. */
  densityDomain: [number, number] | null;
  /** Capa base del mapa: cartografía OSM o imagen satelital (Esri). */
  baseLayer: 'osm' | 'satellite';
  /** Especie seleccionada (persiste; alimenta los plates), o null. */
  species: Observation | null;
  /** Visibilidad de la ficha de detalle (desacoplada de la selección). */
  sheetOpen: boolean;
  /** Paneles flotantes contraídos a pestaña lateral. */
  titleCollapsed: boolean;
  statCollapsed: boolean;

  toggleLayer(id: string): void;
  setOpacity(id: string, value: number): void;
  /** Enciende/apaga el buffer de proximidad de una capa (solo visual). */
  toggleBuffer(id: string): void;
  /** Fija el radio (km) del buffer de proximidad de una capa. */
  setBufferKm(id: string, km: number): void;
  clearLayers(): void;
  addUserLayer(name: string, geojson: FeatureCollection): void;
  toggleUserLayer(id: string): void;
  removeUserLayer(id: string): void;
  toggleLegend(): void;
  setTab(tab: Tab): void;
  goToTab(tab: Tab): void;
  setActiveSite(loc: string | null): void;
  togglePanel(): void;
  fly(ll: [number, number]): void;
  consumeFly(): void;
  /** Selecciona (o limpia) la comuna del buscador; al seleccionar, vuela a ella. */
  setComuna(c: Comuna | null): void;
  /** Fija el rango de la capa de densidad (lo calcula MapView al cargarla). */
  setDensityDomain(d: [number, number] | null): void;
  /** Cambia la capa base del mapa (OSM ↔ satélite). */
  setBaseLayer(b: 'osm' | 'satellite'): void;
  openSpecies(o: Observation): void;
  closeSpecies(): void;
  openSheet(): void;
  toggleTitleCollapsed(): void;
  toggleStatCollapsed(): void;
}

export const usePortalStore = create<PortalState>((set) => ({
  layers: LAYERS,
  userLayers: [],
  legendOpen: true,
  // Por defecto (home) se muestra la ficha de la especie, no la lista.
  tab: 'ficha',
  activeSite: null,
  panelHidden: false,
  flyTarget: null,
  activeComuna: null,
  densityDomain: null,
  baseLayer: 'osm',
  species: null,
  sheetOpen: false,
  titleCollapsed: false,
  statCollapsed: false,

  toggleLayer: (id) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, on: !l.on } : l)) })),
  setOpacity: (id, value) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, opacity: value } : l)) })),
  toggleBuffer: (id) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id && l.buffer ? { ...l, buffer: { ...l.buffer, on: !l.buffer.on } } : l,
      ),
    })),
  setBufferKm: (id, km) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id && l.buffer ? { ...l, buffer: { ...l.buffer, km } } : l,
      ),
    })),
  // Apaga todas las capas conmutables (deja las pendientes/por-cargar como están)
  // y las capas de usuario cargadas. También apaga los buffers de proximidad.
  clearLayers: () =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.pend ? l : { ...l, on: false, ...(l.buffer ? { buffer: { ...l.buffer, on: false } } : {}) },
      ),
      userLayers: s.userLayers.map((u) => ({ ...u, on: false })),
    })),
  addUserLayer: (name, geojson) =>
    set((s) => ({
      userLayers: [...s.userLayers, { id: `user-${Date.now().toString(36)}`, name, geojson, on: true }],
    })),
  toggleUserLayer: (id) =>
    set((s) => ({ userLayers: s.userLayers.map((u) => (u.id === id ? { ...u, on: !u.on } : u)) })),
  removeUserLayer: (id) => set((s) => ({ userLayers: s.userLayers.filter((u) => u.id !== id) })),
  toggleLegend: () => set((s) => ({ legendOpen: !s.legendOpen })),
  setTab: (tab) => set({ tab }),
  // Navegación desde el riel lateral: cambia de pestaña, cierra la ficha y
  // asegura que el panel esté visible. Al salir de Riesgo, apaga la consulta y
  // cierra su ficha de resultado para que la pestaña destino tome el panel (si
  // no, seguiría el modo clic-consulta y el SiteSheet sobre el mapa).
  goToTab: (tab) => {
    if (tab !== 'riesgo') {
      const risk = useRiskStore.getState();
      risk.stopQuery();
      risk.clearResult();
      // También desactiva el modo de dibujo de correcciones para que los clics en
      // otras pestañas no suelten puntos por accidente.
      useFieldStore.getState().setDrawType('ninguno');
    }
    set({ tab, sheetOpen: false, panelHidden: false });
  },
  setActiveSite: (activeSite) => set({ activeSite }),
  togglePanel: () => set((s) => ({ panelHidden: !s.panelHidden })),
  fly: (flyTarget) => set({ flyTarget }),
  consumeFly: () => set({ flyTarget: null }),
  // El encuadre lo resuelve MapView (fitBounds al polígono); aquí solo se fija la
  // comuna activa (o se limpia).
  setComuna: (c) => set({ activeComuna: c }),
  setDensityDomain: (densityDomain) => set({ densityDomain }),
  setBaseLayer: (baseLayer) => set({ baseLayer }),
  // Elegir una especie: fija la selección (persiste) y abre la ficha, dejando
  // los plates visibles y expandidos.
  openSpecies: (species) => set({ species, sheetOpen: true, titleCollapsed: false, statCollapsed: false }),
  // La × solo cierra la ficha; la selección y los plates permanecen.
  closeSpecies: () => set({ sheetOpen: false }),
  openSheet: () => set((s) => (s.species ? { sheetOpen: true } : {})),
  toggleTitleCollapsed: () => set((s) => ({ titleCollapsed: !s.titleCollapsed })),
  toggleStatCollapsed: () => set((s) => ({ statCollapsed: !s.statCollapsed })),
}));
