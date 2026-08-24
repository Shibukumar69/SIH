import { useMemo, useState } from 'react'
import { JHARKHAND_DISTRICTS } from '../data/districts.js'
import { getCategory } from '../data/categories.js'
import { useLang } from '../context/LanguageContext.jsx'

// Aggregate reports per district → total + category breakdown + dominant category.
function aggregate(reports) {
  const map = {}
  for (const r of reports) {
    const d = r.location?.district
    if (!d) continue
    if (!map[d]) map[d] = { total: 0, byCat: {} }
    map[d].total += 1
    map[d].byCat[r.category] = (map[d].byCat[r.category] || 0) + 1
  }
  for (const d of Object.keys(map)) {
    const cats = Object.entries(map[d].byCat).sort((a, b) => b[1] - a[1])
    map[d].dominant = cats[0]?.[0] || 'other'
  }
  return map
}

export default function JharkhandMap({ reports, onSelectDistrict }) {
  const { t, lang } = useLang()
  const [active, setActive] = useState(null)
  const data = useMemo(() => aggregate(reports), [reports])
  const maxTotal = Math.max(1, ...Object.values(data).map((d) => d.total))

  const activeInfo = active ? data[active] : null

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-white to-sky-50 ring-1 ring-ink-100">
        {/* Stylised Jharkhand landmass */}
        <svg viewBox="0 0 100 80" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
          <path
            d="M14,30 Q16,20 26,20 Q34,14 44,20 Q50,14 58,20 Q70,18 76,24 Q88,20 92,28 Q90,38 82,40 Q86,50 78,58 Q70,74 58,76 Q46,82 40,74 Q30,74 28,64 Q20,62 24,52 Q14,50 16,40 Q10,36 14,30 Z"
            fill="#d1fae5"
            stroke="#6ee7b7"
            strokeWidth="0.6"
            opacity="0.7"
          />
        </svg>

        {/* District bubbles */}
        {JHARKHAND_DISTRICTS.map((d) => {
          const info = data[d.name]
          const total = info?.total || 0
          const cat = getCategory(info?.dominant || 'other')
          const r = total ? 8 + (total / maxTotal) * 20 : 5
          const isActive = active === d.name
          return (
            <button
              key={d.name}
              onClick={() => { setActive(d.name); onSelectDistrict?.(d.name) }}
              title={`${d.name}: ${total}`}
              className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:z-10 hover:scale-110 focus:outline-none"
              style={{ left: `${d.x}%`, top: `${d.y}%`, width: r, height: r }}
            >
              <span
                className={`block h-full w-full rounded-full ring-2 transition ${isActive ? 'ring-ink-800' : 'ring-white/80'}`}
                style={{ backgroundColor: total ? cat.hex : '#cbd5e1', opacity: total ? 0.85 : 0.5 }}
              />
              {total > 0 && (
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-bold text-white">
                  {total}
                </span>
              )}
              <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                {lang === 'hi' ? d.hi : d.name}
              </span>
            </button>
          )
        })}

        <div className="absolute left-3 top-3 rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold text-ink-500 backdrop-blur">
          {t('gov.mapIntro')}
        </div>
      </div>

      {/* District detail panel */}
      <div className="card p-4">
        {activeInfo ? (
          <>
            <p className="text-sm text-ink-500">{lang === 'hi' ? 'ज़िला' : 'District'}</p>
            <h3 className="text-xl font-extrabold text-ink-900">
              {lang === 'hi' ? (JHARKHAND_DISTRICTS.find((x) => x.name === active)?.hi || active) : active}
            </h3>
            <p className="mt-1 text-sm font-semibold text-brand-700">
              {t('gov.challengesInDistrict', {
                n: activeInfo.total,
                district: lang === 'hi' ? (JHARKHAND_DISTRICTS.find((x) => x.name === active)?.hi || active) : active,
              })}
            </p>
            <div className="mt-4 space-y-2">
              {Object.entries(activeInfo.byCat)
                .sort((a, b) => b[1] - a[1])
                .map(([key, count]) => {
                  const cat = getCategory(key)
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-base" aria-hidden>{cat.emoji}</span>
                      <span className="flex-1 text-sm text-ink-600">{cat[lang] || cat.en}</span>
                      <span className="text-sm font-bold tabular-nums text-ink-900">{count}</span>
                    </div>
                  )
                })}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <span className="text-4xl">🗺️</span>
            <p className="mt-3 text-sm text-ink-500">{t('gov.mapIntro')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
