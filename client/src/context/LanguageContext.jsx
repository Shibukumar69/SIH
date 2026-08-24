import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { translate, LANGUAGES } from '../i18n/index.js'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'ss:lang'

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'hi') return saved
    // Default to Hindi if the browser is Hindi — this is a Jharkhand-first product.
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('hi')) return 'hi'
    return 'en'
  })

  const setLang = useCallback((code) => {
    setLangState(code)
    try { localStorage.setItem(STORAGE_KEY, code) } catch { /* ignore */ }
  }, [])

  const toggle = useCallback(() => setLang(lang === 'en' ? 'hi' : 'en'), [lang, setLang])

  // t('key', { vars }) bound to the active language
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
