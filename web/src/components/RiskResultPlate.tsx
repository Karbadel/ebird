import { useRiskStore } from '../store/useRiskStore';

export default function RiskResultPlate() {
  const result = useRiskStore((s) => s.result);
  const clearResult = useRiskStore((s) => s.clearResult);
  if (!result) return null;
  const { total, category, rows, lat, lng } = result;

  return (
    <div className="plate" id="riskResult">
      <button id="riskClose" onClick={clearResult} aria-label="Cerrar">
        ✕
      </button>
      <span className="lbl">Riesgo en el punto seleccionado</span>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 34, lineHeight: 1, color: category.color, marginTop: 2 }}>
        {total}
        <span style={{ fontSize: 16, opacity: 0.6 }}>/100</span>
      </div>
      <span
        style={{
          display: 'inline-block',
          marginTop: 5,
          padding: '2px 9px',
          fontSize: 11,
          fontWeight: 700,
          background: `${category.color}22`,
          color: category.color,
        }}
      >
        {category.label}
      </span>
      <table className="table" style={{ fontSize: 11.5, marginTop: 10 }}>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td className="mono" style={{ textAlign: 'right' }}>
                {r.score === null ? 's/d' : `${(r.score * 100).toFixed(0)}%`}
              </td>
              <td className="mono" style={{ textAlign: 'right', opacity: 0.55 }}>
                {r.weight}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="lbl mono" style={{ marginTop: 8 }}>
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>
    </div>
  );
}
