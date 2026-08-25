import type { BatchRow } from '../store/useBatchStore';

// Descarga el ranking como CSV. Incluye una columna por criterio del índice
// (score 0–1, o 's/d' si no aplica) además del total y la ubicación, para
// trazabilidad metodológica del comité.
export function exportBatchCsv(rows: BatchRow[]): void {
  if (!rows.length) return;
  const critLabels = rows[0]!.rows.map((r) => r.label);
  const header = ['#', 'Parque', 'Región', 'Comuna', 'Potencia_MW', 'Lat', 'Lng', 'Indice_0_100', 'Categoria', ...critLabels];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((row, i) => {
    const crit = row.rows.map((r) => (r.score == null ? 's/d' : r.score.toFixed(3)));
    return [i + 1, row.nombre, row.region, row.comuna, row.potenciaMw ?? '', row.lat.toFixed(5), row.lng.toFixed(5), row.total, row.category.label, ...crit]
      .map(esc)
      .join(',');
  });
  const csv = [header.map(esc).join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ranking_riesgo_parques_eolicos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
