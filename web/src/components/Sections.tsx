import { CARDS, type PortalCard } from '../data/portal';
import { goToVisor } from '../lib/nav';
import { hrefFor } from '../lib/urlState';
import { Icon } from './Icon';

function Cell({ c }: { c: PortalCard }) {
  return (
    <article className="cell">
      <span className="icon">
        <Icon k={c.icon} s={20} />
      </span>
      <h4>{c.t}</h4>
      {Array.isArray(c.b) ? (
        <ul>
          {c.b.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : (
        <p>{c.b}</p>
      )}
      <a
        href={c.go && c.go !== 'visor' ? hrefFor(c.go) : '#visor'}
        onClick={(e) => {
          e.preventDefault();
          goToVisor(c.go === 'visor' ? undefined : c.go);
        }}
      >
        {c.a}
      </a>
    </article>
  );
}

// Solo se muestran las secciones con contenido real (las `pend` quedan ocultas
// hasta que existan).
export default function Sections() {
  return (
    <section className="wrap" id="secciones">
      <div className="shead">
        <h2>Explorar el portal</h2>
        <span className="lbl">Accesos directos a las herramientas del visor</span>
      </div>
      <div className="grid">
        {CARDS.filter((c) => !c.pend && c.go).map((c) => (
          <Cell key={c.t} c={c} />
        ))}
      </div>
    </section>
  );
}
