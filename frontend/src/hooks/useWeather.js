import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { t } from '../translations'

export function useWeather(lang, user) {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const city = user?.city || 'Pune'
        const { data } = await api.get('/api/weather', { params: { city } })
        setWeather(data)
      } catch (err) {
        console.error('Weather API request failed', err)
        setWeather({
          city: t(lang, 'defaultCityName'),
          temperature: 30,
          windSpeed: 2.5,
          condition: 'clear',
          advice: t(lang, 'weatherFallbackAdvice'),
        })
      }
    }
    fetchWeather()
  }, [lang, user])

  return { weather, setWeather }
}
