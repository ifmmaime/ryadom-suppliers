import { ArrowUpRightIcon, InfoIcon, XIcon } from '@phosphor-icons/react';
import type { Supplier } from '../types';
import { getSupplierSummary } from '../lib/catalog';
import { Modal } from './Modal';

interface ComparisonProps {
  suppliers: Supplier[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function Comparison({ suppliers, onRemove, onClose }: ComparisonProps) {
  const rows: { label: string; value: (supplier: Supplier) => string }[] = [
    { label: 'Регион работы', value: (s) => s.regions.join(', ') },
    { label: 'Минимальный заказ', value: (s) => s.minOrder ?? 'По запросу' },
    { label: 'Цена', value: (s) => s.price ?? 'По запросу' },
    { label: 'Доставка', value: (s) => s.delivery ?? 'Уточнить у поставщика' },
    { label: 'Документы', value: (s) => s.documents ?? 'Запросите перед заказом' },
    { label: 'На что обратить внимание', value: getSupplierSummary },
  ];
  return (
    <Modal title="Сравнение поставщиков" onClose={onClose} wide>
      <p className="comparison-intro">
        <InfoIcon size={20} />
        Сопоставьте условия. Неизвестные данные — повод задать вопрос, а не показатель качества.
      </p>
      <p className="comparison-scroll-hint">
        Проведите по таблице влево, чтобы увидеть остальных поставщиков →
      </p>
      <div
        className="comparison-scroll"
        tabIndex={0}
        role="region"
        aria-label="Таблица сравнения поставщиков"
      >
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">Условия</th>
              {suppliers.map((s) => (
                <th scope="col" key={s.id}>
                  <div className="comparison-title">
                    <span>{s.name}</span>
                    <button
                      className="icon-button"
                      onClick={() => onRemove(s.id)}
                      aria-label={`Убрать ${s.name} из сравнения`}
                    >
                      <XIcon size={17} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {suppliers.map((s) => (
                  <td key={s.id}>{row.value(s)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">Следующий шаг</th>
              {suppliers.map((s) => (
                <td key={s.id}>
                  <a
                    href={s.website}
                    className="text-button"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Открыть сайт
                    <ArrowUpRightIcon size={16} />
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="caption">
        Данные собраны из официальных открытых источников. Условия могут меняться.
      </p>
    </Modal>
  );
}
