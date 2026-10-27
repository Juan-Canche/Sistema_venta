import {
  addToCart,
  changeQuantity,
  clearCart,
  getCart,
  removeFromCart,
} from '../services/cartService.js';
import {
  createProduct,
  deleteProduct,
  getLowStockProducts,
  getProduct,
  listProducts,
  updateProduct,
} from '../services/productService.js';
import { checkout, getTodayStats, listSales } from '../services/saleService.js';
import { getTaxRate, setTaxRate } from '../services/settingsService.js';
import { escapeHtml, formatLongDate } from '../utils/format.js';
import { validateProduct } from '../utils/validators.js';
import {
  renderCart,
  renderCatalog,
  renderCategoryOptions,
  renderDashboard,
  renderProductsTable,
  renderReceipt,
  renderSales,
  showToast,
} from './render.js';

const PRODUCT_FIELDS = {
  name: 'product-name',
  sku: 'product-sku',
  price: 'product-price',
  stock: 'product-stock',
};

const state = {
  editingProductId: null,
  catalog: { search: '', category: '' },
  history: { from: '', to: '' },
  receiptModal: null,
};

let productForm;

export function initApp() {
  productForm = document.getElementById('product-form');
  bindEvents();

  const dateLabel = document.getElementById('nav-date');
  if (dateLabel) dateLabel.textContent = formatLongDate(new Date());

  renderAll();
}

function bindEvents() {
  productForm.addEventListener('submit', handleProductSubmit);
  productForm.addEventListener('input', handleProductFieldInput);

  document.getElementById('product-cancel').addEventListener('click', resetProductForm);
  document.getElementById('catalog-search').addEventListener('input', (event) => {
    state.catalog.search = event.target.value;
    renderCatalog(listProducts(), state.catalog);
  });
  document.getElementById('catalog-category').addEventListener('change', (event) => {
    state.catalog.category = event.target.value;
    renderCatalog(listProducts(), state.catalog);
  });

  document.getElementById('clear-cart').addEventListener('click', handleClearCart);
  document.getElementById('checkout-button').addEventListener('click', handleCheckout);
  document.getElementById('tax-rate').addEventListener('change', handleTaxRateChange);
  document.getElementById('payment-method').addEventListener('change', () => {
    renderCart(getCart(), getTaxRate());
  });
  document.getElementById('cash-received').addEventListener('input', () => {
    renderCart(getCart(), getTaxRate());
  });

  document.getElementById('history-from').addEventListener('change', (event) => {
    state.history.from = event.target.value;
    renderHistory();
  });
  document.getElementById('history-to').addEventListener('change', (event) => {
    state.history.to = event.target.value;
    renderHistory();
  });
  document.getElementById('history-clear').addEventListener('click', handleClearHistoryFilters);
  document.getElementById('print-receipt').addEventListener('click', () => window.print());

  document.addEventListener('click', handleDelegatedClick);
}

function handleDelegatedClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const { action, productId, saleId } = button.dataset;

  switch (action) {
    case 'add-to-cart':
      handleAddToCart(productId);
      break;
    case 'increase-quantity':
      handleQuantityChange(productId, 1);
      break;
    case 'decrease-quantity':
      handleQuantityChange(productId, -1);
      break;
    case 'remove-from-cart':
      removeFromCart(productId);
      renderCart(getCart(), getTaxRate());
      break;
    case 'edit-product':
      startEditingProduct(productId);
      break;
    case 'delete-product':
      handleDeleteProduct(productId);
      break;
    case 'view-sale':
      handleViewSale(saleId);
      break;
    default:
      break;
  }
}

function handleProductSubmit(event) {
  event.preventDefault();

  const data = {
    name: document.getElementById('product-name').value,
    sku: document.getElementById('product-sku').value,
    price: document.getElementById('product-price').value,
    stock: document.getElementById('product-stock').value,
    category: document.getElementById('product-category').value,
    image: document.getElementById('product-image').value,
  };

  const result = validateProduct(data, listProducts(), state.editingProductId);
  clearProductErrors();

  if (!result.valid) {
    showProductErrors(result.errors);
    return;
  }

  try {
    if (state.editingProductId) {
      updateProduct(state.editingProductId, result.data);
      showToast('Producto actualizado correctamente.');
    } else {
      createProduct(result.data);
      showToast('Producto creado correctamente.');
    }

    resetProductForm();
    renderAll();
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

function handleProductFieldInput(event) {
  const fieldId = Object.values(PRODUCT_FIELDS).find((id) => id === event.target.id);
  if (fieldId) event.target.classList.remove('is-invalid');
}

function handleAddToCart(productId) {
  const product = getProduct(productId);
  if (!product) {
    showToast('El producto ya no existe.', 'danger');
    return;
  }

  try {
    addToCart(product, 1);
    renderCart(getCart(), getTaxRate());
    showToast(`"${product.name}" agregado al carrito.`);
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

function handleQuantityChange(productId, delta) {
  const cart = getCart();
  const item = cart.items.find((entry) => entry.productId === productId);
  if (!item) return;

  try {
    changeQuantity(productId, item.quantity + delta);
    renderCart(cart, getTaxRate());
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

function handleClearCart() {
  if (getCart().isEmpty) return;
  if (!window.confirm('¿Vaciar el carrito?')) return;

  clearCart();
  renderCart(getCart(), getTaxRate());
  showToast('Carrito vaciado.');
}

function handleCheckout() {
  const cart = getCart();

  try {
    const sale = checkout({
      items: cart.toJSON(),
      taxRate: getTaxRate(),
      paymentMethod: document.getElementById('payment-method').value,
      cashReceived: document.getElementById('cash-received').value,
    });

    clearCart();
    document.getElementById('cash-received').value = '';
    renderAll();
    showReceipt(sale);
    showToast('Venta registrada correctamente.');
  } catch (error) {
    showToast(error.message, 'danger');
  }
}

function handleTaxRateChange(event) {
  const input = event.target;

  try {
    const rate = setTaxRate(input.value);
    renderCart(getCart(), rate);
  } catch (error) {
    showToast(error.message, 'danger');
    input.value = String(getTaxRate());
  }
}

function handleDeleteProduct(productId) {
  const product = getProduct(productId);
  if (!product) return;

  const confirmed = window.confirm(
    `¿Eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`,
  );
  if (!confirmed) return;

  deleteProduct(productId);
  removeFromCart(productId);

  if (state.editingProductId === productId) {
    resetProductForm();
  }

  renderAll();
  showToast('Producto eliminado.');
}

function startEditingProduct(productId) {
  const product = getProduct(productId);
  if (!product) {
    showToast('El producto ya no existe.', 'danger');
    return;
  }

  state.editingProductId = productId;
  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-sku').value = product.sku;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-stock').value = product.stock;
  document.getElementById('product-category').value = product.category;
  document.getElementById('product-image').value = product.image;
  document.getElementById('product-form-title').textContent = 'Editar producto';
  document.getElementById('product-submit').textContent = 'Actualizar producto';
  document.getElementById('product-cancel').classList.remove('d-none');
  clearProductErrors();

  bootstrap.Tab.getOrCreateInstance(document.getElementById('tab-products')).show();
  productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('product-name').focus({ preventScroll: true });
}

function resetProductForm() {
  if (!productForm) return;

  productForm.reset();
  state.editingProductId = null;
  document.getElementById('product-id').value = '';
  document.getElementById('product-form-title').textContent = 'Nuevo producto';
  document.getElementById('product-submit').textContent = 'Guardar producto';
  document.getElementById('product-cancel').classList.add('d-none');
  clearProductErrors();
}

function showProductErrors(errors) {
  const container = document.getElementById('product-form-errors');
  const messages = Object.values(errors);

  container.innerHTML = `<ul class="mb-0">${messages
    .map((message) => `<li>${escapeHtml(message)}</li>`)
    .join('')}</ul>`;
  container.classList.remove('d-none');

  Object.keys(errors).forEach((field) => {
    document.getElementById(PRODUCT_FIELDS[field])?.classList.add('is-invalid');
  });
}

function clearProductErrors() {
  const container = document.getElementById('product-form-errors');
  container.classList.add('d-none');
  container.innerHTML = '';
  Object.values(PRODUCT_FIELDS).forEach((fieldId) => {
    document.getElementById(fieldId)?.classList.remove('is-invalid');
  });
}

function handleViewSale(saleId) {
  const sale = listSales().find((entry) => entry.id === saleId);
  if (!sale) {
    showToast('La venta no existe.', 'danger');
    return;
  }

  showReceipt(sale);
}

function showReceipt(sale) {
  renderReceipt(sale);

  if (!state.receiptModal) {
    state.receiptModal = new bootstrap.Modal(document.getElementById('receipt-modal'));
  }

  state.receiptModal.show();
}

function handleClearHistoryFilters() {
  state.history.from = '';
  state.history.to = '';
  document.getElementById('history-from').value = '';
  document.getElementById('history-to').value = '';
  renderHistory();
}

function filterSales(sales) {
  const { from, to } = state.history;
  const start = from ? new Date(`${from}T00:00:00`) : null;
  const end = to ? new Date(`${to}T23:59:59.999`) : null;

  return sales.filter((sale) => {
    const date = new Date(sale.createdAt);
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}

function renderHistory() {
  renderSales(filterSales(listSales()));
}

function renderAll() {
  const products = listProducts();
  const categories = new Set(products.map((product) => product.category).filter(Boolean));

  if (state.catalog.category && !categories.has(state.catalog.category)) {
    state.catalog.category = '';
  }

  renderDashboard({ stats: getTodayStats(), lowStock: getLowStockProducts() });
  renderCategoryOptions(products, state.catalog.category);
  renderCatalog(products, state.catalog);
  renderCart(getCart(), getTaxRate());
  renderProductsTable(products);
  renderHistory();
}
