import { useMeasureStore, totalKm, fmtKm } from '../store/useMeasureStore';

export default function MeasurePlate() {
  const active = useMeasureStore((s) => s.active);
  const points = useMeasureStore((s) => s.points);
  const undo = useMeasureStore((s) => s.undo);
  const clear = useMeasureStore((s) => s.clear);

  if (!active && points.length === 0) return null;

  const segments = Math.max(0, points.length - 1);
  const total = totalKm(points);

  return (
    <div className="plate" id="measurePlate">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span className="lbl">Distancia medida</span>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, lineHeight: 1, color: 'var(--color-accent-800)' }}>
          {segments > 0 ? fmtKm(total) : '—'}
        </div>
      </div>
      <div className="mdiv" />
      <span style={{ fontSize: 11.5, color: 'color-mix(in srgb,var(--color-text) 62%,transparent)' }}>
        {points.length === 0
          ? 'Haz clic en el mapa para fijar el primer punto'
          : `${points.length} punto${points.length === 1 ? '' : 's'} · ${segments} tramo${segments === 1 ? '' : 's'}`}
      </span>
      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
        <button className="btn btn-secondary" onClick={undo} disabled={points.length === 0}>
          Deshacer
        </button>
        <button className="btn btn-secondary" onClick={clear} disabled={points.length === 0}>
          Limpiar
        </button>
      </div>
    </div>
  );
}
