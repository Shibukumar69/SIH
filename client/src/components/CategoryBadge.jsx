import { getCategory, categoryStyle } from '../data/categories.js'
import { useLang } from '../context/LanguageContext.jsx'

// Small coloured category chip with emoji + localized label.
export function CategoryPill({ categoryKey, className = '' }) {
  const { lang } = useLang()
  const cat = getCategory(categoryKey)
  const s = categoryStyle(categoryKey)
  return (
    <span className={`chip ${s.chip} ${className}`}>
      <span aria-hidden>{cat.emoji}</span>
      {cat[lang] || cat.en}
    </span>
  )
}

// Rounded emoji tile used in cards and lists.
export function CategoryIcon({ categoryKey, size = 'md' }) {
  const cat = getCategory(categoryKey)
  const s = categoryStyle(categoryKey)
  const dims = size === 'lg' ? 'h-14 w-14 text-2xl' : size === 'sm' ? 'h-9 w-9 text-lg' : 'h-11 w-11 text-xl'
  return (
    <span className={`inline-flex items-center justify-center rounded-2xl ${s.bg} ${dims}`} aria-hidden>
      {cat.emoji}
    </span>
  )
}
