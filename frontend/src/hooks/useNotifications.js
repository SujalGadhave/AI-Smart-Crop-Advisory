import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { isMissingToken, normalizeToken } from '../utils/auth'

export function useNotifications(token, clearSession) {
  const [notifications, setNotifications] = useState([])

  const fetchNotifications = useCallback(async () => {
    const normalizedToken = normalizeToken(token)
    if (isMissingToken(normalizedToken)) {
      setNotifications([])
      return
    }

    try {
      const { data } = await api.get('/api/notifications', {
        params: { limit: 10 },
        headers: { Authorization: `Bearer ${normalizedToken}` },
      })
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Notifications request failed', err)
      setNotifications([])
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        clearSession()
      }
    }
  }, [token, clearSession])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = useCallback(async (notificationId) => {
    const normalizedToken = normalizeToken(token)
    if (isMissingToken(normalizedToken)) {
      return
    }

    try {
      await api.patch(
        `/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${normalizedToken}` } }
      )
      fetchNotifications()
    } catch (err) {
      console.error('Notification read update failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        clearSession()
      }
    }
  }, [token, fetchNotifications, clearSession])

  const markAllAsRead = useCallback(async () => {
    const normalizedToken = normalizeToken(token)
    if (isMissingToken(normalizedToken)) {
      return
    }

    try {
      await api.patch(
        '/api/notifications/read-all',
        {},
        { headers: { Authorization: `Bearer ${normalizedToken}` } }
      )
      fetchNotifications()
    } catch (err) {
      console.error('Mark all notifications read failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        clearSession()
      }
    }
  }, [token, fetchNotifications, clearSession])

  return {
    notifications,
    setNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
