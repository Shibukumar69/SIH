// Tiny typed localStorage wrapper. All app data lives under the "ss:" prefix.
const PREFIX = 'ss:'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    // Most likely quota exceeded (too many base64 photos). Fail soft.
    return false
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch { /* ignore */ }
}
