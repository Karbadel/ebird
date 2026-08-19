import { useMemo, useState } from 'react';
import { usePortalStore, LAYER_GROUPS, type LayerGroupId } from '../store/usePortalStore';

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

// Filtros rápidos: grupos temáticos + "solo activas".
const QUICK: { id: LayerGroupId | 'active'; label: string }[] = [
  { id: 'superf', label: 'Riesgo' },
  { id: 'colis', label: 'Colisiones' },
  { id: 'eolico', label: 'Eólico' },
  { id: 'active', label: 'Solo activas' },
];

export default function PortalSidebar() {
  const layers = usePortalStore((s) => s.layers);
  const toggleLayer = usePortalStore((s) => s.toggleLayer);
  const clearLayers = usePortalStore((s) => s.clearLayers);
  const toggleLegend = usePortalStore((s) => s.toggleLegend);

  const [q, setQ] = useState('');
  const [quick, setQuick] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<LayerGroupId>>(
    () => new Set<LayerGroupId>(['superf', 'condor', 'colis', 'eolico']),
  );

  const activeCount = useMemo(() => layers.filter((l) => l.on).length, [layers]);

  const groupChips = useMemo(
    () => new Set([...quick].filter((x) => x !== 'active') as LayerGroupId[]),
    [quick],
  );

  const passes = (l: (typeof layers)[number]) => {
    if (q.trim() && !norm(l.n).includes(norm(q)) && !norm(l.src).includes(norm(q))) return false;
    if (groupChips.size && !groupChips.has(l.group)) return false;
    if (quick.has('active') && !l.on) return false;
    return true;
  };
  const filtering = q.trim().length > 0 || quick.size > 0;

  const toggleQuick = (id: string) =>
    setQuick((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleGroup = (id: LayerGroupId) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <aside className="side">
      <div className="side-head">
        <span className="side-title">Capas</span>
        <span className="side-badge">{activeCount} activas</span>
      </div>

      <div className="side-filter">
        <div className="search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ opacity: 0.6, flex: 'none' }}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar capas…" autoComplete="off" />
        </div>
        <div className="qfilters">
          {QUICK.map((qf) => (
            <button
              key={qf.id}
              className={`qchip${quick.has(qf.id) ? ' on' : ''}`}
              onClick={() => toggleQuick(qf.id)}
            >
              {qf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="side-scroll">
        {LAYER_GROUPS.map((g) => {
          const items = layers.filter((l) => l.group === g.id && passes(l));
          if (items.length === 0 && filtering) return null;
          // Al filtrar, expande los grupos con resultados para no ocultarlos.
          const isOpen = open.has(g.id) || (filtering && items.length > 0);
          const onCount = items.filter((l) => l.on).length;
          return (
            <div className="lgroup" key={g.id}>
              <button className="lgroup-head" onClick={() => toggleGroup(g.id)}>
                <span className="lgroup-title">{g.title}</span>
                <span className={`lgroup-badge${onCount ? ' on' : ''}`}>{onCount || '—'}</span>
                <span className="lgroup-caret">{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div className="lgroup-items">
                  {items.map((l) => (
                    <label className="lyr" key={l.id} title={l.src}>
                      <input
                        type="checkbox"
                        checked={l.on}
                        disabled={l.pend}
                        onChange={() => toggleLayer(l.id)}
                      />
                      <span className="sw" style={{ background: l.sw }} />
                      <span className="lyr-name">
                        {l.n}
                        <span className="src">{l.src}</span>
                      </span>
                      <span className={`lyr-tag${l.pend ? ' pend' : ''}`}>
                        {l.pend ? 'kmz' : l.on ? 'activa' : ''}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="side-foot">
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={clearLayers}>
          Limpiar
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={toggleLegend}>
          Ver leyenda
        </button>
      </div>
    </aside>
  );
}
