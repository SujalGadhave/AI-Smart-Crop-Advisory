import React from 'react'
import { Link } from 'react-router-dom'
import { t } from '../../translations'

function CompanionCard({ lang, lastReport }) {
  return (
    <div className="bg-slate-900 p-6 space-y-4 km-card">
      <div>
        <p className="text-sm uppercase tracking-wide text-emerald-300">{t(lang, 'advisoryCompanionTitle')}</p>
        <p className="text-slate-300 text-sm mt-2">{t(lang, 'advisoryCompanionSubtitle')}</p>
      </div>

      {lastReport ? (
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 km-subcard">
          <p className="text-xs uppercase tracking-wide text-emerald-200">{t(lang, 'lastDetection')}</p>
          <p className="mt-1 text-white font-semibold capitalize">{(lastReport.diseaseName || t(lang, 'unknownDisease')).replace(/_/g, ' ')}</p>
          <p className="text-sm text-slate-300">{t(lang, 'dashboardMetricConfidence')}: {(lastReport.confidence * 100).toFixed(1)}%</p>
        </div>
      ) : (
        <p className="text-sm text-slate-300">{t(lang, 'advisoryNoRecentDetection')}</p>
      )}

      <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 km-subcard">
        <p className="text-xs uppercase tracking-wide text-emerald-200">{t(lang, 'advisoryChecklistTitle')}</p>
        <ul className="mt-2 space-y-2 text-sm text-slate-200 list-disc list-inside">
          <li>{t(lang, 'advisoryChecklistOne')}</li>
          <li>{t(lang, 'advisoryChecklistTwo')}</li>
          <li>{t(lang, 'advisoryChecklistThree')}</li>
        </ul>
      </div>

      <Link
        to="/upload"
        className="inline-flex items-center justify-center w-full px-4 py-2 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 transition"
      >
        {t(lang, 'uploadNewLeaf')}
      </Link>
    </div>
  )
}

export default CompanionCard
