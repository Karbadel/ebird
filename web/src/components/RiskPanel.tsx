import { useRef, useState } from 'react';
import type { Geometry } from 'geojson';
import { useRiskStore } from '../store/useRiskStore';
import { useFieldStore, FIELD_STYLES, type DrawType } from '../store/useFieldStore';

const DRAW_OPTIONS: { value: DrawType; label: string }[] = [
  { value: 'ninguno', label: '— Desactivado (clic normal en el mapa)' },
  { value: 'ganado', label: 'Corral / atrayente de ganado' },
  { value: 'lineas', label: 'Línea de transmisión (no reflejada)' },
  { value: 'antenas', label: 'Antena de telecomunicaciones' },
];

// Forma laxa de un Feature leído de un archivo del usuario (aún sin validar).
type RawFeature = { type?: string; geometry?: Geometry; properties?: { tipo?: string } | null };

// Acepta un FeatureCollection o un Feature suelto y devuelve la lista de features.
function extractFeatures(parsed: unknown): RawFeature[] {
  if (parsed && typeof parsed === 'object') {
    const o = parsed as { type?: unknown; features?: unknown };
    if (Array.isArray(o.features)) return o.features as RawFeature[];
    if (o.type === 'Feature') return [parsed as RawFeature];
  }
  return [];
}

function FieldCorrectionsSection() {
  const drawType = useFieldStore((s) => s.drawType);
  const setDrawType = useFieldStore((s) => s.setDrawType);
  const corrections = useFieldStore((s) => s.corrections);
  const add = useFieldStore((s) => s.add);
  const remove = useFieldStore((s) => s.remove);
  const clear = useFieldStore((s) => s.clear);
  const toGeoJSON = useFieldStore((s) => s.toGeoJSON);

  const fileInput = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const counts = {
    ganado: corrections.filter((c) => c.tipo === 'ganado').length,
    lineas: corrections.filter((c) => c.tipo === 'lineas').length,
    antenas: corrections.filter((c) => c.tipo === 'antenas').length,
  };

  const exportar = () => {
    const blob = new Blob([toGeoJSON()], { type: 'application/geo+json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `correcciones_campo_condores_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Importa un GeoJSON de correcciones (el mismo formato que exporta esta sección):
  // cada Feature debe traer properties.tipo ∈ {ganado, lineas, antenas} y geometría.
  // Se suman a las existentes (sin deduplicar en esta versión).
  const importar = async (file: File) => {
    setImportMsg(null);
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const feats = extractFeatures(parsed);
      let ok = 0;
      let skip = 0;
      for (const f of feats) {
        const tipo = f?.properties?.tipo;
        const geom = f?.geometry;
        if ((tipo === 'ganado' || tipo === 'lineas' || tipo === 'antenas') && geom && typeof geom.type === 'string') {
          add(tipo, geom);
          ok++;
        } else {
          skip++;
        }
      }
      setImportMsg(
        ok > 0
          ? `${ok} corrección(es) importada(s)${skip ? `, ${skip} omitida(s)` : ''}.`
          : 'Ningún elemento válido: revisa que cada Feature tenga properties.tipo (ganado/lineas/antenas) y geometría.',
      );
    } catch {
      setImportMsg('No se pudo leer el archivo (¿es un GeoJSON válido?).');
    }
  };

  return (
    <details className="risk-justif" style={{ marginTop: 'var(--space-6)' }}>
      <summary>Correcciones de campo</summary>
      <p style={{ fontSize: 11.5, color: 'color-mix(in srgb,var(--color-text) 60%,transparent)' }}>
        Marca elementos observados en terreno; se suman en vivo al índice de riesgo. Se guardan en
        este navegador (sobreviven a recargas). Para compartirlas con otro equipo o incorporarlas a
        los datasets oficiales, expórtalas como GeoJSON; también puedes importar un archivo recibido.
      </p>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginTop: 6 }}>
        Tipo de elemento a marcar
      </label>
      <select
        value={drawType}
        onChange={(e) => {
          const t = e.target.value as DrawType;
          // Dibujo y consulta de riesgo reaccionan ambos al clic: excluyentes.
          if (t !== 'ninguno') useRiskStore.getState().stopQuery();
          setDrawType(t);
        }}
        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-divider)', fontSize: 12.5, margin: '4px 0 8px' }}
      >
        {DRAW_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {drawType !== 'ninguno' && (
        <p style={{ fontSize: 11.5, color: 'var(--color-accent-700)', fontWeight: 600 }}>
          ● Haz clic en el mapa para marcar: {FIELD_STYLES[drawType].label}
        </p>
      )}
      <p style={{ fontSize: 11.5, margin: '4px 0' }}>
        {corrections.length === 0
          ? 'Sin correcciones cargadas.'
          : `${corrections.length} activa(s): ${counts.ganado} corral(es), ${counts.lineas} línea(s), ${counts.antenas} antena(s).`}
      </p>
      {corrections.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0', maxHeight: 120, overflowY: 'auto' }}>
          {corrections.map((c, i) => (
            <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, padding: '2px 0' }}>
              <i style={{ width: 10, height: 10, borderRadius: '50%', background: FIELD_STYLES[c.tipo].color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>#{i + 1} {c.tipo}</span>
              <button className="btn btn-secondary" style={{ padding: '1px 7px', fontSize: 11 }} onClick={() => remove(c.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
        <button className="btn btn-secondary" disabled={corrections.length === 0} onClick={exportar}>
          Exportar GeoJSON
        </button>
        <button className="btn btn-secondary" onClick={() => fileInput.current?.click()}>
          Importar GeoJSON
        </button>
        <button className="btn btn-secondary" disabled={corrections.length === 0} onClick={clear}>
          Limpiar
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".geojson,.json,application/geo+json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importar(f);
            e.target.value = '';
          }}
        />
      </div>
      {importMsg && (
        <p style={{ fontSize: 11.5, marginTop: 6, color: 'color-mix(in srgb,var(--color-text) 70%,transparent)' }}>
          {importMsg}
        </p>
      )}
    </details>
  );
}

const JUSTIFICACION =
  'La proximidad a parques eólicos y líneas de transmisión concentra el 40% del índice porque son la causa física directa de colisión. La idoneidad de hábitat (20%) indica probabilidad de presencia y vuelo del cóndor. Los nidos (15%, ahora con evidencia de reproducción eBird) marcan actividad reproductiva y corredores de vuelo de adultos. Vertederos, veranadas y ganado (20% combinado) son fuentes de carroña que atraen vuelo hacia zonas con infraestructura. El historial de colisiones confirmadas (5%) aporta validación empírica directa. La densidad de avistamientos eBird (5%) suma evidencia empírica de actividad de vuelo, con peso bajo porque mide esfuerzo de observación además de presencia real del cóndor (sesgo hacia sitios con más observadores). Estos pesos son un punto de partida editable, no una verdad estadística — ajústalos si dispones de datos de calibración.';

export default function RiskPanel() {
  const queryActive = useRiskStore((s) => s.queryActive);
  const toggleQuery = useRiskStore((s) => s.toggleQuery);
  const loading = useRiskStore((s) => s.loading);
  const config = useRiskStore((s) => s.config);
  const setWeight = useRiskStore((s) => s.setWeight);
  const setEnabled = useRiskStore((s) => s.setEnabled);
  const setDecay = useRiskStore((s) => s.setDecay);
  const resetConfig = useRiskStore((s) => s.resetConfig);

  const sum = config.filter((c) => c.enabled).reduce((a, c) => a + c.weight, 0);
  // Las variables solo se ajustan con la consulta activa (tras pulsar el botón).
  const locked = !queryActive;

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <button
        className={`btn ${queryActive ? 'btn-primary' : 'btn-secondary'} btn-block`}
        style={{ marginTop: 0 }}
        onClick={() => {
          // Al activar la consulta, desactiva el modo dibujo (ambos usan el clic).
          if (!queryActive) useFieldStore.getState().setDrawType('ninguno');
          toggleQuery();
        }}
      >
        {queryActive ? '● Consulta activa — clic en el mapa' : 'Activar consulta de riesgo'}
      </button>
      {loading && (
        <p className="lbl" style={{ marginTop: 8 }}>
          Cargando capas del motor…
        </p>
      )}
      <p
        style={{
          fontSize: 11.5,
          color: 'color-mix(in srgb,var(--color-text) 60%,transparent)',
          marginTop: 8,
        }}
      >
        Con la consulta activa, haz clic en cualquier punto del mapa para ver el índice de riesgo
        estimado y el desglose de criterios.
      </p>

      <h4 style={{ marginTop: 'var(--space-6)', fontSize: 13 }}>Variables del índice de riesgo</h4>
      <p style={{ fontSize: 11, color: 'color-mix(in srgb,var(--color-text) 55%,transparent)', marginBottom: 6 }}>
        {locked
          ? 'Activa la consulta de riesgo para ajustar el peso (%) y la distancia de influencia de cada variable.'
          : 'Ajusta el peso (%) y la distancia de influencia de cada variable. Los pesos se normalizan automáticamente al calcular el índice. Valores por defecto sugeridos con criterio experto — ver justificación al pie.'}
      </p>
      <div style={{ opacity: locked ? 0.5 : 1, pointerEvents: locked ? 'none' : 'auto' }} aria-disabled={locked}>
        {config.map((c) => (
          <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-divider)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, cursor: locked ? 'default' : 'pointer' }}>
              <input
                type="checkbox"
                checked={c.enabled}
                disabled={locked}
                onChange={(e) => setEnabled(c.id, e.target.checked)}
                style={{ accentColor: 'var(--color-accent-700)', width: 14, height: 14 }}
              />
              <span style={{ flex: 1 }}>{c.label}</span>
              <b className="mono" style={{ color: 'var(--color-accent-700)' }}>{c.weight}%</b>
            </label>

            <div className="rv-row">
              <span className="rv-lbl">Peso</span>
              <input
                type="range"
                min={0}
                max={100}
                value={c.weight}
                disabled={locked || !c.enabled}
                onChange={(e) => setWeight(c.id, Number(e.target.value))}
              />
              <span className="rv-val mono">{c.weight}</span>
            </div>

            {c.decayKm != null && (
              <div className="rv-row">
                <span className="rv-lbl">Distancia de influencia</span>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={c.decayKm}
                  disabled={locked || !c.enabled}
                  onChange={(e) => setDecay(c.id, Number(e.target.value))}
                />
                <span className="rv-val mono">{c.decayKm} km</span>
              </div>
            )}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <button className="btn btn-secondary" disabled={locked} onClick={resetConfig}>
            Restablecer
          </button>
          <span style={{ fontSize: 11.5, color: 'color-mix(in srgb,var(--color-text) 60%,transparent)' }}>
            Suma activa: {sum}% (se normaliza)
          </span>
        </div>
      </div>

      <FieldCorrectionsSection />

      <details className="risk-justif">
        <summary>Justificación de los pesos por defecto</summary>
        <p>{JUSTIFICACION}</p>
        <a href="https://estrategia-aves.mma.gob.cl/recursos/" target="_blank" rel="noopener noreferrer">
          Estrategia Nacional para la Conservación de Aves · MMA (recursos)
        </a>
      </details>
    </div>
  );
}
