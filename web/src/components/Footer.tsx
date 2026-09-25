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
        {/* Contacto / Términos / Privacidad: ocultos hasta tener destino real. */}
      </div>
    </footer>
  );
}
