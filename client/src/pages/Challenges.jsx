import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { api } from '../lib/api.js'
import { CategoryIcon } from '../components/CategoryBadge.jsx'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge.jsx'

function ChallengeCard({ report }) {
  const { t, lang } = useLang()
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start gap-3">
        <CategoryIcon categoryKey={report.category} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-ink-900 leading-snug">{report.title}</h3>
          <p className="mt-0.5 text-sm text-ink-500">📍 {report.location?.district}, Jharkhand · 🙌 {report.votes}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={report.status} />
        <PriorityBadge priority={report.priority} />
      </div>
      {report.needs?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-ink-400">{t('challenges.needs')}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {report.needs.map((n) => <span key={n} className="chip bg-ink-100 text-ink-600">{n}</span>)}
          </div>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Link to="/login" className="btn-soft btn-md flex-1">🎓 {t('challenges.interested')}</Link>
        <Link to="/login" className="btn-accent btn-md flex-1">🤝 {t('challenges.offerSupport')}</Link>
      </div>
    </div>
  )
}

export default function Challenges() {
  const { t } = useLang()
  const [reports, setReports] = useState(null)

  useEffect(() => {
    api.listReports({ sort: 'top' }).then((all) => {
      // "Open challenges" = verified and beyond, still needing help.
      setReports(all.filter((r) => ['verified', 'gov_review', 'matching', 'collaboration'].includes(r.status)))
    })
  }, [])

  return (
    <div className="container-app max-w-5xl py-6">
      <h1 className="text-2xl font-extrabold text-ink-900">🤝 {t('challenges.title')}</h1>
      <p className="mt-1 text-ink-500">{t('challenges.subtitle')}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports === null
          ? [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-64" />)
          : reports.map((r) => <ChallengeCard key={r.id} report={r} />)}
      </div>
    </div>
  )
}
