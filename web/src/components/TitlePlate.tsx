import { usePortalStore } from '../store/usePortalStore';
import { RISK_COLORS, RISK_LABELS } from '../data/portal';

export default function TitlePlate() {
  const legendOpen = usePortalStore((s) => s.legendOpen);
  return (
    <div className="plate dark" id="title-plate">
      <span className="lbl">Visor geoespacial</span>
      <h3>Mapa de riesgo para cóndor andino</h3>
      <p>Riesgo de colisión con proyectos eólicos · modelo demostrativo</p>
      {legendOpen && (
        <div id="legend">
          <span className="lbl" style={{ display: 'block', marginBottom: 5 }}>
            Riesgo de colisión
          </span>
          {RISK_COLORS.slice().reverse().map((c, i) => (
            <div className="lgd" key={c}>
              <i style={{ background: c }} />
              {RISK_LABELS[4 - i]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
