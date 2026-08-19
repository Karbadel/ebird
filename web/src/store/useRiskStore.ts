import { create } from 'zustand';
import type { FeatureCollection } from 'geojson';
import { DEFAULT_RISK_CONFIG, RISK_LAYER_IDS, type RiskVar } from '../data/riskConfig';
import { riskAtPoint, type RiskData, type RiskResult } from '../lib/riskEngine';

const cloneConfig = (): RiskVar[] => DEFAULT_RISK_CONFIG.map((v) => ({ ...v }));

interface RiskState {
  data: RiskData | null;
  loading: boolean;
  config: RiskVar[];
  queryActive: boolean;
  result: (RiskResult & { lat: number; lng: number }) | null;

  loadData(): Promise<RiskData | null>;
  toggleQuery(): void;
  runQuery(lat: number, lng: number): Promise<void>;
  clearResult(): void;
  setWeight(id: string, weight: number): void;
  setEnabled(id: string, enabled: boolean): void;
  setDecay(id: string, decayKm: number): void;
  resetConfig(): void;
}

function recompute(state: RiskState): Partial<RiskState> {
  if (state.result && state.data) {
    const r = riskAtPoint(state.result.lat, state.result.lng, state.config, state.data);
    return { result: { ...r, lat: state.result.lat, lng: state.result.lng } };
  }
  return {};
}

export const useRiskStore = create<RiskState>((set, get) => ({
  data: null,
  loading: false,
  config: cloneConfig(),
  queryActive: false,
  result: null,

  loadData: async () => {
    const cached = get().data;
    if (cached) return cached;
    set({ loading: true });
    try {
      const base = `${import.meta.env.BASE_URL}data/riesgo/`;
      const parts = await Promise.all(
        RISK_LAYER_IDS.map(async (id) => {
          const res = await fetch(`${base}${id}.geojson`);
          if (!res.ok) throw new Error(`HTTP ${res.status} en ${id}`);
          return [id, (await res.json()) as FeatureCollection] as const;
        }),
      );
      const data: RiskData = Object.fromEntries(parts);
      set({ data, loading: false });
      return data;
    } catch {
      set({ loading: false });
      return null;
    }
  },

  toggleQuery: () => set((s) => ({ queryActive: !s.queryActive })),

  runQuery: async (lat, lng) => {
    const data = get().data ?? (await get().loadData());
    if (!data) return;
    const r = riskAtPoint(lat, lng, get().config, data);
    set({ result: { ...r, lat, lng } });
  },

  clearResult: () => set({ result: null }),

  setWeight: (id, weight) =>
    set((s) => {
      const config = s.config.map((v) => (v.id === id ? { ...v, weight } : v));
      return { config, ...recompute({ ...s, config }) };
    }),
  setEnabled: (id, enabled) =>
    set((s) => {
      const config = s.config.map((v) => (v.id === id ? { ...v, enabled } : v));
      return { config, ...recompute({ ...s, config }) };
    }),
  setDecay: (id, decayKm) =>
    set((s) => {
      const config = s.config.map((v) => (v.id === id ? { ...v, decayKm } : v));
      return { config, ...recompute({ ...s, config }) };
    }),
  resetConfig: () =>
    set((s) => {
      const config = cloneConfig();
      return { config, ...recompute({ ...s, config }) };
    }),
}));
