import { useMemo, useRef, useState } from 'react';
import { usePortalStore, LAYER_GROUPS, type LayerGroupId } from '../store/usePortalStore';
import { useDataStore } from '../store/useDataStore';
import { applyFilters, useFilterStore } from '../store/useFilterStore';
import { useFiltered } from '../lib/useFiltered';
import { searchSpecies } from '../lib/search';
import { aggregateSites } from '../lib/derive';
import { GROUPS, type Group, type Observation } from '../types';
import InfoTip from './InfoTip';
import DummyBadge from './DummyBadge';
import { useCapasConteo, fmtN } from '../lib/capasConteo';

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
const fmt = (n: number) => n.toLocaleString('es-CL');

// Filtros rápidos: grupos temáticos + "solo activas".
const QUICK: { id: LayerGroupId | 'active'; label: string }[] = [
  { id: 'condor', label: 'Cóndor' },
  { id: 'eolico', label: 'Energética' },
  { id: 'recurso', label: 'Recurso eólico' },
  { id: 'contexto', label: 'Contexto' },
  { id: 'active', label: 'Solo activas' },
];

// Columna izquierda del visor: en el acceso «La Especie» muestra Registros ·
// Ranking de sitios; en el resto de accesos, el panel de capas.
export default function PortalSidebar() {
  const tab = usePortalStore((s) => s.tab);
  return tab === 'especie' ? <EspecieSidebar /> : <CapasSidebar />;
}

// ── «La Especie»: Registros · Ranking de sitios ───────────────────────────
function EspecieSidebar() {
  const layersOpen = usePortalStore((s) => s.layersOpen);
  const setLayersOpen = usePortalStore((s) => s.setLayersOpen);
  const especieView = usePortalStore((s) => s.especieView);
  const setEspecieView = usePortalStore((s) => s.setEspecieView);
  const activeSite = usePortalStore((s) => s.activeSite);
  const fly = usePortalStore((s) => s.fly);
  const observations = useDataStore((s) => s.observations);
  const filtered = useFiltered();
  const f = useFilterStore();

  const rows = useMemo(
    () => (activeSite ? filtered.filter((o) => o.loc === activeSite) : filtered),
    [filtered, activeSite],
  );

  // Conteo por grupo ignorando el propio filtro de grupo (para poder cambiar entre grupos).
  const groupCounts = useMemo(() => {
    let base = applyFilters(observations, { ...f, group: '' });
    if (f.query.trim()) {
      const m = searchSpecies(observations, f.query);
      base = base.filter((o) => m.has(o.es));
    }
    const c: Partial<Record<Group, number>> = {};
    for (const o of base) c[o.grp] = (c[o.grp] ?? 0) + 1;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observations, f.species, f.query, f.order, f.family, f.region, f.hotspot, f.from, f.to, f.onlyValid, f.onlyReviewed, f.includeExotic, f.onlyNotable, f.minCount]);

  const openRecord = (o: Observation) => fly([o.lat, o.lng]);
  const total = rows.length;
  const scope = activeSite ? `Observaciones · ${activeSite}` : 'Observaciones · todo Chile';
  const tip = especieView === 'sitios' ? 'sitios' : 'lista';

  return (
    <aside className={`side${layersOpen ? ' open' : ''}`}>
      <div className="side-head">
        <div style={{ flex: 1 }}>
          <div className="fig mono">{fmt(total)}</div>
          <span className="lbl">
            {scope}
            <InfoTip k={tip} label={scope} />
          </span>
        </div>
        <button type="button" className="drawer-x drawer-x-layers no-print" aria-label="Cerrar registros" title="Cerrar" onClick={() => setLayersOpen(false)}>
          ✕
        </button>
      </div>
      <div className="tabs" role="tablist" aria-label="Vista de registros">
        <button role="tab" aria-selected={especieView === 'registros'} onClick={() => setEspecieView('registros')}>Registros</button>
        <button role="tab" aria-selected={especieView === 'sitios'} onClick={() => setEspecieView('sitios')}>Ranking de sitios</button>
      </div>
      <GroupTags counts={groupCounts} active={f.group} onToggle={(g) => f.update('group', f.group === g ? '' : g)} />
      <div className="side-scroll">
        {especieView === 'registros' ? <Lista rows={rows} onOpen={openRecord} /> : <Sitios rows={filtered} />}
      </div>
    </aside>
  );
}

function GroupTags({
  counts,
  active,
  onToggle,
}: {
  counts: Partial<Record<Group, number>>;
  active: string;
  onToggle: (g: Group) => void;
}) {
  const entries = (Object.keys(GROUPS) as Group[]).filter((g) => counts[g]);
  if (entries.length === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 5,
        padding: '8px var(--space-4)',
        borderBottom: '1px solid var(--color-divider)',
      }}
    >
      {entries.map((g) => {
        const on = active === g;
        const color = GROUPS[g].color;
        return (
          <button
            key={g}
            onClick={() => onToggle(g)}
            title={`Filtrar: ${GROUPS[g].label}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: 11,
              padding: '3px 8px',
              border: `1px solid ${color}`,
              background: on ? color : 'transparent',
              color: on ? 'var(--color-bg)' : 'var(--color-text)',
            }}
          >
            <span style={{ width: 8, height: 8, display: 'inline-block', background: on ? 'var(--color-bg)' : color }} />
            {GROUPS[g].label}
            <b className="mono">{counts[g]}</b>
          </button>
        );
      })}
    </div>
  );
}

function Lista({ rows, onOpen }: { rows: Observation[]; onOpen: (o: Observation) => void }) {
  return (
    <>
      {rows.slice(0, 200).map((o, i) => (
        <button className="obs" key={`${o.sub}-${o.es}-${i}`} onClick={() => onOpen(o)}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h4 style={{ flex: 1 }}>{o.es}</h4>
            {o.notable && <span className="tag tag-accent">Notable</span>}
            <span className="mono" style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>{o.count}</span>
          </div>
          <div className="sci">{o.sci}</div>
          <div className="meta">
            <span>{o.loc}</span>
            <span className="mono">{o.date}</span>
            <span>{o.valid ? 'validado' : 'sin revisar'}</span>
          </div>
        </button>
      ))}
      {rows.length > 200 && (
        <div className="lbl" style={{ padding: 'var(--space-4)' }}>
          Mostrando 200 de {fmt(rows.length)} · afina los filtros
        </div>
      )}
    </>
  );
}

function Sitios({ rows }: { rows: Observation[] }) {
  const sites = useMemo(() => aggregateSites(rows).sort((a, b) => b.obsCount - a.obsCount), [rows]);
  const max = Math.max(1, ...sites.map((s) => s.obsCount));
  return (
    <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
      {sites.slice(0, 40).map((s) => (
        <div className="rank" key={s.loc}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15 }}>{s.loc}</div>
            <span className="lbl">{s.region} · {s.spCount} especies</span>
          </div>
          <div className="mono" style={{ textAlign: 'right', fontFamily: 'var(--font-heading)', fontSize: 17 }}>{s.obsCount}</div>
          <div className="bar"><i style={{ width: `${Math.round((s.obsCount / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

// ── Resto de accesos: panel de capas (sin cambios de contenido) ──────────
function CapasSidebar() {
  const layers = usePortalStore((s) => s.layers);
  const toggleLayer = usePortalStore((s) => s.toggleLayer);
  const setOpacity = usePortalStore((s) => s.setOpacity);
  const toggleBuffer = usePortalStore((s) => s.toggleBuffer);
  const setBufferKm = usePortalStore((s) => s.setBufferKm);
  const clearLayers = usePortalStore((s) => s.clearLayers);
  const toggleLegend = usePortalStore((s) => s.toggleLegend);
  const layersOpen = usePortalStore((s) => s.layersOpen);
  const setLayersOpen = usePortalStore((s) => s.setLayersOpen);
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
    () => new Set<LayerGroupId>(['condor', 'eolico', 'recurso', 'contexto']),
  );
  const conteos = useCapasConteo();

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
    <aside className={`side${layersOpen ? ' open' : ''}`}>
      <div className="side-head">
        <span className="side-title">Capas <InfoTip k="capas" label="Panel de capas" /></span>
        <span className="side-badge">{activeCount} activas</span>
        <button type="button" className="drawer-x drawer-x-layers no-print" aria-label="Cerrar capas" title="Cerrar" onClick={() => setLayersOpen(false)}>
          ✕
        </button>
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
          // Ocultamos las capas placeholder (pend: sin datos aún) para no mostrar
          // categorías vacías; la entrada permanece en el store para el futuro.
          const items = layers.filter((l) => l.group === g.id && !l.pend && passes(l));
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
                          {l.dummy ? (
                            <> <DummyBadge variant="corto" /></>
                          ) : (
                            conteos[l.id] && (
                              <span className="lyr-n mono" title={conteos[l.id]!.unidad}> · {fmtN(conteos[l.id]!.n)}</span>
                            )
                          )}
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
                      {l.buffer && l.on && (
                        <div className="lyr-buf">
                          <label
                            className="lyr-buf-chk"
                            title="Anillo de proximidad (solo visual, no altera el índice de riesgo)"
                          >
                            <input
                              type="checkbox"
                              checked={l.buffer.on}
                              onChange={() => toggleBuffer(l.id)}
                            />
                            Buffer
                          </label>
                          {l.buffer.on && (
                            <>
                              <input
                                type="range"
                                min={0.5}
                                max={40}
                                step={0.5}
                                value={l.buffer.km}
                                onChange={(e) => setBufferKm(l.id, Number(e.target.value))}
                              />
                              <input
                                type="number"
                                className="lyr-buf-num"
                                min={0.5}
                                max={100}
                                step={0.5}
                                value={l.buffer.km}
                                onChange={(e) => {
                                  const v = Number(e.target.value);
                                  if (Number.isFinite(v) && v > 0) setBufferKm(l.id, v);
                                }}
                              />
                              <span className="lyr-buf-unit">km</span>
                            </>
                          )}
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
            <span className="lgroup-title">Cargar capas KML/KMZ <InfoTip k="capasCargar" label="Cargar KML/KMZ" /></span>
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
