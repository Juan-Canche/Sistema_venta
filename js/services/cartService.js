import { Cart } from '../models/cart.js';
import { KEYS, read, write } from './storageService.js';

let cart = new Cart(read(KEYS.cart, []));

function persist() {
  write(KEYS.cart, cart.toJSON());
}

export function getCart() {
  return cart;
}

export function addToCart(product, quantity = 1) {
  cart.add(product, quantity);
  persist();
}

export function changeQuantity(productId, quantity) {
  cart.updateQuantity(productId, quantity);
  persist();
}

export function removeFromCart(productId) {
  cart.remove(productId);
  persist();
}

export function clearCart() {
  cart.clear();
  persist();
}
