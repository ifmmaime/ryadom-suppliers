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
    expect(REGIONS).not.toContain('Регионы России');
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

    expect(getCompleteness(result[0])).toBeGreaterThanOrEqual(getCompleteness(result.at(-1)!));
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
