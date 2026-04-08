import React, { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdvisoryPage } from './components/Advisory'
import { AuthForm } from './components/Auth'
import { Dashboard } from './components/Dashboard'
import { Layout } from './components/Layout'
import { MarketPage } from './components/Market'
import { NotificationSettingsPage } from './components/Notifications'
import { ResultPage } from './components/Result'
import { TimelinePage } from './components/Timeline'
import { UploadPage } from './components/Upload'
import { AuthProvider, DataProvider } from './context'
import {
  useAuth,
  useMarketAlerts,
  useNotifications,
  useReports,
  useRiskAlerts,
  useWeather,
} from './hooks'

function AppShell() {
  const [lang, setLang] = useState('en')
  const auth = useAuth()

  const { weather } = useWeather(lang, auth.user)
  const { riskAlerts, fetchRiskAlerts } = useRiskAlerts(auth.token, auth.clearSession)
  const { marketAlerts, triggeredAlerts } = useMarketAlerts(auth.token, auth.clearSession)
  const {
    notifications,
    setNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications(auth.token, auth.clearSession)
  const { lastReport, reportHistory, onDetectionComplete } = useReports(fetchRiskAlerts, fetchNotifications)

  useEffect(() => {
    if (!auth.token) {
      setNotifications([])
    }
  }, [auth.token, setNotifications])

  const clearSession = useCallback(() => {
    auth.clearSession()
    setNotifications([])
  }, [auth, setNotifications])

  const onLogout = () => {
    clearSession()
  }

  const authValue = {
    token: auth.token,
    user: auth.user,
    setToken: auth.setToken,
    setUser: auth.setUser,
    clearSession,
    isAuthenticated: auth.isAuthenticated,
  }

  const dataValue = {
    weather,
    reportHistory,
    riskAlerts,
    marketAlerts,
    notifications,
  }

  return (
    <AuthProvider value={authValue}>
      <DataProvider value={dataValue}>
        <Layout lang={lang} setLang={setLang} user={auth.user} onLogout={onLogout}>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  lang={lang}
                  lastReport={lastReport || reportHistory[0]}
                  weather={weather}
                  riskAlerts={riskAlerts}
                  marketTriggeredAlerts={triggeredAlerts}
                  notifications={notifications}
                  onMarkNotificationRead={markAsRead}
                  onMarkAllNotificationsRead={markAllAsRead}
                />
              }
            />
            <Route path="/login" element={<AuthForm mode="login" setUser={auth.setUser} setToken={auth.setToken} lang={lang} />} />
            <Route path="/register" element={<AuthForm mode="register" setUser={auth.setUser} setToken={auth.setToken} lang={lang} />} />
            <Route
              path="/upload"
              element={<UploadPage token={auth.token} lang={lang} onAuthFailure={clearSession} onDetectionComplete={onDetectionComplete} />}
            />
            <Route path="/result" element={<ResultPage lastReport={lastReport || reportHistory[0]} reports={reportHistory} lang={lang} />} />
            <Route path="/timeline" element={<TimelinePage lang={lang} token={auth.token} onAuthFailure={clearSession} />} />
            <Route path="/advisory" element={<AdvisoryPage lang={lang} token={auth.token} lastReport={lastReport || reportHistory[0]} />} />
            <Route path="/market" element={<MarketPage lang={lang} user={auth.user} token={auth.token} onAuthFailure={clearSession} />} />
            <Route path="/alerts" element={<NotificationSettingsPage lang={lang} token={auth.token} onAuthFailure={clearSession} />} />
          </Routes>
        </Layout>
      </DataProvider>
    </AuthProvider>
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
