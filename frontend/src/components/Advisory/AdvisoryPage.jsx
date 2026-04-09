import React, { useEffect, useState } from 'react'
import { t } from '../../translations'
import { api } from '../../services/api'
import { crops } from '../../utils/constants'
import { getCropLabel } from '../../utils/formatters'
import AdviceCard from './AdviceCard'
import CompanionCard from './CompanionCard'

function AdvisoryPage({ lang, token: _token, lastReport }) {
  const [cropType, setCropType] = useState('tomato')
  const [advisory, setAdvisory] = useState(null)
  const [status, setStatus] = useState('')

  const fetchAdvisory = async () => {
    setStatus(t(lang, 'advisoryLoading'))
    try {
      const diseaseName = lastReport?.cropType === cropType ? lastReport?.diseaseName : undefined
      const { data } = await api.get('/api/advisory', { params: { cropType, diseaseName } })
      setAdvisory(data)
      setStatus('')
    } catch (err) {
      console.error('Advisory API request failed', err)
      setStatus(t(lang, 'advisoryLoadFailed'))
    }
  }

  useEffect(() => {
    fetchAdvisory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropType])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 km-fade-up">
      <div className="md:col-span-2 bg-slate-900 p-6 km-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">{t(lang, 'advisory')}</h2>
          <select
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 w-full sm:w-auto"
          >
            {crops.map((c) => (
              <option key={c.value} value={c.value}>
                {getCropLabel(lang, c.value)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-slate-300 mt-2">{t(lang, 'advisoryBlurb')}</p>
        {status && <p className="text-sm text-emerald-300 mt-2">{status}</p>}
        {advisory && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <AdviceCard title={t(lang, 'adviceFertilizer')} items={advisory.fertilizer} />
            <AdviceCard title={t(lang, 'adviceIrrigation')} items={advisory.irrigation} />
            <AdviceCard title={t(lang, 'advicePest')} items={advisory.pestManagement} />
            <AdviceCard title={t(lang, 'adviceWeather')} items={advisory.weatherWarnings} />
            {advisory.diseaseAdvice?.length > 0 && <AdviceCard title={t(lang, 'adviceDiseaseSpecific')} items={advisory.diseaseAdvice} />}
          </div>
        )}
      </div>
      <CompanionCard lang={lang} lastReport={lastReport} />
    </div>
  )
}

export default AdvisoryPage
