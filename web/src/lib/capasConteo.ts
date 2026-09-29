import { useEffect, useMemo, useState } from 'react';
import { useFieldStore } from '../store/useFieldStore';

/** Conteo de elementos por capa (`data/capas_conteo.json`, generado por
 *  `src/build_capas_derivadas.py`). Las capas dummy no figuran; las antenas se
 *  agregan en vivo desde las correcciones de campo (sin archivo). */
export interface CapaConteo {
  n: number;
  unidad: string;
  /** Ruta del archivo estático bajo la base del sitio (ausente en las antenas). */
  file?: string | undefined;
  bytes?: number | undefined;
}
export type Conteos = Record<string, CapaConteo>;

// Se pide una sola vez por sesión; si falla, el panel simplemente no muestra conteos.
let cache: Promise<Conteos | null> | null = null;
function cargar(): Promise<Conteos | null> {
  cache ??= fetch(`${import.meta.env.BASE_URL}data/capas_conteo.json`)
    .then((r) => (r.ok ? (r.json() as Promise<Conteos>) : null))
    .catch(() => null);
  return cache;
}

/** Conteos por capa: los del JSON estático más «antenas», que es dinámico (número
 *  de correcciones de campo de tipo antena guardadas en este navegador). */
export function useCapasConteo(): Conteos {
  const [c, setC] = useState<Conteos | null>(null);
  const nAntenas = useFieldStore((s) => s.corrections.filter((x) => x.tipo === 'antenas').length);
  useEffect(() => {
    let vivo = true;
    void cargar().then((v) => {
      if (vivo) setC(v);
    });
    return () => {
      vivo = false;
    };
  }, []);
  return useMemo(() => ({ ...(c ?? {}), antenas: { n: nAntenas, unidad: 'antenas' } }), [c, nAntenas]);
}

export const fmtN = (n: number) => n.toLocaleString('es-CL');
