import {
  usePortalStore,
  type EspecieView,
  type GraficosView,
  type MotorView,
  type Page,
  type Tab,
} from '../store/usePortalStore';
import { useRiskStore } from '../store/useRiskStore';
import { RISK_PROFILES } from '../data/riskConfig';

// Enlaces compartibles: la vista del visor vive en el hash de la URL, p. ej.
//   #/riesgo · #/motor/potencial?perfil=sensibilidad · #/graficos/parque
// y las páginas institucionales en rutas propias, p. ej. #/comite-tecnico.
// Con hash (no rutas reales) el portal sigue funcionando en cualquier servidor
// estático, sin configuración de «SPA fallback».
// Qué NO va en la URL: pesos editados a mano (perfil «Personalizado»), capas
// encendidas, comuna buscada ni punto consultado.

type View =
  | {
      kind: 'tab';
      tab: Tab;
      especieView?: EspecieView | undefined;
      motorView?: MotorView | undefined;
      graficosView?: GraficosView | undefined;
      perfil?: string | undefined;
    }
  | { kind: 'page'; page: Exclude<Page, 'visor'> };

// Slug de URL ↔ pestaña interna.
const TAB_SLUG: Record<Tab, string> = {
  especie: 'especie',
  riesgo: 'riesgo',
  motor: 'motor',
  capas: 'capas',
  graficos: 'graficos',
};

// Slug de URL ↔ página institucional.
const PAGE_SLUG: Record<Exclude<Page, 'visor'>, string> = {
  quienes: 'quienes-somos',
  capas: 'capas-disponibles',
  guia: 'buenas-practicas',
  comite: 'comite-tecnico',
};

const HASH_RE = /^#\/([^?]*)(?:\?(.*))?$/;

/** Hash de una vista (sin perfil «vigente», que es el por defecto). */
export function hashFor(v: View): string {
  if (v.kind === 'page') return `#/${PAGE_SLUG[v.page]}`;
  let path = TAB_SLUG[v.tab];
  if (v.tab === 'especie' && v.especieView === 'sitios') path += '/sitios';
  if (v.tab === 'motor') path += `/${v.motorView ?? 'parques'}`;
  if (v.tab === 'graficos') path += `/${v.graficosView ?? 'anio'}`;
  const q = v.perfil && v.perfil !== 'vigente' ? `?perfil=${encodeURIComponent(v.perfil)}` : '';
  return `#/${path}${q}`;
}

/** Hash de una pestaña con la sub-vista vigente (para `href` de los enlaces). */
export function hrefFor(tab: Tab): string {
  const p = usePortalStore.getState();
  return hashFor({
    kind: 'tab',
    tab,
    especieView: p.especieView,
    motorView: p.motorView,
    graficosView: p.graficosView,
  });
}

/** Hash de una página institucional (para `href` de los enlaces del menú/tarjetas). */
export function hrefForPage(page: Exclude<Page, 'visor'>): string {
  return hashFor({ kind: 'page', page });
}

function parse(hash: string): View | null {
  const m = hash.match(HASH_RE);
  if (!m) return null;
  const parts = (m[1] ?? '').split('/').filter(Boolean);
  const params = new URLSearchParams(m[2] ?? '');
  const perfil = params.get('perfil') ?? undefined;
  const [a, b] = parts;

  // Páginas institucionales (nuevas).
  const pageEntry = (Object.entries(PAGE_SLUG) as [Exclude<Page, 'visor'>, string][]).find(
    ([, slug]) => slug === a,
  );
  if (pageEntry) return { kind: 'page', page: pageEntry[0] };

  let v: View | null = null;
  if (a === 'especie' || a === 'registros') {
    // 'registros[/sitios]' es el hash viejo (pestaña 'ficha'/'lista'/'sitios').
    v = { kind: 'tab', tab: 'especie', especieView: b === 'sitios' ? 'sitios' : 'registros' };
  } else if (a === 'riesgo') {
    v = { kind: 'tab', tab: 'riesgo' };
  } else if (a === 'motor' || a === 'comite') {
    // 'comite/...' es el hash viejo (pestaña 'comite', ranking de riesgo).
    v = { kind: 'tab', tab: 'motor', motorView: b === 'potencial' ? 'potencial' : 'parques' };
  } else if (a === 'capas') {
    v = { kind: 'tab', tab: 'capas' };
  } else if (a === 'graficos' || a === 'colisiones') {
    // 'colisiones/...' es el hash viejo (pestaña 'colisiones').
    v = { kind: 'tab', tab: 'graficos', graficosView: b === 'parque' ? 'parque' : 'anio' };
  }
  if (v && perfil && RISK_PROFILES.some((p) => p.id === perfil)) v.perfil = perfil;
  return v;
}

function currentView(): View {
  const p = usePortalStore.getState();
  if (p.page !== 'visor') return { kind: 'page', page: p.page };
  const r = useRiskStore.getState();
  return {
    kind: 'tab',
    tab: p.tab,
    especieView: p.especieView,
    motorView: p.motorView,
    graficosView: p.graficosView,
    perfil: r.profileId ?? undefined,
  };
}

const withoutPerfil = (v: View): string => (v.kind === 'page' ? hashFor(v) : hashFor({ ...v, perfil: undefined }));

let applying = false;

function apply(v: View): void {
  applying = true;
  try {
    const p = usePortalStore.getState();
    if (v.kind === 'page') {
      p.goToPage(v.page);
      return;
    }
    if (v.especieView) p.setEspecieView(v.especieView);
    if (v.motorView) p.setMotorView(v.motorView);
    if (v.graficosView) p.setGraficosView(v.graficosView);
    if (p.tab !== v.tab || p.page !== 'visor') p.goToTab(v.tab);
    // Sin `perfil` en la URL = perfil vigente. Los pesos editados a mano
    // («Personalizado») no se descartan al navegar con Atrás/Adelante.
    const r = useRiskStore.getState();
    if (v.perfil && r.profileId !== v.perfil) r.applyProfile(v.perfil);
    else if (!v.perfil && r.profileId !== null && r.profileId !== 'vigente') r.applyProfile('vigente');
  } finally {
    applying = false;
  }
}

/** Sincroniza vista ↔ URL. Llamar una vez al montar la app; devuelve la limpieza. */
export function initUrlSync(): () => void {
  const initial = parse(window.location.hash);
  if (initial) {
    apply(initial);
    // Un enlace compartido abre al inicio del documento: el visor está justo bajo la
    // cabecera y su alto es ventana − cabecera, así que se ven completos ambos (un
    // scrollIntoView sobre #visor dejaba la cabecera fuera de la vista).
    requestAnimationFrame(() => window.scrollTo({ top: 0 }));
  }
  // Normaliza la URL de entrada sin crear una entrada de historial.
  history.replaceState(null, '', hashFor(currentView()));

  const sync = () => {
    if (applying) return;
    const cur = currentView();
    const next = hashFor(cur);
    if (next === window.location.hash) return;
    // Cambiar de pestaña, sub-vista o página crea historial (Atrás funciona);
    // cambiar solo el perfil lo reemplaza, para no llenar el historial al
    // probar perfiles.
    const prev = parse(window.location.hash);
    if (prev && withoutPerfil(prev) === withoutPerfil(cur)) history.replaceState(null, '', next);
    else history.pushState(null, '', next);
  };
  const unsubPortal = usePortalStore.subscribe((s, p) => {
    if (
      s.tab !== p.tab ||
      s.page !== p.page ||
      s.especieView !== p.especieView ||
      s.motorView !== p.motorView ||
      s.graficosView !== p.graficosView
    )
      sync();
  });
  const unsubRisk = useRiskStore.subscribe((s, p) => {
    if (s.profileId !== p.profileId) sync();
  });
  const onPop = () => {
    const v = parse(window.location.hash);
    if (v) apply(v);
  };
  window.addEventListener('popstate', onPop);
  return () => {
    unsubPortal();
    unsubRisk();
    window.removeEventListener('popstate', onPop);
  };
}
