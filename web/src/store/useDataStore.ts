import { create } from 'zustand';
import type { Observation } from '../types';

interface DataState {
  observations: Observation[];
  loading: boolean;
  error: string | null;
  load(): Promise<void>;
  reload(): Promise<void>;
}

async function fetchObs(): Promise<Observation[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/observaciones.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Observation[];
}

export const useDataStore = create<DataState>((set, get) => ({
  observations: [],
  loading: true,
  error: null,
  load: async () => {
    if (get().observations.length > 0) return;
    try {
      set({ observations: await fetchObs(), loading: false, error: null });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'No se pudieron cargar los datos' });
    }
  },
  reload: async () => {
    set({ loading: true });
    try {
      set({ observations: await fetchObs(), loading: false, error: null });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'No se pudieron cargar los datos' });
    }
  },
}));
