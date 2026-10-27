export function normalizeText(value) {
  return String(value ?? '').trim();
}

export function isValidPrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0;
}

export function isValidStock(value) {
  const stock = Number(value);
  return Number.isInteger(stock) && stock >= 0;
}

export function validateProduct(data, products, currentId = null) {
  const errors = {};
  const name = normalizeText(data.name);
  const sku = normalizeText(data.sku).toUpperCase();
  const price = Number(data.price);
  const stock = Number(data.stock);

  if (!name) {
    errors.name = 'El nombre es obligatorio.';
  }

  if (!sku) {
    errors.sku = 'El SKU es obligatorio.';
  } else if (products.some((product) => product.id !== currentId && product.sku.toUpperCase() === sku)) {
    errors.sku = 'El SKU ya está registrado en otro producto.';
  }

  if (!isValidPrice(price)) {
    errors.price = 'El precio debe ser un número mayor o igual a 0.';
  }

  if (!isValidStock(stock)) {
    errors.stock = 'El stock debe ser un entero mayor o igual a 0.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      sku,
      price,
      stock,
      category: normalizeText(data.category),
      image: normalizeText(data.image),
    },
  };
}
