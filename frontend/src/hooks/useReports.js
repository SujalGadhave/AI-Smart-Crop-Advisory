import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'

export function useReports(fetchRiskAlerts, fetchNotifications) {
  const [lastReport, setLastReport] = useState(null)
  const [reportHistory, setReportHistory] = useState([])

  const fetchRecentReports = useCallback(async () => {
    try {
      const { data } = await api.get('/api/crop/reports', { params: { limit: 10 } })
      if (!Array.isArray(data)) {
        return
      }
      setReportHistory(data)
      setLastReport((prev) => prev || data[0] || null)
    } catch (err) {
      console.error('Recent reports request failed', err)
    }
  }, [])

  useEffect(() => {
    fetchRecentReports()
  }, [fetchRecentReports])

  const onDetectionComplete = useCallback((report) => {
    setLastReport(report)
    setReportHistory((prev) => {
      const withoutCurrent = prev.filter((item) => item.reportId !== report.reportId)
      return [report, ...withoutCurrent].slice(0, 10)
    })
    fetchRiskAlerts()
    fetchNotifications()
  }, [fetchRiskAlerts, fetchNotifications])

  return {
    lastReport,
    reportHistory,
    setLastReport,
    setReportHistory,
    fetchRecentReports,
    onDetectionComplete,
  }
}
