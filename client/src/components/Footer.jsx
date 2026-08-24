import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useLang } from '../context/LanguageContext.jsx'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="mt-16 border-t border-ink-100 bg-white">
      <div className="container-app py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Logo size={40} />
              <span className="font-display text-xl font-extrabold">
                <span className="text-brand-700">Samadhan</span><span className="text-saffron-500">Setu</span>
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm text-ink-500">{t('footer.about')}</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink-800">{t('footer.quickLinks')}</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link to="/report" className="hover:text-brand-700">{t('nav.report')}</Link></li>
              <li><Link to="/nearby" className="hover:text-brand-700">{t('nav.nearby')}</Link></li>
              <li><Link to="/track" className="hover:text-brand-700">{t('nav.track')}</Link></li>
              <li><Link to="/challenges" className="hover:text-brand-700">{t('nav.challenges')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink-800">{t('footer.forPartners')}</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link to="/login" className="hover:text-brand-700">{t('nav.government')}</Link></li>
              <li><Link to="/login" className="hover:text-brand-700">{t('nav.university')}</Link></li>
              <li><Link to="/login" className="hover:text-brand-700">{t('nav.industry')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-1 border-t border-ink-100 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <span>{t('footer.org')}</span>
          <span>{t('footer.builtFor')} · {t('footer.rights')}</span>
        </div>
      </div>
    </footer>
  )
}
