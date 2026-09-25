import { useEffect, useRef, useState } from 'react';
import { AYUDA, type AyudaKey } from '../data/ayuda';

const W = 290;

/** Botón (?) con nota de ayuda flotante. La nota usa posición FIJA calculada desde
 *  el botón para que no la recorten los paneles con scroll (overflow). Se cierra
 *  con clic fuera, Escape o al desplazar. Texto desde data/ayuda.ts. */
export default function InfoTip({ k, label }: { k: AyudaKey; label?: string }) {
  const [pos, setPos] = useState<{ left: number; top: number; up: boolean } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      const t = e.target as Node;
      if (btn.current?.contains(t) || box.current?.contains(t)) return;
      setPos(null);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setPos(null);
    const off = () => setPos(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', off, true);
    window.addEventListener('resize', off);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', off, true);
      window.removeEventListener('resize', off);
    };
  }, [pos]);

  const toggle = (e: React.MouseEvent) => {
    // Puede estar dentro de un <label> o encabezado clicable: no propagar.
    e.preventDefault();
    e.stopPropagation();
    if (pos) return setPos(null);
    const r = btn.current!.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left - 12, window.innerWidth - W - 8));
    // Abre hacia arriba si no cabe debajo (≈ 200 px).
    const up = r.bottom + 210 > window.innerHeight;
    setPos({ left, top: up ? r.top - 6 : r.bottom + 6, up });
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="lyr-help-btn no-print"
        aria-label={label ? `Ayuda: ${label}` : 'Ayuda'}
        aria-expanded={pos != null}
        title="Ayuda"
        onClick={toggle}
      >
        ?
      </button>
      {pos && (
        <div
          ref={box}
          role="note"
          className="infotip"
          style={{ left: pos.left, top: pos.top, width: W, transform: pos.up ? 'translateY(-100%)' : undefined }}
        >
          {AYUDA[k]}
        </div>
      )}
    </>
  );
}
