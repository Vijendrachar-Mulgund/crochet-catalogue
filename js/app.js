// app.js — UI controller for the Crochet Catalogue. Plain JS, no modules.
(function () {
  'use strict';

  const main = document.getElementById('main');
  const navButtons = Array.prototype.slice.call(document.querySelectorAll('.nav-btn'));

  // ---- small helpers -------------------------------------------------------
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function formatPrice(price) {
    if (price == null || price === '') return '';
    const n = Number(price);
    if (Number.isNaN(n)) return esc(price);
    return '₹' + n.toLocaleString('en-IN');
  }
  let toastTimer = null;
  function toast(msg, kind) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2800);
  }
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  // Downscale a chosen image to keep storage small and uploads fast.
  // Returns a JPEG data URL no larger than maxDim on its longest side.
  function resizeImage(file, maxDim, quality) {
    return fileToDataUrl(file).then(
      (dataUrl) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = function () {
            let { width, height } = img;
            if (Math.max(width, height) > maxDim) {
              const scale = maxDim / Math.max(width, height);
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            try {
              resolve(canvas.toDataURL('image/jpeg', quality || 0.82));
            } catch (e) {
              resolve(dataUrl); // fall back to original if canvas is tainted
            }
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        })
    );
  }

  // ---- routing -------------------------------------------------------------
  const views = {};
  let current = 'catalogue';

  function setView(name) {
    current = name;
    navButtons.forEach((b) =>
      b.classList.toggle('active', b.dataset.view === name)
    );
    (views[name] || views.catalogue)();
  }

  navButtons.forEach((b) =>
    b.addEventListener('click', () => setView(b.dataset.view))
  );

  // =========================================================================
  // CATALOGUE VIEW
  // =========================================================================
  let catalogueState = { search: '', categoryFilter: 'all' };

  views.catalogue = function () {
    Promise.all([Store.getCategories(), Store.getProducts()]).then(
      ([categories, products]) => renderCatalogue(categories, products)
    );
  };

  function renderCatalogue(categories, products) {
    const catName = {};
    categories.forEach((c) => (catName[c.id] = c.name));

    main.innerHTML = '';
    const head = el(
      '<div class="view-head">' +
        '<div><h1>Catalogue</h1><p class="sub">' +
        products.length +
        ' product' + (products.length === 1 ? '' : 's') +
        ' across ' + categories.length + ' categories</p></div>' +
        '<button class="btn btn-primary" id="add-product">+ Add product</button>' +
      '</div>'
    );
    main.appendChild(head);
    head.querySelector('#add-product').addEventListener('click', () => openProductForm(null, categories));

    // Toolbar: search + category filter
    const toolbar = el('<div class="toolbar"></div>');
    const search = el('<input class="search" type="text" placeholder="Search products by name…">');
    search.value = catalogueState.search;
    const filter = el('<select class="search" style="flex:0 0 200px"></select>');
    filter.innerHTML =
      '<option value="all">All categories</option>' +
      categories.map((c) => '<option value="' + c.id + '">' + esc(c.name) + '</option>').join('') +
      '<option value="none">Uncategorised</option>';
    filter.value = catalogueState.categoryFilter;
    toolbar.appendChild(search);
    toolbar.appendChild(filter);
    main.appendChild(toolbar);

    const listWrap = el('<div id="catalogue-list"></div>');
    main.appendChild(listWrap);

    function draw() {
      catalogueState.search = search.value;
      catalogueState.categoryFilter = filter.value;
      const q = search.value.trim().toLowerCase();
      let items = products.filter((p) => p.name.toLowerCase().includes(q));
      if (filter.value === 'none') items = items.filter((p) => !p.categoryId);
      else if (filter.value !== 'all')
        items = items.filter((p) => String(p.categoryId) === filter.value);

      if (!products.length) {
        listWrap.innerHTML =
          '<div class="empty"><div class="big">🧶</div>' +
          '<p>No products yet. Click <b>+ Add product</b> to add your mother\'s first creation.</p></div>';
        return;
      }
      if (!items.length) {
        listWrap.innerHTML = '<div class="empty"><p>No products match your search.</p></div>';
        return;
      }

      // group by category in category order, then uncategorised
      listWrap.innerHTML = '';
      const order = categories.slice();
      order.push({ id: null, name: 'Uncategorised' });
      order.forEach((cat) => {
        const inCat = items.filter((p) =>
          cat.id === null ? !p.categoryId : p.categoryId === cat.id
        );
        if (!inCat.length) return;
        const block = el('<div class="category-block"></div>');
        block.appendChild(
          el('<h2>' + esc(cat.name) + ' <span class="count">' + inCat.length + '</span></h2>')
        );
        const grid = el('<div class="grid"></div>');
        inCat.forEach((p) => grid.appendChild(productCard(p, categories)));
        block.appendChild(grid);
        listWrap.appendChild(block);
      });
    }

    search.addEventListener('input', draw);
    filter.addEventListener('change', draw);
    draw();
  }

  function productCard(p, categories) {
    const thumb = p.photoDataUrl
      ? '<div class="thumb"><img src="' + p.photoDataUrl + '" alt=""></div>'
      : '<div class="thumb"><span class="placeholder">🧶</span></div>';
    const specs = [];
    if (p.dimensions) specs.push(esc(p.dimensions));
    if (p.materials) specs.push(esc(p.materials));
    const card = el(
      '<div class="card">' +
        thumb +
        '<div class="body">' +
          (p.madeToOrder ? '<span class="badge">Made to order</span>' : '') +
          '<div class="name">' + esc(p.name) + '</div>' +
          (p.price != null && p.price !== '' ? '<div class="price">' + formatPrice(p.price) + '</div>' : '') +
          (specs.length ? '<div class="meta">' + specs.join(' · ') + '</div>' : '') +
          '<div class="actions">' +
            '<button class="btn btn-sm" data-act="edit">Edit</button>' +
            '<button class="btn btn-sm btn-danger" data-act="del">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    card.querySelector('[data-act="edit"]').addEventListener('click', () =>
      openProductForm(p, categories)
    );
    card.querySelector('[data-act="del"]').addEventListener('click', () => {
      if (!confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
      Store.deleteProduct(p.id).then(() => {
        toast('Product deleted', 'ok');
        views.catalogue();
      });
    });
    return card;
  }

  // =========================================================================
  // PRODUCT ADD / EDIT FORM
  // =========================================================================
  function openProductForm(product, categories) {
    const isEdit = !!product;
    const p = product || {};
    let photoDataUrl = p.photoDataUrl || null;

    main.innerHTML = '';
    main.appendChild(
      el(
        '<div class="view-head"><div><h1>' +
        (isEdit ? 'Edit product' : 'Add product') +
        '</h1></div><button class="btn" id="cancel">← Back to catalogue</button></div>'
      )
    );
    main.querySelector('#cancel').addEventListener('click', () => setView('catalogue'));

    const catOptions =
      categories.map((c) =>
        '<option value="' + c.id + '"' + (p.categoryId === c.id ? ' selected' : '') + '>' +
        esc(c.name) + '</option>'
      ).join('');

    const panel = el(
      '<form class="panel" id="product-form">' +
        '<div class="field">' +
          '<label>Product name *</label>' +
          '<input type="text" name="name" required value="' + esc(p.name || '') + '">' +
        '</div>' +

        '<div class="photo-pick">' +
          '<div class="photo-preview" id="photo-preview">' +
            (photoDataUrl ? '<img src="' + photoDataUrl + '">' : '📷') +
          '</div>' +
          '<div>' +
            '<div class="field" style="margin-bottom:8px"><label>Photo</label>' +
            '<input type="file" accept="image/*" id="photo-input"></div>' +
            (photoDataUrl ? '<button type="button" class="btn btn-sm btn-danger" id="remove-photo">Remove photo</button>' : '') +
          '</div>' +
        '</div>' +

        '<div class="field-row">' +
          '<div class="field"><label>Category</label><select name="categoryId">' +
            '<option value="">Uncategorised</option>' + catOptions +
          '</select></div>' +
          '<div class="field"><label>Price (₹) <span class="hint">leave blank if quoting later</span></label>' +
            '<input type="number" name="price" min="0" step="1" value="' + (p.price != null ? p.price : '') + '"></div>' +
        '</div>' +

        '<div class="field"><label>Description</label>' +
          '<textarea name="description">' + esc(p.description || '') + '</textarea></div>' +

        '<div class="field-row">' +
          '<div class="field"><label>Materials / yarn used</label>' +
            '<input type="text" name="materials" placeholder="e.g. 100% cotton yarn" value="' + esc(p.materials || '') + '"></div>' +
          '<div class="field"><label>Size / dimensions</label>' +
            '<input type="text" name="dimensions" placeholder="e.g. 30 cm tall" value="' + esc(p.dimensions || '') + '"></div>' +
        '</div>' +

        '<div class="field"><label>Colour options</label>' +
          '<input type="text" name="colourOptions" placeholder="e.g. Pink, Blue, Cream" value="' + esc(p.colourOptions || '') + '"></div>' +

        '<div class="field checkbox-row">' +
          '<input type="checkbox" id="mto" name="madeToOrder"' + (p.madeToOrder ? ' checked' : '') + '>' +
          '<label for="mto">Made to order</label>' +
        '</div>' +
        '<div class="field" id="time-field"><label>Production time <span class="hint">how long it takes to make</span></label>' +
          '<input type="text" name="productionTime" placeholder="e.g. 3–4 days" value="' + esc(p.productionTime || '') + '"></div>' +

        '<div class="btn-row">' +
          '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Save changes' : 'Add product') + '</button>' +
          '<button type="button" class="btn" id="cancel2">Cancel</button>' +
        '</div>' +
      '</form>'
    );
    main.appendChild(panel);

    const preview = panel.querySelector('#photo-preview');
    panel.querySelector('#photo-input').addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;
      resizeImage(file, 1400, 0.82).then((url) => {
        photoDataUrl = url;
        preview.innerHTML = '<img src="' + url + '">';
      });
    });
    const removeBtn = panel.querySelector('#remove-photo');
    if (removeBtn)
      removeBtn.addEventListener('click', () => {
        photoDataUrl = null;
        preview.innerHTML = '📷';
        removeBtn.remove();
      });

    panel.querySelector('#cancel2').addEventListener('click', () => setView('catalogue'));

    panel.addEventListener('submit', function (e) {
      e.preventDefault();
      const f = e.target;
      const name = f.name.value.trim();
      if (!name) {
        toast('Please enter a product name', 'err');
        return;
      }
      const priceRaw = f.price.value.trim();
      const record = {
        name: name,
        categoryId: f.categoryId.value ? Number(f.categoryId.value) : null,
        price: priceRaw === '' ? null : Number(priceRaw),
        description: f.description.value.trim(),
        materials: f.materials.value.trim(),
        dimensions: f.dimensions.value.trim(),
        madeToOrder: f.madeToOrder.checked,
        productionTime: f.productionTime.value.trim(),
        colourOptions: f.colourOptions.value.trim(),
        photoDataUrl: photoDataUrl,
      };
      if (isEdit) {
        record.id = p.id;
        record.createdAt = p.createdAt;
      }
      Store.saveProduct(record).then(() => {
        toast(isEdit ? 'Product updated' : 'Product added', 'ok');
        setView('catalogue');
      });
    });
  }

  // =========================================================================
  // CATEGORIES VIEW
  // =========================================================================
  views.categories = function () {
    Promise.all([Store.getCategories(), Store.getProducts()]).then(
      ([categories, products]) => renderCategories(categories, products)
    );
  };

  function renderCategories(categories, products) {
    const counts = {};
    products.forEach((p) => {
      if (p.categoryId) counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    });

    main.innerHTML = '';
    main.appendChild(
      el(
        '<div class="view-head"><div><h1>Categories</h1>' +
        '<p class="sub">Organise products into groups. Reorder them to set the order they appear in the catalogue and PDFs.</p></div></div>'
      )
    );

    const addRow = el(
      '<div class="toolbar">' +
        '<input class="search" id="new-cat" type="text" placeholder="New category name…" style="max-width:320px">' +
        '<button class="btn btn-primary" id="add-cat">+ Add category</button>' +
      '</div>'
    );
    main.appendChild(addRow);
    function doAdd() {
      const input = addRow.querySelector('#new-cat');
      const name = input.value.trim();
      if (!name) return;
      Store.addCategory(name).then(() => {
        input.value = '';
        toast('Category added', 'ok');
        views.categories();
      });
    }
    addRow.querySelector('#add-cat').addEventListener('click', doAdd);
    addRow.querySelector('#new-cat').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doAdd();
    });

    if (!categories.length) {
      main.appendChild(el('<div class="empty"><p>No categories yet.</p></div>'));
      return;
    }

    const list = el('<ul class="cat-list"></ul>');
    categories.forEach((c, i) => {
      const n = counts[c.id] || 0;
      const li = el(
        '<li>' +
          '<span class="cat-name">' + esc(c.name) + ' <span class="count" style="color:var(--muted);font-weight:500">(' + n + ')</span></span>' +
          '<button class="btn btn-sm btn-ghost" data-act="up"' + (i === 0 ? ' disabled' : '') + ' title="Move up">↑</button>' +
          '<button class="btn btn-sm btn-ghost" data-act="down"' + (i === categories.length - 1 ? ' disabled' : '') + ' title="Move down">↓</button>' +
          '<button class="btn btn-sm" data-act="rename">Rename</button>' +
          '<button class="btn btn-sm btn-danger" data-act="del">Delete</button>' +
        '</li>'
      );
      li.querySelector('[data-act="up"]').addEventListener('click', () =>
        Store.moveCategory(c.id, 'up').then(views.categories)
      );
      li.querySelector('[data-act="down"]').addEventListener('click', () =>
        Store.moveCategory(c.id, 'down').then(views.categories)
      );
      li.querySelector('[data-act="rename"]').addEventListener('click', () =>
        startRename(li, c)
      );
      li.querySelector('[data-act="del"]').addEventListener('click', () => {
        const msg =
          n > 0
            ? 'Delete "' + c.name + '"? Its ' + n + ' product' + (n === 1 ? '' : 's') +
              ' will become Uncategorised (not deleted).'
            : 'Delete "' + c.name + '"?';
        if (!confirm(msg)) return;
        Store.deleteCategory(c.id).then(() => {
          toast('Category deleted', 'ok');
          views.categories();
        });
      });
      list.appendChild(li);
    });
    main.appendChild(list);
  }

  function startRename(li, cat) {
    const nameSpan = li.querySelector('.cat-name');
    const input = el('<input class="cat-edit" type="text">');
    input.value = cat.name;
    nameSpan.replaceWith(input);
    input.focus();
    input.select();
    function commit() {
      const name = input.value.trim();
      if (name && name !== cat.name) {
        cat.name = name;
        Store.updateCategory(cat).then(() => {
          toast('Category renamed', 'ok');
          views.categories();
        });
      } else {
        views.categories();
      }
    }
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') views.categories();
    });
    input.addEventListener('blur', commit);
  }

  // =========================================================================
  // SHARE BUILDER VIEW
  // =========================================================================
  views.share = function () {
    Promise.all([Store.getCategories(), Store.getProducts(), Store.getSettings()]).then(
      ([categories, products, settings]) => renderShare(categories, products, settings)
    );
  };

  function renderShare(categories, products, settings) {
    main.innerHTML = '';
    main.appendChild(
      el(
        '<div class="view-head"><div><h1>Create a Share</h1>' +
        '<p class="sub">Pick what to include, choose whether to show prices, then save as a PDF to send to a customer.</p></div></div>'
      )
    );

    if (!products.length) {
      main.appendChild(
        el('<div class="empty"><div class="big">🧶</div><p>Add some products first, then come back to build a share.</p></div>')
      );
      return;
    }

    const wrap = el('<div class="share-cols"></div>');

    // Left: selection tree
    const left = el('<div></div>');
    left.appendChild(el('<div class="btn-row" style="margin-bottom:12px">' +
      '<button class="btn btn-sm" id="sel-all">Select all</button>' +
      '<button class="btn btn-sm" id="sel-none">Clear all</button></div>'));
    const selList = el('<div class="select-list"></div>');

    const order = categories.slice();
    order.push({ id: null, name: 'Uncategorised' });
    order.forEach((cat) => {
      const inCat = products.filter((p) =>
        cat.id === null ? !p.categoryId : p.categoryId === cat.id
      );
      if (!inCat.length) return;
      const block = el('<div class="select-cat"></div>');
      const head = el(
        '<div class="cat-head"><input type="checkbox" class="cat-check" data-cat="' +
        (cat.id == null ? 'none' : cat.id) + '"><span>' + esc(cat.name) +
        '</span><span style="color:var(--accent-dark);font-weight:500">(' + inCat.length + ')</span></div>'
      );
      block.appendChild(head);
      inCat.forEach((p) => {
        const row = el(
          '<div class="prod-row">' +
            '<input type="checkbox" class="prod-check" value="' + p.id + '">' +
            '<label>' + esc(p.name) + '</label>' +
            (p.price != null && p.price !== '' ? '<span class="p">' + formatPrice(p.price) + '</span>' : '') +
          '</div>'
        );
        block.appendChild(row);
      });
      // category checkbox toggles all its products
      head.querySelector('.cat-check').addEventListener('change', function (e) {
        block.querySelectorAll('.prod-check').forEach((cb) => (cb.checked = e.target.checked));
      });
      selList.appendChild(block);
    });
    left.appendChild(selList);
    left.querySelector('#sel-all').addEventListener('click', () =>
      selList.querySelectorAll('input[type=checkbox]').forEach((cb) => (cb.checked = true))
    );
    left.querySelector('#sel-none').addEventListener('click', () =>
      selList.querySelectorAll('input[type=checkbox]').forEach((cb) => (cb.checked = false))
    );

    // Right: options
    const right = el(
      '<div class="panel share-opts">' +
        '<div class="field checkbox-row">' +
          '<input type="checkbox" id="show-prices" checked>' +
          '<label for="show-prices">Show prices</label>' +
        '</div>' +
        '<p class="hint" style="margin:-6px 0 16px;color:var(--muted)">Turn off to send a catalogue without prices (quote later).</p>' +
        '<div class="field"><label>Title <span class="hint">optional — e.g. customer name</span></label>' +
          '<input type="text" id="share-title" placeholder="e.g. For Priya"></div>' +
        '<div class="field"><label>Intro note <span class="hint">optional</span></label>' +
          '<textarea id="share-intro" placeholder="A short message shown on the cover"></textarea></div>' +
        '<button class="btn btn-primary" id="generate" style="width:100%">Preview &amp; Save as PDF</button>' +
        '<p class="hint" style="margin-top:10px;color:var(--muted)">Opens your print dialog — choose <b>Save as PDF</b> as the destination.</p>' +
      '</div>'
    );

    right.querySelector('#generate').addEventListener('click', function () {
      const ids = Array.prototype.slice
        .call(selList.querySelectorAll('.prod-check:checked'))
        .map((cb) => Number(cb.value));
      if (!ids.length) {
        toast('Select at least one product to include', 'err');
        return;
      }
      const chosen = products.filter((p) => ids.indexOf(p.id) !== -1);
      Share.printShare({
        settings: settings,
        categories: categories,
        products: chosen,
        showPrices: right.querySelector('#show-prices').checked,
        title: right.querySelector('#share-title').value.trim(),
        intro: right.querySelector('#share-intro').value.trim(),
      });
    });

    wrap.appendChild(left);
    wrap.appendChild(right);
    main.appendChild(wrap);
  }

  // =========================================================================
  // SETTINGS VIEW
  // =========================================================================
  views.settings = function () {
    Store.getSettings().then((settings) => renderSettings(settings));
  };

  function renderSettings(settings) {
    let logoDataUrl = settings.logoDataUrl || null;

    main.innerHTML = '';
    main.appendChild(
      el('<div class="view-head"><div><h1>Settings</h1>' +
        '<p class="sub">Your business details appear on the cover of every PDF you share.</p></div></div>')
    );

    const panel = el(
      '<form class="panel" id="settings-form">' +
        '<div class="field"><label>Business name</label>' +
          '<input type="text" name="businessName" placeholder="e.g. Charming Yarns" value="' + esc(settings.businessName || '') + '"></div>' +
        '<div class="field"><label>Tagline <span class="hint">optional</span></label>' +
          '<input type="text" name="tagline" placeholder="e.g. Handmade with love" value="' + esc(settings.tagline || '') + '"></div>' +
        '<div class="field"><label>Logo</label>' +
          '<div class="photo-pick">' +
            '<div class="logo-preview" id="logo-preview">' + (logoDataUrl ? '<img src="' + logoDataUrl + '">' : '🧶') + '</div>' +
            '<div><div class="field" style="margin-bottom:8px"><input type="file" accept="image/*" id="logo-input"></div>' +
            (logoDataUrl ? '<button type="button" class="btn btn-sm btn-danger" id="remove-logo">Remove logo</button>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="btn-row"><button type="submit" class="btn btn-primary">Save settings</button></div>' +
      '</form>'
    );
    main.appendChild(panel);

    const logoPrev = panel.querySelector('#logo-preview');
    panel.querySelector('#logo-input').addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;
      resizeImage(file, 512, 0.9).then((url) => {
        logoDataUrl = url;
        logoPrev.innerHTML = '<img src="' + url + '">';
      });
    });
    const removeLogo = panel.querySelector('#remove-logo');
    if (removeLogo)
      removeLogo.addEventListener('click', () => {
        logoDataUrl = null;
        logoPrev.innerHTML = '🧶';
        removeLogo.remove();
      });

    panel.addEventListener('submit', function (e) {
      e.preventDefault();
      const f = e.target;
      Store.saveSettings({
        businessName: f.businessName.value.trim(),
        tagline: f.tagline.value.trim(),
        logoDataUrl: logoDataUrl,
      }).then(() => toast('Settings saved', 'ok'));
    });

    // ---- Backup & restore card ----
    const backup = el(
      '<div class="panel" style="margin-top:22px">' +
        '<h2 style="margin:0 0 6px;font-size:18px">Backup &amp; restore</h2>' +
        '<p class="hint" style="color:var(--muted);margin:0 0 16px">' +
          'Your catalogue is saved on this computer in this browser. Export a backup file regularly and keep it safe — ' +
          'you can restore it here or move it to another computer.</p>' +
        '<div class="btn-row">' +
          '<button class="btn btn-primary" id="export-btn">⬇ Export backup</button>' +
          '<button class="btn" id="import-btn">⬆ Restore from backup</button>' +
        '</div>' +
      '</div>'
    );
    main.appendChild(backup);
    backup.querySelector('#export-btn').addEventListener('click', exportBackup);
    backup.querySelector('#import-btn').addEventListener('click', () =>
      document.getElementById('import-file').click()
    );
  }

  // ---- Backup / restore actions -------------------------------------------
  function exportBackup() {
    Store.exportData().then((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = 'crochet-catalogue-backup-' + stamp + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Backup downloaded', 'ok');
    });
  }

  document.getElementById('import-file').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('Restoring will replace everything currently in the catalogue. Continue?')) {
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      let payload;
      try {
        payload = JSON.parse(reader.result);
      } catch (err) {
        toast('That file could not be read.', 'err');
        return;
      }
      Store.importData(payload)
        .then(() => {
          toast('Catalogue restored', 'ok');
          setView('catalogue');
        })
        .catch((err) => toast(err.message || 'Restore failed', 'err'));
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // =========================================================================
  // AUTH (shared online mode only)
  // =========================================================================
  function startApp() {
    document.getElementById('login-overlay').hidden = true;
    addSignOutButton();
    Store.seedIfEmpty()
      .then(() => setView('catalogue'))
      .catch((err) => {
        console.error(err);
        main.innerHTML =
          '<div class="empty"><div class="big">⚠️</div>' +
          '<p>Could not load the catalogue. Please check your internet connection and refresh.</p></div>';
      });
  }

  function addSignOutButton() {
    if (Store.mode !== 'cloud') return;
    if (document.getElementById('signout-btn')) return;
    const btn = el('<button class="nav-btn signout-btn" id="signout-btn">Sign out</button>');
    btn.addEventListener('click', () => {
      Store.signOut().then(() => location.reload());
    });
    document.querySelector('.nav').appendChild(btn);
  }

  function showLogin() {
    const overlay = document.getElementById('login-overlay');
    const form = document.getElementById('login-form');
    const errEl = document.getElementById('login-error');
    overlay.hidden = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errEl.hidden = true;
      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      Store.signIn(
        document.getElementById('login-email').value.trim(),
        document.getElementById('login-password').value
      )
        .then(() => startApp())
        .catch((err) => {
          errEl.textContent = err.message || 'Could not sign in.';
          errEl.hidden = false;
          btn.disabled = false;
          btn.textContent = 'Sign in';
        });
    });
  }

  // =========================================================================
  // BOOT
  // =========================================================================
  Store.ready()
    .then(() => {
      if (Store.requiresAuth && !Store.isAuthed()) {
        showLogin();
      } else {
        startApp();
      }
    })
    .catch((err) => {
      console.error(err);
      startApp();
    });
})();
