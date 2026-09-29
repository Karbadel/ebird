import { create } from 'zustand';
import type { FeatureCollection } from 'geojson';
import { ABUNDANCIA_RAMP, GEN_SWATCH, PARQUES_SWATCH } from '../data/portal';
import { useRiskStore } from './useRiskStore';
import { useFieldStore } from './useFieldStore';

export type Tab = 'especie' | 'riesgo' | 'motor' | 'capas' | 'graficos';
/** Sub-vista de cada acceso del riel (en el store para poder reflejarlas en la
 *  URL y abrirlas desde otros accesos: menú superior, tarjetas, contadores). */
export type EspecieView = 'registros' | 'sitios';
export type MotorView = 'parques' | 'potencial';
export type GraficosView = 'anio' | 'parque';
/** Páginas institucionales del portal (fuera del visor). `visor` = el visor
 *  (comportamiento por defecto: hero + riel + mapa). */
export type Page = 'visor' | 'quienes' | 'capas' | 'guia' | 'comite';

export type LayerGroupId = 'condor' | 'eolico' | 'recurso' | 'contexto';

export interface PortalLayer {
  id: string;
  group: LayerGroupId;
  n: string;
  src: string;
  sw: string;
  on: boolean;
  pend?: boolean;
  /** Capa con geometría ficticia (sin fuente): se marca con `DummyBadge` en el
   *  panel, se dibuja con trazo discontinuo ámbar y su popup lo advierte. */
  dummy?: boolean;
  /** Si está definido, la capa expone un control de opacidad (0–1). */
  opacity?: number;
  /** Si está definido, la capa expone un control de buffer de proximidad
   *  (anillo visual alrededor de cada elemento). `km` es el radio; `on` su
   *  visibilidad. Es puramente visual: NO altera el índice de riesgo. */
  buffer?: { on: boolean; km: number };
  /** Nota metodológica: muestra un botón (?) con este texto explicativo. */
  help?: string;
  /** Cita bibliográfica completa de la fuente (se muestra en «Capas activas» y en la
   *  tabla de descargas; la nota `help` también la incluye). */
  cita?: string;
  /** Capa que el portal NO redistribuye (producto de terceros): la tabla de
   *  descargas muestra este texto —y el enlace a la fuente, si lo hay— en lugar
   *  de un botón de descarga. */
  sinDescarga?: { texto: string; enlace?: string; enlaceTexto?: string };
}

/** Capa cargada por el usuario desde un archivo KML/KMZ. */
export interface UserLayer {
  id: string;
  name: string;
  geojson: FeatureCollection;
  on: boolean;
}

/** Comuna del buscador (navegar + resaltar). `cut` cruza con comunas.geojson. */
export interface Comuna {
  cut: number;
  nombre: string;
  lat: number;
  lon: number;
  region?: string;
}

// Anchos bajo los cuales el panel de resultados (1180) y el de capas (900) pasan a
// ser cajones superpuestos al mapa (deben coincidir con los @media de app.css).
export const NARROW_PANEL = 1180;
export const NARROW_LAYERS = 900;
const below = (px: number) => typeof window !== 'undefined' && window.innerWidth <= px;

/** Títulos y orden de los grupos de capas del panel. */
export const LAYER_GROUPS: { id: LayerGroupId; title: string }[] = [
  { id: 'condor', title: 'Cóndor' },
  { id: 'eolico', title: 'Infraestructura energética' },
  { id: 'recurso', title: 'Recurso eólico' },
  { id: 'contexto', title: 'Contexto territorial' },
];

// Aviso común de las capas dummy (geometría ficticia, sin fuente).
const DUMMY_SRC = 'Sin fuente · geometría ilustrativa';
const DUMMY_SW = 'repeating-linear-gradient(45deg,#d98c00 0 3px,#fbf3dc 3px 6px)';
const DUMMY_HELP = 'CAPA DUMMY: la geometría es ficticia e ilustrativa, no proviene de ninguna fuente y no debe usarse para decisiones. Se mantiene solo para mostrar cómo se verá la capa hasta que exista el dato real (hasta nueva implementación). No entra al índice de riesgo.';

// Citas de las fuentes de los rasters del cóndor (se repiten en ayuda, «Capas activas»
// y tabla de descargas).
const CITA_ESTRADA =
  'Estrada Pacheco, R., N.L. Jácome, C.E. Borghi, V. Astore, C.I. Piña & R. Cavia. 2025. Mapping environmental suitability for Andean condor conservation in the southern half of its range. Journal for Nature Conservation 87: 126970. (Facilitado por los autores.)';
const EBIRD_ST_URL = 'https://science.ebird.org/en/status-and-trends/data-access/ebird-status-data-version-2023';
const CITA_EBIRD_ST =
  'Fink, D., T. Auer, A. Johnston, M. Strimas-Mackey, S. Ligocki, O. Robinson, W. Hochachka, L. Jaromczyk, C. Crowley, K. Dunham, A. Stillman, C. Davis, M. Stokowski, V. Ruiz-Gutierrez, C. Wood & A. Rodewald. 2025. eBird Status and Trends, Data Version: 2023. Cornell Lab of Ornithology. ' +
  `${EBIRD_ST_URL} (acceso 25/09/2025).`;
const SIN_DESCARGA_EBIRD = { texto: 'sin descarga · disponible en la fuente oficial', enlace: EBIRD_ST_URL, enlaceTexto: 'eBird Status and Trends' };

// El orden de este arreglo es el orden de aparición en el panel (por grupo).
const LAYERS: PortalLayer[] = [
  // Cóndor
  { id: 'habitat', group: 'condor', n: 'Idoneidad del hábitat', src: 'Estrada Pacheco et al. 2025 · J. Nat. Conserv. 87: 126970', sw: 'linear-gradient(90deg,#1c8eb0,#f5f3b6,#da3726)', on: true, opacity: 0.6, cita: CITA_ESTRADA, sinDescarga: { texto: 'sin descarga · solicitar a los autores' }, help: `Idoneidad ambiental para el cóndor andino (probabilidad 0–1) del raster oficial de Estrada Pacheco et al. (2025), resolución ≈ 830 m, para la mitad sur de su distribución. Cubre desde ≈ 20°S hacia el sur: no hay dato en Arica y Parinacota ni en el norte de Tarapacá. Alimenta el criterio «Idoneidad de hábitat» del índice (el valor del raster en el punto es el puntaje 0–1; por defecto 20 %). Es un modelo regional: no usar para diferenciar riesgo entre aerogeneradores de un mismo parque. Cita: ${CITA_ESTRADA}` },
  { id: 'obs', group: 'condor', n: 'Registros (eBird)', src: 'API eBird 2.0 · ≤ 30 días', sw: '#2c6a5b', on: true, help: 'Registros de cóndor andino de la API eBird 2.0 (últimos 30 días a la fecha de la última actualización de datos). El número del marcador es la cantidad de individuos. Observación ciudadana: indica presencia, no abundancia. Es contexto: el índice no usa estos registros (usa la densidad histórica de avistamientos).' },
  { id: 'nidos', group: 'condor', n: 'Nidos de cóndor', src: 'eBird C3/C4 · 81 sitios', sw: '#ff00a5', on: false, buffer: { on: false, km: 5 }, help: '81 sitios con evidencia de reproducción en eBird (códigos de nidificación C3 probable y C4 confirmada). Alimenta el criterio «Cercanía a nidos de cóndor» (por defecto 15 %, influencia 8 km). Es un inventario incompleto: la ausencia de nidos en la capa no implica ausencia real.' },
  { id: 'colisiones', group: 'condor', n: 'Colisiones de cóndor confirmadas', src: 'Parques eólicos 2019–2025', sw: '#a4441e', on: false, buffer: { on: false, km: 5 }, help: '29 colisiones confirmadas de cóndor con aerogeneradores (2019–2025), georreferenciadas por caso (fecha, proyecto, sexo y edad). Alimenta el criterio «Historial de colisiones cercanas» (por defecto 5 %, influencia 10 km). Solo casos informados.' },
  { id: 'colisiones_hist', group: 'condor', n: 'Historial de colisiones cercanas', src: 'Zona de influencia de 10 km · derivada de las colisiones', sw: 'rgba(164,68,30,.25)', on: false, help: 'Círculo de 10 km de radio alrededor de cada colisión confirmada: es la zona de influencia del criterio «Historial de colisiones cercanas» del índice de riesgo (influencia por defecto 10 km, peso 5 %). Derivada de la capa de colisiones confirmadas; es solo visual (la cercanía se calcula en el motor).' },
  { id: 'abundancia', group: 'condor', n: 'Abundancia de cóndor', src: 'eBird Status and Trends 2023 · abundancia relativa anual', sw: `linear-gradient(90deg,${ABUNDANCIA_RAMP.join(',')})`, on: false, opacity: 0.75, cita: CITA_EBIRD_ST, sinDescarga: SIN_DESCARGA_EBIRD, help: `Abundancia relativa anual (promedio) del cóndor andino, eBird Status and Trends 2023: conteo promedio estimado de individuos detectados por un eBirder en 1 hora y 2 km, en el momento óptimo del día. Resolución 3 km; sin color donde la abundancia estimada es 0 o fuera del área de predicción. El color usa el percentil 99 de Chile continental como techo. Es abundancia relativa de observación, no población. Alimenta el criterio «Abundancia relativa de cóndor (eBird S&T 2023)» del índice, que por defecto tiene peso 0 %. Cita: ${CITA_EBIRD_ST}` },
  { id: 'rango_condor', group: 'condor', n: 'Rango estimado (eBird S&T 2023)', src: 'eBird Status and Trends 2023', sw: 'rgba(31,122,109,.35)', on: false, cita: CITA_EBIRD_ST, sinDescarga: SIN_DESCARGA_EBIRD, help: `Rango estimado del cóndor andino según eBird Status and Trends 2023 (residente todo el año), recortado al marco del portal y simplificado. Capa solo visual: no entra al índice de riesgo. Cita: ${CITA_EBIRD_ST}` },
  { id: 'area_predictiva', group: 'condor', n: 'Área predictiva (eBird S&T 2023)', src: 'eBird Status and Trends 2023', sw: 'rgba(90,90,110,.25)', on: false, cita: CITA_EBIRD_ST, sinDescarga: SIN_DESCARGA_EBIRD, help: `Área en la que eBird Status and Trends 2023 genera predicciones de abundancia para el cóndor andino (fuera de ella la abundancia no se estima: «sin dato»). Recortada al marco del portal y simplificada. Capa solo visual: no entra al índice de riesgo. Cita: ${CITA_EBIRD_ST}` },
  { id: 'dormideros', group: 'condor', n: 'Dormideros de cóndor', src: DUMMY_SRC, sw: DUMMY_SW, on: false, dummy: true, help: DUMMY_HELP },
  // Infraestructura energética
  { id: 'parques_eolicos', group: 'eolico', n: 'Parques eólicos (OPC · En SEIA · Otros)', src: 'MINENERGIA · jun 2026 · por categoría', sw: PARQUES_SWATCH, on: false, buffer: { on: false, km: 3 }, help: 'Los 180 parques eólicos del catastro nacional de generación (MINENERGIA, junio 2026), coloreados por categoría: OPC = en operación o en pruebas (75); En SEIA = en calificación ambiental (18); Otros = aprobados o en construcción (87). Son los que usa el motor de índice: alimentan el criterio «Cercanía a parques eólicos» (por defecto 20 %, influencia 3 km) e INCLUYEN los proyectos en evaluación y aprobados (efecto acumulado, no solo los operativos). El ranking del Motor de Índice puntúa los 75 OPC. El buffer dibuja la distancia de influencia (solo visual).' },
  { id: 'turb', group: 'eolico', n: 'Aerogeneradores', src: 'MINENERGIA · jun 2026', sw: '#8f8168', on: false, help: '7.162 aerogeneradores (MINENERGIA, junio 2026, todos los estados). Capa nueva con estado OPC/SEIA/Otros en preparación. Capa de contexto: no entra al índice (el criterio de cercanía usa los parques eólicos, no los aerogeneradores).' },
  { id: 'lineas', group: 'eolico', n: 'Líneas de transmisión', src: 'Coordinador · SIC', sw: '#35617a', on: false, buffer: { on: false, km: 1 }, help: '958 tramos de líneas de transmisión (Coordinador Eléctrico). La colisión con tendidos eléctricos es una amenaza documentada para el cóndor. Alimenta el criterio «Cercanía a líneas de transmisión» (por defecto 20 %, influencia 2 km).' },
  { id: 'projects', group: 'eolico', n: 'Otros proyectos de generación', src: 'MINENERGIA · jun 2026 · sin eólicos · por estado', sw: GEN_SWATCH, on: false, help: 'Catastro nacional de instalaciones y proyectos de generación eléctrica SIN los parques eólicos (que tienen su propia capa), coloreado por estado del proyecto (de en calificación a en operación). Fuente: MINENERGIA, junio 2026. Composición: Solar FV 1.400, Termoeléctrico 242, Hidro 248, Bioenergía 46, Solar CSP 5, Geotermia 2. Capa de contexto energético nacional; no entra al índice.' },
  // Recurso eólico
  { id: 'windpot', group: 'recurso', n: 'Potencial eólico bruto', src: 'MINENERGIA · SEN 2026', sw: '#7a5aa6', on: false, opacity: 0.45, help: 'Áreas con potencial eólico bruto del Sistema Eléctrico Nacional (MINENERGIA, 2026): 2.277 polígonos en 13 regiones (Tarapacá a Los Lagos), 2,43 millones de ha y ≈ 121,7 GW. La potencia se estima con una densidad fija de 20 ha/MW, por lo que es proporcional a la superficie. Es potencial BRUTO: no descuenta restricciones territoriales, ambientales ni de conexión, y no representa proyectos. Capa de contexto (peso 0): no altera el índice de riesgo.' },
  { id: 'viento', group: 'recurso', n: 'Viento', src: DUMMY_SRC, sw: DUMMY_SW, on: false, dummy: true, help: DUMMY_HELP },
  // Contexto territorial
  { id: 'vertederos', group: 'contexto', n: 'Vertederos (formales e ilegales)', src: 'MMA', sw: '#8a4b12', on: false, buffer: { on: false, km: 10 }, help: '356 vertederos formales e ilegales (MMA). Fuente de carroña que atrae el vuelo del cóndor. Alimenta el criterio «Cercanía a vertederos» (por defecto 10 %, influencia 15 km).' },
  { id: 'ebird_densidad', group: 'contexto', n: 'Densidad de avistamientos (eBird)', src: 'eBird · 75.111 registros', sw: 'linear-gradient(90deg,#fff7ec,#fc8d59,#990000)', on: false, opacity: 0.55, help: '75.111 registros de eBird (Chile+Argentina, filtrado a 36.012 en Chile) agregados por celda como número de localidades distintas con registro — mide esfuerzo/densidad de observación, no necesariamente abundancia real de cóndores (fuerte sesgo hacia sitios con más observadores, ej. Santiago y Torres del Paine). Cita sugerida: eBird. 2026. eBird Basic Dataset. Cornell Lab of Ornithology, Ithaca, New York.' },
  { id: 'antenas', group: 'contexto', n: 'Antenas de telecomunicaciones', src: 'Correcciones de campo · este navegador · sin catastro oficial', sw: '#8e24aa', on: false, help: 'Correcciones de campo: puntos cargados por el usuario en este navegador (Correcciones de campo → tipo Antena). Sin catastro oficial. Marcan antenas usadas como percha o dormidero; el número de la lista es la cantidad de puntos guardados. Alimentan el criterio «Antenas de telecomunicaciones (campo)» del índice, con peso 0 salvo que se lo asignes.' },
  { id: 'protected', group: 'contexto', n: 'Áreas protegidas', src: 'MMA 2024', sw: '#2c6a5b', on: false, help: '724 áreas protegidas del Sistema Nacional de Áreas Protegidas (MMA, 2024). Capa de contexto territorial: no entra al índice de riesgo.' },
  { id: 'airports', group: 'contexto', n: 'Aeropuertos y conos de aproximación', src: 'DGAC', sw: '#98989b', on: false, help: 'Aeropuertos, aeródromos y sus conos de aproximación (DGAC). Capa de contexto: no entra al índice de riesgo.' },
  { id: 'terreno_3km', group: 'contexto', n: 'Pendiente / rugosidad del terreno (3 km)', src: 'DEM Copernicus GLO-30 (Google Earth Engine)', sw: 'linear-gradient(90deg,#f7fcf5,#41ab5d,#00441b)', on: false, opacity: 0.65, help: 'Grilla de 3×3 km (24.843 celdas) calculada desde el DEM Copernicus GLO-30 en Google Earth Engine. Cobertura regional: ≈ Atacama a Maule (25,5°–35°S), no todo el país. Score = 65% pendiente media (normalizada 0–35°) + 35% rugosidad, medida como desviación estándar de la altitud dentro de la celda (normalizada 0–350 m). Proxy de complejidad topográfica (turbulencia / riesgo para aves planeadoras); complementa —no reemplaza— la idoneidad de hábitat. NO incorpora parámetros de vuelo del cóndor.' },
];

interface PortalState {
  layers: PortalLayer[];
  /** Capas cargadas por el usuario (KML/KMZ). */
  userLayers: UserLayer[];
  legendOpen: boolean;
  /** Cajón de capas abierto (solo tiene efecto bajo NARROW_LAYERS). */
  layersOpen: boolean;
  tab: Tab;
  /** Página institucional visible (`visor` = el visor, comportamiento por defecto). */
  page: Page;
  especieView: EspecieView;
  motorView: MotorView;
  graficosView: GraficosView;
  activeSite: string | null;
  panelHidden: boolean;
  flyTarget: [number, number] | null;
  /** Comuna seleccionada en el buscador (para volar y resaltar su límite). */
  activeComuna: Comuna | null;
  /** Rango [min, max] de localidades/celda de la capa de densidad, para la
   *  leyenda; null hasta que la capa se carga. */
  densityDomain: [number, number] | null;
  /** Percentil 99 (individuos/h·2 km) que fija el techo de color de la capa de
   *  abundancia eBird S&T, para su leyenda; null hasta que la capa se carga. */
  abundanciaP99: number | null;
  /** Capa base del mapa: cartografía OSM o imagen satelital (Esri). */
  baseLayer: 'osm' | 'satellite';
  /** Colorea la capa de potencial eólico por categoría del índice de riesgo. */
  windpotByRisk: boolean;

  toggleLayer(id: string): void;
  setOpacity(id: string, value: number): void;
  /** Enciende/apaga el buffer de proximidad de una capa (solo visual). */
  toggleBuffer(id: string): void;
  /** Fija el radio (km) del buffer de proximidad de una capa. */
  setBufferKm(id: string, km: number): void;
  clearLayers(): void;
  addUserLayer(name: string, geojson: FeatureCollection): void;
  toggleUserLayer(id: string): void;
  removeUserLayer(id: string): void;
  toggleLegend(): void;
  setLayersOpen(open: boolean): void;
  /** Navegación (riel, menú superior, tarjetas, contadores): cambia de pestaña,
   *  vuelve al visor (page:'visor') y asegura que el panel esté visible. */
  goToTab(tab: Tab): void;
  /** Navegación a una página institucional (o de vuelta al visor con 'visor'). */
  goToPage(page: Page): void;
  setEspecieView(v: EspecieView): void;
  setMotorView(v: MotorView): void;
  setGraficosView(v: GraficosView): void;
  setActiveSite(loc: string | null): void;
  togglePanel(): void;
  fly(ll: [number, number]): void;
  consumeFly(): void;
  /** Selecciona (o limpia) la comuna del buscador; al seleccionar, vuela a ella. */
  setComuna(c: Comuna | null): void;
  /** Fija el rango de la capa de densidad (lo calcula MapView al cargarla). */
  setDensityDomain(d: [number, number] | null): void;
  /** Fija el P99 de la capa de abundancia (lo lee MapView de su meta al cargarla). */
  setAbundanciaP99(p99: number | null): void;
  /** Cambia la capa base del mapa (OSM ↔ satélite). */
  setBaseLayer(b: 'osm' | 'satellite'): void;
  /** Activa/desactiva el coloreado por riesgo del potencial eólico (al activar,
   *  enciende la capa). */
  setWindpotByRisk(on: boolean): void;
}

// Al salir de la pestaña Riesgo o de la página del visor apaga la consulta de
// riesgo y el dibujo de correcciones de campo, para que los clics en otras
// vistas no disparen el modo consulta/dibujo por accidente.
function stopRiskAndDraw(): void {
  const risk = useRiskStore.getState();
  risk.stopQuery();
  risk.clearResult();
  useFieldStore.getState().setDrawType('ninguno');
}

export const usePortalStore = create<PortalState>((set) => ({
  layers: LAYERS,
  userLayers: [],
  // En pantallas angostas el panel y la leyenda parten cerrados para no tapar el
  // mapa; se abren desde el riel, el botón ☰ o el botón de leyenda.
  legendOpen: !below(NARROW_PANEL),
  layersOpen: false,
  // Por defecto (home) se muestra la ficha de la especie, no la lista.
  tab: 'especie',
  page: 'visor',
  especieView: 'registros',
  motorView: 'parques',
  graficosView: 'anio',
  activeSite: null,
  panelHidden: below(NARROW_PANEL),
  flyTarget: null,
  activeComuna: null,
  densityDomain: null,
  abundanciaP99: null,
  baseLayer: 'osm',
  windpotByRisk: false,

  toggleLayer: (id) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, on: !l.on } : l)) })),
  setOpacity: (id, value) =>
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, opacity: value } : l)) })),
  toggleBuffer: (id) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id && l.buffer ? { ...l, buffer: { ...l.buffer, on: !l.buffer.on } } : l,
      ),
    })),
  setBufferKm: (id, km) =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === id && l.buffer ? { ...l, buffer: { ...l.buffer, km } } : l,
      ),
    })),
  // Apaga todas las capas conmutables (deja las pendientes/por-cargar como están)
  // y las capas de usuario cargadas. También apaga los buffers de proximidad.
  clearLayers: () =>
    set((s) => ({
      layers: s.layers.map((l) =>
        l.pend ? l : { ...l, on: false, ...(l.buffer ? { buffer: { ...l.buffer, on: false } } : {}) },
      ),
      userLayers: s.userLayers.map((u) => ({ ...u, on: false })),
    })),
  addUserLayer: (name, geojson) =>
    set((s) => ({
      userLayers: [...s.userLayers, { id: `user-${Date.now().toString(36)}`, name, geojson, on: true }],
    })),
  toggleUserLayer: (id) =>
    set((s) => ({ userLayers: s.userLayers.map((u) => (u.id === id ? { ...u, on: !u.on } : u)) })),
  removeUserLayer: (id) => set((s) => ({ userLayers: s.userLayers.filter((u) => u.id !== id) })),
  toggleLegend: () => set((s) => ({ legendOpen: !s.legendOpen })),
  goToTab: (tab) => {
    if (tab !== 'riesgo') stopRiskAndDraw();
    // Si no caben ambos cajones, abrir el panel cierra el de capas.
    set((s) => ({
      tab,
      page: 'visor',
      panelHidden: false,
      layersOpen: below(NARROW_LAYERS) ? false : s.layersOpen,
    }));
  },
  goToPage: (page) => {
    // Al salir del visor (hacia una página institucional) se apaga la consulta
    // de riesgo y el dibujo, igual que al cambiar de pestaña.
    if (page !== 'visor') stopRiskAndDraw();
    set({ page });
  },
  setEspecieView: (especieView) => set({ especieView }),
  setMotorView: (motorView) => set({ motorView }),
  setGraficosView: (graficosView) => set({ graficosView }),
  setActiveSite: (activeSite) => set({ activeSite }),
  togglePanel: () =>
    set((s) => ({
      panelHidden: !s.panelHidden,
      layersOpen: s.panelHidden && below(NARROW_LAYERS) ? false : s.layersOpen,
    })),
  setLayersOpen: (open) =>
    set((s) => ({ layersOpen: open, panelHidden: open && below(NARROW_LAYERS) ? true : s.panelHidden })),
  fly: (flyTarget) => set({ flyTarget }),
  consumeFly: () => set({ flyTarget: null }),
  // El encuadre lo resuelve MapView (fitBounds al polígono); aquí solo se fija la
  // comuna activa (o se limpia).
  setComuna: (c) => set({ activeComuna: c }),
  setDensityDomain: (densityDomain) => set({ densityDomain }),
  setAbundanciaP99: (abundanciaP99) => set({ abundanciaP99 }),
  setBaseLayer: (baseLayer) => set({ baseLayer }),
  setWindpotByRisk: (on) =>
    set((s) => ({
      windpotByRisk: on,
      layers: on ? s.layers.map((l) => (l.id === 'windpot' ? { ...l, on: true } : l)) : s.layers,
    })),
}));
