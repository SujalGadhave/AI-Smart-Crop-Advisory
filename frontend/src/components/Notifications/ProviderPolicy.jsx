import React from 'react'
import { t } from '../../translations'

function ProviderPolicy({ lang, providerPolicy, lastPolicyRefreshAt, formatDateTime, channelLabel }) {
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 km-subcard">
      <p className="text-xs uppercase tracking-wide text-cyan-300">{t(lang, 'notificationsSettingsPolicyTitle')}</p>
      {lastPolicyRefreshAt && (
        <p className="text-[11px] text-slate-500 mt-1">
          {t(lang, 'notificationsSettingsLastRefresh')}: {formatDateTime(lastPolicyRefreshAt)}
        </p>
      )}

      {providerPolicy.length === 0 ? (
        <p className="text-xs text-slate-400 mt-2">{t(lang, 'notificationsSettingsPolicyEmpty')}</p>
      ) : (
        <div className="mt-2 space-y-2">
          {providerPolicy.map((policy) => (
            <div key={policy.channel} className="rounded-lg border border-white/10 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-white">{channelLabel(policy.channel)}</p>
                <span className={`text-[10px] px-2 py-1 rounded-full ${policy.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                  {policy.enabled ? t(lang, 'notificationsSettingsPolicyEnabled') : t(lang, 'notificationsSettingsPolicyDisabled')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                {t(lang, 'notificationsSettingsConfiguredAttempts')}: {policy.configuredMaxAttempts} · {t(lang, 'notificationsSettingsEffectiveAttempts')}: {policy.effectiveMaxAttempts}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {t(lang, 'notificationsSettingsConfiguredBackoff')}: {policy.configuredInitialBackoffMs} ms · {t(lang, 'notificationsSettingsEffectiveBackoff')}: {policy.effectiveInitialBackoffMs} ms
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProviderPolicy
