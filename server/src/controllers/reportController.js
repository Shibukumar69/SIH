import { Report } from '../models/Report.js'
import { applyQuery, computeStats } from '../lib/stats.js'
import { findSimilar, SIMILAR_MERGE, SIMILAR_SUGGEST } from '../lib/similarity.js'
import { dbReady } from '../db.js'

// Helper to check DB readiness
function requireDB(res) {
  if (!dbReady()) {
    res.status(503).json({ error: 'database_unavailable' })
    return false
  }
  return true
}

// Helper to strip Mongo internals
function stripInternal(doc) {
  if (!doc) return doc
  const { _id, __v, ...rest } = doc
  return rest
}

// Helper to check role authorization for updating reports
function authorizePatch(role, patch) {
  if (role === 'government') return true
  if (role === 'university' || role === 'industry') {
    if ('priority' in patch) return false
    const otherPartner = role === 'university' ? 'assignedIndustry' : 'assignedUniversity'
    if (otherPartner in patch) return false
    if (patch.status) {
      const allowed = new Set(['matching', 'collaboration', 'solution', 'pilot', 'resolved'])
      if (!allowed.has(patch.status)) return false
    }
    return true
  }
  return false
}

/**
 * GET /api/reports - List all reports with query filters
 */
export async function listReports(req, res) {
  if (!requireDB(res)) return
  try {
    const query = req.query || {}
    let filter = {}
    if (query.mine === 'true') {
      if (req.user && req.user.email) {
        const userEmail = String(req.user.email).trim().toLowerCase()
        filter['$or'] = [
          { 'reporter.userEmail': userEmail },
          { 'reporter.userId': userEmail },
          { 'reporter.userId': req.user.id },
        ]
      } else {
        return res.json([])
      }
    }
    const all = await Report.find(filter).lean()
    res.json(applyQuery(all, query))
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: err.message })
  }
}

/**
 * POST /api/reports/similar - AI duplicate detection check
 */
export async function checkSimilar(req, res) {
  if (!requireDB(res)) return
  try {
    const body = req.body || {}
    const candidate = {
      category: body.category,
      title: body.title,
      description: body.description,
      location: body.location,
    }
    const pool = await Report.find({
      category: body.category,
      status: { $nin: ['merged', 'rejected'] },
    }).lean()
    const matches = findSimilar(candidate, pool, { min: SIMILAR_SUGGEST, limit: 4 })
    res.json(matches.map((m) => ({ report: stripInternal(m.report), score: m.score })))
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: err.message })
  }
}

/**
 * GET /api/reports/:id - Get a report by ID
 */
export async function getReportById(req, res) {
  if (!requireDB(res)) return
  try {
    const report = await Report.findOne({ id: req.params.id }).lean()
    if (!report) return res.status(404).json({ error: 'not_found' })
    if (report.mergedInto) {
      const canonical = await Report.findOne({ id: report.mergedInto }).lean()
      if (canonical) return res.json({ ...stripInternal(canonical), mergedFrom: report.id })
    }
    res.json(stripInternal(report))
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: err.message })
  }
}

/**
 * POST /api/reports - Submit a new report (with auto duplicate merge)
 */
export async function createReport(req, res) {
  if (!requireDB(res)) return
  try {
    const { allowDuplicate, ...body } = req.body || {}
    if (!body.id) return res.status(400).json({ error: 'missing_id' })
    const now = new Date().toISOString()

    const existing = await Report.findOne({ id: body.id }).lean()
    if (existing) {
      if (existing.mergedInto) {
        const into = await Report.findOne({ id: existing.mergedInto }).lean()
        return res.json({ merged: true, report: stripInternal(existing), into: into ? stripInternal(into) : null })
      }
      return res.json({ merged: false, report: stripInternal(existing) })
    }

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

    const reporterEmail = req.user?.email || body.reporter?.userEmail || body.reporter?.userId || ''
    const reporterId = req.user?.id || req.user?.email || body.reporter?.userId || ''

    const doc = {
      ...body,
      reporter: {
        ...(body.reporter || {}),
        userEmail: reporterEmail || body.reporter?.userEmail || '',
        userId: reporterId || body.reporter?.userId || '',
      },
      pending: false,
      mergedInto: null,
      createdAt: body.createdAt || now,
      updatedAt: now,
      timeline: body.timeline?.length ? body.timeline : [{ status: 'submitted', at: now, note: 'Report received from citizen' }],
    }
    const saved = await Report.findOneAndUpdate({ id: body.id }, { $setOnInsert: doc }, { new: true, upsert: true })
    res.status(201).json({ merged: false, report: saved.toJSON() })
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: err.message })
  }
}

/**
 * POST /api/reports/:id/vote - Add vote support to a report
 */
export async function voteReport(req, res) {
  if (!requireDB(res)) return
  try {
    const saved = await Report.findOneAndUpdate(
      { id: req.params.id },
      { $inc: { votes: 1 }, $set: { updatedAt: new Date().toISOString() } },
      { new: true },
    )
    if (!saved) return res.status(404).json({ error: 'not_found' })
    res.json({ votes: saved.votes })
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: err.message })
  }
}

/**
 * POST /api/reports/:id/reopen - Citizen reopens an unresolved issue
 */
export async function reopenReport(req, res) {
  if (!requireDB(res)) return
  try {
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
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: err.message })
  }
}

/**
 * PATCH /api/reports/:id - Update report status / priority / assignment
 */
export async function updateReportStatus(req, res) {
  if (!requireDB(res)) return
  try {
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
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: err.message })
  }
}

/**
 * GET /api/stats - Compute platform KPI statistics
 */
export async function getStats(_req, res) {
  if (!dbReady()) return res.status(503).json({ error: 'database_unavailable' })
  try {
    const all = await Report.find().lean()
    res.json(computeStats(all))
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: err.message })
  }
}
