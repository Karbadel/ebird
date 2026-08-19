import { useMemo, useState } from 'react';
import { usePortalStore, type Tab } from '../store/usePortalStore';
import { useDataStore } from '../store/useDataStore';
import { applyFilters, useFilterStore } from '../store/useFilterStore';
import { useFiltered } from '../lib/useFiltered';
import { searchSpecies } from '../lib/search';
import { aggregateSites } from '../lib/derive';
import { buildCatalog, type CatalogEntry } from '../lib/catalog';
import RiskPanel from './RiskPanel';
import { COLL, CONDOR_MONTHLY, MONTHS, DOCS } from '../data/portal';
import { GROUPS, type Group, type Observation } from '../types';

const fmt = (n: number) => n.toLocaleString('es-CL');
const uniqSorted = (v: string[]) => [...new Set(v)].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es'));

/** Cuenta especies distintas (es) por clave (orden/familia). */
function speciesCountBy(obs: Observation[], keyFn: (o: Observation) => string): Map<string, number> {
  const sets = new Map<string, Set<string>>();
  for (const o of obs) {
    const k = keyFn(o);
    if (!k) continue;
    let s = sets.get(k);
    if (!s) {
      s = new Set();
      sets.set(k, s);
    }
    s.add(o.es);
  }
  const out = new Map<string, number>();
  sets.forEach((s, k) => out.set(k, s.size));
  return out;
}
const OBS_TABS: Tab[] = ['lista', 'tabla', 'sitios', 'especies'];
const TABS: { id: Tab; label: string }[] = [
  { id: 'lista', label: 'Lista' },
  { id: 'especies', label: 'Especies' },
  { id: 'tabla', label: 'Tabla' },
  { id: 'sitios', label: 'Sitios' },
  { id: 'riesgo', label: 'Riesgo' },
  { id: 'tiempo', label: 'Temporal' },
  { id: 'comite', label: 'Comité' },
];

export default function ResultsPanel() {
  const filtered = useFiltered();
  const tab = usePortalStore((s) => s.tab);
  const setTab = usePortalStore((s) => s.setTab);
  const activeSite = usePortalStore((s) => s.activeSite);
  const openSpecies = usePortalStore((s) => s.openSpecies);
  const panelHidden = usePortalStore((s) => s.panelHidden);
  const observations = useDataStore((s) => s.observations);
  const f = useFilterStore();

  const rows = useMemo(
    () => (activeSite ? filtered.filter((o) => o.loc === activeSite) : filtered),
    [filtered, activeSite],
  );
  const catalog = useMemo(() => buildCatalog(filtered), [filtered]);

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

  if (panelHidden) return null;

  const total = tab === 'colisiones' ? 132 : tab === 'especies' ? catalog.length : rows.length;
  const scope =
    tab === 'colisiones'
      ? 'Colisiones registradas · Chile'
      : tab === 'especies'
        ? 'Especies · catálogo'
        : activeSite
          ? `Observaciones · ${activeSite}`
          : 'Observaciones · todo Chile';


  return (
    <aside id="panel" className="plate">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="phead">
        {tab === 'riesgo' ? (
          <span className="lbl">Motor de índice de riesgo de colisión</span>
        ) : (
          <div style={{ flex: 1 }}>
            <div className="fig mono">{fmt(total)}</div>
            <span className="lbl">{scope}</span>
          </div>
        )}
      </div>
      {OBS_TABS.includes(tab) && (
        <GroupTags counts={groupCounts} active={f.group} onToggle={(g) => f.update('group', f.group === g ? '' : g)} />
      )}
      <div className="pbody">
        {tab === 'lista' && <Lista rows={rows} onOpen={openSpecies} />}
        {tab === 'especies' && <Especies catalog={catalog} onOpen={openSpecies} />}
        {tab === 'tabla' && <Tabla rows={rows} />}
        {tab === 'sitios' && <Sitios rows={filtered} />}
        {tab === 'riesgo' && <RiskPanel />}
        {tab === 'tiempo' && <Tiempo />}
        {tab === 'comite' && <Comite />}
        {tab === 'colisiones' && <Colisiones onBack={() => setTab('lista')} />}
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

function Especies({ catalog, onOpen }: { catalog: CatalogEntry[]; onOpen: (o: Observation) => void }) {
  const f = useFilterStore();
  const observations = useDataStore((s) => s.observations);
  const [sort, setSort] = useState<'es' | 'sci' | 'count'>('es');
  const [showEmpty, setShowEmpty] = useState(false);

  // Conteos facetados: cada faceta cuenta ignorando su propio filtro pero
  // respetando los demás (así seleccionar familia acota los órdenes, y viceversa).
  const facetBase = (override: Partial<typeof f>): Observation[] => {
    let b = applyFilters(observations, { ...f, ...override });
    if (f.query.trim()) {
      const m = searchSpecies(observations, f.query);
      b = b.filter((o) => m.has(o.es));
    }
    return b;
  };
  const orderCounts = useMemo(
    () => speciesCountBy(facetBase({ order: '' }), (o) => o.order),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [observations, f.query, f.family, f.region, f.group, f.from, f.to, f.onlyValid, f.onlyReviewed, f.includeExotic, f.onlyNotable, f.minCount],
  );
  const familyCounts = useMemo(
    () => speciesCountBy(facetBase({ family: '' }), (o) => o.family),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [observations, f.query, f.order, f.region, f.group, f.from, f.to, f.onlyValid, f.onlyReviewed, f.includeExotic, f.onlyNotable, f.minCount],
  );

  const orders = useMemo(
    () =>
      uniqSorted(observations.map((o) => o.order))
        .map((v) => ({ v, n: orderCounts.get(v) ?? 0 }))
        .filter((o) => showEmpty || o.n > 0 || o.v === f.order),
    [observations, orderCounts, showEmpty, f.order],
  );
  const families = useMemo(
    () =>
      uniqSorted(observations.map((o) => o.family))
        .map((v) => ({ v, n: familyCounts.get(v) ?? 0 }))
        .filter((o) => showEmpty || o.n > 0 || o.v === f.family),
    [observations, familyCounts, showEmpty, f.family],
  );
  const sorted = useMemo(() => {
    const c = [...catalog];
    if (sort === 'es') c.sort((a, b) => a.es.localeCompare(b.es, 'es'));
    else if (sort === 'sci') c.sort((a, b) => a.sci.localeCompare(b.sci));
    else c.sort((a, b) => b.registros - a.registros);
    return c;
  }, [catalog, sort]);

  const selStyle = { minHeight: 30, fontSize: 12 } as const;

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '8px var(--space-4)',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <select
          className="input"
          style={{ ...selStyle, flex: 1 }}
          value={f.order}
          onChange={(e) => {
            f.update('order', e.target.value);
            f.update('family', '');
          }}
        >
          <option value="">Todos los órdenes</option>
          {orders.map((o) => (
            <option key={o.v} value={o.v}>{o.v} · {o.n}</option>
          ))}
        </select>
        <select className="input" style={{ ...selStyle, flex: 1 }} value={f.family} onChange={(e) => f.update('family', e.target.value)}>
          <option value="">Todas las familias</option>
          {families.map((fm) => (
            <option key={fm.v} value={fm.v}>{fm.v} · {fm.n}</option>
          ))}
        </select>
        <select className="input" style={selStyle} value={sort} onChange={(e) => setSort(e.target.value as 'es' | 'sci' | 'count')}>
          <option value="es">A–Z español</option>
          <option value="sci">A–Z científico</option>
          <option value="count">Nº registros</option>
        </select>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, width: '100%', cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={showEmpty}
            onChange={(e) => setShowEmpty(e.target.checked)}
            style={{ accentColor: 'var(--color-accent-700)', width: 14, height: 14 }}
          />
          Incluir órdenes/familias sin registros
        </label>
      </div>
      {sorted.map((e) => (
        <button className="obs" key={e.es} onClick={() => onOpen(e.sample)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 9, height: 9, flex: 'none', background: GROUPS[e.grp].color }} />
            <h4 style={{ flex: 1 }}>{e.es}</h4>
            {e.notable && <span className="tag tag-accent">Notable</span>}
            {e.exo && <span className="tag tag-outline">Exótica</span>}
            <span className="mono" style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{e.registros}</span>
          </div>
          <div className="sci">{e.en} · {e.sci}</div>
          <div className="meta">
            <span>{e.family}</span>
            <span className="mono">📍 {e.localidades} localidades</span>
          </div>
        </button>
      ))}
    </>
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

function Tabla({ rows }: { rows: Observation[] }) {
  return (
    <table className="table" style={{ fontSize: 12 }}>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Especie</th>
          <th>Localidad</th>
          <th style={{ textAlign: 'right' }}>N</th>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 200).map((o, i) => (
          <tr key={`${o.sub}-${o.es}-${i}`}>
            <td className="mono" style={{ whiteSpace: 'nowrap' }}>{o.date}</td>
            <td>{o.es}</td>
            <td style={{ color: 'color-mix(in srgb,var(--color-text) 62%,transparent)' }}>{o.loc}</td>
            <td className="mono" style={{ textAlign: 'right' }}>{o.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
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

function Tiempo() {
  const max = Math.max(...CONDOR_MONTHLY);
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <span className="lbl">Registros de cóndor por mes · 12 meses móviles</span>
      <svg viewBox="0 0 310 156" style={{ width: '100%', marginTop: 'var(--space-3)', color: 'var(--color-text)' }}>
        <line x1="0" y1="132" x2="310" y2="132" stroke="var(--color-divider)" />
        {CONDOR_MONTHLY.map((v, i) => {
          const h = Math.round((v / max) * 120);
          return (
            <g key={i}>
              <rect x={i * 25 + 4} y={132 - h} width="17" height={h} fill="var(--color-accent)" opacity={i === 7 ? 1 : 0.55} />
              <text x={i * 25 + 12} y="148" fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.6">{MONTHS[i]}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-divider)' }}>
        <div><div className="fig mono">oct</div><span className="lbl">Mes pico</span></div>
        <div><div className="fig mono">+18%</div><span className="lbl">vs. 2025</span></div>
        <div><div className="fig mono">4,6</div><span className="lbl">Individuos / registro</span></div>
      </div>
    </div>
  );
}

function Comite() {
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <span className="lbl">Reunión N°1 Comité</span>
      <h3 style={{ margin: '4px 0 var(--space-4)', fontSize: 20 }}>Identificación de información</h3>
      {DOCS.map(([t, d, g]) => (
        <div className="doc" key={t}>
          <div className="t">{t}</div>
          <span className="tag tag-outline">{g}</span>
          <div className="d">{d}</div>
        </div>
      ))}
      <span className="lbl" style={{ display: 'block', margin: 'var(--space-6) 0 var(--space-2)' }}>
        Distintos stakeholders
      </span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span className="tag tag-accent">Desarrolladores</span>
        <span className="tag tag-accent">titulares</span>
        <span className="tag tag-neutral">otros</span>
      </div>
      <a className="btn btn-primary btn-block" href="#secciones" style={{ marginTop: 'var(--space-4)' }}>
        Ver capas y documentos →
      </a>
    </div>
  );
}

function Colisiones({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <span className="lbl">Registro de colisiones de cóndores</span>
      {COLL.map((c) => (
        <div className="rank" key={c.n}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15 }}>{c.n}</div>
            <span className="lbl">{c.r} · {c.y}</span>
          </div>
          <div className="mono" style={{ textAlign: 'right', fontFamily: 'var(--font-heading)', fontSize: 18 }}>{c.c}</div>
          <div className="bar"><i style={{ width: `${Math.round((c.c / 41) * 100)}%`, background: 'var(--r5)' }} /></div>
        </div>
      ))}
      <p style={{ fontSize: 12, marginTop: 'var(--space-4)', color: 'color-mix(in srgb,var(--color-text) 58%,transparent)' }}>
        Registro consolidado por el comité a partir de reportes de titulares, SAG y monitoreos independientes.
      </p>
      <button className="btn btn-secondary btn-block" onClick={onBack}>
        ← Volver a observaciones
      </button>
    </div>
  );
}
