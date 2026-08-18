import { usePortalStore } from '../store/usePortalStore';

export default function StatPlate() {
  const setTab = usePortalStore((s) => s.setTab);
  const panelHidden = usePortalStore((s) => s.panelHidden);
  const togglePanel = usePortalStore((s) => s.togglePanel);

  return (
    <div className="plate dark" id="stat">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 8.5 8 11l4-4 4 4 6-2.5" />
          <path d="m8 11 4 6 4-6" />
        </svg>
        <div>
          <div className="fig mono">132</div>
          <span className="lbl">Colisiones registradas en Chile</span>
        </div>
      </div>
      <div className="lbl mono" style={{ marginTop: 'var(--space-3)' }}>
        Última actualización · mayo 2026
      </div>
      <button
        className="btn btn-secondary btn-block"
        style={{ color: 'var(--color-bg)', borderColor: 'var(--color-accent-600)' }}
        onClick={() => {
          if (panelHidden) togglePanel();
          setTab('colisiones');
        }}
      >
        Ver registro completo →
      </button>
    </div>
  );
}
