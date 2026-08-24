import { useLang } from '../context/LanguageContext.jsx'

// A subtle "live — auto-updating" indicator for dashboards that poll for
// cross-role status changes. Purely presentational.
export default function LiveChip({ className = '' }) {
  const { t } = useLang()
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {t('live.updating')}
    </span>
  )
}
