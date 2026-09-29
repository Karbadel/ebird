import { usePortalStore } from '../store/usePortalStore';
import { ABUNDANCIA_RAMP, HABITAT_LEGEND, RISK_LABELS, GEN_ESTADOS, PARQUES_CATEGORIAS } from '../data/portal';
import { RISK_CAT_COLORS } from '../data/riskConfig';
import { AYUDA } from '../data/ayuda';

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
  // Todos los hooks antes del return condicional (reglas de hooks de React).
  const densityDomain = usePortalStore((s) => s.densityDomain);
  const windpotByRisk = usePortalStore((s) => s.windpotByRisk);
  const abundanciaP99 = usePortalStore((s) => s.abundanciaP99);
  if (!open) return null;

  const isOn = (id: string) => layers.find((l) => l.id === id)?.on ?? false;
  const habitatOn = isOn('habitat');
  const abundOn = isOn('abundancia');
  const rangoOn = isOn('rango_condor');
  const areaOn = isOn('area_predictiva');
  const lead = habitatOn || abundOn || rangoOn || areaOn;
  const densidadOn = isOn('ebird_densidad');
  const projectsOn = isOn('projects');
  const windpotOn = isOn('windpot');
  const parquesOn = isOn('parques_eolicos');
  const dummyOn = layers.some((l) => l.dummy && l.on);

  return (
    <div id="legend-plate" title={AYUDA.leyenda}>
      {habitatOn && (
        <>
          <span className="lbl">Idoneidad</span>
          <div className="lgd-scale">
            {HABITAT_LEGEND.map((c, i) => (
              <div key={c}>
                <i style={{ background: c }} />
                <span title={RISK_LABELS[i]}>{SHORT[i]}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {abundOn && (
        <>
          <span className="lbl" style={{ display: 'block', marginTop: habitatOn ? 10 : 0 }}>
            Abundancia relativa de cóndor
          </span>
          <div className="lgd-scale">
            {ABUNDANCIA_RAMP.map((c, i) => {
              const first = i === 0;
              const last = i === ABUNDANCIA_RAMP.length - 1;
              const p99 = abundanciaP99 == null ? null : abundanciaP99.toLocaleString('es-CL', { maximumFractionDigits: 1 });
              return (
                <div key={c}>
                  <i style={{ background: c }} />
                  <span>{first ? '0+' : last ? (p99 ? `${p99}+` : 'Más') : ''}</span>
                </div>
              );
            })}
          </div>
          <span className="lgd-caption">Individuos por hora y 2 km (eBird S&amp;T 2023) · tope = percentil 99</span>
        </>
      )}

      {(rangoOn || areaOn) && (
        <>
          <span className="lbl" style={{ display: 'block', marginTop: habitatOn || abundOn ? 10 : 0 }}>
            eBird S&amp;T 2023
          </span>
          <div className="lgd-cats">
            {rangoOn && (
              <div className="lgd-cat">
                <i style={{ background: 'rgba(31,122,109,.35)', border: '1.5px solid #1f7a6d' }} />
                <span>Rango estimado</span>
              </div>
            )}
            {areaOn && (
              <div className="lgd-cat">
                <i style={{ background: 'rgba(90,90,110,.15)', border: '1.5px dashed #5a5a6e' }} />
                <span>Área predictiva</span>
              </div>
            )}
          </div>
        </>
      )}

      {densidadOn && (
        <>
          <span className="lbl" style={{ display: 'block', marginTop: lead ? 10 : 0 }}>
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
          <span className="lbl" style={{ display: 'block', marginTop: lead || densidadOn ? 10 : 0 }}>
            Otros proyectos de generación · estado
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

      {parquesOn && (
        <>
          <span className="lbl" style={{ display: 'block', marginTop: lead || densidadOn || projectsOn ? 10 : 0 }}>
            Parques eólicos · categoría
          </span>
          <div className="lgd-cats">
            {PARQUES_CATEGORIAS.map((c) => (
              <div className="lgd-cat" key={c.key}>
                <i style={{ background: c.color, borderRadius: '50%' }} />
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {windpotOn && (
        <>
          <span className="lbl" style={{ display: 'block', marginTop: lead || densidadOn || projectsOn || parquesOn ? 10 : 0 }}>
            {windpotByRisk ? 'Potencial eólico · índice de riesgo' : 'Potencial eólico bruto'}
          </span>
          <div className="lgd-cats">
            {windpotByRisk ? (
              RISK_LABELS.map((lab, k) => (
                <div className="lgd-cat" key={lab}>
                  <i style={{ background: RISK_CAT_COLORS[k] }} />
                  <span>{lab}</span>
                </div>
              ))
            ) : (
              <div className="lgd-cat">
                <i style={{ background: '#7a5aa6' }} />
                <span>Área con potencial (20 ha/MW)</span>
              </div>
            )}
          </div>
        </>
      )}

      {dummyOn && (
        <div className="lgd-row bordered">
          <span className="lgd-dummy" />
          <span>Capa dummy · geometría ficticia (hasta nueva implementación)</span>
        </div>
      )}
      <div className={`lgd-row${dummyOn ? '' : ' bordered'}`}>
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
