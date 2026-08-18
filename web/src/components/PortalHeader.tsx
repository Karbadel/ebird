import { NAV } from '../data/portal';
import { Icon } from './Icon';

export default function PortalHeader() {
  return (
    <header className="top">
      <div className="brand">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 2 }}>
          <path d="M2 8.5 8 11l4-4 4 4 6-2.5" />
          <path d="M12 7v6" />
          <path d="m8 11 4 6 4-6" />
          <path d="M12 17v4" />
        </svg>
        <div>
          <h1>Cóndores y Energía Eólica en Chile</h1>
          <p>Portal de información para la compatibilidad entre proyectos eólicos y conservación del cóndor andino</p>
        </div>
      </div>
      <nav className="nav2">
        {NAV.map(([icon, n, s, cur]) => (
          <a key={n} href="#secciones" {...(cur ? { 'aria-current': 'page' as const } : {})}>
            <Icon k={icon} s={19} />
            <span className="n">{n}</span>
            <span className="s">{s}</span>
          </a>
        ))}
      </nav>
    </header>
  );
}
