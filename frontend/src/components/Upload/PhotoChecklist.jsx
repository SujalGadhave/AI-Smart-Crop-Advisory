import React from 'react'
import { t } from '../../translations'

function PhotoChecklist({ lang }) {
  return (
    <div className="mb-3 rounded-lg border border-amber-300/30 bg-amber-100/10 px-3 py-2 transition duration-300 hover:bg-amber-100/15">
      <p className="text-xs font-semibold text-amber-200">{t(lang, 'photoChecklistTitle')}</p>
      <ul className="mt-1 space-y-1 list-disc list-inside text-xs text-amber-100/90">
        <li>{t(lang, 'photoChecklistSingleLeaf')}</li>
        <li>{t(lang, 'photoChecklistGoodLighting')}</li>
        <li>{t(lang, 'photoChecklistCloseUp')}</li>
        <li>{t(lang, 'photoChecklistAvoidBlur')}</li>
      </ul>
    </div>
  )
}

export default PhotoChecklist
