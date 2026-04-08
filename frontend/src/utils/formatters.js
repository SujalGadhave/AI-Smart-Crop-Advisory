import { t } from '../translations'
import { CROP_LABEL_KEYS, LOCALE_BY_LANGUAGE } from './constants'

export function getCropLabel(lang, cropValue) {
  return t(lang, CROP_LABEL_KEYS[cropValue] || cropValue)
}

export function formatLocalizedDateTime(value, lang) {
  if (!value) {
    return '--'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  return date.toLocaleString(LOCALE_BY_LANGUAGE[lang] || 'en-IN')
}

export function formatLocalizedCurrency(value, lang) {
  if (!Number.isFinite(value)) {
    return '--'
  }
  return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[lang] || 'en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}
