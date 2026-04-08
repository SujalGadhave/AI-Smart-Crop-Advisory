import React from 'react'
import { t } from '../../translations'

function FollowUpForm({ lang, followUpForm, setFollowUpForm, saveFollowUp, saving, status }) {
  return (
    <form onSubmit={saveFollowUp} className="space-y-3">
      <div>
        <label className="block text-sm text-slate-200 mb-1">{t(lang, 'timelineStatus')}</label>
        <select
          value={followUpForm.status}
          onChange={(event) => setFollowUpForm((prev) => ({ ...prev, status: event.target.value }))}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
        >
          <option value="PENDING">{t(lang, 'timelineStatusPending')}</option>
          <option value="IN_PROGRESS">{t(lang, 'timelineStatusInProgress')}</option>
          <option value="COMPLETED">{t(lang, 'timelineStatusCompleted')}</option>
          <option value="NEEDS_ATTENTION">{t(lang, 'timelineStatusNeedsAttention')}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-slate-200 mb-1">{t(lang, 'timelineNotes')}</label>
        <textarea
          rows={4}
          value={followUpForm.notes}
          onChange={(event) => setFollowUpForm((prev) => ({ ...prev, notes: event.target.value }))}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
        />
      </div>

      {status && <p className="text-sm text-emerald-200">{status}</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-60"
      >
        {saving ? t(lang, 'timelineSaving') : t(lang, 'timelineSave')}
      </button>
    </form>
  )
}

export default FollowUpForm
