// Catalogue — product gallery with search, category filter, and add/edit form.
import { useEffect, useMemo, useState } from 'react';
import type { Category, Product } from '../types';
import { store } from '../store';
import { formatPrice } from '../lib/format';
import { useToast } from './Toast';
import { ProductForm } from './ProductForm';

type FormMode = { editing: Product | null } | null;

export function Catalogue() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [form, setForm] = useState<FormMode>(null);

  function load() {
    Promise.all([store.getCategories(), store.getProducts()]).then(
      ([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      },
    );
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = products.filter((p) => p.name.toLowerCase().includes(q));
    if (categoryFilter === 'none') items = items.filter((p) => !p.categoryId);
    else if (categoryFilter !== 'all')
      items = items.filter((p) => String(p.categoryId) === categoryFilter);
    return items;
  }, [products, search, categoryFilter]);

  function handleDelete(p: Product) {
    if (!confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
    store.deleteProduct(p.id!).then(() => {
      toast('Product deleted', 'ok');
      load();
    });
  }

  if (form) {
    return (
      <ProductForm
        product={form.editing}
        categories={categories}
        onSaved={() => {
          setForm(null);
          load();
        }}
        onCancel={() => setForm(null)}
      />
    );
  }

  // Group products by category in category order, then uncategorised.
  const order: { id: number | null; name: string }[] = [
    ...categories,
    { id: null, name: 'Uncategorised' },
  ];

  return (
    <>
      <div className="view-head">
        <div>
          <h1>Catalogue</h1>
          <p className="sub">
            {products.length} product{products.length === 1 ? '' : 's'} across{' '}
            {categories.length} categories
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setForm({ editing: null })}
        >
          + Add product
        </button>
      </div>

      <div className="toolbar">
        <input
          className="search"
          type="text"
          placeholder="Search products by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="search"
          style={{ flex: '0 0 200px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="none">Uncategorised</option>
        </select>
      </div>

      <div id="catalogue-list">
        {!products.length ? (
          <div className="empty">
            <div className="big">🧶</div>
            <p>
              No products yet. Click <b>+ Add product</b> to add your mother's
              first creation.
            </p>
          </div>
        ) : !filtered.length ? (
          <div className="empty">
            <p>No products match your search.</p>
          </div>
        ) : (
          order.map((cat) => {
            const inCat = filtered.filter((p) =>
              cat.id === null ? !p.categoryId : p.categoryId === cat.id,
            );
            if (!inCat.length) return null;
            return (
              <div className="category-block" key={String(cat.id)}>
                <h2>
                  {cat.name} <span className="count">{inCat.length}</span>
                </h2>
                <div className="grid">
                  {inCat.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onEdit={() => setForm({ editing: p })}
                      onDelete={() => handleDelete(p)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function ProductCard({
  product: p,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const specs = [p.dimensions, p.materials].filter(Boolean);
  return (
    <div className="card">
      <div className="thumb">
        {p.photoDataUrl ? (
          <img src={p.photoDataUrl} alt="" />
        ) : (
          <span className="placeholder">🧶</span>
        )}
      </div>
      <div className="body">
        {p.madeToOrder && <span className="badge">Made to order</span>}
        <div className="name">{p.name}</div>
        {p.price != null && (p.price as unknown) !== '' && (
          <div className="price">{formatPrice(p.price)}</div>
        )}
        {specs.length > 0 && <div className="meta">{specs.join(' · ')}</div>}
        <div className="actions">
          <button className="btn btn-sm" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
