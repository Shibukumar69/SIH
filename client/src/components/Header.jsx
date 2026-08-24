import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Logo from './Logo.jsx'
import LanguageToggle from './LanguageToggle.jsx'
import { useLang } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Header() {
  const { t } = useLang()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const citizenLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/report', label: t('nav.report') },
    { to: '/nearby', label: t('nav.nearby') },
    { to: '/track', label: t('nav.track') },
    { to: '/challenges', label: t('nav.challenges') },
  ]

  const dashboardHome = user ? `/${user.role}` : '/login'

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur-md">
      <div className="container-app flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <Logo size={38} />
          <span className="font-display text-lg font-extrabold leading-none">
            <span className="text-brand-700">Samadhan</span><span className="text-saffron-500">Setu</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {citizenLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle className="hidden sm:inline-flex" />
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link to={dashboardHome} className="btn-soft btn-md">{t('nav.dashboard')}</Link>
              <button onClick={() => { logout(); navigate('/') }} className="btn-ghost btn-md">
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden sm:inline-flex btn-primary btn-md">
              {t('nav.login')}
            </Link>
          )}
          {/* Mobile menu button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 text-ink-700"
            aria-label="Menu"
            aria-expanded={open}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden border-t border-ink-100 bg-white animate-fade-up">
          <div className="container-app py-3 flex flex-col gap-1">
            <div className="flex items-center justify-between py-2">
              <LanguageToggle />
              {user ? (
                <button onClick={() => { logout(); setOpen(false); navigate('/') }} className="btn-ghost btn-md">
                  {t('nav.logout')}
                </button>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="btn-primary btn-md">
                  {t('nav.login')}
                </Link>
              )}
            </div>
            {citizenLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-3 text-base font-semibold transition ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user && (
              <Link to={dashboardHome} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-semibold bg-brand-600 text-white text-center mt-1">
                {t('nav.dashboard')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
