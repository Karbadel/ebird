import { DEFAULT_FILTERS, type Filters } from '../store/useFilterStore';
import { GROUPS, type Group } from '../types';

export interface Chip {
  id: string;
  k: string;
  v: string;
}

/** Traduce el estado de filtros a chips de "filtros activos". */
export function activeChips(f: Filters): Chip[] {
  const chips: Chip[] = [];
  if (f.query.trim()) chips.push({ id: 'query', k: 'Búsqueda', v: f.query.trim() });
  if (f.group) chips.push({ id: 'group', k: 'Grupo', v: GROUPS[f.group as Group]?.label ?? f.group });
  f.species.forEach((s) => chips.push({ id: `sp:${s}`, k: 'Especie', v: s }));
  if (f.region) chips.push({ id: 'region', k: 'Región', v: f.region });
  if (f.order) chips.push({ id: 'order', k: 'Orden', v: f.order });
  if (f.family) chips.push({ id: 'family', k: 'Familia', v: f.family });
  if (f.onlyNotable) chips.push({ id: 'notable', k: 'Estado', v: 'Solo notables' });
  if (f.onlyReviewed) chips.push({ id: 'rev', k: 'Estado', v: 'Solo revisados' });
  if (!f.includeExotic) chips.push({ id: 'exo', k: 'Estado', v: 'Sin exóticas' });
  if (f.minCount > 1) chips.push({ id: 'min', k: 'Cantidad', v: `≥ ${f.minCount} ind.` });
  if (f.from !== DEFAULT_FILTERS.from || f.to !== DEFAULT_FILTERS.to)
    chips.push({ id: 'date', k: 'Fechas', v: `${f.from} → ${f.to}` });
  return chips;
}
