import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { usePortalStore } from '../store/usePortalStore';
import { goToPage, goToVisor } from '../lib/nav';
import { hrefFor, hrefForPage } from '../lib/urlState';

const CONDOR_SCI = 'Vultur gryphus';

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
  const page = usePortalStore((s) => s.page);
  const setEspecieView = usePortalStore((s) => s.setEspecieView);

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
        <a
          href={hrefForPage('quienes')}
          {...(page === 'quienes' ? { 'aria-current': 'page' as const } : {})}
          onClick={(e) => {
            e.preventDefault();
            goToPage('quienes');
          }}
        >
          Quiénes Somos
        </a>
        <a
          href={hrefFor(tab)}
          {...(page === 'visor' ? { 'aria-current': 'page' as const } : {})}
          onClick={(e) => {
            e.preventDefault();
            goToVisor();
          }}
        >
          Visor
        </a>
        <a
          href={hrefForPage('capas')}
          {...(page === 'capas' ? { 'aria-current': 'page' as const } : {})}
          onClick={(e) => {
            e.preventDefault();
            goToPage('capas');
          }}
        >
          Capas Geoespaciales Disponibles
        </a>
      </nav>
      <div className="hstats">
        <button
          type="button"
          onClick={() => {
            goToVisor('especie');
            setEspecieView('registros');
          }}
          title="Registros de cóndor andino de la API eBird (últimos 30 días a la fecha de la última actualización de datos). Clic para ver la lista."
        >
          <div className="fig mono">{condorCount}</div>
          <span className="lbl">Registros de cóndor</span>
        </button>
        <button
          type="button"
          onClick={() => goToVisor('graficos')}
          title="Colisiones confirmadas de cóndor con aerogeneradores, 2019–2025. Clic para ver el detalle por año y por parque."
        >
          <div className="fig mono" style={{ color: 'var(--amber)' }}>{collisions}</div>
          <span className="lbl">Colisiones</span>
        </button>
      </div>
    </header>
  );
}
