import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { isMissingToken, normalizeToken } from '../utils/auth'

export function useRiskAlerts(token, clearSession) {
  const [riskAlerts, setRiskAlerts] = useState([])

  const fetchRiskAlerts = useCallback(async () => {
    const normalizedToken = normalizeToken(token)
    if (isMissingToken(normalizedToken)) {
      setRiskAlerts([])
      return
    }

    try {
      const { data } = await api.get('/api/crop/risk-alerts', {
        params: { limit: 5 },
        headers: { Authorization: `Bearer ${normalizedToken}` },
      })
      setRiskAlerts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Risk alerts request failed', err)
      setRiskAlerts([])
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        clearSession()
      }
    }
  }, [token, clearSession])

  useEffect(() => {
    fetchRiskAlerts()
  }, [fetchRiskAlerts])

  return { riskAlerts, fetchRiskAlerts }
}
