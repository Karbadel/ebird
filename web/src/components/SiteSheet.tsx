import { useMemo } from 'react';
import distance from '@turf/distance';
import { point } from '@turf/helpers';
import type { FeatureCollection, Point } from 'geojson';
import { useRiskStore } from '../store/useRiskStore';
import { useDataStore } from '../store/useDataStore';
import { usePortalStore } from '../store/usePortalStore';
import { RISK_COLORS } from '../data/portal';
import type { Observation } from '../types';

const KM = { units: 'kilometers' as const };
const RADIUS = 25;
const fmt = (n: number) => n.toLocaleString('es-CL');

/** Color de la barra de un factor según su score normalizado (0..1). */
function scoreColor(score: number | null): string {
  if (score === null) return 'var(--color-neutral-400)';
  const i = Math.min(RISK_COLORS.length - 1, Math.max(0, Math.floor(score * RISK_COLORS.length)));
  return RISK_COLORS[i]!;
}

/** Cuenta rasgos de tipo punto dentro de un radio (km) del punto consultado. */
function countPointsNear(fc: FeatureCollection | undefined, lat: number, lng: number): number | null {
  if (!fc) return null;
  const from = point([lng, lat]);
  let n = 0;
  for (const f of fc.features) {
    const g = f.geometry;
    if (g?.type === 'Point') {
      if (distance(from, point((g as Point).coordinates), KM) <= RADIUS) n += 1;
    } else if (g?.type === 'MultiPoint') {
      if ((g.coordinates as number[][]).some((c) => distance(from, point(c), KM) <= RADIUS)) n += 1;
    }
  }
  return n;
}

function exportCsv(rows: Observation[], name: string) {
  const cols: (keyof Observation)[] = ['date', 'es', 'sci', 'loc', 'region', 'count', 'valid', 'sub'];
  const body = rows.map((o) => cols.map((c) => `"${String(o[c]).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([`${cols.join(',')}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SiteSheet() {
  const result = useRiskStore((s) => s.result);
  const clearResult = useRiskStore((s) => s.clearResult);
  const queryActive = useRiskStore((s) => s.queryActive);
  const toggleQuery = useRiskStore((s) => s.toggleQuery);
  const data = useRiskStore((s) => s.data);

  // Limpia el resultado y deja el modo consulta activo para elegir otro punto.
  const pickAnother = () => {
    clearResult();
    if (!queryActive) toggleQuery();
  };
  const observations = useDataStore((s) => s.observations);
  const fly = usePortalStore((s) => s.fly);

  const near = useMemo(() => {
    if (!result) return null;
    const { lat, lng } = result;
    const from = point([lng, lat]);
    const withDist = observations
      .map((o) => ({ o, d: distance(from, point([o.lng, o.lat]), KM) }))
      .sort((a, b) => a.d - b.d);
    const inRadius = withDist.filter((x) => x.d <= RADIUS);
    return {
      registros: inRadius.length,
      individuos: inRadius.reduce((a, x) => a + x.o.count, 0),
      nidos: countPointsNear(data?.['nidos'], lat, lng),
      colisiones: countPointsNear(data?.['colisiones'], lat, lng),
      nearest: withDist[0] ?? null,
      recent: inRadius
        .slice()
        .sort((a, b) => b.o.date.localeCompare(a.o.date))
        .slice(0, 5)
        .map((x) => x.o),
    };
  }, [result, observations, data]);

  // Ubicación administrativa del punto: distrito (centroide) más cercano del
  // dataset de ganado, que trae región y comuna. Aproxima la comuna/región del
  // clic mejor que la observación de cóndor más cercana (que puede estar lejos).
  const place = useMemo(() => {
    if (!result) return null;
    const g = data?.['ganado'];
    if (!g) return null;
    const from = point([result.lng, result.lat]);
    let best: { region?: string; comuna?: string } | null = null;
    let bestD = Infinity;
    for (const f of g.features) {
      if (f.geometry?.type !== 'Point') continue;
      const d = distance(from, point((f.geometry as Point).coordinates), KM);
      if (d < bestD) {
        bestD = d;
        best = f.properties as { region?: string; comuna?: string };
      }
    }
    return best;
  }, [result, data]);

  if (!result || !near) return null;
  const { total, category, rows, lat, lng } = result;
  const zonaLabel = place?.region
    ? `${place.region}${place.comuna ? ` · ${place.comuna}` : ''}`
    : 'Ubicación no determinada';

  return (
    <aside id="sitesheet">
      <div className="sheet-head">
        <span className="lbl" style={{ flex: 1, color: 'inherit' }}>Punto seleccionado</span>
        <button className="sheet-x" onClick={clearResult} title="Cerrar" aria-label="Cerrar">✕</button>
      </div>

      <div className="sheet-body">
        <div style={{ padding: '14px 14px 0' }}>
          <span className="lbl">{zonaLabel}</span>
          <h3 style={{ margin: '2px 0 0', textTransform: 'none', fontSize: 25 }}>Punto consultado</h3>
          <div className="mono" style={{ fontSize: 12, color: 'color-mix(in srgb,var(--color-text) 60%,transparent)' }}>
            {lat.toFixed(4)} · {lng.toFixed(4)}
          </div>
        </div>

        <div className="risk-card">
          <div>
            <div className="risk-num" style={{ color: category.color }}>
              {total}<span style={{ fontSize: 18, opacity: 0.55 }}>/100</span>
            </div>
            <span className="lbl">Índice de riesgo</span>
          </div>
          <span className="risk-badge" style={{ background: category.color }}>{category.label}</span>
        </div>

        <div className="sheet-sec">
          <span className="lbl">Criterios del índice</span>
          <table className="crit-table">
            <thead>
              <tr>
                <th>Criterio</th>
                <th>Valor</th>
                <th className="num">Puntaje</th>
                <th className="num">Peso</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pts = r.score === null ? null : Math.round(r.score * 100);
                const color = scoreColor(r.score);
                return (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td className="mono crit-val">{r.score === null ? 's/d' : r.rawText}</td>
                    <td className="num mono crit-pts" style={{ color }}>{pts === null ? '—' : pts}</td>
                    <td className="num mono crit-peso">{r.weight}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="sheet-sec bordered">
          <span className="lbl">Cóndor en {RADIUS} km</span>
          <div className="near-grid">
            <div>
              <div className="near-v mono">{fmt(near.registros)}</div>
              <span className="lbl">Registros</span>
            </div>
            <div>
              <div className="near-v mono">{near.nidos === null ? '—' : fmt(near.nidos)}</div>
              <span className="lbl">Nidos</span>
            </div>
            <div>
              <div className="near-v mono" style={{ color: 'var(--rust)' }}>
                {near.colisiones === null ? '—' : fmt(near.colisiones)}
              </div>
              <span className="lbl">Colisiones</span>
            </div>
          </div>
        </div>

        <div className="sheet-sec bordered">
          <span className="lbl">Registros de cóndor recientes</span>
          {near.recent.length ? (
            <table className="table" style={{ fontSize: 12, marginTop: 7 }}>
              <tbody>
                {near.recent.map((o, i) => (
                  <tr key={`${o.sub}-${i}`} style={{ cursor: 'pointer' }} onClick={() => fly([o.lat, o.lng])}>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{o.date}</td>
                    <td>{o.loc}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{o.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 12, marginTop: 6, color: 'color-mix(in srgb,var(--color-text) 58%,transparent)' }}>
              Sin registros de cóndor dentro de {RADIUS} km en la ventana de datos.
            </p>
          )}
        </div>

      </div>

      <div className="sheet-foot">
        <button className="btn btn-secondary sheet-foot-wide" onClick={pickAnother}>
          ↺ Consultar otro punto
        </button>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => exportCsv(near.recent, 'condor_punto')}>
          Exportar CSV
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => fly([lat, lng])}>
          Ver en el mapa
        </button>
      </div>
    </aside>
  );
}
