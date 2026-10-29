import { HeartIcon, InfoIcon, LeafIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import type { JSX } from 'react';

interface CatalogSidebarProps {
  favoritesOnly: boolean;
  favoriteCount: number;
  onOpenCatalog: (favoritesOnly: boolean) => void;
  onOpenHelp: () => void;
}

export function CatalogSidebar({
  favoritesOnly,
  favoriteCount,
  onOpenCatalog,
  onOpenHelp,
}: CatalogSidebarProps): JSX.Element {
  return (
    <aside className="sidebar">
      <a href="/" className="brand" aria-label="Рядом — каталог поставщиков">
        <span className="brand-icon">
          <LeafIcon size={28} weight="fill" />
        </span>
        Рядом<span className="brand-dot">.</span>
      </a>
      <nav className="main-nav" aria-label="Основная навигация">
        <button
          className={`nav-item ${!favoritesOnly ? 'active' : ''}`}
          onClick={() => onOpenCatalog(false)}
          aria-current={!favoritesOnly ? 'page' : undefined}
          aria-label="Найти поставщика"
        >
          <MagnifyingGlassIcon size={22} />
          <span>Найти поставщика</span>
        </button>
        <button
          className={`nav-item ${favoritesOnly ? 'active' : ''}`}
          onClick={() => onOpenCatalog(true)}
          aria-current={favoritesOnly ? 'page' : undefined}
          aria-label={`Избранное${favoriteCount > 0 ? ` (${favoriteCount})` : ''}`}
        >
          <HeartIcon size={22} />
          <span>Избранное</span>
          {favoriteCount > 0 && <span className="nav-count">{favoriteCount}</span>}
        </button>
        <button className="nav-item" onClick={onOpenHelp} aria-label="Как это работает">
          <InfoIcon size={22} />
          <span>Как это работает</span>
        </button>
      </nav>
      <div className="sidebar-bottom">
        <span className="sidebar-leaf">
          <LeafIcon size={25} />
        </span>
        <p>
          Хорошие партнёры.
          <br />
          Ближе, чем кажется.
        </p>
        <div>
          <InfoIcon size={14} />
          Прототип · открытые источники
        </div>
      </div>
    </aside>
  );
}
