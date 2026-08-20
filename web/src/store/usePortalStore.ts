import { create } from 'zustand';
import type { Observation } from '../types';

export type Tab = 'lista' | 'especies' | 'tabla' | 'sitios' | 'riesgo' | 'tiempo' | 'comite' | 'colisiones' | 'ficha';

export type LayerGroupId = 'superf' | 'condor' | 'colis' | 'eolico' | 'carrona' | 'contexto' | 'pend';

export interface PortalLayer {
  id: string;
  group: LayerGroupId;
  n: string;
  src: string;
  sw: string;
  on: boolean;
  pend?: boolean;
}

/** Títulos y orden de los grupos de capas del sidebar (acotado a cóndor). */
export const LAYER_GROUPS: { id: LayerGroupId; title: string }[] = [
  { id: 'superf', title: 'Riesgo · superficies' },
  { id: 'condor', title: 'Cóndor' },
  { id: 'colis', title: 'Colisiones y mortalidad' },
  { id: 'eolico', title: 'Infraestructura eólica' },
  { id: 'carrona', title: 'Atrayentes de carroña' },
  { id: 'contexto', title: 'Contexto territorial' },
  { id: 'pend', title: 'Por cargar' },
];

const LAYERS: PortalLayer[] = [
  // Riesgo · superficies
  { id: 'habitat', group: 'superf', n: 'Idoneidad de hábitat del cóndor', src: 'Estrada Pacheco et al. 2025', sw: 'linear-gradient(90deg,#1c8eb0,#f5f3b6,#da3726)', on: true },
  { id: 'ebird_densidad', group: 'superf', n: 'Densidad de avistamientos', src: 'eBird · 75.111 registros', sw: 'linear-gradient(90deg,#fff7ec,#fc8d59,#990000)', on: false },
  // Cóndor
  { id: 'obs', group: 'condor', n: 'Registros de cóndor (eBird)', src: 'API eBird 2.0 · ≤ 30 días', sw: '#2c6a5b', on: true },
  { id: 'nidos', group: 'condor', n: 'Nidos y dormideros', src: 'eBird C3/C4 · 81 sitios', sw: '#ff00a5', on: false },
  { id: 'veranadas', group: 'condor', n: 'Veranadas (trashumancia)', src: 'Ganadería', sw: '#6f7a45', on: false },
  // Colisiones y mortalidad
  { id: 'colisiones', group: 'colis', n: 'Colisiones confirmadas', src: 'Registro consolidado · 29 casos', sw: '#a4441e', on: false },
  // Infraestructura eólica
  { id: 'wind', group: 'eolico', n: 'Parques eólicos', src: 'MINENERGIA', sw: '#c0392b', on: false },
  { id: 'turb', group: 'eolico', n: 'Aerogeneradores', src: 'MINENERGIA · jun 2026', sw: '#8f8168', on: false },
  { id: 'lineas', group: 'eolico', n: 'Líneas de transmisión', src: 'Coordinador · SIC', sw: '#35617a', on: false },
  // Atrayentes de carroña
  { id: 'vertederos', group: 'carrona', n: 'Vertederos (formales e ilegales)', src: 'MMA', sw: '#8a4b12', on: false },
  // Contexto territorial
  { id: 'protected', group: 'contexto', n: 'Áreas Protegidas (SNAP)', src: 'MMA 2024', sw: '#2c6a5b', on: false },
  { id: 'airports', group: 'contexto', n: 'Aeropuertos y conos de aproximación', src: 'DGAC', sw: '#98989b', on: false },
  // Por cargar
  { id: 'projects', group: 'pend', n: 'Proyectos de Energía', src: '*.kmz IDE Energía', sw: '#c07a2b', on: false, pend: true },
  { id: 'windpot', group: 'pend', n: 'Potencial eólico', src: '*.kmz MINENERGIA', sw: '#de9426', on: false, pend: true },
];

interface PortalState {
  layers: PortalLayer[];
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
  clearLayers(): void;
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
  // Apaga todas las capas conmutables (deja las pendientes/por-cargar como están).
  clearLayers: () => set((s) => ({ layers: s.layers.map((l) => (l.pend ? l : { ...l, on: false })) })),
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
