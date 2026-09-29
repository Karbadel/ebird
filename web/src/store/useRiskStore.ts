import { create } from 'zustand';
import type { FeatureCollection } from 'geojson';
import { DEFAULT_RISK_CONFIG, RISK_GRID_FILES, RISK_LAYER_FILES, configForProfile, type RiskVar } from '../data/riskConfig';
import {
  decodeRasterGrid,
  prepareLayer,
  riskAtPoint,
  type RasterGridJson,
  type RiskData,
  type RiskExtras,
  type RiskGrids,
  type RiskResult,
  type TerrenoCell,
} from '../lib/riskEngine';
import { useFieldStore } from './useFieldStore';

const cloneConfig = (): RiskVar[] => DEFAULT_RISK_CONFIG.map((v) => ({ ...v }));

/** Reúne las entradas extra del motor (terreno, grillas raster + correcciones de campo). */
function collectExtras(terrenoCells: TerrenoCell[], grids: RiskGrids): RiskExtras {
  return { terrenoCells, grids, field: useFieldStore.getState().asInput() };
}

/** Descarga una grilla raster del motor; si falla devuelve undefined (el criterio
 *  queda «sin dato» y el resto del motor opera igual). */
async function loadGrid(base: string, file: string): Promise<ReturnType<typeof decodeRasterGrid> | undefined> {
  try {
    const res = await fetch(`${base}${file}`);
    if (!res.ok) return undefined;
    return decodeRasterGrid((await res.json()) as RasterGridJson);
  } catch {
    return undefined;
  }
}

interface RiskState {
  data: RiskData | null;
  loading: boolean;
  terrenoCells: TerrenoCell[];
  /** Grillas raster del motor (idoneidad de hábitat, abundancia eBird S&T). */
  grids: RiskGrids;
  config: RiskVar[];
  /** Perfil de pesos aplicado (RISK_PROFILES), o null si se editó a mano. */
  profileId: string | null;
  queryActive: boolean;
  result: (RiskResult & { lat: number; lng: number }) | null;

  loadData(): Promise<RiskData | null>;
  /** Recalcula el resultado actual (p. ej. tras cambiar correcciones de campo). */
  refresh(): void;
  toggleQuery(): void;
  stopQuery(): void;
  runQuery(lat: number, lng: number): Promise<void>;
  clearResult(): void;
  setWeight(id: string, weight: number): void;
  setEnabled(id: string, enabled: boolean): void;
  setDecay(id: string, decayKm: number): void;
  resetConfig(): void;
  /** Aplica un perfil de pesos (reemplaza pesos, distancias y activación). */
  applyProfile(id: string): void;
}

function recompute(state: RiskState): Partial<RiskState> {
  if (state.result && state.data) {
    const r = riskAtPoint(state.result.lat, state.result.lng, state.config, state.data, collectExtras(state.terrenoCells, state.grids));
    return { result: { ...r, lat: state.result.lat, lng: state.result.lng } };
  }
  return {};
}

export const useRiskStore = create<RiskState>((set, get) => ({
  data: null,
  loading: false,
  terrenoCells: [],
  grids: {},
  config: cloneConfig(),
  profileId: 'vigente',
  queryActive: false,
  result: null,

  loadData: async () => {
    const cached = get().data;
    if (cached) return cached;
    set({ loading: true });
    try {
      const root = `${import.meta.env.BASE_URL}data/`;
      const base = `${root}riesgo/`;
      const [parts, habitat, abundancia] = await Promise.all([
        Promise.all(
          Object.entries(RISK_LAYER_FILES).map(async ([id, file]) => {
            const res = await fetch(`${root}${file}`);
            if (!res.ok) throw new Error(`HTTP ${res.status} en ${id}`);
            return [id, prepareLayer(id, (await res.json()) as FeatureCollection)] as const;
          }),
        ),
        loadGrid(root, RISK_GRID_FILES.habitat),
        loadGrid(root, RISK_GRID_FILES.abundancia),
      ]);
      const data: RiskData = Object.fromEntries(parts);
      set({ data, grids: { habitat, abundancia }, loading: false });
      // Grilla de terreno (JSON propio, no GeoJSON): carga aparte y NO bloqueante —
      // si falla, el criterio de terreno queda en null y el resto del motor opera igual.
      if (!get().terrenoCells.length) {
        fetch(`${base}terreno_3km.json`)
          .then((r) => (r.ok ? r.json() : null))
          .then((j: { cells?: TerrenoCell[] } | null) => {
            if (j?.cells?.length) set({ terrenoCells: j.cells, ...recompute(get()) });
          })
          .catch(() => {});
      }
      return data;
    } catch {
      set({ loading: false });
      return null;
    }
  },

  refresh: () => set((s) => recompute(s)),

  toggleQuery: () => set((s) => ({ queryActive: !s.queryActive })),

  // Apaga la consulta sin alternar (p. ej. al salir de la pestaña Riesgo).
  stopQuery: () => set((s) => (s.queryActive ? { queryActive: false } : {})),

  runQuery: async (lat, lng) => {
    const data = get().data ?? (await get().loadData());
    if (!data) return;
    const r = riskAtPoint(lat, lng, get().config, data, collectExtras(get().terrenoCells, get().grids));
    set({ result: { ...r, lat, lng } });
  },

  clearResult: () => set({ result: null }),

  setWeight: (id, weight) =>
    set((s) => {
      const config = s.config.map((v) => (v.id === id ? { ...v, weight } : v));
      return { config, profileId: null, ...recompute({ ...s, config }) };
    }),
  setEnabled: (id, enabled) =>
    set((s) => {
      const config = s.config.map((v) => (v.id === id ? { ...v, enabled } : v));
      return { config, profileId: null, ...recompute({ ...s, config }) };
    }),
  setDecay: (id, decayKm) =>
    set((s) => {
      const config = s.config.map((v) => (v.id === id ? { ...v, decayKm } : v));
      return { config, profileId: null, ...recompute({ ...s, config }) };
    }),
  resetConfig: () =>
    set((s) => {
      const config = cloneConfig();
      return { config, profileId: 'vigente', ...recompute({ ...s, config }) };
    }),
  applyProfile: (id) =>
    set((s) => {
      const config = configForProfile(id);
      return { config, profileId: id, ...recompute({ ...s, config }) };
    }),
}));
