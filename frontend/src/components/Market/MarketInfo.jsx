import React from 'react'
import { t } from '../../translations'
import { formatLocalizedCurrency } from '../../utils/formatters'

function MarketInfo({ lang, market, marketError, cropType, setCropType, crops, getCropLabel }) {
  return (
    <div className="lg:col-span-2 bg-slate-900 p-6 km-card">
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
              {getCropLabel(lang, c.value)}
            </option>
          ))}
        </select>
      </div>
      {marketError && <p className="mt-3 text-sm text-rose-300">{marketError}</p>}
      {market && (
        <div className="mt-4">
          <div className="flex items-center gap-3 text-lg">
            <span className="font-semibold text-emerald-200">{formatLocalizedCurrency(market.currentPrice, lang)}</span>
            <span className="text-slate-400 text-sm">{market.city} {t(lang, 'marketMandiLabel')}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {market.trend.map((point) => (
              <div key={point.date} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 km-subcard km-subcard-interactive">
                <p className="text-sm text-slate-400">{point.date}</p>
                <p className="text-lg font-semibold">{formatLocalizedCurrency(point.price, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketInfo
