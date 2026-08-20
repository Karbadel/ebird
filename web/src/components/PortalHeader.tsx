import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { usePortalStore, type Tab } from '../store/usePortalStore';

const CONDOR_SCI = 'Vultur gryphus';
// Navegación superior del portal. `tab` abre la pestaña correspondiente del
// visor; `pend` marca las secciones aún no implementadas ("En construcción").
const NAV2: { label: string; tab?: Tab; pend?: boolean }[] = [
  { label: 'Visor' },
  { label: 'Riesgo', tab: 'riesgo' },
  { label: 'Colisiones', tab: 'colisiones' },
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
  const goToTab = usePortalStore((s) => s.goToTab);

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
        {NAV2.map((n, i) => (
          <a
            key={n.label}
            href={n.pend ? undefined : '#visor'}
            {...(i === 0 ? { 'aria-current': 'page' as const } : {})}
            {...(n.pend ? { 'aria-disabled': true as const } : {})}
            onClick={(e) => {
              // Pendientes: no navegan (sin destino real). Riesgo/Colisiones:
              // abren su pestaña en el visor; el ancla #visor lleva el foco.
              if (n.pend) e.preventDefault();
              else if (n.tab) goToTab(n.tab);
            }}
          >
            {n.label}
            {n.pend && <span className="wip">En construcción</span>}
          </a>
        ))}
      </nav>
      <div className="hstats">
        <div>
          <div className="fig mono">{condorCount}</div>
          <span className="lbl">Registros de cóndor</span>
        </div>
        <div>
          <div className="fig mono" style={{ color: 'var(--amber)' }}>{collisions}</div>
          <span className="lbl">Colisiones</span>
        </div>
      </div>
    </header>
  );
}
