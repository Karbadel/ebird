import { CARDS, type PortalCard, type PortalGo } from '../data/portal';
import { goToPage, goToVisor } from '../lib/nav';
import { hrefFor, hrefForPage } from '../lib/urlState';
import { Icon } from './Icon';

function hrefForGo(go: PortalGo | undefined): string {
  if (!go) return '#visor';
  return 'tab' in go ? hrefFor(go.tab) : hrefForPage(go.page);
}

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
        href={hrefForGo(c.go)}
        onClick={(e) => {
          e.preventDefault();
          if (!c.go) goToVisor();
          else if ('tab' in c.go) goToVisor(c.go.tab);
          else goToPage(c.go.page);
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
