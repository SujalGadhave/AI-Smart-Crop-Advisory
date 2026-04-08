import React from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons'
import KM from '../../assets/KM.jpg'
import BG from '../../assets/BG.png'
import { t } from '../../translations'
import NavLink from './NavLink'

function Layout({ children, lang, setLang, user, onLogout }) {
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <img
        src={BG}
        alt={t(lang, 'altBackgroundImage')}
        className="fixed top-0 left-0 w-full h-full object-cover -z-10"
      />
      <div className="fixed inset-0 bg-black/40 -z-10"></div>
      <div className="border-b border-white/20 bg-black/30 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={KM} alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-lg font-semibold">{t(lang, 'title')}</p>
              <p className="text-xs text-white/70">{t(lang, 'slogan')}</p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3 text-xs sm:text-sm text-white/80">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-3">
            <div className="w-full md:w-auto overflow-x-auto no-scrollbar -mx-1 px-1">
              <div className="flex min-w-max gap-1.5 sm:gap-2 pr-1 snap-x snap-mandatory">
                <NavLink to="/" label={t(lang, 'dashboard')} />
                <NavLink
                  to="/upload"
                  label={
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <FontAwesomeIcon icon={faArrowUpFromBracket} className="text-emerald-400" />
                      {t(lang, 'upload')}
                    </span>
                  }
                />
                <NavLink to="/result" label={t(lang, 'result')} />
                <NavLink to="/timeline" label={t(lang, 'timeline')} />
                <NavLink to="/advisory" label={t(lang, 'advisory')} />
                <NavLink to="/market" label={t(lang, 'market')} />
                <NavLink to="/alerts" label={t(lang, 'notificationsSettingsNav')} />
              </div>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2 sm:gap-3 justify-between md:justify-end relative z-50">
              <select
                className="bg-black/40 text-white text-xs sm:text-sm hover:bg-black/60 border border-white/20 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 relative z-50 w-[98px] sm:w-auto"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="en">{t(lang, 'languageEnglish')}</option>
                <option value="hi">{t(lang, 'languageHindi')}</option>
                <option value="mr">{t(lang, 'languageMarathi')}</option>
              </select>

              {user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="hidden sm:inline">{user.name}</span>
                  <button
                    onClick={onLogout}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/10 border border-white/20 rounded-lg hover:bg-white/20"
                  >
                    {t(lang, 'logout')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 sm:gap-3">
                  <Link to="/login" className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white/10 border border-white/20 rounded-lg hover:bg-white/20">
                    {t(lang, 'login')}
                  </Link>
                  <Link to="/register" className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-emerald-400 text-black font-semibold rounded-lg hover:bg-emerald-300">
                    {t(lang, 'register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">{children}</div>
    </div>
  )
}

export default Layout
