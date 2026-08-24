// Challenge lifecycle order — mirrors client/src/lib/status.js
export const STATUS_ORDER = [
  'submitted', 'verified', 'gov_review', 'matching',
  'collaboration', 'solution', 'pilot', 'resolved',
]

export function statusIndex(status) {
  const i = STATUS_ORDER.indexOf(status)
  return i === -1 ? 0 : i
}
