import { isMissingToken, normalizeToken } from './auth'

export function validateAuthToken(token) {
  if (isMissingToken(token)) {
    return { valid: false, normalizedToken: '', reason: 'missing-token' }
  }
  return { valid: true, normalizedToken: normalizeToken(token) }
}

export function validateUploadFile(file) {
  if (!file) {
    return { valid: false, reason: 'missing-file' }
  }
  if (!file.type.startsWith('image/')) {
    return { valid: false, reason: 'invalid-file-type' }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, reason: 'file-too-large' }
  }
  return { valid: true }
}

export function validateMarketTargetPrice(value) {
  const targetPrice = Number(value)
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
    return { valid: false, targetPrice }
  }
  return { valid: true, targetPrice }
}
