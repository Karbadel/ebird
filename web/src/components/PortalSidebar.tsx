import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useFilterStore } from '../store/useFilterStore';
import { usePortalStore } from '../store/usePortalStore';
import { mapInstance, CHILE, FIT } from '../lib/mapInstance';
import { searchItems, didYouMean } from '../lib/search';
import { Icon } from './Icon';

const uniqSorted = (v: string[]) => [...new Set(v)].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es'));

export default function PortalSidebar() {
  const observations = useDataStore((s) => s.observations);
  const f = useFilterStore();
  const layers = usePortalStore((s) => s.layers);
  const toggleLayer = usePortalStore((s) => s.toggleLayer);
  const legendOpen = usePortalStore((s) => s.legendOpen);
  const toggleLegend = usePortalStore((s) => s.toggleLegend);
  const setActiveSite = usePortalStore((s) => s.setActiveSite);

  const regions = useMemo(() => uniqSorted(observations.map((o) => o.region)), [observations]);

  // Búsqueda difusa (sin acentos, tolerante a typos) sobre el catálogo de especies.
  const matches = useMemo(
    () => searchItems(observations, f.query).filter((sp) => !f.species.includes(sp.es)),
    [observations, f.query, f.species],
  );
  const suggestions = useMemo(
    () => (f.query.trim() && matches.length === 0 ? didYouMean(observations, f.query) : []),
    [observations, f.query, matches.length],
  );

  const preset = (days: number) => {
    const to = new Date('2026-08-17T00:00:00');
    const from = new Date(to);
    from.setDate(to.getDate() - days);
    f.update('from', from.toISOString().slice(0, 10));
    f.update('to', to.toISOString().slice(0, 10));
  };

  return (
    <aside className="side">
      {/* Capas principales */}
      <div className="sec">
        <span className="lbl">
          <Icon k="layers" s={13} /> Capas principales
        </span>
        <div>
          {layers.map((l) => (
            <label className="lyr" key={l.id} title={l.src}>
              <input
                type="checkbox"
                checked={l.on}
                disabled={l.pend}
                onChange={() => toggleLayer(l.id)}
              />
              <span className="sw" style={{ background: l.sw }} />
              <span>
                {l.n}
                <span className="src">{l.pend ? `por cargar · ${l.src}` : l.src}</span>
              </span>
            </label>
          ))}
        </div>
        <button className="btn btn-secondary btn-block" onClick={toggleLegend}>
          ☰ {legendOpen ? 'Ocultar leyenda' : 'Ver leyenda'}
        </button>
      </div>

      {/* Búsqueda */}
      <div className="sec">
        <span className="lbl">Búsqueda</span>
        <div className="search-wrap">
          <input
            value={f.query}
            onChange={(e) => {
              f.update('query', e.target.value);
              // Una nueva búsqueda reemplaza la especie fijada (no acumula).
              if (f.species.length) f.update('species', []);
            }}
            placeholder="Buscar especie (con o sin acento)…"
            autoComplete="off"
          />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.55, flex: 'none' }}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          {matches.length > 0 && (
            <div className="suggest">
              {matches.map((sp) => (
                <button
                  key={sp.es}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    // Reemplaza la selección por esta única especie.
                    f.update('species', [sp.es]);
                    f.update('query', '');
                  }}
                >
                  <span className="nm">{sp.es}</span>
                  <span className="sci">{sp.sci}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {suggestions.length > 0 && (
          <div style={{ marginTop: 6, fontSize: 12 }}>
            <span className="lbl" style={{ display: 'block', marginBottom: 4 }}>
              Sin resultados · ¿quizás quisiste decir?
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {suggestions.map((sp) => (
                <button
                  key={sp.es}
                  className="tag tag-outline"
                  style={{ cursor: 'pointer', border: '1px solid var(--color-accent)', background: 'transparent' }}
                  onClick={() => {
                    f.update('species', [sp.es]);
                    f.update('query', '');
                  }}
                >
                  {sp.es}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ubicación */}
      <div className="sec">
        <span className="lbl">Ubicación</span>
        <label className="radio" style={{ display: 'flex', padding: '3px 0' }}>
          <input type="radio" name="ub" defaultChecked />
          <span className="dot" />
          Chile continental
        </label>
        <label className="radio" style={{ display: 'flex', padding: '3px 0' }}>
          <input type="radio" name="ub" />
          <span className="dot" />
          Territorio Antártico Chileno
        </label>
        <button
          className="btn btn-ghost"
          style={{ padding: 0, marginTop: 4 }}
          onClick={() => {
            setActiveSite(null);
            mapInstance.map?.flyToBounds(CHILE, FIT);
          }}
        >
          Encuadrar todo →
        </button>
      </div>

      {/* Filtros de observación */}
      <div className="sec">
        <span className="lbl">Filtros de observación</span>
        <select
          className="input"
          value={f.region}
          onChange={(e) => f.update('region', e.target.value)}
          style={{ borderRadius: 0, background: 'transparent', fontSize: 13, minHeight: 32 }}
        >
          <option value="">Todo Chile</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="seg" style={{ width: '100%', marginTop: 'var(--space-2)' }}>
          <label className="seg-opt" style={{ flex: 1, justifyContent: 'center' }}>
            <input type="radio" name="rng" onChange={() => preset(7)} />7 d
          </label>
          <label className="seg-opt" style={{ flex: 1, justifyContent: 'center' }}>
            <input type="radio" name="rng" defaultChecked onChange={() => preset(30)} />30 d
          </label>
          <label className="seg-opt" style={{ flex: 1, justifyContent: 'center' }}>
            <input type="radio" name="rng" />Rango
          </label>
        </div>
        <label className="lyr" style={{ gridTemplateColumns: '14px 1fr', marginTop: 'var(--space-2)' }}>
          <input type="checkbox" checked={f.onlyValid} onChange={(e) => f.update('onlyValid', e.target.checked)} />
          Solo registros validados
        </label>
        <label className="lyr" style={{ gridTemplateColumns: '14px 1fr' }}>
          <input type="checkbox" checked={f.onlyNotable} onChange={(e) => f.update('onlyNotable', e.target.checked)} />
          Solo registros notables
        </label>
      </div>
    </aside>
  );
}
