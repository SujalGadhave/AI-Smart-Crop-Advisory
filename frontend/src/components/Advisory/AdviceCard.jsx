import React from 'react'

function AdviceCard({ title, items }) {
  return (
    <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 km-subcard km-subcard-interactive">
      <p className="font-semibold text-emerald-200">{title}</p>
      <ul className="mt-2 space-y-2 text-slate-300 text-sm list-disc list-inside">
        {items?.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default AdviceCard
