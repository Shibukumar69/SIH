import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { api } from '../lib/api.js'
import StatCard from '../components/StatCard.jsx'
import { CategoryIcon } from '../components/CategoryBadge.jsx'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge.jsx'
import { statusProgress } from '../lib/status.js'

// What this industry partner can bring to each kind of challenge.
const CAP = { tech: '⚙️', mentorship: '🧑‍🏫', equipment: '🔧', funding: '💰', implementation: '🚧' }
const PROVIDE_BY_CATEGORY = {
  water: ['equipment', 'funding', 'implementation'],
  electricity: ['tech', 'equipment', 'implementation'],
  roads: ['equipment', 'implementation', 'funding'],
  transport: ['equipment', 'implementation'],
  sanitation: ['equipment', 'funding'],
  agriculture: ['tech', 'mentorship', 'funding'],
  healthcare: ['funding', 'equipment'],
  education: ['tech', 'mentorship', 'funding'],
  environment: ['tech', 'implementation'],
  livelihood: ['mentorship', 'funding'],
  other: ['mentorship'],
}

export default function IndustryDashboard() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const { toast } = useToast()
  const [reports, setReports] = useState([])
  const [tab, setTab] = useState('opportunities')

  const orgName = user?.name || 'Tata Steel Foundation'
  function refresh() { api.listReports({ sort: 'top' }).then(setReports) }
  useEffect(() => { refresh() }, [])

  const opportunities = useMemo(() =>
    reports.filter((r) => ['matching', 'collaboration', 'solution'].includes(r.status) && r.assignedIndustry !== orgName),
    [reports, orgName])
  const active = useMemo(() => reports.filter((r) => r.assignedIndustry === orgName), [reports, orgName])

  // CSR impact figures (derive plausibly from the partner's active work).
  const beneficiaries = useMemo(() => active.reduce((s, r) => s + (r.votes || 0) * 37, 0), [active])
  const csrCommitted = active.length * 12

  async function offer(id) {
    await api.updateReport(id, { status: 'collaboration', assignedIndustry: orgName, note: `${orgName} committed support` })
    refresh(); setTab('active'); toast(t('industry.offerToast'))
  }
  async function advance(id, status, note) { await api.updateReport(id, { status, note }); refresh(); toast(t('common.saved')) }

  return (
    <div className="pb-16">
      <div className="border-b border-ink-100 bg-white">
        <div className="container-app py-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink-900">🏭 {t('industry.title')}</h1>
            <p className="text-sm text-ink-500">{t('industry.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">🏭</span>
            <div className="text-sm leading-tight">
              <p className="font-bold text-amber-900">{orgName}</p>
              <p className="text-xs text-amber-500">{user?.org}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-app py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon="🎯" accent="amber" value={opportunities.length} label={t('industry.opportunities')} onClick={() => setTab('opportunities')} />
          <StatCard icon="🤝" accent="violet" value={active.length} label={t('industry.activeCollaborations')} onClick={() => setTab('active')} />
          <StatCard icon="🙌" accent="teal" value={beneficiaries.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')} label={lang === 'hi' ? 'लाभार्थी' : 'Beneficiaries'} />
          <StatCard icon="💰" accent="brand" value={`₹${csrCommitted}L`} label={t('industry.csrTitle')} />
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={() => setTab('opportunities')} className={`chip !px-4 !py-2 ${tab === 'opportunities' ? 'bg-amber-500 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>🎯 {t('industry.opportunities')}</button>
          <button onClick={() => setTab('active')} className={`chip !px-4 !py-2 ${tab === 'active' ? 'bg-amber-500 text-white' : 'bg-white border border-ink-200 text-ink-600'}`}>🤝 {t('industry.activeCollaborations')}</button>
        </div>

        {tab === 'opportunities' && (
          <div className="mt-5">
            <p className="mb-3 text-sm text-ink-500">{t('industry.opportunitiesSub')}</p>
            <div className="grid gap-4 lg:grid-cols-2">
              {opportunities.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-start gap-3">
                    <CategoryIcon categoryKey={r.category} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-ink-900 leading-snug">{r.title}</h3>
                      <p className="mt-0.5 text-xs text-ink-400">📍 {r.location?.district} · 🙌 {r.votes} {t('common.people')}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5"><StatusBadge status={r.status} /><PriorityBadge priority={r.priority} /></div>
                    </div>
                  </div>
                  {r.assignedUniversity && <p className="mt-2 text-xs text-indigo-700">🎓 {lang === 'hi' ? 'शैक्षणिक साझेदार' : 'Academic partner'}: {r.assignedUniversity}</p>}
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-ink-400">{t('industry.provide')}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(PROVIDE_BY_CATEGORY[r.category] || ['mentorship']).map((c) => (
                        <span key={c} className="chip bg-amber-50 text-amber-800">{CAP[c]} {t(`industry.${c}`)}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => offer(r.id)} className="btn-accent btn-md flex-1">🤝 {t('industry.offerSupport')}</button>
                    <Link to={`/report/${r.id}`} className="btn-ghost btn-md">{t('common.viewDetails')}</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'active' && (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {active.length === 0 && <p className="card p-8 text-center text-ink-500 lg:col-span-2">{lang === 'hi' ? 'अभी कोई सक्रिय सहयोग नहीं — किसी अवसर पर सहयोग दें।' : 'No active collaborations yet — offer support on an opportunity.'}</p>}
            {active.map((r) => (
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
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${statusProgress(r.status)}%` }} />
                </div>
                {r.assignedUniversity && <p className="mt-2 text-xs text-indigo-700">🎓 {r.assignedUniversity}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {['collaboration'].includes(r.status) && <button onClick={() => advance(r.id, 'solution', `${orgName} co-developed a solution`)} className="btn-soft btn-md">💡 {t('university.proposeSolution')}</button>}
                  {['solution'].includes(r.status) && <button onClick={() => advance(r.id, 'pilot', `Pilot funded by ${orgName}`)} className="btn-soft btn-md">🧪 {t('status.pilot')}</button>}
                  {['pilot'].includes(r.status) && <button onClick={() => advance(r.id, 'resolved', 'Scaled & delivered')} className="btn-primary btn-md !bg-brand-600">🎉 {t('status.resolved')}</button>}
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
