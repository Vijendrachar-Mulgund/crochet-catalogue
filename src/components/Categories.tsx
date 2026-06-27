// Categories — manage category list: add, rename, reorder, delete.
import { useEffect, useMemo, useState } from "react";
import type { Category, Product } from "../types";
import { useToast } from "./Toast";

/**
 * 
  const STARTER_CATEGORIES = [
  'Amigurumi & Toys',
  'Bags & Pouches',
  'Home & Decor',
  'Wearables',
  'Accessories',
];
 */

export function Categories() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function load() {
    // TODO: load categories and products from a data source.
    Promise.resolve<[Category[], Product[]]>([[], []]).then(([cats, prods]) => {
      setCategories(cats);
      setProducts(prods);
    });
  }

  useEffect(load, []);

  const counts = useMemo(() => {
    const c: Record<number, number> = {};
    products.forEach((p) => {
      if (p.categoryId) c[p.categoryId] = (c[p.categoryId] || 0) + 1;
    });
    return c;
  }, [products]);

  function doAdd() {
    const name = newName.trim();
    if (!name) return;
    // TODO: add category to a data source.
    setNewName("");
    toast("Category added", "ok");
    load();
  }

  function move(_id: number, _direction: "up" | "down") {
    // TODO: reorder categories in a data source.
    load();
  }

  function startRename(cat: Category) {
    setRenamingId(cat.id);
    setRenameValue(cat.name);
  }

  function commitRename(cat: Category) {
    const name = renameValue.trim();
    setRenamingId(null);
    if (name && name !== cat.name) {
      // TODO: rename category in a data source.
      toast("Category renamed", "ok");
      load();
    }
  }

  function handleDelete(cat: Category) {
    const n = counts[cat.id] || 0;
    const msg =
      n > 0
        ? 'Delete "' +
          cat.name +
          '"? Its ' +
          n +
          " product" +
          (n === 1 ? "" : "s") +
          " will become Uncategorised (not deleted)."
        : 'Delete "' + cat.name + '"?';
    if (!confirm(msg)) return;
    // TODO: delete category from a data source.
    toast("Category deleted", "ok");
    load();
  }

  return (
    <>
      <div className="view-head">
        <div>
          <h1>Categories</h1>
          <p className="sub">
            Organise products into groups. Reorder them to set the order they appear in the catalogue and PDFs.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search"
          type="text"
          placeholder="New category name…"
          style={{ maxWidth: 320 }}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") doAdd();
          }}
        />
        <button className="btn btn-primary" onClick={doAdd}>
          + Add category
        </button>
      </div>

      {!categories.length ? (
        <div className="empty">
          <p>No categories yet.</p>
        </div>
      ) : (
        <ul className="cat-list">
          {categories.map((c, i) => {
            const n = counts[c.id] || 0;
            return (
              <li key={c.id}>
                {renamingId === c.id ? (
                  <input
                    className="cat-edit"
                    type="text"
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(c);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                ) : (
                  <span className="cat-name">
                    {c.name}{" "}
                    <span className="count" style={{ color: "var(--muted)", fontWeight: 500 }}>
                      ({n})
                    </span>
                  </span>
                )}
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={i === 0}
                  title="Move up"
                  onClick={() => move(c.id, "up")}
                >
                  ↑
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={i === categories.length - 1}
                  title="Move down"
                  onClick={() => move(c.id, "down")}
                >
                  ↓
                </button>
                <button className="btn btn-sm" onClick={() => startRename(c)}>
                  Rename
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c)}>
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
