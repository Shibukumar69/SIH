import en from './en.js'
import hi from './hi.js'

export const dictionaries = { en, hi }

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिंदी', short: 'हिं' },
]

// Resolve a dotted key ("report.title") against a dictionary object.
function resolve(dict, key) {
  return key.split('.').reduce((obj, part) => (obj == null ? undefined : obj[part]), dict)
}

// translate(lang, 'report.photoAdded', { n: 2 })
export function translate(lang, key, vars) {
  const dict = dictionaries[lang] || dictionaries.en
  let value = resolve(dict, key)
  if (value === undefined) value = resolve(dictionaries.en, key) // fall back to English
  if (value === undefined) return key // last resort: show the key so nothing is blank
  if (vars && typeof value === 'string') {
    value = value.replace(/\{(\w+)\}/g, (_, name) => (vars[name] != null ? String(vars[name]) : `{${name}}`))
  }
  return value
}
