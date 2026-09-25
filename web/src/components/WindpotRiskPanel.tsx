import { useEffect } from 'react';
import { useWindpotRiskStore, type CatSums } from '../store/useWindpotRiskStore';
import { useRiskStore } from '../store/useRiskStore';
import { usePortalStore } from '../store/usePortalStore';
import { RISK_LABELS } from '../data/portal';
import { RISK_CAT_COLORS } from '../data/riskConfig';
import { exportWindpotAreasCsv, exportWindpotSummaryCsv } from '../lib/exportWindpot';
import ProfileSelect, { useProfileLabel } from './ProfileSelect';

const fmt = (n: number) => Math.round(n).toLocaleString('es-CL');
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const muted = 'color-mix(in srgb,var(--color-text) 60%,transparent)';

/** Barra apilada 100% (muy bajo → muy alto). Segmentos separados por 2px y con
 *  tooltip; la tabla y el CSV dan las cifras exactas (la escala de categorías
 *  tiene dos verdes cercanos, así que el color no es la única codificación). */
function CatBar({ s, label }: { s: CatSums; label: string }) {
  const total = sum(s.mw);
  if (!total) return null;
  return (
    <div className="wp-bar" role="img" aria-label={`${label}: distribución del potencial por categoría de riesgo`}>
      {s.mw.map((mw, k) =>
        mw > 0 ? (
          <i
            key={k}
            style={{ flexGrow: mw, background: RISK_CAT_COLORS[k] }}
            title={`${label} · ${RISK_LABELS[k]}: ${fmt(mw)} MW (${((mw / total) * 100).toFixed(1)}%) · ${fmt(s.ha[k]!)} ha · ${s.n[k]} áreas`}
          />
        ) : null,
      )}
    </div>
  );
}

export default function WindpotRiskPanel() {
  const items = useWindpotRiskStore((s) => s.items);
  const loading = useWindpotRiskStore((s) => s.loading);
  const error = useWindpotRiskStore((s) => s.error);
  const national = useWindpotRiskStore((s) => s.national);
  const byRegion = useWindpotRiskStore((s) => s.byRegion);
  const computedAt = useWindpotRiskStore((s) => s.computedAt);
  const config = useRiskStore((s) => s.config);
  const byRisk = usePortalStore((s) => s.windpotByRisk);
  const setByRisk = usePortalStore((s) => s.setWindpotByRisk);

  useEffect(() => {
    void useWindpotRiskStore.getState().load();
  }, []);

  const perfil = useProfileLabel();
  const pesos = config
    .filter((c) => c.enabled && c.weight > 0)
    .map((c) => `${c.label} ${c.weight}%`)
    .join(' · ');
  const totalMw = national ? sum(national.mw) : 0;

  return (
    <div className="batch" style={{ padding: 'var(--space-4)' }}>
      <ProfileSelect />
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <input type="checkbox" checked={byRisk} onChange={(e) => setByRisk(e.target.checked)} />
          Colorear la capa en el mapa por índice
        </label>
        {national && items && (
          <>
            <button className="btn btn-secondary" onClick={() => exportWindpotSummaryCsv(byRegion, national)}>
              CSV por región
            </button>
            <button className="btn btn-secondary" onClick={() => exportWindpotAreasCsv(items)}>
              CSV por área
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              Imprimir / PDF
            </button>
          </>
        )}
      </div>

      {loading && (
        <div className="no-print" style={{ marginTop: 10 }}>
          <div className="prog">
            <i />
          </div>
          <p style={{ fontSize: 11.5, marginTop: 6, color: muted }}>Cargando mediciones precalculadas…</p>
        </div>
      )}
      {error && (
        <p style={{ fontSize: 12, marginTop: 10 }}>
          No se pudo cargar <span className="mono">potencial_medidas.json</span> (¿falta ejecutar{' '}
          <span className="mono">npm run precompute:potencial</span>?).
        </p>
      )}

      {national && (
        <div className="batch-print" style={{ marginTop: 10 }}>
          <h3 style={{ margin: '0 0 2px', fontSize: 15 }}>Potencial eólico bruto según índice de riesgo de colisión</h3>
          <p className="batch-meta" style={{ fontSize: 11, color: muted, margin: '0 0 6px' }}>
            {fmt(sum(national.n))} áreas · {fmt(totalMw)} MW · {fmt(sum(national.ha))} ha · calculado{' '}
            {computedAt ? new Date(computedAt).toLocaleString('es-CL') : ''}
            <br />
            Perfil: {perfil}
            <br />
            Pesos activos: {pesos || '—'}
          </p>
          <p
            className="batch-gov"
            style={{
              fontSize: 10.5,
              lineHeight: 1.35,
              margin: '0 0 8px',
              padding: '6px 8px',
              background: 'color-mix(in srgb,var(--color-accent-700) 8%,transparent)',
              borderLeft: '2px solid var(--color-accent-700)',
            }}
          >
            Describe cuánto potencial eólico <b>bruto</b> (MINENERGIA 2026; no son proyectos ni descuenta restricciones
            territoriales) se superpone con zonas de mayor o menor índice de riesgo actual, con los pesos vigentes del
            motor. El índice se evalúa en un punto interior de cada área: en áreas extensas (hasta ~28.000 ha) puede
            variar dentro de ella. Criterios regionales (hábitat en grilla de 30 km; terreno solo Atacama–Maule).
            Resultado indicativo: no califica la aptitud de un sitio ni sustituye la evaluación ambiental.
          </p>

          <span className="lbl">Nacional</span>
          <CatBar s={national} label="Nacional" />
          <table className="table batch-table" style={{ fontSize: 12, width: '100%', marginTop: 6 }}>
            <colgroup>
              <col />
              <col style={{ width: 62 }} />
              <col style={{ width: 42 }} />
              <col style={{ width: 54 }} />
            </colgroup>
            <thead>
              <tr>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>MW</th>
                <th style={{ textAlign: 'right' }}>%</th>
                <th style={{ textAlign: 'right' }}>Áreas</th>
              </tr>
            </thead>
            <tbody>
              {RISK_LABELS.map((lab, k) => (
                <tr key={lab}>
                  <td>
                    <span className="wp-sw" style={{ background: RISK_CAT_COLORS[k] }} />
                    {lab}
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmt(national.mw[k]!)}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>
                    {totalMw ? ((national.mw[k]! / totalMw) * 100).toFixed(1) : '0'}
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmt(national.n[k]!)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <span className="lbl" style={{ display: 'block', marginTop: 12 }}>
            Por región · norte a sur (proporción del MW regional)
          </span>
          {byRegion.map((r) => (
            <div key={r.region} className="wp-reg">
              <div className="wp-reg-h">
                <span>{r.region}</span>
                <span className="mono">{fmt(sum(r.mw))} MW</span>
              </div>
              <CatBar s={r} label={r.region} />
            </div>
          ))}
          <p className="batch-legend" style={{ fontSize: 10, color: muted, margin: '8px 0 0' }}>
            Segmentos de izquierda a derecha: {RISK_LABELS.join(' · ').toLowerCase()}. Pasa el cursor sobre un
            segmento para ver MW, ha y número de áreas.
          </p>
        </div>
      )}
    </div>
  );
}
