/**
 * Precálculo: mediciones de riesgo por polígono de potencial eólico bruto.
 *
 * Puntuar los 2.277 polígonos con riskAtPoint en el navegador tomaría ~10 min
 * (~275 ms/punto, casi todo en distancias a líneas de transmisión). Pero esas
 * mediciones NO dependen de los pesos ni de las distancias de influencia, así que
 * se calculan una vez aquí —con el MISMO código TypeScript del motor
 * (measureAtPoint), sin reimplementarlo en Python— y el navegador aplica la
 * configuración en vivo con scoreMeasures (instantáneo).
 *
 * Re-ejecutar cuando cambien las capas del motor (web/public/data/riesgo/) o el
 * potencial eólico; NO al cambiar pesos.
 *
 * Uso (desde web/):  npm run precompute:potencial      (~10 min)
 * Salida: public/data/riesgo/potencial_medidas.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { FeatureCollection, Position } from 'geojson';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';
import { measureAtPoint, riskAtPoint, scoreMeasures, type RiskData, type PointMeasures } from '../src/lib/riskEngine';
import { DEFAULT_RISK_CONFIG, RISK_LAYER_IDS } from '../src/data/riskConfig';

const RIESGO = 'public/data/riesgo/';
const SRC = 'public/data/layers/potencial_eolico.geojson';
const OUT = `${RIESGO}potencial_medidas.json`;

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

function ringArea(r: Position[]): number {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j]![0]! * r[i]![1]!) - (r[i]![0]! * r[j]![1]!);
  return a / 2;
}

function ringCentroid(r: Position[]): Position {
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j]![0]! * r[i]![1]! - r[i]![0]! * r[j]![1]!;
    cx += (r[j]![0]! + r[i]![0]!) * f;
    cy += (r[j]![1]! + r[i]![1]!) * f;
    a += f;
  }
  return a === 0 ? r[0]! : [cx / (3 * a), cy / (3 * a)];
}

/** Punto garantizado dentro del polígono (el mayor, si es multipolígono): el
 *  centroide si cae dentro; si no (formas cóncavas), el centro del tramo interior
 *  más ancho de la horizontal que pasa por el centroide (regla par-impar, respeta
 *  los huecos). Equivalente práctico de turf/point-on-feature. */
function interiorPoint(rings: Position[][]): Position {
  const c = ringCentroid(rings[0]!);
  if (booleanPointInPolygon(point(c), polygon(rings))) return c;
  const y = c[1]!;
  const xs: number[] = [];
  for (const r of rings)
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [x1, y1] = r[j]! as [number, number];
      const [x2, y2] = r[i]! as [number, number];
      if (y1 > y !== y2 > y) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
    }
  xs.sort((a, b) => a - b);
  let best: Position | null = null;
  let width = -1;
  for (let i = 0; i + 1 < xs.length; i += 2) {
    const w = xs[i + 1]! - xs[i]!;
    if (w > width) {
      width = w;
      best = [(xs[i]! + xs[i + 1]!) / 2, y];
    }
  }
  return best ?? rings[0]![0]!;
}

const data: RiskData = Object.fromEntries(RISK_LAYER_IDS.map((id) => [id, readJson<FeatureCollection>(`${RIESGO}${id}.geojson`)]));
const terrenoCells = readJson<{ cells: [number, number, number, number, number, number][] }>(`${RIESGO}terreno_3km.json`).cells;
const fc = readJson<FeatureCollection>(SRC);

interface Item {
  id: number;
  region: string;
  ha: number;
  mw: number;
  lat: number;
  lng: number;
  m: PointMeasures;
}

const items: Item[] = [];
const t0 = Date.now();
for (const f of fc.features) {
  const g = f.geometry;
  if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) continue;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const main = polys.reduce((a, b) => (Math.abs(ringArea(b[0]!)) > Math.abs(ringArea(a[0]!)) ? b : a));
  const [lng, lat] = interiorPoint(main) as [number, number];
  const m = measureAtPoint(lat, lng, DEFAULT_RISK_CONFIG, data, terrenoCells);
  const p = f.properties ?? {};
  // región/ha/mw viajan con las mediciones: el resumen del comité no necesita
  // descargar la geometría (7,6 MB), solo este archivo.
  items.push({ id: Number(p['id']), region: String(p['region'] ?? ''), ha: Number(p['ha'] ?? 0), mw: Number(p['mw'] ?? 0), lat, lng, m });
  if (items.length % 100 === 0) {
    const s = (Date.now() - t0) / 1000;
    const eta = (s / items.length) * (fc.features.length - items.length);
    console.log(`${items.length}/${fc.features.length} · ${s.toFixed(0)} s · faltan ~${(eta / 60).toFixed(1)} min`);
  }
}

// JSON.stringify convierte Infinity/NaN en null en silencio (nunca escribe el
// `NaN` literal que rompió comunas_centroides.json); measureAtPoint ya guarda null
// para distancias infinitas, y la paridad de abajo detecta cualquier otra pérdida.
const json = JSON.stringify({
  note: 'Mediciones del motor de riesgo (measureAtPoint) en un punto interior por polígono de potencial eólico bruto. Independientes de pesos y distancias de influencia; el índice se calcula en el navegador con scoreMeasures.',
  source: 'potencial_eolico.geojson + data/riesgo/*',
  generated: new Date().toISOString(),
  items,
});
writeFileSync(OUT, json);

// Chequeo de paridad: la ida y vuelta por JSON debe reproducir riskAtPoint exacto.
const back = (JSON.parse(json) as { items: Item[] }).items;
let bad = 0;
for (let i = 0; i < back.length; i += Math.ceil(back.length / 25)) {
  const it = back[i]!;
  const a = JSON.stringify(scoreMeasures(it.lat, it.lng, it.m, DEFAULT_RISK_CONFIG));
  const b = JSON.stringify(riskAtPoint(it.lat, it.lng, DEFAULT_RISK_CONFIG, data, { terrenoCells }));
  if (a !== b) bad++;
}
console.log(`OK ${items.length} polígonos -> ${OUT} (${(json.length / 1e6).toFixed(2)} MB) en ${((Date.now() - t0) / 60000).toFixed(1)} min`);
if (bad) throw new Error(`Paridad FALLIDA en ${bad} puntos de muestra`);
console.log('Paridad scoreMeasures(JSON) == riskAtPoint: OK (muestra de 25)');
