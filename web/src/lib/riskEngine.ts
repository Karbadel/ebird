import { point, polygon, lineString } from '@turf/helpers';
import distance from '@turf/distance';
import pointToLineDistance from '@turf/point-to-line-distance';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, Geometry, Point, Position } from 'geojson';
import { riskCategory, type RiskCategory, type RiskVar } from '../data/riskConfig';

export type RiskData = Record<string, FeatureCollection>;

// Celda de la grilla de terreno (3 km): [lon, lat, score, slope_deg, demSd_m, demMean_m].
// El `score` viene PRECALCULADO desde Python (src/build_terreno.py).
export type TerrenoCell = [number, number, number, number, number, number];

// Geometrías de correcciones de campo cargadas por el usuario en la sesión (Part 4).
export interface FieldCorrectionsInput {
  ganado: Geometry[];
  lineas: Geometry[];
  antenas: Geometry[];
}

export interface RiskExtras {
  terrenoCells?: TerrenoCell[];
  field?: FieldCorrectionsInput;
}

const KM = { units: 'kilometers' as const };

function num(props: Feature['properties'], key: string): number | null {
  const v = props?.[key];
  return typeof v === 'number' ? v : null;
}

// ── distancias (turf) ────────────────────────────────────────────────────────
function polygonMinDistanceKm(pt: Feature<Point>, rings: Position[][]): number {
  let min = Infinity;
  for (const ring of rings) min = Math.min(min, pointToLineDistance(pt, lineString(ring), KM));
  return min;
}

function geometryMinDistanceKm(pt: Feature<Point>, geom: Geometry): number {
  switch (geom.type) {
    case 'Point':
      return distance(pt, point(geom.coordinates), KM);
    case 'MultiPoint':
      return Math.min(...geom.coordinates.map((c) => distance(pt, point(c), KM)));
    case 'LineString':
      return pointToLineDistance(pt, lineString(geom.coordinates), KM);
    case 'MultiLineString':
      return Math.min(...geom.coordinates.map((c) => pointToLineDistance(pt, lineString(c), KM)));
    case 'Polygon':
      return booleanPointInPolygon(pt, polygon(geom.coordinates)) ? 0 : polygonMinDistanceKm(pt, geom.coordinates);
    case 'MultiPolygon': {
      let min = Infinity;
      for (const poly of geom.coordinates) {
        if (booleanPointInPolygon(pt, polygon(poly))) return 0;
        min = Math.min(min, polygonMinDistanceKm(pt, poly));
      }
      return min;
    }
    default:
      return Infinity;
  }
}

function nearestFeatureDistanceKm(pt: Feature<Point>, fc: FeatureCollection): number {
  let min = Infinity;
  for (const f of fc.features) if (f.geometry) min = Math.min(min, geometryMinDistanceKm(pt, f.geometry));
  return min;
}

// ── scores por criterio ──────────────────────────────────────────────────────
function proximityScore(distKm: number, decayKm: number): number | null {
  if (!isFinite(distKm)) return null;
  if (decayKm <= 0) return distKm <= 0 ? 1 : 0;
  return Math.max(0, Math.min(1, 1 - distKm / decayKm));
}

function habitatScoreAt(pt: Feature<Point>, fc?: FeatureCollection): number | null {
  if (!fc) return null;
  for (const f of fc.features) {
    const g = f.geometry;
    if (g && (g.type === 'Polygon' || g.type === 'MultiPolygon') && booleanPointInPolygon(pt, g)) {
      return num(f.properties, 'hs_mean');
    }
  }
  return null;
}

function maxProp(fc: FeatureCollection | undefined, key: string): number {
  let max = 0;
  if (fc) for (const f of fc.features) max = Math.max(max, num(f.properties, key) ?? 0);
  return max || 1;
}

function ebirdDensityScoreAt(pt: Feature<Point>, fc: FeatureCollection | undefined, maxLoc: number): number {
  if (!fc) return 0;
  for (const f of fc.features) {
    const g = f.geometry;
    if (g && (g.type === 'Polygon' || g.type === 'MultiPolygon') && booleanPointInPolygon(pt, g)) {
      return Math.sqrt((num(f.properties, 'n_localities') ?? 0) / maxLoc);
    }
  }
  return 0;
}

// Distrito ganadero más cercano por especie (independiente de la distancia de
// influencia: la ponderación por `decayKm` se aplica después, en ganadoScore).
// `intensity` = cabezas del distrito / máximo nacional de esa especie.
export interface GanadoNearest {
  sp: string;
  d: number;
  intensity: number;
  distrito: string;
}

const GANADO_SPECIES = ['bovino', 'ovino', 'caprino'];

function ganadoNearestAt(pt: Feature<Point>, fc: FeatureCollection): GanadoNearest[] {
  const features = fc.features;
  const maxBy: Record<string, number> = {};
  for (const f of features) {
    const esp = String(f.properties?.['especie'] ?? '');
    maxBy[esp] = Math.max(maxBy[esp] ?? 0, num(f.properties, 'total') ?? 0);
  }
  const out: GanadoNearest[] = [];
  for (const sp of GANADO_SPECIES) {
    let bestD = Infinity;
    let best: Feature | null = null;
    for (const f of features) {
      if (f.properties?.['especie'] !== sp || f.geometry?.type !== 'Point') continue;
      const d = distance(pt, point(f.geometry.coordinates), KM);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    }
    if (best) {
      out.push({
        sp,
        d: bestD,
        intensity: (num(best.properties, 'total') ?? 0) / (maxBy[sp] || 1),
        distrito: String(best.properties?.['distrito']),
      });
    }
  }
  return out;
}

function ganadoScore(
  pt: () => Feature<Point>,
  decayKm: number,
  nearest: GanadoNearest[] | null,
  fieldGanado: Geometry[] = [],
): { score: number; detail: string[] } {
  if (!nearest && !fieldGanado.length) return { score: 0, detail: [] };
  let sum = 0;
  let n = 0;
  const detail: string[] = [];
  for (const sp of GANADO_SPECIES) {
    const best = nearest?.find((g) => g.sp === sp);
    if (best && best.d <= decayKm) {
      sum += (1 - best.d / decayKm) * best.intensity;
      n += 1;
      detail.push(`${sp}: distrito "${best.distrito}" a ${best.d.toFixed(1)} km`);
    } else {
      detail.push(`${sp}: sin distritos dentro de ${decayKm} km`);
    }
  }
  // Corrales/atrayentes reportados en campo: intensidad máxima (1) — es un punto de
  // concentración de carroña confirmado en terreno, no una estimación regional.
  if (fieldGanado.length) {
    let bestD = Infinity;
    for (const geom of fieldGanado) bestD = Math.min(bestD, geometryMinDistanceKm(pt(), geom));
    if (bestD <= decayKm) {
      sum += 1 - bestD / decayKm;
      n += 1;
      detail.push(`corral de campo: a ${bestD.toFixed(1)} km`);
    } else {
      detail.push(`corrales de campo: ninguno dentro de ${decayKm} km`);
    }
  }
  return { score: n ? sum / n : 0, detail };
}

// Celda de terreno más cercana al punto (búsqueda lineal; ~24.843 celdas, ~sub-ms
// por consulta puntual). Devuelve null fuera de la cobertura de la grilla (~5,5 km).
function terrenoScoreAt(
  pt: Feature<Point>,
  cells: TerrenoCell[],
): { score: number; slope: number; demSd: number; demMean: number } | null {
  const lng = pt.geometry.coordinates[0]!;
  const lat = pt.geometry.coordinates[1]!;
  let best: TerrenoCell | null = null;
  let bestD2 = Infinity;
  for (const c of cells) {
    const dlon = c[0] - lng;
    const dlat = c[1] - lat;
    const d2 = dlon * dlon + dlat * dlat;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = c;
    }
  }
  if (!best || bestD2 > 0.05 * 0.05) return null;
  return { score: best[2], slope: best[3], demSd: best[4], demMean: best[5] };
}

// Score de antenas de campo (percha/dormidero): proximidad a la antena reportada
// más cercana. Alimentado por las correcciones de campo de la sesión (Part 4).
function antenasScoreAt(
  pt: Feature<Point>,
  antenas: Geometry[],
  decayKm: number,
): { score: number | null; rawText: string } {
  if (!antenas.length) return { score: null, rawText: 'sin antenas reportadas en esta sesión' };
  let bestD = Infinity;
  for (const geom of antenas) bestD = Math.min(bestD, geometryMinDistanceKm(pt, geom));
  return {
    score: proximityScore(bestD, decayKm),
    rawText: isFinite(bestD) ? `${bestD.toFixed(2)} km a la antena reportada más cercana` : 's/d',
  };
}

// ── índice combinado ─────────────────────────────────────────────────────────
// El cálculo se separa en dos pasos para poder puntuar miles de puntos:
//   1. measureAtPoint — mediciones PESADAS e independientes de pesos y distancias
//      de influencia (distancias a capas, celdas de hábitat/eBird/terreno, distrito
//      ganadero más cercano). Se pueden precalcular y guardar (JSON).
//   2. scoreMeasures — aplica la configuración editable (pesos, decay, activación)
//      y las correcciones de campo de la sesión. Barato: recalcula en vivo.
// riskAtPoint = scoreMeasures(measureAtPoint(...)) → mismo resultado que antes.
export interface RiskRow {
  label: string;
  weight: number;
  score: number | null;
  rawText: string;
}

export interface RiskResult {
  total: number;
  category: RiskCategory;
  rows: RiskRow[];
}

export interface TerrenoAt {
  score: number;
  slope: number;
  demSd: number;
  demMean: number;
}

/** Mediciones de un punto. Un campo ausente = criterio no medido. */
export interface PointMeasures {
  /** Distancia (km) al elemento más cercano por capa de proximidad. Clave ausente
   *  = capa sin cargar; `null` = capa sin elementos (distancia infinita). */
  prox: Record<string, number | null>;
  habitat?: number | null;
  ebird?: { score: number; max: number };
  /** null = capa de ganado sin cargar. */
  ganado?: GanadoNearest[] | null;
  /** null = fuera de la cobertura de la grilla de terreno (o grilla sin cargar). */
  terreno?: TerrenoAt | null;
}

/** Mide el punto para las variables dadas (activación, pesos y decay se ignoran). */
export function measureAtPoint(
  lat: number,
  lng: number,
  vars: RiskVar[],
  data: RiskData,
  terrenoCells: TerrenoCell[] = [],
): PointMeasures {
  const pt = point([lng, lat]);
  const m: PointMeasures = { prox: {} };
  for (const c of vars) {
    if (c.kind === 'proximity' && c.layerId) {
      const fc = data[c.layerId];
      if (fc && !(c.layerId in m.prox)) {
        const d = nearestFeatureDistanceKm(pt, fc);
        m.prox[c.layerId] = isFinite(d) ? d : null;
      }
    } else if (c.kind === 'habitat') {
      m.habitat = habitatScoreAt(pt, data['habitat']);
    } else if (c.kind === 'ebird_density') {
      const max = maxProp(data['ebird_densidad'], 'n_localities');
      m.ebird = { score: ebirdDensityScoreAt(pt, data['ebird_densidad'], max), max };
    } else if (c.kind === 'ganado') {
      m.ganado = data['ganado'] ? ganadoNearestAt(pt, data['ganado']) : null;
    } else if (c.kind === 'terreno_3km') {
      m.terreno = terrenoScoreAt(pt, terrenoCells);
    }
  }
  return m;
}

/** Aplica la configuración (pesos/decay/activación) y las correcciones de campo. */
export function scoreMeasures(
  lat: number,
  lng: number,
  m: PointMeasures,
  config: RiskVar[],
  field?: FieldCorrectionsInput,
): RiskResult {
  // Punto turf perezoso: solo lo necesitan las correcciones de campo.
  let ptCache: Feature<Point> | null = null;
  const pt = () => (ptCache ??= point([lng, lat]));
  const rows: RiskRow[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const c of config) {
    if (!c.enabled) continue;
    let score: number | null = null;
    let rawText = '';
    if (c.kind === 'proximity' && c.layerId) {
      const measured = c.layerId in m.prox;
      // Correcciones de campo de la misma capa (líneas de transmisión no reflejadas
      // en la capa oficial) se combinan con el dato oficial.
      const fieldGeoms = field && c.layerId === 'lineas' ? field.lineas : [];
      if (measured || fieldGeoms.length) {
        let d = measured ? (m.prox[c.layerId] ?? Infinity) : Infinity;
        for (const geom of fieldGeoms) d = Math.min(d, geometryMinDistanceKm(pt(), geom));
        score = proximityScore(d, c.decayKm ?? 0);
        const marca = fieldGeoms.length ? ' (incl. campo)' : '';
        rawText = isFinite(d) ? `${d.toFixed(2)} km${marca}` : 's/d';
      }
    } else if (c.kind === 'habitat') {
      score = m.habitat ?? null;
      rawText = score === null ? 'sin dato' : score.toFixed(2);
    } else if (c.kind === 'ganado') {
      const g = ganadoScore(pt, c.decayKm ?? 30, m.ganado ?? null, field?.ganado ?? []);
      score = g.score;
      rawText = g.detail.join(' · ');
    } else if (c.kind === 'ebird_density') {
      const e = m.ebird ?? { score: 0, max: 1 };
      score = e.score;
      rawText = `~${Math.round(score * score * e.max)} localidades eBird (máx ${e.max})`;
    } else if (c.kind === 'terreno_3km') {
      const t = m.terreno ?? null;
      score = t === null ? null : t.score;
      rawText =
        t === null
          ? 'sin dato (fuera de cobertura)'
          : `pendiente ${t.slope.toFixed(1)}°, rugosidad ${t.demSd.toFixed(0)} m, altitud ${t.demMean.toFixed(0)} m`;
    } else if (c.kind === 'user_antenas') {
      const a = antenasScoreAt(pt(), field?.antenas ?? [], c.decayKm ?? 5);
      score = a.score;
      rawText = a.rawText;
    }
    if (score !== null) {
      weightedSum += score * c.weight;
      weightTotal += c.weight;
    }
    rows.push({ label: c.label, weight: c.weight, score, rawText });
  }

  const total = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) : 0;
  return { total, category: riskCategory(total), rows };
}

export function riskAtPoint(
  lat: number,
  lng: number,
  config: RiskVar[],
  data: RiskData,
  extras: RiskExtras = {},
): RiskResult {
  // Solo se miden las variables activas (mismo coste que el cálculo directo).
  const m = measureAtPoint(lat, lng, config.filter((c) => c.enabled), data, extras.terrenoCells ?? []);
  return scoreMeasures(lat, lng, m, config, extras.field);
}
