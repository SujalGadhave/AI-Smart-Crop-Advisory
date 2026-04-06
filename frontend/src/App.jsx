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
  { value: 'tomato', label: 'Tomato' },
  { value: 'potato', label: 'Potato' },
  { value: 'corn', label: 'Corn' },
]

const LOW_CONFIDENCE_THRESHOLD = 0.65

function Layout({ children, lang, setLang, user, onLogout }) {
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <img 
        src={BG} 
        alt="bg" 
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
        <div className="max-w-6xl mx-auto px-4 pb-3 text-sm text-white/80">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="w-full md:w-auto overflow-x-auto no-scrollbar">
              <div className="flex min-w-max gap-2 pr-1">
                <NavLink to="/" label={t(lang, 'dashboard')} />
                <NavLink to="/upload" label={
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faArrowUpFromBracket} className="text-emerald-400"/>
                    {t(lang, 'upload')}
                  </span>
                }/>
                <NavLink to="/result" label={t(lang, 'result')} />
                <NavLink to="/advisory" label={t(lang, 'advisory')} />
                <NavLink to="/market" label={t(lang, 'market')} />
              </div>
            </div>
            <div className="flex w-full md:w-auto items-center gap-3 justify-between md:justify-end relative z-50">
            <select 
              className="bg-black/40 text-white hover:bg-black/60 border border-white/20 rounded-lg px-3 py-2 relative z-50 flex-1 sm:flex-none"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
            </select>

            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline">{user.name}</span>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20"
                >
                  {t(lang, 'logout')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 sm:gap-3">
                <Link to="/login" className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">
                  {t(lang, 'login')}
                </Link>
                <Link to="/register" className="px-3 py-2 bg-emerald-400 text-black font-semibold rounded-lg hover:bg-emerald-300">
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
      className={`px-3 py-2 rounded-lg border whitespace-nowrap ${
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
      setError('Unable to authenticate. Check details and try again.')
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
          {loading ? 'Please wait…' : t(lang, mode)}
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

function Dashboard({ lang, lastReport, weather }) {
  const latestDisease = lastReport?.diseaseName
    ? lastReport.diseaseName.replace(/_/g, ' ')
    : t(lang, 'noDetectionShort')
  const latestConfidence = lastReport ? `${(lastReport.confidence * 100).toFixed(1)}%` : '--'
  const temperature = weather ? `${weather.temperature.toFixed(1)}°C` : '--'
  const wind = weather ? `${weather.windSpeed} m/s` : '--'

useEffect(() => {
  if (window.UnicornStudio) {
    window.UnicornStudio.init()
  }
}, [])
  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4">

      <div className="lg:col-span-2 relative p-5 rounded-2xl shadow-lg overflow-hidden">
  <img
    src={beg} 
    alt="farm"
    className="absolute inset-0 w-full h-full object-cover"
  />
  <div className="absolute inset-0 bg-black/60"></div>
  
  <div className="relative z-10">

    <p className="text-sm text-emerald-300 uppercase tracking-wide">
      {t(lang, 'hub')}
    </p>

    <h2 className="text-2xl font-semibold mt-2">
      {t(lang ,'protect')}
    </h2>

    <h4 className="text-lg font-semibold mt-2">
      {t(lang, 'scan')}
    </h4>

    <p className="text-white mt-2">
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
          className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3 py-4 text-center hover:bg-white/20 transition"
        >
          <p className="text-[11px] uppercase tracking-wide text-emerald-200">{card.title}</p>
          <p className={`mt-1 font-semibold text-white ${card.capitalize ? 'capitalize' : ''}`}>{card.value}</p>
        </div>

      ))}
    </div>

    <div className="mt-4 rounded-xl bg-black/30 border border-white/15 p-3">
      <p className="text-xs uppercase tracking-wide text-emerald-200">{t(lang, 'quickTipsTitle')}</p>
      <ul className="mt-2 space-y-1 text-sm text-white/90 list-disc list-inside">
        <li>{t(lang, 'quickTipOne')}</li>
        <li>{t(lang, 'quickTipTwo')}</li>
        <li>{t(lang, 'quickTipThree')}</li>
      </ul>
    </div>

  </div>
</div>
      <div className="relative bg-white/10 backdrop-blur-sm p-5 rounded-2xl shadow-lg overflow-hidden min-h-52">
        <img
          src={sun} 
          alt="sun"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className='relative z-10'>
        <p className="  p-2 text-lg font-semibold text-emerald-300"
    >        <FontAwesomeIcon className="text-white pr-1 text-3xl"
                icon={faCloudSunRain}
              />
              {t(lang, 'weather')}</p>
        {weather ? (
          <div className="mt-2 space-y-1">
            <p className="text-lg font-semibold">{weather.city}</p>
            <p className="text-white/90">{weather.temperature.toFixed(1)}°C • wind {weather.windSpeed} m/s</p>
            <p className="text-white/80 text-sm">{weather.advice}</p>
          </div>
        ) : (
          <p className="text-white/80">Loading weather…</p>
        )}
      </div>
      </div>
      <div className="bg-black/30 border border-white/20 backdrop p-5 rounded-2xl shadow-lg">
        <p className="text-md text-emerald-300">{t(lang, 'lastDetection')}</p>
        {lastReport ? (
          <div className="mt-3 flex flex-col gap-1">
            <p className="text-lg font-semibold capitalize">{lastReport.diseaseName}</p>
            <p className="text-white/90">Confidence: {(lastReport.confidence * 100).toFixed(1)}%</p>
            <p className="text-white/80 text-sm">Treatment: {lastReport.treatment}</p>
          </div>
        ) : (
          <p className="text-white/85 mt-2">{t(lang, 'detectionFallback')}</p>
        )}
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
      setStatus('Please choose a leaf image.')
      return
    }
    if (!file.type.startsWith('image/')) {
      setStatus('Please upload a valid image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus('Image is too large. Please upload an image under 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        setStatus('Sending to AI…')
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
          setStatus('Session expired. Please login again.')
          onAuthFailure?.()
          navigate('/login')
          return
        }
        if (statusCode === 422) {
          const errMsg = err?.response?.data?.message || 'Please upload a crop leaf image.'
          setStatus(`⚠️ ${errMsg}`)
          return
        }
        setStatus('Unable to detect right now. Please retry.')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl shadow-lg ">
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
                  {crop.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-3 rounded-lg border border-amber-300/30 bg-amber-100/10 px-3 py-2">
              <p className="text-xs font-semibold text-amber-200">{t(lang, 'photoChecklistTitle')}</p>
              <ul className="mt-1 space-y-1 list-disc list-inside text-xs text-amber-100/90">
                <li>{t(lang, 'photoChecklistSingleLeaf')}</li>
                <li>{t(lang, 'photoChecklistGoodLighting')}</li>
                <li>{t(lang, 'photoChecklistCloseUp')}</li>
                <li>{t(lang, 'photoChecklistAvoidBlur')}</li>
              </ul>
            </div>
            <label className="block text-sm text-slate-200 mb-1">Image</label>
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

  const diseaseLabel = (report.diseaseName || 'Unknown').replace(/_/g, ' ')

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl space-y-4 shadow-lg">
      <p className="text-sm text-emerald-300 uppercase tracking-wide">{t(lang, 'result')}</p>

      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-semibold capitalize">{diseaseLabel}</h2>
        {report.severity && (
          <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${severityColor}`}>
            {report.severity} severity
          </span>
        )}
        {report.healthy && (
          <span className="text-xs font-bold uppercase px-2 py-1 rounded-full bg-emerald-600 text-white">
            Healthy
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-slate-400">Confidence</p>
          <p className="text-white font-semibold">{(report.confidence * 100).toFixed(1)}%</p>
        </div>
        {report.affectedAreaPercent != null && (
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-slate-400">Affected Area</p>
            <p className="text-white font-semibold">{report.affectedAreaPercent.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {report.symptoms && report.symptoms.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-sm font-semibold text-emerald-300 mb-2">Observed Symptoms</p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
            {report.symptoms.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg p-4">
        <p className="text-sm font-semibold text-emerald-300 mb-1">Recommended Treatment</p>
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
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl shadow-lg flex flex-wrap gap-2">
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
            <div className="bg-amber-100/10 border border-amber-300/30 rounded-2xl p-4 sm:p-5 shadow-lg">
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
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-lg">
          <p className="text-slate-300">{t(lang, 'previousDetectionFallback')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-lg max-h-[26rem] overflow-y-auto">
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
                    <p className="font-medium capitalize">{(report.diseaseName || 'Unknown').replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">{t(lang, 'reportLabel')} #{report.reportId}</p>
                    <p className="text-xs text-slate-400">{(report.confidence * 100).toFixed(1)}% confidence</p>
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

function AdvisoryPage({ lang, token, lastReport }) {
  const [cropType, setCropType] = useState('tomato')
  const [advisory, setAdvisory] = useState(null)
  const [status, setStatus] = useState('')

  const fetchAdvisory = async () => {
    setStatus('Loading advisory…')
    try {
      const diseaseName = lastReport?.cropType === cropType ? lastReport?.diseaseName : undefined
      const { data } = await api.get('/api/advisory', { params: { cropType, diseaseName } })
      setAdvisory(data)
      setStatus('')
    } catch (err) {
      console.error('Advisory API request failed', err)
      setStatus('Unable to load advisory right now.')
    }
  }

  useEffect(() => {
    fetchAdvisory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropType])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">{t(lang, 'advisory')}</h2>
          <select
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 w-full sm:w-auto"
          >
            {crops.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-slate-300 mt-2">{t(lang, 'advisoryBlurb')}</p>
        {status && <p className="text-sm text-emerald-300 mt-2">{status}</p>}
        {advisory && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <AdviceCard title="Fertilizer" items={advisory.fertilizer} />
            <AdviceCard title="Irrigation" items={advisory.irrigation} />
            <AdviceCard title="Pest" items={advisory.pestManagement} />
            <AdviceCard title="Weather" items={advisory.weatherWarnings} />
            {advisory.diseaseAdvice?.length > 0 && <AdviceCard title="Disease-Specific" items={advisory.diseaseAdvice} />}
          </div>
        )}
      </div>
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-300">{t(lang, 'advisoryCompanionTitle')}</p>
          <p className="text-slate-300 text-sm mt-2">{t(lang, 'advisoryCompanionSubtitle')}</p>
        </div>

        {lastReport ? (
          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-200">{t(lang, 'lastDetection')}</p>
            <p className="mt-1 text-white font-semibold capitalize">{(lastReport.diseaseName || 'Unknown').replace(/_/g, ' ')}</p>
            <p className="text-sm text-slate-300">{t(lang, 'dashboardMetricConfidence')}: {(lastReport.confidence * 100).toFixed(1)}%</p>
          </div>
        ) : (
          <p className="text-sm text-slate-300">{t(lang, 'advisoryNoRecentDetection')}</p>
        )}

        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
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
    <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60">
      <p className="font-semibold text-emerald-200">{title}</p>
      <ul className="mt-2 space-y-2 text-slate-300 text-sm list-disc list-inside">
        {items?.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function MarketPage({ lang, user }) {
  const [cropType, setCropType] = useState('tomato')
  const [market, setMarket] = useState(null)
  const [marketError, setMarketError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/market', { params: { cropType, city: user?.city || 'pune' } })
        setMarket(data)
        setMarketError('')
      } catch (err) {
        console.error('Market API request failed', err)
        setMarketError('Unable to load market data right now.')
      }
    }
    load()
  }, [cropType, user])

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
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
              {c.label}
            </option>
          ))}
        </select>
      </div>
      {marketError && <p className="mt-3 text-sm text-rose-300">{marketError}</p>}
      {market && (
        <div className="mt-4">
          <div className="flex items-center gap-3 text-lg">
            <span className="font-semibold text-emerald-200">₹{market.currentPrice}</span>
            <span className="text-slate-400 text-sm">{market.city} mandi</span>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {market.trend.map((point) => (
              <div key={point.date} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <p className="text-sm text-slate-400">{point.date}</p>
                <p className="text-lg font-semibold">₹{point.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
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

  const clearSession = useCallback(() => {
    setToken('')
    setUser(null)
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
        setWeather({ city: 'Pune', temperature: 30, windSpeed: 2.5, condition: 'clear', advice: 'Stay hydrated' })
      }
    }
    fetchWeather()
  }, [user])

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

  useEffect(() => {
    fetchRecentReports()
  }, [fetchRecentReports])

  const onDetectionComplete = useCallback((report) => {
    setLastReport(report)
    setReportHistory((prev) => {
      const withoutCurrent = prev.filter((item) => item.reportId !== report.reportId)
      return [report, ...withoutCurrent].slice(0, 10)
    })
  }, [])

  const onLogout = () => {
    clearSession()
  }

  return (
    <Layout lang={lang} setLang={setLang} user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Dashboard lang={lang} lastReport={lastReport || reportHistory[0]} weather={weather} />} />
        <Route path="/login" element={<AuthForm mode="login" setUser={setUser} setToken={setToken} lang={lang} />} />
        <Route path="/register" element={<AuthForm mode="register" setUser={setUser} setToken={setToken} lang={lang} />} />
        <Route
          path="/upload"
          element={<UploadPage token={token} lang={lang} onAuthFailure={clearSession} onDetectionComplete={onDetectionComplete} />}
        />
        <Route path="/result" element={<ResultPage lastReport={lastReport || reportHistory[0]} reports={reportHistory} lang={lang} />} />
        <Route path="/advisory" element={<AdvisoryPage lang={lang} token={token} lastReport={lastReport || reportHistory[0]} />} />
        <Route path="/market" element={<MarketPage lang={lang} user={user} />} />
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
