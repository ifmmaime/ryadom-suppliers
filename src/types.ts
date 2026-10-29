export type SupplierCategoryId = 'produce' | 'dairy' | 'meat' | 'grocery' | 'packaging';

export interface Supplier {
  id: string;
  name: string;
  initials: string;
  categoryIds: SupplierCategoryId[];
  regions: string[];
  city: string;
  description: string;
  website: string;
  sourceUrl: string;
  phone: string | null;
  email: string | null;
  minOrder: string | null;
  price: string | null;
  documents: string | null;
  delivery: string | null;
  verifiedAt: string;
  sourceNote: string;
}

export interface Category {
  id: 'all' | SupplierCategoryId;
  label: string;
  image: string;
}

export interface CatalogFilters {
  query: string;
  category: Category['id'];
  region: string;
  favoritesOnly: boolean;
  sort: 'name' | 'completeness';
}

export interface UserCatalogState {
  favoriteIds: string[];
  comparisonIds: string[];
  notes: Record<string, string>;
}
