// Modelo de índice de riesgo de colisión de cóndores, portado de
// mapa_riesgo_condores.html. Pesos y distancias de influencia editables.

export type RiskKind = 'proximity' | 'habitat' | 'ganado' | 'ebird_density' | 'terreno_3km' | 'user_antenas';

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
  // Terreno y antenas de campo entran con peso 0 (informativos): están disponibles
  // en el motor pero NO alteran el índice publicado hasta que se les asigne peso.
  { id: 'terreno_3km', label: 'Pendiente / rugosidad del terreno (3km)', kind: 'terreno_3km', weight: 0, enabled: true },
  { id: 'antenas', label: 'Antenas de telecomunicaciones (percha/dormidero, campo)', kind: 'user_antenas', weight: 0, decayKm: 5, enabled: true },
];

/** Perfil de pesos: conjunto nombrado de pesos sobre DEFAULT_RISK_CONFIG (las
 *  distancias de influencia y la activación quedan en sus valores por defecto). */
export interface RiskProfile {
  id: string;
  label: string;
  /** Estado de validación (se muestra junto al selector y en los informes). */
  estado: string;
  nota: string;
  /** Pesos que cambian respecto de DEFAULT_RISK_CONFIG (id de variable → %). */
  weights: Record<string, number>;
}

export const RISK_PROFILES: RiskProfile[] = [
  {
    id: 'vigente',
    label: 'Vigente',
    estado: 'Pesos por defecto del motor',
    nota:
      'Responde: «¿qué tan riesgoso es este punto por la infraestructura que YA existe?». Por eso el 40% del peso es ' +
      'cercanía a parques eólicos y líneas de transmisión actuales. Úsalo para evaluar parques en operación. Ojo: en ' +
      'zonas sin parques cerca (como el potencial eólico) el índice sale bajo porque hoy no hay turbinas, no porque el ' +
      'sitio sea seguro para el cóndor.',
    weights: {},
  },
  {
    id: 'sensibilidad',
    label: 'Sensibilidad del sitio',
    estado: 'PROPUESTA técnica — pendiente de validación del comité',
    nota:
      'Responde: «si se construyera un parque aquí, ¿qué tan sensible es este lugar para el cóndor?». Útil para zonas ' +
      'donde aún no hay parques, como el potencial eólico bruto. No evalúa proyectos concretos: el potencial es recurso ' +
      'de viento, no proyectos. Deja fuera la cercanía a parques existentes (0%), baja las líneas a 5% y da el peso a ' +
      'las condiciones del lugar: hábitat 30%, nidos 25%, terreno 10%, vertederos 10% y el resto 5%. ' +
      'Punto a discutir: con 0% no considera el efecto acumulado de sumar un parque junto a otros ya existentes; el ' +
      'comité podría preferir un peso bajo (5–10%).',
    weights: { wind: 0, lineas: 5, habitat: 30, nidos: 25, vertederos: 10, veranadas: 5, ganado: 5, colisiones: 5, ebird_densidad: 5, terreno_3km: 10 },
  },
];

/** Configuración de un perfil: la por defecto con sus pesos sustituidos. */
export function configForProfile(id: string): RiskVar[] {
  const p = RISK_PROFILES.find((x) => x.id === id);
  return DEFAULT_RISK_CONFIG.map((v) => ({ ...v, weight: p?.weights[v.id] ?? v.weight }));
}

export interface RiskCategory {
  label: string;
  /** Relleno de la categoría (chip, polígono, barra). */
  color: string;
  /** Color de texto legible SOBRE `color` (tinta en los tonos claros, blanco en los oscuros). */
  text: string;
}

/** Escala ORDINAL de las 5 categorías, muy bajo → muy alto: un solo tono
 *  (terracota, OKLCH h≈45) con luminosidad monótona 0,74 → 0,34. Validada con el
 *  validador de dataviz (--ordinal): pasos ΔL ≥ 0,06 y extremo claro ≥ 2:1 sobre
 *  el papel. Reemplaza el semáforo verde→rojo (dos verdes casi iguales y pares
 *  rojo/verde que se confunden con daltonismo). */
export const RISK_CAT_COLORS = ['#db997b', '#c7734b', '#ae4e1a', '#8d3000', '#661900'];
const RISK_CAT_TEXT = ['#21281f', '#21281f', '#ffffff', '#ffffff', '#ffffff'];
const RISK_CAT_LABELS = ['Muy bajo', 'Bajo', 'Medio', 'Alto', 'Muy alto'];

export function riskCategory(score: number): RiskCategory {
  const k = score >= 70 ? 4 : score >= 50 ? 3 : score >= 30 ? 2 : score >= 12 ? 1 : 0;
  return { label: RISK_CAT_LABELS[k]!, color: RISK_CAT_COLORS[k]!, text: RISK_CAT_TEXT[k]! };
}

/** IDs de las capas GeoJSON que alimentan el motor (web/public/data/riesgo/). */
export const RISK_LAYER_IDS = [
  'wind', 'lineas', 'nidos', 'colisiones', 'vertederos',
  'veranadas', 'ganado', 'habitat', 'ebird_densidad',
] as const;
