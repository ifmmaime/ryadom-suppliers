import type { CatalogFilters, Supplier } from '../types';

const CATEGORY_SEARCH_LABELS: Record<Supplier['categoryIds'][number], string> = {
  produce: 'овощи фрукты ягоды зелень',
  dairy: 'молочная продукция молоко сливки сыр творог',
  meat: 'мясо птица мясная продукция',
  grocery: 'бакалея крупы макароны мука масло соусы',
  packaging: 'упаковка тара пленка плёнка картон',
};

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const COMPLETENESS_FIELDS: Array<keyof Supplier> = [
  'phone',
  'email',
  'minOrder',
  'price',
  'documents',
  'delivery',
];

export function getCompleteness(supplier: Supplier): number {
  const availableFields = COMPLETENESS_FIELDS.filter((field) => {
    const value = supplier[field];
    return typeof value === 'string' && value.trim().length > 0;
  }).length;

  return Math.round((availableFields / COMPLETENESS_FIELDS.length) * 100);
}

export function getSupplierSummary(supplier: Supplier): string {
  const strengths: string[] = [];

  if (supplier.delivery) strengths.push('условия доставки опубликованы');
  if (supplier.minOrder) {
    const hasConcreteMinimum = /без миним|от\s+(?:\d|одн(?:ой|ого))/iu.test(supplier.minOrder);
    strengths.push(
      hasConcreteMinimum ? 'минимальная партия опубликована' : 'есть информация о формате заказа',
    );
  }
  if (supplier.documents) strengths.push('есть сведения о документах');
  if (supplier.phone || supplier.email) strengths.push('доступен прямой контакт');

  if (strengths.length === 0) {
    return 'Подойдёт для первичного запроса: коммерческие условия нужно уточнить у поставщика.';
  }

  const visibleStrengths = strengths.slice(0, 2).join(' и ');
  const missing = COMPLETENESS_FIELDS.some((field) => !supplier[field]);

  return missing
    ? `Стоит связаться: ${visibleStrengths}. Остальные условия нужно подтвердить.`
    : `Удобен для быстрого сравнения: ${visibleStrengths}. Перед заказом подтвердите актуальность условий.`;
}

function matchesRegion(supplier: Supplier, region: string): boolean {
  if (!region || region === 'Все регионы') return true;
  if (region === 'Вся Россия') return supplier.regions.includes('Вся Россия');
  return supplier.regions.includes(region) || supplier.regions.includes('Вся Россия');
}

export function filterSuppliers(
  suppliers: Supplier[],
  filters: CatalogFilters,
  favoriteIds: string[],
): Supplier[] {
  const normalizedQuery = normalizeSearch(filters.query);
  const queryParts = normalizedQuery ? normalizedQuery.split(' ') : [];
  const favoriteSet = new Set(favoriteIds);

  const filtered = suppliers.filter((supplier) => {
    if (filters.category !== 'all' && !supplier.categoryIds.includes(filters.category))
      return false;
    if (!matchesRegion(supplier, filters.region)) return false;
    if (filters.favoritesOnly && !favoriteSet.has(supplier.id)) return false;

    if (queryParts.length > 0) {
      const haystack = normalizeSearch(
        [
          supplier.name,
          supplier.city,
          supplier.description,
          supplier.categoryIds.join(' '),
          supplier.categoryIds.map((categoryId) => CATEGORY_SEARCH_LABELS[categoryId]).join(' '),
          supplier.regions.join(' '),
        ].join(' '),
      );

      if (!queryParts.every((part) => haystack.includes(part))) return false;
    }

    return true;
  });

  return [...filtered].sort((left, right) => {
    if (filters.sort === 'completeness') {
      const completenessDifference = getCompleteness(right) - getCompleteness(left);
      if (completenessDifference !== 0) return completenessDifference;
    }

    return left.name.localeCompare(right.name, 'ru-RU');
  });
}
