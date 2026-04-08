import React from 'react'

function Input({ label, ...props }) {
  return (
    <label className="block text-sm font-medium text-slate-200">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
        {...props}
      />
    </label>
  )
}

export default Input
