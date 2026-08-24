import { Link } from 'react-router-dom'
import { CategoryIcon } from './CategoryBadge.jsx'
import { StatusBadge, PriorityBadge } from './StatusBadge.jsx'
import VoteButton from './VoteButton.jsx'
import { categoryStyle } from '../data/categories.js'
import { useLang } from '../context/LanguageContext.jsx'

function timeAgo(iso, lang) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (24 * 3600 * 1000))
  if (days <= 0) return lang === 'hi' ? 'आज' : 'today'
  if (days === 1) return lang === 'hi' ? 'कल' : '1 day ago'
  if (days < 30) return lang === 'hi' ? `${days} दिन पहले` : `${days} days ago`
  const months = Math.floor(days / 30)
  return lang === 'hi' ? `${months} माह पहले` : `${months} mo ago`
}

export default function ReportCard({ report, showVote = true, showStatus = true, to }) {
  const { lang } = useLang()
  const s = categoryStyle(report.category)
  const href = to || `/track/${report.id}`

  return (
    <Link to={href} className="card card-hover block overflow-hidden">
      <div className="flex gap-3 p-4">
        {report.photos?.length ? (
          <img src={report.photos[0]} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" loading="lazy" />
        ) : (
          <CategoryIcon categoryKey={report.category} size="lg" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-ink-900 leading-snug line-clamp-2">{report.title}</h3>
            {report.pending && (
              <span className="chip bg-amber-100 text-amber-800 shrink-0">⏳</span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-500 truncate">
            <span aria-hidden>📍</span>
            {report.location?.village ? `${report.location.village}, ` : ''}{report.location?.district || 'Jharkhand'}
            <span className="text-ink-300">·</span>
            {timeAgo(report.createdAt, lang)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {showStatus && <StatusBadge status={report.status} />}
            <PriorityBadge priority={report.priority} />
            <span className="chip bg-ink-50 text-ink-500 font-mono">{report.id}</span>
          </div>
        </div>
      </div>
      {showVote && (
        <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/50 px-4 py-2.5">
          <span className="text-sm font-semibold text-ink-500">
            <span className={`mr-1 inline-block h-2 w-2 rounded-full ${s.dot}`} />
            {report.votes} {lang === 'hi' ? 'लोग प्रभावित' : 'affected'}
          </span>
          <VoteButton report={report} />
        </div>
      )}
    </Link>
  )
}
