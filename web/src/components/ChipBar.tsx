import { useEffect, useMemo, useRef, useState } from 'react';
import { useFilterStore, DEFAULT_FILTERS } from '../store/useFilterStore';
import { usePortalStore, type Comuna } from '../store/usePortalStore';
import { activeChips } from '../lib/chips';
import { searchComunas } from '../lib/comunaSearch';

export default function ChipBar() {
  const f = useFilterStore();
  const chips = activeChips(f);
  const activeComuna = usePortalStore((s) => s.activeComuna);
  const setComuna = usePortalStore((s) => s.setComuna);

  // Catálogo de comunas para el autocompletado (nombre + centroide + región).
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}data/comunas_centroides.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Comuna[]) => alive && setComunas(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Cierra el desplegable al hacer clic fuera del buscador.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Sugerencias con normalización de acentos y coincidencia cercana (typos).
  const suggestions = useMemo(() => searchComunas(comunas, q, 8), [q, comunas]);

  const pick = (c: Comuna) => {
    setComuna(c);
    setQ(c.nombre);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') return setOpen(false);
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(suggestions[hi] ?? suggestions[0]!);
    }
  };

  const clearComuna = () => {
    setComuna(null);
    setQ('');
  };

  const remove = (id: string) => {
    if (id.startsWith('sp:')) f.toggleSpecies(id.slice(3));
    else if (id === 'query') f.update('query', '');
    else if (id === 'place') f.update('place', '');
    else if (id === 'group') f.update('group', '');
    else if (id === 'region') f.update('region', '');
    else if (id === 'order') f.update('order', '');
    else if (id === 'family') f.update('family', '');
    else if (id === 'notable') f.update('onlyNotable', false);
    else if (id === 'rev') f.update('onlyReviewed', false);
    else if (id === 'exo') f.update('includeExotic', true);
    else if (id === 'min') f.update('minCount', 1);
    else if (id === 'date') {
      f.update('from', DEFAULT_FILTERS.from);
      f.update('to', DEFAULT_FILTERS.to);
    }
  };

  return (
    <div className="plate" id="chipbar">
      <div
        className="search-wrap"
        ref={boxRef}
        style={{ flex: '1 1 200px', minWidth: 0, border: 0, padding: 0, position: 'relative' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.7" style={{ flex: 'none' }}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setHi(0);
          }}
          onFocus={() => q && setOpen(true)}
          onKeyDown={onKey}
          placeholder="Buscar comuna…"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="comuna-ac"
        />
        {open && suggestions.length > 0 && (
          <ul className="comuna-ac" id="comuna-ac" role="listbox">
            {suggestions.map((c, i) => (
              <li
                key={c.cut}
                role="option"
                aria-selected={i === hi}
                className={i === hi ? 'on' : ''}
                onMouseEnter={() => setHi(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(c);
                }}
              >
                <b>{c.nombre}</b>
                {c.region && <small>{c.region}</small>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {(chips.length > 0 || activeComuna) && <div className="cdiv" />}
      <div id="chips">
        {activeComuna && (
          <span className="chip">
            <span>
              Comuna · <b>{activeComuna.nombre}</b>
            </span>
            <button aria-label="Quitar comuna" onClick={clearComuna}>
              ×
            </button>
          </span>
        )}
        {chips.map((c) => (
          <span className="chip" key={c.id}>
            <span>
              {c.k} · <b>{c.v}</b>
            </span>
            <button aria-label="Quitar filtro" onClick={() => remove(c.id)}>
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
