import {
  escapeHtml,
  formatCurrency,
  formatDate,
  safeImageUrl,
} from '../utils/format.js';

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  card: 'Tarjeta',
};

function productImage(product) {
  const image = safeImageUrl(product.image);
  if (image) {
    return `<img src="${escapeHtml(image)}" class="card-img-top product-image" alt="${escapeHtml(
      product.name,
    )}" loading="lazy" />`;
  }

  const initial = escapeHtml(product.name.trim().charAt(0).toUpperCase() || '?');
  return `<div class="product-placeholder" aria-hidden="true">${initial}</div>`;
}

function stockBadge(stock) {
  if (stock === 0) {
    return '<span class="badge text-bg-danger">Sin stock</span>';
  }
  if (stock <= 5) {
    return `<span class="badge text-bg-warning">Stock bajo: ${stock}</span>`;
  }
  return `<span class="badge text-bg-success">Stock: ${stock}</span>`;
}

function saleFolio(sale) {
  return `V-${String(sale.id).slice(-6).toUpperCase()}`;
}

export function renderDashboard({ stats, lowStock }) {
  const container = document.getElementById('dashboard-cards');
  if (!container) return;

  const lowStockDetail =
    lowStock.length === 0
      ? '<span class="text-success small">Todo el inventario está saludable.</span>'
      : `<span class="text-danger small">${lowStock
          .slice(0, 3)
          .map((product) => escapeHtml(product.name))
          .join(', ')}${lowStock.length > 3 ? '…' : ''}</span>`;

  container.innerHTML = `
    <div class="col-md-4">
      <article class="card h-100 shadow-sm border-0">
        <div class="card-body">
          <p class="text-muted mb-1">Ventas de hoy</p>
          <p class="fs-3 fw-bold mb-0">${stats.count}</p>
          <p class="text-success mb-0">${formatCurrency(stats.total)}</p>
        </div>
      </article>
    </div>
    <div class="col-md-4">
      <article class="card h-100 shadow-sm border-0">
        <div class="card-body">
          <p class="text-muted mb-1">Ticket promedio</p>
          <p class="fs-3 fw-bold mb-0">${formatCurrency(stats.average)}</p>
          <p class="text-muted mb-0">Basado en las ventas de hoy</p>
        </div>
      </article>
    </div>
    <div class="col-md-4">
      <article class="card h-100 shadow-sm border-0">
        <div class="card-body">
          <p class="text-muted mb-1">Productos con bajo stock</p>
          <p class="fs-3 fw-bold mb-0">${lowStock.length}</p>
          ${lowStockDetail}
        </div>
      </article>
    </div>
  `;
}

export function renderCategoryOptions(products, selectedCategory = '') {
  const select = document.getElementById('catalog-category');
  if (!select) return;

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'es'),
  );

  select.innerHTML = [
    '<option value="">Todas</option>',
    ...categories.map(
      (category) =>
        `<option value="${escapeHtml(category)}"${
          category === selectedCategory ? ' selected' : ''
        }>${escapeHtml(category)}</option>`,
    ),
  ].join('');
}

export function renderCatalog(products, { search = '', category = '' } = {}) {
  const grid = document.getElementById('catalog-grid');
  const empty = document.getElementById('catalog-empty');
  if (!grid || !empty) return;

  const term = search.trim().toLowerCase();
  const filtered = products
    .filter((product) => {
      const matchesTerm =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term);
      const matchesCategory = !category || product.category === category;
      return matchesTerm && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  empty.classList.toggle('d-none', filtered.length > 0);

  grid.innerHTML = filtered
    .map((product) => {
      const disabled = product.stock === 0 ? ' disabled' : '';
      const buttonText = product.stock === 0 ? 'Sin stock' : 'Agregar al carrito';

      return `
        <div class="col-sm-6 col-xl-4">
          <article class="card product-card h-100 shadow-sm">
            ${productImage(product)}
            <div class="card-body d-flex flex-column">
              <h3 class="h6 mb-1">${escapeHtml(product.name)}</h3>
              <p class="text-muted small mb-2">
                ${escapeHtml(product.sku)}${product.category ? ` · ${escapeHtml(product.category)}` : ''}
              </p>
              <p class="fw-bold mb-2">${formatCurrency(product.price)}</p>
              <div class="mb-3">${stockBadge(product.stock)}</div>
              <button
                type="button"
                class="btn btn-primary btn-sm mt-auto"
                data-action="add-to-cart"
                data-product-id="${escapeHtml(product.id)}"
                ${disabled}
              >
                ${buttonText}
              </button>
            </div>
          </article>
        </div>
      `;
    })
    .join('');
}

export function renderCart(cart, taxRate) {
  const itemsContainer = document.getElementById('cart-items');
  const emptyMessage = document.getElementById('cart-empty');
  const clearButton = document.getElementById('clear-cart');
  const checkoutButton = document.getElementById('checkout-button');
  const taxInput = document.getElementById('tax-rate');
  const paymentMethod = document.getElementById('payment-method');
  const cashField = document.getElementById('cash-field');
  const cashInput = document.getElementById('cash-received');
  const changeRow = document.getElementById('change-row');
  const changeValue = document.getElementById('cash-change');

  if (!itemsContainer || !emptyMessage) return;

  const total = cart.total(taxRate);

  itemsContainer.innerHTML = cart.items
    .map(
      (item) => `
        <li class="list-group-item px-0 d-flex justify-content-between align-items-center gap-2">
          <div class="flex-grow-1">
            <p class="mb-0 fw-semibold">${escapeHtml(item.name)}</p>
            <small class="text-muted">
              ${formatCurrency(item.price)} × ${item.quantity} =
              ${formatCurrency(item.price * item.quantity)}
            </small>
          </div>
          <div class="btn-group btn-group-sm" role="group" aria-label="Acciones para ${escapeHtml(
            item.name,
          )}">
            <button type="button" class="btn btn-outline-secondary" data-action="decrease-quantity"
              data-product-id="${escapeHtml(item.productId)}" aria-label="Quitar una unidad de ${escapeHtml(
                item.name,
              )}">−</button>
            <button type="button" class="btn btn-outline-secondary" data-action="increase-quantity"
              data-product-id="${escapeHtml(item.productId)}" aria-label="Agregar una unidad de ${escapeHtml(
                item.name,
              )}">+</button>
            <button type="button" class="btn btn-outline-danger" data-action="remove-from-cart"
              data-product-id="${escapeHtml(item.productId)}" aria-label="Quitar ${escapeHtml(
                item.name,
              )} del carrito">×</button>
          </div>
        </li>
      `,
    )
    .join('');

  emptyMessage.classList.toggle('d-none', !cart.isEmpty);
  if (clearButton) clearButton.disabled = cart.isEmpty;
  if (checkoutButton) checkoutButton.disabled = cart.isEmpty;

  const subtotalElement = document.getElementById('cart-subtotal');
  const taxElement = document.getElementById('cart-tax');
  const totalElement = document.getElementById('cart-total');

  if (subtotalElement) subtotalElement.textContent = formatCurrency(cart.subtotal);
  if (taxElement) taxElement.textContent = formatCurrency(cart.tax(taxRate));
  if (totalElement) totalElement.textContent = formatCurrency(total);

  if (taxInput && document.activeElement !== taxInput) {
    taxInput.value = String(taxRate);
  }

  if (paymentMethod && cashField && changeRow && changeValue) {
    const isCash = paymentMethod.value === 'cash';
    cashField.classList.toggle('d-none', !isCash);

    const received = Number(cashInput?.value);
    const hasReceived = isCash && Number.isFinite(received) && received > 0;
    changeRow.classList.toggle('d-none', !hasReceived);
    changeValue.textContent = formatCurrency(hasReceived ? Math.max(0, received - total) : 0);
  }
}

export function renderProductsTable(products) {
  const body = document.getElementById('products-table-body');
  const empty = document.getElementById('products-empty');
  const count = document.getElementById('products-count');
  if (!body || !empty || !count) return;

  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name, 'es'));

  count.textContent = `${sorted.length} ${sorted.length === 1 ? 'producto' : 'productos'}`;
  empty.classList.toggle('d-none', sorted.length > 0);

  body.innerHTML = sorted
    .map(
      (product) => `
        <tr>
          <td class="fw-semibold">${escapeHtml(product.name)}</td>
          <td>${escapeHtml(product.sku)}</td>
          <td>${product.category ? escapeHtml(product.category) : '<span class="text-muted">—</span>'}</td>
          <td class="text-end">${formatCurrency(product.price)}</td>
          <td class="text-center">${stockBadge(product.stock)}</td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-primary" data-action="edit-product"
                data-product-id="${escapeHtml(product.id)}">Editar</button>
              <button type="button" class="btn btn-outline-danger" data-action="delete-product"
                data-product-id="${escapeHtml(product.id)}">Eliminar</button>
            </div>
          </td>
        </tr>
      `,
    )
    .join('');
}

export function renderSales(sales) {
  const body = document.getElementById('sales-table-body');
  const empty = document.getElementById('sales-empty');
  const summary = document.getElementById('history-summary');
  if (!body || !empty || !summary) return;

  empty.classList.toggle('d-none', sales.length > 0);

  body.innerHTML = sales
    .map(
      (sale) => `
        <tr>
          <td class="fw-semibold">${saleFolio(sale)}</td>
          <td>${formatDate(sale.createdAt)}</td>
          <td class="text-center">${sale.items.reduce((total, item) => total + item.quantity, 0)}</td>
          <td>${PAYMENT_LABELS[sale.paymentMethod] ?? escapeHtml(sale.paymentMethod)}</td>
          <td class="text-end fw-semibold">${formatCurrency(sale.total)}</td>
          <td class="text-end">
            <button type="button" class="btn btn-sm btn-outline-primary" data-action="view-sale"
              data-sale-id="${escapeHtml(sale.id)}">Ver ticket</button>
          </td>
        </tr>
      `,
    )
    .join('');

  if (sales.length === 0) {
    summary.textContent = 'Sin ventas registradas.';
    return;
  }

  const total = sales.reduce((sum, sale) => sum + sale.total, 0);
  summary.textContent = `${sales.length} ${sales.length === 1 ? 'venta' : 'ventas'} · Total ${formatCurrency(
    total,
  )} · Promedio ${formatCurrency(total / sales.length)}`;
}

export function renderReceipt(sale) {
  const content = document.getElementById('receipt-content');
  if (!content) return;

  const itemRows = sale.items
    .map(
      (item) => `
        <tr>
          <td>
            ${escapeHtml(item.name)}
            <div class="text-muted small">${escapeHtml(item.sku)}</div>
          </td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-end">${formatCurrency(item.lineTotal ?? item.price * item.quantity)}</td>
        </tr>
      `,
    )
    .join('');

  const paymentLabel = PAYMENT_LABELS[sale.paymentMethod] ?? escapeHtml(sale.paymentMethod);
  const change = Number(sale.cashReceived ?? 0) - Number(sale.total);

  content.innerHTML = `
    <div class="text-center mb-3">
      <h3 class="h5 mb-1">Ticket de venta</h3>
      <p class="text-muted small mb-0">${saleFolio(sale)}</p>
      <p class="text-muted small mb-0">${formatDate(sale.createdAt)}</p>
    </div>
    <div class="table-responsive">
      <table class="table table-sm">
        <thead>
          <tr>
            <th scope="col">Producto</th>
            <th scope="col" class="text-center">Cant.</th>
            <th scope="col" class="text-end">Importe</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>
    <dl class="row small mb-0">
      <dt class="col-6 fw-normal">Subtotal</dt>
      <dd class="col-6 text-end">${formatCurrency(sale.subtotal)}</dd>
      <dt class="col-6 fw-normal">Impuesto</dt>
      <dd class="col-6 text-end">${formatCurrency(sale.tax)}</dd>
      <dt class="col-6 fw-bold">Total</dt>
      <dd class="col-6 text-end fw-bold">${formatCurrency(sale.total)}</dd>
      <dt class="col-6 fw-normal">Método de pago</dt>
      <dd class="col-6 text-end">${paymentLabel}</dd>
      ${
        sale.paymentMethod === 'cash'
          ? `
        <dt class="col-6 fw-normal">Efectivo recibido</dt>
        <dd class="col-6 text-end">${formatCurrency(sale.cashReceived ?? 0)}</dd>
        <dt class="col-6 fw-normal">Cambio</dt>
        <dd class="col-6 text-end">${formatCurrency(Math.max(0, change))}</dd>
      `
          : ''
      }
    </dl>
  `;
}

export function showToast(message, variant = 'success') {
  const container = document.getElementById('toast-container');
  if (!container || typeof bootstrap === 'undefined') return;

  const element = document.createElement('div');
  element.className = `toast align-items-center text-bg-${variant} border-0`;
  element.setAttribute('role', 'alert');
  element.setAttribute('aria-live', 'assertive');
  element.setAttribute('aria-atomic', 'true');
  element.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeHtml(message)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
        aria-label="Cerrar"></button>
    </div>
  `;

  container.append(element);
  const toast = new bootstrap.Toast(element, { delay: 3500 });
  element.addEventListener('hidden.bs.toast', () => element.remove());
  toast.show();
}
