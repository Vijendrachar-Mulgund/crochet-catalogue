// Categories — manage category list: add, rename, reorder, delete.
import { useState } from "react";
import type { Category } from "../types";
import { useToast } from "./Toast";
import { useCategoriesStore } from "../store/categories";
import { InsertCategory } from "../services/categories/insert-category";

export function Categories() {
  const toast = useToast();

  const categories = useCategoriesStore((state) => state.categories);

  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function doAdd() {
    const name = newName.trim();
    if (!name) return;
    // TODO: add category to a data source.
    await InsertCategory(name);
    setNewName("");
    toast("Category added", "ok");
  }

  // function startRename(cat: Category) {
  //   setRenamingId(cat.id);
  //   setRenameValue(cat.name);
  // }

  // function commitRename(cat: Category) {
  //   const name = renameValue.trim();
  //   setRenamingId(null);
  //   if (name && name !== cat.name) {
  //     // TODO: rename category in a data source.
  //     toast("Category renamed", "ok");
  //   }
  // }

  // function handleDelete() {}

  return (
    <>
      <div className="view-head">
        <div>
          <h1>Categories</h1>
          <p className="sub">
            Organize products into groups. Reorder them to set the order they appear in the catalogue and PDFs.
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
          {categories.map((c: Category) => {
            return (
              <li key={c.id}>
                {renamingId === c.id ? (
                  <input
                    className="cat-edit"
                    type="text"
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    // onBlur={() => commitRename(c)}
                    onKeyDown={(e) => {
                      // if (e.key === "Enter") commitRename(c);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                ) : (
                  <span className="cat-name">{c.category_name} </span>
                )}

                {/* <button className="btn btn-sm" onClick={() => startRename(c)}>
                  🖊️
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete()}>
                  🗑️
                </button> */}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
