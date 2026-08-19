import { create } from 'zustand';
import distance from '@turf/distance';
import { point } from '@turf/helpers';

export interface MeasurePoint {
  lat: number;
  lng: number;
}

interface MeasureState {
  active: boolean;
  points: MeasurePoint[];

  toggle(): void;
  deactivate(): void;
  addPoint(lat: number, lng: number): void;
  undo(): void;
  clear(): void;
}

/** Herramienta de regla: modo activo + vértices trazados con clic en el mapa. */
export const useMeasureStore = create<MeasureState>((set) => ({
  active: false,
  points: [],

  toggle: () => set((s) => ({ active: !s.active })),
  deactivate: () => set({ active: false }),
  addPoint: (lat, lng) => set((s) => ({ points: [...s.points, { lat, lng }] })),
  undo: () => set((s) => ({ points: s.points.slice(0, -1) })),
  clear: () => set({ points: [] }),
}));

const KM = { units: 'kilometers' as const };

/** Distancia geodésica (turf) entre dos vértices, en km. */
export function segmentKm(a: MeasurePoint, b: MeasurePoint): number {
  return distance(point([a.lng, a.lat]), point([b.lng, b.lat]), KM);
}

/** Distancia acumulada de la polilínea completa, en km. */
export function totalKm(points: MeasurePoint[]): number {
  let t = 0;
  for (let i = 1; i < points.length; i++) t += segmentKm(points[i - 1]!, points[i]!);
  return t;
}

/** Formato humano: metros bajo 1 km, km con 2 decimales por encima. */
export function fmtKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(2)} km`;
}
