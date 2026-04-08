import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { api } from './services/api'

vi.mock('./services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

function createToken() {
  const payload = {
    sub: 'farmer@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }
  const base64UrlPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `header.${base64UrlPayload}.signature`
}

describe('App login to detect integration', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()

    api.get.mockImplementation((url) => {
      if (url === '/api/weather') {
        return Promise.resolve({
          data: { city: 'Pune', temperature: 30, windSpeed: 2.5, condition: 'clear', advice: 'Stay hydrated' },
        })
      }

      if (url === '/api/crop/reports') {
        return Promise.resolve({ data: [] })
      }

      if (url === '/api/market') {
        return Promise.resolve({ data: { cropType: 'tomato', city: 'pune', currentPrice: 2200, trend: [] } })
      }

      if (url === '/api/advisory') {
        return Promise.resolve({
          data: {
            fertilizer: ['Balanced NPK'],
            irrigation: ['Irrigate early morning'],
            pestManagement: ['Inspect leaves weekly'],
            weatherWarnings: ['Avoid spraying in rain'],
            diseaseAdvice: [],
          },
        })
      }

      if (url === '/api/notifications') {
        return Promise.resolve({ data: [] })
      }

      return Promise.resolve({ data: {} })
    })

    api.patch.mockResolvedValue({ data: {} })

    api.post.mockImplementation((url, payload) => {
      if (url === '/api/auth/login') {
        return Promise.resolve({
          data: {
            token: createToken(),
            name: 'Farmer Demo',
            email: payload.email,
            city: payload.city || 'Pune',
          },
        })
      }

      if (url === '/api/crop/detect') {
        return Promise.resolve({
          data: {
            reportId: 1,
            cropType: payload.cropType,
            diseaseName: 'tomato_late_blight',
            confidence: 0.92,
            treatment: 'Apply copper fungicide immediately.',
            severity: 'high',
            affectedAreaPercent: 15.0,
            symptoms: ['dark lesions'],
            healthy: false,
          },
        })
      }

      return Promise.reject(new Error(`Unexpected POST ${url}`))
    })
  })

  it('logs in, uploads an image, and shows detection result', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: /login/i }))

    await user.type(screen.getByLabelText(/email/i), 'farmer@example.com')
    await user.type(screen.getByLabelText(/password/i), 'StrongPass123')
    await user.type(screen.getByLabelText(/^city$/i), 'Pune')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/login', expect.any(Object))
    })

    await user.click(screen.getByRole('link', { name: /upload leaf/i }))

    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).not.toBeNull()

    const file = new File(['leaf-image-content'], 'leaf.png', { type: 'image/png' })
    await user.upload(fileInput, file)
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/crop/detect',
        expect.objectContaining({ cropType: 'tomato' }),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Bearer /) }) })
      )
    })

    expect(await screen.findByText(/tomato late blight/i)).toBeInTheDocument()
  })
})
