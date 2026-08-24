import { load, save } from './storage.js'
import { generateReportId, localUid } from './id.js'
import { buildSeedReports } from '../data/seed.js'

// ── SamadhanSetu data layer ─────────────────────────────────────────────────
// Local-first: every read/write hits an on-device store so the app is instant
// and fully usable offline (the rural / weak-network reality). When the Express
// + MongoDB backend is reachable it becomes the source of truth and offline
// writes are replayed from an outbox. Nothing here throws to the UI.

const API_BASE = import.meta.env.VITE_API_URL || ''
const KEYS = { reports: 'reports', outbox: 'outbox', myids: 'myids', votes: 'votes' }

let serverAvailable = null // null = unknown, true/false once probed

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

async function probeServer() {
  if (serverAvailable !== null) return serverAvailable
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 1500)
    const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal })
    clearTimeout(timer)
    serverAvailable = res.ok
  } catch {
    serverAvailable = false
  }
  return serverAvailable
}

// ── Local store helpers ──────────────────────────────────────────────────────
function getLocalReports() {
  let reports = load(KEYS.reports, null)
  if (!reports) {
    reports = buildSeedReports(Date.now())
    save(KEYS.reports, reports)
  }
  return reports
}
function setLocalReports(reports) {
  save(KEYS.reports, reports)
}
function getVotes() {
  return load(KEYS.votes, {})
}
function getMyIds() {
  return load(KEYS.myids, [])
}
function addMyId(id) {
  const ids = getMyIds()
  if (!ids.includes(id)) save(KEYS.myids, [id, ...ids])
}
function getOutbox() {
  return load(KEYS.outbox, [])
}
function setOutbox(items) {
  save(KEYS.outbox, items)
}

// ── Sorting / filtering ──────────────────────────────────────────────────────
function applyQuery(reports, { category, district, status, sort } = {}) {
  let out = [...reports]
  if (category && category !== 'all') out = out.filter((r) => r.category === category)
  if (district && district !== 'all') out = out.filter((r) => r.location?.district === district)
  if (status && status !== 'all') out = out.filter((r) => r.status === status)
  if (sort === 'top') out.sort((a, b) => (b.votes || 0) - (a.votes || 0))
  else out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // newest
  return out
}

export const api = {
  probeServer,
  isServerAvailable: () => serverAvailable === true,

  async listReports(query = {}) {
    getLocalReports() // ensure seeded
    if (await probeServer()) {
      try {
        const data = await request(`/reports${toQueryString(query)}`)
        if (Array.isArray(data) && data.length) setLocalReports(mergeLocalVotes(data))
        return applyQuery(load(KEYS.reports, []), query)
      } catch { /* fall through to local */ }
    }
    return applyQuery(getLocalReports(), query)
  },

  async getReport(id) {
    const local = getLocalReports().find((r) => r.id === id)
    if (await probeServer()) {
      try {
        const data = await request(`/reports/${id}`)
        if (data) return { ...data, votedByMe: !!getVotes()[id] }
      } catch { /* fall through */ }
    }
    return local ? { ...local, votedByMe: !!getVotes()[id] } : null
  },

  async createReport(input, { online = true } = {}) {
    const id = generateReportId()
    const now = new Date().toISOString()
    const report = {
      id,
      uid: localUid(),
      category: input.category,
      title: input.title,
      description: input.description,
      photos: input.photos || [],
      location: input.location || {},
      status: 'submitted',
      priority: input.priority || 'medium',
      votes: 1,
      ai: input.ai || null,
      reporter: input.reporter || { anonymous: true },
      needs: [],
      assignedUniversity: null,
      assignedIndustry: null,
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: 'submitted', at: now, note: 'Report received from citizen' }],
      pending: false,
    }

    // Optimistically add to local store + "my reports".
    const reports = getLocalReports()
    addMyId(id)

    const canReach = online && (await probeServer())
    if (canReach) {
      try {
        const saved = await request('/reports', { method: 'POST', body: JSON.stringify(report) })
        const finalReport = { ...report, ...saved }
        setLocalReports([finalReport, ...reports])
        return { report: finalReport, offline: false }
      } catch { /* fall to outbox */ }
    }

    // Offline (or server unreachable): keep locally + queue for later sync.
    const pendingReport = { ...report, pending: true }
    setLocalReports([pendingReport, ...reports])
    setOutbox([pendingReport, ...getOutbox()])
    return { report: pendingReport, offline: true }
  },

  async voteReport(id) {
    const votes = getVotes()
    if (votes[id]) return { alreadyVoted: true }
    votes[id] = true
    save(KEYS.votes, votes)

    const reports = getLocalReports().map((r) =>
      r.id === id ? { ...r, votes: (r.votes || 0) + 1, votedByMe: true } : r,
    )
    setLocalReports(reports)

    if (await probeServer()) {
      request(`/reports/${id}/vote`, { method: 'POST' }).catch(() => {})
    }
    return { alreadyVoted: false }
  },

  // Used by government / university / industry dashboards.
  async updateReport(id, patch) {
    const now = new Date().toISOString()
    const reports = getLocalReports().map((r) => {
      if (r.id !== id) return r
      const next = { ...r, ...patch, updatedAt: now }
      if (patch.status && patch.status !== r.status) {
        next.timeline = [...(r.timeline || []), { status: patch.status, at: now, note: patch.note || '' }]
      }
      return next
    })
    setLocalReports(reports)
    if (await probeServer()) {
      request(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).catch(() => {})
    }
    return reports.find((r) => r.id === id)
  },

  async syncOutbox() {
    const outbox = getOutbox()
    if (!outbox.length) return { synced: 0 }
    if (!(await probeServer())) return { synced: 0, pending: outbox.length }
    let synced = 0
    const remaining = []
    for (const item of outbox) {
      try {
        const saved = await request('/reports', { method: 'POST', body: JSON.stringify({ ...item, pending: false }) })
        synced++
        // Clear the pending flag on the local copy.
        const reports = getLocalReports().map((r) => (r.id === item.id ? { ...r, ...saved, pending: false } : r))
        setLocalReports(reports)
      } catch {
        remaining.push(item)
      }
    }
    setOutbox(remaining)
    return { synced, pending: remaining.length }
  },

  pendingCount() {
    return getOutbox().length
  },

  async getMyReports() {
    const ids = getMyIds()
    const reports = getLocalReports()
    return ids.map((id) => reports.find((r) => r.id === id)).filter(Boolean)
  },

  async stats() {
    const reports = getLocalReports()
    return computeStats(reports)
  },

  async login(role, credentials) {
    if (await probeServer()) {
      return request('/auth/login', { method: 'POST', body: JSON.stringify({ role, ...credentials }) })
    }
    throw new Error('offline')
  },
}

function toQueryString(query) {
  const entries = Object.entries(query).filter(([, v]) => v && v !== 'all')
  if (!entries.length) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
}

// Preserve this device's "votedByMe" flags when replacing with server data.
function mergeLocalVotes(serverReports) {
  const votes = getVotes()
  return serverReports.map((r) => ({ ...r, votedByMe: !!votes[r.id] }))
}

export function computeStats(reports) {
  const byStatus = {}
  const byCategory = {}
  const byDistrict = {}
  let totalVotes = 0
  for (const r of reports) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1
    byCategory[r.category] = (byCategory[r.category] || 0) + 1
    const d = r.location?.district || 'Unknown'
    byDistrict[d] = (byDistrict[d] || 0) + 1
    totalVotes += r.votes || 0
  }
  const resolved = byStatus.resolved || 0
  const total = reports.length
  const collaboration = (byStatus.collaboration || 0) + (byStatus.solution || 0) + (byStatus.pilot || 0)
  const pending = (byStatus.submitted || 0)
  const highPriority = reports.filter((r) => r.priority === 'high' || r.priority === 'critical').length
  const solutions = (byStatus.solution || 0) + (byStatus.pilot || 0) + resolved
  return {
    total,
    pending,
    highPriority,
    collaboration,
    solutions,
    resolved,
    totalVotes,
    byStatus,
    byCategory,
    byDistrict,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
  }
}
