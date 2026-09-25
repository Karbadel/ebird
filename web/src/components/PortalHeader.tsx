import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { usePortalStore, type Tab } from '../store/usePortalStore';
import { goToVisor } from '../lib/nav';

const CONDOR_SCI = 'Vultur gryphus';
// Navegación superior del portal, alineada con el riel del visor: cada entrada
// abre su pestaña y se marca activa según la pestaña vigente (`match`).
// `pend`: sección sin contenido aún → NO se muestra (decisión: ocultar hasta que
// exista). Para publicarla, darle `tab` y quitar `pend`.
const NAV2: { label: string; tab?: Tab; match?: Tab[]; pend?: boolean }[] = [
  { label: 'Visor', tab: 'ficha', match: ['ficha', 'lista', 'sitios'] },
  { label: 'Riesgo', tab: 'riesgo', match: ['riesgo'] },
  { label: 'Comité', tab: 'comite', match: ['comite'] },
  { label: 'Colisiones', tab: 'colisiones', match: ['colisiones'] },
  { label: 'Medidas', pend: true },
  { label: 'Estudios', pend: true },
  { label: 'Datos', pend: true },
];

export default function PortalHeader() {
  const observations = useDataStore((s) => s.observations);
  // Contador real: registros de cóndor en la ventana de datos (≤30 días).
  const condorCount = useMemo(
    () => observations.filter((o) => o.sci === CONDOR_SCI).length,
    [observations],
  );
  // Contador real: casos del registro consolidado de colisiones (colisiones.geojson).
  const collisions = useDataStore((s) => s.collisions.length);
  const tab = usePortalStore((s) => s.tab);

  return (
    <header className="top">
      <div className="brand">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 8.5 8 11l4-4 4 4 6-2.5" />
          <path d="M12 7v6" />
          <path d="m8 11 4 6 4-6" />
          <path d="M12 17v4" />
        </svg>
        <div>
          <h1>Cóndor andino y energía eólica</h1>
          <p><i>Vultur gryphus</i> · Comité técnico · Ministerio de Energía</p>
        </div>
      </div>
      <nav className="nav2">
        {NAV2.filter((n) => !n.pend && n.tab).map((n) => (
          <a
            key={n.label}
            href="#visor"
            {...(n.match?.includes(tab) ? { 'aria-current': 'page' as const } : {})}
            onClick={(e) => {
              e.preventDefault();
              goToVisor(n.tab!);
            }}
          >
            {n.label}
          </a>
        ))}
      </nav>
      <div className="hstats">
        <button
          type="button"
          onClick={() => goToVisor('lista')}
          title="Registros de cóndor andino de la API eBird (últimos 30 días a la fecha de la última actualización de datos). Clic para ver la lista."
        >
          <div className="fig mono">{condorCount}</div>
          <span className="lbl">Registros de cóndor</span>
        </button>
        <button
          type="button"
          onClick={() => goToVisor('colisiones')}
          title="Colisiones confirmadas de cóndor con aerogeneradores, 2019–2025. Clic para ver el detalle por año y por parque."
        >
          <div className="fig mono" style={{ color: 'var(--amber)' }}>{collisions}</div>
          <span className="lbl">Colisiones</span>
        </button>
      </div>
    </header>
  );
}
