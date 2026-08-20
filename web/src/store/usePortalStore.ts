import { create } from 'zustand';
import type { FeatureCollection } from 'geojson';
import type { Observation } from '../types';

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
}

/** Capa cargada por el usuario desde un archivo KML/KMZ. */
export interface UserLayer {
  id: string;
  name: string;
  geojson: FeatureCollection;
  on: boolean;
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
  { id: 'habitat', group: 'condor', n: 'Idoneidad del hábitat', src: 'Estrada Pacheco et al. 2025', sw: 'linear-gradient(90deg,#1c8eb0,#f5f3b6,#da3726)', on: true, opacity: 0.6 },
  { id: 'obs', group: 'condor', n: 'Registros (eBird)', src: 'API eBird 2.0 · ≤ 30 días', sw: '#2c6a5b', on: true },
  { id: 'nidos', group: 'condor', n: 'Nidos y dormideros (eBird)', src: 'eBird C3/C4 · 81 sitios', sw: '#ff00a5', on: false },
  { id: 'colisiones', group: 'condor', n: 'Colisiones confirmadas', src: 'Parques eólicos 2019–2025 · 29 registros', sw: '#a4441e', on: false },
  // Atrayentes de carroña
  { id: 'vertederos', group: 'carrona', n: 'Vertederos (formales e ilegales)', src: 'MMA', sw: '#8a4b12', on: false },
  { id: 'veranadas', group: 'carrona', n: 'Veranadas', src: 'Ganadería (trashumancia)', sw: '#6f7a45', on: false },
  { id: 'ganado_bovino', group: 'carrona', n: 'Ganado bovino', src: 'Ganadería · cabezas por distrito', sw: '#b5651d', on: false },
  { id: 'ganado_ovino', group: 'carrona', n: 'Ganado ovino', src: 'Ganadería · cabezas por distrito', sw: '#caa472', on: false },
  { id: 'ganado_caprino', group: 'carrona', n: 'Ganado caprino', src: 'Ganadería · cabezas por distrito', sw: '#9c7a3c', on: false },
  // Otras especies
  { id: 'ebird_densidad', group: 'otras', n: 'Densidad de avistamientos', src: 'eBird · 75.111 registros', sw: 'linear-gradient(90deg,#fff7ec,#fc8d59,#990000)', on: false, opacity: 0.55 },
  // Infraestructura energética
  { id: 'wind', group: 'eolico', n: 'Parques Eólicos (OPC)', src: 'MINENERGIA', sw: '#c0392b', on: false },
  { id: 'turb', group: 'eolico', n: 'Aerogeneradores', src: 'MINENERGIA · jun 2026', sw: '#8f8168', on: false },
  { id: 'lineas', group: 'eolico', n: 'Líneas de Transmisión', src: 'Coordinador · SIC', sw: '#35617a', on: false },
  { id: 'projects', group: 'eolico', n: 'Otros proyectos de energía', src: '*.kmz IDE Energía', sw: '#c07a2b', on: false, pend: true },
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
  /** Especie seleccionada (persiste; alimenta los plates), o null. */
  species: Observation | null;
  /** Visibilidad de la ficha de detalle (desacoplada de la selección). */
  sheetOpen: boolean;
  /** Paneles flotantes contraídos a pestaña lateral. */
  titleCollapsed: boolean;
  statCollapsed: boolean;

  toggleLayer(id: string): void;
  setOpacity(id: string, value: number): void;
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
  species: null,
  sheetOpen: false,
  titleCollapsed: false,
  statCollapsed: false,

  toggleLayer: (id) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, on: !l.on } : l)) })),
  setOpacity: (id, value) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, opacity: value } : l)) })),
  // Apaga todas las capas conmutables (deja las pendientes/por-cargar como están)
  // y las capas de usuario cargadas.
  clearLayers: () =>
    set((s) => ({
      layers: s.layers.map((l) => (l.pend ? l : { ...l, on: false })),
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
  // asegura que el panel esté visible.
  goToTab: (tab) => set({ tab, sheetOpen: false, panelHidden: false }),
  setActiveSite: (activeSite) => set({ activeSite }),
  togglePanel: () => set((s) => ({ panelHidden: !s.panelHidden })),
  fly: (flyTarget) => set({ flyTarget }),
  consumeFly: () => set({ flyTarget: null }),
  // Elegir una especie: fija la selección (persiste) y abre la ficha, dejando
  // los plates visibles y expandidos.
  openSpecies: (species) => set({ species, sheetOpen: true, titleCollapsed: false, statCollapsed: false }),
  // La × solo cierra la ficha; la selección y los plates permanecen.
  closeSpecies: () => set({ sheetOpen: false }),
  openSheet: () => set((s) => (s.species ? { sheetOpen: true } : {})),
  toggleTitleCollapsed: () => set((s) => ({ titleCollapsed: !s.titleCollapsed })),
  toggleStatCollapsed: () => set((s) => ({ statCollapsed: !s.statCollapsed })),
}));
