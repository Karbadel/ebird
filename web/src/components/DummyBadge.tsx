// Marca visible y reutilizable para contenido sin fuente real. Variantes:
// `dummy` (contenido ficticio, con el aviso completo) y `corto` (rótulo compacto
// «Dummy» para filas estrechas, como las capas del panel).
export default function DummyBadge({ variant = 'dummy' }: { variant?: 'dummy' | 'corto' }) {
  const aviso = 'Datos dummy · hasta nueva implementación';
  const texto = variant === 'corto' ? 'Dummy' : aviso;
  return (
    <span className={`dummy-badge dummy-badge-${variant}`} title={variant === 'corto' ? aviso : undefined}>
      {texto}
    </span>
  );
}
