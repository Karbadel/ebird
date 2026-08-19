import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { applyFilters, useFilterStore } from '../store/useFilterStore';
import { searchSpecies } from './search';

/** Observaciones tras aplicar todos los filtros activos + la búsqueda difusa. */
export function useFiltered() {
  const observations = useDataStore((s) => s.observations);
  const f = useFilterStore();

  const base = useMemo(
    () => applyFilters(observations, f),
    [
      observations,
      f.species,
      f.place,
      f.group,
      f.order,
      f.family,
      f.region,
      f.hotspot,
      f.from,
      f.to,
      f.onlyValid,
      f.onlyReviewed,
      f.includeExotic,
      f.onlyNotable,
      f.minCount,
    ],
  );

  const matched = useMemo(
    () => (f.query.trim() ? searchSpecies(observations, f.query) : null),
    [observations, f.query],
  );

  return useMemo(
    () => (matched ? base.filter((o) => matched.has(o.es)) : base),
    [base, matched],
  );
}
