import { useRiskStore } from '../store/useRiskStore';

const JUSTIFICACION =
  'La proximidad a parques eólicos y líneas de transmisión concentra el 40% del índice porque son la causa física directa de colisión. La idoneidad de hábitat (20%) indica probabilidad de presencia y vuelo del cóndor. Los nidos (15%, ahora con evidencia de reproducción eBird) marcan actividad reproductiva y corredores de vuelo de adultos. Vertederos, veranadas y ganado (20% combinado) son fuentes de carroña que atraen vuelo hacia zonas con infraestructura. El historial de colisiones confirmadas (5%) aporta validación empírica directa. La densidad de avistamientos eBird (5%) suma evidencia empírica de actividad de vuelo, con peso bajo porque mide esfuerzo de observación además de presencia real del cóndor (sesgo hacia sitios con más observadores). Estos pesos son un punto de partida editable, no una verdad estadística — ajústalos si dispones de datos de calibración.';

export default function RiskPanel() {
  const queryActive = useRiskStore((s) => s.queryActive);
  const toggleQuery = useRiskStore((s) => s.toggleQuery);
  const loading = useRiskStore((s) => s.loading);
  const config = useRiskStore((s) => s.config);
  const setWeight = useRiskStore((s) => s.setWeight);
  const setEnabled = useRiskStore((s) => s.setEnabled);
  const setDecay = useRiskStore((s) => s.setDecay);
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

      <h4 style={{ marginTop: 'var(--space-6)', fontSize: 13 }}>Variables del índice de riesgo</h4>
      <p style={{ fontSize: 11, color: 'color-mix(in srgb,var(--color-text) 55%,transparent)', marginBottom: 6 }}>
        {locked
          ? 'Activa la consulta de riesgo para ajustar el peso (%) y la distancia de influencia de cada variable.'
          : 'Ajusta el peso (%) y la distancia de influencia de cada variable. Los pesos se normalizan automáticamente al calcular el índice. Valores por defecto sugeridos con criterio experto — ver justificación al pie.'}
      </p>
      <div style={{ opacity: locked ? 0.5 : 1, pointerEvents: locked ? 'none' : 'auto' }} aria-disabled={locked}>
        {config.map((c) => (
          <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-divider)' }}>
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

            <div className="rv-row">
              <span className="rv-lbl">Peso</span>
              <input
                type="range"
                min={0}
                max={100}
                value={c.weight}
                disabled={locked || !c.enabled}
                onChange={(e) => setWeight(c.id, Number(e.target.value))}
              />
              <span className="rv-val mono">{c.weight}</span>
            </div>

            {c.decayKm != null && (
              <div className="rv-row">
                <span className="rv-lbl">Distancia de influencia</span>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={c.decayKm}
                  disabled={locked || !c.enabled}
                  onChange={(e) => setDecay(c.id, Number(e.target.value))}
                />
                <span className="rv-val mono">{c.decayKm} km</span>
              </div>
            )}
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

      <details className="risk-justif">
        <summary>Justificación de los pesos por defecto</summary>
        <p>{JUSTIFICACION}</p>
        <a href="https://estrategia-aves.mma.gob.cl/recursos/" target="_blank" rel="noopener noreferrer">
          Estrategia Nacional para la Conservación de Aves · MMA (recursos)
        </a>
      </details>
    </div>
  );
}
