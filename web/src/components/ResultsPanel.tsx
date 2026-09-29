import { useMemo } from 'react';
import { usePortalStore, LAYER_GROUPS } from '../store/usePortalStore';
import { useDataStore } from '../store/useDataStore';
import RiskPanel from './RiskPanel';
import BatchPanel from './BatchPanel';
import WindpotRiskPanel from './WindpotRiskPanel';
import SpeciesInfo from './SpeciesInfo';
import InfoTip from './InfoTip';
import DummyBadge from './DummyBadge';
import { useCapasConteo, fmtN } from '../lib/capasConteo';

const fmt = (n: number) => n.toLocaleString('es-CL');

export default function ResultsPanel() {
  const tab = usePortalStore((s) => s.tab);
  const motorView = usePortalStore((s) => s.motorView);
  const setMotorView = usePortalStore((s) => s.setMotorView);
  const graficosView = usePortalStore((s) => s.graficosView);
  const setGraficosView = usePortalStore((s) => s.setGraficosView);
  const panelHidden = usePortalStore((s) => s.panelHidden);
  const togglePanel = usePortalStore((s) => s.togglePanel);
  const collisions = useDataStore((s) => s.collisions);

  if (panelHidden) return null;

  const isGraf = tab === 'graficos';

  return (
    <aside id="panel" className="plate">
      <div className="phead">
        <button type="button" className="drawer-x drawer-x-panel no-print" aria-label="Cerrar panel" title="Cerrar" onClick={togglePanel}>
          ✕
        </button>
        {tab === 'riesgo' && (
          <span className="lbl">Motor de índice de riesgo de colisión <InfoTip k="riesgo" label="Motor de riesgo" /></span>
        )}
        {tab === 'motor' && (
          <span className="lbl">
            Motor de índice · {motorView === 'parques' ? 'ranking de riesgo por parque eólico' : 'potencial eólico según riesgo'}
            <InfoTip k={motorView === 'parques' ? 'motorParques' : 'motorPotencial'} label="Motor de índice" />
          </span>
        )}
        {tab === 'especie' && (
          <span className="lbl">Cóndor andino · ficha de la especie <InfoTip k="ficha" label="Ficha de la especie" /></span>
        )}
        {tab === 'capas' && (
          <span className="lbl">Capas activas <InfoTip k="capasActivas" label="Capas activas" /></span>
        )}
        {isGraf && (
          <div style={{ flex: 1 }}>
            <div className="fig mono">{fmt(collisions.length)}</div>
            <span className="lbl">
              Colisiones confirmadas · Chile
              <InfoTip k={graficosView === 'anio' ? 'colAnio' : 'colParque'} label="Colisiones" />
            </span>
          </div>
        )}
      </div>
      {tab === 'motor' && (
        <div className="tabs no-print" role="tablist" aria-label="Vista del motor de índice">
          <button role="tab" aria-selected={motorView === 'parques'} onClick={() => setMotorView('parques')}>Parques operativos</button>
          <button role="tab" aria-selected={motorView === 'potencial'} onClick={() => setMotorView('potencial')}>Potencial eólico</button>
        </div>
      )}
      {isGraf && (
        <div className="tabs" role="tablist" aria-label="Vista de gráficos">
          <button role="tab" aria-selected={graficosView === 'anio'} onClick={() => setGraficosView('anio')}>Por año</button>
          <button role="tab" aria-selected={graficosView === 'parque'} onClick={() => setGraficosView('parque')}>Por parque</button>
        </div>
      )}
      <div className="pbody">
        {tab === 'especie' && <SpeciesInfo />}
        {tab === 'riesgo' && <RiskPanel />}
        {tab === 'motor' && (motorView === 'parques' ? <BatchPanel /> : <WindpotRiskPanel />)}
        {tab === 'capas' && <ActiveLayersPanel />}
        {isGraf && (graficosView === 'anio' ? <PorAnio /> : <PorParque />)}
      </div>
    </aside>
  );
}

// Panel del acceso «Capas de Información»: ficha de cada capa encendida (nombre,
// grupo, fuente, nº de elementos, nota metodológica y marca dummy si aplica) y de
// las capas KML/KMZ cargadas por el usuario.
function ActiveLayersPanel() {
  const layers = usePortalStore((s) => s.layers);
  const userLayers = usePortalStore((s) => s.userLayers);
  const conteos = useCapasConteo();
  const active = useMemo(() => layers.filter((l) => l.on), [layers]);
  const activeUser = useMemo(() => userLayers.filter((u) => u.on), [userLayers]);

  if (active.length === 0 && activeUser.length === 0) {
    return (
      <div className="lbl" style={{ padding: 'var(--space-4)' }}>
        No hay capas encendidas. Actívalas desde el panel de capas, a la izquierda.
      </div>
    );
  }

  const groupTitle = (id: string) => LAYER_GROUPS.find((g) => g.id === id)?.title ?? '';
  const total = active.length + activeUser.length;

  return (
    <div style={{ padding: 'var(--space-3) var(--space-4)' }}>
      <p style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)' }}>
        {total} {total === 1 ? 'capa encendida' : 'capas encendidas'}. Cada ficha indica su fuente, el número de
        elementos y su nota metodológica.
      </p>
      {active.map((l) => {
        const c = conteos[l.id];
        return (
          <div className="doc" key={l.id}>
            <div>
              <div className="t">
                <span className="sw-mini" style={{ background: l.sw }} />
                {l.n}
              </div>
            </div>
            {l.dummy ? (
              <DummyBadge />
            ) : (
              c && <span className="mono" title={c.unidad}>{fmtN(c.n)} {c.unidad}</span>
            )}
            <div className="d">
              <span>{groupTitle(l.group)}</span>
              <span>·</span>
              <span>Fuente: {l.src}</span>
            </div>
            {l.help && (
              <details className="doc-note">
                <summary>Nota</summary>
                <p>{l.help}</p>
              </details>
            )}
          </div>
        );
      })}
      {activeUser.map((u) => (
        <div className="doc" key={u.id}>
          <div>
            <div className="t">{u.name}</div>
          </div>
          <span className="mono">{fmtN(u.geojson.features.length)} geometrías</span>
          <div className="d">
            <span>Capa cargada por el usuario</span>
            <span>·</span>
            <span>Fuente: archivo KML/KMZ local (no se sube a ningún servidor)</span>
          </div>
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
