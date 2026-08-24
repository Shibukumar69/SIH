// The challenge lifecycle — the heart of SamadhanSetu's "beyond 311" story.
// Citizen → Verified → Govt review → University/Industry matching →
// Collaboration → Solution → Pilot → Resolved.
export const STATUS_ORDER = [
  'submitted',
  'verified',
  'gov_review',
  'matching',
  'collaboration',
  'solution',
  'pilot',
  'resolved',
]

export const STATUS_META = {
  submitted:     { icon: '📝', color: 'ink' },
  verified:      { icon: '✅', color: 'sky' },
  gov_review:    { icon: '🏛️', color: 'indigo' },
  matching:      { icon: '🎯', color: 'violet' },
  collaboration: { icon: '🤝', color: 'amber' },
  solution:      { icon: '💡', color: 'yellow' },
  pilot:         { icon: '🧪', color: 'teal' },
  resolved:      { icon: '🎉', color: 'green' },
  rejected:      { icon: '⛔', color: 'rose' },
  reopened:      { icon: '🔄', color: 'orange' },
  merged:        { icon: '🔗', color: 'ink' },
}

export function statusIndex(status) {
  const i = STATUS_ORDER.indexOf(status)
  return i === -1 ? 0 : i
}

export function statusProgress(status) {
  if (status === 'rejected') return 0
  return Math.round((statusIndex(status) / (STATUS_ORDER.length - 1)) * 100)
}

export const PRIORITY_META = {
  low:      { color: 'bg-ink-100 text-ink-600', dot: 'bg-ink-400', order: 0 },
  medium:   { color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500', order: 1 },
  high:     { color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', order: 2 },
  critical: { color: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', order: 3 },
}
