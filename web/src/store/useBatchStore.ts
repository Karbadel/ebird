import { create } from 'zustand';
import { riskAtPoint, type RiskRow } from '../lib/riskEngine';
import type { RiskCategory, RiskVar } from '../data/riskConfig';
import { useRiskStore } from './useRiskStore';
import { useFieldStore } from './useFieldStore';

export interface BatchRow {
  id: string;
  nombre: string;
  region: string;
  comuna: string;
  potenciaMw: number | null;
  lat: number;
  lng: number;
  total: number;
  category: RiskCategory;
  /** Desglose por criterio (para exportar el detalle al comité). */
  rows: RiskRow[];
}

export type BatchCol = 'nombre' | 'region' | 'potenciaMw' | 'total';

interface BatchState {
  rows: BatchRow[] | null;
  running: boolean;
  computedAt: number | null;
  /** Firma del config usado al calcular; si cambia, la tabla queda «desactualizada». */
  configSig: string | null;
  sortCol: BatchCol;
  sortDir: 'asc' | 'desc';
  run(): Promise<void>;
  setSort(col: BatchCol): void;
  clear(): void;
}

// `potencia_mw` viene como string ("1.400000000000000") en wind.geojson.
function numFrom(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

/** Firma compacta del config (id/enabled/weight/decay) para detectar cambios. */
export function configSignature(config: RiskVar[]): string {
  return config.map((c) => `${c.id}:${c.enabled ? 1 : 0}:${c.weight}:${c.decayKm ?? ''}`).join('|');
}

// Cede el hilo hasta el próximo frame: deja que el navegador pinte el spinner
// antes de bloquear con el cómputo, y evita congelar la pestaña entre lotes.
const nextFrame = (): Promise<void> => new Promise((res) => requestAnimationFrame(() => res()));

// Puntúa en lote los parques eólicos en operación (data['wind'], ya cargado por el
// motor) con los MISMOS pesos/config que la consulta puntual. Reutiliza riskAtPoint;
// no duplica lógica ni toca los números publicados. ~30 puntos → sub-segundo.
export const useBatchStore = create<BatchState>((set) => ({
  rows: null,
  running: false,
  computedAt: null,
  configSig: null,
  sortCol: 'total',
  sortDir: 'desc',

  run: async () => {
    set({ running: true });
    // Cede un frame para que el estado "Calculando…" se pinte antes de bloquear.
    await nextFrame();
    const risk = useRiskStore.getState();
    const data = risk.data ?? (await risk.loadData());
    const wind = data?.['wind'];
    if (!data || !wind) {
      set({ running: false, rows: [] });
      return;
    }
    // Estado más reciente tras el await (config/terreno pudieron cambiar).
    const { config, terrenoCells } = useRiskStore.getState();
    const extras = { terrenoCells, field: useFieldStore.getState().asInput() };
    const rows: BatchRow[] = [];
    // El cómputo es síncrono y `lineas` (2,1 MB) lo hace pesado; se trocea cediendo
    // el hilo cada pocos parques para que la barra de progreso anime y la pestaña
    // no se congele. Son ~30 parques → coste acotado.
    const CHUNK = 6;
    let done = 0;
    for (const f of wind.features) {
      const g = f.geometry;
      if (!g || g.type !== 'Point') continue;
      const lng = g.coordinates[0]!;
      const lat = g.coordinates[1]!;
      const r = riskAtPoint(lat, lng, config, data, extras);
      const p = f.properties ?? {};
      rows.push({
        id: `${lat.toFixed(4)},${lng.toFixed(4)}`,
        nombre: String(p['nombre'] ?? 's/n'),
        region: String(p['region'] ?? ''),
        comuna: String(p['comuna'] ?? ''),
        potenciaMw: numFrom(p['potencia_mw']),
        lat,
        lng,
        total: r.total,
        category: r.category,
        rows: r.rows,
      });
      if (++done % CHUNK === 0) await nextFrame();
    }
    set({ rows, running: false, computedAt: Date.now(), configSig: configSignature(config) });
  },

  setSort: (col) =>
    set((s) =>
      s.sortCol === col
        ? { sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' }
        : { sortCol: col, sortDir: col === 'nombre' || col === 'region' ? 'asc' : 'desc' },
    ),

  clear: () => set({ rows: null, computedAt: null, configSig: null }),
}));
