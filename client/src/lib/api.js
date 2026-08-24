import { load, save } from './storage.js'
import { generateReportId, localUid } from './id.js'
import { buildSeedReports } from '../data/seed.js'
import { findSimilar as findSimilarLocal, SIMILAR_SUGGEST } from './similarity.js'

// ── SamadhanSetu data layer ─────────────────────────────────────────────────
// Local-first: every read/write hits an on-device store so the app is instant
// and fully usable offline (the rural / weak-network reality). When the Express
// + MongoDB backend is reachable it becomes the source of truth and offline
// writes are replayed from an outbox. Nothing here throws to the UI.

const API_BASE = import.meta.env.VITE_API_URL || ''
const KEYS = { reports: 'reports', outbox: 'outbox', myids: 'myids', votes: 'votes' }

let serverAvailable = null // null = unknown, true/false once probed
let lastProbeAt = 0
// Re-check connectivity on this cadence. Crucially we must NOT cache a "false"
// result forever: if the API was momentarily down at page load (e.g. a server
// restart) the app would otherwise stay stuck in local-only mode for the whole
// session and never show server data again. A short TTL lets it self-heal.
const PROBE_TTL_MS = 4000

// Attach the institutional session's Bearer token on privileged calls. Demo
// tokens (offline fallback) are skipped — the server would reject them, and the
// optimistic local update already covers that case.
function authHeader() {
  try {
    const raw = localStorage.getItem('ss:auth')
    const token = raw ? JSON.parse(raw)?.token : null
    if (token) return { Authorization: `Bearer ${token}` }
  } catch { /* ignore */ }
  return {}
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      ...authHeader(),
      ...(options.headers || {})
    },
  })
  if (!res.ok) {
    let json = null
    try { json = await res.json() } catch {}
    const err = new Error(json?.message || `API ${res.status}`)
    err.status = res.status
    err.code = json?.error || 'api_error'
    err.data = json
    throw err
  }
  return res.json()
}

async function probeServer() {
  const now = Date.now()
  // Serve a cached verdict only briefly; always re-probe after the TTL so a
  // server that comes online mid-session is picked up automatically.
  if (serverAvailable !== null && now - lastProbeAt < PROBE_TTL_MS) return serverAvailable
  lastProbeAt = now
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 1500)
    const res = await fetch(`${API_BASE}/api/health`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    })
    clearTimeout(timer)
    serverAvailable = res.ok
  } catch {
    serverAvailable = false
  }
  return serverAvailable
}

// ── Local store helpers ──────────────────────────────────────────────────────
function getLocalReports() {
  return load(KEYS.reports, [])
}
function setLocalReports(reports) {
  save(KEYS.reports, reports)
}
function getVotes() {
  return load(KEYS.votes, {})
}
function getMyIds(userEmail) {
  const key = userEmail ? `myids_${userEmail}` : KEYS.myids
  return load(key, [])
}
function addMyId(id, userEmail) {
  const key = userEmail ? `myids_${userEmail}` : KEYS.myids
  const ids = getMyIds(userEmail)
  if (!ids.includes(id)) save(key, [id, ...ids])
}
function removeMyId(id, userEmail) {
  const key = userEmail ? `myids_${userEmail}` : KEYS.myids
  const ids = getMyIds(userEmail)
  if (ids.includes(id)) save(key, ids.filter((x) => x !== id))
}
// Insert or update a report in the local store by id, keeping this device's vote flag.
function upsertLocal(reports, report) {
  const withVote = { ...report, votedByMe: !!getVotes()[report.id] }
  const idx = reports.findIndex((r) => r.id === report.id)
  if (idx === -1) return [withVote, ...reports]
  const copy = [...reports]
  copy[idx] = { ...copy[idx], ...withVote }
  return copy
}
function getOutbox() {
  return load(KEYS.outbox, [])
}
function setOutbox(items) {
  save(KEYS.outbox, items)
}

// ── Sorting / filtering ──────────────────────────────────────────────────────
function applyQuery(reports, { category, district, status, sort } = {}) {
  // Merged duplicates are tombstones — never surface them in any listing.
  let out = reports.filter((r) => r.status !== 'merged')
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
    if (await probeServer()) {
      try {
        const data = await request(`/reports${toQueryString(query)}`)
        if (Array.isArray(data)) {
          const merged = mergeLocalVotes(data)
          const localReports = getLocalReports()
          const serverIds = new Set(data.map((r) => r.id))
          const localOnly = localReports.filter((r) => !serverIds.has(r.id))
          const combined = [...merged, ...localOnly]
          setLocalReports(combined)
          return applyQuery(combined, query)
        }
      } catch { /* fall through to local */ }
    }
    return applyQuery(getLocalReports(), query)
  },

  async getReport(id) {
    const local = getLocalReports().find((r) => r.id === id)
    if (await probeServer()) {
      try {
        const data = await request(`/reports/${id}`)
        if (data) {
          // Following a merged id lands transparently on the canonical problem.
          if (data.mergedInto) {
            const canon = await request(`/reports/${data.mergedInto}`).catch(() => null)
            if (canon) return { ...canon, votedByMe: !!getVotes()[canon.id], mergedFrom: id }
          }
          return { ...data, votedByMe: !!getVotes()[data.id || id] }
        }
      } catch { /* fall through */ }
    }
    if (local?.mergedInto) {
      const canon = getLocalReports().find((r) => r.id === local.mergedInto)
      if (canon) return { ...canon, votedByMe: !!getVotes()[canon.id], mergedFrom: id }
    }
    return local ? { ...local, votedByMe: !!getVotes()[id] } : null
  },

  // "Is someone already reporting this?" — server-authoritative, local fallback.
  async findSimilar(input) {
    const candidate = {
      category: input.category,
      title: input.title,
      description: input.description,
      location: input.location,
    }
    if (await probeServer()) {
      try {
        const data = await request('/reports/similar', { method: 'POST', body: JSON.stringify(candidate) })
        if (Array.isArray(data)) return data
      } catch { /* fall through to local */ }
    }
    return findSimilarLocal(candidate, getLocalReports(), { min: SIMILAR_SUGGEST, limit: 4 })
  },

  async createReport(input, { online = true, allowDuplicate = false } = {}) {
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
      mergedInto: null,
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: 'submitted', at: now, note: 'Report received from citizen' }],
      pending: false,
    }

    const reports = getLocalReports()
    const canReach = online && (await probeServer())
    const reporterEmail = input.reporter?.userEmail || input.reporter?.userId
    if (canReach) {
      try {
        const data = await request('/reports', { method: 'POST', body: JSON.stringify({ ...report, allowDuplicate }) })
        // Server folded this into an existing challenge — reflect + track that one.
        if (data.merged && data.into) {
          setLocalReports(upsertLocal(reports, data.into))
          addMyId(data.into.id, reporterEmail)
          addMyId(data.into.id)
          return { merged: true, report: data.into, into: data.into, offline: false }
        }
        const finalReport = { ...report, ...(data.report || {}) }
        setLocalReports([finalReport, ...reports.filter((r) => r.id !== finalReport.id)])
        addMyId(finalReport.id, reporterEmail)
        addMyId(finalReport.id)
        return { merged: false, report: finalReport, offline: false }
      } catch { /* fall to outbox */ }
    }

    // Offline (or server unreachable): keep locally + queue for later sync.
    const pendingReport = { ...report, pending: true }
    setLocalReports([pendingReport, ...reports])
    addMyId(id, reporterEmail)
    addMyId(id)
    setOutbox([{ ...pendingReport, allowDuplicate }, ...getOutbox()])
    return { merged: false, report: pendingReport, offline: true }
  },

  // Citizen reopens a challenge they don't consider resolved (public, no login).
  async reopenReport(id, note) {
    const now = new Date().toISOString()
    let updatedReport = null
    if (await probeServer()) {
      try {
        updatedReport = await request(`/reports/${id}/reopen`, { method: 'POST', body: JSON.stringify({ note }) })
      } catch { /* fall through to local */ }
    }
    const reports = getLocalReports().map((r) => {
      if (r.id !== id) return r
      return updatedReport || {
        ...r,
        status: 'reopened',
        priority: 'high',
        updatedAt: now,
        timeline: [...(r.timeline || []), { status: 'reopened', at: now, note: note || 'Reopened by citizen' }],
      }
    })
    setLocalReports(reports)
    return updatedReport || reports.find((r) => r.id === id)
  },

  async voteReport(id) {
    const votes = getVotes()
    if (votes[id]) return { alreadyVoted: true }
    votes[id] = true
    save(KEYS.votes, votes)

    if (await probeServer()) {
      try {
        const res = await request(`/reports/${id}/vote`, { method: 'POST' })
        if (res && typeof res.votes === 'number') {
          const reports = getLocalReports().map((r) =>
            r.id === id ? { ...r, votes: res.votes, votedByMe: true } : r,
          )
          setLocalReports(reports)
          return { alreadyVoted: false, votes: res.votes }
        }
      } catch { /* fall through */ }
    }

    const reports = getLocalReports().map((r) =>
      r.id === id ? { ...r, votes: (r.votes || 0) + 1, votedByMe: true } : r,
    )
    setLocalReports(reports)
    return { alreadyVoted: false }
  },

  // Used by government / university / industry dashboards.
  async updateReport(id, patch) {
    const now = new Date().toISOString()
    let updatedReport = null
    if (await probeServer()) {
      try {
        updatedReport = await request(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
      } catch { /* fall through */ }
    }
    const reports = getLocalReports().map((r) => {
      if (r.id !== id) return r
      return updatedReport || {
        ...r,
        ...patch,
        updatedAt: now,
        timeline: patch.status && patch.status !== r.status
          ? [...(r.timeline || []), { status: patch.status, at: now, note: patch.note || '' }]
          : r.timeline
      }
    })
    setLocalReports(reports)
    return updatedReport || reports.find((r) => r.id === id)
  },

  async syncOutbox() {
    const outbox = getOutbox()
    if (!outbox.length) return { synced: 0 }
    if (!(await probeServer())) return { synced: 0, pending: outbox.length }
    let synced = 0
    const remaining = []
    for (const item of outbox) {
      try {
        const data = await request('/reports', { method: 'POST', body: JSON.stringify({ ...item, pending: false }) })
        synced++
        if (data.merged && data.into) {
          // This queued report turned out to duplicate an existing one on sync.
          let reports = getLocalReports().filter((r) => r.id !== item.id)
          reports = upsertLocal(reports, data.into)
          setLocalReports(reports)
          removeMyId(item.id)
          addMyId(data.into.id)
        } else {
          const saved = data.report || {}
          const reports = getLocalReports().map((r) => (r.id === item.id ? { ...r, ...saved, pending: false } : r))
          setLocalReports(reports)
        }
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

  async getMyReports(user) {
    if (!user || !user.email) return []
    const userEmail = String(user.email).trim().toLowerCase()
    const ids = [...getMyIds(userEmail), ...getMyIds()]

    let serverMine = null
    if (await probeServer()) {
      try {
        const data = await request(`/reports${toQueryString({ mine: 'true', userEmail })}`)
        if (Array.isArray(data)) {
          serverMine = data.filter((r) => {
            if (r.status === 'merged') return false
            if (r.reporter?.userEmail && String(r.reporter.userEmail).toLowerCase() !== userEmail) {
              return false
            }
            return true
          })
        }
      } catch { /* fall through */ }
    }

    const localReports = getLocalReports()
    const localMine = localReports.filter((r) => {
      if (r.status === 'merged') return false
      if (r.reporter?.userEmail && String(r.reporter.userEmail).toLowerCase() === userEmail) {
        return true
      }
      if (r.reporter?.userId && String(r.reporter.userId).toLowerCase() === userEmail) {
        return true
      }
      return ids.includes(r.id)
    })

    if (serverMine !== null) {
      const map = new Map()
      serverMine.forEach((r) => map.set(r.id, r))
      localMine.forEach((r) => {
        if (!map.has(r.id)) map.set(r.id, r)
      })
      return Array.from(map.values())
    }

    return localMine
  },

  async stats() {
    // Server is the source of truth when reachable (its computeStats also drops
    // merged tombstones); fall back to the local store when offline.
    if (await probeServer()) {
      try {
        const data = await request('/stats')
        if (data && typeof data.total === 'number') return data
      } catch { /* fall through to local */ }
    }
    return computeStats(getLocalReports())
  },

  async login(role, credentials) {
    if (await probeServer()) {
      return request('/auth/login', { method: 'POST', body: JSON.stringify({ role, ...credentials }) })
    }
    throw new Error('offline')
  },

  async register(userData) {
    if (await probeServer()) {
      return request('/auth/register', { method: 'POST', body: JSON.stringify(userData) })
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
  const visible = reports.filter((r) => r.status !== 'merged')
  const byStatus = {}
  const byCategory = {}
  const byDistrict = {}
  let totalVotes = 0
  for (const r of visible) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1
    byCategory[r.category] = (byCategory[r.category] || 0) + 1
    const d = r.location?.district || 'Unknown'
    byDistrict[d] = (byDistrict[d] || 0) + 1
    totalVotes += r.votes || 0
  }
  const resolved = byStatus.resolved || 0
  const total = visible.length
  const collaboration = (byStatus.collaboration || 0) + (byStatus.solution || 0) + (byStatus.pilot || 0)
  const pending = (byStatus.submitted || 0)
  const highPriority = visible.filter((r) => r.priority === 'high' || r.priority === 'critical').length
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
