import { useEffect, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { usePortalStore } from '../store/usePortalStore';
import { useFiltered } from '../lib/useFiltered';
import { speciesStats } from '../lib/derive';
import type { Observation } from '../types';

const fmt = (n: number) => n.toLocaleString('es-CL');

function Corners() {
  return (
    <>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
    </>
  );
}

function exportCsv(rows: Observation[], name: string) {
  const cols: (keyof Observation)[] = ['date', 'es', 'en', 'sci', 'loc', 'region', 'count', 'valid', 'notable', 'sub'];
  const body = rows
    .map((o) => cols.map((c) => `"${String(o[c]).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`${cols.join(',')}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SpeciesSheet() {
  const sp = usePortalStore((s) => s.species);
  const sheetOpen = usePortalStore((s) => s.sheetOpen);
  const close = usePortalStore((s) => s.closeSpecies);
  const fly = usePortalStore((s) => s.fly);
  const observations = useDataStore((s) => s.observations);
  const filtered = useFiltered();

  const stats = useMemo(() => (sp ? speciesStats(observations, sp.es) : null), [observations, sp]);

  // Cierra la ficha si la especie ya no está en los resultados (nueva búsqueda/filtro).
  useEffect(() => {
    if (sheetOpen && sp && !filtered.some((o) => o.es === sp.es)) close();
  }, [filtered, sp, sheetOpen, close]);

  if (!sheetOpen || !sp || !stats) return null;

  const maxReg = Math.max(1, ...stats.byRegion.map((r) => r.n));
  const rows = observations.filter((o) => o.es === sp.es);

  return (
    <aside id="species">
      <div className="phead" style={{ borderBottom: '1px solid var(--color-divider)' }}>
        <span className="lbl" style={{ flex: 1 }}>Ficha de especie</span>
        <button className="sheet-close" onClick={close} title="Cerrar ficha" aria-label="Cerrar ficha">
          ✕
        </button>
      </div>

      <div className="pbody">
        <div className="sp-photo blueprint duotone">
          <Corners />
          <span className="lbl">{sp.grp} · sin fotografía</span>
        </div>

        <div style={{ padding: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, textTransform: 'none' }}>{sp.es}</h3>
          <div style={{ fontSize: 13, color: 'color-mix(in srgb,var(--color-text) 58%,transparent)' }}>{sp.en}</div>
          <div style={{ fontStyle: 'italic', fontSize: 13, color: 'color-mix(in srgb,var(--color-text) 58%,transparent)' }}>{sp.sci}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
            {sp.notable && <span className="tag tag-accent">Notable</span>}
            <span className="tag tag-neutral">{sp.cat === 'exótica' ? 'Exótica' : 'Nativa'}</span>
            <span className="tag tag-outline">{sp.family}</span>
          </div>

          <div className="sp-stats">
            <div><div className="fig mono">{fmt(stats.registros)}</div><span className="lbl">Registros</span></div>
            <div><div className="fig mono">{stats.regiones}</div><span className="lbl">Regiones</span></div>
            <div><div className="fig mono">{stats.lastCount}</div><span className="lbl">Último conteo</span></div>
          </div>

          <div style={{ marginTop: 'var(--space-6)' }}>
            <span className="lbl">Distribución por región</span>
            {stats.byRegion.map((r) => (
              <div className="rank" key={r.region}>
                <div style={{ fontSize: 13 }}>{r.region || '—'}</div>
                <div className="mono" style={{ textAlign: 'right', fontSize: 13 }}>{r.n}</div>
                <div className="bar"><i style={{ width: `${Math.round((r.n / maxReg) * 100)}%` }} /></div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-6)' }}>
            <span className="lbl">Observaciones recientes · clic para ubicar</span>
            <table className="table" style={{ fontSize: 12, marginTop: 6 }}>
              <tbody>
                {stats.recent.map((x, i) => (
                  <tr
                    key={`${x.sub}-${i}`}
                    style={{ cursor: 'pointer' }}
                    title={`Ver en el mapa: ${x.loc}`}
                    onClick={() => fly([x.lat, x.lng])}
                  >
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{x.date}</td>
                    <td>{x.loc}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{x.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="pfoot">
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => exportCsv(rows, sp.es)}>
          Exportar CSV
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => fly([sp.lat, sp.lng])}>
          Ver en el mapa
        </button>
      </div>
    </aside>
  );
}
