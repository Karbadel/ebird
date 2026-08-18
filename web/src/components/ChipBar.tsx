import { useFilterStore, DEFAULT_FILTERS } from '../store/useFilterStore';
import { activeChips } from '../lib/chips';

export default function ChipBar() {
  const f = useFilterStore();
  const chips = activeChips(f);

  if (chips.length === 0) return null;

  const remove = (id: string) => {
    if (id.startsWith('sp:')) f.toggleSpecies(id.slice(3));
    else if (id === 'query') f.update('query', '');
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
      <span className="lbl">Filtros activos</span>
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
      <button className="btn btn-ghost" id="clear" style={{ height: 24, fontSize: 12 }} onClick={f.reset}>
        Limpiar
      </button>
    </div>
  );
}
