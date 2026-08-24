import { Router } from 'express'
import { Report } from '../models/Report.js'
import { applyQuery, computeStats } from '../lib/stats.js'
import { findSimilar, SIMILAR_MERGE, SIMILAR_SUGGEST } from '../lib/similarity.js'
import { requireRole } from '../middleware/auth.js'
import { dbReady } from '../db.js'

const router = Router()

// Guard: if the DB isn't connected, tell the client so it uses its local store.
function requireDB(res) {
  if (!dbReady()) {
    res.status(503).json({ error: 'database_unavailable' })
    return false
  }
  return true
}

// GET /api/reports?category=&district=&status=&sort=top|new
router.get('/', async (req, res) => {
  if (!requireDB(res)) return
  const all = await Report.find().lean()
  res.json(applyQuery(all, req.query)) // applyQuery drops merged tombstones
})

// POST /api/reports/similar  — "is this the same problem someone already reported?"
// Public: citizens use this before submitting, no login required.
router.post('/similar', async (req, res) => {
  if (!requireDB(res)) return
  const body = req.body || {}
  const candidate = {
    category: body.category,
    title: body.title,
    description: body.description,
    location: body.location,
  }
  // Same category is a hard gate, so we only load that slice.
  const pool = await Report.find({
    category: body.category,
    status: { $nin: ['merged', 'rejected'] },
  }).lean()
  const matches = findSimilar(candidate, pool, { min: SIMILAR_SUGGEST, limit: 4 })
  res.json(matches.map((m) => ({ report: stripInternal(m.report), score: m.score })))
})

// GET /api/reports/:id  — resolves merged ids transparently to the canonical one.
router.get('/:id', async (req, res) => {
  if (!requireDB(res)) return
  const report = await Report.findOne({ id: req.params.id }).lean()
  if (!report) return res.status(404).json({ error: 'not_found' })
  if (report.mergedInto) {
    const canonical = await Report.findOne({ id: report.mergedInto }).lean()
    if (canonical) return res.json({ ...stripInternal(canonical), mergedFrom: report.id })
  }
  res.json(stripInternal(report))
})

// POST /api/reports  — create with automatic duplicate detection + merge.
// Idempotent: replaying the same id (offline outbox) is safe.
router.post('/', async (req, res) => {
  if (!requireDB(res)) return
  const { allowDuplicate, ...body } = req.body || {}
  if (!body.id) return res.status(400).json({ error: 'missing_id' })
  const now = new Date().toISOString()

  // Replay-safe: an already-stored id returns its current state unchanged.
  const existing = await Report.findOne({ id: body.id }).lean()
  if (existing) {
    if (existing.mergedInto) {
      const into = await Report.findOne({ id: existing.mergedInto }).lean()
      return res.json({ merged: true, report: stripInternal(existing), into: into ? stripInternal(into) : null })
    }
    return res.json({ merged: false, report: stripInternal(existing) })
  }

  // Cross-user duplicate detection — many voices, one challenge.
  if (!allowDuplicate) {
    const candidate = { category: body.category, title: body.title, description: body.description, location: body.location }
    const pool = await Report.find({ category: body.category, status: { $nin: ['merged', 'rejected'] } }).lean()
    const [best] = findSimilar(candidate, pool, { min: SIMILAR_MERGE, limit: 1 })
    if (best) {
      const target = best.report
      const into = await Report.findOneAndUpdate(
        { id: target.id },
        {
          $inc: { votes: 1 },
          $set: { updatedAt: now },
          $push: { timeline: { status: target.status, at: now, note: 'Another citizen reported the same problem (+1)' } },
        },
        { new: true },
      )
      // Keep a tombstone so the submitter's id still resolves to the canonical one.
      const tombstone = {
        ...body,
        status: 'merged',
        mergedInto: target.id,
        pending: false,
        votes: 0,
        createdAt: body.createdAt || now,
        updatedAt: now,
        timeline: [{ status: 'merged', at: now, note: `Merged into ${target.id}` }],
      }
      await Report.findOneAndUpdate({ id: body.id }, { $setOnInsert: tombstone }, { upsert: true })
      return res.json({ merged: true, report: tombstone, into: into.toJSON() })
    }
  }

  const doc = {
    ...body,
    pending: false,
    mergedInto: null,
    createdAt: body.createdAt || now,
    updatedAt: now,
    timeline: body.timeline?.length ? body.timeline : [{ status: 'submitted', at: now, note: 'Report received from citizen' }],
  }
  const saved = await Report.findOneAndUpdate({ id: body.id }, { $setOnInsert: doc }, { new: true, upsert: true })
  res.status(201).json({ merged: false, report: saved.toJSON() })
})

// POST /api/reports/:id/vote  — "I'm facing this too" (public, anonymous).
router.post('/:id/vote', async (req, res) => {
  if (!requireDB(res)) return
  const saved = await Report.findOneAndUpdate(
    { id: req.params.id },
    { $inc: { votes: 1 }, $set: { updatedAt: new Date().toISOString() } },
    { new: true },
  )
  if (!saved) return res.status(404).json({ error: 'not_found' })
  res.json({ votes: saved.votes })
})

// POST /api/reports/:id/reopen  — citizen says the issue isn't actually fixed.
// Public by design: the person who reported it need not be a logged-in official.
router.post('/:id/reopen', async (req, res) => {
  if (!requireDB(res)) return
  const now = new Date().toISOString()
  const note = (req.body && req.body.note) || 'Reopened by citizen — issue persists'
  const report = await Report.findOne({ id: req.params.id })
  if (!report) return res.status(404).json({ error: 'not_found' })
  report.timeline.push({ status: 'reopened', at: now, note })
  report.status = 'reopened'
  report.priority = 'high'
  report.updatedAt = now
  await report.save()
  res.json(report.toJSON())
})

// Which patch fields each institutional role may change.
function authorizePatch(role, patch) {
  if (role === 'government') return true // verify / route / prioritise / reject — full control
  if (role === 'university' || role === 'industry') {
    if ('priority' in patch) return false // only government sets priority
    const otherPartner = role === 'university' ? 'assignedIndustry' : 'assignedUniversity'
    if (otherPartner in patch) return false // can't assign the other partner
    if (patch.status) {
      const allowed = new Set(['matching', 'collaboration', 'solution', 'pilot', 'resolved'])
      if (!allowed.has(patch.status)) return false // can't verify/reject
    }
    return true
  }
  return false
}

// PATCH /api/reports/:id  — dashboards move a challenge along its lifecycle.
// Requires an institutional session; the role decides which fields are allowed.
router.patch('/:id', requireRole('government', 'university', 'industry'), async (req, res) => {
  if (!requireDB(res)) return
  const patch = req.body || {}
  if (!authorizePatch(req.user.role, patch)) {
    return res.status(403).json({ error: 'forbidden_action', role: req.user.role })
  }
  const report = await Report.findOne({ id: req.params.id })
  if (!report) return res.status(404).json({ error: 'not_found' })

  const now = new Date().toISOString()
  const actor = req.user.name || req.user.role
  if (patch.status && patch.status !== report.status) {
    report.timeline.push({ status: patch.status, at: now, note: patch.note || `Updated by ${actor}` })
  }
  for (const k of ['status', 'priority', 'assignedUniversity', 'assignedIndustry', 'needs']) {
    if (k in patch) report[k] = patch[k]
  }
  report.updatedAt = now
  await report.save()
  res.json(report.toJSON())
})

// Drop Mongo internals from a lean() document (which bypasses toJSON).
function stripInternal(doc) {
  if (!doc) return doc
  const { _id, __v, ...rest } = doc
  return rest
}

export default router

// GET /api/stats — aggregate KPIs for dashboards (excludes merged tombstones).
export const statsHandler = async (_req, res) => {
  if (!dbReady()) return res.status(503).json({ error: 'database_unavailable' })
  const all = await Report.find().lean()
  res.json(computeStats(all))
}
