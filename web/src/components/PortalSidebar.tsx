import { useMemo, useRef, useState } from 'react';
import { usePortalStore, LAYER_GROUPS, type LayerGroupId } from '../store/usePortalStore';

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

// Filtros rápidos: grupos temáticos + "solo activas".
const QUICK: { id: LayerGroupId | 'active'; label: string }[] = [
  { id: 'condor', label: 'Cóndor' },
  { id: 'carrona', label: 'Carroña' },
  { id: 'eolico', label: 'Energética' },
  { id: 'active', label: 'Solo activas' },
];

export default function PortalSidebar() {
  const layers = usePortalStore((s) => s.layers);
  const toggleLayer = usePortalStore((s) => s.toggleLayer);
  const setOpacity = usePortalStore((s) => s.setOpacity);
  const clearLayers = usePortalStore((s) => s.clearLayers);
  const toggleLegend = usePortalStore((s) => s.toggleLegend);
  const userLayers = usePortalStore((s) => s.userLayers);
  const addUserLayer = usePortalStore((s) => s.addUserLayer);
  const toggleUserLayer = usePortalStore((s) => s.toggleUserLayer);
  const removeUserLayer = usePortalStore((s) => s.removeUserLayer);

  const fileInput = useRef<HTMLInputElement>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setImporting(true);
    setImportErr(null);
    try {
      const { fileToGeoJSON } = await import('../lib/importGeo');
      for (const file of Array.from(files)) {
        const fc = await fileToGeoJSON(file);
        addUserLayer(file.name.replace(/\.(kml|kmz)$/i, ''), fc);
      }
    } catch (e) {
      setImportErr(e instanceof Error ? e.message : 'No se pudo cargar el archivo');
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const [q, setQ] = useState('');
  const [helpOpen, setHelpOpen] = useState<string | null>(null);
  const [quick, setQuick] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<LayerGroupId>>(
    () => new Set<LayerGroupId>(['condor', 'carrona', 'otras', 'eolico', 'contexto']),
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
                    <div className="lyr-wrap" key={l.id}>
                      <label className="lyr" title={l.src}>
                        <input
                          type="checkbox"
                          checked={l.on}
                          disabled={l.pend}
                          onChange={() => toggleLayer(l.id)}
                        />
                        <span className="sw" style={{ background: l.sw }} />
                        <span className="lyr-name">
                          {l.n}
                          {l.help && (
                            <button
                              type="button"
                              className="lyr-help-btn"
                              aria-label="Nota metodológica"
                              aria-expanded={helpOpen === l.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setHelpOpen((cur) => (cur === l.id ? null : l.id));
                              }}
                            >
                              ?
                            </button>
                          )}
                          <span className="src">{l.src}</span>
                        </span>
                        <span className={`lyr-tag${l.pend ? ' pend' : ''}`}>
                          {l.pend ? 'kmz' : l.on ? 'activa' : ''}
                        </span>
                      </label>
                      {l.help && helpOpen === l.id && (
                        <div className="lyr-help" role="note">
                          {l.help}
                        </div>
                      )}
                      {l.opacity != null && l.on && (
                        <div className="lyr-op" title="Opacidad de la capa">
                          <span className="lyr-op-ic">◐</span>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={l.opacity}
                            onChange={(e) => setOpacity(l.id, Number(e.target.value))}
                          />
                          <span className="lyr-op-val">{Math.round(l.opacity * 100)}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Cargar Capas KML/KMZ */}
        <div className="lgroup lgroup-upload">
          <div className="lgroup-head static">
            <span className="lgroup-title">Cargar capas KML/KMZ</span>
            {userLayers.length > 0 && (
              <span className="lgroup-badge on">{userLayers.filter((u) => u.on).length || '—'}</span>
            )}
          </div>
          <div className="lgroup-items">
            <input
              ref={fileInput}
              type="file"
              accept=".kml,.kmz"
              multiple
              hidden
              onChange={(e) => onFiles(e.target.files)}
            />
            <button
              className="btn btn-secondary btn-block"
              disabled={importing}
              onClick={() => fileInput.current?.click()}
            >
              {importing ? 'Cargando…' : '＋ Añadir archivo .kml / .kmz'}
            </button>
            {importErr && <p className="upload-err">{importErr}</p>}
            {userLayers.map((u) => (
              <div className="lyr-wrap user" key={u.id}>
                <label className="lyr" title={u.name}>
                  <input type="checkbox" checked={u.on} onChange={() => toggleUserLayer(u.id)} />
                  <span className="sw" style={{ background: '#6d3bd1' }} />
                  <span className="lyr-name">
                    {u.name}
                    <span className="src">{u.geojson.features.length} geometrías · KML/KMZ</span>
                  </span>
                </label>
                <button className="lyr-del" title="Quitar capa" onClick={() => removeUserLayer(u.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
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
