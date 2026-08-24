import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { api } from '../lib/api.js'
import { usePolling } from '../lib/usePolling.js'
import ReportCard from '../components/ReportCard.jsx'

export default function TrackReports() {
  const { t } = useLang()
  const [reports, setReports] = useState(null)

  // Refresh each tracked report from the server (falling back to local), so
  // status changes by officials appear live — without wiping unsynced reports.
  async function refresh() {
    const mine = await api.getMyReports()
    const fresh = await Promise.all(mine.map((r) => api.getReport(r.id).then((x) => x || r)))
    setReports(fresh)
  }

  useEffect(() => { refresh() }, [])
  usePolling(refresh, 8000)

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
