import React from 'react'
import { t } from '../../translations'

function DeliveryHistory({
  lang,
  deliveryHistory,
  highlightedRetryAttemptId,
  statusTone,
  formatDateTime,
  maskSensitiveValue,
  retryDeliveryAttempt,
  retryingAttemptId,
}) {
  return (
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
  )
}

export default DeliveryHistory
