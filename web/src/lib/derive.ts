import type { Observation } from '../types';

export interface Site {
  loc: string;
  region: string;
  ll: [number, number];
  obsCount: number;
  spCount: number;
  note: boolean;
}

/** Agrupa las observaciones por localidad para dibujar un marcador por sitio. */
export function aggregateSites(obs: Observation[]): Site[] {
  const map = new Map<
    string,
    { region: string; lat: number; lng: number; species: Set<string>; count: number; note: boolean }
  >();
  for (const o of obs) {
    let e = map.get(o.loc);
    if (!e) {
      e = { region: o.region, lat: o.lat, lng: o.lng, species: new Set(), count: 0, note: false };
      map.set(o.loc, e);
    }
    e.species.add(o.es);
    e.count += 1;
    if (o.notable) e.note = true;
  }
  return [...map.entries()].map(([loc, e]) => ({
    loc,
    region: e.region,
    ll: [e.lat, e.lng] as [number, number],
    obsCount: e.count,
    spCount: e.species.size,
    note: e.note,
  }));
}

export interface SpeciesStats {
  registros: number;
  regiones: number;
  lastCount: number;
  byRegion: { region: string; n: number }[];
  recent: Observation[];
}

/** Estadísticas de una especie (por su nombre en español, el id estable). */
export function speciesStats(obs: Observation[], es: string): SpeciesStats {
  const rows = obs.filter((o) => o.es === es);
  const byRegionMap = new Map<string, number>();
  for (const o of rows) byRegionMap.set(o.region, (byRegionMap.get(o.region) ?? 0) + 1);
  const byRegion = [...byRegionMap.entries()]
    .map(([region, n]) => ({ region, n }))
    .sort((a, b) => b.n - a.n);
  const recent = [...rows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return {
    registros: rows.length,
    regiones: byRegion.length,
    lastCount: recent[0]?.count ?? 0,
    byRegion,
    recent,
  };
}

/** Serie de registros por fecha (para el gráfico temporal). */
export function byDate(obs: Observation[]): { date: string; n: number }[] {
  const m = new Map<string, number>();
  for (const o of obs) m.set(o.date, (m.get(o.date) ?? 0) + 1);
  return [...m.entries()]
    .map(([date, n]) => ({ date, n }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
