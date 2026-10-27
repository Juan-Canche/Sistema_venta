import { createId } from '../utils/id.js';

export class Product {
  constructor({ id, name, sku, price, stock, category = '', image = '' }) {
    this.id = id;
    this.name = name;
    this.sku = sku;
    this.price = Number(price);
    this.stock = Number(stock);
    this.category = category;
    this.image = image;
  }

  static create(data) {
    return new Product({ ...data, id: data.id ?? createId('prod') });
  }

  static from(data) {
    return Product.create(data);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      sku: this.sku,
      price: this.price,
      stock: this.stock,
      category: this.category,
      image: this.image,
    };
  }
}
