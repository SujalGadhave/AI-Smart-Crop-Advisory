export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') {
    return null
  }
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(base64 + padding))
  } catch {
    return null
  }
}

export function parseStoredUser() {
  const stored = localStorage.getItem('km_user')
  if (!stored) {
    return null
  }
  try {
    return JSON.parse(stored)
  } catch {
    localStorage.removeItem('km_user')
    return null
  }
}

export function parseMarketNotificationPayload(notification) {
  if (!notification || notification.type !== 'MARKET_ALERT' || notification.title !== 'MARKET_ALERT_TRIGGERED') {
    return null
  }

  const parts = String(notification.message || '').split('|')
  if (parts.length !== 5) {
    return null
  }

  const [cropType, city, direction, currentPriceRaw, targetPriceRaw] = parts
  const currentPrice = Number(currentPriceRaw)
  const targetPrice = Number(targetPriceRaw)
  if (!Number.isFinite(currentPrice) || !Number.isFinite(targetPrice)) {
    return null
  }

  return {
    cropType,
    city,
    direction,
    currentPrice,
    targetPrice,
  }
}
