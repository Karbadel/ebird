import Fuse from 'fuse.js';
import { normalize } from './normalize';
import type { Observation } from '../types';

export interface SpeciesItem {
  es: string;
  en: string;
  sci: string;
  nes: string;
  nen: string;
  nsci: string;
}

// Índice cacheado: se reconstruye solo si cambia la referencia de observaciones.
let cachedRef: Observation[] | null = null;
let cachedItems: SpeciesItem[] = [];
let cachedFuse: Fuse<SpeciesItem> | null = null;

function ensure(observations: Observation[]): void {
  if (cachedRef === observations) return;
  const m = new Map<string, SpeciesItem>();
  for (const o of observations) {
    if (!m.has(o.es)) {
      m.set(o.es, {
        es: o.es,
        en: o.en,
        sci: o.sci,
        nes: normalize(o.es),
        nen: normalize(o.en),
        nsci: normalize(o.sci),
      });
    }
  }
  cachedItems = [...m.values()];
  cachedFuse = new Fuse(cachedItems, {
    keys: [
      { name: 'nes', weight: 0.6 },
      { name: 'nen', weight: 0.25 },
      { name: 'nsci', weight: 0.15 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
  cachedRef = observations;
}

/** Conjunto de especies (por nombre es) que coinciden con la consulta (difuso). */
export function searchSpecies(observations: Observation[], query: string): Set<string> {
  ensure(observations);
  const q = normalize(query);
  if (!q || !cachedFuse) return new Set();
  return new Set(cachedFuse.search(q).map((r) => r.item.es));
}

/** Especies coincidentes (items completos) para el desplegable de sugerencias. */
export function searchItems(observations: Observation[], query: string, limit = 8): SpeciesItem[] {
  ensure(observations);
  const q = normalize(query);
  if (!q || !cachedFuse) return [];
  return cachedFuse.search(q, { limit }).map((r) => r.item);
}

/** Sugerencias "¿quizás quisiste decir?" con umbral laxo (cuando hay 0 resultados). */
export function didYouMean(observations: Observation[], query: string, n = 3): SpeciesItem[] {
  ensure(observations);
  const q = normalize(query);
  if (!q || cachedItems.length === 0) return [];
  const loose = new Fuse(cachedItems, {
    keys: ['nes', 'nen', 'nsci'],
    threshold: 0.6,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });
  return loose.search(q, { limit: n }).map((r) => r.item);
}
