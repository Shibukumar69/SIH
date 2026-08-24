import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { api } from '../lib/api.js'
import { CATEGORIES, getCategory, categoryStyle } from '../data/categories.js'
import VoteButton from '../components/VoteButton.jsx'
import LanguageToggle from '../components/LanguageToggle.jsx'
import { CategoryIcon } from '../components/CategoryBadge.jsx'

function CategoryGrid({ onPick }) {
  const { lang } = useLang()
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
      {CATEGORIES.filter((c) => c.key !== 'other').map((c) => {
        const s = categoryStyle(c.key)
        return (
          <button
            key={c.key}
            onClick={() => onPick(c.key)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border border-ink-100 bg-white p-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft active:scale-95`}
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${s.bg}`}>{c.emoji}</span>
            <span className="text-center text-xs font-semibold text-ink-700 leading-tight">{c[lang] || c.en}</span>
          </button>
        )
      })}
    </div>
  )
}

function HowItWorks() {
  const { t } = useLang()
  const steps = [
    { icon: '📝', title: t('home.step1'), sub: t('home.step1sub'), color: 'bg-brand-100 text-brand-700' },
    { icon: '🏛️', title: t('home.step2'), sub: t('home.step2sub'), color: 'bg-sky-100 text-sky-700' },
    { icon: '🤝', title: t('home.step3'), sub: t('home.step3sub'), color: 'bg-amber-100 text-amber-800' },
    { icon: '🎉', title: t('home.step4'), sub: t('home.step4sub'), color: 'bg-violet-100 text-violet-700' },
  ]
  return (
    <section className="container-app mt-14">
      <h2 className="section-title mb-5">🔗 {t('home.howItWorks')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={i} className="card relative p-5">
            <span className="absolute right-4 top-4 text-3xl font-black text-ink-100">{i + 1}</span>
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${s.color}`}>{s.icon}</span>
            <h3 className="mt-3 font-bold text-ink-900">{s.title}</h3>
            <p className="mt-1 text-sm text-ink-500">{s.sub}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const [topReports, setTopReports] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.listReports({ sort: 'top' }).then((r) => setTopReports(r.slice(0, 4)))
    api.stats().then(setStats)
  }, [])

  const pickCategory = (key) => navigate(`/report?category=${key}`)

  return (
    <div>
      {/* Hero */}
      <section className="container-app pt-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-8 text-white shadow-lift sm:px-10 sm:py-12">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-saffron-400/20" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <span className="chip bg-white/15 text-white backdrop-blur">🪷 {t('app.name')}</span>
              <LanguageToggle className="!bg-white/15 backdrop-blur [&_button]:!text-white/70 [&_button[aria-pressed=true]]:!bg-white [&_button[aria-pressed=true]]:!text-brand-700" />
            </div>
            <h1 className="max-w-2xl text-2xl font-extrabold leading-tight text-balance sm:text-4xl">
              {t('home.greeting')}
            </h1>
            <p className="mt-2 max-w-xl text-brand-50/90 sm:text-lg">{t('home.subGreeting')}</p>

            {/* Primary CTA */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/report" className="btn btn-xl bg-white text-brand-700 shadow-lift hover:bg-brand-50 w-full sm:w-auto">
                <span className="text-2xl">📝</span>
                <span className="flex flex-col items-start leading-tight">
                  <span>{t('home.reportProblem')}</span>
                  <span className="text-xs font-medium text-brand-500">{t('home.reportSub')}</span>
                </span>
              </Link>
              <div className="grid grid-cols-2 gap-3 sm:flex">
                <Link to="/nearby" className="btn btn-lg bg-white/15 text-white backdrop-blur hover:bg-white/25">
                  📍 {t('home.nearby')}
                </Link>
                <Link to="/track" className="btn btn-lg bg-white/15 text-white backdrop-blur hover:bg-white/25">
                  📊 {t('home.trackReports')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick category access */}
      <section className="container-app mt-8">
        <h2 className="section-title mb-3">🎯 {t('report.stepCategory')}</h2>
        <CategoryGrid onPick={pickCategory} />
      </section>

      {/* Top problems near you */}
      <section className="container-app mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">🔥 {t('home.topProblems')}</h2>
          <Link to="/nearby" className="text-sm font-semibold text-brand-700 hover:underline">{t('common.seeAll')} →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {topReports.map((r) => {
            const cat = getCategory(r.category)
            return (
              <div key={r.id} className="card card-hover flex items-center gap-3 p-3.5">
                <Link to={`/track/${r.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <CategoryIcon categoryKey={r.category} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-ink-900">{r.title}</span>
                    <span className="block truncate text-sm text-ink-500">
                      {cat.emoji} {cat[lang] || cat.en} · 📍 {r.location?.district}
                    </span>
                  </span>
                </Link>
                <VoteButton report={r} />
              </div>
            )
          })}
        </div>
      </section>

      <HowItWorks />

      {/* Live stats */}
      {stats && (
        <section className="container-app mt-14">
          <div className="rounded-3xl bg-ink-900 px-6 py-8 text-white sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">{t('home.liveStats')}</p>
            <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { v: stats.total + 1226, l: t('home.statChallenges') },
                { v: stats.solutions + 92, l: t('home.statResolved') },
                { v: 48, l: t('home.statInstitutions') },
                { v: (stats.totalVotes + 8400).toLocaleString('en-IN'), l: t('home.statCitizens') },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-3xl font-extrabold text-white sm:text-4xl">{s.v}</p>
                  <p className="mt-1 text-sm text-ink-300">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Institutions CTA */}
      <section className="container-app mt-8">
        <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink-900">🏛️ {t('home.forInstitutions')}</h3>
            <p className="mt-1 text-sm text-ink-500">{t('home.forInstitutionsSub')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/login" className="btn-soft btn-md">🏛️ {t('nav.government')}</Link>
            <Link to="/login" className="btn-soft btn-md">🎓 {t('nav.university')}</Link>
            <Link to="/login" className="btn-soft btn-md">🏭 {t('nav.industry')}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
