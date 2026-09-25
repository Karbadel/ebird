import { usePortalStore } from '../store/usePortalStore';
import { useMeasureStore } from '../store/useMeasureStore';
import { mapInstance, CHILE, fitOptions } from '../lib/mapInstance';

export default function MapControls() {
  const togglePanel = usePortalStore((s) => s.togglePanel);
  const setActiveSite = usePortalStore((s) => s.setActiveSite);
  const measureActive = useMeasureStore((s) => s.active);
  const toggleMeasure = useMeasureStore((s) => s.toggle);
  const baseLayer = usePortalStore((s) => s.baseLayer);
  const setBaseLayer = usePortalStore((s) => s.setBaseLayer);
  const legendOpen = usePortalStore((s) => s.legendOpen);
  const toggleLegend = usePortalStore((s) => s.toggleLegend);
  const layersOpen = usePortalStore((s) => s.layersOpen);
  const setLayersOpen = usePortalStore((s) => s.setLayersOpen);
  const on = { background: 'var(--color-accent-700)', color: 'var(--color-bg)' };

  return (
    <div id="ctl" className="plate">
      <button title="Mostrar u ocultar el panel de resultados" onClick={togglePanel}>
        ☰
      </button>
      {/* Solo en pantallas angostas (el panel de capas pasa a cajón). */}
      <button
        className="ctl-layers"
        title="Mostrar u ocultar el panel de capas"
        aria-pressed={layersOpen}
        onClick={() => setLayersOpen(!layersOpen)}
        style={layersOpen ? on : undefined}
      >
        ◧
      </button>
      <button title="Mostrar u ocultar la leyenda" aria-pressed={legendOpen} onClick={toggleLegend} style={legendOpen ? on : undefined}>
        ▤
      </button>
      <button title="Acercar" onClick={() => mapInstance.map?.zoomIn()}>
        +
      </button>
      <button title="Alejar" onClick={() => mapInstance.map?.zoomOut()}>
        −
      </button>
      <button
        title="Volver a la vista inicial de Chile"
        onClick={() => {
          setActiveSite(null);
          mapInstance.map?.flyToBounds(CHILE, fitOptions());
        }}
      >
        ⌂
      </button>
      <button
        title="Medir distancia: clic en el mapa para agregar puntos"
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
