import { Sale } from '../models/sale.js';
import { roundMoney } from '../utils/money.js';
import { decrementStock, getProduct } from './productService.js';
import { KEYS, read, write } from './storageService.js';

const PAYMENT_METHODS = new Set(['cash', 'card']);

let sales = null;

function ensureLoaded() {
  if (sales) return;
  const stored = read(KEYS.sales, []);
  sales = Array.isArray(stored) ? stored.map(Sale.from) : [];
}

function persist() {
  write(
    KEYS.sales,
    sales.map((sale) => sale.toJSON()),
  );
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('El carrito está vacío.');
  }

  return items.map((item) => {
    const product = getProduct(item.productId);
    if (!product) {
      throw new Error(`El producto "${item.name}" ya no existe.`);
    }

    const quantity = Math.trunc(Number(item.quantity));
    if (quantity <= 0) {
      throw new Error(`La cantidad de "${product.name}" debe ser mayor a cero.`);
    }

    if (quantity > product.stock) {
      throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}.`);
    }

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity,
      lineTotal: roundMoney(product.price * quantity),
    };
  });
}

export function listSales() {
  ensureLoaded();
  return [...sales]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((sale) => sale.toJSON());
}

export function checkout({ items, taxRate, paymentMethod = 'cash', cashReceived = null }) {
  ensureLoaded();

  if (!PAYMENT_METHODS.has(paymentMethod)) {
    throw new Error('Método de pago no válido.');
  }

  const validatedItems = validateItems(items);
  const subtotal = roundMoney(
    validatedItems.reduce((total, item) => total + item.lineTotal, 0),
  );
  const rate = Number(taxRate);
  const tax = roundMoney(subtotal * ((Number.isFinite(rate) ? rate : 0) / 100));
  const total = roundMoney(subtotal + tax);

  let received = null;
  if (paymentMethod === 'cash') {
    received = Number(cashReceived);
    if (!Number.isFinite(received) || received < total) {
      throw new Error('El efectivo recibido no cubre el total de la venta.');
    }
  }

  validatedItems.forEach((item) => decrementStock(item.productId, item.quantity));

  const sale = Sale.create({
    items: validatedItems,
    subtotal,
    tax,
    total,
    paymentMethod,
    cashReceived: received,
  });

  sales.unshift(sale);
  persist();
  return sale.toJSON();
}

export function getTodayStats(referenceDate = new Date()) {
  ensureLoaded();

  const todaysSales = sales.filter((sale) => {
    const date = new Date(sale.createdAt);
    return (
      date.getFullYear() === referenceDate.getFullYear() &&
      date.getMonth() === referenceDate.getMonth() &&
      date.getDate() === referenceDate.getDate()
    );
  });

  const total = roundMoney(todaysSales.reduce((sum, sale) => sum + sale.total, 0));

  return {
    count: todaysSales.length,
    total,
    average: todaysSales.length > 0 ? roundMoney(total / todaysSales.length) : 0,
  };
}
