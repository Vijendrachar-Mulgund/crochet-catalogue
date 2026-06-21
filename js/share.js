// share.js — builds the branded, print-optimised catalogue view for Save-as-PDF.
// Exposes a global `Share` object.
(function () {
  'use strict';

  // Charming Yarns brand emblem, used on the PDF cover when no custom logo is set.
  const DEFAULT_LOGO_SVG =
    '<svg class="ph-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="50" cy="50" r="50" fill="#7d9b85"/>' +
    '<g fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="23" y="34" width="33" height="39" rx="4" stroke-dasharray="4 4.5"/>' +
    '<line x1="49" y1="31" x2="54" y2="43"/><line x1="62" y1="31" x2="60" y2="44"/>' +
    '<circle cx="64" cy="60" r="18"/>' +
    '<path d="M50 54 q14 -5 26 7"/><path d="M48 64 q18 -3 31 6"/><path d="M50 74 q12 7 26 -2"/>' +
    '<path d="M57 45 q-7 16 4 33"/><path d="M71 47 q9 14 -2 31"/></g>' +
    '<g fill="#ffffff"><circle cx="48" cy="30" r="2.6"/><circle cx="63" cy="30" r="2.6"/></g></svg>';

  function esc(str) {
    return String(str == null ? '' : str)
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

  // Build the detail line(s) shown under a product in the PDF.
  function productDetails(p, showPrices) {
    const rows = [];
    if (showPrices && p.price != null && p.price !== '') {
      rows.push('<div class="p-price">' + formatPrice(p.price) + '</div>');
    }
    if (p.description) rows.push('<div class="p-desc">' + esc(p.description) + '</div>');
    const specs = [];
    if (p.dimensions) specs.push('<b>Size:</b> ' + esc(p.dimensions));
    if (p.materials) specs.push('<b>Materials:</b> ' + esc(p.materials));
    if (p.colourOptions) specs.push('<b>Colours:</b> ' + esc(p.colourOptions));
    if (p.madeToOrder) {
      specs.push(
        '<b>Made to order</b>' + (p.productionTime ? ' (' + esc(p.productionTime) + ')' : '')
      );
    }
    if (specs.length) {
      rows.push('<div class="p-specs">' + specs.join(' &nbsp;•&nbsp; ') + '</div>');
    }
    return rows.join('');
  }

  // options: { settings, categories, products, showPrices, title, intro }
  function buildHtml(options) {
    const { settings, categories, products, showPrices, title, intro } = options;

    // Group selected products by category, preserving category order.
    const byCat = new Map();
    categories.forEach((c) => byCat.set(c.id, { cat: c, items: [] }));
    byCat.set(null, { cat: { id: null, name: 'Other' }, items: [] });
    products.forEach((p) => {
      const key = byCat.has(p.categoryId) ? p.categoryId : null;
      byCat.get(key).items.push(p);
    });

    let sections = '';
    byCat.forEach(({ cat, items }) => {
      if (!items.length) return;
      const cards = items
        .map(function (p) {
          const img = p.photoDataUrl
            ? '<div class="ph-thumb"><img src="' + p.photoDataUrl + '" alt=""></div>'
            : '<div class="ph-thumb ph-empty">🧶</div>';
          return (
            '<div class="ph-card">' +
            img +
            '<div class="ph-info">' +
            '<div class="p-name">' + esc(p.name) + '</div>' +
            productDetails(p, showPrices) +
            '</div></div>'
          );
        })
        .join('');
      sections +=
        '<section class="ph-section">' +
        '<h2 class="ph-cat">' + esc(cat.name) + '</h2>' +
        '<div class="ph-grid">' + cards + '</div></section>';
    });

    const logo = settings.logoDataUrl
      ? '<img class="ph-logo" src="' + settings.logoDataUrl + '" alt="">'
      : DEFAULT_LOGO_SVG;
    const bizName = settings.businessName || 'Charming Yarns';
    const cover =
      '<header class="ph-cover">' +
      logo +
      '<div class="ph-cover-text">' +
      '<div class="ph-biz">' + esc(bizName) + '</div>' +
      (settings.tagline ? '<div class="ph-tag">' + esc(settings.tagline) + '</div>' : '') +
      (title ? '<div class="ph-title">' + esc(title) + '</div>' : '') +
      (intro ? '<div class="ph-intro">' + esc(intro) + '</div>' : '') +
      (!showPrices
        ? '<div class="ph-note">Prices available on request</div>'
        : '') +
      '</div></header>';

    return '<div class="print-doc">' + cover + sections + '</div>';
  }

  // Render into #print-area and trigger the browser print dialog.
  function printShare(options) {
    const area = document.getElementById('print-area');
    area.innerHTML = buildHtml(options);
    document.body.classList.add('printing');
    window.print();
  }

  function cleanupAfterPrint() {
    document.body.classList.remove('printing');
  }
  window.addEventListener('afterprint', cleanupAfterPrint);

  window.Share = { buildHtml, printShare };
})();
