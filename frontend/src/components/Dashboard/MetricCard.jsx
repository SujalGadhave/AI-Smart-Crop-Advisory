import React from 'react'

function MetricCard({ title, value, capitalize }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3 py-4 text-center transition duration-300 hover:bg-white/20 hover:-translate-y-0.5">
      <p className="text-[11px] uppercase tracking-wide text-emerald-200">{title}</p>
      <p className={`mt-1 font-semibold text-white ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  )
}

export default MetricCard
