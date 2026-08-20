import { useRiskStore } from '../store/useRiskStore';

export default function RiskPanel() {
  const queryActive = useRiskStore((s) => s.queryActive);
  const toggleQuery = useRiskStore((s) => s.toggleQuery);
  const loading = useRiskStore((s) => s.loading);
  const config = useRiskStore((s) => s.config);
  const setWeight = useRiskStore((s) => s.setWeight);
  const setEnabled = useRiskStore((s) => s.setEnabled);
  const resetConfig = useRiskStore((s) => s.resetConfig);

  const sum = config.filter((c) => c.enabled).reduce((a, c) => a + c.weight, 0);
  // Las variables solo se ajustan con la consulta activa (tras pulsar el botón).
  const locked = !queryActive;

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <button
        className={`btn ${queryActive ? 'btn-primary' : 'btn-secondary'} btn-block`}
        style={{ marginTop: 0 }}
        onClick={toggleQuery}
      >
        {queryActive ? '● Consulta activa — clic en el mapa' : 'Activar consulta de riesgo'}
      </button>
      {loading && (
        <p className="lbl" style={{ marginTop: 8 }}>
          Cargando capas del motor…
        </p>
      )}
      <p
        style={{
          fontSize: 11.5,
          color: 'color-mix(in srgb,var(--color-text) 60%,transparent)',
          marginTop: 8,
        }}
      >
        Con la consulta activa, haz clic en cualquier punto del mapa para ver el índice de riesgo
        estimado y el desglose de criterios.
      </p>

      <h4 style={{ marginTop: 'var(--space-6)', fontSize: 13 }}>Variables del índice</h4>
      <p style={{ fontSize: 11, color: 'color-mix(in srgb,var(--color-text) 55%,transparent)', marginBottom: 6 }}>
        {locked
          ? 'Activa la consulta de riesgo para ajustar el peso de cada variable.'
          : 'Ajusta el peso de cada variable; se normalizan al calcular el índice.'}
      </p>
      <div style={{ opacity: locked ? 0.5 : 1, pointerEvents: locked ? 'none' : 'auto' }} aria-disabled={locked}>
        {config.map((c) => (
          <div key={c.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-divider)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, cursor: locked ? 'default' : 'pointer' }}>
              <input
                type="checkbox"
                checked={c.enabled}
                disabled={locked}
                onChange={(e) => setEnabled(c.id, e.target.checked)}
                style={{ accentColor: 'var(--color-accent-700)', width: 14, height: 14 }}
              />
              <span style={{ flex: 1 }}>{c.label}</span>
              <b className="mono" style={{ color: 'var(--color-accent-700)' }}>{c.weight}%</b>
            </label>
            <input
              type="range"
              min={0}
              max={40}
              value={c.weight}
              disabled={locked || !c.enabled}
              onChange={(e) => setWeight(c.id, Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-accent-700)' }}
            />
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <button className="btn btn-secondary" disabled={locked} onClick={resetConfig}>
            Restablecer
          </button>
          <span style={{ fontSize: 11.5, color: 'color-mix(in srgb,var(--color-text) 60%,transparent)' }}>
            Suma activa: {sum}% (se normaliza)
          </span>
        </div>
      </div>
    </div>
  );
}
