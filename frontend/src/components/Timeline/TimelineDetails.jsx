import React from 'react'
import { t } from '../../translations'
import FollowUpForm from './FollowUpForm'

function TimelineDetails({
  lang,
  selectedItem,
  followUpStatusLabel,
  formatDateTime,
  followUpForm,
  setFollowUpForm,
  saveFollowUp,
  saving,
  status,
}) {
  if (!selectedItem) {
    return (
      <div className="lg:col-span-2 bg-white/10 p-6 km-card">
        <p className="text-slate-300">{t(lang, 'timelineEmpty')}</p>
      </div>
    )
  }

  return (
    <div className="lg:col-span-2 bg-white/10 p-6 km-card">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold capitalize">{(selectedItem.diseaseName || t(lang, 'unknownDisease')).replace(/_/g, ' ')}</h2>
          <span className="text-xs uppercase px-2 py-1 rounded-full bg-slate-700 text-slate-200">
            {followUpStatusLabel(selectedItem.followUpStatus || 'PENDING')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-slate-800 rounded-lg p-3 km-subcard">
            <p className="text-slate-400">{t(lang, 'timelineDetectedAt')}</p>
            <p className="text-white font-semibold">{formatDateTime(selectedItem.createdAt)}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 km-subcard">
            <p className="text-slate-400">{t(lang, 'timelineNextFollowUp')}</p>
            <p className="text-white font-semibold">{formatDateTime(selectedItem.nextFollowUpAt)}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 km-subcard">
            <p className="text-slate-400">{t(lang, 'dashboardMetricConfidence')}</p>
            <p className="text-white font-semibold">{(selectedItem.confidence * 100).toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 km-subcard">
          <p className="text-sm font-semibold text-emerald-300 mb-2">{t(lang, 'timelineReminders')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(selectedItem.reminderSchedule || []).map((entry) => (
              <div key={entry} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                {formatDateTime(entry)}
              </div>
            ))}
          </div>
        </div>

        <FollowUpForm
          lang={lang}
          followUpForm={followUpForm}
          setFollowUpForm={setFollowUpForm}
          saveFollowUp={saveFollowUp}
          saving={saving}
          status={status}
        />
      </div>
    </div>
  )
}

export default TimelineDetails
