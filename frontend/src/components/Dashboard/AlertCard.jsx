import React from 'react'
import { Link } from 'react-router-dom'
import { t } from '../../translations'
import { formatLocalizedCurrency } from '../../utils/formatters'

function AlertCard({
  lang,
  riskAlerts,
  notifications,
  unreadNotifications,
  marketTriggeredAlerts,
  directionLabel,
  localizedRiskLevel,
  localizedRiskTitle,
  localizedRiskMessage,
  localizedNotificationLevel,
  localizedNotificationTitle,
  localizedNotificationMessage,
  formatDateTime,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}) {
  return (
    <>
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
    </>
  )
}

export default AlertCard
