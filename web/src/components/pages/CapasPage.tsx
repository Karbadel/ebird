import { goToVisor } from '../../lib/nav';
import { LAYER_GROUPS, usePortalStore, type PortalLayer } from '../../store/usePortalStore';
import { useCapasConteo, fmtN } from '../../lib/capasConteo';
import { DOCUMENTOS } from '../../data/documentos';
import DummyBadge from '../DummyBadge';

const FORMATOS: Record<string, string> = { geojson: 'GeoJSON', json: 'JSON', png: 'PNG' };
const formatoDe = (file: string) => {
  const ext = file.split('.').pop()?.toLowerCase() ?? '';
  return FORMATOS[ext] ?? ext.toUpperCase();
};
const fmtTam = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('es-CL')} KB`;

// Tabla de descargas: mismos grupos y orden que el panel de capas (se derivan del
// store). Cada enlace apunta al archivo estático que usa el visor, tal cual.
export default function CapasPage() {
  const layers = usePortalStore((s) => s.layers);
  const conteos = useCapasConteo();

  const archivo = (l: PortalLayer) => {
    if (l.dummy) {
      return (
        <span className="cap-sin">
          sin archivo (datos dummy) <DummyBadge variant="corto" />
        </span>
      );
    }
    if (l.id === 'antenas') return <span className="cap-sin">sin archivo (correcciones de campo locales)</span>;
    const c = conteos[l.id];
    if (!c?.file) return <span className="cap-sin">sin archivo descargable</span>;
    return (
      <a className="btn btn-secondary cap-dl" href={`${import.meta.env.BASE_URL}${c.file}`} download>
        Descargar
      </a>
    );
  };

  return (
    <section className="wrap page">
      <a className="back-link" href="#visor" onClick={(e) => { e.preventDefault(); goToVisor(); }}>← Volver al visor</a>
      <div className="shead">
        <h2>Capas Geoespaciales Disponibles</h2>
      </div>
      <p className="text-muted cap-nota">
        Cada capa conserva la licencia y las condiciones de uso de su fuente original (columna «Fuente»,
        con su fecha cuando corresponde). Los archivos se entregan tal como los usa el visor, sin
        procesamiento adicional: las capas dummy y las correcciones de campo no tienen archivo. Las
        capas de mayor tamaño pueden tardar en descargarse.
      </p>
      <div className="cap-tabla" role="table" aria-label="Capas geoespaciales disponibles para descarga">
        <div className="cap-fila cap-cab" role="row">
          <span role="columnheader">Capa</span>
          <span role="columnheader">Fuente</span>
          <span role="columnheader">N.º de elementos</span>
          <span role="columnheader">Formato</span>
          <span role="columnheader">Tamaño</span>
          <span role="columnheader">Descargar</span>
        </div>
        {LAYER_GROUPS.map((g) => {
          const items = layers.filter((l) => l.group === g.id && !l.pend);
          if (items.length === 0) return null;
          return (
            <div key={g.id} role="rowgroup">
              <div className="cap-grupo" role="row">
                <span role="columnheader">{g.title}</span>
              </div>
              {items.map((l) => {
                const c = conteos[l.id];
                return (
                  <div className="cap-fila" role="row" key={l.id}>
                    <span className="cap-n" role="cell">
                      <span className="sw-mini" style={{ background: l.sw }} />
                      {l.n}
                    </span>
                    <span className="cap-f" role="cell" data-label="Fuente">{l.src}</span>
                    <span className="mono" role="cell" data-label="Elementos">
                      {l.dummy || !c ? '—' : `${fmtN(c.n)} ${c.unidad}`}
                    </span>
                    <span role="cell" data-label="Formato">{c?.file && !l.dummy ? formatoDe(c.file) : '—'}</span>
                    <span className="mono" role="cell" data-label="Tamaño">
                      {c?.bytes != null && !l.dummy ? fmtTam(c.bytes) : '—'}
                    </span>
                    <span className="cap-a" role="cell">{archivo(l)}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <h3>Documentos</h3>
      <div className="doc-list">
        {DOCUMENTOS.map((d) => (
          <div className="doc" key={d.id}>
            <div>
              <div className="t">{d.nombre}</div>
              <div className="d">
                PDF · {d.fecha} · {fmtTam(d.bytes)}
                {d.propuesta && <DummyBadge variant="propuesta" />}
              </div>
            </div>
            <a className="btn btn-secondary cap-dl" href={`${import.meta.env.BASE_URL}${d.archivo}`} download>
              Descargar
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
