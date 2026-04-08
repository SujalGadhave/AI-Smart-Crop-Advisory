import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { isMissingToken, normalizeToken } from '../utils/auth'

export function useMarketAlerts(token, clearSession) {
  const [marketAlerts, setMarketAlerts] = useState([])

  const fetchMarketAlerts = useCallback(async () => {
    const normalizedToken = normalizeToken(token)
    if (isMissingToken(normalizedToken)) {
      setMarketAlerts([])
      return
    }

    try {
      const { data } = await api.get('/api/market/alerts', {
        params: { limit: 20 },
        headers: { Authorization: `Bearer ${normalizedToken}` },
      })
      setMarketAlerts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Market alerts request failed', err)
      setMarketAlerts([])
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        clearSession()
      }
    }
  }, [token, clearSession])

  useEffect(() => {
    fetchMarketAlerts()
  }, [fetchMarketAlerts])

  const createAlert = useCallback(async ({ cropType, city, targetPrice, direction }) => {
    const normalizedToken = normalizeToken(token)
    await api.post(
      '/api/market/alerts',
      { cropType, city, targetPrice, direction },
      { headers: { Authorization: `Bearer ${normalizedToken}` } }
    )
  }, [token])

  const deleteAlert = useCallback(async (alertId) => {
    const normalizedToken = normalizeToken(token)
    await api.delete(`/api/market/alerts/${alertId}`, {
      headers: { Authorization: `Bearer ${normalizedToken}` },
    })
  }, [token])

  const triggeredAlerts = useMemo(() => marketAlerts.filter((alert) => Boolean(alert?.triggered)), [marketAlerts])

  return {
    marketAlerts,
    triggeredAlerts,
    fetchMarketAlerts,
    createAlert,
    deleteAlert,
  }
}
