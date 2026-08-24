import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

const ROLES = [
  { key: 'government', icon: '🏛️', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { key: 'university', icon: '🎓', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'industry', icon: '🏭', color: 'bg-amber-100 text-amber-800 border-amber-200' },
]

// Prefilled demo credentials per role — match server/src/routes/auth.js.
const ROLE_EMAIL = {
  government: 'government@jharkhand.gov.in',
  university: 'university@bitmesra.ac.in',
  industry: 'industry@tatasteel.com',
}
const DEMO_PASSWORD = 'demo1234'

export default function Login() {
  const { t } = useLang()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('government')
  const [email, setEmail] = useState(ROLE_EMAIL.government)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function pickRole(key) {
    setRole(key)
    setEmail(ROLE_EMAIL[key])
    setError('')
  }

  async function handleContinue() {
    setBusy(true)
    setError('')
    try {
      await login(role, { email, password })
      navigate(`/${role}`)
    } catch (err) {
      setError(err?.code === 'invalid_credentials' ? t('auth.invalidCreds') : t('auth.loginFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-app max-w-lg py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo size={52} />
        <h1 className="mt-3 text-2xl font-extrabold text-ink-900">{t('auth.signInTitle')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('auth.signInSub')}</p>
      </div>

      <div className="card p-6">
        <p className="field-label">{t('auth.selectRole')}</p>
        <div className="grid grid-cols-3 gap-2.5">
          {ROLES.map((r) => (
            <button
              key={r.key}
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
          <div>
            <label className="field-label">{t('auth.email')}</label>
            <input
              className="input"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              autoComplete="username"
              inputMode="email"
            />
          </div>
          <div>
            <label className="field-label">{t('auth.password')}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === 'Enter') handleContinue() }}
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            <span>⚠️</span> {error}
          </div>
        )}

        <button onClick={handleContinue} disabled={busy} className="btn-primary btn-xl mt-5 w-full">
          {busy ? t('common.loading') : t('auth.signIn')}
        </button>

        <div className="mt-4 rounded-2xl bg-ink-50 p-3">
          <p className="text-xs font-semibold text-ink-500">🔑 {t('auth.demoNote')}</p>
          <p className="mt-1 text-xs text-ink-400">{DEMO_ACCOUNTS[role].name} · {DEMO_ACCOUNTS[role].org}</p>
          <p className="mt-1 font-mono text-xs text-ink-400">{ROLE_EMAIL[role]} · {DEMO_PASSWORD}</p>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-ink-500">
        {t('auth.citizenNote')}
      </p>
    </div>
  )
}
