import { usePortalStore } from '../store/usePortalStore';
import { useMeasureStore } from '../store/useMeasureStore';
import { mapInstance, CHILE, FIT } from '../lib/mapInstance';

export default function MapControls() {
  const togglePanel = usePortalStore((s) => s.togglePanel);
  const setActiveSite = usePortalStore((s) => s.setActiveSite);
  const measureActive = useMeasureStore((s) => s.active);
  const toggleMeasure = useMeasureStore((s) => s.toggle);
  const baseLayer = usePortalStore((s) => s.baseLayer);
  const setBaseLayer = usePortalStore((s) => s.setBaseLayer);

  return (
    <div id="ctl" className="plate">
      <button title="Panel de resultados" onClick={togglePanel}>
        ☰
      </button>
      <button title="Acercar" onClick={() => mapInstance.map?.zoomIn()}>
        +
      </button>
      <button title="Alejar" onClick={() => mapInstance.map?.zoomOut()}>
        −
      </button>
      <button
        title="Vista inicial"
        onClick={() => {
          setActiveSite(null);
          mapInstance.map?.flyToBounds(CHILE, FIT);
        }}
      >
        ⌂
      </button>
      <button
        title="Medir distancia"
        aria-pressed={measureActive}
        onClick={toggleMeasure}
        style={measureActive ? { background: 'var(--color-accent-700)', color: 'var(--color-bg)' } : undefined}
      >
        📏
      </button>
      <button
        title={baseLayer === 'satellite' ? 'Ver mapa (OSM)' : 'Ver imagen satelital (Esri)'}
        aria-pressed={baseLayer === 'satellite'}
        onClick={() => setBaseLayer(baseLayer === 'satellite' ? 'osm' : 'satellite')}
        style={baseLayer === 'satellite' ? { background: 'var(--color-accent-700)', color: 'var(--color-bg)' } : undefined}
      >
        🛰
      </button>
    </div>
  );
}
