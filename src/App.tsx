import { useRef, useState, type FormEvent, type JSX } from 'react';
import {
  ArrowRightIcon,
  BookmarkSimpleIcon,
  CheckIcon,
  DatabaseIcon,
  HouseIcon,
  InfoIcon,
  XIcon,
} from '@phosphor-icons/react';
import { CatalogSidebar } from './components/CatalogSidebar';
import { CATEGORIES, REGIONS, SUPPLIERS } from './data/suppliers';
import { Comparison } from './components/Comparison';
import { ComparisonTray } from './components/ComparisonTray';
import { HelpDialog } from './components/HelpDialog';
import { SearchPanel } from './components/SearchPanel';
import { SupplierCard } from './components/SupplierCard';
import { SupplierDetails } from './components/SupplierDetails';
import { filterSuppliers } from './lib/catalog';
import { loadCatalogState, saveCatalogState } from './lib/storage';
import type { CatalogFilters, Supplier, UserCatalogState } from './types';

const INITIAL_FILTERS: CatalogFilters = {
  query: '',
  category: 'all',
  region: 'Все регионы',
  favoritesOnly: false,
  sort: 'name',
};

export default function App(): JSX.Element {
  const [filters, setFilters] = useState<CatalogFilters>(INITIAL_FILTERS);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('Все регионы');
  const [saved, setSaved] = useState<UserCatalogState>(loadCatalogState);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [details, setDetails] = useState<Supplier | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const resultsRef = useRef<HTMLHeadingElement>(null);

  function updateSaved(update: (current: UserCatalogState) => UserCatalogState) {
    const next = update(saved);
    setSaved(next);
    setStorageAvailable(saveCatalogState(next));
  }

  const suppliers = filterSuppliers(SUPPLIERS, filters, saved.favoriteIds);
  const selected = saved.comparisonIds.flatMap(
    (id) => SUPPLIERS.find((supplier) => supplier.id === id) ?? [],
  );
  const filtersActive = Boolean(
    filters.query || filters.category !== 'all' || filters.region !== 'Все регионы',
  );

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, query: query.trim(), region }));
    resultsRef.current?.focus();
  }

  function toggleFavorite(supplier: Supplier) {
    const exists = saved.favoriteIds.includes(supplier.id);
    updateSaved((current) => ({
      ...current,
      favoriteIds: exists
        ? current.favoriteIds.filter((id) => id !== supplier.id)
        : [...current.favoriteIds, supplier.id],
    }));
    setAnnouncement(
      `${supplier.name}: ${exists ? 'удалён из избранного' : 'сохранён в избранное'}`,
    );
  }

  function toggleCompare(id: string) {
    if (showComparison && saved.comparisonIds.length === 1 && saved.comparisonIds.includes(id)) {
      setShowComparison(false);
      resultsRef.current?.focus();
    }
    updateSaved((current) => {
      const exists = current.comparisonIds.includes(id);
      if (!exists && current.comparisonIds.length >= 3) return current;
      return {
        ...current,
        comparisonIds: exists
          ? current.comparisonIds.filter((value) => value !== id)
          : [...current.comparisonIds, id],
      };
    });
  }

  function resetFilters() {
    setQuery('');
    setRegion('Все регионы');
    setFilters((current) => ({ ...INITIAL_FILTERS, favoritesOnly: current.favoritesOnly }));
  }

  function openCatalog(favoritesOnly: boolean) {
    setQuery('');
    setRegion('Все регионы');
    setFilters({ ...INITIAL_FILTERS, favoritesOnly });
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <CatalogSidebar
        favoritesOnly={filters.favoritesOnly}
        favoriteCount={saved.favoriteIds.length}
        onOpenCatalog={openCatalog}
        onOpenHelp={() => setShowHelp(true)}
      />

      <main id="main" className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <HouseIcon size={16} />
            <span aria-hidden="true">›</span>
            {filters.favoritesOnly ? 'Избранные поставщики' : 'Каталог поставщиков'}
          </div>
          <span className="data-origin">
            <DatabaseIcon size={15} />
            Данные из открытых источников
          </span>
        </header>
        <section className="hero" aria-labelledby="page-title">
          <img className="hero-image" src="/images/hero.webp" alt="" aria-hidden="true" />
          <div className="hero-copy">
            <h1 id="page-title">
              Хорошие продукты
              <br />
              начинаются с поставщика.
            </h1>
            <p>
              Найдите партнёров для вашего бизнеса.
              <br className="mobile-break" /> Сравните условия и свяжитесь напрямую.
            </p>
          </div>
        </section>

        <SearchPanel
          query={query}
          region={region}
          regions={REGIONS}
          onQueryChange={setQuery}
          onRegionChange={setRegion}
          onSubmit={search}
        />

        <section className="categories" aria-label="Категории товаров">
          {CATEGORIES.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`category ${filters.category === category.id ? 'selected' : ''}`}
              aria-pressed={filters.category === category.id}
              onClick={() => setFilters((current) => ({ ...current, category: category.id }))}
            >
              <img src={category.image} alt="" loading="eager" />
              <span className="category-shade" />
              <span className="category-label">{category.label}</span>
              {filters.category === category.id && (
                <span className="category-check">
                  <CheckIcon size={12} weight="bold" />
                </span>
              )}
            </button>
          ))}
        </section>

        <section className="results" aria-labelledby="results-title">
          <div className="results-toolbar">
            <div className="results-title">
              <h2 id="results-title" ref={resultsRef} tabIndex={-1}>
                {filters.favoritesOnly ? 'Избранное' : 'Поставщики'}
              </h2>
              <span
                className="result-count"
                aria-label={`Найдено поставщиков: ${suppliers.length}`}
              >
                {suppliers.length}
              </span>
            </div>
            <label className="sort-label">
              <span className="sr-only">Сортировка</span>
              <select
                value={filters.sort}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    sort: event.target.value as CatalogFilters['sort'],
                  }))
                }
              >
                <option value="name">По названию</option>
                <option value="completeness">По полноте информации</option>
              </select>
            </label>
          </div>
          <div className="results-description">
            <p>
              {filters.favoritesOnly
                ? 'Ваш список для следующего шага.'
                : 'Выберите партнёров и сравните то, что важно для вас.'}
            </p>
            {filtersActive && (
              <button className="text-button" onClick={resetFilters}>
                <XIcon size={14} />
                Сбросить фильтры
              </button>
            )}
          </div>
          {filters.sort === 'completeness' && (
            <p className="sort-explanation">
              Выше поставщики с большим числом опубликованных условий и контактов. Это полнота
              информации, а не рейтинг качества.
            </p>
          )}
          {suppliers.length > 0 ? (
            <div className="supplier-grid">
              {suppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  favorite={saved.favoriteIds.includes(supplier.id)}
                  selected={saved.comparisonIds.includes(supplier.id)}
                  comparisonFull={selected.length >= 3}
                  onFavorite={() => toggleFavorite(supplier)}
                  onCompare={() => toggleCompare(supplier.id)}
                  onDetails={() => setDetails(supplier)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>
                <BookmarkSimpleIcon size={32} />
              </span>
              <h3>
                {filters.favoritesOnly && !filtersActive
                  ? 'Сохраните будущих партнёров'
                  : 'Поставщики не найдены'}
              </h3>
              <p>
                {filters.favoritesOnly && !filtersActive
                  ? 'Нажмите на закладку в карточке. Здесь будет ваш список для связи.'
                  : 'Попробуйте другую категорию или расширьте регион поиска.'}
              </p>
              <button
                className="button primary"
                onClick={filtersActive ? resetFilters : () => openCatalog(false)}
              >
                {filtersActive ? 'Сбросить фильтры' : 'Открыть каталог'}
                <ArrowRightIcon size={17} />
              </button>
            </div>
          )}
        </section>
        <footer className="page-footer">
          <InfoIcon size={15} />
          <p>
            Условия могут меняться. Подтвердите их у поставщика.
            <br />
            <span>Небольшой каталог из официальных источников · проверено 29 октября 2026</span>
          </p>
        </footer>
        {!storageAvailable && (
          <div role="status" className="storage-warning">
            Браузер не разрешил сохранение. Избранное и заметки доступны до закрытия страницы.
          </div>
        )}
      </main>

      {selected.length > 0 && (
        <ComparisonTray
          suppliers={selected}
          onRemove={toggleCompare}
          onOpen={() => setShowComparison(true)}
          onClear={() => updateSaved((current) => ({ ...current, comparisonIds: [] }))}
        />
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
      <div className="sr-only" aria-live="polite">
        Найдено поставщиков: {suppliers.length}
      </div>

      {details && (
        <SupplierDetails
          supplier={details}
          note={saved.notes[details.id] ?? ''}
          onNote={(note) =>
            updateSaved((current) => ({
              ...current,
              notes: { ...current.notes, [details.id]: note },
            }))
          }
          onClose={() => setDetails(null)}
        />
      )}
      {showComparison && selected.length > 0 && (
        <Comparison
          suppliers={selected}
          onRemove={toggleCompare}
          onClose={() => setShowComparison(false)}
        />
      )}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
}
