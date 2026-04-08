import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t } from '../../translations'
import { api } from '../../services/api'
import { crops } from '../../utils/constants'
import { getCropLabel } from '../../utils/formatters'
import PhotoChecklist from './PhotoChecklist'

function UploadPage({ token, lang, onAuthFailure, onDetectionComplete }) {
  const [file, setFile] = useState(null)
  const [cropType, setCropType] = useState('tomato')
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    const normalizedToken = typeof token === 'string' ? token.trim() : ''
    if (!normalizedToken || normalizedToken === 'undefined' || normalizedToken === 'null') {
      setStatus(t(lang, 'tokenMissing'))
      return
    }
    if (!file) {
      setStatus(t(lang, 'uploadChooseImage'))
      return
    }
    if (!file.type.startsWith('image/')) {
      setStatus(t(lang, 'uploadInvalidImage'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus(t(lang, 'uploadImageTooLarge'))
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        setStatus(t(lang, 'uploadSending'))
        const imageBase64 = reader.result.split(',')[1]
        const { data } = await api.post(
          '/api/crop/detect',
          { cropType, imageBase64 },
          { headers: { Authorization: `Bearer ${normalizedToken}` } }
        )
        onDetectionComplete?.(data)
        navigate('/result')
      } catch (err) {
        console.error('Image detection request failed', err)
        const statusCode = err?.response?.status
        if (statusCode === 401 || statusCode === 403) {
          setStatus(t(lang, 'timelineSessionExpired'))
          onAuthFailure?.()
          navigate('/login')
          return
        }
        if (statusCode === 422) {
          const errMsg = err?.response?.data?.message || t(lang, 'uploadCropLeafRequired')
          setStatus(`⚠️ ${errMsg}`)
          return
        }
        setStatus(t(lang, 'uploadDetectFailed'))
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-3xl mx-auto bg-white/10 p-6 km-card km-card-interactive km-fade-up">
      <h2 className="text-2xl font-semibold mb-2">{t(lang, 'upload')}</h2>
      <p className="text-slate-400 mb-4">{t(lang, 'uploadPrompt')}</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-200 mb-1">{t(lang, 'chooseCrop')}</label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            >
              {crops.map((crop) => (
                <option key={crop.value} value={crop.value}>
                  {getCropLabel(lang, crop.value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <PhotoChecklist lang={lang} />
            <label className="block text-sm text-slate-200 mb-1">{t(lang, 'uploadImageLabel')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
            />
          </div>
        </div>
        {status && (
          <p className={`text-sm ${status.startsWith('⚠️') ? 'text-red-400' : 'text-emerald-200'}`}>{status}</p>
        )}
        <button
          type="submit"
          className="px-4 py-3 bg-emerald-500 text-slate-900 font-semibold rounded-xl hover:bg-emerald-400"
        >
          {t(lang, 'submit')}
        </button>
      </form>
    </div>
  )
}

export default UploadPage
