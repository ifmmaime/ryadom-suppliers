import { ArrowRightIcon, MagnifyingGlassIcon, MapPinIcon } from '@phosphor-icons/react';
import type { FormEvent, JSX } from 'react';

interface SearchPanelProps {
  query: string;
  region: string;
  regions: readonly string[];
  onQueryChange: (query: string) => void;
  onRegionChange: (region: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function SearchPanel({
  query,
  region,
  regions,
  onQueryChange,
  onRegionChange,
  onSubmit,
}: SearchPanelProps): JSX.Element {
  return (
    <form className="search-form" onSubmit={onSubmit} role="search" aria-label="Поиск поставщиков">
      <div className="search-field">
        <MagnifyingGlassIcon size={23} />
        <div>
          <label htmlFor="query">Что вы ищете?</label>
          <input
            id="query"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Продукт, категория или поставщик"
            maxLength={120}
          />
        </div>
      </div>
      <div className="search-field region-field">
        <MapPinIcon size={23} />
        <div>
          <label htmlFor="region">Город или регион</label>
          <select
            id="region"
            value={region}
            onChange={(event) => onRegionChange(event.target.value)}
          >
            {regions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      <button className="button primary search-button" type="submit">
        Найти поставщиков
        <ArrowRightIcon size={18} />
      </button>
    </form>
  );
}
