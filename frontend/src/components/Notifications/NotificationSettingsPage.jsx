import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'
import { t } from '../../translations'
import { formatLocalizedDateTime } from '../../utils/formatters'
import DeliveryHistory from './DeliveryHistory'
import DiagnosticsPanel from './DiagnosticsPanel'
import PreferencesForm from './PreferencesForm'
import ProviderPolicy from './ProviderPolicy'

function NotificationSettingsPage({ lang, token, onAuthFailure }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [preferences, setPreferences] = useState({
    inAppEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
    pushEnabled: false,
    smsNumber: '',
    whatsappNumber: '',
    pushToken: '',
    updatedAt: null,
  })
  const [deliveryHistory, setDeliveryHistory] = useState([])
  const [lastHistoryRefreshAt, setLastHistoryRefreshAt] = useState(null)
  const [providerPolicy, setProviderPolicy] = useState([])
  const [lastPolicyRefreshAt, setLastPolicyRefreshAt] = useState(null)
  const [diagnostics, setDiagnostics] = useState(null)
  const [lastDiagnosticsRefreshAt, setLastDiagnosticsRefreshAt] = useState(null)
  const [retryingAttemptId, setRetryingAttemptId] = useState(null)
  const [highlightedRetryAttemptId, setHighlightedRetryAttemptId] = useState(null)

  const normalizedToken = typeof token === 'string' ? token.trim() : ''
  const formatDateTime = (value) => formatLocalizedDateTime(value, lang)

  const maskSensitiveValue = (channel, value) => {
    if (!value || typeof value !== 'string') {
      return ''
    }

    const trimmed = value.trim()
    if (!trimmed) {
      return ''
    }

    if (channel === 'PUSH') {
      if (trimmed.length <= 8) {
        return '*'.repeat(trimmed.length)
      }
      return `${trimmed.slice(0, 4)}${'*'.repeat(Math.max(0, trimmed.length - 8))}${trimmed.slice(-4)}`
    }

    const visibleSuffix = 3
    const prefix = trimmed.startsWith('+') ? '+' : ''
    const digitsOnly = trimmed.replace(/\D/g, '')
    if (digitsOnly.length <= visibleSuffix) {
      return `${prefix}${'*'.repeat(digitsOnly.length)}`
    }

    const maskedCore = '*'.repeat(Math.max(0, digitsOnly.length - visibleSuffix))
    const suffix = digitsOnly.slice(-visibleSuffix)
    return `${prefix}${maskedCore}${suffix}`
  }

  const loadDeliveryHistory = useCallback(async (silent = false) => {
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      setDeliveryHistory([])
      return
    }

    try {
      const { data } = await api.get('/api/notifications/delivery-history', {
        params: { limit: 20 },
        headers: { Authorization: `Bearer ${normalizedToken}` },
      })
      setDeliveryHistory(Array.isArray(data) ? data : [])
      setLastHistoryRefreshAt(new Date().toISOString())
    } catch (err) {
      console.error('Notification delivery history request failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        if (!silent) {
          setStatus(t(lang, 'timelineSessionExpired'))
        }
        onAuthFailure?.()
      } else if (!silent) {
        setStatus(t(lang, 'notificationsSettingsLoadFailed'))
      }
    }
  }, [lang, normalizedToken, onAuthFailure])

  const loadProviderPolicy = useCallback(async (silent = false) => {
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      setProviderPolicy([])
      return
    }

    try {
      const { data } = await api.get('/api/notifications/provider-policy', {
        headers: { Authorization: `Bearer ${normalizedToken}` },
      })
      setProviderPolicy(Array.isArray(data) ? data : [])
      setLastPolicyRefreshAt(new Date().toISOString())
    } catch (err) {
      console.error('Notification provider policy request failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        if (!silent) {
          setStatus(t(lang, 'timelineSessionExpired'))
        }
        onAuthFailure?.()
      } else if (!silent) {
        setStatus(t(lang, 'notificationsSettingsLoadFailed'))
      }
    }
  }, [lang, normalizedToken, onAuthFailure])

  const loadDiagnostics = useCallback(async (silent = false) => {
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      setDiagnostics(null)
      return
    }

    try {
      const { data } = await api.get('/api/notifications/diagnostics', {
        params: { windowDays: 7 },
        headers: { Authorization: `Bearer ${normalizedToken}` },
      })
      setDiagnostics(data || null)
      setLastDiagnosticsRefreshAt(new Date().toISOString())
    } catch (err) {
      console.error('Notification diagnostics request failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        if (!silent) {
          setStatus(t(lang, 'timelineSessionExpired'))
        }
        onAuthFailure?.()
      } else if (!silent) {
        setStatus(t(lang, 'notificationsSettingsLoadFailed'))
      }
    }
  }, [lang, normalizedToken, onAuthFailure])

  const loadSettings = useCallback(async () => {
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      setLoading(false)
      setStatus(t(lang, 'timelineLoginRequired'))
      setDeliveryHistory([])
      return
    }

    setLoading(true)
    setStatus('')

    try {
      const preferencesResponse = await api.get('/api/notifications/preferences', {
        headers: { Authorization: `Bearer ${normalizedToken}` },
      })

      setPreferences((prev) => ({
        ...prev,
        ...preferencesResponse.data,
      }))
      await Promise.all([
        loadDeliveryHistory(true),
        loadProviderPolicy(true),
        loadDiagnostics(true),
      ])
    } catch (err) {
      console.error('Notification settings request failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        setStatus(t(lang, 'timelineSessionExpired'))
        onAuthFailure?.()
      } else {
        setStatus(t(lang, 'notificationsSettingsLoadFailed'))
      }
    } finally {
      setLoading(false)
    }
  }, [lang, normalizedToken, onAuthFailure, loadDeliveryHistory, loadProviderPolicy, loadDiagnostics])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      loadDeliveryHistory(true)
      loadProviderPolicy(true)
      loadDiagnostics(true)
    }, 20000)

    return () => window.clearInterval(intervalId)
  }, [normalizedToken, loadDeliveryHistory, loadProviderPolicy, loadDiagnostics])

  useEffect(() => {
    if (!highlightedRetryAttemptId) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedRetryAttemptId(null)
    }, 8000)

    return () => window.clearTimeout(timeoutId)
  }, [highlightedRetryAttemptId])

  const savePreferences = async (event) => {
    event.preventDefault()
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      setStatus(t(lang, 'timelineLoginRequired'))
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const payload = {
        inAppEnabled: Boolean(preferences.inAppEnabled),
        smsEnabled: Boolean(preferences.smsEnabled),
        whatsappEnabled: Boolean(preferences.whatsappEnabled),
        pushEnabled: Boolean(preferences.pushEnabled),
        smsNumber: preferences.smsNumber || '',
        whatsappNumber: preferences.whatsappNumber || '',
        pushToken: preferences.pushToken || '',
      }

      const { data } = await api.put('/api/notifications/preferences', payload, {
        headers: { Authorization: `Bearer ${normalizedToken}` },
      })
      setPreferences((prev) => ({ ...prev, ...data }))
      setStatus(t(lang, 'notificationsSettingsSaved'))
      await loadSettings()
    } catch (err) {
      console.error('Notification settings save failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        setStatus(t(lang, 'timelineSessionExpired'))
        onAuthFailure?.()
      } else {
        const serverMessage = err?.response?.data?.message
        setStatus(serverMessage || t(lang, 'notificationsSettingsLoadFailed'))
      }
    } finally {
      setSaving(false)
    }
  }

  const retryDeliveryAttempt = async (attemptId) => {
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      setStatus(t(lang, 'timelineLoginRequired'))
      return
    }

    setRetryingAttemptId(attemptId)
    setStatus('')
    try {
      const { data } = await api.post(`/api/notifications/delivery-history/${attemptId}/retry`, null, {
        headers: { Authorization: `Bearer ${normalizedToken}` },
      })
      if (data?.attemptId != null) {
        setHighlightedRetryAttemptId(data.attemptId)
        setDeliveryHistory((previous) => {
          const withoutAttempt = previous.filter((item) => item.attemptId !== data.attemptId)
          return [data, ...withoutAttempt]
        })
      }
      setStatus(t(lang, 'notificationsSettingsRetrySuccess'))
      await Promise.all([
        loadDeliveryHistory(true),
        loadProviderPolicy(true),
        loadDiagnostics(true),
      ])
    } catch (err) {
      console.error('Notification delivery retry failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        setStatus(t(lang, 'timelineSessionExpired'))
        onAuthFailure?.()
      } else {
        const serverMessage = err?.response?.data?.message
        setStatus(serverMessage || t(lang, 'notificationsSettingsRetryFailed'))
      }
    } finally {
      setRetryingAttemptId(null)
    }
  }

  const updateField = (field) => (event) => {
    const { value } = event.target
    setPreferences((prev) => ({ ...prev, [field]: value }))
  }

  const updateToggle = (field) => (event) => {
    const { checked } = event.target
    setPreferences((prev) => ({ ...prev, [field]: checked }))
  }

  const statusTone = (statusValue) => {
    if (statusValue === 'DELIVERED') {
      return 'bg-emerald-600 text-white'
    }
    if (statusValue === 'SKIPPED') {
      return 'bg-amber-600 text-white'
    }
    return 'bg-rose-600 text-white'
  }

  const channelLabel = (channel) => {
    if (channel === 'SMS') return t(lang, 'notificationsSettingsSms')
    if (channel === 'WHATSAPP') return t(lang, 'notificationsSettingsWhatsapp')
    if (channel === 'PUSH') return t(lang, 'notificationsSettingsPush')
    return channel
  }

  const diagnosticsTrendWidth = (failedCount, totalCount) => {
    if (!totalCount || totalCount <= 0) {
      return 0
    }
    return Math.max(6, Math.round((failedCount / totalCount) * 100))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 km-fade-up">
      <div className="lg:col-span-2 bg-slate-900 p-6 km-card">
        <h2 className="text-2xl font-semibold">{t(lang, 'notificationsSettingsTitle')}</h2>
        <p className="text-slate-400 text-sm mt-1">{t(lang, 'notificationsSettingsSubtitle')}</p>

        {loading ? (
          <p className="text-slate-300 text-sm mt-4">{t(lang, 'timelineLoading')}</p>
        ) : (
          <PreferencesForm
            lang={lang}
            preferences={preferences}
            updateToggle={updateToggle}
            updateField={updateField}
            maskSensitiveValue={maskSensitiveValue}
            formatDateTime={formatDateTime}
            status={status}
            saving={saving}
            savePreferences={savePreferences}
          />
        )}
      </div>

      <div className="bg-slate-900 p-6 km-card">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm uppercase tracking-wide text-sky-300">{t(lang, 'notificationsSettingsDeliveryTitle')}</p>
          <button
            type="button"
            onClick={() => {
              loadProviderPolicy(false)
              loadDeliveryHistory(false)
              loadDiagnostics(false)
            }}
            className="text-xs text-sky-300 hover:text-sky-200 underline"
          >
            {t(lang, 'notificationsSettingsRefreshNow')}
          </button>
        </div>

        <ProviderPolicy
          lang={lang}
          providerPolicy={providerPolicy}
          lastPolicyRefreshAt={lastPolicyRefreshAt}
          formatDateTime={formatDateTime}
          channelLabel={channelLabel}
        />

        <DiagnosticsPanel
          lang={lang}
          diagnostics={diagnostics}
          lastDiagnosticsRefreshAt={lastDiagnosticsRefreshAt}
          formatDateTime={formatDateTime}
          channelLabel={channelLabel}
          diagnosticsTrendWidth={diagnosticsTrendWidth}
        />

        {lastHistoryRefreshAt && (
          <p className="text-[11px] text-slate-500 mt-1">
            {t(lang, 'notificationsSettingsLastRefresh')}: {formatDateTime(lastHistoryRefreshAt)} ({t(lang, 'notificationsSettingsAutoRefresh')})
          </p>
        )}

        <DeliveryHistory
          lang={lang}
          deliveryHistory={deliveryHistory}
          highlightedRetryAttemptId={highlightedRetryAttemptId}
          statusTone={statusTone}
          formatDateTime={formatDateTime}
          maskSensitiveValue={maskSensitiveValue}
          retryDeliveryAttempt={retryDeliveryAttempt}
          retryingAttemptId={retryingAttemptId}
        />
      </div>
    </div>
  )
}

export default NotificationSettingsPage
