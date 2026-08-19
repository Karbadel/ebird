import { usePortalStore } from '../store/usePortalStore';
import { GROUPS } from '../types';
import { RISK_COLORS, RISK_LABELS } from '../data/portal';

export default function TitlePlate() {
  const legendOpen = usePortalStore((s) => s.legendOpen);
  const sp = usePortalStore((s) => s.species);
  const sheetOpen = usePortalStore((s) => s.sheetOpen);
  const openSheet = usePortalStore((s) => s.openSheet);
  const collapsed = usePortalStore((s) => s.titleCollapsed);
  const toggle = usePortalStore((s) => s.toggleTitleCollapsed);

  // Panel de especie: solo aparece al abrir la ficha de una especie.
  if (!sp) return null;

  if (collapsed) {
    return (
      <button className="side-tab plate dark" id="title-tab" onClick={toggle} title="Expandir panel">
        <span className="sw" style={{ background: GROUPS[sp.grp].color }} />
        <span>{sp.es}</span>
      </button>
    );
  }

  return (
    <div className="plate dark" id="title-plate">
      <button className="plate-min" onClick={toggle} title="Minimizar" aria-label="Minimizar">
        ─
      </button>
      <span className="lbl">Especie seleccionada</span>
      <h3 style={{ textTransform: 'none' }}>{sp.es}</h3>
      <p>{sp.en} · <i>{sp.sci}</i></p>
      <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
        <span className="tag tag-neutral">{GROUPS[sp.grp].label}</span>
        {sp.notable && <span className="tag tag-accent">Notable</span>}
        <span className="tag tag-outline">{sp.cat === 'exótica' ? 'Exótica' : 'Nativa'}</span>
      </div>
      {!sheetOpen && (
        <button
          className="btn btn-secondary btn-block"
          style={{ color: 'var(--color-bg)', borderColor: 'var(--color-accent-600)' }}
          onClick={openSheet}
        >
          Ver ficha →
        </button>
      )}
      {legendOpen && (
        <div id="legend">
          <span className="lbl" style={{ display: 'block', marginBottom: 5 }}>
            Riesgo de colisión
          </span>
          {RISK_COLORS.slice().reverse().map((c, i) => (
            <div className="lgd" key={c}>
              <i style={{ background: c }} />
              {RISK_LABELS[4 - i]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
