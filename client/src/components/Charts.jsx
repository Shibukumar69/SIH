import { getCategory } from '../data/categories.js'
import { useLang } from '../context/LanguageContext.jsx'
import { STATUS_ORDER, STATUS_META } from '../lib/status.js'

// Horizontal bar list — great for category / district distributions.
export function BarList({ data, max, valueSuffix = '', colorByCategory = false }) {
  const top = max ?? Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.key} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm font-medium text-ink-600 flex items-center gap-1.5">
            {d.icon && <span aria-hidden>{d.icon}</span>}
            {d.label}
          </span>
          <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-ink-100">
            <div
              className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
              style={{
                width: `${(d.value / top) * 100}%`,
                backgroundColor: d.color || '#059669',
              }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-ink-800">
            {d.value}{valueSuffix}
          </span>
        </div>
      ))}
    </div>
  )
}

// Donut chart with a centered total.
export function DonutChart({ segments, total, centerLabel }) {
  const size = 168
  const stroke = 22
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  let offset = 0
  const sum = (total ?? segments.reduce((s, x) => s + x.value, 0)) || 1

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef2f5" strokeWidth={stroke} />
        {segments.map((seg) => {
          const frac = seg.value / sum
          const dash = frac * circ
          const el = (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            >
              <title>{seg.label}: {seg.value}</title>
            </circle>
          )
          offset += dash
          return el
        })}
        <text x="50%" y="50%" className="rotate-90" textAnchor="middle" dominantBaseline="central" transform={`rotate(90 ${size / 2} ${size / 2})`} style={{ fontWeight: 800, fontSize: 30, fill: '#0f172a' }}>
          {sum}
        </text>
      </svg>
      <div className="space-y-1.5 text-sm">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-ink-600">{seg.label}</span>
            <span className="font-bold text-ink-900">{seg.value}</span>
          </div>
        ))}
        {centerLabel && <p className="pt-1 text-xs text-ink-400">{centerLabel}</p>}
      </div>
    </div>
  )
}

// Compact status pipeline / funnel.
export function StatusFunnel({ byStatus }) {
  const { t } = useLang()
  const max = Math.max(...STATUS_ORDER.map((s) => byStatus[s] || 0), 1)
  const colorClass = {
    ink: '#94a3b8', sky: '#0ea5e9', indigo: '#6366f1', violet: '#7c3aed',
    amber: '#f59e0b', yellow: '#eab308', teal: '#0d9488', green: '#059669',
  }
  return (
    <div className="space-y-2">
      {STATUS_ORDER.map((s) => {
        const v = byStatus[s] || 0
        const meta = STATUS_META[s]
        return (
          <div key={s} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm font-medium text-ink-600">
              <span className="mr-1" aria-hidden>{meta.icon}</span>{t(`status.${s}`)}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-ink-100">
              <div className="absolute inset-y-0 left-0 rounded transition-all duration-700"
                style={{ width: `${(v / max) * 100}%`, backgroundColor: colorClass[meta.color] }} />
            </div>
            <span className="w-8 text-right text-sm font-bold tabular-nums text-ink-800">{v}</span>
          </div>
        )
      })}
    </div>
  )
}

// Simple area sparkline for a monthly trend (synthetic but plausible).
export function TrendArea({ points, color = '#059669', height = 90 }) {
  const width = 320
  const max = Math.max(...points, 1)
  const step = width / (points.length - 1)
  const coords = points.map((p, i) => [i * step, height - (p / max) * (height - 10) - 4])
  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#trend-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
      ))}
    </svg>
  )
}

// Build category chart data from a byCategory map.
export function categoryChartData(byCategory, lang) {
  return Object.entries(byCategory)
    .map(([key, value]) => {
      const cat = getCategory(key)
      return { key, value, label: cat[lang] || cat.en, icon: cat.emoji, color: cat.hex }
    })
    .sort((a, b) => b.value - a.value)
}
