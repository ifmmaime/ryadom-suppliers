import { ArrowRightIcon, ScalesIcon, XIcon } from '@phosphor-icons/react';
import type { JSX } from 'react';
import type { Supplier } from '../types';

interface ComparisonTrayProps {
  suppliers: Supplier[];
  onRemove: (id: string) => void;
  onOpen: () => void;
  onClear: () => void;
}

export function ComparisonTray({
  suppliers,
  onRemove,
  onOpen,
  onClear,
}: ComparisonTrayProps): JSX.Element {
  return (
    <aside className="compare-tray" aria-label="Выбранные для сравнения">
      <div className="tray-heading">
        <ScalesIcon size={23} />
        <div>
          <strong>Сравните условия</strong>
          <span>{suppliers.length} из 3 поставщиков</span>
        </div>
      </div>
      <div className="tray-items">
        {suppliers.map((supplier) => (
          <span key={supplier.id}>
            {supplier.name}
            <button
              className="icon-button"
              aria-label={`Убрать ${supplier.name} из сравнения`}
              onClick={() => onRemove(supplier.id)}
            >
              <XIcon size={14} />
            </button>
          </span>
        ))}
      </div>
      <button className="button primary" onClick={onOpen} disabled={suppliers.length < 2}>
        Сравнить ({suppliers.length})
        <ArrowRightIcon size={17} />
      </button>
      <button className="icon-button tray-clear" onClick={onClear} aria-label="Очистить сравнение">
        <XIcon size={20} />
      </button>
    </aside>
  );
}
