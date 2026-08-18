import { usePortalStore } from '../store/usePortalStore';
import { mapInstance, CHILE, FIT } from '../lib/mapInstance';

export default function MapControls() {
  const togglePanel = usePortalStore((s) => s.togglePanel);
  const setActiveSite = usePortalStore((s) => s.setActiveSite);

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
    </div>
  );
}
