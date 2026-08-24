import { useLang } from '../context/LanguageContext.jsx'
import { STATUS_META, PRIORITY_META } from '../lib/status.js'

const COLOR_CLASS = {
  ink: 'bg-ink-100 text-ink-700',
  sky: 'bg-sky-100 text-sky-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  teal: 'bg-teal-100 text-teal-700',
  green: 'bg-brand-100 text-brand-700',
  rose: 'bg-rose-100 text-rose-700',
  orange: 'bg-orange-100 text-orange-700',
}

export function StatusBadge({ status, className = '' }) {
  const { t } = useLang()
  const meta = STATUS_META[status] || STATUS_META.submitted
  return (
    <span className={`chip ${COLOR_CLASS[meta.color] || COLOR_CLASS.ink} ${className}`}>
      <span aria-hidden>{meta.icon}</span>
      {t(`status.${status}`)}
    </span>
  )
}

export function PriorityBadge({ priority, className = '' }) {
  const { t } = useLang()
  const meta = PRIORITY_META[priority] || PRIORITY_META.medium
  return (
    <span className={`chip ${meta.color} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {t(`priority.${priority}`)}
    </span>
  )
}
