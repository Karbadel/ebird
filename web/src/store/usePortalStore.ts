import { create } from 'zustand';
import type { Observation } from '../types';

export type Tab = 'lista' | 'especies' | 'tabla' | 'sitios' | 'riesgo' | 'tiempo' | 'comite' | 'colisiones';

export interface PortalLayer {
  id: string;
  n: string;
  src: string;
  sw: string;
  on: boolean;
  pend?: boolean;
}

const LAYERS: PortalLayer[] = [
  // Riesgo (superficies)
  { id: 'habitat', n: 'Idoneidad de hábitat', src: 'Estrada Pacheco et al. 2025', sw: 'linear-gradient(90deg,#1c8eb0,#f5f3b6,#da3726)', on: true },
  { id: 'ebird_densidad', n: 'Densidad de avistamientos (eBird)', src: 'eBird · 75.111 registros', sw: 'linear-gradient(90deg,#fff7ec,#fc8d59,#990000)', on: false },
  // Observaciones eBird (tiempo real)
  { id: 'obs', n: 'Observaciones eBird', src: 'API eBird 2.0 · ≤ 30 días', sw: 'var(--color-accent-200)', on: true },
  // Biológico
  { id: 'nidos', n: 'Nidos de cóndor (evidencia eBird)', src: 'eBird C3/C4 · 81 sitios', sw: '#ff00a5', on: false },
  { id: 'colisiones', n: 'Colisiones de cóndor confirmadas', src: 'Registro consolidado', sw: '#111111', on: false },
  // Infraestructura
  { id: 'wind', n: 'Parques eólicos', src: 'MINENERGIA', sw: '#c0392b', on: false },
  { id: 'lineas', n: 'Líneas de transmisión', src: 'Coordinador · SIC', sw: '#2c6ea6', on: false },
  // Atrayentes de carroña
  { id: 'vertederos', n: 'Vertederos (formales e ilegales)', src: 'MMA', sw: '#8a4b12', on: false },
  { id: 'veranadas', n: 'Veranadas (trashumancia)', src: 'Ganadería', sw: '#2e7d32', on: false },
  // Capas KMZ
  { id: 'turb', n: 'Aerogeneradores', src: 'MINENERGIA · jun 2026', sw: '#2c455d', on: false },
  { id: 'protected', n: 'Áreas Protegidas (SNAP)', src: 'MMA 2024', sw: 'var(--color-accent-300)', on: false },
  { id: 'airports', n: 'Aeropuertos y conos de aproximación', src: 'DGAC', sw: 'var(--color-neutral-500)', on: false },
  // Pendientes
  { id: 'projects', n: 'Proyectos de Energía', src: '*.kmz IDE Energía', sw: 'var(--color-accent-600)', on: false, pend: true },
  { id: 'windpot', n: 'Potencial eólico', src: '*.kmz MINENERGIA', sw: '#d8b445', on: false, pend: true },
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
  tab: 'lista',
  activeSite: null,
  panelHidden: false,
  flyTarget: null,
  species: null,
  sheetOpen: false,
  titleCollapsed: false,
  statCollapsed: false,

  toggleLayer: (id) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, on: !l.on } : l)) })),
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
