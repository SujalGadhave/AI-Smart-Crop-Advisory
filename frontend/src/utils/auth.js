export function normalizeToken(token) {
  return typeof token === 'string' ? token.trim() : ''
}

export function isMissingToken(token) {
  const normalizedToken = normalizeToken(token)
  return !normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null'
}

export function storeSession(token, user) {
  localStorage.setItem('km_token', token)
  localStorage.setItem('km_user', JSON.stringify(user))
}

export function clearStoredSession() {
  localStorage.removeItem('km_token')
  localStorage.removeItem('km_user')
}
