import { create } from 'zustand';
import type { Observation } from '../types';

export type Tab = 'lista' | 'tabla' | 'sitios' | 'especies' | 'tiempo' | 'comite' | 'colisiones';

export interface PortalLayer {
  id: string;
  n: string;
  src: string;
  sw: string;
  on: boolean;
  pend?: boolean;
}

const LAYERS: PortalLayer[] = [
  { id: 'risk', n: 'Mapa de Riesgo', src: 'Modelo demostrativo', sw: '#c9793c', on: true },
  { id: 'coll', n: 'Registro de colisiones de cóndores', src: 'Comité · registro consolidado', sw: 'var(--color-text)', on: true },
  { id: 'obs', n: 'Observaciones eBird', src: 'API eBird 2.0 · ≤ 30 días', sw: 'var(--color-accent-200)', on: true },
  { id: 'turb', n: 'Aerogeneradores', src: 'MINENERGIA · jun 2026', sw: '#2c455d', on: false },
  { id: 'parkAreas', n: 'Áreas de Parques Eólicos', src: '*.kmz MINENERGIA', sw: 'var(--color-accent-500)', on: false, pend: true },
  { id: 'protected', n: 'Áreas Protegidas (SNAP)', src: 'MMA 2024', sw: 'var(--color-accent-300)', on: false },
  { id: 'net', n: 'Infraestructura eléctrica', src: 'INE Energía', sw: '#2b2b2d', on: false },
  { id: 'projects', n: 'Proyectos de Energía', src: '*.kmz IDE Energía', sw: 'var(--color-accent-600)', on: false, pend: true },
  { id: 'airports', n: 'Aeropuertos y conos de aproximación', src: 'DGAC', sw: 'var(--color-neutral-500)', on: false },
  { id: 'windpot', n: 'Potencial eólico', src: '*.kmz MINENERGIA · Recurso Eólico en Chile', sw: '#d8b445', on: false, pend: true },
];

interface PortalState {
  layers: PortalLayer[];
  legendOpen: boolean;
  tab: Tab;
  activeSite: string | null;
  panelHidden: boolean;
  flyTarget: [number, number] | null;
  /** Especie abierta en la ficha, o null. */
  species: Observation | null;

  toggleLayer(id: string): void;
  toggleLegend(): void;
  setTab(tab: Tab): void;
  setActiveSite(loc: string | null): void;
  togglePanel(): void;
  fly(ll: [number, number]): void;
  consumeFly(): void;
  openSpecies(o: Observation): void;
  closeSpecies(): void;
}

export const usePortalStore = create<PortalState>((set) => ({
  layers: LAYERS,
  legendOpen: true,
  tab: 'lista',
  activeSite: null,
  panelHidden: false,
  flyTarget: null,
  species: null,

  toggleLayer: (id) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, on: !l.on } : l)) })),
  toggleLegend: () => set((s) => ({ legendOpen: !s.legendOpen })),
  setTab: (tab) => set({ tab }),
  setActiveSite: (activeSite) => set({ activeSite }),
  togglePanel: () => set((s) => ({ panelHidden: !s.panelHidden })),
  fly: (flyTarget) => set({ flyTarget }),
  consumeFly: () => set({ flyTarget: null }),
  openSpecies: (species) => set({ species }),
  closeSpecies: () => set({ species: null }),
}));
