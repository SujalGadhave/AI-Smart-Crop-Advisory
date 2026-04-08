import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function NavLink({ to, label }) {
  const location = useLocation()
  const active = location.pathname === to
  return (
    <Link
      to={to}
      className={`snap-start px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border whitespace-nowrap transition-colors ${
        active ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200' : 'border-transparent hover:border-slate-700'
      }`}
    >
      {label}
    </Link>
  )
}

export default NavLink
