import type { CatSums, RegionSummary, WindpotItem } from '../store/useWindpotRiskStore';
import { useWindpotRiskStore } from '../store/useWindpotRiskStore';
import { RISK_LABELS } from '../data/portal';

const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const today = () => new Date().toISOString().slice(0, 10);

function download(lines: unknown[][], name: string): void {
  const csv = lines.map((l) => l.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}_${today()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Formato largo (región × categoría), fácil de pivotear en planilla. Incluye el
 *  total nacional como región «Nacional». */
export function exportWindpotSummaryCsv(byRegion: RegionSummary[], national: CatSums): void {
  const rows: unknown[][] = [['Region', 'Categoria_riesgo', 'MW', 'ha', 'Areas']];
  for (const r of [...byRegion, { region: 'Nacional', ...national }])
    RISK_LABELS.forEach((lab, k) => rows.push([r.region, lab, r.mw[k]!.toFixed(1), r.ha[k]!.toFixed(1), r.n[k]]));
  download(rows, 'potencial_eolico_por_riesgo_region');
}

/** Detalle por área de potencial: punto interior evaluado, índice y categoría. */
export function exportWindpotAreasCsv(items: WindpotItem[]): void {
  const scores = useWindpotRiskStore.getState().scores;
  const rows: unknown[][] = [['ID', 'Region', 'ha', 'MW', 'Lat_punto', 'Lng_punto', 'Indice_0_100', 'Categoria']];
  for (const it of items) {
    const s = scores?.get(it.id);
    rows.push([it.id, it.region, it.ha, it.mw, it.lat.toFixed(5), it.lng.toFixed(5), s?.total ?? '', s?.category.label ?? '']);
  }
  download(rows, 'potencial_eolico_areas_indice');
}
