import { InfoIcon } from '@phosphor-icons/react';
import type { JSX } from 'react';
import { Modal } from './Modal';

interface HelpDialogProps {
  onClose: () => void;
}

export function HelpDialog({ onClose }: HelpDialogProps): JSX.Element {
  return (
    <Modal title="От поиска к первому разговору" onClose={onClose}>
      <div className="help-steps">
        <section>
          <span>1</span>
          <div>
            <h3>Найдите свою категорию</h3>
            <p>
              Выберите товар и регион. Поиск учитывает название, ассортимент и специализацию
              поставщика.
            </p>
          </div>
        </section>
        <section>
          <span>2</span>
          <div>
            <h3>Сравните условия</h3>
            <p>
              Добавьте до трёх компаний в сравнение. Посмотрите доставку, минимальный заказ и
              документы рядом.
            </p>
          </div>
        </section>
        <section>
          <span>3</span>
          <div>
            <h3>Свяжитесь напрямую</h3>
            <p>
              Откройте официальный сайт, позвоните или напишите. Сохраните заметки, чтобы вернуться
              к разговору.
            </p>
          </div>
        </section>
      </div>
      <div className="decision-note">
        <InfoIcon size={22} />
        <p>
          Это прототип с небольшим каталогом. Источники указаны в каждой карточке. Данные собираются
          вручную, а условия подтверждает поставщик. Избранное и заметки хранятся только в вашем
          браузере.
        </p>
      </div>
    </Modal>
  );
}
