import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { api } from '../lib/api.js'
import StatCard from '../components/StatCard.jsx'
import { CategoryIcon } from '../components/CategoryBadge.jsx'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge.jsx'
import JharkhandMap from '../components/JharkhandMap.jsx'
import { BarList, StatusFunnel, TrendArea, categoryChartData } from '../components/Charts.jsx'

function DashHeader({ user, title, subtitle }) {
  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="container-app py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink-900">{title}</h1>
            <p className="text-sm text-ink-500">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-ink-50 px-3 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">🏛️</span>
            <div className="text-sm leading-tight">
              <p className="font-bold text-ink-800">{user?.name}</p>
              <p className="text-xs text-ink-400">{user?.org}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'overview', icon: '📊', label: 'gov.impactAnalytics' },
  { key: 'verify', icon: '🔎', label: 'gov.verifyChallenges' },
  { key: 'map', icon: '🗺️', label: 'gov.challengeMap' },
  { key: 'analytics', icon: '📈', label: 'gov.domainDistribution' },
]

export default function GovernmentDashboard() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const { toast } = useToast()
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('overview')

  function refresh() {
    api.listReports({ sort: 'new' }).then(setReports)
    api.stats().then(setStats)
  }
  useEffect(() => { refresh() }, [])

  const pending = useMemo(() => reports.filter((r) => r.status === 'submitted'), [reports])
  const catData = useMemo(() => (stats ? categoryChartData(stats.byCategory, lang) : []), [stats, lang])
  const districtData = useMemo(() => {
    if (!stats) return []
    return Object.entries(stats.byDistrict)
      .map(([k, v]) => ({ key: k, label: k, value: v, color: '#059669' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [stats])
  const trend = useMemo(() => {
    const base = stats?.total || 12
    return [3, 5, 4, 7, 9, 8, 12, 14, 13, 17, 19, Math.max(20, base)].map((n) => n)
  }, [stats])

  async function act(id, patch, msg) {
    await api.updateReport(id, patch)
    refresh()
    toast(msg)
  }

  return (
    <div className="pb-16">
      <DashHeader user={user} title={t('gov.title')} subtitle={t('gov.subtitle')} />

      <div className="container-app py-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon="📥" accent="indigo" value={stats?.total ?? '—'} label={t('gov.totalChallenges')} onClick={() => setTab('verify')} />
          <StatCard icon="🔎" accent="amber" value={stats?.pending ?? '—'} label={t('gov.pendingVerification')} onClick={() => setTab('verify')} />
          <StatCard icon="🔥" accent="rose" value={stats?.highPriority ?? '—'} label={t('gov.highPriority')} />
          <StatCard icon="🤝" accent="violet" value={stats?.collaboration ?? '—'} label={t('gov.underCollaboration')} />
          <StatCard icon="💡" accent="teal" value={stats?.solutions ?? '—'} label={t('gov.solutionsProposed')} />
          <StatCard icon="🎉" accent="brand" value={stats?.resolved ?? '—'} label={t('gov.resolved')} />
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TABS.map((tb) => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`chip shrink-0 !px-4 !py-2 ${tab === tb.key ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>
              {tb.icon} {t(tb.label)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-title">📈 {t('gov.monthlyTrend')}</h2>
                <span className="chip bg-brand-100 text-brand-700">↑ {t('gov.resolutionRate')} {stats?.resolutionRate}%</span>
              </div>
              <TrendArea points={trend} />
              <div className="mt-6">
                <h3 className="mb-3 font-bold text-ink-800">{t('gov.newChallenges')}</h3>
                <div className="space-y-2">
                  {reports.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-ink-100 p-2.5">
                      <CategoryIcon categoryKey={r.category} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink-800">{r.title}</p>
                        <p className="truncate text-xs text-ink-400">📍 {r.location?.district} · 🙌 {r.votes}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="card p-5">
              <h2 className="section-title mb-4">🧭 {t('gov.statusFunnel')}</h2>
              {stats && <StatusFunnel byStatus={stats.byStatus} />}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-brand-50 p-3 text-center">
                  <p className="text-2xl font-extrabold text-brand-700">{stats?.resolutionRate}%</p>
                  <p className="text-xs text-ink-500">{t('gov.resolutionRate')}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-3 text-center">
                  <p className="text-2xl font-extrabold text-sky-700">28 {t('gov.days')}</p>
                  <p className="text-xs text-ink-500">{t('gov.avgResolution')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verify queue */}
        {tab === 'verify' && (
          <div className="mt-5 space-y-3">
            <h2 className="section-title">🔎 {t('gov.verifyChallenges')} <span className="chip bg-amber-100 text-amber-800">{pending.length}</span></h2>
            {pending.length === 0 && <p className="card p-8 text-center text-ink-500">✅ {lang === 'hi' ? 'सभी चुनौतियाँ जाँची गईं' : 'All caught up — nothing pending'}</p>}
            {pending.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <CategoryIcon categoryKey={r.category} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink-900">{r.title}</p>
                    <p className="text-sm text-ink-500">{r.description}</p>
                    <p className="mt-1 text-xs text-ink-400">📍 {r.location?.district} · 🙌 {r.votes} · {r.id}</p>
                    {r.ai && <p className="mt-1 text-xs text-violet-600">🤖 {t('report.aiDetected')}: {r.ai.category} ({r.ai.confidence}%)</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => act(r.id, { status: 'verified', note: 'Verified by department' }, t('gov.verifiedToast'))} className="btn-primary btn-md">✅ {t('gov.verify')}</button>
                  <button onClick={() => act(r.id, { status: 'matching', note: 'Routed to matching' }, t('gov.verifiedToast'))} className="btn-soft btn-md">🎯 {t('gov.routeTo')}</button>
                  <select onChange={(e) => e.target.value && act(r.id, { priority: e.target.value }, t('common.saved'))} defaultValue="" className="rounded-xl border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-600">
                    <option value="" disabled>{t('gov.setPriority')}</option>
                    {['low', 'medium', 'high', 'critical'].map((p) => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
                  </select>
                  <button onClick={() => act(r.id, { status: 'rejected', note: 'Not accepted' }, t('gov.rejectedToast'))} className="btn-ghost btn-md !text-rose-600">⛔ {t('gov.reject')}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Map */}
        {tab === 'map' && (
          <div className="mt-5">
            <h2 className="section-title mb-4">🗺️ {t('gov.challengeMap')}</h2>
            <JharkhandMap reports={reports} />
          </div>
        )}

        {/* Analytics */}
        {tab === 'analytics' && stats && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="section-title mb-4">🗂️ {t('gov.domainDistribution')}</h2>
              <BarList data={catData} />
            </div>
            <div className="card p-5">
              <h2 className="section-title mb-4">📍 {t('gov.districtHotspots')}</h2>
              <BarList data={districtData} />
            </div>
            <div className="card p-5 lg:col-span-2">
              <h2 className="section-title mb-4">📈 {t('gov.monthlyTrend')}</h2>
              <TrendArea points={trend} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
