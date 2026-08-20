import { usePortalStore, type Tab } from '../store/usePortalStore';
import { Icon } from './Icon';
import type { IconKey } from '../data/portal';

// Riel de iconos de la columna izquierda del visor. Acotado a 4 accesos:
// - Registros agrupa lista + ranking de sitios (sub-pestañas dentro del panel).
// - Gráficos es la vista temporal. Colisiones vive en el menú superior.
const RAIL: { id: Tab; label: string; desc: string; icon: IconKey; match?: Tab[] }[] = [
  { id: 'ficha', label: 'La especie', desc: 'Ficha del cóndor andino', icon: 'book' },
  { id: 'lista', label: 'Registros', desc: 'Registros de cóndor y ranking de sitios', icon: 'file', match: ['lista', 'sitios'] },
  { id: 'riesgo', label: 'Riesgo', desc: 'Motor de índice de riesgo de colisión', icon: 'alert' },
  { id: 'tiempo', label: 'Gráficos', desc: 'Colisiones de cóndor por año', icon: 'net' },
];

export default function TabRail() {
  const tab = usePortalStore((s) => s.tab);
  const sheetOpen = usePortalStore((s) => s.sheetOpen);
  const panelHidden = usePortalStore((s) => s.panelHidden);
  const goToTab = usePortalStore((s) => s.goToTab);

  return (
    <nav className="rail" aria-label="Navegación del visor">
      {RAIL.map((t) => {
        const matches = t.match ? t.match.includes(tab) : tab === t.id;
        const active = matches && !sheetOpen && !panelHidden;
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
