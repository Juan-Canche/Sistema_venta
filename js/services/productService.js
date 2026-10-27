import { Product } from '../models/product.js';
import { KEYS, read, write } from './storageService.js';

const SAMPLE_PRODUCTS = [
  {
    name: 'Café americano',
    sku: 'CAF-001',
    price: 35,
    stock: 20,
    category: 'Bebidas',
    image: '',
  },
  {
    name: 'Sándwich de pollo',
    sku: 'SAN-001',
    price: 65,
    stock: 12,
    category: 'Alimentos',
    image: '',
  },
  {
    name: 'Jugo de naranja',
    sku: 'JUG-001',
    price: 40,
    stock: 8,
    category: 'Bebidas',
    image: '',
  },
  {
    name: 'Brownie',
    sku: 'POS-001',
    price: 45,
    stock: 5,
    category: 'Postres',
    image: '',
  },
];

let products = null;

function ensureLoaded() {
  if (products) return;

  const stored = read(KEYS.products, null);
  if (Array.isArray(stored)) {
    products = stored.map(Product.from);
    return;
  }

  products = SAMPLE_PRODUCTS.map((data) => Product.create(data));
  persist();
}

function persist() {
  write(
    KEYS.products,
    products.map((product) => product.toJSON()),
  );
}

function findProduct(id) {
  ensureLoaded();
  return products.find((product) => product.id === id) ?? null;
}

export function listProducts() {
  ensureLoaded();
  return products.map((product) => product.toJSON());
}

export function getProduct(id) {
  const product = findProduct(id);
  return product ? product.toJSON() : null;
}

export function createProduct(data) {
  ensureLoaded();
  const product = Product.create(data);
  products.push(product);
  persist();
  return product.toJSON();
}

export function updateProduct(id, data) {
  const product = findProduct(id);
  if (!product) throw new Error('El producto no existe.');

  product.name = data.name;
  product.sku = data.sku;
  product.price = Number(data.price);
  product.stock = Number(data.stock);
  product.category = data.category;
  product.image = data.image;
  persist();
  return product.toJSON();
}

export function deleteProduct(id) {
  ensureLoaded();
  const initialLength = products.length;
  products = products.filter((product) => product.id !== id);
  if (products.length === initialLength) return false;
  persist();
  return true;
}

export function decrementStock(id, quantity) {
  const product = findProduct(id);
  if (!product) throw new Error('El producto ya no existe.');

  const amount = Math.trunc(Number(quantity));
  if (amount <= 0) throw new Error('La cantidad a descontar debe ser mayor a cero.');
  if (product.stock < amount) {
    throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}.`);
  }

  product.stock -= amount;
  persist();
  return product.toJSON();
}

export function getLowStockProducts(threshold = 5) {
  ensureLoaded();
  return products
    .map((product) => product.toJSON())
    .filter((product) => product.stock <= threshold)
    .sort((a, b) => a.stock - b.stock);
}
