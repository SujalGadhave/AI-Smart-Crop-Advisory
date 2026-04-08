import React from 'react'
import { t } from '../../translations'

function DiagnosticsPanel({
  lang,
  diagnostics,
  lastDiagnosticsRefreshAt,
  formatDateTime,
  channelLabel,
  diagnosticsTrendWidth,
}) {
  return (
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
  )
}

export default DiagnosticsPanel
