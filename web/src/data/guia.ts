// Texto de la «Guía Técnica de Buenas Prácticas para el Desarrollo de Proyectos Eólicos y
// Líneas de Transmisión Compatibles con la Conservación del Cóndor Andino», entregada por el
// cliente sin autor ni fecha: se transcribe tal cual (cifras incluidas).
// En los textos, *así* marca cursiva (nombres científicos).

export type GuiaBloque =
  | { k: 'p'; x: string }
  | { k: 'h'; x: string }
  | { k: 'hs'; x: string }
  | { k: 'ul'; x: string[] };

export interface GuiaSeccion {
  id: string;
  titulo: string;
  // 'bp' = pertenece al bloque «Buenas Prácticas» del índice.
  grupo?: 'bp';
  bloques: GuiaBloque[];
}

export const GUIA_TITULO =
  'Guía Técnica de Buenas Prácticas para el Desarrollo de Proyectos Eólicos y Líneas de Transmisión Compatibles con la Conservación del Cóndor Andino';

export const GUIA: GuiaSeccion[] = [
  {
    id: 'resumen',
    titulo: 'Resumen Ejecutivo',
    bloques: [
      {
        k: 'p',
        x: 'El desarrollo de proyectos eólicos y de transmisión eléctrica constituye una pieza fundamental de la transición energética y la descarbonización. Sin embargo, la evidencia recopilada en Chile durante los últimos años demuestra la existencia de interacciones relevantes entre esta infraestructura y el cóndor andino (*Vultur gryphus*), incluyendo más de 20 casos de colisión registrados entre 2019 y 2024.',
      },
      {
        k: 'p',
        x: 'La presente guía propone un conjunto de buenas prácticas basadas en la experiencia acumulada por empresas del sector, especialistas, organismos públicos y organizaciones de conservación participantes de la Mesa de Cóndores.',
      },
      {
        k: 'p',
        x: 'La principal conclusión es que no existe una medida única capaz de eliminar completamente el riesgo. Los mejores resultados se obtienen mediante una estrategia integrada que combine:',
      },
      {
        k: 'ul',
        x: [
          'Selección adecuada del emplazamiento.',
          'Diseño informado por estudios especializados.',
          'Gestión permanente de focos de atracción.',
          'Detección temprana de cóndores.',
          'Detención dirigida de aerogeneradores.',
          'Monitoreo continuo.',
          'Manejo adaptativo.',
          'Coordinación institucional y sectorial.',
        ],
      },
    ],
  },
  {
    id: 'objetivos',
    titulo: 'Objetivos',
    bloques: [
      { k: 'h', x: 'Objetivo General' },
      {
        k: 'p',
        x: 'Establecer criterios y recomendaciones técnicas para prevenir, minimizar, monitorear y compensar potenciales impactos de proyectos eólicos y líneas de transmisión sobre el cóndor andino.',
      },
      { k: 'h', x: 'Objetivos Específicos' },
      {
        k: 'ul',
        x: [
          'Fomentar la incorporación temprana de criterios de conservación.',
          'Reducir el riesgo de colisión.',
          'Promover la estandarización de medidas.',
          'Facilitar el aprendizaje entre proyectos.',
          'Fortalecer la coordinación público-privada.',
        ],
      },
    ],
  },
  {
    id: 'antecedentes',
    titulo: 'Antecedentes Biológicos del Cóndor Andino',
    bloques: [
      { k: 'h', x: 'Características Generales' },
      {
        k: 'p',
        x: 'El cóndor andino es una de las aves voladoras más grandes del planeta, alcanzando aproximadamente 12 kg de peso y hasta 3 metros de envergadura alar.',
      },
      { k: 'p', x: 'Se caracteriza por:' },
      {
        k: 'ul',
        x: [
          'Actividad predominantemente diurna.',
          'Vuelo planeado utilizando corrientes térmicas.',
          'Uso relativamente predecible de corredores de vuelo.',
          'Dependencia de fuentes de alimento carroñero.',
          'Baja tasa reproductiva.',
          'Longevidad elevada.',
        ],
      },
      {
        k: 'p',
        x: 'Estas características hacen que su conservación dependa en gran medida de la supervivencia de individuos adultos.',
      },
      { k: 'h', x: 'Estado de Conservación' },
      {
        k: 'p',
        x: 'En Chile, el cóndor es Monumento Natural y se considera una especie de alta relevancia para la conservación. A nivel sudamericano existen distintas categorías de amenaza, observándose una creciente preocupación por los factores de mortalidad antropogénica.',
      },
    ],
  },
  {
    id: 'diagnostico',
    titulo: 'Diagnóstico de la Problemática',
    bloques: [
      { k: 'h', x: 'Evidencia de Colisiones' },
      {
        k: 'p',
        x: 'La información pública recopilada por especialistas permite confirmar al menos 21 eventos de colisión entre 2019 y 2024, aunque podrían existir casos adicionales no incluidos en registros públicos.',
      },
      {
        k: 'p',
        x: 'Asimismo, registros recientes muestran que las colisiones con aerogeneradores ya representan una de las principales causas emergentes de mortalidad documentada para la especie en Chile.',
      },
      { k: 'h', x: 'Superposición Territorial' },
      {
        k: 'p',
        x: 'La distribución actual del cóndor presenta una importante superposición con áreas de desarrollo eólico tanto operativas como proyectadas.',
      },
      {
        k: 'p',
        x: 'Lo anterior implica que el riesgo debe gestionarse desde la planificación territorial y no únicamente a nivel de proyecto individual.',
      },
    ],
  },
  {
    id: 'bp1',
    grupo: 'bp',
    titulo: '1. Principios de Gestión',
    bloques: [
      { k: 'h', x: 'Principio 1: Aplicación de la Jerarquía de Mitigación' },
      { k: 'p', x: 'Los proyectos deben seguir el siguiente orden:' },
      { k: 'ul', x: ['Evitar.', 'Minimizar.', 'Reparar.', 'Compensar.'] },
      { k: 'h', x: 'Principio 2: Prevención Temprana' },
      {
        k: 'p',
        x: 'La experiencia demuestra que las medidas implementadas durante la selección de sitio y diseño del proyecto son más efectivas que las medidas correctivas posteriores.',
      },
      { k: 'h', x: 'Principio 3: Manejo Adaptativo' },
      {
        k: 'p',
        x: 'Las medidas deben ajustarse continuamente según nuevos antecedentes y resultados de monitoreo.',
      },
      { k: 'h', x: 'Principio 4: Coordinación Interinstitucional' },
      { k: 'p', x: 'La conservación efectiva requiere participación de:' },
      {
        k: 'ul',
        x: [
          'Empresas.',
          'Autoridades ambientales.',
          'Ministerio de Energía.',
          'SAG.',
          'Centros de investigación.',
          'Organizaciones especializadas.',
        ],
      },
    ],
  },
  {
    id: 'bp2',
    grupo: 'bp',
    titulo: '2. Buenas Prácticas para la Selección de Sitio',
    bloques: [
      { k: 'h', x: 'Levantamiento de Línea Base' },
      { k: 'p', x: 'Se recomienda desarrollar estudios específicos de cóndor que permitan identificar:' },
      {
        k: 'ul',
        x: [
          'Corredores de vuelo.',
          'Dormideros.',
          'Buitreras.',
          'Sitios de alimentación.',
          'Alturas de vuelo.',
          'Variación estacional.',
        ],
      },
      { k: 'h', x: 'Evaluación de Riesgo' },
      { k: 'p', x: 'El análisis debería considerar:' },
      {
        k: 'ul',
        x: [
          'Frecuencia de uso del área.',
          'Conectividad entre hábitats.',
          'Disponibilidad de alimento.',
          'Cercanía a vertederos.',
          'Actividades ganaderas.',
          'Infraestructura existente.',
        ],
      },
      { k: 'h', x: 'Exclusión de Áreas Críticas' },
      { k: 'p', x: 'Evitar emplazar aerogeneradores en:' },
      {
        k: 'ul',
        x: [
          'Corredores de vuelo intensivo.',
          'Sectores con presencia permanente de cóndores.',
          'Entornos de nidos y dormideros.',
        ],
      },
    ],
  },
  {
    id: 'bp3',
    grupo: 'bp',
    titulo: '3. Buenas Prácticas para el Diseño de Parques Eólicos',
    bloques: [
      { k: 'h', x: 'Microemplazamiento' },
      {
        k: 'p',
        x: 'Utilizar la información de línea base para ajustar la ubicación específica de cada turbina.',
      },
      { k: 'h', x: 'Evaluación Acumulativa' },
      { k: 'p', x: 'Considerar simultáneamente:' },
      {
        k: 'ul',
        x: [
          'Otros parques eólicos.',
          'Líneas de transmisión.',
          'Actividades ganaderas.',
          'Vertederos.',
          'Infraestructura futura planificada.',
        ],
      },
      { k: 'h', x: 'Diseño Basado en Riesgo' },
      {
        k: 'p',
        x: 'Priorizar configuraciones que reduzcan la exposición de los cóndores a las zonas de barrido de aspas.',
      },
    ],
  },
  {
    id: 'bp4',
    grupo: 'bp',
    titulo: '4. Buenas Prácticas para Líneas de Transmisión',
    bloques: [
      { k: 'h', x: 'Identificación de Corredores de Vuelo' },
      { k: 'p', x: 'Las trazas deben diseñarse considerando:' },
      {
        k: 'ul',
        x: ['Rutas de desplazamiento.', 'Zonas de alimentación.', 'Conectividad ecológica.'],
      },
      { k: 'h', x: 'Monitoreo de Torres' },
      { k: 'p', x: 'Se recomienda evaluar el uso de apoyos por parte de cóndores como:' },
      { k: 'ul', x: ['Sitios de descanso.', 'Dormideros.', 'Posaderos temporales.'] },
      { k: 'h', x: 'Evaluación de Efectos Acumulativos' },
      {
        k: 'p',
        x: 'La presencia simultánea de líneas y parques eólicos puede modificar patrones de movimiento de la especie.',
      },
    ],
  },
  {
    id: 'bp5',
    grupo: 'bp',
    titulo: '5. Medidas Prioritarias de Mitigación',
    bloques: [
      { k: 'h', x: '5.1 Gestión de Focos de Atracción' },
      { k: 'p', x: 'Es la medida con mejores resultados documentados en Chile.' },
      { k: 'hs', x: 'Acciones recomendadas' },
      {
        k: 'ul',
        x: [
          'Retiro sistemático de carroña.',
          'Gestión de ganado muerto.',
          'Eliminación de vertederos ilegales.',
          'Coordinación con propietarios vecinos.',
        ],
      },
      {
        k: 'p',
        x: 'La experiencia de Parque Eólico Talinay mostró reducciones cercanas al 89% de colisiones de rapaces tras implementar el retiro sistemático de carcasas.',
      },
      { k: 'h', x: '5.2 Detención Dirigida de Aerogeneradores' },
      {
        k: 'p',
        x: 'Actualmente constituye una de las medidas más prometedoras para la protección del cóndor.',
      },
      { k: 'hs', x: 'Modalidades' },
      { k: 'hs', x: 'Observadores Humanos' },
      { k: 'p', x: 'Ventajas:' },
      {
        k: 'ul',
        x: ['Identificación confiable.', 'Implementación rápida.', 'Flexibilidad operativa.'],
      },
      { k: 'hs', x: 'Cámaras Inteligentes' },
      { k: 'p', x: 'Permiten:' },
      {
        k: 'ul',
        x: [
          'Identificación automática.',
          'Seguimiento de trayectorias.',
          'Activación de protocolos operativos.',
        ],
      },
      { k: 'hs', x: 'Sistemas Radar' },
      { k: 'p', x: 'Permiten:' },
      {
        k: 'ul',
        x: [
          'Operación continua.',
          'Estimación de velocidad.',
          'Determinación de altura y dirección de vuelo.',
        ],
      },
      { k: 'h', x: '5.3 Monitoreo de Cóndores' },
      { k: 'p', x: 'Debe implementarse durante toda la vida útil del proyecto.' },
      { k: 'p', x: 'Componentes recomendados:' },
      {
        k: 'ul',
        x: [
          'Monitoreos estacionales.',
          'Registro de vuelos.',
          'Evaluación conductual.',
          'Uso de áreas de alimentación.',
          'Cartografía de corredores.',
        ],
      },
    ],
  },
  {
    id: 'bp6',
    grupo: 'bp',
    titulo: '6. Medidas de Efectividad Aún en Evaluación',
    bloques: [
      {
        k: 'p',
        x: 'Actualmente la evidencia disponible es insuficiente para recomendar como medidas principales:',
      },
      {
        k: 'ul',
        x: [
          'Ultrasonidos.',
          'Disuasores acústicos.',
          'Luces disuasivas.',
          'Sistemas de ahuyentamiento activo.',
          'Incremento de visibilidad mediante señalización especial.',
        ],
      },
      {
        k: 'p',
        x: 'Estas medidas pueden evaluarse mediante pilotos controlados y seguimiento científico.',
      },
    ],
  },
  {
    id: 'bp7',
    grupo: 'bp',
    titulo: '7. Monitoreo de Mortalidad',
    bloques: [
      { k: 'p', x: 'Todo proyecto debería contar con:' },
      {
        k: 'ul',
        x: [
          'Búsquedas sistemáticas de fauna.',
          'Protocolos estandarizados.',
          'Correcciones por detectabilidad.',
          'Análisis por aerogenerador.',
          'Reporte transparente de resultados.',
        ],
      },
      { k: 'p', x: 'Se recomienda avanzar hacia metodologías comunes a nivel nacional.' },
    ],
  },
  {
    id: 'bp8',
    grupo: 'bp',
    titulo: '8. Compensación',
    bloques: [
      {
        k: 'p',
        x: 'Las medidas compensatorias solo deben utilizarse una vez agotadas las opciones de evitación y mitigación.',
      },
      { k: 'p', x: 'Pueden incluir:' },
      {
        k: 'ul',
        x: [
          'Investigación científica.',
          'Protección de hábitats críticos.',
          'Centros de rehabilitación.',
          'Educación ambiental.',
          'Programas de reproducción y liberación controlada.',
        ],
      },
    ],
  },
  {
    id: 'bp9',
    grupo: 'bp',
    titulo: '9. Recomendaciones generales para Chile',
    bloques: [
      {
        k: 'ul',
        x: [
          'Desarrollar mapas nacionales de riesgo para cóndores.',
          'Estandarizar metodologías de monitoreo.',
          'Consolidar bases de datos nacionales de colisiones.',
          'Fortalecer la coordinación mediante la Mesa de Cóndores.',
          'Incorporar planificación territorial estratégica para el desarrollo eólico.',
          'Promover proyectos piloto de tecnologías de detección temprana.',
          'Fomentar cooperación técnica entre Chile y Argentina, países que concentran gran parte de la población de cóndor andino.',
        ],
      },
    ],
  },
  {
    id: 'conclusion',
    titulo: 'Conclusión',
    bloques: [
      {
        k: 'p',
        x: 'La compatibilización entre la transición energética y la conservación del cóndor andino es técnicamente viable. La evidencia disponible indica que la combinación de una adecuada selección de sitio, gestión de focos de atracción, monitoreo permanente y detención dirigida de aerogeneradores representa actualmente el enfoque más efectivo para reducir el riesgo de colisión. La consolidación de estándares nacionales y el fortalecimiento de la colaboración entre actores públicos, privados y científicos serán fundamentales para asegurar el desarrollo sustentable de la energía eólica y la infraestructura de transmisión en Chile.',
      },
    ],
  },
];
