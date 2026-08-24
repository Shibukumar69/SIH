import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

const ROLES = [
  { key: 'citizen', icon: '👤', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'government', icon: '🏛️', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { key: 'university', icon: '🎓', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'industry', icon: '🏭', color: 'bg-amber-100 text-amber-800 border-amber-200' },
]

// Prefilled demo credentials per role — match server/src/routes/auth.js.
const ROLE_EMAIL = {
  citizen: 'citizen@jharkhand.gov.in',
  government: 'government@jharkhand.gov.in',
  university: 'university@bitmesra.ac.in',
  industry: 'industry@tatasteel.com',
}
const DEMO_PASSWORD = 'demo1234'

export default function Login() {
  const { t } = useLang()
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  
  const defaultRole = searchParams.get('role') || (redirect === '/report' ? 'citizen' : 'citizen')
  const [isRegister, setIsRegister] = useState(false)
  const [role, setRole] = useState(defaultRole)
  const [name, setName] = useState('')
  const [email, setEmail] = useState(ROLE_EMAIL[defaultRole] || ROLE_EMAIL.citizen)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function pickRole(key) {
    setRole(key)
    if (!isRegister) {
      setEmail(ROLE_EMAIL[key] || '')
      setPassword(DEMO_PASSWORD)
    }
    setError('')
  }

  function toggleMode(registering) {
    setIsRegister(registering)
    setError('')
    if (registering) {
      if (email === ROLE_EMAIL[role]) setEmail('')
      if (password === DEMO_PASSWORD) setPassword('')
    } else {
      setEmail(ROLE_EMAIL[role] || '')
      setPassword(DEMO_PASSWORD)
    }
  }

  async function handleAuth() {
    setBusy(true)
    setError('')
    try {
      if (isRegister) {
        if (!name.trim()) {
          setError(t('auth.nameRequired') || 'Name is required')
          setBusy(false)
          return
        }
        await register({ role, name, email, password, phone })
      } else {
        await login(role, { email, password })
      }
      if (role === 'citizen') {
        navigate(redirect || '/report')
      } else {
        navigate(`/${role}`)
      }
    } catch (err) {
      if (err?.code === 'invalid_credentials') {
        setError(t('auth.invalidCreds') || 'गलत ईमेल या पासवर्ड (Invalid email or password)')
      } else if (err?.code === 'email_exists') {
        setError('यह ईमेल पहले से पंजीकृत है (Email is already registered)')
      } else {
        setError(err?.message || t('auth.loginFailed') || 'लॉगिन विफल (Login failed)')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-app max-w-lg py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo size={52} />
        <h1 className="mt-3 text-2xl font-extrabold text-ink-900">
          {isRegister ? (t('auth.registerTitle') || 'खाता बनाएँ (Create Account)') : t('auth.signInTitle')}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {isRegister ? (t('auth.registerSub') || 'अपनी जानकारी भरकर साइन अप करें') : t('auth.signInSub')}
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="mb-4 flex rounded-2xl bg-ink-100 p-1">
        <button
          type="button"
          onClick={() => toggleMode(false)}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${!isRegister ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'}`}
        >
          🔑 {t('auth.signInTab') || 'साइन इन (Sign In)'}
        </button>
        <button
          type="button"
          onClick={() => toggleMode(true)}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${isRegister ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'}`}
        >
          ✨ {t('auth.registerTab') || 'नया खाता बनाएँ (Sign Up)'}
        </button>
      </div>

      <div className="card p-6">
        <p className="field-label">{t('auth.selectRole')}</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => pickRole(r.key)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition ${
                role === r.key ? `${r.color} shadow-soft` : 'border-ink-100 bg-white text-ink-600 hover:border-ink-200'
              }`}
            >
              <span className="text-2xl">{r.icon}</span>
              <span className="text-xs font-bold">{t(`nav.${r.key}`)}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {isRegister && (
            <div>
              <label className="field-label">{t('report.yourName')} <span className="text-rose-500">*</span></label>
              <input
                className="input"
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>
          )}
          <div>
            <label className="field-label">{t('auth.email')} <span className="text-rose-500">*</span></label>
            <input
              className="input"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              autoComplete="username"
              inputMode="email"
              placeholder="e.g. user@example.com"
              required
            />
          </div>
          <div>
            <label className="field-label">{t('auth.password')} <span className="text-rose-500">*</span></label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAuth() }}
              required
            />
          </div>
          {isRegister && (
            <div>
              <label className="field-label">{t('report.yourPhone')} <span className="text-ink-400 font-normal">({t('common.optional')})</span></label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                inputMode="tel"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            <span>⚠️</span> {error}
          </div>
        )}

        <button onClick={handleAuth} disabled={busy} className="btn-primary btn-xl mt-5 w-full">
          {busy ? t('common.loading') : isRegister ? (t('auth.createAccountBtn') || 'खाता बनाएँ (Register)') : t('auth.signIn')}
        </button>

        {!isRegister && (
          <div className="mt-4 rounded-2xl bg-ink-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-500">🔑 {t('auth.demoNote')}</p>
              <button
                type="button"
                onClick={() => { setEmail(ROLE_EMAIL[role]); setPassword(DEMO_PASSWORD) }}
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                Auto-fill Demo
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-400">{DEMO_ACCOUNTS[role]?.name} · {DEMO_ACCOUNTS[role]?.org}</p>
            <p className="mt-1 font-mono text-xs text-ink-400">{ROLE_EMAIL[role]} · {DEMO_PASSWORD}</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-ink-500">
        {isRegister ? (
          <button type="button" onClick={() => toggleMode(false)} className="font-semibold text-brand-600 hover:underline">
            ← {t('auth.alreadyHaveAccount') || 'पहले से खाता है? साइन इन करें (Sign In)'}
          </button>
        ) : (
          <button type="button" onClick={() => toggleMode(true)} className="font-semibold text-brand-600 hover:underline">
            ✨ {t('auth.noAccountRegister') || 'नया खाता बनाना चाहते हैं? यहाँ क्लिक करें (Create New Account)'}
          </button>
        )}
      </p>
    </div>
  )
}
