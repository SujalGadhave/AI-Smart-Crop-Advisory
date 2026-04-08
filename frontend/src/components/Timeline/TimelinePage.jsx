import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'
import { t } from '../../translations'
import { formatLocalizedDateTime } from '../../utils/formatters'
import TimelineDetails from './TimelineDetails'
import TimelineList from './TimelineList'

function TimelinePage({ lang, token, onAuthFailure }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [followUpForm, setFollowUpForm] = useState({ status: 'PENDING', notes: '' })

  const selectedItem = items.find((item) => item.reportId === selectedId) || items[0] || null
  const formatDateTime = (value) => formatLocalizedDateTime(value, lang)
  const followUpStatusLabel = (value) => {
    const normalized = String(value || 'PENDING').toUpperCase()
    if (normalized === 'IN_PROGRESS') return t(lang, 'timelineStatusInProgress')
    if (normalized === 'COMPLETED') return t(lang, 'timelineStatusCompleted')
    if (normalized === 'NEEDS_ATTENTION') return t(lang, 'timelineStatusNeedsAttention')
    return t(lang, 'timelineStatusPending')
  }

  const normalizeToken = typeof token === 'string' ? token.trim() : ''

  const loadTimeline = useCallback(async () => {
    if (!normalizeToken || normalizeToken === 'undefined' || normalizeToken === 'null') {
      setItems([])
      setLoading(false)
      setStatus(t(lang, 'timelineLoginRequired'))
      return
    }

    setLoading(true)
    setStatus('')
    try {
      const { data } = await api.get('/api/crop/timeline', {
        params: { limit: 20 },
        headers: { Authorization: `Bearer ${normalizeToken}` },
      })

      const nextItems = Array.isArray(data) ? data : []
      setItems(nextItems)

      if (nextItems.length === 0) {
        setSelectedId(null)
      } else {
        setSelectedId((previous) => previous ?? nextItems[0].reportId)
      }
    } catch (err) {
      console.error('Timeline request failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        setStatus(t(lang, 'timelineSessionExpired'))
        onAuthFailure?.()
      } else {
        setStatus(t(lang, 'timelineLoadFailed'))
      }
    } finally {
      setLoading(false)
    }
  }, [lang, normalizeToken, onAuthFailure])

  useEffect(() => {
    loadTimeline()
  }, [loadTimeline])

  useEffect(() => {
    if (!selectedItem) {
      setFollowUpForm({ status: 'PENDING', notes: '' })
      return
    }

    setFollowUpForm({
      status: selectedItem.followUpStatus || 'PENDING',
      notes: selectedItem.followUpNotes || '',
    })
  }, [selectedItem])

  const saveFollowUp = async (event) => {
    event.preventDefault()
    if (!selectedItem) {
      return
    }

    setSaving(true)
    setStatus('')
    try {
      const { data } = await api.patch(
        `/api/crop/reports/${selectedItem.reportId}/follow-up`,
        followUpForm,
        { headers: { Authorization: `Bearer ${normalizeToken}` } }
      )

      setItems((previous) => previous.map((item) => (item.reportId === data.reportId ? data : item)))
      setStatus(t(lang, 'timelineSaved'))
    } catch (err) {
      console.error('Follow-up update failed', err)
      const statusCode = err?.response?.status
      if (statusCode === 401 || statusCode === 403) {
        setStatus(t(lang, 'timelineSessionExpired'))
        onAuthFailure?.()
      } else {
        setStatus(t(lang, 'timelineSaveFailed'))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 km-fade-up">
      <TimelineList
        lang={lang}
        loading={loading}
        items={items}
        selectedItem={selectedItem}
        setSelectedId={setSelectedId}
        formatDateTime={formatDateTime}
      />
      <TimelineDetails
        lang={lang}
        selectedItem={selectedItem}
        followUpStatusLabel={followUpStatusLabel}
        formatDateTime={formatDateTime}
        followUpForm={followUpForm}
        setFollowUpForm={setFollowUpForm}
        saveFollowUp={saveFollowUp}
        saving={saving}
        status={status}
      />
    </div>
  )
}

export default TimelinePage
