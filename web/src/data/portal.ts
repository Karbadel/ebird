import type { Page, Tab } from '../store/usePortalStore';
// Contenido demostrativo del portal Cóndores y Energía Eólica.
// Las observaciones de aves vienen de datos reales (eBird); las capas
// geoespaciales de riesgo/colisiones/parques son datos de demostración.

export type IconKey =
  | 'home' | 'users' | 'map' | 'book' | 'file' | 'down'
  | 'net' | 'info' | 'alert' | 'bulb' | 'layers' | 'clip'
  | 'condor' | 'mapaRiesgo' | 'motorIcon' | 'capasInfo' | 'graficosBar';

export const ICON: Record<IconKey, string> = {
  home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M19 20a5 5 0 0 0-3-4.6"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  book: '<path d="M4 4h7v16H4z"/><path d="M13 4h7v16h-7z"/>',
  file: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h4"/>',
  down: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
  net: '<circle cx="12" cy="6" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 8.5 6.5 15.8M12 8.5l5.5 7.3M7.5 18h9"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  alert: '<path d="M12 4 3 20h18z"/><path d="M12 10v5M12 17.5h.01"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9V18h7v-4.1A6 6 0 0 0 12 3Z"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  clip: '<path d="M9 3h6v3H9z"/><path d="M6 5h12v16H6z"/><path d="M9 12h6M9 16h4"/>',
  // Cóndor en vuelo, alas extendidas (riel: «La Especie»).
  condor: '<path d="M1 12.5c2.6-3.3 4.8-3.9 6-1.8.9-2.9 2.4-4.4 5-4.4s4.1 1.5 5 4.4c1.2-2.1 3.4-1.5 6 1.8"/><path d="M12 6.3v7.2"/><path d="m9.3 17 2.7-3.5L14.7 17"/>',
  // Mapa plegado con pin (riel: «Mapa de Riesgo»).
  mapaRiesgo: '<path d="m3 5 6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 2.5V16M15 5v5.3"/><path d="M18 12.2a2.8 2.8 0 0 1 2.8 2.8c0 2-2.8 5-2.8 5s-2.8-3-2.8-5a2.8 2.8 0 0 1 2.8-2.8Z"/>',
  // Plano/hoja con puntos y cruces (riel: «Motor de índice»).
  motorIcon: '<path d="M5 3h11l3 3v15H5z"/><path d="M16 3v3h3"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="16.5" r="1"/><path d="m7 16.5 2.2 2.2m0-2.2-2.2 2.2"/><path d="m13 9 2.2 2.2m0-2.2L13 11.2"/>',
  // Carpeta con lupa (riel: «Capas de Información»).
  capasInfo: '<path d="M3 6.5h6l2 2h10v11H3z"/><circle cx="14.5" cy="15.5" r="3"/><path d="m17 18 3 3"/>',
  // Gráfico de barras (riel: «Gráficos»).
  graficosBar: '<path d="M4 20V11M10 20V4M16 20v-6M3 20h18"/>',
};

export const NAV: [IconKey, string, string, boolean?][] = [
  ['home', 'Inicio', 'Portada', true],
  ['users', 'Comité Técnico', 'Reunión N°1'],
  ['map', 'Visor geoespacial', 'Mapas y capas'],
  ['book', 'Medidas y buenas prácticas', 'Documentos y guías'],
  ['file', 'Estudios', 'Biblioteca técnica'],
  ['down', 'Descarga de datos', 'Datos y documentos'],
  ['net', 'Actores relevantes', 'Quiénes participan'],
  ['info', 'Metodología', 'Cómo se construye la información'],
];

// Destino de una tarjeta de «Explorar el portal»: una pestaña del visor o una
// página institucional. Sin `go`, la tarjeta solo desplaza al visor.
export type PortalGo = { tab: Tab } | { page: Exclude<Page, 'visor'> };

/** Tarjeta de «Explorar el portal». `pend`: sección sin contenido aún → NO se
 *  muestra (decisión: ocultar hasta que exista). */
export interface PortalCard {
  icon: IconKey;
  t: string;
  b: string | string[];
  a: string;
  go?: PortalGo;
  pend?: boolean;
}

export const CARDS: PortalCard[] = [
  { icon: 'mapaRiesgo', t: 'Mapa de riesgo', b: 'Consulta el índice de riesgo de colisión del cóndor andino en cualquier punto del mapa y su desglose por criterio.', a: 'Consultar riesgo →', go: { tab: 'riesgo' } },
  { icon: 'book', t: 'Guía de buenas prácticas', b: 'Propuesta de guía técnica para prevenir y minimizar impactos en cóndores (pendiente de validación por la Mesa de Cóndores).', a: 'Ver propuesta →', go: { page: 'guia' } },
  { icon: 'users', t: 'Comité técnico', b: 'Acuerdos Generales de la Mesa de Cóndores (diciembre de 2025), sesiones de trabajo y actividades 2026.', a: 'Ir al Comité →', go: { page: 'comite' } },
  { icon: 'capasInfo', t: 'Capas geoespaciales disponibles', b: 'Capas del cóndor, infraestructura energética, recurso eólico y contexto territorial, con nota metodológica de cada una.', a: 'Ver capas disponibles →', go: { page: 'capas' } },
  // En construcción (ocultas hasta tener contenido real).
  { icon: 'clip', t: 'Registro de colisiones de cóndores', b: 'Colisiones confirmadas de cóndores con aerogeneradores (2019–2025), por año y por parque eólico.', a: 'Ver registro →', pend: true },
  { icon: 'file', t: 'Estudios', b: 'Biblioteca de estudios nacionales e internacionales sobre cóndores y energía eólica.', a: 'Ver estudios →', pend: true },
  { icon: 'down', t: 'Descarga de datos', b: 'Descarga capas geoespaciales y documentos en distintos formatos.', a: 'Ir a descargas →', pend: true },
  { icon: 'users', t: 'Comité técnico · Reunión N°1', b: ['Acta de reunión', 'Presentaciones', 'Acuerdos y compromisos', 'Lista de participantes'], a: 'Ver todos los documentos →', pend: true },
  { icon: 'clip', t: 'Medidas implementadas en Chile', b: 'Conoce las medidas ya aplicadas en proyectos eólicos del país.', a: 'Ver medidas implementadas →', pend: true },
  { icon: 'bulb', t: 'Medidas propuestas', b: 'Recomendaciones técnicas y operacionales en evaluación por el comité.', a: 'Ver medidas propuestas →', pend: true },
  { icon: 'net', t: 'Actores relevantes', b: 'Organismos públicos, desarrolladores, academia, ONG y otros actores involucrados en esta temática.', a: 'Ver todos los actores →', pend: true },
];

// Escala de categorías del índice de riesgo (leyenda y barras).
export { RISK_CAT_COLORS as RISK_COLORS } from './riskConfig';
// Muestras de la rampa real de la capa de idoneidad (HABITAT_RAMP de
// src/build_idoneidad.py, que pinta el PNG; pasos 0/2/4/7/9) para su leyenda: antes la
// leyenda usaba la escala de riesgo y no coincidía con lo que pinta el mapa.
export const HABITAT_LEGEND = ['#1c8eb0', '#a9d69f', '#f5f3b6', '#fdb561', '#da3726'];
export const RISK_LABELS = ['Muy bajo', 'Bajo', 'Medio', 'Alto', 'Muy alto'];
// Rampa de la capa de abundancia eBird S&T: idéntica a ABUND_RAMP de
// src/build_abundancia.py (que pinta el PNG), para el swatch y la leyenda.
export const ABUNDANCIA_RAMP = ['#f4f7b4', '#c5e58a', '#79d37f', '#2fb59b', '#2a8bab', '#3a5aa8', '#3f2f86', '#2a0f5a'];

// Estados de la capa "Instalaciones y proyectos de generación" (id 'projects'),
// del más incipiente al operativo (rampa de madurez del proyecto). Se usan en el
// mapa (color del punto) y en la leyenda. La clave debe coincidir EXACTA con el
// valor del campo `estado` del GeoJSON (generado por src/build_generacion.py).
export const GEN_ESTADOS: { key: string; label: string; color: string }[] = [
  { key: 'En Calificación', label: 'En calificación', color: '#b0a1b8' },
  { key: 'Aprobado', label: 'Aprobado', color: '#6f9bd1' },
  { key: 'En Construcción', label: 'En construcción', color: '#e0982e' },
  { key: 'En Pruebas', label: 'En pruebas', color: '#7fb04a' },
  { key: 'En Operación', label: 'En operación', color: '#2f7d4f' },
];
export const GEN_ESTADO_COLOR: Record<string, string> = Object.fromEntries(
  GEN_ESTADOS.map((e) => [e.key, e.color]),
);
// Gradiente para el swatch del sidebar (representa las 5 categorías de estado).
export const GEN_SWATCH = `linear-gradient(90deg,${GEN_ESTADOS.map((e) => e.color).join(',')})`;

// Categorías de la capa «Parques eólicos (OPC · En SEIA · Otros)» (id
// 'parques_eolicos'). La clave debe coincidir con la propiedad `categoria` del
// GeoJSON (src/build_capas_derivadas.py, a partir del `estado`).
export const PARQUES_CATEGORIAS: { key: string; label: string; color: string }[] = [
  { key: 'OPC', label: 'OPC · en operación o en pruebas', color: '#2f7d4f' },
  { key: 'En SEIA', label: 'En SEIA · en calificación', color: '#8e5fbf' },
  { key: 'Otros', label: 'Otros · aprobado o en construcción', color: '#3f7fc4' },
];
export const PARQUE_CAT_COLOR: Record<string, string> = Object.fromEntries(
  PARQUES_CATEGORIAS.map((c) => [c.key, c.color]),
);
export const PARQUES_SWATCH = `linear-gradient(90deg,${PARQUES_CATEGORIAS.map((c) => c.color).join(',')})`;

// Color del trazo/relleno de las capas dummy en el mapa y la leyenda (ámbar).
export const DUMMY_COLOR = '#d98c00';

// Medidas de mitigación aplicables (recomendaciones de dominio, no dato del sitio).
export const MEASURES: { t: string; tag: string }[] = [
  { t: 'Detención por demanda ante avistamiento', tag: 'Operación' },
  { t: 'Pintado de una pala (contraste visual)', tag: 'Diseño' },
  { t: 'Retiro de carroña en el área del parque', tag: 'Manejo' },
];
