import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { usePolling } from '../lib/usePolling.js'
import ReportCard from '../components/ReportCard.jsx'

export default function TrackReports() {
  const { t } = useLang()
  const { user } = useAuth()
  const [reports, setReports] = useState(null)

  // Refresh user's own tracked reports from the server / local storage
  async function refresh() {
    if (!user) return
    const mine = await api.getMyReports(user)
    const fresh = await Promise.all(mine.map((r) => api.getReport(r.id).then((x) => x || r)))
    setReports(fresh)
  }

  useEffect(() => { refresh() }, [user])
  usePolling(refresh, 8000)

  if (!user) {
    return (
      <div className="container-app max-w-lg py-12">
        <div className="card animate-pop-in p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-ink-900">{t('track.loginRequiredTitle') || 'साइन इन आवश्यक है'}</h2>
          <p className="mt-2 text-sm text-ink-500">{t('track.loginRequiredSub') || 'अपनी दर्ज समस्याओं की स्थिति देखने के लिए अपने खाते से साइन इन करें।'}</p>
          <Link to="/login?redirect=/track&role=citizen" className="btn-primary btn-xl mt-6 w-full">
            👤 {t('report.goToLogin') || 'साइन इन करें'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-app max-w-3xl py-6">
      <h1 className="text-2xl font-extrabold text-ink-900">📊 {t('track.title')}</h1>
      <p className="mt-1 text-ink-500">{t('track.subtitle')}</p>

      <div className="mt-6 space-y-3">
        {reports === null ? (
          [0, 1, 2].map((i) => <div key={i} className="skeleton h-28" />)
        ) : reports.length === 0 ? (
          <div className="card flex flex-col items-center py-14 text-center">
            <span className="text-5xl">📭</span>
            <p className="mt-4 text-ink-500">{t('track.empty')}</p>
            <Link to="/report" className="btn-primary btn-lg mt-4">📝 {t('track.emptyCta')}</Link>
          </div>
        ) : (
          reports.map((r) => <ReportCard key={r.id} report={r} showVote={false} />)
        )}
      </div>
    </div>
  )
}
