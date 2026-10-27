import { createId } from '../utils/id.js';

function normalizeItem(item) {
  return {
    productId: item.productId,
    name: item.name,
    sku: item.sku,
    price: Number(item.price),
    quantity: Math.trunc(Number(item.quantity)),
    lineTotal: Number(item.lineTotal ?? item.price * item.quantity),
  };
}

export class Sale {
  constructor({
    id,
    items = [],
    subtotal,
    tax,
    total,
    paymentMethod = 'cash',
    cashReceived = null,
    createdAt,
  }) {
    this.id = id;
    this.items = items.map(normalizeItem);
    this.subtotal = Number(subtotal);
    this.tax = Number(tax);
    this.total = Number(total);
    this.paymentMethod = paymentMethod;
    this.cashReceived = cashReceived === null ? null : Number(cashReceived);
    this.createdAt = createdAt;
  }

  static create(data) {
    return new Sale({
      ...data,
      id: data.id ?? createId('sale'),
      createdAt: data.createdAt ?? new Date().toISOString(),
    });
  }

  static from(data) {
    return Sale.create(data);
  }

  get itemCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  get change() {
    if (this.paymentMethod !== 'cash' || this.cashReceived === null) return 0;
    return Math.max(0, this.cashReceived - this.total);
  }

  toJSON() {
    return {
      id: this.id,
      items: this.items.map((item) => ({ ...item })),
      subtotal: this.subtotal,
      tax: this.tax,
      total: this.total,
      paymentMethod: this.paymentMethod,
      cashReceived: this.cashReceived,
      createdAt: this.createdAt,
    };
  }
}
