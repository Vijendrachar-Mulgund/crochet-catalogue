// local-store.js — offline IndexedDB data layer (used when no cloud config is set).
// Exposes window.LocalStore with the shared Store interface.
(function () {
  'use strict';

  const DB_NAME = 'crochet-catalogue';
  const DB_VERSION = 1;
  const STARTER_CATEGORIES = [
    'Amigurumi & Toys',
    'Bags & Pouches',
    'Home & Decor',
    'Wearables',
    'Accessories',
  ];

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        const db = e.target.result;
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
      req.onsuccess = function (e) {
        resolve(e.target.result);
      };
      req.onerror = function () {
        reject(req.error);
      };
    });
    return dbPromise;
  }

  function tx(storeName, mode, fn) {
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, mode);
          const store = transaction.objectStore(storeName);
          let result;
          Promise.resolve(fn(store)).then((r) => {
            result = r;
          });
          transaction.oncomplete = () => resolve(result);
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        })
    );
  }

  function reqAsPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function getAll(storeName) {
    return tx(storeName, 'readonly', (store) => reqAsPromise(store.getAll()));
  }

  const DEFAULT_SETTINGS = { businessName: '', tagline: '', logoDataUrl: null };

  function getSettings() {
    return tx('settings', 'readonly', (store) =>
      reqAsPromise(store.get('app'))
    ).then((row) => Object.assign({}, DEFAULT_SETTINGS, row ? row.value : {}));
  }

  function saveSettings(settings) {
    return tx('settings', 'readwrite', (store) =>
      reqAsPromise(store.put({ key: 'app', value: settings }))
    );
  }

  function getCategories() {
    return getAll('categories').then((cats) =>
      cats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    );
  }

  function addCategory(name) {
    return getCategories().then((cats) => {
      const maxOrder = cats.reduce((m, c) => Math.max(m, c.sortOrder || 0), -1);
      return tx('categories', 'readwrite', (store) =>
        reqAsPromise(store.add({ name: name.trim(), sortOrder: maxOrder + 1 }))
      );
    });
  }

  function updateCategory(cat) {
    return tx('categories', 'readwrite', (store) => reqAsPromise(store.put(cat)));
  }

  function deleteCategory(id) {
    return tx('products', 'readwrite', (store) =>
      reqAsPromise(store.index('categoryId').getAll(id)).then((products) => {
        products.forEach((p) => {
          p.categoryId = null;
          store.put(p);
        });
      })
    ).then(() =>
      tx('categories', 'readwrite', (store) => reqAsPromise(store.delete(id)))
    );
  }

  function moveCategory(id, direction) {
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

  function getProducts() {
    return getAll('products').then((ps) =>
      ps.sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  function getProduct(id) {
    return tx('products', 'readonly', (store) => reqAsPromise(store.get(id)));
  }

  function saveProduct(product) {
    const record = Object.assign({}, product);
    if (!record.createdAt) record.createdAt = new Date().toISOString();
    return tx('products', 'readwrite', (store) => reqAsPromise(store.put(record)));
  }

  function deleteProduct(id) {
    return tx('products', 'readwrite', (store) => reqAsPromise(store.delete(id)));
  }

  function seedIfEmpty() {
    const seedCats = getCategories().then((cats) => {
      if (cats.length > 0) return;
      return tx('categories', 'readwrite', (store) => {
        STARTER_CATEGORIES.forEach((name, i) => store.add({ name, sortOrder: i }));
      });
    });
    const seedSettings = getSettings().then((s) => {
      if (s.businessName || s.logoDataUrl) return;
      return saveSettings({ businessName: 'Charming Yarns', tagline: '', logoDataUrl: null });
    });
    return Promise.all([seedCats, seedSettings]);
  }

  function exportData() {
    return Promise.all([getSettings(), getCategories(), getProducts()]).then(
      ([settings, categories, products]) => ({
        format: 'crochet-catalogue',
        version: 1,
        exportedAt: new Date().toISOString(),
        settings,
        categories,
        products,
      })
    );
  }

  function importData(payload) {
    if (!payload || payload.format !== 'crochet-catalogue') {
      return Promise.reject(new Error('This file is not a catalogue backup.'));
    }
    return openDB().then(
      (db) =>
        new Promise((resolve, reject) => {
          const transaction = db.transaction(
            ['settings', 'categories', 'products'],
            'readwrite'
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
        })
    );
  }

  window.LocalStore = {
    mode: 'local',
    requiresAuth: false,
    ready: function () { return Promise.resolve(); },
    isAuthed: function () { return true; },
    seedIfEmpty,
    getSettings,
    saveSettings,
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
    getProducts,
    getProduct,
    saveProduct,
    deleteProduct,
    exportData,
    importData,
  };
})();
