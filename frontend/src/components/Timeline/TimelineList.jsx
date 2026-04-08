import React from 'react'
import { t } from '../../translations'

function TimelineList({ lang, loading, items, selectedItem, setSelectedId, formatDateTime }) {
  return (
    <div className="bg-white/10 p-3 max-h-[34rem] overflow-y-auto km-card">
      <p className="text-sm text-emerald-300 mb-2">{t(lang, 'timeline')}</p>
      {loading ? (
        <p className="text-slate-300 text-sm">{t(lang, 'timelineLoading')}</p>
      ) : items.length === 0 ? (
        <p className="text-slate-300 text-sm">{t(lang, 'timelineEmpty')}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const active = item.reportId === (selectedItem?.reportId)
            return (
              <button
                key={item.reportId}
                onClick={() => setSelectedId(item.reportId)}
                className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                  active
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
              >
                <p className="font-medium capitalize">{(item.diseaseName || t(lang, 'unknownDisease')).replace(/_/g, ' ')}</p>
                <p className="text-xs text-slate-400">{t(lang, 'reportLabel')} #{item.reportId}</p>
                <p className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TimelineList
