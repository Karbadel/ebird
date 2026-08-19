import { create } from 'zustand';
import type { Observation } from '../types';

export interface Filters {
  species: string[];
  query: string;
  place: string;
  group: string;
  order: string;
  family: string;
  region: string;
  hotspot: string;
  from: string;
  to: string;
  onlyValid: boolean;
  onlyReviewed: boolean;
  includeExotic: boolean;
  onlyNotable: boolean;
  minCount: number;
}

export const DEFAULT_FILTERS: Filters = {
  species: [],
  query: '',
  place: '',
  group: '',
  order: '',
  family: '',
  region: '',
  hotspot: '',
  from: '2026-07-18',
  to: '2026-08-17',
  onlyValid: true,
  onlyReviewed: false,
  includeExotic: true,
  onlyNotable: false,
  minCount: 1,
};

interface FilterState extends Filters {
  update<K extends keyof Filters>(key: K, value: Filters[K]): void;
  toggleSpecies(es: string): void;
  reset(): void;
}

export const useFilterStore = create<FilterState>((set) => ({
  ...DEFAULT_FILTERS,
  update: (key, value) => set({ [key]: value } as Partial<FilterState>),
  toggleSpecies: (es) =>
    set((s) => ({
      species: s.species.includes(es)
        ? s.species.filter((x) => x !== es)
        : [...s.species, es],
    })),
  reset: () => set({ ...DEFAULT_FILTERS }),
}));

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

/** Aplica todos los filtros (combinables) a la lista de observaciones. */
export function applyFilters(obs: Observation[], f: Filters): Observation[] {
  const place = f.place.trim() ? norm(f.place) : '';
  return obs.filter((o) => {
    if (f.species.length && !f.species.includes(o.es)) return false;
    if (place && !norm(o.region).includes(place) && !norm(o.loc).includes(place)) return false;
    if (f.group && o.grp !== f.group) return false;
    if (f.order && o.order !== f.order) return false;
    if (f.family && o.family !== f.family) return false;
    if (f.region && o.region !== f.region) return false;
    if (f.hotspot && o.loc !== f.hotspot) return false;
    if (o.date < f.from || o.date > f.to) return false;
    if (f.onlyValid && !o.valid) return false;
    if (f.onlyReviewed && !o.rev) return false;
    if (!f.includeExotic && o.exo) return false;
    if (f.onlyNotable && !o.notable) return false;
    if (o.count < f.minCount) return false;
    return true;
  });
}
