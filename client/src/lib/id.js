// Human-friendly report IDs like "SS-10482".
export function generateReportId() {
  // 5-digit number, biased away from leading zero for readability.
  const n = 10000 + Math.floor(Math.random() * 89999)
  return `SS-${n}`
}

// Short client id for offline/outbox items before the server assigns one.
export function localUid() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
