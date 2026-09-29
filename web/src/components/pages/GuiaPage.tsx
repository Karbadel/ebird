import { Fragment, type ReactNode } from 'react';
import { goToVisor } from '../../lib/nav';
import { GUIA, GUIA_TITULO, type GuiaBloque } from '../../data/guia';
import { docUrl } from '../../data/documentos';
import DummyBadge from '../DummyBadge';

// *texto* → cursiva (nombres científicos).
function conCursiva(x: string): ReactNode {
  return x.split('*').map((t, i) => (i % 2 === 1 ? <i key={i}>{t}</i> : <Fragment key={i}>{t}</Fragment>));
}

function Bloque({ b }: { b: GuiaBloque }) {
  switch (b.k) {
    case 'p':
      return <p>{conCursiva(b.x)}</p>;
    case 'h':
      return <h4 className="guia-h">{b.x}</h4>;
    case 'hs':
      return <h5 className="guia-hs">{b.x}</h5>;
    case 'ul':
      return (
        <ul>
          {b.x.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      );
  }
}

// El enrutado usa el hash de la URL: las anclas del índice se resuelven con scroll,
// sin tocar el hash.
function irA(id: string) {
  const el = document.getElementById(`guia-${id}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  }
}

const NOTA_CIFRAS =
  'Las cifras de este borrador provienen del documento original y pueden diferir de los datos del visor (p. ej. el visor registra 29 colisiones confirmadas 2019–2025).';

// Contenido: propuesta entregada por el cliente (borrador sin autor ni fecha).
// Se transcribe en data/guia.ts.
export default function GuiaPage() {
  const primeraBp = GUIA.find((s) => s.grupo === 'bp')?.id;
  return (
    <section className="wrap page">
      <a className="back-link" href="#visor" onClick={(e) => { e.preventDefault(); goToVisor(); }}>← Volver al visor</a>
      <div className="shead">
        <h2>Guía de Buenas Prácticas</h2>
        <DummyBadge variant="propuesta" />
      </div>
      <p className="text-muted guia-intro">
        Propuesta de guía técnica presentada a la Mesa de Cóndores. Es un borrador sin autor ni
        fecha, que aún no ha sido validado ni aprobado por la Mesa: no constituye una guía oficial.
      </p>
      <p className="guia-dl">
        <a className="btn btn-secondary cap-dl" href={docUrl('guia')} download>
          Descargar propuesta (PDF)
        </a>
      </p>

      <nav className="guia-indice" aria-label="Índice de la guía">
        <div className="guia-indice-t">Contenido</div>
        <ol>
          {GUIA.map((s) => (
            <li key={s.id}>
              {s.id === primeraBp && <span className="guia-indice-g">Buenas Prácticas</span>}
              <a href={`#guia-${s.id}`} onClick={(e) => { e.preventDefault(); irA(s.id); }}>
                {s.titulo}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <h3 className="guia-titulo">{GUIA_TITULO}</h3>

      <div className="page-text guia-cuerpo">
        {GUIA.map((s) => (
          <Fragment key={s.id}>
            {s.id === primeraBp && <h3 className="guia-grupo">Buenas Prácticas</h3>}
            <article className="guia-sec">
              <h3 id={`guia-${s.id}`} tabIndex={-1} className={s.grupo ? 'guia-sub' : undefined}>
                {s.titulo}
              </h3>
              {s.bloques.map((b, i) => (
                <Bloque b={b} key={i} />
              ))}
            </article>
          </Fragment>
        ))}
      </div>

      <p className="text-muted guia-nota">{NOTA_CIFRAS}</p>
    </section>
  );
}
