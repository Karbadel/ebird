// Contenido demostrativo del portal Cóndores y Energía Eólica.
// Las observaciones de aves vienen de datos reales (eBird); las capas
// geoespaciales de riesgo/colisiones/parques son datos de demostración.

export type IconKey =
  | 'home' | 'users' | 'map' | 'book' | 'file' | 'down'
  | 'net' | 'info' | 'alert' | 'bulb' | 'layers' | 'clip';

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

export const CARDS_1: [IconKey, string, string, string][] = [
  ['alert', 'Mapa de riesgo', 'Identifica las zonas con mayor riesgo para el cóndor andino en relación con proyectos eólicos.', 'Explorar mapa →'],
  ['clip', 'Registro de colisiones de cóndores', 'Información histórica y georreferenciada de colisiones de cóndores con aerogeneradores.', 'Ver registro →'],
  ['book', 'Medidas y buenas prácticas', 'Documentos, guías y recomendaciones para prevenir y minimizar impactos en cóndores.', 'Explorar documentos →'],
  ['file', 'Estudios', 'Biblioteca de estudios nacionales e internacionales sobre cóndores y energía eólica.', 'Ver estudios →'],
  ['down', 'Descarga de datos', 'Descarga capas geoespaciales y documentos en distintos formatos.', 'Ir a descargas →'],
];

export const CARDS_2: [IconKey, string, string | string[], string][] = [
  ['users', 'Comité técnico · Reunión N°1', ['Acta de reunión', 'Presentaciones', 'Acuerdos y compromisos', 'Lista de participantes'], 'Ver todos los documentos →'],
  ['clip', 'Medidas implementadas en Chile', 'Conoce las medidas ya aplicadas en proyectos eólicos del país.', 'Ver medidas implementadas →'],
  ['bulb', 'Medidas propuestas', 'Recomendaciones técnicas y operacionales en evaluación por el comité.', 'Ver medidas propuestas →'],
  ['net', 'Actores relevantes', 'Organismos públicos, desarrolladores, academia, ONG y otros actores involucrados en esta temática.', 'Ver todos los actores →'],
  ['layers', 'Capas geoespaciales disponibles', 'Accede a datos geoespaciales para análisis y planificación territorial.', 'Ver capas disponibles →'],
];

// Escala de categorías del índice de riesgo (leyenda y barras).
export const RISK_COLORS = ['#5b8a63', '#7f9a58', '#d8b445', '#c9793c', '#a8452f'];
export const RISK_LABELS = ['Muy bajo', 'Bajo', 'Medio', 'Alto', 'Muy alto'];

// Medidas de mitigación aplicables (recomendaciones de dominio, no dato del sitio).
export const MEASURES: { t: string; tag: string }[] = [
  { t: 'Detención por demanda ante avistamiento', tag: 'Operación' },
  { t: 'Pintado de una pala (contraste visual)', tag: 'Diseño' },
  { t: 'Retiro de carroña en el área del parque', tag: 'Manejo' },
];
