import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '../../translations'
import { LOW_CONFIDENCE_THRESHOLD } from '../../utils/constants'
import DetectionDetailsCard from './DetectionDetailsCard'
import DetectionTabs from './DetectionTabs'

function ResultPage({ lastReport, reports, lang }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('latest')
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)
  const [showCurrentResult, setShowCurrentResult] = useState(false)

  const latestReport = lastReport || reports?.[0] || null
  const previousReports = (reports || []).filter((report) => report.reportId !== latestReport?.reportId)
  const selectedPrevious = previousReports.find((report) => report.reportId === selectedHistoryId) || previousReports[0] || null
  const isLowConfidenceLatest =
    latestReport && typeof latestReport.confidence === 'number' && latestReport.confidence < LOW_CONFIDENCE_THRESHOLD

  useEffect(() => {
    setShowCurrentResult(!isLowConfidenceLatest)
  }, [isLowConfidenceLatest, latestReport?.reportId])

  return (
    <div className="max-w-4xl mx-auto space-y-4 km-fade-up">
      <DetectionTabs lang={lang} activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'latest' ? (
        <div className="space-y-4">
          {isLowConfidenceLatest && (
            <div className="bg-amber-100/10 border border-amber-300/30 rounded-2xl p-4 sm:p-5 shadow-lg transition duration-300 hover:bg-amber-100/15">
              <p className="text-amber-200 font-semibold">{t(lang, 'lowConfidenceWarningTitle')}</p>
              <p className="text-amber-100/90 text-sm mt-1">{t(lang, 'lowConfidenceWarningText')}</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => navigate('/upload')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-300 text-black font-semibold hover:bg-amber-200 transition"
                >
                  {t(lang, 'reuploadImage')}
                </button>
                <button
                  onClick={() => setShowCurrentResult(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition"
                >
                  {t(lang, 'viewCurrentResult')}
                </button>
              </div>
            </div>
          )}

          {(!isLowConfidenceLatest || showCurrentResult) && <DetectionDetailsCard report={latestReport} lang={lang} />}
        </div>
      ) : previousReports.length === 0 ? (
        <div className="bg-white/10 p-6 km-card">
          <p className="text-slate-300">{t(lang, 'previousDetectionFallback')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white/10 p-3 max-h-[26rem] overflow-y-auto km-card">
            <p className="text-sm text-emerald-300 mb-2">{t(lang, 'previousDetections')}</p>
            <div className="space-y-2">
              {previousReports.map((report) => {
                const isActive = report.reportId === (selectedPrevious?.reportId)
                return (
                  <button
                    key={report.reportId}
                    onClick={() => setSelectedHistoryId(report.reportId)}
                    className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                      isActive
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100'
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <p className="font-medium capitalize">{(report.diseaseName || t(lang, 'unknownDisease')).replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">{t(lang, 'reportLabel')} #{report.reportId}</p>
                    <p className="text-xs text-slate-400">{(report.confidence * 100).toFixed(1)}% {t(lang, 'labelConfidenceLower')}</p>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="lg:col-span-2">
            <DetectionDetailsCard report={selectedPrevious} lang={lang} />
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultPage
