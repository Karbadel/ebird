import type { Category, Group, Observation } from '../types';

export interface CatalogEntry {
  es: string;
  en: string;
  sci: string;
  grp: Group;
  order: string;
  family: string;
  cat: Category;
  notable: boolean;
  exo: boolean;
  registros: number;
  localidades: number;
  /** Observación representativa (la más reciente) para abrir la ficha. */
  sample: Observation;
}

/** Construye el catálogo de especies (con conteos) a partir de las observaciones. */
export function buildCatalog(obs: Observation[]): CatalogEntry[] {
  const m = new Map<
    string,
    { first: Observation; sample: Observation; count: number; locs: Set<string>; notable: boolean }
  >();
  for (const o of obs) {
    let e = m.get(o.es);
    if (!e) {
      e = { first: o, sample: o, count: 0, locs: new Set(), notable: false };
      m.set(o.es, e);
    }
    e.count += 1;
    e.locs.add(o.loc);
    if (o.notable) e.notable = true;
    if (o.date > e.sample.date) e.sample = o;
  }
  return [...m.values()].map((e) => ({
    es: e.first.es,
    en: e.first.en,
    sci: e.first.sci,
    grp: e.first.grp,
    order: e.first.order,
    family: e.first.family,
    cat: e.first.cat,
    notable: e.notable,
    exo: e.first.exo,
    registros: e.count,
    localidades: e.locs.size,
    sample: e.sample,
  }));
}
