import { useEffect, useState } from 'react';
import type { FeatureCollection } from 'geojson';

/** Elementos por `estado_key` de cada capa eólica por estado, contados del propio
 *  GeoJSON (así no quedan desfasados en la próxima actualización de datos). */
export type EolicoConteos = Record<string, number>;

const ARCHIVOS: Record<string, string> = {
  parques_eolicos: 'parques_eolicos_estado.geojson',
  turb: 'aerogeneradores_estado.geojson',
  buffers_5d: 'buffers_5d_rotor.geojson',
};

// Se pide una sola vez por capa y sesión (el navegador reutiliza el archivo para el mapa).
const cache: Record<string, Promise<EolicoConteos | null>> = {};
function cargar(id: string): Promise<EolicoConteos | null> {
  const file = ARCHIVOS[id];
  if (!file) return Promise.resolve(null);
  cache[id] ??= fetch(`${import.meta.env.BASE_URL}data/layers/${file}`)
    .then((r) => (r.ok ? (r.json() as Promise<FeatureCollection>) : null))
    .then((fc) => {
      if (!fc) return null;
      const c: EolicoConteos = {};
      for (const f of fc.features) {
        const k = String(f.properties?.['estado_key'] ?? '');
        c[k] = (c[k] ?? 0) + 1;
      }
      return c;
    })
    .catch(() => null);
  return cache[id]!;
}

/** Conteos por estado de las capas pedidas (`null` mientras cargan o si falla). */
export function useEolicoConteos(ids: readonly string[]): Record<string, EolicoConteos | null> {
  const [c, setC] = useState<Record<string, EolicoConteos | null>>({});
  const clave = ids.join('|');
  useEffect(() => {
    let vivo = true;
    clave.split('|').filter(Boolean).forEach((id) => {
      void cargar(id).then((v) => {
        if (vivo) setC((prev) => (prev[id] === v ? prev : { ...prev, [id]: v }));
      });
    });
    return () => {
      vivo = false;
    };
  }, [clave]);
  return c;
}
