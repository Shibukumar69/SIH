import { Router } from 'express'
import { Report } from '../models/Report.js'
import { applyQuery, computeStats } from '../lib/stats.js'
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
  res.json(applyQuery(all, req.query))
})

// GET /api/reports/:id
router.get('/:id', async (req, res) => {
  if (!requireDB(res)) return
  const report = await Report.findOne({ id: req.params.id }).lean()
  if (!report) return res.status(404).json({ error: 'not_found' })
  res.json(report)
})

// POST /api/reports  — create (idempotent upsert so offline outbox replays are safe)
router.post('/', async (req, res) => {
  if (!requireDB(res)) return
  const body = req.body || {}
  if (!body.id) return res.status(400).json({ error: 'missing_id' })
  const now = new Date().toISOString()
  const doc = {
    ...body,
    pending: false,
    createdAt: body.createdAt || now,
    updatedAt: now,
    timeline: body.timeline?.length ? body.timeline : [{ status: 'submitted', at: now, note: 'Report received from citizen' }],
  }
  const saved = await Report.findOneAndUpdate({ id: body.id }, { $setOnInsert: doc }, { new: true, upsert: true })
  res.status(201).json(saved.toJSON())
})

// POST /api/reports/:id/vote  — "I'm facing this too"
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

// PATCH /api/reports/:id  — status / priority / partner assignment (dashboards)
router.patch('/:id', async (req, res) => {
  if (!requireDB(res)) return
  const patch = req.body || {}
  const report = await Report.findOne({ id: req.params.id })
  if (!report) return res.status(404).json({ error: 'not_found' })

  const now = new Date().toISOString()
  if (patch.status && patch.status !== report.status) {
    report.timeline.push({ status: patch.status, at: now, note: patch.note || '' })
  }
  for (const k of ['status', 'priority', 'assignedUniversity', 'assignedIndustry', 'needs']) {
    if (k in patch) report[k] = patch[k]
  }
  report.updatedAt = now
  await report.save()
  res.json(report.toJSON())
})

export default router

// GET /api/stats — aggregate KPIs for dashboards
export const statsHandler = async (_req, res) => {
  if (!dbReady()) return res.status(503).json({ error: 'database_unavailable' })
  const all = await Report.find().lean()
  res.json(computeStats(all))
}
