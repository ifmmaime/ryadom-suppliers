import { describe, expect, it } from 'vitest';
import { REGIONS, SUPPLIERS } from '../data/suppliers';
import type { CatalogFilters, Supplier } from '../types';
import { filterSuppliers, getCompleteness, getSupplierSummary, normalizeSearch } from './catalog';
import {
  createEmptyCatalogState,
  loadCatalogState,
  saveCatalogState,
  STORAGE_KEY,
  type StorageLike,
} from './storage';

const defaultFilters: CatalogFilters = {
  query: '',
  category: 'all',
  region: 'Все регионы',
  favoritesOnly: false,
  sort: 'name',
};

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('catalog', () => {
  it('нормализует регистр, ё и лишние разделители', () => {
    expect(normalizeSearch('  Всё-для   КУХНИ ')).toBe('все для кухни');
  });

  it('фильтрует по категории и находит текст по нескольким полям', () => {
    const result = filterSuppliers(
      SUPPLIERS,
      {
        ...defaultFilters,
        category: 'dairy',
        query: 'санкт петербург',
      },
      [],
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((supplier) => supplier.categoryIds.includes('dairy'))).toBe(true);
  });

  it('находит категорию по русскому названию, даже если описание его не повторяет', () => {
    const result = filterSuppliers(
      SUPPLIERS,
      {
        ...defaultFilters,
        query: 'упаковка',
      },
      [],
    );

    expect(result.map((supplier) => supplier.id)).toEqual(
      expect.arrayContaining(['danaflex', 'gotek']),
    );
  });

  it('считает поставщика со всероссийской географией доступным в городе', () => {
    const result = filterSuppliers(
      SUPPLIERS,
      {
        ...defaultFilters,
        region: 'Санкт-Петербург',
      },
      [],
    );

    expect(result.some((supplier) => supplier.id === 'miratorg-horeca')).toBe(true);
    expect(result.some((supplier) => supplier.id === 'food-star')).toBe(false);
  });

  it('включает в фильтр каждый конкретный регион из каталога', () => {
    const concreteSupplierRegions = [
      ...new Set(
        SUPPLIERS.flatMap((supplier) => supplier.regions).filter(
          (region) => !['Вся Россия', 'Регионы России'].includes(region),
        ),
      ),
    ];

    expect(REGIONS[0]).toBe('Все регионы');
    expect(REGIONS.at(-1)).toBe('Вся Россия');
    expect(REGIONS).toContain('Регионы России');
    expect(REGIONS).toEqual(expect.arrayContaining(concreteSupplierRegions));
  });

  it('фильтр Казани возвращает местного и подтверждённых всероссийских поставщиков', () => {
    const result = filterSuppliers(
      SUPPLIERS,
      {
        ...defaultFilters,
        region: 'Казань',
      },
      [],
    );

    expect(result.some((supplier) => supplier.id === 'danaflex')).toBe(true);
    expect(result.some((supplier) => supplier.regions.includes('Вся Россия'))).toBe(true);
    expect(
      result.every(
        (supplier) =>
          supplier.regions.includes('Казань') || supplier.regions.includes('Вся Россия'),
      ),
    ).toBe(true);
  });

  it('позволяет найти поставщиков с широкой географией без обещания доставки в каждый город', () => {
    const result = filterSuppliers(SUPPLIERS, { ...defaultFilters, region: 'Регионы России' }, []);

    expect(result.map((supplier) => supplier.id)).toEqual(
      expect.arrayContaining(['ekoniva', 'metro-business', 'rusagro', 'arosa']),
    );
    expect(result.some((supplier) => supplier.id === 'food-star')).toBe(false);
  });

  it('показывает только избранное и не меняет исходный массив', () => {
    const input = [...SUPPLIERS];
    const result = filterSuppliers(
      input,
      {
        ...defaultFilters,
        favoritesOnly: true,
      },
      ['food-star', 'gotek'],
    );

    expect(result.map((supplier) => supplier.id).sort()).toEqual(['food-star', 'gotek']);
    expect(input).toEqual(SUPPLIERS);
  });

  it('сортирует по полноте с именем как стабильным вторичным критерием', () => {
    const result = filterSuppliers(
      SUPPLIERS,
      {
        ...defaultFilters,
        sort: 'completeness',
      },
      [],
    );

    for (let index = 1; index < result.length; index += 1) {
      const previous = result[index - 1];
      const current = result[index];
      expect(getCompleteness(previous)).toBeGreaterThanOrEqual(getCompleteness(current));
      if (getCompleteness(previous) === getCompleteness(current)) {
        expect(previous.name.localeCompare(current.name, 'ru-RU')).toBeLessThanOrEqual(0);
      }
    }

    const tiedSuppliers = ['Ясень', 'Берег', 'Альфа'].map((name, index) => ({
      ...SUPPLIERS[0],
      id: `tie-${index}`,
      name,
    }));
    expect(
      filterSuppliers(tiedSuppliers, { ...defaultFilters, sort: 'completeness' }, []).map(
        (supplier) => supplier.name,
      ),
    ).toEqual(['Альфа', 'Берег', 'Ясень']);
  });

  it('содержит уникальные записи с корректными ссылками, категориями и датами', () => {
    expect(new Set(SUPPLIERS.map((supplier) => supplier.id)).size).toBe(SUPPLIERS.length);
    for (const supplier of SUPPLIERS) {
      expect(supplier.id.trim()).not.toBe('');
      expect(supplier.name.trim()).not.toBe('');
      expect(supplier.categoryIds.length).toBeGreaterThan(0);
      expect(supplier.regions.length).toBeGreaterThan(0);
      expect(new URL(supplier.website).protocol).toBe('https:');
      expect(new URL(supplier.sourceUrl).protocol).toBe('https:');
      expect(supplier.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(supplier.verifiedAt).toISOString().slice(0, 10)).toBe(supplier.verifiedAt);
    }
  });

  it('не принимает неизвестные поля за доступную информацию', () => {
    const sparseSupplier: Supplier = {
      ...SUPPLIERS[0],
      phone: null,
      email: null,
      minOrder: null,
      price: null,
      documents: null,
      delivery: null,
    };

    expect(getCompleteness(sparseSupplier)).toBe(0);
    expect(getSupplierSummary(sparseSupplier)).toContain('нужно уточнить');
  });

  it('не называет неизвестные пороги заказа опубликованной минимальной партией', () => {
    for (const id of ['evrofresh', 'ekoniva', 'eurofoods']) {
      const summary = getSupplierSummary(SUPPLIERS.find((item) => item.id === id)!);
      expect(summary).toContain('есть информация о формате заказа');
      expect(summary).not.toContain('минимальная партия опубликована');
    }

    for (const id of ['miratorg-horeca', 'alternative-horeca']) {
      expect(getSupplierSummary(SUPPLIERS.find((item) => item.id === id)!)).toContain(
        'минимальная партия опубликована',
      );
    }
  });
});

describe('storage', () => {
  it('возвращает пустое состояние для плохого JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{broken');

    expect(loadCatalogState(storage)).toEqual(createEmptyCatalogState());
  });

  it('отбрасывает неизвестные ID, дубликаты и ограничивает сравнение тремя', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        favoriteIds: ['food-star', 'missing', 'food-star'],
        comparisonIds: ['food-star', 'evrofresh', 'ekoniva', 'miratorg-horeca'],
        notes: { 'food-star': '  Позвонить утром  ', missing: 'не сохранять' },
      }),
    );

    expect(loadCatalogState(storage)).toEqual({
      favoriteIds: ['food-star'],
      comparisonIds: ['food-star', 'evrofresh', 'ekoniva'],
      notes: { 'food-star': 'Позвонить утром' },
    });
  });

  it('сохраняет только валидное состояние и сообщает об успехе', () => {
    const storage = new MemoryStorage();
    const saved = saveCatalogState(
      {
        favoriteIds: ['gotek', 'unknown'],
        comparisonIds: [],
        notes: { gotek: 'Запросить образцы' },
      },
      storage,
    );

    expect(saved).toBe(true);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toEqual({
      favoriteIds: ['gotek'],
      comparisonIds: [],
      notes: { gotek: 'Запросить образцы' },
    });
  });

  it('не падает, когда хранилище недоступно', () => {
    const brokenStorage: StorageLike = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };

    expect(loadCatalogState(brokenStorage)).toEqual(createEmptyCatalogState());
    expect(saveCatalogState(createEmptyCatalogState(), brokenStorage)).toBe(false);
  });
});
