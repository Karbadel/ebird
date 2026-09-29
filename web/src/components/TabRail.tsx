import { useState } from 'react';
import { usePortalStore, type Tab } from '../store/usePortalStore';
import { Icon } from './Icon';
import type { IconKey } from '../data/portal';

const RAIL_KEY = 'ebird-rail-collapsed';
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(RAIL_KEY) === '1';
  } catch {
    return false;
  }
}
function writeCollapsed(v: boolean): void {
  try {
    localStorage.setItem(RAIL_KEY, v ? '1' : '0');
  } catch {
    // Almacenamiento no disponible (privado/bloqueado): se pierde la preferencia.
  }
}

// Los 5 accesos del visor, con nombre visible (estilo «bloque de ícono +
// etiqueta»). El riel puede colapsarse a solo íconos (preferencia recordada en
// localStorage); bajo NARROW_LAYERS (900px) se fuerza siempre a solo íconos.
const RAIL: { id: Tab; label: string; icon: IconKey }[] = [
  { id: 'especie', label: 'La Especie', icon: 'condor' },
  { id: 'riesgo', label: 'Mapa de Riesgo de Colisión de Cóndores con Infraestructura Eléctrica', icon: 'mapaRiesgo' },
  { id: 'motor', label: 'Motor de Índice de Riesgo de Colisión', icon: 'motorIcon' },
  { id: 'capas', label: 'Capas de Información', icon: 'capasInfo' },
  { id: 'graficos', label: 'Gráficos', icon: 'graficosBar' },
];

export default function TabRail() {
  const tab = usePortalStore((s) => s.tab);
  const panelHidden = usePortalStore((s) => s.panelHidden);
  const goToTab = usePortalStore((s) => s.goToTab);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      writeCollapsed(!c);
      return !c;
    });

  return (
    <nav className={`rail${collapsed ? '' : ' expanded'}`} aria-label="Navegación del visor">
      {RAIL.map((t) => {
        const active = tab === t.id && !panelHidden;
        return (
          <button
            key={t.id}
            className={`rail-btn2${active ? ' on' : ''}`}
            aria-pressed={active}
            title={t.label}
            onClick={() => goToTab(t.id)}
          >
            <span className="rail-btn2-ic">
              <Icon k={t.icon} s={22} />
            </span>
            <span className="rail-btn2-label">{t.label}</span>
            <span className="rail-tip">{t.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="rail-collapse no-print"
        onClick={toggleCollapsed}
        aria-pressed={!collapsed}
        aria-label={collapsed ? 'Expandir el riel de navegación' : 'Colapsar el riel a solo íconos'}
        title={collapsed ? 'Expandir riel' : 'Colapsar riel'}
      >
        {collapsed ? '»' : '« Colapsar'}
      </button>
    </nav>
  );
}
