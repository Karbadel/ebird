/**
 * Fotografía del índice de riesgo para comparar versiones del motor.
 *
 * Puntúa, con el motor TypeScript y los archivos de web/public/data/:
 *   · «parques30»: los 30 parques del catastro 2018 (riesgo/wind.geojson, archivo
 *     conservado solo para esta comparación) — la línea base histórica;
 *   · «ranking»: los parques operativos (categoría OPC) de parques_eolicos.geojson,
 *     el mismo conjunto que puntúa el ranking del Motor;
 *   · «control»: 26 puntos fijos repartidos por Chile (norte, centro, sur; cerca y
 *     lejos de parques y nidos).
 * para cada perfil de pesos (Vigente, Sensibilidad del sitio), con el desglose por criterio.
 *
 * Uso (desde web/):  npm run indice:snapshot -- RUTA_SALIDA.json
 * La línea base «antes» (2026-09-29) se generó con el motor anterior y el mismo
 * formato; docs/comparacion-indice-2026-09-29.md la compara con la de este script.
 */
import { writeFileSync } from 'node:fs';
import type { FeatureCollection } from 'geojson';
import { PARQUES_CATEGORIA_RANKING, RISK_PROFILES, configForProfile } from '../src/data/riskConfig';
import { riskAtPoint } from '../src/lib/riskEngine';
import { cargarMotor, readJson } from './cargarMotor';

const CONTROL: [string, number, number][] = [
  ['Arica, precordillera', -18.5, -69.6],
  ['Pozo Almonte', -20.25, -69.79],
  ['Valle de los Vientos (parque)', -22.52, -68.82],
  ['Calama, desierto alejado', -22.9, -68.2],
  ['Taltal (parque)', -25.08, -69.86],
  ['Taltal, costa alejada', -25.4, -70.5],
  ['Copiapó', -27.37, -70.33],
  ['San Juan (parque)', -28.88, -71.47],
  ['Freirina (nido)', -28.95, -71.23],
  ['Punta Colorada (parque)', -29.37, -71.04],
  ['Laguna El Cepo (nido)', -30.265, -70.301],
  ['Talinay (parque)', -30.83, -71.6],
  ['Ovalle, interior alejado', -30.6, -70.9],
  ['Canela (parque)', -31.29, -71.61],
  ['Farellones (nido)', -33.366, -70.307],
  ['Santiago, ciudad', -33.45, -70.66],
  ['Ucuquer (parque)', -34.04, -71.61],
  ['Curicó, cordillera', -35.0, -70.9],
  ['Cuel, Los Ángeles (parque)', -37.51, -72.48],
  ['Lebu (parque)', -37.68, -73.65],
  ['Temuco', -38.74, -72.6],
  ['Antillanca (nido)', -40.785, -72.191],
  ['Chiloé, San Pedro (parque)', -42.28, -73.92],
  ['Cerro Castillo (nido)', -46.066, -72.017],
  ['Laguna Sofía (nido)', -51.566, -72.609],
  ['Cabo Negro (parque)', -52.95, -70.83],
];

const out = process.argv[2];
if (!out) throw new Error('Falta la ruta de salida: npm run indice:snapshot -- RUTA.json');

const { data, grids, terrenoCells } = cargarMotor();
const extras = { terrenoCells, grids };
const wind30 = readJson<FeatureCollection>('riesgo/wind.geojson');
const opc = data['parques_eolicos']!.features.filter((f) => f.properties?.['categoria'] === PARQUES_CATEGORIA_RANKING);

const score = (lat: number, lng: number, cfg: ReturnType<typeof configForProfile>) => {
  const r = riskAtPoint(lat, lng, cfg, data, extras);
  return { total: r.total, cat: r.category.label, rows: r.rows };
};

const result: Record<string, unknown> = { engine: 'despues', profiles: {} };
const profiles = result['profiles'] as Record<string, unknown>;
for (const p of RISK_PROFILES) {
  const cfg = configForProfile(p.id);
  const parks30 = wind30.features.map((f) => {
    const [lng, lat] = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    return { nombre: f.properties?.['nombre'], lat, lng, mw: Number(f.properties?.['potencia_mw']), ...score(lat, lng, cfg) };
  });
  const ranking = opc.map((f) => {
    const [lng, lat] = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
    const pr = f.properties ?? {};
    return {
      nombre: pr['nombre'], region: pr['region'], comuna: pr['comuna'], estado: pr['estado'],
      lat, lng, mw: Number(pr['potencia_mw']), ...score(lat, lng, cfg),
    };
  });
  const control = CONTROL.map(([nombre, lat, lng]) => ({ nombre, lat, lng, ...score(lat, lng, cfg) }));
  profiles[p.id] = { parks30, ranking, control };
}
writeFileSync(out, JSON.stringify(result, null, 1));
console.log(`OK ${out} (perfiles: ${RISK_PROFILES.map((p) => p.id).join(', ')}; ranking de ${opc.length} parques)`);
