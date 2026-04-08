import React, { useEffect } from 'react'
import beg from '../../assets/beg.png'
import { t } from '../../translations'
import { formatLocalizedCurrency, formatLocalizedDateTime, getCropLabel } from '../../utils/formatters'
import { parseMarketNotificationPayload } from '../../utils/parsers'
import MetricCard from './MetricCard'
import AlertCard from './AlertCard'
import WeatherCard from './WeatherCard'

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
          <p className="text-xs sm:text-sm text-emerald-300 uppercase tracking-[0.16em]">{t(lang, 'hub')}</p>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold mt-2 leading-tight">{t(lang, 'protect')}</h2>

          <h4 className="text-base sm:text-lg font-medium mt-2 text-white/95">{t(lang, 'scan')}</h4>

          <p className="text-white/90 mt-3 text-sm sm:text-base leading-relaxed">{t(lang, 'dashboardSummary')}</p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              { title: t(lang, 'dashboardMetricDisease'), value: latestDisease, capitalize: true },
              { title: t(lang, 'dashboardMetricConfidence'), value: latestConfidence },
              { title: t(lang, 'dashboardMetricTemp'), value: temperature },
              { title: t(lang, 'dashboardMetricWind'), value: wind },
            ].map((card) => (
              <MetricCard key={card.title} title={card.title} value={card.value} capitalize={card.capitalize} />
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

          <AlertCard
            lang={lang}
            riskAlerts={riskAlerts}
            notifications={notifications}
            unreadNotifications={unreadNotifications}
            marketTriggeredAlerts={marketTriggeredAlerts}
            directionLabel={directionLabel}
            localizedRiskLevel={localizedRiskLevel}
            localizedRiskTitle={localizedRiskTitle}
            localizedRiskMessage={localizedRiskMessage}
            localizedNotificationLevel={localizedNotificationLevel}
            localizedNotificationTitle={localizedNotificationTitle}
            localizedNotificationMessage={localizedNotificationMessage}
            formatDateTime={formatDateTime}
            onMarkNotificationRead={onMarkNotificationRead}
            onMarkAllNotificationsRead={onMarkAllNotificationsRead}
          />
        </div>
      </div>

      <div className="lg:col-span-1 grid grid-cols-1 gap-4 lg:sticky lg:top-24 self-start">
        <WeatherCard lang={lang} weather={weather} />

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

export default Dashboard
