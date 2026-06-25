// ShareBuilder — pick products, set options, and save a branded PDF.
import { useEffect, useRef, useState } from 'react';
import type { Category, Product, Settings } from '../types';
import { store } from '../store';
import { formatPrice } from '../lib/format';
import { printShare } from '../share/share';
import { useToast } from './Toast';

export function ShareBuilder() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showPrices, setShowPrices] = useState(true);
  const titleRef = useRef<HTMLInputElement>(null);
  const introRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    Promise.all([
      store.getCategories(),
      store.getProducts(),
      store.getSettings(),
    ]).then(([cats, prods, s]) => {
      setCategories(cats);
      setProducts(prods);
      setSettings(s);
    });
  }, []);

  function toggle(id: number, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function setMany(ids: number[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  function generate() {
    if (!selected.size) {
      toast('Select at least one product to include', 'err');
      return;
    }
    const chosen = products.filter((p) => selected.has(p.id!));
    printShare({
      settings: settings!,
      categories,
      products: chosen,
      showPrices,
      title: titleRef.current?.value.trim() ?? '',
      intro: introRef.current?.value.trim() ?? '',
    });
  }

  const order: { id: number | null; name: string }[] = [
    ...categories,
    { id: null, name: 'Uncategorised' },
  ];

  return (
    <>
      <div className="view-head">
        <div>
          <h1>Create a Share</h1>
          <p className="sub">
            Pick what to include, choose whether to show prices, then save as a
            PDF to send to a customer.
          </p>
        </div>
      </div>

      {!products.length ? (
        <div className="empty">
          <div className="big">🧶</div>
          <p>Add some products first, then come back to build a share.</p>
        </div>
      ) : (
        <div className="share-cols">
          <div>
            <div className="btn-row" style={{ marginBottom: 12 }}>
              <button
                className="btn btn-sm"
                onClick={() =>
                  setMany(
                    products.map((p) => p.id!),
                    true,
                  )
                }
              >
                Select all
              </button>
              <button className="btn btn-sm" onClick={() => setSelected(new Set())}>
                Clear all
              </button>
            </div>
            <div className="select-list">
              {order.map((cat) => {
                const inCat = products.filter((p) =>
                  cat.id === null ? !p.categoryId : p.categoryId === cat.id,
                );
                if (!inCat.length) return null;
                const ids = inCat.map((p) => p.id!);
                const allChecked = ids.every((id) => selected.has(id));
                return (
                  <div className="select-cat" key={String(cat.id)}>
                    <div className="cat-head">
                      <input
                        type="checkbox"
                        className="cat-check"
                        checked={allChecked}
                        onChange={(e) => setMany(ids, e.target.checked)}
                      />
                      <span>{cat.name}</span>
                      <span
                        style={{
                          color: 'var(--accent-dark)',
                          fontWeight: 500,
                        }}
                      >
                        ({inCat.length})
                      </span>
                    </div>
                    {inCat.map((p) => (
                      <div className="prod-row" key={p.id}>
                        <input
                          type="checkbox"
                          className="prod-check"
                          checked={selected.has(p.id!)}
                          onChange={(e) => toggle(p.id!, e.target.checked)}
                        />
                        <label>{p.name}</label>
                        {p.price != null && (p.price as unknown) !== '' && (
                          <span className="p">{formatPrice(p.price)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel share-opts">
            <div className="field checkbox-row">
              <input
                type="checkbox"
                id="show-prices"
                checked={showPrices}
                onChange={(e) => setShowPrices(e.target.checked)}
              />
              <label htmlFor="show-prices">Show prices</label>
            </div>
            <p
              className="hint"
              style={{ margin: '-6px 0 16px', color: 'var(--muted)' }}
            >
              Turn off to send a catalogue without prices (quote later).
            </p>
            <div className="field">
              <label>
                Title <span className="hint">optional — e.g. customer name</span>
              </label>
              <input type="text" ref={titleRef} placeholder="e.g. For Priya" />
            </div>
            <div className="field">
              <label>
                Intro note <span className="hint">optional</span>
              </label>
              <textarea
                ref={introRef}
                placeholder="A short message shown on the cover"
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={generate}
            >
              Preview &amp; Save as PDF
            </button>
            <p
              className="hint"
              style={{ marginTop: 10, color: 'var(--muted)' }}
            >
              Opens your print dialog — choose <b>Save as PDF</b> as the
              destination.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
