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

function ganadoScoreAt(
  pt: Feature<Point>,
  decayKm: number,
  fc: FeatureCollection | undefined,
  fieldGanado: Geometry[] = [],
): { score: number; detail: string[] } {
  if (!fc && !fieldGanado.length) return { score: 0, detail: [] };
  const species = ['bovino', 'ovino', 'caprino'];
  const features = fc?.features ?? [];
  const maxBy: Record<string, number> = {};
  for (const f of features) {
    const esp = String(f.properties?.['especie'] ?? '');
    maxBy[esp] = Math.max(maxBy[esp] ?? 0, num(f.properties, 'total') ?? 0);
  }
  let sum = 0;
  let n = 0;
  const detail: string[] = [];
  for (const sp of species) {
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
    if (best && bestD <= decayKm) {
      const prox = 1 - bestD / decayKm;
      const intensity = (num(best.properties, 'total') ?? 0) / (maxBy[sp] || 1);
      sum += prox * intensity;
      n += 1;
      detail.push(`${sp}: distrito "${best.properties?.['distrito']}" a ${bestD.toFixed(1)} km`);
    } else {
      detail.push(`${sp}: sin distritos dentro de ${decayKm} km`);
    }
  }
  // Corrales/atrayentes reportados en campo: intensidad máxima (1) — es un punto de
  // concentración de carroña confirmado en terreno, no una estimación regional.
  if (fieldGanado.length) {
    let bestD = Infinity;
    for (const geom of fieldGanado) bestD = Math.min(bestD, geometryMinDistanceKm(pt, geom));
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

export function riskAtPoint(
  lat: number,
  lng: number,
  config: RiskVar[],
  data: RiskData,
  extras: RiskExtras = {},
): RiskResult {
  const pt = point([lng, lat]);
  const maxEbird = maxProp(data['ebird_densidad'], 'n_localities');
  const terrenoCells = extras.terrenoCells ?? [];
  const field = extras.field;
  const rows: RiskRow[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const c of config) {
    if (!c.enabled) continue;
    let score: number | null = null;
    let rawText = '';
    if (c.kind === 'proximity' && c.layerId) {
      const fc = data[c.layerId];
      // Correcciones de campo de la misma capa (líneas de transmisión no reflejadas
      // en la capa oficial) se combinan con el dato oficial.
      const fieldGeoms = field && c.layerId === 'lineas' ? field.lineas : [];
      if (fc || fieldGeoms.length) {
        let d = fc ? nearestFeatureDistanceKm(pt, fc) : Infinity;
        for (const geom of fieldGeoms) d = Math.min(d, geometryMinDistanceKm(pt, geom));
        score = proximityScore(d, c.decayKm ?? 0);
        const marca = fieldGeoms.length ? ' (incl. campo)' : '';
        rawText = isFinite(d) ? `${d.toFixed(2)} km${marca}` : 's/d';
      }
    } else if (c.kind === 'habitat') {
      score = habitatScoreAt(pt, data['habitat']);
      rawText = score === null ? 'sin dato' : score.toFixed(2);
    } else if (c.kind === 'ganado') {
      const g = ganadoScoreAt(pt, c.decayKm ?? 30, data['ganado'], field?.ganado ?? []);
      score = g.score;
      rawText = g.detail.join(' · ');
    } else if (c.kind === 'ebird_density') {
      score = ebirdDensityScoreAt(pt, data['ebird_densidad'], maxEbird);
      rawText = `~${Math.round(score * score * maxEbird)} localidades eBird (máx ${maxEbird})`;
    } else if (c.kind === 'terreno_3km') {
      const t = terrenoScoreAt(pt, terrenoCells);
      score = t === null ? null : t.score;
      rawText =
        t === null
          ? 'sin dato (fuera de cobertura)'
          : `pendiente ${t.slope.toFixed(1)}°, rugosidad ${t.demSd.toFixed(0)} m, altitud ${t.demMean.toFixed(0)} m`;
    } else if (c.kind === 'user_antenas') {
      const a = antenasScoreAt(pt, field?.antenas ?? [], c.decayKm ?? 5);
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
