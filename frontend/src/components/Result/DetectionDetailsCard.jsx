import React from 'react'
import { t } from '../../translations'

function DetectionDetailsCard({ report, lang }) {
  if (!report) {
    return <p className="text-slate-400">{t(lang, 'detectionFallback')}</p>
  }

  const severityColor = {
    low: 'bg-emerald-700 text-emerald-100',
    medium: 'bg-yellow-600 text-yellow-100',
    high: 'bg-red-700 text-red-100',
  }[report.severity?.toLowerCase()] || 'bg-slate-700 text-slate-200'

  const diseaseLabel = (report.diseaseName || t(lang, 'unknownDisease')).replace(/_/g, ' ')

  return (
    <div className="bg-white/10 p-6 space-y-4 km-card km-card-interactive">
      <p className="text-sm text-emerald-300 uppercase tracking-wide">{t(lang, 'result')}</p>

      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-semibold capitalize">{diseaseLabel}</h2>
        {report.severity && (
          <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${severityColor}`}>
            {report.severity} {t(lang, 'labelSeverity')}
          </span>
        )}
        {report.healthy && (
          <span className="text-xs font-bold uppercase px-2 py-1 rounded-full bg-emerald-600 text-white">
            {t(lang, 'labelHealthy')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-800 rounded-lg p-3 km-subcard">
          <p className="text-slate-400">{t(lang, 'dashboardMetricConfidence')}</p>
          <p className="text-white font-semibold">{(report.confidence * 100).toFixed(1)}%</p>
        </div>
        {report.affectedAreaPercent != null && (
          <div className="bg-slate-800 rounded-lg p-3 km-subcard">
            <p className="text-slate-400">{t(lang, 'labelAffectedArea')}</p>
            <p className="text-white font-semibold">{report.affectedAreaPercent.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {report.symptoms && report.symptoms.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4 km-subcard">
          <p className="text-sm font-semibold text-emerald-300 mb-2">{t(lang, 'labelObservedSymptoms')}</p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
            {report.symptoms.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg p-4 km-subcard">
        <p className="text-sm font-semibold text-emerald-300 mb-1">{t(lang, 'labelRecommendedTreatment')}</p>
        <p className="text-slate-300 text-sm">{report.treatment}</p>
      </div>

      <p className="text-slate-500 text-xs">{t(lang, 'reportLabel')} #{report.reportId}</p>
    </div>
  )
}

export default DetectionDetailsCard
