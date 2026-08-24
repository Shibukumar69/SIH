import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { api } from '../lib/api.js'
import StatusTimeline from '../components/StatusTimeline.jsx'
import VoteButton from '../components/VoteButton.jsx'
import { CategoryPill } from '../components/CategoryBadge.jsx'
import { PriorityBadge } from '../components/StatusBadge.jsx'
import { statusProgress } from '../lib/status.js'

export default function ReportDetail() {
  const { id } = useParams()
  const { t, lang } = useLang()
  const { toast } = useToast()
  const [report, setReport] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState(false)

  useEffect(() => {
    api.getReport(id).then((r) => (r ? setReport(r) : setNotFound(true)))
  }, [id])

  async function reopen() {
    const updated = await api.updateReport(id, { status: 'gov_review', priority: 'high', note: 'Reopened by citizen — not satisfied with resolution' })
    setReport({ ...updated, votedByMe: report.votedByMe })
    toast(t('status.reopened'), { icon: '🔄' })
  }

  if (notFound) {
    return (
      <div className="container-app max-w-2xl py-16 text-center">
        <span className="text-5xl">🔍</span>
        <p className="mt-4 text-ink-500">{lang === 'hi' ? 'यह समस्या नहीं मिली।' : 'This report was not found.'}</p>
        <Link to="/track" className="btn-primary btn-lg mt-4">← {t('track.title')}</Link>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="container-app max-w-2xl py-6 space-y-3">
        <div className="skeleton h-8 w-2/3" />
        <div className="skeleton h-40" />
        <div className="skeleton h-64" />
      </div>
    )
  }

  const dateStr = new Date(report.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="container-app max-w-2xl py-6">
      <Link to="/track" className="text-sm font-semibold text-ink-500 hover:text-brand-700">← {t('track.title')}</Link>

      <div className="mt-3 card overflow-hidden">
        {report.photos?.length > 0 && (
          <div className="flex gap-1 bg-ink-100">
            {report.photos.map((src, i) => (
              <img key={i} src={src} alt="" className="h-48 flex-1 object-cover" />
            ))}
          </div>
        )}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill categoryKey={report.category} />
            <PriorityBadge priority={report.priority} />
            {report.pending && <span className="chip bg-amber-100 text-amber-800">⏳ {t('track.pendingSync')}</span>}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-ink-900">{report.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-500">
            <span className="font-mono font-bold text-ink-600">{report.id}</span>
            <span>·</span>
            <span>📍 {report.location?.label || `${report.location?.village || ''}, ${report.location?.district || ''}`}</span>
            <span>·</span>
            <span>{t('track.reportedOn')} {dateStr}</span>
          </p>
          {report.description && <p className="mt-4 text-ink-700">{report.description}</p>}

          {/* progress bar */}
          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700" style={{ width: `${statusProgress(report.status)}%` }} />
            </div>
          </div>

          {/* supporters + vote */}
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-ink-50 p-3">
            <span className="text-sm font-semibold text-ink-600">🙌 {t('track.supporters', { n: report.votes })}</span>
            <VoteButton report={report} onVoted={() => setReport((r) => ({ ...r, votes: r.votes + 1, votedByMe: true }))} />
          </div>

          {/* assigned partners */}
          {(report.assignedUniversity || report.assignedIndustry) && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {report.assignedUniversity && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                  <p className="text-xs font-semibold text-indigo-500">🎓 {t('nav.university')}</p>
                  <p className="font-bold text-indigo-800">{report.assignedUniversity}</p>
                </div>
              )}
              {report.assignedIndustry && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-600">🏭 {t('nav.industry')}</p>
                  <p className="font-bold text-amber-800">{report.assignedIndustry}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4 card p-5 sm:p-6">
        <h2 className="section-title mb-5">🧭 {t('track.timeline')}</h2>
        <StatusTimeline report={report} />
      </div>

      {/* Satisfaction / reopen (after resolution) */}
      {report.status === 'resolved' && !feedbackGiven && (
        <div className="mt-4 card p-5 text-center">
          <p className="font-bold text-ink-900">{t('track.confirmResolved')}</p>
          <div className="mt-3 flex justify-center gap-2">
            <button onClick={() => { setFeedbackGiven(true); toast(t('track.feedbackThanks'), { icon: '🙏' }) }} className="btn-primary btn-lg">
              👍 {t('track.markSatisfied')}
            </button>
            <button onClick={reopen} className="btn-ghost btn-lg">🔄 {t('track.notSatisfied')}</button>
          </div>
        </div>
      )}
      {feedbackGiven && (
        <div className="mt-4 rounded-2xl bg-brand-50 p-4 text-center font-semibold text-brand-700">🙏 {t('track.feedbackThanks')}</div>
      )}
    </div>
  )
}
