import { CARDS_1, CARDS_2, type IconKey } from '../data/portal';
import { Icon } from './Icon';

function Cell({ icon, t, b, a }: { icon: IconKey; t: string; b: string | string[]; a: string }) {
  return (
    <article className="cell">
      <span className="icon">
        <Icon k={icon} s={20} />
      </span>
      <h4>{t}</h4>
      {Array.isArray(b) ? (
        <ul>
          {b.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : (
        <p>{b}</p>
      )}
      <a href="#secciones">{a}</a>
    </article>
  );
}

export default function Sections() {
  return (
    <section className="wrap" id="secciones">
      <div className="shead">
        <h2>Explorar el portal</h2>
        <span className="lbl">Reunión N°1 Comité · identificación de información</span>
      </div>
      <div className="grid">
        {CARDS_1.map(([i, t, b, a]) => (
          <Cell key={t} icon={i} t={t} b={b} a={a} />
        ))}
      </div>
      <div className="grid" style={{ marginTop: 'var(--space-6)' }}>
        {CARDS_2.map(([i, t, b, a]) => (
          <Cell key={t} icon={i} t={t} b={b} a={a} />
        ))}
      </div>
    </section>
  );
}
