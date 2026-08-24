import { useLang } from '../context/LanguageContext.jsx'

// A real, prominent language switch — not a hidden setting. Rural users must be
// able to flip the entire UI between English and हिंदी in one tap.
export default function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLang()
  return (
    <div className={`inline-flex items-center rounded-full bg-ink-100 p-1 text-sm font-semibold ${className}`}>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`rounded-full px-3 py-1 transition ${
          lang === 'en' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('hi')}
        aria-pressed={lang === 'hi'}
        className={`rounded-full px-3 py-1 transition ${
          lang === 'hi' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'
        }`}
      >
        हिंदी
      </button>
    </div>
  )
}
