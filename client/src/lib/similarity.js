// ── Duplicate / same-problem detection ───────────────────────────────────────
// Decides when two crowdsourced reports describe the SAME real-world problem, so
// many citizens' voices merge into ONE challenge instead of fragmenting into
// duplicates. Pure and dependency-free: runs instantly on-device (offline) and
// is mirrored on the server (server/src/lib/similarity.js) as the authoritative,
// cross-user check. To swap in an embeddings/LLM similarity model later, replace
// the body of similarityScore — the { score } contract stays the same.

const STOPWORDS = new Set([
  // English
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'to', 'of', 'in', 'on',
  'at', 'for', 'and', 'or', 'but', 'with', 'without', 'no', 'not', 'has', 'have', 'had', 'our',
  'my', 'we', 'they', 'it', 'this', 'that', 'there', 'here', 'from', 'by', 'as', 'so', 'if',
  'then', 'than', 'very', 'more', 'most', 'some', 'any', 'all', 'into', 'out', 'up', 'down',
  'near', 'after', 'before', 'since', 'get', 'got', 'also', 'only', 'just', 'still', 'now', 'yet',
  // Hinglish (roman)
  'hai', 'hain', 'ho', 'gaya', 'gayi', 'gaye', 'raha', 'rahi', 'rahe', 'nahi', 'nahin', 'ka',
  'ki', 'ke', 'ko', 'me', 'mein', 'se', 'par', 'pe', 'aur', 'ya', 'bhi', 'hi', 'ye', 'yeh',
  'wo', 'woh', 'hamare', 'hamari', 'humara', 'apna', 'apne', 'kar', 'karo', 'kya', 'koi', 'tha',
  'thi', 'jo', 'jab', 'tak', 'wala', 'wali', 'kai', 'bahut',
  // Devanagari
  'है', 'हैं', 'हो', 'गया', 'गई', 'गए', 'रहा', 'रही', 'रहे', 'नहीं', 'का', 'की', 'के', 'को',
  'में', 'से', 'पर', 'और', 'या', 'भी', 'ही', 'ये', 'यह', 'वो', 'हमारे', 'हमारी', 'अपना', 'कर',
  'क्या', 'कोई', 'था', 'थी', 'जो', 'जब', 'तक',
])

// Split any-script text into meaningful lowercase tokens (Latin + Devanagari).
export function tokenize(text) {
  const raw = String(text || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []
  const out = []
  for (const w of raw) {
    if (w.length < 3) continue
    if (STOPWORDS.has(w)) continue
    out.push(w)
  }
  return out
}

function jaccard(a, b) {
  if (!a.length || !b.length) return 0
  const A = new Set(a)
  const B = new Set(b)
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  const union = A.size + B.size - inter
  return union ? inter / union : 0
}

const R_KM = 6371
function haversineKm(a, b) {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) return null
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R_KM * Math.asin(Math.sqrt(h))
}

const norm = (s) => String(s || '').trim().toLowerCase()

// Likelihood that two reports are the SAME problem → 0..1.
export function similarityScore(a, b) {
  // Different domain ⇒ never the same problem.
  if (a.category && b.category && a.category !== b.category) return 0

  const at = tokenize(`${a.title || ''} ${a.description || ''}`)
  const bt = tokenize(`${b.title || ''} ${b.description || ''}`)
  const textSim = jaccard(at, bt)

  // Shared domain baseline + textual overlap is the core signal.
  let score = 0.28 + textSim * 0.5

  const la = a.location || {}
  const lb = b.location || {}
  if (la.district && lb.district && norm(la.district) === norm(lb.district)) score += 0.14
  const av = norm(la.village || la.block)
  const bv = norm(lb.village || lb.block)
  if (av && bv && av === bv) score += 0.08

  const dist = haversineKm(la, lb)
  if (dist != null) {
    if (dist < 0.5) score += 0.12
    else if (dist < 2) score += 0.07
    else if (dist > 40) score -= 0.1
  }

  return Math.max(0, Math.min(0.99, score))
}

// Surface as "are you facing this too?" — merge is a one-tap choice.
export const SIMILAR_SUGGEST = 0.42
// Server merges silently at/above this — near-certain duplicate.
export const SIMILAR_MERGE = 0.72

// Rank existing reports by similarity to a candidate (best first).
export function findSimilar(candidate, reports, { min = SIMILAR_SUGGEST, limit = 4 } = {}) {
  const skip = new Set(['merged', 'rejected'])
  const out = []
  for (const r of reports || []) {
    if (!r || skip.has(r.status)) continue
    if (candidate.id && r.id === candidate.id) continue
    const score = similarityScore(candidate, r)
    if (score >= min) out.push({ report: r, score })
  }
  out.sort((x, y) => y.score - x.score)
  return out.slice(0, limit)
}
