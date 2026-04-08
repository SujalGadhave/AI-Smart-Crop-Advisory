import React from 'react'
import { t } from '../../translations'
import { formatLocalizedCurrency } from '../../utils/formatters'

function AlertsList({ lang, alerts, directionLabel, alertSummary, deleteAlert }) {
  return (
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
  )
}

export default AlertsList
