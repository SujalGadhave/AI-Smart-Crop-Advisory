import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'
import { t } from '../../translations'
import { crops } from '../../utils/constants'
import { getCropLabel } from '../../utils/formatters'
import AlertForm from './AlertForm'
import AlertsList from './AlertsList'
import MarketInfo from './MarketInfo'

function MarketPage({ lang, user, token, onAuthFailure }) {
  const [cropType, setCropType] = useState('tomato')
  const [market, setMarket] = useState(null)
  const [marketError, setMarketError] = useState('')
  const [alerts, setAlerts] = useState([])
  const [alertTargetPrice, setAlertTargetPrice] = useState('')
  const [alertDirection, setAlertDirection] = useState('ABOVE')
  const [alertStatus, setAlertStatus] = useState('')
  const directionLabel = (direction) => (direction === 'BELOW' ? t(lang, 'marketDirectionBelow') : t(lang, 'marketDirectionAbove'))
  const alertSummary = (alert) => (alert?.triggered ? t(lang, 'marketAlertMessageTriggered') : t(lang, 'marketAlertMessageWatching'))

  const normalizedToken = typeof token === 'string' ? token.trim() : ''

  const loadAlerts = useCallback(async () => {
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      setAlerts([])
      return
    }

    try {
      const { data } = await api.get('/api/market/alerts', {
        params: { limit: 20 },
        headers: { Authorization: `Bearer ${normalizedToken}` },
      })
      setAlerts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Market alerts request failed', err)
      setAlerts([])
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        onAuthFailure?.()
      }
    }
  }, [normalizedToken, onAuthFailure])

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/market', { params: { cropType, city: user?.city || 'pune' } })
        setMarket(data)
        setMarketError('')
      } catch (err) {
        console.error('Market API request failed', err)
        setMarketError(t(lang, 'marketLoadFailed'))
      }
    }
    load()
  }, [cropType, lang, user])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const createAlert = async (event) => {
    event.preventDefault()
    const targetPrice = Number(alertTargetPrice)
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      setAlertStatus(t(lang, 'marketAlertInvalidPrice'))
      return
    }
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      setAlertStatus(t(lang, 'timelineLoginRequired'))
      return
    }

    setAlertStatus('')
    try {
      await api.post(
        '/api/market/alerts',
        {
          cropType,
          city: user?.city || 'pune',
          targetPrice,
          direction: alertDirection,
        },
        { headers: { Authorization: `Bearer ${normalizedToken}` } }
      )
      setAlertTargetPrice('')
      setAlertStatus(t(lang, 'marketAlertSaved'))
      loadAlerts()
    } catch (err) {
      console.error('Market alert create failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        setAlertStatus(t(lang, 'timelineSessionExpired'))
        onAuthFailure?.()
      } else {
        setAlertStatus(t(lang, 'marketAlertSaveFailed'))
      }
    }
  }

  const deleteAlert = async (alertId) => {
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      return
    }

    try {
      await api.delete(`/api/market/alerts/${alertId}`, {
        headers: { Authorization: `Bearer ${normalizedToken}` },
      })
      loadAlerts()
    } catch (err) {
      console.error('Market alert delete failed', err)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 km-fade-up">
      <MarketInfo
        lang={lang}
        market={market}
        marketError={marketError}
        cropType={cropType}
        setCropType={setCropType}
        crops={crops}
        getCropLabel={getCropLabel}
      />

      <div className="bg-slate-900 p-6 km-card">
        <p className="text-sm text-rose-300 uppercase">{t(lang, 'marketAlertsTitle')}</p>
        <AlertForm
          lang={lang}
          alertTargetPrice={alertTargetPrice}
          setAlertTargetPrice={setAlertTargetPrice}
          alertDirection={alertDirection}
          setAlertDirection={setAlertDirection}
          alertStatus={alertStatus}
          createAlert={createAlert}
        />
        <AlertsList
          lang={lang}
          alerts={alerts}
          directionLabel={directionLabel}
          alertSummary={alertSummary}
          deleteAlert={deleteAlert}
        />
      </div>
    </div>
  )
}

export default MarketPage
