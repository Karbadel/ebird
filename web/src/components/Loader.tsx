import { useDataStore } from '../store/useDataStore';

export default function Loader() {
  const loading = useDataStore((s) => s.loading);
  const error = useDataStore((s) => s.error);

  return (
    <div id="loader" className={loading ? '' : 'hide'}>
      <div className="box">
        <div className="ghost" />
        <span className="lbl">Cóndores y Energía Eólica en Chile</span>
        <h3 style={{ margin: '6px 0 var(--space-4)', fontSize: 23 }}>
          {error ? 'No se pudieron cargar los datos' : 'Cargando capas geoespaciales'}
        </h3>
        {!error && (
          <>
            <div className="prog">
              <i />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'var(--space-6)' }}>
              <div className="skel" style={{ width: '74%' }} />
              <div className="skel" style={{ width: '56%' }} />
              <div className="skel" style={{ width: '64%' }} />
            </div>
          </>
        )}
        <div className="lbl mono" style={{ marginTop: 'var(--space-6)', color: error ? 'var(--r5)' : undefined }}>
          {error ? error : 'Mapa de riesgo · colisiones · API eBird ≤ 30 días'}
        </div>
      </div>
    </div>
  );
}
