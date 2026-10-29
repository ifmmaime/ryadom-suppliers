import {
  ArrowUpRightIcon,
  ArrowRightIcon,
  BookmarkSimpleIcon,
  LinkIcon,
  MapPinIcon,
  PackageIcon,
  TruckIcon,
} from '@phosphor-icons/react';
import type { Supplier } from '../types';

interface SupplierCardProps {
  supplier: Supplier;
  favorite: boolean;
  selected: boolean;
  comparisonFull: boolean;
  onFavorite: () => void;
  onCompare: () => void;
  onDetails: () => void;
}

export function SupplierCard({
  supplier,
  favorite,
  selected,
  comparisonFull,
  onFavorite,
  onCompare,
  onDetails,
}: SupplierCardProps) {
  const titleId = `supplier-${supplier.id}`;
  return (
    <article className={`supplier-card ${selected ? 'is-selected' : ''}`} aria-labelledby={titleId}>
      <div className="supplier-heading">
        <div className={`supplier-monogram tone-${supplier.categoryIds[0]}`} aria-hidden="true">
          {supplier.initials}
        </div>
        <div className="supplier-identity">
          <h3 id={titleId}>{supplier.name}</h3>
          <p>
            <MapPinIcon size={14} />
            {supplier.city}
          </p>
        </div>
        <button
          className={`icon-button bookmark ${favorite ? 'is-active' : ''}`}
          type="button"
          onClick={onFavorite}
          aria-label={
            favorite ? `Удалить ${supplier.name} из избранного` : `Сохранить ${supplier.name}`
          }
          aria-pressed={favorite}
        >
          <BookmarkSimpleIcon size={21} weight={favorite ? 'fill' : 'regular'} />
        </button>
      </div>
      <p className="supplier-description">{supplier.description}</p>
      <dl className="card-facts">
        <div>
          <PackageIcon size={20} />
          <div>
            <dt>Минимальный заказ</dt>
            <dd>{supplier.minOrder ?? 'По запросу'}</dd>
          </div>
        </div>
        <div>
          <TruckIcon size={21} />
          <div>
            <dt>Доставка</dt>
            <dd>{supplier.delivery ?? 'Уточнить у поставщика'}</dd>
          </div>
        </div>
      </dl>
      <footer className="card-footer">
        <a
          className="source-link"
          href={supplier.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Источник: ${supplier.name}`}
        >
          <LinkIcon size={15} />
          <span>{new URL(supplier.website).hostname.replace(/^www\./, '')}</span>
          <ArrowUpRightIcon size={12} />
        </a>
        <button type="button" className="text-button" onClick={onDetails}>
          Подробнее
          <ArrowRightIcon size={15} />
        </button>
        <label
          className={`compare-label ${comparisonFull && !selected ? 'is-disabled' : ''}`}
          title={comparisonFull && !selected ? 'В сравнении уже три поставщика' : undefined}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onCompare}
            disabled={comparisonFull && !selected}
            aria-label={`Сравнить ${supplier.name}`}
          />
          Сравнить
        </label>
      </footer>
    </article>
  );
}
