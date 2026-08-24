import { useLang } from '../context/LanguageContext.jsx'
import { STATUS_ORDER, STATUS_META, statusIndex } from '../lib/status.js'

function formatDate(iso, lang) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return '' }
}

// Vertical, transparent progress tracker from Submitted → Resolved.
export default function StatusTimeline({ report }) {
  const { t, lang } = useLang()
  if (!report) return null

  const rejected = report.status === 'rejected'
  const currentIdx = statusIndex(report.status)
  const dateFor = (statusKey) => report.timeline?.find((e) => e.status === statusKey)?.at

  return (
    <ol className="relative">
      {STATUS_ORDER.map((statusKey, i) => {
        const done = i < currentIdx
        const current = i === currentIdx && !rejected
        const meta = STATUS_META[statusKey]
        const at = dateFor(statusKey)
        const isLast = i === STATUS_ORDER.length - 1
        return (
          <li key={statusKey} className="flex gap-4 pb-1">
            {/* rail */}
            <div className="flex flex-col items-center">
              <span
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                  done
                    ? 'bg-brand-600 text-white'
                    : current
                    ? 'bg-brand-100 text-brand-700 ring-4 ring-brand-100'
                    : 'bg-ink-100 text-ink-300'
                }`}
              >
                {done ? '✓' : current ? <span className="h-2.5 w-2.5 rounded-full bg-brand-600 animate-pulse" /> : ''}
                {current && <span className="absolute inset-0 rounded-full bg-brand-400/30 animate-ping" />}
              </span>
              {!isLast && (
                <span className={`w-0.5 flex-1 min-h-[1.75rem] ${done ? 'bg-brand-500' : 'bg-ink-100'}`} />
              )}
            </div>
            {/* label */}
            <div className={`pb-5 ${!done && !current ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-base" aria-hidden>{meta.icon}</span>
                <p className={`font-bold ${current ? 'text-brand-700' : 'text-ink-800'}`}>{t(`status.${statusKey}`)}</p>
              </div>
              <p className="text-sm text-ink-500">{t(`status.${statusKey}Desc`)}</p>
              {at && <p className="mt-0.5 text-xs font-medium text-ink-400">{formatDate(at, lang)}</p>}
            </div>
          </li>
        )
      })}
      {rejected && (
        <li className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600">⛔</span>
          </div>
          <div>
            <p className="font-bold text-rose-600">{t('status.rejected')}</p>
          </div>
        </li>
      )}
    </ol>
  )
}
