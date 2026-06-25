// localStore — offline IndexedDB data layer for the catalogue.

import type {
  BackupData,
  Category,
  MoveDirection,
  Product,
  Settings,
} from '../types';

const DB_NAME = 'crochet-catalogue';
const DB_VERSION = 1;
const STARTER_CATEGORIES = [
  'Amigurumi & Toys',
  'Bags & Pouches',
  'Home & Decor',
  'Wearables',
  'Accessories',
];

const DEFAULT_SETTINGS: Settings = {
  businessName: '',
  tagline: '',
  logoDataUrl: null,
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('products')) {
        const products = db.createObjectStore('products', {
          keyPath: 'id',
          autoIncrement: true,
        });
        products.createIndex('categoryId', 'categoryId', { unique: false });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => T | Promise<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        let result: T;
        Promise.resolve(fn(store)).then((r) => {
          result = r;
        });
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      }),
  );
}

function reqAsPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAll<T>(storeName: string): Promise<T[]> {
  return tx(storeName, 'readonly', (store) => reqAsPromise(store.getAll()));
}

export function getSettings(): Promise<Settings> {
  return tx('settings', 'readonly', (store) =>
    reqAsPromise(store.get('app')),
  ).then((row: { key: string; value: Settings } | undefined) =>
    Object.assign({}, DEFAULT_SETTINGS, row ? row.value : {}),
  );
}

export function saveSettings(settings: Settings): Promise<unknown> {
  return tx('settings', 'readwrite', (store) =>
    reqAsPromise(store.put({ key: 'app', value: settings })),
  );
}

export function getCategories(): Promise<Category[]> {
  return getAll<Category>('categories').then((cats) =>
    cats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
  );
}

export function addCategory(name: string): Promise<unknown> {
  return getCategories().then((cats) => {
    const maxOrder = cats.reduce((m, c) => Math.max(m, c.sortOrder || 0), -1);
    return tx('categories', 'readwrite', (store) =>
      reqAsPromise(store.add({ name: name.trim(), sortOrder: maxOrder + 1 })),
    );
  });
}

export function updateCategory(cat: Category): Promise<unknown> {
  return tx('categories', 'readwrite', (store) => reqAsPromise(store.put(cat)));
}

export function deleteCategory(id: number): Promise<unknown> {
  return tx('products', 'readwrite', (store) =>
    reqAsPromise(store.index('categoryId').getAll(id)).then(
      (products: Product[]) => {
        products.forEach((p) => {
          p.categoryId = null;
          store.put(p);
        });
      },
    ),
  ).then(() =>
    tx('categories', 'readwrite', (store) => reqAsPromise(store.delete(id))),
  );
}

export function moveCategory(
  id: number,
  direction: MoveDirection,
): Promise<unknown> {
  return getCategories().then((cats) => {
    const idx = cats.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const swapWith = direction === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= cats.length) return;
    const a = cats[idx];
    const b = cats[swapWith];
    const tmp = a.sortOrder;
    a.sortOrder = b.sortOrder;
    b.sortOrder = tmp;
    return Promise.all([updateCategory(a), updateCategory(b)]);
  });
}

export function getProducts(): Promise<Product[]> {
  return getAll<Product>('products').then((ps) =>
    ps.sort((a, b) => a.name.localeCompare(b.name)),
  );
}

export function getProduct(id: number): Promise<Product | undefined> {
  return tx('products', 'readonly', (store) => reqAsPromise(store.get(id)));
}

export function saveProduct(product: Product): Promise<unknown> {
  const record: Product = Object.assign({}, product);
  if (!record.createdAt) record.createdAt = new Date().toISOString();
  return tx('products', 'readwrite', (store) => reqAsPromise(store.put(record)));
}

export function deleteProduct(id: number): Promise<unknown> {
  return tx('products', 'readwrite', (store) => reqAsPromise(store.delete(id)));
}

export function seedIfEmpty(): Promise<unknown> {
  const seedCats = getCategories().then((cats) => {
    if (cats.length > 0) return;
    return tx('categories', 'readwrite', (store) => {
      STARTER_CATEGORIES.forEach((name, i) => store.add({ name, sortOrder: i }));
    });
  });
  const seedSettings = getSettings().then((s) => {
    if (s.businessName || s.logoDataUrl) return;
    return saveSettings({
      businessName: 'Charming Yarns',
      tagline: '',
      logoDataUrl: null,
    });
  });
  return Promise.all([seedCats, seedSettings]);
}

export function exportData(): Promise<BackupData> {
  return Promise.all([getSettings(), getCategories(), getProducts()]).then(
    ([settings, categories, products]) => ({
      format: 'crochet-catalogue',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      categories,
      products,
    }),
  );
}

export function importData(payload: BackupData): Promise<void> {
  if (!payload || payload.format !== 'crochet-catalogue') {
    return Promise.reject(new Error('This file is not a catalogue backup.'));
  }
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(
          ['settings', 'categories', 'products'],
          'readwrite',
        );
        const catStore = transaction.objectStore('categories');
        const prodStore = transaction.objectStore('products');
        transaction.objectStore('settings').clear();
        catStore.clear();
        prodStore.clear();
        transaction
          .objectStore('settings')
          .put({ key: 'app', value: payload.settings || DEFAULT_SETTINGS });
        (payload.categories || []).forEach((c) => catStore.put(c));
        (payload.products || []).forEach((p) => prodStore.put(p));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      }),
  );
}
