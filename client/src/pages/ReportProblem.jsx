import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { useNetwork } from '../context/NetworkContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { CATEGORIES, getCategory, categoryStyle } from '../data/categories.js'
import { JHARKHAND_DISTRICTS, DISTRICT_NAMES, SAMPLE_LOCATIONS } from '../data/districts.js'
import { classifyText, suggestTitle } from '../lib/classify.js'
import { compressImage } from '../lib/image.js'
import { extractPhotoLocation } from '../lib/exif.js'
import { getCurrentPosition, reverseGeocode } from '../lib/geo.js'
import { CategoryIcon, CategoryPill } from '../components/CategoryBadge.jsx'

const MAX_PHOTOS = 3

// ── Voice input hook (Web Speech API) ────────────────────────────────────────
function useSpeech(lang) {
  const Rec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const supported = !!Rec
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  const start = (onResult) => {
    if (!supported) return
    const rec = new Rec()
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    rec.interimResults = true
    rec.continuous = false
    let finalText = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i]
        if (tr.isFinal) finalText += tr[0].transcript
        else interim += tr[0].transcript
      }
      onResult(finalText + interim, !!finalText)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }
  const stop = () => { recRef.current?.stop(); setListening(false) }
  return { supported, listening, start, stop }
}

// ── Step chrome ──────────────────────────────────────────────────────────────
function Stepper({ step, total, titles }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-brand-600' : 'bg-ink-200'}`} />
        ))}
      </div>
      <p className="mt-2 text-sm font-semibold text-ink-400">{titles.step} {step + 1} {titles.of} {total}</p>
    </div>
  )
}

// ── Location picker ──────────────────────────────────────────────────────────
function LocationPicker({ location, setLocation }) {
  const { t, lang } = useLang()
  const { online } = useNetwork()
  const [mode, setMode] = useState(location?.method || null)
  const [locating, setLocating] = useState(false)
  const [query, setQuery] = useState('')

  const suggestions = useMemo(() => {
    if (query.length < 1) return []
    const q = query.toLowerCase()
    const villages = SAMPLE_LOCATIONS.filter(
      (l) => l.village.toLowerCase().includes(q) || l.district.toLowerCase().includes(q),
    ).slice(0, 5)
    const districts = DISTRICT_NAMES.filter((d) => d.toLowerCase().includes(q))
      .filter((d) => !villages.some((v) => v.district === d))
      .slice(0, 4)
      .map((d) => ({ district: d }))
    return [...villages, ...districts]
  }, [query])

  async function useGps() {
    setLocating(true)
    try {
      const pos = await getCurrentPosition()
      let geo = online ? await reverseGeocode(pos.lat, pos.lng) : null
      setLocation({
        method: 'gps',
        lat: pos.lat, lng: pos.lng,
        village: geo?.village || '',
        block: geo?.block || '',
        district: geo?.district || '',
        state: geo?.state || 'Jharkhand',
        label: geo?.label || `📍 ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`,
      })
      setMode('gps')
    } catch {
      setMode('manual')
    } finally {
      setLocating(false)
    }
  }

  const options = [
    { key: 'gps', icon: '📍', label: t('report.useMyLocation') },
    { key: 'search', icon: '🔎', label: t('report.searchLocation') },
    { key: 'map', icon: '🗺️', label: t('report.onMap') },
    { key: 'manual', icon: '✍️', label: t('report.enterManually') },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => { setMode(o.key); if (o.key === 'gps') useGps() }}
            className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-sm font-semibold transition ${
              mode === o.key ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300'
            }`}
          >
            <span className="text-2xl">{o.icon}</span>
            <span className="text-center leading-tight">{o.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {locating && (
          <div className="flex items-center gap-2 rounded-2xl bg-sky-50 p-4 text-sky-700">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600" />
            {t('report.locating')}
          </div>
        )}

        {mode === 'search' && (
          <div className="relative">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('report.searchLocation')}
              className="input"
            />
            {suggestions.length > 0 && (
              <div className="mt-1 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLocation({
                        method: 'search',
                        village: s.village || '',
                        block: s.block || s.village || '',
                        district: s.district,
                        state: 'Jharkhand',
                        label: `${s.village ? s.village + ', ' : ''}${s.district}, Jharkhand`,
                      })
                      setQuery(s.village ? `${s.village}, ${s.district}` : s.district)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-brand-50"
                  >
                    <span>📍</span>
                    <span className="text-sm">
                      {s.village && <span className="font-semibold text-ink-800">{s.village}, </span>}
                      <span className="text-ink-500">{s.district}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === 'map' && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-sky-50 ring-1 ring-ink-100">
            {JHARKHAND_DISTRICTS.map((d) => (
              <button
                key={d.name}
                onClick={() => setLocation({ method: 'map', district: d.name, state: 'Jharkhand', label: `${lang === 'hi' ? d.hi : d.name}, Jharkhand` })}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
                title={d.name}
              >
                <span className={`block h-3.5 w-3.5 rounded-full ring-2 ring-white transition ${location?.district === d.name ? 'bg-brand-600 scale-150' : 'bg-brand-400 hover:scale-125'}`} />
              </button>
            ))}
            {location?.district && (
              <div className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold text-brand-700">
                📍 {location.label}
              </div>
            )}
          </div>
        )}

        {mode === 'manual' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">{t('report.village')}</label>
              <input className="input" value={location?.village || ''} onChange={(e) => setLocation({ ...location, method: 'manual', village: e.target.value, state: 'Jharkhand' })} />
            </div>
            <div>
              <label className="field-label">{t('report.panchayat')} <span className="text-ink-400 font-normal">({t('common.optional')})</span></label>
              <input className="input" value={location?.panchayat || ''} onChange={(e) => setLocation({ ...location, method: 'manual', panchayat: e.target.value })} />
            </div>
            <div>
              <label className="field-label">{t('report.block')}</label>
              <input className="input" value={location?.block || ''} onChange={(e) => setLocation({ ...location, method: 'manual', block: e.target.value })} />
            </div>
            <div>
              <label className="field-label">{t('report.district')}</label>
              <select className="input" value={location?.district || ''} onChange={(e) => setLocation({ ...location, method: 'manual', district: e.target.value, state: 'Jharkhand', label: `${location?.village ? location.village + ', ' : ''}${e.target.value}, Jharkhand` })}>
                <option value="">—</option>
                {DISTRICT_NAMES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}

        {(location?.district || location?.lat) && mode !== 'map' && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-brand-50 p-3 text-sm font-semibold text-brand-700">
            <span>{location?.method === 'photo' ? '📸' : '✅'}</span>
            {location?.method === 'photo' ? `${t('report.photoLocation')}: ` : `${t('report.locationFound')}: `}
            {location.label || `${location.village || ''} ${location.district || ''}`.trim() || `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ReportProblem() {
  const { t, lang } = useLang()
  const { online } = useNetwork()
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const speech = useSpeech(lang)

  const [step, setStep] = useState(0)
  const [category, setCategory] = useState(params.get('category') || null)
  const [photos, setPhotos] = useState([])
  const [location, setLocation] = useState(null)
  const [description, setDescription] = useState('')
  const [title, setTitle] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null) // { merged, report, into, offline }
  const [similar, setSimilar] = useState(null) // [{ report, score }] once checked

  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  // Auto-fill name when user logs in
  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name)
    }
  }, [user])

  // Live AI classification from the description text.
  const ai = useMemo(() => classifyText(`${title} ${description}`), [title, description])

  // Auto-fill title from description if user hasn't typed one.
  useEffect(() => {
    if (!title && description) setTitle(suggestTitle(description))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description])

  // Citizen Login Gate: Only logged in users can report a problem
  if (!user) {
    return (
      <div className="container-app max-w-lg py-12">
        <div className="card animate-pop-in p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-ink-900">{t('report.loginRequiredTitle')}</h2>
          <p className="mt-2 text-sm text-ink-500">{t('report.loginRequiredSub')}</p>

          <div className="mt-6 space-y-3 rounded-2xl bg-brand-50 p-4 text-left text-xs font-medium text-brand-800">
            <div className="flex items-center gap-2">
              <span>📍</span> <span>{t('report.featureTrack')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔔</span> <span>{t('report.featureUpdates')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🙌</span> <span>{t('report.featureCommunity')}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link to="/login?redirect=/report&role=citizen" className="btn-primary btn-xl w-full">
              👤 {t('report.goToLogin')}
            </Link>
            <Link to="/" className="btn-ghost btn-lg">
              ← {t('common.back')} {t('nav.home')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const steps = [
    { key: 'category', title: t('report.stepCategory'), sub: t('report.stepCategorySub') },
    { key: 'photo', title: t('report.stepPhoto'), sub: t('report.stepPhotoSub') },
    { key: 'location', title: t('report.stepLocation'), sub: t('report.stepLocationSub') },
    { key: 'describe', title: t('report.stepDescribe'), sub: t('report.stepDescribeSub') },
  ]

  const canNext =
    (step === 0 && !!category) ||
    (step === 1) || // photo optional
    (step === 2 && (location?.district || location?.lat)) ||
    (step === 3 && description.trim().length > 2)

  async function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, MAX_PHOTOS - photos.length)
    let gotLocation = !!(location?.district || location?.lat)
    for (const f of files) {
      try {
        // Read GPS out of the ORIGINAL file BEFORE compressing — the canvas
        // re-encode in compressImage() strips all EXIF metadata.
        if (!gotLocation) {
          const gps = await extractPhotoLocation(f)
          if (gps) {
            const geo = online ? await reverseGeocode(gps.lat, gps.lng) : null
            setLocation({
              method: 'photo',
              lat: gps.lat,
              lng: gps.lng,
              village: geo?.village || '',
              block: geo?.block || '',
              district: geo?.district || '',
              state: geo?.state || 'Jharkhand',
              label: geo?.label || `📍 ${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`,
            })
            gotLocation = true
            toast(t('report.photoLocation'), { icon: '📍' })
          }
        }
        const dataUrl = await compressImage(f)
        setPhotos((p) => [...p, dataUrl])
      } catch { /* ignore bad file */ }
    }
  }

  // Ask the platform (server-authoritative, local fallback) whether this problem
  // is already being reported — so many voices merge into one challenge.
  async function checkAndSubmit() {
    setChecking(true)
    const matches = await api.findSimilar({
      category: category || ai.category,
      title: title || suggestTitle(description),
      description,
      location,
    })
    setChecking(false)
    if (matches && matches.length) setSimilar(matches)
    else submit(false)
  }

  function addSupportTo(sr) {
    api.voteReport(sr.id)
    toast(t('toast.voteAdded'), { icon: '🙌' })
    navigate(`/track/${sr.id}`)
  }

  async function submit(allowDuplicate = false) {
    setSubmitting(true)
    const payload = {
      category: category || ai.category,
      title: title || suggestTitle(description) || getCategory(category).en,
      description,
      photos,
      location,
      ai,
      reporter: {
        anonymous,
        name: anonymous ? '' : (name || user?.name || ''),
        phone: anonymous ? '' : phone,
        userEmail: user?.email || '',
        userId: user?.email || user?.token || '',
      },
    }
    const res = await api.createReport(payload, { online, allowDuplicate })
    setSubmitting(false)
    setSimilar(null)
    setResult(res)
  }

  // ── Success screen ──
  if (result) {
    const merged = result.merged
    const r = merged ? result.into : result.report
    const tone = merged ? 'bg-violet-100' : result.offline ? 'bg-amber-100' : 'bg-brand-100'
    const icon = merged ? '🔗' : result.offline ? '📡' : '🎉'
    const heading = merged ? t('report.mergedTitle') : result.offline ? t('report.savedOffline') : t('report.successTitle')
    const sub = merged ? t('report.mergedSub') : result.offline ? t('report.savedOfflineSub') : t('report.successSub')
    return (
      <div className="container-app max-w-lg py-10">
        <div className="card animate-pop-in overflow-hidden p-8 text-center">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${tone}`}>
            <span className="text-4xl">{icon}</span>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-ink-900">{heading}</h2>
          <p className="mt-1 text-ink-500">{sub}</p>

          {merged && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700">
              🙌 {t('report.mergedVotes', { count: r.votes || 0 })}
            </div>
          )}

          <div className="mt-6 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-4">
            <p className="text-sm font-semibold text-brand-700">{merged ? t('report.mergedIntoId') : t('report.yourId')}</p>
            <p className="mt-1 font-mono text-3xl font-extrabold tracking-wider text-brand-800">{r.id}</p>
            <button
              onClick={() => { navigator.clipboard?.writeText(r.id); toast(t('report.copied')) }}
              className="mt-2 text-sm font-semibold text-brand-600 hover:underline"
            >
              📋 {t('report.copyId')}
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link to={`/track/${r.id}`} className="btn-primary btn-lg">📊 {t('report.trackThis')}</Link>
            <button onClick={() => { setResult(null); setStep(0); setCategory(null); setPhotos([]); setLocation(null); setDescription(''); setTitle('') }} className="btn-ghost btn-lg">
              📝 {t('report.reportAnother')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const cat = category ? getCategory(category) : null

  return (
    <div className="container-app max-w-2xl py-6">
      <h1 className="mb-1 text-2xl font-extrabold text-ink-900">{t('report.title')}</h1>
      <Stepper step={step} total={steps.length} titles={{ step: t('common.step'), of: t('common.of') }} />

      <div className="card p-5 sm:p-6">
        <h2 className="text-xl font-bold text-ink-900">{steps[step].title}</h2>
        <p className="mb-5 text-sm text-ink-500">{steps[step].sub}</p>

        {/* Step 1: Category */}
        {step === 0 && (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {CATEGORIES.map((c) => {
              const s = categoryStyle(c.key)
              const active = category === c.key
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition active:scale-95 ${
                    active ? 'border-brand-500 bg-brand-50 shadow-soft' : 'border-ink-100 bg-white hover:border-brand-200'
                  }`}
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${s.bg}`}>{c.emoji}</span>
                  <span className="text-center text-xs font-semibold text-ink-700 leading-tight">{c[lang] || c.en}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Step 2: Photo */}
        {step === 1 && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => cameraRef.current?.click()} disabled={photos.length >= MAX_PHOTOS}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-ink-100 bg-white py-6 font-semibold text-ink-700 hover:border-brand-300 disabled:opacity-40">
                <span className="text-3xl">📷</span> {t('report.takePhoto')}
              </button>
              <button onClick={() => galleryRef.current?.click()} disabled={photos.length >= MAX_PHOTOS}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-ink-100 bg-white py-6 font-semibold text-ink-700 hover:border-brand-300 disabled:opacity-40">
                <span className="text-3xl">🖼️</span> {t('report.chooseGallery')}
              </button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <p className="mt-2 text-xs text-ink-400">{t('report.photoHint', { max: MAX_PHOTOS })}</p>
            {photos.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {photos.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="h-24 w-24 rounded-2xl object-cover ring-1 ring-ink-100" />
                    <button onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                      className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-xs text-white">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Location */}
        {step === 2 && <LocationPicker location={location} setLocation={setLocation} />}

        {/* Step 4: Describe */}
        {step === 3 && (
          <div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => speech.listening
                  ? speech.stop()
                  : speech.start((text) => setDescription(text))}
                disabled={!speech.supported}
                className={`flex items-center justify-center gap-3 rounded-2xl py-4 text-base font-bold transition ${
                  speech.listening ? 'bg-rose-500 text-white' : 'bg-brand-600 text-white hover:bg-brand-700'
                } disabled:opacity-40`}
              >
                <span className={`text-2xl ${speech.listening ? 'animate-pulse' : ''}`}>🎤</span>
                {speech.listening ? t('report.listening') : t('report.speak')}
              </button>
              {!speech.supported && <p className="text-xs text-amber-600">{t('report.voiceUnsupported')}</p>}

              <div>
                <label className="field-label">✍️ {t('report.typeInstead')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder={t('report.describePlaceholder')}
                  className="input resize-none"
                />
              </div>

              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('report.titlePlaceholder')} className="input" />

              {/* AI detected category */}
              {description.trim().length > 2 && ai.confidence > 0 && (
                <div className="flex items-center justify-between rounded-2xl bg-violet-50 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">🤖</span>
                    <div>
                      <p className="font-semibold text-violet-800">{t('report.aiDetected')}</p>
                      <p className="text-violet-600">
                        {getCategory(ai.category).emoji} {getCategory(ai.category)[lang]} · {t('report.aiConfidence', { pct: ai.confidence })}
                      </p>
                    </div>
                  </div>
                  {ai.category !== category && (
                    <button onClick={() => setCategory(ai.category)} className="btn-soft btn-md !py-1.5">
                      {t('report.changeCategory')} →
                    </button>
                  )}
                </div>
              )}

              {/* Contact */}
              <label className="flex items-center gap-3 rounded-2xl border border-ink-100 p-3">
                <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-5 w-5 accent-brand-600" />
                <span className="text-sm font-semibold text-ink-700">{t('report.reportAnonymously')}</span>
              </label>
              {!anonymous && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('report.yourName')} className="input" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('report.yourPhone')} className="input" inputMode="tel" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI similar-problem detection — merge into one challenge */}
      {similar && (
        <div className="mt-4 card border-violet-200 bg-violet-50 p-4">
          <p className="font-bold text-violet-900">🤖 {t('report.similarFound')}</p>
          <p className="mt-1 text-sm text-violet-800">{t('report.similarSub')}</p>
          <div className="mt-3 space-y-2">
            {similar.map(({ report: sr, score }) => (
              <div key={sr.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 ring-1 ring-violet-100">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CategoryIcon categoryKey={sr.category} />
                    <p className="truncate font-semibold text-ink-800">{sr.title}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">
                    📍 {sr.location?.district || '—'} · 🙌 {sr.votes || 0} · <span className="font-semibold text-violet-600">{t('report.matchPct', { pct: Math.round(score * 100) })}</span>
                  </p>
                </div>
                <button onClick={() => addSupportTo(sr)} className="btn-accent btn-sm shrink-0">🙌 {t('report.meToo')}</button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setSimilar(null)} className="btn-ghost btn-md">← {t('common.back')}</button>
            <button onClick={() => submit(true)} disabled={submitting} className="btn-soft btn-md">
              {submitting ? t('report.submitting') : t('report.reportSeparately')}
            </button>
          </div>
        </div>
      )}

      {/* Nav buttons */}
      {!similar && (
        <div className="mt-5 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="btn-ghost btn-lg flex-1 sm:flex-none">
              ← {t('common.back')}
            </button>
          )}
          {step === 1 && photos.length === 0 && (
            <button onClick={() => setStep(2)} className="btn-ghost btn-lg flex-1">{t('common.skip')}</button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="btn-primary btn-lg flex-1">
              {t('common.next')} →
            </button>
          ) : (
            <button
              onClick={checkAndSubmit}
              disabled={!canNext || submitting || checking}
              className="btn-primary btn-xl flex-1"
            >
              {checking ? t('report.checking') : submitting ? t('report.submitting') : `✅ ${t('report.submitReport')}`}
            </button>
          )}
        </div>
      )}

      {/* Live summary chip on later steps */}
      {cat && step > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <CategoryPill categoryKey={category} />
          {photos.length > 0 && <span className="chip bg-ink-100 text-ink-600">🖼️ {photos.length}</span>}
          {location?.district && <span className="chip bg-ink-100 text-ink-600">📍 {location.district}</span>}
        </div>
      )}
    </div>
  )
}
