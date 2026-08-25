import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

// Sincroniza el contador de IDs con el máximo `fc-N` presente. Se llama tras
// rehidratar desde localStorage para que las nuevas correcciones no colisionen
// con las persistidas (que ya usaron ids fc-1, fc-2, …).
function syncSeq(corrections: FieldCorrection[]) {
  seq = corrections.reduce((max, c) => {
    const n = Number(c.id.replace('fc-', ''));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
}

// El estado se persiste en localStorage (disco del navegador del usuario) para
// que las correcciones de campo sobrevivan a recargas/cierres de pestaña. Es una
// persistencia LOCAL (un solo navegador); compartir entre usuarios sigue siendo
// vía exportar/importar GeoJSON. No hay backend por diseño.
export const useFieldStore = create<FieldState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'condores_field_v1',
      version: 1,
      // Solo se persisten las correcciones: las funciones no son serializables y
      // el modo de dibujo debe arrancar en 'ninguno' tras recargar (no dejar el
      // mapa esperando clics de dibujo por accidente).
      partialize: (s) => ({ corrections: s.corrections }),
      // Tras rehidratar, ajusta el contador de IDs al máximo persistido.
      onRehydrateStorage: () => (state) => {
        if (state) syncSeq(state.corrections);
      },
    },
  ),
);
