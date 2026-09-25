import { usePortalStore, type ColView, type ComiteView, type Tab } from '../store/usePortalStore';
import { useRiskStore } from '../store/useRiskStore';
import { RISK_PROFILES } from '../data/riskConfig';

// Enlaces compartibles: la vista del visor vive en el hash de la URL, p. ej.
//   #/riesgo · #/comite/potencial?perfil=sensibilidad · #/colisiones/parque
// Con hash (no rutas reales) el portal sigue funcionando en cualquier servidor
// estático, sin configuración de «SPA fallback».
// Qué NO va en la URL: pesos editados a mano (perfil «Personalizado»), capas
// encendidas, comuna buscada ni punto consultado.

interface View {
  tab: Tab;
  comiteView?: ComiteView | undefined;
  colView?: ColView | undefined;
  perfil?: string | undefined;
}

// Slug de URL ↔ pestaña interna.
const SLUG: Record<Tab, string> = {
  ficha: 'especie',
  lista: 'registros',
  sitios: 'registros/sitios',
  riesgo: 'riesgo',
  comite: 'comite',
  colisiones: 'colisiones',
};

const HASH_RE = /^#\/([^?]*)(?:\?(.*))?$/;

/** Hash de una vista (sin perfil «vigente», que es el por defecto). */
export function hashFor(v: View): string {
  let path = SLUG[v.tab];
  if (v.tab === 'comite') path += `/${v.comiteView ?? 'parques'}`;
  if (v.tab === 'colisiones') path += `/${v.colView ?? 'anio'}`;
  const q = v.perfil && v.perfil !== 'vigente' ? `?perfil=${encodeURIComponent(v.perfil)}` : '';
  return `#/${path}${q}`;
}

/** Hash de una pestaña con la sub-vista vigente (para `href` de los enlaces). */
export function hrefFor(tab: Tab): string {
  const p = usePortalStore.getState();
  return hashFor({ tab, comiteView: p.comiteView, colView: p.colView });
}

function parse(hash: string): View | null {
  const m = hash.match(HASH_RE);
  if (!m) return null;
  const parts = (m[1] ?? '').split('/').filter(Boolean);
  const params = new URLSearchParams(m[2] ?? '');
  const perfil = params.get('perfil') ?? undefined;
  const [a, b] = parts;
  let v: View | null = null;
  if (a === 'especie') v = { tab: 'ficha' };
  else if (a === 'registros') v = { tab: b === 'sitios' ? 'sitios' : 'lista' };
  else if (a === 'riesgo') v = { tab: 'riesgo' };
  else if (a === 'comite') v = { tab: 'comite', comiteView: b === 'potencial' ? 'potencial' : 'parques' };
  else if (a === 'colisiones') v = { tab: 'colisiones', colView: b === 'parque' ? 'parque' : 'anio' };
  if (v && perfil && RISK_PROFILES.some((p) => p.id === perfil)) v.perfil = perfil;
  return v;
}

function currentView(): View {
  const p = usePortalStore.getState();
  const r = useRiskStore.getState();
  return { tab: p.tab, comiteView: p.comiteView, colView: p.colView, perfil: r.profileId ?? undefined };
}

const withoutPerfil = (v: View) => hashFor({ ...v, perfil: undefined });

let applying = false;

function apply(v: View): void {
  applying = true;
  try {
    const p = usePortalStore.getState();
    if (v.comiteView) p.setComiteView(v.comiteView);
    if (v.colView) p.setColView(v.colView);
    if (p.tab !== v.tab) p.goToTab(v.tab);
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
    // Un enlace compartido lleva directo al visor.
    requestAnimationFrame(() => document.getElementById('visor')?.scrollIntoView({ block: 'start' }));
  }
  // Normaliza la URL de entrada sin crear una entrada de historial.
  history.replaceState(null, '', hashFor(currentView()));

  const sync = () => {
    if (applying) return;
    const cur = currentView();
    const next = hashFor(cur);
    if (next === window.location.hash) return;
    // Cambiar de pestaña o sub-vista crea historial (Atrás funciona); cambiar solo
    // el perfil lo reemplaza, para no llenar el historial al probar perfiles.
    const prev = parse(window.location.hash);
    if (prev && withoutPerfil(prev) === withoutPerfil(cur)) history.replaceState(null, '', next);
    else history.pushState(null, '', next);
  };
  const unsubPortal = usePortalStore.subscribe((s, p) => {
    if (s.tab !== p.tab || s.comiteView !== p.comiteView || s.colView !== p.colView) sync();
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
