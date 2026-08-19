import { usePortalStore, type Tab } from '../store/usePortalStore';
import { Icon } from './Icon';
import type { IconKey } from '../data/portal';

const RAIL: { id: Tab; label: string; desc: string; icon: IconKey }[] = [
  { id: 'lista', label: 'Lista', desc: 'Observaciones filtradas, una por fila', icon: 'file' },
  { id: 'especies', label: 'Especies', desc: 'Catálogo navegable de especies', icon: 'book' },
  { id: 'tabla', label: 'Tabla', desc: 'Vista tabular compacta', icon: 'clip' },
  { id: 'sitios', label: 'Sitios', desc: 'Ranking de localidades por registros', icon: 'map' },
  { id: 'riesgo', label: 'Riesgo', desc: 'Motor de índice de riesgo por clic', icon: 'alert' },
  { id: 'tiempo', label: 'Temporal', desc: 'Registros de cóndor por mes', icon: 'net' },
  { id: 'comite', label: 'Comité', desc: 'Documentos y stakeholders del comité', icon: 'users' },
];

export default function TabRail() {
  const tab = usePortalStore((s) => s.tab);
  const sheetOpen = usePortalStore((s) => s.sheetOpen);
  const panelHidden = usePortalStore((s) => s.panelHidden);
  const goToTab = usePortalStore((s) => s.goToTab);

  return (
    <nav id="tabrail" className="plate" aria-label="Navegación del panel">
      {RAIL.map((t) => {
        const active = tab === t.id && !sheetOpen && !panelHidden;
        return (
          <button
            key={t.id}
            className={`rail-btn${active ? ' on' : ''}`}
            aria-pressed={active}
            onClick={() => goToTab(t.id)}
          >
            <Icon k={t.icon} s={18} />
            <span className="rail-tip">
              <b>{t.label}</b>
              <em>{t.desc}</em>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
