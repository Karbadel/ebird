/**
 * MW, hectáreas y nº de áreas de potencial eólico bruto por categoría de riesgo, para
 * cada perfil de pesos, a partir de las mediciones precalculadas
 * (public/data/riesgo/potencial_medidas.json) y del motor (scoreMeasures). Además
 * guarda el índice de cada área para poder compararlo entre versiones del motor.
 *
 * Uso (desde web/):  npm run potencial:clases -- RUTA_SALIDA.json [RUTA_MEDIDAS.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { RISK_PROFILES, configForProfile } from '../src/data/riskConfig';
import { scoreMeasures, type PointMeasures } from '../src/lib/riskEngine';

const out = process.argv[2];
const medidas = process.argv[3] ?? 'public/data/riesgo/potencial_medidas.json';
if (!out) throw new Error('Falta la ruta de salida: npm run potencial:clases -- RUTA.json');

interface Item { id: number; region: string; ha: number; mw: number; lat: number; lng: number; m: PointMeasures }
const items = (JSON.parse(readFileSync(medidas, 'utf8')) as { items: Item[] }).items;

const result: Record<string, { clases: Record<string, { mw: number; n: number; ha: number }>; indice: Record<string, number> }> = {};
for (const p of RISK_PROFILES) {
  const cfg = configForProfile(p.id);
  const clases: Record<string, { mw: number; n: number; ha: number }> = {};
  const indice: Record<string, number> = {};
  for (const it of items) {
    const r = scoreMeasures(it.lat, it.lng, it.m, cfg);
    const c = (clases[r.category.label] ??= { mw: 0, n: 0, ha: 0 });
    c.mw += it.mw;
    c.n += 1;
    c.ha += it.ha;
    indice[String(it.id)] = r.total;
  }
  result[p.id] = { clases, indice };
}
writeFileSync(out, JSON.stringify(result));
console.log(`OK ${out}: ${items.length} áreas`);
