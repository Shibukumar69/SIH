import { useEffect, useState } from 'react'
import { useLang } from '../context/LanguageContext.jsx'
import { api } from '../lib/api.js'
import { CATEGORIES } from '../data/categories.js'
import ReportCard from '../components/ReportCard.jsx'

export default function Nearby() {
  const { t, lang } = useLang()
  const [reports, setReports] = useState(null)
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('top')

  useEffect(() => {
    setReports(null)
    api.listReports({ category, sort }).then(setReports)
  }, [category, sort])

  return (
    <div className="container-app max-w-4xl py-6">
      <h1 className="text-2xl font-extrabold text-ink-900">📍 {t('nearby.title')}</h1>
      <p className="mt-1 text-ink-500">{t('nearby.subtitle')}</p>

      {/* Sort */}
      <div className="mt-5 flex items-center gap-2">
        <button onClick={() => setSort('top')} className={`chip ${sort === 'top' ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>🔥 {t('nearby.sortTop')}</button>
        <button onClick={() => setSort('new')} className={`chip ${sort === 'new' ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>🆕 {t('nearby.sortNew')}</button>
      </div>

      {/* Category filter */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => setCategory('all')} className={`chip shrink-0 ${category === 'all' ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>{t('nearby.filterAll')}</button>
        {CATEGORIES.filter((c) => c.key !== 'other').map((c) => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={`chip shrink-0 ${category === c.key ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>
            {c.emoji} {c[lang] || c.en}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {reports === null ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-40" />)
        ) : reports.length === 0 ? (
          <p className="col-span-full py-12 text-center text-ink-500">{t('nearby.empty')}</p>
        ) : (
          reports.map((r) => <ReportCard key={r.id} report={r} />)
        )}
      </div>
    </div>
  )
}
