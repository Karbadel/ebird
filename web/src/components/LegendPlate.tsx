import { usePortalStore } from '../store/usePortalStore';
import { RISK_COLORS, RISK_LABELS } from '../data/portal';

const SHORT = ['Muy bajo', 'Bajo', 'Medio', 'Alto', 'Muy alto'];

export default function LegendPlate() {
  const open = usePortalStore((s) => s.legendOpen);
  if (!open) return null;
  return (
    <div id="legend-plate">
      <span className="lbl">Riesgo de colisión para el cóndor</span>
      <div className="lgd-scale">
        {RISK_COLORS.map((c, i) => (
          <div key={c}>
            <i style={{ background: c }} />
            <span title={RISK_LABELS[i]}>{SHORT[i]}</span>
          </div>
        ))}
      </div>
      <div className="lgd-row bordered">
        <span className="lgd-mk">4</span>
        <span>Registro de cóndor · nº de individuos</span>
      </div>
      <div className="lgd-row">
        <span className="lgd-x">✕</span>
        <span>Colisión de cóndor confirmada</span>
      </div>
      <div className="lgd-row">
        <span className="lgd-turb" />
        <span>Aerogenerador (contexto)</span>
      </div>
    </div>
  );
}
