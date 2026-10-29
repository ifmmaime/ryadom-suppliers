import {
  ArrowUpRightIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  MapPinIcon,
  InfoIcon,
} from '@phosphor-icons/react';
import type { Supplier } from '../types';
import { CATEGORIES } from '../data/suppliers';
import { getSupplierSummary } from '../lib/catalog';
import { MAX_NOTE_LENGTH } from '../lib/limits';
import { Modal } from './Modal';

interface SupplierDetailsProps {
  supplier: Supplier;
  note: string;
  onNote: (note: string) => void;
  onClose: () => void;
}

export function SupplierDetails({ supplier, note, onNote, onClose }: SupplierDetailsProps) {
  const facts = [
    [
      'Категории',
      CATEGORIES.filter(
        (category) => category.id !== 'all' && supplier.categoryIds.includes(category.id),
      )
        .map((category) => category.label)
        .join(', '),
    ],
    ['Регион работы', supplier.regions.join(', ')],
    ['Минимальный заказ', supplier.minOrder ?? 'Уточнить у поставщика'],
    ['Ориентировочная цена', supplier.price ?? 'По запросу'],
    ['Доставка', supplier.delivery ?? 'Уточнить у поставщика'],
    [
      'Документы и сертификаты',
      supplier.documents ?? 'Не подтверждены в источнике. Запросите перед заказом.',
    ],
  ];
  return (
    <Modal title={supplier.name} onClose={onClose}>
      <p className="detail-location">
        <MapPinIcon size={17} />
        {supplier.city}
      </p>
      <p className="detail-description">{supplier.description}</p>
      <div className="decision-note">
        <InfoIcon size={21} />
        <p>{getSupplierSummary(supplier)}</p>
      </div>
      <dl className="detail-facts">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <section className="detail-section">
        <h3>Связаться с поставщиком</h3>
        <div className="contact-actions">
          <a
            className="button primary"
            href={supplier.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Официальный сайт
            <ArrowUpRightIcon size={18} />
          </a>
          {supplier.phone && (
            <a className="button secondary" href={`tel:${supplier.phone.replace(/[^+\d]/g, '')}`}>
              <PhoneIcon size={18} />
              {supplier.phone}
            </a>
          )}
          {supplier.email && (
            <a className="button secondary" href={`mailto:${supplier.email}`}>
              <EnvelopeSimpleIcon size={18} />
              Написать письмо
            </a>
          )}
        </div>
        <p className="caption">
          Перед заказом подтвердите цену, доступность, документы и доставку.
        </p>
      </section>
      <section className="detail-section">
        <label className="note-label" htmlFor="supplier-note">
          Ваши заметки
        </label>
        <textarea
          id="supplier-note"
          placeholder="Например: запросить прайс и образцы, уточнить доставку"
          maxLength={MAX_NOTE_LENGTH}
          value={note}
          onChange={(event) => onNote(event.target.value)}
          rows={3}
        />
        <div className="note-caption">
          <span>Сохраняются в этом браузере</span>
          <span>
            {note.length}/{MAX_NOTE_LENGTH}
          </span>
        </div>
      </section>
      <div className="provenance">
        <a href={supplier.sourceUrl} target="_blank" rel="noopener noreferrer">
          Открыть источник
          <ArrowUpRightIcon size={14} />
        </a>
        <span>
          Проверено {new Date(`${supplier.verifiedAt}T12:00:00`).toLocaleDateString('ru-RU')}
        </span>
        <p>{supplier.sourceNote}</p>
      </div>
    </Modal>
  );
}
