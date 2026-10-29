import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

beforeEach(() => {
  localStorage.clear();
});

function getSupplierCard(name: string): HTMLElement {
  return screen.getByRole('article', { name });
}

describe('supplier discovery flow', () => {
  it('filters suppliers by search and region', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Что вы ищете?' }), 'молочная продукция');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Город или регион' }),
      'Санкт-Петербург',
    );
    await user.click(screen.getByRole('button', { name: 'Найти поставщиков' }));

    expect(getSupplierCard('ЭкоНива Professional Line')).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Фуд Стар' })).not.toBeInTheDocument();
  });

  it('uses category shortcuts to narrow the catalog', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Упаковка' }));

    expect(getSupplierCard('DANAFLEX')).toBeInTheDocument();
    expect(getSupplierCard('Готэк')).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'Фуд Стар' })).not.toBeInTheDocument();
  });

  it('shows an actionable empty state and resets all filters', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByRole('searchbox', { name: 'Что вы ищете?' }),
      'марсианские водоросли',
    );
    await user.click(screen.getByRole('button', { name: 'Найти поставщиков' }));

    expect(
      screen.getByText(/ничего не нашли|поставщики не найдены|нет подходящих поставщиков/i),
    ).toBeInTheDocument();
    const resetButtons = screen.getAllByRole('button', { name: /сбросить фильтры/i });
    await user.click(resetButtons.at(-1)!);

    expect(screen.getByRole('searchbox', { name: 'Что вы ищете?' })).toHaveValue('');
    expect(getSupplierCard('Фуд Стар')).toBeInTheDocument();
  });

  it('persists favorites and restores the favorites view after remount', async () => {
    const user = userEvent.setup();
    const view = render(<App />);

    await user.click(screen.getByRole('button', { name: 'Сохранить Фуд Стар' }));
    expect(screen.getByRole('button', { name: /Избранное.*1/i })).toBeInTheDocument();

    view.unmount();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Избранное.*1/i }));

    expect(getSupplierCard('Фуд Стар')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Удалить Фуд Стар из избранного' })).toBePressed();
  });

  it('limits comparison to three suppliers and frees a slot after removal', async () => {
    const user = userEvent.setup();
    render(<App />);
    const selectedNames = ['Фуд Стар', 'Evro Fresh', 'ЭкоНива Professional Line'];

    for (const name of selectedNames) {
      await user.click(screen.getByRole('checkbox', { name: `Сравнить ${name}` }));
    }

    const fourthSupplier = screen.getByRole('checkbox', { name: 'Сравнить Мираторг HoReCa' });
    expect(fourthSupplier).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Сравнить (3)' }));

    const dialog = screen.getByRole('dialog', { name: 'Сравнение поставщиков' });
    expect(within(dialog).getByRole('columnheader', { name: /Фуд Стар/ })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Убрать Фуд Стар из сравнения' }));
    expect(
      within(dialog).queryByRole('columnheader', { name: /Фуд Стар/ }),
    ).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Закрыть' }));
    expect(fourthSupplier).toBeEnabled();
  });

  it('closes an emptied comparison and does not reopen it for a new selection', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('checkbox', { name: 'Сравнить Фуд Стар' }));
    await user.click(screen.getByRole('checkbox', { name: 'Сравнить Evro Fresh' }));
    await user.click(screen.getByRole('button', { name: 'Сравнить (2)' }));

    let dialog = screen.getByRole('dialog', { name: 'Сравнение поставщиков' });
    await user.click(within(dialog).getByRole('button', { name: 'Убрать Фуд Стар из сравнения' }));
    await user.click(
      within(dialog).getByRole('button', { name: 'Убрать Evro Fresh из сравнения' }),
    );
    expect(screen.queryByRole('dialog', { name: 'Сравнение поставщиков' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Сравнить Мираторг HoReCa' }));
    expect(screen.queryByRole('dialog', { name: 'Сравнение поставщиков' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Сравнить ЭкоНива Professional Line' }));
    expect(screen.queryByRole('dialog', { name: 'Сравнение поставщиков' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Сравнить (2)' }));
    dialog = screen.getByRole('dialog', { name: 'Сравнение поставщиков' });
    expect(
      within(dialog).getByRole('columnheader', { name: /Мираторг HoReCa/ }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('columnheader', { name: /ЭкоНива Professional Line/ }),
    ).toBeInTheDocument();
  });

  it('keeps a favorite in the UI and warns when browser storage rejects the write', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage is unavailable');
    });

    try {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByRole('button', { name: 'Сохранить Фуд Стар' }));

      expect(screen.getByRole('button', { name: 'Удалить Фуд Стар из избранного' })).toBePressed();
      expect(screen.getByText(/Браузер не разрешил сохранение/)).toHaveAttribute('role', 'status');
    } finally {
      setItemSpy.mockRestore();
    }
  });

  it('saves a supplier note and restores it when details are opened again', async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    const note = 'Запросить прайс, сертификаты и образцы упаковки';

    await user.click(
      within(getSupplierCard('Фуд Стар')).getByRole('button', { name: 'Подробнее' }),
    );
    let dialog = screen.getByRole('dialog', { name: 'Фуд Стар' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Ваши заметки' }), note);
    await user.click(within(dialog).getByRole('button', { name: 'Закрыть' }));

    view.unmount();
    render(<App />);
    await user.click(
      within(getSupplierCard('Фуд Стар')).getByRole('button', { name: 'Подробнее' }),
    );
    dialog = screen.getByRole('dialog', { name: 'Фуд Стар' });
    expect(within(dialog).getByRole('textbox', { name: 'Ваши заметки' })).toHaveValue(note);
  });

  it('explains the data and decision model in the product', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Как это работает' }));

    const dialog = screen.getByRole('dialog', { name: 'От поиска к первому разговору' });
    expect(within(dialog).getByText(/источники указаны в каждой карточке/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/условия подтверждает поставщик/i)).toBeInTheDocument();
  });
});
