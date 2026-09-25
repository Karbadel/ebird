// Textos de ayuda del portal (botones (?) y tooltips). Centralizados aquí para
// revisarlos y corregirlos en un solo lugar. Mantener breves y basados en dato
// verificable; las notas metodológicas de cada capa viven en `help` de
// usePortalStore (LAYERS).

export const AYUDA = {
  // ── Panel de capas ─────────────────────────────────────────────────────────
  capas:
    'Enciende o apaga capas del mapa con su casilla. Están agrupadas por tema; el filtro de texto busca por nombre o fuente, y los chips CÓNDOR / CARROÑA / ENERGÉTICA / SOLO ACTIVAS acotan la lista. El (?) de cada capa explica su origen y limitaciones. Algunas capas tienen control de opacidad y de buffer (anillo de proximidad, solo visual). «Limpiar» apaga todas; «Ver leyenda» muestra la escala de las capas encendidas.',
  capasCargar:
    'Superpone tus propios archivos KML o KMZ (p. ej. el trazado de un proyecto) para compararlos con las capas del portal. Se procesan en tu navegador: no se suben a ningún servidor y no alteran el índice de riesgo. Se pierden al recargar la página.',

  // ── Pestañas del panel de resultados ──────────────────────────────────────
  ficha:
    'Ficha del cóndor andino (Vultur gryphus): estado de conservación, biología y amenazas según la ficha RCE del MMA (15° proceso, 2018) y UICN. Las cifras de registros eBird se calculan en vivo con los datos cargados en el portal.',
  lista:
    'Registros recientes de cóndor andino en Chile obtenidos de la API de eBird (últimos 30 días al momento de la última actualización de datos). Clic en un registro para ubicarlo en el mapa. Son observaciones ciudadanas: indican presencia, no abundancia.',
  sitios:
    'Localidades de eBird ordenadas por número de registros de cóndor en la ventana de datos. Sirve para identificar sitios con observaciones recurrentes; depende del esfuerzo de observación (más observadores, más registros).',
  riesgo:
    'Motor del índice de riesgo de colisión (0–100). Activa la consulta y haz clic en el mapa: el índice combina, con los pesos indicados, la cercanía a infraestructura (parques, líneas), la sensibilidad del sitio (hábitat, nidos, terreno) y los atrayentes de carroña. Es un modelo indicativo, no una medición en terreno.',
  comiteParques:
    'Puntúa los 30 parques eólicos en operación con los pesos actuales del motor y los ordena por índice. Clic en una fila para ir al parque y ver el desglose. Exportable a CSV e imprimible. Como cada parque se evalúa en su propia ubicación, la cercanía a parques es constante y el orden lo dan los demás criterios.',
  comitePotencial:
    'Cruza las 2.277 áreas de potencial eólico bruto (MINENERGIA 2026) con el índice de riesgo: MW y superficie por categoría, a nivel nacional y por región. Se recalcula al instante al cambiar los pesos o el perfil. El índice de cada área se evalúa en un punto interior (ver aviso metodológico del panel).',
  tiempo:
    'Colisiones confirmadas de cóndor con aerogeneradores por año (29 casos, 2019–2025), con total, año pico y años con registro. Es el registro de casos informados: puede no incluir colisiones no detectadas.',
  colisiones:
    'Colisiones confirmadas de cóndor con aerogeneradores (29 casos, 2019–2025) agrupadas por parque eólico, con región y años con casos. Cada caso está georreferenciado (capa «Colisiones confirmadas»).',

  // ── Motor de riesgo ───────────────────────────────────────────────────────
  consulta:
    'Activa el modo consulta: cada clic en el mapa calcula el índice en ese punto y abre la ficha con el desglose. Mientras está activa, el clic no sirve para medir ni dibujar correcciones de campo.',
  variables:
    'Peso: importancia relativa de cada criterio (se normaliza sobre la suma de los activos, no necesita sumar 100). Distancia de influencia: hasta dónde «llega» un elemento; el puntaje de cercanía baja linealmente de 1 (encima) a 0 (a esa distancia). Desmarca una variable para excluirla. Un criterio sin dato en el punto (p. ej. terreno fuera de Atacama–Maule) se excluye y el resto se renormaliza.',
  perfil:
    'Un perfil es un conjunto de pesos pensado para una pregunta. «Vigente»: ¿qué tan riesgoso es un punto por la infraestructura que ya existe? (para parques en operación). «Sensibilidad del sitio»: si se construyera un parque aquí, ¿qué tan sensible es el lugar para el cóndor? (para zonas sin parques, como el potencial eólico). Este segundo es una propuesta pendiente de validación del comité. Si editas un peso a mano el perfil pasa a «Personalizado». El perfil activo queda registrado en los informes.',
  correcciones:
    'Agrega en el mapa elementos observados en terreno que no están en las capas oficiales: corrales o atrayentes de ganado, líneas eléctricas y antenas (percha o dormidero). Entran al cálculo del índice en vivo (las antenas con peso 0 salvo que se lo asignes). Se guardan en este navegador y se pueden exportar e importar como GeoJSON para compartirlas.',

  // ── Ficha de resultado (punto consultado) ─────────────────────────────────
  indice:
    'Índice de riesgo de colisión, 0–100: promedio ponderado de los puntajes de los criterios activos. Categorías: Muy bajo < 12 · Bajo 12–29 · Medio 30–49 · Alto 50–69 · Muy alto ≥ 70. Es indicativo y regional: no sustituye la evaluación ambiental del proyecto.',
  criterios:
    'Valor: el dato medido en el punto (distancia, idoneidad, etc.). Puntaje: ese valor llevado a 0–1 (1 = máximo aporte al riesgo). Peso: importancia del criterio en el índice. «s/d» o «sin dato»: el criterio no aplica en ese punto y no cuenta.',
  cercania:
    'Registros eBird de cóndor, nidos y dormideros (evidencia C3/C4) y colisiones confirmadas dentro de un radio de 25 km del punto consultado. Es contexto: no entra al cálculo del índice.',
  recientes:
    'Registros eBird de cóndor dentro de 25 km del punto consultado: fecha, localidad y número de individuos. Clic en una fila para ubicarlo en el mapa; exportables a CSV.',

  // ── Mapa ──────────────────────────────────────────────────────────────────
  leyenda:
    'Muestra la escala de color de las capas encendidas. Las escalas de idoneidad y densidad son continuas; las de categorías (estado de proyectos, índice de riesgo) son discretas.',
  medir:
    'Clic en el mapa para agregar vértices; se suma la distancia geodésica (sobre la curvatura de la Tierra) entre ellos. «Deshacer» quita el último punto; «Limpiar» reinicia.',
} as const;

export type AyudaKey = keyof typeof AYUDA;
