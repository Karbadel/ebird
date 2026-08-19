import { useFilterStore, DEFAULT_FILTERS } from '../store/useFilterStore';
import { activeChips } from '../lib/chips';

export default function ChipBar() {
  const f = useFilterStore();
  const chips = activeChips(f);

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
      <div className="search-wrap" style={{ flex: '1 1 180px', minWidth: 0, border: 0, padding: 0 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="1.7" style={{ flex: 'none' }}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={f.place}
          onChange={(e) => f.update('place', e.target.value)}
          placeholder="Buscar región o localidad…"
          autoComplete="off"
        />
      </div>
      {chips.length > 0 && <div className="cdiv" />}
      <div id="chips">
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
