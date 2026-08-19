import { useMemo } from 'react';
import { usePortalStore } from '../store/usePortalStore';
import { useDataStore } from '../store/useDataStore';

const fmt = (n: number) => n.toLocaleString('es-CL');

export default function StatPlate() {
  const sp = usePortalStore((s) => s.species);
  const fly = usePortalStore((s) => s.fly);
  const collapsed = usePortalStore((s) => s.statCollapsed);
  const toggle = usePortalStore((s) => s.toggleStatCollapsed);
  const observations = useDataStore((s) => s.observations);

  const stats = useMemo(() => {
    if (!sp) return null;
    const rows = observations.filter((o) => o.es === sp.es);
    return { registros: rows.length, localidades: new Set(rows.map((o) => o.loc)).size };
  }, [observations, sp]);

  // Panel de cifras: solo aparece al abrir la ficha de una especie.
  if (!sp || !stats) return null;

  if (collapsed) {
    return (
      <button className="side-tab plate dark" id="stat-tab" onClick={toggle} title="Expandir panel">
        <span className="sw" style={{ background: 'var(--color-accent-400)' }} />
        <span>{fmt(stats.registros)} registros</span>
      </button>
    );
  }

  return (
    <div className="plate dark" id="stat">
      <button className="plate-min" onClick={toggle} title="Minimizar" aria-label="Minimizar">
        ─
      </button>
      <span className="lbl">Registros eBird · {sp.es}</span>
      <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-2)' }}>
        <div>
          <div className="fig mono">{fmt(stats.registros)}</div>
          <span className="lbl">Registros</span>
        </div>
        <div>
          <div className="fig mono">{fmt(stats.localidades)}</div>
          <span className="lbl">Localidades</span>
        </div>
      </div>
      <button
        className="btn btn-secondary btn-block"
        style={{ color: 'var(--color-bg)', borderColor: 'var(--color-accent-600)' }}
        onClick={() => fly([sp.lat, sp.lng])}
      >
        Ver en el mapa →
      </button>
    </div>
  );
}
