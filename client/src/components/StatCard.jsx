// KPI tile for dashboards.
export default function StatCard({ label, value, icon, accent = 'brand', sub, onClick }) {
  const accents = {
    brand: 'text-brand-700 bg-brand-50',
    sky: 'text-sky-700 bg-sky-50',
    amber: 'text-amber-800 bg-amber-50',
    rose: 'text-rose-700 bg-rose-50',
    violet: 'text-violet-700 bg-violet-50',
    indigo: 'text-indigo-700 bg-indigo-50',
    teal: 'text-teal-700 bg-teal-50',
  }
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`card p-4 text-left ${onClick ? 'card-hover w-full' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${accents[accent] || accents.brand}`}>
          {icon}
        </span>
        {sub && <span className="text-xs font-semibold text-ink-400">{sub}</span>}
      </div>
      <p className="mt-3 text-3xl font-extrabold tabular-nums text-ink-900">{value}</p>
      <p className="text-sm font-medium text-ink-500">{label}</p>
    </Comp>
  )
}
