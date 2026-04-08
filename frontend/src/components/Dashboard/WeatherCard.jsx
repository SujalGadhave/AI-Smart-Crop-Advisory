import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCloudSunRain } from '@fortawesome/free-solid-svg-icons'
import { t } from '../../translations'
import sun from '../../assets/sun.jpg'

function WeatherCard({ lang, weather }) {
  return (
    <div className="relative bg-white/10 p-5 overflow-hidden min-h-[15rem] sm:min-h-[18rem] km-card km-card-interactive km-fade-up km-delay-1">
      <img
        src={sun}
        alt={t(lang, 'altWeatherCardImage')}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/65"></div>

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center gap-2 text-lg font-semibold text-emerald-300">
          <FontAwesomeIcon className="text-white text-2xl" icon={faCloudSunRain} />
          <p>{t(lang, 'weather')}</p>
        </div>

        {weather ? (
          <div className="mt-4 flex-1 flex flex-col justify-between">
            <div>
              <p className="text-xl font-semibold">{weather.city}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/20 bg-black/30 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-200/90">{t(lang, 'dashboardMetricTemp')}</p>
                  <p className="text-base font-semibold text-white">{weather.temperature.toFixed(1)}°C</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-black/30 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-emerald-200/90">{t(lang, 'dashboardMetricWind')}</p>
                  <p className="text-base font-semibold text-white">{weather.windSpeed} m/s</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/85 leading-relaxed">{weather.advice}</p>
          </div>
        ) : (
          <p className="mt-4 text-white/80">{t(lang, 'loadingWeather')}</p>
        )}
      </div>
    </div>
  )
}

export default WeatherCard
