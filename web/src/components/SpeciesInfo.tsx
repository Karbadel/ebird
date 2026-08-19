import { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { SPECIES } from '../data/species';

const fmt = (n: number) => n.toLocaleString('es-CL');

export default function SpeciesInfo() {
  const observations = useDataStore((s) => s.observations);

  // Cifras REALES desde nuestro snapshot eBird (dataset acotado a cóndor).
  const real = useMemo(() => {
    const rows = observations.filter((o) => o.sci === SPECIES.sci);
    return {
      registros: rows.length,
      regiones: new Set(rows.map((o) => o.region)).size,
      individuos: rows.reduce((a, o) => a + o.count, 0),
    };
  }, [observations]);

  const img = `${import.meta.env.BASE_URL}${SPECIES.image.src}`;

  return (
    <div className="sp-info">
      <figure className="sp-figure">
        <img src={img} alt={`${SPECIES.common} (${SPECIES.sci})`} loading="lazy" />
        <figcaption>
          Foto: {SPECIES.image.author} ·{' '}
          <a href={SPECIES.image.sourceUrl} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> ·{' '}
          <a href={SPECIES.image.licenseUrl} target="_blank" rel="noopener noreferrer">{SPECIES.image.license}</a>
        </figcaption>
      </figure>

      <div className="sp-pad">
        <h3 style={{ textTransform: 'none', margin: 0 }}>{SPECIES.common}</h3>
        <div style={{ fontStyle: 'italic', fontSize: 13, color: 'color-mix(in srgb,var(--color-text) 58%,transparent)' }}>
          {SPECIES.sci} · {SPECIES.family}
        </div>

        <div className="sp-badges">
          <span className="sp-badge chile" title={SPECIES.statusChileNote}>Chile · {SPECIES.statusChile}</span>
          <span className="sp-badge global" title={SPECIES.statusGlobalNote}>Mundial · {SPECIES.statusGlobal}</span>
          <span className="sp-badge mon">{SPECIES.monument}</span>
        </div>

        {/* Cifras reales de nuestro dataset eBird */}
        <div className="sp-stats">
          <div><div className="fig mono">{fmt(real.registros)}</div><span className="lbl">Registros eBird</span></div>
          <div><div className="fig mono">{fmt(real.regiones)}</div><span className="lbl">Regiones</span></div>
          <div><div className="fig mono">{fmt(real.individuos)}</div><span className="lbl">Individuos</span></div>
        </div>
        <span className="lbl" style={{ display: 'block', marginTop: 4 }}>Ventana eBird · ≤ 30 días</span>

        <div className="sp-sec">
          <span className="lbl">Ficha de la especie</span>
          <dl className="sp-facts">
            {SPECIES.facts.map((f) => (
              <div key={f.k}>
                <dt>{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="sp-sec">
          <span className="lbl">Amenazas</span>
          <p style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>{SPECIES.threats}</p>
        </div>

        <div className="sp-sec">
          <span className="lbl">Fuentes</span>
          <ul className="sp-sources">
            {SPECIES.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
