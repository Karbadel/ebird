import { create } from 'zustand';
import type { Geometry } from 'geojson';
import type { FieldCorrectionsInput } from '../lib/riskEngine';

export type FieldType = 'ganado' | 'lineas' | 'antenas';
/** 'ninguno' = dibujo de referencia visual que NO alimenta el índice de riesgo. */
export type DrawType = 'ninguno' | FieldType;

export interface FieldCorrection {
  id: string;
  tipo: FieldType;
  geometry: Geometry;
}

export const FIELD_STYLES: Record<DrawType, { color: string; label: string }> = {
  ninguno: { color: '#1e88e5', label: 'Referencia visual (no afecta el riesgo)' },
  ganado: { color: '#8d6e63', label: 'Corral / atrayente de ganado (campo)' },
  lineas: { color: '#e53935', label: 'Línea de transmisión (corrección de campo)' },
  antenas: { color: '#8e24aa', label: 'Antena de telecomunicaciones (percha/dormidero)' },
};

interface FieldState {
  /** Correcciones tipificadas que se suman en vivo al índice de riesgo. */
  corrections: FieldCorrection[];
  /** Tipo activo del selector de dibujo. */
  drawType: DrawType;
  setDrawType(t: DrawType): void;
  add(tipo: FieldType, geometry: Geometry): void;
  remove(id: string): void;
  clear(): void;
  /** Vista por tipo que consume el motor de riesgo. */
  asInput(): FieldCorrectionsInput;
  /** Serializa las correcciones como GeoJSON descargable. */
  toGeoJSON(): string;
}

let seq = 0;

export const useFieldStore = create<FieldState>((set, get) => ({
  corrections: [],
  drawType: 'ninguno',
  setDrawType: (drawType) => set({ drawType }),
  add: (tipo, geometry) => set((s) => ({ corrections: [...s.corrections, { id: `fc-${++seq}`, tipo, geometry }] })),
  remove: (id) => set((s) => ({ corrections: s.corrections.filter((c) => c.id !== id) })),
  clear: () => set({ corrections: [] }),
  asInput: () => {
    const out: FieldCorrectionsInput = { ganado: [], lineas: [], antenas: [] };
    for (const c of get().corrections) out[c.tipo].push(c.geometry);
    return out;
  },
  toGeoJSON: () =>
    JSON.stringify(
      {
        type: 'FeatureCollection',
        features: get().corrections.map((c) => ({ type: 'Feature', properties: { tipo: c.tipo }, geometry: c.geometry })),
      },
      null,
      2,
    ),
}));
