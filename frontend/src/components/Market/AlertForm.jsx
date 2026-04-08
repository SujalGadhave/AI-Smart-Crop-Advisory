import React from 'react'
import { t } from '../../translations'

function AlertForm({
  lang,
  alertTargetPrice,
  setAlertTargetPrice,
  alertDirection,
  setAlertDirection,
  alertStatus,
  createAlert,
}) {
  return (
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
  )
}

export default AlertForm
