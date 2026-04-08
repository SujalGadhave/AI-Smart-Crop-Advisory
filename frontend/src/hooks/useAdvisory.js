import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { t } from '../translations'

export function useAdvisory(lang, cropType, lastReport) {
  const [advisory, setAdvisory] = useState(null)
  const [status, setStatus] = useState('')

  const fetchAdvisory = useCallback(async () => {
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
  }, [lang, cropType, lastReport])

  useEffect(() => {
    fetchAdvisory()
  }, [fetchAdvisory])

  return { advisory, setAdvisory, status, setStatus, fetchAdvisory }
}
