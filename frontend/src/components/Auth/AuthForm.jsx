import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '../../translations'
import { api } from '../../services/api'
import Input from './Input'

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

export default AuthForm
