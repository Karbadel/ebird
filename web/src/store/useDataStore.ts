import { create } from 'zustand';
import type { FeatureCollection, Point } from 'geojson';
import type { Observation } from '../types';

/** Caso de colisión de cóndor del registro consolidado real (data/riesgo/colisiones.geojson). */
export interface CollisionCase {
  caso: string;
  fecha: string;
  anio: string;
  proyecto: string;
  sexo: string;
  edad: string;
  aerogenerador: string;
  region: string;
  lat: number;
  lng: number;
}

interface DataState {
  observations: Observation[];
  collisions: CollisionCase[];
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

// Normaliza el nombre del proyecto (unifica "Parque Eólico X" y "X").
const cleanProyecto = (s: string) => s.replace(/^parque\s+e[oó]lico\s+/i, '').trim();

async function fetchCollisions(): Promise<CollisionCase[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/riesgo/colisiones.geojson`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const fc = (await res.json()) as FeatureCollection;
  return fc.features.flatMap((f) => {
    const g = f.geometry as Point | null;
    if (!g || g.type !== 'Point') return [];
    const p = f.properties ?? {};
    return [{
      caso: String(p['caso'] ?? ''),
      fecha: String(p['fecha'] ?? ''),
      anio: String(p['anio'] ?? ''),
      proyecto: cleanProyecto(String(p['proyecto'] ?? '—')),
      sexo: String(p['sexo'] ?? ''),
      edad: String(p['edad'] ?? ''),
      aerogenerador: String(p['aerogenerador'] ?? ''),
      region: String(p['region'] ?? ''),
      lat: g.coordinates[1]!,
      lng: g.coordinates[0]!,
    }];
  });
}

async function fetchAll(): Promise<Pick<DataState, 'observations' | 'collisions'>> {
  const [observations, collisions] = await Promise.all([fetchObs(), fetchCollisions()]);
  return { observations, collisions };
}

export const useDataStore = create<DataState>((set, get) => ({
  observations: [],
  collisions: [],
  loading: true,
  error: null,
  load: async () => {
    if (get().observations.length > 0) return;
    try {
      set({ ...(await fetchAll()), loading: false, error: null });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'No se pudieron cargar los datos' });
    }
  },
  reload: async () => {
    set({ loading: true });
    try {
      set({ ...(await fetchAll()), loading: false, error: null });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'No se pudieron cargar los datos' });
    }
  },
}));
