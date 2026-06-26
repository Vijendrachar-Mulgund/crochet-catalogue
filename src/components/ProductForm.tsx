// ProductForm — add/edit a single product.
import { useState, type FormEvent } from 'react';
import type { Category, Product } from '../types';
import { resizeImage } from '../lib/image';
import { useToast } from './Toast';

interface Props {
  product: Product | null;
  categories: Category[];
  onSaved: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, categories, onSaved, onCancel }: Props) {
  const isEdit = !!product;
  const p = product ?? ({} as Partial<Product>);
  const toast = useToast();
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(
    p.photoDataUrl ?? null,
  );

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resizeImage(file, 1400, 0.82).then(setPhotoDataUrl);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const name = (f.elements.namedItem('name') as HTMLInputElement).value.trim();
    if (!name) {
      toast('Please enter a product name', 'err');
      return;
    }
    const priceRaw = (
      f.elements.namedItem('price') as HTMLInputElement
    ).value.trim();
    const categoryId = (f.elements.namedItem('categoryId') as HTMLSelectElement)
      .value;

    const record: Product = {
      name,
      categoryId: categoryId ? Number(categoryId) : null,
      price: priceRaw === '' ? null : Number(priceRaw),
      description: (
        f.elements.namedItem('description') as HTMLTextAreaElement
      ).value.trim(),
      materials: (
        f.elements.namedItem('materials') as HTMLInputElement
      ).value.trim(),
      dimensions: (
        f.elements.namedItem('dimensions') as HTMLInputElement
      ).value.trim(),
      madeToOrder: (f.elements.namedItem('madeToOrder') as HTMLInputElement)
        .checked,
      productionTime: (
        f.elements.namedItem('productionTime') as HTMLInputElement
      ).value.trim(),
      colourOptions: (
        f.elements.namedItem('colourOptions') as HTMLInputElement
      ).value.trim(),
      photoDataUrl,
    };
    if (isEdit && product) {
      record.id = product.id;
      record.createdAt = product.createdAt;
    }
    // TODO: save product (`record`) to a data source.
    void record;
    toast(isEdit ? 'Product updated' : 'Product added', 'ok');
    onSaved();
  }

  return (
    <>
      <div className="view-head">
        <div>
          <h1>{isEdit ? 'Edit product' : 'Add product'}</h1>
        </div>
        <button className="btn" onClick={onCancel}>
          ← Back to catalogue
        </button>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="field">
          <label>Product name *</label>
          <input type="text" name="name" required defaultValue={p.name ?? ''} />
        </div>

        <div className="photo-pick">
          <div className="photo-preview">
            {photoDataUrl ? <img src={photoDataUrl} alt="" /> : '📷'}
          </div>
          <div>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Photo</label>
              <input type="file" accept="image/*" onChange={handlePhoto} />
            </div>
            {photoDataUrl && (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => setPhotoDataUrl(null)}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Category</label>
            <select name="categoryId" defaultValue={p.categoryId ?? ''}>
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>
              Price (₹){' '}
              <span className="hint">leave blank if quoting later</span>
            </label>
            <input
              type="number"
              name="price"
              min="0"
              step="1"
              defaultValue={p.price != null ? p.price : ''}
            />
          </div>
        </div>

        <div className="field">
          <label>Description</label>
          <textarea name="description" defaultValue={p.description ?? ''} />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Materials / yarn used</label>
            <input
              type="text"
              name="materials"
              placeholder="e.g. 100% cotton yarn"
              defaultValue={p.materials ?? ''}
            />
          </div>
          <div className="field">
            <label>Size / dimensions</label>
            <input
              type="text"
              name="dimensions"
              placeholder="e.g. 30 cm tall"
              defaultValue={p.dimensions ?? ''}
            />
          </div>
        </div>

        <div className="field">
          <label>Colour options</label>
          <input
            type="text"
            name="colourOptions"
            placeholder="e.g. Pink, Blue, Cream"
            defaultValue={p.colourOptions ?? ''}
          />
        </div>

        <div className="field checkbox-row">
          <input
            type="checkbox"
            id="mto"
            name="madeToOrder"
            defaultChecked={!!p.madeToOrder}
          />
          <label htmlFor="mto">Made to order</label>
        </div>
        <div className="field">
          <label>
            Production time{' '}
            <span className="hint">how long it takes to make</span>
          </label>
          <input
            type="text"
            name="productionTime"
            placeholder="e.g. 3–4 days"
            defaultValue={p.productionTime ?? ''}
          />
        </div>

        <div className="btn-row">
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Save changes' : 'Add product'}
          </button>
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
