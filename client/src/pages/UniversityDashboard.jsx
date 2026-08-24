import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { api } from '../lib/api.js'
import { usePolling } from '../lib/usePolling.js'
import { getCategory } from '../data/categories.js'
import StatCard from '../components/StatCard.jsx'
import LiveChip from '../components/LiveChip.jsx'
import { CategoryIcon } from '../components/CategoryBadge.jsx'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge.jsx'
import { statusProgress } from '../lib/status.js'

// This university's expertise profile → drives the match engine.
// (In production this comes from the institution's registered departments.)
const DEPT_BY_CATEGORY = {
  water: 'Civil & Environmental Engineering',
  sanitation: 'Civil & Environmental Engineering',
  roads: 'Civil Engineering',
  transport: 'Mechanical & Transportation Engg.',
  electricity: 'Electrical & Renewable Energy',
  agriculture: 'Biotech & Agri-Engineering',
  environment: 'Environmental Science',
  education: 'Computer Science & Ed-Tech',
  healthcare: 'Biomedical Engineering',
  livelihood: 'Management & Entrepreneurship',
  other: 'Interdisciplinary R&D',
}
const STRONG = new Set(['water', 'electricity', 'roads', 'transport', 'sanitation', 'environment', 'agriculture', 'education'])
const PRIORITY_BOOST = { critical: 12, high: 8, medium: 3, low: 0 }

function matchScore(report) {
  const base = STRONG.has(report.category) ? 74 : 42
  const demand = Math.min(report.votes || 0, 40) / 2
  const boost = PRIORITY_BOOST[report.priority] || 0
  return Math.max(30, Math.min(99, Math.round(base + demand + boost)))
}

function MatchRing({ score }) {
  const r = 22, c = 2 * Math.PI * r
  const color = score >= 80 ? '#059669' : score >= 60 ? '#0ea5e9' : '#f59e0b'
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#eef2f5" strokeWidth="6" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold" style={{ color }}>{score}%</span>
    </div>
  )
}

export default function UniversityDashboard() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const { toast } = useToast()
  const [reports, setReports] = useState([])
  const [tab, setTab] = useState('recommended')

  const orgName = user?.name || 'BIT Mesra'
  function refresh() { api.listReports({ sort: 'top' }).then(setReports) }
  useEffect(() => { refresh() }, [])
  usePolling(refresh, 7000) // live: government routes new challenges in

  const recommended = useMemo(() => {
    return reports
      .filter((r) => ['verified', 'gov_review', 'matching'].includes(r.status) && r.assignedUniversity !== orgName)
      .map((r) => ({ ...r, score: matchScore(r) }))
      .sort((a, b) => b.score - a.score)
  }, [reports, orgName])

  const myProjects = useMemo(() => reports.filter((r) => r.assignedUniversity === orgName), [reports, orgName])
  const teamCount = myProjects.length * 4 + 3

  async function express(id) {
    await api.updateReport(id, { status: 'collaboration', assignedUniversity: orgName, note: `${orgName} joined as academic partner` })
    refresh(); setTab('projects'); toast(t('university.interestedToast'))
  }
  async function advance(id, status, note) {
    await api.updateReport(id, { status, note }); refresh(); toast(t('common.saved'))
  }

  return (
    <div className="pb-16">
      <div className="border-b border-ink-100 bg-white">
        <div className="container-app py-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink-900">🎓 {t('university.title')}</h1>
            <p className="text-sm text-ink-500">{t('university.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-indigo-50 px-3 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">🎓</span>
            <div className="text-sm leading-tight">
              <p className="font-bold text-indigo-900">{orgName}</p>
              <p className="text-xs text-indigo-400">{user?.org}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-app py-6">
        <div className="mb-3 flex justify-end"><LiveChip /></div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon="🎯" accent="violet" value={recommended.length} label={t('university.recommendedTitle')} onClick={() => setTab('recommended')} />
          <StatCard icon="🚀" accent="indigo" value={myProjects.length} label={t('university.activeProjects')} onClick={() => setTab('projects')} />
          <StatCard icon="👥" accent="teal" value={teamCount} label={t('university.teamMembers')} />
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={() => setTab('recommended')} className={`chip !px-4 !py-2 ${tab === 'recommended' ? 'bg-indigo-600 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>🎯 {t('university.recommendedTitle')}</button>
          <button onClick={() => setTab('projects')} className={`chip !px-4 !py-2 ${tab === 'projects' ? 'bg-indigo-600 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>🚀 {t('university.myProjects')}</button>
        </div>

        {tab === 'recommended' && (
          <div className="mt-5">
            <p className="mb-3 text-sm text-ink-500">{t('university.recommendedSub')}</p>
            <div className="grid gap-4 lg:grid-cols-2">
              {recommended.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-start gap-3">
                    <MatchRing score={r.score} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-ink-900 leading-snug">{r.title}</h3>
                      <p className="mt-0.5 text-xs text-ink-400">📍 {r.location?.district} · 🙌 {r.votes} {t('common.people')}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <StatusBadge status={r.status} /><PriorityBadge priority={r.priority} />
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
                    🧩 {t('university.matchExplain', { reasons: DEPT_BY_CATEGORY[r.category] || getCategory(r.category)[lang] })}
                  </p>
                  {r.needs?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.needs.map((n) => <span key={n} className="chip bg-ink-100 text-ink-600">{n}</span>)}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => express(r.id)} className="btn-primary btn-md flex-1 !bg-indigo-600">🤝 {t('university.interested')}</button>
                    <Link to={`/report/${r.id}`} className="btn-ghost btn-md">{t('common.viewDetails')}</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'projects' && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {myProjects.length === 0 && <p className="card p-8 text-center text-ink-500 lg:col-span-2">{lang === 'hi' ? 'अभी कोई प्रोजेक्ट नहीं — सुझाई गई चुनौतियों से एक चुनें।' : 'No active projects yet — pick one from recommended challenges.'}</p>}
            {myProjects.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <CategoryIcon categoryKey={r.category} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-ink-900 leading-snug">{r.title}</h3>
                    <p className="mt-0.5 text-xs text-ink-400">📍 {r.location?.district} · {r.id}</p>
                    <div className="mt-1.5"><StatusBadge status={r.status} /></div>
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600" style={{ width: `${statusProgress(r.status)}%` }} />
                </div>
                {r.assignedIndustry && <p className="mt-2 text-xs text-amber-700">🏭 {lang === 'hi' ? 'उद्योग साझेदार' : 'Industry partner'}: {r.assignedIndustry}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {['collaboration'].includes(r.status) && <button onClick={() => advance(r.id, 'solution', `${orgName} proposed a solution`)} className="btn-soft btn-md">💡 {t('university.proposeSolution')}</button>}
                  {['solution'].includes(r.status) && <button onClick={() => advance(r.id, 'pilot', 'Pilot started on ground')} className="btn-soft btn-md">🧪 {t('status.pilot')}</button>}
                  {['pilot'].includes(r.status) && <button onClick={() => advance(r.id, 'resolved', 'Solution delivered & verified')} className="btn-primary btn-md !bg-brand-600">🎉 {t('status.resolved')}</button>}
                  <Link to={`/report/${r.id}`} className="btn-ghost btn-md">{t('common.viewDetails')}</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
