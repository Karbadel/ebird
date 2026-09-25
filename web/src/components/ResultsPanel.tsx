import { useMemo } from 'react';
import { usePortalStore, type Tab } from '../store/usePortalStore';
import { useDataStore } from '../store/useDataStore';
import { applyFilters, useFilterStore } from '../store/useFilterStore';
import { useFiltered } from '../lib/useFiltered';
import { searchSpecies } from '../lib/search';
import { aggregateSites } from '../lib/derive';
import RiskPanel from './RiskPanel';
import BatchPanel from './BatchPanel';
import WindpotRiskPanel from './WindpotRiskPanel';
import SpeciesInfo from './SpeciesInfo';
import { GROUPS, type Group, type Observation } from '../types';
import InfoTip from './InfoTip';

const fmt = (n: number) => n.toLocaleString('es-CL');
const OBS_TABS: Tab[] = ['lista', 'sitios'];

export default function ResultsPanel() {
  const filtered = useFiltered();
  const tab = usePortalStore((s) => s.tab);
  const setTab = usePortalStore((s) => s.setTab);
  const comiteView = usePortalStore((s) => s.comiteView);
  const setComiteView = usePortalStore((s) => s.setComiteView);
  const colView = usePortalStore((s) => s.colView);
  const setColView = usePortalStore((s) => s.setColView);
  const activeSite = usePortalStore((s) => s.activeSite);
  const fly = usePortalStore((s) => s.fly);
  const openRecord = (o: Observation) => fly([o.lat, o.lng]);
  const panelHidden = usePortalStore((s) => s.panelHidden);
  const togglePanel = usePortalStore((s) => s.togglePanel);
  const observations = useDataStore((s) => s.observations);
  const collisions = useDataStore((s) => s.collisions);
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

  if (panelHidden) return null;

  const isCol = tab === 'colisiones';
  const total = isCol ? collisions.length : rows.length;
  const scope = isCol
    ? 'Colisiones confirmadas · Chile'
    : activeSite
      ? `Observaciones · ${activeSite}`
      : 'Observaciones · todo Chile';
  const tip = isCol ? (colView === 'anio' ? 'colAnio' : 'colParque') : tab === 'sitios' ? 'sitios' : 'lista';

  return (
    <aside id="panel" className="plate">
      <div className="phead">
        <button type="button" className="drawer-x drawer-x-panel no-print" aria-label="Cerrar panel" title="Cerrar" onClick={togglePanel}>
          ✕
        </button>
        {tab === 'riesgo' ? (
          <span className="lbl">Motor de índice de riesgo de colisión <InfoTip k="riesgo" label="Motor de riesgo" /></span>
        ) : tab === 'comite' ? (
          <span className="lbl">
            {comiteView === 'parques' ? 'Comité · ranking de riesgo por parque eólico' : 'Comité · potencial eólico según riesgo'}
            <InfoTip k={comiteView === 'parques' ? 'comiteParques' : 'comitePotencial'} label="Comité" />
          </span>
        ) : tab === 'ficha' ? (
          <span className="lbl">Cóndor andino · ficha de la especie <InfoTip k="ficha" label="Ficha de la especie" /></span>
        ) : (
          <div style={{ flex: 1 }}>
            <div className="fig mono">{fmt(total)}</div>
            <span className="lbl">
              {scope}
              <InfoTip k={tip} label={scope} />
            </span>
          </div>
        )}
      </div>
      {(tab === 'lista' || tab === 'sitios') && (
        <div className="tabs" role="tablist" aria-label="Vista de registros">
          <button role="tab" aria-selected={tab === 'lista'} onClick={() => setTab('lista')}>Registros</button>
          <button role="tab" aria-selected={tab === 'sitios'} onClick={() => setTab('sitios')}>Ranking de sitios</button>
        </div>
      )}
      {tab === 'comite' && (
        <div className="tabs no-print" role="tablist" aria-label="Vista del comité">
          <button role="tab" aria-selected={comiteView === 'parques'} onClick={() => setComiteView('parques')}>Parques operativos</button>
          <button role="tab" aria-selected={comiteView === 'potencial'} onClick={() => setComiteView('potencial')}>Potencial eólico</button>
        </div>
      )}
      {isCol && (
        <div className="tabs" role="tablist" aria-label="Vista de colisiones">
          <button role="tab" aria-selected={colView === 'anio'} onClick={() => setColView('anio')}>Por año</button>
          <button role="tab" aria-selected={colView === 'parque'} onClick={() => setColView('parque')}>Por parque</button>
        </div>
      )}
      {OBS_TABS.includes(tab) && (
        <GroupTags counts={groupCounts} active={f.group} onToggle={(g) => f.update('group', f.group === g ? '' : g)} />
      )}
      <div className="pbody">
        {tab === 'lista' && <Lista rows={rows} onOpen={openRecord} />}
        {tab === 'sitios' && <Sitios rows={filtered} />}
        {tab === 'ficha' && <SpeciesInfo />}
        {tab === 'riesgo' && <RiskPanel />}
        {tab === 'comite' && (comiteView === 'parques' ? <BatchPanel /> : <WindpotRiskPanel />)}
        {isCol && (colView === 'anio' ? <PorAnio /> : <PorParque />)}
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

const yearRange = (ys: string[]) =>
  ys.length === 0 ? '—' : ys.length === 1 ? ys[0]! : `${ys[0]}–${ys[ys.length - 1]}`;

// Serie temporal REAL: colisiones de cóndor por año (registro consolidado).
function PorAnio() {
  const collisions = useDataStore((s) => s.collisions);
  const years = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of collisions) if (c.anio) m.set(c.anio, (m.get(c.anio) ?? 0) + 1);
    return [...m.entries()].map(([y, n]) => ({ y, n })).sort((a, b) => a.y.localeCompare(b.y));
  }, [collisions]);
  if (years.length === 0) return <div style={{ padding: 'var(--space-4)' }} className="lbl">Sin datos de colisiones.</div>;
  const max = Math.max(1, ...years.map((y) => y.n));
  const total = collisions.length;
  const peak = years.reduce((a, b) => (b.n > a.n ? b : a), years[0]!);
  const W = 300, H = 148, bw = Math.min(34, (W - 12) / years.length - 8);
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <span className="lbl">Colisiones de cóndor por año · registro consolidado</span>
      <svg viewBox={`0 0 ${W} ${H + 22}`} style={{ width: '100%', marginTop: 'var(--space-3)', color: 'var(--color-text)' }}>
        <line x1="0" y1={H} x2={W} y2={H} stroke="var(--color-divider)" />
        {years.map((yv, i) => {
          const h = Math.round((yv.n / max) * (H - 20));
          const x = i * (bw + 8) + 8;
          return (
            <g key={yv.y}>
              <rect x={x} y={H - h} width={bw} height={h} fill="var(--r5)" />
              <text x={x + bw / 2} y={H - h - 4} fontSize="10" textAnchor="middle" fill="currentColor" className="mono">{yv.n}</text>
              <text x={x + bw / 2} y={H + 15} fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.6">{yv.y}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-divider)' }}>
        <div><div className="fig mono">{total}</div><span className="lbl">Casos totales</span></div>
        <div><div className="fig mono">{peak.y}</div><span className="lbl">Año pico ({peak.n})</span></div>
        <div><div className="fig mono">{years.length}</div><span className="lbl">Años con registro</span></div>
      </div>
    </div>
  );
}

// Registro REAL de colisiones agregado por parque eólico.
function PorParque() {
  const collisions = useDataStore((s) => s.collisions);
  const byProj = useMemo(() => {
    const m = new Map<string, { n: number; regions: Set<string>; years: Set<string> }>();
    for (const c of collisions) {
      let e = m.get(c.proyecto);
      if (!e) {
        e = { n: 0, regions: new Set(), years: new Set() };
        m.set(c.proyecto, e);
      }
      e.n += 1;
      if (c.region) e.regions.add(c.region);
      if (c.anio) e.years.add(c.anio);
    }
    return [...m.entries()]
      .map(([proyecto, e]) => ({
        proyecto,
        n: e.n,
        region: [...e.regions].join(', '),
        years: [...e.years].sort(),
      }))
      .sort((a, b) => b.n - a.n);
  }, [collisions]);
  const max = Math.max(1, ...byProj.map((p) => p.n));
  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <span className="lbl">Registro consolidado · {collisions.length} casos (2019–2025)</span>
      {byProj.map((p) => (
        <div className="rank" key={p.proyecto}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15 }}>{p.proyecto}</div>
            <span className="lbl">{p.region} · {yearRange(p.years)}</span>
          </div>
          <div className="mono" style={{ textAlign: 'right', fontFamily: 'var(--font-heading)', fontSize: 18 }}>{p.n}</div>
          <div className="bar"><i style={{ width: `${Math.round((p.n / max) * 100)}%`, background: 'var(--r5)' }} /></div>
        </div>
      ))}
      <p style={{ fontSize: 12, marginTop: 'var(--space-4)', color: 'color-mix(in srgb,var(--color-text) 58%,transparent)' }}>
        Colisiones de cóndor con aerogeneradores georreferenciadas por caso (fecha, proyecto, sexo y edad). Fuente cargada desde <span className="mono">colisiones.geojson</span>.
      </p>
    </div>
  );
}
