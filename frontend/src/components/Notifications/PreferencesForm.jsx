import React from 'react'
import { t } from '../../translations'

function PreferencesForm({
  lang,
  preferences,
  updateToggle,
  updateField,
  maskSensitiveValue,
  formatDateTime,
  status,
  saving,
  savePreferences,
}) {
  return (
    <form className="mt-4 space-y-4" onSubmit={savePreferences}>
      <div className="space-y-3 rounded-xl border border-white/10 bg-slate-950/60 p-4 km-subcard">
        <label className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-200">{t(lang, 'notificationsSettingsInApp')}</span>
          <input type="checkbox" checked={Boolean(preferences.inAppEnabled)} onChange={updateToggle('inAppEnabled')} />
        </label>

        <label className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-200">{t(lang, 'notificationsSettingsSms')}</span>
          <input type="checkbox" checked={Boolean(preferences.smsEnabled)} onChange={updateToggle('smsEnabled')} />
        </label>
        <input
          value={preferences.smsNumber || ''}
          onChange={updateField('smsNumber')}
          placeholder={t(lang, 'notificationsSettingsSmsNumber')}
          type="tel"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        />

        <label className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-200">{t(lang, 'notificationsSettingsWhatsapp')}</span>
          <input type="checkbox" checked={Boolean(preferences.whatsappEnabled)} onChange={updateToggle('whatsappEnabled')} />
        </label>
        <input
          value={preferences.whatsappNumber || ''}
          onChange={updateField('whatsappNumber')}
          placeholder={t(lang, 'notificationsSettingsWhatsappNumber')}
          type="tel"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        />

        <label className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-200">{t(lang, 'notificationsSettingsPush')}</span>
          <input type="checkbox" checked={Boolean(preferences.pushEnabled)} onChange={updateToggle('pushEnabled')} />
        </label>
        <input
          value={preferences.pushToken || ''}
          onChange={updateField('pushToken')}
          placeholder={t(lang, 'notificationsSettingsPushToken')}
          type="password"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-300 km-subcard">
        <p className="text-slate-200 font-semibold">{t(lang, 'notificationsSettingsSavedEndpoints')}</p>
        <p className="mt-2">SMS: {maskSensitiveValue('SMS', preferences.smsNumber) || '--'}</p>
        <p className="mt-1">WhatsApp: {maskSensitiveValue('WHATSAPP', preferences.whatsappNumber) || '--'}</p>
        <p className="mt-1">Push: {maskSensitiveValue('PUSH', preferences.pushToken) || '--'}</p>
      </div>

      {preferences.updatedAt && (
        <p className="text-xs text-slate-400">
          {t(lang, 'notificationsSettingsUpdatedAt')}: {formatDateTime(preferences.updatedAt)}
        </p>
      )}

      {status && <p className="text-sm text-emerald-200">{status}</p>}

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-900 font-semibold hover:bg-emerald-400 disabled:opacity-60"
      >
        {saving ? t(lang, 'notificationsSettingsSaving') : t(lang, 'notificationsSettingsSave')}
      </button>
    </form>
  )
}

export default PreferencesForm
