import { NavLink } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'

// Thumb-friendly bottom navigation for phones. Big icons + short labels.
export default function BottomNav() {
  const { t } = useLang()
  const items = [
    { to: '/', icon: '🏠', label: t('nav.home'), end: true },
    { to: '/nearby', icon: '📍', label: t('home.nearby') },
    { to: '/report', icon: '📝', label: t('nav.report'), primary: true },
    { to: '/track', icon: '📊', label: t('home.trackReports') },
    { to: '/challenges', icon: '🤝', label: t('nav.involved') },
  ]
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-ink-100 bg-white/95 backdrop-blur-md safe-bottom">
      <div className="grid grid-cols-5 items-end">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 text-[11px] font-semibold ${
                it.primary ? '' : isActive ? 'text-brand-700' : 'text-ink-400'
              }`
            }
          >
            {({ isActive }) =>
              it.primary ? (
                <>
                  <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl text-white shadow-lift ring-4 ring-white">
                    {it.icon}
                  </span>
                  <span className="text-brand-700">{it.label}</span>
                </>
              ) : (
                <>
                  <span className={`text-xl ${isActive ? 'scale-110' : ''} transition-transform`}>{it.icon}</span>
                  <span className="truncate max-w-[64px]">{it.label}</span>
                </>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
