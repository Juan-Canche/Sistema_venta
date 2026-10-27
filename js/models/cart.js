import { roundMoney, toNumber } from '../utils/money.js';

function normalizeItem(item) {
  return {
    productId: item.productId,
    name: item.name,
    sku: item.sku,
    price: Number(item.price),
    stock: Number(item.stock),
    quantity: Math.max(1, Math.trunc(Number(item.quantity))),
  };
}

export class Cart {
  constructor(items = []) {
    this.items = items.map(normalizeItem);
  }

  get isEmpty() {
    return this.items.length === 0;
  }

  get count() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  add(product, quantity = 1) {
    const amount = Math.trunc(toNumber(quantity));
    if (amount <= 0) {
      throw new Error('La cantidad debe ser mayor a cero.');
    }

    const existing = this.items.find((item) => item.productId === product.id);
    const nextQuantity = (existing?.quantity ?? 0) + amount;

    if (nextQuantity > product.stock) {
      throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}.`);
    }

    if (existing) {
      existing.quantity = nextQuantity;
      existing.name = product.name;
      existing.sku = product.sku;
      existing.price = Number(product.price);
      existing.stock = Number(product.stock);
      return;
    }

    this.items.push(
      normalizeItem({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
        quantity: amount,
      }),
    );
  }

  updateQuantity(productId, quantity) {
    const item = this.items.find((entry) => entry.productId === productId);
    if (!item) return;

    const amount = Math.trunc(toNumber(quantity));
    if (amount <= 0) {
      this.remove(productId);
      return;
    }

    if (amount > item.stock) {
      throw new Error(`Stock insuficiente para "${item.name}". Disponible: ${item.stock}.`);
    }

    item.quantity = amount;
  }

  remove(productId) {
    this.items = this.items.filter((item) => item.productId !== productId);
  }

  clear() {
    this.items = [];
  }

  get subtotal() {
    return roundMoney(this.items.reduce((total, item) => total + item.price * item.quantity, 0));
  }

  tax(taxRate) {
    return roundMoney(this.subtotal * (toNumber(taxRate) / 100));
  }

  total(taxRate) {
    return roundMoney(this.subtotal + this.tax(taxRate));
  }

  toJSON() {
    return this.items.map((item) => ({ ...item }));
  }
}
