import { SUPPLIERS } from '../data/suppliers';
import type { UserCatalogState } from '../types';

export const STORAGE_KEY = 'ryadom:user-catalog:v1';
const MAX_COMPARISON_ITEMS = 3;
const MAX_NOTE_LENGTH = 1000;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const supplierIds = new Set(SUPPLIERS.map((supplier) => supplier.id));

export function createEmptyCatalogState(): UserCatalogState {
  return { favoriteIds: [], comparisonIds: [], notes: {} };
}

function uniqueValidIds(value: unknown, limit = Number.POSITIVE_INFINITY): string[] {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value.filter((item): item is string => typeof item === 'string' && supplierIds.has(item)),
    ),
  ].slice(0, limit);
}

function validNotes(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([id, note]) => supplierIds.has(id) && typeof note === 'string')
      .map(([id, note]) => [id, (note as string).trim().slice(0, MAX_NOTE_LENGTH)])
      .filter(([, note]) => note.length > 0),
  );
}

function sanitizeState(value: unknown): UserCatalogState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createEmptyCatalogState();
  }

  const candidate = value as Partial<UserCatalogState>;
  return {
    favoriteIds: uniqueValidIds(candidate.favoriteIds),
    comparisonIds: uniqueValidIds(candidate.comparisonIds, MAX_COMPARISON_ITEMS),
    notes: validNotes(candidate.notes),
  };
}

function getBrowserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadCatalogState(
  storage: StorageLike | null = getBrowserStorage(),
): UserCatalogState {
  if (!storage) return createEmptyCatalogState();

  try {
    const rawState = storage.getItem(STORAGE_KEY);
    return rawState ? sanitizeState(JSON.parse(rawState)) : createEmptyCatalogState();
  } catch {
    return createEmptyCatalogState();
  }
}

export function saveCatalogState(
  state: UserCatalogState,
  storage: StorageLike | null = getBrowserStorage(),
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(sanitizeState(state)));
    return true;
  } catch {
    return false;
  }
}
