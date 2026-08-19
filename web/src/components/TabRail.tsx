import { usePortalStore, type Tab } from '../store/usePortalStore';
import { Icon } from './Icon';
import type { IconKey } from '../data/portal';

// Riel de iconos de la columna izquierda del visor. Acotado a cóndor:
// se omiten las vistas multiespecie (catálogo, tabla).
const RAIL: { id: Tab; label: string; desc: string; icon: IconKey }[] = [
  { id: 'ficha', label: 'La especie', desc: 'Ficha del cóndor andino', icon: 'book' },
  { id: 'lista', label: 'Registros', desc: 'Registros de cóndor filtrados', icon: 'file' },
  { id: 'sitios', label: 'Sitios', desc: 'Ranking de localidades por registros', icon: 'map' },
  { id: 'riesgo', label: 'Riesgo', desc: 'Motor de índice de riesgo por clic', icon: 'alert' },
  { id: 'colisiones', label: 'Colisiones', desc: 'Registro consolidado por parque eólico', icon: 'clip' },
  { id: 'tiempo', label: 'Temporal', desc: 'Colisiones de cóndor por año', icon: 'net' },
];

export default function TabRail() {
  const tab = usePortalStore((s) => s.tab);
  const sheetOpen = usePortalStore((s) => s.sheetOpen);
  const panelHidden = usePortalStore((s) => s.panelHidden);
  const goToTab = usePortalStore((s) => s.goToTab);

  return (
    <nav className="rail" aria-label="Navegación del visor">
      {RAIL.map((t) => {
        const active = tab === t.id && !sheetOpen && !panelHidden;
        return (
          <button
            key={t.id}
            className={`rail-btn${active ? ' on' : ''}`}
            aria-pressed={active}
            title={t.label}
            onClick={() => goToTab(t.id)}
          >
            <Icon k={t.icon} s={21} />
            <span className="rail-tip">
              <b>{t.label}</b>
              <em>{t.desc}</em>
            </span>
          </button>
        );
      })}
      <span className="rail-foot">Visor</span>
    </nav>
  );
}
