const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const longDateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'full',
});

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha inválida' : dateFormatter.format(date);
}

export function formatLongDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : longDateFormatter.format(date);
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function safeImageUrl(value) {
  const url = String(value ?? '').trim();
  if (/^https?:\/\//i.test(url) || /^data:image\//i.test(url)) return url;
  return '';
}

export function toLocalDateInputValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}
