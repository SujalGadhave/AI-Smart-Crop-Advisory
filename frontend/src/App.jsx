import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { t } from './translations'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
})

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

const crops = [
  { value: 'tomato', label: 'Tomato' },
  { value: 'potato', label: 'Potato' },
  { value: 'corn', label: 'Corn' },
]

function Layout({ children, lang, setLang, user, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-600 text-slate-900 font-bold grid place-items-center">KM</div>
            <div>
              <p className="text-lg font-semibold">{t(lang, 'title')}</p>
              <p className="text-xs text-slate-400">Plant village focused demo</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <select
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
            </select>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-300 hidden sm:inline">{user.name}</span>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
                >
                  {t(lang, 'logout')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
                >
                  {t(lang, 'login')}
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 bg-emerald-500 text-slate-900 font-semibold rounded-lg hover:bg-emerald-400"
                >
                  {t(lang, 'register')}
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-3 text-sm text-slate-300">
          <NavLink to="/" label={t(lang, 'dashboard')} />
          <NavLink to="/upload" label={t(lang, 'upload')} />
          <NavLink to="/result" label={t(lang, 'result')} />
          <NavLink to="/advisory" label={t(lang, 'advisory')} />
          <NavLink to="/market" label={t(lang, 'market')} />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
    </div>
  )
}

function NavLink({ to, label }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg border ${
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 p-6 rounded-2xl">
        <p className="text-sm text-emerald-300 uppercase tracking-wide">Demo flow</p>
        <h2 className="text-2xl font-semibold mt-2">{t(lang, 'subtitle')}</h2>
        <p className="text-slate-400 mt-3">Login → Upload → Result → Advisory → Market</p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[t(lang, 'upload'), t(lang, 'result'), t(lang, 'advisory'), t(lang, 'market')].map((step) => (
            <div key={step} className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-4 text-center">
              <p className="font-semibold text-emerald-200">{step}</p>
              <p className="text-slate-500">Prototype ready</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <p className="text-sm text-emerald-300">{t(lang, 'weather')}</p>
        {weather ? (
          <div className="mt-2 space-y-1">
            <p className="text-lg font-semibold">{weather.city}</p>
            <p className="text-slate-300">{weather.temperature.toFixed(1)}°C • wind {weather.windSpeed} m/s</p>
            <p className="text-slate-400 text-sm">{weather.advice}</p>
          </div>
        ) : (
          <p className="text-slate-400">Loading weather…</p>
        )}
      </div>
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl md:col-span-2">
        <p className="text-sm text-emerald-300">{t(lang, 'lastDetection')}</p>
        {lastReport ? (
          <div className="mt-3 flex flex-col gap-1">
            <p className="text-lg font-semibold capitalize">{lastReport.diseaseName}</p>
            <p className="text-slate-300">Confidence: {(lastReport.confidence * 100).toFixed(1)}%</p>
            <p className="text-slate-400 text-sm">Treatment: {lastReport.treatment}</p>
          </div>
        ) : (
          <p className="text-slate-400 mt-2">{t(lang, 'detectionFallback')}</p>
        )}
      </div>
    </div>
  )
}

function UploadPage({ token, setLastReport, lang, onAuthFailure }) {
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
        setLastReport(data)
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
        setStatus('Unable to detect right now. Please retry.')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl">
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
            <label className="block text-sm text-slate-200 mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            />
          </div>
        </div>
        {status && <p className="text-sm text-emerald-200">{status}</p>}
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

function ResultPage({ lastReport, lang }) {
  if (!lastReport) {
    return <p className="text-slate-400">{t(lang, 'detectionFallback')}</p>
  }
  return (
    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl">
      <p className="text-sm text-emerald-300 uppercase tracking-wide">{t(lang, 'result')}</p>
      <h2 className="text-2xl font-semibold mt-2 capitalize">{lastReport.diseaseName}</h2>
      <p className="text-slate-300 mt-2">Confidence: {(lastReport.confidence * 100).toFixed(1)}%</p>
      <p className="text-slate-400 mt-2">{lastReport.treatment}</p>
      <p className="text-slate-500 text-sm mt-3">Report #{lastReport.reportId}</p>
    </div>
  )
}

function AdvisoryPage({ lang, token }) {
  const [cropType, setCropType] = useState('tomato')
  const [advisory, setAdvisory] = useState(null)
  const [status, setStatus] = useState('')

  const fetchAdvisory = async () => {
    setStatus('Loading advisory…')
    try {
      const { data } = await api.get('/api/advisory', { params: { cropType } })
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t(lang, 'advisory')}</h2>
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
        <p className="text-slate-400 mt-2">{t(lang, 'advisoryBlurb')}</p>
        {status && <p className="text-sm text-emerald-300 mt-2">{status}</p>}
        {advisory && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <AdviceCard title="Fertilizer" items={advisory.fertilizer} />
            <AdviceCard title="Irrigation" items={advisory.irrigation} />
            <AdviceCard title="Pest" items={advisory.pestManagement} />
            <AdviceCard title="Weather" items={advisory.weatherWarnings} />
          </div>
        )}
      </div>
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <p className="text-sm text-emerald-300">Prototype guard</p>
        <p className="text-slate-400 text-sm mt-2">{token ? 'JWT attached to upload + detect flows.' : t(lang, 'tokenMissing')}</p>
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

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get('/api/market', { params: { cropType, city: user?.city || 'pune' } })
      setMarket(data)
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
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('km_user')
    return stored ? JSON.parse(stored) : null
  })
  const [lastReport, setLastReport] = useState(null)
  const [weather, setWeather] = useState(null)

  const clearSession = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('km_token')
    localStorage.removeItem('km_user')
  }

  useEffect(() => {
    if (!token) {
      return
    }
    const payload = decodeJwtPayload(token)
    const expiresAtMs = payload?.exp ? payload.exp * 1000 : 0
    if (!payload || (expiresAtMs > 0 && Date.now() >= expiresAtMs)) {
      clearSession()
    }
  }, [token])

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

  const onLogout = () => {
    clearSession()
  }

  return (
    <Layout lang={lang} setLang={setLang} user={user} onLogout={onLogout}>
      <Routes>
        <Route path="/" element={<Dashboard lang={lang} lastReport={lastReport} weather={weather} />} />
        <Route path="/login" element={<AuthForm mode="login" setUser={setUser} setToken={setToken} lang={lang} />} />
        <Route path="/register" element={<AuthForm mode="register" setUser={setUser} setToken={setToken} lang={lang} />} />
        <Route
          path="/upload"
          element={<UploadPage token={token} setLastReport={setLastReport} lang={lang} onAuthFailure={clearSession} />}
        />
        <Route path="/result" element={<ResultPage lastReport={lastReport} lang={lang} />} />
        <Route path="/advisory" element={<AdvisoryPage lang={lang} token={token} />} />
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
