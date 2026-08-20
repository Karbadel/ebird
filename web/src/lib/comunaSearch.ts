import type { Comuna } from '../store/usePortalStore';
import { normalize } from './normalize';

/** Distancia de edición de Levenshtein (para tolerar errores de tipeo). */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let cur = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n]!;
}

/** Tolerancia de errores permitida según el largo del texto buscado. */
function tolerance(len: number): number {
  return len <= 4 ? 1 : len <= 7 ? 2 : 3;
}

/**
 * Busca comunas por nombre (y región), sin distinguir acentos ni mayúsculas, y
 * con "coincidencia cercana": si no hay match exacto, tolera errores de tipeo y
 * grafías distintas vía distancia de edición. Devuelve las mejores `limit`.
 *
 * Orden de preferencia: nombre exacto → empieza por → contiene → región →
 * aproximado por tipeo (nombre) → aproximado (región).
 */
export function searchComunas(comunas: Comuna[], query: string, limit = 8): Comuna[] {
  const nq = normalize(query);
  if (!nq) return [];
  const t = tolerance(nq.length);
  const scored: { c: Comuna; s: number }[] = [];

  for (const c of comunas) {
    const name = normalize(c.nombre);
    const region = normalize(c.region ?? '');
    let s = -1;

    if (name === nq) s = 1000;
    else if (name.startsWith(nq)) s = 900 - (name.length - nq.length);
    else if (name.includes(nq)) s = 700 - name.indexOf(nq);
    else if (region.startsWith(nq)) s = 520;
    else if (region.includes(nq)) s = 480;
    else {
      // Aproximado: sobre el nombre completo, sobre su prefijo del mismo largo
      // que la consulta (para búsquedas parciales mal tipeadas) y sobre la región.
      const dName = levenshtein(nq, name);
      const dPrefix = levenshtein(nq, name.slice(0, nq.length));
      const dRegion = region ? levenshtein(nq, region) : 99;
      if (dName <= t) s = 360 - dName * 20;
      else if (dPrefix <= t) s = 260 - dPrefix * 20;
      else if (dRegion <= t) s = 160 - dRegion * 20;
    }

    if (s > 0) scored.push({ c, s });
  }

  scored.sort((a, b) => b.s - a.s || a.c.nombre.localeCompare(b.c.nombre, 'es'));
  return scored.slice(0, limit).map((x) => x.c);
}
