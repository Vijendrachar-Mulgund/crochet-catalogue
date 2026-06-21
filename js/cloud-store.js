// cloud-store.js — Supabase-backed shared data layer.
// Active only when js/config.js has Supabase credentials AND the supabase-js
// library loaded. Exposes window.CloudStore with the shared Store interface
// plus auth helpers (ready, requiresAuth, isAuthed, signIn, signOut).
(function () {
  'use strict';

  const cfg = window.CATALOGUE_CONFIG || {};
  const hasConfig = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const hasLib = typeof window.supabase !== 'undefined' && window.supabase.createClient;

  // If not configured/available, do not define CloudStore — the dispatcher
  // will fall back to LocalStore.
  if (!hasConfig || !hasLib) return;

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  let session = null;
  const readyPromise = client.auth.getSession().then(({ data }) => {
    session = data.session;
    client.auth.onAuthStateChange((_event, s) => {
      session = s;
    });
  });

  function ready() { return readyPromise; }
  function isAuthed() { return !!session; }

  function signIn(email, password) {
    return client.auth
      .signInWithPassword({ email: email, password: password })
      .then(({ data, error }) => {
        if (error) throw new Error(error.message);
        session = data.session;
        return data;
      });
  }

  function signOut() {
    return client.auth.signOut().then(() => {
      session = null;
    });
  }

  function throwIf(error) {
    if (error) throw new Error(error.message || 'Database error');
  }

  // ---- field mapping (DB snake_case <-> app camelCase) ---------------------
  function productFromRow(r) {
    return {
      id: r.id,
      name: r.name,
      categoryId: r.category_id,
      price: r.price,
      description: r.description || '',
      materials: r.materials || '',
      dimensions: r.dimensions || '',
      madeToOrder: !!r.made_to_order,
      productionTime: r.production_time || '',
      colourOptions: r.colour_options || '',
      photoDataUrl: r.photo_data_url || null,
      createdAt: r.created_at,
    };
  }
  function productToRow(p) {
    const row = {
      name: p.name,
      category_id: p.categoryId != null ? p.categoryId : null,
      price: p.price === '' || p.price == null ? null : p.price,
      description: p.description || '',
      materials: p.materials || '',
      dimensions: p.dimensions || '',
      made_to_order: !!p.madeToOrder,
      production_time: p.productionTime || '',
      colour_options: p.colourOptions || '',
      photo_data_url: p.photoDataUrl || null,
    };
    if (p.id != null) row.id = p.id;
    return row;
  }

  // ---- settings ------------------------------------------------------------
  const DEFAULT_SETTINGS = { businessName: '', tagline: '', logoDataUrl: null };

  function getSettings() {
    return client
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        throwIf(error);
        if (!data) return Object.assign({}, DEFAULT_SETTINGS);
        return {
          businessName: data.business_name || '',
          tagline: data.tagline || '',
          logoDataUrl: data.logo_data_url || null,
        };
      });
  }

  function saveSettings(s) {
    return client
      .from('settings')
      .upsert({
        id: 1,
        business_name: s.businessName || '',
        tagline: s.tagline || '',
        logo_data_url: s.logoDataUrl || null,
      })
      .then(({ error }) => throwIf(error));
  }

  // ---- categories ----------------------------------------------------------
  function getCategories() {
    return client
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        throwIf(error);
        return (data || []).map((c) => ({
          id: c.id,
          name: c.name,
          sortOrder: c.sort_order,
        }));
      });
  }

  function addCategory(name) {
    return getCategories().then((cats) => {
      const maxOrder = cats.reduce((m, c) => Math.max(m, c.sortOrder || 0), -1);
      return client
        .from('categories')
        .insert({ name: name.trim(), sort_order: maxOrder + 1 })
        .then(({ error }) => throwIf(error));
    });
  }

  function updateCategory(cat) {
    return client
      .from('categories')
      .update({ name: cat.name, sort_order: cat.sortOrder })
      .eq('id', cat.id)
      .then(({ error }) => throwIf(error));
  }

  function deleteCategory(id) {
    // Detach products first (they become Uncategorised), then delete category.
    return client
      .from('products')
      .update({ category_id: null })
      .eq('category_id', id)
      .then(({ error }) => {
        throwIf(error);
        return client.from('categories').delete().eq('id', id);
      })
      .then(({ error }) => throwIf(error));
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

  // ---- products ------------------------------------------------------------
  function getProducts() {
    return client
      .from('products')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        throwIf(error);
        return (data || []).map(productFromRow);
      });
  }

  function getProduct(id) {
    return client
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        throwIf(error);
        return data ? productFromRow(data) : null;
      });
  }

  function saveProduct(product) {
    const row = productToRow(product);
    const op =
      product.id != null
        ? client.from('products').update(row).eq('id', product.id)
        : client.from('products').insert(row);
    return op.then(({ error }) => throwIf(error));
  }

  function deleteProduct(id) {
    return client
      .from('products')
      .delete()
      .eq('id', id)
      .then(({ error }) => throwIf(error));
  }

  // ---- seed ----------------------------------------------------------------
  const STARTER_CATEGORIES = [
    'Amigurumi & Toys',
    'Bags & Pouches',
    'Home & Decor',
    'Wearables',
    'Accessories',
  ];

  function seedIfEmpty() {
    const seedCats = getCategories().then((cats) => {
      if (cats.length > 0) return;
      const rows = STARTER_CATEGORIES.map((name, i) => ({ name, sort_order: i }));
      return client.from('categories').insert(rows).then(({ error }) => throwIf(error));
    });
    const seedSettings = getSettings().then((s) => {
      if (s.businessName || s.logoDataUrl) return;
      return saveSettings({ businessName: 'Charming Yarns', tagline: '', logoDataUrl: null });
    });
    return Promise.all([seedCats, seedSettings]);
  }

  // ---- backup / restore ----------------------------------------------------
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
    // Replace all rows. Delete existing, then insert from payload.
    return client
      .from('products')
      .delete()
      .neq('id', -1)
      .then(() => client.from('categories').delete().neq('id', -1))
      .then(() => {
        const cats = (payload.categories || []).map((c) => ({
          id: c.id,
          name: c.name,
          sort_order: c.sortOrder,
        }));
        return cats.length
          ? client.from('categories').insert(cats)
          : Promise.resolve({ error: null });
      })
      .then(({ error }) => {
        throwIf(error);
        const prods = (payload.products || []).map(productToRow);
        return prods.length
          ? client.from('products').insert(prods)
          : Promise.resolve({ error: null });
      })
      .then(({ error }) => {
        throwIf(error);
        return saveSettings(payload.settings || DEFAULT_SETTINGS);
      });
  }

  window.CloudStore = {
    mode: 'cloud',
    requiresAuth: true,
    ready,
    isAuthed,
    signIn,
    signOut,
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
