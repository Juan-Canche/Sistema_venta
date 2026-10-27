import { KEYS, read, write } from './storageService.js';

const DEFAULT_SETTINGS = { taxRate: 16 };
const stored = read(KEYS.settings, {});

const settings = {
  ...DEFAULT_SETTINGS,
  ...(stored && typeof stored === 'object' ? stored : {}),
};

export function getTaxRate() {
  const rate = Number(settings.taxRate);
  return Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : DEFAULT_SETTINGS.taxRate;
}

export function setTaxRate(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new Error('El IVA debe ser un número entre 0 y 100.');
  }

  settings.taxRate = rate;
  write(KEYS.settings, settings);
  return rate;
}
