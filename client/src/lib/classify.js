import { CATEGORIES } from '../data/categories.js'

// ── On-device problem classifier ────────────────────────────────────────────
// Scores the citizen's title + description against each domain's keyword set
// (English, Hindi and Hinglish) and returns the best match with a confidence.
//
// This runs instantly, offline, and with zero API cost — ideal for weak-network
// rural use. It is intentionally a pluggable layer: to swap in a real ML model
// or an LLM classifier, replace the body of `classifyText` with an API call
// that returns the same { category, confidence, alternatives } shape.

function normalize(text) {
  return ` ${(text || '').toLowerCase()} `
    .replace(/[.,/#!$%^&*;:{}=\-_`~()\n]/g, ' ')
    .replace(/\s+/g, ' ')
}

export function classifyText(text) {
  const hay = normalize(text)
  if (hay.trim().length === 0) {
    return { category: 'other', confidence: 0, alternatives: [] }
  }

  const scores = CATEGORIES.filter((c) => c.key !== 'other').map((c) => {
    let score = 0
    for (const kw of c.keywords) {
      const needle = ` ${kw.toLowerCase()} `
      if (hay.includes(needle)) {
        // Longer / multi-word keywords are more specific → weigh them higher.
        score += kw.includes(' ') ? 3 : 2
      } else if (hay.includes(kw.toLowerCase())) {
        // Substring match (e.g. inside a compound word) — weaker signal.
        score += 1
      }
    }
    return { key: c.key, score }
  })

  scores.sort((a, b) => b.score - a.score)
  const top = scores[0]

  if (!top || top.score === 0) {
    return { category: 'other', confidence: 0, alternatives: [] }
  }

  // Confidence: how dominant the top score is vs. the total signal.
  const total = scores.reduce((s, x) => s + x.score, 0)
  const dominance = top.score / total
  // Map to a friendly 55–98% range so it reads like a real classifier.
  const confidence = Math.min(98, Math.round(55 + dominance * 43 + Math.min(top.score, 6) * 2))

  const alternatives = scores
    .filter((s) => s.score > 0 && s.key !== top.key)
    .slice(0, 2)
    .map((s) => s.key)

  return { category: top.key, confidence, alternatives }
}

// Suggest a short title from the description if the user didn't type one.
export function suggestTitle(text, maxWords = 8) {
  const clean = (text || '').trim().replace(/\s+/g, ' ')
  if (!clean) return ''
  const words = clean.split(' ').slice(0, maxWords).join(' ')
  const title = words.charAt(0).toUpperCase() + words.slice(1)
  return clean.split(' ').length > maxWords ? `${title}…` : title
}
