import { create } from 'zustand';
import { scoreMeasures, type PointMeasures } from '../lib/riskEngine';
import type { RiskCategory } from '../data/riskConfig';
import { RISK_LABELS } from '../data/portal';
import { useRiskStore } from './useRiskStore';
import { useFieldStore } from './useFieldStore';

/** Polígono de potencial eólico con sus mediciones precalculadas
 *  (web/scripts/precompute_potencial.ts → potencial_medidas.json). */
export interface WindpotItem {
  id: number;
  region: string;
  ha: number;
  mw: number;
  /** Punto interior donde se midió el índice. */
  lat: number;
  lng: number;
  m: PointMeasures;
}

export interface WindpotScore {
  total: number;
  category: RiskCategory;
}

/** Suma de potencial por categoría de riesgo (índice = posición en RISK_LABELS). */
export interface CatSums {
  mw: number[];
  ha: number[];
  n: number[];
}

export interface RegionSummary extends CatSums {
  region: string;
}

// Orden norte → sur para la tabla por región.
const REGION_ORDER = [
  'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Metropolitana', "O'Higgins",
  'Maule', 'Ñuble', 'Biobío', 'Araucanía', 'Los Ríos', 'Los Lagos',
];

const emptySums = (): CatSums => ({
  mw: RISK_LABELS.map(() => 0),
  ha: RISK_LABELS.map(() => 0),
  n: RISK_LABELS.map(() => 0),
});

interface WindpotRiskState {
  items: WindpotItem[] | null;
  loading: boolean;
  error: boolean;
  /** Índice por id de polígono con la configuración vigente del motor. */
  scores: Map<number, WindpotScore> | null;
  byRegion: RegionSummary[];
  national: CatSums | null;
  computedAt: number | null;
  load(): Promise<void>;
  /** Recalcula los índices con la configuración y correcciones de campo actuales. */
  compute(): void;
}

// Puntúa en vivo los 2.277 polígonos: las mediciones pesadas vienen precalculadas,
// aquí solo se aplican pesos/decay (scoreMeasures) → milisegundos, sin trocear.
// Se recalcula solo al cambiar la configuración del motor o las correcciones de
// campo (suscripciones al final del archivo).
export const useWindpotRiskStore = create<WindpotRiskState>((set, get) => ({
  items: null,
  loading: false,
  error: false,
  scores: null,
  byRegion: [],
  national: null,
  computedAt: null,

  load: async () => {
    if (get().items || get().loading) return;
    set({ loading: true, error: false });
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/riesgo/potencial_medidas.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as { items: WindpotItem[] };
      set({ items: j.items, loading: false });
      get().compute();
    } catch {
      set({ loading: false, error: true });
    }
  },

  compute: () => {
    const items = get().items;
    if (!items) return;
    const { config } = useRiskStore.getState();
    const field = useFieldStore.getState().asInput();
    const scores = new Map<number, WindpotScore>();
    const national = emptySums();
    const regions = new Map<string, CatSums>();
    for (const it of items) {
      const r = scoreMeasures(it.lat, it.lng, it.m, config, field);
      scores.set(it.id, { total: r.total, category: r.category });
      const k = RISK_LABELS.indexOf(r.category.label);
      if (k < 0) continue;
      let reg = regions.get(it.region);
      if (!reg) regions.set(it.region, (reg = emptySums()));
      for (const s of [national, reg]) {
        s.mw[k]! += it.mw;
        s.ha[k]! += it.ha;
        s.n[k]! += 1;
      }
    }
    const rank = (r: string) => {
      const i = REGION_ORDER.indexOf(r);
      return i < 0 ? REGION_ORDER.length : i;
    };
    const byRegion = [...regions.entries()]
      .map(([region, s]) => ({ region, ...s }))
      .sort((a, b) => rank(a.region) - rank(b.region) || a.region.localeCompare(b.region, 'es'));
    set({ scores, byRegion, national, computedAt: Date.now() });
  },
}));

// Recalcular en vivo cuando cambian los pesos/variables del motor o las
// correcciones de campo (solo si ya se cargaron las mediciones).
useRiskStore.subscribe((s, prev) => {
  if (s.config !== prev.config) useWindpotRiskStore.getState().compute();
});
useFieldStore.subscribe((s, prev) => {
  if (s.corrections !== prev.corrections) useWindpotRiskStore.getState().compute();
});
