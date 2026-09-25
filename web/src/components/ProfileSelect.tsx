import { useRiskStore } from '../store/useRiskStore';
import { RISK_PROFILES } from '../data/riskConfig';

/** Nombre del perfil activo, para metadatos de tablas e informes. */
export function useProfileLabel(): string {
  const profileId = useRiskStore((s) => s.profileId);
  const p = RISK_PROFILES.find((x) => x.id === profileId);
  return p ? `${p.label}${p.id === 'vigente' ? '' : ` (${p.estado})`}` : 'Personalizado (pesos editados a mano)';
}

/** Selector de perfil de pesos del índice (compartido: tab Riesgo y Comité).
 *  No requiere activar la consulta: cambia la configuración completa del motor. */
export default function ProfileSelect() {
  const profileId = useRiskStore((s) => s.profileId);
  const applyProfile = useRiskStore((s) => s.applyProfile);
  const p = RISK_PROFILES.find((x) => x.id === profileId);

  return (
    <div className="no-print prof">
      <label className="prof-row">
        <span className="rv-lbl">Perfil de pesos</span>
        <select value={profileId ?? ''} onChange={(e) => applyProfile(e.target.value)}>
          {profileId == null && <option value="">Personalizado</option>}
          {RISK_PROFILES.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </select>
      </label>
      <p className={`prof-note${p && p.id !== 'vigente' ? ' prop' : ''}`}>
        {p ? (
          <>
            <b>{p.estado}.</b> {p.nota}
          </>
        ) : (
          'Pesos o distancias editados a mano en el tab Riesgo.'
        )}
      </p>
    </div>
  );
}
