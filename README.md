# Sistema de Ventas

Punto de venta web para una sola tienda, construido con HTML5, Bootstrap 5 y JavaScript moderno (módulos ES). No requiere backend: los productos, el carrito, las ventas y la configuración se guardan en `localStorage`.

## Funcionalidades

- CRUD de productos con nombre, SKU, precio, stock, categoría e imagen opcional.
- Búsqueda por nombre/SKU y filtro por categoría.
- Carrito con validación de stock, cantidades, subtotal, IVA configurable y total.
- Cobro en efectivo o tarjeta, cálculo de cambio y ticket imprimible.
- Descuento automático de inventario al confirmar una venta.
- Historial de ventas con filtros por fecha y detalle de ticket.
- Resumen del día: ventas, total, ticket promedio y productos con bajo stock.
- Persistencia local de productos, ventas, carrito e IVA.

## Tecnologías

- HTML5 semántico.
- Bootstrap 5.3 (CDN).
- JavaScript ES2022+ con módulos nativos, `const`/`let`, funciones puras y clases.
- Sin frameworks JS ni jQuery.

## Estructura

```
index.html
css/
  styles.css
js/
  main.js
  models/
    cart.js
    product.js
    sale.js
  services/
    cartService.js
    productService.js
    saleService.js
    settingsService.js
    storageService.js
  ui/
    events.js
    render.js
  utils/
    format.js
    id.js
    money.js
    validators.js
```

La capa `models` contiene las entidades y reglas de cálculo. `services` encapsula persistencia y casos de uso. `ui` renderiza el DOM y conecta los eventos. `utils` agrupa funciones puras reutilizables.

## Ejecución

Los módulos ES no funcionan abriendo `index.html` con `file://`. Sirve el proyecto con cualquier servidor estático:

```bash
python -m http.server 8000
```

Luego abre `http://localhost:8000`.

También puedes usar:

```bash
npx serve .
```

En la primera ejecución se cargan cuatro productos de ejemplo. Si ya existe información guardada, se respeta.

## Datos locales

La información se guarda bajo las claves `sistema-venta:*` en `localStorage`. Para reiniciar el sistema desde la consola del navegador:

```js
localStorage.clear();
location.reload();
```

## Refactorización

- Las funciones de renderizado solo construyen HTML; los eventos no contienen reglas de negocio.
- Los cálculos monetarios se centralizan en `Cart`, `Sale` y `utils/money.js`.
- Las validaciones de formulario viven en `utils/validators.js`.
- La persistencia está aislada en `storageService.js`.
- Los servicios devuelven copias (`toJSON`) para evitar mutaciones externas del estado.
