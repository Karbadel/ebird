/**
 * Carga desde disco (web/public/data/) TODO lo que necesita el motor de riesgo, con
 * el mismo código y los mismos archivos que el navegador (useRiskStore.loadData).
 * Lo comparten los scripts de precálculo y de comparación. Ejecutar siempre desde web/.
 */
import { readFileSync } from 'node:fs';
import type { FeatureCollection } from 'geojson';
import { RISK_GRID_FILES, RISK_LAYER_FILES } from '../src/data/riskConfig';
import {
  decodeRasterGrid,
  prepareLayer,
  type RasterGridJson,
  type RiskData,
  type RiskGrids,
  type TerrenoCell,
} from '../src/lib/riskEngine';

export const DATA_DIR = 'public/data/';

export const readJson = <T>(rel: string): T => JSON.parse(readFileSync(`${DATA_DIR}${rel}`, 'utf8')) as T;

export interface MotorData {
  data: RiskData;
  grids: RiskGrids;
  terrenoCells: TerrenoCell[];
}

export function cargarMotor(): MotorData {
  const data: RiskData = Object.fromEntries(
    Object.entries(RISK_LAYER_FILES).map(([id, file]) => [id, prepareLayer(id, readJson<FeatureCollection>(file))]),
  );
  const grids: RiskGrids = {
    habitat: decodeRasterGrid(readJson<RasterGridJson>(RISK_GRID_FILES.habitat)),
    abundancia: decodeRasterGrid(readJson<RasterGridJson>(RISK_GRID_FILES.abundancia)),
  };
  const terrenoCells = readJson<{ cells: TerrenoCell[] }>('riesgo/terreno_3km.json').cells;
  return { data, grids, terrenoCells };
}
