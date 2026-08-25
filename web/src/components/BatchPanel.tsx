import { useEffect, useMemo } from 'react';
import { useBatchStore, type BatchCol, configSignature } from '../store/useBatchStore';
import { useRiskStore } from '../store/useRiskStore';
import { usePortalStore } from '../store/usePortalStore';
import { exportBatchCsv } from '../lib/exportBatch';

const fmtMw = (n: number | null) => (n == null ? '—' : n.toLocaleString('es-CL'));

export default function BatchPanel() {
  const rows = useBatchStore((s) => s.rows);
  const running = useBatchStore((s) => s.running);
  const computedAt = useBatchStore((s) => s.computedAt);
  const configSig = useBatchStore((s) => s.configSig);
  const sortCol = useBatchStore((s) => s.sortCol);
  const sortDir = useBatchStore((s) => s.sortDir);
  const run = useBatchStore((s) => s.run);
  const setSort = useBatchStore((s) => s.setSort);
  const config = useRiskStore((s) => s.config);
  const fly = usePortalStore((s) => s.fly);

  // Precalienta la caché del motor al abrir el tab: la descarga de capas (lineas
  // pesa 2,1 MB) ocurre mientras el usuario lee, no al pulsar «Calcular».
  useEffect(() => {
    void useRiskStore.getState().loadData();
  }, []);

  // La tabla queda «desactualizada» si cambian pesos/variables desde el cálculo.
  const stale = rows != null && configSig !== configSignature(config);

  const sorted = useMemo(() => {
    if (!rows) return [];
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      let d = 0;
      if (sortCol === 'nombre') d = a.nombre.localeCompare(b.nombre, 'es');
      else if (sortCol === 'region') d = a.region.localeCompare(b.region, 'es');
      else if (sortCol === 'potenciaMw') d = (a.potenciaMw ?? -1) - (b.potenciaMw ?? -1);
      else d = a.total - b.total;
      return d * dir;
    });
  }, [rows, sortCol, sortDir]);

  const openRow = (lat: number, lng: number) => {
    fly([lat, lng]);
    void useRiskStore.getState().runQuery(lat, lng);
  };

  const arrow = (col: BatchCol) => (sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');
  const pesos = config
    .filter((c) => c.enabled && c.weight > 0)
    .map((c) => `${c.label} ${c.weight}%`)
    .join(' · ');
  const fecha = computedAt ? new Date(computedAt).toLocaleString('es-CL') : '';

  return (
    <div className="batch" style={{ padding: 'var(--space-4)' }}>
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <button className="btn btn-primary" disabled={running} onClick={() => void run()}>
          {running ? 'Calculando…' : rows ? 'Recalcular' : 'Calcular ranking de riesgo'}
        </button>
        {rows && rows.length > 0 && (
          <>
            <button className="btn btn-secondary" onClick={() => exportBatchCsv(sorted)}>
              Exportar CSV
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              Imprimir / PDF
            </button>
          </>
        )}
      </div>

      {stale && !running && (
        <p className="no-print" style={{ fontSize: 11.5, color: 'var(--color-accent-700)', fontWeight: 600, marginTop: 6 }}>
          ⚠ Cambiaron los pesos o variables del índice desde el último cálculo. Pulsa «Recalcular».
        </p>
      )}

      {running && (
        <div className="no-print" style={{ marginTop: 10 }}>
          <div className="prog">
            <i />
          </div>
          <p style={{ fontSize: 11.5, marginTop: 6, color: 'color-mix(in srgb,var(--color-text) 60%,transparent)' }}>
            {rows ? 'Recalculando el ranking…' : 'Cargando capas del motor y calculando el ranking…'}
          </p>
        </div>
      )}

      {!rows && !running && (
        <p style={{ fontSize: 12, marginTop: 10, color: 'color-mix(in srgb,var(--color-text) 60%,transparent)' }}>
          Puntúa los parques eólicos en operación con los pesos actuales del motor y ordénalos por índice de
          riesgo de colisión. El clic en una fila vuela al parque y abre su ficha de riesgo.
        </p>
      )}

      {rows && rows.length === 0 && !running && (
        <p style={{ fontSize: 12, marginTop: 10 }}>No se pudo cargar la capa de parques eólicos.</p>
      )}

      {rows && rows.length > 0 && (
        <div className="batch-print" style={{ marginTop: 10 }}>
          <h3 style={{ margin: '0 0 2px', fontSize: 15 }}>
            Ranking de riesgo de colisión — Parques eólicos en operación
          </h3>
          <p className="batch-meta" style={{ fontSize: 11, color: 'color-mix(in srgb,var(--color-text) 60%,transparent)', margin: '0 0 6px' }}>
            {rows.length} parques · calculado {fecha}
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
            Índice calculado con los pesos actuales del motor y datos regionales (idoneidad de hábitat, carga
            ganadera, veranadas), no una evaluación en terreno parque por parque. La cercanía a parques eólicos es
            constante (cada parque se evalúa en su propia ubicación), por lo que el orden lo determinan los demás
            criterios. No sustituye la evaluación ambiental de cada proyecto.
          </p>
          <table className="table batch-table" style={{ fontSize: 12, width: '100%' }}>
            <colgroup>
              <col style={{ width: 24 }} />
              <col />
              <col style={{ width: 78 }} />
              <col style={{ width: 44 }} />
              <col style={{ width: 52 }} />
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th className="th-sort" onClick={() => setSort('nombre')}>
                  Parque{arrow('nombre')}
                </th>
                <th className="th-sort" onClick={() => setSort('region')}>
                  Región{arrow('region')}
                </th>
                <th className="th-sort" style={{ textAlign: 'right' }} onClick={() => setSort('potenciaMw')}>
                  MW{arrow('potenciaMw')}
                </th>
                <th className="th-sort" style={{ textAlign: 'right' }} onClick={() => setSort('total')}>
                  Índice{arrow('total')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={r.id} className="batch-row" onClick={() => openRow(r.lat, r.lng)} title="Ver en el mapa">
                  <td className="mono">{i + 1}</td>
                  <td>{r.nombre}</td>
                  <td style={{ color: 'color-mix(in srgb,var(--color-text) 62%,transparent)' }}>{r.region}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmtMw(r.potenciaMw)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="batch-cat mono" style={{ background: r.category.color }} title={r.category.label}>
                      {r.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="batch-legend" style={{ fontSize: 10, color: 'color-mix(in srgb,var(--color-text) 55%,transparent)', margin: '6px 0 0' }}>
            El color del índice indica la categoría: muy bajo · bajo · medio · alto · muy alto.
          </p>
        </div>
      )}
    </div>
  );
}
