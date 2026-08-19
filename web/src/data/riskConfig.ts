// Modelo de índice de riesgo de colisión de cóndores, portado de
// mapa_riesgo_condores.html. Pesos y distancias de influencia editables.

export type RiskKind = 'proximity' | 'habitat' | 'ganado' | 'ebird_density';

export interface RiskVar {
  id: string;
  label: string;
  kind: RiskKind;
  layerId?: string;
  weight: number;
  decayKm?: number;
  enabled: boolean;
}

export const DEFAULT_RISK_CONFIG: RiskVar[] = [
  { id: 'wind', label: 'Cercanía a parques eólicos', kind: 'proximity', layerId: 'wind', weight: 20, decayKm: 3, enabled: true },
  { id: 'lineas', label: 'Cercanía a líneas de transmisión', kind: 'proximity', layerId: 'lineas', weight: 20, decayKm: 2, enabled: true },
  { id: 'habitat', label: 'Idoneidad de hábitat', kind: 'habitat', weight: 20, enabled: true },
  { id: 'nidos', label: 'Cercanía a nidos de cóndor', kind: 'proximity', layerId: 'nidos', weight: 15, decayKm: 8, enabled: true },
  { id: 'vertederos', label: 'Cercanía a vertederos', kind: 'proximity', layerId: 'vertederos', weight: 10, decayKm: 15, enabled: true },
  { id: 'veranadas', label: 'Cercanía a veranadas', kind: 'proximity', layerId: 'veranadas', weight: 5, decayKm: 30, enabled: true },
  { id: 'ganado', label: 'Carga ganadera regional (carroña doméstica)', kind: 'ganado', weight: 5, decayKm: 30, enabled: true },
  { id: 'colisiones', label: 'Historial de colisiones cercanas', kind: 'proximity', layerId: 'colisiones', weight: 5, decayKm: 10, enabled: true },
  { id: 'ebird_densidad', label: 'Densidad de avistamientos (eBird)', kind: 'ebird_density', weight: 5, enabled: true },
];

export interface RiskCategory {
  label: string;
  color: string;
}

export function riskCategory(score: number): RiskCategory {
  if (score >= 70) return { label: 'Muy alto', color: '#7a1414' };
  if (score >= 50) return { label: 'Alto', color: '#c0392b' };
  if (score >= 30) return { label: 'Medio', color: '#e6a23c' };
  if (score >= 12) return { label: 'Bajo', color: '#2e7d32' };
  return { label: 'Muy bajo', color: '#1f6b4a' };
}

/** IDs de las capas GeoJSON que alimentan el motor (web/public/data/riesgo/). */
export const RISK_LAYER_IDS = [
  'wind', 'lineas', 'nidos', 'colisiones', 'vertederos',
  'veranadas', 'ganado', 'habitat', 'ebird_densidad',
] as const;
