export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="seal">Ministerio de Energía · Gobierno de Chile</div>
        <p style={{ flex: 1, minWidth: 240 }}>
          Proyecto desarrollado por el Ministerio de Energía
          <br />
          en colaboración con instituciones públicas, privadas y académicas.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <a href="#secciones">Contacto</a>
          <a href="#secciones">Términos de uso</a>
          <a href="#secciones">Política de privacidad</a>
        </div>
      </div>
    </footer>
  );
}
