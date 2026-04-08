import { useCallback, useEffect, useState } from 'react'
import { clearStoredSession } from '../utils/auth'
import { decodeJwtPayload, parseStoredUser } from '../utils/parsers'

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('km_token') || '')
  const [user, setUser] = useState(() => parseStoredUser())

  const clearSession = useCallback(() => {
    setToken('')
    setUser(null)
    clearStoredSession()
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }
    const payload = decodeJwtPayload(token)
    const expiresAtMs = payload?.exp ? payload.exp * 1000 : 0
    if (!payload || (expiresAtMs > 0 && Date.now() >= expiresAtMs)) {
      const timeoutId = window.setTimeout(() => {
        clearSession()
      }, 0)
      return () => window.clearTimeout(timeoutId)
    }

    if (expiresAtMs > 0) {
      const timeoutMs = Math.max(0, expiresAtMs - Date.now())
      const timeoutId = window.setTimeout(() => {
        clearSession()
      }, timeoutMs)
      return () => window.clearTimeout(timeoutId)
    }
  }, [token, clearSession])

  return {
    token,
    user,
    setToken,
    setUser,
    clearSession,
    isAuthenticated: Boolean(token),
  }
}
