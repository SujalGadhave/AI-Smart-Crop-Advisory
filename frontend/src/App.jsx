import React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { t } from './translations'
import { api } from './services/api'
import KM from './assets/KM.jpg'
import BG from './assets/BG.png'
import sun from './assets/sun.jpg'
import beg from './assets/beg.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons'
import { faCloudSunRain } from '@fortawesome/free-solid-svg-icons'

function decodeJwtPayload(token) {
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

function parseStoredUser() {
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

const crops = [
  { value: 'tomato' },
  { value: 'potato' },
  { value: 'corn' },
]

const CROP_LABEL_KEYS = {
  tomato: 'cropTomato',
  potato: 'cropPotato',
  corn: 'cropCorn',
}

function getCropLabel(lang, cropValue) {
  return t(lang, CROP_LABEL_KEYS[cropValue] || cropValue)
}

const LOW_CONFIDENCE_THRESHOLD = 0.65
const LOCALE_BY_LANGUAGE = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' }

function formatLocalizedDateTime(value, lang) {
  if (!value) {
    return '--'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  return date.toLocaleString(LOCALE_BY_LANGUAGE[lang] || 'en-IN')
}

function formatLocalizedCurrency(value, lang) {
  if (!Number.isFinite(value)) {
    return '--'
  }
  return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[lang] || 'en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function parseMarketNotificationPayload(notification) {
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

function Layout({ children, lang, setLang, user, onLogout }) {
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <img 
        src={BG} 
        alt={t(lang, 'altBackgroundImage')} 
        className="fixed top-0 left-0 w-full h-full object-cover -z-10"
      />
      <div className="fixed inset-0 bg-black/40 -z-10"></div>
      <div className="border-b border-white/20 bg-black/30 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={KM} alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-lg font-semibold">{t(lang, 'title')}</p>
              <p className="text-xs text-white/70">{t(lang, 'slogan')}</p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3 text-xs sm:text-sm text-white/80">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-3">
            <div className="w-full md:w-auto overflow-x-auto no-scrollbar -mx-1 px-1">
              <div className="flex min-w-max gap-1.5 sm:gap-2 pr-1 snap-x snap-mandatory">
                <NavLink to="/" label={t(lang, 'dashboard')} />
                <NavLink to="/upload" label={
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <FontAwesomeIcon icon={faArrowUpFromBracket} className="text-emerald-400"/>
                    {t(lang, 'upload')}
                  </span>
                }/>
                <NavLink to="/result" label={t(lang, 'result')} />
                <NavLink to="/timeline" label={t(lang, 'timeline')} />
                <NavLink to="/advisory" label={t(lang, 'advisory')} />
                <NavLink to="/market" label={t(lang, 'market')} />
                <NavLink to="/alerts" label={t(lang, 'notificationsSettingsNav')} />
              </div>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2 sm:gap-3 justify-between md:justify-end relative z-50">
            <select 
              className="bg-black/40 text-white text-xs sm:text-sm hover:bg-black/60 border border-white/20 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 relative z-50 w-[98px] sm:w-auto"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="en">{t(lang, 'languageEnglish')}</option>
              <option value="hi">{t(lang, 'languageHindi')}</option>
              <option value="mr">{t(lang, 'languageMarathi')}</option>
            </select>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden sm:inline">{user.name}</span>
                <button
                  onClick={onLogout}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/10 border border-white/20 rounded-lg hover:bg-white/20"
                >
                  {t(lang, 'logout')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 sm:gap-3">
                <Link to="/login" className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">
                  {t(lang, 'login')}
                </Link>
                <Link to="/register" className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-emerald-400 text-black font-semibold rounded-lg hover:bg-emerald-300">
                  {t(lang, 'register')}
                </Link>
              </div>
            )}
          </div>
          </div>
        </div>

      </div>
      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        {children}
      </div>

    </div>
  )
}

function NavLink({ to, label }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      className={`snap-start px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border whitespace-nowrap transition-colors ${
        active ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200' : 'border-transparent hover:border-slate-700'
      }`}
    >
      {label}
    </Link>
  )
}

function AuthForm({ mode, setUser, setToken, lang }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const { data } = await api.post(endpoint, form)
      setToken(data.token)
      setUser({ name: data.name, email: data.email, city: data.city })
      localStorage.setItem('km_token', data.token)
      localStorage.setItem('km_user', JSON.stringify({ name: data.name, email: data.email, city: data.city }))
      navigate('/')
    } catch (err) {
      console.error('User authentication failed', err)
      setError(t(lang, 'authFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-emerald-900/30">
      <h2 className="text-xl font-semibold mb-1">{mode === 'login' ? t(lang, 'login') : t(lang, 'register')}</h2>
      <p className="text-sm text-slate-400 mb-6">{t(lang, 'subtitle')}</p>
      <form className="space-y-4" onSubmit={submit}>
        {mode === 'register' && (
          <Input
            label={t(lang, 'name')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
        <Input
          label={t(lang, 'email')}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label={t(lang, 'password')}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Input
          label={t(lang, 'city')}
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? t(lang, 'pleaseWait') : t(lang, mode)}
        </button>
      </form>
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <label className="block text-sm font-medium text-slate-200">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
        {...props}
      />
    </label>
  )
}

function Dashboard({
  lang,
  lastReport,
  weather,
  riskAlerts,
  marketTriggeredAlerts,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}) {
  const latestDisease = lastReport?.diseaseName
    ? lastReport.diseaseName.replace(/_/g, ' ')
    : t(lang, 'noDetectionShort')
  const latestConfidence = lastReport ? `${(lastReport.confidence * 100).toFixed(1)}%` : '--'
  const temperature = weather ? `${weather.temperature.toFixed(1)}°C` : '--'
  const wind = weather ? `${weather.windSpeed} m/s` : '--'
  const directionLabel = (direction) => (direction === 'BELOW' ? t(lang, 'marketDirectionBelow') : t(lang, 'marketDirectionAbove'))
  const localizedRiskLevel = (level) => (level === 'HIGH' ? t(lang, 'riskAlertLevelHigh') : t(lang, 'riskAlertLevelMedium'))
  const localizedRiskTitle = (level) => (level === 'HIGH' ? t(lang, 'riskAlertHighTitle') : t(lang, 'riskAlertMediumTitle'))
  const localizedRiskMessage = (level) => (level === 'HIGH' ? t(lang, 'riskAlertHighMessage') : t(lang, 'riskAlertMediumMessage'))
  const localizedNotificationLevel = (level) => (level === 'HIGH' ? t(lang, 'riskAlertLevelHigh') : t(lang, 'riskAlertLevelMedium'))
  const localizedNotificationTitle = (notification) => {
    const marketPayload = parseMarketNotificationPayload(notification)
    if (marketPayload) {
      return `${t(lang, 'marketAlertsTitle')} • ${t(lang, 'marketAlertsTriggered')}`
    }
    return notification.title
  }
  const localizedNotificationMessage = (notification) => {
    const marketPayload = parseMarketNotificationPayload(notification)
    if (marketPayload) {
      return `${getCropLabel(lang, marketPayload.cropType)} • ${marketPayload.city} • ${formatLocalizedCurrency(marketPayload.currentPrice, lang)} / ${formatLocalizedCurrency(marketPayload.targetPrice, lang)} • ${directionLabel(marketPayload.direction)}`
    }
    return notification.message
  }
  const unreadNotifications = (notifications || []).filter((item) => !item.read).length
  const formatDateTime = (value) => formatLocalizedDateTime(value, lang)

useEffect(() => {
  if (window.UnicornStudio) {
    window.UnicornStudio.init()
  }
}, [])
  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

      <div className="lg:col-span-2 relative p-4 sm:p-5 overflow-hidden km-card km-fade-up">
  <img
    src={beg} 
    alt={t(lang, 'altDashboardHeroImage')}
    className="absolute inset-0 w-full h-full object-cover"
  />
  <div className="absolute inset-0 bg-black/60"></div>
  
  <div className="relative z-10">

    <p className="text-xs sm:text-sm text-emerald-300 uppercase tracking-[0.16em]">
      {t(lang, 'hub')}
    </p>

    <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold mt-2 leading-tight">
      {t(lang ,'protect')}
    </h2>

    <h4 className="text-base sm:text-lg font-medium mt-2 text-white/95">
      {t(lang, 'scan')}
    </h4>

    <p className="text-white/90 mt-3 text-sm sm:text-base leading-relaxed">
      {t(lang, 'dashboardSummary')}
    </p>

    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
      {[
        { title: t(lang, 'dashboardMetricDisease'), value: latestDisease, capitalize: true },
        { title: t(lang, 'dashboardMetricConfidence'), value: latestConfidence },
        { title: t(lang, 'dashboardMetricTemp'), value: temperature },
        { title: t(lang, 'dashboardMetricWind'), value: wind },
      ].map((card) => (
        <div 
          key={card.title} 
          className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3 py-4 text-center transition duration-300 hover:bg-white/20 hover:-translate-y-0.5"
        >
          <p className="text-[11px] uppercase tracking-wide text-emerald-200">{card.title}</p>
          <p className={`mt-1 font-semibold text-white ${card.capitalize ? 'capitalize' : ''}`}>{card.value}</p>
        </div>

      ))}
    </div>

    <div className="mt-4 p-3 km-subcard km-subcard-interactive">
      <p className="text-xs uppercase tracking-wide text-emerald-200">{t(lang, 'quickTipsTitle')}</p>
      <ul className="mt-2 space-y-1 text-sm text-white/90 list-disc list-inside">
        <li>{t(lang, 'quickTipOne')}</li>
        <li>{t(lang, 'quickTipTwo')}</li>
        <li>{t(lang, 'quickTipThree')}</li>
      </ul>
    </div>

    <div className="mt-4 p-3 km-subcard km-subcard-interactive">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-rose-200">{t(lang, 'riskAlertsTitle')}</p>
        <span className="text-[10px] text-white/60">{(riskAlerts || []).length}</span>
      </div>
      {(riskAlerts || []).length === 0 ? (
        <p className="mt-2 text-sm text-white/80">{t(lang, 'riskAlertsClear')}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {(riskAlerts || []).slice(0, 3).map((alert) => {
            const tone = alert.level === 'HIGH'
              ? 'border-rose-300/40 bg-rose-200/10 text-rose-100'
              : 'border-amber-300/40 bg-amber-200/10 text-amber-100'

            return (
              <div key={`${alert.reportId}-${alert.level}`} className={`rounded-lg border px-3 py-2 ${tone}`}>
                <p className="text-xs uppercase tracking-wide">{localizedRiskLevel(alert.level)}</p>
                <p className="text-sm font-semibold text-white">{localizedRiskTitle(alert.level)}</p>
                {alert.diseaseName && (
                  <p className="text-xs mt-1 capitalize">{t(lang, 'riskAlertCaseLabel')}: {alert.diseaseName}</p>
                )}
                <p className="text-xs mt-1">{localizedRiskMessage(alert.level)}</p>
                <p className="text-xs mt-1">{t(lang, 'riskAlertDetectedOn')}: {formatDateTime(alert.createdAt)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>

    <div className="mt-4 p-3 km-subcard km-subcard-interactive">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-sky-200">{t(lang, 'notificationsTitle')}</p>
        <span className="text-[10px] text-white/60">{unreadNotifications} {t(lang, 'notificationsUnread')}</span>
      </div>
      {(notifications || []).length === 0 ? (
        <p className="mt-2 text-sm text-white/80">{t(lang, 'notificationsClear')}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {(notifications || []).slice(0, 4).map((notification) => (
            <div
              key={notification.notificationId}
              className={`rounded-lg border px-3 py-2 ${notification.read ? 'border-slate-500/40 bg-slate-500/10 text-slate-200' : 'border-sky-300/40 bg-sky-200/10 text-sky-100'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide">{localizedNotificationLevel(notification.level)}</p>
                {!notification.read && (
                  <button
                    type="button"
                    onClick={() => onMarkNotificationRead?.(notification.notificationId)}
                    className="text-[10px] uppercase tracking-wide text-sky-200 hover:text-sky-100 underline"
                  >
                    {t(lang, 'notificationsMarkRead')}
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-white">{localizedNotificationTitle(notification)}</p>
              <p className="text-xs mt-1">{localizedNotificationMessage(notification)}</p>
              <p className="text-xs mt-1">{t(lang, 'notificationsCreatedOn')}: {formatDateTime(notification.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
      {unreadNotifications > 0 && (
        <button
          type="button"
          onClick={() => onMarkAllNotificationsRead?.()}
          className="mt-3 text-xs text-sky-300 hover:text-sky-200 underline"
        >
          {t(lang, 'notificationsMarkAllRead')}
        </button>
      )}
    </div>

    <div className="mt-4 p-3 km-subcard km-subcard-interactive">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-amber-200">{t(lang, 'triggeredPriceAlertsTitle')}</p>
        <span className="text-[10px] text-white/60">{(marketTriggeredAlerts || []).length}</span>
      </div>
      {(marketTriggeredAlerts || []).length === 0 ? (
        <p className="mt-2 text-sm text-white/80">{t(lang, 'triggeredPriceAlertsClear')}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {(marketTriggeredAlerts || []).slice(0, 3).map((alert) => (
            <div key={alert.alertId} className="rounded-lg border border-amber-300/40 bg-amber-200/10 px-3 py-2 text-amber-100">
              <p className="text-xs uppercase tracking-wide">{directionLabel(alert.direction)}</p>
              <p className="text-sm font-semibold text-white capitalize">{alert.cropType} • {alert.city}</p>
              <p className="text-xs mt-1">
                {formatLocalizedCurrency(alert.currentPrice, lang)} vs {formatLocalizedCurrency(alert.targetPrice, lang)}
              </p>
              <p className="text-xs mt-1">{t(lang, 'marketAlertCreatedOn')}: {formatDateTime(alert.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3">
        <Link to="/market" className="text-xs text-emerald-300 hover:text-emerald-200 underline">
          {t(lang, 'triggeredPriceAlertsViewAll')}
        </Link>
      </div>
    </div>

  </div>
</div>
      <div className="lg:col-span-1 grid grid-cols-1 gap-4 lg:sticky lg:top-24 self-start">
        <div className="relative bg-white/10 p-5 overflow-hidden min-h-[15rem] sm:min-h-[18rem] km-card km-card-interactive km-fade-up km-delay-1">
          <img
            src={sun}
            alt={t(lang, 'altWeatherCardImage')}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/65"></div>

          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-2 text-lg font-semibold text-emerald-300">
              <FontAwesomeIcon className="text-white text-2xl" icon={faCloudSunRain} />
              <p>{t(lang, 'weather')}</p>
            </div>

            {weather ? (
              <div className="mt-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xl font-semibold">{weather.city}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-white/20 bg-black/30 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-emerald-200/90">{t(lang, 'dashboardMetricTemp')}</p>
                      <p className="text-base font-semibold text-white">{weather.temperature.toFixed(1)}°C</p>
                    </div>
                    <div className="rounded-lg border border-white/20 bg-black/30 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-emerald-200/90">{t(lang, 'dashboardMetricWind')}</p>
                      <p className="text-base font-semibold text-white">{weather.windSpeed} m/s</p>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-white/85 leading-relaxed">{weather.advice}</p>
              </div>
            ) : (
              <p className="mt-4 text-white/80">{t(lang, 'loadingWeather')}</p>
            )}
          </div>
        </div>

        <div className="bg-black/30 p-5 min-h-[11rem] km-card km-card-interactive km-fade-up km-delay-2">
          <p className="text-md text-emerald-300">{t(lang, 'lastDetection')}</p>
          {lastReport ? (
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-lg font-semibold capitalize leading-tight">{lastReport.diseaseName}</p>
              <p className="text-white/90">{t(lang, 'dashboardMetricConfidence')}: {(lastReport.confidence * 100).toFixed(1)}%</p>
              <p className="text-white/80 text-sm leading-relaxed">{t(lang, 'labelTreatment')}: {lastReport.treatment}</p>
            </div>
          ) : (
            <p className="text-white/85 mt-2">{t(lang, 'detectionFallback')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function UploadPage({ token, lang, onAuthFailure, onDetectionComplete }) {
  const [file, setFile] = useState(null)
  const [cropType, setCropType] = useState('tomato')
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    const normalizedToken = typeof token === 'string' ? token.trim() : ''
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      setStatus(t(lang, 'tokenMissing'))
      return
    }
    if (!file) {
      setStatus(t(lang, 'uploadChooseImage'))
      return
    }
    if (!file.type.startsWith('image/')) {
      setStatus(t(lang, 'uploadInvalidImage'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus(t(lang, 'uploadImageTooLarge'))
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        setStatus(t(lang, 'uploadSending'))
        const imageBase64 = reader.result.split(',')[1]
        const { data } = await api.post(
          '/api/crop/detect',
          { cropType, imageBase64 },
          { headers: { Authorization: `Bearer ${normalizedToken}` } }
        )
        onDetectionComplete?.(data)
        navigate('/result')
      } catch (err) {
        console.error('Image detection request failed', err)
        const statusCode = err?.response?.status
        if (statusCode === 401 || statusCode === 403) {
          setStatus(t(lang, 'timelineSessionExpired'))
          onAuthFailure?.()
          navigate('/login')
          return
        }
        if (statusCode === 422) {
          const errMsg = err?.response?.data?.message || t(lang, 'uploadCropLeafRequired')
          setStatus(`⚠️ ${errMsg}`)
          return
        }
        setStatus(t(lang, 'uploadDetectFailed'))
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-3xl mx-auto bg-white/10 p-6 km-card km-card-interactive km-fade-up">
      <h2 className="text-2xl font-semibold mb-2">{t(lang, 'upload')}</h2>
      <p className="text-slate-400 mb-4">{t(lang, 'uploadPrompt')}</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-200 mb-1">{t(lang, 'chooseCrop')}</label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            >
              {crops.map((crop) => (
                <option key={crop.value} value={crop.value}>
                  {getCropLabel(lang, crop.value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-3 rounded-lg border border-amber-300/30 bg-amber-100/10 px-3 py-2 transition duration-300 hover:bg-amber-100/15">
              <p className="text-xs font-semibold text-amber-200">{t(lang, 'photoChecklistTitle')}</p>
              <ul className="mt-1 space-y-1 list-disc list-inside text-xs text-amber-100/90">
                <li>{t(lang, 'photoChecklistSingleLeaf')}</li>
                <li>{t(lang, 'photoChecklistGoodLighting')}</li>
                <li>{t(lang, 'photoChecklistCloseUp')}</li>
                <li>{t(lang, 'photoChecklistAvoidBlur')}</li>
              </ul>
            </div>
            <label className="block text-sm text-slate-200 mb-1">{t(lang, 'uploadImageLabel')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            />
          </div>
        </div>
        {status && (
          <p className={`text-sm ${status.startsWith('⚠️') ? 'text-red-400' : 'text-emerald-200'}`}>{status}</p>
        )}
        <button
          type="submit"
          className="px-4 py-3 bg-emerald-500 text-slate-900 font-semibold rounded-xl hover:bg-emerald-400"
        >
          {t(lang, 'submit')}
        </button>
      </form>
    </div>
  )
}

function DetectionDetailsCard({ report, lang }) {
  if (!report) {
    return <p className="text-slate-400">{t(lang, 'detectionFallback')}</p>
  }

  const severityColor = {
    low: 'bg-emerald-700 text-emerald-100',
    medium: 'bg-yellow-600 text-yellow-100',
    high: 'bg-red-700 text-red-100',
  }[report.severity?.toLowerCase()] || 'bg-slate-700 text-slate-200'

  const diseaseLabel = (report.diseaseName || t(lang, 'unknownDisease')).replace(/_/g, ' ')

  return (
    <div className="bg-white/10 p-6 space-y-4 km-card km-card-interactive">
      <p className="text-sm text-emerald-300 uppercase tracking-wide">{t(lang, 'result')}</p>

      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-semibold capitalize">{diseaseLabel}</h2>
        {report.severity && (
          <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${severityColor}`}>
            {report.severity} {t(lang, 'labelSeverity')}
          </span>
        )}
        {report.healthy && (
          <span className="text-xs font-bold uppercase px-2 py-1 rounded-full bg-emerald-600 text-white">
            {t(lang, 'labelHealthy')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-800 rounded-lg p-3 km-subcard">
          <p className="text-slate-400">{t(lang, 'dashboardMetricConfidence')}</p>
          <p className="text-white font-semibold">{(report.confidence * 100).toFixed(1)}%</p>
        </div>
        {report.affectedAreaPercent != null && (
          <div className="bg-slate-800 rounded-lg p-3 km-subcard">
            <p className="text-slate-400">{t(lang, 'labelAffectedArea')}</p>
            <p className="text-white font-semibold">{report.affectedAreaPercent.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {report.symptoms && report.symptoms.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4 km-subcard">
          <p className="text-sm font-semibold text-emerald-300 mb-2">{t(lang, 'labelObservedSymptoms')}</p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
            {report.symptoms.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg p-4 km-subcard">
        <p className="text-sm font-semibold text-emerald-300 mb-1">{t(lang, 'labelRecommendedTreatment')}</p>
        <p className="text-slate-300 text-sm">{report.treatment}</p>
      </div>

      <p className="text-slate-500 text-xs">{t(lang, 'reportLabel')} #{report.reportId}</p>
    </div>
  )
}

function ResultPage({ lastReport, reports, lang }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('latest')
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)
  const [showCurrentResult, setShowCurrentResult] = useState(false)

  const latestReport = lastReport || reports?.[0] || null
  const previousReports = (reports || []).filter((report) => report.reportId !== latestReport?.reportId)
  const selectedPrevious = previousReports.find((report) => report.reportId === selectedHistoryId) || previousReports[0] || null
  const isLowConfidenceLatest =
    latestReport && typeof latestReport.confidence === 'number' && latestReport.confidence < LOW_CONFIDENCE_THRESHOLD

  useEffect(() => {
    setShowCurrentResult(!isLowConfidenceLatest)
  }, [isLowConfidenceLatest, latestReport?.reportId])

  return (
    <div className="max-w-4xl mx-auto space-y-4 km-fade-up">
      <div className="bg-white/10 p-2 flex flex-wrap gap-2 km-card">
        <button
          onClick={() => setActiveTab('latest')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'latest' ? 'bg-emerald-500 text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {t(lang, 'latestResult')}
        </button>
        <button
          onClick={() => setActiveTab('previous')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === 'previous' ? 'bg-emerald-500 text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {t(lang, 'previousDetections')}
        </button>
      </div>

      {activeTab === 'latest' ? (
        <div className="space-y-4">
          {isLowConfidenceLatest && (
            <div className="bg-amber-100/10 border border-amber-300/30 rounded-2xl p-4 sm:p-5 shadow-lg transition duration-300 hover:bg-amber-100/15">
              <p className="text-amber-200 font-semibold">{t(lang, 'lowConfidenceWarningTitle')}</p>
              <p className="text-amber-100/90 text-sm mt-1">{t(lang, 'lowConfidenceWarningText')}</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => navigate('/upload')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-300 text-black font-semibold hover:bg-amber-200 transition"
                >
                  {t(lang, 'reuploadImage')}
                </button>
                <button
                  onClick={() => setShowCurrentResult(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition"
                >
                  {t(lang, 'viewCurrentResult')}
                </button>
              </div>
            </div>
          )}

          {(!isLowConfidenceLatest || showCurrentResult) && <DetectionDetailsCard report={latestReport} lang={lang} />}
        </div>
      ) : previousReports.length === 0 ? (
        <div className="bg-white/10 p-6 km-card">
          <p className="text-slate-300">{t(lang, 'previousDetectionFallback')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white/10 p-3 max-h-[26rem] overflow-y-auto km-card">
            <p className="text-sm text-emerald-300 mb-2">{t(lang, 'previousDetections')}</p>
            <div className="space-y-2">
              {previousReports.map((report) => {
                const isActive = report.reportId === (selectedPrevious?.reportId)
                return (
                  <button
                    key={report.reportId}
                    onClick={() => setSelectedHistoryId(report.reportId)}
                    className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                      isActive
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100'
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <p className="font-medium capitalize">{(report.diseaseName || t(lang, 'unknownDisease')).replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">{t(lang, 'reportLabel')} #{report.reportId}</p>
                    <p className="text-xs text-slate-400">{(report.confidence * 100).toFixed(1)}% {t(lang, 'labelConfidenceLower')}</p>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="lg:col-span-2">
            <DetectionDetailsCard report={selectedPrevious} lang={lang} />
          </div>
        </div>
      )}
    </div>
  )
}

function TimelinePage({ lang, token, onAuthFailure }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [followUpForm, setFollowUpForm] = useState({ status: 'PENDING', notes: '' })

  const selectedItem = items.find((item) => item.reportId === selectedId) || items[0] || null
  const formatDateTime = (value) => formatLocalizedDateTime(value, lang)
  const followUpStatusLabel = (value) => {
    const normalized = String(value || 'PENDING').toUpperCase()
    if (normalized === 'IN_PROGRESS') return t(lang, 'timelineStatusInProgress')
    if (normalized === 'COMPLETED') return t(lang, 'timelineStatusCompleted')
    if (normalized === 'NEEDS_ATTENTION') return t(lang, 'timelineStatusNeedsAttention')
    return t(lang, 'timelineStatusPending')
  }

  const normalizeToken = typeof token === 'string' ? token.trim() : ''

  const loadTimeline = useCallback(async () => {
    if (!normalizeToken || normalizeToken === 'undefined' || normalizeToken === 'null') {
      setItems([])
      setLoading(false)
      setStatus(t(lang, 'timelineLoginRequired'))
      return
    }

    setLoading(true)
    setStatus('')
    try {
      const { data } = await api.get('/api/crop/timeline', {
        params: { limit: 20 },
        headers: { Authorization: `Bearer ${normalizeToken}` },
      })

      const nextItems = Array.isArray(data) ? data : []
      setItems(nextItems)

      if (nextItems.length === 0) {
        setSelectedId(null)
      } else {
        setSelectedId((previous) => previous ?? nextItems[0].reportId)
      }
    } catch (err) {
      console.error('Timeline request failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        setStatus(t(lang, 'timelineSessionExpired'))
        onAuthFailure?.()
      } else {
        setStatus(t(lang, 'timelineLoadFailed'))
      }
    } finally {
      setLoading(false)
    }
  }, [lang, normalizeToken, onAuthFailure])

  useEffect(() => {
    loadTimeline()
  }, [loadTimeline])

  useEffect(() => {
    if (!selectedItem) {
      setFollowUpForm({ status: 'PENDING', notes: '' })
      return
    }

    setFollowUpForm({
      status: selectedItem.followUpStatus || 'PENDING',
      notes: selectedItem.followUpNotes || '',
    })
  }, [selectedItem])

  const saveFollowUp = async (event) => {
    event.preventDefault()
    if (!selectedItem) {
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const { data } = await api.patch(
        `/api/crop/reports/${selectedItem.reportId}/follow-up`,
        followUpForm,
        { headers: { Authorization: `Bearer ${normalizeToken}` } }
      )

      setItems((previous) => previous.map((item) => (item.reportId === data.reportId ? data : item)))
      setStatus(t(lang, 'timelineSaved'))
    } catch (err) {
      console.error('Follow-up update failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        setStatus(t(lang, 'timelineSessionExpired'))
        onAuthFailure?.()
      } else {
        setStatus(t(lang, 'timelineSaveFailed'))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 km-fade-up">
      <div className="bg-white/10 p-3 max-h-[34rem] overflow-y-auto km-card">
        <p className="text-sm text-emerald-300 mb-2">{t(lang, 'timeline')}</p>
        {loading ? (
          <p className="text-slate-300 text-sm">{t(lang, 'timelineLoading')}</p>
        ) : items.length === 0 ? (
          <p className="text-slate-300 text-sm">{t(lang, 'timelineEmpty')}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const active = item.reportId === (selectedItem?.reportId)
              return (
                <button
                  key={item.reportId}
                  onClick={() => setSelectedId(item.reportId)}
                  className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                    active
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100'
                      : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <p className="font-medium capitalize">{(item.diseaseName || t(lang, 'unknownDisease')).replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-400">{t(lang, 'reportLabel')} #{item.reportId}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="lg:col-span-2 bg-white/10 p-6 km-card">
        {!selectedItem ? (
          <p className="text-slate-300">{t(lang, 'timelineEmpty')}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold capitalize">{(selectedItem.diseaseName || t(lang, 'unknownDisease')).replace(/_/g, ' ')}</h2>
              <span className="text-xs uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-200">
                {followUpStatusLabel(selectedItem.followUpStatus || 'PENDING')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-slate-800 rounded-lg p-3 km-subcard">
                <p className="text-slate-400">{t(lang, 'timelineDetectedAt')}</p>
                <p className="text-white font-semibold">{formatDateTime(selectedItem.createdAt)}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 km-subcard">
                <p className="text-slate-400">{t(lang, 'timelineNextFollowUp')}</p>
                <p className="text-white font-semibold">{formatDateTime(selectedItem.nextFollowUpAt)}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 km-subcard">
                <p className="text-slate-400">{t(lang, 'dashboardMetricConfidence')}</p>
                <p className="text-white font-semibold">{(selectedItem.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 km-subcard">
              <p className="text-sm font-semibold text-emerald-300 mb-2">{t(lang, 'timelineReminders')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(selectedItem.reminderSchedule || []).map((entry) => (
                  <div key={entry} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                    {formatDateTime(entry)}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={saveFollowUp} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-200 mb-1">{t(lang, 'timelineStatus')}</label>
                <select
                  value={followUpForm.status}
                  onChange={(event) => setFollowUpForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                >
                  <option value="PENDING">{t(lang, 'timelineStatusPending')}</option>
                  <option value="IN_PROGRESS">{t(lang, 'timelineStatusInProgress')}</option>
                  <option value="COMPLETED">{t(lang, 'timelineStatusCompleted')}</option>
                  <option value="NEEDS_ATTENTION">{t(lang, 'timelineStatusNeedsAttention')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-200 mb-1">{t(lang, 'timelineNotes')}</label>
                <textarea
                  rows={4}
                  value={followUpForm.notes}
                  onChange={(event) => setFollowUpForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
                />
              </div>

              {status && <p className="text-sm text-emerald-200">{status}</p>}

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-60"
              >
                {saving ? t(lang, 'timelineSaving') : t(lang, 'timelineSave')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function AdvisoryPage({ lang, token, lastReport }) {
  const [cropType, setCropType] = useState('tomato')
  const [advisory, setAdvisory] = useState(null)
  const [status, setStatus] = useState('')

  const fetchAdvisory = async () => {
    setStatus(t(lang, 'advisoryLoading'))
    try {
      const diseaseName = lastReport?.cropType === cropType ? lastReport?.diseaseName : undefined
      const { data } = await api.get('/api/advisory', { params: { cropType, diseaseName } })
      setAdvisory(data)
      setStatus('')
    } catch (err) {
      console.error('Advisory API request failed', err)
      setStatus(t(lang, 'advisoryLoadFailed'))
    }
  }

  useEffect(() => {
    fetchAdvisory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropType])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 km-fade-up">
      <div className="md:col-span-2 bg-slate-900 p-6 km-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">{t(lang, 'advisory')}</h2>
          <select
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 w-full sm:w-auto"
          >
            {crops.map((c) => (
              <option key={c.value} value={c.value}>
                {getCropLabel(lang, c.value)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-slate-300 mt-2">{t(lang, 'advisoryBlurb')}</p>
        {status && <p className="text-sm text-emerald-300 mt-2">{status}</p>}
        {advisory && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <AdviceCard title={t(lang, 'adviceFertilizer')} items={advisory.fertilizer} />
            <AdviceCard title={t(lang, 'adviceIrrigation')} items={advisory.irrigation} />
            <AdviceCard title={t(lang, 'advicePest')} items={advisory.pestManagement} />
            <AdviceCard title={t(lang, 'adviceWeather')} items={advisory.weatherWarnings} />
            {advisory.diseaseAdvice?.length > 0 && <AdviceCard title={t(lang, 'adviceDiseaseSpecific')} items={advisory.diseaseAdvice} />}
          </div>
        )}
      </div>
      <div className="bg-slate-900 p-6 space-y-4 km-card">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-300">{t(lang, 'advisoryCompanionTitle')}</p>
          <p className="text-slate-300 text-sm mt-2">{t(lang, 'advisoryCompanionSubtitle')}</p>
        </div>

        {lastReport ? (
          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 km-subcard">
            <p className="text-xs uppercase tracking-wide text-emerald-200">{t(lang, 'lastDetection')}</p>
            <p className="mt-1 text-white font-semibold capitalize">{(lastReport.diseaseName || t(lang, 'unknownDisease')).replace(/_/g, ' ')}</p>
            <p className="text-sm text-slate-300">{t(lang, 'dashboardMetricConfidence')}: {(lastReport.confidence * 100).toFixed(1)}%</p>
          </div>
        ) : (
          <p className="text-sm text-slate-300">{t(lang, 'advisoryNoRecentDetection')}</p>
        )}

        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 km-subcard">
          <p className="text-xs uppercase tracking-wide text-emerald-200">{t(lang, 'advisoryChecklistTitle')}</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-200 list-disc list-inside">
            <li>{t(lang, 'advisoryChecklistOne')}</li>
            <li>{t(lang, 'advisoryChecklistTwo')}</li>
            <li>{t(lang, 'advisoryChecklistThree')}</li>
          </ul>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center justify-center w-full px-4 py-2 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition"
        >
          {t(lang, 'uploadNewLeaf')}
        </Link>
      </div>
    </div>
  )
}

function AdviceCard({ title, items }) {
  return (
    <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 km-subcard km-subcard-interactive">
      <p className="font-semibold text-emerald-200">{title}</p>
      <ul className="mt-2 space-y-2 text-slate-300 text-sm list-disc list-inside">
        {items?.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

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
      <div className="lg:col-span-2 bg-slate-900 p-6 km-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-emerald-300 uppercase">{t(lang, 'market')}</p>
            <p className="text-slate-400 text-sm">{t(lang, 'marketBlurb')}</p>
          </div>
          <select
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
          >
            {crops.map((c) => (
              <option key={c.value} value={c.value}>
                {getCropLabel(lang, c.value)}
              </option>
            ))}
          </select>
        </div>
        {marketError && <p className="mt-3 text-sm text-rose-300">{marketError}</p>}
        {market && (
          <div className="mt-4">
            <div className="flex items-center gap-3 text-lg">
              <span className="font-semibold text-emerald-200">{formatLocalizedCurrency(market.currentPrice, lang)}</span>
              <span className="text-slate-400 text-sm">{market.city} {t(lang, 'marketMandiLabel')}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {market.trend.map((point) => (
                <div key={point.date} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 km-subcard km-subcard-interactive">
                  <p className="text-sm text-slate-400">{point.date}</p>
                  <p className="text-lg font-semibold">{formatLocalizedCurrency(point.price, lang)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-6 km-card">
        <p className="text-sm text-rose-300 uppercase">{t(lang, 'marketAlertsTitle')}</p>
        <form className="mt-3 space-y-3" onSubmit={createAlert}>
          <label className="block text-sm text-slate-300">
            {t(lang, 'marketAlertsTargetPrice')}
            <input
              type="number"
              min="1"
              step="1"
              value={alertTargetPrice}
              onChange={(event) => setAlertTargetPrice(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            />
          </label>

          <label className="block text-sm text-slate-300">
            {t(lang, 'marketAlertsDirection')}
            <select
              value={alertDirection}
              onChange={(event) => setAlertDirection(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            >
              <option value="ABOVE">{t(lang, 'marketDirectionAbove')}</option>
              <option value="BELOW">{t(lang, 'marketDirectionBelow')}</option>
            </select>
          </label>

          {alertStatus && <p className="text-sm text-emerald-200">{alertStatus}</p>}

          <button
            type="submit"
            className="w-full px-4 py-2 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400"
          >
            {t(lang, 'marketAlertsCreate')}
          </button>
        </form>

        <div className="mt-5 space-y-2 max-h-64 overflow-y-auto">
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-400">{t(lang, 'marketAlertsEmpty')}</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.alertId} className="rounded-xl border border-white/10 bg-slate-950/60 p-3 km-subcard km-subcard-interactive">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold capitalize text-white">{alert.cropType}</p>
                  <span className={`text-[10px] px-2 py-1 rounded-full ${alert.triggered ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                    {alert.triggered ? t(lang, 'marketAlertsTriggered') : t(lang, 'marketAlertsWatching')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {formatLocalizedCurrency(alert.currentPrice, lang)} vs {formatLocalizedCurrency(alert.targetPrice, lang)} ({directionLabel(alert.direction)})
                </p>
                <p className="text-xs text-slate-400 mt-1">{alertSummary(alert)}</p>
                <button
                  onClick={() => deleteAlert(alert.alertId)}
                  className="mt-2 text-xs text-rose-300 hover:text-rose-200"
                >
                  {t(lang, 'marketAlertsDelete')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

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
          <form className="mt-4 space-y-4" onSubmit={savePreferences}>
            <div className="space-y-3 rounded-xl border border-white/10 bg-slate-950/60 p-4 km-subcard">
              <label className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-200">{t(lang, 'notificationsSettingsInApp')}</span>
                <input type="checkbox" checked={Boolean(preferences.inAppEnabled)} onChange={updateToggle('inAppEnabled')} />
              </label>

              <label className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-200">{t(lang, 'notificationsSettingsSms')}</span>
                <input type="checkbox" checked={Boolean(preferences.smsEnabled)} onChange={updateToggle('smsEnabled')} />
              </label>
              <input
                value={preferences.smsNumber || ''}
                onChange={updateField('smsNumber')}
                placeholder={t(lang, 'notificationsSettingsSmsNumber')}
                type="tel"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              />

              <label className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-200">{t(lang, 'notificationsSettingsWhatsapp')}</span>
                <input type="checkbox" checked={Boolean(preferences.whatsappEnabled)} onChange={updateToggle('whatsappEnabled')} />
              </label>
              <input
                value={preferences.whatsappNumber || ''}
                onChange={updateField('whatsappNumber')}
                placeholder={t(lang, 'notificationsSettingsWhatsappNumber')}
                type="tel"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              />

              <label className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-200">{t(lang, 'notificationsSettingsPush')}</span>
                <input type="checkbox" checked={Boolean(preferences.pushEnabled)} onChange={updateToggle('pushEnabled')} />
              </label>
              <input
                value={preferences.pushToken || ''}
                onChange={updateField('pushToken')}
                placeholder={t(lang, 'notificationsSettingsPushToken')}
                type="password"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-300 km-subcard">
              <p className="text-slate-200 font-semibold">{t(lang, 'notificationsSettingsSavedEndpoints')}</p>
              <p className="mt-2">SMS: {maskSensitiveValue('SMS', preferences.smsNumber) || '--'}</p>
              <p className="mt-1">WhatsApp: {maskSensitiveValue('WHATSAPP', preferences.whatsappNumber) || '--'}</p>
              <p className="mt-1">Push: {maskSensitiveValue('PUSH', preferences.pushToken) || '--'}</p>
            </div>

            {preferences.updatedAt && (
              <p className="text-xs text-slate-400">
                {t(lang, 'notificationsSettingsUpdatedAt')}: {formatDateTime(preferences.updatedAt)}
              </p>
            )}

            {status && <p className="text-sm text-emerald-200">{status}</p>}

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving ? t(lang, 'notificationsSettingsSaving') : t(lang, 'notificationsSettingsSave')}
            </button>
          </form>
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
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 km-subcard">
          <p className="text-xs uppercase tracking-wide text-cyan-300">{t(lang, 'notificationsSettingsPolicyTitle')}</p>
          {lastPolicyRefreshAt && (
            <p className="text-[11px] text-slate-500 mt-1">
              {t(lang, 'notificationsSettingsLastRefresh')}: {formatDateTime(lastPolicyRefreshAt)}
            </p>
          )}

          {providerPolicy.length === 0 ? (
            <p className="text-xs text-slate-400 mt-2">{t(lang, 'notificationsSettingsPolicyEmpty')}</p>
          ) : (
            <div className="mt-2 space-y-2">
              {providerPolicy.map((policy) => (
                <div key={policy.channel} className="rounded-lg border border-white/10 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-white">{channelLabel(policy.channel)}</p>
                    <span className={`text-[10px] px-2 py-1 rounded-full ${policy.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                      {policy.enabled ? t(lang, 'notificationsSettingsPolicyEnabled') : t(lang, 'notificationsSettingsPolicyDisabled')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    {t(lang, 'notificationsSettingsConfiguredAttempts')}: {policy.configuredMaxAttempts} · {t(lang, 'notificationsSettingsEffectiveAttempts')}: {policy.effectiveMaxAttempts}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t(lang, 'notificationsSettingsConfiguredBackoff')}: {policy.configuredInitialBackoffMs} ms · {t(lang, 'notificationsSettingsEffectiveBackoff')}: {policy.effectiveInitialBackoffMs} ms
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 km-subcard">
          <p className="text-xs uppercase tracking-wide text-amber-300">{t(lang, 'notificationsSettingsDiagnosticsTitle')}</p>
          {lastDiagnosticsRefreshAt && (
            <p className="text-[11px] text-slate-500 mt-1">
              {t(lang, 'notificationsSettingsLastRefresh')}: {formatDateTime(lastDiagnosticsRefreshAt)}
            </p>
          )}

          {!diagnostics ? (
            <p className="text-xs text-slate-400 mt-2">{t(lang, 'notificationsSettingsDiagnosticsEmpty')}</p>
          ) : (
            <div className="mt-2 space-y-3">
              <div className="rounded-lg border border-white/10 px-3 py-2">
                <p className="text-xs text-slate-300">
                  {t(lang, 'notificationsSettingsDiagnosticsWindow')}: {diagnostics.windowDays}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  {t(lang, 'notificationsSettingsDiagnosticsRetryTotal')}: {diagnostics.retryOutcomes?.totalRetries ?? 0}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  {t(lang, 'notificationsSettingsDiagnosticsRetryDelivered')}: {diagnostics.retryOutcomes?.deliveredRetries ?? 0}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  {t(lang, 'notificationsSettingsDiagnosticsRetryFailed')}: {diagnostics.retryOutcomes?.failedRetries ?? 0}
                </p>
                <p className="text-xs text-emerald-300 mt-1">
                  {t(lang, 'notificationsSettingsDiagnosticsRetrySuccessRate')}: {(diagnostics.retryOutcomes?.successRatePercent ?? 0).toFixed(2)}%
                </p>
              </div>

              {(diagnostics.channels || []).map((channelMetrics) => (
                <div key={channelMetrics.channel} className="rounded-lg border border-white/10 px-3 py-2">
                  <p className="text-xs font-semibold text-white">{channelLabel(channelMetrics.channel)}</p>
                  <p className="text-[11px] text-slate-300 mt-1">
                    {t(lang, 'notificationsSettingsDiagnosticsAttempts')}: {channelMetrics.totalAttempts} · {t(lang, 'notificationsSettingsDiagnosticsFailures')}: {channelMetrics.failedCount}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t(lang, 'notificationsSettingsDiagnosticsRetryDelivered')}: {channelMetrics.retryDeliveredCount} · {t(lang, 'notificationsSettingsDiagnosticsRetryFailed')}: {channelMetrics.retryFailedCount}
                  </p>
                  <div className="mt-2 space-y-1">
                    {(channelMetrics.failureTrend || []).map((point) => (
                      <div key={`${channelMetrics.channel}-${point.bucketDate}`} className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{point.bucketDate}</span>
                          <span>{point.failedCount}/{point.totalCount}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-rose-500"
                            style={{ width: `${diagnosticsTrendWidth(point.failedCount, point.totalCount)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {lastHistoryRefreshAt && (
          <p className="text-[11px] text-slate-500 mt-1">
            {t(lang, 'notificationsSettingsLastRefresh')}: {formatDateTime(lastHistoryRefreshAt)} ({t(lang, 'notificationsSettingsAutoRefresh')})
          </p>
        )}
        <div className="mt-3 space-y-2 max-h-[26rem] overflow-y-auto">
          {deliveryHistory.length === 0 ? (
            <p className="text-sm text-slate-400">{t(lang, 'notificationsSettingsDeliveryEmpty')}</p>
          ) : (
            deliveryHistory.map((attempt) => (
              <div
                key={attempt.attemptId}
                className={`rounded-xl border bg-slate-950/60 p-3 km-subcard transition-colors duration-500 ${highlightedRetryAttemptId === attempt.attemptId ? 'border-emerald-400 ring-1 ring-emerald-300/50' : 'border-white/10'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{attempt.channel}</p>
                  <div className="flex items-center gap-2">
                    {highlightedRetryAttemptId === attempt.attemptId && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-600 text-white">
                        {t(lang, 'notificationsSettingsRetryNew')}
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-1 rounded-full ${statusTone(attempt.status)}`}>
                      {attempt.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-1">#{attempt.notificationId}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDateTime(attempt.attemptedAt)}</p>
                {attempt.retryAttempt && (
                  <p className="text-xs text-emerald-300 mt-1">{t(lang, 'notificationsSettingsRetryAttempt')}</p>
                )}
                {attempt.destination && <p className="text-xs text-slate-400 mt-1">{maskSensitiveValue(attempt.channel, attempt.destination)}</p>}
                {attempt.providerStatusCode != null && (
                  <p className="text-xs text-slate-300 mt-1">
                    {t(lang, 'notificationsSettingsProviderStatus')}: {attempt.providerStatusCode}
                  </p>
                )}
                {attempt.providerRef && (
                  <p className="text-xs text-slate-300 mt-1 break-all">
                    {t(lang, 'notificationsSettingsProviderRef')}: {attempt.providerRef}
                  </p>
                )}
                {attempt.providerMessage && (
                  <p className="text-xs text-slate-300 mt-1">
                    {t(lang, 'notificationsSettingsProviderMessage')}: {attempt.providerMessage}
                  </p>
                )}
                {attempt.errorMessage && <p className="text-xs text-rose-300 mt-1">{attempt.errorMessage}</p>}
                {(attempt.status === 'FAILED' || attempt.status === 'SKIPPED') && (
                  <button
                    type="button"
                    onClick={() => retryDeliveryAttempt(attempt.attemptId)}
                    disabled={retryingAttemptId === attempt.attemptId}
                    className="mt-2 text-xs text-amber-300 hover:text-amber-200 underline disabled:opacity-60"
                  >
                    {retryingAttemptId === attempt.attemptId
                      ? t(lang, 'notificationsSettingsRetrying')
                      : t(lang, 'notificationsSettingsRetry')}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function AppShell() {
  const [lang, setLang] = useState('en')
  const [token, setToken] = useState(() => localStorage.getItem('km_token') || '')
  const [user, setUser] = useState(() => parseStoredUser())
  const [lastReport, setLastReport] = useState(null)
  const [reportHistory, setReportHistory] = useState([])
  const [weather, setWeather] = useState(null)
  const [riskAlerts, setRiskAlerts] = useState([])
  const [marketAlerts, setMarketAlerts] = useState([])
  const [notifications, setNotifications] = useState([])

  const clearSession = useCallback(() => {
    setToken('')
    setUser(null)
    setNotifications([])
    localStorage.removeItem('km_token')
    localStorage.removeItem('km_user')
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

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const city = user?.city || 'Pune'
        const { data } = await api.get('/api/weather', { params: { city } })
        setWeather(data)
      } catch (err) {
        console.error('Weather API request failed', err)
        setWeather({
          city: t(lang, 'defaultCityName'),
          temperature: 30,
          windSpeed: 2.5,
          condition: 'clear',
          advice: t(lang, 'weatherFallbackAdvice'),
        })
      }
    }
    fetchWeather()
  }, [lang, user])

  const fetchRecentReports = useCallback(async () => {
    try {
      const { data } = await api.get('/api/crop/reports', { params: { limit: 10 } })
      if (!Array.isArray(data)) {
        return
      }
      setReportHistory(data)
      setLastReport((prev) => prev || data[0] || null)
    } catch (err) {
      console.error('Recent reports request failed', err)
    }
  }, [])

  const fetchRiskAlerts = useCallback(async () => {
    const normalizedToken = typeof token === 'string' ? token.trim() : ''
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
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

  const fetchMarketAlerts = useCallback(async () => {
    const normalizedToken = typeof token === 'string' ? token.trim() : ''
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
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

  const fetchNotifications = useCallback(async () => {
    const normalizedToken = typeof token === 'string' ? token.trim() : ''
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
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
    fetchRecentReports()
  }, [fetchRecentReports])

  useEffect(() => {
    fetchRiskAlerts()
  }, [fetchRiskAlerts])

  useEffect(() => {
    fetchMarketAlerts()
  }, [fetchMarketAlerts])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const onDetectionComplete = useCallback((report) => {
    setLastReport(report)
    setReportHistory((prev) => {
      const withoutCurrent = prev.filter((item) => item.reportId !== report.reportId)
      return [report, ...withoutCurrent].slice(0, 10)
    })
    fetchRiskAlerts()
    fetchNotifications()
  }, [fetchRiskAlerts, fetchNotifications])

  const onMarkNotificationRead = useCallback(async (notificationId) => {
    const normalizedToken = typeof token === 'string' ? token.trim() : ''
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
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

  const onMarkAllNotificationsRead = useCallback(async () => {
    const normalizedToken = typeof token === 'string' ? token.trim() : ''
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
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

  const onLogout = () => {
    clearSession()
  }

  const triggeredMarketAlerts = marketAlerts.filter((alert) => Boolean(alert?.triggered))

  return (
    <Layout lang={lang} setLang={setLang} user={user} onLogout={onLogout}>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              lang={lang}
              lastReport={lastReport || reportHistory[0]}
              weather={weather}
              riskAlerts={riskAlerts}
              marketTriggeredAlerts={triggeredMarketAlerts}
              notifications={notifications}
              onMarkNotificationRead={onMarkNotificationRead}
              onMarkAllNotificationsRead={onMarkAllNotificationsRead}
            />
          }
        />
        <Route path="/login" element={<AuthForm mode="login" setUser={setUser} setToken={setToken} lang={lang} />} />
        <Route path="/register" element={<AuthForm mode="register" setUser={setUser} setToken={setToken} lang={lang} />} />
        <Route
          path="/upload"
          element={<UploadPage token={token} lang={lang} onAuthFailure={clearSession} onDetectionComplete={onDetectionComplete} />}
        />
        <Route path="/result" element={<ResultPage lastReport={lastReport || reportHistory[0]} reports={reportHistory} lang={lang} />} />
        <Route path="/timeline" element={<TimelinePage lang={lang} token={token} onAuthFailure={clearSession} />} />
        <Route path="/advisory" element={<AdvisoryPage lang={lang} token={token} lastReport={lastReport || reportHistory[0]} />} />
        <Route path="/market" element={<MarketPage lang={lang} user={user} token={token} onAuthFailure={clearSession} />} />
        <Route path="/alerts" element={<NotificationSettingsPage lang={lang} token={token} onAuthFailure={clearSession} />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
