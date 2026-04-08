import React from 'react'
import { t } from '../../translations'

function DetectionTabs({ lang, activeTab, setActiveTab }) {
  return (
    <div className="bg-white/10 p-2 flex flex-wrap gap-2 km-card">
      <button
        onClick={() => setActiveTab('latest')}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
          activeTab === 'latest' ? 'bg-emerald-500 text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {t(lang, 'latestResult')}
      </button>
      <button
        onClick={() => setActiveTab('previous')}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
          activeTab === 'previous' ? 'bg-emerald-500 text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        {t(lang, 'previousDetections')}
      </button>
    </div>
  )
}

export default DetectionTabs
