import { usePortalStore, type Tab } from '../store/usePortalStore';
import { Icon } from './Icon';
import type { IconKey } from '../data/portal';

// Riel de iconos de la columna izquierda del visor. Accesos:
// - Registros agrupa lista + ranking de sitios (sub-pestañas dentro del panel).
// - Riesgo es la consulta puntual; Comité, el ranking de parques y el potencial eólico.
// - Colisiones reúne la serie por año y el ranking por parque (sub-pestañas).
const RAIL: { id: Tab; label: string; desc: string; icon: IconKey; match?: Tab[] }[] = [
  { id: 'ficha', label: 'La especie', desc: 'Ficha del cóndor andino', icon: 'book' },
  { id: 'lista', label: 'Registros', desc: 'Registros de cóndor y ranking de sitios', icon: 'file', match: ['lista', 'sitios'] },
  { id: 'riesgo', label: 'Riesgo', desc: 'Motor de índice de riesgo de colisión', icon: 'alert' },
  { id: 'comite', label: 'Comité', desc: 'Ranking de parques operativos y potencial eólico según riesgo', icon: 'clip' },
  { id: 'colisiones', label: 'Colisiones', desc: 'Colisiones confirmadas: por año y por parque', icon: 'net' },
];

export default function TabRail() {
  const tab = usePortalStore((s) => s.tab);
  const panelHidden = usePortalStore((s) => s.panelHidden);
  const goToTab = usePortalStore((s) => s.goToTab);

  return (
    <nav className="rail" aria-label="Navegación del visor">
      {RAIL.map((t) => {
        const matches = t.match ? t.match.includes(tab) : tab === t.id;
        const active = matches && !panelHidden;
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
