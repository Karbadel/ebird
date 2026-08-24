import { usePortalStore } from '../store/usePortalStore';
import { RISK_COLORS, RISK_LABELS, GEN_ESTADOS } from '../data/portal';

const SHORT = ['Muy bajo', 'Bajo', 'Medio', 'Alto', 'Muy alto'];
// Rampa de la capa de densidad eBird (equivalente a EBIRD_RAMP del mapa).
const EBIRD_LEGEND = ['#fff7ec', '#fee0b6', '#fdbb84', '#fc8d59', '#e34a33', '#990000'];

// Formato compacto para las etiquetas del rango de densidad: abrevia miles con
// "k" (75.000 → 75k, 1.200 → 1,2k) y deja los números pequeños tal cual.
function compact(n: number): string {
  if (n < 1000) return n.toLocaleString('es-CL');
  const k = n / 1000;
  return `${(k >= 10 ? Math.round(k) : Math.round(k * 10) / 10).toLocaleString('es-CL')}k`;
}

export default function LegendPlate() {
  const open = usePortalStore((s) => s.legendOpen);
  const layers = usePortalStore((s) => s.layers);
  if (!open) return null;

  const densityDomain = usePortalStore((s) => s.densityDomain);
  const isOn = (id: string) => layers.find((l) => l.id === id)?.on ?? false;
  const habitatOn = isOn('habitat');
  const densidadOn = isOn('ebird_densidad');
  const projectsOn = isOn('projects');

  return (
    <div id="legend-plate">
      {habitatOn && (
        <>
          <span className="lbl">Idoneidad</span>
          <div className="lgd-scale">
            {RISK_COLORS.map((c, i) => (
              <div key={c}>
                <i style={{ background: c }} />
                <span title={RISK_LABELS[i]}>{SHORT[i]}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {densidadOn && (
        <>
          <span className="lbl" style={{ display: 'block', marginTop: habitatOn ? 10 : 0 }}>
            Densidad de avistamientos
          </span>
          <div className="lgd-scale">
            {EBIRD_LEGEND.map((c, i) => {
              const first = i === 0;
              const last = i === EBIRD_LEGEND.length - 1;
              // El extremo superior es el percentil 95 (techo de color): los valores
              // por encima saturan, por eso se marca con "+".
              const label = densityDomain
                ? first
                  ? compact(densityDomain[0])
                  : last
                    ? `${compact(densityDomain[1])}+`
                    : ''
                : first
                  ? 'Menos'
                  : last
                    ? 'Más'
                    : '';
              return (
                <div key={c}>
                  <i style={{ background: c }} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
          <span className="lgd-caption">Localidades distintas con registro · por celda (top 5% saturado)</span>
        </>
      )}

      {projectsOn && (
        <>
          <span className="lbl" style={{ display: 'block', marginTop: habitatOn || densidadOn ? 10 : 0 }}>
            Proyectos de generación · estado
          </span>
          {/* Categórico (no degradado): lista vertical chip + etiqueta. */}
          <div className="lgd-cats">
            {GEN_ESTADOS.map((e) => (
              <div className="lgd-cat" key={e.key}>
                <i style={{ background: e.color }} />
                <span>{e.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="lgd-row bordered">
        <span className="lgd-mk">4</span>
        <span>Registro de cóndor · nº de individuos</span>
      </div>
      <div className="lgd-row">
        <span className="lgd-x">✕</span>
        <span>Colisión de cóndor confirmada</span>
      </div>
      <div className="lgd-row">
        <span className="lgd-turb" />
        <span>Aerogenerador (contexto)</span>
      </div>
    </div>
  );
}
