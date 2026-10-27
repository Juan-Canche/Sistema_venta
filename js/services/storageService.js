const PREFIX = 'sistema-venta';

export const KEYS = Object.freeze({
  products: `${PREFIX}:products`,
  sales: `${PREFIX}:sales`,
  cart: `${PREFIX}:cart`,
  settings: `${PREFIX}:settings`,
});

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`No se pudo leer el almacenamiento "${key}".`, error);
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`No se pudo guardar el almacenamiento "${key}".`, error);
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`No se pudo eliminar el almacenamiento "${key}".`, error);
  }
}
